// Firebase Authentication helper reverse proxy.
// Firebase Web SDK uses /__/auth/handler and /__/auth/iframe for Google login.
// Keeping these endpoints on the same Pages domain avoids Safari's cross-site
// storage restriction while the Firebase project continues to own the handler.
export async function onRequest(context) {
  const incoming = new URL(context.request.url);
  const firebaseHelperUrl = new URL(
    `https://gaonjinhak.firebaseapp.com${incoming.pathname}${incoming.search}`
  );

  return fetch(new Request(firebaseHelperUrl, context.request));
}
