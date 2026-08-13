const GOOGLE_CALLBACK_HTML = `<!doctype html>
<html lang="ko"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1">
<title>Google 로그인 확인</title><style>html{color-scheme:dark}body{margin:0;min-height:100vh;display:grid;place-items:center;background:#06101d;color:#eef5ff;font-family:system-ui,sans-serif}.box{padding:28px;text-align:center}</style></head>
<body><main class="box"><h1>Google 로그인 확인 중…</h1><p>잠시만 기다려 주세요.</p></main>
<script>
(function(){
  var hash = new URLSearchParams(location.hash.slice(1));
  var token = hash.get("access_token");
  var state = hash.get("state");
  var error = hash.get("error_description") || hash.get("error");
  if (token) {
    sessionStorage.setItem("gaongil_google_access_token", token);
    sessionStorage.setItem("gaongil_google_returned_state", state || "");
    location.replace("/login?google=complete");
    return;
  }
  location.replace("/login?googleError=" + encodeURIComponent(error || "Google 인증 결과를 받지 못했습니다."));
})();
</script></body></html>`;

export default {
  async fetch(request, env) {
    const url = new URL(request.url);
    if (url.pathname === "/__/auth/handler") {
      return new Response(GOOGLE_CALLBACK_HTML, {
        headers: {
          "content-type": "text/html; charset=utf-8",
          "cache-control": "no-store",
          "x-content-type-options": "nosniff",
        },
      });
    }
    return env.ASSETS.fetch(request);
  },
};
