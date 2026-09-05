const fs = require('node:fs');
const vm = require('node:vm');
const cp = require('node:child_process');
const assert = require('node:assert/strict');
process.chdir(require('node:path').join(__dirname, '..'));
const records = JSON.parse(fs.readFileSync('data/admission-data.json')).records;
function audit(code) {
  const c = vm.createContext({window: {}, console});
  vm.runInContext(fs.readFileSync('data/susi-2027-plan.js', 'utf8'), c);
  vm.runInContext(code.replace(/init\(\);\s*$/, ''), c);
  c.source = fs.readFileSync('2027-susi-admissions.html', 'utf8');
  c.records = records;
  vm.runInContext(`parseEmbeddedSusiSource(source).universities.forEach(u => {
    extractSourcePlans(u); extractSourcePlanLists(u); extractProgramChanges(u);
  }); PLAN2027_SOURCE_READY = true;`, c);
  return {c, results: vm.runInContext('records.map(r => findPlansForRecord(r))', c)};
}
const before = audit(cp.execFileSync('git', ['show', '935ff1f:app.js'], {encoding:'utf8'}));
const after = audit(fs.readFileSync('app.js','utf8'));
const recovered = records.filter((r,i) => !before.results[i].length && after.results[i].length);
const regressed = records.filter((r,i) => before.results[i].length && !after.results[i].length);
assert.equal(regressed.length, 0, 'Previously linked records must remain linked');
const counts = rows => Object.entries(rows.reduce((a,r) => {a[r.university]=(a[r.university]||0)+1;return a;}, {})).sort((a,b)=>b[1]-a[1]);
const report = {total:records.length, beforeMissing:before.results.filter(x=>!x.length).length,
  afterMissing:after.results.filter(x=>!x.length).length, recovered: counts(recovered),
  remaining: counts(records.filter((r,i)=>!after.results[i].length)),
  seoulTech: records.flatMap((r,i)=>r.university==='서울과기대'?[{major:r.major,count:after.results[i].length}]:[])
};
fs.writeFileSync('/tmp/gaon-plan-link-audit.json', JSON.stringify({...report,
  recoveredDetails: records.flatMap((r,i)=>!before.results[i].length && after.results[i].length ? [{university:r.university,major:r.major,plans:after.results[i].map(p=>({major:p.m,program:p.p,count:p.n}))}]:[]),
  missingDetails:records.filter((r,i)=>!after.results[i].length).map(r=>({university:r.university,major:r.major}))
},null,2));
console.log(JSON.stringify(report,null,2));
for (const name of ['서울과학기술대','서울과학기술대학','서울과학기술대학교']) {
  after.c.name = name;
  assert.equal(vm.runInContext('baseUniName(name)',after.c),'서울과기대');
}
for (const major of ['인공지능응용학과','지능형반도체공학과','기계시스템공학부 지능형로봇전공','미래에너지융합학과','스마트ICT융합공학과']) {
  const index = records.findIndex(r=>r.university==='서울과기대' && r.major===major);
  assert(after.results[index].length > 0);
  assert(after.results[index].every(p=>!p.m.includes('자유전공')), 'Do not substitute unified totals');
}
