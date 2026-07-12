/*
  가온길 에듀 Firebase 연결 설정
  ------------------------------------------------------------
  1) Firebase 콘솔에서 Web App을 추가한 뒤 firebaseConfig 값을 아래에 넣습니다.
  2) enabled를 true로 바꾸면 Auth/Firestore/Storage 연결을 시도합니다.
  3) Firebase Web API key는 서버 비밀키가 아니지만, Firestore/Storage Rules가
     실제 보안을 담당하므로 firebase/firestore.rules, firebase/storage.rules를
     반드시 배포해 주세요.
*/
window.GAONGIL_FIREBASE_CONFIG = {
  enabled: true,
  sdkVersion: "12.16.0",
  allowLocalFallback: false,

  firebaseConfig: {
    apiKey: "AIzaSyAhHt7Ck_ZSkLo2F_0i0NjQnj9MDUmX95E",
    authDomain: "gaonjinhak.firebaseapp.com",
    databaseURL: "https://gaonjinhak-default-rtdb.asia-southeast1.firebasedatabase.app",
    projectId: "gaonjinhak",
    storageBucket: "gaonjinhak.firebasestorage.app",
    messagingSenderId: "669171741311",
    appId: "1:669171741311:web:82ae7c347d8a8eb48e454a",
    measurementId: "G-6DVHBR9TZ0",
  },

  // Firebase Auth는 이메일/비밀번호 로그인이 기본입니다.
  // 기존처럼 admin 아이디로 로그인하려면 admin 이메일을 아래 alias에 연결하세요.
  // 예: loginAliases: { admin: "admin@gaongil-edu.com" }
  // 교사 아이디를 teacher1처럼 입력받고 싶다면 loginDomain을 설정하면 teacher1@도메인으로 로그인합니다.
  loginDomain: "",
  loginAliases: {
    admin: "legnanatas@jbnu.ac.kr",
  },

  paths: {
    siteDoc: "gaongil_site/config",
    usersCollection: "gaongil_users",
    noticeImages: "gaongil_notice_images",
  },
};
