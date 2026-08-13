// Firebase Auth의 리디렉션 보조 페이지를 가온길과 같은 도메인에서 제공합니다.
// Safari 등의 교차 사이트 저장소 제한으로 Google 로그인 후 빈 페이지에 머무는
// 문제를 막기 위해 /__/auth/* 요청만 Firebase Hosting으로 안전하게 프록시합니다.
export default {
  async fetch(request, env) {
    const url = new URL(request.url);

    if (url.pathname.startsWith("/__/auth/")) {
      const authUrl = new URL(url.pathname + url.search, "https://gaonjinhak.firebaseapp.com");
      const headers = new Headers(request.headers);
      headers.delete("host");
      return fetch(authUrl, {
        method: request.method,
        headers,
        body: request.method === "GET" || request.method === "HEAD" ? undefined : request.body,
        redirect: "manual",
      });
    }

    return env.ASSETS.fetch(request);
  },
};
