/*
 * 가온길 에듀 자료 접근 선차단기
 *
 * 정적 페이지 본문이 그려진 뒤 권한을 확인하던 기존 방식을 보완한다.
 * 로그인하지 않은 방문자는 자료 본문을 보기 전에 login.html로 이동한다.
 * 실제 세부 권한 확인은 auth.js가 Firebase 설정을 불러온 뒤 처리한다.
 */
(function () {
  "use strict";
  const allowedHosts = {
    "legnanatas-lab.github.io": true,
    "gaonjinhak.firebaseapp.com": true,
    "gaonjinhak.web.app": true,
    "jinhak-materials.pages.dev": true,
    "localhost": true,
    "127.0.0.1": true,
  };
  if (!allowedHosts[location.hostname]) return;
  const fileName = (location.pathname.split("/").pop() || "index.html").toLowerCase();
  if (fileName === "index.html" || fileName === "login.html") return;

  // 출신 고교유형·지역 통계 화면은 대용량 데이터를 초기화한 뒤 auth.js가
  // 실제 권한을 확인한다. 여기서 세션만 보고 즉시 화면을 숨기면, 브라우저의
  // sessionStorage 복원보다 먼저 리디렉션이 실행되어 빈 화면으로 멈출 수 있다.
  // 따라서 해당 화면에서는 선차단을 건너뛰고 auth.js의 비동기 권한 검사를
  // 단일 기준으로 사용한다.
  const deferredAuthPages = {
    "highschool-origin.html": true,
    "highschool-origin-university.html": true,
    "highschool-origin-college.html": true,
  };
  if (deferredAuthPages[fileName]) return;

  let session = null;
  try {
    session = JSON.parse(sessionStorage.getItem("gaongil_session_v1") || "null");
  } catch (e) {}
  if (session && session.id) return;

  // 이동 직전까지 본문이 노출되지 않도록 즉시 숨긴다.
  document.documentElement.style.visibility = "hidden";
  const segments = location.pathname.split("/").filter(Boolean);
  // GitHub Pages의 /jinhak-gaon/ 접두어는 실제 하위 폴더가 아니다.
  // 페이지가 어떤 상대 경로로 이 스크립트를 읽는지만 기준으로 판별한다.
  const scriptSrc = (document.currentScript && document.currentScript.getAttribute("src")) || "";
  const isNestedPage = /^\.\.\//.test(scriptSrc);
  const loginPath = isNestedPage ? "../login.html" : "login.html";
  const relativePath = isNestedPage ? segments.slice(-2).join("/") : fileName;
  const returnTo = relativePath + location.search + location.hash;
  location.replace(loginPath + "?redirect=" + encodeURIComponent(returnTo));
})();
