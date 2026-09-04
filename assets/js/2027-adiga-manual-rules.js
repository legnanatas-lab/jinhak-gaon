// ADIGA 원문 병합표를 재검증해 반영한 대학별 보정 규칙
const _silla = ADIGA_2027_UNIVERSITIES.find(u => u.code === '0000144');
if (_silla) _silla.manualRules = {
  general: {
    label: '일반고교과 등 (면접우수자·지역인재 제외)',
    commonTop: 10,
    careerMax: 3,
    rankPoints: [100, 98, 96, 94, 92, 90, 88, 86, 84],
    achievementPoints: { A: 100, B: 96, C: 92 }
  },
  interviewRegional: {
    label: '면접우수자·지역인재',
    commonTop: 0,
    careerMax: 4,
    achievementPoints: { A: 60, B: 54, C: 46 }
  }
};

// 경상국립대: 기본점수(공개표상 0) + 공통/일반 이수단위 가중평균 + 진로선택 교과별 가산점
const _gnu = ADIGA_2027_UNIVERSITIES.find(u => u.code === '0000007');
if (_gnu) _gnu.manualRules = {
  gnu: {
    label: '학생부교과 (인문·자연·광역계열)',
    formula: 'gnu',
    areas: ['국어','영어','수학','사회','한국사','과학'],
    bonusAreas: ['국어','영어','수학','사회','과학'],
    rankPoints: [150,135,120,105,90,75,60,40,0],
    achievementPoints: { A: 0.5, B: 0.3, C: 0.1 },
    careerTopPerArea: 3,
    bonusDivisor: 5,
    basicScore: 0
  }
};

// 동아대: 진로선택 A/B/C를 1/3/5등급으로 환산한 뒤 해당 전형의 반영 한도 안에서
// 공통·일반선택 과목을 대체하여 기본점수 880점에 더한다.
const _donga = ADIGA_2027_UNIVERSITIES.find(u => u.code === '0000105');
if (_donga) _donga.manualRules = {
  excellence: {
    label: '교과성적우수자·지역인재기회균형',
    formula: 'donga',
    areas: ['국어','영어','수학','사회','과학'],
    selection: 'perArea',
    // 원문 '국어·영어·수학·사회/과학 교과별 각 3과목, 총 12과목'에 맞춰
    // 사회와 과학을 하나의 반영교과 묶음으로 처리한다.
    areaGroups: [['국어'], ['영어'], ['수학'], ['사회','과학']],
    slotsPerArea: 3,
    careerMaxPerArea: 1,
    careerMax: 4,
    rankPoints: [10,9,8,7,6,5,4,3,0],
    achievementRanks: { A: 1, B: 3, C: 5 },
    basicScore: 880
  },
  regional: {
    label: '지역인재교과 (인문·자연·자유전공, 의예 제외)',
    formula: 'donga',
    areas: ['국어','영어','수학','사회','과학'],
    selection: 'overall',
    totalSlots: 12,
    careerMax: 2,
    rankPoints: [10,9,8,7,6,5,4,3,0],
    achievementRanks: { A: 1, B: 3, C: 5 },
    basicScore: 880
  },
  careerExcellence: {
    label: '교과진로우수자 (교과성적 부분)',
    formula: 'donga',
    areas: ['국어','영어','수학','사회','과학'],
    selection: 'overall',
    totalSlots: 12,
    careerMax: 6,
    rankPoints: [10,9,8,7,6,5,4,3,0],
    achievementRanks: { A: 1, B: 3, C: 5 },
    basicScore: 880
  }
};

// 부산대: 석차등급이 있는 반영교과 전체를 이수단위로 가중평균한 뒤, 교과배점 80점을 적용한다.
const _pusan = ADIGA_2027_UNIVERSITIES.find(u => u.code === '0000014');
if (_pusan) _pusan.manualRules = {
  studentRecord: {
    label: '학생부교과·지역인재·농어촌학생 (교과 80점)',
    formula: 'pusan',
    areas: ['국어','수학','영어','사회','과학','한국사'],
    rankPoints: [100,99,98,97,96,95,90,60,0],
    subjectWeight: 80
  }
};

// 부산가톨릭대: 필수 8과목(국·영·수·탐구 각 2) + 선택 4과목을 평균등급으로 산출한다.
const _cup = ADIGA_2027_UNIVERSITIES.find(u => u.code === '0000114');
if (_cup) _cup.manualRules = {
  type1: {
    label: '교과우수Ⅰ·농어촌·사회배려',
    formula: 'busanCatholic',
    baseScore: 1000,
    gradeStep: 62.5
  },
  type2: {
    label: '교과우수Ⅱ (교과성적 부분)',
    formula: 'busanCatholic',
    baseScore: 800,
    gradeStep: 50
  }
};

// 2027학년도 강원대학교 강릉·원주캠퍼스 공식 수시모집요강 기준.
// 기존 ADIGA의 국립강릉원주대 캠퍼스 항목은 통합 대학의 최신 기준으로 연결한다.
for (const code of ['0000001', '0000002']) {
  const campus = ADIGA_2027_UNIVERSITIES.find(u => u.code === code);
  if (campus) campus.manualRules = {
    general: {
      label: '일반학과 학생부교과',
      formula: 'gangneung2027',
      areas: ['국어','수학','영어','사회','과학'],
      commonPerArea: 3,
      rankPoints: [1000,970,940,910,880,850,820,790,280],
      achievementRanks: { A: 1, B: 2, C: 4 },
      commonWeight: 0.9,
      careerWeight: 0.1
    },
    dental: {
      label: '치의예과 학생부교과',
      formula: 'gangneung2027',
      areas: ['국어','수학','영어','사회','과학'],
      commonPerArea: null,
      rankPoints: [1000,970,940,910,880,850,820,790,280],
      achievementRanks: { A: 1, B: 2, C: 4 },
      commonWeight: 0.9,
      careerWeight: 0.1
    },
    rural: {
      label: '농어촌학생전형',
      formula: 'gangneung2027',
      areas: ['국어','수학','영어','사회','과학'],
      commonPerArea: 3,
      rankPoints: [1000,970,940,910,880,850,820,790,280],
      achievementRanks: { A: 1, B: 2, C: 4 },
      commonWeight: 1.0,
      careerWeight: 0
    }
  };
}

// 배재대학교 2027학년도 대학입학전형시행계획(2025.7.14 업데이트) 기준.
const _paichai = ADIGA_2027_UNIVERSITIES.find(u => u.code === '0000113');
if (_paichai) _paichai.manualRules = {
  all: {
    label: '학생부교과 전 전형 공통 산식',
    formula: 'paichai2027',
    coreAreas: ['국어','영어','수학'],
    otherAreas: ['한국사','사회','과학','제2외국어','한문'],
    rankPoints: [100,97,92,89,85,80,70,65,60],
    achievementRanks: { A: 4, B: 5, C: 7 },
    achievementPoints: { A: 89, B: 85, C: 70 }
  }
};

// 한서대학교 2027학년도 대학입학전형시행계획 기준.
const _hanseo = ADIGA_2027_UNIVERSITIES.find(u => u.code === '0000199');
if (_hanseo) _hanseo.manualRules = {
  noInterview: {
    label: '면접·실기 없는 학생부교과전형 (교과 부분)',
    formula: 'hanseo2027',
    multiplier: 45
  },
  talent: {
    label: '한서인재·항공관광학과 (구간표 적용)',
    formula: 'hanseo2027',
    intervalTable: true
  }
};

// 대신대학교 ADIGA 모바일 2027 공개자료 기준.
const _daeshin = ADIGA_2027_UNIVERSITIES.find(u => u.code === '0000093');
if (_daeshin) _daeshin.manualRules = {
  all: {
    label: '학생부교과 공통 산식',
    formula: 'daeshin2027',
    rankPoints: [100,97.5,95,92.5,90,87.5,85,82.5,80]
  }
};

// 부산장신대학교 2027학년도 수시모집요강: 석차등급이 있는 전 학년·전 과목,
// 학년별 33.3%, 등급별 1,000/950/.../600점.
const _bpu = ADIGA_2027_UNIVERSITIES.find(u => u.code === '0000222');
if (_bpu) {
  _bpu.status = '자료 있음';
  _bpu.sourceUrl = 'https://ipsi.bpu.ac.kr/Board/BoardView.aspx?BoardMstNo=1&BoardNo=4911&CategoryNo=0&CategoryYN=N&KeyField=TITLE&KeyWord=&PageNo=1';
  _bpu.manualRules = {
    all: {
      label: '학생부교과 전 전형',
      formula: 'bpu2027',
      rankPoints: [1000,950,900,850,800,750,700,650,600]
    }
  };
}

// 영산대학교 2027학년도 수시모집요강(양산·해운대 공통): 상위 8과목,
// 진로선택 최대 2과목 A=1/B=3/C=5등급 환산. 모집단위별 학생부 배점표를 각각 제공한다.
for (const code of ['0003193', '0003194']) {
  const campus = ADIGA_2027_UNIVERSITIES.find(u => u.code === code);
  if (campus) {
    campus.status = '자료 있음';
    campus.sourceUrl = 'https://www.ysu.ac.kr/ipsi/CMS/Contents/Contents.do?mCode=MN015';
    campus.manualRules = {
      general100: {
        label: '일반계고·교과·사회배려자 등 (학생부 100%)',
        formula: 'youngsan2027',
        areas: ['국어','영어','수학','사회','과학','한국사'],
        rankPoints: [125,122.5,121.25,120,118.75,117.5,115,112.5,110],
        achievementRanks: { A: 1, B: 3, C: 5 },
        totalSlots: 8,
        careerMax: 2,
        maxScore: 1000
      },
      nursing100: {
        label: '간호학과 학생부 100% 전형',
        formula: 'youngsan2027',
        areas: ['국어','영어','수학','사회','과학','한국사'],
        requiredAreas: ['국어','영어','수학'],
        rankPoints: [125,122.5,121.25,120,118.75,117.5,115,112.5,110],
        achievementRanks: { A: 1, B: 3, C: 5 },
        totalSlots: 8,
        careerMax: 2,
        maxScore: 1000
      },
      interview70: {
        label: '면접전형 일부 모집단위 (학생부 70%)',
        formula: 'youngsan2027',
        areas: ['국어','영어','수학','사회','과학','한국사'],
        rankPoints: [87.5,85.75,84.875,84,83.125,82.25,80.5,78.75,77],
        achievementRanks: { A: 1, B: 3, C: 5 },
        totalSlots: 8,
        careerMax: 2,
        maxScore: 700
      },
      interview60: {
        label: '면접전형 일부 모집단위 (학생부 60%)',
        formula: 'youngsan2027',
        areas: ['국어','영어','수학','사회','과학','한국사'],
        rankPoints: [75,73,71.25,69.875,68.5,67.125,65.75,64,62],
        achievementRanks: { A: 1, B: 3, C: 5 },
        totalSlots: 8,
        careerMax: 2,
        maxScore: 600
      },
      practical30: {
        label: '실기전형 일부 모집단위 (학생부 30%)',
        formula: 'youngsan2027',
        areas: ['국어','영어','수학','사회','과학','한국사','체육'],
        rankPoints: [37.5,36.75,36.375,36,35.625,35.25,34.5,33.75,33],
        achievementRanks: { A: 1, B: 3, C: 5 },
        totalSlots: 8,
        careerMax: 2,
        maxScore: 300
      }
    };
  }
}

// 예원예술대학교 2027학년도 대학입학기본계획: 학년별 상위 2과목,
// 1·2·3학년 50%·30%·20%. 공개 계획에는 등급별 최종 점수표가 없어 공식 가중등급을 제공한다.
for (const code of ['0000218', '0000219']) {
  const campus = ADIGA_2027_UNIVERSITIES.find(u => u.code === code);
  if (campus) {
    campus.status = '자료 있음';
    campus.sourceUrl = 'https://admission.yewon.ac.kr/main/?menu=328&mode=view&no=90';
    campus.manualRules = {
      all: { label: '학생부교과 공통 (교과성적 부분)', formula: 'yewon2027' }
    };
  }
}

// 중앙승가대학교 2027 수시모집요강: 학년별 우수 4과목, 25%·25%·50%.
// 대학이 등급별 600점 환산표를 공개하지 않아 공식 선택·가중 규칙에 따른 비교등급만 표시한다.
const _sangha = ADIGA_2027_UNIVERSITIES.find(u => u.code === '0000177');
if (_sangha) {
  _sangha.status = '자료 있음';
  _sangha.sourceUrl = 'https://admission.sangha.ac.kr/SANGHA/?ACT=ADMISSION_FRESH&APP_END=&FOR=';
  _sangha.manualRules = {
    all: { label: '학생부교과(출가자 일반·만학도)', formula: 'sangha2027' }
  };
}

// 아래 대학은 2027 공식 모집요강상 정량 교과 환산이 아니라 학생부종합 정성평가이다.
for (const item of [
  ['0000260', 'https://www.cue.ac.kr/enter/CMS/Contents/Contents.do?mCode=MN017'],
  ['0000262', 'https://www.cnue.ac.kr/enter/susi/guide.do'],
  ['0000188', 'https://adm-u.postech.ac.kr/entrance-exam/guide/']
]) {
  const university = ADIGA_2027_UNIVERSITIES.find(u => u.code === item[0]);
  if (university) {
    university.status = '자료 있음';
    university.calculationStatus = 'qualitative';
    university.sourceUrl = item[1];
  }
}

// 광신대학교 공식 2027 수시 페이지: 3학년 1학기까지 진로선택을 제외한
// 전 과목 석차등급을 이수단위로 가중평균하고, 등급별 600~280점 표를 적용한다.
const _kwangshin = ADIGA_2027_UNIVERSITIES.find(u => u.code === '0000073');
if (_kwangshin) {
  _kwangshin.status = '자료 있음';
  _kwangshin.sourceUrl = 'https://www.kwangshin.ac.kr/ipsi/contentsInfo.do?menu_no=608';
  _kwangshin.manualRules = {
    all: { label: '학생부교과 전 전형', formula: 'kwangshin2027', rankPoints: [600,560,520,480,440,400,360,320,280] }
  };
}

// 영남신학대학교 공식 2027 수시모집요강: 2학년과 3학년 1학기의
// 국어·영어·사회(없으면 과학, 수학 순)를 이수단위 가중하여 480~200점 표를 적용한다.
const _ytus = ADIGA_2027_UNIVERSITIES.find(u => u.code === '0000153');
if (_ytus) {
  _ytus.status = '자료 있음';
  _ytus.sourceUrl = 'https://entra.ytus.ac.kr/board/view/early_admissions/281';
  _ytus.manualRules = {
    all: { label: '신학부·기독교융합학부·자율전공학부', formula: 'ytus2027', primaryAreas: ['국어','영어','사회'], fallbackAreas: ['과학','수학'], rankPoints: [480,445,410,375,340,305,270,235,200] }
  };
}

// 한일장신대학교는 2027 최종 요강이 공식 사이트에 아직 게시되지 않았다.
// 산출불가로 숨기지 않고, 최신 공식 2026 수시요강의 산식을 잠정 참고값으로 제공한다.
const _hanil = ADIGA_2027_UNIVERSITIES.find(u => u.code === '0000206');
if (_hanil) {
  _hanil.status = '자료 있음';
  _hanil.sourceUrl = 'https://www.hanil.ac.kr/link/2025/09/01/4404ffaa-da79-49b0-9e08-6065a9f9134f.pdf';
  _hanil.manualRules = {
    all: { label: '전 모집단위 (2026 최신 공식 산식·2027 요강 게시 전 잠정)', formula: 'hanilLatest', achievementRanks: {A:2,B:5,C:8}, basicScore: 600, practicalScore: 200 }
  };
}

// 아래 묶음은 ADIGA 2027 교과영역 평가방법 원문과 표를 대학별로 대조한 규칙이다.
const _kyungnam = ADIGA_2027_UNIVERSITIES.find(u => u.code === '0000059');
if (_kyungnam) _kyungnam.manualRules = {
  standard: {label:'일반·지역인재·기회균형 등 (교과 900점)',formula:'gyeongnam2027',minScore:720,maxScore:900},
  physicalEducation: {label:'체육교육과 (교과 540점)',formula:'gyeongnam2027',minScore:432,maxScore:540},
  practical300: {label:'스포츠과학·미술교육·음악교육 (교과 270점)',formula:'gyeongnam2027',minScore:216,maxScore:270},
  practical200: {label:'디자인·체육특기자 (교과 180점)',formula:'gyeongnam2027',minScore:144,maxScore:180}
};

for (const code of ['0000060','0002574','0002744']) {
  const u=ADIGA_2027_UNIVERSITIES.find(x=>x.code===code);
  if (u) u.manualRules={all:{label:'모든 전형 공식 평균등급',formula:'kyungdong2027'}};
}

const _kwangwoon=ADIGA_2027_UNIVERSITIES.find(u=>u.code==='0000074');
if (_kwangwoon) _kwangwoon.manualRules={regional:{label:'지역균형전형',formula:'kwangwoon2027',rankPoints:[100,98,96,94,92,88,80,70,0],achievementRanks:{A:1,B:2,C:4}}};

const _daejin=ADIGA_2027_UNIVERSITIES.find(u=>u.code==='0000097');
if (_daejin) _daejin.manualRules={
  seventy:{label:'학생부우수자·종단추천자 (교과 70%)',formula:'daejin2027',factor:7,maxScore:700},
  hundred:{label:'학교장추천·고른기회·밝은사회·취업자 (교과 100%)',formula:'daejin2027',factor:10,maxScore:1000}
};

const _dongyang=ADIGA_2027_UNIVERSITIES.find(u=>u.code==='0000106');
if (_dongyang) _dongyang.manualRules={all:{label:'전체 학생부교과전형 (교과성적 부분)',formula:'dongyang2027',rankPoints:[90,87,78,66,57,48,39,30,27],achievementRanks:{A:1,B:2,C:3}}};

for (const code of ['0000109','0000111']) {
  const u=ADIGA_2027_UNIVERSITIES.find(x=>x.code===code);
  if (u) u.manualRules={all:{label:'학생부교과 전 전형',formula:'myongji2027',rankPoints:[100,99,98,94,90,80,60,30,0],achievementRanks:{A:1,B:2,C:4}}};
}

const _mokwon=ADIGA_2027_UNIVERSITIES.find(u=>u.code==='0000112');
if (_mokwon) _mokwon.manualRules={
  full:{label:'교과·지역인재·사회배려 등 (학생부 100%)',formula:'mokwon2027',factor:10,maxScore:1000},
  interview:{label:'교과면접전형 (학생부 80%)',formula:'mokwon2027',factor:8,maxScore:800}
};

const _dongmyeong=ADIGA_2027_UNIVERSITIES.find(u=>u.code==='0000235');
if (_dongmyeong) _dongmyeong.manualRules={
  full:{label:'일반고교과·특성화고교과·평생학습자 등 (학생부 100%)',formula:'dongmyeong2027',rankPoints:[1000,995,990,986,980,976,964,951,937],maxScore:1000},
  interview:{label:'면접·지역인재전형 (학생부 80%)',formula:'dongmyeong2027',rankPoints:[800,796,792,788.8,784,780.8,771.2,760.8,749.6],maxScore:800},
  sports:{label:'스포츠우수자전형 (학생부 50%)',formula:'dongmyeong2027',rankPoints:[500,497.5,495,493,490,488,482,475.5,468.5],maxScore:500}
};

const _sangji=ADIGA_2027_UNIVERSITIES.find(u=>u.code==='0000119');
if (_sangji) _sangji.manualRules={
  standard:{label:'교과일반·강원인재·사회통합',formula:'sangji2027',perSemester:2,maxCommon:10,minSubjects:10},
  medicine:{label:'한의예과',formula:'sangji2027',perSemester:5,maxCommon:25,minSubjects:15}
};

const _knu=ADIGA_2027_UNIVERSITIES.find(u=>u.code==='0000005');
if(_knu)_knu.manualRules={
  academic:{label:'인문·자연계열 교과성적 80% 부분',formula:'weightedAll2027',areas:['국어','수학','영어','사회','과학','한국사'],rankPoints:[400,390,380,370,360,350,300,200,0],careerMode:'exclude',maxScore:400},
  arts:{label:'예·체능계열 교과성적 80% 부분',formula:'weightedAll2027',areas:['국어','수학','영어','사회','한국사'],rankPoints:[400,390,380,370,360,350,300,200,0],careerMode:'exclude',maxScore:400}
};

const _kyunghee=ADIGA_2027_UNIVERSITIES.find(u=>u.code==='0000066');
if(_kyunghee)_kyunghee.manualRules={
  academic:{label:'지역균형·기회균형Ⅰ 인문·자연/자유전공',formula:'splitWeighted2027',commonAreas:['국어','영어','수학','사회','과학','한국사'],careerAreas:['국어','영어','수학','사회','과학'],careerTop:3,rankPoints:[100,96,89,77,60,40,23,11,0],achievementPoints:{A:100,B:80,C:60},commonWeight:.8,careerWeight:.2,maxScore:100},
  arts:{label:'지역균형·기회균형Ⅰ 예술·체육',formula:'splitWeighted2027',commonAreas:['국어','영어'],careerAreas:['국어','영어'],careerTop:3,rankPoints:[100,96,89,77,60,40,23,11,0],achievementPoints:{A:100,B:80,C:60},commonWeight:.8,careerWeight:.2,maxScore:100}
};

const _duksung=ADIGA_2027_UNIVERSITIES.find(u=>u.code==='0000099');
if(_duksung)_duksung.manualRules={all:{label:'고교추천·기회균형Ⅰ',formula:'splitWeighted2027',commonAreas:['국어','수학','영어','사회','과학','한국사'],careerAreas:['국어','수학','영어','사회','과학','한국사'],rankPoints:[100,99,98,97,96,92,86,80,0],achievementPoints:{A:100,B:99,C:97},commonWeight:.9,careerWeight:.1,outputScale:10,maxScore:1000}};

const _sejong=ADIGA_2027_UNIVERSITIES.find(u=>u.code==='0000138');
if(_sejong)_sejong.manualRules={
  liberal:{label:'자유전공학부',formula:'splitWeighted2027',commonAreas:['국어','수학','영어'],careerAreas:['국어','수학','영어'],rankPoints:[1000,990,980,950,900,800,700,500,0],achievementPoints:{A:1000,B:980,C:900},commonWeight:.8,careerWeight:.2,maxScore:1000},
  humanities:{label:'인문계열',formula:'splitWeighted2027',commonAreas:['국어','수학','영어','사회','한국사'],careerAreas:['국어','수학','영어','사회','한국사'],rankPoints:[1000,990,980,950,900,800,700,500,0],achievementPoints:{A:1000,B:980,C:900},commonWeight:.8,careerWeight:.2,maxScore:1000},
  natural:{label:'자연계열',formula:'splitWeighted2027',commonAreas:['국어','수학','영어','과학'],careerAreas:['국어','수학','영어','과학'],rankPoints:[1000,990,980,950,900,800,700,500,0],achievementPoints:{A:1000,B:980,C:900},commonWeight:.8,careerWeight:.2,maxScore:1000},
  arts:{label:'예체능계열',formula:'splitWeighted2027',commonAreas:['국어','영어'],careerAreas:['국어','영어'],rankPoints:[1000,990,980,950,900,800,700,500,0],achievementPoints:{A:1000,B:980,C:900},commonWeight:.8,careerWeight:.2,maxScore:1000}
};

const _ewha=ADIGA_2027_UNIVERSITIES.find(u=>u.code==='0000163');
if(_ewha)_ewha.manualRules={all:{label:'고교추천전형',formula:'splitWeighted2027',commonAreas:['국어','수학','영어','한국사','사회','과학'],careerAreas:['국어','수학','영어','한국사','사회','과학'],rankPoints:[10,9.6,9.2,8.6,7.8,7,5,2,0],achievementPoints:{A:10,B:8.6,C:5},commonWeight:.8,careerWeight:.2,maxScore:10}};

const _cha=ADIGA_2027_UNIVERSITIES.find(u=>u.code==='0000187');
if(_cha)_cha.manualRules={all:{label:'CHA학생부교과·지역균형선발',formula:'cha2027',areas:['국어','영어','수학','사회','과학','한국사'],rankPoints:[1000,997,994,990,985,975,965,945,0],achievementRanks:{A:1,B:3,C:5}}};

const _mokpoCatholic=ADIGA_2027_UNIVERSITIES.find(u=>u.code==='0000221');
if(_mokpoCatholic)_mokpoCatholic.manualRules={
  humanities:{label:'인문·사회계열',formula:'weightedAll2027',areas:['국어','영어','수학','사회','한국사'],rankPoints:[10,9,8,7,6,5,4,3,2],careerMode:'exclude',maxScore:10},
  natural:{label:'자연·예술·체육계열',formula:'weightedAll2027',areas:['국어','영어','수학','과학'],rankPoints:[10,9,8,7,6,5,4,3,2],careerMode:'exclude',maxScore:10}
};

// 가야대학교: 국·영·수 6과목 + 사·과·한국사 2과목, 진로선택은 전체 최대 2과목.
const _kaya=ADIGA_2027_UNIVERSITIES.find(u=>u.code==='0002748');
if(_kaya)_kaya.manualRules={all:{label:'학생부교과 전 전형',formula:'kaya2027',coreAreas:['국어','영어','수학'],otherAreas:['사회','과학','한국사'],rankPoints:[125,121.875,118.75,115.625,112.5,109.375,106.25,103.125,100],achievementRanks:{A:1,B:3,C:5},careerMax:2,maxScore:1000}};

// 강남대학교: 반영 6개 교과에서 공통·일반·진로를 합쳐 상위 20과목, 이수단위 가중.
const _kangnam=ADIGA_2027_UNIVERSITIES.find(u=>u.code==='0000051');
if(_kangnam)_kangnam.manualRules={all:{label:'지역균형·농어촌·국가보훈·만학도·기초차상위',formula:'kangnam2027',areas:['국어','수학','영어','사회','과학','한국사'],rankPoints:[100,95,90,85,80,75,55,30,0],achievementRanks:{A:2,B:3,C:5},totalSlots:20,maxScore:100}};

// 경성대학교: 일반학과와 약학과의 선택·가중방식이 달라 별도 산출한다.
const _kyungsung=ADIGA_2027_UNIVERSITIES.find(u=>u.code==='0000062');
if(_kyungsung)_kyungsung.manualRules={
  general:{label:'일반학과 (국·영·수·탐구·기타 각 2과목)',formula:'kyungsung2027',mode:'quota',rankPoints:[100,98,96,94,92,90,88,86,84],achievementRanks:{A:2,B:4,C:6},careerMax:2,maxScore:1000},
  regional:{label:'지역인재·지역인재(저소득층) 일반학과',formula:'kyungsung2027',mode:'top10',rankPoints:[100,98,96,94,92,90,88,86,84],achievementRanks:{A:2,B:4,C:6},careerMax:2,maxScore:1000},
  pharmacy:{label:'약학과 (공통30%·일반50%·진로20%)',formula:'kyungsung2027',mode:'pharmacy',rankPoints:[100,98,96,94,92,90,88,86,84],achievementRanks:{A:1,B:3,C:5},maxScore:1000}
};

// 경일대학교: 공통·일반 상위 9과목(3개 교과에서 각 1과목 이상) + 진로 상위 3과목.
const _kiu=ADIGA_2027_UNIVERSITIES.find(u=>u.code==='0000064');
if(_kiu)_kiu.manualRules={general:{label:'일반전형 (교과 360점)',formula:'kyungil2027',rankPoints:[360,342,324,306,288,270,252,234,216],achievementRanks:{A:1,B:2,C:3},maxScore:360}};

// 한동대학교 일반전형: 공통·일반 상위 10과목 80% + 진로 상위 3과목 20%.
const _handong=ADIGA_2027_UNIVERSITIES.find(u=>u.code==='0000196');
if(_handong)_handong.manualRules={general:{label:'일반전형',formula:'splitTop2027',areas:['국어','영어','수학','한국사','과학','사회'],commonTop:10,careerTop:3,rankPoints:[100,96,89,77,60,40,23,11,0],achievementPoints:{A:100,B:90,C:80},commonWeight:.8,careerWeight:.2,maxScore:100}};

// 한신대학교: 진로선택 제외, 반영 5개 교과(한국사 포함) 상위 12과목 이수단위 가중.
const _hanshin=ADIGA_2027_UNIVERSITIES.find(u=>u.code==='0000202');
if(_hanshin)_hanshin.manualRules={all:{label:'학생부교과 전형',formula:'weightedTop2027',areas:['국어','수학','영어','사회','과학','한국사'],top:12,rankPoints:[100,99,98,97,96,95,94,80,50],scale:10,careerMode:'exclude',maxScore:1000,requireCount:12}};

// 화성의과학대학교: 상위 9과목 점수 합, 진로선택 최대 3과목 A=1/B=4/C=7.
const _hsmu=ADIGA_2027_UNIVERSITIES.find(u=>u.code==='0000233');
if(_hsmu)_hsmu.manualRules={all:{label:'학생부교과 전형',formula:'topSum2027',areas:['국어','영어','수학','사회','한국사','과학'],top:9,careerMax:3,rankPoints:[100,99,98,96,94,92,90,70,60],achievementRanks:{A:1,B:4,C:7},padRank:9,maxScore:900}};

// 서경대학교: 전형별로 네 교과영역을 각각 25% 반영한다.
const _sku=ADIGA_2027_UNIVERSITIES.find(u=>u.code==='0000121');
if(_sku)_sku.manualRules={
  excellenceHuman:{label:'교과우수자 등 (인문계열)',formula:'seokyeong2027',areas:['국어','영어','수학','사회'],perArea:null,maxScore:100},
  excellenceNature:{label:'교과우수자 등 (자연계열)',formula:'seokyeong2027',areas:['국어','영어','수학','과학'],perArea:null,maxScore:100},
  balanceHuman:{label:'교과균형 등 (인문계열)',formula:'seokyeong2027',areas:['국어','영어','수학','사회'],perArea:3,maxScore:100},
  balanceNature:{label:'교과균형 등 (자연계열)',formula:'seokyeong2027',areas:['국어','영어','수학','과학'],perArea:3,maxScore:100}
};

// 울산대학교: 일반 모집단위, 간호, 자율전공, 의예 산식을 분리한다.
const _ulsan=ADIGA_2027_UNIVERSITIES.find(u=>u.code==='0000158');
if(_ulsan)_ulsan.manualRules={
  general:{label:'일반 모집단위',formula:'ulsan2027',mode:'general',maxScore:850},
  nursing:{label:'간호학과',formula:'ulsan2027',mode:'nursing',maxScore:850},
  autonomous:{label:'자율전공학부',formula:'ulsan2027',mode:'autonomous',maxScore:900},
  medicine:{label:'의예과',formula:'ulsan2027',mode:'medicine',maxScore:720}
};

// 제주국제대학교: 전 교과를 학년 20:40:40으로 가중하고 진로 A/B/C를 공식 점수로 반영한다.
const _jejuIntl=ADIGA_2027_UNIVERSITIES.find(u=>u.code==='0000248');
if(_jejuIntl)_jejuIntl.manualRules={all:{label:'학생부교과 전 전형 (교과 900점)',formula:'jejuIntl2027',yearWeights:{1:.2,2:.4,3:.4},rankPoints:[900,879.75,859.5,839.25,819,798.75,778.5,758.25,738],achievementPoints:{A:879.75,B:819,C:758.25},maxScore:900}};

// 평택대학교: 우수 9과목(진로 최대3), 추천은 우수3과목(진로 최대1), 부족 과목은 9등급.
const _ptu=ADIGA_2027_UNIVERSITIES.find(u=>u.code==='0000186');
if(_ptu)_ptu.manualRules={
  standard:{label:'PTU교과·자율전공·기회균형·정원외',formula:'ptu2027',top:9,careerMax:3,rankPoints:[1000,950,900,850,800,750,700,350,0],maxScore:1000},
  recommend:{label:'PTU추천',formula:'ptu2027',top:3,careerMax:1,rankPoints:[1000,950,900,850,800,750,700,350,0],maxScore:1000},
  disabled:{label:'장애인특별전형 (교과 60%)',formula:'ptu2027',top:9,careerMax:3,rankPoints:[600,594,588,582,576,570,564,282,0],maxScore:600}
};

// 한국공학대학교: 교과별 석차등급 상위4 + 진로 교과별 최대2(1단위), 기준점수 M의 5배.
const _tukorea=ADIGA_2027_UNIVERSITIES.find(u=>u.code==='0000247');
if(_tukorea)_tukorea.manualRules={
  engineering:{label:'교과우수자·지역균형 (공학계열)',formula:'tukorea2027',areas:['국어','영어','수학','과학'],maxScore:500},
  business:{label:'교과우수자·지역균형 (경영학부·사회교과 기준)',formula:'tukorea2027',areas:['국어','영어','수학','사회'],maxScore:500}
};

// 협성대학교: 교과군별 정해진 과목 수를 뽑고 진로 상위2가 최저 교과점수를 대체한다.
const _uhs=ADIGA_2027_UNIVERSITIES.find(u=>u.code==='0000207');
if(_uhs)_uhs.manualRules={
  excellence:{label:'교과성적우수자·기회균형·사회배려자·정원외',formula:'hyupsung2027',mode:'replace14',maxScore:100},
  interview:{label:'미래창의인재·웨슬리·실기우수자',formula:'hyupsung2027',mode:'top9',maxScore:100}
};

const _chosun=ADIGA_2027_UNIVERSITIES.find(u=>u.code==='0000172');
if(_chosun)_chosun.manualRules={
  student:{label:'학생부교과·실기전형',formula:'chosun2027',careerDivisor:3,maxScore:500},
  talent:{label:'특기자전형 (학생부 영역)',formula:'chosun2027',careerDivisor:6,maxScore:500}
};

const _joongbu=ADIGA_2027_UNIVERSITIES.find(u=>u.code==='0000173');
if(_joongbu)_joongbu.manualRules={
  full:{label:'학생부우수자·지역인재 등 (학생부100%)',formula:'joongbu2027',maxScore:1000},
  schoolLife:{label:'학교생활우수자 (학생부70%)',formula:'joongbu2027',maxScore:700},
  aviation:{label:'학교생활우수자 항공서비스 (학생부50%)',formula:'joongbu2027',maxScore:500}
};

const _jwu=ADIGA_2027_UNIVERSITIES.find(u=>u.code==='0000239');
if(_jwu)_jwu.manualRules={
  full:{label:'학생부100% 전형',formula:'jungwon2027',factor:15,base:100,maxScore:1000},
  eighty:{label:'학생부80% 전형',formula:'jungwon2027',factor:13,base:20,maxScore:800},
  sixty:{label:'학생부60% 전형',formula:'jungwon2027',factor:9,base:60,maxScore:600},
  aviationNursing:{label:'항공운항·간호 (진로 미반영)',formula:'jungwon2027',factor:15,base:100,excludeCareer:true,maxScore:1000}
};

const _csu=ADIGA_2027_UNIVERSITIES.find(u=>u.code==='0000249');
if(_csu)_csu.manualRules={
  general:{label:'일반 모집단위',formula:'changshin2027',mode:'top',factor:1,maxScore:100},
  nursing:{label:'간호학과',formula:'changshin2027',mode:'all',factor:1,maxScore:100},
  interview:{label:'창신인재면접 (교과60%)',formula:'changshin2027',mode:'top',factor:.6,maxScore:60}
};

const _chodang=ADIGA_2027_UNIVERSITIES.find(u=>u.code==='0000246');
if(_chodang)_chodang.manualRules={all:{label:'학생부교과 전 전형',formula:'chodang2027',maxScore:1000}};

const _chongshin=ADIGA_2027_UNIVERSITIES.find(u=>u.code==='0000180');
if(_chongshin)_chongshin.manualRules={all:{label:'교과우수자 (교과72%)',formula:'chongshin2027',maxScore:720}};

const _gachon=ADIGA_2027_UNIVERSITIES.find(u=>u.code==='0000063');
if(_gachon)_gachon.manualRules={
  human:{label:'학생부우수자·농어촌 인문 (유형1·2 중 우수)',formula:'gachon2027',mode:'best',areas:['국어','수학','영어','사회'],maxScore:100},
  nature:{label:'학생부우수자·농어촌 자연 (유형1·2 중 우수)',formula:'gachon2027',mode:'best',areas:['국어','수학','영어','과학'],maxScore:100},
  medical:{label:'의예·한의예·약학',formula:'gachon2027',mode:'all',areas:['국어','수학','영어','과학'],maxScore:100},
  regional:{label:'지역균형 (일반40%+진로60%)',formula:'gachon2027',mode:'regional',areas:['국어','수학','영어','사회','과학'],maxScore:100}
};

const _yonsei=ADIGA_2027_UNIVERSITIES.find(u=>u.code==='0000149');
if(_yonsei)_yonsei.manualRules={recommend:{label:'추천형',formula:'yonsei2027',maxScore:100}};

const _wku=ADIGA_2027_UNIVERSITIES.find(u=>u.code==='0000159');
if(_wku)_wku.manualRules={
  revised:{label:'일반·지역인재·고른기회 등 (2015 개정 이후)',formula:'wonkwang2027',mode:'revised',maxScore:590},
  old:{label:'2015 개정 이전',formula:'wonkwang2027',mode:'old',maxScore:590},
  military:{label:'군사학과 (교과영역)',formula:'wonkwang2027',mode:'military',maxScore:660}
};

const _putS=ADIGA_2027_UNIVERSITIES.find(u=>u.code==='0000170');
if(_putS)_putS.manualRules={all:{label:'학생부우수자 (교과80%)',formula:'presbyterian2027',maxScore:640}};

const _jj=ADIGA_2027_UNIVERSITIES.find(u=>u.code==='0000171');
if(_jj)_jj.manualRules={
  standard:{label:'일반학생·지역인재·정원외',formula:'jeonju2027',mode:'standard',maxScore:1006},
  talent:{label:'달란트전형',formula:'jeonju2027',mode:'talent',maxScore:1000}
};

const _hknu=ADIGA_2027_UNIVERSITIES.find(u=>u.code==='0000037');
if(_hknu)_hknu.manualRules={all:{label:'학생부교과 전형 (100점 환산)',formula:'hankyong2027',maxScore:100}};

const _howon=ADIGA_2027_UNIVERSITIES.find(u=>u.code==='0000282');
if(_howon)_howon.manualRules={
  noInterview:{label:'비면접 학부(과)',formula:'howon2027',points:[1000,970,940,910,880,850,820,790,760],maxScore:1000},
  interview:{label:'면접실시 학부(과)',formula:'howon2027',points:[700,630,560,490,420,350,280,210,140],maxScore:700},
  practical:{label:'실기실시 학부(과)',formula:'howon2027',points:[300,270,240,210,180,150,120,90,60],maxScore:300}
};

const _kjc=ADIGA_2027_UNIVERSITIES.find(u=>u.code==='0000075');
if(_kjc)_kjc.manualRules={
  studentA:{label:'학생부A·학생부B·교구장추천·장애인',formula:'gwangjuCatholic2027',points:[540,472.5,405,337.5,270,202.5,135,67.5,0],maxScore:540},
  college:{label:'대학수료자',formula:'gwangjuCatholic2027',points:[360,315,270,225,180,135,90,45,0],maxScore:360}
};

const _gknu=ADIGA_2027_UNIVERSITIES.find(u=>u.code==='0000021');
if(_gknu)_gknu.manualRules={
  standard:{label:'학생부교과 일반·지역인재 등',formula:'gyeongguk2027',base:560,real:240,maxScore:800},
  art:{label:'실기 미술학전공 교과',formula:'gyeongguk2027',base:112,real:48,maxScore:160},
  physical:{label:'실기 체육학전공 교과',formula:'gyeongguk2027',base:224,real:96,maxScore:320},
  athlete:{label:'체육특기자 교과',formula:'gyeongguk2027',base:168,real:72,maxScore:240}
};

const _chungwoon=ADIGA_2027_UNIVERSITIES.find(u=>u.code==='0000284');
if(_chungwoon)_chungwoon.manualRules={
  general:{label:'일반·청운인재·지역인재 등 (5학기 15과목)',formula:'chungwoon2027',semesterLimit:5,maxScore:100},
  vocational:{label:'특성화고 특별전형 (4학기 12과목)',formula:'chungwoon2027',semesterLimit:4,maxScore:100}
};

const _cheongju=ADIGA_2027_UNIVERSITIES.find(u=>u.code==='0000179');
if(_cheongju)_cheongju.manualRules={
  full:{label:'교과100% 전형',formula:'cheongju2027',factor:1,maxScore:1000},
  seventy:{label:'교과70% 전형',formula:'cheongju2027',factor:.7,maxScore:700},
  sixty:{label:'교과60% 전형',formula:'cheongju2027',factor:.6,maxScore:600},
  thirty:{label:'교과30% 전형',formula:'cheongju2027',factor:.3,maxScore:300},
  twenty:{label:'교과20% 전형',formula:'cheongju2027',factor:.2,maxScore:200},
  health:{label:'보건의료과학대학 정원내 (교과100%+진로A 가산)',formula:'cheongju2027',factor:1,careerBonus:true,maxScore:1000}
};

const _hufs=ADIGA_2027_UNIVERSITIES.find(u=>u.code==='0000192');
if(_hufs)_hufs.manualRules={recommend:{label:'학교장추천전형',formula:'hufs2027',maxScore:1000}};

const _kbtu=ADIGA_2027_UNIVERSITIES.find(u=>u.code==='0000182');
if(_kbtu)_kbtu.manualRules={all:{label:'기독교인·농어촌·장애인등대상자',formula:'originalTop2027',excludeAreas:['체육','예술'],top:3,factor:8,maxScore:800}};

const _halla=ADIGA_2027_UNIVERSITIES.find(u=>u.code==='0000197');
if(_halla)_halla.manualRules={
  full:{label:'일반학생(교과중심)·지역인재 등',formula:'halla2027',factor:1,maxScore:360},
  interview:{label:'일반학생(면접중심)·성인학습자 (교과 80%)',formula:'halla2027',factor:.8,maxScore:288}
};

const _hansung=ADIGA_2027_UNIVERSITIES.find(u=>u.code==='0000200');
if(_hansung)_hansung.manualRules={
  excellenceHuman:{label:'교과우수 인문·사회·패션',formula:'hansung2027',mode:'quota',areas:['국어','영어','수학','사회'],rankPoints:[1000,980,960,940,900,850,750,600,400],careerTop:3,maxScore:1000},
  excellenceEngineering:{label:'교과우수 공학',formula:'hansung2027',mode:'quota',areas:['국어','영어','수학','과학'],rankPoints:[1000,980,960,940,900,850,750,600,400],careerTop:3,maxScore:1000},
  regional:{label:'지역균형·농어촌·특성화고졸업자',formula:'hansung2027',mode:'all',areas:['국어','영어','수학','사회','과학'],rankPoints:[1000,980,960,940,900,850,750,600,400],maxScore:1000}
};

const _hansei=ADIGA_2027_UNIVERSITIES.find(u=>u.code==='0000201');
if(_hansei)_hansei.manualRules={
  theology:{label:'신학·인문사회·디자인·예술',formula:'hansei2027',areas:['국어','영어','사회'],rankPoints:[5,4.8,4.6,4.4,4.2,4,3.1,2.2,1.25],maxScore:100},
  nursing:{label:'간호학과',formula:'hansei2027',areas:['국어','수학','영어','사회','과학'],rankPoints:[5,4.8,4.6,4.4,4.2,4,3.1,2.2,1.25],maxScore:100}
};

const _honam=ADIGA_2027_UNIVERSITIES.find(u=>u.code==='0000208');
if(_honam)_honam.manualRules={
  generalA:{label:'일반학생A',formula:'honam2027',scoreTable:[50,50,45,40,35,30,26,23,20,15,10,5,0],maxScore:58},
  generalB:{label:'일반학생B·일반고·지역인재 등',formula:'honam2027',scoreTable:[50,50,50,40,40,30,30,20,20,10,10,0,0],maxScore:58},
  standard:{label:'일반학과 학생부 80점 유형',formula:'honam2027',scoreTable:[80,80,75,70,60,55,50,45,40,30,20,10,0],maxScore:88}
};

const _honamTheology=ADIGA_2027_UNIVERSITIES.find(u=>u.code==='0000209');
if(_honamTheology)_honamTheology.manualRules={all:{label:'학생부교과 모든 전형',formula:'honamTheology2027',rankPoints:[100,95,90,85,80,75,70,65,60],yearWeights:{1:.2,2:.3,3:.5},maxScore:100}};

const _hoseo=ADIGA_2027_UNIVERSITIES.find(u=>u.code==='0000211');
if(_hoseo)_hoseo.manualRules={
  full:{label:'학생부전형·지역인재 등 (학생부 100%)',formula:'hoseo2027',factor:1,maxScore:1000},
  interview:{label:'학생부(면접)·성인학습자 등 (학생부 60%)',formula:'hoseo2027',factor:.6,maxScore:600},
  practical:{label:'실기전형 일부 (학생부 20%)',formula:'hoseo2027',factor:.2,maxScore:200}
};

for(const code of ['0000046','0000048','0000049']){
  const u=ADIGA_2027_UNIVERSITIES.find(x=>x.code===code);if(u)u.manualRules={all:{label:'지역균형·농어촌학생',formula:'weightedMapped2027',areas:['국어','영어','수학','한국사','사회','과학'],rankPoints:[100,99,98,97,96,95,94,88,70],achievementRanks:{A:1,B:2,C:4},maxScore:100}};
}

for(const code of ['0000056','0000058']){
  const u=ADIGA_2027_UNIVERSITIES.find(x=>x.code===code);if(u)u.manualRules={all:{label:'학생부교과 전 전형 (교과 90점)',formula:'kyonggi2027',rankPoints:[100,99,97,95,90,85,60,20,0],achievementPoints:{A:100,B:99,C:95},maxScore:90}};
}

for(const code of ['0000028','0003297','0003298']){
  const u=ADIGA_2027_UNIVERSITIES.find(x=>x.code===code);if(u)u.manualRules={
    humanities:{label:'인문·사회·예체능계열',formula:'changwon2027',generalAreas:['국어','수학','영어','사회'],rankPoints:[1000,990,980,970,950,930,900,870,830],achievementPoints:{A:1000,B:970,C:900},maxScore:1000},
    natural:{label:'자연계열',formula:'changwon2027',generalAreas:['국어','수학','영어','과학'],rankPoints:[1000,990,980,970,950,930,900,870,830],achievementPoints:{A:1000,B:970,C:900},maxScore:1000},
    sarimHonors:{label:'사림아너스학부',formula:'changwon2027',generalAreas:['국어','수학','영어','사회','과학'],rankPoints:[1000,990,980,970,950,930,900,870,830],achievementPoints:{A:1000,B:970,C:900},maxScore:1000}
  };
}

for(const code of ['0002712','0002800']){
  const u=ADIGA_2027_UNIVERSITIES.find(x=>x.code===code);if(u)u.manualRules={
    full:{label:'학생부우수자·농어촌·교육기회균형',formula:'shinhan2027',factor:1,maxScore:100},
    general:{label:'일반전형 (교과 60%)',formula:'shinhan2027',factor:.6,maxScore:60}
  };
}

for(const code of ['0000161','0000162','0002911']){
  const u=ADIGA_2027_UNIVERSITIES.find(x=>x.code===code);if(u)u.manualRules={all:{label:'학생부교과 전형',formula:'eulji2027',areas:['국어','영어','수학','사회','과학','한국사'],rankPoints:[100,98,96,94,92,90,70,40,10],maxScore:100}};
}

for(const code of ['0000023','0000024']){
  const u=ADIGA_2027_UNIVERSITIES.find(x=>x.code===code);if(u)u.manualRules={
    standard:{label:'학생부교과 일괄선발 (교과영역)',formula:'chonnam2027',areas:['국어','영어','수학','사회','한국사','과학'],rankPoints:[100,95,90,85,80,75,70,65,0],achievementPoints:{A:15,B:9,C:3},basicScore:660,multiplier:2.25,careerMultiplier:1,maxScore:930},
    staged:{label:'3단계 선발 전형 (교과영역)',formula:'chonnam2027',areas:['국어','영어','수학','사회','한국사','과학'],rankPoints:[100,95,90,85,80,75,70,65,0],achievementPoints:{A:15,B:9,C:3},basicScore:528,multiplier:1.8,careerMultiplier:.8,maxScore:744}
  };
}

for(const code of ['0000175','0000174']){
  const u=ADIGA_2027_UNIVERSITIES.find(x=>x.code===code);if(u)u.manualRules={all:{label:'지역균형 (교과영역 90%)',formula:'chungang2027',areas:['국어','영어','수학','사회','과학'],rankPoints:[10,9.71,9.43,9.14,8.86,8.57,8,6.57,3.4],achievementPoints:{A:10,B:9.43,C:8.86},maxScore:900}};
}

const _dongguk=ADIGA_2027_UNIVERSITIES.find(u=>u.code==='0000100');
if(_dongguk)_dongguk.manualRules={
  humanities:{label:'학교장추천인재 인문·영화영상 (교과정량 70점)',formula:'topAverage2027',areas:['국어','수학','사회','영어','한국사'],top:10,rankPoints:[10,9.99,9.95,9.9,9,8,5,3,0],scale:7,maxScore:70,careerMode:'exclude'},
  natural:{label:'학교장추천인재 자연 (교과정량 70점)',formula:'topAverage2027',areas:['국어','수학','과학','영어','한국사'],top:10,rankPoints:[10,9.99,9.95,9.9,9,8,5,3,0],scale:7,maxScore:70,careerMode:'exclude'}
};

const _u1=ADIGA_2027_UNIVERSITIES.find(u=>u.code==='0000154');
if(_u1)_u1.manualRules={all:{label:'학생부교과 전 전형',formula:'topAverage2027',areas:['국어','영어','수학','사회','과학'],top:9,rankPoints:[100,96,92,88,84,80,76,72,68],achievementPoints:{A:96,B:88,C:80},padPoints:0,scale:1,maxScore:100}};

const _sehan=ADIGA_2027_UNIVERSITIES.find(u=>u.code==='0000092');
if(_sehan)_sehan.manualRules={
  full:{label:'일반학생전형 (학생부 100%)',formula:'sehan2027',rankPoints:[1000,980,960,940,920,900,880,860,840],maxScore:1000},
  interview:{label:'면접실시학과 (학생부 60%)',formula:'sehan2027',rankPoints:[600,588,576,564,552,540,528,516,504],maxScore:600}
};

const _youngsanSeonhak=ADIGA_2027_UNIVERSITIES.find(u=>u.code==='0000155');
if(_youngsanSeonhak)_youngsanSeonhak.manualRules={all:{label:'영산선학대인재·농어촌학생 (교과 480점)',formula:'weightedAll2027',areas:['국어','영어','사회'],rankPoints:[480,470.4,460.8,451.2,441.6,422.4,384,288,192],careerMode:'exclude',maxScore:480}};

const _erica=ADIGA_2027_UNIVERSITIES.find(u=>u.code==='0000204');
if(_erica)_erica.manualRules={all:{label:'지역균형선발',formula:'splitWeighted2027',commonAreas:['국어','영어','수학','사회','과학','한국사'],careerAreas:['국어','영어','수학','사회','과학'],rankPoints:[100,99,98,95,90,70,50,25,0],achievementPoints:{A:100,B:99,C:98},commonWeight:.8,careerWeight:.2,maxScore:100}};

for(const code of ['0000212','0002949']){
  const u=ADIGA_2027_UNIVERSITIES.find(x=>x.code===code);if(u)u.manualRules={
    humanities:{label:'인문계열',formula:'hongik2027',areas:['국어','영어','수학','사회','한국사'],rankPoints:[100,96,89,77,60,40,23,11,0],achievementPoints:{A:10,B:9,C:7},maxScore:100},
    natural:{label:'자연계열',formula:'hongik2027',areas:['국어','영어','수학','과학'],rankPoints:[100,96,89,77,60,40,23,11,0],achievementPoints:{A:10,B:9,C:7},maxScore:100}
  };
}

const _flower=ADIGA_2027_UNIVERSITIES.find(u=>u.code==='0000215');
if(_flower)_flower.manualRules={
  nursing100:{label:'간호학과 교과 100%',formula:'flower2027',mode:'nursing',factor:1,maxScore:500},
  nursing60:{label:'간호학과 교과 60%',formula:'flower2027',mode:'nursing',factor:.6,maxScore:300},
  autonomous100:{label:'자율전공학부 교과 100%',formula:'flower2027',mode:'autonomous',factor:1,maxScore:500},
  autonomous60:{label:'자율전공학부 교과 60%',formula:'flower2027',mode:'autonomous',factor:.6,maxScore:300}
};

const _konyang=ADIGA_2027_UNIVERSITIES.find(u=>u.code==='0000054');
if(_konyang)_konyang.manualRules={all:{label:'AI·SW융합대학·국방/사회과학 계열',formula:'konyang2027',areas:['국어','수학','영어','사회','한국사','과학'],top:6,rankPoints:[100,98,96,94,92,90,88,86,84],maxScore:100}};

const _donggukWise=ADIGA_2027_UNIVERSITIES.find(u=>u.code==='0000101');
if(_donggukWise)_donggukWise.manualRules={
  full:{label:'인문·자연 전체전형(학교생활우수자·면접 제외)',formula:'donggukWise2027',mode:'all',areas:['국어','수학','영어','사회','과학'],maxScore:100},
  school:{label:'학교생활우수자·면접전형',formula:'donggukWise2027',mode:'top10',areas:['국어','수학','영어','사회','과학'],maxScore:100},
  arts:{label:'예체능계열',formula:'donggukWise2027',mode:'arts',areas:['국어','영어'],maxScore:100},
  medicine:{label:'한의예과·의예과',formula:'donggukWise2027',mode:'medicine',areas:['국어','수학','영어','사회','과학'],maxScore:110}
};

const _dongsin=ADIGA_2027_UNIVERSITIES.find(u=>u.code==='0000104');
if(_dongsin)_dongsin.manualRules={
  full:{label:'학생부 100% 전형 (교과 80%)',formula:'dongsin2027',subjectFactor:8,unitBonus:50,maxScore:860},
  interview:{label:'면접전형 (교과 56%)',formula:'dongsin2027',subjectFactor:5.6,unitBonus:35,maxScore:605}
};

const _stu=ADIGA_2027_UNIVERSITIES.find(u=>u.code==='0000125');
if(_stu)_stu.manualRules={
  full:{label:'교과성적전형 등 (학생부 100%)',formula:'seoulTheology2027',factor:10,maxScore:1000},
  interview:{label:'일반·기독교·특수교육대상자 (학생부 60%)',formula:'seoulTheology2027',factor:6,maxScore:600}
};

const _koreatech=ADIGA_2027_UNIVERSITIES.find(u=>u.code==='0000189');
if(_koreatech)_koreatech.manualRules={
  engineering:{label:'공학·ICT융합·자율전공(자연)',formula:'koreatech2027',areas:['국어','영어','수학','과학'],maxScore:103},
  social:{label:'사회융합·자율전공(인문)',formula:'koreatech2027',areas:['국어','영어','수학','사회'],maxScore:103}
};

const _kau=ADIGA_2027_UNIVERSITIES.find(u=>u.code==='0000194');
if(_kau)_kau.manualRules={
  engineering:{label:'공과·AI융합·자유전공(공학적성)',formula:'kau2027',areaGroups:[['국어'],['영어'],['수학'],['과학']],maxScore:1006},
  aviation:{label:'항공·경영·항공운항·자유전공',formula:'kau2027',areaGroups:[['국어'],['영어'],['수학'],['사회','과학']],maxScore:1006}
};

const _koreaSejong=ADIGA_2027_UNIVERSITIES.find(u=>u.code==='0000070');
if(_koreaSejong)_koreaSejong.manualRules={
  humanities:{label:'인문·체능·자유전공(글로벌비즈니스/공공정책/문화스포츠)',formula:'splitWeighted2027',commonAreas:['국어','수학','영어','사회','한국사'],careerAreas:['국어','수학','영어','사회','한국사'],rankPoints:[1000,990,980,950,900,700,500,250,0],achievementPoints:{A:1000,B:980,C:900},commonWeight:.9,careerWeight:.1,maxScore:1000},
  natural:{label:'자연·자유전공(과학기술)',formula:'splitWeighted2027',commonAreas:['국어','수학','영어','과학'],careerAreas:['국어','수학','영어','과학'],rankPoints:[1000,990,980,950,900,700,500,250,0],achievementPoints:{A:1000,B:980,C:900},commonWeight:.9,careerWeight:.1,maxScore:1000}
};

const _mokpo=ADIGA_2027_UNIVERSITIES.find(u=>u.code==='0000011');
if(_mokpo)_mokpo.manualRules={all:{label:'학생부교과 전형',formula:'mokpo2027',rankPoints:[900,888.63,877.25,865.88,854.5,843.13,831.76,820.38,809],maxScore:905}};

const _seoultech=ADIGA_2027_UNIVERSITIES.find(u=>u.code==='0000036');
if(_seoultech)_seoultech.manualRules={
  natural:{label:'고교추천 자연·자유전공(창의융합)',formula:'seoultech2027',areas:['국어','수학','영어','과학'],maxScore:1000},
  humanities:{label:'고교추천 인문',formula:'seoultech2027',areas:['국어','수학','영어','사회','한국사'],maxScore:1000},
  architecture:{label:'건축학부 건축학전공',formula:'seoultech2027',areas:['국어','수학','영어','사회','과학','한국사'],maxScore:1000}
};

const _sungshin=ADIGA_2027_UNIVERSITIES.find(u=>u.code==='0000136');
if(_sungshin)_sungshin.manualRules={
  humanities:{label:'지역균형 인문',formula:'sungshin2027',areas:['국어','영어','수학','사회','한국사'],maxScore:90},
  natural:{label:'지역균형 자연·첨단분야',formula:'sungshin2027',areas:['국어','영어','수학','과학'],maxScore:90}
};

const _sookmyung=ADIGA_2027_UNIVERSITIES.find(u=>u.code==='0000141');
if(_sookmyung)_sookmyung.manualRules={all:{label:'지역균형선발 공식 환산석차등급',formula:'sookmyung2027',areas:['국어','수학','영어','사회','한국사','과학']}};

const _inha=ADIGA_2027_UNIVERSITIES.find(u=>u.code==='0000169');
if(_inha)_inha.manualRules={
  humanities:{label:'지역균형 인문',formula:'inha2027',areas:['국어','수학','영어','사회','한국사'],maxScore:100},
  natural:{label:'지역균형 자연',formula:'inha2027',areas:['국어','수학','영어','과학'],maxScore:100},
  liberal:{label:'자유전공융합학부',formula:'inha2027',areas:['국어','수학','영어','사회','한국사','과학'],maxScore:100}
};

const _chugye=ADIGA_2027_UNIVERSITIES.find(u=>u.code==='0000181');
if(_chugye)_chugye.manualRules={all:{label:'미래인재전형 교과 1단계',formula:'weightedAll2027',areas:['국어','수학','영어'],rankPoints:[100,98,95,90,85,80,50,20,0],careerMode:'exclude',maxScore:100}};

const _cnu=ADIGA_2027_UNIVERSITIES.find(u=>u.code==='0000029');
if(_cnu)_cnu.manualRules={
  general:{label:'학생부교과 일반계열',formula:'cnu2027',rankPoints:[100,90,80,70,60,50,40,30,20],maxScore:100},
  arts:{label:'학생부교과 예체능계열',formula:'cnu2027',rankPoints:[90,85,80,75,70,65,60,55,50],maxScore:90}
};

const _hallym=ADIGA_2027_UNIVERSITIES.find(u=>u.code==='0000198');
if(_hallym)_hallym.manualRules={
  general:{label:'전 모집단위 일반',formula:'hallym2027',mode:'top3',maxScore:910},
  nursing:{label:'간호학과',formula:'hallym2027',mode:'nursing',maxScore:910},
  global:{label:'글로벌학부',formula:'hallym2027',mode:'global',maxScore:910}
};

// 금강대학교: 석차등급이 기재된 전 과목을 이수단위로 가중하며,
// 성취도만 있는 진로선택 과목은 원문의 세부 산출방법에 따라 제외한다.
const _geumgang=ADIGA_2027_UNIVERSITIES.find(u=>u.code==='0000224');
if(_geumgang)_geumgang.manualRules={all:{label:'학생부교과 전 전형',formula:'geumgang2027',rankPoints:[100,99,96,93,90,85,80,70,60],maxScore:100}};

// 대전가톨릭대학교: 국·수·영 상위8 + 사·한국사·과 상위4,
// 진로선택은 상위3과목을 A=100/B=89/C=60점으로 환산한다.
const _djcatholic=ADIGA_2027_UNIVERSITIES.find(u=>u.code==='0000094');
if(_djcatholic)_djcatholic.manualRules={all:{label:'학생부교과 전 전형',formula:'djcatholic2027',rankPoints:[100,96,89,77,60,40,23,11,0],achievementPoints:{A:100,B:89,C:60},maxScore:100}};

// 대전신학대학교: 국어·영어·사회 학년별 상위3과목의 단순평균을 학년비율로 반영한다.
const _daejeonTheology=ADIGA_2027_UNIVERSITIES.find(u=>u.code==='0000238');
if(_daejeonTheology)_daejeonTheology.manualRules={
  standard:{label:'일반 학생부교과전형',formula:'daejeonTheology2027',yearWeights:{1:.4,2:.4,3:.2},rankPoints:[600,587.5,575,562.5,550,537.5,525,512.5,500],maxScore:600},
  special:{label:'특별 학생부교과전형',formula:'daejeonTheology2027',yearWeights:{1:.5,2:.3,3:.2},rankPoints:[600,587.5,575,562.5,550,537.5,525,512.5,500],maxScore:600}
};

// 서울한영대학교: 국·수·영·사·과·한국사 전 과목의 학년별 이수단위 가중점수를
// 20%·30%·50%로 합산한 뒤 교과 반영비율 80%를 적용한다.
const _shyu=ADIGA_2027_UNIVERSITIES.find(u=>u.code==='0000205');
if(_shyu)_shyu.manualRules={all:{label:'학생부교과 전 전형 (교과 80%)',formula:'shyu2027',areas:['국어','수학','영어','사회','과학','한국사'],rankPoints:[100,95,90,85,80,75,70,65,60],yearWeights:{1:.2,2:.3,3:.5},maxScore:80}};

// 아신대학교: 국어·영어·사회 전 과목 단순평균을 학년별 등급구간표로 환산한다.
const _acts=ADIGA_2027_UNIVERSITIES.find(u=>u.code==='0000145');
if(_acts)_acts.manualRules={all:{label:'학생부교과 전 전형',formula:'acts2027',areas:['국어','영어','사회'],yearWeights:{1:.3,2:.3,3:.4},rankPoints:[600,560,520,480,440,400,360,320,280],maxScore:600}};

// 예수대학교: 국·영·수·사·과 석차등급 과목의 평균점수를 840~900점으로 환산한다.
const _jesus=ADIGA_2027_UNIVERSITIES.find(u=>u.code==='0000228');
if(_jesus)_jesus.manualRules={all:{label:'학생부교과 전 전형',formula:'jesus2027',areas:['국어','영어','수학','사회','과학'],rankPoints:[9.8,8.8,7.8,6.8,5.8,4.8,3.8,2.8,0],basicScore:840,maxScore:900}};

// 감리교신학대학교: 국어·영어와 사회 또는 과학 전 과목의 단순 평균등급을
// 360+{(9-평균)/8}×360으로 환산한다.
const _mtu=ADIGA_2027_UNIVERSITIES.find(u=>u.code==='0000050');
if(_mtu)_mtu.manualRules={
  social:{label:'학생부교과 (사회교과 선택)',formula:'mtu2027',choiceArea:'사회',maxScore:720},
  science:{label:'학생부교과 (과학교과 선택)',formula:'mtu2027',choiceArea:'과학',maxScore:720}
};

// 김천대학교: 국·영·수 각 상위2 + 사회/과학 중 우수교과 상위2.
// 진로선택은 교과별 상위1, 최대4과목이 일반교과보다 우수할 때 대체한다.
const _gimcheon=ADIGA_2027_UNIVERSITIES.find(u=>u.code==='0000241');
if(_gimcheon)_gimcheon.manualRules={
  full:{label:'일반교과·고른기회·농어촌·기회균형 (교과100%)',formula:'gimcheon2027',factor:1,maxScore:1000},
  regional:{label:'지역인재 (교과90%)',formula:'gimcheon2027',factor:.9,maxScore:900},
  interview:{label:'일반면접 (교과60%)',formula:'gimcheon2027',factor:.6,maxScore:600},
  practical:{label:'실기 (교과30%)',formula:'gimcheon2027',factor:.3,maxScore:300}
};

// 서울기독대학교: 1학년 전 교과, 2·3학년 국어·영어를 30%·30%·40% 반영한다.
const _scu=ADIGA_2027_UNIVERSITIES.find(u=>u.code==='0000098');
if(_scu)_scu.manualRules={
  social:{label:'사회복지·글로벌휴먼경영',formula:'scu2027',rankPoints:[400,390,380,370,360,350,340,330,320],maxScore:400},
  theology:{label:'기독교신학·상담심리전공(야)',formula:'scu2027',rankPoints:[320,312,304,296,288,280,272,264,256],maxScore:320},
  arts:{label:'음악·무용·뮤지컬 실기위주',formula:'scu2027',rankPoints:[100,97.5,95,92.5,90,87.5,85,82.5,80],maxScore:100}
};

// 가톨릭관동대학교: 일반학과는 학년별 우수2과목, 의·간호는 지정교과 전 과목을
// A=1/B=2/C=4로 변환해 이수단위 가중등급으로 산출한다.
const _cku=ADIGA_2027_UNIVERSITIES.find(u=>u.code==='0000072');
if(_cku)_cku.manualRules={
  general:{label:'일반 모집단위',formula:'cku2027',mode:'yearTop2',areas:['국어','수학','영어','사회','과학','한국사'],baseScore:630,range:270,maxScore:900},
  medicine:{label:'의학과·간호학과',formula:'cku2027',mode:'all',areas:['국어','수학','영어','과학'],baseScore:630,range:270,maxScore:900},
  physical:{label:'체육교육과',formula:'cku2027',mode:'yearTop2',areas:['국어','수학','영어','사회','과학','한국사'],baseScore:490,range:210,maxScore:700},
  sports:{label:'스포츠레저·스포츠재활 실기',formula:'cku2027',mode:'yearTop2',areas:['국어','수학','영어','사회','과학','한국사'],baseScore:420,range:180,maxScore:600},
  leader:{label:'스포츠지도학',formula:'cku2027',mode:'yearTop2',areas:['국어','수학','영어','사회','과학','한국사'],baseScore:126,range:54,maxScore:180}
};

// 강원대학교 캠퍼스별 2027 기준. 춘천·제2캠퍼스는 지정교과 전 과목,
// 제3·4캠퍼스 일반학과는 교과별 우수3과목을 공통90%·진로10%로 반영한다.
for(const code of ['0000003','0000004']){
  const u=ADIGA_2027_UNIVERSITIES.find(x=>x.code===code);if(u)u.manualRules={
    general:{label:'일반 모집단위 정량 교과',formula:'kangwon2027',areas:['국어','영어','수학','사회','과학','한국사'],rankPoints:[1000,970,940,910,880,850,820,790,280],achievementPoints:{A:1000,B:970,C:910},commonWeight:.9,careerWeight:.1,maxScore:1000},
    qualitative:{label:'농어촌·사회배려 정량 교과 90% 부분',formula:'kangwon2027',areas:['국어','영어','수학','사회','과학','한국사'],rankPoints:[1000,970,940,910,880,850,820,790,280],achievementPoints:{A:1000,B:970,C:910},commonWeight:.9,careerWeight:0,maxScore:900}
  };
}
for(const code of ['0003363','0003364']){
  const u=ADIGA_2027_UNIVERSITIES.find(x=>x.code===code);if(u)u.manualRules={
    general:{label:'일반 모집단위 교과별 우수3',formula:'kangwon2027',areas:['국어','영어','수학','사회','과학'],topPerArea:3,padMissing:true,rankPoints:[1000,970,940,910,880,850,820,790,280],achievementPoints:{A:1000,B:970,C:910},commonWeight:.9,careerWeight:.1,maxScore:1000}
  };
}
const _kangwonDental=ADIGA_2027_UNIVERSITIES.find(u=>u.code==='0003363');
if(_kangwonDental)_kangwonDental.manualRules.dental={label:'치의예과 전 과목(70단위 미달 보정)',formula:'kangwon2027',areas:['국어','영어','수학','사회','과학'],minCommonUnits:70,rankPoints:[1000,970,940,910,880,850,820,790,280],achievementPoints:{A:1000,B:970,C:910},commonWeight:.9,careerWeight:.1,maxScore:1000};

// 건국대 글로컬: 공통·일반·진로를 모두 이수단위 가중하며 B/C는 성취도 누적분포로 환산한다.
const _konkukGlocal=ADIGA_2027_UNIVERSITIES.find(u=>u.code==='0000053');
if(_konkukGlocal)_konkukGlocal.manualRules={
  human:{label:'인문·예체능계',formula:'konkukGlocal2027',areas:['국어','영어','수학','한국사','사회'],maxScore:10},
  nature:{label:'자연계',formula:'konkukGlocal2027',areas:['국어','영어','수학','한국사','과학'],maxScore:10}
};

// 건국대 서울: 진로선택은 교과정성 30%에서만 평가하므로 정량 70점에는 넣지 않는다.
const _konkuk=ADIGA_2027_UNIVERSITIES.find(u=>u.code==='0000052');
if(_konkuk)_konkuk.manualRules={regional:{label:'KU지역균형 교과정량 70점',formula:'konkuk2027',areas:['국어','수학','영어','과학','사회','한국사'],rankPoints:[10,9.97,9.94,9.9,9.86,9.8,8,6,0],maxScore:70}};

// 경운대학교: 국·영·수 상위6(진로 최대3) + 사·과·한국사 상위3(진로 최대2), 총9과목.
const _kyungwoon=ADIGA_2027_UNIVERSITIES.find(u=>u.code==='0000244');
if(_kyungwoon)_kyungwoon.manualRules={all:{label:'학생부교과 전 전형 (교과성적 540점)',formula:'kyungwoon2027',rankPoints:[100,95,90,85,80,75,70,65,60],achievementRanks:{A:1,B:3,C:5},maxScore:540}};

// 교육대학교 및 한국교원대 정량 교과 산식.
const _ginue=ADIGA_2027_UNIVERSITIES.find(u=>u.code==='0000256');
if(_ginue)_ginue.manualRules={all:{label:'학교장추천전형 교과 70%',formula:'ginue2027',rankPoints:[8,7,6,5,4,3,2,1,0],achievementPoints:{A:8,B:6,C:4},maxScore:700}};

const _gnue=ADIGA_2027_UNIVERSITIES.find(u=>u.code==='0000252');
if(_gnue)_gnue.manualRules={all:{label:'학생부교과 정량 80%',formula:'gnue2027',rankPoints:[100,95,90,85,80,75,70,40,0],achievementPoints:{A:95,B:85,C:75},maxScore:80}};

const _snue=ADIGA_2027_UNIVERSITIES.find(u=>u.code==='0000255');
if(_snue)_snue.manualRules={all:{label:'학교장추천전형 교과 80%',formula:'snue2027',rankPoints:[8,7,6,5,4,3,2,1,0],achievementPoints:{A:8,B:6,C:4},maxScore:800}};

const _knue=ADIGA_2027_UNIVERSITIES.find(u=>u.code==='0000031');
if(_knue)_knue.manualRules={all:{label:'지역인재 교과 90점',formula:'knue2027',rankPoints:[100,95,88,76,59,39,22,10,0],achievementRanks:{A:1,B:2,C:3},maxScore:90}};

// 다음 교육대는 2027 수시에 학생부교과 정량 환산전형을 운영하지 않고 전 영역 정성평가한다.
for(const code of ['0000251','0000253','0000254','0000261']){
  const u=ADIGA_2027_UNIVERSITIES.find(x=>x.code===code);if(u){u.calculationStatus='qualitative';u.status='자료 있음';}
}
const _jnue=ADIGA_2027_UNIVERSITIES.find(u=>u.code==='0000258');
if(_jnue){_jnue.calculationStatus='qualitative';_jnue.status='학생부교과전형 미운영';}

// 국립공주대학교: 교과 900점 + 진로 가산점, 반영교과 총 이수단위 100 미만은 90% 적용.
const _kongju=ADIGA_2027_UNIVERSITIES.find(u=>u.code==='0000008');
if(_kongju)_kongju.manualRules={all:{label:'학생부교과 전 전형 교과+진로가산',formula:'kongju2027',areas:['국어','수학','영어','한국사','사회','과학'],rankPoints:[8,7,6,5,4,3,2,1,0],achievementPoints:{A:5,B:3,C:1},maxScore:905}};

// 국립군산대학교: 계열별 반영교과 평균등급을 교과별로 산출한 뒤 동일비율 평균,
// 진로 상위3과목 A=5/B=3/C=1 가산.
const _kunsan=ADIGA_2027_UNIVERSITIES.find(u=>u.code==='0000009');
if(_kunsan)_kunsan.manualRules={
  human:{label:'인문·사회·예체능·해양경찰',formula:'kunsan2027',areas:['국어','영어','한국사','사회'],maxScore:905},
  nature:{label:'자연과학·공학',formula:'kunsan2027',areas:['수학','영어','한국사','과학'],maxScore:905},
  autonomous:{label:'자율전공학부',formula:'kunsan2027',areas:['국어','수학','영어','한국사','사회','과학'],maxScore:905}
};

// 국립순천대학교: 지정교과 전 과목의 이수단위 가중등급을 실질반영점수 300점으로 환산하고
// 진로 상위3 성취도 가산(부족 시 평균등급 기반 대체 가산)을 더한다.
const _sunchon=ADIGA_2027_UNIVERSITIES.find(u=>u.code==='0000020');
if(_sunchon)_sunchon.manualRules={all:{label:'학생부교과 전형',formula:'sunchon2027',areas:['국어','영어','수학','사회','과학'],achievementPoints:{A:.5,B:.3,C:.1},maxScore:301.5}};

// 국립한국해양대학교: 공통·일반 전 과목 + 진로 상위3(A=1/B=4/C=7)을
// 이수단위 가중평균하여 기본800+실질200점으로 환산한다.
const _kmaritime=ADIGA_2027_UNIVERSITIES.find(u=>u.code==='0000033');
if(_kmaritime)_kmaritime.manualRules={
  human:{label:'인문·사회·예체능계',formula:'kmaritime2027',areas:['국어','영어','수학','사회','한국사'],maxScore:1000},
  nature:{label:'자연계',formula:'kmaritime2027',areas:['국어','영어','수학','과학'],maxScore:1000}
};

// 국립부경대학교: 공통·일반 이수단위 가중등급에서 진로 성취도 점수 구간에 따른
// 0/0.1/0.2등급을 감한 뒤 공식 900점 표로 환산한다.
const _pknu=ADIGA_2027_UNIVERSITIES.find(u=>u.code==='0000013');
if(_pknu)_pknu.manualRules={
  human:{label:'인문·사회계',formula:'pknu2027',areas:['국어','영어','수학','사회','한국사'],mode:'human',maxScore:900},
  nature:{label:'자연계',formula:'pknu2027',areas:['국어','영어','수학','과학','한국사'],mode:'nature',maxScore:900},
  common:{label:'공통·예체능계',formula:'pknu2027',areas:['국어','영어','수학','사회','과학','한국사'],mode:'common',maxScore:900}
};

// 광주대학교: 국·영·수·탐구 교과군별 우수4과목, 부족 과목은 9등급.
const _gwangju=ADIGA_2027_UNIVERSITIES.find(u=>u.code==='0000231');
if(_gwangju)_gwangju.manualRules={
  standard:{label:'일반·지역·수급자 등 교과성적',formula:'gwangju2027',rankPoints:[900,750,650,550,450,350,250,150,0],maxScore:900},
  sharing:{label:'나눔인재 교과성적',formula:'gwangju2027',rankPoints:[600,495,425,355,285,215,145,75,0],maxScore:600},
  practical:{label:'실기일반 교과성적',formula:'gwangju2027',rankPoints:[270,225,195,165,135,105,75,45,0],maxScore:270}
};

// 광주여자대학교: 지정교과 전 과목 이수단위 가중등급, 70단위 가산5점,
// 진로 상위3과목 A=3/B=2/C=1 평균 가산.
const _kwu=ADIGA_2027_UNIVERSITIES.find(u=>u.code==='0000076');
if(_kwu)_kwu.manualRules={all:{label:'학생부교과 모든 전형',formula:'kwu2027',areas:['국어','수학','영어','사회','과학','한국사'],rankPoints:[280,275,270,265,260,255,250,245,243],achievementPoints:{A:3,B:2,C:1},maxScore:288}};

// 고신대학교: 모집단위별 공통·일반 상위과목과 진로 상위과목을 합산하며,
// 진로 과목 부족분은 공통·일반선택 과목으로 보충한다.
const _kosin=ADIGA_2027_UNIVERSITIES.find(u=>u.code==='0000071');
if(_kosin)_kosin.manualRules={
  general:{label:'일반 모집단위(의예·간호 제외)',formula:'kosin2027',mode:'top',commonTop:5,careerTop:3,total:8,rankPoints:[100,97,94,89,84,79,60,41,0],achievementPoints:{A:100,B:94,C:84},maxScore:100},
  nursing:{label:'간호학과',formula:'kosin2027',mode:'top',commonTop:10,careerTop:2,total:12,rankPoints:[100,97,94,89,84,79,60,41,0],achievementPoints:{A:100,B:94,C:84},maxScore:100},
  medicine:{label:'의예과',formula:'kosin2027',mode:'medicine',careerTop:1,rankPoints:[100,99.5,99,98.5,98,97,96,92,0],achievementPoints:{A:100,B:99,C:98},maxScore:100},
  adult:{label:'성인학습자 전 학년 상위4과목',formula:'kosin2027',mode:'adult',total:4,rankPoints:[100,97,94,89,84,79,60,41,0],achievementPoints:{A:100,B:94,C:84},maxScore:100}
};

// 국립금오공과대학교: 공통·일반은 교과별 상위3, 진로는 전체 상위3을
// 계열별 100%/110% 가중치와 이수단위로 가중평균한다.
const _kit=ADIGA_2027_UNIVERSITIES.find(u=>u.code==='0000010');
if(_kit)_kit.manualRules={
  engineering:{label:'공학·첨단융합·미래융합 자율전공',formula:'kit2027',groups:[['국어'],['영어'],['수학'],['과학']],careerAreas:['국어','영어','수학','과학','사회'],weights:{국어:1,영어:1.1,수학:1.1,과학:1.1,사회:1},maxScore:100},
  human:{label:'인문사회계',formula:'kit2027',groups:[['국어'],['영어'],['수학'],['사회','한국사']],careerAreas:['국어','영어','수학','사회','과학'],weights:{국어:1.1,영어:1.1,수학:1.1,사회:1,한국사:1,과학:1},maxScore:100},
  autonomous:{label:'자율전공학부',formula:'kit2027',groups:[['국어'],['영어'],['수학'],['과학'],['사회','한국사']],careerAreas:['국어','영어','수학','과학','사회'],weights:{국어:1,영어:1.1,수학:1.1,과학:1.1,사회:1,한국사:1},maxScore:100}
};

// 국립목포해양대학교: 교과별 전 과목 점수평균을 모집단위별 교과비율로 합산한다.
const _mmu=ADIGA_2027_UNIVERSITIES.find(u=>u.code==='0000012');
if(_mmu)_mmu.manualRules={
  navigation:{label:'항해·항해정보·기관·경찰·메카트로닉스 등',formula:'mmu2027',weights:{국어:.2,수학:.3,영어:.3,탐구:.2},maxScore:1000},
  shipping:{label:'해상운송학부',formula:'mmu2027',weights:{국어:.2,수학:.2,영어:.4,탐구:.2},maxScore:1000},
  environment:{label:'조선해양·환경생명',formula:'mmu2027',weights:{국어:.2,수학:.2,영어:.3,탐구:.3},maxScore:1000},
  sports:{label:'해양스포츠학과',formula:'mmu2027',weights:{국어:.3,수학:.2,영어:.2,탐구:.3},maxScore:1000}
};

// 국민대학교: 공통·일반 전 과목 85% + 진로 성취도 상위3과목 15%.
const _kookmin=ADIGA_2027_UNIVERSITIES.find(u=>u.code==='0000078');
if(_kookmin)_kookmin.manualRules={
  human:{label:'인문·자유전공A·미래융합A',formula:'kookmin2027',areas:['국어','영어','수학','사회'],maxScore:1000},
  nature:{label:'자연·자유전공B·미래융합B',formula:'kookmin2027',areas:['국어','영어','수학','과학'],maxScore:1000}
};

// 나사렛대학교: 학년별 교과평균이 우수한 3개 교과를 30%·35%·35% 반영한다.
const _kornu=ADIGA_2027_UNIVERSITIES.find(u=>u.code==='0000081');
if(_kornu)_kornu.manualRules={
  full:{label:'학생부교과 100%',formula:'kornu2027',factor:1,maxScore:1000},
  practical25:{label:'실기위주 교과25%',formula:'kornu2027',factor:.25,maxScore:250},
  practical10:{label:'실기위주 교과10%',formula:'kornu2027',factor:.1,maxScore:100},
  practical5:{label:'실기위주 교과5%',formula:'kornu2027',factor:.05,maxScore:50}
};

// 남서울대학교: 공통·일반 상위12 + 진로 상위3 점수평균에 전형별 계수를 적용한다.
const _nsu=ADIGA_2027_UNIVERSITIES.find(u=>u.code==='0000245');
if(_nsu)_nsu.manualRules={
  subject90:{label:'학생부교과 일반·지역 등 (교과90%)',formula:'nsu2027',factor:9,maxScore:900},
  interview60:{label:'교과+면접 등 (교과60%)',formula:'nsu2027',factor:6,maxScore:600},
  arts20:{label:'실기 예능계열 (교과20%)',formula:'nsu2027',factor:2,maxScore:200},
  sports30:{label:'실기 체능계열 (교과30%)',formula:'nsu2027',factor:3,maxScore:300}
};

// 국립한밭대학교: 교과군별 상위13과목과 진로 상위3과목을 계열별 비율로 반영.
const _hanbat=ADIGA_2027_UNIVERSITIES.find(u=>u.code==='0000039');
if(_hanbat)_hanbat.manualRules={
  engineering:{label:'공학계열',formula:'hanbat2027',weights:{국어:.2,영어:.25,수학:.35,탐구:.2},maxScore:495},
  human:{label:'인문·디자인계열',formula:'hanbat2027',weights:{국어:.25,영어:.25,수학:.25,탐구:.25},maxScore:495},
  business:{label:'경상계열',formula:'hanbat2027',weights:{국어:.25,영어:.25,수학:.3,탐구:.2},maxScore:495},
  autonomous:{label:'자율전공·빅데이터헬스케어',formula:'hanbat2027',weights:{국어:.2,영어:.25,수학:.3,탐구:.25},maxScore:495}
};

// 대전대학교: 교과면접·지역인재는 교과군별 최대2 중 우수6과목+진로2 가산,
// 그 외 일반학과는 교과군별 상위2(총8) 동일비율 반영.
const _dju=ADIGA_2027_UNIVERSITIES.find(u=>u.code==='0000095');
if(_dju)_dju.manualRules={
  interview:{label:'교과면접 (교과540+진로가산)',formula:'dju2027',mode:'best6',maxScore:540,careerTop:2,careerPoints:{A:9,B:7,C:5}},
  regional:{label:'지역인재Ⅰ·Ⅱ 일반학과',formula:'dju2027',mode:'best6',maxScore:900,careerTop:2,careerPoints:{A:9,B:7,C:5}},
  standard:{label:'교과중점·고른기회·농어촌·기회균형',formula:'dju2027',mode:'group8',maxScore:900},
  military:{label:'군사학과',formula:'dju2027',mode:'group8',maxScore:630}
};

// 동서대학교: 지정교과 우수3 + 전 과목 우수7, 진로는 후자에서 전형별 최대 한도 반영.
const _dongseo=ADIGA_2027_UNIVERSITIES.find(u=>u.code==='0000103');
if(_dongseo)_dongseo.manualRules={
  full:{label:'학생부100% 전형',formula:'dongseo2027',base:100,careerMax:2,maxScore:1000},
  excellence:{label:'고교생활우수자 (학생부90%)',formula:'dongseo2027',base:90,careerMax:4,maxScore:900},
  interview:{label:'학생부면접 (학생부70%)',formula:'dongseo2027',base:70,careerMax:2,maxScore:700},
  practical:{label:'실기·포트폴리오 (학생부20%)',formula:'dongseo2027',base:20,careerMax:2,maxScore:200}
};

// 루터대학교: 공통·일반 상위4 + 진로 상위2(A=1/B=2/C=4), 진로 부족분 일반과목 보충.
const _luther=ADIGA_2027_UNIVERSITIES.find(u=>u.code==='0000108');
if(_luther)_luther.manualRules={all:{label:'학생부교과 모든 전형 공식 환산등급',formula:'luther2027'}};

// 백석대학교: 공통·일반 상위15의 810점 산식 + 성취도·학생비율 진로 상위3(90점).
const _bu=ADIGA_2027_UNIVERSITIES.find(u=>u.code==='0000178');
if(_bu)_bu.manualRules={all:{label:'학생부교과 모든 전형 교과900점',formula:'baekseok2027',maxScore:900}};

// 부산외국어대학교: 국·영·수 우수3을 먼저 확보한 뒤 전체 반영교과 우수7,
// 진로 A=1/B=3/C=5는 최대2과목까지 포함한다.
const _bufs=ADIGA_2027_UNIVERSITIES.find(u=>u.code==='0000115');
if(_bufs)_bufs.manualRules={
  full:{label:'일반고교과·특성화고교과 등 (교과100%)',formula:'bufs2027',factor:1,maxScore:1000},
  interview:{label:'교과면접·만학도 (교과70%)',formula:'bufs2027',factor:.7,maxScore:700}
};

// 고려대학교 학교추천: 전 과목 이수단위 가중, 진로 B/C는 성취도 누적비율 변환석차등급.
const _korea=ADIGA_2027_UNIVERSITIES.find(u=>u.code==='0000069');
if(_korea)_korea.manualRules={all:{label:'학교추천전형 교과90점',formula:'korea2027',rankPoints:[100,96,92,86,70,55,40,20,0],maxScore:90}};

// 서강대학교 지역균형: 석차등급 전 과목 900점 + 성취도·분포비율 전 과목 100점.
const _sogang=ADIGA_2027_UNIVERSITIES.find(u=>u.code==='0000120');
if(_sogang)_sogang.manualRules={all:{label:'지역균형전형 교과1000점',formula:'sogang2027',maxScore:1000}};

// 서울시립대학교 고교추천: 공통·일반 70% + 진로 전 과목 10%, 정성20%는 별도.
const _uos=ADIGA_2027_UNIVERSITIES.find(u=>u.code==='0000040');
if(_uos)_uos.manualRules={all:{label:'고교추천 교과정량 800점',formula:'uos2027',rankPoints:[100,98,95,86,71,50,30,15,0],achievementPoints:{A:100,B:97,C:90},maxScore:800}};

// 한양대학교 서울 추천형: 지정교과 석차등급 전 과목 90점, 진로는 정성10점에서만 평가.
const _hanyang=ADIGA_2027_UNIVERSITIES.find(u=>u.code==='0000203');
if(_hanyang)_hanyang.manualRules={all:{label:'추천형 교과정량 90점',formula:'hanyang2027',areas:['국어','영어','수학','과학','사회','한국사'],rankPoints:[100,96,89,77,60,40,23,11,0],maxScore:90}};

// 서울대학교 수시는 교과를 기계적으로 수치화하지 않는 학생부 전 영역 정성평가이다.
const _snu=ADIGA_2027_UNIVERSITIES.find(u=>u.code==='0000019');
if(_snu){_snu.calculationStatus='qualitative';_snu.status='자료 있음';}

const _dongduk=ADIGA_2027_UNIVERSITIES.find(u=>u.code==='0000102');
if(_dongduk)_dongduk.manualRules={all:{label:'학생부교과우수자',formula:'dongduk2027',rankPoints:[100,98,95,91,86,80,70,60,40],maxScore:100}};

const _sahmyook=ADIGA_2027_UNIVERSITIES.find(u=>u.code==='0000116');
if(_sahmyook)_sahmyook.manualRules={
  general:{label:'일반학과 학교장추천·농어촌·서해5도',formula:'sahmyook2027',groups:[['국어'],['영어'],['수학'],['사회','과학']],maxScore:100},
  arts:{label:'아트앤디자인·체육 상위2교과',formula:'sahmyook2027',groups:[['국어'],['영어'],['수학'],['사회','과학']],topGroups:2,maxScore:100},
  vocational:{label:'특성화고 일반학과',formula:'sahmyook2027',groups:[['국어'],['영어'],['수학']],maxScore:100}
};

const _swu=ADIGA_2027_UNIVERSITIES.find(u=>u.code==='0000126');
if(_swu)_swu.manualRules={
  general:{label:'교과우수자전형',formula:'swu2027',rankPoints:[100,99,98,97,95,90,80,20,0],career:true,maxScore:101},
  physical:{label:'교과우수자전형 체육',formula:'swu2027',rankPoints:[60,59,58,57,55,52,46,38,30],career:false,maxScore:60}
};

const _seowon=ADIGA_2027_UNIVERSITIES.find(u=>u.code==='0000128');
if(_seowon)_seowon.manualRules={
  full:{label:'교과100% 전형',formula:'seowon2027',factor:100,maxScore:1000},
  eighty:{label:'교과80% 전형',formula:'seowon2027',factor:80,maxScore:800},
  sixty:{label:'교과60% 전형',formula:'seowon2027',factor:60,maxScore:600},
  fiftyfive:{label:'교과55% 전형',formula:'seowon2027',factor:55,maxScore:550},
  practical20:{label:'실기 교과20%',formula:'seowon2027',factor:20,maxScore:200},
  practical10:{label:'실기 교과10%',formula:'seowon2027',factor:10,maxScore:100}
};

const _sungkyul=ADIGA_2027_UNIVERSITIES.find(u=>u.code==='0000131');
if(_sungkyul)_sungkyul.manualRules={
  full:{label:'이외 모든 전형 1000점',formula:'sungkyul2027',factor:1,maxScore:1000},
  ministry:{label:'목회자추천·미래인재 700점',formula:'sungkyul2027',factor:.7,maxScore:700},
  creative:{label:'SKU창의 2단계 400점',formula:'sungkyul2027',factor:.4,maxScore:400}
};

const _skhu=ADIGA_2027_UNIVERSITIES.find(u=>u.code==='0000132');
if(_skhu)_skhu.manualRules={
  standard:{label:'교과성적·사회기여·기회균형·농어촌',formula:'skhu2027',mode:'top8',maxScore:500},
  vocational:{label:'특성화고 교과성적',formula:'skhu2027',mode:'all',maxScore:500}
};

const _sunmoon=ADIGA_2027_UNIVERSITIES.find(u=>u.code==='0000129');
if(_sunmoon)_sunmoon.manualRules={
  full:{label:'교과100% 전형',formula:'sunmoon2027',factor:100,maxScore:1000},
  interview:{label:'교과60% 면접전형',formula:'sunmoon2027',factor:60,maxScore:600}
};

// 대구예술대학교: 3학년 1학기까지 석차등급이 있는 전 과목을 이수단위로 가중한다.
// 진로선택 성취도 과목은 공식 반영대상이 아니다.
const _dgau=ADIGA_2027_UNIVERSITIES.find(u=>u.code==='0000087');
if(_dgau)_dgau.manualRules={
  seventy:{label:'학생부 교과 70% 전형',formula:'dgau2027',rankPoints:[70,66.5,63,59.5,56,52.5,49,45.5,42],maxScore:70},
  full:{label:'학생부 교과 100% 전형',formula:'dgau2027',rankPoints:[100,95,90,85,80,75,70,65,60],maxScore:100}
};

// 서울장신대학교: 국어·영어 전 과목과 사회 교과 우수 2과목을 반영한다.
// 2026 결과 공개값(5.86등급→990.28점)과 일치하는 공식 선형식이다.
const _sjs=ADIGA_2027_UNIVERSITIES.find(u=>u.code==='0000127');
if(_sjs)_sjs.manualRules={
  full:{label:'학생부교과 100% 전형',formula:'sjs2027',maxScore:1000,baseScore:1000,step:2},
  sixty:{label:'학생부교과 60% 전형',formula:'sjs2027',maxScore:600,baseScore:600,step:2}
};

// 수원가톨릭대학교: 전 과목을 학년별 이수단위 가중한 뒤 30%·30%·40% 반영.
// 진로선택은 A=2/B=5/C=8등급으로 환산한다.
const _scath=ADIGA_2027_UNIVERSITIES.find(u=>u.code==='0000139');
if(_scath)_scath.manualRules={all:{label:'학생부교과 전형',formula:'scath2027',rankPoints:[100,89,77,60,40,23,11,4,0],achievementRanks:{A:2,B:5,C:8},yearWeights:{1:.3,2:.3,3:.4},maxScore:100}};

// 신경주대학교: 국·수·영·과·사 중 학년별 우수 3개 교과에서 각 1과목(총 9과목).
// 진로선택은 A=1/B=3/C=5등급으로 환산해 동일 후보군에서 비교한다.
const _sgju=ADIGA_2027_UNIVERSITIES.find(u=>u.code==='0000065');
if(_sgju)_sgju.manualRules={
  general:{label:'일반 학생부교과전형',formula:'sgju2027',rankPoints:[600,585,570,555,540,525,510,495,480],maxScore:600},
  interview:{label:'면접·지역인재 교과60%',formula:'sgju2027',rankPoints:[360,345,330,315,300,285,270,255,240],maxScore:360}
};

// 인천가톨릭대학교 본교: 석차등급이 있는 전 과목, 학년별 20%·30%·50%.
const _iccu=ADIGA_2027_UNIVERSITIES.find(u=>u.code==='0000168');
if(_iccu)_iccu.manualRules={all:{label:'학생부교과 전형',formula:'iccu2027',rankPoints:[100,96,89,77,60,40,23,11,0],yearWeights:{1:.2,2:.3,3:.5},maxScore:100}};

// 인천가톨릭대학교 제2캠퍼스: 계열별 학년 우수과목 + 진로 우수 2과목 가산.
const _iccu2=ADIGA_2027_UNIVERSITIES.find(u=>u.code==='0000167');
if(_iccu2)_iccu2.manualRules={
  arts:{label:'조형예술·융합디자인·자유전공',formula:'iccu2_2027',topPerYear:6,yearWeights:{1:.2,2:.4,3:.4},careerTop:2,maxScore:101.5},
  nursing:{label:'간호학과',formula:'iccu2_2027',topPerYear:8,yearWeights:{1:.2,2:.4,3:.4},careerTop:2,maxScore:101.5},
  practical:{label:'실기전형 교과성적',formula:'iccu2_2027',topPerYear:6,yearWeights:{1:.3,2:.4,3:.3},careerTop:2,maxScore:101.5}
};

// 칼빈대학교: 인문·예체능은 영어, 자연은 과학 전 과목 단순평균.
// 진로선택 A/B/C는 각각 3/7/9등급에 대응한다.
const _calvin=ADIGA_2027_UNIVERSITIES.find(u=>u.code==='0000184');
if(_calvin)_calvin.manualRules={
  human:{label:'인문·예체능·자유전공',formula:'calvin2027',areas:['영어'],maxScore:55},
  nature:{label:'자연계',formula:'calvin2027',areas:['과학'],maxScore:55}
};

// 한국성서대학교: 성서학과는 국·영·수·탐구 각 우수2, 그 외는 지정교과 전 과목.
const _bible=ADIGA_2027_UNIVERSITIES.find(u=>u.code==='0000191');
if(_bible)_bible.manualRules={
  bible:{label:'성서학과 일반전형',formula:'bible2027',mode:'top8',rankPoints:[700,696,692,688,684,679,674,668,658],maxScore:700},
  general:{label:'일반 모집단위',formula:'bible2027',mode:'all',rankPoints:[700,696,692,688,684,679,674,668,658],maxScore:700},
  excellence:{label:'교과성적우수자',formula:'bible2027',mode:'all',rankPoints:[800,796,792,788,784,779,774,768,760],maxScore:800},
  pastor:{label:'목회자추천 등',formula:'bible2027',mode:'all',rankPoints:[600,596,592,588,584,579,574,569,564],maxScore:600}
};

// 한국체육대학교: 공통·일반 및 진로 전 과목을 학년별 이수단위 가중,
// 진로 A=2/B=5/C=8등급, 학년별 30%·30%·40%.
const _knsu=ADIGA_2027_UNIVERSITIES.find(u=>u.code==='0000032');
if(_knsu)_knsu.manualRules={all:{label:'학생부교과전형',formula:'knsu2027',achievementRanks:{A:2,B:5,C:8},yearWeights:{1:.3,2:.3,3:.4},maxScore:100}};

// 다음 대학은 2027 수시에서 정량 학생부교과 환산전형을 운영하지 않는다.
for(const code of ['0000260','0000262','0000188']){
  const u=ADIGA_2027_UNIVERSITIES.find(x=>x.code===code);if(u){u.calculationStatus='qualitative';u.status='자료 있음';}
}

// 강서대학교: 모집단위별 3개 교과군 상위3(간호는 4개 교과군 상위5),
// 부족 과목 9등급 보정 + 진로 상위3 A=3/B=2/C=1 가산.
const _gangseo=ADIGA_2027_UNIVERSITIES.find(u=>u.code==='0000079');
if(_gangseo)_gangseo.manualRules={
  human:{label:'신학·경영·복지·상담·자유전공',formula:'gangseo2027',groups:[['영어'],['국어','수학'],['사회','한국사','과학']],perGroup:3,career:true,maxScore:1003},
  nutrition:{label:'식품영양학과',formula:'gangseo2027',groups:[['수학'],['국어','영어'],['사회','한국사','과학']],perGroup:3,career:true,maxScore:1003},
  nursing:{label:'간호학과',formula:'gangseo2027',groups:[['국어'],['수학'],['영어'],['사회','한국사','과학']],perGroup:5,career:true,maxScore:1003},
  music:{label:'실용음악학과',formula:'gangseo2027',groups:[['영어'],['국어','수학'],['사회','한국사','과학']],perGroup:3,career:false,maxScore:1000}
};

// 건양대학교 제2캠퍼스: 모집단위별 전 과목/교과별3/전체상위6, 이수단위 조건 0.97.
const _konyang2=ADIGA_2027_UNIVERSITIES.find(u=>u.code==='0000055');
if(_konyang2)_konyang2.manualRules={
  medicine:{label:'의학과',formula:'konyang2_2027',mode:'medicine',minUnits:75,maxScore:100},
  health:{label:'데이터의학·간호·치료·임상계열',formula:'konyang2_2027',mode:'perArea12',minUnits:36,maxScore:100},
  other:{label:'병원경영·안경·응급·의료공과·AI/SW',formula:'konyang2_2027',mode:'top6',minUnits:0,maxScore:100}
};

// 계명대학교: 계열별 우수 3개 교과 전 과목(예체능2, 의약5), 진로 상위3.
// 지역전형은 일반40+진로40을 분리한다.
const _keimyung=ADIGA_2027_UNIVERSITIES.find(u=>u.code==='0000068');
if(_keimyung)_keimyung.manualRules={
  human:{label:'인문사회계열 일반 교과',formula:'keimyung2027',areas:['국어','수학','영어','사회','한국사'],topAreas:3,regional:false,maxScore:80},
  nature:{label:'자연공학계열 일반 교과',formula:'keimyung2027',areas:['국어','수학','영어','과학'],topAreas:3,regional:false,maxScore:80},
  arts:{label:'예체능계열 일반 교과',formula:'keimyung2027',areas:['국어','영어'],topAreas:2,regional:false,maxScore:80},
  medical:{label:'의예·약학 일반 교과',formula:'keimyung2027',areas:['국어','수학','영어','과학','한국사'],topAreas:5,regional:false,maxScore:80},
  regional:{label:'지역전형 교과40+진로40',formula:'keimyung2027',areas:['국어','수학','영어','사회','과학','한국사'],topAreas:3,regional:true,maxScore:80}
};

// 국립한국교통대학교: 교과별 상위3(총12)+진로 상위3, 이수단위 가중.
const _ut=ADIGA_2027_UNIVERSITIES.find(u=>u.code==='0000034');
if(_ut)_ut.manualRules={
  human:{label:'인문·예체능계열',formula:'ut2027',areas:['국어','영어','수학','사회'],factor:10,maxScore:1000},
  nature:{label:'자연계열',formula:'ut2027',areas:['국어','영어','수학','과학'],factor:10,maxScore:1000},
  music:{label:'음악학과',formula:'ut2027',areas:['국어','영어','수학','사회'],factor:2,maxScore:200},
  sportsMedicine:{label:'스포츠의학과',formula:'ut2027',areas:['국어','영어','수학','사회'],factor:6,maxScore:600}
};

const _kdu=ADIGA_2027_UNIVERSITIES.find(u=>u.code==='0000080');
if(_kdu)_kdu.manualRules={general:{label:'일반학생 교과90%',formula:'kdu2027',maxScore:540,step:12},full:{label:'교과우수자·지역·기회균형 교과90%',formula:'kdu2027',maxScore:900,step:20}};

const _nambu=ADIGA_2027_UNIVERSITIES.find(u=>u.code==='0000216');
if(_nambu)_nambu.manualRules={seventy:{label:'학생부70% 모집단위 교과',formula:'nambu2027',rankPoints:[630,600,570,540,510,480,450,410,315],careerPoints:{A:5,B:3,C:1},maxScore:635},full:{label:'학생부100% 모집단위 교과',formula:'nambu2027',rankPoints:[900,850,800,750,700,650,600,540,450],careerPoints:{A:10,B:6,C:2},maxScore:910}};

for(const code of ['0000082','0002726']){
  const u=ADIGA_2027_UNIVERSITIES.find(x=>x.code===code);if(u)u.manualRules={
    standard:{label:code==='0000082'?'지역균형선발':'학생부교과우수자·지역메디바이오',formula:'dankook2027',areas:['국어','수학','영어','사회','과학','한국사'],rankPoints:[100,99,98,97,96,95,70,40,0],achievementPoints:{A:100,B:98,C:96},factor:code==='0000082'?1:.95,maxScore:code==='0000082'?100:95},
    physical:{label:'체육계열 교과',formula:'dankook2027',areas:['국어','영어','사회','한국사'],rankPoints:[100,95,90,85,80,75,70,65,60],achievementPoints:{A:100,B:90,C:80},factor:code==='0000082'?.65:.95,maxScore:code==='0000082'?65:95}
  };
}

const _daegu=ADIGA_2027_UNIVERSITIES.find(u=>u.code==='0000084');
if(_daegu)_daegu.manualRules={general:{label:'인문·자연·공학계열 상위12',formula:'daegu2027',total:12,maxScore:100},arts:{label:'예체능계열 상위10',formula:'daegu2027',total:10,maxScore:100}};

const _dhu=ADIGA_2027_UNIVERSITIES.find(u=>u.code==='0000061');
if(_dhu)_dhu.manualRules={general:{label:'일반·기회균형 교과100%',formula:'dhu2027',mode:'top12',factor:1,maxScore:1000},interview:{label:'면접전형 교과70%',formula:'dhu2027',mode:'top12',factor:.7,maxScore:700},regional:{label:'지역인재 교과80%',formula:'dhu2027',mode:'top12',factor:.8,maxScore:800},medicineNature:{label:'한의예과 자연',formula:'dhu2027',mode:'medicineNature',factor:1,maxScore:1000},medicineHuman:{label:'한의예과 인문',formula:'dhu2027',mode:'medicineHuman',factor:1,maxScore:1000}};

const _deu=ADIGA_2027_UNIVERSITIES.find(u=>u.code==='0000107');
if(_deu)_deu.manualRules={general:{label:'전 모집단위(한의예 제외)',formula:'deu2027',mode:'top12',maxScore:1000},medicine:{label:'한의예과',formula:'deu2027',mode:'all',maxScore:1000}};

// 상명대학교 양 캠퍼스: 석차등급 전 과목 + 진로 우수 최대3, 이수단위 가중.
for(const code of ['0000117','0002959']){
  const u=ADIGA_2027_UNIVERSITIES.find(x=>x.code===code);if(u)u.manualRules={all:{label:'고교추천·학생부교과 등',formula:'sangmyung2027',rankPoints:[100,98,96,94,90,80,60,40,0],achievementPoints:{A:100,B:96,C:90},careerMax:3,maxScore:100}};
}

// 순천향대학교: 지정교과 석차등급 전 과목 T와 진로 전 과목 U를 분리 산출.
const _sch=ADIGA_2027_UNIVERSITIES.find(u=>u.code==='0000142');
if(_sch)_sch.manualRules={
  full:{label:'학생부교과전형',formula:'sch2027',factor:10,careerFactor:1,offset:100,minScore:800,maxScore:1000},
  sports:{label:'스포츠계열 실기 교과30%',formula:'sch2027',factor:3,careerFactor:.3,offset:30,minScore:240,maxScore:300},
  animation:{label:'디지털애니메이션 교과40%',formula:'sch2027',factor:4,careerFactor:.4,offset:40,minScore:320,maxScore:400},
  performance:{label:'공연영상 교과20%',formula:'sch2027',factor:2,careerFactor:.2,offset:20,minScore:160,maxScore:200}
};

const _skku=ADIGA_2027_UNIVERSITIES.find(u=>u.code==='0000133');
if(_skku)_skku.manualRules={all:{label:'학교장추천 정량평가 800점',formula:'skku2027',aAreas:['국어','수학','영어','한국사','사회','과학'],bAreas:['기술·가정','제2외국어','한문'],aPoints:[100,96,90,80,65,45,20,10,0],bPoints:[100,98,95,90,80,50,30,10,0],maxScore:800}};

const _semyung=ADIGA_2027_UNIVERSITIES.find(u=>u.code==='0000137');
if(_semyung)_semyung.manualRules={
  general:{label:'일반 모집단위 상위10',formula:'semyung2027',mode:'top10',maxScore:1000},
  nursing:{label:'간호학과 국영수12+탐구3',formula:'semyung2027',mode:'nursing',maxScore:1000},
  medicine:{label:'한의예과 국영수15+탐구5',formula:'semyung2027',mode:'medicine',maxScore:1000}
};

const _soongsil=ADIGA_2027_UNIVERSITIES.find(u=>u.code==='0000143');
if(_soongsil)_soongsil.manualRules={
  human:{label:'인문계열 교과우수자',formula:'soongsil2027',weights:{국어:.35,수학:.15,영어:.35,사회:.15},maxScore:100},
  nature:{label:'자연계열 교과우수자',formula:'soongsil2027',weights:{국어:.15,수학:.35,영어:.15,과학:.35},maxScore:100}
};

const _ajou=ADIGA_2027_UNIVERSITIES.find(u=>u.code==='0000146');
if(_ajou)_ajou.manualRules={all:{label:'고교추천전형',formula:'ajou2027',areas:['국어','영어','수학','사회','과학'],rankPoints:[100,99,98,95,90,85,75,65,0],achievementPoints:{A:100,B:98,C:90},careerMax:5,maxScore:100}};

const _yonseiMirae=ADIGA_2027_UNIVERSITIES.find(u=>u.code==='0000150');
if(_yonseiMirae)_yonseiMirae.manualRules={recommend:{label:'교과우수자 추천형',formula:'yonseiMirae2027',commonTop:null,maxScore:100},general:{label:'교과우수자 일반형',formula:'yonseiMirae2027',commonTop:10,maxScore:100}};

const _yu=ADIGA_2027_UNIVERSITIES.find(u=>u.code==='0000151');
if(_yu)_yu.manualRules={standard:{label:'일반·지역·기회균형 등',formula:'yu2027',commonBase:600,commonStep:8,careerBase:32,careerStep:.8,maxScore:720},creative:{label:'창의인재',formula:'yu2027',commonBase:420,commonStep:5.6,careerBase:22.4,careerStep:.56,maxScore:504},military:{label:'군사학특별',formula:'yu2027',commonBase:525,commonStep:7,careerBase:28,careerStep:.7,maxScore:630}};

const _inu=ADIGA_2027_UNIVERSITIES.find(u=>u.code==='0002660');
if(_inu)_inu.manualRules={human:{label:'인문·패션·디자인',formula:'inu2027',weights:{국어:.3,수학:.2,영어:.3,사회:.2},bonusRate:.05,maxScore:'350+가산'},nature:{label:'자연계열',formula:'inu2027',weights:{국어:.2,수학:.3,영어:.3,과학:.2},bonusRate:.05,maxScore:'350+가산'},free:{label:'자유전공학부',formula:'inu2027',weights:{국어:.25,수학:.25,영어:.25,사회:.25},bonusRate:.2,maxScore:'350+가산'}};

const _jbnu=ADIGA_2027_UNIVERSITIES.find(u=>u.code==='0000025');
if(_jbnu)_jbnu.manualRules={full:{label:'학생부1000점 전형',formula:'jbnu2027',maxScore:1000,base:930,range:70},eight:{label:'학생부800점 전형',formula:'jbnu2027',maxScore:800,base:744,range:56},five:{label:'학생부500점 전형',formula:'jbnu2027',maxScore:500,base:460,range:40},three:{label:'학생부300점 전형',formula:'jbnu2027',maxScore:300,base:260,range:40}};

const _jejunu=ADIGA_2027_UNIVERSITIES.find(u=>u.code==='0000027');
if(_jejunu)_jejunu.manualRules={all:{label:'학생부교과 모든 전형',formula:'jejunu2027',rankPoints:[1000,980,960,940,920,900,880,860,840],achievementPoints:{A:1000,B:970,C:940},maxScore:1000}};

const _cbnu=ADIGA_2027_UNIVERSITIES.find(u=>u.code==='0000030');
if(_cbnu)_cbnu.manualRules={all:{label:'학생부교과 모든 전형',formula:'cbnu2027',areas:['국어','영어','수학','사회','과학','한국사'],rankPoints:[80,78,76,74,72,70,68,56,40],maxScore:360}};

const _woosuk=ADIGA_2027_UNIVERSITIES.find(u=>u.code==='0000157');
if(_woosuk)_woosuk.manualRules={full:{label:'교과·지역 등 400점',formula:'woosuk2027',mode:'top10',base:360,factor:1,maxScore:410},medicine:{label:'한의·한약·약학 전 과목',formula:'woosuk2027',mode:'all',base:360,factor:1,maxScore:410},interview2:{label:'교과면접 2단계 70%',formula:'woosuk2027',mode:'top10',base:252,factor:.7,maxScore:287}};

const _uiduk=ADIGA_2027_UNIVERSITIES.find(u=>u.code==='0000160');
if(_uiduk)_uiduk.manualRules={full:{label:'교과일반 등 교과80%',formula:'uiduk2027',scores:[800,760,720,680,640,600,560,520,480],maxScore:800},interview:{label:'교과면접 등 교과80%',formula:'uiduk2027',scores:[510,471,432,393,354,315,276,237,198],maxScore:510}};

const _inje=ADIGA_2027_UNIVERSITIES.find(u=>u.code==='0000164');
if(_inje)_inje.manualRules={general:{label:'일반 모집단위 상위10',formula:'inje2027',mode:'top10',maxScore:100},interview:{label:'면접·사회배려 교과70%',formula:'inje2027',mode:'top10',maxScore:70},medicine:{label:'의예·약학 전 과목',formula:'inje2027',mode:'medicine',maxScore:100}};

const _hannam=ADIGA_2027_UNIVERSITIES.find(u=>u.code==='0000195');
if(_hannam)_hannam.manualRules={human:{label:'인문계열 상위15',formula:'hannam2027',mode:'human',count:15,maxScore:500},nature:{label:'자연계열 수학3+선택12',formula:'hannam2027',mode:'nature',count:15,maxScore:500},arts:{label:'예체능계열 상위10',formula:'hannam2027',mode:'arts',count:10,maxScore:500}};

const _dcu=ADIGA_2027_UNIVERSITIES.find(u=>u.code==='0000088');
if(_dcu)_dcu.manualRules={general:{label:'일반 모집단위 공통8+진로4',formula:'dcu2027',commonTop:8,careerTop:4,maxScore:100},regional:{label:'지역교과 공통6+진로6',formula:'dcu2027',commonTop:6,careerTop:6,maxScore:100},arts:{label:'생활체육·예능 상위8(진로최대2)',formula:'dcu2027',commonTop:8,careerTop:2,combined:true,maxScore:100},medical:{label:'의예·약학 전 과목+진로가산3',formula:'dcu2027',medical:true,careerTop:3,maxScore:'100+3'}};

const _songwon=ADIGA_2027_UNIVERSITIES.find(u=>u.code==='0000243');
if(_songwon)_songwon.manualRules={student:{label:'학생부우수자 교과75%',formula:'songwon2027',table:[750,745,740,737,735,733,731,726,720],maxScore:750},interview:{label:'면접우수자 교과70%',formula:'songwon2027',table:[700,699,698,697,696,690,684,678,672],maxScore:700},practical:{label:'실기우수자 교과30%',formula:'songwon2027',table:[300,298,296,294,293,292,291,290,288],maxScore:300}};

const _suwon=ADIGA_2027_UNIVERSITIES.find(u=>u.code==='0000140');
if(_suwon)_suwon.manualRules={human:{label:'인문계열 교과우수',formula:'suwon2027',areas:['국어','수학','영어','사회'],weights:[.3,.3,.25,.15],table:[100,99.6,99.2,98.8,98.4,97.6,95.6,93.6,90],maxScore:100},nature:{label:'자연계열 교과우수',formula:'suwon2027',areas:['국어','수학','영어','과학'],weights:[.3,.3,.25,.15],table:[100,99.6,99.2,98.8,98.4,97.6,95.6,93.6,90],maxScore:100},arts:{label:'예체능계열 우수2교과',formula:'suwon2027',areas:['국어','수학','영어','사회','과학'],weights:[.5,.5],table:[100,98,96,94,92,88,78,68,50],maxScore:100}};

for(const code of ['0000147','0000148']){const u=ADIGA_2027_UNIVERSITIES.find(x=>x.code===code);if(u)u.manualRules={human:{label:'인문사회계열 상위12',formula:'anyang2027',areas:['국어','수학','영어','사회','한국사'],count:12,maxScore:100},nature:{label:'자연공학계열 상위12',formula:'anyang2027',areas:['국어','수학','영어','과학'],count:12,maxScore:100},free:{label:'자유전공 상위15',formula:'anyang2027',areas:['국어','수학','영어','사회','한국사','과학'],count:15,maxScore:100}};}

const _yongin=ADIGA_2027_UNIVERSITIES.find(u=>u.code==='0000156');
if(_yongin)_yongin.manualRules={general:{label:'실기 미실시 일반학과',formula:'yongin2027',perYear:4,table:[500,475,450,425,400,375,275,150,0],maxScore:500},practical:{label:'실기 실시학과',formula:'yongin2027',perYear:3,table:[150,142.5,135,127.5,120,112.5,82.5,45,0],maxScore:150},athlete:{label:'체육우수자',formula:'yongin2027',perYear:3,table:[120,114,108,102,96,90,66,36,0],maxScore:120}};

const _wsu=ADIGA_2027_UNIVERSITIES.find(u=>u.code==='0000240');
if(_wsu)_wsu.manualRules={full:{label:'교과중심·지역·자기추천 등',formula:'wsu2027',total:12,required:2,maxBase:900,offset:60,maxScore:900},interview:{label:'교과면접',formula:'wsu2027',total:6,required:1,maxBase:720,offset:10,maxScore:720},vocational:{label:'특성화고교졸업자',formula:'wsu2027',total:12,required:2,maxBase:900,offset:10,maxScore:900}};
