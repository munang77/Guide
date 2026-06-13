/* ============================================================
   가이드 도우미 채팅 위젯
   사용법: 각 페이지 </body> 직전에 아래 한 줄 추가
     <script src="assistant.js"></script>
   배포 후 PROXY_URL 을 본인 Cloudflare Workers 주소로 바꾸세요.
   ============================================================ */
(function () {
  // ↓↓↓ 배포 후 여기를 본인 Worker 주소로 교체 ↓↓↓
  var PROXY_URL = "https://YOUR-WORKER.workers.dev";
  // ↑↑↑ 예: https://guide-helper.munang77.workers.dev ↑↑↑

  // 페이지 주제 자동 감지 (첫 인사말 맞춤용)
  var path = location.pathname.toLowerCase();
  var topic = "블렌더·Luau·Studio";
  if (path.indexOf("lua-") > -1) topic = "Luau 스크립트";
  else if (path.indexOf("studio-") > -1) topic = "Roblox Studio 맵 제작";
  else if (/(beginner|intermediate|advanced|master|expert)\.html/.test(path) && path.indexOf("studio") < 0 && path.indexOf("lua") < 0) topic = "블렌더";

  var messages = [];     // 대화 기록 (role/content)
  var busy = false;

  // ---------- 스타일 ----------
  var css = `
  #ga-fab{position:fixed;right:20px;bottom:20px;z-index:9998;width:56px;height:56px;border-radius:50%;border:none;cursor:pointer;
    background:linear-gradient(135deg,#ffa45c,#f5792a);color:#131316;font-size:24px;font-weight:900;
    box-shadow:0 8px 24px rgba(245,121,42,.4);transition:transform .18s,box-shadow .18s;display:grid;place-items:center}
  #ga-fab:hover{transform:translateY(-3px) scale(1.04);box-shadow:0 12px 30px rgba(245,121,42,.5)}
  #ga-fab.open{background:linear-gradient(135deg,#3a3a46,#26262e);color:#ececf1}
  #ga-panel{position:fixed;right:20px;bottom:88px;z-index:9998;width:min(380px,calc(100vw - 32px));height:min(560px,calc(100vh - 130px));
    background:#1c1c22;border:1px solid #2d2d37;border-radius:18px;box-shadow:0 20px 60px rgba(0,0,0,.5);
    display:none;flex-direction:column;overflow:hidden;font-family:"Pretendard Variable",Pretendard,-apple-system,sans-serif}
  #ga-panel.show{display:flex;animation:ga-up .22s ease both}
  @keyframes ga-up{from{opacity:0;transform:translateY(14px)}to{opacity:1;transform:translateY(0)}}
  .ga-head{padding:15px 18px;border-bottom:1px solid #26262e;display:flex;align-items:center;gap:10px;flex:none}
  .ga-head .ga-dot{width:9px;height:9px;border-radius:50%;background:#5ad08a;box-shadow:0 0 8px #5ad08a;flex:none}
  .ga-head b{font-size:14.5px;color:#ececf1;letter-spacing:-.02em}
  .ga-head span{font-size:11.5px;color:#8b8b98;margin-left:auto}
  .ga-body{flex:1;overflow-y:auto;padding:16px;display:flex;flex-direction:column;gap:12px}
  .ga-body::-webkit-scrollbar{width:8px}.ga-body::-webkit-scrollbar-thumb{background:#33333d;border-radius:99px}
  .ga-msg{max-width:85%;padding:10px 13px;border-radius:13px;font-size:13.5px;line-height:1.65;white-space:pre-wrap;word-break:break-word}
  .ga-msg.bot{align-self:flex-start;background:#26262e;color:#ececf1;border-bottom-left-radius:4px}
  .ga-msg.me{align-self:flex-end;background:linear-gradient(135deg,#ffa45c,#f5792a);color:#131316;border-bottom-right-radius:4px;font-weight:500}
  .ga-msg code{background:rgba(0,0,0,.28);padding:1px 5px;border-radius:5px;font-family:ui-monospace,Consolas,monospace;font-size:12px}
  .ga-msg.me code{background:rgba(0,0,0,.18)}
  .ga-typing{align-self:flex-start;display:flex;gap:4px;padding:12px 14px;background:#26262e;border-radius:13px;border-bottom-left-radius:4px}
  .ga-typing i{width:7px;height:7px;border-radius:50%;background:#8b8b98;animation:ga-blink 1.2s infinite both}
  .ga-typing i:nth-child(2){animation-delay:.2s}.ga-typing i:nth-child(3){animation-delay:.4s}
  @keyframes ga-blink{0%,80%,100%{opacity:.3}40%{opacity:1}}
  .ga-foot{padding:12px;border-top:1px solid #26262e;flex:none}
  .ga-inrow{display:flex;gap:8px;align-items:flex-end}
  .ga-foot textarea{flex:1;resize:none;background:#131316;border:1px solid #2d2d37;border-radius:11px;color:#ececf1;
    font-family:inherit;font-size:13.5px;padding:10px 12px;max-height:90px;outline:none;line-height:1.5}
  .ga-foot textarea:focus{border-color:#f5792a}
  .ga-send{flex:none;width:40px;height:40px;border-radius:11px;border:none;cursor:pointer;
    background:linear-gradient(135deg,#ffa45c,#f5792a);color:#131316;font-size:17px;font-weight:900;transition:opacity .15s}
  .ga-send:disabled{opacity:.4;cursor:default}
  .ga-hint{font-size:10.5px;color:#8b8b98;text-align:center;margin-top:7px}
  @media(prefers-reduced-motion:reduce){#ga-panel.show,#ga-fab{animation:none;transition:none}}
  `;
  var style = document.createElement("style");
  style.textContent = css;
  document.head.appendChild(style);

  // ---------- DOM ----------
  var fab = document.createElement("button");
  fab.id = "ga-fab";
  fab.setAttribute("aria-label", "도우미 열기");
  fab.innerHTML = "?";

  var panel = document.createElement("div");
  panel.id = "ga-panel";
  panel.innerHTML =
    '<div class="ga-head"><span class="ga-dot"></span><b>가이드 도우미</b><span>' + topic + '</span></div>' +
    '<div class="ga-body" id="ga-body"></div>' +
    '<div class="ga-foot"><div class="ga-inrow">' +
    '<textarea id="ga-in" rows="1" placeholder="모르는 걸 물어보세요..."></textarea>' +
    '<button class="ga-send" id="ga-send" aria-label="보내기">&#8593;</button>' +
    '</div><div class="ga-hint">Enter 전송 · Shift+Enter 줄바꿈</div></div>';

  document.body.appendChild(fab);
  document.body.appendChild(panel);

  var body = panel.querySelector("#ga-body");
  var input = panel.querySelector("#ga-in");
  var sendBtn = panel.querySelector("#ga-send");

  // ---------- 렌더링 ----------
  function esc(s) {
    return s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
  }
  // `code` 와 ```block``` 만 가볍게 변환
  function fmt(s) {
    s = esc(s);
    s = s.replace(/```([\s\S]*?)```/g, function (_, c) {
      return '<code style="display:block;padding:8px;margin:4px 0;white-space:pre-wrap">' + c.trim() + "</code>";
    });
    s = s.replace(/`([^`\n]+)`/g, "<code>$1</code>");
    return s;
  }
  function addMsg(text, who) {
    var d = document.createElement("div");
    d.className = "ga-msg " + who;
    d.innerHTML = who === "bot" ? fmt(text) : esc(text);
    body.appendChild(d);
    body.scrollTop = body.scrollHeight;
    return d;
  }
  function showTyping() {
    var t = document.createElement("div");
    t.className = "ga-typing";
    t.id = "ga-typing";
    t.innerHTML = "<i></i><i></i><i></i>";
    body.appendChild(t);
    body.scrollTop = body.scrollHeight;
  }
  function hideTyping() {
    var t = document.getElementById("ga-typing");
    if (t) t.remove();
  }

  // ---------- 전송 ----------
  function send() {
    var text = input.value.trim();
    if (!text || busy) return;

    if (PROXY_URL.indexOf("YOUR-WORKER") > -1) {
      addMsg("아직 서버 주소가 설정되지 않았어요. assistant.js 파일의 PROXY_URL을 본인 Cloudflare Workers 주소로 바꿔주세요.", "bot");
      input.value = "";
      return;
    }

    addMsg(text, "me");
    messages.push({ role: "user", content: text });
    input.value = "";
    input.style.height = "auto";
    busy = true;
    sendBtn.disabled = true;
    showTyping();

    fetch(PROXY_URL, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ messages: messages }),
    })
      .then(function (r) { return r.json(); })
      .then(function (data) {
        hideTyping();
        if (data.reply) {
          addMsg(data.reply, "bot");
          messages.push({ role: "assistant", content: data.reply });
        } else {
          addMsg(data.error || "응답을 받지 못했어요. 잠시 후 다시 시도해 주세요.", "bot");
        }
      })
      .catch(function () {
        hideTyping();
        addMsg("연결에 문제가 있어요. 인터넷 상태를 확인하고 다시 시도해 주세요.", "bot");
      })
      .finally(function () {
        busy = false;
        sendBtn.disabled = false;
        input.focus();
      });
  }

  // ---------- 이벤트 ----------
  var opened = false;
  fab.addEventListener("click", function () {
    opened = !opened;
    panel.classList.toggle("show", opened);
    fab.classList.toggle("open", opened);
    fab.innerHTML = opened ? "&#10005;" : "?";
    fab.setAttribute("aria-label", opened ? "도우미 닫기" : "도우미 열기");
    if (opened) {
      if (body.children.length === 0) {
        addMsg(topic + " 관련해서 궁금한 걸 물어보세요. 용어 뜻, 막히는 부분, 코드 등 무엇이든 도와드릴게요.", "bot");
      }
      setTimeout(function () { input.focus(); }, 100);
    }
  });

  input.addEventListener("keydown", function (e) {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      send();
    }
  });
  input.addEventListener("input", function () {
    input.style.height = "auto";
    input.style.height = Math.min(input.scrollHeight, 90) + "px";
  });
  sendBtn.addEventListener("click", send);
})();
