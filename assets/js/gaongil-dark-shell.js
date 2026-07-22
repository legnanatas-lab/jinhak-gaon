/* ============================================================
   가온길 에듀 — 전역 다크 리테마 스크립트
   페이지마다 남아있는 밝은(백색/연파스텔) 배경 요소를 감지해
   가온길 다크 팔레트로 통일하고, 대비가 깨지는 글자색도 같이
   보정합니다. 배지/버튼/아이콘처럼 작은 강조 요소는 건드리지
   않습니다.
   ============================================================ */
(function () {
  "use strict";

  var DARK_A = "#111f34";
  var DARK_B = "#0d1626";
  var LIGHT_TEXT = "#e9eff8";
  var LIGHT_TEXT_MUTED = "#b9c4d2";

  var SKIP_TAGS = { BUTTON: 1, INPUT: 1, SELECT: 1, TEXTAREA: 1, SVG: 1, PATH: 1, IMG: 1, CANVAS: 1, IFRAME: 1, VIDEO: 1 };
  var SKIP_CLASS_RE = /badge|chip|tag-|pill|btn|button|icon|avatar|swatch|dot\b|toast|logo|kbd/i;

  function parseColor(str) {
    if (!str) return null;
    var m = str.match(/rgba?\(\s*(\d+),\s*(\d+),\s*(\d+)(?:,\s*([\d.]+))?\s*\)/);
    if (!m) return null;
    return { r: +m[1], g: +m[2], b: +m[3], a: m[4] !== undefined ? +m[4] : 1 };
  }

  function luminance(c) {
    return 0.299 * c.r + 0.587 * c.g + 0.114 * c.b;
  }

  function isSmall(el) {
    var r = el.getBoundingClientRect();
    return r.width > 0 && r.height > 0 && r.width < 140 && r.height < 46;
  }

  function shouldSkip(el) {
    if (!el || el.nodeType !== 1) return true;
    if (SKIP_TAGS[el.tagName]) return true;
    var cls = el.className;
    if (cls && typeof cls === "string" && SKIP_CLASS_RE.test(cls)) return true;
    if (el.closest && el.closest("[data-gaongil-no-retheme]")) return true;
    return false;
  }

  var depthToggle = 0;

  function darkenElement(el) {
    var alt = depthToggle++ % 3 === 0;
    el.style.setProperty("background-color", alt ? DARK_B : DARK_A, "important");
    var bgImage = getComputedStyle(el).backgroundImage;
    if (bgImage && bgImage !== "none" && /rgb\(2[0-5]\d, ?2[0-5]\d, ?2[0-5]\d\)|#fff|white/i.test(bgImage)) {
      el.style.setProperty("background-image", "none", "important");
    }
    el.setAttribute("data-gaongil-dark", "1");
  }

  function fixOwnText(el) {
    var cs = getComputedStyle(el);
    var col = parseColor(cs.color);
    if (col && luminance(col) < 120) {
      el.style.setProperty("color", LIGHT_TEXT, "important");
    }
  }

  function fixTransparentDescendantText(root) {
    var kids = root.querySelectorAll("*");
    for (var i = 0; i < kids.length; i++) {
      var k = kids[i];
      if (shouldSkip(k)) continue;
      if (k.hasAttribute("data-gaongil-dark")) continue;
      var kcs = getComputedStyle(k);
      var kbg = parseColor(kcs.backgroundColor);
      if (kbg && kbg.a > 0.12) continue;
      var kcol = parseColor(kcs.color);
      if (kcol && luminance(kcol) < 120) {
        k.style.setProperty(
          "color",
          k.tagName === "SMALL" || /muted|sub|desc|caption/i.test(k.className || "") ? LIGHT_TEXT_MUTED : LIGHT_TEXT,
          "important"
        );
      }
      var bcol = parseColor(kcs.borderColor);
      if (bcol && luminance(bcol) > 210) {
        k.style.setProperty("border-color", "rgba(214,173,99,.25)", "important");
      }
    }
  }

  function walk(el) {
    if (shouldSkip(el)) return;
    var cs = getComputedStyle(el);
    var bg = parseColor(cs.backgroundColor);
    if (bg && bg.a > 0.15 && luminance(bg) > 205 && !isSmall(el)) {
      darkenElement(el);
      fixOwnText(el);
      fixTransparentDescendantText(el);
    }
    var children = el.children;
    for (var i = 0; i < children.length; i++) walk(children[i]);
  }

  function run() {
    try {
      walk(document.body);
    } catch (e) {}
  }

  if (document.readyState === "complete") {
    run();
  } else {
    window.addEventListener("load", run);
  }
  setTimeout(run, 500);
  setTimeout(run, 1400);

  try {
    var mo = new MutationObserver(function () {
      clearTimeout(window.__ggRethemeTimer);
      window.__ggRethemeTimer = setTimeout(run, 250);
    });
    window.addEventListener("load", function () {
      mo.observe(document.body, { childList: true, subtree: true });
    });
  } catch (e) {}
})();
