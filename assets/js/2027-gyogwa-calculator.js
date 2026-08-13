/* 2027 ADIGA 공식 원문 기반 계산기
   - 원문에 명시된 반영 교과·등급표만 사용
   - 모집단위별 세부 산식이 원문에서 분리되지 않은 경우, 결과를 '비교등급'으로 명확히 표시 */
const AREAS = ['국어','수학','영어','사회','과학','한국사','기술·가정','제2외국어','한문','체육','예술','기타'];
const STORAGE_KEY = '2027_adiga_subjects_v4';
let subjIdSeq = 1;
let subjects = [];
let selectedUniNames = new Set();

const esc = (v) => String(v ?? '').replace(/[&<>'"]/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;',"'":'&#39;','"':'&quot;'}[c]));
const num = (v) => { const raw=String(v ?? '').trim(); if(!raw)return null; const n=Number(raw); return Number.isFinite(n) ? n : null; };
const rankOK = (s) => Number.isInteger(num(s.rank)) && num(s.rank) >= 1 && num(s.rank) <= 9;
const credit = (s) => Math.max(0, num(s.credit) || 0);
const achvOK = (s) => ['A','B','C'].includes(String(s.achv || '').toUpperCase());
const percent = (v) => { const n=num(v); return n!==null&&n>=0&&n<=100?n:null; };
const typeOf = (v) => ['common','general','career'].includes(v) ? v : 'common';
const isRankedType = (s) => s.type === 'common' || s.type === 'general';

function addSubject(raw = {}, render = true) {
  subjects.push({ id: subjIdSeq++, grade: [1,2,3].includes(+raw.grade) ? +raw.grade : 1,
    sem: [1,2].includes(+raw.sem) ? +raw.sem : 1, area: AREAS.includes(raw.area) ? raw.area : '국어',
    name: raw.name || '', type: typeOf(raw.type), credit: credit(raw) || 3, rank: rankOK(raw) ? +raw.rank : null,
    achv: achvOK(raw) ? String(raw.achv).toUpperCase() : '', originalScore: percent(raw.originalScore),
    subjectMean: percent(raw.subjectMean), standardDeviation: percent(raw.standardDeviation), classSize: Math.max(0,num(raw.classSize)||0)||null,
    rateA: percent(raw.rateA), rateB: percent(raw.rateB), rateC: percent(raw.rateC) });
  if (render) renderSubjects();
}
function clearSubjects() { subjects = []; ['국어','수학','영어','사회','과학'].forEach(area => addSubject({area, credit:3}, false)); renderSubjects(); calculateAll(); }
function removeSubject(id) { subjects = subjects.filter(s => s.id !== id); renderSubjects(); calculateAll(); }
function updSubject(id, key, value) {
  const s = subjects.find(x => x.id === id); if (!s) return;
  if (key === 'rank') s.rank = value === '' ? null : num(value);
  else if (key === 'credit') s.credit = num(value) || 0;
  else if (['originalScore','subjectMean','standardDeviation','rateA','rateB','rateC'].includes(key)) s[key] = value === '' ? null : percent(value);
  else if (key === 'classSize') s[key] = value === '' ? null : Math.max(1,Math.round(num(value)||1));
  else if (key === 'type') {
    s.type = typeOf(value);
    // 과목구분 변경 시 서로 다른 성적체계를 혼용하지 않도록 기존 값을 초기화한다.
    s.rank = null;
    s.achv = '';
    renderSubjects();
  } else s[key] = value;
  updateDashboard(); calculateAll();
}

function renderSubjects() {
  const tbody = document.getElementById('subjTbody'); if (!tbody) return;
  tbody.innerHTML = subjects.map(s => `<tr>
    <td><select onchange="updSubject(${s.id},'grade',this.value)">${[1,2,3].map(x=>`<option ${x===s.grade?'selected':''}>${x}</option>`).join('')}</select></td>
    <td><select onchange="updSubject(${s.id},'sem',this.value)">${[1,2].map(x=>`<option ${x===s.sem?'selected':''}>${x}</option>`).join('')}</select></td>
    <td><select onchange="updSubject(${s.id},'area',this.value)">${AREAS.map(x=>`<option ${x===s.area?'selected':''}>${x}</option>`).join('')}</select></td>
    <td><input type="text" value="${esc(s.name)}" placeholder="예: 문학" onchange="updSubject(${s.id},'name',this.value)"></td>
    <td><select onchange="updSubject(${s.id},'type',this.value)"><option value="common" ${s.type==='common'?'selected':''}>공통과목</option><option value="general" ${s.type==='general'?'selected':''}>일반선택</option><option value="career" ${s.type==='career'?'selected':''}>진로선택</option></select></td>
    <td><input type="number" min="0" step="0.5" value="${s.credit || ''}" onchange="updSubject(${s.id},'credit',this.value)"></td>
    <td>${s.type==='career' ? `<select onchange="updSubject(${s.id},'achv',this.value)"><option value="">성취도 선택</option>${['A','B','C'].map(x=>`<option ${x===s.achv?'selected':''}>${x}</option>`).join('')}</select>` : `<select onchange="updSubject(${s.id},'rank',this.value)"><option value="">등급 없음</option>${[1,2,3,4,5,6,7,8,9].map(x=>`<option ${x===s.rank?'selected':''}>${x}</option>`).join('')}</select>`}</td>
    <td>${s.type==='career' ? `<div class="subject-detail-inputs"><input aria-label="원점수" title="원점수" type="number" min="0" max="100" placeholder="원점수" value="${s.originalScore??''}" onchange="updSubject(${s.id},'originalScore',this.value)"><input aria-label="과목평균" title="과목평균" type="number" min="0" max="100" placeholder="평균" value="${s.subjectMean??''}" onchange="updSubject(${s.id},'subjectMean',this.value)"><input aria-label="A 비율" title="A 비율" type="number" min="0" max="100" placeholder="A%" value="${s.rateA??''}" onchange="updSubject(${s.id},'rateA',this.value)"><input aria-label="B 비율" title="B 비율" type="number" min="0" max="100" placeholder="B%" value="${s.rateB??''}" onchange="updSubject(${s.id},'rateB',this.value)"><input aria-label="C 비율" title="C 비율" type="number" min="0" max="100" placeholder="C%" value="${s.rateC??''}" onchange="updSubject(${s.id},'rateC',this.value)"></div>` : `<div class="subject-detail-inputs"><input aria-label="원점수" title="원점수" type="number" min="0" max="100" placeholder="원점수" value="${s.originalScore??''}" onchange="updSubject(${s.id},'originalScore',this.value)"><input aria-label="과목평균" title="과목평균" type="number" min="0" max="100" placeholder="평균" value="${s.subjectMean??''}" onchange="updSubject(${s.id},'subjectMean',this.value)"><input aria-label="표준편차" title="표준편차" type="number" min="0" max="100" placeholder="표준편차" value="${s.standardDeviation??''}" onchange="updSubject(${s.id},'standardDeviation',this.value)"><input aria-label="수강자수" title="수강자수(고려대 소인수 과목 보정)" type="number" min="1" placeholder="인원" value="${s.classSize??''}" onchange="updSubject(${s.id},'classSize',this.value)"></div>`}</td>
    <td><button class="btn-item btn-danger" style="padding:5px 8px" onclick="removeSubject(${s.id})">×</button></td></tr>`).join('');
  updateDashboard();
}

function updateDashboard() {
  const common = subjects.filter(s => isRankedType(s) && rankOK(s) && credit(s));
  const avg = (list) => { const c=list.reduce((a,s)=>a+credit(s),0); return c ? list.reduce((a,s)=>a+credit(s)*s.rank,0)/c : null; };
  const set=(id,v)=>{const e=document.getElementById(id);if(e)e.textContent=v;};
  set('statAvgGrade', avg(common)?.toFixed(2) || '-');
  set('statCoreAvgGrade', avg(common.filter(s=>['국어','수학','영어','사회','과학'].includes(s.area)))?.toFixed(2) || '-');
  set('statTotalCredits', common.reduce((a,s)=>a+credit(s),0).toFixed(1));
  const career=subjects.filter(s=>s.type==='career'&&achvOK(s));
  set('statCareerRatio', career.length ? `${career.length}과목` : '-');
  set('statCareerCount', `A: ${career.filter(s=>s.achv==='A').length} | B: ${career.filter(s=>s.achv==='B').length} | C: ${career.filter(s=>s.achv==='C').length}`);
}

function initUniversityDatalist() { document.getElementById('uniDatalist').innerHTML = ADIGA_2027_UNIVERSITIES.map(u=>`<option value="${esc(u.name)}"></option>`).join(''); }
function findUni(name) {
  const q=String(name||'').trim();
  if(!q) return null;
  const withoutCampus=name=>String(name||'').replace(/\[[^\]]*\]/g,'').trim();
  // 본교와 분교가 함께 있는 대학은 캠퍼스 표기만 제거한 정확한 이름을 먼저 찾는다.
  // 예: “연세대학교” 검색 시 “연세대학교(미래)”보다 “연세대학교[본교]”를 우선 선택한다.
  return ADIGA_2027_UNIVERSITIES.find(u=>u.name===q)
    || ADIGA_2027_UNIVERSITIES.find(u=>withoutCampus(u.name)===q)
    || ADIGA_2027_UNIVERSITIES.find(u=>u.name.includes(q)&&/\[본교\]/.test(u.name))
    || ADIGA_2027_UNIVERSITIES.find(u=>withoutCampus(u.name).includes(q));
}
function selectUniFromSearch() { const e=document.getElementById('uniSearchInput'); const u=findUni(e.value); if(!u) return alert('대학명을 목록에서 선택해 주세요.'); selectedUniNames.add(u.name); e.value=''; renderSelectedUnisBar(); calculateAll(); }
function addFirstMatching(names) { names.forEach(x=>{const u=findUni(x);if(u)selectedUniNames.add(u.name);}); renderSelectedUnisBar(); calculateAll(); }
function selectGroup(k) { const group={top10:['서울대학교','연세대학교','고려대학교','성균관대학교','서강대학교','한양대학교','중앙대학교','경희대학교','이화여자대학교','한국외국어대학교'],seoul:['서울시립대학교','건국대학교','동국대학교','홍익대학교','숙명여자대학교','숭실대학교','국민대학교','광운대학교','서울과학기술대학교'],national:['경북대학교','부산대학교','전남대학교','전북대학교','충남대학교','충북대학교','강원대학교','제주대학교','경상국립대학교']}; addFirstMatching(group[k]||[]); }
function selectAllUnis() { ADIGA_2027_UNIVERSITIES.forEach(u=>selectedUniNames.add(u.name)); renderSelectedUnisBar(); calculateAll(); }
function clearSelectedUnis() { selectedUniNames.clear(); renderSelectedUnisBar(); calculateAll(); }
function removeSelectedUni(name) { selectedUniNames.delete(name); renderSelectedUnisBar(); calculateAll(); }
function renderSelectedUnisBar() { const bar=document.getElementById('selectedUnisBar'), c=document.getElementById('selCount'); c.textContent=selectedUniNames.size; bar.innerHTML=selectedUniNames.size?[...selectedUniNames].map(n=>`<span class="selected-uni-tag">${esc(n)} <button onclick="removeSelectedUni('${esc(n)}')">×</button></span>`).join(''):'<span style="color:var(--text-muted);font-size:13px;">위 검색창으로 대학을 추가하세요.</span>'; }

function scoreFor(table, rank) { return Array.isArray(table)&&table.length===9 ? table[rank-1] : null; }
function calcUniversity(u) {
  if (u.status !== '자료 있음') return {u, unavailable:true, reason:'ADIGA 페이지에 교과영역 평가방법이 제공되지 않았습니다.'};
  if (u.calculationStatus === 'qualitative') return {u, qualitative:true, reason:'학생부 전 영역을 정성평가하며, 공식 수치 환산식이 없습니다.'};
  const common=subjects.filter(s=>isRankedType(s)&&rankOK(s)&&credit(s)&&u.commonAreas.includes(s.area));
  const mappedCareer=u.careerMapping ? subjects.filter(s=>s.type==='career'&&achvOK(s)&&credit(s)&&u.careerAreas.includes(s.area)).map(s=>({...s,rank:u.careerMapping[s.achv],convertedCareer:true})) : [];
  const careerCandidates=u.careerMax ? [...mappedCareer].sort((a,b)=>a.rank-b.rank||credit(b)-credit(a)).slice(0,u.careerMax) : mappedCareer;
  const candidates=common.concat(careerCandidates);
  const n=u.selection?.type==='top' ? u.selection.count : Infinity;
  const selected=[...candidates].sort((a,b)=>a.rank-b.rank||credit(b)-credit(a)).slice(0,n);
  if (!selected.length) return {u, unavailable:true, reason:`입력 과목 중 반영 교과(${u.commonAreas.join('·')})와 일치하는 석차등급 과목이 없습니다.`};
  const total=selected.reduce((a,s)=>a+credit(s),0);
  const grade=selected.reduce((a,s)=>a+s.rank*credit(s),0)/total;
  const scoreValues=selected.map(s=>scoreFor(u.gradeTable,s.rank));
  const score=scoreValues.every(x=>x!==null) ? selected.reduce((a,s,i)=>a+scoreValues[i]*credit(s),0)/total : null;
  const career=subjects.filter(s=>s.type==='career'&&achvOK(s)&&u.careerAreas.includes(s.area));
  const mapping=u.careerMapping;
  const usedCareer=selected.filter(s=>s.convertedCareer).length;
  const careerInfo=mapping ? `진로선택 ${usedCareer}과목 실제 반영 · A→${mapping.A}, B→${mapping.B}, C→${mapping.C}등급${u.careerMax?` · 최대 ${u.careerMax}과목`:''}` : (career.length?'진로선택 반영 세부 산식은 원문 확인 필요':'진로선택 입력 없음');
  return {u, grade, score, selected, careerInfo, usedCareer, exact:!!score, reason:score ? '공개된 등급별 점수표를 이수단위로 가중평균한 비교점수입니다.' : '공개된 등급별 점수표 또는 모집단위별 최종 산식이 없어 비교등급만 제공합니다.'};
}

function calcManualRules(u) {
  if (!u.manualRules) return null;
  const common = subjects.filter(s => isRankedType(s) && rankOK(s) && credit(s));
  const career = subjects.filter(s => s.type === 'career' && achvOK(s));
  return Object.values(u.manualRules).map(rule => {
    if (rule.formula === 'gnu') {
      const ranked = common.filter(s => rule.areas.includes(s.area));
      if (!ranked.length) return { label: rule.label, unavailable: true, reason: '반영 교과(국어·영어·수학·사회·한국사·과학)의 석차등급과 이수단위를 입력해 주세요.' };
      const units = ranked.reduce((sum, s) => sum + credit(s), 0);
      const commonScore = rule.basicScore + ranked.reduce((sum, s) => sum + rule.rankPoints[s.rank - 1] * credit(s), 0) / units;
      const careerBonus = rule.bonusAreas.reduce((sum, area) => {
        const top = career.filter(s => s.area === area)
          .map(s => rule.achievementPoints[s.achv])
          .sort((a, b) => b - a)
          .slice(0, rule.careerTopPerArea);
        return sum + (top.reduce((sub, value) => sub + value, 0) / rule.careerTopPerArea || 0);
      }, 0) / rule.bonusDivisor;
      const avgGrade = (ranked.reduce((sum, s) => sum + s.rank * credit(s), 0) / units).toFixed(2);
      return {
        label: rule.label,
        score: commonScore + careerBonus,
        maxScore: rule.rankPoints[0] + rule.achievementPoints.A,
        avgGrade,
        careerBonus,
        desc: `공통/일반 이수단위 가중점수 ${commonScore.toFixed(2)} + 진로선택 교과별 상위 ${rule.careerTopPerArea}과목 가산점 ${careerBonus.toFixed(2)}`
      };
    }
    if (rule.formula === 'donga') {
      const toCandidate = (s, isCareer = false) => ({
        ...s,
        isCareer,
        convertedRank: isCareer ? rule.achievementRanks[s.achv] : s.rank,
        points: isCareer ? rule.rankPoints[rule.achievementRanks[s.achv] - 1] : rule.rankPoints[s.rank - 1]
      });
      const commonCandidates = common.filter(s => rule.areas.includes(s.area)).map(s => toCandidate(s));
      const careerCandidates = career.filter(s => rule.areas.includes(s.area)).map(s => toCandidate(s, true));
      let selected = [];
      if (rule.selection === 'perArea') {
        const groups = rule.areaGroups || rule.areas.map(area => [area]);
        for (const group of groups) {
          const normal = commonCandidates.filter(s => group.includes(s.area));
          const careerForArea = careerCandidates.filter(s => group.includes(s.area))
            .sort((a, b) => a.convertedRank - b.convertedRank).slice(0, rule.careerMaxPerArea);
          selected.push(...normal.concat(careerForArea).sort((a, b) => a.convertedRank - b.convertedRank || (b.isCareer - a.isCareer)).slice(0, rule.slotsPerArea));
        }
        // 원문상 진로선택은 전체 최대 4과목까지이므로, 교과별 후보 중 점수가 높은 것만 남긴다.
        const selectedCareer = selected.filter(s => s.isCareer).sort((a, b) => a.convertedRank - b.convertedRank).slice(0, rule.careerMax);
        selected = selected.filter(s => !s.isCareer).concat(selectedCareer);
        // 전역 한도를 적용해 빠진 진로 과목 때문에 생긴 자리는 일반 과목으로 보충한다.
        for (const group of groups) {
          const have = selected.filter(s => group.includes(s.area)).length;
          if (have < rule.slotsPerArea) selected.push(...commonCandidates.filter(s => group.includes(s.area) && !selected.some(x => x.id === s.id)).sort((a,b) => a.convertedRank-b.convertedRank).slice(0, rule.slotsPerArea-have));
        }
      } else {
        const careerPicked = careerCandidates.sort((a,b) => a.convertedRank-b.convertedRank).slice(0, rule.careerMax);
        selected = commonCandidates.concat(careerPicked).sort((a,b) => a.convertedRank-b.convertedRank || (b.isCareer-a.isCareer)).slice(0, rule.totalSlots);
      }
      if (!selected.length) return { label: rule.label, unavailable: true, reason: '반영 교과(국어·영어·수학·사회·과학)의 등급 또는 진로 성취도를 입력해 주세요.' };
      const careerUsed = selected.filter(s => s.isCareer);
      const score = rule.basicScore + selected.reduce((sum, s) => sum + s.points, 0);
      return {
        label: rule.label,
        score,
        maxScore: rule.basicScore + (rule.selection === 'perArea' ? rule.slotsPerArea * (rule.areaGroups || rule.areas.map(area => [area])).length : rule.totalSlots) * rule.rankPoints[0],
        avgGrade: (selected.reduce((sum, s) => sum + s.convertedRank, 0) / selected.length).toFixed(2),
        careerUsed: careerUsed.length,
        desc: `기본점수 ${rule.basicScore} + 반영 ${selected.length}과목 점수 합계 ${selected.reduce((sum, s) => sum + s.points, 0)} · 진로선택 ${careerUsed.length}과목(A→1·B→3·C→5등급 환산) · 반영: ${selected.map(s => `${s.name || s.area}(${s.convertedRank}${s.isCareer ? ',진로' : ''})`).join(', ')}`
      };
    }
    if (rule.formula === 'pusan') {
      const selected = common.filter(s => rule.areas.includes(s.area));
      if (!selected.length) return { label: rule.label, unavailable: true, reason: '반영 교과의 석차등급과 이수단위를 입력해 주세요.' };
      const units = selected.reduce((sum, s) => sum + credit(s), 0);
      const averagePoints = selected.reduce((sum, s) => sum + rule.rankPoints[s.rank - 1] * credit(s), 0) / units;
      const score = averagePoints * rule.subjectWeight / 100;
      return { label: rule.label, score, maxScore: rule.subjectWeight, avgGrade: (selected.reduce((sum,s)=>sum+s.rank*credit(s),0)/units).toFixed(2), careerUsed: 0, desc: `석차등급 과목 ${selected.length}개 이수단위 가중평균 ${averagePoints.toFixed(5)} × 교과배점 ${rule.subjectWeight}/100 (진로 성취도 과목은 원문상 석차등급 미기재로 미반영)` };
    }
    if (rule.formula === 'busanCatholic') {
      const toCandidate = (s, isCareer = false) => ({ ...s, isCareer, convertedRank: isCareer ? ({A:1,B:3,C:5}[s.achv]) : s.rank });
      const commonCandidates = common.map(s => toCandidate(s));
      const careerCandidates = career.map(s => toCandidate(s, true));
      const explore = ['사회','과학','한국사'];
      const groups = [['국어'], ['영어'], ['수학'], explore];
      const required = [];
      for (const group of groups) required.push(...commonCandidates.filter(s => group.includes(s.area)).sort((a,b)=>a.convertedRank-b.convertedRank).slice(0,2));
      const used = new Set(required.map(s => s.id));
      const optionalPool = commonCandidates.filter(s => !used.has(s.id) && ['국어','영어','수학','사회','과학','한국사'].includes(s.area)).concat(careerCandidates.filter(s => ['국어','영어','수학','사회','과학','한국사'].includes(s.area))).sort((a,b)=>a.convertedRank-b.convertedRank || (b.isCareer-a.isCareer));
      const optionalCore = optionalPool.slice(0,2);
      optionalCore.forEach(s => used.add(s.id));
      const otherPool = commonCandidates.filter(s => !used.has(s.id)).concat(careerCandidates.filter(s => !used.has(s.id))).sort((a,b)=>a.convertedRank-b.convertedRank || (b.isCareer-a.isCareer));
      const selected = required.concat(optionalCore, otherPool.slice(0,2));
      const careerUsed = selected.filter(s => s.isCareer);
      if (!selected.length) return { label: rule.label, unavailable: true, reason: '반영 과목의 석차등급 또는 진로 성취도를 입력해 주세요.' };
      const average = selected.reduce((sum,s)=>sum+s.convertedRank,0) / selected.length;
      return { label: rule.label, score: rule.baseScore - ((average - 1) * rule.gradeStep), maxScore: rule.baseScore, avgGrade: average.toFixed(2), careerUsed: careerUsed.length, desc: `반영 ${selected.length}/12과목 평균 ${average.toFixed(3)}등급 · 진로 ${careerUsed.length}과목 A→1·B→3·C→5등급 환산 · ${rule.baseScore} − {(평균−1)×${rule.gradeStep}} · 반영: ${selected.map(s => `${s.name || s.area}(${s.convertedRank}${s.isCareer ? ',진로' : ''})`).join(', ')}` };
    }
    if (rule.formula === 'gangneung2027') {
      let selectedCommon = common.filter(s => rule.areas.includes(s.area));
      if (rule.commonPerArea) {
        selectedCommon = rule.areas.flatMap(area => selectedCommon.filter(s => s.area === area).sort((a,b)=>a.rank-b.rank||credit(b)-credit(a)).slice(0, rule.commonPerArea));
      }
      const selectedCareer = career.filter(s => rule.areas.includes(s.area)).map(s => ({...s, convertedRank: rule.achievementRanks[s.achv]}));
      if (!selectedCommon.length) return { label: rule.label, unavailable: true, reason: '반영 교과의 공통·일반선택 석차등급과 이수단위를 입력해 주세요.' };
      const commonUnits = selectedCommon.reduce((sum,s)=>sum+credit(s),0);
      const commonScore = selectedCommon.reduce((sum,s)=>sum+rule.rankPoints[s.rank-1]*credit(s),0)/commonUnits;
      let score = commonScore;
      let careerScore = null;
      if (rule.careerWeight && selectedCareer.length) {
        const careerUnits = selectedCareer.reduce((sum,s)=>sum+credit(s),0);
        careerScore = selectedCareer.reduce((sum,s)=>sum+rule.rankPoints[s.convertedRank-1]*credit(s),0)/careerUnits;
        score = commonScore * rule.commonWeight + careerScore * rule.careerWeight;
      }
      const avgGrade = selectedCommon.reduce((sum,s)=>sum+s.rank*credit(s),0)/commonUnits;
      return { label: rule.label, score, maxScore: 1000, avgGrade: avgGrade.toFixed(2), careerUsed: rule.careerWeight ? selectedCareer.length : 0, desc: careerScore === null ? `공통·일반 ${selectedCommon.length}과목 이수단위 가중점수 ${commonScore.toFixed(3)} × 100%` : `공통·일반 ${selectedCommon.length}과목 ${commonScore.toFixed(3)}×90% + 진로 ${selectedCareer.length}과목(A→1·B→2·C→4) ${careerScore.toFixed(3)}×10%` };
    }
    if (rule.formula === 'paichai2027') {
      const pointsFor = s => s.type === 'career' ? rule.achievementPoints[s.achv] : rule.rankPoints[s.rank-1];
      const convertedRank = s => s.type === 'career' ? rule.achievementRanks[s.achv] : s.rank;
      const candidates = subjects.filter(s => credit(s) >= 2 && ((isRankedType(s) && rankOK(s)) || (s.type === 'career' && achvOK(s))));
      const choose = areas => candidates.filter(s => areas.includes(s.area)).sort((a,b)=>convertedRank(a)-convertedRank(b)||credit(b)-credit(a)).slice(0,5);
      const core = choose(rule.coreAreas), other = choose(rule.otherAreas), selected = core.concat(other);
      if (!selected.length) return { label: rule.label, unavailable: true, reason: '이수단위 2 이상인 반영 과목의 석차등급 또는 진로 성취도를 입력해 주세요.' };
      const groupScore = list => {
        const units = list.reduce((sum,s)=>sum+credit(s),0);
        return units ? list.reduce((sum,s)=>sum+pointsFor(s)*credit(s),0)/units*5 : 0;
      };
      const bonus = selected.reduce((sum,s)=>sum+(s.grade===2?2:s.grade===3?3:0),0);
      const score = groupScore(core)+groupScore(other)+bonus;
      const careerUsed = selected.filter(s=>s.type==='career').length;
      return { label: rule.label, score, maxScore: 1030, avgGrade: (selected.reduce((sum,s)=>sum+convertedRank(s),0)/selected.length).toFixed(2), careerUsed, desc: `국·영·수 상위 ${core.length}과목 ${groupScore(core).toFixed(2)} + 한국사·사·과·제2외국어·한문 상위 ${other.length}과목 ${groupScore(other).toFixed(2)} + 학년 가산점 ${bonus} · 진로 A→4·B→5·C→7등급 환산` };
    }
    if (rule.formula === 'hanseo2027') {
      const rankPoints = [10,9,8,7,6,5,4,3,2], achievementPoints = {A:9.5,B:6.5,C:3};
      const pick = areas => common.filter(s=>areas.includes(s.area)).sort((a,b)=>a.rank-b.rank||credit(b)-credit(a)).slice(0,2);
      const selectedCommon = pick(['국어']).concat(pick(['영어','제2외국어']),pick(['수학']),pick(['사회','과학']));
      const selectedCareer = career.sort((a,b)=>achievementPoints[b.achv]-achievementPoints[a.achv]).slice(0,2);
      const scored = selectedCommon.map(s=>({s,points:rankPoints[s.rank-1]})).concat(selectedCareer.map(s=>({s,points:achievementPoints[s.achv]})));
      if (!scored.length) return { label: rule.label, unavailable: true, reason: '국어·외국어·수학·사회/과학 및 진로선택 성적을 입력해 주세요.' };
      const missing = Math.max(0,10-scored.length), x=(scored.reduce((sum,x)=>sum+x.points,0)+missing*2)/10;
      const intervals=[[9.4,540,90],[8.9,523.8,87.3],[8.6,511.65,85.275],[8.3,499.5,83.25],[8,487.35,81.225],[7.7,475.2,79.2],[7.4,463.05,77.175],[7.1,450.9,75.15],[6.8,438.75,73.125],[6.5,426.6,71.1],[6.15,414.45,69.075],[5.7,402.3,67.05],[5.35,390.15,65.025],[5.05,378,63],[4.75,365.85,60.975],[4.45,353.7,58.95],[4.15,341.55,56.925],[3.85,329.4,54.9],[3.55,317.25,52.875],[3.25,305.1,50.85],[2.95,292.95,48.825],[2.65,280.8,46.8],[2,270,45]];
      let score=rule.intervalTable ? (intervals.find(row=>x>=row[0])||intervals[intervals.length-1])[1] : x*rule.multiplier;
      return { label: rule.label, score, maxScore: rule.intervalTable?540:450, avgGrade: x.toFixed(3), careerUsed:selectedCareer.length, desc:`국어·외국어·수학·사회/과학 각 2과목 + 진로 2과목, 평균등급점수 X=${x.toFixed(3)} · 진로 A=9.5/B=6.5/C=3점${missing?` · 부족 ${missing}과목은 9등급 2점`:''}` };
    }
    if (rule.formula === 'daeshin2027') {
      const year1=common.filter(s=>s.grade===1&&['국어','사회','과학','영어'].includes(s.area)).sort((a,b)=>a.rank-b.rank).slice(0,4);
      const pickUpper=grade=>common.filter(s=>s.grade===grade&&['사회','과학','영어','제2외국어'].includes(s.area)).sort((a,b)=>a.rank-b.rank).slice(0,2);
      const year2=pickUpper(2),year3=pickUpper(3),avg=list=>list.length?list.reduce((sum,s)=>sum+rule.rankPoints[s.rank-1],0)/list.length:null;
      if (!year1.length || !year2.length || !year3.length) return {label:rule.label,unavailable:true,reason:'1·2·3학년 반영 교과의 석차등급이 모두 필요합니다.'};
      const score=avg(year1)*0.2+avg(year2)*0.3+avg(year3)*0.5;
      const selected=year1.concat(year2,year3);
      return {label:rule.label,score,maxScore:100,avgGrade:(selected.reduce((sum,s)=>sum+s.rank,0)/selected.length).toFixed(2),careerUsed:0,desc:`1학년 상위 ${year1.length}과목 20% + 2학년 상위 ${year2.length}과목 30% + 3학년 상위 ${year3.length}과목 50% · 진로선택 미반영`};
    }
    if (rule.formula === 'bpu2027') {
      const years = [1,2,3].map(grade => common.filter(s=>s.grade===grade));
      if (years.some(list=>!list.length)) return {label:rule.label,unavailable:true,reason:'1·2·3학년 석차등급 과목이 모두 필요합니다.'};
      const yearScores = years.map(list=>list.reduce((sum,s)=>sum+rule.rankPoints[s.rank-1],0)/list.length);
      const yearGrades = years.map(list=>list.reduce((sum,s)=>sum+s.rank,0)/list.length);
      const score = yearScores.reduce((sum,v)=>sum+v,0)/3;
      const avgGrade = yearGrades.reduce((sum,v)=>sum+v,0)/3;
      return {label:rule.label,score,maxScore:1000,avgGrade:avgGrade.toFixed(2),careerUsed:0,desc:`석차등급이 있는 전 과목의 학년별 평균점수 ${yearScores.map(v=>v.toFixed(2)).join('·')}를 33.3%씩 반영 · 진로 성취도만 있는 과목은 미반영`};
    }
    if (rule.formula === 'youngsan2027') {
      const commonCandidates = common.filter(s=>rule.areas.includes(s.area)).map(s=>({...s,convertedRank:s.rank,isCareer:false}));
      const careerCandidates = career.filter(s=>rule.areas.includes(s.area)).map(s=>({...s,convertedRank:rule.achievementRanks[s.achv],isCareer:true})).sort((a,b)=>a.convertedRank-b.convertedRank||credit(b)-credit(a)).slice(0,rule.careerMax);
      let selected=[];
      if (rule.requiredAreas) {
        for (const area of rule.requiredAreas) {
          const best=commonCandidates.concat(careerCandidates).filter(s=>s.area===area).sort((a,b)=>a.convertedRank-b.convertedRank||credit(b)-credit(a))[0];
          if (best && !selected.some(x=>x.id===best.id)) selected.push(best);
        }
      }
      const pool=commonCandidates.concat(careerCandidates).filter(s=>!selected.some(x=>x.id===s.id)).sort((a,b)=>a.convertedRank-b.convertedRank||credit(b)-credit(a));
      selected=selected.concat(pool.slice(0,Math.max(0,rule.totalSlots-selected.length))).slice(0,rule.totalSlots);
      if (!selected.length) return {label:rule.label,unavailable:true,reason:'반영 교과의 석차등급 또는 진로 성취도를 입력해 주세요.'};
      const missing=Math.max(0,rule.totalSlots-selected.length);
      const score=selected.reduce((sum,s)=>sum+rule.rankPoints[s.convertedRank-1],0)+missing*rule.rankPoints[8];
      const avgGrade=(selected.reduce((sum,s)=>sum+s.convertedRank,0)+missing*9)/rule.totalSlots;
      const careerUsed=selected.filter(s=>s.isCareer).length;
      return {label:rule.label,score,maxScore:rule.maxScore,avgGrade:avgGrade.toFixed(2),careerUsed,desc:`전 학년 상위 ${rule.totalSlots}과목 합산${missing?`(부족 ${missing}과목은 9등급)`:''} · 진로선택 ${careerUsed}과목(A→1·B→3·C→5, 최대 ${rule.careerMax}) · 반영: ${selected.map(s=>`${s.name||s.area}(${s.convertedRank}${s.isCareer?',진로':''})`).join(', ')}`};
    }
    if (rule.formula === 'yewon2027') {
      const pick=grade=>common.filter(s=>s.grade===grade).sort((a,b)=>a.rank-b.rank||credit(b)-credit(a)).slice(0,2);
      const y1=pick(1),y2=pick(2),y3=pick(3);
      if (!y1.length||!y2.length||!y3.length) return {label:rule.label,unavailable:true,reason:'1·2·3학년 석차등급 과목이 모두 필요합니다.'};
      const avg=list=>list.reduce((sum,s)=>sum+s.rank,0)/list.length;
      const grade=avg(y1)*0.5+avg(y2)*0.3+avg(y3)*0.2;
      const score=(9-grade)/8*1000;
      return {label:rule.label,score,maxScore:'비교지수 1000',avgGrade:grade.toFixed(2),careerUsed:0,desc:`학년별 석차등급 상위 2과목 평균을 1학년 50% + 2학년 30% + 3학년 20%로 반영한 공식 가중등급 · 대학 점수표 미공개로 동일 순위의 1000점 비교지수 병기`};
    }
    if (rule.formula === 'sangha2027') {
      const pick=grade=>common.filter(s=>s.grade===grade).sort((a,b)=>a.rank-b.rank||credit(b)-credit(a)).slice(0,4);
      const y1=pick(1),y2=pick(2),y3=pick(3);
      if (!y1.length||!y2.length||!y3.length) return {label:rule.label,unavailable:true,reason:'1·2·3학년 석차등급 과목이 모두 필요합니다.'};
      const avg=list=>list.reduce((sum,s)=>sum+s.rank,0)/list.length;
      const grade=avg(y1)*0.25+avg(y2)*0.25+avg(y3)*0.5;
      const score=(9-grade)/8*600;
      return {label:rule.label,score,maxScore:'비교지수 600',avgGrade:grade.toFixed(2),careerUsed:0,desc:`학년별 우수 4과목을 1학년 25% + 2학년 25% + 3학년 50%로 반영한 공식 가중등급 · 대학 점수표 미공개로 동일 순위의 600점 비교지수 병기`};
    }
    if (rule.formula === 'kwangshin2027') {
      const selected=common.filter(s=>s.grade<3||(s.grade===3&&s.sem===1));
      if (!selected.length) return {label:rule.label,unavailable:true,reason:'3학년 1학기까지의 석차등급과 이수단위를 입력해 주세요.'};
      const units=selected.reduce((sum,s)=>sum+credit(s),0);
      const grade=selected.reduce((sum,s)=>sum+s.rank*credit(s),0)/units;
      const bucket=Math.max(1,Math.min(9,Math.floor(grade)));
      return {label:rule.label,score:rule.rankPoints[bucket-1],maxScore:600,avgGrade:grade.toFixed(2),careerUsed:0,desc:`3학년 1학기까지 진로선택을 제외한 전 과목 ${selected.length}개 이수단위 가중평균 ${grade.toFixed(3)}등급 → ${bucket}등급 ${rule.rankPoints[bucket-1]}점`};
    }
    if (rule.formula === 'ytus2027') {
      const period=common.filter(s=>s.grade===2||(s.grade===3&&s.sem===1));
      const chosenAreas=rule.primaryAreas.filter(area=>period.some(s=>s.area===area));
      for (const fallback of rule.fallbackAreas) if (chosenAreas.length<3&&period.some(s=>s.area===fallback)) chosenAreas.push(fallback);
      if (!chosenAreas.length) return {label:rule.label,unavailable:true,reason:'2학년 및 3학년 1학기의 국어·영어·사회(없으면 과학·수학) 석차등급을 입력해 주세요.'};
      const areaScores=[], areaGrades=[], selected=[];
      for (const area of chosenAreas.slice(0,3)) {
        const list=period.filter(s=>s.area===area); if(!list.length) continue;
        const units=list.reduce((sum,s)=>sum+credit(s),0);
        areaScores.push(list.reduce((sum,s)=>sum+rule.rankPoints[s.rank-1]*credit(s),0)/units);
        areaGrades.push(list.reduce((sum,s)=>sum+s.rank*credit(s),0)/units);
        selected.push(...list);
      }
      const score=areaScores.reduce((a,v)=>a+v,0)/areaScores.length;
      const grade=areaGrades.reduce((a,v)=>a+v,0)/areaGrades.length;
      return {label:rule.label,score,maxScore:480,avgGrade:grade.toFixed(2),careerUsed:0,desc:`2학년·3학년 1학기 ${chosenAreas.slice(0,3).join('·')} 교과를 각각 이수단위 가중한 뒤 교과 평균 · ${selected.length}과목 · 진로 성취도만 있는 과목은 미반영`};
    }
    if (rule.formula === 'hanilLatest') {
      const commonCandidates=common.map(s=>({...s,convertedRank:s.rank,isCareer:false}));
      const careerCandidates=career.map(s=>({...s,convertedRank:rule.achievementRanks[s.achv],isCareer:true}));
      const selected=commonCandidates.concat(careerCandidates).filter(s=>s.grade<3||(s.grade===3&&s.sem===1));
      if (!selected.length) return {label:rule.label,unavailable:true,reason:'3학년 1학기까지의 전 과목 석차등급 또는 진로 성취도를 입력해 주세요.'};
      const units=selected.reduce((sum,s)=>sum+credit(s),0);
      const grade=selected.reduce((sum,s)=>sum+s.convertedRank*credit(s),0)/units;
      const score=rule.basicScore+rule.practicalScore*(10-grade)/9;
      const careerUsed=selected.filter(s=>s.isCareer).length;
      return {label:rule.label,score,maxScore:800,avgGrade:grade.toFixed(2),careerUsed,provisional:true,desc:`[2027 요강 미게시·2026 공식 산식 잠정] 3학년 1학기까지 전 과목 이수단위 가중평균 · 진로 A→2/B→5/C→8 · 600 + {200×(10−평균등급)/9}`};
    }
    if (rule.formula === 'gyeongnam2027') {
      const areas=['국어','수학','영어','한국사','사회','과학'];
      const normal=common.filter(s=>areas.includes(s.area)).map(s=>({...s,convertedRank:s.rank,isCareer:false}));
      const careerTop=career.filter(s=>areas.includes(s.area)).map(s=>({...s,convertedRank:({A:1,B:3,C:5})[s.achv],isCareer:true})).sort((a,b)=>a.convertedRank-b.convertedRank||credit(b)-credit(a)).slice(0,2);
      const selected=normal.concat(careerTop).sort((a,b)=>a.convertedRank-b.convertedRank||credit(b)-credit(a)).slice(0,10);
      if(!selected.length)return{label:rule.label,unavailable:true,reason:'국어·수학·영어·한국사·사회·과학 성적을 입력해 주세요.'};
      const gradePoints=[100,96,89,77,60,40,23,11,0],sum=selected.reduce((a,s)=>a+gradePoints[s.convertedRank-1],0),careerUsed=selected.filter(s=>s.isCareer).length;
      const score=rule.minScore+(rule.maxScore-rule.minScore)*(sum/(selected.length*100));
      return{label:rule.label,score,maxScore:rule.maxScore,avgGrade:(selected.reduce((a,s)=>a+s.convertedRank,0)/selected.length).toFixed(2),careerUsed,desc:`상위 ${selected.length}/10과목(진로 최대 2) 등급점수 합 ${sum} · ${rule.minScore}+(${rule.maxScore}−${rule.minScore})×{${sum}/(${selected.length}×100)}`};
    }
    if(rule.formula==='kyungdong2027'){
      const mapped=subjects.filter(s=>(isRankedType(s)&&rankOK(s))||(s.type==='career'&&achvOK(s))).filter(s=>s.grade<3||(s.grade===3&&s.sem===1)).map(s=>({...s,convertedRank:s.type==='career'?({A:1,B:3,C:5})[s.achv]:s.rank,isCareer:s.type==='career'}));
      if(!mapped.length)return{label:rule.label,unavailable:true,reason:'3학년 1학기까지의 전 과목 등급 또는 성취도를 입력해 주세요.'};
      const semesters=[...new Set(mapped.map(s=>`${s.grade}-${s.sem}`))],semesterAverages=semesters.map(key=>{const list=mapped.filter(s=>`${s.grade}-${s.sem}`===key);return list.reduce((a,s)=>a+s.convertedRank,0)/list.length}),grade=semesterAverages.reduce((a,v)=>a+v,0)/semesterAverages.length;
      const score=(9-grade)/8*1000;
      return{label:rule.label,score,maxScore:'비교지수 1000',avgGrade:grade.toFixed(2),careerUsed:mapped.filter(s=>s.isCareer).length,desc:`학기별 단순 평균 ${semesterAverages.map(v=>v.toFixed(3)).join('·')}의 평균 · 이수단위 미반영 · 진로 A→1/B→3/C→5 · 대학 최종 배점표 미공개로 동일 순위의 1000점 비교지수 병기`};
    }
    if(rule.formula==='kwangwoon2027'){
      const areas=['국어','영어','수학','사회','과학','한국사'],mapped=subjects.filter(s=>areas.includes(s.area)&&((isRankedType(s)&&rankOK(s))||(s.type==='career'&&achvOK(s)))).filter(s=>s.grade<3||(s.grade===3&&s.sem===1)).map(s=>({...s,convertedRank:s.type==='career'?rule.achievementRanks[s.achv]:s.rank,isCareer:s.type==='career'}));
      if(!mapped.length)return{label:rule.label,unavailable:true,reason:'반영 교과의 등급 또는 진로 성취도와 이수단위를 입력해 주세요.'};const units=mapped.reduce((a,s)=>a+credit(s),0),score=mapped.reduce((a,s)=>a+rule.rankPoints[s.convertedRank-1]*credit(s),0)/units,grade=mapped.reduce((a,s)=>a+s.convertedRank*credit(s),0)/units;
      return{label:rule.label,score,maxScore:100,avgGrade:grade.toFixed(2),careerUsed:mapped.filter(s=>s.isCareer).length,desc:`3학년 1학기까지 반영교과 전 과목 이수단위 가중점수 · 진로 A→1/B→2/C→4`};
    }
    if(rule.formula==='daejin2027'){
      const areas=['국어','영어','수학','사회','한국사','과학'],mapped=subjects.filter(s=>areas.includes(s.area)&&((isRankedType(s)&&rankOK(s))||(s.type==='career'&&achvOK(s)))).filter(s=>s.grade<3||(s.grade===3&&s.sem===1)).map(s=>({...s,convertedRank:s.type==='career'?({A:1,B:2,C:4})[s.achv]:s.rank,isCareer:s.type==='career'}));
      const careerTop=mapped.filter(s=>s.isCareer).sort((a,b)=>a.convertedRank-b.convertedRank||credit(b)-credit(a)).slice(0,8),normal=mapped.filter(s=>!s.isCareer),selected=normal.concat(careerTop).sort((a,b)=>a.convertedRank-b.convertedRank||credit(b)-credit(a)).slice(0,18);while(selected.length<18)selected.push({convertedRank:9,credit:1,isCareer:false,name:'부족과목'});const units=selected.reduce((a,s)=>a+credit(s),0),grade=selected.reduce((a,s)=>a+s.convertedRank*credit(s),0)/units;
      const bands=[[1.4,100],[1.7,99.25],[2,98.5],[2.25,97.75],[2.5,97],[2.75,96.25],[3,95.5],[3.25,94.75],[3.5,94],[3.75,93.25],[4,92.5],[4.2,91.75],[4.4,91],[4.6,90.25],[4.8,89.5],[5,88.75],[5.2,88],[5.4,87.25],[5.6,86.5],[5.8,85.75],[6,85],[6.25,84.25],[6.5,83.5],[6.75,82.75],[7,80],[7.5,75],[8,70],[8.5,65],[8.999,60],[9,0]],base=(bands.find(x=>grade<=x[0])||bands[bands.length-1])[1];
      return{label:rule.label,score:base*rule.factor,maxScore:rule.maxScore,avgGrade:grade.toFixed(3),careerUsed:selected.filter(s=>s.isCareer).length,desc:`상위 18과목 이수단위 가중평균(부족 과목 9등급·1단위) → 30단계 ${base}점 × ${rule.factor}`};
    }
    if(rule.formula==='dongyang2027'){
      const areas=['국어','수학','영어','사회','과학'],mapped=subjects.filter(s=>areas.includes(s.area)&&((isRankedType(s)&&rankOK(s))||(s.type==='career'&&achvOK(s)))).filter(s=>s.grade<3||(s.grade===3&&s.sem===1)).map(s=>({...s,convertedRank:s.type==='career'?rule.achievementRanks[s.achv]:s.rank,isCareer:s.type==='career'})).sort((a,b)=>a.convertedRank-b.convertedRank||credit(b)-credit(a)).slice(0,15);const missing=Math.max(0,15-mapped.length),grade=(mapped.reduce((a,s)=>a+s.convertedRank,0)+missing*9)/15,score=(mapped.reduce((a,s)=>a+rule.rankPoints[s.convertedRank-1],0)+missing*rule.rankPoints[8])/15;
      return{label:rule.label,score,maxScore:90,avgGrade:grade.toFixed(2),careerUsed:mapped.filter(s=>s.isCareer).length,desc:`국·수·영·사·과 우수 15과목 단순평균${missing?` · 부족 ${missing}과목 9등급`:''} · 진로 A→1/B→2/C→3`};
    }
    if(rule.formula==='myongji2027'){
      const mapped=subjects.filter(s=>(isRankedType(s)&&rankOK(s))||(s.type==='career'&&achvOK(s))).filter(s=>s.grade<3||(s.grade===3&&s.sem===1)).map(s=>({...s,convertedRank:s.type==='career'?rule.achievementRanks[s.achv]:s.rank,isCareer:s.type==='career'}));if(!mapped.length)return{label:rule.label,unavailable:true,reason:'3학년 1학기까지의 전 과목 성적을 입력해 주세요.'};const units=mapped.reduce((a,s)=>a+credit(s),0),weighted=mapped.reduce((a,s)=>a+rule.rankPoints[s.convertedRank-1]*credit(s),0),bonus=units*0.05,score=(weighted+bonus)/units,grade=mapped.reduce((a,s)=>a+s.convertedRank*credit(s),0)/units;
      return{label:rule.label,score,maxScore:'100점+가산점',avgGrade:grade.toFixed(2),careerUsed:mapped.filter(s=>s.isCareer).length,desc:`전 과목 이수단위 가중점수 + 전체 이수단위×0.05 가산점 ${bonus.toFixed(2)} · 진로 A→1/B→2/C이하→4`};
    }
    if(rule.formula==='mokwon2027'){
      const normal=common.filter(s=>s.grade<3||(s.grade===3&&s.sem===1)).sort((a,b)=>a.rank-b.rank||credit(b)-credit(a)).slice(0,5),careerPicked=career.filter(s=>s.grade<3||(s.grade===3&&s.sem===1)).map(s=>({...s,convertedRank:({A:2,B:3,C:4})[s.achv]})).sort((a,b)=>a.convertedRank-b.convertedRank||credit(b)-credit(a)).slice(0,3);while(careerPicked.length<3)careerPicked.push({convertedRank:4,name:'진로 부족과목',isMissing:true});const ranks=normal.map(s=>s.rank).concat(careerPicked.map(s=>s.convertedRank)),table=[100,95,90,85,80,75,70,65,50],base=ranks.reduce((a,v)=>a+table[v-1],0)/8;
      return{label:rule.label,score:base*rule.factor,maxScore:rule.maxScore,avgGrade:(ranks.reduce((a,v)=>a+v,0)/8).toFixed(2),careerUsed:careerPicked.filter(s=>!s.isMissing).length,desc:`공통·일반 상위 ${normal.length}/5 + 진로 상위 ${careerPicked.filter(s=>!s.isMissing).length}/3(부족 C=4등급) 점수 평균 × ${rule.factor}`};
    }
    if(rule.formula==='dongmyeong2027'){
      const areas=['국어','영어','수학','사회','한국사','과학'],normal=common.filter(s=>areas.includes(s.area)&&s.grade<3||(areas.includes(s.area)&&s.grade===3&&s.sem===1)).map(s=>({...s,convertedRank:s.rank,isCareer:false})),careerTop=career.filter(s=>areas.includes(s.area)&&(s.grade<3||(s.grade===3&&s.sem===1))).map(s=>({...s,convertedRank:({A:1,B:3,C:5})[s.achv],isCareer:true})).sort((a,b)=>a.convertedRank-b.convertedRank).slice(0,2);let pool=normal.concat(careerTop),selected=[];const core=pool.filter(s=>['국어','영어','수학'].includes(s.area)).sort((a,b)=>a.convertedRank-b.convertedRank||credit(b)-credit(a)).slice(0,3);selected.push(...core);selected.push(...pool.filter(s=>!selected.some(x=>x.id===s.id)).sort((a,b)=>a.convertedRank-b.convertedRank||credit(b)-credit(a)).slice(0,8-selected.length));if(!selected.length)return{label:rule.label,unavailable:true,reason:'반영 교과 성적을 입력해 주세요.'};const score=selected.reduce((a,s)=>a+rule.rankPoints[s.convertedRank-1],0)/8;
      return{label:rule.label,score,maxScore:rule.maxScore,avgGrade:(selected.reduce((a,s)=>a+s.convertedRank,0)/selected.length).toFixed(2),careerUsed:selected.filter(s=>s.isCareer).length,desc:`상위 ${selected.length}/8과목(국·영·수 3과목 필수, 진로 최대 2) 점수 합÷8 · 이수단위 미반영`};
    }
    if(rule.formula==='sangji2027'){
      const areas=['국어','수학','영어','사회','한국사','과학'],period=s=>s.grade<3||(s.grade===3&&s.sem===1);let selected=[];for(let g=1;g<=3;g++)for(let sem=1;sem<=2;sem++){if(g===3&&sem===2)continue;selected.push(...common.filter(s=>period(s)&&s.grade===g&&s.sem===sem&&areas.includes(s.area)).sort((a,b)=>a.rank-b.rank||credit(b)-credit(a)).slice(0,rule.perSemester));}selected=selected.slice(0,rule.maxCommon).map(s=>({...s,convertedRank:s.rank,isCareer:false}));const careerTop=career.filter(s=>period(s)&&areas.includes(s.area)).map(s=>({...s,convertedRank:({A:1,B:3,C:6})[s.achv],isCareer:true})).sort((a,b)=>a.convertedRank-b.convertedRank||credit(b)-credit(a)).slice(0,3);selected.push(...careerTop);while(selected.length<rule.minSubjects)selected.push({convertedRank:9,credit:1,isCareer:false,name:'부족과목'});const units=selected.reduce((a,s)=>a+credit(s),0),grade=selected.reduce((a,s)=>a+s.convertedRank*credit(s),0)/units,score=(-5*grade+105)*10;
      return{label:rule.label,score,maxScore:1000,avgGrade:grade.toFixed(2),careerUsed:selected.filter(s=>s.isCareer).length,desc:`학기별 상위 ${rule.perSemester}과목 + 진로 최대 3과목, 최소 ${rule.minSubjects}과목 이수단위 가중평균 · (-5×평균+105)×10`};
    }
    if(rule.formula==='weightedAll2027'){
      const selected=common.filter(s=>rule.areas.includes(s.area)&&(s.grade<3||(s.grade===3&&s.sem===1)));if(!selected.length)return{label:rule.label,unavailable:true,reason:'반영 교과의 석차등급과 이수단위를 입력해 주세요.'};const units=selected.reduce((a,s)=>a+credit(s),0),score=selected.reduce((a,s)=>a+rule.rankPoints[s.rank-1]*credit(s),0)/units,grade=selected.reduce((a,s)=>a+s.rank*credit(s),0)/units;
      return{label:rule.label,score,maxScore:rule.maxScore,avgGrade:grade.toFixed(2),careerUsed:0,desc:`3학년 1학기까지 반영교과 전 과목 이수단위 가중점수 · 진로선택 ${rule.careerMode==='exclude'?'미반영':'별도 확인'}`};
    }
    if(rule.formula==='splitWeighted2027'){
      const period=s=>s.grade<3||(s.grade===3&&s.sem===1),normal=common.filter(s=>period(s)&&rule.commonAreas.includes(s.area)),careerPool=career.filter(s=>period(s)&&rule.careerAreas.includes(s.area));const careerPicked=rule.careerTop?[...careerPool].sort((a,b)=>rule.achievementPoints[b.achv]-rule.achievementPoints[a.achv]||credit(b)-credit(a)).slice(0,rule.careerTop):careerPool;if(!normal.length&&!careerPicked.length)return{label:rule.label,unavailable:true,reason:'반영 교과의 석차등급 또는 진로 성취도와 이수단위를 입력해 주세요.'};const weighted=(list,points)=>{const units=list.reduce((a,s)=>a+credit(s),0);return units?list.reduce((a,s)=>a+points(s)*credit(s),0)/units:null},commonScore=weighted(normal,s=>rule.rankPoints[s.rank-1]),careerScore=weighted(careerPicked,s=>rule.achievementPoints[s.achv]);let combined;if(commonScore!==null&&careerScore!==null)combined=commonScore*rule.commonWeight+careerScore*rule.careerWeight;else combined=commonScore??careerScore;const score=combined*(rule.outputScale||1),all=normal.concat(careerPicked),units=all.reduce((a,s)=>a+credit(s),0),grade=units?all.reduce((a,s)=>a+(s.type==='career'?({A:1,B:3,C:5})[s.achv]:s.rank)*credit(s),0)/units:null;
      return{label:rule.label,score,maxScore:rule.maxScore,avgGrade:grade===null?'-':grade.toFixed(2),careerUsed:careerPicked.length,desc:`공통·일반 ${normal.length}과목 이수단위 가중점수 ${commonScore===null?'-':commonScore.toFixed(3)}${careerScore===null?' · 진로 과목이 없어 공통·일반 100%':` × ${rule.commonWeight*100}% + 진로 ${careerPicked.length}과목 ${careerScore.toFixed(3)} × ${rule.careerWeight*100}%`}${rule.outputScale?` × ${rule.outputScale}`:''}`};
    }
    if(rule.formula==='cha2027'){
      const period=s=>s.grade<3||(s.grade===3&&s.sem===1),mapped=subjects.filter(s=>rule.areas.includes(s.area)&&period(s)&&((isRankedType(s)&&rankOK(s))||(s.type==='career'&&achvOK(s)))).map(s=>({...s,convertedRank:s.type==='career'?rule.achievementRanks[s.achv]:s.rank,isCareer:s.type==='career'}));if(!mapped.length)return{label:rule.label,unavailable:true,reason:'반영 교과의 등급 또는 진로 성취도와 이수학점을 입력해 주세요.'};const koreanUnits=mapped.filter(s=>s.area==='국어').reduce((a,s)=>a+credit(s),0),units=mapped.reduce((a,s)=>a+credit(s),0),score=mapped.reduce((a,s)=>a+rule.rankPoints[s.convertedRank-1]*credit(s)*(s.area==='국어'&&koreanUnits<16?.9:1),0)/units,grade=mapped.reduce((a,s)=>a+s.convertedRank*credit(s),0)/units;
      return{label:rule.label,score,maxScore:1000,avgGrade:grade.toFixed(2),careerUsed:mapped.filter(s=>s.isCareer).length,desc:`3학년 1학기까지 전 과목 이수학점 가중점수 · 진로 A→1/B→3/C→5${koreanUnits<16?` · 국어 이수학점 ${koreanUnits}<16으로 국어 성적 90% 반영`:''}`};
    }
    if(rule.formula==='kaya2027'){
      const period=s=>s.grade<3||(s.grade===3&&s.sem===1),toMapped=s=>({...s,convertedRank:s.type==='career'?rule.achievementRanks[s.achv]:s.rank,isCareer:s.type==='career'}),normal=common.filter(period).map(toMapped),careerTop=career.filter(period).map(toMapped).sort((a,b)=>a.convertedRank-b.convertedRank||credit(b)-credit(a)).slice(0,rule.careerMax),pool=normal.concat(careerTop),core=pool.filter(s=>rule.coreAreas.includes(s.area)).sort((a,b)=>a.convertedRank-b.convertedRank||credit(b)-credit(a)).slice(0,6),other=pool.filter(s=>rule.otherAreas.includes(s.area)).sort((a,b)=>a.convertedRank-b.convertedRank||credit(b)-credit(a)).slice(0,2),selected=core.concat(other);
      if(selected.length<8)return{label:rule.label,unavailable:true,reason:'국어·영어·수학 상위 6과목과 사회·과학·한국사 상위 2과목을 입력해 주세요.'};
      const score=selected.reduce((a,s)=>a+rule.rankPoints[s.convertedRank-1],0),careerUsed=selected.filter(s=>s.isCareer).length;
      return{label:rule.label,score,maxScore:rule.maxScore,avgGrade:(selected.reduce((a,s)=>a+s.convertedRank,0)/8).toFixed(2),careerUsed,desc:`국·영·수 상위 6 + 사·과·한국사 상위 2의 점수 합 · 진로 최대 2과목 A→1/B→3/C→5 · ${selected.map(s=>`${s.name||s.area}(${s.convertedRank}${s.isCareer?',진로':''})`).join(', ')}`};
    }
    if(rule.formula==='kangnam2027'){
      const period=s=>s.grade<3||(s.grade===3&&s.sem===1),mapped=subjects.filter(s=>period(s)&&rule.areas.includes(s.area)&&((isRankedType(s)&&rankOK(s))||(s.type==='career'&&achvOK(s)))).map(s=>({...s,convertedRank:s.type==='career'?rule.achievementRanks[s.achv]:s.rank,isCareer:s.type==='career'})).sort((a,b)=>a.convertedRank-b.convertedRank||credit(a)-credit(b)).slice(0,rule.totalSlots);
      if(!mapped.length)return{label:rule.label,unavailable:true,reason:'반영 6개 교과의 등급 또는 진로 성취도와 이수단위를 입력해 주세요.'};
      const units=mapped.reduce((a,s)=>a+credit(s),0),score=mapped.reduce((a,s)=>a+rule.rankPoints[s.convertedRank-1]*credit(s),0)/units,grade=mapped.reduce((a,s)=>a+s.convertedRank*credit(s),0)/units;
      return{label:rule.label,score,maxScore:rule.maxScore,avgGrade:grade.toFixed(2),careerUsed:mapped.filter(s=>s.isCareer).length,desc:`상위 ${mapped.length}/20과목 이수단위 가중점수 · 진로 A→2/B→3/C→5 · 동등급 경계는 낮은 이수단위 우선`};
    }
    if(rule.formula==='kyungsung2027'){
      const period=s=>s.grade<3||(s.grade===3&&s.sem===1),toMapped=s=>({...s,convertedRank:s.type==='career'?rule.achievementRanks[s.achv]:s.rank,isCareer:s.type==='career'}),normal=common.filter(period).map(toMapped),careerTop=career.filter(period).map(toMapped).sort((a,b)=>a.convertedRank-b.convertedRank||credit(b)-credit(a)).slice(0,rule.careerMax||Infinity);
      if(rule.mode==='pharmacy'){
        const allowed=['국어','영어','수학','사회','과학','한국사'],avg=list=>{const u=list.reduce((a,s)=>a+credit(s),0);return u?list.reduce((a,s)=>a+rule.rankPoints[s.convertedRank-1]*credit(s),0)/u:null},commonPart=normal.filter(s=>s.type==='common'&&allowed.includes(s.area)),generalPart=normal.filter(s=>s.type==='general'&&allowed.includes(s.area)),careerPart=career.filter(s=>period(s)&&allowed.includes(s.area)).map(toMapped),scores=[avg(commonPart),avg(generalPart),avg(careerPart)];
        if(scores.some(v=>v===null))return{label:rule.label,unavailable:true,reason:'약학과 산출에는 공통과목·일반선택·진로선택을 구분해 각 성적과 이수단위를 입력해야 합니다.'};
        const score=scores[0]*3+scores[1]*5+scores[2]*2,all=commonPart.concat(generalPart,careerPart),units=all.reduce((a,s)=>a+credit(s),0);
        return{label:rule.label,score,maxScore:rule.maxScore,avgGrade:(all.reduce((a,s)=>a+s.convertedRank*credit(s),0)/units).toFixed(2),careerUsed:careerPart.length,desc:`공통 평균 ${scores[0].toFixed(3)}×3 + 일반선택 평균 ${scores[1].toFixed(3)}×5 + 진로 평균 ${scores[2].toFixed(3)}×2 · 진로 A→1/B→3/C→5`};
      }
      const pool=normal.concat(careerTop);let selected=[];
      if(rule.mode==='quota'){
        const groups=[['국어'],['영어'],['수학'],['사회','과학','한국사'],['기타']],coreAreas=['국어','영어','수학','사회','과학','한국사'];
        selected=groups.flatMap(group=>pool.filter(s=>group[0]==='기타'?!coreAreas.includes(s.area):group.includes(s.area)).sort((a,b)=>a.convertedRank-b.convertedRank||credit(b)-credit(a)).slice(0,2));
      }else selected=pool.filter(s=>['국어','영어','수학','사회','과학','한국사'].includes(s.area)).sort((a,b)=>a.convertedRank-b.convertedRank||credit(b)-credit(a)).slice(0,10);
      if(selected.length<10)return{label:rule.label,unavailable:true,reason:rule.mode==='quota'?'국어·영어·수학·탐구·기타에서 각 2과목씩 입력해 주세요.':'반영교과 상위 10과목을 입력해 주세요.'};
      const sum=selected.reduce((a,s)=>a+rule.rankPoints[s.convertedRank-1],0);
      return{label:rule.label,score:sum,maxScore:rule.maxScore,avgGrade:(selected.reduce((a,s)=>a+s.convertedRank,0)/10).toFixed(2),careerUsed:selected.filter(s=>s.isCareer).length,desc:`${rule.mode==='quota'?'5개 교과군 각 2과목':'전체 상위 10과목'} 등급점수 합 · 진로 최대 2과목 A→2/B→4/C→6`};
    }
    if(rule.formula==='kyungil2027'){
      const period=s=>s.grade<3||(s.grade===3&&s.sem===1),areas=['국어','영어','수학','사회','과학'],normal=common.filter(s=>period(s)&&areas.includes(s.area)).sort((a,b)=>a.rank-b.rank||credit(b)-credit(a)),careerTop=career.filter(s=>period(s)).map(s=>({...s,convertedRank:rule.achievementRanks[s.achv],isCareer:true})).sort((a,b)=>a.convertedRank-b.convertedRank||credit(b)-credit(a)).slice(0,3),chosenAreas=[...new Set(normal.map(s=>s.area))].slice(0,3),required=chosenAreas.map(area=>normal.find(s=>s.area===area)),used=new Set(required.map(s=>s.id)),selected=required.concat(normal.filter(s=>!used.has(s.id)).slice(0,9-required.length),careerTop);
      if(normal.length<9||chosenAreas.length<3||careerTop.length<3)return{label:rule.label,unavailable:true,reason:'공통·일반 상위 9과목(서로 다른 3개 교과 포함)과 진로선택 상위 3과목을 입력해 주세요.'};
      const grade=selected.reduce((a,s)=>a+(s.isCareer?s.convertedRank:s.rank),0)/12,band=Math.min(9,Math.max(1,Math.floor(grade))),score=rule.rankPoints[band-1];
      return{label:rule.label,score,maxScore:rule.maxScore,avgGrade:grade.toFixed(2),careerUsed:3,desc:`공통·일반 9 + 진로 3과목 단순 평균 ${grade.toFixed(3)} → ${band}등급 구간 ${score}점 · 진로 A→1/B→2/C→3`};
    }
    if(rule.formula==='splitTop2027'){
      const period=s=>s.grade<3||(s.grade===3&&s.sem===1),normal=common.filter(s=>period(s)&&rule.areas.includes(s.area)).sort((a,b)=>a.rank-b.rank||credit(b)-credit(a)).slice(0,rule.commonTop),careerPicked=career.filter(s=>period(s)&&rule.areas.includes(s.area)).sort((a,b)=>rule.achievementPoints[b.achv]-rule.achievementPoints[a.achv]||credit(b)-credit(a)).slice(0,rule.careerTop);
      if(normal.length<rule.commonTop)return{label:rule.label,unavailable:true,reason:`공통·일반 상위 ${rule.commonTop}과목을 입력해 주세요.`};
      const commonScore=normal.reduce((a,s)=>a+rule.rankPoints[s.rank-1],0)/rule.commonTop,careerScore=careerPicked.length?careerPicked.reduce((a,s)=>a+rule.achievementPoints[s.achv],0)/careerPicked.length:null,score=careerScore===null?commonScore:commonScore*rule.commonWeight+careerScore*rule.careerWeight;
      return{label:rule.label,score,maxScore:rule.maxScore,avgGrade:(normal.reduce((a,s)=>a+s.rank,0)/normal.length).toFixed(2),careerUsed:careerPicked.length,desc:`공통·일반 상위 ${rule.commonTop}과목 ${commonScore.toFixed(3)}${careerScore===null?' (진로 미이수로 100% 반영)':`×${rule.commonWeight*100}% + 진로 상위 ${careerPicked.length}과목 ${careerScore.toFixed(3)}×${rule.careerWeight*100}%`}`};
    }
    if(rule.formula==='weightedTop2027'){
      const selected=common.filter(s=>rule.areas.includes(s.area)&&(s.grade<3||(s.grade===3&&s.sem===1))).sort((a,b)=>a.rank-b.rank||credit(b)-credit(a)).slice(0,rule.top);
      if(selected.length<(rule.requireCount||1))return{label:rule.label,unavailable:true,reason:`지원자격 및 산출에 필요한 상위 ${rule.requireCount}과목을 입력해 주세요.`};
      const units=selected.reduce((a,s)=>a+credit(s),0),base=selected.reduce((a,s)=>a+rule.rankPoints[s.rank-1]*credit(s),0)/units,score=base*(rule.scale||1);
      return{label:rule.label,score,maxScore:rule.maxScore,avgGrade:(selected.reduce((a,s)=>a+s.rank*credit(s),0)/units).toFixed(2),careerUsed:0,desc:`상위 ${selected.length}과목 이수단위 가중점수 ${base.toFixed(3)} × ${rule.scale||1} · 진로선택 미반영`};
    }
    if(rule.formula==='topSum2027'){
      const period=s=>s.grade<3||(s.grade===3&&s.sem===1),normal=common.filter(s=>period(s)&&rule.areas.includes(s.area)).map(s=>({...s,convertedRank:s.rank,isCareer:false})),careerTop=career.filter(s=>period(s)&&rule.areas.includes(s.area)).map(s=>({...s,convertedRank:rule.achievementRanks[s.achv],isCareer:true})).sort((a,b)=>a.convertedRank-b.convertedRank||credit(b)-credit(a)).slice(0,rule.careerMax),selected=normal.concat(careerTop).sort((a,b)=>a.convertedRank-b.convertedRank||credit(b)-credit(a)).slice(0,rule.top);while(selected.length<rule.top)selected.push({convertedRank:rule.padRank,isCareer:false,name:'부족과목'});
      const score=selected.reduce((a,s)=>a+rule.rankPoints[s.convertedRank-1],0);
      return{label:rule.label,score,maxScore:rule.maxScore,avgGrade:(selected.reduce((a,s)=>a+s.convertedRank,0)/rule.top).toFixed(2),careerUsed:selected.filter(s=>s.isCareer).length,desc:`상위 ${rule.top}과목 환산점수 합(부족 과목 ${rule.padRank}등급) · 진로 최대 ${rule.careerMax}과목 A→1/B→4/C→7`};
    }
    if(rule.formula==='originalTop2027'){
      const period=s=>s.grade<3||(s.grade===3&&s.sem===1),selected=subjects.filter(s=>period(s)&&!rule.excludeAreas.includes(s.area)&&percent(s.originalScore)!==null).sort((a,b)=>b.originalScore-a.originalScore).slice(0,rule.top);
      if(selected.length<rule.top)return{label:rule.label,unavailable:true,reason:`체육·예술을 제외한 과목의 원점수를 ${rule.top}과목 이상 입력해 주세요.`};
      const avg=selected.reduce((a,s)=>a+s.originalScore,0)/rule.top;
      return{label:rule.label,score:avg*rule.factor,maxScore:rule.maxScore,avgGrade:'원점수',careerUsed:selected.filter(s=>s.type==='career').length,desc:`원점수 상위 ${rule.top}과목 평균 ${avg.toFixed(2)} × ${rule.factor}`};
    }
    if(rule.formula==='halla2027'){
      const period=s=>s.grade<3||(s.grade===3&&s.sem===1),areas=['국어','영어','수학','사회','과학','한국사'],normal=common.filter(s=>period(s)&&areas.includes(s.area)).map(s=>({...s,convertedRank:s.rank,isCareer:false})),careerTop=career.filter(s=>period(s)&&areas.includes(s.area)).map(s=>({...s,convertedRank:({A:1,B:3,C:5})[s.achv],isCareer:true})).sort((a,b)=>a.convertedRank-b.convertedRank||credit(b)-credit(a)).slice(0,5),selected=normal.concat(careerTop).sort((a,b)=>a.convertedRank-b.convertedRank||credit(b)-credit(a)).slice(0,10);
      if(selected.length<10)return{label:rule.label,unavailable:true,reason:'반영교과 우수 10과목을 입력해 주세요.'};
      const units=selected.reduce((a,s)=>a+credit(s),0),grade=selected.reduce((a,s)=>a+s.convertedRank*credit(s),0)/units,points=[360,358,356,354,352,350,348,346,344,342,340,338,336,334,332,330,328,326,324,322,320,318,316,314,312,310,308,306,304,302,300,298,296,294,293,292],idx=Math.min(35,Math.max(0,Math.floor((grade-1+1e-9)/.22))),base=points[idx];
      return{label:rule.label,score:base*rule.factor,maxScore:rule.maxScore,avgGrade:grade.toFixed(2),careerUsed:selected.filter(s=>s.isCareer).length,desc:`우수 10과목 이수단위 가중평균 ${grade.toFixed(3)} → ${idx+1}구간 ${base}점${rule.factor!==1?` × ${rule.factor}`:''} · 진로 최대 5과목 A→1/B→3/C→5`};
    }
    if(rule.formula==='hansung2027'){
      const period=s=>s.grade<3||(s.grade===3&&s.sem===1),normal=common.filter(s=>period(s)&&rule.areas.includes(s.area)),careerMapped=[];
      for(const s of career.filter(s=>period(s)&&rule.areas.includes(s.area))){let convertedRank=1;if(s.achv!=='A'){const cumulative=s.achv==='B'?(percent(s.rateB)!==null&&percent(s.rateC)!==null?s.rateB+s.rateC:null):percent(s.rateC);if(cumulative===null)return[{label:rule.label,unavailable:true,reason:'한성대 진로선택 환산에는 해당 과목의 A·B·C 성취도별 분포비율을 입력해야 합니다.'}][0];convertedRank=cumulative>89?1:cumulative>60?2:4;}careerMapped.push({...s,convertedRank,isCareer:true});}
      let selectedNormal=normal;if(rule.mode==='quota')selectedNormal=rule.areas.flatMap(area=>normal.filter(s=>s.area===area).sort((a,b)=>a.rank-b.rank||credit(b)-credit(a)).slice(0,3));
      const selectedCareer=rule.careerTop?careerMapped.sort((a,b)=>a.convertedRank-b.convertedRank||credit(b)-credit(a)).slice(0,rule.careerTop):careerMapped,selected=selectedNormal.concat(selectedCareer);
      if(!selected.length)return{label:rule.label,unavailable:true,reason:'반영교과의 등급 또는 진로 성취도·분포비율과 이수단위를 입력해 주세요.'};
      const units=selected.reduce((a,s)=>a+credit(s),0),score=selected.reduce((a,s)=>a+rule.rankPoints[(s.isCareer?s.convertedRank:s.rank)-1]*credit(s),0)/units;
      return{label:rule.label,score,maxScore:rule.maxScore,avgGrade:'공식점수',careerUsed:selectedCareer.length,desc:`${rule.mode==='quota'?'교과별 공통·일반 상위 3과목 + 진로 상위 3과목':'반영교과 전 과목'} 이수단위 가중점수 · 진로 A=1등급, B/C는 누적분포비율로 1·2·4등급 환산`};
    }
    if(rule.formula==='hansei2027'){
      const selected=common.filter(s=>rule.areas.includes(s.area)&&(s.grade<3||(s.grade===3&&s.sem===1)));if(!selected.length)return{label:rule.label,unavailable:true,reason:'모집단위 반영교과의 석차등급과 이수단위를 입력해 주세요.'};const units=selected.reduce((a,s)=>a+credit(s),0),base=selected.reduce((a,s)=>a+rule.rankPoints[s.rank-1]*credit(s),0)/units/5*100,bonus=units*.05,score=Math.min(rule.maxScore,base+bonus);
      return{label:rule.label,score,maxScore:rule.maxScore,avgGrade:(selected.reduce((a,s)=>a+s.rank*credit(s),0)/units).toFixed(2),careerUsed:0,desc:`등급배점 이수단위 가중평균 ÷5×100 = ${base.toFixed(3)} + 반영 이수단위 ${units}×0.05 가산 ${bonus.toFixed(2)} (최고 ${rule.maxScore}점)`};
    }
    if(rule.formula==='honam2027'){
      const period=s=>s.grade<3||(s.grade===3&&s.sem===1),normal=common.filter(s=>period(s)&&['국어','영어','수학','사회','과학'].includes(s.area));if(!normal.length)return{label:rule.label,unavailable:true,reason:'국어·영어·수학·사회·과학 공통·일반선택 전 과목 등급을 입력해 주세요.'};const grade=normal.reduce((a,s)=>a+s.rank,0)/normal.length,thresholds=[1.99,2.99,3.49,3.99,4.49,4.99,5.49,5.99,6.49,6.99,7.99,8.99,9],idx=thresholds.findIndex(v=>grade<=v),base=rule.scoreTable[idx<0?12:idx],careerScores=career.filter(s=>period(s)).map(s=>({A:3,B:2,C:1})[s.achv]).sort((a,b)=>b-a).slice(0,3);while(careerScores.length<3)careerScores.push(0);const careerBonus=careerScores.reduce((a,v)=>a+v,0)/3,units=normal.reduce((a,s)=>a+credit(s),0),unitBonus=units>=70?5:0,score=Math.min(rule.maxScore,base+careerBonus+unitBonus);
      return{label:rule.label,score,maxScore:rule.maxScore,avgGrade:grade.toFixed(2),careerBonus:careerBonus+unitBonus,desc:`공통·일반 전 과목 단순평균 ${grade.toFixed(2)} → ${base}점 + 진로 상위3 평균 ${careerBonus.toFixed(2)} + 이수단위 ${units>=70?'70 이상 5점':'70 미만 0점'} (전형총점 이내)`};
    }
    if(rule.formula==='honamTheology2027'){
      const period=s=>s.grade<3||(s.grade===3&&s.sem===1);let score=0,weightUsed=0,chosen=[];for(const year of [1,2,3]){const inYear=common.filter(s=>period(s)&&s.grade===year),pick=[];for(const area of ['국어','영어']){const best=inYear.filter(s=>s.area===area).sort((a,b)=>a.rank-b.rank||credit(b)-credit(a))[0];if(best)pick.push(best);}if(pick.length<2)pick.push(...inYear.filter(s=>!pick.some(x=>x.id===s.id)).sort((a,b)=>a.rank-b.rank).slice(0,2-pick.length));if(!pick.length)continue;const yearScore=pick.reduce((a,s)=>a+rule.rankPoints[s.rank-1],0)/pick.length;score+=yearScore*rule.yearWeights[year];weightUsed+=rule.yearWeights[year];chosen.push(...pick);}if(!chosen.length)return{label:rule.label,unavailable:true,reason:'학년별 국어·영어 우수 과목의 석차등급을 입력해 주세요.'};score/=weightUsed;
      return{label:rule.label,score,maxScore:rule.maxScore,avgGrade:(chosen.reduce((a,s)=>a+s.rank,0)/chosen.length).toFixed(2),careerUsed:0,desc:`학년별 국어·영어 각 우수 1과목 점수 평균을 1·2·3학년 ${rule.yearWeights[1]*100}:${rule.yearWeights[2]*100}:${rule.yearWeights[3]*100}으로 가중`};
    }
    if(rule.formula==='hoseo2027'){
      const period=s=>s.grade<3||(s.grade===3&&s.sem===1),areas=['국어','영어','수학','사회','과학','한국사'],normal=common.filter(s=>period(s)&&areas.includes(s.area)).map(s=>({...s,convertedRank:s.rank,isCareer:false})).sort((a,b)=>a.convertedRank-b.convertedRank||credit(b)-credit(a)),commonTop=normal.slice(0,12),careerMapped=[];for(const s of career.filter(s=>period(s)&&areas.includes(s.area))){const rate=percent(s[`rate${s.achv}`]);if(rate===null)return{label:rule.label,unavailable:true,reason:'호서대 진로선택 환산에는 취득 성취도(A/B/C)에 해당하는 성취도 비율(%)을 입력해야 합니다.'};careerMapped.push({...s,convertedRank:({A:1,B:3,C:5})[s.achv]+rate/100,isCareer:true});}const careerTop=careerMapped.sort((a,b)=>a.convertedRank-b.convertedRank).slice(0,3),selected=commonTop.concat(careerTop);if(careerTop.length<3)selected.push(...normal.slice(12,12+(3-careerTop.length)));if(selected.length<15)return{label:rule.label,unavailable:true,reason:'석차등급 상위 12과목과 진로 3과목(미이수 시 일반과목 대체)을 합쳐 15과목을 입력해 주세요.'};const grade=selected.reduce((a,s)=>a+s.convertedRank,0)/15,bands=[[1.99,1000],[2.49,900],[3.49,800],[4.49,700],[5.49,600],[6.49,500],[7.49,400],[8.49,300],[8.99,200],[9,0]],base=(bands.find(x=>grade<=x[0])||bands[bands.length-1])[1],score=base*rule.factor;
      return{label:rule.label,score,maxScore:rule.maxScore,avgGrade:grade.toFixed(2),careerUsed:careerTop.length,desc:`상위 12과목 + 진로 상위 ${careerTop.length}과목(부족분 일반 대체) 평균 ${grade.toFixed(3)} → ${base}점 × ${rule.factor} · 진로 A=1+비율/100, B=3+비율/100, C=5+비율/100`};
    }
    if(rule.formula==='weightedMapped2027'){
      const period=s=>s.grade<3||(s.grade===3&&s.sem===1),mapped=subjects.filter(s=>period(s)&&rule.areas.includes(s.area)&&((isRankedType(s)&&rankOK(s))||(s.type==='career'&&achvOK(s)))).map(s=>({...s,convertedRank:s.type==='career'?rule.achievementRanks[s.achv]:s.rank,isCareer:s.type==='career'}));if(!mapped.length)return{label:rule.label,unavailable:true,reason:'반영 교과의 석차등급 또는 진로 성취도와 이수단위를 입력해 주세요.'};const units=mapped.reduce((a,s)=>a+credit(s),0),score=mapped.reduce((a,s)=>a+rule.rankPoints[s.convertedRank-1]*credit(s),0)/units,grade=mapped.reduce((a,s)=>a+s.convertedRank*credit(s),0)/units;
      return{label:rule.label,score,maxScore:rule.maxScore,avgGrade:grade.toFixed(2),careerUsed:mapped.filter(s=>s.isCareer).length,desc:`반영교과 전 과목 이수단위 가중점수 · 진로 A→${rule.achievementRanks.A}/B→${rule.achievementRanks.B}/C→${rule.achievementRanks.C}등급`};
    }
    if(rule.formula==='kyonggi2027'){
      const period=s=>s.grade<3||(s.grade===3&&s.sem===1),normal=common.filter(s=>period(s)&&!['체육','예술'].includes(s.area)),careerPicked=career.filter(s=>period(s)&&!['체육','예술'].includes(s.area));if(!normal.length)return{label:rule.label,unavailable:true,reason:'반영교과 공통·일반선택 등급과 이수단위를 입력해 주세요.'};const avg=(list,fn)=>{const units=list.reduce((a,s)=>a+credit(s),0);return units?list.reduce((a,s)=>a+fn(s)*credit(s),0)/units:null},normalScore=avg(normal,s=>rule.rankPoints[s.rank-1]),careerScore=avg(careerPicked,s=>rule.achievementPoints[s.achv]),combined=careerScore===null?normalScore:normalScore*.9+careerScore*.1,score=Math.floor(combined*90000)/100000;
      return{label:rule.label,score:Math.floor(combined*.9*1000)/1000,maxScore:rule.maxScore,avgGrade:(normal.reduce((a,s)=>a+s.rank*credit(s),0)/normal.reduce((a,s)=>a+credit(s),0)).toFixed(2),careerUsed:careerPicked.length,desc:`공통·일반 이수단위 가중 ${normalScore.toFixed(3)}${careerScore===null?' (진로 미이수로 100%)':`×90% + 진로 ${careerScore.toFixed(3)}×10%`} 후 교과 90점 적용·소수 셋째자리 이하 버림`};
    }
    if(rule.formula==='changwon2027'){
      const period=s=>s.grade<3||(s.grade===3&&s.sem===1),normal=common.filter(s=>period(s)&&((s.grade===1&&['국어','수학','영어','사회','과학'].includes(s.area))||(s.grade>=2&&rule.generalAreas.includes(s.area)))),careerTop=career.filter(s=>period(s)&&rule.generalAreas.includes(s.area)).sort((a,b)=>rule.achievementPoints[b.achv]-rule.achievementPoints[a.achv]||(a.achv==='A'?credit(b)-credit(a):credit(a)-credit(b))).slice(0,3),selected=normal.concat(careerTop);if(!selected.length)return{label:rule.label,unavailable:true,reason:'계열별 반영교과 등급 또는 진로 성취도와 이수단위를 입력해 주세요.'};const units=selected.reduce((a,s)=>a+credit(s),0),score=selected.reduce((a,s)=>a+(s.type==='career'?rule.achievementPoints[s.achv]:rule.rankPoints[s.rank-1])*credit(s),0)/units;
      return{label:rule.label,score,maxScore:rule.maxScore,avgGrade:'공식점수',careerUsed:careerTop.length,desc:`1학년 공통 5개 교과 + 2~3학년 계열별 교과 전 과목, 진로 상위 ${careerTop.length}/3과목 이수단위 가중점수`};
    }
    if(rule.formula==='shinhan2027'){
      const period=s=>s.grade<3||(s.grade===3&&s.sem===1),normal=common.filter(period).sort((a,b)=>a.rank-b.rank||credit(b)-credit(a)),selected=normal.slice(0,10).map(s=>({...s,points:[100,99,97.5,96,94.5,91.5,88.5,82,68][s.rank-1],isCareer:false}));if(normal.length<10){const need=Math.min(2,10-normal.length),careerTop=career.filter(period).sort((a,b)=>({A:99,B:96,C:82})[b.achv]-({A:99,B:96,C:82})[a.achv]).slice(0,need).map(s=>({...s,points:({A:99,B:96,C:82})[s.achv],isCareer:true}));selected.push(...careerTop);}if(selected.length<8)return{label:rule.label,unavailable:true,reason:'석차등급 과목 8~10개를 입력해 주세요(8~9개일 때 진로 최대 2과목 보충).'};const avg=selected.reduce((a,s)=>a+s.points,0)/selected.length;
      return{label:rule.label,score:avg*rule.factor,maxScore:rule.maxScore,avgGrade:'공식점수',careerUsed:selected.filter(s=>s.isCareer).length,desc:`우수 ${selected.length}과목 점수 단순평균 ${avg.toFixed(3)} × ${rule.factor} · 석차등급 8~9과목일 때만 진로 최대 2과목 보충`};
    }
    if(rule.formula==='eulji2027'){
      const selected=common.filter(s=>rule.areas.includes(s.area)&&(s.grade<3||(s.grade===3&&s.sem===1)));if(!selected.length)return{label:rule.label,unavailable:true,reason:'국어·영어·수학·사회·과학·한국사 석차등급과 이수단위를 입력해 주세요.'};const units=selected.reduce((a,s)=>a+credit(s),0),penalty=units<80?.94:1,score=selected.reduce((a,s)=>a+rule.rankPoints[s.rank-1]*penalty*credit(s),0)/units;
      return{label:rule.label,score,maxScore:rule.maxScore,avgGrade:(selected.reduce((a,s)=>a+s.rank*credit(s),0)/units).toFixed(2),careerUsed:0,desc:`반영교과 전 과목 이수단위 가중점수${units<80?` · 총 이수단위 ${units}<80으로 등급점수×0.94`:''} · 진로선택 미반영`};
    }
    if(rule.formula==='chonnam2027'){
      const period=s=>s.grade<3||(s.grade===3&&s.sem===1),normal=common.filter(s=>period(s)&&rule.areas.includes(s.area));if(!normal.length)return{label:rule.label,unavailable:true,reason:'계열별 반영교과 석차등급과 이수단위를 입력해 주세요.'};const units=normal.reduce((a,s)=>a+credit(s),0),avg=normal.reduce((a,s)=>a+rule.rankPoints[s.rank-1]*credit(s),0)/units,careerTop=career.filter(s=>period(s)&&rule.areas.includes(s.area)).sort((a,b)=>rule.achievementPoints[b.achv]-rule.achievementPoints[a.achv]).slice(0,3);if(careerTop.length<3)return{label:rule.label,unavailable:true,reason:'전남대 진로 가산점 산출에는 반영교과 진로선택 3과목이 필요합니다(3과목 미만은 대학 비교내신 적용).'};const bonus=careerTop.reduce((a,s)=>a+rule.achievementPoints[s.achv],0)*rule.careerMultiplier,score=rule.basicScore+avg*rule.multiplier+bonus;
      return{label:rule.label,score,maxScore:rule.maxScore,avgGrade:(normal.reduce((a,s)=>a+s.rank*credit(s),0)/units).toFixed(2),careerBonus:bonus,desc:`기본 ${rule.basicScore} + 공통·일반 이수단위 가중점수 ${avg.toFixed(3)}×${rule.multiplier} + 진로 상위3 합×${rule.careerMultiplier}`};
    }
    if(rule.formula==='chungang2027'){
      const period=s=>s.grade<3||(s.grade===3&&s.sem===1),normal=common.filter(s=>period(s)&&rule.areas.includes(s.area)),careerAll=career.filter(s=>period(s)&&rule.areas.includes(s.area));if(!normal.length||!careerAll.length)return{label:rule.label,unavailable:true,reason:'반영교과 공통·일반선택 등급과 진로선택 성취도를 각각 입력해 주세요(진로 1과목 이상 필수).'};const units=normal.reduce((a,s)=>a+credit(s),0),commonScore=normal.reduce((a,s)=>a+rule.rankPoints[s.rank-1]*credit(s),0)/units,careerScore=careerAll.reduce((a,s)=>a+rule.achievementPoints[s.achv],0)/careerAll.length,score=(commonScore*.9+careerScore*.1)*90;
      return{label:rule.label,score,maxScore:rule.maxScore,avgGrade:(normal.reduce((a,s)=>a+s.rank*credit(s),0)/units).toFixed(2),careerUsed:careerAll.length,desc:`공통·일반 ${commonScore.toFixed(4)}×90% + 진로 전 과목 ${careerScore.toFixed(4)}×10%, 합산 후 교과영역 90%(${rule.maxScore}점) 적용`};
    }
    if(rule.formula==='topAverage2027'){
      const period=s=>s.grade<3||(s.grade===3&&s.sem===1),pool=common.filter(s=>period(s)&&rule.areas.includes(s.area)).map(s=>({...s,points:rule.rankPoints[s.rank-1],convertedRank:s.rank,isCareer:false}));if(rule.achievementPoints)pool.push(...career.filter(s=>period(s)&&rule.areas.includes(s.area)).map(s=>({...s,points:rule.achievementPoints[s.achv],convertedRank:({A:2,B:4,C:6})[s.achv],isCareer:true})));const selected=pool.sort((a,b)=>b.points-a.points||credit(b)-credit(a)).slice(0,rule.top);const missing=Math.max(0,rule.top-selected.length);if(missing&&rule.padPoints===undefined)return{label:rule.label,unavailable:true,reason:`반영교과 상위 ${rule.top}과목을 입력해 주세요.`};const avg=(selected.reduce((a,s)=>a+s.points,0)+missing*(rule.padPoints||0))/rule.top,score=avg*(rule.scale||1);
      return{label:rule.label,score,maxScore:rule.maxScore,avgGrade:selected.length?(selected.reduce((a,s)=>a+s.convertedRank,0)/selected.length).toFixed(2):'-',careerUsed:selected.filter(s=>s.isCareer).length,desc:`반영교과 상위 ${selected.length}/${rule.top}과목 점수 평균${missing?`(부족 ${missing}과목 0점)`:''} × ${rule.scale||1}${rule.careerMode==='exclude'?' · 진로선택 미반영':''}`};
    }
    if(rule.formula==='sehan2027'){
      const period=s=>s.grade<3||(s.grade===3&&s.sem===1),mapped=subjects.filter(s=>period(s)&&['국어','영어','수학','사회','과학'].includes(s.area)&&((isRankedType(s)&&rankOK(s))||(s.type==='career'&&achvOK(s)))).map(s=>({...s,convertedRank:s.type==='career'?({A:3,B:5,C:7})[s.achv]:s.rank,isCareer:s.type==='career'})),first=mapped.filter(s=>s.grade===1).sort((a,b)=>a.convertedRank-b.convertedRank).slice(0,4),upper=mapped.filter(s=>s.grade>=2).sort((a,b)=>a.convertedRank-b.convertedRank).slice(0,6);if(first.length<4||upper.length<6)return{label:rule.label,unavailable:true,reason:'1학년 우수 4과목과 2~3학년 1학기 우수 6과목을 입력해 주세요.'};const firstPoints=first.reduce((a,s)=>a+rule.rankPoints[s.convertedRank-1],0)/4,upperPoints=upper.reduce((a,s)=>a+rule.rankPoints[s.convertedRank-1],0)/6,score=firstPoints*.4+upperPoints*.6,grade=(first.reduce((a,s)=>a+s.convertedRank,0)/4)*.4+(upper.reduce((a,s)=>a+s.convertedRank,0)/6)*.6;
      return{label:rule.label,score,maxScore:rule.maxScore,avgGrade:grade.toFixed(2),careerUsed:first.concat(upper).filter(s=>s.isCareer).length,desc:`1학년 우수4과목 점수평균 ${firstPoints.toFixed(2)}×40% + 2~3학년 우수6과목 ${upperPoints.toFixed(2)}×60% · 진로 A→3/B→5/C→7`};
    }
    if(rule.formula==='hongik2027'){
      const period=s=>s.grade<3||(s.grade===3&&s.sem===1),normal=common.filter(s=>period(s)&&rule.areas.includes(s.area));if(!normal.length)return{label:rule.label,unavailable:true,reason:'계열별 반영교과 공통·일반선택 등급과 이수단위를 입력해 주세요.'};const units=normal.reduce((a,s)=>a+credit(s),0),commonScore=normal.reduce((a,s)=>a+rule.rankPoints[s.rank-1]*credit(s),0)/units,careerAll=career.filter(s=>period(s)&&rule.areas.includes(s.area)),careerUnits=careerAll.reduce((a,s)=>a+credit(s),0),careerScore=careerUnits?careerAll.reduce((a,s)=>a+rule.achievementPoints[s.achv]*credit(s),0)/careerUnits:commonScore*.09,score=commonScore*.9+careerScore;
      return{label:rule.label,score,maxScore:rule.maxScore,avgGrade:(normal.reduce((a,s)=>a+s.rank*credit(s),0)/units).toFixed(2),careerUsed:careerAll.length,desc:`공통·일반 전 과목 이수단위 가중점수 ${commonScore.toFixed(3)}×90% + ${careerUnits?`진로 전 과목 ${careerScore.toFixed(3)}`:`진로 미이수 대체점수(공통점수×0.09) ${careerScore.toFixed(3)}`}`};
    }
    if(rule.formula==='flower2027'){
      const period=s=>s.grade<3||(s.grade===3&&s.sem===1),areas=['국어','영어','수학','한국사','사회','과학'],mapped=subjects.filter(s=>period(s)&&areas.includes(s.area)&&((isRankedType(s)&&rankOK(s))||(s.type==='career'&&achvOK(s)))).map(s=>({...s,convertedRank:s.type==='career'?({A:2,B:4,C:6})[s.achv]:s.rank,isCareer:s.type==='career'})),points=[10,9,8,7,6,5,4,3,1];let selected=[],raw=0;
      if(rule.mode==='nursing'){for(const year of [1,2,3]){const list=mapped.filter(s=>s.grade===year).sort((a,b)=>a.convertedRank-b.convertedRank||credit(b)-credit(a)).slice(0,3);while(list.length<3)list.push({convertedRank:9,credit:2,isCareer:false,name:'부족과목'});const units=list.reduce((a,s)=>a+credit(s),0),avg=list.reduce((a,s)=>a+points[s.convertedRank-1]*credit(s),0)/units;raw+=avg*(year===1?20:15);selected.push(...list);}}else{selected=mapped.sort((a,b)=>a.convertedRank-b.convertedRank||credit(b)-credit(a)).slice(0,8);while(selected.length<8)selected.push({convertedRank:9,credit:1,isCareer:false,name:'부족과목'});const units=selected.reduce((a,s)=>a+credit(s),0);raw=selected.reduce((a,s)=>a+points[s.convertedRank-1]*credit(s),0)/units*50;}
      const units=selected.reduce((a,s)=>a+credit(s),0),unitRatio=Math.min(1,units/27),score=raw*unitRatio*rule.factor;
      return{label:rule.label,score,maxScore:rule.maxScore,avgGrade:(selected.reduce((a,s)=>a+s.convertedRank*credit(s),0)/units).toFixed(2),careerUsed:selected.filter(s=>s.isCareer).length,desc:`${rule.mode==='nursing'?'학년별 상위3(40:30:30)':'전학년 상위8'} · 부족과목 9등급 보충 · 이수단위비율 min(1, ${units}/27) × 교과비율 ${rule.factor}`};
    }
    if(rule.formula==='konyang2027'){
      const selected=common.filter(s=>rule.areas.includes(s.area)&&(s.grade<3||(s.grade===3&&s.sem===1))).sort((a,b)=>a.rank-b.rank||credit(b)-credit(a)).slice(0,rule.top);if(selected.length<rule.top)return{label:rule.label,unavailable:true,reason:`반영교과 최고등급 ${rule.top}과목을 입력해 주세요.`};const units=selected.reduce((a,s)=>a+credit(s),0),score=selected.reduce((a,s)=>a+rule.rankPoints[s.rank-1]*credit(s),0)/units,grade=selected.reduce((a,s)=>a+s.rank*credit(s),0)/units;
      return{label:rule.label,score,maxScore:rule.maxScore,avgGrade:grade.toFixed(2),careerUsed:0,desc:`국·수·영·탐구 최고 ${rule.top}과목 이수단위 가중점수 · 진로선택 미반영`};
    }
    if(rule.formula==='donggukWise2027'){
      const period=s=>s.grade<3||(s.grade===3&&s.sem===1),rankPoints=[100,99,98,96,90,85,75,60,0],achievementPoints={A:100,B:98,C:96},normal=common.filter(s=>period(s)&&rule.areas.includes(s.area)).map(s=>({...s,points:rankPoints[s.rank-1],isCareer:false})),careerMapped=career.filter(s=>period(s)&&rule.areas.includes(s.area)).map(s=>({...s,points:achievementPoints[s.achv],isCareer:true}));let selected=[];
      if(rule.mode==='top10'){const c=careerMapped.sort((a,b)=>b.points-a.points||credit(b)-credit(a)).slice(0,2);selected=normal.sort((a,b)=>b.points-a.points||credit(b)-credit(a)).slice(0,10-c.length).concat(c);if(selected.length<10||c.length<2)return{label:rule.label,unavailable:true,reason:'학교생활우수자·면접전형은 공통·일반 8과목과 진로선택 2과목을 입력해 주세요.'};}else if(rule.mode==='arts')selected=normal.sort((a,b)=>b.points-a.points||credit(b)-credit(a)).slice(0,6);else selected=normal.concat(careerMapped);
      if(!selected.length)return{label:rule.label,unavailable:true,reason:'계열별 반영교과 성적과 이수단위를 입력해 주세요.'};const units=selected.reduce((a,s)=>a+credit(s),0),base=selected.reduce((a,s)=>a+s.points*credit(s),0)/units;let bonus=0;if(rule.mode==='medicine'){for(const key of ['생명과학Ⅱ','화학Ⅱ'])if(selected.some(s=>(s.name||'').replace(/\s/g,'').includes(key)))bonus+=base*.05;}const score=base+bonus;
      return{label:rule.label,score,maxScore:rule.maxScore,avgGrade:'공식점수',careerUsed:selected.filter(s=>s.isCareer).length,careerBonus:bonus,desc:`${rule.mode==='all'||rule.mode==='medicine'?'반영교과 전 과목':rule.mode==='arts'?'국어·영어 상위6':'공통·일반8+진로2'} 이수단위 가중점수${bonus?` + 생명과학Ⅱ/화학Ⅱ 가산 ${bonus.toFixed(3)}`:''}`};
    }
    if(rule.formula==='dongsin2027'){
      const period=s=>s.grade<3||(s.grade===3&&s.sem===1),areas=['국어','수학','영어','과학','사회','한국사'],normal=common.filter(s=>period(s)&&areas.includes(s.area));if(!normal.length)return{label:rule.label,unavailable:true,reason:'반영교과 전 과목 석차등급과 이수단위를 입력해 주세요.'};const table=[100,93.75,87.5,81.25,75,68.75,62.5,56.25,50],units=normal.reduce((a,s)=>a+credit(s),0),avg=normal.reduce((a,s)=>a+table[s.rank-1]*credit(s),0)/units,unitBonus=units>=70?rule.unitBonus:0,careerTop=career.filter(s=>period(s)&&areas.includes(s.area)).sort((a,b)=>({A:10,B:6,C:2})[b.achv]-({A:10,B:6,C:2})[a.achv]).slice(0,1),careerBonus=careerTop.length?({A:10,B:6,C:2})[careerTop[0].achv]:0,score=avg*rule.subjectFactor+unitBonus+careerBonus;
      return{label:rule.label,score,maxScore:rule.maxScore,avgGrade:(normal.reduce((a,s)=>a+s.rank*credit(s),0)/units).toFixed(2),careerBonus:unitBonus+careerBonus,desc:`교과 이수단위 가중점수 ${avg.toFixed(3)}×${rule.subjectFactor} + 이수단위 가산 ${unitBonus} + 진로 상위1 가산 ${careerBonus}`};
    }
    if(rule.formula==='seoulTheology2027'){
      const period=s=>s.grade<3||(s.grade===3&&s.sem===1),table=[100,95,90,85,80,75,70,60,50],groups=[['국어','수학'],['영어'],['사회','과학']],selected=groups.flatMap(g=>common.filter(s=>period(s)&&g.includes(s.area)).sort((a,b)=>a.rank-b.rank||credit(b)-credit(a)).slice(0,3));if(selected.length<9)return{label:rule.label,unavailable:true,reason:'국어/수학 3과목, 영어 3과목, 사회/과학 3과목을 입력해 주세요.'};const percentile=selected.reduce((a,s)=>a+table[s.rank-1],0)/9,score=percentile*rule.factor;
      return{label:rule.label,score,maxScore:rule.maxScore,avgGrade:(selected.reduce((a,s)=>a+s.rank,0)/9).toFixed(2),careerUsed:0,desc:`3개 교과군별 상위3과목(총9) 백분위점수 평균 ${percentile.toFixed(3)} × 전형비율 계수 ${rule.factor} · 진로 미반영`};
    }
    if(rule.formula==='koreatech2027'){
      const period=s=>s.grade<3||(s.grade===3&&s.sem===1),normal=common.filter(s=>period(s)&&rule.areas.includes(s.area));if(!normal.length)return{label:rule.label,unavailable:true,reason:'계열별 반영교과 전 과목 석차등급과 이수단위를 입력해 주세요.'};const table=[100,99,98,95.5,93,90.5,61.5,32.5,3.5],units=normal.reduce((a,s)=>a+credit(s),0),base=normal.reduce((a,s)=>a+table[s.rank-1]*credit(s),0)/units,careerTop=career.filter(s=>period(s)&&!['체육','예술'].includes(s.area)).map(s=>({s,point:({A:3,B:2,C:1})[s.achv]})).sort((a,b)=>b.point-a.point).slice(0,3);while(careerTop.length<3)careerTop.push({point:0});const rate=careerTop.reduce((a,x)=>a+x.point,0)/3/100,bonus=base*rate,score=base+bonus;
      return{label:rule.label,score,maxScore:rule.maxScore,avgGrade:(normal.reduce((a,s)=>a+s.rank*credit(s),0)/units).toFixed(2),careerBonus:bonus,desc:`공통·일반 이수단위 가중점수 ${base.toFixed(3)} + 진로 상위3 평균가점률 ${(rate*100).toFixed(2)}% (${bonus.toFixed(3)}점)`};
    }
    if(rule.formula==='kau2027'){
      const period=s=>s.grade<3||(s.grade===3&&s.sem===1),table=[100,99,98,97,96,95,94,88,80],areaAverages=[];for(const group of rule.areaGroups){const top=common.filter(s=>period(s)&&group.includes(s.area)).sort((a,b)=>a.rank-b.rank||credit(b)-credit(a)).slice(0,5);if(!top.length)return{label:rule.label,unavailable:true,reason:`반영교과군(${group.join('/')}) 과목을 입력해 주세요.`};areaAverages.push(top.reduce((a,s)=>a+table[s.rank-1],0)/top.length);}const base=areaAverages.reduce((a,v)=>a+v*.25,0)*10,careerTop=career.filter(s=>period(s)&&rule.areaGroups.flat().includes(s.area)).map(s=>({s,point:({A:2,B:1.5,C:1})[s.achv]})).sort((a,b)=>b.point-a.point).slice(0,3),bonus=careerTop.reduce((a,x)=>a+x.point,0),score=base+bonus;
      return{label:rule.label,score,maxScore:rule.maxScore,avgGrade:'교과별 평균',careerBonus:bonus,desc:`4개 반영교과군별 상위5과목 환산평균×25%의 합×10 = ${base.toFixed(1)} + 진로 최대3과목 가산 ${bonus.toFixed(1)}`};
    }
    if(rule.formula==='mokpo2027'){
      const period=s=>s.grade<3||(s.grade===3&&s.sem===1),baseAreas=['국어','영어','수학'],areaGrade=area=>{const l=common.filter(s=>period(s)&&s.area===area),u=l.reduce((a,s)=>a+credit(s),0);return u?l.reduce((a,s)=>a+s.rank*credit(s),0)/u:null},social=areaGrade('사회'),science=areaGrade('과학'),choice=social===null?'과학':science===null?'사회':social<=science?'사회':'과학',selected=common.filter(s=>period(s)&&(baseAreas.includes(s.area)||s.area===choice));if(!selected.length)return{label:rule.label,unavailable:true,reason:'필수 국어·영어·수학과 선택 사회 또는 과학 교과 성적을 입력해 주세요.'};const units=selected.reduce((a,s)=>a+credit(s),0),grade=selected.reduce((a,s)=>a+s.rank*credit(s),0)/units,base=809+(9-grade)/8*91,careerScores=career.filter(s=>period(s)).map(s=>({A:5,B:4,C:3})[s.achv]).sort((a,b)=>b-a).slice(0,3);const bonus=careerScores.length?careerScores.reduce((a,v)=>a+v,0)/careerScores.length:0,score=base+bonus;
      return{label:rule.label,score,maxScore:rule.maxScore,avgGrade:grade.toFixed(2),careerBonus:bonus,desc:`필수 국·영·수 + ${choice}(사/과 중 우수교과) 전 과목 이수단위 가중등급 ${grade.toFixed(3)} → 809+{(9−등급)/8}×91 + 진로 상위3 평균 ${bonus.toFixed(2)}`};
    }
    if(rule.formula==='seoultech2027'){
      const period=s=>s.grade<3||(s.grade===3&&s.sem===1),table=[1000,990,980,970,960,800,500,250,0],normal=common.filter(s=>period(s)&&rule.areas.includes(s.area)).map(s=>({...s,convertedRank:s.rank,isCareer:false})),careerTop=career.filter(s=>period(s)&&rule.areas.includes(s.area)).map(s=>({...s,convertedRank:({A:1,B:3,C:6})[s.achv],isCareer:true})).sort((a,b)=>a.convertedRank-b.convertedRank||credit(b)-credit(a)).slice(0,3),selected=normal.concat(careerTop);if(!selected.length)return{label:rule.label,unavailable:true,reason:'계열별 반영교과 성적과 이수단위를 입력해 주세요.'};const units=selected.reduce((a,s)=>a+credit(s),0),score=selected.reduce((a,s)=>a+table[s.convertedRank-1]*credit(s),0)/units;
      return{label:rule.label,score,maxScore:rule.maxScore,avgGrade:(selected.reduce((a,s)=>a+s.convertedRank*credit(s),0)/units).toFixed(2),careerUsed:careerTop.length,desc:`반영교과 공통·일반 전 과목 + 진로 상위3과목 이수단위 가중점수 · 진로 A→1/B→3/C→6등급`};
    }
    if(rule.formula==='sungshin2027'){
      const period=s=>s.grade<3||(s.grade===3&&s.sem===1),table=[100,99,98,96,95,92,90,70,50],normal=common.filter(s=>period(s)&&rule.areas.includes(s.area)).map(s=>({...s,convertedRank:s.rank,isCareer:false})),careerTop=career.filter(s=>period(s)&&rule.areas.includes(s.area)).map(s=>({...s,convertedRank:({A:1,B:2,C:4})[s.achv],isCareer:true})).sort((a,b)=>a.convertedRank-b.convertedRank||credit(b)-credit(a)).slice(0,4),selected=normal.concat(careerTop);if(!selected.length)return{label:rule.label,unavailable:true,reason:'계열별 지정교과 전 과목 성적과 이수단위를 입력해 주세요.'};const units=selected.reduce((a,s)=>a+credit(s),0),average=selected.reduce((a,s)=>a+table[s.convertedRank-1]*credit(s),0)/units,score=average*.2+70;
      return{label:rule.label,score,maxScore:rule.maxScore,avgGrade:(selected.reduce((a,s)=>a+s.convertedRank*credit(s),0)/units).toFixed(2),careerUsed:careerTop.length,desc:`지정교과 전 과목(진로 상위4) 이수단위 가중 환산평균 ${average.toFixed(3)}×0.2 + 기본점수70`};
    }
    if(rule.formula==='sookmyung2027'){
      const period=s=>s.grade<3||(s.grade===3&&s.sem===1),normal=common.filter(s=>period(s)&&rule.areas.includes(s.area)),careerAll=career.filter(s=>period(s)&&rule.areas.includes(s.area)).map(s=>({...s,convertedRank:({A:1,B:3,C:5})[s.achv]}));if(!normal.length)return{label:rule.label,unavailable:true,reason:'반영교과 석차등급과 이수단위를 입력해 주세요.'};const avgGrade=list=>{const u=list.reduce((a,s)=>a+credit(s),0);return list.reduce((a,s)=>a+(s.convertedRank||s.rank)*credit(s),0)/u},commonGrade=avgGrade(normal),careerGrade=careerAll.length?avgGrade(careerAll):null,grade=careerGrade===null?commonGrade:commonGrade*.8+careerGrade*.2;
      const score=(9-grade)/8*100;
      return{label:rule.label,score,maxScore:'비교지수 100',avgGrade:grade.toFixed(3),careerUsed:careerAll.length,desc:`공통·일반 이수단위 가중등급 ${commonGrade.toFixed(3)}${careerGrade===null?' 100%':`×80% + 진로 ${careerGrade.toFixed(3)}×20%`} · 진로 A→1/B→3/C→5 · 공식 환산석차등급을 100점 비교지수로 병기`};
    }
    if(rule.formula==='inha2027'){
      const period=s=>s.grade<3||(s.grade===3&&s.sem===1),table=[10,9.8,9.6,9.4,9,8,4,2,0],normal=common.filter(s=>period(s)&&rule.areas.includes(s.area)).map(s=>({...s,convertedRank:s.rank,isCareer:false})),careerTop=career.filter(s=>period(s)&&rule.areas.includes(s.area)).map(s=>({...s,convertedRank:({A:1,B:2,C:4})[s.achv],isCareer:true})).sort((a,b)=>a.convertedRank-b.convertedRank||credit(b)-credit(a)).slice(0,3),selected=normal.concat(careerTop);if(!selected.length)return{label:rule.label,unavailable:true,reason:'계열별 반영교과 성적과 이수단위를 입력해 주세요.'};const units=selected.reduce((a,s)=>a+credit(s),0),base=selected.reduce((a,s)=>a+table[s.convertedRank-1]*credit(s),0)/units,score=base*10;
      return{label:rule.label,score,maxScore:rule.maxScore,avgGrade:(selected.reduce((a,s)=>a+s.convertedRank*credit(s),0)/units).toFixed(2),careerUsed:careerTop.length,desc:`반영교과 전 과목 + 진로 상위3 이수단위 가중점수 ${base.toFixed(3)}×10 · 진로 A→1/B→2/C→4`};
    }
    if(rule.formula==='cnu2027'){
      const period=s=>s.grade<3||(s.grade===3&&s.sem===1),areas=['국어','수학','영어','한국사','사회','과학','기술·가정','제2외국어','한문'],mapped=common.filter(s=>period(s)&&areas.includes(s.area)).map(s=>({...s,convertedRank:s.rank,isCareer:false}));for(const s of career.filter(s=>period(s)&&areas.includes(s.area))){let r=1;if(s.achv!=='A'){const pct=s.achv==='B'?(percent(s.rateB)!==null&&percent(s.rateC)!==null?s.rateB+s.rateC:null):percent(s.rateC);if(pct===null)return{label:rule.label,unavailable:true,reason:'충남대 진로선택 B/C 환산에는 성취도별 학생 분포비율을 입력해야 합니다.'};r=[4,11,23,40,60,77,89,96,100].findIndex(v=>pct<=v)+1;}mapped.push({...s,convertedRank:r,isCareer:true});}if(!mapped.length)return{label:rule.label,unavailable:true,reason:'반영교과 등급 또는 진로 성취도·분포비율과 이수단위를 입력해 주세요.'};const units=mapped.reduce((a,s)=>a+credit(s),0),score=mapped.reduce((a,s)=>a+rule.rankPoints[s.convertedRank-1]*credit(s),0)/units;
      return{label:rule.label,score,maxScore:rule.maxScore,avgGrade:(mapped.reduce((a,s)=>a+s.convertedRank*credit(s),0)/units).toFixed(2),careerUsed:mapped.filter(s=>s.isCareer).length,desc:`반영교과 전 과목 이수단위 가중점수 · 진로 A=1등급, B는 B+C 누적비율, C는 C비율을 9등급 누적비율로 환산`};
    }
    if(rule.formula==='hallym2027'){
      const period=s=>s.grade<3||(s.grade===3&&s.sem===1),areaAvg=area=>{const l=common.filter(s=>period(s)&&s.area===area),u=l.reduce((a,s)=>a+credit(s),0);return u?l.reduce((a,s)=>a+s.rank*credit(s),0)/u:null},vals={국어:areaAvg('국어'),영어:areaAvg('영어'),수학:areaAvg('수학'),사회:areaAvg('사회'),과학:areaAvg('과학')},explore=vals.사회===null?vals.과학:vals.과학===null?vals.사회:Math.min(vals.사회,vals.과학);let grade;
      if(rule.mode==='nursing'){if([vals.국어,vals.영어,vals.수학,explore].some(v=>v===null))return{label:rule.label,unavailable:true,reason:'간호학과 국어·영어·수학·사회/과학 교과 성적을 입력해 주세요.'};grade=vals.국어*.2+vals.영어*.2+vals.수학*.4+explore*.2;}else if(rule.mode==='global'){const others=[vals.국어,vals.수학,explore].filter(v=>v!==null).sort((a,b)=>a-b).slice(0,2);if(vals.영어===null||others.length<2)return{label:rule.label,unavailable:true,reason:'글로벌학부 영어와 국어·수학·사회/과학 중 2개 교과 성적을 입력해 주세요.'};grade=vals.영어*.5+others[0]*.25+others[1]*.25;}else{const four=[vals.국어,vals.영어,vals.수학,explore].filter(v=>v!==null).sort((a,b)=>a-b).slice(0,3);if(four.length<3)return{label:rule.label,unavailable:true,reason:'국어·영어·수학·사회/과학 중 3개 교과 성적을 입력해 주세요.'};grade=four.reduce((a,v)=>a+v,0)/3;}const commonScore=1012.5-112.5*grade,careerScores=career.filter(period).map(s=>({A:10,B:8,C:4})[s.achv]).sort((a,b)=>b-a).slice(0,3);while(careerScores.length<3)careerScores.push(0);const bonus=careerScores.reduce((a,v)=>a+v,0)/3,score=commonScore+bonus;
      return{label:rule.label,score,maxScore:rule.maxScore,avgGrade:grade.toFixed(2),careerBonus:bonus,desc:`모집단위별 교과평균 ${grade.toFixed(3)} → 1,012.5−112.5×등급 = ${commonScore.toFixed(3)} + 진로 상위3 평균 ${bonus.toFixed(2)}`};
    }
    if(rule.formula==='geumgang2027'){
      const period=s=>s.grade<3||(s.grade===3&&s.sem===1),selected=common.filter(s=>period(s));
      if(!selected.length)return{label:rule.label,unavailable:true,reason:'석차등급이 기재된 과목과 이수단위를 입력해 주세요.'};
      const units=selected.reduce((a,s)=>a+credit(s),0),score=selected.reduce((a,s)=>a+rule.rankPoints[s.rank-1]*credit(s),0)/units,grade=selected.reduce((a,s)=>a+s.rank*credit(s),0)/units;
      return{label:rule.label,score,maxScore:rule.maxScore,avgGrade:grade.toFixed(2),careerUsed:0,desc:`석차등급 기재 전 과목 ${selected.length}개를 이수단위로 가중평균 · 진로선택 성취도 과목은 공식 세부 산출방법상 미반영`};
    }
    if(rule.formula==='djcatholic2027'){
      const period=s=>s.grade<3||(s.grade===3&&s.sem===1),sort=(a,b)=>a.rank-b.rank||credit(b)-credit(a),core=common.filter(s=>period(s)&&['국어','수학','영어'].includes(s.area)).sort(sort).slice(0,8),other=common.filter(s=>period(s)&&['사회','한국사','과학'].includes(s.area)).sort(sort).slice(0,4),normal=core.concat(other),careerTop=career.filter(s=>period(s)&&['국어','수학','영어','사회','과학'].includes(s.area)).map(s=>({s,points:rule.achievementPoints[s.achv]})).sort((a,b)=>b.points-a.points).slice(0,3);
      if(!normal.length&&!careerTop.length)return{label:rule.label,unavailable:true,reason:'반영 교과의 석차등급 또는 진로선택 성취도를 입력해 주세요.'};
      const normalScored=normal.map(s=>{const adjusted=(s.rank>=6&&Number.isFinite(Number(s.originalScore))&&Number(s.originalScore)>=70)?5:s.rank;return{...s,adjusted,points:rule.rankPoints[adjusted-1]};}),allPoints=normalScored.map(x=>x.points).concat(careerTop.map(x=>x.points)),score=allPoints.reduce((a,v)=>a+v,0)/allPoints.length;
      return{label:rule.label,score,maxScore:rule.maxScore,avgGrade:normalScored.length?(normalScored.reduce((a,s)=>a+s.adjusted,0)/normalScored.length).toFixed(2):'-',careerUsed:careerTop.length,desc:`국·수·영 상위 ${core.length}/8 + 사·한국사·과 상위 ${other.length}/4 + 진로 상위 ${careerTop.length}/3 점수평균 · 6~9등급 중 원점수 70점 이상은 5등급 점수 적용`};
    }
    if(rule.formula==='daejeonTheology2027'){
      const period=s=>s.grade<3||(s.grade===3&&s.sem===1),picked={};for(const grade of [1,2,3])picked[grade]=common.filter(s=>period(s)&&s.grade===grade&&['국어','영어','사회'].includes(s.area)).sort((a,b)=>a.rank-b.rank||credit(b)-credit(a)).slice(0,3);
      if([1,2,3].some(g=>!picked[g].length))return{label:rule.label,unavailable:true,reason:'1·2·3학년 국어·영어·사회 반영 과목을 입력해 주세요.'};
      const avg=(list,key)=>list.reduce((a,s)=>a+(key==='rank'?s.rank:rule.rankPoints[s.rank-1]),0)/list.length,score=[1,2,3].reduce((a,g)=>a+avg(picked[g],'points')*rule.yearWeights[g],0),grade=[1,2,3].reduce((a,g)=>a+avg(picked[g],'rank')*rule.yearWeights[g],0);
      return{label:rule.label,score,maxScore:rule.maxScore,avgGrade:grade.toFixed(2),careerUsed:0,desc:`학년별 국어·영어·사회 상위3과목 단순평균 × 학년비율 ${Object.values(rule.yearWeights).map(v=>v*100).join('·')}% · 진로 미반영`};
    }
    if(rule.formula==='shyu2027'){
      const period=s=>s.grade<3||(s.grade===3&&s.sem===1),yearScore={},yearGrade={};for(const grade of [1,2,3]){const list=common.filter(s=>period(s)&&s.grade===grade&&rule.areas.includes(s.area)),units=list.reduce((a,s)=>a+credit(s),0);if(!units)return{label:rule.label,unavailable:true,reason:'1·2·3학년 반영교과 성적과 이수단위를 모두 입력해 주세요.'};yearScore[grade]=list.reduce((a,s)=>a+rule.rankPoints[s.rank-1]*credit(s),0)/units;yearGrade[grade]=list.reduce((a,s)=>a+s.rank*credit(s),0)/units;}
      const raw=[1,2,3].reduce((a,g)=>a+yearScore[g]*rule.yearWeights[g],0),score=raw*.8,grade=[1,2,3].reduce((a,g)=>a+yearGrade[g]*rule.yearWeights[g],0);
      return{label:rule.label,score,maxScore:rule.maxScore,avgGrade:grade.toFixed(2),careerUsed:0,desc:`학년별 이수단위 가중점수 ${yearScore[1].toFixed(2)}·${yearScore[2].toFixed(2)}·${yearScore[3].toFixed(2)}를 20%·30%·50% 합산 후 교과비율 80% 적용 · 진로 미반영`};
    }
    if(rule.formula==='acts2027'){
      const period=s=>s.grade<3||(s.grade===3&&s.sem===1),yearAvg={};for(const grade of [1,2,3]){const list=common.filter(s=>period(s)&&s.grade===grade&&rule.areas.includes(s.area));if(!list.length)return{label:rule.label,unavailable:true,reason:'1·2·3학년 국어·영어·사회 과목의 석차등급을 입력해 주세요.'};yearAvg[grade]=list.reduce((a,s)=>a+s.rank,0)/list.length;}
      const band=g=>Math.max(1,Math.min(9,Math.floor(g))),score=[1,2,3].reduce((a,g)=>a+rule.rankPoints[band(yearAvg[g])-1]*rule.yearWeights[g],0),grade=[1,2,3].reduce((a,g)=>a+yearAvg[g]*rule.yearWeights[g],0);
      return{label:rule.label,score,maxScore:rule.maxScore,avgGrade:grade.toFixed(2),careerUsed:0,desc:`국어·영어·사회 전 과목 학년별 단순평균을 등급구간으로 환산 후 30%·30%·40% 적용 · 진로 미반영`};
    }
    if(rule.formula==='jesus2027'){
      const period=s=>s.grade<3||(s.grade===3&&s.sem===1),selected=common.filter(s=>period(s)&&rule.areas.includes(s.area));if(!selected.length)return{label:rule.label,unavailable:true,reason:'국어·영어·수학·사회·과학 석차등급 과목을 입력해 주세요.'};const avgPoints=selected.reduce((a,s)=>a+rule.rankPoints[s.rank-1],0)/selected.length,score=rule.basicScore+60*avgPoints/9.8,grade=selected.reduce((a,s)=>a+s.rank,0)/selected.length;
      return{label:rule.label,score,maxScore:rule.maxScore,avgGrade:grade.toFixed(2),careerUsed:0,desc:`국·영·수·사·과 석차등급 과목 평균점수 ${avgPoints.toFixed(4)}를 ${rule.basicScore}+60×평균/9.8로 환산 · 진로 미반영`};
    }
    if(rule.formula==='mtu2027'){
      const period=s=>s.grade<3||(s.grade===3&&s.sem===1),selected=common.filter(s=>period(s)&&['국어','영어',rule.choiceArea].includes(s.area));if(!selected.length)return{label:rule.label,unavailable:true,reason:`국어·영어·${rule.choiceArea} 교과 석차등급을 입력해 주세요.`};const grade=selected.reduce((a,s)=>a+s.rank,0)/selected.length,score=360+(9-grade)/8*360;
      return{label:rule.label,score,maxScore:rule.maxScore,avgGrade:grade.toFixed(2),careerUsed:0,desc:`국어·영어·${rule.choiceArea} 전 과목 단순 평균등급 ${grade.toFixed(3)} → 360+{(9−평균)/8}×360 · 진로 미반영`};
    }
    if(rule.formula==='gimcheon2027'){
      const period=s=>s.grade<3||(s.grade===3&&s.sem===1),rankPoints=[100,98,96,94,92,90,86,80,70],toNormal=s=>({...s,isCareer:false,convertedRank:s.rank,points:rankPoints[s.rank-1]}),toCareer=s=>({...s,isCareer:true,convertedRank:({A:1,B:3,C:5})[s.achv],points:({A:100,B:96,C:92})[s.achv]}),bestGroup=areas=>{const normal=common.filter(s=>period(s)&&areas.includes(s.area)).map(toNormal),careerBest=career.filter(s=>period(s)&&areas.includes(s.area)).map(toCareer).sort((a,b)=>b.points-a.points||credit(b)-credit(a)).slice(0,1);return normal.concat(careerBest).sort((a,b)=>b.points-a.points||credit(b)-credit(a)).slice(0,2);},core=['국어','영어','수학'].flatMap(area=>bestGroup([area])),social=bestGroup(['사회']),science=bestGroup(['과학']),weighted=list=>{const units=list.reduce((a,s)=>a+credit(s),0);return units?list.reduce((a,s)=>a+s.points*credit(s),0)/units:-1},explore=weighted(social)>=weighted(science)?social:science,selected=core.concat(explore);
      if(!selected.length)return{label:rule.label,unavailable:true,reason:'국어·영어·수학·사회/과학 교과의 석차등급 또는 진로 성취도를 입력해 주세요.'};const units=selected.reduce((a,s)=>a+credit(s),0),average=selected.reduce((a,s)=>a+s.points*credit(s),0)/units,score=average*10*rule.factor,careerUsed=selected.filter(s=>s.isCareer).length;
      return{label:rule.label,score,maxScore:rule.maxScore,avgGrade:(selected.reduce((a,s)=>a+s.convertedRank*credit(s),0)/units).toFixed(2),careerUsed,desc:`국·영·수 각 상위2 + ${explore===social?'사회':'과학'} 상위2 이수단위 가중점수 ${average.toFixed(3)}×10×${rule.factor} · 진로 ${careerUsed}과목이 교과별 일반과목을 대체(A→1/B→3/C→5, 최대4)`};
    }
    if(rule.formula==='scu2027'){
      const period=s=>s.grade<3||(s.grade===3&&s.sem===1),years={};for(const grade of [1,2,3])years[grade]=common.filter(s=>period(s)&&s.grade===grade&&(grade===1||['국어','영어'].includes(s.area)));if([1,2,3].some(g=>!years[g].length))return{label:rule.label,unavailable:true,reason:'1학년 석차등급 전 교과와 2·3학년 국어·영어 과목을 입력해 주세요.'};const avg=(list,key)=>list.reduce((a,s)=>a+(key==='rank'?s.rank:rule.rankPoints[s.rank-1]),0)/list.length,score=avg(years[1])*.3+avg(years[2])*.3+avg(years[3])*.4,grade=avg(years[1],'rank')*.3+avg(years[2],'rank')*.3+avg(years[3],'rank')*.4;
      return{label:rule.label,score:Math.round(score*10)/10,maxScore:rule.maxScore,avgGrade:grade.toFixed(2),careerUsed:0,desc:`1학년 전 교과 30% + 2학년 국어·영어 30% + 3학년 국어·영어 40% (학년별 단순평균, 소수 둘째자리 반올림) · 진로 미반영`};
    }
    if(rule.formula==='cku2027'){
      const period=s=>s.grade<3||(s.grade===3&&s.sem===1),pool=common.filter(s=>period(s)&&rule.areas.includes(s.area)).map(s=>({...s,convertedRank:s.rank,isCareer:false})).concat(career.filter(s=>period(s)&&rule.areas.includes(s.area)).map(s=>({...s,convertedRank:({A:1,B:2,C:4})[s.achv],isCareer:true}))),selected=rule.mode==='all'?pool:[1,2,3].flatMap(g=>pool.filter(s=>s.grade===g).sort((a,b)=>a.convertedRank-b.convertedRank||credit(b)-credit(a)).slice(0,2));if(!selected.length)return{label:rule.label,unavailable:true,reason:'반영교과 석차등급 또는 진로 성취도와 이수단위를 입력해 주세요.'};const units=selected.reduce((a,s)=>a+credit(s),0),grade=selected.reduce((a,s)=>a+s.convertedRank*credit(s),0)/units,score=rule.baseScore+(9-grade)/8*rule.range,careerUsed=selected.filter(s=>s.isCareer).length;
      return{label:rule.label,score,maxScore:rule.maxScore,avgGrade:grade.toFixed(2),careerUsed,desc:`${rule.mode==='all'?'지정교과 전 과목':'학년별 우수2과목'} 이수단위 가중등급 ${grade.toFixed(3)} → ${rule.baseScore}+{(9−등급)/8}×${rule.range} · 진로 A→1/B→2/C→4`};
    }
    if(rule.formula==='kangwon2027'){
      const period=s=>s.grade<3||(s.grade===3&&s.sem===1),table=rule.rankPoints,normalPool=common.filter(s=>period(s)&&rule.areas.includes(s.area)),normal=[];if(rule.topPerArea){for(const area of rule.areas){const picked=normalPool.filter(s=>s.area===area).sort((a,b)=>a.rank-b.rank||credit(b)-credit(a)).slice(0,rule.topPerArea);normal.push(...picked);if(rule.padMissing)for(let i=picked.length;i<rule.topPerArea;i++)normal.push({id:`pad-${area}-${i}`,area,rank:9,credit:['국어','영어','수학'].includes(area)?4:3,padded:true});}}else normal.push(...normalPool);if(!normal.length)return{label:rule.label,unavailable:true,reason:'반영교과 공통·일반선택 석차등급과 이수단위를 입력해 주세요.'};let commonUnits=normal.reduce((a,s)=>a+credit(s),0),commonTotal=normal.reduce((a,s)=>a+table[s.rank-1]*credit(s),0);if(rule.minCommonUnits&&commonUnits<rule.minCommonUnits){commonTotal+=(rule.minCommonUnits-commonUnits)*table[8];commonUnits=rule.minCommonUnits;}const commonScore=commonTotal/commonUnits,careerList=career.filter(s=>period(s)&&rule.areas.includes(s.area));let careerScore=null;if(careerList.length){const cu=careerList.reduce((a,s)=>a+credit(s),0);careerScore=careerList.reduce((a,s)=>a+rule.achievementPoints[s.achv]*credit(s),0)/cu;}const score=rule.careerWeight?(careerScore===null?commonScore:commonScore*rule.commonWeight+careerScore*rule.careerWeight):commonScore*rule.commonWeight;
      return{label:rule.label,score,maxScore:rule.maxScore,avgGrade:(normal.reduce((a,s)=>a+s.rank*credit(s),0)/normal.reduce((a,s)=>a+credit(s),0)).toFixed(2),careerUsed:careerList.length,desc:`${rule.topPerArea?'교과별 우수3과목':'지정교과 전 과목'} 이수단위 가중점수 ${commonScore.toFixed(3)}${careerScore===null?'':`×90% + 진로 전 과목 ${careerScore.toFixed(3)}×10%`} · 진로 A=1000/B=970/C=910${rule.minCommonUnits?' · 공통/일반 70단위 미달분 9등급 보정':''}`};
    }
    if(rule.formula==='konkukGlocal2027'){
      const period=s=>s.grade<3||(s.grade===3&&s.sem===1),thresholds=[4,11,23,40,60,77,89,96,100],convert=s=>{if(s.type!=='career')return s.rank;if(s.achv==='A')return 1;const pct=s.achv==='B'?(percent(s.rateB)!==null&&percent(s.rateC)!==null?Number(s.rateB)+Number(s.rateC):null):percent(s.rateC);if(pct===null)return null;return thresholds.findIndex(v=>pct<=v)+1;},selected=subjects.filter(s=>period(s)&&rule.areas.includes(s.area)&&credit(s)&&((isRankedType(s)&&rankOK(s))||(s.type==='career'&&achvOK(s))));if(!selected.length)return{label:rule.label,unavailable:true,reason:'반영교과 등급 또는 진로 성취도와 이수단위를 입력해 주세요.'};const mapped=selected.map(s=>({...s,convertedRank:convert(s)}));if(mapped.some(s=>s.convertedRank===null))return{label:rule.label,unavailable:true,reason:'진로선택 B/C 과목은 A·B·C 성취도별 학생비율을 입력해 주세요.'};const table=[10,9.5,9,8.5,8,7,6,4,0],units=mapped.reduce((a,s)=>a+credit(s),0),raw=mapped.reduce((a,s)=>a+table[s.convertedRank-1]*credit(s),0)/units,factor=units<=70?.96-(70-units)*.002:1,score=raw*factor;
      return{label:rule.label,score,maxScore:rule.maxScore,avgGrade:(mapped.reduce((a,s)=>a+s.convertedRank*credit(s),0)/units).toFixed(2),careerUsed:mapped.filter(s=>s.type==='career').length,desc:`공통·일반·진로 전 과목 이수단위 가중점수 ${raw.toFixed(3)}${units<=70?` × 이수단위 ${units} 보정계수 ${factor.toFixed(3)}`:''} · 진로 A=1, B=(B+C)비율, C=C비율 환산`};
    }
    if(rule.formula==='konkuk2027'){
      const period=s=>s.grade<3||(s.grade===3&&s.sem===1),selected=common.filter(s=>period(s)&&rule.areas.includes(s.area));if(!selected.length)return{label:rule.label,unavailable:true,reason:'국어·수학·영어·과학·사회·한국사 석차등급과 이수단위를 입력해 주세요.'};const units=selected.reduce((a,s)=>a+credit(s),0),base=selected.reduce((a,s)=>a+rule.rankPoints[s.rank-1]*credit(s),0)/units,score=base*7;
      return{label:rule.label,score,maxScore:rule.maxScore,avgGrade:(selected.reduce((a,s)=>a+s.rank*credit(s),0)/units).toFixed(2),careerUsed:0,desc:`지정교과 석차등급 전 과목 이수단위 가중 기준점수 ${base.toFixed(4)}×7(교과정량70점) · 진로선택은 교과정성30%에서만 평가`};
    }
    if(rule.formula==='kyungwoon2027'){
      const period=s=>s.grade<3||(s.grade===3&&s.sem===1),pick=(areas,count,careerMax)=>{const normal=common.filter(s=>period(s)&&areas.includes(s.area)).map(s=>({...s,convertedRank:s.rank,isCareer:false})),careerPick=career.filter(s=>period(s)&&areas.includes(s.area)).map(s=>({...s,convertedRank:rule.achievementRanks[s.achv],isCareer:true})).sort((a,b)=>a.convertedRank-b.convertedRank).slice(0,careerMax),list=normal.concat(careerPick).sort((a,b)=>a.convertedRank-b.convertedRank||credit(b)-credit(a)).slice(0,count);while(list.length<count)list.push({convertedRank:9,isCareer:false,padded:true});return list;},core=pick(['국어','영어','수학'],6,3),other=pick(['사회','과학','한국사'],3,2),selected=core.concat(other),sum=selected.reduce((a,s)=>a+s.convertedRank,0),score=540-(sum-9)*3;
      return{label:rule.label,score,maxScore:rule.maxScore,avgGrade:(sum/9).toFixed(2),careerUsed:selected.filter(s=>s.isCareer).length,desc:`국·영·수 상위6 + 사·과·한국사 상위3의 등급합 ${sum} → 540−(등급합−9)×3 · 진로 A→1/B→3/C→5, 부족 과목 9등급`};
    }
    if(rule.formula==='ginue2027'){
      const period=s=>s.grade<3||(s.grade===3&&s.sem===1),scored=common.filter(period).map(s=>({s,point:rule.rankPoints[s.rank-1],rank:s.rank,isCareer:false})).concat(career.filter(period).map(s=>({s,point:rule.achievementPoints[s.achv],rank:({A:1,B:3,C:5})[s.achv],isCareer:true})));if(!scored.length)return{label:rule.label,unavailable:true,reason:'석차등급 또는 성취도가 표기된 전 과목을 입력해 주세요.'};const avg=scored.reduce((a,x)=>a+x.point,0)/scored.length,raw=600+avg*50,score=raw*.7;
      return{label:rule.label,score,maxScore:rule.maxScore,avgGrade:(scored.reduce((a,x)=>a+x.rank,0)/scored.length).toFixed(2),careerUsed:scored.filter(x=>x.isCareer).length,desc:`전 과목 환산점수 단순평균 ${avg.toFixed(4)} → 600+(평균×50)=${raw.toFixed(3)}, 전형총점 반영비율70% 적용`};
    }
    if(rule.formula==='gnue2027'){
      const period=s=>s.grade<3||(s.grade===3&&s.sem===1),scored=common.filter(period).map(s=>({s,point:rule.rankPoints[s.rank-1],rank:s.rank,isCareer:false})).concat(career.filter(period).map(s=>({s,point:rule.achievementPoints[s.achv],rank:({A:2,B:4,C:6})[s.achv],isCareer:true})));if(!scored.length)return{label:rule.label,unavailable:true,reason:'석차등급 또는 성취도가 표기된 전 과목을 입력해 주세요.'};const avg=scored.reduce((a,x)=>a+x.point,0)/scored.length,score=avg*.8;
      return{label:rule.label,score,maxScore:rule.maxScore,avgGrade:(scored.reduce((a,x)=>a+x.rank,0)/scored.length).toFixed(2),careerUsed:scored.filter(x=>x.isCareer).length,desc:`석차등급·성취도 표기 전 과목 등급점수 단순평균 ${avg.toFixed(3)}×정량교과80% · 진로 A=95/B=85/C=75`};
    }
    if(rule.formula==='snue2027'){
      const period=s=>s.grade<3||(s.grade===3&&s.sem===1),normal=common.filter(period),careerList=career.filter(period);if(!normal.length&&!careerList.length)return{label:rule.label,unavailable:true,reason:'석차등급 또는 진로 성취도가 표기된 전 과목을 입력해 주세요.'};const avgNormal=normal.length?normal.reduce((a,s)=>a+rule.rankPoints[s.rank-1],0)/normal.length:0,avgCareer=careerList.length?careerList.reduce((a,s)=>a+rule.achievementPoints[s.achv],0)/careerList.length:0,normalScore=normal.length?avgNormal*25+500:0,careerScore=careerList.length?avgCareer*2.5+80:0,score=normalScore+careerScore;
      return{label:rule.label,score,maxScore:rule.maxScore,avgGrade:normal.length?(normal.reduce((a,s)=>a+s.rank,0)/normal.length).toFixed(2):'-',careerUsed:careerList.length,desc:`진로 제외 전 과목 [평균 ${avgNormal.toFixed(3)}×25]+500=${normalScore.toFixed(2)} + 진로 [평균 ${avgCareer.toFixed(3)}×2.5]+80=${careerScore.toFixed(2)}`};
    }
    if(rule.formula==='knue2027'){
      const period=s=>s.grade<3||(s.grade===3&&s.sem===1),mapped=common.filter(period).map(s=>({...s,convertedRank:s.rank,isCareer:false})).concat(career.filter(period).map(s=>({...s,convertedRank:rule.achievementRanks[s.achv],isCareer:true})));if(!mapped.length)return{label:rule.label,unavailable:true,reason:'전 교과 석차등급 또는 진로 성취도와 이수단위를 입력해 주세요.'};const units=mapped.reduce((a,s)=>a+credit(s),0),avg=mapped.reduce((a,s)=>a+rule.rankPoints[s.convertedRank-1]*credit(s),0)/units,score=avg*.9;
      return{label:rule.label,score,maxScore:rule.maxScore,avgGrade:(mapped.reduce((a,s)=>a+s.convertedRank*credit(s),0)/units).toFixed(2),careerUsed:mapped.filter(s=>s.isCareer).length,desc:`전 교과 전 과목 이수단위 가중환산점수 ${avg.toFixed(3)}×90/100 · 진로 A→1/B→2/C→3`};
    }
    if(rule.formula==='kongju2027'){
      const period=s=>s.grade<3||(s.grade===3&&s.sem===1),normal=common.filter(s=>period(s)&&rule.areas.includes(s.area));if(!normal.length)return{label:rule.label,unavailable:true,reason:'국어·수학·영어·한국사·사회·과학 석차등급과 이수단위를 입력해 주세요.'};const units=normal.reduce((a,s)=>a+credit(s),0),avg=normal.reduce((a,s)=>a+rule.rankPoints[s.rank-1]*credit(s),0)/units,subjectScore=500+avg*50,careerPoints=career.filter(s=>period(s)&&['국어','수학','영어','사회','과학'].includes(s.area)).map(s=>rule.achievementPoints[s.achv]),bonus=careerPoints.length?careerPoints.reduce((a,v)=>a+v,0)/careerPoints.length:0,raw=subjectScore+bonus,score=raw*(units<100?.9:1);
      return{label:rule.label,score,maxScore:rule.maxScore,avgGrade:(normal.reduce((a,s)=>a+s.rank*credit(s),0)/units).toFixed(2),careerBonus:bonus,desc:`교과 500+(변환점수평균 ${avg.toFixed(3)}×50)=${subjectScore.toFixed(2)} + 진로 전 과목 평균가산 ${bonus.toFixed(2)}${units<100?` · 반영 이수단위 ${units}<100으로 90% 적용`:''}`};
    }
    if(rule.formula==='kunsan2027'){
      const period=s=>s.grade<3||(s.grade===3&&s.sem===1),grades=[];for(const area of rule.areas){const list=common.filter(s=>period(s)&&s.area===area),units=list.reduce((a,s)=>a+credit(s),0);if(units)grades.push({area,grade:list.reduce((a,s)=>a+s.rank*credit(s),0)/units});}if(!grades.length)return{label:rule.label,unavailable:true,reason:'계열별 반영교과 석차등급과 이수단위를 입력해 주세요.'};const grade=grades.reduce((a,x)=>a+x.grade,0)/grades.length,base=900-(grade-1)*10,careerPoints=career.filter(s=>period(s)&&rule.areas.includes(s.area)).map(s=>({s,point:({A:5,B:3,C:1})[s.achv]})).sort((a,b)=>b.point-a.point).slice(0,3),bonus=careerPoints.length?careerPoints.reduce((a,x)=>a+x.point,0)/careerPoints.length:0,score=base+bonus;
      return{label:rule.label,score,maxScore:rule.maxScore,avgGrade:grade.toFixed(2),careerBonus:bonus,desc:`교과별 이수단위 가중등급(${grades.map(x=>`${x.area}${x.grade.toFixed(2)}`).join('·')})의 동일비율 평균 ${grade.toFixed(3)} → 900−(등급−1)×10 + 진로 상위${careerPoints.length} 평균가산 ${bonus.toFixed(2)}`};
    }
    if(rule.formula==='sunchon2027'){
      const period=s=>s.grade<3||(s.grade===3&&s.sem===1),normal=common.filter(s=>period(s)&&rule.areas.includes(s.area));if(!normal.length)return{label:rule.label,unavailable:true,reason:'국어·영어·수학·사회·과학 석차등급과 이수단위를 입력해 주세요.'};const units=normal.reduce((a,s)=>a+credit(s),0),grade=normal.reduce((a,s)=>a+s.rank*credit(s),0)/units,base=(9-grade)*300/8,careerPoints=career.filter(s=>period(s)&&rule.areas.includes(s.area)).map(s=>rule.achievementPoints[s.achv]).sort((a,b)=>b-a).slice(0,3),bonus=careerPoints.length>=3?careerPoints.reduce((a,v)=>a+v,0):Math.max(.3,1.65-.15*Math.ceil(grade)),score=base+bonus;
      return{label:rule.label,score,maxScore:rule.maxScore,avgGrade:grade.toFixed(2),careerBonus:bonus,desc:`전 과목 이수단위 가중등급 ${grade.toFixed(3)} → (9−등급)×300/8=${base.toFixed(3)} + ${careerPoints.length>=3?'진로 상위3 합':'진로 3과목 미만 평균등급 대체'} 가산 ${bonus.toFixed(2)}`};
    }
    if(rule.formula==='kmaritime2027'){
      const period=s=>s.grade<3||(s.grade===3&&s.sem===1),normal=common.filter(s=>period(s)&&rule.areas.includes(s.area)).map(s=>({...s,convertedRank:s.rank,isCareer:false})),careerTop=career.filter(s=>period(s)&&rule.areas.includes(s.area)).map(s=>({...s,convertedRank:({A:1,B:4,C:7})[s.achv],isCareer:true})).sort((a,b)=>a.convertedRank-b.convertedRank||credit(b)-credit(a)).slice(0,3),selected=normal.concat(careerTop);if(!selected.length)return{label:rule.label,unavailable:true,reason:'계열별 반영교과 성적과 이수단위를 입력해 주세요.'};const units=selected.reduce((a,s)=>a+credit(s),0),grade=selected.reduce((a,s)=>a+s.convertedRank*credit(s),0)/units,score=800+200*(1-(grade-1)/8);
      return{label:rule.label,score,maxScore:rule.maxScore,avgGrade:grade.toFixed(2),careerUsed:careerTop.length,desc:`공통·일반 전 과목 + 진로 상위${careerTop.length}/3(A→1/B→4/C→7) 이수단위 가중등급 ${grade.toFixed(3)} → 800+200×{1−(등급−1)/8}`};
    }
    if(rule.formula==='pknu2027'){
      const period=s=>s.grade<3||(s.grade===3&&s.sem===1),normal=common.filter(s=>period(s)&&rule.areas.includes(s.area));if(!normal.length)return{label:rule.label,unavailable:true,reason:'계열별 반영교과 공통·일반선택 성적과 이수단위를 입력해 주세요.'};const units=normal.reduce((a,s)=>a+credit(s),0),baseGrade=normal.reduce((a,s)=>a+s.rank*credit(s),0)/units,careerScore=career.filter(s=>period(s)&&rule.areas.includes(s.area)).reduce((a,s)=>a+credit(s)/5*({A:2,B:1.5,C:1})[s.achv]*((rule.mode!=='human'&&s.area==='과학'&&/[ⅡII2]/.test(s.name||''))?1.5:1),0),cuts=rule.mode==='human'?[5,4]:rule.mode==='nature'?[8,7]:[7,6],bonus=careerScore>=cuts[0]?.2:careerScore>=cuts[1]?.1:0,grade=Math.max(1,baseGrade-bonus),table=[900,895,890,880,870,860,840,815,790],lo=Math.floor(grade),hi=Math.min(9,lo+1),frac=grade-lo,score=table[lo-1]+(table[hi-1]-table[lo-1])*frac;
      return{label:rule.label,score,maxScore:rule.maxScore,avgGrade:grade.toFixed(2),careerBonus:bonus,desc:`공통·일반 이수단위 가중등급 ${baseGrade.toFixed(3)} − 진로점수 ${careerScore.toFixed(3)}의 구간가산 ${bonus.toFixed(1)}등급 = ${grade.toFixed(3)}등급, 공식 900점표 구간 환산`};
    }
    if(rule.formula==='gwangju2027'){
      const period=s=>s.grade<3||(s.grade===3&&s.sem===1),groups=[['국어'],['영어'],['수학'],['사회','과학','한국사']],selected=[];for(const group of groups){const list=common.filter(s=>period(s)&&group.includes(s.area)).sort((a,b)=>a.rank-b.rank||credit(b)-credit(a)).slice(0,4);selected.push(...list);while(list.length<4){selected.push({rank:9,padded:true});list.push({rank:9});}}const score=selected.reduce((a,s)=>a+rule.rankPoints[s.rank-1],0)/16,grade=selected.reduce((a,s)=>a+s.rank,0)/16;
      return{label:rule.label,score,maxScore:rule.maxScore,avgGrade:grade.toFixed(2),careerUsed:0,desc:`국어·영어·수학·사회/과학/한국사 교과군별 우수4과목(총16) 점수평균 · 부족 과목은 9등급 · 진로 성취도는 성적 미반영`};
    }
    if(rule.formula==='kwu2027'){
      const period=s=>s.grade<3||(s.grade===3&&s.sem===1),normal=common.filter(s=>period(s)&&rule.areas.includes(s.area));if(!normal.length)return{label:rule.label,unavailable:true,reason:'지정교과 석차등급과 이수단위를 입력해 주세요.'};const units=normal.reduce((a,s)=>a+credit(s),0),grade=normal.reduce((a,s)=>a+s.rank*credit(s),0)/units,lo=Math.floor(grade),hi=Math.min(9,lo+1),frac=grade-lo,base=rule.rankPoints[lo-1]+(rule.rankPoints[hi-1]-rule.rankPoints[lo-1])*frac,unitBonus=units>=70?5:0,careerTop=career.filter(s=>period(s)&&rule.areas.includes(s.area)).map(s=>rule.achievementPoints[s.achv]).sort((a,b)=>b-a).slice(0,3),careerBonus=careerTop.length?careerTop.reduce((a,v)=>a+v,0)/careerTop.length:0,score=base+unitBonus+careerBonus;
      return{label:rule.label,score,maxScore:rule.maxScore,avgGrade:grade.toFixed(2),careerBonus:unitBonus+careerBonus,desc:`지정교과 전 과목 이수단위 가중등급 ${grade.toFixed(3)}의 공식 점수 ${base.toFixed(3)} + 70단위 가산 ${unitBonus} + 진로 상위${careerTop.length} 평균 ${careerBonus.toFixed(2)}`};
    }
    if(rule.formula==='kosin2027'){
      const period=s=>s.grade<3||(s.grade===3&&s.sem===1),areas=['국어','수학','영어','사회','과학'],normal=common.filter(s=>period(s)&&areas.includes(s.area)).map(s=>({...s,points:rule.rankPoints[s.rank-1],convertedRank:s.rank,isCareer:false})),careerMapped=career.filter(s=>period(s)&&areas.includes(s.area)).map(s=>({...s,points:rule.achievementPoints[s.achv],convertedRank:({A:1,B:3,C:5})[s.achv],isCareer:true}));let selected=[];
      if(rule.mode==='medicine'){const kme=normal.filter(s=>['국어','수학','영어'].includes(s.area)),social=normal.filter(s=>s.area==='사회'),science=normal.filter(s=>s.area==='과학'),sumUnits=l=>l.reduce((a,s)=>a+credit(s),0),choice=sumUnits(social)>=sumUnits(science)?'사회':'과학',base=kme.concat(normal.filter(s=>s.area===choice)),careerTop=careerMapped.filter(s=>['국어','수학','영어',choice].includes(s.area)).sort((a,b)=>b.points-a.points).slice(0,rule.careerTop);selected=base.concat(careerTop);}else if(rule.mode==='adult'){selected=normal.concat(careerMapped).sort((a,b)=>b.points-a.points||credit(b)-credit(a)).slice(0,rule.total);}else{const careerTop=careerMapped.sort((a,b)=>b.points-a.points||credit(b)-credit(a)).slice(0,rule.careerTop),commonNeed=Math.max(rule.commonTop,rule.total-careerTop.length);selected=normal.sort((a,b)=>b.points-a.points||credit(b)-credit(a)).slice(0,commonNeed).concat(careerTop).slice(0,rule.total);}
      if(!selected.length)return{label:rule.label,unavailable:true,reason:'국어·수학·영어·사회·과학 교과 성적을 입력해 주세요.'};const score=selected.reduce((a,s)=>a+s.points,0)/selected.length,grade=selected.reduce((a,s)=>a+s.convertedRank,0)/selected.length;
      return{label:rule.label,score,maxScore:rule.maxScore,avgGrade:grade.toFixed(2),careerUsed:selected.filter(s=>s.isCareer).length,desc:`모집단위별 반영 ${selected.length}과목 점수평균 ${score.toFixed(3)} · 진로 부족분은 공통·일반으로 보충${rule.mode==='medicine'?' · 사회/과학 중 이수단위 합이 큰 교과 선택':''}`};
    }
    if(rule.formula==='kit2027'){
      const period=s=>s.grade<3||(s.grade===3&&s.sem===1),table=[100,98,96,94,92,90,70,40,0],selected=[];for(const group of rule.groups)selected.push(...common.filter(s=>period(s)&&group.includes(s.area)).sort((a,b)=>a.rank-b.rank||credit(b)-credit(a)).slice(0,3).map(s=>({...s,points:table[s.rank-1],isCareer:false})));selected.push(...career.filter(s=>period(s)&&rule.careerAreas.includes(s.area)).map(s=>({...s,points:({A:100,B:98,C:96})[s.achv],isCareer:true})).sort((a,b)=>b.points-a.points||credit(b)-credit(a)).slice(0,3));if(!selected.length)return{label:rule.label,unavailable:true,reason:'계열별 반영교과 석차등급 또는 진로 성취도와 이수단위를 입력해 주세요.'};const den=selected.reduce((a,s)=>a+credit(s)*(rule.weights[s.area]||1),0),score=selected.reduce((a,s)=>a+s.points*credit(s)*(rule.weights[s.area]||1),0)/den;
      return{label:rule.label,score,maxScore:rule.maxScore,avgGrade:(selected.filter(s=>!s.isCareer).reduce((a,s)=>a+s.rank,0)/(selected.filter(s=>!s.isCareer).length||1)).toFixed(2),careerUsed:selected.filter(s=>s.isCareer).length,desc:`공통·일반 교과별 상위3 + 진로 전체 상위3을 이수단위×계열별100/110% 가중평균 · 진로 A=100/B=98/C=96`};
    }
    if(rule.formula==='mmu2027'){
      const period=s=>s.grade<3||(s.grade===3&&s.sem===1),table=[1000,875,750,625,500,375,250,125,0],avg=areas=>{const list=common.filter(s=>period(s)&&areas.includes(s.area)),units=list.reduce((a,s)=>a+credit(s),0);return units?list.reduce((a,s)=>a+table[s.rank-1]*credit(s),0)/units:null},vals={국어:avg(['국어']),수학:avg(['수학']),영어:avg(['영어'])},social=avg(['사회','한국사']),science=avg(['과학']);vals.탐구=social===null?science:science===null?social:Math.max(social,science);if(Object.keys(rule.weights).some(k=>vals[k]===null))return{label:rule.label,unavailable:true,reason:'국어·수학·영어·과학/사회 반영교과 성적과 이수단위를 입력해 주세요.'};const score=Object.entries(rule.weights).reduce((a,[k,w])=>a+vals[k]*w,0);
      return{label:rule.label,score,maxScore:rule.maxScore,avgGrade:'교과별 점수',careerUsed:0,desc:`교과별 전 과목 이수단위 가중점수(${Object.keys(rule.weights).map(k=>`${k} ${vals[k].toFixed(2)}×${rule.weights[k]*100}%`).join(' + ')}) · 성취도만 표기된 진로과목은 공개 환산표가 없어 미반영`};
    }
    if(rule.formula==='kookmin2027'){
      const period=s=>s.grade<3||(s.grade===3&&s.sem===1),table=[100,99,98,95,90,70,50,30,0],normal=common.filter(s=>period(s)&&rule.areas.includes(s.area));if(!normal.length)return{label:rule.label,unavailable:true,reason:'계열별 지정교과 석차등급과 이수단위를 입력해 주세요.'};const nu=normal.reduce((a,s)=>a+credit(s),0),commonAvg=normal.reduce((a,s)=>a+table[s.rank-1]*credit(s),0)/nu,careerTop=career.filter(s=>period(s)&&rule.areas.includes(s.area)).map(s=>({...s,point:({A:100,B:98,C:90})[s.achv]})).sort((a,b)=>b.point-a.point||credit(b)-credit(a)).slice(0,3);let score,careerAvg=null;if(careerTop.length){const cu=careerTop.reduce((a,s)=>a+credit(s),0);careerAvg=careerTop.reduce((a,s)=>a+s.point*credit(s),0)/cu;score=commonAvg*10*.85+careerAvg*10*.15;}else score=commonAvg*10;
      return{label:rule.label,score,maxScore:rule.maxScore,avgGrade:(normal.reduce((a,s)=>a+s.rank*credit(s),0)/nu).toFixed(2),careerUsed:careerTop.length,desc:`공통·일반 전 과목 ${commonAvg.toFixed(3)}×10×${careerTop.length?'85%':'100%'}${careerTop.length?` + 진로 상위${careerTop.length} ${careerAvg.toFixed(3)}×10×15%`:''}`};
    }
    if(rule.formula==='kornu2027'){
      const period=s=>s.grade<3||(s.grade===3&&s.sem===1),areas=['국어','수학','영어','사회','과학'],mapped=common.filter(period).map(s=>({...s,convertedRank:s.rank,isCareer:false})).concat(career.filter(period).map(s=>({...s,convertedRank:({A:2,B:4,C:6})[s.achv],isCareer:true}))),yearGrade={};for(const grade of [1,2,3]){const avgs=areas.map(area=>{const l=mapped.filter(s=>s.grade===grade&&s.area===area);return l.length?l.reduce((a,s)=>a+s.convertedRank,0)/l.length:9}).sort((a,b)=>a-b).slice(0,3);yearGrade[grade]=avgs.reduce((a,v)=>a+v,0)/3;}const grade=yearGrade[1]*.3+yearGrade[2]*.35+yearGrade[3]*.35,limits=[1.5,1.9,2.4,2.9,3.4,4,4.7,5.4,6,6.5,7,7.5,8,8.5,9],tables={'1':[1000,990,980,970,960,950,940,930,920,910,900,890,880,870,860],'0.25':[250,243,236,229,222,215,208,201,194,187,180,173,166,159,152],'0.1':[100,98,96,94,92,90,88,86,84,82,80,78,76,74,72],'0.05':[50,48,46,44,42,40,38,36,34,32,30,28,26,24,22]},key=String(rule.factor),idx=Math.max(0,limits.findIndex(v=>grade<=v)),score=tables[key][idx];
      return{label:rule.label,score,maxScore:rule.maxScore,avgGrade:grade.toFixed(2),careerUsed:mapped.filter(s=>s.isCareer).length,desc:`학년별 5개 교과 평균 중 우수3교과를 1학년30%·2학년35%·3학년35% 반영한 ${grade.toFixed(3)}등급의 공식 구간점수 · 진로 A→2/B→4/C→6`};
    }
    if(rule.formula==='nsu2027'){
      const period=s=>s.grade<3||(s.grade===3&&s.sem===1),areas=['국어','수학','영어','사회','과학','한국사'],normal=common.filter(s=>period(s)&&areas.includes(s.area)).map(s=>({...s,point:[100,90,80,70,60,50,40,30,0][s.rank-1],convertedRank:s.rank,isCareer:false})).sort((a,b)=>b.point-a.point||credit(b)-credit(a)).slice(0,12),careerTop=career.filter(s=>period(s)&&areas.includes(s.area)).map(s=>({...s,point:({A:100,B:80,C:60})[s.achv],convertedRank:({A:1,B:3,C:5})[s.achv],isCareer:true})).sort((a,b)=>b.point-a.point||credit(b)-credit(a)).slice(0,3),selected=normal.concat(careerTop);if(!selected.length)return{label:rule.label,unavailable:true,reason:'반영교과 석차등급 또는 진로 성취도를 입력해 주세요.'};const avg=selected.reduce((a,s)=>a+s.point,0)/selected.length,score=avg*rule.factor;
      return{label:rule.label,score,maxScore:rule.maxScore,avgGrade:(selected.reduce((a,s)=>a+s.convertedRank,0)/selected.length).toFixed(2),careerUsed:careerTop.length,desc:`공통·일반 상위${normal.length}/12 + 진로 상위${careerTop.length}/3 환산점수 평균 ${avg.toFixed(3)}×${rule.factor}`};
    }
    if(rule.formula==='hanbat2027'){
      const period=s=>s.grade<3||(s.grade===3&&s.sem===1),table=[10,9.7,9.5,9.3,9.1,8,5.5,3.3,2],groups={국어:['국어'],영어:['영어'],수학:['수학'],탐구:['사회','과학']},groupAvg={};for(const [key,areas] of Object.entries(groups)){const n=key==='탐구'?4:3,list=common.filter(s=>period(s)&&areas.includes(s.area)).sort((a,b)=>a.rank-b.rank||credit(b)-credit(a)).slice(0,n),pts=list.map(s=>table[s.rank-1]);while(pts.length<n)pts.push(table[8]);groupAvg[key]=pts.reduce((a,v)=>a+v,0)/n;}const normalAvg=Object.entries(rule.weights).reduce((a,[k,w])=>a+groupAvg[k]*w,0),careerPts=career.filter(s=>period(s)&&['국어','영어','수학','사회','과학'].includes(s.area)).map(s=>({A:10,B:9.5,C:9.1})[s.achv]).sort((a,b)=>b-a).slice(0,3);while(careerPts.length<3)careerPts.push(9.1);const careerAvg=careerPts.reduce((a,v)=>a+v,0)/3,totalUnits=subjects.filter(s=>period(s)&&['국어','영어','수학','사회','과학'].includes(s.area)).reduce((a,s)=>a+credit(s),0),factor=totalUnits>=100?1.1:1,score=(normalAvg*40+careerAvg*5)*factor;
      return{label:rule.label,score,maxScore:rule.maxScore,avgGrade:'교과군별 점수',careerUsed:career.filter(s=>period(s)&&['국어','영어','수학','사회','과학'].includes(s.area)).slice(0,3).length,desc:`교과군별 상위3·3·3·4 점수의 계열비율 평균 ${normalAvg.toFixed(3)}×40 + 진로 상위3(부족 C) ${careerAvg.toFixed(3)}×5${factor>1?' · 총100단위 이상×1.1':''}`};
    }
    if(rule.formula==='dju2027'){
      const period=s=>s.grade<3||(s.grade===3&&s.sem===1),groups=[['국어'],['영어'],['수학'],['사회','과학','한국사']],pool=common.filter(s=>period(s)&&credit(s)>=2),picked=groups.flatMap(g=>pool.filter(s=>g.includes(s.area)).sort((a,b)=>a.rank-b.rank||credit(b)-credit(a)).slice(0,2));let grade,selected;if(rule.mode==='best6'){selected=picked.sort((a,b)=>a.rank-b.rank||credit(b)-credit(a)).slice(0,6);while(selected.length<6)selected.push({rank:9,credit:2,padded:true});grade=selected.reduce((a,s)=>a+s.rank,0)/6;}else{const grades=[];for(const g of groups){const list=pool.filter(s=>g.includes(s.area)).sort((a,b)=>a.rank-b.rank||credit(b)-credit(a)).slice(0,2);while(list.length<2)list.push({rank:9,credit:2,padded:true});const units=list.reduce((a,s)=>a+credit(s),0);grades.push(list.reduce((a,s)=>a+s.rank*credit(s),0)/units);}grade=grades.reduce((a,v)=>a+v,0)/4;selected=picked;}const base=rule.maxScore-(grade-1)*10,careerTop=rule.careerTop?career.filter(s=>period(s)&&credit(s)>=2&&['국어','영어','수학','사회','과학'].includes(s.area)).map(s=>({...s,point:rule.careerPoints[s.achv]})).sort((a,b)=>b.point-a.point||credit(b)-credit(a)).slice(0,rule.careerTop):[],cu=careerTop.reduce((a,s)=>a+credit(s),0),bonus=careerTop.length===rule.careerTop?careerTop.reduce((a,s)=>a+s.point*credit(s),0)/cu:0,score=Math.min(rule.maxScore,base+bonus);
      return{label:rule.label,score,maxScore:rule.maxScore,avgGrade:grade.toFixed(2),careerBonus:bonus,desc:`${rule.mode==='best6'?'교과군별 최대2 중 우수6 단순평균':'교과군별 상위2 이수단위 평균×25%'} ${grade.toFixed(3)}등급 → ${rule.maxScore}−(등급−1)×10${rule.careerTop?` + 진로 ${rule.careerTop}과목 충족 가산 ${bonus.toFixed(2)}`:''}`};
    }
    if(rule.formula==='dongseo2027'){
      const period=s=>s.grade<3||(s.grade===3&&s.sem===1),areas=['국어','영어','수학','사회','과학'],normal=common.filter(s=>period(s)).map(s=>({...s,convertedRank:s.rank,isCareer:false})),required=normal.filter(s=>areas.includes(s.area)).sort((a,b)=>a.convertedRank-b.convertedRank||credit(b)-credit(a)).slice(0,3),used=new Set(required.map(s=>s.id)),careerPool=career.filter(period).map(s=>({...s,convertedRank:({A:1,B:3,C:5})[s.achv],isCareer:true})).sort((a,b)=>a.convertedRank-b.convertedRank||credit(b)-credit(a)).slice(0,rule.careerMax),optional=normal.filter(s=>!used.has(s.id)).concat(careerPool).sort((a,b)=>a.convertedRank-b.convertedRank||credit(b)-credit(a)).slice(0,7),selected=required.concat(optional);if(!selected.length)return{label:rule.label,unavailable:true,reason:'반영 교과의 석차등급 또는 진로 성취도를 입력해 주세요.'};const score=selected.reduce((a,s)=>a+(rule.base-(s.convertedRank-1)),0);
      return{label:rule.label,score,maxScore:rule.maxScore,avgGrade:(selected.reduce((a,s)=>a+s.convertedRank,0)/selected.length).toFixed(2),careerUsed:selected.filter(s=>s.isCareer).length,desc:`국·영·수·사·과 중 우수3 + 전 과목 우수${optional.length}/7의 등급별 점수 합 · 진로 최대${rule.careerMax} A→1/B→3/C→5`};
    }
    if(rule.formula==='luther2027'){
      const period=s=>s.grade<3||(s.grade===3&&s.sem===1),areas=['국어','수학','영어','한국사','사회','과학'],normal=common.filter(s=>period(s)&&areas.includes(s.area)).map(s=>({...s,convertedRank:s.rank,isCareer:false})).sort((a,b)=>a.convertedRank-b.convertedRank).slice(0,6),careerTop=career.filter(s=>period(s)&&areas.includes(s.area)).map(s=>({...s,convertedRank:({A:1,B:2,C:4})[s.achv],isCareer:true})).sort((a,b)=>a.convertedRank-b.convertedRank).slice(0,2),selected=normal.slice(0,Math.max(4,6-careerTop.length)).concat(careerTop).sort((a,b)=>a.convertedRank-b.convertedRank).slice(0,6);if(!selected.length)return{label:rule.label,unavailable:true,reason:'반영교과의 석차등급 또는 진로 성취도를 입력해 주세요.'};const grade=selected.reduce((a,s)=>a+s.convertedRank,0)/selected.length;
      const score=(9-grade)/8*100;
      return{label:rule.label,score,maxScore:'비교지수 100',avgGrade:grade.toFixed(2),careerUsed:careerTop.length,desc:`공통·일반 상위${selected.filter(s=>!s.isCareer).length} + 진로 상위${careerTop.length}/2 평균등급 ${grade.toFixed(3)} · 진로 부족분 일반과목 보충, A→1/B→2/C→4 · 공식 환산등급을 100점 비교지수로 병기`};
    }
    if(rule.formula==='baekseok2027'){
      const period=s=>s.grade<3||(s.grade===3&&s.sem===1),areas=['국어','수학','영어','사회','한국사','과학'],normal=common.filter(s=>period(s)&&areas.includes(s.area)).sort((a,b)=>a.rank-b.rank||credit(b)-credit(a)).slice(0,15);while(normal.length<15)normal.push({rank:9,credit:10,padded:true});const units=normal.reduce((a,s)=>a+credit(s),0),grade=normal.reduce((a,s)=>a+s.rank*credit(s),0)/units,commonScore=(10-grade)*30+540,toGrade=s=>{if(s.achv==='A'){const a=percent(s.rateA);return a===null?null:1+a*2/100;}if(s.achv==='B'){const a=percent(s.rateA),b=percent(s.rateB);return a===null||b===null?null:2+(a+b)*2/100;}const a=percent(s.rateA),b=percent(s.rateB),c=percent(s.rateC);return [a,b,c].some(v=>v===null)?null:4+(a+b+c)*2/100;},careerMapped=career.filter(period).map(s=>({...s,convertedGrade:toGrade(s)}));if(careerMapped.some(s=>s.convertedGrade===null))return{label:rule.label,unavailable:true,reason:'백석대 진로 환산에는 A/B/C 성취도별 학생비율을 입력해야 합니다.'};careerMapped.sort((a,b)=>a.convertedGrade-b.convertedGrade);while(careerMapped.length<3)careerMapped.push({convertedGrade:9,padded:true});const picked=careerMapped.slice(0,3),point=g=>90-5*Math.min(16,Math.max(0,Math.floor((g-1)/.5))),careerScore=picked.reduce((a,s)=>a+point(s.convertedGrade),0)/3,score=commonScore+careerScore;
      return{label:rule.label,score,maxScore:rule.maxScore,avgGrade:grade.toFixed(2),careerUsed:picked.filter(s=>!s.padded).length,desc:`공통·일반 상위15(부족 9등급·10단위) ${commonScore.toFixed(2)} + 성취도 분포비율 환산 진로 상위3 ${careerScore.toFixed(2)} = 교과900점`};
    }
    if(rule.formula==='bufs2027'){
      const period=s=>s.grade<3||(s.grade===3&&s.sem===1),areas=['국어','수학','영어','한국사','사회','과학','제2외국어'],normal=common.filter(s=>period(s)&&areas.includes(s.area)).map(s=>({...s,convertedRank:s.rank,isCareer:false})),required=normal.filter(s=>['국어','영어','수학'].includes(s.area)).sort((a,b)=>a.convertedRank-b.convertedRank||credit(b)-credit(a)).slice(0,3),used=new Set(required.map(s=>s.id)),careerTop=career.filter(s=>period(s)&&areas.includes(s.area)).map(s=>({...s,convertedRank:({A:1,B:3,C:5})[s.achv],isCareer:true})).sort((a,b)=>a.convertedRank-b.convertedRank).slice(0,2),optional=normal.filter(s=>!used.has(s.id)).concat(careerTop).sort((a,b)=>a.convertedRank-b.convertedRank||credit(b)-credit(a)).slice(0,7),selected=required.concat(optional);if(!selected.length)return{label:rule.label,unavailable:true,reason:'반영교과 성적을 입력해 주세요.'};const table=[100,99,98,97,96,95,94,93,70],raw=selected.reduce((a,s)=>a+table[s.convertedRank-1],0),score=raw*rule.factor;
      return{label:rule.label,score,maxScore:rule.maxScore,avgGrade:(selected.reduce((a,s)=>a+s.convertedRank,0)/selected.length).toFixed(2),careerUsed:selected.filter(s=>s.isCareer).length,desc:`국·영·수 우수3 + 전체 반영교과 우수${optional.length}/7 점수합 ${raw.toFixed(2)}×${rule.factor} · 진로 최대2 A→1/B→3/C→5`};
    }
    if(rule.formula==='korea2027'){
      const period=s=>s.grade<3||(s.grade===3&&s.sem===1),thresholds=[4,11,23,40,60,77,89,96,100],band=p=>thresholds.findIndex(v=>p<=v)+1,convert=s=>{if(s.achv==='A')return 1;const a=percent(s.rateA),b=percent(s.rateB),c=percent(s.rateC);if([a,b,c].some(v=>v===null)||Math.abs(a+b+c-100)>.11)return null;if(s.achv==='B')return band(a)+(a+b)/100;return band(a+b)+(a+b+c)/100;},adjust=s=>{const n=num(s.classSize);if(n===null||n>12)return s.rank;const d=n===1?4:n===2?3:n<=4?2:1;return Math.max(1,s.rank-d);},ranked=common.filter(period),careerRows=career.filter(period);if(!ranked.length&&!careerRows.length)return{label:rule.label,unavailable:true,reason:'전 과목 석차등급 또는 진로 성취도와 이수단위를 입력해 주세요.'};const invalidRanked=ranked.filter(s=>percent(s.originalScore)===null||percent(s.subjectMean)===null||percent(s.standardDeviation)===null),invalidCareer=careerRows.filter(s=>percent(s.originalScore)===null||percent(s.subjectMean)===null||[percent(s.rateA),percent(s.rateB),percent(s.rateC)].some(v=>v===null));if(invalidRanked.length||invalidCareer.length)return{label:rule.label,unavailable:true,reason:`고려대 반영 대상 확인을 위해 공통·일반은 원점수·평균·표준편차, 진로는 원점수·평균·A/B/C 비율을 모두 입력해 주세요. (누락 ${invalidRanked.length+invalidCareer.length}과목)`};const mapped=ranked.map(s=>({...s,convertedRank:adjust(s),isCareer:false,smallClass:num(s.classSize)!==null&&num(s.classSize)<=12})).concat(careerRows.map(s=>({...s,convertedRank:convert(s),isCareer:true})));if(mapped.some(s=>s.convertedRank===null))return{label:rule.label,unavailable:true,reason:'고려대 진로 B/C 환산에는 합계가 100%인 A/B/C 성취도별 학생비율을 모두 입력해야 합니다.'};const units=mapped.reduce((a,s)=>a+credit(s),0),grade=mapped.reduce((a,s)=>a+s.convertedRank*credit(s),0)/units,lo=Math.max(1,Math.min(9,Math.floor(grade))),hi=Math.min(9,lo+1),frac=grade-lo,avgPoint=rule.rankPoints[lo-1]+(rule.rankPoints[hi-1]-rule.rankPoints[lo-1])*frac,score=Math.round(avgPoint*.9*10000)/10000,smallCount=mapped.filter(s=>s.smallClass).length,unknownClass=ranked.filter(s=>num(s.classSize)===null).length;
      return{label:rule.label,score,maxScore:rule.maxScore,avgGrade:grade.toFixed(3),careerUsed:mapped.filter(s=>s.isCareer).length,desc:`전 과목 이수단위 가중 교과평균 ${grade.toFixed(4)}등급의 공식 등급점수 구간환산 ${avgPoint.toFixed(4)}×0.9 · 진로 B/C 누적 성취도비율 변환 · 소인수 조정 ${smallCount}과목${unknownClass?` (수강자수 미입력 ${unknownClass}과목은 13명 이상으로 계산)`:''}`};
    }
    if(rule.formula==='sogang2027'){
      const period=s=>s.grade<3||(s.grade===3&&s.sem===1),normal=common.filter(period);if(!normal.length)return{label:rule.label,unavailable:true,reason:'석차등급이 표기된 전 과목과 이수단위를 입력해 주세요.'};const units=normal.reduce((a,s)=>a+credit(s),0),grade=normal.reduce((a,s)=>a+s.rank*credit(s),0)/units,commonScore=(10-grade)*100,careerList=career.filter(period),converted=[];for(const s of careerList){const a=percent(s.rateA),b=percent(s.rateB),c=percent(s.rateC);if([a,b,c].some(v=>v===null))return{label:rule.label,unavailable:true,reason:'서강대 성취도 환산에는 각 진로과목의 A/B/C 학생비율을 모두 입력해야 합니다.'};converted.push(s.achv==='A'?a/2+b+c:s.achv==='B'?b/2+c:c/2);}const careerScore=Math.min(100,converted.reduce((a,v)=>a+v,0)/2),score=commonScore+careerScore;
      return{label:rule.label,score,maxScore:rule.maxScore,avgGrade:grade.toFixed(2),careerUsed:careerList.length,desc:`석차등급 전 과목 (10−${grade.toFixed(3)})×100=${commonScore.toFixed(2)} + 성취도별 환산성취비율 합÷2=${careerScore.toFixed(2)}(최대100)`};
    }
    if(rule.formula==='uos2027'){
      const period=s=>s.grade<3||(s.grade===3&&s.sem===1),normal=common.filter(period);if(!normal.length)return{label:rule.label,unavailable:true,reason:'석차등급이 표기된 전 교과 성적과 이수단위를 입력해 주세요.'};const nu=normal.reduce((a,s)=>a+credit(s),0),commonAvg=normal.reduce((a,s)=>a+rule.rankPoints[s.rank-1]*credit(s),0)/nu,careerList=career.filter(period),cu=careerList.reduce((a,s)=>a+credit(s),0),careerAvg=cu?careerList.reduce((a,s)=>a+rule.achievementPoints[s.achv]*credit(s),0)/cu:0,score=commonAvg*7+careerAvg;
      return{label:rule.label,score,maxScore:rule.maxScore,avgGrade:(normal.reduce((a,s)=>a+s.rank*credit(s),0)/nu).toFixed(2),careerUsed:careerList.length,desc:`공통·일반 전 과목 이수단위 가중점수 ${commonAvg.toFixed(3)}×7 + 진로 전 과목 ${careerAvg.toFixed(3)}×1 · 교과정성200점 별도`};
    }
    if(rule.formula==='hanyang2027'){
      const period=s=>s.grade<3||(s.grade===3&&s.sem===1),normal=common.filter(s=>period(s)&&rule.areas.includes(s.area));if(!normal.length)return{label:rule.label,unavailable:true,reason:'지정교과 석차등급과 이수단위를 입력해 주세요.'};const units=normal.reduce((a,s)=>a+credit(s),0),avg=normal.reduce((a,s)=>a+rule.rankPoints[s.rank-1]*credit(s),0)/units,score=avg*.9;
      return{label:rule.label,score,maxScore:rule.maxScore,avgGrade:(normal.reduce((a,s)=>a+s.rank*credit(s),0)/units).toFixed(2),careerUsed:0,desc:`국·영·수·과·사·한국사 석차등급 전 과목 이수단위 가중점수 ${avg.toFixed(3)}×0.9 · 진로는 교과정성10점에서만 평가`};
    }
    if(rule.formula==='dongduk2027'){
      const period=s=>s.grade<3||(s.grade===3&&s.sem===1),avg=area=>{const l=common.filter(s=>period(s)&&s.area===area);return l.length?l.reduce((a,s)=>a+rule.rankPoints[s.rank-1],0)/l.length:null},vals={국어:avg('국어'),영어:avg('영어'),수학:avg('수학'),사회:avg('사회'),과학:avg('과학')},choice=vals.사회===null?'과학':vals.과학===null?'사회':vals.사회>=vals.과학?'사회':'과학',selected=[vals.국어,vals.영어,vals.수학,vals[choice]];if(selected.some(v=>v===null))return{label:rule.label,unavailable:true,reason:'국어·영어·수학과 사회/과학 전 과목 석차등급을 입력해 주세요.'};const score=selected.reduce((a,v)=>a+v,0)/4;
      return{label:rule.label,score,maxScore:rule.maxScore,avgGrade:'교과별 평균',careerUsed:0,desc:`국어·영어·수학 전 과목 평균점수 + ${choice}(사회/과학 중 우수교과) 평균점수를 25%씩 반영 · 성취도만 있는 진로 미반영`};
    }
    if(rule.formula==='sahmyook2027'){
      const period=s=>s.grade<3||(s.grade===3&&s.sem===1),table=[100,99,98,90,70],groupScores=[];for(const group of rule.groups){const list=common.filter(s=>period(s)&&group.includes(s.area)).map(s=>({s,point:table[Math.min(4,s.rank-1)]})).concat(career.filter(s=>period(s)&&group.includes(s.area)).map(s=>({s,point:({A:100,B:99,C:98})[s.achv]}))),units=list.reduce((a,x)=>a+credit(x.s),0);if(units)groupScores.push({group:group.join('/'),score:list.reduce((a,x)=>a+x.point*credit(x.s),0)/units});}if(groupScores.length<(rule.topGroups||rule.groups.length))return{label:rule.label,unavailable:true,reason:'모집단위별 반영 교과영역 전 과목 성적을 입력해 주세요.'};groupScores.sort((a,b)=>b.score-a.score);const picked=groupScores.slice(0,rule.topGroups||groupScores.length),score=picked.reduce((a,x)=>a+x.score,0)/picked.length;
      return{label:rule.label,score,maxScore:rule.maxScore,avgGrade:'교과영역별 점수',careerUsed:career.filter(period).length,desc:`${rule.topGroups?'우수2개 교과영역':'지정 교과영역'} 전 과목 이수단위 가중점수 평균 · 진로 A=100/B=99/C=98`};
    }
    if(rule.formula==='swu2027'){
      const period=s=>s.grade<3||(s.grade===3&&s.sem===1),areas=['국어','수학','영어','사회','과학'],normal=common.filter(s=>period(s)&&areas.includes(s.area));if(!normal.length)return{label:rule.label,unavailable:true,reason:'국어·수학·영어·사회·과학 석차등급과 이수단위를 입력해 주세요.'};const units=normal.reduce((a,s)=>a+credit(s),0);if(rule.career&&units<60)return{label:rule.label,unavailable:true,reason:`교과우수자 지원자격은 반영교과 60학점(단위) 이상이며 현재 입력은 ${units}단위입니다.`};const base=normal.reduce((a,s)=>a+rule.rankPoints[s.rank-1]*credit(s),0)/units,careerTop=rule.career?career.filter(s=>period(s)&&areas.includes(s.area)).map(s=>({s,point:({A:1,B:.9,C:.5})[s.achv]})).sort((a,b)=>b.point-a.point).slice(0,3):[],bonus=careerTop.reduce((a,x)=>a+x.point,0)/3,score=base+bonus;
      return{label:rule.label,score,maxScore:rule.maxScore,avgGrade:(normal.reduce((a,s)=>a+s.rank*credit(s),0)/units).toFixed(2),careerBonus:bonus,desc:`전 과목 이수단위 가중점수 ${base.toFixed(3)}${rule.career?` + 진로 상위${careerTop.length}/3 가산 ${bonus.toFixed(2)}`:''}`};
    }
    if(rule.formula==='seowon2027'){
      const period=s=>s.grade<=3,table=[10,9.8,9.6,9.4,9.2,9,8.8,8.5,2],mapped=common.filter(period).map(s=>({...s,convertedRank:s.rank,isCareer:false})).concat(career.filter(period).map(s=>({...s,convertedRank:({A:3,B:5,C:7})[s.achv],isCareer:true}))),pick=(areas,n)=>mapped.filter(s=>areas.includes(s.area)).sort((a,b)=>a.convertedRank-b.convertedRank||credit(b)-credit(a)).slice(0,n),selected=pick(['국어','수학'],4).concat(pick(['영어'],2),pick(['사회','과학','한국사'],2));if(!selected.length)return{label:rule.label,unavailable:true,reason:'국어/수학·영어·탐구 반영교과 성적을 입력해 주세요.'};const avg=selected.reduce((a,s)=>a+table[s.convertedRank-1],0)/selected.length,score=avg*rule.factor;
      return{label:rule.label,score,maxScore:rule.maxScore,avgGrade:(selected.reduce((a,s)=>a+s.convertedRank,0)/selected.length).toFixed(2),careerUsed:selected.filter(s=>s.isCareer).length,desc:`국어+수학 상위4, 영어2, 탐구2 총${selected.length}/8과목 평균등급점수 ${avg.toFixed(3)}×${rule.factor} · 진로 A→3/B→5/C→7`};
    }
    if(rule.formula==='sungkyul2027'){
      const period=s=>s.grade<3||(s.grade===3&&s.sem===1),areas=['국어','수학','영어','사회','과학','한국사'],normal=common.filter(s=>period(s)&&areas.includes(s.area)).map(s=>({...s,convertedRank:s.rank,isCareer:false})),careerTop=career.filter(s=>period(s)&&areas.includes(s.area)).map(s=>({...s,convertedRank:({A:1,B:3,C:5})[s.achv],isCareer:true})).sort((a,b)=>a.convertedRank-b.convertedRank).slice(0,2),selected=normal.concat(careerTop).sort((a,b)=>a.convertedRank-b.convertedRank||credit(b)-credit(a)).slice(0,12);while(selected.length<12)selected.push({convertedRank:9,credit:1,padded:true});const value=[5,4.5,4,3.5,3,2.5,2,1.5,1],units=selected.reduce((a,s)=>a+credit(s),0),avg=selected.reduce((a,s)=>a+value[s.convertedRank-1]*credit(s),0)/units,rawGrade=1+2*(5-avg),grade=Math.min(9,Math.ceil(rawGrade*5-1e-9)/5),full=grade<=7?1000-15*(grade-1):grade<=8?910-400*(grade-7):510-510*(grade-8),score=full*rule.factor;
      return{label:rule.label,score,maxScore:rule.maxScore,avgGrade:grade.toFixed(1),careerUsed:selected.filter(s=>s.isCareer).length,desc:`상위12과목(진로 최대2, 부족9등급) 이수단위 가중환산점수 ${avg.toFixed(3)} → 최종 ${grade.toFixed(1)}등급 기준득점 ${score.toFixed(2)}`};
    }
    if(rule.formula==='skhu2027'){
      const period=s=>s.grade<3||(s.grade===3&&s.sem===1),table=[12,10,9,8,7,6,4,2,0];if(rule.mode==='all'){const list=common.filter(period);if(!list.length)return{label:rule.label,unavailable:true,reason:'석차등급이 있는 전 교과 성적을 입력해 주세요.'};const grade=list.reduce((a,s)=>a+s.rank,0)/list.length,score=300+(9-grade)/8*200;return{label:rule.label,score,maxScore:rule.maxScore,avgGrade:grade.toFixed(2),careerUsed:0,desc:`전 교과 단순평균등급 ${grade.toFixed(3)} → 300+(9−등급)/8×200`};}const pick=(areas,n)=>common.filter(s=>period(s)&&areas.includes(s.area)).sort((a,b)=>a.rank-b.rank).slice(0,n),selected=pick(['국어','수학'],3).concat(pick(['영어'],2),pick(['사회','과학','한국사'],3));while(selected.length<8)selected.push({rank:9,padded:true});const score=404+selected.reduce((a,s)=>a+table[s.rank-1],0);
      return{label:rule.label,score,maxScore:rule.maxScore,avgGrade:(selected.reduce((a,s)=>a+s.rank,0)/8).toFixed(2),careerUsed:0,desc:`국어/수학3 + 영어2 + 사회/과학/한국사3 등급점수 합 + 기본점수404 · 진로 미반영`};
    }
    if(rule.formula==='sunmoon2027'){
      const period=s=>s.grade<3||(s.grade===3&&s.sem===1),areas=['국어','수학','영어','사회','과학','한국사'],normal=common.filter(s=>period(s)&&areas.includes(s.area)).map(s=>[10,9,8,7,6,5,4,3,2][s.rank-1]).sort((a,b)=>b-a).slice(0,12);while(normal.length<12)normal.push(2);const careerPts=career.filter(period).map(s=>({A:9.5,B:7.5,C:5.5})[s.achv]).sort((a,b)=>b-a).slice(0,3);while(careerPts.length<3)careerPts.push(5.5);const avg=normal.concat(careerPts).reduce((a,v)=>a+v,0)/15,score=avg*rule.factor;
      return{label:rule.label,score,maxScore:rule.maxScore,avgGrade:'15과목 점수',careerUsed:career.filter(period).slice(0,3).length,desc:`공통·일반 상위12(부족9등급2점) + 진로 상위3(A9.5/B7.5/C5.5) 평균 ${avg.toFixed(5)}×${rule.factor}`};
    }
    if(rule.formula==='dgau2027'){
      const period=s=>s.grade<3||(s.grade===3&&s.sem===1),selected=common.filter(period);if(!selected.length)return{label:rule.label,unavailable:true,reason:'3학년 1학기까지 석차등급과 이수단위가 있는 과목을 입력해 주세요.'};const units=selected.reduce((a,s)=>a+credit(s),0),score=selected.reduce((a,s)=>a+rule.rankPoints[s.rank-1]*credit(s),0)/units,grade=selected.reduce((a,s)=>a+s.rank*credit(s),0)/units;
      return{label:rule.label,score,maxScore:rule.maxScore,avgGrade:grade.toFixed(2),careerUsed:0,desc:`3학년 1학기까지 석차등급 전 과목 ${selected.length}개 이수단위 가중점수 · 진로 성취도 과목 미반영`};
    }
    if(rule.formula==='sjs2027'){
      const period=s=>s.grade<3||(s.grade===3&&s.sem===1),core=common.filter(s=>period(s)&&['국어','영어'].includes(s.area)),social=common.filter(s=>period(s)&&s.area==='사회').sort((a,b)=>a.rank-b.rank||credit(b)-credit(a)).slice(0,2),selected=core.concat(social);if(!selected.length)return{label:rule.label,unavailable:true,reason:'국어·영어 전 과목과 사회 우수 2과목의 석차등급을 입력해 주세요.'};const grade=selected.reduce((a,s)=>a+s.rank,0)/selected.length,score=rule.baseScore-(grade-1)*rule.step;
      return{label:rule.label,score,maxScore:rule.maxScore,avgGrade:grade.toFixed(2),careerUsed:0,desc:`국어·영어 전 과목 + 사회 우수 ${social.length}/2과목 단순평균 ${grade.toFixed(3)}등급 → ${rule.baseScore}−(등급−1)×${rule.step}`};
    }
    if(rule.formula==='scath2027'){
      const period=s=>s.grade<3||(s.grade===3&&s.sem===1),mapped=common.filter(period).map(s=>({...s,convertedRank:s.rank,isCareer:false})).concat(career.filter(period).map(s=>({...s,convertedRank:rule.achievementRanks[s.achv],isCareer:true}))),yearScores=[],yearGrades=[];for(const year of [1,2,3]){const list=mapped.filter(s=>s.grade===year);if(!list.length)return{label:rule.label,unavailable:true,reason:'1·2·3학년 반영 과목 성적이 모두 필요합니다.'};const units=list.reduce((a,s)=>a+credit(s),0);yearScores.push(list.reduce((a,s)=>a+rule.rankPoints[s.convertedRank-1]*credit(s),0)/units);yearGrades.push(list.reduce((a,s)=>a+s.convertedRank*credit(s),0)/units);}const score=yearScores.reduce((a,v,i)=>a+v*rule.yearWeights[i+1],0),grade=yearGrades.reduce((a,v,i)=>a+v*rule.yearWeights[i+1],0);
      return{label:rule.label,score,maxScore:rule.maxScore,avgGrade:grade.toFixed(2),careerUsed:mapped.filter(s=>s.isCareer).length,desc:`학년별 이수단위 가중점수 ${yearScores.map(v=>v.toFixed(2)).join('·')}를 30%·30%·40% 반영 · 진로 A→2/B→5/C→8등급`};
    }
    if(rule.formula==='sgju2027'){
      const period=s=>s.grade<3||(s.grade===3&&s.sem===1),areas=['국어','수학','영어','과학','사회'],mapped=common.filter(s=>period(s)&&areas.includes(s.area)).map(s=>({...s,convertedRank:s.rank,isCareer:false})).concat(career.filter(s=>period(s)&&areas.includes(s.area)).map(s=>({...s,convertedRank:({A:1,B:3,C:5})[s.achv],isCareer:true}))),selected=[];for(const year of [1,2,3]){const perArea=areas.map(area=>mapped.filter(s=>s.grade===year&&s.area===area).sort((a,b)=>a.convertedRank-b.convertedRank||credit(b)-credit(a))[0]).filter(Boolean).sort((a,b)=>a.convertedRank-b.convertedRank||credit(b)-credit(a)).slice(0,3);selected.push(...perArea);}if(!selected.length)return{label:rule.label,unavailable:true,reason:'국어·수학·영어·과학·사회 중 학년별 우수 교과 성적을 입력해 주세요.'};const grade=selected.reduce((a,s)=>a+s.convertedRank,0)/selected.length,score=selected.reduce((a,s)=>a+rule.rankPoints[s.convertedRank-1],0)/selected.length;
      return{label:rule.label,score,maxScore:rule.maxScore,avgGrade:grade.toFixed(2),careerUsed:selected.filter(s=>s.isCareer).length,desc:`학년별 우수3개 교과 각1과목, 총 ${selected.length}/9과목 점수평균 · 진로 A→1/B→3/C→5등급`};
    }
    if(rule.formula==='iccu2027'){
      const period=s=>s.grade<3||(s.grade===3&&s.sem===1),yearScores=[],yearGrades=[],selected=common.filter(period);for(const year of [1,2,3]){const list=selected.filter(s=>s.grade===year);if(!list.length)return{label:rule.label,unavailable:true,reason:'1·2·3학년 석차등급 과목이 모두 필요합니다.'};const units=list.reduce((a,s)=>a+credit(s),0);yearScores.push(list.reduce((a,s)=>a+rule.rankPoints[s.rank-1]*credit(s),0)/units);yearGrades.push(list.reduce((a,s)=>a+s.rank*credit(s),0)/units);}const score=yearScores.reduce((a,v,i)=>a+v*rule.yearWeights[i+1],0),grade=yearGrades.reduce((a,v,i)=>a+v*rule.yearWeights[i+1],0);
      return{label:rule.label,score,maxScore:rule.maxScore,avgGrade:grade.toFixed(2),careerUsed:0,desc:`석차등급 전 과목 학년별 이수단위 가중점수 ${yearScores.map(v=>v.toFixed(2)).join('·')}를 20%·30%·50% 반영 · 진로 성취도 미반영`};
    }
    if(rule.formula==='iccu2_2027'){
      const period=s=>s.grade<3||(s.grade===3&&s.sem===1),table=[100,98,96,94,92,90,70,40,0],yearScores=[],yearGrades=[];for(const year of [1,2,3]){const list=common.filter(s=>period(s)&&s.grade===year).sort((a,b)=>a.rank-b.rank||credit(b)-credit(a)).slice(0,rule.topPerYear);if(!list.length)return{label:rule.label,unavailable:true,reason:'1·2·3학년 석차등급 과목이 모두 필요합니다.'};yearScores.push(list.reduce((a,s)=>a+table[s.rank-1],0)/list.length);yearGrades.push(list.reduce((a,s)=>a+s.rank,0)/list.length);}const chosen=career.filter(period).map(s=>({s,point:({A:1.5,B:1,C:.5})[s.achv]})).sort((a,b)=>b.point-a.point).slice(0,rule.careerTop),bonus=chosen.length===rule.careerTop?chosen.reduce((a,x)=>a+x.point,0)/rule.careerTop:0,score=yearScores.reduce((a,v,i)=>a+v*rule.yearWeights[i+1],0)+bonus,grade=yearGrades.reduce((a,v,i)=>a+v*rule.yearWeights[i+1],0);
      return{label:rule.label,score,maxScore:rule.maxScore,avgGrade:grade.toFixed(2),careerUsed:chosen.length,careerBonus:bonus,desc:`학년별 우수 ${rule.topPerYear}과목 점수를 ${Object.values(rule.yearWeights).map(v=>v*100+'%').join('·')} 반영 + 진로 우수2과목 평균 가산(A1.5/B1/C0.5) ${bonus.toFixed(2)}`};
    }
    if(rule.formula==='calvin2027'){
      const period=s=>s.grade<3||(s.grade===3&&s.sem===1),mapped=common.filter(s=>period(s)&&rule.areas.includes(s.area)).map(s=>({...s,convertedRank:s.rank,isCareer:false})).concat(career.filter(s=>period(s)&&rule.areas.includes(s.area)).map(s=>({...s,convertedRank:({A:3,B:7,C:9})[s.achv],isCareer:true})));if(!mapped.length)return{label:rule.label,unavailable:true,reason:`${rule.areas.join('·')} 교과의 석차등급 또는 진로 성취도를 입력해 주세요.`};const table=[55,53.4,50.6,47.9,45.1,42.4,39.6,36.9,34.1],grade=mapped.reduce((a,s)=>a+s.convertedRank,0)/mapped.length,score=mapped.reduce((a,s)=>a+table[s.convertedRank-1],0)/mapped.length;
      return{label:rule.label,score,maxScore:rule.maxScore,avgGrade:grade.toFixed(2),careerUsed:mapped.filter(s=>s.isCareer).length,desc:`${rule.areas.join('·')} 전 과목 단순평균점수 · 진로 A→3/B→7/C→9등급 환산`};
    }
    if(rule.formula==='bible2027'){
      const period=s=>s.grade<3||(s.grade===3&&s.sem===1),areas=['국어','영어','수학','사회','과학','한국사'];let selected;if(rule.mode==='top8'){const pick=(group)=>common.filter(s=>period(s)&&group.includes(s.area)).sort((a,b)=>a.rank-b.rank||credit(b)-credit(a)).slice(0,2);selected=pick(['국어']).concat(pick(['영어']),pick(['수학']),pick(['사회','과학','한국사']));}else selected=common.filter(s=>period(s)&&areas.includes(s.area));if(!selected.length)return{label:rule.label,unavailable:true,reason:'반영교과의 석차등급과 이수단위를 입력해 주세요.'};const units=selected.reduce((a,s)=>a+credit(s),0),score=selected.reduce((a,s)=>a+rule.rankPoints[s.rank-1]*credit(s),0)/units,grade=selected.reduce((a,s)=>a+s.rank*credit(s),0)/units;
      return{label:rule.label,score,maxScore:rule.maxScore,avgGrade:grade.toFixed(2),careerUsed:0,desc:`${rule.mode==='top8'?'국·영·수·탐구 각 우수2':'지정교과 전 과목'} ${selected.length}과목 이수단위 가중점수 · 진로 성취도 미반영`};
    }
    if(rule.formula==='knsu2027'){
      const period=s=>s.grade<3||(s.grade===3&&s.sem===1),mapped=common.filter(period).map(s=>({...s,convertedRank:s.rank,isCareer:false})).concat(career.filter(period).map(s=>({...s,convertedRank:rule.achievementRanks[s.achv],isCareer:true}))),yearGrades=[];for(const year of [1,2,3]){const list=mapped.filter(s=>s.grade===year);if(!list.length)return{label:rule.label,unavailable:true,reason:'1·2·3학년 반영 과목 성적이 모두 필요합니다.'};const units=list.reduce((a,s)=>a+credit(s),0);yearGrades.push(list.reduce((a,s)=>a+s.convertedRank*credit(s),0)/units);}const grade=yearGrades.reduce((a,v,i)=>a+v*rule.yearWeights[i+1],0),score=(9-grade)*12.5;
      return{label:rule.label,score,maxScore:rule.maxScore,avgGrade:grade.toFixed(2),careerUsed:mapped.filter(s=>s.isCareer).length,desc:`학년별 이수단위 가중등급 ${yearGrades.map(v=>v.toFixed(3)).join('·')}를 30%·30%·40% 반영 → (9−등급)×12.5 · 진로 A→2/B→5/C→8`};
    }
    if(rule.formula==='gangseo2027'){
      const period=s=>s.grade<3||(s.grade===3&&s.sem===1),table=[1000,980,960,940,920,900,800,700,600],selected=[];for(const options of rule.groups){let best=[];for(const area of options){const list=common.filter(s=>period(s)&&s.area===area).sort((a,b)=>a.rank-b.rank||credit(b)-credit(a)).slice(0,rule.perGroup);while(list.length<rule.perGroup)list.push({rank:9,padded:true});if(!best.length||list.reduce((a,s)=>a+table[s.rank-1],0)>best.reduce((a,s)=>a+table[s.rank-1],0))best=list;}selected.push(...best);}if(!selected.length)return{label:rule.label,unavailable:true,reason:'모집단위별 반영교과 석차등급을 입력해 주세요.'};const base=selected.reduce((a,s)=>a+table[s.rank-1],0)/selected.length,careerTop=rule.career?career.filter(period).map(s=>({s,point:({A:3,B:2,C:1})[s.achv]})).sort((a,b)=>b.point-a.point).slice(0,3):[],bonus=careerTop.length?careerTop.reduce((a,x)=>a+x.point,0)/3:0;
      return{label:rule.label,score:base+bonus,maxScore:rule.maxScore,avgGrade:(selected.reduce((a,s)=>a+s.rank,0)/selected.length).toFixed(2),careerUsed:careerTop.length,careerBonus:bonus,desc:`교과군별 상위${rule.perGroup} 총${selected.length}과목(부족9등급) 평균점수 ${base.toFixed(3)}${rule.career?` + 진로 상위${careerTop.length}/3 평균가산 ${bonus.toFixed(3)}`:' · 실용음악 진로 미반영'}`};
    }
    if(rule.formula==='konyang2_2027'){
      const period=s=>s.grade<3||(s.grade===3&&s.sem===1),areas=['국어','수학','영어','사회','과학','한국사'];let selected=[];if(rule.mode==='medicine')selected=common.filter(s=>period(s)&&['국어','수학','영어'].includes(s.area)).concat(common.filter(s=>period(s)&&s.area==='과학').sort((a,b)=>a.rank-b.rank||credit(b)-credit(a)).slice(0,6));else if(rule.mode==='perArea12'){for(const group of [['국어'],['수학'],['영어'],['사회','과학','한국사']])selected.push(...common.filter(s=>period(s)&&group.includes(s.area)).sort((a,b)=>a.rank-b.rank||credit(b)-credit(a)).slice(0,3));}else selected=common.filter(s=>period(s)&&areas.includes(s.area)).sort((a,b)=>a.rank-b.rank||credit(b)-credit(a)).slice(0,6);if(!selected.length)return{label:rule.label,unavailable:true,reason:'모집단위별 반영교과 석차등급과 이수단위를 입력해 주세요.'};const table=[100,98,96,94,92,90,88,86,84],units=selected.reduce((a,s)=>a+credit(s),0),raw=selected.reduce((a,s)=>a+table[s.rank-1]*credit(s),0)/units,penalty=rule.minUnits&&units<rule.minUnits?.97:1,score=raw*penalty;
      return{label:rule.label,score,maxScore:rule.maxScore,avgGrade:(selected.reduce((a,s)=>a+s.rank*credit(s),0)/units).toFixed(2),careerUsed:0,desc:`${rule.mode==='medicine'?'국·수·영 전 과목+과학 우수6':rule.mode==='perArea12'?'국·수·영·탐구 각3':'지정교과 전체 우수6'} 이수단위 가중점수 ${raw.toFixed(3)}${penalty<1?` × 이수단위 ${units}<${rule.minUnits} 보정0.97`:''} · 진로 미반영`};
    }
    if(rule.formula==='keimyung2027'){
      const period=s=>s.grade<3||(s.grade===3&&s.sem===1),areaNames=[...new Set(rule.areas)],areaScores=[];for(const area of areaNames){const list=common.filter(s=>period(s)&&s.area===area);if(!list.length)continue;const units=list.reduce((a,s)=>a+credit(s),0),table=rule.regional?[40,35,30,25,20,15,10,5,0]:[80,70,60,50,40,30,20,10,0];areaScores.push({area,list,score:list.reduce((a,s)=>a+table[s.rank-1]*credit(s),0)/units});}areaScores.sort((a,b)=>b.score-a.score);const chosen=areaScores.slice(0,rule.topAreas),normal=chosen.flatMap(x=>x.list);if(!normal.length)return{label:rule.label,unavailable:true,reason:'계열별 반영교과의 석차등급과 이수단위를 입력해 주세요.'};const nu=normal.reduce((a,s)=>a+credit(s),0),commonTable=rule.regional?[40,35,30,25,20,15,10,5,0]:[80,70,60,50,40,30,20,10,0],commonScore=normal.reduce((a,s)=>a+commonTable[s.rank-1]*credit(s),0)/nu;let careerList=career.filter(s=>period(s)&&rule.areas.includes(s.area));if(!rule.regional)careerList=careerList.map(s=>({...s,point:({A:80,B:70,C:60})[s.achv]})).sort((a,b)=>b.point-a.point).slice(0,3);else careerList=careerList.map(s=>({...s,point:({A:40,B:35,C:30})[s.achv]}));const cu=careerList.reduce((a,s)=>a+credit(s),0),careerScore=cu?careerList.reduce((a,s)=>a+s.point*credit(s),0)/cu:0,score=rule.regional?commonScore+careerScore:(normal.concat(careerList).reduce((a,s)=>a+(s.point??commonTable[s.rank-1])*credit(s),0)/(nu+cu));
      return{label:rule.label,score,maxScore:rule.maxScore,avgGrade:(normal.reduce((a,s)=>a+s.rank*credit(s),0)/nu).toFixed(2),careerUsed:careerList.length,desc:`우수 ${chosen.map(x=>x.area).join('·')} 교과 전 과목${rule.regional?' 40점 + 지정 진로 전 과목 40점':' + 진로 상위3(A80/B70/C60)'} 이수단위 가중`};
    }
    if(rule.formula==='ut2027'){
      const period=s=>s.grade<3||(s.grade===3&&s.sem===1),selected=[];for(const area of rule.areas)selected.push(...common.filter(s=>period(s)&&s.area===area).sort((a,b)=>a.rank-b.rank||credit(b)-credit(a)).slice(0,3));const thresholds=[4,11,23,40,60,77,89,96,100],band=p=>thresholds.findIndex(v=>p<=v)+1,convert=s=>{const a=percent(s.rateA),b=percent(s.rateB),c=percent(s.rateC);if([a,b,c].some(v=>v===null))return null;if(s.achv==='A')return 1+a/100;if(s.achv==='B')return band(a)+(a+b)/100;return band(a+b)+(a+b+c)/100;},careerMapped=career.filter(s=>period(s)&&rule.areas.includes(s.area)).map(s=>({...s,convertedRank:convert(s),isCareer:true}));if(careerMapped.some(s=>s.convertedRank===null))return{label:rule.label,unavailable:true,reason:'진로선택 환산에는 A/B/C 성취도별 학생비율을 모두 입력해 주세요.'};careerMapped.sort((a,b)=>a.convertedRank-b.convertedRank);selected.push(...careerMapped.slice(0,3));if(!selected.length)return{label:rule.label,unavailable:true,reason:'반영교과의 석차등급 또는 진로 성취도·분포비율을 입력해 주세요.'};const point=s=>s.isCareer?100-(s.convertedRank-1)*5:[100,95,90,85,80,75,70,65,60][s.rank-1],units=selected.reduce((a,s)=>a+credit(s),0),raw=selected.reduce((a,s)=>a+point(s)*credit(s),0)/units,score=raw*rule.factor;
      return{label:rule.label,score,maxScore:rule.maxScore,avgGrade:'교과12+진로3',careerUsed:selected.filter(s=>s.isCareer).length,desc:`교과별 우수3 + 진로 우수3 이수단위 가중 백분위 ${raw.toFixed(3)} × 전형계수 ${rule.factor}`};
    }
    if(rule.formula==='kdu2027'){
      const period=s=>s.grade<3||(s.grade===3&&s.sem===1),areas=['국어','영어','수학','사회','과학','한국사'],selected=common.filter(s=>period(s)&&areas.includes(s.area)).sort((a,b)=>a.rank-b.rank||credit(b)-credit(a)).slice(0,8);while(selected.length<8)selected.push({rank:9,padded:true});const sum=selected.reduce((a,s)=>a+(10-s.rank),0),band=Math.min(17,Math.max(0,Math.ceil((72-sum)/4))),score=rule.maxScore-band*rule.step;
      return{label:rule.label,score,maxScore:rule.maxScore,avgGrade:(selected.reduce((a,s)=>a+s.rank,0)/8).toFixed(2),careerUsed:0,desc:`지정교과 상위8(부족0점) 등급점수 합 ${sum}/72 → 공식 ${rule.maxScore}점 구간표`};
    }
    if(rule.formula==='nambu2027'){
      const period=s=>s.grade<3||(s.grade===3&&s.sem===1),areas=['국어','영어','수학','사회','과학','한국사'],normal=common.filter(s=>period(s)&&areas.includes(s.area));if(!normal.length)return{label:rule.label,unavailable:true,reason:'지정교과 석차등급 과목을 입력해 주세요.'};const base=normal.reduce((a,s)=>a+rule.rankPoints[s.rank-1],0)/normal.length,top=career.filter(s=>period(s)&&areas.includes(s.area)).map(s=>({s,point:rule.careerPoints[s.achv]})).sort((a,b)=>b.point-a.point).slice(0,3),bonus=top.length?top.reduce((a,x)=>a+x.point,0)/3:0,score=base+bonus;
      return{label:rule.label,score,maxScore:rule.maxScore,avgGrade:(normal.reduce((a,s)=>a+s.rank,0)/normal.length).toFixed(2),careerUsed:top.length,careerBonus:bonus,desc:`공통·일반 전 과목 단순평균점수 ${base.toFixed(2)} + 진로 상위${top.length}/3 평균가산 ${bonus.toFixed(2)}`};
    }
    if(rule.formula==='dankook2027'){
      const period=s=>s.grade<3||(s.grade===3&&s.sem===1),mapped=common.filter(s=>period(s)&&rule.areas.includes(s.area)).map(s=>({...s,point:rule.rankPoints[s.rank-1],isCareer:false})).concat(career.filter(s=>period(s)&&rule.areas.includes(s.area)).map(s=>({...s,point:rule.achievementPoints[s.achv],isCareer:true})));if(!mapped.length)return{label:rule.label,unavailable:true,reason:'모집계열 반영교과의 석차등급 또는 진로 성취도를 입력해 주세요.'};const units=mapped.reduce((a,s)=>a+credit(s),0),raw=mapped.reduce((a,s)=>a+s.point*credit(s),0)/units,score=raw*rule.factor;
      return{label:rule.label,score,maxScore:rule.maxScore,avgGrade:'공식 점수표',careerUsed:mapped.filter(s=>s.isCareer).length,desc:`공통·일반 및 진로(A${rule.achievementPoints.A}/B${rule.achievementPoints.B}/C${rule.achievementPoints.C}) 전 과목 이수단위 가중 ${raw.toFixed(3)} × ${rule.factor}`};
    }
    if(rule.formula==='daegu2027'){
      const period=s=>s.grade<3||(s.grade===3&&s.sem===1),areas=['국어','수학','영어','사회','과학','한국사'],table=[100,96.25,92.5,88.75,85,81.25,77.5,73.75,70],mapped=common.filter(s=>period(s)&&areas.includes(s.area)).map(s=>({...s,point:table[s.rank-1],convertedRank:s.rank,isCareer:false})).concat(career.filter(s=>period(s)&&['국어','수학','영어','사회','과학'].includes(s.area)).map(s=>({...s,point:({A:100,B:96.25,C:92.5})[s.achv],convertedRank:({A:1,B:2,C:3})[s.achv],isCareer:true})).sort((a,b)=>b.point*credit(b)-a.point*credit(a)).slice(0,3));mapped.sort((a,b)=>b.point*credit(b)-a.point*credit(a)||a.convertedRank-b.convertedRank);const selected=mapped.slice(0,rule.total);while(selected.length<rule.total)selected.push({point:70,convertedRank:9,credit:1,padded:true});const units=selected.reduce((a,s)=>a+credit(s),0),score=selected.reduce((a,s)=>a+s.point*credit(s),0)/units;
      return{label:rule.label,score,maxScore:rule.maxScore,avgGrade:(selected.reduce((a,s)=>a+s.convertedRank*credit(s),0)/units).toFixed(2),careerUsed:selected.filter(s=>s.isCareer).length,desc:`점수×이수단위 우선 상위${rule.total}과목(진로 최대3, 부족9등급1단위) 이수단위 가중`};
    }
    if(rule.formula==='dhu2027'){
      const period=s=>s.grade<3||(s.grade===3&&s.sem===1),areas=rule.mode==='medicineNature'?['국어','수학','영어','과학','한국사']:rule.mode==='medicineHuman'?['국어','수학','영어','사회','한국사']:['국어','수학','영어','사회','과학','한국사'],table=[100,99,95,90,85,80,70,50,10],mapped=common.filter(s=>period(s)&&areas.includes(s.area)).map(s=>({...s,convertedRank:s.rank,isCareer:false})),careerTop=career.filter(s=>period(s)&&['국어','수학','영어','사회','과학'].includes(s.area)).map(s=>({...s,convertedRank:({A:1,B:2,C:3})[s.achv],isCareer:true})).sort((a,b)=>a.convertedRank-b.convertedRank||credit(b)-credit(a)).slice(0,3);let selected;if(rule.mode==='top12'){selected=mapped.concat(careerTop).sort((a,b)=>a.convertedRank-b.convertedRank||credit(b)-credit(a)).slice(0,12);if(careerTop.length<3)selected=mapped.concat(careerTop).sort((a,b)=>a.convertedRank-b.convertedRank||credit(b)-credit(a)).slice(0,12);}else selected=mapped.concat(careerTop);if(!selected.length)return{label:rule.label,unavailable:true,reason:'반영교과의 석차등급 또는 진로 성취도를 입력해 주세요.'};const units=selected.reduce((a,s)=>a+credit(s),0),avg=selected.reduce((a,s)=>a+table[s.convertedRank-1]*credit(s),0)/units,score=(900+avg)*rule.factor;
      return{label:rule.label,score,maxScore:rule.maxScore,avgGrade:(selected.reduce((a,s)=>a+s.convertedRank*credit(s),0)/units).toFixed(2),careerUsed:selected.filter(s=>s.isCareer).length,desc:`기본900 + 반영과목 이수단위 가중 등급점수 ${avg.toFixed(3)} · 진로 A→1/B→2/C→3`};
    }
    if(rule.formula==='deu2027'){
      const period=s=>s.grade<3||(s.grade===3&&s.sem===1),areas=rule.mode==='all'?['국어','수학','영어','사회','과학','한국사','한문']:['국어','수학','영어','사회','과학','한국사'],table=[25,22,19,16,13,10,7,4,0],mapped=common.filter(s=>period(s)&&areas.includes(s.area)).map(s=>({...s,convertedRank:s.rank,isCareer:false})),careerMapped=career.filter(s=>period(s)&&areas.includes(s.area)).map(s=>({...s,convertedRank:({A:1,B:3,C:5})[s.achv],isCareer:true})).sort((a,b)=>a.convertedRank-b.convertedRank),selected=rule.mode==='all'?mapped.concat(careerMapped):mapped.concat(careerMapped.slice(0,2)).sort((a,b)=>a.convertedRank-b.convertedRank).slice(0,12);if(!selected.length)return{label:rule.label,unavailable:true,reason:'반영교과 성적을 입력해 주세요.'};const avgPoints=selected.reduce((a,s)=>a+table[s.convertedRank-1],0)/selected.length,score=700+avgPoints*12;
      return{label:rule.label,score,maxScore:rule.maxScore,avgGrade:(selected.reduce((a,s)=>a+s.convertedRank,0)/selected.length).toFixed(2),careerUsed:selected.filter(s=>s.isCareer).length,desc:`${rule.mode==='all'?'지정교과 전 과목':'상위12(진로 최대2)'} 등급점수 평균×12 + 기본700 · 진로 A→1/B→3/C→5`};
    }
    if(rule.formula==='sangmyung2027'){
      const period=s=>s.grade<3||(s.grade===3&&s.sem===1),normal=common.filter(period).map(s=>({...s,point:rule.rankPoints[s.rank-1],isCareer:false})),careerTop=career.filter(period).map(s=>({...s,point:rule.achievementPoints[s.achv],isCareer:true})).sort((a,b)=>b.point-a.point||credit(b)-credit(a)).slice(0,rule.careerMax),selected=normal.concat(careerTop);if(!selected.length)return{label:rule.label,unavailable:true,reason:'석차등급 전 과목 또는 진로선택 성취도를 입력해 주세요.'};const units=selected.reduce((a,s)=>a+credit(s),0),score=selected.reduce((a,s)=>a+s.point*credit(s),0)/units;
      return{label:rule.label,score,maxScore:rule.maxScore,avgGrade:'공식 점수표',careerUsed:careerTop.length,desc:`석차등급 전 과목 + 진로 우수${careerTop.length}/3과목을 이수단위 가중 · 진로 A100/B96/C90`};
    }
    if(rule.formula==='sch2027'){
      const period=s=>s.grade<3||(s.grade===3&&s.sem===1),areas=['국어','수학','영어','사회','과학','한국사'],normal=common.filter(s=>period(s)&&areas.includes(s.area)),careerList=career.filter(s=>period(s)&&areas.includes(s.area));if(!normal.length)return{label:rule.label,unavailable:true,reason:'지정교과 석차등급과 이수단위를 입력해 주세요.'};const table=[100,98,96,94,92,89,86,83,80],nu=normal.reduce((a,s)=>a+credit(s),0),T=normal.reduce((a,s)=>a+table[s.rank-1]*credit(s),0)/nu,cu=careerList.reduce((a,s)=>a+credit(s),0),U=cu?careerList.reduce((a,s)=>a+({A:100,B:96,C:92})[s.achv]*credit(s),0)/cu:100,raw=T*rule.factor+U*rule.careerFactor-rule.offset,score=Math.max(rule.minScore,raw);
      return{label:rule.label,score,maxScore:rule.maxScore,avgGrade:(normal.reduce((a,s)=>a+s.rank*credit(s),0)/nu).toFixed(2),careerUsed:careerList.length,desc:`석차등급 T=${T.toFixed(3)}×${rule.factor} + 진로 U=${U.toFixed(3)}×${rule.careerFactor} − ${rule.offset}, 공식 최저점 ${rule.minScore}`};
    }
    if(rule.formula==='skku2027'){
      const period=s=>s.grade<3||(s.grade===3&&s.sem===1),avg=(areas,points)=>{const list=common.filter(s=>period(s)&&areas.includes(s.area));if(!list.length)return 0;const units=list.reduce((a,s)=>a+credit(s),0);return list.reduce((a,s)=>a+points[s.rank-1]*credit(s),0)/units;},a=avg(rule.aAreas,rule.aPoints),b=avg(rule.bAreas,rule.bPoints),score=a*7+b;
      return{label:rule.label,score,maxScore:rule.maxScore,avgGrade:'A군700+B군100',careerUsed:0,desc:`A군 이수단위 가중점수 ${a.toFixed(3)}×7 + B군 ${b.toFixed(3)}×1 · 진로는 정성200점에서만 평가`};
    }
    if(rule.formula==='semyung2027'){
      const period=s=>s.grade<3||(s.grade===3&&s.sem===1),all=common.filter(period),pick=(areas,n,limitPerArea=Infinity)=>{const pool=[];for(const area of areas)pool.push(...all.filter(s=>s.area===area).sort((a,b)=>a.rank-b.rank).slice(0,limitPerArea));return pool.sort((a,b)=>a.rank-b.rank).slice(0,n);};let selected=[],denom=10,pad=true;if(rule.mode==='top10')selected=pick(['국어','영어','수학','사회','과학','기술·가정','제2외국어','한문'],10);if(rule.mode==='nursing'){selected=['국어','영어','수학'].flatMap(a=>pick([a],4)).concat(pick(['사회','과학','한국사'],3));denom=15;}if(rule.mode==='medicine'){selected=pick(['국어','영어','수학'],15,6).concat(pick(['사회','과학','한국사'],5,3));denom=selected.length;pad=false;}if(!selected.length)return{label:rule.label,unavailable:true,reason:'모집단위별 반영교과 석차등급을 입력해 주세요.'};const missing=pad?Math.max(0,denom-selected.length):0,grade=(selected.reduce((a,s)=>a+s.rank,0)+missing*9)/(selected.length+missing),score=1100-grade*100;
      return{label:rule.label,score,maxScore:rule.maxScore,avgGrade:grade.toFixed(2),careerUsed:0,desc:`${rule.mode==='top10'?'우수10':rule.mode==='nursing'?'국영수 각4+탐구3':'국영수15(교과별최대6)+탐구5'} 단순평균등급${missing?` · 부족${missing}과목 9등급`:''} → 1100−등급×100`};
    }
    if(rule.formula==='soongsil2027'){
      const period=s=>s.grade<3||(s.grade===3&&s.sem===1),table=[10,9.5,9,8.5,8,7,5,3,0],areaScores=[];for(const [area,w] of Object.entries(rule.weights)){const list=common.filter(s=>period(s)&&s.area===area);if(!list.length)continue;const units=list.reduce((a,s)=>a+credit(s),0);areaScores.push(list.reduce((a,s)=>a+table[s.rank-1]*credit(s),0)/units*w);}const commonScore=areaScores.reduce((a,v)=>a+v,0)*8,careerList=career.filter(s=>period(s)&&Object.keys(rule.weights).includes(s.area)),cu=careerList.reduce((a,s)=>a+credit(s),0),limit=careerList.length>=3?1:careerList.length===2?.9:careerList.length===1?.8:0,careerScore=cu?careerList.reduce((a,s)=>a+table[({A:1,B:2,C:3})[s.achv]-1]*credit(s),0)/cu*limit*2:0,score=commonScore+careerScore;
      return{label:rule.label,score,maxScore:rule.maxScore,avgGrade:'교과별 가중',careerUsed:careerList.length,desc:`공통·일반 교과별 가중 80점 ${commonScore.toFixed(3)} + 진로 전 과목 20점 ${careerScore.toFixed(3)}(과목수 한도 ${limit*20}%)`};
    }
    if(rule.formula==='ajou2027'){
      const period=s=>s.grade<3||(s.grade===3&&s.sem===1),normal=common.filter(s=>period(s)&&rule.areas.includes(s.area)).map(s=>({...s,point:rule.rankPoints[s.rank-1],isCareer:false})),top=career.filter(s=>period(s)&&rule.areas.includes(s.area)).map(s=>({...s,point:rule.achievementPoints[s.achv],isCareer:true})).sort((a,b)=>b.point-a.point||credit(b)-credit(a)).slice(0,rule.careerMax),selected=normal.concat(top);if(!selected.length)return{label:rule.label,unavailable:true,reason:'국어·영어·수학·사회·과학 성적을 입력해 주세요.'};const units=selected.reduce((a,s)=>a+credit(s),0),score=selected.reduce((a,s)=>a+s.point*credit(s),0)/units;
      return{label:rule.label,score,maxScore:rule.maxScore,avgGrade:'공식 점수표',careerUsed:top.length,desc:`지정교과 전 과목 + 진로 우수${top.length}/5과목 이수단위 가중 · 진로 A100/B98/C90`};
    }
    if(rule.formula==='yonseiMirae2027'){
      const period=s=>s.grade<3||(s.grade===3&&s.sem===1),areas=['국어','수학','영어','사회','과학','한국사'],table=[100,97,94,90,86,76,60,40,10];let normal=common.filter(s=>period(s)&&areas.includes(s.area));if(rule.commonTop)normal=normal.sort((a,b)=>a.rank-b.rank||credit(b)-credit(a)).slice(0,rule.commonTop);if(!normal.length)return{label:rule.label,unavailable:true,reason:'지정교과 공통·일반선택 석차등급을 입력해 주세요.'};const nu=normal.reduce((a,s)=>a+credit(s),0),commonScore=normal.reduce((a,s)=>a+table[s.rank-1]*credit(s),0)/nu,top=career.filter(s=>period(s)&&areas.includes(s.area)).map(s=>({...s,point:({A:100,B:80,C:50})[s.achv]})).sort((a,b)=>b.point-a.point||credit(b)-credit(a)).slice(0,3);while(top.length<3)top.push({point:50,credit:1,padded:true});const cu=top.reduce((a,s)=>a+credit(s),0),careerScore=top.reduce((a,s)=>a+s.point*credit(s),0)/cu,score=commonScore*.8+careerScore*.2;
      return{label:rule.label,score,maxScore:rule.maxScore,avgGrade:(normal.reduce((a,s)=>a+s.rank*credit(s),0)/nu).toFixed(2),careerUsed:top.filter(s=>!s.padded).length,desc:`공통·일반 ${rule.commonTop?'상위10':'전 과목'} ${commonScore.toFixed(3)}×80% + 진로 상위3(부족50점) ${careerScore.toFixed(3)}×20%`};
    }
    if(rule.formula==='yu2027'){
      const period=s=>s.grade<3||(s.grade===3&&s.sem===1),areasFor=s=>s.grade===1?['국어','수학','영어','한국사','사회','과학']:['국어','수학','영어','한국사',s.area==='과학'?'과학':'사회'],normal=common.filter(s=>period(s)&&['국어','수학','영어','한국사','사회','과학'].includes(s.area));if(!normal.length)return{label:rule.label,unavailable:true,reason:'계열별 반영교과 석차등급과 이수단위를 입력해 주세요.'};const units=normal.reduce((a,s)=>a+credit(s),0),grade=Math.floor((normal.reduce((a,s)=>a+s.rank*credit(s),0)/units)*100)/100,top=career.filter(period).map(s=>({s,rank:({A:1,B:3,C:5})[s.achv]})).sort((a,b)=>a.rank-b.rank).slice(0,3);while(top.length<3)top.push({rank:grade,padded:true});const cgrade=Math.floor((top.reduce((a,x)=>a+x.rank,0)/3)*100)/100,score=rule.commonBase+rule.commonStep*(11-grade)+rule.careerBase+rule.careerStep*(11-cgrade);
      return{label:rule.label,score,maxScore:rule.maxScore,avgGrade:grade.toFixed(2),careerUsed:top.filter(x=>!x.padded).length,desc:`전 학년 이수단위 가중등급 ${grade.toFixed(2)} + 진로 상위3(A1/B3/C5, 부족 공통평균) ${cgrade.toFixed(2)} 공식 선형식`};
    }
    if(rule.formula==='inu2027'){
      const period=s=>s.grade<3||(s.grade===3&&s.sem===1),band=g=>g<1.5?350:g<2?349:g<2.25?347:g<2.5?345:g<2.75?343:g<3?341:g<3.25?338:g<3.5?335:g<3.75?332:g<4?329:g<4.25?325:g<4.5?321:g<4.75?317:g<5?313:g<5.5?307:g<6?300:g<7?280:g<8?250:200;let weighted=0;for(const [area,w] of Object.entries(rule.weights)){const list=common.filter(s=>period(s)&&s.area===area);if(!list.length){weighted+=200*w;continue;}const units=list.reduce((a,s)=>a+credit(s),0),g=list.reduce((a,s)=>a+s.rank*credit(s),0)/units;weighted+=band(g)*w;}const allUnits=subjects.filter(s=>period(s)&&Object.keys(rule.weights).includes(s.area)&&credit(s)&&((isRankedType(s)&&rankOK(s))||(s.type==='career'&&achvOK(s)))).reduce((a,s)=>a+credit(s),0),bonus=allUnits*rule.bonusRate,score=weighted+bonus;
      return{label:rule.label,score,maxScore:rule.maxScore,avgGrade:'교과별 구간',careerUsed:career.filter(s=>period(s)&&Object.keys(rule.weights).includes(s.area)).length,careerBonus:bonus,desc:`교과별 이수단위 가중등급 구간점수×계열비율 + 공통·일반·진로 이수단위 ${allUnits}×${rule.bonusRate} 가산`};
    }
    if(rule.formula==='jbnu2027'){
      const period=s=>s.grade<3||(s.grade===3&&s.sem===1),areas=['국어','영어','수학','사회','과학','한국사'],normal=common.filter(s=>period(s)&&areas.includes(s.area));if(!normal.length)return{label:rule.label,unavailable:true,reason:'반영교과 석차등급과 이수단위를 입력해 주세요.'};const pts=[9.8,9.3,8.8,8.3,7.8,6.8,4.6,2.4,.2],nu=normal.reduce((a,s)=>a+credit(s),0),avg=normal.reduce((a,s)=>a+pts[s.rank-1]*credit(s),0)/nu,top=career.filter(s=>period(s)&&['국어','영어','수학','사회','과학'].includes(s.area)).map(s=>({s,point:({A:9.8,B:9.3,C:8.8})[s.achv]})).sort((a,b)=>b.point-a.point).slice(0,3),commonRaw=rule.base+rule.range*avg/9.8;let score=commonRaw;if(top.length){const cavg=top.reduce((a,x)=>a+x.point,0)/top.length,careerRaw=rule.base+rule.range*cavg/9.8;score=commonRaw*.9+careerRaw*.1;}return{label:rule.label,score,maxScore:rule.maxScore,avgGrade:(normal.reduce((a,s)=>a+s.rank*credit(s),0)/nu).toFixed(2),careerUsed:top.length,desc:`공통·일반 공식점수 ${commonRaw.toFixed(2)}${top.length?`×90% + 진로 상위${top.length}/3 공식점수×10%`:''}`};
    }
    if(rule.formula==='jejunu2027'){
      const period=s=>s.grade<3||(s.grade===3&&s.sem===1),areas=['국어','영어','수학','사회','과학','한국사'],avg=(list,fn)=>{const units=list.reduce((a,s)=>a+credit(s),0);return units?list.reduce((a,s)=>a+fn(s)*credit(s),0)/units:null;},c=common.filter(s=>period(s)&&s.type==='common'&&areas.includes(s.area)),g=common.filter(s=>period(s)&&s.type==='general'&&areas.includes(s.area)),v=career.filter(s=>period(s)&&areas.includes(s.area)).sort((a,b)=>rule.achievementPoints[b.achv]-rule.achievementPoints[a.achv]).slice(0,3),scores=[avg(c,s=>rule.rankPoints[s.rank-1]),avg(g,s=>rule.rankPoints[s.rank-1]),avg(v,s=>rule.achievementPoints[s.achv])],present=scores.map((x,i)=>x===null?null:i).filter(x=>x!==null);if(!present.length)return{label:rule.label,unavailable:true,reason:'공통·일반·진로 중 반영 가능한 성적을 입력해 주세요.'};let weights;if(present.length===3)weights=[.3,.4,.3];else if(present.length===2){weights=[0,0,0];if(scores[0]===null){weights[1]=.7;weights[2]=.3;}else if(scores[1]===null){weights[0]=.7;weights[2]=.3;}else{weights[0]=.4;weights[1]=.6;}}else{weights=[0,0,0];weights[present[0]]=1;}const score=scores.reduce((a,v,i)=>a+(v??0)*weights[i],0);
      return{label:rule.label,score,maxScore:rule.maxScore,avgGrade:'공통/일반/진로 분리',careerUsed:v.length,desc:`공통·일반·진로 분리점수 ${scores.map(x=>x?.toFixed(1)??'-').join('/')} × 공식 비율 ${weights.map(x=>x*100+'%').join('/')}`};
    }
    if(rule.formula==='cbnu2027'){
      const period=s=>s.grade<3||(s.grade===3&&s.sem===1),thresholds=[4,11,23,40,60,77,89,96,100],band=p=>thresholds.findIndex(v=>p<=v)+1,convert=s=>{if(s.achv==='A')return 1;const b=percent(s.rateB),c=percent(s.rateC);if(c===null||s.achv==='B'&&b===null)return null;return band(s.achv==='B'?b+c:c);},mapped=common.filter(s=>period(s)&&rule.areas.includes(s.area)).map(s=>({...s,convertedRank:s.rank,isCareer:false})).concat(career.filter(s=>period(s)&&rule.areas.includes(s.area)).map(s=>({...s,convertedRank:convert(s),isCareer:true})));if(!mapped.length)return{label:rule.label,unavailable:true,reason:'반영교과 성적을 입력해 주세요.'};if(mapped.some(s=>s.convertedRank===null))return{label:rule.label,unavailable:true,reason:'진로 B/C는 성취도별 학생비율을 입력해 주세요.'};const units=mapped.reduce((a,s)=>a+credit(s),0),avg=mapped.reduce((a,s)=>a+rule.rankPoints[s.convertedRank-1]*credit(s),0)/units,score=avg*4+40;
      return{label:rule.label,score,maxScore:rule.maxScore,avgGrade:(mapped.reduce((a,s)=>a+s.convertedRank*credit(s),0)/units).toFixed(2),careerUsed:mapped.filter(s=>s.isCareer).length,desc:`전 과목 이수단위 가중점수 ${avg.toFixed(3)}×4+40 · 진로 A=1, B=B+C 누적비율, C=C비율 석차등급`};
    }
    if(rule.formula==='woosuk2027'){
      const period=s=>s.grade<3||(s.grade===3&&s.sem===1),areas=['국어','수학','영어','사회','과학','한국사'];let selected=common.filter(s=>period(s)&&areas.includes(s.area)).sort((a,b)=>a.rank-b.rank||credit(b)-credit(a));if(rule.mode==='top10')selected=selected.slice(0,10);if(!selected.length)return{label:rule.label,unavailable:true,reason:'반영교과 석차등급을 입력해 주세요.'};const table=[100,95,90,85,80,75,70,65,60],units=selected.reduce((a,s)=>a+credit(s),0),avg=selected.reduce((a,s)=>a+table[s.rank-1]*credit(s),0)/units,top=career.filter(s=>period(s)&&areas.includes(s.area)).map(s=>({s,point:({A:10,B:6,C:2})[s.achv]})).sort((a,b)=>b.point-a.point).slice(0,1),bonus=top.length?top[0].point:0,score=(rule.base+(avg-60)+bonus)*rule.factor;
      return{label:rule.label,score,maxScore:rule.maxScore,avgGrade:(selected.reduce((a,s)=>a+s.rank*credit(s),0)/units).toFixed(2),careerUsed:top.length,careerBonus:bonus,desc:`기본${rule.base}+(환산평균 ${avg.toFixed(2)}−60)+진로상위1 가산 ${bonus}`};
    }
    if(rule.formula==='uiduk2027'){
      const period=s=>s.grade<3||(s.grade===3&&s.sem===1),selected=common.filter(period);if(!selected.length)return{label:rule.label,unavailable:true,reason:'석차등급이 있는 전 교과 성적을 입력해 주세요.'};const units=selected.reduce((a,s)=>a+credit(s),0),grade=selected.reduce((a,s)=>a+s.rank*credit(s),0)/units,band=Math.min(8,Math.max(0,Math.ceil(grade)-1)),score=rule.scores[band];return{label:rule.label,score,maxScore:rule.maxScore,avgGrade:grade.toFixed(2),careerUsed:0,desc:`전 교과 이수단위 가중등급 ${grade.toFixed(3)} → 공식 등급구간 ${score}점 · 진로 성취도 미반영`};
    }
    if(rule.formula==='inje2027'){
      const period=s=>s.grade<3||(s.grade===3&&s.sem===1),areas=['국어','영어','수학','사회','과학','한국사'],mapped=common.filter(s=>period(s)&&(rule.mode==='medicine'?['국어','영어','수학','과학'].includes(s.area):areas.includes(s.area))).map(s=>({...s,convertedRank:s.rank,isCareer:false})),careerMapped=rule.mode==='medicine'?[]:career.filter(period).map(s=>({...s,convertedRank:({A:1,B:3,C:5})[s.achv],isCareer:true})).sort((a,b)=>a.convertedRank-b.convertedRank).slice(0,2);let selected;if(rule.mode==='medicine')selected=mapped;else{const required=['국어','영어','수학'].flatMap(a=>mapped.filter(s=>s.area===a).sort((x,y)=>x.rank-y.rank).slice(0,2)),used=new Set(required.map(s=>s.id)),other=mapped.filter(s=>!used.has(s.id)).concat(careerMapped).sort((a,b)=>a.convertedRank-b.convertedRank).slice(0,4);selected=required.concat(other);while(selected.length<10)selected.push({convertedRank:9,padded:true});}if(!selected.length)return{label:rule.label,unavailable:true,reason:'모집단위별 반영교과 성적을 입력해 주세요.'};let score,grade;if(rule.mode==='medicine'){const units=selected.reduce((a,s)=>a+credit(s),0);grade=selected.reduce((a,s)=>a+s.convertedRank*credit(s),0)/units;score=100-(grade*6.5-6.5);}else{const sum=selected.reduce((a,s)=>a+s.convertedRank,0);grade=sum/10;const k=rule.maxScore===70?.625:.65;score=rule.maxScore-(sum-10)*k;}return{label:rule.label,score,maxScore:rule.maxScore,avgGrade:grade.toFixed(2),careerUsed:selected.filter(s=>s.isCareer).length,desc:`${rule.mode==='medicine'?'의약 지정교과 전 과목 이수단위 평균':'국2·영2·수2·기타4 총10(진로 최대2)'} 공식 감점식`};
    }
    if(rule.formula==='hannam2027'){
      const period=s=>s.grade<3||(s.grade===3&&s.sem===1),areas=['국어','영어','수학','사회','과학','한국사'],normal=common.filter(s=>period(s)&&areas.includes(s.area)),table=[500,480,460,440,410,380,350,320,290],conv=s=>s.achv==='A'?(percent(s.rateA)!==null&&s.rateA>=40?2:1):s.achv==='B'?3:5,careers=career.filter(s=>period(s)&&areas.includes(s.area)).map(s=>({...s,convertedRank:conv(s),isCareer:true})).sort((a,b)=>a.convertedRank-b.convertedRank).slice(0,3);let selected=[];if(rule.mode==='nature'){const math=normal.filter(s=>s.area==='수학').sort((a,b)=>a.rank-b.rank).slice(0,3);const used=new Set(math.map(s=>s.id));selected=math.concat(normal.filter(s=>!used.has(s.id)).sort((a,b)=>a.rank-b.rank).slice(0,12));}else selected=normal.sort((a,b)=>a.rank-b.rank).slice(0,rule.count);selected=selected.concat(careers);while(selected.length<rule.count+3)selected.push({convertedRank:9,rank:9,credit:1,padded:true});const units=selected.reduce((a,s)=>a+credit(s),0),point=s=>table[(s.convertedRank??s.rank)-1],raw=selected.reduce((a,s)=>a+point(s)*credit(s),0)/units,coreUnits=normal.filter(s=>['국어','영어','수학'].includes(s.area)).reduce((a,s)=>a+credit(s),0),bonus=coreUnits>=56?Math.min(30,500-raw):0,score=raw+bonus;
      return{label:rule.label,score,maxScore:rule.maxScore,avgGrade:'선택과목 점수',careerUsed:careers.length,careerBonus:bonus,desc:`계열별 석차등급 과목 + 진로상위3(A비율40% 기준) 이수단위 가중${coreUnits>=56?' + 국영수56단위 가산':''}`};
    }
    if(rule.formula==='dcu2027'){
      const period=s=>s.grade<3||(s.grade===3&&s.sem===1),areas=['국어','수학','영어','사회','한국사','과학'],table=[100,99.2,97.8,95.4,92,88,84.6,82.2,80],normal=common.filter(s=>period(s)&&areas.includes(s.area)).sort((a,b)=>a.rank-b.rank||credit(b)-credit(a)),careers=career.filter(s=>period(s)&&areas.includes(s.area)).map(s=>({...s,convertedRank:({A:1,B:3,C:5})[s.achv],isCareer:true})).sort((a,b)=>a.convertedRank-b.convertedRank||credit(b)-credit(a));let selected,bonus=0;if(rule.medical){selected=normal;const top=careers.slice(0,rule.careerTop);bonus=top.reduce((a,s)=>a+({A:1,B:.9,C:.8})[s.achv],0);if(top.length<3){const units=normal.reduce((a,s)=>a+credit(s),0),g=normal.reduce((a,s)=>a+s.rank*credit(s),0)/units;bonus+=g<=3?(3-top.length)*1:g<=6?(3-top.length)*.9:(3-top.length)*.8;}}else if(rule.combined)selected=normal.map(s=>({...s,convertedRank:s.rank})).concat(careers.slice(0,rule.careerTop)).sort((a,b)=>a.convertedRank-b.convertedRank).slice(0,rule.commonTop);else selected=normal.slice(0,rule.commonTop).map(s=>({...s,convertedRank:s.rank})).concat(careers.slice(0,rule.careerTop));if(!selected.length)return{label:rule.label,unavailable:true,reason:'반영교과 성적을 입력해 주세요.'};const units=selected.reduce((a,s)=>a+credit(s),0),score=selected.reduce((a,s)=>a+table[(s.convertedRank??s.rank)-1]*credit(s),0)/units+bonus;
      return{label:rule.label,score,maxScore:rule.maxScore,avgGrade:(selected.reduce((a,s)=>a+(s.convertedRank??s.rank)*credit(s),0)/units).toFixed(2),careerUsed:careers.slice(0,rule.careerTop).length,careerBonus:bonus,desc:`${rule.medical?'공통·일반 전 과목 이수단위 가중+진로3 가산':`공통·일반 ${rule.commonTop}+진로 ${rule.careerTop}(A1/B3/C5)`}`};
    }
    if(rule.formula==='songwon2027'){
      const period=s=>s.grade<3||(s.grade===3&&s.sem===1),groups=[['국어'],['영어'],['수학'],['사회','과학','한국사']],grades=[];for(const g of groups){const list=common.filter(s=>period(s)&&g.includes(s.area)).sort((a,b)=>a.rank-b.rank).slice(0,2);while(list.length<2)list.push({rank:9,padded:true});grades.push(list.reduce((a,s)=>a+s.rank,0)/2);}const grade=Math.max(1,Math.min(9,Math.floor(grades.reduce((a,v)=>a+v,0)/grades.length))),score=rule.table[grade-1];return{label:rule.label,score,maxScore:rule.maxScore,avgGrade:grade.toFixed(2),careerUsed:0,desc:`교과군별 우수2(부족9등급) 평균을 소수 첫째자리 절사 → ${grade}등급 공식표 · 진로 미반영`};
    }
    if(rule.formula==='suwon2027'){
      const period=s=>s.grade<3||(s.grade===3&&s.sem===1),areaScores=[];for(const area of rule.areas){const list=common.filter(s=>period(s)&&s.area===area).sort((a,b)=>a.rank-b.rank||credit(b)-credit(a)).slice(0,5);if(!list.length){areaScores.push({area,score:0});continue;}const units=list.reduce((a,s)=>a+credit(s),0);areaScores.push({area,score:list.reduce((a,s)=>a+rule.table[s.rank-1]*credit(s),0)/units});}areaScores.sort((a,b)=>b.score-a.score);const score=areaScores.slice(0,rule.weights.length).reduce((a,x,i)=>a+x.score*rule.weights[i],0);return{label:rule.label,score,maxScore:rule.maxScore,avgGrade:'교과별 상위5',careerUsed:0,desc:`교과별 우수5 점수 중 상위교과를 ${rule.weights.map(w=>w*100+'%').join('·')} 반영 · 진로 미반영`};
    }
    if(rule.formula==='anyang2027'){
      const period=s=>s.grade<3||(s.grade===3&&s.sem===1),selected=common.filter(s=>period(s)&&rule.areas.includes(s.area)).sort((a,b)=>a.rank-b.rank||credit(b)-credit(a)).slice(0,rule.count);if(!selected.length)return{label:rule.label,unavailable:true,reason:'계열별 반영교과 석차등급을 입력해 주세요.'};const table=[100,95,90,85,80,65,50,30,0],units=selected.reduce((a,s)=>a+credit(s),0),score=selected.reduce((a,s)=>a+table[s.rank-1]*credit(s),0)/units;return{label:rule.label,score,maxScore:rule.maxScore,avgGrade:(selected.reduce((a,s)=>a+s.rank*credit(s),0)/units).toFixed(2),careerUsed:0,desc:`계열별 상위${rule.count}과목 이수단위 가중점수 · 진로 미반영`};
    }
    if(rule.formula==='yongin2027'){
      const period=s=>s.grade<3||(s.grade===3&&s.sem===1),areas=['국어','영어','수학','사회','과학'],selected=[];for(const year of [1,2,3]){const perArea=areas.map(area=>subjects.filter(s=>period(s)&&s.grade===year&&s.area===area&&credit(s)&&((isRankedType(s)&&rankOK(s))||(s.type==='career'&&percent(s.originalScore)!==null))).map(s=>({...s,convertedRank:s.type==='career'?Math.min(9,Math.max(1,10-Math.floor(s.originalScore/10))):s.rank,isCareer:s.type==='career'})).sort((a,b)=>a.convertedRank-b.convertedRank)[0]).filter(Boolean).sort((a,b)=>a.convertedRank-b.convertedRank).slice(0,rule.perYear);selected.push(...perArea);}if(!selected.length)return{label:rule.label,unavailable:true,reason:'학년별 서로 다른 교과의 석차등급 또는 진로 원점수를 입력해 주세요.'};const score=selected.reduce((a,s)=>a+rule.table[s.convertedRank-1],0)/selected.length;return{label:rule.label,score,maxScore:rule.maxScore,avgGrade:(selected.reduce((a,s)=>a+s.convertedRank,0)/selected.length).toFixed(2),careerUsed:selected.filter(s=>s.isCareer).length,desc:`학년별 서로 다른 교과 우수${rule.perYear}, 총${selected.length}/${rule.perYear*3}과목 평균 · 진로 원점수 10점 구간 등급환산`};
    }
    if(rule.formula==='wsu2027'){
      const period=s=>s.grade<3||(s.grade===3&&s.sem===1),groups=[['국어','한문'],['수학','영어','제2외국어'],['사회','과학','한국사']],pool=common.filter(s=>period(s)&&['국어','한문','수학','영어','제2외국어','사회','과학','한국사'].includes(s.area)),selected=[];for(const g of groups)selected.push(...pool.filter(s=>g.includes(s.area)).sort((a,b)=>a.rank-b.rank).slice(0,rule.required));const used=new Set(selected.map(s=>s.id));selected.push(...pool.filter(s=>!used.has(s.id)).sort((a,b)=>a.rank-b.rank).slice(0,Math.max(0,rule.total-selected.length)));while(selected.length<rule.total)selected.push({rank:9,padded:true});const grade=selected.reduce((a,s)=>a+s.rank,0)/rule.total,top=career.filter(period).map(s=>({s,point:({A:3,B:1.5,C:.5})[s.achv]})).sort((a,b)=>b.point-a.point).slice(0,2),careerBonus=4+top.reduce((a,x)=>a+x.point,0),score=rule.maxBase-(grade-1)*20-rule.offset+careerBonus;return{label:rule.label,score,maxScore:rule.maxScore,avgGrade:grade.toFixed(2),careerUsed:top.length,careerBonus,desc:`필수 교과군 각${rule.required}+자유선택 총${rule.total}(부족9등급) 평균 · 기본진로4+상위2(A3/B1.5/C0.5) 가산`};
    }
    if(rule.formula==='seokyeong2027'){
      const period=s=>s.grade<3||(s.grade===3&&s.sem===1),table=[100,99,98,97,96,95,90,80,60],scores=[],picked=[];for(const area of rule.areas){let list=common.filter(s=>period(s)&&s.area===area).sort((a,b)=>a.rank-b.rank||credit(b)-credit(a));if(rule.perArea)list=list.slice(0,rule.perArea);if(!list.length){scores.push(0);continue;}const units=list.reduce((a,s)=>a+credit(s),0);scores.push(list.reduce((a,s)=>a+table[s.rank-1]*credit(s),0)/units);picked.push(...list);}const score=scores.reduce((a,v)=>a+v,0)/4;
      return{label:rule.label,score,maxScore:rule.maxScore,avgGrade:picked.length?(picked.reduce((a,s)=>a+s.rank*credit(s),0)/picked.reduce((a,s)=>a+credit(s),0)).toFixed(2):'-',careerUsed:0,desc:`${rule.areas.join('·')} 각 영역 ${rule.perArea?'상위3':'전 과목'} 점수를 25%씩 반영 · 미이수 영역 0점 · 진로 미반영`};
    }
    if(rule.formula==='ulsan2027'){
      const period=s=>s.grade<3||(s.grade===3&&s.sem===1),areas=['국어','수학','영어','사회','과학'],normal=common.filter(s=>period(s)&&areas.includes(s.area)&&(rule.mode==='autonomous'||rule.mode==='medicine'||credit(s)>1)),careerAll=career.filter(s=>period(s)&&areas.includes(s.area)),bandScore=g=>{const cuts=[1.2,1.4,1.6,1.8,2,2.2,2.4,2.6,2.8,3,3.2,3.4,3.6,3.8,4,4.2,4.4,4.6,4.8,5,5.5,6,6.5,7,8,8.99,9],pts=[800,799,798,797,796,794,792,790,788,786,783,780,777,774,770,766,762,758,754,750,740,730,720,710,680,650,0];return pts[cuts.findIndex(v=>g<=v)];};let chosen=normal;if(rule.mode==='general'){chosen=[];for(const area of areas)chosen.push(...normal.filter(s=>s.area===area).sort((a,b)=>a.rank-b.rank||credit(b)-credit(a)).slice(0,3));chosen=chosen.sort((a,b)=>a.rank-b.rank||credit(b)-credit(a)).slice(0,10);}if(!chosen.length)return{label:rule.label,unavailable:true,reason:'울산대 반영교과의 석차등급과 이수단위를 입력해 주세요.'};const weighted=rule.mode!=='general',nu=chosen.reduce((a,s)=>a+(weighted?credit(s):1),0),g=chosen.reduce((a,s)=>a+s.rank*(weighted?credit(s):1),0)/nu;let commonScore;if(rule.mode==='autonomous')commonScore=100+700/g;else if(rule.mode==='medicine')commonScore=100+540/g;else commonScore=bandScore(g);let careers=careerAll;if(rule.mode==='general'||rule.mode==='nursing')careers=careers.map(s=>({...s,point:({A:50,B:49,C:48})[s.achv]})).sort((a,b)=>b.point-a.point).slice(0,2);else careers=careers.map(s=>({...s,convertedRank:rule.mode==='autonomous'?({A:1,B:1.1,C:1.2})[s.achv]:({A:1,B:4,C:8})[s.achv]}));let careerScore=0;if(rule.mode==='general'||rule.mode==='nursing')careerScore=careers.reduce((a,s)=>a+s.point,0)/Math.max(1,careers.length);else{const cu=careers.reduce((a,s)=>a+credit(s),0),cg=cu?careers.reduce((a,s)=>a+s.convertedRank*credit(s),0)/cu:1;careerScore=(rule.mode==='autonomous'?100:80)/cg;}const score=commonScore+careerScore;
      return{label:rule.label,score,maxScore:rule.maxScore,avgGrade:g.toFixed(2),careerUsed:careers.length,desc:`공통·일반 ${rule.mode==='general'?'교과별 최대3·전체10':rule.mode==='nursing'?'전 과목 이수단위':'전 과목 공식 역수식'} ${commonScore.toFixed(3)} + 진로 ${careers.length}${rule.mode==='general'||rule.mode==='nursing'?'/2과목 점수':'과목 이수단위 환산'} ${careerScore.toFixed(3)}`};
    }
    if(rule.formula==='jejuIntl2027'){
      const period=s=>s.grade<3||(s.grade===3&&s.sem===1),mapped=common.filter(period).map(s=>({...s,point:rule.rankPoints[s.rank-1],isCareer:false})).concat(career.filter(period).map(s=>({...s,point:rule.achievementPoints[s.achv],isCareer:true}))),yearScores=[];for(const year of [1,2,3]){const list=mapped.filter(s=>s.grade===year);if(!list.length)continue;const units=list.reduce((a,s)=>a+credit(s),0);yearScores.push({year,score:list.reduce((a,s)=>a+s.point*credit(s),0)/units,weight:rule.yearWeights[year]});}if(!yearScores.length)return{label:rule.label,unavailable:true,reason:'전 교과 석차등급 또는 진로 성취도와 이수단위를 입력해 주세요.'};const weightSum=yearScores.reduce((a,x)=>a+x.weight,0),score=yearScores.reduce((a,x)=>a+x.score*x.weight,0)/weightSum;
      return{label:rule.label,score,maxScore:rule.maxScore,avgGrade:'학년20:40:40',careerUsed:mapped.filter(s=>s.isCareer).length,desc:`전 교과 이수단위 가중 학년점수를 ${yearScores.map(x=>`${x.year}학년 ${x.weight*100}%`).join('·')} 반영 · 진로 A/B/C=${rule.achievementPoints.A}/${rule.achievementPoints.B}/${rule.achievementPoints.C}`};
    }
    if(rule.formula==='ptu2027'){
      const period=s=>s.grade<3||(s.grade===3&&s.sem===1),areas=['국어','수학','영어','사회','과학','한국사'],pool=common.filter(s=>period(s)&&areas.includes(s.area)).map(s=>({...s,convertedRank:s.rank,isCareer:false})),careers=career.filter(s=>period(s)&&areas.includes(s.area)).map(s=>({...s,convertedRank:({A:1,B:2,C:4})[s.achv],isCareer:true})).sort((a,b)=>a.convertedRank-b.convertedRank).slice(0,rule.careerMax),selected=pool.concat(careers).sort((a,b)=>a.convertedRank-b.convertedRank||credit(b)-credit(a)).slice(0,rule.top);while(selected.length<rule.top)selected.push({convertedRank:9,padded:true});const score=selected.reduce((a,s)=>a+rule.rankPoints[s.convertedRank-1],0)/rule.top;
      return{label:rule.label,score,maxScore:rule.maxScore,avgGrade:(selected.reduce((a,s)=>a+s.convertedRank,0)/rule.top).toFixed(2),careerUsed:selected.filter(s=>s.isCareer).length,desc:`상위${rule.top}과목(진로 최대${rule.careerMax}, A1/B2/C4) 단순평균 · 부족 과목 9등급`};
    }
    if(rule.formula==='tukorea2027'){
      const period=s=>s.grade<3||(s.grade===3&&s.sem===1),table=[100,99,98,97,96,94,80,60,25],selected=[];for(const area of rule.areas){selected.push(...common.filter(s=>period(s)&&s.area===area).sort((a,b)=>a.rank-b.rank||credit(b)-credit(a)).slice(0,4));selected.push(...career.filter(s=>period(s)&&s.area===area).map(s=>({...s,convertedRank:({A:1,B:2,C:4})[s.achv],isCareer:true,credit:1})).sort((a,b)=>a.convertedRank-b.convertedRank).slice(0,2));}if(!selected.length)return{label:rule.label,unavailable:true,reason:'교과별 석차등급 상위과목 또는 진로 성취도를 입력해 주세요.'};const units=selected.reduce((a,s)=>a+credit(s),0),m=selected.reduce((a,s)=>a+table[(s.convertedRank??s.rank)-1]*credit(s),0)/units,score=m*5;
      return{label:rule.label,score,maxScore:rule.maxScore,avgGrade:(selected.reduce((a,s)=>a+(s.convertedRank??s.rank)*credit(s),0)/units).toFixed(2),careerUsed:selected.filter(s=>s.isCareer).length,desc:`${rule.areas.join('·')} 교과별 석차 상위4 + 진로 최대2(A1/B2/C4, 1단위) 기준점수 M=${m.toFixed(4)}×5`};
    }
    if(rule.formula==='hyupsung2027'){
      const period=s=>s.grade<3||(s.grade===3&&s.sem===1),table=[100,98,96,94,90,85,80,70,60],pick=(areas,n)=>common.filter(s=>period(s)&&areas.includes(s.area)).map(s=>({...s,point:table[s.rank-1],isCareer:false})).sort((a,b)=>b.point-a.point||credit(b)-credit(a)).slice(0,n);let selected;if(rule.mode==='replace14'){selected=pick(['국어','수학'],5).concat(pick(['영어'],4),pick(['사회','과학'],5));const top=career.filter(period).map(s=>({...s,point:({A:100,B:96,C:85})[s.achv],isCareer:true})).sort((a,b)=>b.point-a.point).slice(0,2);for(const c of top){selected.sort((a,b)=>a.point-b.point);if(selected.length&&c.point>selected[0].point)selected[0]=c;}}else selected=pick(['국어','수학'],3).concat(pick(['영어'],3),pick(['사회','과학'],3));if(!selected.length)return{label:rule.label,unavailable:true,reason:'교과군별 반영 과목을 입력해 주세요.'};const score=selected.reduce((a,s)=>a+s.point,0)/selected.length;
      return{label:rule.label,score,maxScore:rule.maxScore,avgGrade:'공식 점수표',careerUsed:selected.filter(s=>s.isCareer).length,desc:`${rule.mode==='replace14'?'국·수5+영4+사·과5, 진로 상위2가 최저점 대체':'국·수3+영3+사·과3, 진로 미반영'} 점수 단순평균`};
    }
    if(rule.formula==='chosun2027'){
      const period=s=>s.grade<3||(s.grade===3&&s.sem===1),areas=['국어','수학','영어','사회','과학','한국사'],normal=common.filter(s=>period(s)&&areas.includes(s.area));if(!normal.length)return{label:rule.label,unavailable:true,reason:'반영교과 공통·일반선택 등급과 이수단위를 입력해 주세요.'};const table=[40,36,32,28,24,20,16,12,0],units=normal.reduce((a,s)=>a+credit(s),0),commonScore=normal.reduce((a,s)=>a+table[s.rank-1]*credit(s),0)/units,top=career.filter(s=>period(s)&&areas.includes(s.area)).map(s=>({...s,point:({A:10,B:8,C:6})[s.achv]})).sort((a,b)=>b.point-a.point).slice(0,3),careerScore=top.reduce((a,s)=>a+s.point,0)/rule.careerDivisor,score=450+commonScore+careerScore;
      return{label:rule.label,score,maxScore:rule.maxScore,avgGrade:(normal.reduce((a,s)=>a+s.rank*credit(s),0)/units).toFixed(2),careerUsed:top.length,desc:`기본450 + 공통·일반 전 과목 이수단위 점수 ${commonScore.toFixed(3)} + 진로 상위${top.length}/3(A10/B8/C6, 부족0) ${careerScore.toFixed(3)}`};
    }
    if(rule.formula==='joongbu2027'){
      const period=s=>s.grade<3||(s.grade===3&&s.sem===1),areas=['국어','영어','수학','사회','과학','한국사'],mapped=common.filter(s=>period(s)&&areas.includes(s.area)).map(s=>({...s,convertedRank:s.rank,isCareer:false})).concat(career.filter(s=>period(s)&&areas.includes(s.area)).map(s=>({...s,convertedRank:({A:2,B:4,C:6})[s.achv],isCareer:true}))).sort((a,b)=>a.convertedRank-b.convertedRank||credit(b)-credit(a)).slice(0,10);while(mapped.length<10)mapped.push({convertedRank:9,padded:true});const grade=mapped.reduce((a,s)=>a+s.convertedRank,0)/10;let score;if(rule.maxScore===1000)score=grade<2?1000:grade<7?1000-(Math.floor((grade-2+1e-9)/.2)+1)*20:grade<8?480:grade<9?460:440;else if(rule.maxScore===700)score=grade<2?700:grade<7?700-(Math.floor((grade-2+1e-9)/.2)+1)*10:grade<8?440:grade<9?430:420;else score=grade<2?500:grade<7?500-(Math.floor((grade-2+1e-9)/.25)+1)*10:grade<7.5?290:grade<8?280:grade<8.5?270:grade<9?260:250;
      return{label:rule.label,score,maxScore:rule.maxScore,avgGrade:grade.toFixed(2),careerUsed:mapped.filter(s=>s.isCareer).length,desc:`공통·일반·진로(A2/B4/C6) 통합 상위10과목 평균 ${grade.toFixed(2)} → 공식 ${rule.maxScore}점 구간표`};
    }
    if(rule.formula==='jungwon2027'){
      const period=s=>s.grade<3||(s.grade===3&&s.sem===1),areas=['국어','영어','수학','사회','과학'],table=[30,28,26,24,22,20,18,16,14],areaScores=[];for(const area of areas){const pool=common.filter(s=>period(s)&&s.area===area).map(s=>({...s,convertedRank:s.rank,isCareer:false}));if(!rule.excludeCareer)pool.push(...career.filter(s=>period(s)&&s.area===area).map(s=>({...s,convertedRank:({A:3,B:5,C:7})[s.achv],isCareer:true})));pool.sort((a,b)=>a.convertedRank-b.convertedRank||credit(b)-credit(a));const picked=pool.slice(0,2);while(picked.length<2)picked.push({convertedRank:9,credit:1,padded:true});const units=picked.reduce((a,s)=>a+credit(s),0),score=picked.reduce((a,s)=>a+table[s.convertedRank-1]*credit(s),0)/units;areaScores.push({area,score,picked});}areaScores.sort((a,b)=>b.score-a.score);const best=areaScores.slice(0,2),score=(best[0].score+best[1].score)*rule.factor+rule.base;
      return{label:rule.label,score,maxScore:rule.maxScore,avgGrade:'우수2교과군',careerUsed:best.flatMap(x=>x.picked).filter(s=>s.isCareer).length,desc:`교과군별 우수2과목(부족9등급) 중 상위2교과군 점수합 ${(best[0].score+best[1].score).toFixed(3)}×${rule.factor}+${rule.base}${rule.excludeCareer?' · 진로 미반영':' · 진로 A3/B5/C7'}`};
    }
    if(rule.formula==='changshin2027'){
      const period=s=>s.grade<3||(s.grade===3&&s.sem===1),areas=['국어','영어','수학','사회','과학'],map=s=>({...s,convertedRank:s.type==='career'?({A:1,B:3,C:5})[s.achv]:s.rank,isCareer:s.type==='career'}),all=subjects.filter(s=>period(s)&&areas.includes(s.area)&&((isRankedType(s)&&rankOK(s))||(s.type==='career'&&achvOK(s)))).map(map),choose=(list,n)=>{const careerTop=list.filter(s=>s.isCareer).sort((a,b)=>a.convertedRank-b.convertedRank).slice(0,2),normal=list.filter(s=>!s.isCareer);return normal.concat(careerTop).sort((a,b)=>a.convertedRank-b.convertedRank).slice(0,n);};let first=all.filter(s=>s.grade===1),upper=all.filter(s=>s.grade>=2);if(rule.mode==='top'){first=choose(first,3);upper=choose(upper,5);}if(!first.length||!upper.length)return{label:rule.label,unavailable:true,reason:'1학년과 2·3학년 반영교과 성적을 모두 입력해 주세요.'};const g1=first.reduce((a,s)=>a+s.convertedRank,0)/first.length,g2=upper.reduce((a,s)=>a+s.convertedRank,0)/upper.length,grade=g1*.3+g2*.7,table=[100,98,96,94,92,91,89,87,84],lo=Math.max(1,Math.min(9,Math.floor(grade))),hi=Math.min(9,lo+1),score=(table[lo-1]+(table[hi-1]-table[lo-1])*(grade-lo))*rule.factor;
      return{label:rule.label,score,maxScore:rule.maxScore,avgGrade:grade.toFixed(2),careerUsed:first.concat(upper).filter(s=>s.isCareer).length,desc:`1학년 ${rule.mode==='top'?'우수3':'전 과목'}×30% + 2·3학년 ${rule.mode==='top'?'우수5':'전 과목'}×70% · 진로 A1/B3/C5${rule.mode==='top'?' 최대2':''}`};
    }
    if(rule.formula==='chodang2027'){
      const period=s=>s.grade<3||(s.grade===3&&s.sem===1),areas=['국어','영어','수학','사회','과학','한국사'],normal=common.filter(s=>period(s)&&areas.includes(s.area)).map(s=>({...s,convertedRank:s.rank,isCareer:false})).sort((a,b)=>a.convertedRank-b.convertedRank).slice(0,10),top=career.filter(s=>period(s)&&['국어','영어','수학','사회','과학'].includes(s.area)).map(s=>({...s,convertedRank:({A:2,B:5,C:8})[s.achv],isCareer:true})).sort((a,b)=>a.convertedRank-b.convertedRank).slice(0,2),selected=normal.concat(top);if(!selected.length)return{label:rule.label,unavailable:true,reason:'공통·일반 상위과목 또는 진로 성취도를 입력해 주세요.'};const grade=selected.reduce((a,s)=>a+s.convertedRank,0)/selected.length,table=[1000,980,960,940,930,920,910,900,880],lo=Math.max(1,Math.min(9,Math.floor(grade))),hi=Math.min(9,lo+1),score=table[lo-1]+(table[hi-1]-table[lo-1])*(grade-lo);
      return{label:rule.label,score,maxScore:rule.maxScore,avgGrade:grade.toFixed(2),careerUsed:top.length,desc:`공통·일반 상위${normal.length}/10 + 진로 상위${top.length}/2(A2/B5/C8) 평균등급을 공식 배점표에 적용`};
    }
    if(rule.formula==='chongshin2027'){
      const period=s=>s.grade<3||(s.grade===3&&s.sem===1),areas=['국어','영어','수학','사회','과학'],table=[648,639,621,585,513,369,180,90,0],perSemester=[];for(const grade of [1,2,3])for(const sem of [1,2]){if(grade===3&&sem===2)continue;for(const area of areas){const best=common.filter(s=>period(s)&&s.grade===grade&&s.sem===sem&&s.area===area).sort((a,b)=>a.rank-b.rank)[0];if(best)perSemester.push(best);}}if(!perSemester.length)return{label:rule.label,unavailable:true,reason:'학기별·교과별 우수 공통·일반선택 등급을 입력해 주세요.'};const commonScore=perSemester.reduce((a,s)=>a+table[s.rank-1],0)/perSemester.length,careerList=career.filter(s=>period(s)&&areas.includes(s.area)),careerScore=careerList.length?careerList.reduce((a,s)=>a+({A:72,B:65,C:0})[s.achv],0)/careerList.length:0,score=commonScore*.9+careerScore*.1;
      return{label:rule.label,score,maxScore:rule.maxScore,avgGrade:(perSemester.reduce((a,s)=>a+s.rank,0)/perSemester.length).toFixed(2),careerUsed:careerList.length,desc:`학기별·교과별 우수 공통/일반 평균 ${commonScore.toFixed(3)}×90% + 진로 전 과목(A72/B65/C0) ${careerScore.toFixed(3)}×10%`};
    }
    if(rule.formula==='gachon2027'){
      const period=s=>s.grade<3||(s.grade===3&&s.sem===1),normal=common.filter(s=>period(s)&&rule.areas.includes(s.area));if(!normal.length)return{label:rule.label,unavailable:true,reason:'계열별 반영교과의 공통·일반선택 석차등급과 이수단위를 입력해 주세요.'};const std=[100,99.5,99,98.5,98,97.5,85,60,30],units=x=>x.reduce((a,s)=>a+credit(s),0),avg=(x,fn)=>x.reduce((a,s)=>a+fn(s)*credit(s),0)/units(x);let score,desc;if(rule.mode==='best'){const allScore=avg(normal,s=>[100,99.5,99,90,70,70,70,70,70][s.rank-1]),top=normal.sort((a,b)=>a.rank-b.rank||credit(b)-credit(a)).slice(0,10),topScore=avg(top,s=>std[s.rank-1]);score=Math.max(allScore,topScore);desc=`유형1 전 과목 변환점수 ${allScore.toFixed(3)}와 유형2 우수10 이수단위 점수 ${topScore.toFixed(3)} 중 높은 값`;}else if(rule.mode==='all'){score=avg(normal,s=>std[s.rank-1]);desc=`반영교과 전 과목 등급점수 이수단위 가중 ${score.toFixed(3)}`;}else{const general=normal.filter(s=>s.type==='general'),gs=general.length?avg(general,s=>s.rank===1?100:s.rank===2?99.5:70):0,careerList=career.filter(s=>period(s)&&rule.areas.includes(s.area)&&percent(s.originalScore)!==null),cs=careerList.length?avg(careerList,s=>s.originalScore>=70?100:s.originalScore>=50?99.5:70):0;score=gs*.4+cs*.6;desc=`일반선택 변환점수 ${gs.toFixed(3)}×40% + 진로 원점수(A≥70/B≥50/E<50) ${cs.toFixed(3)}×60%`;}
      return{label:rule.label,score,maxScore:rule.maxScore,avgGrade:(normal.reduce((a,s)=>a+s.rank*credit(s),0)/units(normal)).toFixed(2),careerUsed:rule.mode==='regional'?career.filter(s=>period(s)&&rule.areas.includes(s.area)&&percent(s.originalScore)!==null).length:0,desc};
    }
    if(rule.formula==='yonsei2027'){
      const period=s=>s.grade<3||(s.grade===3&&s.sem===1),aAreas=['국어','수학','영어','사회','과학','한국사'],rankPts=[100,95,87.5,75,60,40,25,12.5,5],erf=x=>{const sign=x<0?-1:1,a=Math.abs(x),t=1/(1+.3275911*a),y=1-(((((1.061405429*t-1.453152027)*t+1.421413741)*t-0.284496736)*t+0.254829592)*t)*Math.exp(-a*a);return sign*y;},scoreNormal=list=>{if(!list.length)return null;const units=list.reduce((a,s)=>a+credit(s),0),v=list.reduce((a,s)=>{let zPoint=rankPts[s.rank-1];if(percent(s.originalScore)!==null&&percent(s.subjectMean)!==null&&percent(s.standardDeviation)>0){let z=Math.round(((s.originalScore-s.subjectMean)/s.standardDeviation)*10)/10;z=Math.max(-3,Math.min(3,z));let pct=1-.5*(1+erf(z/Math.SQRT2));const upper=[.04,.11,.23,.4,.6,.77,.89,.96,1][s.rank-1],lower=[0,.04,.11,.23,.4,.6,.77,.89,.96][s.rank-1];pct=Math.max(lower,Math.min(upper,pct));zPoint=(1-pct)*100;}return a+((rankPts[s.rank-1]+zPoint)/2)*credit(s);},0)/units;return v;};
      const ranked=common.filter(s=>period(s)&&aAreas.includes(s.area));
      let commonList=ranked.filter(s=>s.type==='common'),generalList=ranked.filter(s=>s.type==='general'),legacyRecovered=false;
      // 구버전 저장자료는 과목구분이 모두 공통으로 저장될 수 있었다. 연세대에서 일반선택 50점이
      // 0점 처리되지 않도록, 한쪽 구분이 완전히 비었을 때만 교육과정상 대표 공통과목명을 이용해 복구한다.
      if(ranked.length&&(!commonList.length||!generalList.length)){
        const commonNames=/^(공통국어|공통수학|공통영어|통합사회|통합과학|한국사|과학탐구실험)/;
        const inferredCommon=ranked.filter(s=>commonNames.test(String(s.name||'').replace(/\s/g,'')));
        const inferredGeneral=ranked.filter(s=>!commonNames.test(String(s.name||'').replace(/\s/g,'')));
        if(inferredCommon.length&&inferredGeneral.length){commonList=inferredCommon;generalList=inferredGeneral;legacyRecovered=true;}
      }
      const careerList=career.filter(s=>period(s)&&aAreas.includes(s.area)),c=scoreNormal(commonList),g=scoreNormal(generalList);
      if(c===null||g===null||!careerList.length)return{label:rule.label,unavailable:true,reason:`연세대 추천형은 공통과목·일반선택과목·진로선택과목을 모두 입력해야 합니다.${c===null?' 공통과목이 없습니다.':''}${g===null?' 일반선택과목이 없습니다.':''}${!careerList.length?' 진로선택과목이 없습니다.':''}`};
      const cu=careerList.reduce((a,s)=>a+credit(s),0),v=careerList.reduce((a,s)=>a+({A:20,B:15,C:10})[s.achv]*credit(s),0)/cu,bList=subjects.filter(s=>period(s)&&!aAreas.includes(s.area)&&credit(s)&&((isRankedType(s)&&rankOK(s))||(s.type==='career'&&achvOK(s)))),bad=bList.filter(s=>(isRankedType(s)&&s.rank===9)||(s.type==='career'&&s.achv==='C')),bu=bList.reduce((a,s)=>a+credit(s),0),deduct=bu?Math.min(5,bad.reduce((a,s)=>a+credit(s),0)*5/bu):0,score=c*.3+g*.5+v-deduct;
      const target=Math.max(rankPts[8],Math.min(rankPts[0],score));let comparisonGrade=9;for(let i=0;i<8;i++){if(target<=rankPts[i]&&target>=rankPts[i+1]){comparisonGrade=(i+1)+(rankPts[i]-target)/(rankPts[i]-rankPts[i+1]);break;}}
      return{label:rule.label,score,maxScore:rule.maxScore,comparisonGrade,avgGrade:'공통·일반 Z혼합',careerUsed:careerList.length,desc:`공통 ${c.toFixed(3)}×30% + 일반 ${g.toFixed(3)}×50% + 진로 ${v.toFixed(3)}(A20/B15/C10) − 기타과목 감점 ${deduct.toFixed(3)} · 공식 등급점수표 역산 비교환산 ${comparisonGrade.toFixed(3)}등급${legacyRecovered?' · 구버전 과목구분 자동복구':''}`};
    }
    if(rule.formula==='wonkwang2027'){
      const period=s=>s.grade<3||(s.grade===3&&s.sem===1),areas=['국어','영어','수학','사회','과학','한국사'],normal=common.filter(s=>period(s)&&areas.includes(s.area)),careerList=career.filter(s=>period(s)&&areas.includes(s.area)).map(s=>({...s,convertedRank:({A:1,B:3,C:5})[s.achv]})),weighted=(list,value)=>{const units=list.reduce((a,s)=>a+credit(s),0);return units?list.reduce((a,s)=>a+value(s)*credit(s),0)/units:null;},commonGrade=weighted(normal,s=>s.rank),careerGrade=weighted(careerList,s=>s.convertedRank);if(commonGrade===null)return{label:rule.label,unavailable:true,reason:'국어·영어·수학·사회·과학·한국사의 공통·일반선택 석차등급과 이수단위를 입력해 주세요.'};let score,desc;if(rule.mode==='revised'){if(careerGrade===null)return{label:rule.label,unavailable:true,reason:'2015 개정 이후 전형은 공통·일반선택과 진로선택 성취도(A/B/C)를 각각 입력해 주세요.'};score=(9-commonGrade)*8.75+(9-careerGrade)*2.5+500;desc=`공통·일반 ${(9-commonGrade).toFixed(3)}×8.75 + 진로(A1/B3/C5) ${(9-careerGrade).toFixed(3)}×2.5 + 기본500`;}else if(rule.mode==='old'){score=(9-commonGrade)*11.25+500;desc=`공통·일반 이수단위 가중등급 ${commonGrade.toFixed(3)} → (9−등급)×11.25+500`;}else{score=(9-commonGrade)*4.5+624;desc=`군사학과 공통·일반 이수단위 가중등급 ${commonGrade.toFixed(3)} → (9−등급)×4.5+624`;}
      return{label:rule.label,score,maxScore:rule.maxScore,avgGrade:commonGrade.toFixed(2),careerUsed:rule.mode==='revised'?careerList.length:0,desc};
    }
    if(rule.formula==='presbyterian2027'){
      const period=s=>s.grade<3||(s.grade===3&&s.sem===1),areas=['국어','영어','수학','사회','과학'],thresholds=[4,11,23,40,60,77,89,96,100],band=p=>thresholds.findIndex(v=>p<=v)+1,conv=s=>{const a=percent(s.rateA),b=percent(s.rateB);if(a===null||b===null)return null;if(s.achv==='A')return (2+band(a))/2;if(s.achv==='B')return (band(a)+band(a+b))/2;return (band(a+b)+9)/2;},mapped=subjects.filter(s=>period(s)&&areas.includes(s.area)&&((isRankedType(s)&&rankOK(s))||(s.type==='career'&&achvOK(s)))).map(s=>({...s,convertedRank:s.type==='career'?conv(s):s.rank,isCareer:s.type==='career'}));if(mapped.some(s=>s.convertedRank===null))return{label:rule.label,unavailable:true,reason:'장로회신학대 진로선택은 A/B 성취도 학생비율을 입력해야 합니다.'};let total=0,w=0,chosen=[];for(const year of [1,2,3]){const best=[];for(const area of ['국어','영어','수학']){const s=mapped.filter(x=>x.grade===year&&x.area===area).sort((a,b)=>a.convertedRank-b.convertedRank)[0];if(s)best.push(s);}const ss=mapped.filter(x=>x.grade===year&&['사회','과학'].includes(x.area)).sort((a,b)=>a.convertedRank-b.convertedRank)[0];if(ss)best.push(ss);if(!best.length)continue;const yg=best.reduce((a,s)=>a+Math.ceil(s.convertedRank),0)/best.length,weight=({1:.2,2:.4,3:.4})[year];total+=yg*weight;w+=weight;chosen.push(...best);}if(!chosen.length)return{label:rule.label,unavailable:true,reason:'학년별 국·영·수·사회(과학) 최고등급 과목을 입력해 주세요.'};const grade=total/w,score=672-grade*32;
      return{label:rule.label,score,maxScore:rule.maxScore,avgGrade:grade.toFixed(2),careerUsed:chosen.filter(s=>s.isCareer).length,desc:`학년별 국·영·수·사회(과학) 최고과목을 20:40:40 반영 · 진로 분포비율 변환등급 올림 → ${grade.toFixed(3)}등급, 672−32×등급`};
    }
    if(rule.formula==='jeonju2027'){
      const period=s=>s.grade<3||(s.grade===3&&s.sem===1),areas=['국어','영어','수학','사회','과학','한국사'],normal=common.filter(s=>period(s)&&areas.includes(s.area)),areaStats=areas.map(area=>{const list=normal.filter(s=>s.area===area),units=list.reduce((a,s)=>a+credit(s),0);return{area,list,units,grade:units?list.reduce((a,s)=>a+s.rank*credit(s),0)/units:99};}).filter(x=>x.units>=10).sort((a,b)=>a.grade-b.grade).slice(0,3),selected=(areaStats.length>=3?areaStats.flatMap(x=>x.list):normal);if(!selected.length)return{label:rule.label,unavailable:true,reason:'반영교과 석차등급과 이수단위를 입력해 주세요.'};const units=selected.reduce((a,s)=>a+credit(s),0),grade=selected.reduce((a,s)=>a+s.rank*credit(s),0)/units,commonScore=700+300*(10-grade)/9;if(rule.mode==='standard'){const top=career.filter(s=>period(s)&&areas.includes(s.area)).sort((a,b)=>({A:6,B:4,C:2})[b.achv]-({A:6,B:4,C:2})[a.achv]).slice(0,3),cu=top.reduce((a,s)=>a+credit(s),0),bonus=cu?top.reduce((a,s)=>a+({A:6,B:4,C:2})[s.achv]*credit(s),0)/cu:0;return{label:rule.label,score:commonScore+bonus,maxScore:rule.maxScore,avgGrade:grade.toFixed(2),careerUsed:top.length,careerBonus:bonus,desc:`이수단위 10 이상 우수3교과군 가중등급 ${grade.toFixed(3)} → 700+[300×(10−등급)÷9], 진로 상위3 가산 ${bonus.toFixed(2)}`};}const careers=career.filter(s=>period(s)&&areas.includes(s.area)&&percent(s.originalScore)!==null),cu=careers.reduce((a,s)=>a+credit(s),0),careerRaw=careers.length>=5?careers.reduce((a,s)=>a+s.originalScore*credit(s),0)/cu:null,careerScore=careerRaw===null?500:500+careerRaw*5,score=commonScore*.4+careerScore*.6;return{label:rule.label,score,maxScore:rule.maxScore,avgGrade:grade.toFixed(2),careerUsed:careers.length,desc:`보통교과 [700+300×(10−등급)÷9]×40% + 진로 [500+원점수평균×5]×60%${careerRaw===null?' (5과목 미만: 진로 기본500만 적용)':''}`};
    }
    if(rule.formula==='hankyong2027'){
      const period=s=>s.grade<3||(s.grade===3&&s.sem===1),normal=common.filter(period);if(!normal.length)return{label:rule.label,unavailable:true,reason:'석차등급이 있는 전 교과 과목과 이수단위를 입력해 주세요.'};const units=normal.reduce((a,s)=>a+credit(s),0),grade=normal.reduce((a,s)=>a+s.rank*credit(s),0)/units,score=(9-grade)/8*100;
      return{label:rule.label,score,maxScore:rule.maxScore,avgGrade:grade.toFixed(2),careerUsed:0,desc:`전 교과 이수단위 가중등급 ${grade.toFixed(3)}를 공식 선형식의 실질반영률 100점으로 정규화: (9−등급)÷8×100 · 진로 미반영`};
    }
    if(rule.formula==='howon2027'){
      const period=s=>s.grade<3||(s.grade===3&&s.sem===1),areas=['국어','영어','수학','사회','과학'],mapped=common.filter(s=>period(s)&&areas.includes(s.area)).map(s=>({...s,convertedRank:s.rank,isCareer:false})).concat(career.filter(s=>period(s)&&areas.includes(s.area)&&Number.isFinite(Number(s.rank))).map(s=>({...s,convertedRank:Number(s.rank),isCareer:true}))),year=[];for(const y of [1,2,3]){const list=mapped.filter(s=>s.grade===y);if(!list.length)continue;const units=list.reduce((a,s)=>a+credit(s),0);year.push({y,g:list.reduce((a,s)=>a+s.convertedRank*credit(s),0)/units,w:({1:.3,2:.4,3:.3})[y]});}if(!year.length)return{label:rule.label,unavailable:true,reason:'국어·영어·수학·사회·과학의 석차등급과 이수단위를 입력해 주세요.'};const w=year.reduce((a,x)=>a+x.w,0),grade=year.reduce((a,x)=>a+x.g*x.w,0)/w,band=Math.max(1,Math.min(9,Math.ceil(Math.round(grade*10)/10))),score=rule.points[band-1];
      return{label:rule.label,score,maxScore:rule.maxScore,avgGrade:grade.toFixed(2),careerUsed:mapped.filter(s=>s.isCareer).length,desc:`학년별 이수단위 가중등급을 30:40:30 반영, 소수 둘째자리 반올림 후 ${band}등급 공식표 적용`};
    }
    if(rule.formula==='gwangjuCatholic2027'){
      const period=s=>s.grade<3||(s.grade===3&&s.sem===1),mapped=subjects.filter(s=>period(s)&&((isRankedType(s)&&rankOK(s))||(s.type==='career'&&achvOK(s)))).map(s=>({...s,convertedRank:s.type==='career'?({A:1,B:3,C:5})[s.achv]:s.rank,isCareer:s.type==='career'}));if(!mapped.length)return{label:rule.label,unavailable:true,reason:'전 교과 석차등급 또는 진로선택 성취도를 입력해 주세요.'};const years=[];for(const y of [1,2,3]){const list=mapped.filter(s=>s.grade===y);if(!list.length)continue;const units=list.reduce((a,s)=>a+credit(s),0),g=list.reduce((a,s)=>a+s.convertedRank*credit(s),0)/units;years.push({y,g:Math.round(g),w:({1:.4,2:.3,3:.3})[y]});}const w=years.reduce((a,x)=>a+x.w,0),finalGrade=Math.max(1,Math.min(9,Math.round(years.reduce((a,x)=>a+x.g*x.w,0)/w))),score=rule.points[finalGrade-1];return{label:rule.label,score,maxScore:rule.maxScore,avgGrade:String(finalGrade),careerUsed:mapped.filter(s=>s.isCareer).length,desc:`학년별 이수단위 평균을 각각 반올림 후 40:30:30 반영·최종 반올림, ${finalGrade}등급 점수표 적용 · 진로 A1/B3/C5 환산`};
    }
    if(rule.formula==='gyeongguk2027'){
      const period=s=>s.grade<3||(s.grade===3&&s.sem===1),rankPts=[1,.875,.8125,.75,.6875,.625,.5,.25,0],core=common.filter(s=>period(s)&&['국어','수학','영어'].includes(s.area)).sort((a,b)=>rankPts[b.rank-1]-rankPts[a.rank-1]).slice(0,7),other=common.filter(s=>period(s)&&['사회','과학','한국사'].includes(s.area)).sort((a,b)=>rankPts[b.rank-1]-rankPts[a.rank-1]).slice(0,2),careerTop=career.filter(period).map(s=>({...s,point:({A:1,B:.875,C:.8125})[s.achv]})).sort((a,b)=>b.point-a.point).slice(0,3),selected=core.concat(other).concat(careerTop);if(!selected.length)return{label:rule.label,unavailable:true,reason:'국·수·영 상위7, 사·과·한국사 상위2 또는 진로 상위3 성적을 입력해 주세요.'};const units=selected.reduce((a,s)=>a+credit(s),0),aValue=selected.reduce((a,s)=>a+(s.type==='career'?s.point:rankPts[s.rank-1])*credit(s),0)/units,score=rule.base+rule.real*aValue;return{label:rule.label,score,maxScore:rule.maxScore,avgGrade:(10-9*aValue).toFixed(2),careerUsed:careerTop.length,desc:`국·수·영 상위${core.length}/7 + 사·과·한국사 상위${other.length}/2 + 진로 상위${careerTop.length}/3(A1/B2/C3 환산), A값 ${aValue.toFixed(6)} → ${rule.base}+${rule.real}×A`};
    }
    if(rule.formula==='chungwoon2027'){
      const period=s=>s.grade<3||(s.grade===3&&s.sem===1),areas=['국어','수학','영어','사회','과학'],point=s=>s.type==='career'?({A:8,B:6,C:4})[s.achv]:10-s.rank,selected=[];for(const y of [1,2,3])for(const sem of [1,2]){if((y===3&&sem===2)||(rule.semesterLimit===4&&y===3))continue;const areaBest=areas.map(area=>subjects.filter(s=>period(s)&&s.grade===y&&s.sem===sem&&s.area===area&&((isRankedType(s)&&rankOK(s))||(s.type==='career'&&achvOK(s)))).sort((a,b)=>point(b)-point(a))[0]).filter(Boolean);selected.push(...areaBest.sort((a,b)=>point(b)-point(a)).slice(0,3));}if(!selected.length)return{label:rule.label,unavailable:true,reason:'학기별 국·수·영·사·과 성적을 입력해 주세요.'};const avgPoint=selected.reduce((a,s)=>a+point(s),0)/selected.length,score=avgPoint/9*100;return{label:rule.label,score,maxScore:rule.maxScore,avgGrade:(10-avgPoint).toFixed(2),careerUsed:selected.filter(s=>s.type==='career').length,desc:`각 학기 교과별 최고1과목 중 상위3과목, 총 ${selected.length}/${rule.semesterLimit*3}과목 · 등급점수 9~1/진로 A8·B6·C4의 공식 백분율 ${score.toFixed(3)}`};
    }
    if(rule.formula==='cheongju2027'){
      const period=s=>s.grade<3||(s.grade===3&&s.sem===1),z=s=>Math.max(0,Math.min(100,12*((s.originalScore-s.subjectMean)/s.standardDeviation)+75)),valid=common.filter(s=>period(s)&&credit(s)>=2&&percent(s.originalScore)!==null&&percent(s.subjectMean)!==null&&percent(s.standardDeviation)>0),pick=area=>valid.filter(s=>area.includes(s.area)).sort((a,b)=>z(b)-z(a)).slice(0,2),selected=pick(['국어']).concat(pick(['영어']),pick(['수학']),pick(['사회','과학','제2외국어','한문']));if(selected.length<8)return{label:rule.label,unavailable:true,reason:`청주대는 이수단위 2 이상이며 원점수·과목평균·표준편차가 있는 국2·영2·수2·사/과/제2외국어/한문2가 필요합니다. 현재 ${selected.length}/8과목입니다.`};const avg=selected.reduce((a,s)=>a+z(s),0)/8,bonus=rule.careerBonus?career.filter(s=>period(s)&&credit(s)>=2&&s.achv==='A'&&['국어','영어','수학','사회','과학','제2외국어','한문'].includes(s.area)).length*2:0,score=Math.min(rule.maxScore,avg*10*rule.factor+bonus);return{label:rule.label,score,maxScore:rule.maxScore,avgGrade:`표준점수 ${avg.toFixed(2)}`,careerUsed:rule.careerBonus?bonus/2:0,careerBonus:bonus,desc:`국2·영2·수2·사/과/제2외국어/한문2 표준점수 평균 ${avg.toFixed(4)}×10×${rule.factor}${rule.careerBonus?` + 진로A ${bonus/2}과목×2점`:''}`};
    }
    if(rule.formula==='hufs2027'){
      const period=s=>s.grade<3||(s.grade===3&&s.sem===1),areas=['국어','수학','영어','사회','과학','한국사'],rankPts=[1000,960,890,770,600,400,230,110,0],normal=common.filter(s=>period(s)&&areas.includes(s.area)).map(s=>({...s,point:Math.max(rankPts[s.rank-1],percent(s.originalScore)===null?0:s.originalScore*10)})),careerList=career.filter(s=>period(s)&&areas.includes(s.area)).map(s=>({...s,point:({A:1000,B:960,C:890})[s.achv]})),selected=normal.concat(careerList);if(!selected.length)return{label:rule.label,unavailable:true,reason:'국·수·영·사·과·한국사의 등급/원점수 또는 진로 성취도를 입력해 주세요.'};const units=selected.reduce((a,s)=>a+credit(s),0),score=Math.floor(selected.reduce((a,s)=>a+s.point*credit(s),0)/units*1e6)/1e6;return{label:rule.label,score,maxScore:rule.maxScore,avgGrade:(10-score/100).toFixed(2),careerUsed:careerList.length,desc:`공통·일반은 등급환산점수와 원점수×10 중 높은 값, 진로 A1000/B960/C890을 이수단위 가중평균 후 소수 6자리 미만 절사`};
    }
    const ranked = [...common].sort((a,b) => a.rank - b.rank).slice(0, rule.commonTop);
    const careerPicked = [...career].sort((a,b) => rule.achievementPoints[a.achv] - rule.achievementPoints[b.achv]).reverse().slice(0, rule.careerMax);
    const scored = ranked.map(s => rule.rankPoints[s.rank - 1]).concat(careerPicked.map(s => rule.achievementPoints[s.achv]));
    if (!scored.length) return { label: rule.label, unavailable: true, reason: '이 전형의 반영 과목(석차등급 또는 진로 성취도)을 입력해 주세요.' };
    const avgGrade = ranked.length ? (ranked.reduce((a,s) => a+s.rank, 0) / ranked.length).toFixed(2) : '-';
    return { label: rule.label, score: scored.reduce((a,v)=>a+v,0), maxScore: (rule.commonTop ? rule.commonTop * rule.rankPoints[0] : 0) + rule.careerMax * Math.max(...Object.values(rule.achievementPoints)), avgGrade, desc: `석차등급 ${ranked.length}과목 + 진로 성취도 ${careerPicked.length}과목의 공개 점수 합산` };
  });
}

function calculateAll() {
  const tb=document.getElementById('resultTbody'); if(!tb)return;
  if(!selectedUniNames.size){tb.innerHTML='<tr><td colspan="7" style="text-align:center;padding:32px;color:var(--text-muted);">대학을 검색하여 추가하면 ADIGA 공식 기준 기반 비교 결과가 표시됩니다.</td></tr>';return;}
  const rows=[];
  for(const name of selectedUniNames){const u=ADIGA_2027_UNIVERSITIES.find(x=>x.name===name); rows.push(`<tr class="uni-separator-row"><td colspan="7"><span class="uni-name-badge">${esc(u.name)}</span><span class="uni-track-count">ADIGA/대학 공식 2027 기준</span></td></tr>`); const manual=calcManualRules(u); if(manual){manual.forEach(r=>rows.push(r.unavailable?`<tr><td>${esc(r.label)}</td><td colspan="5"><em>입력 필요 — ${esc(r.reason)}</em></td><td><a href="${esc(u.sourceUrl)}" target="_blank">공식 기준 확인</a></td></tr>`:`<tr class="track-row"><td>${esc(r.label)}</td><td class="score-cell">${r.score!==null?`<strong>${r.score.toFixed(2)}</strong>`:'<em>공개 점수표 없음</em>'}</td><td class="grade-cell">${Number.isFinite(r.comparisonGrade)?`<strong>${r.comparisonGrade.toFixed(2)}등급</strong><br><small>비교환산</small>`:(r.careerBonus !== undefined || r.careerUsed !== undefined ? '공식 산식 적용' : '공개 점수 합산')}</td><td class="max-cell">${r.maxScore}</td><td class="avg-grade-cell">${r.avgGrade}</td><td class="career-cell">${r.careerBonus !== undefined ? `진로 가산점 +${r.careerBonus.toFixed(2)}` : r.careerUsed !== undefined ? `진로 환산 ${r.careerUsed}과목 반영` : '진로 A/B/C 점수 반영'}</td><td class="desc-cell">${esc(r.desc)}<br><a href="${esc(u.sourceUrl)}" target="_blank">공식 원문 보기</a></td></tr>`));continue;} const r=calcUniversity(u); if(r.qualitative){rows.push(`<tr><td>학생부 정성평가</td><td colspan="5"><strong>수치 환산 없음</strong> — ${esc(r.reason)}</td><td><a href="${esc(u.sourceUrl)}" target="_blank" rel="noopener">공식 기준 확인</a></td></tr>`);continue;} if(r.unavailable){rows.push(`<tr><td>교과영역 평가</td><td colspan="5"><em>공식자료 추가 확인 중 — ${esc(r.reason)}</em></td><td><a href="${esc(u.sourceUrl)}" target="_blank" rel="noopener">공식 기준 확인</a></td></tr>`);continue;} rows.push(`<tr class="track-row"><td>학생부교과 공통 기준</td><td class="score-cell">${r.score!==null?`<strong>${r.score.toFixed(2)}</strong>`:'<em>점수표 미공개</em>'}</td><td class="grade-cell"><strong>${r.grade.toFixed(2)}등급</strong><br><small>비교등급</small></td><td class="max-cell">${u.gradeTable?.[0]??'-'}</td><td class="avg-grade-cell">${r.grade.toFixed(2)}</td><td class="career-cell">${esc(r.careerInfo)}</td><td class="desc-cell">${esc(`반영 ${r.selected.length}과목 · ${u.commonAreas.join('·')} / ${r.reason}`)}<br><a href="${esc(u.sourceUrl)}" target="_blank" rel="noopener">ADIGA 원문 보기</a></td></tr>`);}
  tb.innerHTML=rows.join('');
}

function loadSample(type) {
  subjects = [];
  const nature = [
    [1,1,'국어','공통국어',4,3],[1,1,'수학','공통수학',4,2],[1,1,'영어','공통영어',4,3],[1,1,'과학','통합과학',3,2],[1,1,'사회','통합사회',3,3],[1,1,'한국사','한국사',3,3],
    [1,2,'국어','공통국어',4,3],[1,2,'수학','공통수학',4,2],[1,2,'영어','공통영어',4,3],[1,2,'과학','통합과학',3,3],[1,2,'사회','통합사회',3,3],[1,2,'한국사','한국사',3,2],
    [2,1,'국어','문학',4,3],[2,1,'수학','대수',4,2],[2,1,'영어','영어Ⅰ',4,3],[2,1,'과학','물리학Ⅰ',3,2],[2,1,'과학','화학Ⅰ',3,3],[2,1,'한국사','한국사',3,2],
    [2,2,'국어','독서',4,3],[2,2,'수학','미적분Ⅰ',4,2],[2,2,'영어','영어Ⅱ',4,3],[2,2,'과학','생명과학Ⅰ',3,3],[2,2,'과학','지구과학Ⅰ',3,3],[2,2,'사회','생활과 윤리',3,3],
    [3,1,'국어','화법과 언어',4,2],[3,1,'수학','미적분Ⅱ',4,2],[3,1,'영어','심화영어',4,3],[3,1,'과학','물리학Ⅱ',3,2],[3,1,'과학','화학Ⅱ',3,2],
    [3,1,'과학','과학과제 연구',3,'A','career'],[3,1,'수학','인공지능 수학',3,'A','career']
  ];
  const human = [
    [1,1,'국어','공통국어',4,2],[1,1,'수학','공통수학',4,4],[1,1,'영어','공통영어',4,3],[1,1,'사회','통합사회',3,2],[1,1,'과학','통합과학',3,3],[1,1,'한국사','한국사',3,3],
    [1,2,'국어','공통국어',4,3],[1,2,'수학','공통수학',4,4],[1,2,'영어','공통영어',4,3],[1,2,'사회','통합사회',3,2],[1,2,'과학','통합과학',3,3],[1,2,'한국사','한국사',3,2],
    [2,1,'국어','문학',4,2],[2,1,'수학','확률과 통계',4,4],[2,1,'영어','영어Ⅰ',4,3],[2,1,'사회','생활과 윤리',3,2],[2,1,'사회','사회·문화',3,3],[2,1,'한국사','한국사',3,2],
    [2,2,'국어','독서',4,2],[2,2,'수학','확률과 통계',4,4],[2,2,'영어','영어Ⅱ',4,3],[2,2,'사회','정치와 법',3,2],[2,2,'사회','세계지리',3,3],[2,2,'과학','생활과 과학',3,3],
    [3,1,'국어','화법과 작문',4,2],[3,1,'수학','경제수학',3,3],[3,1,'영어','심화영어',4,3],[3,1,'사회','윤리와 사상',3,2],[3,1,'사회','동아시아사',3,2],
    [3,1,'사회','사회문제 탐구',3,'A','career'],[3,1,'국어','매체 의사소통',3,'A','career']
  ];
  (type === 'nature' ? nature : human).forEach(([grade, sem, area, name, cr, result, kind]) => {
    const subjectType = kind || (grade === 1 ? 'common' : 'general');
    addSubject({grade, sem, area, name, credit:cr, type:subjectType, rank:kind ? null : result, achv:kind ? result : '',originalScore:kind?90:Math.max(55,100-Number(result)*5),subjectMean:75,standardDeviation:kind?null:10,classSize:30,rateA:kind?20:null,rateB:kind?50:null,rateC:kind?30:null}, false);
  });
  renderSubjects(); calculateAll();
}
function saveToLocalStorage(){try{localStorage.setItem(STORAGE_KEY,JSON.stringify(subjects));alert('이 브라우저에 성적을 저장했습니다.');}catch(e){alert('저장하지 못했습니다.');}}
function loadSaved(){try{const d=JSON.parse(localStorage.getItem(STORAGE_KEY)||'[]');if(Array.isArray(d)&&d.length){subjects=[];d.forEach(x=>addSubject(x,false));renderSubjects();return true;}}catch(e){}return false;}
function scrollToSec(id){document.getElementById(id)?.scrollIntoView({behavior:'smooth'});}
function closeModal(){document.getElementById('detailModal')?.classList.remove('open');}

function downloadExcelTemplate(){const a=document.createElement('a');a.href='./2027_내신성적입력양식.xlsx';a.download='2027_내신성적입력양식.xlsx';document.body.appendChild(a);a.click();a.remove();}
function handleExcelUpload(e){const f=e.target.files?.[0];if(f)readExcel(f);}
function handleDropzoneDragOver(e){e.preventDefault();document.getElementById('excelDropzone').classList.add('dragover');}
function handleDropzoneDragLeave(){document.getElementById('excelDropzone').classList.remove('dragover');}
function handleDropzoneDrop(e){e.preventDefault();document.getElementById('excelDropzone').classList.remove('dragover');const f=e.dataTransfer.files?.[0];if(f)readExcel(f);}
function readExcel(file){if(!window.XLSX)return alert('엑셀 기능을 불러오지 못했습니다.');const reader=new FileReader();reader.onload=ev=>{try{const wb=XLSX.read(ev.target.result,{type:'array'});const rows=XLSX.utils.sheet_to_json(wb.Sheets[wb.SheetNames[0]],{defval:''});if(!rows.length)throw new Error();subjects=[];rows.forEach(r=>{const label=String(r['과목구분']);const type=label.includes('진로')?'career':label.includes('일반')?'general':'common';addSubject({grade:r['학년'],sem:r['학기'],area:r['교과영역'],name:r['과목명'],type,credit:r['이수단위'],rank:r['석차등급'],achv:r['성취도(A/B/C)'],originalScore:r['원점수'],subjectMean:r['과목평균'],standardDeviation:r['표준편차'],classSize:r['수강자수'],rateA:r['A비율(%)'],rateB:r['B비율(%)'],rateC:r['C비율(%)']},false)});renderSubjects();calculateAll();document.getElementById('dzFilename').textContent=`${file.name} · ${rows.length}과목 적용 완료`;}catch(err){alert('양식을 확인할 수 없습니다. 내려받은 표준 양식을 사용해 주세요.');}};reader.readAsArrayBuffer(file);}

document.addEventListener('DOMContentLoaded',()=>{if(!loadSaved())clearSubjects(); else calculateAll(); initUniversityDatalist(); renderSelectedUnisBar();});
