/* 가이드 사이트 공통 편의 기능
   - 코드블록 복사 버튼 (코딩 강의 핵심 편의)
   - 용어 사전 검색창 자동 포커스 + "/" 단축키 + ESC 비우기
   페이지별 인라인 스크립트와 독립적으로 동작합니다. */
(function () {
  "use strict";

  function ready(fn) {
    if (document.readyState === "loading") {
      document.addEventListener("DOMContentLoaded", fn);
    } else {
      fn();
    }
  }

  /* ---------- 코드블록 복사 버튼 ---------- */
  function addCopyButtons() {
    var blocks = document.querySelectorAll("pre.code-block");
    blocks.forEach(function (pre) {
      if (pre.dataset.copyReady) return;
      pre.dataset.copyReady = "1";

      // 버튼을 넣기 전에 코드 텍스트를 먼저 저장 (버튼 텍스트 오염 방지)
      var code = pre.textContent.replace(/\s+$/, "");

      var btn = document.createElement("button");
      btn.type = "button";
      btn.className = "copy-btn";
      btn.setAttribute("aria-label", "코드 복사");
      btn.innerHTML = '<span class="copy-ico" aria-hidden="true"></span><span class="copy-txt">복사</span>';

      btn.addEventListener("click", function () {
        copyText(code).then(function (ok) {
          setState(btn, ok ? "done" : "fail");
        });
      });

      pre.appendChild(btn);
    });
  }

  function setState(btn, state) {
    var txt = btn.querySelector(".copy-txt");
    btn.classList.remove("copied", "failed");
    if (state === "done") {
      btn.classList.add("copied");
      if (txt) txt.textContent = "복사됨";
    } else {
      btn.classList.add("failed");
      if (txt) txt.textContent = "실패";
    }
    clearTimeout(btn._t);
    btn._t = setTimeout(function () {
      btn.classList.remove("copied", "failed");
      if (txt) txt.textContent = "복사";
    }, 1600);
  }

  function copyText(text) {
    if (navigator.clipboard && navigator.clipboard.writeText) {
      return navigator.clipboard.writeText(text).then(
        function () { return true; },
        function () { return fallbackCopy(text); }
      );
    }
    return Promise.resolve(fallbackCopy(text));
  }

  function fallbackCopy(text) {
    try {
      var ta = document.createElement("textarea");
      ta.value = text;
      ta.setAttribute("readonly", "");
      ta.style.position = "fixed";
      ta.style.top = "-1000px";
      document.body.appendChild(ta);
      ta.select();
      var ok = document.execCommand("copy");
      document.body.removeChild(ta);
      return ok;
    } catch (e) {
      return false;
    }
  }

  /* ---------- 용어 사전 검색 편의 ---------- */
  function glossaryEnhance() {
    var inp = document.getElementById("gsearch");
    if (!inp) return;
    // 데스크톱에서만 자동 포커스 (모바일 키보드 튀어오름 방지)
    if (window.matchMedia && window.matchMedia("(min-width:760px)").matches) {
      inp.focus();
    }
    document.addEventListener("keydown", function (e) {
      if (e.key === "/" && document.activeElement !== inp) {
        e.preventDefault();
        inp.focus();
        inp.select();
      } else if (e.key === "Escape" && document.activeElement === inp) {
        inp.value = "";
        inp.dispatchEvent(new Event("input", { bubbles: true }));
        inp.blur();
      }
    });
  }

  /* ---------- 진도 체크 + 진행률 ---------- */
  function loadSet(key) {
    try {
      var raw = localStorage.getItem(key);
      return new Set(raw ? JSON.parse(raw) : []);
    } catch (e) { return new Set(); }
  }
  function saveSet(key, set) {
    try { localStorage.setItem(key, JSON.stringify(Array.from(set))); } catch (e) {}
  }
  function setDoneBtn(btn, on) {
    btn.classList.toggle("on", on);
    btn.setAttribute("aria-pressed", on ? "true" : "false");
    var t = btn.querySelector(".db-txt");
    if (t) t.textContent = on ? "완료함" : "완료 표시";
  }

  function progressEnhance() {
    var sb = document.getElementById("sidebar");
    var secs = document.querySelectorAll("main section.sec[id]");
    if (!sb || !secs.length) return;

    var pageKey = "guide:done:" + (location.pathname.split("/").pop() || "index");
    var done = loadSet(pageKey);

    // 진행률 박스 (사이드바 로고 아래)
    var box = document.createElement("div");
    box.className = "prog-box";
    box.innerHTML =
      '<div class="prog-row"><span class="prog-label">학습 진행</span><span class="prog-count"></span></div>' +
      '<div class="prog-track"><div class="prog-fill"></div></div>';
    var logo = sb.querySelector(".logo");
    if (logo && logo.parentNode) logo.parentNode.insertBefore(box, logo.nextSibling);
    else sb.insertBefore(box, sb.firstChild);
    var fill = box.querySelector(".prog-fill");
    var count = box.querySelector(".prog-count");

    function navLinkFor(id) {
      return sb.querySelector('.nav-link[href="#' + id + '"]');
    }
    function syncNav() {
      secs.forEach(function (sec) {
        var l = navLinkFor(sec.id);
        if (l) l.classList.toggle("done", done.has(sec.id));
      });
    }
    function updateBar() {
      var n = 0;
      secs.forEach(function (s) { if (done.has(s.id)) n++; });
      var total = secs.length;
      var pct = total ? Math.round(n / total * 100) : 0;
      fill.style.width = pct + "%";
      count.textContent = n === total ? "전체 완료 🎉" : n + " / " + total;
      box.classList.toggle("complete", n === total && total > 0);
    }

    // 각 섹션 제목에 완료 토글 버튼
    secs.forEach(function (sec) {
      var h2 = sec.querySelector("h2");
      if (!h2) return;
      var btn = document.createElement("button");
      btn.type = "button";
      btn.className = "done-btn";
      btn.innerHTML = '<span class="db-ico" aria-hidden="true"></span><span class="db-txt"></span>';
      setDoneBtn(btn, done.has(sec.id));
      btn.addEventListener("click", function () {
        if (done.has(sec.id)) done.delete(sec.id); else done.add(sec.id);
        saveSet(pageKey, done);
        setDoneBtn(btn, done.has(sec.id));
        syncNav();
        updateBar();
      });
      h2.appendChild(btn);
    });

    syncNav();
    updateBar();
  }

  /* ---------- 통합 검색 (Ctrl/Cmd+K) ---------- */
  var SEARCH_INDEX = [
    // 블렌더
    { f: "beginner.html", c: "블렌더", cls: "s-bl", lv: "입문", t: "블렌더 입문", k: "설치 화면구성 카메라 오브젝트 복제 메시 편집 모디파이어 재질 색상 UV 텍스처 FBX 내보내기 단축키" },
    { f: "intermediate.html", c: "블렌더", cls: "s-bl", lv: "중급", t: "블렌더 중급", k: "메시 구조 스컬프트 커브 파이프 케이블 셰이더 노드 베이킹 조명 렌더링 리깅 웨이트 애니메이션 씬정리 애드온" },
    { f: "advanced.html", c: "블렌더", cls: "s-bl", lv: "고급", t: "블렌더 고급", k: "파티클 물리 유체 시뮬레이션 cycles 컴포지터 eevee geometry nodes 지오메트리 노드 프로시저럴 python 자동화 스킬 이펙트 메시" },
    { f: "master.html", c: "블렌더", cls: "s-bl", lv: "초고급", t: "블렌더 초고급", k: "osl 셰이더 코딩 bsdf 재질 라이브러리 렌더팜 배치 vfx 파이프라인 alembic usd 리토폴로지 nurbs 서피스 천 시뮬 커스텀 애드온" },
    { f: "expert.html", c: "블렌더", cls: "s-bl", lv: "전문가", t: "블렌더 전문가", k: "프로덕션 파이프라인 설계 대규모 씬 노드그룹 에셋 배포 시뮬레이션 캐시 애드온 아키텍처 셰이더 디버깅 색 관리 agx aces 협업 납품 포트폴리오" },
    // Luau
    { f: "lua-beginner.html", c: "Luau", cls: "s-lu", lv: "초급", t: "Luau 초급", k: "스크립트 변수 연산자 조건문 if 반복문 for while 함수 print 파트 조작 에러 디버깅 자동문 touched 치트시트" },
    { f: "lua-intermediate.html", c: "Luau", cls: "s-lu", lv: "중급", t: "Luau 중급", k: "테이블 인스턴스 이벤트 플레이어 캐릭터 클라이언트 서버 remoteevent gui tweenservice 서비스 코인 줍기 게임" },
    { f: "lua-advanced.html", c: "Luau", cls: "s-lu", lv: "고급", t: "Luau 고급", k: "modulescript 모듈 oop 메타테이블 datastore 저장 cframe raycast 태그 attribute 애니메이션 재생 디버깅 메모리 상점 시스템" },
    { f: "lua-master.html", c: "Luau", cls: "s-lu", lv: "초고급", t: "Luau 초고급", k: "게임 아키텍처 타입 체킹 strict 네트워킹 최적화 안티 익스플로잇 보안 프로파일링 병렬 actor 메모리 gc buffer 직렬화 테스트 rojo wally" },
    { f: "lua-expert.html", c: "Luau", cls: "s-lu", lv: "전문가", t: "Luau 전문가", k: "데이터 지향 ecs 커스텀 리플리케이션 서버 권위 히트 검증 대규모 데이터 open cloud 텔레메트리 ab 테스트 라이브 운영 luau 내부 코드 리뷰" },
    // Studio
    { f: "studio-beginner.html", c: "Studio", cls: "s-st", lv: "초급", t: "Studio 초급", k: "설치 카메라 파트 속성 explorer 지형 에디터 toolbox 플러그인 머티리얼 색 테스트 퍼블리시 단축키" },
    { f: "studio-intermediate.html", c: "Studio", cls: "s-st", lv: "중급", t: "Studio 중급", k: "맵 설계 지형 심화 건축 기법 에셋 임포트 surfaceappearance 소품 배치 조명 atmosphere 물 특수 지형 사운드 스카이박스" },
    { f: "studio-advanced.html", c: "Studio", cls: "s-st", lv: "고급", t: "Studio 고급", k: "대형 맵 streamingenabled 스트리밍 파트 수 최적화 렌더 최적화 충돌 물리 패키지 테마 연출 이펙트 메시 모바일 체크리스트" },
    { f: "studio-master.html", c: "Studio", cls: "s-st", lv: "초고급", t: "Studio 초고급", k: "모듈러 키트 라이팅 마스터링 지형 스컬프팅 환경 스토리텔링 컬러 스크립트 수직 레벨 디자인 동선 페이싱 사운드스케이프 시즌 변형 맵 리뷰" },
    { f: "studio-expert.html", c: "Studio", cls: "s-st", lv: "전문가", t: "Studio 전문가", k: "아트 디렉션 퍼포먼스 버짓 초대형 월드 에셋 파이프라인 team create 협업 접근성 ux 데이터 개선 라이브 맵 운영 외주 커미션 포트폴리오" },
    // 기타
    { f: "glossary.html", c: "참고", cls: "s-cm", lv: "사전", t: "용어 사전", k: "용어 메시 버텍스 폴리곤 텍스처 uv 머티리얼 렌더링 셰이더 luau datastore cframe 퍼블리시 검색" },
    { f: "index.html", c: "참고", cls: "s-cm", lv: "홈", t: "메인 허브", k: "홈 메인 가이드 허브 코스 목록" }
  ];

  function searchInit() {
    var here = location.pathname.split("/").pop() || "index.html";

    var ov = document.createElement("div");
    ov.className = "gsm-overlay";
    ov.innerHTML =
      '<div class="gsm-box" role="dialog" aria-label="사이트 검색">' +
      '<div class="gsm-bar"><span class="gsm-sico" aria-hidden="true"></span>' +
      '<input class="gsm-input" type="text" placeholder="검색…  예: 변수, 최적화, UV" aria-label="검색" autocomplete="off" spellcheck="false"></div>' +
      '<div class="gsm-results"></div>' +
      '</div>';
    document.body.appendChild(ov);

    var inp = ov.querySelector(".gsm-input");
    var res = ov.querySelector(".gsm-results");
    var open = false, items = [], active = -1;

    function render(q) {
      q = q.trim().toLowerCase();
      var list = SEARCH_INDEX.filter(function (e) {
        if (e.f === here) return false; // 현재 페이지는 제외
        if (!q) return true;
        var hay = (e.t + " " + e.c + " " + e.lv + " " + e.k).toLowerCase();
        return q.split(/\s+/).every(function (w) { return hay.indexOf(w) > -1; });
      });
      res.innerHTML = "";
      if (!list.length) {
        res.innerHTML = '<div class="gsm-empty">검색 결과가 없습니다.</div>';
        items = []; active = -1; return;
      }
      list.forEach(function (e, i) {
        var a = document.createElement("a");
        a.href = e.f;
        a.className = "gsm-item";
        a.innerHTML =
          '<span class="gsm-badge ' + e.cls + '">' + e.c + "</span>" +
          '<span class="gsm-t">' + e.t + "</span>" +
          '<span class="gsm-lv">' + e.lv + "</span>" +
          '<span class="gsm-arrow" aria-hidden="true">↵</span>';
        a.addEventListener("mouseenter", function () { setActive(i); });
        res.appendChild(a);
      });
      items = [].slice.call(res.querySelectorAll(".gsm-item"));
      setActive(0);
    }
    function setActive(i) {
      if (!items.length) return;
      active = (i + items.length) % items.length;
      items.forEach(function (el, j) { el.classList.toggle("active", j === active); });
      items[active].scrollIntoView({ block: "nearest" });
    }
    function show() {
      if (open) return;
      open = true;
      ov.classList.add("show");
      inp.value = "";
      render("");
      setTimeout(function () { inp.focus(); }, 30);
    }
    function hide() { open = false; ov.classList.remove("show"); }

    inp.addEventListener("input", function () { render(inp.value); });
    ov.addEventListener("click", function (e) { if (e.target === ov) hide(); });
    inp.addEventListener("keydown", function (e) {
      if (e.key === "ArrowDown") { e.preventDefault(); setActive(active + 1); }
      else if (e.key === "ArrowUp") { e.preventDefault(); setActive(active - 1); }
      else if (e.key === "Enter") { e.preventDefault(); if (items[active]) items[active].click(); }
      else if (e.key === "Escape") { e.preventDefault(); hide(); }
    });
    document.addEventListener("keydown", function (e) {
      if ((e.ctrlKey || e.metaKey) && (e.key === "k" || e.key === "K")) {
        e.preventDefault();
        open ? hide() : show();
      }
    });

    // 사이드바가 있는 페이지엔 검색 버튼 삽입
    var sb = document.getElementById("sidebar");
    if (sb) {
      var home = sb.querySelector(".logo-home");
      var sbtn = document.createElement("button");
      sbtn.type = "button";
      sbtn.className = "gs-search-btn";
      sbtn.innerHTML = '<span class="gss-ico" aria-hidden="true"></span><span>검색</span><kbd class="gss-k">Ctrl K</kbd>';
      sbtn.addEventListener("click", show);
      if (home && home.parentNode) home.parentNode.insertBefore(sbtn, home);
      else sb.insertBefore(sbtn, sb.firstChild);
    }
  }

  ready(function () {
    addCopyButtons();
    glossaryEnhance();
    progressEnhance();
    searchInit();
  });
})();
