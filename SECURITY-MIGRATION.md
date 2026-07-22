# 가온길 에듀 보안 전환 메모

## 핵심 결론

GitHub Pages는 정적 호스팅입니다. HTML, CSS, JavaScript, JSON, 이미지처럼 브라우저에 전달된 파일은 사용자가 저장하거나 개발자 도구로 확인할 수 있습니다. 따라서 “HTML을 내려받아도 실제 자료가 함께 오지 않는 구조”를 만들려면 중요한 본문과 데이터 파일을 HTML 안에 두지 않고, Firebase Auth 인증 후 Firestore/Storage/Cloud Functions에서 받아오도록 바꿔야 합니다.

## 이번에 적용한 1차 보호

- 로그인 화면에서 기본 관리자 계정 안내 문구를 제거했습니다.
- 로그인/비밀번호 입력칸의 브라우저 자동완성·비밀번호 관리자 자동 노출을 최대한 억제했습니다.
- 보호 페이지에서 우클릭, 복사, 드래그, 저장, 인쇄, View Source, 개발자 도구 단축키를 차단하는 공통 방어 로직을 추가했습니다.
- 인쇄 시 실제 화면 대신 자료 보호 안내 문구만 출력되도록 했습니다.

이 조치는 무단 저장을 어렵게 만드는 억제 장치입니다. 이미 브라우저로 전송된 정적 자료를 완전히 숨기는 보안은 아닙니다.

## StudyCare/Railway 방식으로 가는 권장 구조

1. 보호 대상 자료를 분류합니다.
   - `susi.html`
   - `procollege6.html`
   - `2027gosa.html`
   - `jonghap_interview.html`
   - 대형 JSON/JS 데이터 파일
2. HTML에는 메뉴, 검색창, 로딩 화면 같은 껍데기 UI만 남깁니다.
3. 실제 본문과 데이터는 Firebase에 저장합니다.
   - Firestore: 게시판 공개 설정, 교사 권한, 공지사항, 작은 본문 데이터
   - Storage: 큰 JSON, 이미지, PDF, 첨부 파일
   - Cloud Functions: 권한 검사 후 데이터 내려주기
4. 페이지 로딩 흐름을 바꿉니다.
   - Firebase Auth 로그인 확인
   - 사용자의 역할과 페이지 권한 확인
   - 권한이 있을 때만 Firestore/Storage/Cloud Functions에서 자료 가져오기
5. GitHub Pages에는 공개 가능한 정적 껍데기만 배포합니다.

## Firestore 규칙 예시

```js
rules_version = '2';

service cloud.firestore {
  match /databases/{database}/documents {
    function signedIn() {
      return request.auth != null;
    }

    function isAdmin() {
      return signedIn() && request.auth.token.email == "legnanatas@jbnu.ac.kr";
    }

    match /gaongil_site/{doc} {
      allow read: if true;
      allow write: if isAdmin();
    }

    match /protected_pages/{doc} {
      allow read: if signedIn();
      allow write: if isAdmin();
    }

    match /protected_datasets/{doc} {
      allow read: if signedIn();
      allow write: if isAdmin();
    }
  }
}
```

## Firebase Authentication 설정 체크

Firebase Console → Authentication → 설정 → 승인된 도메인에 아래 도메인이 있어야 합니다.

- `legnanatas-lab.github.io`
- `gaonjinhak.firebaseapp.com`
- `gaonjinhak.web.app`
- 로컬 테스트 시 `localhost`

Google Cloud Console의 API 키 제한을 사용하는 경우에는 Identity Toolkit API와 위 도메인도 허용해야 합니다.
