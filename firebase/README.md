# 가온길 에듀 Firebase 전환 가이드

이 폴더는 GitHub Pages 정적 사이트를 Firebase Auth + Firestore + Storage 구조로 전환하기 위한 운영 파일입니다.

## 데이터 구조

- `gaongil_site/config`
  - `access.publicPages`: 로그인 없이 볼 수 있는 페이지 목록
  - `access.userPages`: 교사별 허용 페이지 목록
  - `notices.items`: 공지 팝업 목록
- `gaongil_site/config`는 방문자가 메뉴 공개 여부와 공지를 읽어야 하므로 공개 read를 허용합니다.
  write는 관리자만 가능합니다.
- `gaongil_users/{uid}`
  - Firebase Auth 사용자 프로필
  - `id`, `name`, `email`, `role`
  - 교사 계정은 Firestore 프로필의 `email`과 Firebase Auth 이메일이 같으면 연결됩니다.
- `gaongil_notice_images/...`
  - 공지 이미지 파일

## 적용 순서

1. Firebase 콘솔에서 프로젝트를 만들고 Web App을 추가합니다.
2. Authentication에서 Email/Password 로그인을 켭니다. Google 계정으로도 로그인하려면 Google 제공업체도 켭니다.
3. Firestore Database와 Storage를 생성합니다.
4. `assets/js/firebase-config.js`에 Firebase Web App 설정값을 넣고 `enabled: true`로 바꿉니다.
   - 현재 프로젝트: `gaonjinhak`
   - 현재 관리자 이메일: `legnanatas@jbnu.ac.kr`
5. `firebase/firestore.rules`, `firebase/storage.rules`의 관리자 이메일이 `legnanatas@jbnu.ac.kr`인지 확인한 뒤 Firebase 콘솔 Rules에 붙여넣고 Publish 합니다.
6. Firebase Authentication에서 같은 관리자 이메일 계정을 만듭니다.
   - Email/Password 방식: 사용자 계정을 만들고 비밀번호를 설정합니다.
   - Google 방식: `legnanatas@jbnu.ac.kr` Google 계정으로 로그인합니다.
7. 기존 `admin` 아이디를 유지하려면 `assets/js/firebase-config.js`의 `loginAliases.admin`에 관리자 이메일을 넣습니다. 현재 `admin`은 `legnanatas@jbnu.ac.kr`로 연결되어 있습니다.
8. 교사도 `teacher1` 같은 아이디로 로그인하게 하려면 `loginDomain`을 설정하고 Firebase Auth에는 `teacher1@도메인` 계정을 만들어 주세요.
9. Firebase CLI를 사용할 경우 저장소 루트에서 `firebase deploy --only firestore:rules,storage`로 Rules를 배포할 수 있습니다.

## 관리자 페이지 동작

- Firebase가 꺼져 있을 때: 기존처럼 브라우저 저장 또는 GitHub Pages 자동 반영 방식으로 동작합니다.
- Firebase가 켜져 있을 때:
  - 로그인은 Firebase Auth의 이메일/비밀번호 또는 Google 계정으로 처리됩니다.
  - `admin` 아이디 입력은 `loginAliases.admin`에 등록한 이메일로 변환됩니다.
  - 게시판 공개/교사별 권한 설정과 공지 설정은 Firestore `gaongil_site/config`에 저장됩니다.
  - 공지 이미지 파일은 Storage `gaongil_notice_images/...`에 업로드되고, 공지 설정에는 다운로드 URL이 저장됩니다.

## 주의

Firebase 설정값(API key 등)은 웹앱에 공개되는 값입니다. 실제 보안은 Firestore/Storage Rules와 Firebase Auth가 담당합니다.
교사 계정을 관리자 화면에서 완전히 생성하려면 Cloud Functions(Admin SDK) 추가가 필요합니다. 현재 정적 Pages 구조에서는 관리자 화면이 Firestore 사용자 프로필을 저장하고, Firebase Auth 계정 생성은 콘솔에서 하는 방식을 권장합니다.
Firebase 전환 후 비밀번호 변경/분실 처리는 Firebase Authentication의 비밀번호 재설정 메일 기능을 쓰는 것이 안전합니다.
