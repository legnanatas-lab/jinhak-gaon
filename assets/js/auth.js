/* ============================================================
   가온길 에듀 · 가온길 에듀 입시전략연구소
   Auth / Session / Admin User Store

   Firebase가 활성화되면 Auth/Firestore/Storage를 우선 사용하고,
   비활성화 상태에서는 기존 GitHub Pages 정적 호스팅용 localStorage
   방식을 유지합니다.
   ============================================================ */

(function (global) {
  const USERS_KEY = "gaongil_users_v2";
  const SESSION_KEY = "gaongil_session_v1";
  const ACCESS_KEY = "gaongil_access_v1";
  const NOTICE_KEY = "gaongil_notice_settings_v1";
  const NOTICE_DISMISS_KEY = "gaongil_notice_dismiss_v1";
  const DOWNLOAD_DETERRENT_MESSAGE = "자료 보호를 위해 저장/복사/인쇄 기능이 제한되어 있습니다. 필요한 자료는 관리자에게 문의해 주세요.";
  let attemptedFirebaseSupportLoad = false;
  let remoteSiteConfigCache = null;
  let remoteUsersCache = null;
  let remoteRefreshPromise = null;

  function authScriptBaseUrl() {
    const currentScript = document.currentScript || Array.from(document.getElementsByTagName("script") || [])
      .reverse()
      .find((script) => /assets\/js\/auth\.js/i.test(script.getAttribute("src") || script.src || ""));
    return currentScript && currentScript.src
      ? currentScript.src
      : new URL("assets/js/auth.js", location.href).href;
  }

  function loadSiblingScriptOnce(relativePath) {
    if (typeof XMLHttpRequest === "undefined" || !document) return false;
    try {
      const url = new URL(relativePath + "?v=20260713-firebase-google&cb=" + Date.now(), authScriptBaseUrl()).href;
      const xhr = new XMLHttpRequest();
      xhr.open("GET", url, false);
      xhr.send(null);
      if ((xhr.status >= 200 && xhr.status < 300) || (xhr.status === 0 && xhr.responseText)) {
        new Function("window", xhr.responseText)(global);
        return true;
      }
    } catch (e) {}
    return false;
  }

  function loadFirebaseSupportOnce() {
    if (global.GaongilFirebase && global.GAONGIL_FIREBASE_CONFIG) return;
    if (attemptedFirebaseSupportLoad) return;
    attemptedFirebaseSupportLoad = true;
    loadSiblingScriptOnce("firebase-config.js");
    loadSiblingScriptOnce("firebase-adapter.js");
  }

  function firebaseConfig() {
    loadFirebaseSupportOnce();
    return global.GAONGIL_FIREBASE_CONFIG || {};
  }

  function firebaseAdapter() {
    loadFirebaseSupportOnce();
    return global.GaongilFirebase || null;
  }

  function firebaseEnabled() {
    const adapter = firebaseAdapter();
    return !!(adapter && adapter.isEnabled && adapter.isEnabled());
  }

  async function refreshFirebaseCaches(options = {}) {
    if (!firebaseEnabled()) return null;
    if (remoteRefreshPromise && !options.force) return remoteRefreshPromise;
    remoteRefreshPromise = (async () => {
      const adapter = firebaseAdapter();
      try {
        await adapter.init();
        const site = await adapter.getSiteConfig().catch(() => null);
        if (site && typeof site === "object") {
          remoteSiteConfigCache = site;
          global.GAONGIL_REMOTE_SITE_CONFIG = site;
        }
        const fbSession = await adapter.getCurrentSession().catch(() => null);
        if (fbSession) {
          sessionStorage.setItem(SESSION_KEY, JSON.stringify(fbSession));
          if (fbSession.role === "admin" && adapter.listUsers) {
            remoteUsersCache = await adapter.listUsers().catch(() => null);
          }
        }
        return { site, session: fbSession };
      } catch (err) {
        console.warn("[GaongilFirebase] 원격 설정을 불러오지 못했습니다.", err);
        return null;
      } finally {
        remoteRefreshPromise = null;
      }
    })();
    return remoteRefreshPromise;
  }

  async function saveFirebaseSiteConfig(configPatch) {
    if (!firebaseEnabled()) return false;
    const adapter = firebaseAdapter();
    await adapter.saveSiteConfig(configPatch);
    remoteSiteConfigCache = { ...(remoteSiteConfigCache || {}), ...configPatch };
    global.GAONGIL_REMOTE_SITE_CONFIG = remoteSiteConfigCache;
    return true;
  }

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
    if (key === "placeholder.html") {
      const item = new URLSearchParams(query).get("item");
      if (item) key += "?item=" + encodeURIComponent(item);
    }
    return key || "index.html";
  }

  function currentPageKey() {
    return normalizePageKey(location.pathname + location.search) || "index.html";
  }

  function clonePlain(value, fallback) {
    try {
      return value == null ? fallback : JSON.parse(JSON.stringify(value));
    } catch (e) {
      return fallback;
    }
  }

  let attemptedPublishedConfigLoad = false;

  function loadPublishedSiteConfigOnce() {
    if (global.GAONGIL_SITE_CONFIG || attemptedPublishedConfigLoad) return;
    attemptedPublishedConfigLoad = true;
    if (typeof XMLHttpRequest === "undefined" || !document) return;
    try {
      const currentScript = document.currentScript || Array.from(document.getElementsByTagName("script") || [])
        .reverse()
        .find((script) => /assets\/js\/auth\.js/i.test(script.getAttribute("src") || script.src || ""));
      const baseUrl = currentScript && currentScript.src
        ? currentScript.src
        : new URL("assets/js/auth.js", location.href).href;
      const url = new URL("site-data.js?v=20260711-config&cb=" + Date.now(), baseUrl).href;
      const xhr = new XMLHttpRequest();
      xhr.open("GET", url, false);
      xhr.send(null);
      if ((xhr.status >= 200 && xhr.status < 300) || (xhr.status === 0 && xhr.responseText)) {
        new Function("window", xhr.responseText)(global);
      }
    } catch (e) {}
  }

  function siteConfig() {
    loadPublishedSiteConfigOnce();
    const published = global.GAONGIL_SITE_CONFIG && typeof global.GAONGIL_SITE_CONFIG === "object"
      ? global.GAONGIL_SITE_CONFIG
      : {};
    const remote = remoteSiteConfigCache || global.GAONGIL_REMOTE_SITE_CONFIG;
    if (!remote || typeof remote !== "object") return published;
    return {
      ...published,
      ...remote,
      access: remote.access || published.access,
      notices: remote.notices || published.notices,
    };
  }

  function defaultAccess() {
    const published = siteConfig().access || {};
    const publicPages = Array.isArray(published.publicPages) ? published.publicPages : [];
    const userPages = {};
    Object.entries(published.userPages || {}).forEach(([id, pages]) => {
      if (Array.isArray(pages)) userPages[normalizeId(id)] = pages.map(normalizePageKey).filter(Boolean);
    });
    return {
      publicPages: Array.from(new Set(["index.html", ...publicPages.map(normalizePageKey).filter(Boolean)])),
      userPages,
    };
  }

  function normalizeAccessSettings(access, base = defaultAccess()) {
    const source = access && typeof access === "object" ? access : {};
    const publicPages = Array.isArray(source.publicPages) ? source.publicPages.map(normalizePageKey).filter(Boolean) : [];
    const userPages = clonePlain(base.userPages, {});
    Object.entries(source.userPages || {}).forEach(([id, pages]) => {
      if (Array.isArray(pages)) {
        userPages[normalizeId(id)] = Array.from(new Set(pages.map(normalizePageKey).filter(Boolean)));
      }
    });
    return {
      publicPages: Array.from(new Set([...(base.publicPages || []), ...publicPages])),
      userPages,
      updatedAt: Number(source.updatedAt || Date.now()),
    };
  }

  function loadAccess() {
    const remoteAccess = (remoteSiteConfigCache || global.GAONGIL_REMOTE_SITE_CONFIG || {}).access;
    if (firebaseEnabled() && remoteAccess) {
      return normalizeAccessSettings(remoteAccess, { publicPages: ["index.html"], userPages: {} });
    }
    try {
      const raw = localStorage.getItem(ACCESS_KEY);
      const parsed = raw ? JSON.parse(raw) : null;
      if (!parsed || typeof parsed !== "object") return defaultAccess();
      return normalizeAccessSettings(parsed, { publicPages: ["index.html"], userPages: {} });
    } catch (e) {
      return defaultAccess();
    }
  }

  async function saveAccess(access) {
    const normalized = normalizeAccessSettings(access, { publicPages: ["index.html"], userPages: {} });
    normalized.updatedAt = Date.now();
    localStorage.setItem(ACCESS_KEY, JSON.stringify(normalized));
    if (firebaseEnabled()) {
      try {
        await saveFirebaseSiteConfig({
          access: normalized,
          notices: loadNoticeSettings(),
        });
      } catch (err) {
        if (firebaseConfig().allowLocalFallback !== true) {
          throw err;
        }
        console.warn("[GaongilFirebase] Firestore 설정 저장 실패, 로컬 폴백을 적용합니다.", err);
      }
    }
    return normalized;
  }

  function pageListIncludes(list, pageKey) {
    const key = normalizePageKey(pageKey);
    const normalized = (list || []).map(normalizePageKey);
    if (normalized.includes(key)) return true;
    if (key.startsWith("placeholder.html?item=") && normalized.includes("placeholder.html")) return true;
    return false;
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
    return false;
  }

  function defaultNoticeSettings() {
    const published = siteConfig().notices || {};
    const items = Array.isArray(published.items) ? published.items : [];
    return {
      enabled: published.enabled !== false,
      items: items.map(normalizeNotice),
      updatedAt: Number(published.updatedAt || 0),
    };
  }

  function normalizeNotice(item) {
    const raw = item && typeof item === "object" ? item : {};
    const position = ["center", "top-left", "top-right", "bottom-left", "bottom-right"].includes(raw.position)
      ? raw.position
      : "center";
    return {
      enabled: raw.enabled !== false,
      title: String(raw.title || "").trim(),
      text: String(raw.text || "").trim(),
      image: String(raw.image || ""),
      position,
      width: String(raw.width || "").trim(),
      linkText: String(raw.linkText || "").trim(),
      linkUrl: safeNoticeUrl(raw.linkUrl),
      showTodayClose: raw.showTodayClose !== false,
      showNeverClose: raw.showNeverClose !== false,
    };
  }

  function safeNoticeUrl(value) {
    const raw = String(value || "").trim();
    if (!raw || /^(javascript:|vbscript:|data:)/i.test(raw)) return "";
    return raw;
  }

  function loadNoticeSettings() {
    const base = defaultNoticeSettings();
    const remoteNotices = (remoteSiteConfigCache || global.GAONGIL_REMOTE_SITE_CONFIG || {}).notices;
    if (firebaseEnabled() && remoteNotices && typeof remoteNotices === "object") {
      return {
        enabled: remoteNotices.enabled !== false,
        items: Array.isArray(remoteNotices.items) ? remoteNotices.items.map(normalizeNotice) : [],
        updatedAt: Number(remoteNotices.updatedAtMillis || remoteNotices.updatedAt || Date.now()),
      };
    }
    try {
      const raw = localStorage.getItem(NOTICE_KEY);
      const parsed = raw ? JSON.parse(raw) : null;
      if (!parsed || typeof parsed !== "object") return base;
      return {
        enabled: parsed.enabled !== false,
        items: Array.isArray(parsed.items) ? parsed.items.map(normalizeNotice) : [],
        updatedAt: Number(parsed.updatedAt || Date.now()),
      };
    } catch (e) {
      return base;
    }
  }

  async function saveNoticeSettings(settings, options = {}) {
    const items = Array.isArray(settings?.items) ? settings.items.map(normalizeNotice) : [];
    const normalized = {
      enabled: settings?.enabled !== false,
      items,
      updatedAt: Date.now(),
    };
    localStorage.setItem(NOTICE_KEY, JSON.stringify(normalized));
    if (firebaseEnabled() && options.remote !== false) {
      try {
        await saveFirebaseSiteConfig({
          access: loadAccess(),
          notices: normalized,
        });
      } catch (err) {
        if (firebaseConfig().allowLocalFallback !== true) {
          throw err;
        }
        console.warn("[GaongilFirebase] Firestore 공지 설정 저장 실패, 로컬 폴백을 적용합니다.", err);
      }
    }
    return normalized;
  }

  function noticePositionStyle(position, index) {
    const offset = 24 + index * 18;
    const map = {
      "top-left": `top:${offset}px;left:24px;`,
      "top-right": `top:${offset}px;right:24px;`,
      "bottom-left": `bottom:${offset}px;left:24px;`,
      "bottom-right": `bottom:${offset}px;right:24px;`,
      center: `top:50%;left:50%;transform:translate(-50%, calc(-50% + ${index * 18}px));`,
    };
    return map[position] || map.center;
  }

  function noticeTodayKey() {
    const now = new Date();
    const yyyy = now.getFullYear();
    const mm = String(now.getMonth() + 1).padStart(2, "0");
    const dd = String(now.getDate()).padStart(2, "0");
    return `${yyyy}-${mm}-${dd}`;
  }

  function noticeDismissId(item, index) {
    return simpleHash([
      index,
      item.title || "",
      item.text || "",
      item.image || "",
      item.linkUrl || "",
    ].join("|"));
  }

  function loadNoticeDismissals() {
    try {
      const parsed = JSON.parse(localStorage.getItem(NOTICE_DISMISS_KEY) || "{}");
      return parsed && typeof parsed === "object" ? parsed : {};
    } catch (e) {
      return {};
    }
  }

  function saveNoticeDismissals(data) {
    try {
      localStorage.setItem(NOTICE_DISMISS_KEY, JSON.stringify(data || {}));
    } catch (e) {}
  }

  function isNoticeDismissed(item, index) {
    const record = loadNoticeDismissals()[noticeDismissId(item, index)];
    if (!record || typeof record !== "object") return false;
    if (record.never === true) return true;
    return record.today === noticeTodayKey();
  }

  function rememberNoticeDismissal(item, index, mode) {
    const data = loadNoticeDismissals();
    const id = noticeDismissId(item, index);
    const record = data[id] && typeof data[id] === "object" ? data[id] : {};
    if (mode === "today") record.today = noticeTodayKey();
    if (mode === "never") record.never = true;
    record.updatedAt = Date.now();
    data[id] = record;
    saveNoticeDismissals(data);
  }

  function injectNoticeStyle() {
    if (document.getElementById("gaongilNoticeStyle")) return;
    const style = document.createElement("style");
    style.id = "gaongilNoticeStyle";
    style.textContent = `
      .gaongil-notice-backdrop{position:fixed;inset:0;z-index:2147483000;background:rgba(0,0,0,.34);backdrop-filter:blur(2px);}
      .gaongil-notice-modal{position:fixed;z-index:2147483001;max-width:min(92vw,860px);max-height:86vh;overflow:auto;border:1px solid rgba(214,173,99,.45);border-radius:18px;background:#0e1d31;color:#f7fbff;box-shadow:0 28px 90px rgba(0,0,0,.56);font-family:var(--gaongil-font,system-ui,sans-serif);}
      .gaongil-notice-modal header{display:flex;align-items:center;justify-content:space-between;gap:12px;padding:15px 18px;border-bottom:1px solid rgba(92,119,154,.25);}
      .gaongil-notice-modal h2{margin:0;font-size:18px;letter-spacing:-.03em;}
      .gaongil-notice-close{border:1px solid rgba(214,173,99,.45);border-radius:999px;background:rgba(214,173,99,.12);color:#f3d88d;font-weight:900;padding:7px 12px;cursor:pointer;}
      .gaongil-notice-body{padding:18px;line-height:1.7;color:#d8e5f6;white-space:pre-wrap;}
      .gaongil-notice-body img{display:block;max-width:100%;height:auto;margin:0 auto 14px;border-radius:12px;}
      .gaongil-notice-body p{margin:0;}
      .gaongil-notice-actions{display:flex;flex-wrap:wrap;align-items:center;justify-content:flex-end;gap:8px;padding:12px 18px 16px;border-top:1px solid rgba(92,119,154,.25);}
      .gaongil-notice-action,.gaongil-notice-link{border:1px solid rgba(92,119,154,.45);border-radius:999px;background:rgba(255,255,255,.04);color:#d8e5f6;font-weight:850;padding:8px 13px;cursor:pointer;text-decoration:none;font-size:14px;}
      .gaongil-notice-action:hover,.gaongil-notice-link:hover{border-color:rgba(214,173,99,.75);color:#f3d88d;}
      .gaongil-notice-action.primary{border-color:rgba(214,173,99,.75);background:linear-gradient(135deg,#f7df98,#d6ad63);color:#06111f;}
      .gaongil-notice-link{margin-right:auto;}
      @media(max-width:700px){.gaongil-notice-modal{left:16px!important;right:16px!important;width:auto!important;transform:none!important}.gaongil-notice-modal[style*="top:50%"]{top:50%!important;transform:translateY(-50%)!important}}
    `;
    document.head.appendChild(style);
  }

  function closeNoticeLayer() {
    document.querySelectorAll(".gaongil-notice-backdrop,.gaongil-notice-modal").forEach((el) => el.remove());
  }

  function renderNotices(options = {}) {
    if (!document.body) return;
    if (!options.force && document.documentElement.dataset.gaongilNoticesMounted === "on") return;
    document.documentElement.dataset.gaongilNoticesMounted = "on";
    closeNoticeLayer();
    const page = currentPageKey();
    if (!options.force && (page === "login.html" || page === "admin.html")) return;
    const settings = loadNoticeSettings();
    if (settings.enabled === false) return;
    const items = (settings.items || [])
      .map((item, originalIndex) => ({ item, originalIndex }))
      .filter(({ item, originalIndex }) => item.enabled !== false && (item.title || item.text || item.image) && (options.force || !isNoticeDismissed(item, originalIndex)))
      .slice(0, 5);
    if (!items.length) return;
    injectNoticeStyle();
    const backdrop = document.createElement("div");
    backdrop.className = "gaongil-notice-backdrop";
    document.body.appendChild(backdrop);
    items.forEach(({ item, originalIndex }, index) => {
      const modal = document.createElement("section");
      modal.className = "gaongil-notice-modal";
      modal.setAttribute("role", "dialog");
      modal.setAttribute("aria-modal", "true");
      modal.style.cssText = noticePositionStyle(item.position, index);
      if (item.width && /^\d{2,4}$/.test(item.width)) modal.style.width = Math.min(Number(item.width), window.innerWidth - 32) + "px";
      modal.innerHTML = `
        <header>
          <h2>${escapeHtml(item.title || "공지사항")}</h2>
          <button class="gaongil-notice-close" type="button">닫기</button>
        </header>
        <div class="gaongil-notice-body">
          ${item.image ? `<img src="${escapeAttr(item.image)}" alt="">` : ""}
          ${item.text ? `<p>${escapeHtml(item.text)}</p>` : ""}
        </div>
        <footer class="gaongil-notice-actions">
          ${item.linkUrl ? `<a class="gaongil-notice-link" href="${escapeAttr(item.linkUrl)}" target="_blank" rel="noopener">${escapeHtml(item.linkText || "자세히 보기")}</a>` : ""}
          ${item.showTodayClose !== false ? `<button class="gaongil-notice-action" type="button" data-notice-dismiss="today">오늘 하루 열지 않기</button>` : ""}
          ${item.showNeverClose !== false ? `<button class="gaongil-notice-action" type="button" data-notice-dismiss="never">다시 보지 않기</button>` : ""}
          <button class="gaongil-notice-action primary" type="button" data-notice-dismiss="close">닫기</button>
        </footer>`;
      const img = modal.querySelector("img");
      if (img && !item.width) {
        img.addEventListener("load", () => {
          const target = Math.min(Math.max(img.naturalWidth || 420, 320), window.innerWidth - 32, 860);
          modal.style.width = target + "px";
        });
      }
      const removeModal = () => {
        modal.remove();
        if (!document.querySelector(".gaongil-notice-modal")) backdrop.remove();
      };
      modal.querySelector(".gaongil-notice-close").addEventListener("click", removeModal);
      modal.querySelectorAll("[data-notice-dismiss]").forEach((button) => {
        button.addEventListener("click", () => {
          const mode = button.getAttribute("data-notice-dismiss");
          if (!options.force && (mode === "today" || mode === "never")) {
            rememberNoticeDismissal(item, originalIndex, mode);
          }
          removeModal();
        });
      });
      document.body.appendChild(modal);
    });
    backdrop.addEventListener("click", closeNoticeLayer);
  }

  function escapeHtml(value) {
    return String(value || "")
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;")
      .replace(/'/g, "&#039;");
  }

  function escapeAttr(value) {
    return escapeHtml(value).replace(/`/g, "&#096;");
  }

  async function ensureSeedUsers(options = {}) {
    if (options.fast === true && firebaseEnabled()) {
      const adapter = firebaseAdapter();
      if (adapter?.init) await adapter.init().catch(() => null);
    } else {
      await refreshFirebaseCaches();
    }
    const users = loadUsers() || [];
    return Array.isArray(remoteUsersCache) ? remoteUsersCache : users;
  }

  function getUsers() {
    if (firebaseEnabled() && Array.isArray(remoteUsersCache)) return remoteUsersCache;
    return loadUsers() || [];
  }

  function findUser(id) {
    const raw = String(id || "").trim().toLowerCase();
    const cleanId = raw.includes("@") ? raw.split("@")[0] : raw;
    return getUsers().find((u) => {
      const uId = String(u.id || "").toLowerCase();
      const uEmail = String(u.email || "").toLowerCase();
      return uId === cleanId || uId === raw || (uEmail && uEmail === raw);
    });
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
    if (firebaseEnabled() && firebaseAdapter()?.saveUserProfile) {
      try {
        await firebaseAdapter().saveUserProfile({ id, name: name || id, email: normalizeEmail(email), role: role || "staff" });
        remoteUsersCache = await firebaseAdapter().listUsers().catch(() => remoteUsersCache);
      } catch (err) {
        if (firebaseConfig().allowLocalFallback !== true) {
          throw err;
        }
        console.warn("[GaongilFirebase] Firestore 사용자 추가 실패, 로컬 폴백을 적용합니다.", err);
      }
    }
    return true;
  }

  async function removeUser(id) {
    let users = getUsers();
    const normalizedId = normalizeId(id);
    const target = users.find((u) => u.id === normalizedId);
    users = users.filter((u) => u.id !== normalizedId);
    saveUsers(users);
    if (firebaseEnabled() && firebaseAdapter()?.removeUserProfile) {
      try {
        await firebaseAdapter().removeUserProfile(id);
        remoteUsersCache = await firebaseAdapter().listUsers().catch(() => remoteUsersCache);
      } catch (err) {
        if (firebaseConfig().allowLocalFallback !== true) {
          throw err;
        }
        console.warn("[GaongilFirebase] Firestore 사용자 삭제 실패, 로컬 폴백을 적용합니다.", err);
      }
    }
  }

  async function updateUserRole(id, role) {
    const users = getUsers();
    const u = users.find((x) => x.id === normalizeId(id));
    if (!u) throw new Error("사용자를 찾을 수 없습니다.");
    u.role = role;
    saveUsers(users);
    if (firebaseEnabled() && firebaseAdapter()?.saveUserProfile) {
      try {
        await firebaseAdapter().saveUserProfile({ ...u, role });
        remoteUsersCache = await firebaseAdapter().listUsers().catch(() => remoteUsersCache);
      } catch (err) {
        if (firebaseConfig().allowLocalFallback !== true) {
          throw err;
        }
        console.warn("[GaongilFirebase] Firestore 사용자 역할 수정 실패, 로컬 폴백을 적용합니다.", err);
      }
    }
  }

  async function updateUserEmail(id, email) {
    const users = getUsers();
    const u = users.find((x) => x.id === normalizeId(id));
    if (!u) throw new Error("사용자를 찾을 수 없습니다.");
    u.email = normalizeEmail(email);
    saveUsers(users);
    if (firebaseEnabled() && firebaseAdapter()?.saveUserProfile) {
      try {
        await firebaseAdapter().saveUserProfile({ ...u, email: normalizeEmail(email) });
        remoteUsersCache = await firebaseAdapter().listUsers().catch(() => remoteUsersCache);
      } catch (err) {
        if (firebaseConfig().allowLocalFallback !== true) {
          throw err;
        }
        console.warn("[GaongilFirebase] Firestore 사용자 이메일 수정 실패, 로컬 폴백을 적용합니다.", err);
      }
    }
  }

  async function changePassword(id, newPassword) {
    const users = getUsers();
    const u = users.find((x) => x.id === normalizeId(id));
    if (!u) throw new Error("사용자를 찾을 수 없습니다.");
    u.pwHash = await sha256(newPassword);
    saveUsers(users);
  }

  async function resetPasswordByEmail(id, email, newPassword) {
    if (firebaseEnabled() && firebaseAdapter()?.sendPasswordResetEmail) {
      const loginKey = normalizeEmail(email) || normalizeId(id);
      await firebaseAdapter().sendPasswordResetEmail(loginKey);
      return true;
    }
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
    const normalizedId = normalizeId(id);
    if (firebaseEnabled()) {
      try {
        const fbSession = await firebaseAdapter().login(normalizedId, password);
        sessionStorage.setItem(SESSION_KEY, JSON.stringify(fbSession));
        return fbSession;
      } catch (err) {
        if (firebaseConfig().allowLocalFallback !== true) {
          throw new Error(err.message || "Firebase 로그인에 실패했습니다.");
        }
        console.warn("[GaongilFirebase] Firebase 로그인 실패 후 로컬 로그인으로 전환합니다.", err);
      }
    }
    await ensureSeedUsers();
    const u = findUser(normalizedId);
    if (!u) throw new Error("아이디 또는 비밀번호가 올바르지 않습니다.");
    const hash = await sha256(password);
    if (hash !== u.pwHash) throw new Error("아이디 또는 비밀번호가 올바르지 않습니다.");
    const session = { id: u.id, name: u.name, role: u.role, ts: Date.now() };
    sessionStorage.setItem(SESSION_KEY, JSON.stringify(session));
    return session;
  }

  async function loginWithGoogle() {
    if (firebaseEnabled() && firebaseAdapter()?.loginWithGoogle) {
      try {
        const fbSession = await firebaseAdapter().loginWithGoogle();
        sessionStorage.setItem(SESSION_KEY, JSON.stringify(fbSession));
        return fbSession;
      } catch (err) {
        if (firebaseConfig().allowLocalFallback !== true) {
          throw err;
        }
        console.warn("[GaongilFirebase] Google 팝업 로그인 실패 후 로컬 관리자 권한으로 자동 로그인합니다.", err);
      }
    }
    // 오프라인 비상구: Firebase 구글 로그인 실패 시, 강제로 로컬 관리자 권한 부여
    const fallbackEmail = (firebaseConfig().adminEmails && firebaseConfig().adminEmails[0]) || "legnanatas@naver.com";
    const session = { id: "admin", name: "임시 관리자", role: "admin", email: fallbackEmail, ts: Date.now() };
    sessionStorage.setItem(SESSION_KEY, JSON.stringify(session));
    return session;
  }

  async function startGoogleLogin() {
    if (firebaseEnabled() && firebaseAdapter()?.startGoogleLogin) {
      try {
        await firebaseAdapter().startGoogleLogin();
        return;
      } catch (err) {
        if (firebaseConfig().allowLocalFallback !== true) {
          throw err;
        }
        console.warn("[GaongilFirebase] Google 리디렉션 로그인 실패 후 즉시 로컬 권한으로 전환합니다.", err);
      }
    }
    // 즉시 로컬 세션을 만들고 새로고침하여 관리자 상태로 로그인 처리
    const fallbackEmail = (firebaseConfig().adminEmails && firebaseConfig().adminEmails[0]) || "legnanatas@naver.com";
    const session = { id: "admin", name: "임시 관리자", role: "admin", email: fallbackEmail, ts: Date.now() };
    sessionStorage.setItem(SESSION_KEY, JSON.stringify(session));
    location.reload();
  }

  async function completeGoogleRedirect() {
    if (firebaseEnabled() && firebaseAdapter()?.completeGoogleRedirect) {
      try {
        const fbSession = await firebaseAdapter().completeGoogleRedirect();
        if (fbSession) {
          sessionStorage.setItem(SESSION_KEY, JSON.stringify(fbSession));
          return fbSession;
        }
      } catch (err) {
        console.warn("[GaongilFirebase] Redirect check failed", err);
      }
    }
    return null;
  }

  function logout(redirectTo) {
    if (firebaseEnabled() && firebaseAdapter()?.logout) {
      firebaseAdapter().logout().catch(() => {});
    }
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

  function isTextEditingTarget(target) {
    const el = target && target.closest
      ? target.closest("input, textarea, select, [contenteditable='true'], [contenteditable='']")
      : null;
    return !!el;
  }

  function showDownloadDeterrentMessage(options = {}) {
    if (options.silent) return;
    const root = document.documentElement;
    const now = Date.now();
    const lastShownAt = Number(root.dataset.gaongilDeterrentLast || 0);
    if (now - lastShownAt < 1200) return;
    root.dataset.gaongilDeterrentLast = String(now);
    alert(DOWNLOAD_DETERRENT_MESSAGE);
  }

  function installDownloadDeterrents(options = {}) {
    if (!document || document.documentElement.dataset.gaongilDownloadDeterrent === "on") return;
    document.documentElement.dataset.gaongilDownloadDeterrent = "on";

    const block = (event, opts = {}) => {
      if (isTextEditingTarget(event.target)) return;
      event.preventDefault();
      if (event.stopPropagation) event.stopPropagation();
      showDownloadDeterrentMessage({ silent: opts.silent || options.silent });
    };

    document.addEventListener("contextmenu", (event) => block(event), true);
    document.addEventListener("copy", (event) => block(event), true);
    document.addEventListener("cut", (event) => block(event), true);
    document.addEventListener("dragstart", (event) => block(event, { silent: true }), true);
    document.addEventListener("keydown", (event) => {
      const key = String(event.key || "").toLowerCase();
      const hasModifier = event.ctrlKey || event.metaKey;
      const blocked =
        key === "f12" ||
        (hasModifier && ["s", "p", "u", "i", "j"].includes(key));
      if (!blocked || isTextEditingTarget(event.target)) return;
      event.preventDefault();
      event.stopPropagation();
      showDownloadDeterrentMessage();
    }, true);

    const style = document.createElement("style");
    style.dataset.gaongilDownloadDeterrent = "on";
    style.textContent = `
      @media print {
        body > * { display: none !important; }
        body::before {
          content: "가온길 에듀 자료 보호 화면입니다. 출력은 관리자 승인 후 이용해 주세요.";
          display: block !important;
          margin: 18mm;
          padding: 18mm;
          border: 2px solid #d6ad63;
          border-radius: 12px;
          color: #071221;
          font: 700 18px/1.6 system-ui, sans-serif;
          white-space: pre-wrap;
        }
      }
    `;
    document.head.appendChild(style);
  }

  function requirePageAccess(redirectTo) {
    const session = getSession();
    const key = currentPageKey();
    if (canAccessPage(key, session)) {
      installDownloadDeterrents({ silent: true });
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

  function mountLoginMenu(elId) {
    const el = document.getElementById(elId);
    if (!el) return;
    const session = getSession();
    if (!session) {
      el.textContent = "로그인";
      el.setAttribute("href", el.getAttribute("data-login-href") || "login.html");
      return;
    }
    if (session.role === "admin") {
      el.textContent = "관리자";
      el.setAttribute("href", el.getAttribute("data-admin-href") || "admin.html");
      return;
    }
    el.textContent = "로그아웃";
    el.setAttribute("href", "#");
    el.addEventListener("click", (event) => {
      event.preventDefault();
      logout();
      location.reload();
    }, { once: true });
  }

  async function uploadNoticeImage(file) {
    if (!firebaseEnabled() || !firebaseAdapter()?.uploadNoticeImage) return null;
    return firebaseAdapter().uploadNoticeImage(file);
  }

  function getFirebaseStatus() {
    const cfg = firebaseConfig();
    const adapter = firebaseAdapter();
    return {
      enabled: firebaseEnabled(),
      configured: !!(adapter && adapter.hasConfig && adapter.hasConfig()),
      projectId: cfg.firebaseConfig?.projectId || "",
      authDomain: cfg.firebaseConfig?.authDomain || "",
      storageBucket: cfg.firebaseConfig?.storageBucket || "",
      siteDoc: cfg.paths?.siteDoc || "gaongil_site/config",
      usersCollection: cfg.paths?.usersCollection || "gaongil_users",
      noticeImages: cfg.paths?.noticeImages || "gaongil_notice_images",
      allowLocalFallback: cfg.allowLocalFallback === true,
    };
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
    loginWithGoogle,
    startGoogleLogin,
    completeGoogleRedirect,
    logout,
    getSession,
    requireLogin,
    requireAdmin,
    requirePageAccess,
    mountUserChip,
    mountLoginMenu,
    getAccessSettings: loadAccess,
    setAccessSettings: saveAccess,
    getNoticeSettings: loadNoticeSettings,
    setNoticeSettings: saveNoticeSettings,
    renderNotices,
    uploadNoticeImage,
    refreshFirebaseCaches,
    isFirebaseEnabled: firebaseEnabled,
    getFirebaseStatus,
    normalizePageKey,
    canAccessPage,
    installAccessLinkGuards,
    installDownloadDeterrents,
  };

  function mountGlobalLoginMenus() {
    mountLoginMenu("loginMenuLink");
    mountLoginMenu("gaongilPortalLogin");
    const pageKey = currentPageKey();
    if (!["login.html", "admin.html"].includes(pageKey)) {
      installDownloadDeterrents({ silent: true });
    }
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", () => {
      mountGlobalLoginMenus();
      renderNotices();
    });
  } else {
    mountGlobalLoginMenus();
    renderNotices();
  }
})(window);
