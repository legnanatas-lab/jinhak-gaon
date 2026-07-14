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

  function normalizedEmail(value) {
    return String(value || "").trim().toLowerCase();
  }

  function adminEmails() {
    const aliases = config().loginAliases || {};
    return [
      aliases.admin,
      ...(Array.isArray(config().adminEmails) ? config().adminEmails : []),
    ].map(normalizedEmail).filter(Boolean);
  }

  function isConfiguredAdminEmail(email) {
    return adminEmails().includes(normalizedEmail(email));
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
    const aliasKey = Object.keys(aliases).find((key) => key.toLowerCase() === raw.toLowerCase());
    if (aliasKey && aliases[aliasKey]) return normalizedEmail(aliases[aliasKey]);
    if (raw.includes("@")) return normalizedEmail(raw);
    const domain = String(config().loginDomain || "").trim().replace(/^@/, "");
    if (domain) return `${raw}@${domain}`.toLowerCase();
    throw new Error("Firebase 로그인에는 이메일 주소가 필요합니다.");
  }

  function sessionFromProfile(user, profile, loginId, signInProvider) {
    const email = normalizedEmail(user?.email);
    const isGoogleAdmin = isConfiguredAdminEmail(email) && signInProvider === "google.com";
    return {
      // 관리자 권한은 지정된 이메일이 Google로 인증된 경우에만 부여합니다.
      id: isGoogleAdmin ? "admin" : String(profile?.id || loginId || email || user.uid).trim(),
      name: isGoogleAdmin ? "관리자" : String(profile?.name || email || "사용자").trim(),
      role: isGoogleAdmin ? "admin" : "staff",
      email,
      uid: user.uid,
      authProvider: signInProvider || "",
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
    return sessionFromProfile(credential.user, profile, loginId, "password");
  }

  async function loginWithGoogle() {
    await init();
    const provider = new modules.auth.GoogleAuthProvider();
    provider.setCustomParameters({ prompt: "select_account" });
    const credential = await modules.auth.signInWithPopup(auth, provider);
    const loginId = credential.user.email || credential.user.uid;
    const profile = await readProfile(credential.user, loginId);
    return sessionFromProfile(credential.user, profile, profile?.id || loginId, "google.com");
  }

  // Safari와 팝업 차단 환경에서도 동작하도록 Google 인증은 리디렉션 방식으로 시작한다.
  async function startGoogleLogin() {
    await init();
    const provider = new modules.auth.GoogleAuthProvider();
    provider.setCustomParameters({ prompt: "select_account" });
    await modules.auth.signInWithRedirect(auth, provider);
  }

  // Google 인증 후 이 페이지로 돌아왔을 때 세션을 복원한다.
  async function completeGoogleRedirect() {
    await init();
    const credential = await modules.auth.getRedirectResult(auth);
    const user = credential?.user || auth.currentUser;
    if (!user) return null;
    const provider = await currentSignInProvider(user);
    if (provider !== "google.com") return null;
    const loginId = user.email || user.uid;
    const profile = await readProfile(user, loginId);
    return sessionFromProfile(user, profile, profile?.id || loginId, "google.com");
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
      let unsubscribe = () => {};
      const done = (user) => {
        if (settled) return;
        settled = true;
        unsubscribe();
        resolve(user || null);
      };
      unsubscribe = modules.auth.onAuthStateChanged(auth, done, () => done(null));
      setTimeout(() => done(auth.currentUser || null), 900);
    });
  }

  async function currentSignInProvider(user) {
    const token = await user.getIdTokenResult().catch(() => null);
    return String(token?.claims?.firebase?.sign_in_provider || "").trim();
  }

  async function getCurrentSession() {
    const user = await authStateOnce();
    if (!user) return null;
    const profile = await readProfile(user, user.email);
    const signInProvider = await currentSignInProvider(user);
    return sessionFromProfile(user, profile, profile?.id || user.email, signInProvider);
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
    startGoogleLogin,
    completeGoogleRedirect,
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
