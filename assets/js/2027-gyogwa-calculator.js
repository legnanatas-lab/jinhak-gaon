const AREAS = ['국어', '수학', '영어', '사회', '과학', '한국사', '기타'];
const STORAGE_KEY = '2027_naesin_subjects_v2';

let subjIdSeq = 1;
let subjects = [];
let selectedUniNames = new Set();
let calcResults = [];

function defaultGradeTable() {
  return { 1:100, 2:96, 3:92, 4:88, 5:84, 6:78, 7:70, 8:60, 9:50 };
}

function escapeHtml(value) {
  return String(value ?? '')
    .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;').replace(/'/g, '&#039;');
}

function toNullableNumber(value) {
  if (value === null || value === undefined) return null;
  const t = String(value).trim();
  if (t === '') return null;
  const n = Number(t);
  return Number.isFinite(n) ? n : null;
}

function normalizeArea(value) {
  const t = String(value ?? '').trim().replace(/\s+/g, '');
  if (!t) return '기타';
  // '제2외국어' 안의 '국어' 문자열 때문에 국어로 오인하지 않도록 기타 영역을 먼저 판정한다.
  if (t.includes('기술') || t.includes('가정') || t.includes('제2외국어') || t.includes('한문') || t.includes('교양') || t.includes('체육') || t.includes('예술') || t.includes('음악') || t.includes('미술') || t.includes('정보')) return '기타';
  if (t.includes('한국사')) return '한국사';
  if (t.includes('사회') || t.includes('역사') || t.includes('도덕')) return '사회';
  if (t.includes('과학')) return '과학';
  if (t.includes('수학')) return '수학';
  if (t.includes('영어')) return '영어';
  if (t.includes('국어')) return '국어';
  return '기타';
}

function normalizeAchievement(value) {
  const t = String(value ?? '').trim().toUpperCase();
  return ['A','B','C'].includes(t) ? t : '';
}

function normalizeType(value) {
  const t = String(value ?? '').trim();
  return (t.includes('진로') || t.includes('전문')) ? 'career' : 'common';
}

function hasValidRank(s) {
  const r = toNullableNumber(s?.rank);
  return Number.isInteger(r) && r >= 1 && r <= 9;
}

function hasValidCareer(s) {
  return ['A','B','C'].includes(normalizeAchievement(s?.achv));
}

function validCredit(s) {
  const c = toNullableNumber(s?.credit);
  return c !== null && c > 0 ? c : 0;
}

function addSubject(data, shouldRender = true) {
  const raw = data || {};
  const id = subjIdSeq++;
  const type = raw.type === 'career' ? 'career' : (raw.type === 'common' ? 'common' : normalizeType(raw.type));
  const rank = toNullableNumber(raw.rank);
  const credit = toNullableNumber(raw.credit);
  subjects.push({
    id,
    grade: [1,2,3].includes(Number(raw.grade)) ? Number(raw.grade) : 1,
    sem: [1,2].includes(Number(raw.sem)) ? Number(raw.sem) : 1,
    area: AREAS.includes(raw.area) ? raw.area : normalizeArea(raw.area),
    name: String(raw.name ?? ''),
    type,
    credit: credit !== null && credit > 0 ? credit : 3,
    rank: Number.isInteger(rank) && rank >= 1 && rank <= 9 ? rank : null,
    achv: normalizeAchievement(raw.achv)
  });
  if (shouldRender) renderSubjects();
}

function removeSubject(id) {
  subjects = subjects.filter(s => s.id !== id);
  renderSubjects();
}

function clearSubjects() {
  subjects = [];
  const defaultAreas = ['국어','수학','영어','사회','과학'];
  defaultAreas.forEach(area => addSubject({ grade:1, sem:1, area, name:'', type:'common', credit:3, rank:null, achv:'' }, false));
  renderSubjects();
}

function updSubject(id, key, val, isNumeric) {
  const s = subjects.find(x => x.id === id);
  if (!s) return;
  if (key === 'rank') {
    const n = toNullableNumber(val);
    s.rank = Number.isInteger(n) && n >= 1 && n <= 9 ? n : null;
  } else if (key === 'credit') {
    const n = toNullableNumber(val);
    s.credit = n !== null && n > 0 ? n : null;
  } else if (key === 'grade' || key === 'sem') {
    const n = toNullableNumber(val);
    s[key] = n === null ? s[key] : n;
  } else if (key === 'achv') {
    s.achv = normalizeAchievement(val);
  } else if (key === 'area') {
    s.area = AREAS.includes(val) ? val : normalizeArea(val);
  } else {
    s[key] = isNumeric ? toNullableNumber(val) : val;
  }
  if (key === 'type') renderSubjects();
  else updateDashboard();
}

function renderSubjects() {
  const tbody = document.getElementById('subjTbody');
  if (!tbody) return;
  tbody.innerHTML = '';

  subjects.forEach(s => {
    const tr = document.createElement('tr');
    const rankValue = hasValidRank(s) ? Number(s.rank) : null;
    const achvValue = normalizeAchievement(s.achv);
    tr.innerHTML = `
      <td><select onchange="updSubject(${s.id},'grade',this.value,true)">
        ${[1,2,3].map(g => `<option value="${g}" ${g===Number(s.grade)?'selected':''}>${g}학년</option>`).join('')}
      </select></td>
      <td><select onchange="updSubject(${s.id},'sem',this.value,true)">
        ${[1,2].map(m => `<option value="${m}" ${m===Number(s.sem)?'selected':''}>${m}학기</option>`).join('')}
      </select></td>
      <td><select onchange="updSubject(${s.id},'area',this.value)">
        ${AREAS.map(a => `<option value="${a}" ${a===s.area?'selected':''}>${a}</option>`).join('')}
      </select></td>
      <td><input type="text" value="${escapeHtml(s.name)}" placeholder="과목명 (예: 독서)" onchange="updSubject(${s.id},'name',this.value)"></td>
      <td><select onchange="updSubject(${s.id},'type',this.value)">
        <option value="common" ${s.type==='common'?'selected':''}>공통/일반선택</option>
        <option value="career" ${s.type==='career'?'selected':''}>진로선택/전문교과</option>
      </select></td>
      <td><input type="number" min="0" max="20" value="${s.credit ?? ''}" onchange="updSubject(${s.id},'credit',this.value,true)"></td>
      <td>${s.type === 'common'
        ? `<select onchange="updSubject(${s.id},'rank',this.value,true)"><option value="" ${rankValue===null?'selected':''}>등급 없음</option>${[1,2,3,4,5,6,7,8,9].map(r => `<option value="${r}" ${r===rankValue?'selected':''}>${r}등급</option>`).join('')}</select>`
        : `<select onchange="updSubject(${s.id},'achv',this.value)"><option value="" ${!achvValue?'selected':''}>성취도 없음</option>${['A','B','C'].map(a => `<option value="${a}" ${a===achvValue?'selected':''}>${a} 성취도</option>`).join('')}</select>`
      }</td>
      <td style="text-align:center;"><button class="btn btn-danger btn-sm" onclick="removeSubject(${s.id})">✕</button></td>
    `;
    tbody.appendChild(tr);
  });

  updateDashboard();
}

function loadSample(type) {
  subjects = [];
  let sampleData = [];
  if (type === 'nature') {
    sampleData = [
      {grade:1,sem:1,area:'국어',name:'공통국어',type:'common',credit:4,rank:4},
      {grade:1,sem:1,area:'수학',name:'공통수학',type:'common',credit:4,rank:3},
      {grade:1,sem:1,area:'영어',name:'공통영어',type:'common',credit:4,rank:4},
      {grade:1,sem:1,area:'과학',name:'통합과학',type:'common',credit:3,rank:3},
      {grade:1,sem:1,area:'과학',name:'과학탐구실험',type:'common',credit:1,rank:null,achv:'A'},
      {grade:1,sem:1,area:'한국사',name:'한국사',type:'common',credit:3,rank:4},
      {grade:1,sem:2,area:'국어',name:'국어Ⅱ',type:'common',credit:4,rank:4},
      {grade:1,sem:2,area:'수학',name:'수학Ⅱ',type:'common',credit:4,rank:3},
      {grade:1,sem:2,area:'영어',name:'영어Ⅱ',type:'common',credit:4,rank:5},
      {grade:2,sem:1,area:'수학',name:'대수',type:'common',credit:4,rank:2},
      {grade:2,sem:1,area:'영어',name:'영어I',type:'common',credit:4,rank:4},
      {grade:2,sem:1,area:'과학',name:'물리학Ⅰ',type:'common',credit:3,rank:3},
      {grade:2,sem:2,area:'수학',name:'미적분',type:'common',credit:4,rank:2},
      {grade:2,sem:2,area:'과학',name:'화학Ⅰ',type:'common',credit:3,rank:3},
      {grade:3,sem:1,area:'수학',name:'기하',type:'career',credit:4,achv:'A'},
      {grade:3,sem:1,area:'과학',name:'물리학Ⅱ',type:'career',credit:4,achv:'A'},
      {grade:3,sem:1,area:'과학',name:'화학Ⅱ',type:'career',credit:4,achv:'A'},
      {grade:3,sem:1,area:'영어',name:'영어독해와작문',type:'common',credit:3,rank:4}
    ];
  } else {
    sampleData = [
      {grade:1,sem:1,area:'국어',name:'공통국어',type:'common',credit:4,rank:4},
      {grade:1,sem:1,area:'수학',name:'공통수학',type:'common',credit:4,rank:5},
      {grade:1,sem:1,area:'영어',name:'공통영어',type:'common',credit:4,rank:4},
      {grade:1,sem:1,area:'사회',name:'통합사회',type:'common',credit:3,rank:3},
      {grade:1,sem:1,area:'한국사',name:'한국사',type:'common',credit:3,rank:4},
      {grade:1,sem:1,area:'기타',name:'음악',type:'common',credit:2,rank:null,achv:'A'},
      {grade:2,sem:1,area:'국어',name:'문학',type:'common',credit:4,rank:2},
      {grade:2,sem:1,area:'사회',name:'생활과윤리',type:'common',credit:3,rank:2},
      {grade:2,sem:1,area:'사회',name:'사회문화',type:'common',credit:3,rank:3},
      {grade:2,sem:2,area:'국어',name:'언어와매체',type:'common',credit:4,rank:3},
      {grade:2,sem:2,area:'수학',name:'확률과통계',type:'common',credit:4,rank:5},
      {grade:3,sem:1,area:'사회',name:'정치와법',type:'career',credit:4,achv:'A'},
      {grade:3,sem:1,area:'사회',name:'현대사회와철학',type:'career',credit:3,achv:'A'},
      {grade:3,sem:1,area:'영어',name:'심화영어',type:'career',credit:4,achv:'A'}
    ];
  }
  sampleData.forEach(d => addSubject(d, false));
  renderSubjects();
}

function getBaseAvgGrade() {
  const commons = subjects.filter(s => s.type === 'common' && hasValidRank(s) && validCredit(s) > 0);
  const wSum = commons.reduce((sum,s) => sum + validCredit(s), 0);
  const vSum = commons.reduce((sum,s) => sum + Number(s.rank) * validCredit(s), 0);
  return wSum > 0 ? vSum / wSum : 0;
}

function updateDashboard() {
  const commons = subjects.filter(s => s.type === 'common' && hasValidRank(s) && validCredit(s) > 0);
  const wSum = commons.reduce((sum,s) => sum + validCredit(s), 0);
  const vSum = commons.reduce((sum,s) => sum + Number(s.rank) * validCredit(s), 0);
  const core = commons.filter(s => ['국어','수학','영어','사회','과학'].includes(s.area));
  const coreWSum = core.reduce((sum,s) => sum + validCredit(s), 0);
  const coreVSum = core.reduce((sum,s) => sum + Number(s.rank) * validCredit(s), 0);

  const avgGrade = wSum > 0 ? (vSum / wSum).toFixed(2) : '-';
  const coreAvg = coreWSum > 0 ? (coreVSum / coreWSum).toFixed(2) : '-';
  const totalCredits = subjects.reduce((a,b) => a + validCredit(b), 0);
  const careers = subjects.filter(s => s.type === 'career' && hasValidCareer(s));
  const countA = careers.filter(s => normalizeAchievement(s.achv) === 'A').length;
  const countB = careers.filter(s => normalizeAchievement(s.achv) === 'B').length;
  const countC = careers.filter(s => normalizeAchievement(s.achv) === 'C').length;
  const ungraded = subjects.filter(s => s.type === 'common' && !hasValidRank(s)).length;

  const el1 = document.getElementById('statAvgGrade');
  const el2 = document.getElementById('statCoreAvgGrade');
  const el3 = document.getElementById('statTotalCredits');
  const el4 = document.getElementById('statCareerRatio');
  const el5 = document.getElementById('statCareerCount');
  if (el1) el1.textContent = avgGrade;
  if (el2) el2.textContent = coreAvg;
  if (el3) el3.textContent = totalCredits;
  if (el4) el4.textContent = `${careers.length}과목 성취도 입력`;
  if (el5) el5.textContent = `A: ${countA} | B: ${countB} | C: ${countC}${ungraded ? ` | 등급없음: ${ungraded}` : ''}`;
}

function initUniversityDatalist() {
  const dl = document.getElementById('uniDatalist');
  if (dl) dl.innerHTML = ALL_PDF_UNIVERSITIES.map(u => `<option value="${escapeHtml(u.name)}">`).join('');
}

function selectUniFromSearch() {
  const input = document.getElementById('uniSearchInput');
  if (!input) return;
  const name = input.value.trim();
  if (!name) return;
  const exact = ALL_PDF_UNIVERSITIES.find(u => u.name === name);
  const candidates = ALL_PDF_UNIVERSITIES.filter(u => u.name.includes(name));
  const found = exact || (candidates.length === 1 ? candidates[0] : null);
  if (!found) {
    if (candidates.length > 1) alert(`'${name}'에 해당하는 캠퍼스/대학이 여러 개입니다. 검색 목록에서 정확한 이름을 선택하세요.`);
    else alert(`'${name}' 대학은 DB에 등록되어 있지 않습니다. 이름을 다시 확인하세요.`);
    return;
  }
  selectedUniNames.add(found.name);
  input.value = '';
  renderSelectedUnisBar();
  calculateAll();
}

function addFirstMatching(names) {
  names.forEach(n => {
    const match = ALL_PDF_UNIVERSITIES.find(u => u.name === n) || ALL_PDF_UNIVERSITIES.find(u => u.name.includes(n));
    if (match) selectedUniNames.add(match.name);
  });
}

function selectGroup(groupKey) {
  if (groupKey === 'top10') {
    addFirstMatching(['연세대(서울)','고려대(서울)','성균관대','서강대','한양대','중앙대','경희대','이화여대','서울시립대','동국대(서울)']);
  } else if (groupKey === 'seoul') {
    addFirstMatching(['연세대(서울)','고려대(서울)','성균관대','서강대','한양대','중앙대','경희대','이화여대','서울시립대','동국대(서울)','서경대','한성대','아주대','인하대']);
  } else if (groupKey === 'national') {
    addFirstMatching(['경북대(대구)','경북대(상주)','부산대(부산)','전남대(광주)','전북대(전주)','충남대(대전)','충북대(청주)','강원대(춘천)','제주대','경상국립대(진주)']);
  }
  renderSelectedUnisBar();
  calculateAll();
}

function selectAllUnis() {
  ALL_PDF_UNIVERSITIES.forEach(u => selectedUniNames.add(u.name));
  renderSelectedUnisBar();
  calculateAll();
}

function clearSelectedUnis() {
  selectedUniNames.clear();
  renderSelectedUnisBar();
  calculateAll();
}

function removeSelectedUni(name) {
  selectedUniNames.delete(name);
  renderSelectedUnisBar();
  calculateAll();
}

function renderSelectedUnisBar() {
  const bar = document.getElementById('selectedUnisBar');
  const countSpan = document.getElementById('selCount');
  if (countSpan) countSpan.textContent = selectedUniNames.size;
  if (!bar) return;
  if (selectedUniNames.size === 0) {
    bar.innerHTML = '<span style="color:var(--text-muted); font-size:13px;">위 검색창이나 빠른 선택 버튼으로 내신 등급 변화를 계산할 대학을 추가하세요.</span>';
    return;
  }
  bar.innerHTML = Array.from(selectedUniNames).map(n => {
    const u = ALL_PDF_UNIVERSITIES.find(x => x.name === n);
    const hasVariants = u && Array.isArray(u.variants) && u.variants.length > 1;
    const variantSelect = hasVariants ? `
      <select class="variant-select" data-uniname="${escapeHtml(n)}" title="계열/전형 선택" onclick="event.stopPropagation()">
        ${u.variants.map(v => `<option value="${escapeHtml(v.id)}" ${v.id===getSelectedVariantId(u)?'selected':''}>${escapeHtml(v.label)}</option>`).join('')}
      </select>` : '';
    return `<span class="sel-tag">${escapeHtml(n)}${variantSelect} <span class="del-tag" data-uniname="${escapeHtml(n)}">✕</span></span>`;
  }).join('');
  bar.querySelectorAll('.del-tag').forEach(el => el.addEventListener('click', () => removeSelectedUni(el.getAttribute('data-uniname'))));
  bar.querySelectorAll('.variant-select').forEach(el => el.addEventListener('change', (e) => {
    selectedVariantByUni.set(el.getAttribute('data-uniname'), e.target.value);
    calculateAll();
  }));
}

function isDefaultYearWeight(u) {
  return Math.abs(Number(u.w1)-33.3) < 0.2 && Math.abs(Number(u.w2)-33.3) < 0.2 && Math.abs(Number(u.w3)-33.4) < 0.2;
}

function aggregateByYear(items, valueFn, u) {
  if (!items.length) return null;
  if (isDefaultYearWeight(u)) {
    let num = 0, den = 0;
    items.forEach(s => { const c=validCredit(s); if(c>0){ num += valueFn(s)*c; den += c; } });
    return den > 0 ? num/den : null;
  }
  const yearWeights = {1:Number(u.w1)||0,2:Number(u.w2)||0,3:Number(u.w3)||0};
  let weighted = 0, weightSum = 0;
  [1,2,3].forEach(y => {
    const ys = items.filter(s => Number(s.grade) === y && validCredit(s) > 0);
    if (!ys.length || yearWeights[y] <= 0) return;
    const den = ys.reduce((a,s)=>a+validCredit(s),0);
    const avg = ys.reduce((a,s)=>a+valueFn(s)*validCredit(s),0) / den;
    weighted += avg * yearWeights[y];
    weightSum += yearWeights[y];
  });
  return weightSum > 0 ? weighted / weightSum : null;
}

function sortByRank(list) {
  return [...list].sort((a,b) => Number(a.rank)-Number(b.rank) || validCredit(b)-validCredit(a));
}

// 일부 대학은 서로 다른 교과영역을 하나의 '교과군'으로 묶어 상위 N과목을 선택한다.
// 예) 서경대 교과균형: 국,수,영,(사,과,한) 중 12과목(교과별 3과목)
//     → (사,과,한)은 한 그룹으로 묶여 그 안에서 상위 3과목만 인정된다.
//     성공회대: (국,수) 3과목 + 영 2과목 + (사,과,한) 3과목처럼 그룹별 개수가 다를 수도 있다.
// u.customGroups = [{ areas:['사회','과학','한국사'], count:3 }, ...] 형태로 대학별로 지정한다.
// customGroups가 지정된 대학은 그 정의가 반영 로직 전체를 대체한다(topByArea/topCount는 무시).
function selectByCustomGroups(commons, groups) {
  const selected = [];
  groups.forEach(g => {
    const areaSet = new Set(g.areas);
    const pool = commons.filter(s => areaSet.has(s.area));
    const sorted = sortByRank(pool);
    const n = Number(g.count) || 0;
    selected.push(...(n > 0 ? sorted.slice(0, n) : sorted));
  });
  return selected;
}

// 일부 대학(예: 장로회신학대)은 '학년별 N과목'처럼 교과군이 아니라 학년 단위로
// 반영 과목 수를 제한한다. u.topPerYear로 지정하면 학년(1,2,3)별로 각각 상위 N과목만 선택한다.
function selectByTopPerYear(commons, n) {
  const selected = [];
  [1,2,3].forEach(y => {
    const ys = commons.filter(s => Number(s.grade) === y);
    selected.push(...sortByRank(ys).slice(0, n));
  });
  return selected;
}

function selectCommonSubjects(commons, u) {
  let selected = [];
  if (Array.isArray(u.customGroups) && u.customGroups.length) {
    selected = selectByCustomGroups(commons, u.customGroups);
  } else if (Number(u.topPerYear) > 0) {
    selected = selectByTopPerYear(commons, Number(u.topPerYear));
  } else if (Number(u.topByArea) > 0) {
    const groups = {};
    commons.forEach(s => { (groups[s.area] ||= []).push(s); });
    Object.values(groups).forEach(group => {
      selected.push(...sortByRank(group).slice(0, Number(u.topByArea)));
    });
    if (Number(u.topCount) > 0 && selected.length > Number(u.topCount)) {
      selected = sortByRank(selected).slice(0, Number(u.topCount));
    }
  } else if (Number(u.topCount) > 0) {
    selected = sortByRank(commons).slice(0, Number(u.topCount));
  } else {
    selected = [...commons];
  }
  return selected;
}

function careerSortValue(s) {
  return ({A:1,B:2,C:3})[normalizeAchievement(s.achv)] || 9;
}

function selectedCareerSubjects(careers, u) {
  const sorted = [...careers].sort((a,b)=>careerSortValue(a)-careerSortValue(b) || validCredit(b)-validCredit(a));
  const n = Number(u.careerMaxCount) || 0;
  return n > 0 ? sorted.slice(0,n) : sorted;
}

function careerPoint(u, achv) {
  const a = normalizeAchievement(achv);
  if (a==='A') return Number(u.careerA)||0;
  if (a==='B') return Number(u.careerB)||0;
  if (a==='C') return Number(u.careerC)||0;
  return 0;
}

function careerRuleText(u, selectedCareers, careerAvgGrade) {
  if (u.careerCalcType === 'none') return '미반영';
  if (u.careerCalcType === 'qualitative') return '정성평가 반영 — 수치 등급으로 임의 변환하지 않음';
  if (u.careerCalcType === 'unknown') return '대학별 별도 산식 — 현재 자료만으로 임의 수치화하지 않음';
  if (!selectedCareers.length) return '반영 가능한 A/B/C 성취도 과목 없음';
  if (u.careerCalcType === 'additive') {
    const sum = selectedCareers.reduce((a,s)=>a+careerPoint(u,s.achv),0);
    return `성취도 가산점 규칙 적용 가능 (선택 과목 합계 +${sum.toFixed(2)}점; 비교등급에는 임의 환산하지 않음)`;
  }
  if (u.careerCalcType === 'pooled_grade') {
    return `성취도별 환산등급 적용 — 선택 ${selectedCareers.length}과목(A=${u.careerA}등급,B=${u.careerB}등급,C=${u.careerC}등급)을 공통/일반선택과 동일한 평균에 합산 반영`;
  }
  if (u.careerCalcType === 'weighted_grade') {
    const p = Number(u.careerWeight) || 0;
    const avgText = careerAvgGrade !== null && careerAvgGrade !== undefined ? `${careerAvgGrade.toFixed(2)}등급` : '산출 불가';
    return `성취도별 환산등급 적용 — 선택 ${selectedCareers.length}과목 평균 ${avgText}(A=${u.careerA},B=${u.careerB},C=${u.careerC}등급)을 ${p}% 가중치로 최종 등급에 반영`;
  }
  return `성취도 반영 과목 ${selectedCareers.length}개 — 공식 환산비율은 모집단위/전형별 확인`;
}

function resultReliability(u) {
  if (u.ruleVariant) return '모집단위/유형별 반영교과가 달라 최종 요강 확인 필요';
  if (u.careerCalcType === 'unknown' || u.careerCalcType === 'qualitative') return '공통/일반선택 기준 비교값; 진로선택은 별도 확인';
  return '자료집 기준 비교값; 최종 모집요강 확인 필요';
}

// 대학별로 인문/자연 계열, 전형별로 반영교과나 진로선택 반영 방식이 다른 경우
// u.variants = [{id, label, areas?, topByArea?, topCount?, customGroups?, topPerYear?,
//                careerMaxCount?, careerCalcType?, careerA?, careerB?, careerC?, careerWeight?, note?}, ...]
// 사용자가 선택한 variant를 기본 설정 위에 덮어써서 실제 계산에 사용할 설정을 만든다.
let selectedVariantByUni = new Map();

function getSelectedVariantId(u) {
  if (!Array.isArray(u.variants) || !u.variants.length) return null;
  const cur = selectedVariantByUni.get(u.name);
  if (cur && u.variants.some(v => v.id === cur)) return cur;
  return u.variants[0].id;
}

function getEffectiveUni(u) {
  if (!Array.isArray(u.variants) || !u.variants.length) return u;
  const id = getSelectedVariantId(u);
  const variant = u.variants.find(v => v.id === id) || u.variants[0];
  const merged = { ...u, ...variant };
  if (variant.areas) merged.areas = variant.areas;
  merged._variantLabel = variant.label;
  merged._variantNote = variant.note;
  delete merged.variants;
  return merged;
}

function calculateAll() {
  const tbody = document.getElementById('resultTbody');
  if (selectedUniNames.size === 0) {
    if (tbody) tbody.innerHTML = `<tr><td colspan="6" style="text-align:center; padding:32px; color:var(--text-muted);">상단의 대학 검색 또는 계열 선택 버튼(주요 10개대, 서울/수도권, 거점국립대, 186개 전체)을 이용해 결과를 비교할 대학을 추가하세요.</td></tr>`;
    return;
  }

  const baseAvg = getBaseAvgGrade();
  calcResults = [];

  selectedUniNames.forEach(uniName => {
    const uBase = ALL_PDF_UNIVERSITIES.find(x => x.name === uniName);
    if (!uBase) return;
    const u = getEffectiveUni(uBase);

    const commons = subjects.filter(s => s.type === 'common' && hasValidRank(s) && validCredit(s)>0 && u.areas?.[s.area]);
    const selectedCommons = selectCommonSubjects(commons, u);
    if (!selectedCommons.length) {
      calcResults.push({ uni:uBase, effectiveUni:u, score:null, maxScore:u.maxScore, convertedGrade:null, gradeDiff:null, baseAvg, pct:null, desc:'유효한 석차등급이 있는 반영 과목이 없습니다. 등급 공란/P 과목은 정상적으로 제외됩니다.', usedCommons:[], usedCareers:[], reliability:resultReliability(u) });
      return;
    }

    const commonAvgGrade = aggregateByYear(selectedCommons, s => Number(s.rank), u);
    const commonPct = aggregateByYear(selectedCommons, s => Number(u.gradeTable?.[s.rank] ?? defaultGradeTable()[s.rank] ?? 0), u);

    let careers = [];
    if (u.careerCalcType !== 'none') {
      careers = subjects.filter(s => s.type === 'career' && hasValidCareer(s) && validCredit(s)>0 && (u.careerScope === 'all' || u.areas?.[s.area]));
    }
    const selectedCareers = selectedCareerSubjects(careers, u);

    // 진로선택 반영: 대학이 명시한 성취도별 환산등급 규칙이 확인되는 경우에만 실제로 등급에
    // 반영한다. (A) 별도 비중(%) 명시가 없으면 공통/일반선택과 같은 평균 풀에 합산(pooled_grade),
    // (B) 비중이 명시되어 있으면 진로선택 평균을 따로 구해 그 비중만큼 최종 등급에 가중 반영
    // (weighted_grade)한다. 확인되지 않은 대학(unknown/정성평가 등)은 임의로 수치화하지 않는다.
    let finalConvertedGrade = commonAvgGrade;
    let careerAvgGrade = null;
    if (u.careerCalcType === 'pooled_grade' && selectedCareers.length) {
      const combined = [...selectedCommons, ...selectedCareers];
      finalConvertedGrade = aggregateByYear(combined, s => s.type === 'career' ? careerPoint(u, s.achv) : Number(s.rank), u);
      careerAvgGrade = aggregateByYear(selectedCareers, s => careerPoint(u, s.achv), u);
    } else if (u.careerCalcType === 'weighted_grade' && selectedCareers.length) {
      careerAvgGrade = aggregateByYear(selectedCareers, s => careerPoint(u, s.achv), u);
      const p = Math.min(Math.max(Number(u.careerWeight) || 0, 0), 100) / 100;
      if (careerAvgGrade !== null && p > 0) {
        finalConvertedGrade = commonAvgGrade * (1 - p) + careerAvgGrade * p;
      }
    }

    let finalScore = commonPct !== null ? (commonPct/100) * (Number(u.maxScore)||1000) : null;
    let additivePoints = 0;
    if (u.careerCalcType === 'additive' && selectedCareers.length) {
      additivePoints = selectedCareers.reduce((a,s)=>a+careerPoint(u,s.achv),0);
      if (finalScore !== null) finalScore += additivePoints; // 비교용 지수. 등급에는 역산하지 않음.
    }

    const gradeDiff = baseAvg > 0 && finalConvertedGrade !== null ? baseAvg - finalConvertedGrade : null;
    const selectionDesc = Array.isArray(u.customGroups) && u.customGroups.length
      ? `교과군별 상위과목 합산 (${u.customGroups.map(g => `${g.areas.join('/')} ${g.count}`).join(', ')})`
      : Number(u.topPerYear) > 0
        ? `학년별 상위 ${u.topPerYear}과목`
        : Number(u.topByArea)>0 ? `교과별 상위 ${u.topByArea}과목${Number(u.topCount)>0 ? `, 최대 ${u.topCount}과목` : ''}` : Number(u.topCount)>0 ? `전체 상위 ${u.topCount}과목` : `반영교과 유효등급 전과목 (${selectedCommons.length}개)`;

    const variantTag = u._variantLabel ? `[${u._variantLabel}] ` : '';

    calcResults.push({
      uni:uBase,
      effectiveUni:u,
      score:finalScore,
      maxScore:Number(u.maxScore)||1000,
      convertedGrade:finalConvertedGrade,
      gradeDiff,
      baseAvg,
      pct:finalScore!==null ? (finalScore/(Number(u.maxScore)||1000))*100 : null,
      desc:`${variantTag}공통/일반: ${finalConvertedGrade.toFixed(2)}등급 (${selectionDesc}) | 진로선택: ${careerRuleText(u,selectedCareers,careerAvgGrade)}`,
      usedCommons:selectedCommons,
      usedCareers:selectedCareers,
      careerAvgGrade,
      additivePoints,
      reliability:resultReliability(u)
    });
  });

  calcResults.sort((a,b) => {
    if (a.convertedGrade === null) return 1;
    if (b.convertedGrade === null) return -1;
    return a.convertedGrade - b.convertedGrade;
  });
  renderResultsTable();
}

function renderResultsTable() {
  const tbody = document.getElementById('resultTbody');
  if (!tbody) return;
  const baseAvg = getBaseAvgGrade();

  tbody.innerHTML = calcResults.map((r,i) => {
    let diffBadge = '';
    if (baseAvg > 0 && r.gradeDiff !== null) {
      if (r.gradeDiff > 0.01) diffBadge = `<span class="grade-diff-tag diff-gain">▲ ${r.gradeDiff.toFixed(2)}등급 유리</span>`;
      else if (r.gradeDiff < -0.01) diffBadge = `<span class="grade-diff-tag diff-loss">▼ ${Math.abs(r.gradeDiff).toFixed(2)}등급 불리</span>`;
      else diffBadge = `<span class="grade-diff-tag diff-same">기준 평균과 동일</span>`;
    }
    const gradeHtml = r.convertedGrade === null ? '<span style="color:var(--text-muted);">산출 불가</span>' : `${r.convertedGrade.toFixed(2)} <span style="font-size:13px; font-weight:400; color:var(--text-sub);">등급</span>`;
    const scoreHtml = r.score === null ? '-' : `${r.score.toFixed(2)} <span style="font-size:11px; color:var(--text-muted);">(참고)</span>`;
    return `
      <tr>
        <td><span class="rank-badge">${i+1}위</span>${i===0 && calcResults.length>1 && r.convertedGrade!==null ? '<span class="top-badge">TOP</span>' : ''}</td>
        <td><strong>${escapeHtml(r.uni.name)}</strong></td>
        <td style="font-size:12px; color:var(--text-sub);">${escapeHtml(r.uni.note)}<br><span style="color:var(--text-muted);">${escapeHtml(r.desc)}</span><br><span style="color:#8A5A00;">※ ${escapeHtml(r.reliability)}</span></td>
        <td><div class="converted-grade-badge">${gradeHtml}</div><div style="margin-top:2px;">${diffBadge}</div></td>
        <td style="font-family:'IBM Plex Mono',monospace; font-weight:700; color:var(--primary); text-align:right; font-size:15px;">${scoreHtml}</td>
        <td style="text-align:center;"><button class="detail-btn" onclick="openDetailModal(${i})">🔍 산출근거</button></td>
      </tr>`;
  }).join('');
}

function openDetailModal(idx) {
  const res = calcResults[idx];
  if (!res) return;
  const modal = document.getElementById('detailModal');
  document.getElementById('modalUniTitle').textContent = `${res.uni.name} 내신 비교 산출 근거`;

  const commonGradeText = res.convertedGrade === null ? '-' : `${res.convertedGrade.toFixed(2)} 등급`;
  const diffText = res.gradeDiff === null ? '' : (res.gradeDiff > 0.01 ? ` (+${res.gradeDiff.toFixed(2)}등급 유리)` : res.gradeDiff < -0.01 ? ` (${Math.abs(res.gradeDiff).toFixed(2)}등급 불리)` : ' (동일)');
  const commonList = res.usedCommons.length ? res.usedCommons.map(s => `<li>${s.grade}학년 ${s.sem}학기 [${escapeHtml(s.area)}] <strong>${escapeHtml(s.name||'미지정')}</strong> (${validCredit(s)}단위, <strong>${s.rank}등급</strong>)</li>`).join('') : '<li style="color:var(--text-muted);">반영 가능한 유효 석차등급 과목이 없습니다.</li>';
  const careerList = res.usedCareers.length ? res.usedCareers.map(s => `<li>[${escapeHtml(s.area)}] <strong>${escapeHtml(s.name||'미지정')}</strong> (${validCredit(s)}단위, <strong>성취도 ${normalizeAchievement(s.achv)}</strong>)${res.effectiveUni.careerCalcType==='additive' ? ` → +${careerPoint(res.effectiveUni,s.achv)}점` : ''}${(res.effectiveUni.careerCalcType==='pooled_grade'||res.effectiveUni.careerCalcType==='weighted_grade') ? ` → ${careerPoint(res.effectiveUni,s.achv)}등급 환산` : ''}</li>`).join('') : '<li style="color:var(--text-muted);">A/B/C 성취도로 반영 가능한 진로선택 과목이 없거나 미반영/별도확인 대상입니다.</li>';

  document.getElementById('modalBody').innerHTML = `
    <div style="font-size:13.5px; line-height:1.6; color:var(--text-main);">
      <p style="margin-bottom:8px;"><strong>자료집 반영 기준:</strong> ${escapeHtml(res.effectiveUni._variantNote || res.uni.note)}</p>
      <div style="background:var(--primary-light); padding:12px 16px; border-radius:6px; margin-bottom:16px;">
        <div style="font-size:13px; color:var(--text-sub);">유효 석차등급 기준 전체 평균: <strong>${res.baseAvg ? res.baseAvg.toFixed(2) : '-'} 등급</strong></div>
        <div style="font-size:18px; font-weight:700; color:var(--primary); margin-top:2px;">➔ ${escapeHtml(res.uni.name)} 반영교과 기준 비교등급: <span style="text-decoration:underline;">${commonGradeText}</span>${diffText}</div>
        <div style="font-size:12px; color:#8A5A00; margin-top:6px;">${escapeHtml(res.reliability)}</div>
      </div>
      <h4 style="font-family:'Noto Serif KR',serif; border-bottom:1px solid var(--border-color); padding-bottom:4px; margin:16px 0 8px;">1. 반영된 공통/일반선택 과목 (${res.usedCommons.length}개)</h4>
      <ul style="padding-left:18px; margin-bottom:16px;">${commonList}</ul>
      <h4 style="font-family:'Noto Serif KR',serif; border-bottom:1px solid var(--border-color); padding-bottom:4px; margin:16px 0 8px;">2. 진로선택/전문교과 (${res.usedCareers.length}개)</h4>
      <p style="font-size:12px; color:var(--text-sub);">${escapeHtml(careerRuleText(res.effectiveUni,res.usedCareers,res.careerAvgGrade))}</p>
      <ul style="padding-left:18px;">${careerList}</ul>
      <div style="margin-top:14px; padding:10px 12px; background:#FFF8E6; border-radius:6px; font-size:12px; color:#6B4D00;">석차등급이 공란인 과목(과학탐구실험·교육학·음악·미술·체육 등)은 2등급으로 대체하지 않고 내신 평균/대학별 석차등급 산출에서 제외합니다. 성취도 P 또는 공란도 A로 바꾸지 않습니다.</div>
    </div>`;
  modal.style.display = 'flex';
}

function closeModal() {
  const m=document.getElementById('detailModal'); if(m) m.style.display='none';
}

function scrollToSec(secId) {
  const el=document.getElementById(secId); if(el) el.scrollIntoView({behavior:'smooth'});
}

function downloadExcelTemplate() {
  const templateData = [
    {"학년":1,"학기":1,"교과영역":"국어","과목명":"공통국어","과목구분":"공통/일반선택","이수단위":4,"석차등급":2,"성취도":""},
    {"학년":1,"학기":1,"교과영역":"수학","과목명":"공통수학","과목구분":"공통/일반선택","이수단위":4,"석차등급":1,"성취도":""},
    {"학년":1,"학기":1,"교과영역":"영어","과목명":"공통영어","과목구분":"공통/일반선택","이수단위":4,"석차등급":2,"성취도":""},
    {"학년":1,"학기":1,"교과영역":"과학","과목명":"통합과학","과목구분":"공통/일반선택","이수단위":3,"석차등급":1,"성취도":""},
    {"학년":1,"학기":1,"교과영역":"과학","과목명":"과학탐구실험","과목구분":"공통/일반선택","이수단위":1,"석차등급":"","성취도":"A"},
    {"학년":1,"학기":1,"교과영역":"기술·가정/제2외국어/한문/교양","과목명":"진로와 직업","과목구분":"공통/일반선택","이수단위":1,"석차등급":"","성취도":"P"},
    {"학년":1,"학기":1,"교과영역":"체육","과목명":"체육","과목구분":"공통/일반선택","이수단위":2,"석차등급":"","성취도":"A"},
    {"학년":1,"학기":1,"교과영역":"예술","과목명":"음악","과목구분":"공통/일반선택","이수단위":2,"석차등급":"","성취도":"A"},
    {"학년":3,"학기":1,"교과영역":"수학","과목명":"기하","과목구분":"진로선택/전문교과","이수단위":4,"석차등급":"","성취도":"A"},
    {"학년":3,"학기":1,"교과영역":"과학","과목명":"물리학Ⅱ","과목구분":"진로선택/전문교과","이수단위":4,"석차등급":"","성취도":"A"}
  ];
  const worksheet = XLSX.utils.json_to_sheet(templateData);
  const workbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(workbook, worksheet, '내신성적입력양식');
  XLSX.writeFile(workbook, '2027_내신성적입력_표준양식_수정.xlsx');
}

function saveToLocalStorage() {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(subjects));
  alert('입력된 성적이 브라우저에 저장되었습니다. (등급 공란은 공란 상태로 저장됩니다.)');
}

function loadFromLocalStorage() {
  const saved = localStorage.getItem(STORAGE_KEY);
  if (!saved) return;
  try {
    const arr = JSON.parse(saved);
    if (!Array.isArray(arr)) return;
    subjects = [];
    arr.forEach(s => addSubject(s,false));
  } catch(e) { console.error(e); }
}

function rowIsEmpty(row) {
  const keys=['학년','학기','교과영역','교과','과목명','과목구분','이수단위','단위수','석차등급','등급','성취도'];
  return keys.every(k => row[k]===undefined || row[k]===null || String(row[k]).trim()==='');
}

const ACCEPTED_EXCEL_EXT = ['.xlsx', '.xls', '.csv'];

function hasAcceptedExcelExt(filename) {
  const n = String(filename || '').toLowerCase();
  return ACCEPTED_EXCEL_EXT.some(ext => n.endsWith(ext));
}

function setDropzoneFilename(text, isError) {
  const el = document.getElementById('dzFilename');
  if (!el) return;
  el.textContent = text || '';
  el.style.color = isError ? 'var(--accent-red)' : 'var(--text-muted)';
}

function processExcelFile(file) {
  if (!file) return;
  if (!hasAcceptedExcelExt(file.name)) {
    setDropzoneFilename(`'${file.name}' — 지원하지 않는 형식입니다. .xlsx, .xls, .csv 파일만 업로드할 수 있습니다.`, true);
    alert('지원하지 않는 파일 형식입니다. .xlsx, .xls, .csv 파일만 업로드할 수 있습니다.');
    return;
  }
  setDropzoneFilename(`'${file.name}' 불러오는 중...`, false);
  const reader = new FileReader();
  reader.onload = function(evt) {
    try {
      const data = new Uint8Array(evt.target.result);
      const workbook = XLSX.read(data, {type:'array'});
      const firstSheet = workbook.Sheets[workbook.SheetNames[0]];
      const json = XLSX.utils.sheet_to_json(firstSheet, {defval:null, raw:false});
      const rows = json.filter(row => !rowIsEmpty(row));
      if (!rows.length) { setDropzoneFilename(`'${file.name}' — 불러올 과목 행이 없습니다.`, true); alert('불러올 과목 행이 없습니다.'); return; }

      subjects = [];
      let noRankCount=0, validCareerCount=0, invalidRankCount=0;
      rows.forEach(row => {
        const rawRank = row['석차등급'] ?? row['등급'];
        const n = toNullableNumber(rawRank);
        const rank = Number.isInteger(n) && n>=1 && n<=9 ? n : null;
        if (rawRank !== null && rawRank !== undefined && String(rawRank).trim() !== '' && rank === null) invalidRankCount++;
        const type = normalizeType(row['과목구분']);
        const achv = normalizeAchievement(row['성취도']);
        if (type==='common' && rank===null) noRankCount++;
        if (type==='career' && achv) validCareerCount++;
        const creditRaw = row['이수단위'] ?? row['단위수'];
        const creditNum = toNullableNumber(creditRaw);
        addSubject({
          grade: Number(row['학년']) || 1,
          sem: Number(row['학기']) || 1,
          area: normalizeArea(row['교과영역'] ?? row['교과']),
          name: row['과목명'] ?? '',
          type,
          credit: creditNum !== null && creditNum > 0 ? creditNum : 0,
          rank,
          achv
        }, false);
      });
      renderSubjects();
      const excelInput = document.getElementById('excelFileInput');
      if (excelInput) excelInput.value = '';
      setDropzoneFilename(`✅ '${file.name}' — ${rows.length}개 과목 불러옴`, false);
      alert(`${rows.length}개 과목을 불러왔습니다.\n- 석차등급 공란 과목 ${noRankCount}개: 내신 평균에서 제외\n- 유효 진로선택(A/B/C) ${validCareerCount}개\n${invalidRankCount ? `- 1~9가 아닌 석차등급 ${invalidRankCount}개: 등급 없음으로 처리\n` : ''}※ 공란/P 성취도를 A 또는 2등급으로 자동 대체하지 않습니다.`);
    } catch(err) {
      console.error(err);
      setDropzoneFilename(`'${file.name}' — 파싱 중 오류가 발생했습니다.`, true);
      alert('엑셀 파일 파싱 중 오류가 발생했습니다. 표준 양식의 열 이름을 확인하세요.');
    }
  };
  reader.readAsArrayBuffer(file);
}

function handleExcelUpload(e) {
  const file = e.target.files[0];
  processExcelFile(file);
}

function handleDropzoneDragOver(e) {
  e.preventDefault();
  e.stopPropagation();
  e.dataTransfer.dropEffect = 'copy';
  const zone = document.getElementById('excelDropzone');
  if (zone) zone.classList.add('dragover');
}

function handleDropzoneDragLeave(e) {
  e.preventDefault();
  e.stopPropagation();
  const zone = document.getElementById('excelDropzone');
  if (zone) zone.classList.remove('dragover');
}

function handleDropzoneDrop(e) {
  e.preventDefault();
  e.stopPropagation();
  const zone = document.getElementById('excelDropzone');
  if (zone) zone.classList.remove('dragover');
  const file = e.dataTransfer && e.dataTransfer.files && e.dataTransfer.files[0];
  if (!file) return;
  processExcelFile(file);
}

window.addEventListener('DOMContentLoaded', () => {
  initUniversityDatalist();
  loadFromLocalStorage();
  if (!subjects || subjects.length===0) clearSubjects();
  else renderSubjects();
  clearSelectedUnis();
});
