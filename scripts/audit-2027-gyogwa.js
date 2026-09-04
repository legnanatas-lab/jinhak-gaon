#!/usr/bin/env node
/* 2027 ADIGA 교과환산 규칙 전수 점검: node scripts/audit-2027-gyogwa.js */
const fs = require('fs');
const path = require('path');
const vm = require('vm');

const root = path.resolve(__dirname, '..');
const read = file => fs.readFileSync(path.join(root, file), 'utf8');
const context = {
  console,
  window: {},
  document: { addEventListener() {}, getElementById() { return null; } }
};
vm.createContext(context);
vm.runInContext(`${read('assets/js/2027-adiga-rules.js')}; globalThis.auditRules = ADIGA_2027_UNIVERSITIES;`, context);
vm.runInContext(read('assets/js/2027-adiga-manual-rules.js'), context);
vm.runInContext(`${read('assets/js/2027-gyogwa-calculator.js')}; globalThis.runManualAudit = (items, university) => { subjects = items; return calcManualRules(university); };`, context);

const problems = [];
const universities = context.auditRules;
const areas = ['국어', '수학', '영어', '사회', '과학', '한국사', '기술·가정', '제2외국어', '한문', '체육', '예술'];
const formulaHandlers = new Set([...read('assets/js/2027-gyogwa-calculator.js').matchAll(/rule\.formula\s*===\s*'([^']+)'/g)].map(match => match[1]));
const universityOfficialOverrides = new Set(['0000073', '0000222', '0000153', '0003193', '0003194', '0000218', '0000219', '0000177', '0000260', '0000262', '0000188', '0000206']);

function sample({ includeNormal = true, includeCareer = true } = {}) {
  let id = 1;
  const subjects = [];
  for (const grade of [1, 2, 3]) for (const sem of [1, 2]) for (const area of areas) {
    if (includeNormal) subjects.push({
      id: id++, grade, sem, area, type: grade === 1 ? 'common' : 'general', credit: 3, rank: 3,
      achv: '', originalScore: 88, subjectMean: 75, standardDeviation: 10, classSize: 30, rateA: 20, rateB: 50, rateC: 30
    });
    if (includeCareer) subjects.push({
      id: id++, grade, sem, area, type: 'career', credit: 3, rank: null,
      achv: 'A', originalScore: 92, subjectMean: 75, standardDeviation: null, classSize: null, rateA: 20, rateB: 50, rateC: 30
    });
  }
  return subjects;
}

for (const university of universities) {
  const isAdigaSource = /^https:\/\/www\.adiga\.kr\/ucp\/uvt\/uni\/univDetailSelection\.do\?/.test(university.sourceUrl || '') && university.sourceUrl.includes('searchSyr=2027');
  const isVerifiedUniversitySource = universityOfficialOverrides.has(university.code) && /^https:\/\//.test(university.sourceUrl || '');
  if (!isAdigaSource && !isVerifiedUniversitySource) {
    problems.push(`${university.name}: 검증된 2027 원문 URL 누락`);
  }
  for (const rule of Object.values(university.manualRules || {})) {
    if (!rule.label || !rule.formula || !formulaHandlers.has(rule.formula)) problems.push(`${university.name}: 계산 규칙 정의 누락`);
  }
}

for (const [scenario, input] of Object.entries({ all: sample(), normal: sample({ includeCareer: false }), career: sample({ includeNormal: false }) })) {
  for (const university of universities.filter(item => item.manualRules)) {
    try {
      const results = context.runManualAudit(input, university) || [];
      if (results.length !== Object.keys(university.manualRules).length) problems.push(`${university.name}: ${scenario} 결과 행 누락`);
      for (const result of results) {
        if (!result.unavailable && (!Number.isFinite(result.score) || result.maxScore === undefined || result.maxScore === null)) {
          problems.push(`${university.name} · ${result.label}: ${scenario} 산출값 오류`);
        }
      }
    } catch (error) {
      problems.push(`${university.name}: ${scenario} 실행 오류 (${error.message})`);
    }
  }
}

if (problems.length) {
  console.error(`교과환산 점검 실패 (${problems.length}건)`);
  console.error(problems.join('\n'));
  process.exit(1);
}

const ruleCount = universities.reduce((count, university) => count + Object.keys(university.manualRules || {}).length, 0);
console.log(`교과환산 점검 통과: ${universities.length}개 대학 · ${ruleCount}개 전형/계열 규칙`);
