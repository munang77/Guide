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

  ready(function () {
    addCopyButtons();
    glossaryEnhance();
  });
})();
