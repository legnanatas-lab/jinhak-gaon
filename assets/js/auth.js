/* ============================================================
   가온길 에듀 · 가온길 입시전략연구소
   Auth / Session / Admin User Store (client-side demo)

   주의: 이 스크립트는 브라우저(localStorage)에 계정 정보를 저장하는
   "정적 호스팅용 데모" 인증입니다. 브라우저/기기마다 저장소가 분리되고
   서버 검증이 없으므로, 실제 운영(여러 관리자·여러 기기 공유, 강력한
   보안이 필요한 경우)에는 서버(DB) 기반 로그인으로 교체를 권장합니다.
   ============================================================ */

(function (global) {
  const USERS_KEY = "gaongil_users_v2";
  const SESSION_KEY = "gaongil_session_v1";
  const ACCESS_KEY = "gaongil_access_v1";
  const DEFAULT_ADMIN_ID = "admin";
  const DEFAULT_ADMIN_PASSWORD = "9980";
  const LEGACY_ADMIN_PASSWORD = "0000";

  function simpleHash(text) {
    // crypto.subtle 이 없는 환경(구형 브라우저, 일부 file:// 실행 등)을 위한 대체 해시.
    let h1 = 0xdeadbeef, h2 = 0x41c6ce57;
    for (let i = 0; i < text.length; i++) {
      const ch = text.charCodeAt(i);
      h1 = Math.imul(h1 ^ ch, 2654435761);
      h2 = Math.imul(h2 ^ ch, 1597334677);
    }
    h1 = Math.imul(h1 ^ (h1 >>> 16), 2246822507) ^ Math.imul(h2 ^ (h2 >>> 13), 3266489909);
    h2 = Math.imul(h2 ^ (h2 >>> 16), 2246822507) ^ Math.imul(h1 ^ (h1 >>> 13), 3266489909);
    return "fb-" + (h1 >>> 0).toString(16) + (h2 >>> 0).toString(16);
  }

  async function sha256(text) {
    try {
      if (!crypto || !crypto.subtle || !crypto.subtle.digest) throw new Error("no subtle");
      const buf = await crypto.subtle.digest("SHA-256", new TextEncoder().encode(text));
      return Array.from(new Uint8Array(buf)).map((b) => b.toString(16).padStart(2, "0")).join("");
    } catch (e) {
      return simpleHash(text);
    }
  }

  function loadUsers() {
    try {
      const raw = localStorage.getItem(USERS_KEY);
      if (raw) return JSON.parse(raw);
    } catch (e) {}
    return null;
  }

  function saveUsers(users) {
    localStorage.setItem(USERS_KEY, JSON.stringify(users));
  }

  function normalizeId(id) {
    return String(id || "").trim();
  }

  function normalizeEmail(email) {
    return String(email || "").trim().toLowerCase();
  }

  function normalizePageKey(value) {
    let raw = String(value || "").trim();
    if (!raw || raw === "#") return "";
    if (/^(mailto:|tel:|javascript:)/i.test(raw)) return "";
    try {
      if (/^(https?:)?\/\//i.test(raw)) {
        const url = new URL(raw, location.href);
        if (url.origin !== location.origin) return "";
        raw = url.pathname + url.search;
      }
    } catch (e) {}
    raw = raw.split("#")[0].replace(/\\/g, "/");
    const queryIndex = raw.indexOf("?");
    const query = queryIndex >= 0 ? raw.slice(queryIndex + 1) : "";
    let pathname = queryIndex >= 0 ? raw.slice(0, queryIndex) : raw;
    pathname = pathname.replace(/^\.\//, "").replace(/^\//, "");
    const parts = pathname.split("/").filter(Boolean);
    const repoIndex = parts.lastIndexOf("jinhak-gaon");
    if (repoIndex >= 0) parts.splice(0, repoIndex + 1);
    let file = parts.pop() || "index.html";
    if (!file.includes(".")) file = file || "index.html";
    const parent = parts[parts.length - 1] || "";
    let key = file === "index.html" && parent ? parent + "/" + file : file;
    if (key === "section.html") {
      const page = new URLSearchParams(query).get("page");
      if (page) key = normalizePageKey(page);
    }
    return key || "index.html";
  }

  function currentPageKey() {
    return normalizePageKey(location.pathname + location.search) || "index.html";
  }

  function defaultAccess() {
    return { publicPages: ["index.html"], userPages: {} };
  }

  function loadAccess() {
    try {
      const raw = localStorage.getItem(ACCESS_KEY);
      const parsed = raw ? JSON.parse(raw) : null;
      const base = defaultAccess();
      if (!parsed || typeof parsed !== "object") return base;
      const publicPages = Array.isArray(parsed.publicPages) ? parsed.publicPages.map(normalizePageKey).filter(Boolean) : [];
      const userPages = {};
      Object.entries(parsed.userPages || {}).forEach(([id, pages]) => {
        if (Array.isArray(pages)) userPages[normalizeId(id)] = pages.map(normalizePageKey).filter(Boolean);
      });
      return { publicPages: Array.from(new Set([...base.publicPages, ...publicPages])), userPages };
    } catch (e) {
      return defaultAccess();
    }
  }

  function saveAccess(access) {
    const base = defaultAccess();
    const publicPages = Array.isArray(access?.publicPages) ? access.publicPages.map(normalizePageKey).filter(Boolean) : [];
    const userPages = {};
    Object.entries(access?.userPages || {}).forEach(([id, pages]) => {
      if (Array.isArray(pages)) userPages[normalizeId(id)] = Array.from(new Set(pages.map(normalizePageKey).filter(Boolean)));
    });
    localStorage.setItem(ACCESS_KEY, JSON.stringify({
      publicPages: Array.from(new Set([...base.publicPages, ...publicPages])),
      userPages,
      updatedAt: Date.now(),
    }));
  }

  function pageListIncludes(list, pageKey) {
    const key = normalizePageKey(pageKey);
    return (list || []).map(normalizePageKey).includes(key);
  }

  function isPagePublic(pageKey) {
    return pageListIncludes(loadAccess().publicPages, pageKey);
  }

  function canAccessPage(pageKey, session) {
    const key = normalizePageKey(pageKey) || "index.html";
    if (key === "index.html" || key === "login.html") return true;
    if (session && session.role === "admin") return true;
    if (isPagePublic(key)) return true;
    if (session) return pageListIncludes(loadAccess().userPages[session.id], key);
    return false;
  }

  function denyAccess(redirectTo, hasSession) {
    alert(hasSession ? "관리자의 승인이 필요한 자료입니다." : "관리자의 승인이 필요합니다. 로그인 후 이용해 주세요.");
    if (hasSession) {
      location.href = (redirectTo || "").startsWith("../") ? "../index.html" : "index.html";
      return;
    }
    const here = encodeURIComponent(buildReturnPath(redirectTo));
    location.href = (redirectTo || "login.html") + "?redirect=" + here;
  }

  async function ensureSeedUsers() {
    let users = loadUsers();
    const defaultHash = await sha256(DEFAULT_ADMIN_PASSWORD);
    if (!users) {
      users = [
        { id: DEFAULT_ADMIN_ID, name: "관리자", role: "admin", pwHash: defaultHash, createdAt: Date.now() },
      ];
      saveUsers(users);
    } else {
      const admin = users.find((u) => u.id === DEFAULT_ADMIN_ID);
      if (admin) {
        const legacyHash = await sha256(LEGACY_ADMIN_PASSWORD);
        if (admin.pwHash === legacyHash) {
          admin.pwHash = defaultHash;
          saveUsers(users);
        }
      }
    }
    return users;
  }

  function getUsers() {
    return loadUsers() || [];
  }

  function findUser(id) {
    return getUsers().find((u) => u.id === id);
  }

  async function addUser({ id, name, email, role, password }) {
    const users = getUsers();
    id = normalizeId(id);
    if (users.some((u) => u.id === id)) {
      throw new Error("이미 존재하는 아이디입니다.");
    }
    const pwHash = await sha256(password);
    users.push({ id, name: name || id, email: normalizeEmail(email), role: role || "staff", pwHash, createdAt: Date.now() });
    saveUsers(users);
    return true;
  }

  function removeUser(id) {
    let users = getUsers();
    if (id === "admin") throw new Error("최고 관리자 계정(admin)은 삭제할 수 없습니다.");
    users = users.filter((u) => u.id !== id);
    saveUsers(users);
  }

  function updateUserRole(id, role) {
    const users = getUsers();
    const u = users.find((x) => x.id === normalizeId(id));
    if (!u) throw new Error("사용자를 찾을 수 없습니다.");
    u.role = role;
    saveUsers(users);
  }

  function updateUserEmail(id, email) {
    const users = getUsers();
    const u = users.find((x) => x.id === normalizeId(id));
    if (!u) throw new Error("사용자를 찾을 수 없습니다.");
    u.email = normalizeEmail(email);
    saveUsers(users);
  }

  async function changePassword(id, newPassword) {
    const users = getUsers();
    const u = users.find((x) => x.id === normalizeId(id));
    if (!u) throw new Error("사용자를 찾을 수 없습니다.");
    u.pwHash = await sha256(newPassword);
    saveUsers(users);
  }

  async function resetPasswordByEmail(id, email, newPassword) {
    await ensureSeedUsers();
    const users = getUsers();
    const u = users.find((x) => x.id === normalizeId(id));
    if (!u || !u.email || u.email !== normalizeEmail(email)) {
      throw new Error("등록된 아이디와 이메일 정보가 일치하지 않습니다.");
    }
    u.pwHash = await sha256(newPassword);
    saveUsers(users);
    return true;
  }

  async function login(id, password) {
    await ensureSeedUsers();
    const normalizedId = normalizeId(id);
    if (normalizedId === DEFAULT_ADMIN_ID && password === LEGACY_ADMIN_PASSWORD) {
      throw new Error("기본 관리자 비밀번호가 변경되었습니다. admin / 9980으로 로그인해 주세요.");
    }
    const u = findUser(normalizedId);
    if (!u) throw new Error("아이디 또는 비밀번호가 올바르지 않습니다.");
    const hash = await sha256(password);
    if (hash !== u.pwHash) throw new Error("아이디 또는 비밀번호가 올바르지 않습니다.");
    const session = { id: u.id, name: u.name, role: u.role, ts: Date.now() };
    sessionStorage.setItem(SESSION_KEY, JSON.stringify(session));
    return session;
  }

  function logout(redirectTo) {
    sessionStorage.removeItem(SESSION_KEY);
    if (redirectTo) location.href = redirectTo;
  }

  function getSession() {
    try {
      const raw = sessionStorage.getItem(SESSION_KEY);
      if (raw) return JSON.parse(raw);
    } catch (e) {}
    return null;
  }

  function buildReturnPath(redirectTo) {
    const pathname = location.pathname;
    const parts = pathname.split("/").filter(Boolean);
    const file = pathname.endsWith("/") ? "index.html" : (parts.pop() || "index.html");
    let rel = file;

    // ../login.html 로 이동하는 하위 폴더 페이지(예: jeongsi/index.html)는
    // 로그인 후 같은 하위 경로로 되돌아갈 수 있게 한 단계 폴더명을 보존합니다.
    if ((redirectTo || "").startsWith("../")) {
      const folder = parts.pop();
      if (folder) rel = folder + "/" + file;
    }

    return rel + location.search + location.hash;
  }

  function requireLogin(redirectTo) {
    const session = getSession();
    if (!session) {
      const here = encodeURIComponent(buildReturnPath(redirectTo));
      location.href = (redirectTo || "login.html") + "?redirect=" + here;
      return null;
    }
    return session;
  }

  function requireAdmin(redirectTo) {
    const session = requireLogin(redirectTo);
    if (session && session.role !== "admin") {
      alert("관리자 권한이 필요한 페이지입니다.");
      location.href = "index.html";
      return null;
    }
    return session;
  }

  function requirePageAccess(redirectTo) {
    const session = getSession();
    const key = currentPageKey();
    if (canAccessPage(key, session)) {
      installAccessLinkGuards({ login: redirectTo || "login.html" });
      return session;
    }
    denyAccess(redirectTo, !!session);
    return false;
  }

  function installAccessLinkGuards(options = {}) {
    if (document.documentElement.dataset.gaongilAccessGuard === "on") return;
    document.documentElement.dataset.gaongilAccessGuard = "on";
    const redirectTo = options.login || "login.html";
    document.addEventListener("click", (event) => {
      const link = event.target.closest("a[href]");
      if (!link || event.defaultPrevented || event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) return;
      const href = link.getAttribute("href");
      const key = normalizePageKey(href);
      if (!key || key === "login.html") return;
      const session = getSession();
      if (canAccessPage(key, session)) return;
      event.preventDefault();
      denyAccess(redirectTo, !!session);
    });
  }

  function mountUserChip(elId) {
    const session = getSession();
    const el = document.getElementById(elId);
    if (!el) return;
    if (session) {
      el.classList.add("show");
      el.innerHTML =
        '<span>' + session.name + " (" + (session.role === "admin" ? "관리자" : "사용자") + ")</span>" +
        '<a href="#" data-logout style="color:var(--gold-400)">로그아웃</a>';
      el.querySelector("[data-logout]").addEventListener("click", (e) => {
        e.preventDefault();
        logout();
        location.href = "login.html";
      });
    } else {
      el.classList.remove("show");
      el.innerHTML = '<a href="login.html" style="color:var(--gold-400)">로그인</a>';
      el.classList.add("show");
    }
  }

  global.GaongilAuth = {
    ensureSeedUsers,
    getUsers,
    addUser,
    removeUser,
    updateUserRole,
    updateUserEmail,
    changePassword,
    resetPasswordByEmail,
    login,
    logout,
    getSession,
    requireLogin,
    requireAdmin,
    requirePageAccess,
    mountUserChip,
    getAccessSettings: loadAccess,
    setAccessSettings: saveAccess,
    normalizePageKey,
    canAccessPage,
    installAccessLinkGuards,
  };
})(window);
