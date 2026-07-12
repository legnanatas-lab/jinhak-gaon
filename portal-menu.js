(function () {
  const groups = [
  {
    "key": "hub_admission-start",
    "label": "대입 처음 보기",
    "href": "section.html?page=admission-start.html",
    "subtitle": "처음 방문한 학생·학부모를 위한 핵심 자료 큐레이션",
    "pages": [
      {
        "title": "2028학년도 대입전형의 이해 (초급자용)",
        "url": "2028guide.html",
        "current": "대입 처음 보기",
        "tags": [
          "2028",
          "guide",
          "start"
        ],
        "status": "보유",
        "brandNote": "가온길 에듀 · 가온길 에듀 입시전략연구소",
        "key": "guide2028"
      },
      {
        "title": "2027학년도 대입전형의 이해(초급자용)",
        "url": "2027admissions2.html",
        "current": "대입 처음 보기",
        "tags": [
          "2027",
          "guide",
          "start"
        ],
        "status": "보유",
        "brandNote": "가온길 에듀 · 가온길 에듀 입시전략연구소",
        "key": "admissions2027"
      },
      {
        "title": "학생부종합전형에 대한 이해(초급자용)",
        "url": "hakjongguide.html",
        "current": "대입 처음 보기",
        "tags": [
          "student",
          "hakjong",
          "guide"
        ],
        "status": "보유",
        "brandNote": "가온길 에듀 · 가온길 에듀 입시전략연구소",
        "key": "hakjongguide"
      },
      {
        "title": "2026 대학발표 입시결과 조회 (수시결과)",
        "url": "susi.html?v=26",
        "current": "입시결과 조회",
        "tags": [
          "results",
          "susi",
          "2026"
        ],
        "status": "보유",
        "brandNote": "가온길 에듀 · 가온길 에듀 입시전략연구소",
        "key": "susi"
      },
      {
        "title": "2026 정시(수능위주) 입시결과 조회 (정시결과)",
        "url": "jeongsi/index.html?v=26",
        "current": "입시결과 조회",
        "tags": [
          "results",
          "jeongsi",
          "2026"
        ],
        "status": "보유",
        "brandNote": "가온길 에듀 · 가온길 에듀 입시전략연구소",
        "key": "jeongsi"
      },
      {
        "title": "2028 수능 대비 방법(5개 교과)",
        "url": "csat2028.html",
        "current": "학습 준비",
        "tags": [
          "2028",
          "csat",
          "study"
        ],
        "status": "보유",
        "brandNote": "가온길 에듀 · 가온길 에듀 입시전략연구소",
        "key": "csat2028"
      },
      {
        "title": "고등학생을 위한 내신 공부 방법",
        "url": "preview.html",
        "current": "학습 준비",
        "tags": [
          "study",
          "student"
        ],
        "status": "보유",
        "brandNote": "가온길 에듀 · 가온길 에듀 입시전략연구소",
        "key": "preview"
      },
      {
        "title": "1·2학년을 위한 진로·학업 설계",
        "url": "jinrodesign.html",
        "current": "진로 설계",
        "tags": [
          "student",
          "career"
        ],
        "status": "보유",
        "brandNote": "가온길 에듀 · 가온길 에듀 입시전략연구소",
        "key": "jinrodesign"
      },
      {
        "title": "전국 4년제 대학입학 안내 지도",
        "url": "unimap.html",
        "current": "대학 탐색",
        "tags": [
          "map",
          "university"
        ],
        "status": "보유",
        "brandNote": "가온길 에듀 · 가온길 에듀 입시전략연구소",
        "key": "unimap"
      },
      {
        "title": "전국 전문대학 입학 안내 지도",
        "url": "2unimap.html",
        "current": "대학 탐색",
        "tags": [
          "map",
          "college"
        ],
        "status": "보유",
        "brandNote": "가온길 에듀 · 가온길 에듀 입시전략연구소",
        "key": "twounimap"
      }
    ]
  },
  {
    "key": "hub_admission-results",
    "label": "원문자료",
    "href": "section.html?page=admission-results.html",
    "subtitle": "수시·정시 입시결과 조회 + 원문 다운로드",
    "pages": [
      {
        "title": "2026 대학별 입시결과 원문 다운로드",
        "url": "2026results-download.html",
        "current": "원문 다운로드",
        "tags": [
          "download",
          "results",
          "2026"
        ],
        "status": "보유",
        "brandNote": "가온길 에듀 · 가온길 에듀 입시전략연구소",
        "key": "results2026download"
      },
      {
        "title": "2026 선행학습영향평가 결과보고서 원문 다운로드",
        "url": "2026prelearning-report.html",
        "current": "원문 다운로드",
        "tags": [
          "download",
          "prelearning",
          "2026"
        ],
        "status": "보유",
        "brandNote": "가온길 에듀 · 가온길 에듀 입시전략연구소",
        "key": "prelearning2026"
      },
      {
        "title": "2027 학생부종합전형 가이드북 원문 다운로드",
        "url": "2027hakjong-guide.html",
        "current": "원문 다운로드",
        "tags": [
          "download",
          "2027",
          "hakjong"
        ],
        "status": "보유",
        "brandNote": "가온길 에듀 · 가온길 에듀 입시전략연구소",
        "key": "hakjongguide2027"
      },
      {
        "title": "대학별 수시모집요강 원문 다운로드",
        "url": "2027susi-download.html",
        "current": "원문 다운로드",
        "tags": [
          "download",
          "susi",
          "2027"
        ],
        "status": "보유",
        "brandNote": "가온길 에듀 · 가온길 에듀 입시전략연구소",
        "key": "susiDownload2027"
      },
      {
        "title": "2028 대학입학전형시행계획 원문 다운로드",
        "url": "2028admission-plan-download.html",
        "current": "원문 다운로드",
        "tags": [
          "download",
          "2028",
          "plan"
        ],
        "status": "보유",
        "brandNote": "가온길 에듀 · 가온길 에듀 입시전략연구소",
        "key": "admissionPlan2028"
      }
    ]
  },
  {
    "key": "hub_admission-2027",
    "label": "2027 학년도 대입",
    "href": "section.html?page=admission-2027.html",
    "subtitle": "2027학년도 대입전형 관련 자료",
    "pages": [
      {
        "title": "2027학년도 수시 대학별고사 일정 캘린더",
        "url": "2027gosa.html",
        "current": "수시 일정",
        "tags": [
          "2027",
          "susi",
          "calendar"
        ],
        "status": "보유",
        "brandNote": "가온길 에듀 · 가온길 에듀 입시전략연구소",
        "key": "gosa2027"
      },
      {
        "title": "2027학년도 대입전형의 이해(초급자용)",
        "url": "2027admissions2.html",
        "current": "대입 이해",
        "tags": [
          "2027",
          "guide"
        ],
        "status": "보유",
        "brandNote": "가온길 에듀 · 가온길 에듀 입시전략연구소",
        "key": "admissions2027"
      },
      {
        "title": "2027학생부종합전형 서류평가 기준 비교",
        "url": "jonghap_eval.html",
        "current": "학생부종합전형",
        "tags": [
          "2027",
          "student",
          "hakjong"
        ],
        "status": "보유",
        "brandNote": "가온길 에듀 · 가온길 에듀 입시전략연구소",
        "key": "jonghap_eval"
      },
      {
        "title": "2027학년도 학생부종합전형 면접평가 기준 비교",
        "url": "jonghap_interview.html",
        "current": "학생부종합전형",
        "tags": [
          "2027",
          "student",
          "interview"
        ],
        "status": "보유",
        "brandNote": "가온길 에듀 · 가온길 에듀 입시전략연구소",
        "key": "jonghap_interview"
      },
      {
        "title": "학생부 활동·탐구 면접 질문 생성",
        "url": "student_record_interview.html",
        "current": "학생부종합전형",
        "tags": [
          "2027",
          "student",
          "interview",
          "tool"
        ],
        "status": "보유",
        "brandNote": "가온길 에듀 · 가온길 에듀 입시전략연구소",
        "key": "student_record_interview"
      },
      {
        "title": "2027학년도 농어촌학생 특별전형",
        "url": "2027special.html",
        "current": "특별전형",
        "tags": [
          "2027",
          "special"
        ],
        "status": "보유",
        "brandNote": "가온길 에듀 · 가온길 에듀 입시전략연구소",
        "key": "special2027"
      },
      {
        "title": "2027학년도 지역인재 특별전형",
        "url": "localmedi.html",
        "current": "특별전형",
        "tags": [
          "2027",
          "local"
        ],
        "status": "보유",
        "brandNote": "가온길 에듀 · 가온길 에듀 입시전략연구소",
        "key": "localmedi"
      },
      {
        "title": "2027학년도 학생부교과전형",
        "url": "2027gyogwa.html",
        "current": "학생부교과전형",
        "tags": [
          "2027",
          "gyogwa"
        ],
        "status": "보유",
        "brandNote": "가온길 에듀 · 가온길 에듀 입시전략연구소",
        "key": "gyogwa2027"
      },
      {
        "title": "2027학년도 학교장추천전형",
        "url": "2027chuchon.html",
        "current": "학생부교과전형",
        "tags": [
          "2027",
          "recommend"
        ],
        "status": "보유",
        "brandNote": "가온길 에듀 · 가온길 에듀 입시전략연구소",
        "key": "chuchon2027"
      },
      {
        "title": "2027 계약학과 첨단학과 안내",
        "url": "2027cheomdan.html",
        "current": "특성화 학과",
        "tags": [
          "2027",
          "major",
          "special"
        ],
        "status": "보유",
        "brandNote": "가온길 에듀 · 가온길 에듀 입시전략연구소",
        "key": "cheomdan2027"
      },
      {
        "title": "2027 지역의사선발전형",
        "url": "2027medi.html",
        "current": "특별전형",
        "tags": [
          "2027",
          "medical",
          "local"
        ],
        "status": "보유",
        "brandNote": "가온길 에듀 · 가온길 에듀 입시전략연구소",
        "key": "medi2027"
      },
      {
        "title": "2027학년도 의예·치의예·한의예·약학·수의예 수시전형 탐색기",
        "url": "2027uichihan.html",
        "current": "의약학계열",
        "tags": [
          "2027",
          "medical",
          "susi"
        ],
        "status": "보유",
        "brandNote": "가온길 에듀 · 가온길 에듀 입시전략연구소",
        "key": "uichihan2027"
      },
      {
        "title": "2027학년도 예체능계열 비실기전형 안내",
        "url": "2027yeche.html",
        "current": "예체능계열",
        "tags": [
          "2027",
          "arts",
          "pe"
        ],
        "status": "보유",
        "brandNote": "가온길 에듀 · 가온길 에듀 입시전략연구소",
        "key": "yeche2027"
      },
      {
        "title": "2027학년도 특성화고 기준학과",
        "url": "2027-specialized-highschool-standards.html",
        "current": "특성화고",
        "tags": [
          "2027",
          "specialized"
        ],
        "status": "보유",
        "brandNote": "가온길 에듀 · 가온길 에듀 입시전략연구소",
        "key": "specialized2027"
      },
      {
        "title": "2026~2028 체육대학 요강 정리",
        "url": "2026_2028py.html",
        "current": "체육계열",
        "tags": [
          "2026",
          "2027",
          "2028",
          "pe"
        ],
        "status": "보유",
        "brandNote": "가온길 에듀 · 가온길 에듀 입시전략연구소",
        "key": "pe2026_2028"
      },
      {
        "title": "2026 대학발표 입시결과 조회 (수시결과)",
        "url": "susi.html?v=26",
        "current": "입시결과 조회",
        "tags": [
          "results",
          "susi",
          "2026"
        ],
        "status": "보유",
        "brandNote": "가온길 에듀 · 가온길 에듀 입시전략연구소",
        "key": "susi"
      },
      {
        "title": "2026 정시(수능위주) 입시결과 조회 (정시결과)",
        "url": "jeongsi/index.html?v=26",
        "current": "입시결과 조회",
        "tags": [
          "results",
          "jeongsi",
          "2026"
        ],
        "status": "보유",
        "brandNote": "가온길 에듀 · 가온길 에듀 입시전략연구소",
        "key": "jeongsi"
      },
      {
        "title": "2026 전문대학 간호·보건 6개학과 3개년 입시결과",
        "url": "procollege6.html",
        "current": "입시결과 조회",
        "tags": [
          "results",
          "college",
          "health"
        ],
        "status": "보유",
        "brandNote": "가온길 에듀 · 가온길 에듀 입시전략연구소",
        "key": "procollege6"
      }
    ]
  },
  {
    "key": "hub_admission-2028",
    "label": "2028 학년도 대입",
    "href": "section.html?page=admission-2028.html",
    "subtitle": "2028학년도 대입제도 개편 관련 자료",
    "pages": [
      {
        "title": "2028 학생부교과전형의 변화",
        "url": "2028gyogwa-change.html",
        "current": "교과전형",
        "tags": [
          "2028",
          "gyogwa",
          "change"
        ],
        "status": "보유",
        "brandNote": "가온길 에듀 · 가온길 에듀 입시전략연구소",
        "key": "gyogwaChange2028"
      },
      {
        "title": "2028 학생부 종합전형",
        "url": "hakjong2028.html",
        "current": "학생부종합전형",
        "tags": [
          "2028",
          "hakjong"
        ],
        "status": "보유",
        "brandNote": "가온길 에듀 · 가온길 에듀 입시전략연구소",
        "key": "hakjong2028"
      },
      {
        "title": "2028 수능최저 빠른보기",
        "url": "2028castrow.html",
        "current": "수능최저",
        "tags": [
          "2028",
          "csat"
        ],
        "status": "보유",
        "brandNote": "가온길 에듀 · 가온길 에듀 입시전략연구소",
        "key": "castrow2028"
      },
      {
        "title": "2028 수능·정시 안내",
        "url": "2028suneung.html",
        "current": "수능·정시",
        "tags": [
          "2028",
          "csat",
          "jeongsi"
        ],
        "status": "보유",
        "brandNote": "가온길 에듀 · 가온길 에듀 입시전략연구소",
        "key": "suneung2028"
      },
      {
        "title": "2028 교과반영방법",
        "url": "2028gyogwa.html",
        "current": "교과전형",
        "tags": [
          "2028",
          "gyogwa"
        ],
        "status": "보유",
        "brandNote": "가온길 에듀 · 가온길 에듀 입시전략연구소",
        "key": "gyogwa2028"
      },
      {
        "title": "2028 대입변화비교",
        "url": "jinhak2028.html",
        "current": "대입 변화 비교",
        "tags": [
          "2028",
          "change"
        ],
        "status": "보유",
        "brandNote": "가온길 에듀 · 가온길 에듀 입시전략연구소",
        "key": "jinhak2028"
      },
      {
        "title": "15개 대학 입학전형",
        "url": "202815uni.html",
        "current": "대학별 시행계획",
        "tags": [
          "2028",
          "university"
        ],
        "status": "보유",
        "brandNote": "가온길 에듀 · 가온길 에듀 입시전략연구소",
        "key": "uni15_2028"
      },
      {
        "title": "2026(2028대비) 70% 교과전형 컷 대학찾기",
        "url": "gyogwa70cut.html?v=25",
        "current": "2028 대비 컷",
        "tags": [
          "2028",
          "cut",
          "gyogwa"
        ],
        "status": "보유",
        "brandNote": "가온길 에듀 · 가온길 에듀 입시전략연구소",
        "key": "gyogwa70cut"
      },
      {
        "title": "2026(2028대비) 70% 학생부종합전형 컷 대학찾기",
        "url": "jonghap70cut.html?v=25",
        "current": "2028 대비 컷",
        "tags": [
          "2028",
          "cut",
          "hakjong"
        ],
        "status": "보유",
        "brandNote": "가온길 에듀 · 가온길 에듀 입시전략연구소",
        "key": "jonghap70cut"
      },
      {
        "title": "2028학년도 대입전형의 이해 (초급자용)",
        "url": "2028guide.html",
        "current": "대입 이해",
        "tags": [
          "2028",
          "guide"
        ],
        "status": "보유",
        "brandNote": "가온길 에듀 · 가온길 에듀 입시전략연구소",
        "key": "guide2028"
      },
      {
        "title": "2028 대입 논술전형",
        "url": "2028nonsul.html",
        "current": "논술전형",
        "tags": [
          "2028",
          "nonsul"
        ],
        "status": "보유",
        "brandNote": "가온길 에듀 · 가온길 에듀 입시전략연구소",
        "key": "nonsul2028"
      },
      {
        "title": "2028 과학기술원시행계획",
        "url": "2028ist.html",
        "current": "특수대학군",
        "tags": [
          "2028",
          "ist",
          "science"
        ],
        "status": "보유",
        "brandNote": "가온길 에듀 · 가온길 에듀 입시전략연구소",
        "key": "ist2028"
      },
      {
        "title": "2028 교육대학 시행계획",
        "url": "2028edu.html",
        "current": "특수대학군",
        "tags": [
          "2028",
          "education"
        ],
        "status": "보유",
        "brandNote": "가온길 에듀 · 가온길 에듀 입시전략연구소",
        "key": "edu2028"
      },
      {
        "title": "2026~2028 체육대학 요강 정리",
        "url": "2026_2028py.html",
        "current": "체육계열",
        "tags": [
          "2026",
          "2027",
          "2028",
          "pe"
        ],
        "status": "보유",
        "brandNote": "가온길 에듀 · 가온길 에듀 입시전략연구소",
        "key": "pe2026_2028"
      }
    ]
  },
  {
    "key": "hub_student-support",
    "label": "학생부·진로·탐구",
    "href": "section.html?page=student-support.html",
    "subtitle": "학생부종합전형, 진로설계, 탐구활동 가이드",
    "pages": [
      {
        "title": "1·2학년을 위한 진로·학업 설계",
        "url": "jinrodesign.html",
        "current": "진로·학업 설계",
        "tags": [
          "student",
          "career"
        ],
        "status": "보유",
        "brandNote": "가온길 에듀 · 가온길 에듀 입시전략연구소",
        "key": "jinrodesign"
      },
      {
        "title": "전공별 선택과목 설계",
        "url": "sub2.html",
        "current": "진로·학업 설계",
        "tags": [
          "student",
          "subject",
          "major"
        ],
        "status": "보유",
        "brandNote": "가온길 에듀 · 가온길 에듀 입시전략연구소",
        "key": "sub2"
      },
      {
        "title": "학생부종합전형 대비 과학교과 탐구 방법",
        "url": "sciencetam.html",
        "current": "탐구활동",
        "tags": [
          "science",
          "student",
          "research"
        ],
        "status": "보유",
        "brandNote": "가온길 에듀 · 가온길 에듀 입시전략연구소",
        "key": "sciencetam"
      },
      {
        "title": "학생부종합전형 대비 사회교과 탐구 방법",
        "url": "socialtam.html",
        "current": "탐구활동",
        "tags": [
          "social",
          "student",
          "research"
        ],
        "status": "보유",
        "brandNote": "가온길 에듀 · 가온길 에듀 입시전략연구소",
        "key": "socialtam"
      },
      {
        "title": "데이터 기반 지구과학 탐구 주제",
        "url": "aisc.html",
        "current": "탐구활동",
        "tags": [
          "science",
          "data",
          "research"
        ],
        "status": "보유",
        "brandNote": "가온길 에듀 · 가온길 에듀 입시전략연구소",
        "key": "aisc"
      },
      {
        "title": "AI 데이터분석 가이드",
        "url": "ai_prompt.html",
        "current": "탐구활동",
        "tags": [
          "ai",
          "data",
          "research"
        ],
        "status": "보유",
        "brandNote": "가온길 에듀 · 가온길 에듀 입시전략연구소",
        "key": "ai_prompt"
      },
      {
        "title": "생기부 글자수 점검 도우미",
        "url": "saenggibu_check.html",
        "current": "학생부 도구",
        "tags": [
          "student",
          "tool"
        ],
        "status": "보유",
        "brandNote": "가온길 에듀 · 가온길 에듀 입시전략연구소",
        "key": "saenggibu_check"
      },
      {
        "title": "2027 대학별 개설학과·모집인원 검색",
        "url": "2027uni.html",
        "current": "대학·학과 검색",
        "tags": [
          "2027",
          "university",
          "major"
        ],
        "status": "보유",
        "brandNote": "가온길 에듀 · 가온길 에듀 입시전략연구소",
        "key": "uni2027"
      },
      {
        "title": "2026 학교생활기록부 기재요령",
        "url": "studentguide.html",
        "current": "학생부 지침",
        "tags": [
          "2026",
          "student",
          "guide"
        ],
        "status": "보유",
        "brandNote": "가온길 에듀 · 가온길 에듀 입시전략연구소",
        "key": "studentguide"
      },
      {
        "title": "2026 고등학교 성적관리 시행지침",
        "url": "seongjeok2026.html",
        "current": "학교생활 지침",
        "tags": [
          "2026",
          "school",
          "grade"
        ],
        "status": "보유",
        "brandNote": "가온길 에듀 · 가온길 에듀 입시전략연구소",
        "key": "seongjeok2026"
      },
      {
        "title": "2026 고등학교 전입학 및 재입학 업무처리 지침",
        "url": "placeholder.html?item=transfer2026",
        "current": "학교생활 지침",
        "tags": [
          "2026",
          "school",
          "transfer"
        ],
        "status": "신규",
        "brandNote": "가온길 에듀 · 가온길 에듀 입시전략연구소",
        "key": "transfer2026"
      },
      {
        "title": "학생부종합전형에 대한 이해(초급자용)",
        "url": "hakjongguide.html",
        "current": "학생부종합전형",
        "tags": [
          "student",
          "hakjong",
          "guide"
        ],
        "status": "보유",
        "brandNote": "가온길 에듀 · 가온길 에듀 입시전략연구소",
        "key": "hakjongguide"
      }
    ]
  },
  {
    "key": "hub_teaching-materials",
    "label": "수업자료",
    "href": "section.html?page=teaching-materials.html",
    "subtitle": "2022 개정교육과정 교과별 수업자료 및 학습법",
    "pages": [
      {
        "title": "[2022개정] 물리 수업",
        "url": "soouppy.html",
        "current": "과학 수업자료",
        "tags": [
          "teaching",
          "2022",
          "physics"
        ],
        "status": "보유",
        "brandNote": "가온길 에듀 · 가온길 에듀 입시전략연구소",
        "key": "soouppy"
      },
      {
        "title": "[2022개정] 화학 수업",
        "url": "sooupch.html",
        "current": "과학 수업자료",
        "tags": [
          "teaching",
          "2022",
          "chemistry"
        ],
        "status": "보유",
        "brandNote": "가온길 에듀 · 가온길 에듀 입시전략연구소",
        "key": "sooupch"
      },
      {
        "title": "[2022개정] 생명과학 수업",
        "url": "sooupbio.html",
        "current": "과학 수업자료",
        "tags": [
          "teaching",
          "2022",
          "biology"
        ],
        "status": "보유",
        "brandNote": "가온길 에듀 · 가온길 에듀 입시전략연구소",
        "key": "sooupbio"
      },
      {
        "title": "[2022개정] 지구과학 수업",
        "url": "sooupes.html",
        "current": "과학 수업자료",
        "tags": [
          "teaching",
          "2022",
          "earth"
        ],
        "status": "보유",
        "brandNote": "가온길 에듀 · 가온길 에듀 입시전략연구소",
        "key": "sooupes"
      },
      {
        "title": "[2022개정] 대수 수업",
        "url": "sooupalg.html",
        "current": "수학 수업자료",
        "tags": [
          "teaching",
          "2022",
          "math"
        ],
        "status": "보유",
        "brandNote": "가온길 에듀 · 가온길 에듀 입시전략연구소",
        "key": "sooupalg"
      },
      {
        "title": "[2022개정] 미적분Ⅰ 수업",
        "url": "sooupcalc1.html",
        "current": "수학 수업자료",
        "tags": [
          "teaching",
          "2022",
          "math"
        ],
        "status": "보유",
        "brandNote": "가온길 에듀 · 가온길 에듀 입시전략연구소",
        "key": "sooupcalc1"
      },
      {
        "title": "[2022개정] 확률과 통계 수업",
        "url": "sooupprobstat.html",
        "current": "수학 수업자료",
        "tags": [
          "teaching",
          "2022",
          "math"
        ],
        "status": "보유",
        "brandNote": "가온길 에듀 · 가온길 에듀 입시전략연구소",
        "key": "sooupprobstat"
      },
      {
        "title": "[2022개정] 영어Ⅰ 수업",
        "url": "sooupeng1.html",
        "current": "영어 수업자료",
        "tags": [
          "teaching",
          "2022",
          "english"
        ],
        "status": "보유",
        "brandNote": "가온길 에듀 · 가온길 에듀 입시전략연구소",
        "key": "sooupeng1"
      },
      {
        "title": "[2022개정] 영어Ⅱ 수업",
        "url": "sooupeng2.html",
        "current": "영어 수업자료",
        "tags": [
          "teaching",
          "2022",
          "english"
        ],
        "status": "보유",
        "brandNote": "가온길 에듀 · 가온길 에듀 입시전략연구소",
        "key": "sooupeng2"
      },
      {
        "title": "[2022개정] 영어 독해와 작문 수업",
        "url": "sooupengrw.html",
        "current": "영어 수업자료",
        "tags": [
          "teaching",
          "2022",
          "english"
        ],
        "status": "보유",
        "brandNote": "가온길 에듀 · 가온길 에듀 입시전략연구소",
        "key": "sooupengrw"
      },
      {
        "title": "[2022개정] 세계시민과 지리 수업",
        "url": "sooupgeo.html",
        "current": "사회 수업자료",
        "tags": [
          "teaching",
          "2022",
          "social"
        ],
        "status": "보유",
        "brandNote": "가온길 에듀 · 가온길 에듀 입시전략연구소",
        "key": "sooupgeo"
      },
      {
        "title": "[2022개정] 사회와 문화 수업",
        "url": "sooupsoc.html",
        "current": "사회 수업자료",
        "tags": [
          "teaching",
          "2022",
          "social"
        ],
        "status": "보유",
        "brandNote": "가온길 에듀 · 가온길 에듀 입시전략연구소",
        "key": "sooupsoc"
      },
      {
        "title": "[2022개정] 세계사 수업",
        "url": "sooupwh.html",
        "current": "사회 수업자료",
        "tags": [
          "teaching",
          "2022",
          "history"
        ],
        "status": "보유",
        "brandNote": "가온길 에듀 · 가온길 에듀 입시전략연구소",
        "key": "sooupwh"
      },
      {
        "title": "[2022개정] 현대사회와 윤리 수업",
        "url": "sooupeth.html",
        "current": "사회 수업자료",
        "tags": [
          "teaching",
          "2022",
          "ethics"
        ],
        "status": "보유",
        "brandNote": "가온길 에듀 · 가온길 에듀 입시전략연구소",
        "key": "sooupeth"
      },
      {
        "title": "[2022개정] 화법과 언어 수업",
        "url": "sooupkor.html",
        "current": "국어 수업자료",
        "tags": [
          "teaching",
          "2022",
          "korean"
        ],
        "status": "보유",
        "brandNote": "가온길 에듀 · 가온길 에듀 입시전략연구소",
        "key": "sooupkor"
      },
      {
        "title": "[2022개정] 독서와 작문 수업",
        "url": "sooupdw.html",
        "current": "국어 수업자료",
        "tags": [
          "teaching",
          "2022",
          "korean"
        ],
        "status": "보유",
        "brandNote": "가온길 에듀 · 가온길 에듀 입시전략연구소",
        "key": "sooupdw"
      },
      {
        "title": "[2022개정] 문학 수업",
        "url": "soouplit.html",
        "current": "국어 수업자료",
        "tags": [
          "teaching",
          "2022",
          "korean"
        ],
        "status": "보유",
        "brandNote": "가온길 에듀 · 가온길 에듀 입시전략연구소",
        "key": "soouplit"
      },
      {
        "title": "2028 수능 대비 방법(5개 교과)",
        "url": "csat2028.html",
        "current": "학습법 가이드",
        "tags": [
          "2028",
          "csat",
          "study"
        ],
        "status": "보유",
        "brandNote": "가온길 에듀 · 가온길 에듀 입시전략연구소",
        "key": "csat2028"
      },
      {
        "title": "고등학생을 위한 내신 공부 방법",
        "url": "preview.html",
        "current": "학습법 가이드",
        "tags": [
          "study",
          "student"
        ],
        "status": "보유",
        "brandNote": "가온길 에듀 · 가온길 에듀 입시전략연구소",
        "key": "preview"
      },
      {
        "title": "입시 동영상 모음",
        "url": "dong.html",
        "current": "동영상 자료",
        "tags": [
          "video",
          "admission"
        ],
        "status": "보유",
        "brandNote": "가온길 에듀 · 가온길 에듀 입시전략연구소",
        "key": "dong"
      }
    ]
  },
  {
    "key": "hub_statistics",
    "label": "통계·채점결과·지도",
    "href": "section.html?page=statistics.html",
    "subtitle": "모의고사·학력평가 결과, 등록금 통계, 각종 지도",
    "pages": [
      {
        "title": "2026 대학수학능력시험",
        "url": "placeholder.html?item=cast2026",
        "current": "수능·모의평가",
        "tags": [
          "2026",
          "csat",
          "statistics"
        ],
        "status": "신규",
        "brandNote": "가온길 에듀 · 가온길 에듀 입시전략연구소",
        "key": "cast2026"
      },
      {
        "title": "2027학년도 6월 대수능 모의평가 분석",
        "url": "placeholder.html?item=juneMock2027",
        "current": "수능·모의평가",
        "tags": [
          "2027",
          "mock",
          "analysis"
        ],
        "status": "신규",
        "brandNote": "가온길 에듀 · 가온길 에듀 입시전략연구소",
        "key": "juneMock2027"
      },
      {
        "title": "2027학년도 6월 모의평가 채점 결과",
        "url": "placeholder.html?item=cast20276",
        "current": "수능·모의평가",
        "tags": [
          "2027",
          "mock",
          "statistics"
        ],
        "status": "신규",
        "brandNote": "가온길 에듀 · 가온길 에듀 입시전략연구소",
        "key": "cast20276"
      },
      {
        "title": "대학별 연간 평균 등록금",
        "url": "unimo.html",
        "current": "대학 통계",
        "tags": [
          "statistics",
          "tuition"
        ],
        "status": "보유",
        "brandNote": "가온길 에듀 · 가온길 에듀 입시전략연구소",
        "key": "unimo"
      },
      {
        "title": "2026학년도 3월 고3 전국연합학력평가",
        "url": "placeholder.html?item=cast20265",
        "current": "전국연합학력평가",
        "tags": [
          "2026",
          "mock",
          "grade3"
        ],
        "status": "신규",
        "brandNote": "가온길 에듀 · 가온길 에듀 입시전략연구소",
        "key": "cast20265"
      },
      {
        "title": "2026학년도 고1 전국연합학력평가",
        "url": "placeholder.html?item=cast20266g1",
        "current": "전국연합학력평가",
        "tags": [
          "2026",
          "mock",
          "grade1"
        ],
        "status": "신규",
        "brandNote": "가온길 에듀 · 가온길 에듀 입시전략연구소",
        "key": "cast20266g1"
      },
      {
        "title": "2026학년도 고2 전국연합학력평가",
        "url": "placeholder.html?item=cast20266g2",
        "current": "전국연합학력평가",
        "tags": [
          "2026",
          "mock",
          "grade2"
        ],
        "status": "신규",
        "brandNote": "가온길 에듀 · 가온길 에듀 입시전략연구소",
        "key": "cast20266g2"
      },
      {
        "title": "전국 고등학교 지도",
        "url": "highschoolmap.html",
        "current": "지도 자료",
        "tags": [
          "map",
          "school"
        ],
        "status": "보유",
        "brandNote": "가온길 에듀 · 가온길 에듀 입시전략연구소",
        "key": "highschoolmap"
      },
      {
        "title": "전국 4년제 대학입학 안내 지도",
        "url": "unimap.html",
        "current": "지도 자료",
        "tags": [
          "map",
          "university"
        ],
        "status": "보유",
        "brandNote": "가온길 에듀 · 가온길 에듀 입시전략연구소",
        "key": "unimap"
      },
      {
        "title": "전국 전문대학 입학 안내 지도",
        "url": "2unimap.html",
        "current": "지도 자료",
        "tags": [
          "map",
          "college"
        ],
        "status": "보유",
        "brandNote": "가온길 에듀 · 가온길 에듀 입시전략연구소",
        "key": "twounimap"
      }
    ]
  }
];

  const allPages = groups.flatMap((group) => [
    { key: group.key, label: group.label, href: group.href, subtitle: group.subtitle, hub: true, groupKey: group.key },
    ...group.pages.map((page) => ({ ...page, label: page.title || page.label, href: page.url, groupKey: group.key })),
  ]);

  function escapeHtml(value) {
    return String(value || "")
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;")
      .replace(/'/g, "&#039;");
  }

  function rootPrefix() {
    if (document.body.dataset.gaongilRoot) return document.body.dataset.gaongilRoot;
    const path = location.pathname;
    return (path.includes("/jeongsi/") ||
      path.includes("/placeholder.html?item=juneMock2027") ||
      path.includes("/2027-specialized-highschool-standards/")) ? "../" : "./";
  }

  function cleanHref(href) {
    return String(href || "").split("?")[0].replace(/^\.\//, "");
  }

  function currentKey() {
    const explicit = document.body.dataset.gaongilPage;
    const explicitExists = explicit && allPages.some((page) => page.key === explicit);
    if (explicitExists) return explicit;

    const path = location.pathname.split("\\").join("/");
    if (path.endsWith("/jeongsi/") || path.endsWith("/jeongsi/index.html")) return "jeongsi";
    if (path.endsWith("/placeholder.html?item=juneMock2027") || path.endsWith("/placeholder.html?item=juneMock2027")) return "juneMock2027";
    if (path.endsWith("/2027-specialized-highschool-standards/") || path.endsWith("/2027-specialized-highschool-standards/index.html")) return "specialized2027";

    const match = allPages.find((page) => {
      const href = cleanHref(page.href);
      return href && path.endsWith("/" + href);
    });
    return match ? match.key : "";
  }

  function normalizeHref(base, href) {
    if (!href) return "#";
    if (/^https?:\/\//i.test(href)) return href;
    return base + href.replace(/^\.\//, "");
  }

  function resolveCurrentGroupKey(current) {
    if (!current) return "";

    const hubGroup = groups.find((group) => group.key === current);
    if (hubGroup) return hubGroup.key;

    const matchedGroups = groups.filter((group) =>
      group.pages.some((page) => page.key === current)
    );
    if (!matchedGroups.length) return "";

    // '대입 처음 보기'는 여러 자료를 모아 보여주는 큐레이션 탭입니다.
    // 같은 자료가 본래 분류 탭에도 들어 있으면, 페이지 이동 후에는 본래 분류 탭을 선택 상태로 표시합니다.
    const primaryGroup = matchedGroups.find((group) => group.key !== "hub_admission-start");
    return (primaryGroup || matchedGroups[0]).key;
  }

  function syncMobileMenuPanelTop() {
    const bar = document.querySelector(".gaongil-portal-bar");
    if (!bar) return;
    const bottom = Math.ceil(bar.getBoundingClientRect().bottom + 8);
    document.documentElement.style.setProperty("--ga-mobile-menu-top", `${Math.max(64, bottom)}px`);
  }

  function isMobileMenuMode() {
    return typeof matchMedia === "function" && matchMedia("(max-width: 900px)").matches;
  }

  function ensureMobileMenuPanel() {
    let panel = document.querySelector(".gaongil-mobile-menu-panel");
    if (panel) return panel;
    panel = document.createElement("div");
    panel.className = "gaongil-mobile-menu-panel";
    panel.setAttribute("aria-hidden", "true");
    panel.addEventListener("click", (event) => {
      if (event.target.closest("a")) closeMobileMenuPanel();
    });
    document.body.appendChild(panel);
    return panel;
  }

  function closeMobileMenuPanel() {
    const panel = document.querySelector(".gaongil-mobile-menu-panel");
    if (!panel) return;
    panel.classList.remove("is-open");
    panel.setAttribute("aria-hidden", "true");
    panel.removeAttribute("aria-label");
    panel.innerHTML = "";
  }

  function showMobileMenuPanel(menu) {
    if (!isMobileMenuMode()) {
      closeMobileMenuPanel();
      return;
    }
    const list = menu.querySelector(".gaongil-resource-list");
    if (!list) return;
    syncMobileMenuPanelTop();
    const panel = ensureMobileMenuPanel();
    panel.innerHTML = list.innerHTML;
    panel.setAttribute("aria-label", list.getAttribute("aria-label") || "하위 메뉴");
    panel.setAttribute("aria-hidden", "false");
    panel.classList.add("is-open");
  }

  function refreshMobileMenuPanel() {
    const openMenu = document.querySelector(".gaongil-resource-menu[open]");
    if (openMenu && isMobileMenuMode()) {
      showMobileMenuPanel(openMenu);
    } else {
      closeMobileMenuPanel();
    }
  }

  function init() {
    const current = currentKey();
    const currentGroupKey = resolveCurrentGroupKey(current);
    const base = rootPrefix();
    const logoSrc = base + "assets/gaongil-logo.png";
    document.body.classList.add("gaongil-linked-page");
    if (current && !document.body.dataset.gaongilPage) {
      document.body.dataset.gaongilPage = current;
    }

    // Keep a small HTML fallback on the three download pages so navigation is
    // still available when a browser blocks or delays this shared script.
    const fallbackBar = document.querySelector(".gaongil-portal-fallback");
    const bar = fallbackBar || document.createElement("header");
    bar.className = "gaongil-portal-bar";
    let menuHtml = `<a class="gaongil-main-button gaongil-home-tab" href="${base}index.html">홈</a>`;
    menuHtml += groups.map((group) => {
      const groupActive = group.key === currentGroupKey ? ' data-menu-active="true"' : "";
      const itemHtml = group.pages.map((page) => {
        const active = page.key === current ? " active" : "";
        return `<a href="${normalizeHref(base, page.url)}" class="${active.trim()}" role="menuitem">${escapeHtml(page.title || page.label)}</a>`;
      }).join("");
      return `<details class="gaongil-resource-menu"${groupActive}><summary><span>${escapeHtml(group.label)}</span></summary><div class="gaongil-resource-list" role="menu" aria-label="${escapeHtml(group.label)} 메뉴">${itemHtml}</div></details>`;
    }).join("");
    menuHtml += `<a class="gaongil-main-button gaongil-login-tab" id="gaongilPortalLogin" href="${base}login.html" data-login-href="${base}login.html" data-admin-href="${base}admin.html">로그인</a>`;

    bar.innerHTML = `<div class="gaongil-portal-inner gaongil-menu-only"><nav class="gaongil-portal-actions" aria-label="가온길 에듀 상단 메뉴">${menuHtml}</nav></div>`;
    if (!fallbackBar) {
      document.body.insertBefore(bar, document.body.firstChild);
    }
    if (window.GaongilAuth && typeof window.GaongilAuth.mountLoginMenu === "function") {
      window.GaongilAuth.mountLoginMenu("gaongilPortalLogin");
    }
    decorateFooters(logoSrc);
    syncMobileMenuPanelTop();

    document.addEventListener("click", (event) => {
      const mobilePanel = document.querySelector(".gaongil-mobile-menu-panel");
      if (mobilePanel && mobilePanel.contains(event.target)) return;
      document.querySelectorAll(".gaongil-resource-menu").forEach((menu) => {
        if (menu.open && !menu.contains(event.target)) {
          menu.open = false;
          closeMobileMenuPanel();
        }
      });
    });

    document.querySelectorAll(".gaongil-resource-menu").forEach((menu) => {
      menu.addEventListener("toggle", () => {
        if (!menu.open) {
          refreshMobileMenuPanel();
          return;
        }
        syncMobileMenuPanelTop();
        document.querySelectorAll(".gaongil-resource-menu").forEach((other) => {
          if (other !== menu) other.open = false;
        });
        showMobileMenuPanel(menu);
      });
    });

    window.addEventListener("resize", syncMobileMenuPanelTop, { passive: true });
    window.addEventListener("resize", refreshMobileMenuPanel, { passive: true });
    window.addEventListener("orientationchange", () => {
      syncMobileMenuPanelTop();
      refreshMobileMenuPanel();
    });
    window.addEventListener("scroll", syncMobileMenuPanelTop, { passive: true });
  }

  function decorateFooters(logoSrc) {
    document.querySelectorAll("footer, .footer, .site-footer").forEach((footer) => {
      if (footer.closest(".gaongil-portal-bar") || footer.querySelector(".gaongil-footer-brand")) return;
      const brand = document.createElement("div");
      brand.className = "gaongil-footer-brand";
      brand.innerHTML = `
        <img src="${logoSrc}" alt="가온길 에듀" />
        <span>
          <strong>가온길 에듀</strong>
          <em>가온길 에듀 입시전략연구소</em>
        </span>
      `;
      footer.insertBefore(brand, footer.firstChild);
    });
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", init);
  } else {
    init();
  }
})();
