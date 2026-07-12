/* ============================================================
   가온길 에듀 Firebase Adapter
   - Firebase Auth: 로그인
   - Firestore: 게시판 공개/교사별 권한/공지 설정
   - Storage: 공지 이미지 파일
   ============================================================ */

(function (global) {
  const DEFAULT_SDK_VERSION = "12.16.0";
  let initPromise = null;
  let modules = null;
  let app = null;
  let auth = null;
  let db = null;
  let storage = null;

  function config() {
    return global.GAONGIL_FIREBASE_CONFIG || {};
  }

  function firebaseConfig() {
    return config().firebaseConfig || {};
  }

  function hasConfig() {
    const cfg = firebaseConfig();
    return !!(cfg.apiKey && cfg.authDomain && cfg.projectId && cfg.appId);
  }

  function isEnabled() {
    return config().enabled === true && hasConfig();
  }

  function sdkVersion() {
    return String(config().sdkVersion || DEFAULT_SDK_VERSION).trim() || DEFAULT_SDK_VERSION;
  }

  function sdkUrl(service) {
    return `https://www.gstatic.com/firebasejs/${sdkVersion()}/firebase-${service}.js`;
  }

  function cleanPath(path, fallback) {
    return String(path || fallback || "").split("/").map((part) => part.trim()).filter(Boolean);
  }

  function siteDocRef(firestore) {
    const parts = cleanPath(config().paths?.siteDoc, "gaongil_site/config");
    if (parts.length % 2 !== 0) throw new Error("Firebase siteDoc 경로는 collection/document 형태여야 합니다.");
    return firestore.doc(db, ...parts);
  }

  function usersCollectionRef(firestore) {
    const parts = cleanPath(config().paths?.usersCollection, "gaongil_users");
    return firestore.collection(db, ...parts);
  }

  function userDocRef(firestore, key) {
    const parts = cleanPath(config().paths?.usersCollection, "gaongil_users");
    return firestore.doc(db, ...parts, String(key));
  }

  async function init() {
    if (!isEnabled()) throw new Error("Firebase 설정이 꺼져 있거나 firebaseConfig가 비어 있습니다.");
    if (initPromise) return initPromise;
    initPromise = (async () => {
      const [appMod, authMod, firestoreMod, storageMod] = await Promise.all([
        import(sdkUrl("app")),
        import(sdkUrl("auth")),
        import(sdkUrl("firestore")),
        import(sdkUrl("storage")),
      ]);
      modules = { app: appMod, auth: authMod, firestore: firestoreMod, storage: storageMod };
      const name = "gaongil";
      app = appMod.getApps().find((item) => item.name === name) || appMod.initializeApp(firebaseConfig(), name);
      auth = authMod.getAuth(app);
      db = firestoreMod.getFirestore(app);
      storage = storageMod.getStorage(app);
      return { app, auth, db, storage, modules };
    })();
    return initPromise;
  }

  function resolveLoginEmail(loginId) {
    const raw = String(loginId || "").trim();
    if (!raw) return "";
    const aliases = config().loginAliases || {};
    if (aliases[raw]) return String(aliases[raw]).trim();
    if (raw.includes("@")) return raw;
    const domain = String(config().loginDomain || "").trim().replace(/^@/, "");
    if (domain) return `${raw}@${domain}`;
    throw new Error("Firebase 로그인은 이메일이 필요합니다. admin 아이디를 쓰려면 firebase-config.js의 loginAliases.admin에 관리자 이메일을 넣어 주세요.");
  }

  function sessionFromProfile(user, profile, loginId) {
    const email = user?.email || "";
    const configuredAdminEmail = String((config().loginAliases || {}).admin || "").trim().toLowerCase();
    const isAdminAlias = configuredAdminEmail && email.toLowerCase() === configuredAdminEmail;
    return {
      id: String(profile?.id || (isAdminAlias ? "admin" : loginId || email || user.uid)).trim(),
      name: String(profile?.name || (isAdminAlias ? "관리자" : email || "사용자")).trim(),
      role: profile?.role || (isAdminAlias ? "admin" : "staff"),
      email,
      uid: user.uid,
      firebase: true,
      ts: Date.now(),
    };
  }

  async function readProfile(user, loginId) {
    await init();
    const { firestore } = modules;
    const candidates = [user.uid, String(loginId || "").trim()].filter(Boolean);
    for (const key of candidates) {
      const snap = await firestore.getDoc(userDocRef(firestore, key)).catch(() => null);
      if (snap && snap.exists()) return { docId: snap.id, ...snap.data() };
    }
    if (user.email) {
      const emailQuery = firestore.query(
        usersCollectionRef(firestore),
        firestore.where("email", "==", String(user.email).trim().toLowerCase()),
        firestore.limit(1)
      );
      const snap = await firestore.getDocs(emailQuery).catch(() => null);
      if (snap && !snap.empty) {
        const doc = snap.docs[0];
        return { docId: doc.id, ...doc.data() };
      }
    }
    return null;
  }

  async function login(loginId, password) {
    await init();
    const email = resolveLoginEmail(loginId);
    const credential = await modules.auth.signInWithEmailAndPassword(auth, email, password);
    const profile = await readProfile(credential.user, loginId);
    return sessionFromProfile(credential.user, profile, loginId);
  }

  async function loginWithGoogle() {
    await init();
    const provider = new modules.auth.GoogleAuthProvider();
    provider.setCustomParameters({ prompt: "select_account" });
    const credential = await modules.auth.signInWithPopup(auth, provider);
    const loginId = credential.user.email || credential.user.uid;
    const profile = await readProfile(credential.user, loginId);
    return sessionFromProfile(credential.user, profile, profile?.id || loginId);
  }

  async function logout() {
    await init();
    await modules.auth.signOut(auth);
  }

  async function sendPasswordResetEmail(loginId) {
    await init();
    const email = resolveLoginEmail(loginId);
    await modules.auth.sendPasswordResetEmail(auth, email);
    return true;
  }

  async function authStateOnce() {
    await init();
    return new Promise((resolve) => {
      let settled = false;
      const done = (user) => {
        if (settled) return;
        settled = true;
        resolve(user || null);
      };
      const unsubscribe = modules.auth.onAuthStateChanged(auth, (user) => {
        unsubscribe();
        done(user);
      }, () => done(null));
      setTimeout(() => done(auth.currentUser || null), 2200);
    });
  }

  async function getCurrentSession() {
    const user = await authStateOnce();
    if (!user) return null;
    const profile = await readProfile(user, user.email);
    return sessionFromProfile(user, profile, profile?.id || user.email);
  }

  async function getSiteConfig() {
    await init();
    const snap = await modules.firestore.getDoc(siteDocRef(modules.firestore));
    return snap.exists() ? snap.data() : null;
  }

  async function saveSiteConfig(configPatch) {
    await init();
    const user = auth.currentUser || await authStateOnce();
    if (!user) throw new Error("Firebase 저장은 로그인이 필요합니다.");
    await modules.firestore.setDoc(
      siteDocRef(modules.firestore),
      {
        ...configPatch,
        updatedAt: modules.firestore.serverTimestamp(),
        updatedAtMillis: Date.now(),
        updatedBy: user.email || user.uid,
      },
      { merge: true }
    );
    return true;
  }

  async function listUsers() {
    await init();
    const snap = await modules.firestore.getDocs(usersCollectionRef(modules.firestore));
    return snap.docs.map((doc) => ({ id: doc.data().id || doc.id, docId: doc.id, ...doc.data() }));
  }

  async function saveUserProfile(profile) {
    await init();
    const id = String(profile?.uid || profile?.id || "").trim();
    if (!id) throw new Error("사용자 프로필에는 id 또는 uid가 필요합니다.");
    await modules.firestore.setDoc(
      userDocRef(modules.firestore, id),
      {
        id: profile.id || id,
        name: profile.name || profile.id || id,
        email: String(profile.email || "").trim().toLowerCase(),
        role: profile.role || "staff",
        updatedAt: modules.firestore.serverTimestamp(),
      },
      { merge: true }
    );
    return true;
  }

  async function removeUserProfile(id) {
    await init();
    await modules.firestore.deleteDoc(userDocRef(modules.firestore, id));
    return true;
  }

  async function uploadNoticeImage(file) {
    await init();
    const user = auth.currentUser || await authStateOnce();
    if (!user) throw new Error("공지 이미지 업로드는 로그인이 필요합니다.");
    const base = cleanPath(config().paths?.noticeImages, "gaongil_notice_images").join("/");
    const safeName = String(file.name || "notice-image").replace(/[^\w.\-가-힣]+/g, "_").slice(0, 90);
    const path = `${base}/${new Date().toISOString().slice(0, 10)}/${Date.now()}-${safeName}`;
    const fileRef = modules.storage.ref(storage, path);
    const snapshot = await modules.storage.uploadBytes(fileRef, file, { contentType: file.type || "application/octet-stream" });
    return modules.storage.getDownloadURL(snapshot.ref);
  }

  global.GaongilFirebase = {
    isEnabled,
    hasConfig,
    init,
    login,
    loginWithGoogle,
    logout,
    sendPasswordResetEmail,
    getCurrentSession,
    getSiteConfig,
    saveSiteConfig,
    listUsers,
    saveUserProfile,
    removeUserProfile,
    uploadNoticeImage,
  };
})(window);
