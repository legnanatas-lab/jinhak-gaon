
(function () {
  function start() {
    if (!window.__GAONGIL_GOSA_2027_DB__) return false;
    const DB = window.__GAONGIL_GOSA_2027_DB__;
/* ───────── 데이터 전개 ───────── */
const E = DB.events.map((a, i) => ({ i, u: a[0], t: a[1], st: a[2], d1: a[3], d2: a[4], p: a[5], m: a[6], app: a[7], ann: a[8], os: a[9], c: a[10] }));
const UNIS = DB.unis.map((a, i) => ({ i, full: a[0], short: a[1], region: a[2], multi: a[3], disp: a[3] ? a[0] : a[1] }));
const TY = ["논술", "면접", "실기"];
const CATS = ["학생부교과", "학생부종합", "논술위주", "실기/실적위주", "기타"];
const CAT_OF = { "학생부위주(교과)": 0, "학생부위주(종합)": 1, "논술위주": 2, "실기/실적위주": 3 };
const PATHS = DB.paths.map((p, i) => {
  const segs = p.split(" > ");
  return { i, full: p, cat: CAT_OF[segs[0]] ?? 4, name: segs[segs.length - 1] };
});

/* ───────── 날짜 유틸 (전 일정이 2026년) ───────── */
const Y = DB.meta.year, SUN = DB.meta.suneung, HOL = DB.meta.holidays;
const WD = ["일", "월", "화", "수", "목", "금", "토"];
const dObj = n => new Date(Y, (n / 100 | 0) - 1, n % 100);
const dow = n => dObj(n).getDay();
const fmtMD = n => `${n / 100 | 0}/${n % 100}`;
const fmtMDW = n => `${fmtMD(n)}(${WD[dow(n)]})`;
const nextDay = n => { const d = dObj(n); d.setDate(d.getDate() + 1); return (d.getMonth() + 1) * 100 + d.getDate(); };
const eachDay = (a, b, f) => { let c = a, g = 0; while (c <= b && g++ < 200) { f(c); c = nextDay(c); } };
const isHol = n => !!HOL[n];
const csatDiff = n => Math.round((dObj(n) - dObj(SUN)) / 864e5);
const csatLabel = n => { const d = csatDiff(n); return d === 0 ? "수능일" : d < 0 ? `수능 D${d}` : `수능 D+${d}`; };

/* ───────── 상태 ───────── */
const now = new Date();
const S = {
  view: "cal",
  types: new Set([0, 1, 2]), cat: "", regions: new Set(), csat: "", weekend: false, q: "",
  month: now.getFullYear() === Y ? Math.min(Math.max(now.getMonth() + 1, 9), 12) : 9,
  selDay: null, selUni: null, uq: "", csq: "", csUni: null,
  sort: ["d", 1],
};

/* ───────── 필터 ───────── */
const nq = s => s.replace(/\s+/g, "").toLowerCase();
function pass(e) {
  if (!S.types.has(e.t)) return false;
  if (S.cat !== "" && PATHS[e.p].cat !== +S.cat) return false;
  if (S.regions.size && !S.regions.has(UNIS[e.u].region)) return false;
  if (S.csat === "pre" && e.d1 >= SUN) return false;
  if (S.csat === "post" && e.d1 < SUN) return false;
  if (S.weekend) {
    let hit = false;
    eachDay(e.d1, e.d2, d => { const w = dow(d); if (w === 0 || w === 6 || isHol(d)) hit = true; });
    if (!hit) return false;
  }
  if (S.q) {
    const q = nq(S.q), u = UNIS[e.u];
    if (!(nq(u.full).includes(q) || nq(u.short).includes(q) || nq(PATHS[e.p].full).includes(q)
      || e.m.some(mi => nq(DB.units[mi]).includes(q)))) return false;
  }
  return true;
}
let F = [], FDAYS = new Map();
function refilter() {
  F = E.filter(pass);
  FDAYS = new Map();
  F.forEach(e => eachDay(e.d1, e.d2, d => { if (!FDAYS.has(d)) FDAYS.set(d, []); FDAYS.get(d).push(e.i); }));
}
function typeCounts() {
  const saved = S.types; S.types = new Set([0, 1, 2]);
  const c = [0, 0, 0]; E.forEach(e => { if (pass(e)) c[e.t]++; });
  S.types = saved; return c;
}

/* ───────── 공용 헬퍼 ───────── */
const $ = s => document.querySelector(s);
const esc = s => String(s).replace(/[&<>"']/g, c => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));
const adigaURL = c => {
  const a = c.split(",");
  return "https://www.adiga.kr/ucp/prc/uni/admssUnivDetail.do?user=&cnrtYear=2026&unvCd=" + a[0]
    + "&comScsbjtCd=" + a[1] + "&slcnGroupCd=" + a[2] + "&rcmtMmntCd=20&ruCd=" + a[3] + "&ruSn=" + a[4]
    + "&lclsfAftCd=" + a[5] + "&slcnTypeCd=" + a[6] + "&slcnCd=" + a[7]
    + "&unvSeCd=10&menuId=PCPRCINF2000&searchSyr=2027&searchRdoLwacst=&leftLevelText=1&rightLevelText=9";
};
function toast(msg) {
  let t = $("#toast");
  if (!t) { t = document.createElement("div"); t.id = "toast"; t.style.cssText = "position:fixed;bottom:24px;left:50%;transform:translateX(-50%);background:#26251F;color:#fff;padding:9px 18px;border-radius:9px;font-size:13px;z-index:99;transition:opacity .3s"; document.body.appendChild(t); }
  t.textContent = msg; t.style.opacity = "1";
  clearTimeout(t._h); t._h = setTimeout(() => { t.style.opacity = "0"; }, 2200);
}

/* ───────── 상담 모드 저장소 ───────── */
let CS;
try { CS = JSON.parse(localStorage.getItem("gosa2027_counsel") || "null"); } catch (e) { CS = null; }
if (!CS || !Array.isArray(CS.students) || !CS.students.length) CS = { cur: 0, students: [{ name: "학생 1", picks: [] }] };
if (CS.cur >= CS.students.length) CS.cur = 0;
const saveCS = () => { try { localStorage.setItem("gosa2027_counsel", JSON.stringify(CS)); } catch (e) { } };
const curStu = () => CS.students[CS.cur];
function linkedSt2(e) {
  if (e.st !== 1) return [];
  return E.filter(x => x.u === e.u && x.p === e.p && x.t === e.t && x.st === 2 && x.m.some(mi => e.m.includes(mi)));
}
function addPick(ei) {
  let e = E[ei];
  if (e.st === 2) { const s1 = E.find(x => x.u === e.u && x.p === e.p && x.t === e.t && x.st === 1 && x.m.some(mi => e.m.includes(mi))); if (s1) e = s1; }
  const st = curStu();
  if (st.picks.some(p => p.e === e.i)) { toast("이미 담긴 전형입니다"); return; }
  st.picks.push({ e: e.i, memo: "" });
  saveCS();
  toast(`[${st.name}] ${UNIS[e.u].disp} ${PATHS[e.p].name} 담음 (${st.picks.length}개)`);
  if (S.view === "counsel") renderCounsel();
}

/* ───────── 뷰 전환/라우팅 ───────── */
let hashLock = false;
function setView(v, push = true) {
  S.view = v;
  document.querySelectorAll(".tabs button").forEach(b => b.classList.toggle("on", b.dataset.v === v));
  document.querySelectorAll(".view").forEach(s => s.classList.toggle("on", s.id === "v-" + v));
  if (push) { hashLock = true; location.hash = v === "cal" ? "cal/" + S.month : v; setTimeout(() => hashLock = false, 0); }
  renderView();
}
function parseHash() {
  if (hashLock) return;
  const h = location.hash.slice(1).split("/");
  if (!h[0]) return;
  if (h[0] === "cal") { if (+h[1] >= 9 && +h[1] <= 12) S.month = +h[1]; setView("cal", false); }
  else if (["uni", "counsel", "list"].includes(h[0])) {
    if (h[0] === "uni" && h[1] !== undefined && UNIS[+h[1]]) S.selUni = +h[1];
    setView(h[0], false);
  }
}
function renderView() {
  ({ cal: renderCal, uni: renderUni, counsel: renderCounsel, list: renderList })[S.view]();
}
function update() { refilter(); renderFilterUI(); renderView(); }

/* ───────── 필터바 UI ───────── */
const REG_ORDER = ["서울", "인천", "경기", "강원", "대전", "세종", "충남", "충북", "광주", "전남", "전북", "대구", "경북", "부산", "울산", "경남", "제주"];
const REGIONS = REG_ORDER.filter(r => UNIS.some(u => u.region === r));
function initRegions() {
  $("#regChecks").innerHTML = REGIONS.map(r =>
    `<label><input type="checkbox" data-reg="${r}">${r}</label>`).join("");
}
function renderFilterUI() {
  const tc = typeCounts();
  for (let t = 0; t < 3; t++) {
    $("#tn" + t).textContent = tc[t];
    document.querySelector(`.chip.t${t}`).classList.toggle("on", S.types.has(t));
  }
  const weekendChip = document.querySelector(".chip.flag");
  weekendChip.classList.toggle("on", S.weekend);
  weekendChip.setAttribute("aria-pressed", S.weekend ? "true" : "false");
  $("#regBtn").textContent = (S.regions.size ? [...S.regions].join("·") : "지역 전체") + " ▾";
  document.querySelectorAll("#regChecks input").forEach(c => c.checked = S.regions.has(c.dataset.reg));
  const us = new Set(F.map(e => UNIS[e.u].short));
  $("#fCnt").innerHTML = `일정 <b>${F.length}</b>건 · ${us.size}개교${S.weekend ? ' · <span class="filter-note">주말·휴일 일정만 표시</span>' : ""}`;
}
function resetFilters() {
  S.types = new Set([0, 1, 2]); S.cat = ""; S.regions = new Set(); S.csat = ""; S.weekend = false; S.q = "";
  $("#fCat").value = ""; $("#fCsat").value = ""; $("#fQ").value = "";
  update();
}

/* ───────── 전체 일자 인덱스(필터 무관, 숨김 건수 안내용) ───────── */
const DAYS_ALL = new Map();
E.forEach(e => eachDay(e.d1, e.d2, d => { if (!DAYS_ALL.has(d)) DAYS_ALL.set(d, []); DAYS_ALL.get(d).push(e.i); }));

/* ───────── 공용 이벤트 아이템 ───────── */
function evItemHTML(e, opts = {}) {
  const u = UNIS[e.u], P = PATHS[e.p];
  const tags = [`<span class="badge b-t${e.t}">${TY[e.t]}</span>`,
    `<span class="badge b-gray">${CATS[P.cat]}</span>`];
  if (e.st > 1) tags.push(`<span class="badge b-gray">${e.st}차</span>`);
  if (e.d1 !== e.d2) tags.push(`<span class="badge b-gray">기간 ${fmtMD(e.d1)}~${fmtMD(e.d2)}</span>`);
  tags.push(`<span class="badge ${e.d1 < SUN ? "b-acc" : "b-gray"}">${e.d1 < SUN ? "수능 전" : "수능 후"}</span>`);
  const dt = opts.showDate ? `<span style="font-weight:700;color:var(--acc);font-size:12.5px">${fmtMDW(e.d1)}${e.d1 !== e.d2 ? "~" + fmtMD(e.d2) : ""}</span>` : "";
  const un = opts.hideUni ? "" : `<span class="un">${esc(u.disp)}</span><span class="rg">${u.region}</span>`;
  return `<div class="ev" data-ei="${e.i}">
    <div class="ev-h" data-act="expand">${dt}${un}<span class="pn">${esc(P.name)}</span>
      <span class="mc">${e.m.length}개 단위 <span class="arrow">▼</span></span></div>
    <div class="ev-tags">${tags.join("")}</div>
    <div class="ev-d"></div></div>`;
}
function evDetailHTML(e) {
  const P = PATHS[e.p];
  const l2 = linkedSt2(e);
  const stPre = l2.length ? "1차 " : e.st === 2 ? "2차 " : "";
  const exam = `${stPre}${fmtMDW(e.d1)}${e.d1 !== e.d2 ? " ~ " + fmtMDW(e.d2) : ""}`
    + l2.map(x => ` · 2차 ${fmtMDW(x.d1)}${x.d1 !== x.d2 ? " ~ " + fmtMDW(x.d2) : ""}`).join("");
  const app = e.app ? `인터넷 ${fmtMD(e.app[0])}~${fmtMD(e.app[1])}` + (e.os ? ` · 현장 ${e.os}` : "") : "-";
  const ann = e.ann ? esc(e.ann) + (e.ann.includes(" / ") ? ' <span style="color:var(--tx3)">(모집단위별 상이)</span>' : "") : "-";
  return `<div class="row"><span class="lb">전형</span>${esc(P.full)}</div>
    <div class="row"><span class="lb">고사일</span><b>${exam}</b></div>
    <div class="row"><span class="lb">원서접수</span>${app}</div>
    <div class="row"><span class="lb">발표일</span>${ann}</div>
    <div class="row"><span class="lb">모집단위 ${e.m.length}</span>
      <div class="units">${e.m.map(mi => `<span>${esc(DB.units[mi])}</span>`).join("")}</div></div>
    <div class="acts"><a href="${adigaURL(e.c)}" target="_blank" rel="noopener">대입정보포털 상세 ↗</a>
      <button data-act="pick-add" data-ei="${e.i}">상담 모드에 담기 +</button></div>`;
}

/* ───────── 1. 월별 캘린더 ───────── */
function syncHash() { if (S.view === "cal") { hashLock = true; location.hash = "cal/" + S.month; setTimeout(() => hashLock = false, 0); } }
function renderCal() {
  $("#calTitle").textContent = `${Y}년 ${S.month}월`;
  const mCnt = [0, 0, 0, 0];
  F.forEach(e => { const m = (e.d1 / 100 | 0); if (m >= 9) mCnt[m - 9]++; });
  $("#monBtns").innerHTML = [9, 10, 11, 12].map(m =>
    `<button data-act="mon-set" data-m="${m}" class="${m === S.month ? "on" : ""}">${m}월 ${mCnt[m - 9]}</button>`).join("");
  const first = S.month * 100 + 1;
  let html = WD.map((w, i) => `<div class="gwd ${i === 0 ? "sun" : i === 6 ? "sat" : ""}">${w}</div>`).join("");
  for (let i = 0; i < dow(first); i++) html += `<div class="cell out"></div>`;
  for (let d = first; (d / 100 | 0) === S.month; d = nextDay(d)) {
    const ids = FDAYS.get(d) || [];
    const tot = ids.length;
    const tCnt = [0, 0, 0];
    ids.forEach(i => tCnt[E[i].t]++);
    const w = dow(d);
    const heat = tot >= 20 ? "h3" : tot >= 8 ? "h2" : tot >= 1 ? "h1" : "";
    const heatCell = heat ? "heat" + heat.slice(1) : "";
    const cls = ["cell", heatCell, w === 0 ? "sun" : "", w === 6 ? "sat" : "", isHol(d) ? "hol" : "", S.selDay === d ? "sel" : ""].join(" ");
    const tys = [0, 1, 2].filter(t => tCnt[t]).map(t => `<span class="c${t}">${TY[t]} ${tCnt[t]}</span>`).join("");
    html += `<div class="${cls}" data-act="day" data-d="${d}" ${d === SUN ? 'style="border-color:var(--red)"' : ""}>
      <span class="dn">${d % 100}</span>${isHol(d) ? `<span class="hnm">${HOL[d]}</span>` : ""}
      ${tot ? `<span class="tot ${heat}">${tot}</span>` : ""}
      <div class="tys">${tys}</div>
      ${d === SUN ? '<span class="sn">수능</span>' : ""}</div>`;
  }
  $("#calGrid").innerHTML = html;
  renderDay();
}
function renderDay() {
  const box = $("#dPane"), d = S.selDay;
  if (!d) { box.innerHTML = `<h3>일자 상세</h3><div class="dsub">왼쪽 달력에서 날짜를 클릭하면 그날의 대학별고사 일정이 표시됩니다.</div>
    <div class="note">진하게 표시된 날일수록 일정이 많은 날입니다. 필터로 유형·지역을 좁혀 보세요.</div>`; return; }
  const ids = (FDAYS.get(d) || []).slice();
  const hidden = (DAYS_ALL.get(d) || []).length - ids.length;
  const us = new Set(ids.map(i => UNIS[E[i].u].short));
  const badges = [];
  if (d === SUN) badges.push('<span class="badge b-red">수능일</span>');
  else badges.push(`<span class="badge ${d < SUN ? "b-acc" : "b-gray"}">${csatLabel(d)}</span>`);
  if (isHol(d)) badges.push(`<span class="badge b-hol">${HOL[d]}</span>`);
  let html = `<h3>${d / 100 | 0}월 ${d % 100}일 (${WD[dow(d)]}) ${badges.join(" ")}</h3>
    <div class="dsub">일정 <b>${ids.length}</b>건 · ${us.size}개교${hidden > 0 ? ` · <span style="color:var(--tx3)">필터로 ${hidden}건 숨김</span>` : ""}</div>`;
  if (DB.meta.appNet && d >= DB.meta.appNet[0] && d <= DB.meta.appNet[1])
    html += `<div class="note">수시 원서접수 기간(9/7~9/11, 대학별 상이)입니다.</div>`;
  if (d === SUN) html += `<div class="note" style="background:var(--redbg);color:var(--red)">2027학년도 수능 시행일입니다.</div>`;
  if (!ids.length) html += `<div class="hint" style="margin-top:8px">표시할 일정이 없습니다.</div>`;
  for (const t of [0, 1, 2]) {
    const sub = ids.filter(i => E[i].t === t).sort((a, b) => UNIS[E[a].u].disp.localeCompare(UNIS[E[b].u].disp, "ko"));
    if (!sub.length) continue;
    html += `<div class="tsec"><span class="badge b-t${t}">${TY[t]}</span><span class="n">${sub.length}건</span></div>`;
    html += sub.map(i => evItemHTML(E[i])).join("");
  }
  box.innerHTML = html;
}

/* ───────── 2. 대학별 일정 ───────── */
function renderUni() {
  const cnt = new Map();
  F.forEach(e => cnt.set(e.u, (cnt.get(e.u) || 0) + 1));
  const q = nq(S.uq || "");
  const lis = UNIS.filter(u => !q || nq(u.disp).includes(q) || nq(u.short).includes(q))
    .sort((a, b) => a.disp.localeCompare(b.disp, "ko"));
  $("#uList").innerHTML = lis.map(u => {
    const c = cnt.get(u.i) || 0;
    return `<li data-act="uni-sel" data-u="${u.i}" class="${S.selUni === u.i ? "sel" : ""}">
      <span class="nm">${esc(u.disp)}</span><span class="rg">${u.region}</span>
      <span class="ct" ${c ? "" : 'style="color:var(--tx3)"'}>${c}건</span></li>`;
  }).join("") || `<li><span class="rg">검색 결과 없음</span></li>`;
  renderUniDetail();
}
function renderUniDetail() {
  const box = $("#uDet");
  if (S.selUni === null) {
    box.innerHTML = `<h2 style="font-size:16px">대학을 선택하세요</h2>
      <div class="usub">왼쪽 목록에서 대학을 클릭하면 원서접수부터 고사일·발표까지 전형별 일정을 시간순으로 보여줍니다. 건수는 현재 필터 기준입니다.</div>`;
    return;
  }
  const u = UNIS[S.selUni];
  const evs = F.filter(e => e.u === u.i).sort((a, b) => a.d1 - b.d1 || a.t - b.t);
  const tCnt = [0, 0, 0];
  evs.forEach(e => tCnt[e.t]++);
  const apps = [...new Set(evs.filter(e => e.app).map(e => `${fmtMD(e.app[0])}~${fmtMD(e.app[1])}`))];
  const T0 = dObj(915), T1 = dObj(1215);
  const pos = d => ((dObj(d) - T0) / (T1 - T0) * 100).toFixed(2);
  const TYC = ["var(--t0)", "var(--t1)", "var(--t2)"];
  let strip = [1001, 1101, 1201].map(d => `<div class="mline" style="left:${pos(d)}%"></div><span class="mlb" style="left:${pos(d)}%">${d / 100 | 0}월</span>`).join("");
  strip += `<span class="mlb" style="left:0">9월</span><div class="sline" style="left:${pos(SUN)}%"></div>`;
  strip += evs.map(e => `<div class="dot" style="left:${pos(e.d1)}%;top:${15 + e.t * 12}px;background:${TYC[e.t]}" title="${esc(PATHS[e.p].name)} ${fmtMD(e.d1)}"></div>`).join("");
  box.innerHTML = `<h2>${esc(u.disp)} <span class="badge b-gray">${u.region}</span>${u.multi ? ' <span class="badge b-acc">복수 캠퍼스</span>' : ""}</h2>
    <div class="usub">현재 필터 기준 일정 ${evs.length}건 — <span style="color:var(--t0);font-weight:600">논술 ${tCnt[0]}</span> · <span style="color:var(--t1);font-weight:600">면접 ${tCnt[1]}</span> · <span style="color:var(--t2);font-weight:600">실기 ${tCnt[2]}</span>
      ${apps.length ? ` · 원서접수 ${apps.join(", ")}` : ""}</div>
    <div class="strip">${strip}</div>
    <div class="strip-cap">9/15~12/15 위치 표시 · 빨간 선 = 수능(11/19) · 점 위치: 위부터 논술/면접/실기</div>
    ${evs.length ? evs.map(e => evItemHTML(e, { showDate: true, hideUni: true })).join("") : '<div class="hint">현재 필터에 해당하는 일정이 없습니다. 필터를 초기화해 보세요.</div>'}`;
}

/* ───────── 3. 상담 모드 ───────── */
const PKC = ["#C2491F", "#5B54C7", "#15815F", "#B5851B", "#B23030", "#1B5FA8", "#6B6960", "#8A4FBF"];
const PKN = ["①", "②", "③", "④", "⑤", "⑥", "⑦", "⑧"];
function pickEvents(pk) { const e = E[pk.e]; return [e, ...linkedSt2(e)]; }
function renderCounsel() {
  $("#csStu").innerHTML = CS.students.map((s, i) =>
    `<option value="${i}" ${i === CS.cur ? "selected" : ""}>${esc(s.name)} (${s.picks.length})</option>`).join("");
  renderCsRes();
  renderCsSheet();
}
function renderCsRes() {
  const box = $("#csRes");
  if (S.csUni !== null) {
    const u = UNIS[S.csUni];
    const evs = E.filter(e => e.u === u.i && e.st === 1).sort((a, b) => a.d1 - b.d1 || a.t - b.t);
    box.innerHTML = `<div style="display:flex;align-items:center;gap:8px;margin-bottom:7px">
        <button data-act="cs-back" style="font-size:12px">← 다른 대학</button>
        <b>${esc(u.disp)}</b><span class="hint">${u.region} · 전형 일정 ${evs.length}건 (필터 무관 전체)</span></div>`
      + evs.map(e => {
        const l2 = linkedSt2(e);
        const units = e.m.slice(0, 2).map(mi => esc(DB.units[mi])).join(", ") + (e.m.length > 2 ? ` 외 ${e.m.length - 2}` : "");
        return `<div class="ev"><div class="ev-h" data-act="expand">
          <span class="badge b-t${e.t}">${TY[e.t]}</span>
          <span class="pn" style="color:var(--tx);font-weight:600">${esc(PATHS[e.p].name)}</span>
          <span style="font-size:12px;font-weight:700;color:var(--acc)">${fmtMDW(e.d1)}${e.d1 !== e.d2 ? "~" + fmtMD(e.d2) : ""}${l2.length ? " +2차" : ""}</span>
          <span class="mc">${units}</span>
          <button data-act="pick-add" data-ei="${e.i}" style="font-size:12px;padding:3px 9px;border-color:var(--acc);color:var(--acc)">담기 +</button></div>
          <div class="ev-d"></div></div>`;
      }).join("");
    return;
  }
  const q = nq(S.csq || "");
  if (!q) { box.innerHTML = '<div class="hint" style="margin-top:6px">예) "단국" 입력 → 단국대학교[본교] 선택 → 전형별 일정에서 담기</div>'; return; }
  const us = UNIS.filter(u => nq(u.disp).includes(q) || nq(u.short).includes(q)).slice(0, 14);
  const cnt = new Map(); E.forEach(e => cnt.set(e.u, (cnt.get(e.u) || 0) + 1));
  box.innerHTML = us.map(u => `<button data-act="cs-uni" data-u="${u.i}" style="display:block;width:100%;text-align:left;margin-top:5px">
    <b>${esc(u.disp)}</b> <span class="hint">${u.region} · ${cnt.get(u.i) || 0}건</span></button>`).join("")
    || '<div class="hint" style="margin-top:6px">검색 결과가 없습니다.</div>';
}
function renderCsSheet() {
  const box = $("#csSheet"), st = curStu();
  if (!st.picks.length) {
    box.innerHTML = `<div class="card"><b>${esc(st.name)}</b><div class="hint" style="margin-top:6px">
      아직 담은 전형이 없습니다. 왼쪽에서 대학을 검색해 담거나, 캘린더·대학별 탭의 일정 상세에서 "상담 모드에 담기"를 누르세요.</div></div>`;
    return;
  }
  const dmap = new Map();
  st.picks.forEach((pk, pi) => pickEvents(pk).forEach(e => eachDay(e.d1, e.d2, d => {
    if (!dmap.has(d)) dmap.set(d, new Set());
    dmap.get(d).add(pi);
  })));
  const confDays = [...dmap.entries()].filter(([d, s]) => s.size > 1).map(([d]) => d).sort((a, b) => a - b);
  let html = `<div class="card" style="border-left:4px solid var(--acc)">
    <div style="display:flex;align-items:baseline;gap:9px;flex-wrap:wrap">
      <b style="font-size:16px">${esc(st.name)} — 대학별고사 일정표</b>
      <span class="hint">전형 ${st.picks.length}개 담음 · 원서접수 9/7(월)~9/11(금) · 수능 11/19(목)</span></div>`;
  if (st.picks.length > 6) html += `<div class="conf" style="margin-top:8px">수시 지원은 6회 이내입니다. 현재 ${st.picks.length}개가 담겨 있습니다.</div>`;
  if (confDays.length) html += `<div class="conf" style="margin-top:8px"><b>같은 날 일정 ${confDays.length}일</b> — ${confDays.map(d => `${fmtMDW(d)} (${[...dmap.get(d)].map(pi => PKN[pi]).join("")})`).join(", ")}
    <div style="font-size:11.5px;margin-top:2px">고사 시간 정보가 없으므로 실제 충돌 여부는 반드시 각 대학 공지로 확인하세요.</div></div>`;
  html += "</div>";
  /* 픽 카드 */
  html += '<div class="picks" style="margin-top:10px">' + st.picks.map((pk, pi) => {
    const e = E[pk.e], u = UNIS[e.u], P = PATHS[e.p], l2 = linkedSt2(e);
    const dates = `${l2.length ? "1차 " : e.st === 2 ? "2차 " : ""}<b>${fmtMDW(e.d1)}${e.d1 !== e.d2 ? "~" + fmtMD(e.d2) : ""}</b>`
      + l2.map(x => ` · 2차 <b>${fmtMDW(x.d1)}${x.d1 !== x.d2 ? "~" + fmtMD(x.d2) : ""}</b>`).join("");
    return `<div class="pk" style="border-left-color:${PKC[pi]}">
      <button class="x noprint" data-act="pick-del" data-pi="${pi}" title="빼기">×</button>
      <div class="t"><span class="no" style="color:${PKC[pi]}">${PKN[pi]}</span>
        <span class="un">${esc(u.disp)}</span><span class="rg">${u.region}</span>
        <span class="badge b-t${e.t}">${TY[e.t]}</span><span class="badge b-gray">${CATS[P.cat]}</span>
        <span class="badge ${e.d1 < SUN ? "b-acc" : "b-gray"}">${e.d1 < SUN ? "수능 전" : "수능 후"}</span></div>
      <div style="font-size:12.5px;color:var(--tx2)">${esc(P.name)}</div>
      <div class="dt">${dates} <span style="color:var(--tx3)">· 발표일 ${esc(e.ann || "-")}</span></div>
      <input data-memo="${pi}" value="${esc(pk.memo || "")}" placeholder="메모 (지원 모집단위, 고사 시간 등)">
    </div>`;
  }).join("") + "</div>";
  /* 미니 달력 4개월 */
  html += '<div class="card" style="margin-top:10px"><b style="font-size:13.5px">월별 위치</b>';
  for (const m of [9, 10, 11, 12]) {
    const first = m * 100 + 1;
    let g = `<div style="font-size:12px;font-weight:700;margin:8px 0 3px">${m}월</div><div class="minimon">`;
    g += WD.map(w => `<div class="h">${w}</div>`).join("");
    for (let i = 0; i < dow(first); i++) g += '<div class="d blank"></div>';
    for (let d = first; (d / 100 | 0) === m; d = nextDay(d)) {
      const s = dmap.get(d);
      const marks = s ? [...s].map(pi => `<span class="mk" style="background:${PKC[pi]}">${pi + 1}</span>`).join("") : "";
      g += `<div class="d ${s && s.size > 1 ? "cf" : ""} ${d === SUN ? "sn" : ""}" title="${fmtMDW(d)}">${d % 100}${d === SUN ? '<span style="color:var(--red);font-size:9px"> 수능</span>' : ""}${marks ? "<br>" + marks : ""}</div>`;
    }
    g += "</div>";
    html += g;
  }
  html += "</div>";
  /* 시간순 표 */
  const rows = [];
  st.picks.forEach((pk, pi) => pickEvents(pk).forEach(e => rows.push({ pi, e })));
  rows.sort((a, b) => a.e.d1 - b.e.d1);
  html += `<div class="card" style="margin-top:10px"><b style="font-size:13.5px">시간순 일정</b>
    <table class="cs-tbl" style="margin-top:6px"><tr><th>고사일</th><th>수능</th><th>지원</th><th>대학·전형</th><th>유형</th><th>발표일</th></tr>`
    + rows.map(({ pi, e }) => {
      let cf = false; eachDay(e.d1, e.d2, d => { if (dmap.get(d) && dmap.get(d).size > 1) cf = true; });
      return `<tr class="${cf ? "cf" : ""}"><td><b>${fmtMDW(e.d1)}</b>${e.d1 !== e.d2 ? "~" + fmtMD(e.d2) : ""}</td>
        <td style="font-size:11.5px">${csatLabel(e.d1)}</td>
        <td><span style="color:${PKC[pi]};font-weight:800">${PKN[pi]}</span></td>
        <td>${esc(UNIS[e.u].disp)}<br><span style="color:var(--tx2);font-size:11.5px">${esc(PATHS[e.p].name)}</span></td>
        <td><span class="badge b-t${e.t}">${TY[e.t]}</span>${e.st > 1 ? " 2차" : ""}</td>
        <td style="font-size:11.5px">${esc(e.ann || "-")}</td></tr>`;
    }).join("") + `</table>
    <div class="hint" style="margin-top:7px">※ 같은 날 표시는 충돌 "가능성"입니다. 고사 시간·장소는 반드시 대학 모집요강·입학처 공지로 확인하세요.</div></div>`;
  box.innerHTML = html;
}

/* ───────── 4. 전체 목록 ───────── */
const SORTS = { d: (a, b) => a.d1 - b.d1, uni: (a, b) => UNIS[a.u].disp.localeCompare(UNIS[b.u].disp, "ko"), reg: (a, b) => UNIS[a.u].region.localeCompare(UNIS[b.u].region, "ko"), ty: (a, b) => a.t - b.t, cat: (a, b) => PATHS[a.p].cat - PATHS[b.p].cat, mc: (a, b) => a.m.length - b.m.length };
function renderList() {
  const [k, dir] = S.sort;
  const rows = F.slice().sort((a, b) => (SORTS[k](a, b) || a.d1 - b.d1) * dir);
  const th = (key, label) => `<th data-act="sort" data-k="${key}">${label}${k === key ? `<span class="ar"> ${dir > 0 ? "▲" : "▼"}</span>` : ""}</th>`;
  $("#lstTbl").innerHTML = `<thead><tr>${th("d", "고사일")}<th>수능</th>${th("ty", "유형")}${th("uni", "대학")}${th("reg", "지역")}${th("cat", "전형구분")}<th>전형명</th>${th("mc", "모집단위")}<th class="noprint">링크</th></tr></thead><tbody>`
    + rows.map(e => `<tr class="erow" data-act="lrow" data-ei="${e.i}">
      <td style="white-space:nowrap"><b>${fmtMDW(e.d1)}</b>${e.d1 !== e.d2 ? "~" + fmtMD(e.d2) : ""}${e.st > 1 ? ' <span class="badge b-gray">2차</span>' : ""}</td>
      <td style="font-size:12px;white-space:nowrap;color:${e.d1 < SUN ? "var(--acc)" : "var(--tx3)"}">${csatLabel(e.d1)}</td>
      <td><span class="badge b-t${e.t}">${TY[e.t]}</span></td>
      <td style="font-weight:600">${esc(UNIS[e.u].disp)}</td>
      <td>${UNIS[e.u].region}</td>
      <td style="font-size:12px">${CATS[PATHS[e.p].cat]}</td>
      <td>${esc(PATHS[e.p].name)}</td>
      <td>${e.m.length}개</td>
      <td class="noprint"><a href="${adigaURL(e.c)}" target="_blank" rel="noopener">↗</a></td></tr>`).join("") + `</tbody>`;
}
function exportCSV() {
  const pad = n => String(n).padStart(2, "0");
  const iso = n => `${Y}-${pad(n / 100 | 0)}-${pad(n % 100)}`;
  const qv = v => `"${String(v).replace(/"/g, '""')}"`;
  const head = ["시작일", "종료일", "요일", "수능전후", "유형", "차수", "대학", "지역", "전형구분", "전형명", "전형경로", "모집단위수", "모집단위", "인터넷원서접수", "현장원서접수", "합격자발표(포털표기)", "상세URL"];
  const lines = [head.map(qv).join(",")];
  F.slice().sort((a, b) => a.d1 - b.d1).forEach(e => {
    lines.push([iso(e.d1), iso(e.d2), WD[dow(e.d1)], e.d1 < SUN ? "수능전" : "수능후", TY[e.t], e.st + "차",
      UNIS[e.u].disp, UNIS[e.u].region, CATS[PATHS[e.p].cat], PATHS[e.p].name, PATHS[e.p].full,
      e.m.length, e.m.map(mi => DB.units[mi]).join(" | "),
      e.app ? `${iso(e.app[0])}~${iso(e.app[1])}` : "", e.os || "", e.ann || "", adigaURL(e.c)].map(qv).join(","));
  });
  const blob = new Blob(["﻿" + lines.join("\r\n")], { type: "text/csv;charset=utf-8" });
  const a = document.createElement("a");
  a.href = URL.createObjectURL(blob);
  a.download = "2027수시_대학별고사_일정.csv";
  a.click();
  URL.revokeObjectURL(a.href);
  toast(`현재 필터 기준 ${F.length}건 내려받음`);
}

/* ───────── 이벤트 위임 ───────── */
document.addEventListener("click", ev => {
  if (ev.target.closest("a")) return;
  const a = ev.target.closest("[data-act]");
  if (!a) { if (!ev.target.closest(".dd")) $("#regPop").classList.remove("show"); return; }
  const act = a.dataset.act;
  switch (act) {
    case "tab": setView(a.dataset.v); break;
    case "type": { const t = +a.dataset.t; S.types.has(t) ? S.types.delete(t) : S.types.add(t); update(); break; }
    case "weekend": S.weekend = !S.weekend; update(); break;
    case "reset": resetFilters(); break;
    case "reg-toggle": $("#regPop").classList.toggle("show"); break;
    case "reg-quick": {
      const q = a.dataset.q;
      if (q === "all" || q === "none") S.regions.clear();
      else if (q === "cap") S.regions = new Set(["서울", "인천", "경기"].filter(r => REGIONS.includes(r)));
      else if (q === "chung") S.regions = new Set(["대전", "세종", "충남", "충북"].filter(r => REGIONS.includes(r)));
      update(); break;
    }
    case "mon-prev": S.month = Math.max(9, S.month - 1); renderCal(); syncHash(); break;
    case "mon-next": S.month = Math.min(12, S.month + 1); renderCal(); syncHash(); break;
    case "mon-set": S.month = +a.dataset.m; renderCal(); syncHash(); break;
    case "day": S.selDay = +a.dataset.d; renderCal(); break;
    case "expand": {
      const el = a.closest(".ev"), d = el.querySelector(".ev-d");
      if (ev.target.closest("button")) break;
      if (!d.dataset.f) { d.innerHTML = evDetailHTML(E[+el.dataset.ei]); d.dataset.f = "1"; }
      el.classList.toggle("open"); break;
    }
    case "lrow": {
      const tr = a, next = tr.nextElementSibling;
      if (next && next.classList.contains("xrow")) { next.remove(); break; }
      const x = document.createElement("tr"); x.className = "xrow";
      x.innerHTML = `<td colspan="9">${evDetailHTML(E[+tr.dataset.ei])}</td>`;
      tr.after(x); break;
    }
    case "pick-add": addPick(+a.dataset.ei); break;
    case "pick-del": curStu().picks.splice(+a.dataset.pi, 1); saveCS(); renderCounsel(); break;
    case "uni-sel": S.selUni = +a.dataset.u; renderUni(); break;
    case "cs-uni": S.csUni = +a.dataset.u; renderCounsel(); break;
    case "cs-back": S.csUni = null; renderCounsel(); break;
    case "sort": { const k = a.dataset.k; S.sort = S.sort[0] === k ? [k, -S.sort[1]] : [k, 1]; renderList(); break; }
    case "csv": exportCSV(); break;
    case "help": $("#helpBg").classList.add("show"); break;
    case "help-close": if (a.id === "helpBg" && ev.target !== a) break; $("#helpBg").classList.remove("show"); break;
    case "print": window.print(); break;
    case "stu-new": { const n = prompt("학생 이름(별칭)을 입력하세요", "학생 " + (CS.students.length + 1)); if (n) { CS.students.push({ name: n, picks: [] }); CS.cur = CS.students.length - 1; saveCS(); renderCounsel(); } break; }
    case "stu-ren": { const n = prompt("새 이름", curStu().name); if (n) { curStu().name = n; saveCS(); renderCounsel(); } break; }
    case "stu-del": {
      if (CS.students.length === 1) { toast("마지막 학생은 삭제할 수 없습니다. 이름 변경으로 재사용하세요."); break; }
      if (confirm(`'${curStu().name}' 기록을 삭제할까요?`)) { CS.students.splice(CS.cur, 1); CS.cur = 0; saveCS(); renderCounsel(); }
      break;
    }
  }
});
document.addEventListener("input", e => {
  if (e.target.dataset.memo !== undefined) { curStu().picks[+e.target.dataset.memo].memo = e.target.value; saveCS(); }
});
$("#regChecks").addEventListener("change", e => {
  const r = e.target.dataset.reg; if (!r) return;
  e.target.checked ? S.regions.add(r) : S.regions.delete(r);
  update();
});
$("#fQ").addEventListener("input", e => { S.q = e.target.value; update(); });
$("#fCat").addEventListener("change", e => { S.cat = e.target.value; update(); });
$("#fCsat").addEventListener("change", e => { S.csat = e.target.value; update(); });
$("#uQ").addEventListener("input", e => { S.uq = e.target.value; renderUni(); });
$("#csQ").addEventListener("input", e => { S.csq = e.target.value; S.csUni = null; renderCsRes(); });
$("#csStu").addEventListener("change", e => { CS.cur = +e.target.value; saveCS(); renderCounsel(); });

/* ───────── 부팅 ───────── */
(function boot() {
  const refs = E.reduce((s, e) => s + e.m.length, 0);
  const shorts = new Set(UNIS.map(u => u.short));
  $("#hdSub").innerHTML = `논술·면접·실기 일정 <b>${E.length.toLocaleString()}</b>건 · <b>${shorts.size}</b>개교(캠퍼스 ${UNIS.length}) · 모집단위 연계 ${refs.toLocaleString()}건 — ${DB.meta.collected} 수집 기준`;
  initRegions();
  refilter();
  renderFilterUI();
  window.addEventListener("hashchange", parseHash);
  if (location.hash) parseHash(); else renderView();
  return true;
  }
  if (!start()) {
    const timer = setInterval(() => {
      if (start()) clearInterval(timer);
    }, 10);
    setTimeout(() => clearInterval(timer), 5000);
  }
})();

