/*
 * 정시(수능위주전형) 입시결과 조회
 * 대학발표 2024·2025·2026 정시(수능위주) 입시결과를 모집단위별로 3개년 비교.
 * 헤드라인 지표는 수능 평균백분위 70%컷. 모든 값은 발표 원본 그대로 표기(재가공 없음).
 */
let DATA = { metadata: {}, records: [] };
const DATA_VERSION = "21";
const DATA_URL = `./data/jeongsi-data.json?v=${DATA_VERSION}`;
const DATA_SCRIPT_URL = "./data/jeongsi-data.js";
const DATA_GLOBAL = "__GAONGIL_JEONGSI_DATA__";
const DEFAULT_HIDDEN_UNV_CDS = new Set(["0000053", "0000065"]);
// 대학발표 정시 입시결과 3개년. 반영 과목수는 일부 모집단위만 배지 표기.
const RESULT_YEAR = 2026;             // 헤드라인·정렬 기준(최근 발표 결과)
const YEARS = [2024, 2025, 2026];      // 대학발표 전형 결과

const ADMISSION_RESULT_LINKS = [
  { key: "susi", label: "수시결과", href: "../susi.html?v=26" },
  { key: "jeongsi", label: "정시결과", href: "./index.html?v=26" },
];

const RESOURCE_LINKS_2028 = [
  { key: "gyogwa70cut", label: "5등급 변환 교과 70% 컷", href: "../gyogwa70cut.html?v=25" },
  { key: "jonghap70cut", label: "5등급 변환 종합 70% 컷", href: "../jonghap70cut.html?v=25" },
  { key: "gyogwa_change_2028", label: "교과전형 변화", href: "../2028gyogwa-change.html" },
  { key: "hakjong2028", label: "학생부종합 안내", href: "../hakjong2028.html" },
  { key: "castrow2028", label: "수능최저 빠른보기", href: "../2028castrow.html" },
  { key: "suneung2028", label: "수능·정시 안내", href: "../2028suneung.html" },
  { key: "gyogwa2028", label: "교과 반영 방법", href: "../2028gyogwa.html" },
  { key: "uni15_2028", label: "15개 대학 분석", href: "../202815uni.html" },
  { key: "ist2028", label: "과학기술원", href: "../2028ist.html" },
  { key: "edu2028", label: "교육대학교", href: "../2028edu.html" },
  { key: "nonsul2028", label: "논술전형", href: "../2028nonsul.html" },
];

const RESOURCE_LINKS_COUNSELING = [
  { key: "unimo", label: "대학 등록금", href: "../unimo.html" },
  { key: "jonghap_eval", label: "종합 서류평가", href: "../jonghap_eval.html" },
  { key: "jonghap_interview", label: "종합 면접평가", href: "../jonghap_interview.html" },
  { key: "sub2", label: "선택과목 추천", href: "../sub2.html" },
  { key: "jinrodesign", label: "진로·학업 설계", href: "../jinrodesign.html" },
];
const RESOURCE_LINKS_INFO = [
  { key: "unimap", label: "4년제 대학 입학 안내 지도", href: "../unimap.html" },
  { key: "twounimap", label: "전문대 입학 안내 지도", href: "../2unimap.html" },
  { key: "highschoolmap", label: "고등학교 지도", href: "../highschoolmap.html" },
];

const RESOURCE_LINKS_LEARNING = [
  { key: "preview", label: "내신 학습법", href: "../preview.html" },
  { key: "csat2028", label: "2028 수능 5교과", href: "../csat2028.html" },
  { key: "sciencetam", label: "과학 탐구활동", href: "../sciencetam.html" },
  { key: "socialtam", label: "사회 탐구활동", href: "../socialtam.html" },
  { key: "ai_prompt", label: "AI 데이터 분석", href: "../ai_prompt.html" },
  { key: "aisc", label: "지구과학 탐구주제", href: "../aisc.html" },
  { key: "saenggibu_check", label: "생기부 점검", href: "../saenggibu_check.html" },
];

const RESOURCE_LINKS_2027 = [
  { key: "gosa", label: "2027학년도 수시 대학별고사 일정 캘린더", href: "../2027gosa.html" },
  { key: "gyogwa", label: "학생부교과", href: "../2027gyogwa.html" },
  { key: "special", label: "농어촌학생", href: "../2027special.html" },
  { key: "chuchon", label: "학교장추천", href: "../2027chuchon.html" },
  { key: "localmedi", label: "지역인재", href: "../localmedi.html" },
  { key: "cheomdan", label: "계약·첨단학과", href: "../2027cheomdan.html" },
  { key: "medi", label: "지역의사", href: "../2027medi.html" },
  { key: "yeche", label: "예체능 비실기", href: "../2027yeche.html" },
  { key: "specialized", label: "특성화고 기준학과", href: "../2027-specialized-highschool-standards.html" },
  { key: "procollege6", label: "전문대 간호·보건", href: "../procollege6.html" },
  { key: "prelearning", label: "선행학습 보고서", href: "../2026prelearning-report.html" },
  { key: "susi_download", label: "수시모집요강", href: "../2027susi-download.html" },
];

const state = {
  query: "",
  university: "",
  major: "",
  regions: new Set(),
  guns: new Set(),
  percentile: "",
  band: "3",
  sort: "avg70_desc",
  pageSize: 80,
  page: 1,
  selectedId: null,
  savedIds: new Set(),
  student: {
    name: "",
    school: "",
    grade: "",
    desiredMajor: "",
    desiredUniversity: "",
    memo: "",
  },
};

let lastView = [];

/* ---------- 유틸 ---------- */
function byId(id) { return DATA.records.find((r) => String(r.id) === String(id)); }

function normalize(value) {
  return String(value || "").trim().toLowerCase()
    .replace(/\s+/g, "").replace(/[\(\)\[\]\{\}·ㆍ,./_\-:]/g, "");
}
function toNumber(value) {
  if (value === "" || value === null || value === undefined) return null;
  const n = Number(value);
  return Number.isFinite(n) ? n : null;
}
function fmt(v) { return v === "" || v == null ? "–" : String(v); }
function escapeHtml(v) {
  return String(v ?? "").replace(/&/g, "&amp;").replace(/</g, "&lt;")
    .replace(/>/g, "&gt;").replace(/"/g, "&quot;").replace(/'/g, "&#039;");
}
function escapeAttr(v) { return escapeHtml(v); }
function debounce(fn, wait = 160) {
  let t = null;
  return (...a) => { if (t) clearTimeout(t); t = setTimeout(() => { t = null; fn(...a); }, wait); };
}

function loadDataScript(src, globalName) {
  if (window[globalName]?.records?.length) return Promise.resolve(window[globalName]);
  return new Promise((resolve, reject) => {
    const script = document.createElement("script");
    script.src = src;
    script.async = true;
    script.onload = () => {
      if (window[globalName]?.records?.length) resolve(window[globalName]);
      else reject(new Error("Script data empty"));
    };
    script.onerror = () => reject(new Error("Script load failed"));
    document.head.appendChild(script);
  });
}

function resourceLinksHtml(items, currentKey) {
  return items.map((item) => `
    <a href="${escapeAttr(item.href)}" class="${item.key === currentKey ? "active" : ""}" role="menuitem">
      ${escapeHtml(item.label)}
    </a>
  `).join("");
}

function resourceMenuHtml(label, items, currentKey, ariaLabel) {
  return `
    <details class="resource-menu">
      <summary class="button secondary">${escapeHtml(label)}</summary>
      <div class="resource-list" role="menu" aria-label="${escapeAttr(ariaLabel)}">
        ${resourceLinksHtml(items, currentKey)}
      </div>
    </details>
  `;
}

function topMenusHtml(currentKey = "jeongsi") {
  return [
    resourceMenuHtml("입시결과", ADMISSION_RESULT_LINKS, currentKey, "입시결과 메뉴"),
    resourceMenuHtml("상담자료", RESOURCE_LINKS_COUNSELING, currentKey, "상담자료 메뉴"),
    resourceMenuHtml("2028 자료", RESOURCE_LINKS_2028, currentKey, "2028 학년도 대입 자료 메뉴"),
    resourceMenuHtml("2027 자료", RESOURCE_LINKS_2027, currentKey, "2027 학년도 대입 자료 메뉴"),
    resourceMenuHtml("정보", RESOURCE_LINKS_INFO, currentKey, "정보 메뉴"),
    resourceMenuHtml("학습", RESOURCE_LINKS_LEARNING, currentKey, "학습 메뉴"),
  ].join("");
}

async function loadJeongsiData() {
  if (window[DATA_GLOBAL]?.records?.length) return window[DATA_GLOBAL];
  if (location.protocol === "file:") {
    return loadDataScript(DATA_SCRIPT_URL, DATA_GLOBAL);
  }
  try {
    const res = await fetch(DATA_URL, { cache: "no-cache" });
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    return res.json();
  } catch (error) {
    if (window[DATA_GLOBAL]?.records?.length) return window[DATA_GLOBAL];
    try {
      return await loadDataScript(DATA_SCRIPT_URL, DATA_GLOBAL);
    } catch {
      throw error;
    }
  }
}

/* ---------- 연도별 접근 ---------- */
function yearData(record, year) { return record.years?.[String(year)] || null; }
// 헤드라인: 수능 평균백분위 70%컷
function avg70(record, year) {
  const d = yearData(record, year);
  return d ? toNumber(d.p70?.avg) : null;
}
function competition(record, year) {
  const d = yearData(record, year);
  return d ? toNumber(d.c) : null;
}
function recruit(record, year) {
  const d = yearData(record, year);
  return d ? toNumber(d.m?.[2]) : null;
}
function hwansan70(record, year) {
  const d = yearData(record, year);
  return d ? toNumber(d.hs?.[1]) : null;
}
function resultScore(record, year) {
  const pct = avg70(record, year);
  if (pct !== null) return { type: "pct", value: pct, title: `${year} 평균백분위 70%컷` };
  const scale = hwansan70(record, year);
  if (scale !== null) return { type: "scale", value: scale, title: `${year} 대학별 환산점수 70%컷` };
  return { type: "empty", value: null, title: `${year} 점수 미제공` };
}
function hasHwansanFallback(record) {
  return YEARS.some((y) => avg70(record, y) === null && hwansan70(record, y) !== null);
}

/* ---------- 필터 / 정렬 ---------- */
function tokenize(value) {
  return String(value || "").split(/[\s,]+/).map(normalize).filter(Boolean);
}
function passesTokens(tokens, hay) { return tokens.every((t) => hay.includes(t)); }
function passesText(record, value, fields) {
  const tokens = tokenize(value);
  if (!tokens.length) return true;
  const hay = fields.map((f) => normalize(record[f])).join("");
  return passesTokens(tokens, hay);
}
function isDefaultHiddenRecord(record) {
  return DEFAULT_HIDDEN_UNV_CDS.has(record.unvCd);
}
function hasMeaningfulResult(record) {
  return YEARS.some((y) => {
    const d = yearData(record, y);
    if (!d) return false;
    if (avg70(record, y) !== null || hwansan70(record, y) !== null) return true;
    if (recruit(record, y) !== null && recruit(record, y) > 0) return true;
    if (competition(record, y) !== null) return true;
    return false;
  });
}

function filteredRecords() {
  const queryTokens = tokenize(state.query);
  const hasUniversitySearch = tokenize(state.university).length > 0;
  return DATA.records.filter((r) => {
    if (!hasMeaningfulResult(r)) return false;
    if (!hasUniversitySearch && isDefaultHiddenRecord(r)) return false;
    if (queryTokens.length && !passesTokens(queryTokens, r.searchText)) return false;
    if (!passesText(r, state.university, ["university", "uniBase"])) return false;
    if (!passesText(r, state.major, ["dept", "jname"])) return false;
    if (state.regions.size && !state.regions.has(r.region)) return false;
    if (state.guns.size && !state.guns.has(r.gun)) return false;
    const target = toNumber(state.percentile);
    if (target !== null) {
      const cut = latest(r, avg70);
      const band = toNumber(state.band) ?? 3;
      if (cut === null || Math.abs(cut - target) > band) return false;
    }
    return true;
  });
}

// 내 평균백분위와 최신 70%컷의 차(양수=내가 더 높음)
function pctDiff(record) {
  const target = toNumber(state.percentile);
  const cut = latest(record, avg70);
  if (target === null || cut === null) return null;
  return target - cut;
}


function latest(record, accessor) {
  for (const y of [2026, 2025, 2024]) {
    const v = accessor(record, y);
    if (v !== null) return v;
  }
  return null;
}
function latestEntry(record, accessor) {
  for (const y of [2026, 2025, 2024]) {
    const v = accessor(record, y);
    if (v !== null) return { year: y, value: v };
  }
  return null;
}

function admissionFamily(value) {
  const text = normalize(value);
  if (!text) return "";
  if (text.includes("지역인재") && (text.includes("저소득") || text.includes("기회") || text.includes("기균"))) return "지역인재저소득";
  if (text.includes("지역인재")) return "지역인재";
  if (text.includes("농어촌")) return "농어촌";
  if (text.includes("특성화고")) return "특성화고";
  if (text.includes("저소득") || text.includes("기초생활") || text.includes("차상위") || text.includes("한부모")) return "저소득";
  if (text.includes("기회") || text.includes("기균") || text.includes("고른기회")) return "기회균형";
  if (text.includes("장애") || text.includes("특수교육")) return "장애인등";
  if (text.includes("만학") || text.includes("성인학습")) return "만학도";
  if (text.includes("사회배려") || text.includes("사회다양") || text.includes("사회통합") || text.includes("사회기여")) return "사회배려";
  if (text.includes("보훈")) return "국가보훈";
  if (text.includes("서해")) return "서해5도";
  if (text.includes("재외") || text.includes("북한")) return "재외·북한";
  if (text.includes("일반학생") || text.includes("일반전형") || text.includes("일반")) return "일반";
  if (text.includes("실기") || text.includes("실적")) return "실기";
  if (text.includes("수능위주") || text.includes("수능100") || text.includes("미래인재") || text.includes("약학대학")) return "일반";
  if (text.startsWith("수능") || text.startsWith("정시")) return "일반";
  return text;
}

function shortAdmission(value) {
  const text = normalize(value);
  if (!text) return "전형";
  if (text.includes("지역인재") && (text.includes("저소득") || text.includes("기회") || text.includes("기균"))) return "지역인재기회";
  if (text.includes("지역인재")) return "지역인재";
  if (text.includes("농어촌")) return "농어촌";
  if (text.includes("특성화고")) return "특성화고";
  if (text.includes("기초생활") || text.includes("차상위")) return "기초·차상위";
  if (text.includes("저소득")) return "저소득";
  if (text.includes("지역기회")) return "지역기회";
  if (text.includes("기회") || text.includes("기균") || text.includes("고른기회")) return "기회균형";
  if (text.includes("장애") || text.includes("특수교육")) return "장애인등";
  if (text.includes("만학") || text.includes("성인학습")) return "만학도";
  if (text.includes("사회배려") || text.includes("사회다양") || text.includes("사회통합") || text.includes("사회기여")) return "사회배려";
  if (text.includes("보훈")) return "국가보훈";
  if (text.includes("서해")) return "서해5도";
  if (text.includes("재외") || text.includes("북한")) return "재외·북한";
  if (text.includes("실기") || text.includes("실적")) return "실기";
  if (text.includes("일반학생") || text.includes("일반전형") || text.includes("일반") || text.includes("수능위주")) return "일반";
  return String(value || "전형")
    .replace(/^수능위주전형/, "")
    .replace(/^수능위주/, "")
    .replace(/^수능/, "")
    .replace(/정시모집/g, "")
    .replace(/[()\[\]_]/g, " ")
    .replace(/전형/g, "")
    .replace(/\s+/g, " ")
    .trim() || "전형";
}

function hasAnyYearData(record) {
  return YEARS.some((y) => yearData(record, y));
}

function relatedDept(a, b) {
  const left = normalize(a);
  const right = normalize(b);
  if (!left || !right) return false;
  if (left === right) return true;
  const [shorter, longer] = left.length < right.length ? [left, right] : [right, left];
  return shorter.length >= 5 && longer.includes(shorter);
}

function relatedHistory(record) {
  const family = admissionFamily(record.jname);
  const uniKey = record.unvCd || record.university;
  if (!record.dept || !family || !uniKey) return [];
  return DATA.records
    .filter((r) => (
      r.id !== record.id &&
      (r.unvCd || r.university) === uniKey &&
      relatedDept(r.dept, record.dept) &&
      admissionFamily(r.jname) === family &&
      hasAnyYearData(r)
    ))
    .sort((a, b) => (
      String(a.gun || "").localeCompare(String(b.gun || ""), "ko") ||
      String(a.jname || "").localeCompare(String(b.jname || ""), "ko")
    ));
}

function sortRecords(records) {
  const sorted = [...records];
  const big = (v) => (v == null ? -Infinity : v);
  const small = (v) => (v == null ? Infinity : v);
  sorted.sort((a, b) => {
    switch (state.sort) {
      case "near": {
        const da = pctDiff(a), db = pctDiff(b);
        return Math.abs(da ?? Infinity) - Math.abs(db ?? Infinity) || big(latest(b, avg70)) - big(latest(a, avg70));
      }
      case "avg70_asc":
        return small(latest(a, avg70)) - small(latest(b, avg70)) || a.university.localeCompare(b.university, "ko");
      case "comp_desc":
        return big(latest(b, competition)) - big(latest(a, competition)) || a.university.localeCompare(b.university, "ko");
      case "uni":
        return a.university.localeCompare(b.university, "ko") || a.dept.localeCompare(b.dept, "ko");
      case "avg70_desc":
      default:
        return big(latest(b, avg70)) - big(latest(a, avg70)) || a.university.localeCompare(b.university, "ko");
    }
  });
  return sorted;
}

function visibleRecords() {
  lastView = sortRecords(filteredRecords());
  if (!state.selectedId || !lastView.some((r) => r.id === state.selectedId)) {
    state.selectedId = lastView[0]?.id || null;
  }
  const maxPage = Math.max(1, Math.ceil(lastView.length / state.pageSize));
  if (state.page > maxPage) state.page = maxPage;
  return lastView;
}

/* ---------- 마운트 ---------- */
function mount() {
  const app = document.querySelector("#app");
  const c = DATA.metadata.counts || {};
  app.innerHTML = `
    <header class="topbar">
      <div class="topbar-inner">
        <div class="brand">
          <div class="brand-mark logo-mark">
            <img src="../assets/gaongil-logo.png" alt="가온길 에듀 가온길 입시전략연구소" />
          </div>
          <div>
            <h1>정시결과</h1>
            <p>대학발표 2024·2025·2026 정시 입시결과 — 수능 백분위·환산점수·경쟁률 3개년 비교</p>
          </div>
        </div>
        <div class="top-actions">
          <a class="button secondary" href="../index.html" title="메인페이지로 이동">메인</a>
          ${topMenusHtml("jeongsi")}
        </div>
      </div>
    </header>

    <div class="notice-bar" role="note">
      <span class="notice-tag">⚠ 주의</span>
      <span>백분위 비교와 내 점수 매칭은 대학이 백분위 점수를 공개한 모집단위에 한해 참고하세요. 백분위가 없고 대학별 환산점수 70%컷만 있는 칸은 파란색 환 표시로 구분합니다. 전형명·모집단위명이 크게 바뀐 경우 목록이 분리될 수 있습니다.</span>
    </div>

    <section id="savedPanel" class="saved-panel" aria-live="polite"></section>

    <main class="main-layout">
      <aside class="sidebar">${renderFilterPanel()}</aside>
      <section class="content">
        <div class="panel">
          <div class="toolbar">
            <div class="field">
              <label for="query">통합 검색</label>
              <input id="query" class="control" value="${escapeAttr(state.query)}" placeholder="대학, 학과, 전형, 지역" />
            </div>
            <div class="field">
              <label for="university">대학명</label>
              <input id="university" class="control" value="${escapeAttr(state.university)}" placeholder="예: 서울시립대" />
            </div>
            <div class="field">
              <label for="major">모집단위·전형</label>
              <input id="major" class="control" value="${escapeAttr(state.major)}" placeholder="예: 컴퓨터, 일반" />
            </div>
            <div class="field">
              <label for="sort">정렬</label>
              <select id="sort" class="select">
                ${option("avg70_desc", "평균백분위 70% 높은순", state.sort)}
                ${option("avg70_asc", "평균백분위 70% 낮은순", state.sort)}
                ${option("near", "내 백분위 근접순", state.sort)}
                ${option("comp_desc", "경쟁률 높은순", state.sort)}
                ${option("uni", "대학명순", state.sort)}
              </select>
            </div>
          </div>
          <div id="resultSummary" class="result-summary"></div>
          <div id="tabContent" class="tab-content"></div>
        </div>
        <footer class="site-footer">
          <div class="footer-brand gaongil-footer-brand">
            <img src="../assets/gaongil-logo.png" alt="가온길 에듀" />
            <span>
              <strong>가온길 에듀</strong>
              <em>가온길 입시전략연구소</em>
            </span>
          </div>
          <div><strong>제작</strong> 가온길 에듀 가온길 입시전략연구소</div>
          <div><strong>출처</strong> 대학발표 정시(수능위주전형) 입시결과</div>
        </footer>
      </section>
    </main>
  `;
  bindStaticEvents();
  renderDynamic();
}

function renderFilterPanel() {
  const dist = DATA.metadata.distributions || {};
  return `
    <section class="panel panel-pad">
      <div class="section-title"><h2>필터</h2><span>정시 입결</span></div>
      <div class="field-grid">
        <div class="field">
          <label for="percentile">내 평균백분위</label>
          <div class="range-row">
            <input id="percentile" class="control" type="number" min="0" max="100" step="0.1" value="${escapeAttr(state.percentile)}" placeholder="예: 85" inputmode="decimal" />
            <select id="band" class="select" aria-label="허용 범위">
              ${option("1", "±1", state.band)}${option("2", "±2", state.band)}${option("3", "±3", state.band)}${option("5", "±5", state.band)}
            </select>
          </div>
          <span class="field-hint">2026 평균백분위 70%컷이 내 백분위 ±범위인 모집단위만. 환산점수만 있는 칸은 제외</span>
        </div>
        <div class="field">
          <span class="label">모집군</span>
          <div class="check-list compact">
            ${checks("gun", dist.guns || [])}
          </div>
        </div>
        <div class="field">
          <span class="label">지역</span>
          <div class="check-list">
            ${checks("region", dist.regions || [])}
          </div>
        </div>
      </div>
    </section>
  `;
}

const FILTER_SETS = { region: () => state.regions, gun: () => state.guns };
function checks(type, items) {
  return items.map((item) => {
    const set = FILTER_SETS[type]();
    const checked = set.has(item.name) ? "checked" : "";
    const label = type === "gun"
      ? (["가", "나", "다", "라", "마"].includes(item.name) ? `${item.name}군` : item.name)
      : item.name;
    return `<label class="check-item"><input type="checkbox" data-filter="${type}" value="${escapeAttr(item.name)}" ${checked} /><span>${escapeHtml(label)}</span><span class="count">${item.count}</span></label>`;
  }).join("");
}
function option(value, label, selected) {
  return `<option value="${escapeAttr(value)}" ${value === selected ? "selected" : ""}>${escapeHtml(label)}</option>`;
}

/* ---------- 이벤트 ---------- */
const debouncedRender = debounce(renderDynamic, 160);
function bindStaticEvents() {
  for (const id of ["query", "university", "major", "percentile"]) {
    document.querySelector(`#${id}`).addEventListener("input", (e) => {
      state[id] = e.target.value; state.page = 1; debouncedRender();
    });
  }
  document.querySelector("#band").addEventListener("change", (e) => {
    state.band = e.target.value; state.page = 1; renderDynamic();
  });
  document.querySelector("#sort").addEventListener("change", (e) => {
    state.sort = e.target.value; state.page = 1; renderDynamic();
  });
  document.querySelector(".sidebar").addEventListener("change", (e) => {
    const type = e.target.dataset?.filter;
    if (type && FILTER_SETS[type]) {
      toggleSet(FILTER_SETS[type](), e.target.value, e.target.checked);
      state.page = 1; renderDynamic();
    }
  });
  document.querySelector(".top-actions").addEventListener("click", (e) => {
    if (e.target.closest("[data-action='reset']")) resetState();
  });
  bindResourceMenuEvents();
  const tab = document.querySelector("#tabContent");
  tab.addEventListener("click", handleTabClick);
  tab.addEventListener("keydown", handleTabKeydown);
  document.querySelector("#savedPanel").addEventListener("click", handleSavedClick);
  document.querySelector("#savedPanel").addEventListener("input", handleSavedInput);
}

function bindResourceMenuEvents() {
  const menus = [...document.querySelectorAll(".resource-menu")];
  menus.forEach((menu) => {
    menu.addEventListener("toggle", () => {
      if (!menu.open) return;
      menus.forEach((other) => {
        if (other !== menu) other.open = false;
      });
    });
  });
  document.addEventListener("click", (e) => {
    if (e.target.closest(".resource-menu")) return;
    menus.forEach((menu) => {
      menu.open = false;
    });
  });
  document.addEventListener("keydown", (e) => {
    if (e.key !== "Escape") return;
    menus.forEach((menu) => {
      menu.open = false;
    });
  });
}

function toggleSet(set, value, checked) { checked ? set.add(value) : set.delete(value); }

function handleTabClick(e) {
  const saveToggle = e.target.closest("[data-save-id]");
  if (saveToggle) {
    const id = saveToggle.dataset.saveId;
    if (saveToggle.checked) state.savedIds.add(id);
    else state.savedIds.delete(id);
    state.selectedId = id;
    renderDynamic();
    focusRow(id);
    return;
  }
  const action = e.target.closest("[data-action]")?.dataset.action;
  if (action === "prev-page") { state.page = Math.max(1, state.page - 1); renderDynamic(); return; }
  if (action === "next-page") {
    const maxPage = Math.max(1, Math.ceil(lastView.length / state.pageSize));
    state.page = Math.min(maxPage, state.page + 1); renderDynamic(); return;
  }
  const header = e.target.closest("th[data-sort]");
  if (header) {
    state.sort = header.dataset.sort; state.page = 1;
    const sel = document.querySelector("#sort"); if (sel) sel.value = state.sort;
    renderDynamic(); return;
  }
  const row = e.target.closest("tr[data-id]");
  if (row) { state.selectedId = row.dataset.id; renderDynamic(); focusRow(state.selectedId); }
}
function handleSavedClick(e) {
  const reset = e.target.closest("[data-action='reset']");
  if (reset) {
    resetState();
    return;
  }
  const print = e.target.closest("[data-action='print-report']");
  if (print) {
    printSavedReport();
    return;
  }
  const clear = e.target.closest("[data-action='clear-saved']");
  if (clear) {
    state.savedIds.clear();
    renderDynamic();
    return;
  }
  const remove = e.target.closest("[data-remove-saved]");
  if (remove) {
    state.savedIds.delete(remove.dataset.removeSaved);
    renderDynamic();
    return;
  }
  const focus = e.target.closest("[data-focus-saved]");
  if (focus) {
    state.selectedId = focus.dataset.focusSaved;
    state.page = Math.max(1, Math.ceil((lastView.findIndex((record) => String(record.id) === String(state.selectedId)) + 1) / state.pageSize));
    renderDynamic();
    focusRow(state.selectedId);
  }
}
function handleSavedInput(e) {
  const key = e.target.dataset?.student;
  if (!key || !(key in state.student)) return;
  state.student[key] = e.target.value;
}
function focusRow(id) {
  if (!id) return;
  const el = document.querySelector(`#tabContent tr[data-id="${CSS.escape(id)}"]`);
  if (el) el.focus();
}
function handleTabKeydown(e) {
  const header = e.target.closest("th[data-sort]");
  if (header && (e.key === "Enter" || e.key === " ")) {
    e.preventDefault(); state.sort = header.dataset.sort; state.page = 1;
    const sel = document.querySelector("#sort"); if (sel) sel.value = state.sort;
    renderDynamic(); return;
  }
  const row = e.target.closest("tr[data-id]");
  if (!row) return;
  if (e.key === "Enter" || e.key === " ") {
    e.preventDefault(); state.selectedId = row.dataset.id; renderDynamic(); focusRow(state.selectedId);
  } else if (e.key === "ArrowDown" || e.key === "ArrowUp") {
    e.preventDefault();
    const sib = e.key === "ArrowDown" ? row.nextElementSibling : row.previousElementSibling;
    if (sib && sib.matches("tr[data-id]")) sib.focus();
  }
}
function resetState() {
  Object.assign(state, { query: "", university: "", major: "", sort: "avg70_desc", page: 1, selectedId: null, percentile: "", band: "3" });
  state.regions.clear(); state.guns.clear();
  state.savedIds.clear();
  Object.keys(state.student).forEach((key) => {
    state.student[key] = "";
  });
  mount();
}

/* ---------- 렌더 ---------- */
function renderDynamic() {
  const records = visibleRecords();
  renderSavedPanel();
  renderSummary(records);
  document.querySelector("#tabContent").innerHTML = renderResults(records);
}
function savedRecords() {
  return Array.from(state.savedIds).map(byId).filter(Boolean);
}
function renderSavedPanel() {
  const saved = savedRecords();
  const panel = document.querySelector("#savedPanel");
  if (!panel) return;
  panel.innerHTML = `
    <div class="consult-panel">
      <div class="section-title">
        <h2>학생정보</h2>
        <span>PDF 보고서에 함께 표시됩니다.</span>
      </div>
      <div class="consult-grid">
        <label class="field"><span class="label">학생이름</span><input class="control" data-student="name" value="${escapeAttr(state.student.name)}" placeholder="예: 홍길동" /></label>
        <label class="field"><span class="label">학교</span><input class="control" data-student="school" value="${escapeAttr(state.student.school)}" placeholder="예: 가온고" /></label>
        <label class="field"><span class="label">내신</span><input class="control" data-student="grade" value="${escapeAttr(state.student.grade)}" placeholder="예: 3.20" /></label>
        <label class="field"><span class="label">희망학과</span><input class="control" data-student="desiredMajor" value="${escapeAttr(state.student.desiredMajor)}" placeholder="예: 의예과" /></label>
        <label class="field"><span class="label">희망대학</span><input class="control" data-student="desiredUniversity" value="${escapeAttr(state.student.desiredUniversity)}" placeholder="예: 고려대" /></label>
      </div>
      <label class="field consult-memo"><span class="label">상담내용</span><textarea class="control" data-student="memo" rows="3" placeholder="상담 중 확인한 강점, 보완점, 지원전략을 입력하세요.">${escapeHtml(state.student.memo)}</textarea></label>
      <div class="consult-actions">
        <button class="button" type="button" data-action="print-report" ${saved.length ? "" : "disabled"}>PDF 저장</button>
        <button class="button secondary" type="button" data-action="clear-saved" ${saved.length ? "" : "disabled"}>선택 비우기</button>
        <button class="button secondary" type="button" data-action="reset">초기화</button>
      </div>
    </div>
    <div class="saved-head">
      <strong>저장된 모집단위 <span>${saved.length}</span></strong>
      <span>${saved.length ? "선택한 모집단위를 상담 자료로 따로 확인할 수 있습니다." : "아직 저장된 모집단위가 없습니다."}</span>
    </div>
    <div class="saved-body ${saved.length ? "" : "empty"}">
      ${saved.length ? saved.map((record) => `
        <article class="saved-card">
          <button type="button" class="saved-main" data-focus-saved="${escapeAttr(record.id)}">
            <b>${escapeHtml(record.university)} ${escapeHtml(record.dept)}</b>
            <span>${gunTag(record)} ${escapeHtml(shortAdmission(record.jname))}</span>
          </button>
          <button type="button" class="saved-remove" data-remove-saved="${escapeAttr(record.id)}" aria-label="저장 해제">×</button>
        </article>
      `).join("") : "표 왼쪽의 선택 칸을 체크하면 이곳에 저장됩니다."}
    </div>
  `;
}
function studentValue(key) {
  return state.student[key] ? escapeHtml(state.student[key]) : "미입력";
}
function reportScoreRows(record) {
  return YEARS.map((year) => {
    const data = yearData(record, year);
    const score = resultScore(record, year);
    const scoreText = score.type === "scale" ? `환산 ${fmt(score.value)}` : fmt(score.value);
    return `
      <tr>
        <td>${year}</td>
        <td>${fmt(data?.m?.[2])}</td>
        <td>${fmt(data?.c)}</td>
        <td>${scoreText}</td>
        <td>${fmt(data?.p50?.avg)}</td>
        <td>${fmt(data?.w)}</td>
      </tr>
    `;
  }).join("");
}
function printSavedReport() {
  const saved = savedRecords();
  if (!saved.length) {
    alert("먼저 표 왼쪽 선택 칸에서 모집단위를 저장해 주세요.");
    return;
  }
  const logoUrl = new URL("../assets/gaongil-logo.png", location.href).href;
  const today = new Date().toLocaleDateString("ko-KR");
  const contactPhone = "010-2370-7602";
  const rows = saved.map((record, index) => `
    <section class="report-card">
      <h2>${index + 1}. ${escapeHtml(record.university)} ${escapeHtml(record.dept)}</h2>
      <p class="meta">${escapeHtml(record.region)} · ${escapeHtml(record.gun || "기타")}군 · ${escapeHtml(record.jname)}</p>
      <table>
        <thead><tr><th>연도</th><th>모집</th><th>경쟁률</th><th>평균/환산 70</th><th>평균 50</th><th>충원</th></tr></thead>
        <tbody>${reportScoreRows(record)}</tbody>
      </table>
    </section>
  `).join("");
  const html = `
    <!doctype html>
    <html lang="ko">
      <head>
        <meta charset="UTF-8" />
        <title>정시결과 상담 보고서</title>
        <style>
          @page { size: A4; margin: 8mm; }
          * { box-sizing: border-box; }
          html, body { min-height: 100%; }
          body {
            margin: 0;
            color: #111827;
            background:
              radial-gradient(circle at 12% 8%, rgba(201, 151, 67, .12), transparent 28%),
              linear-gradient(180deg, #ffffff 0%, #f8fafc 100%);
            font-family: "Malgun Gothic", "Apple SD Gothic Neo", Arial, sans-serif;
            font-size: 8px;
            line-height: 1.32;
            -webkit-print-color-adjust: exact;
            print-color-adjust: exact;
          }
          body::before {
            content: "";
            position: fixed;
            left: 50%;
            top: 50%;
            width: 78%;
            height: 44%;
            transform: translate(-50%, -50%);
            background: url("${logoUrl}") center / contain no-repeat;
            opacity: .075;
            z-index: 0;
            pointer-events: none;
          }
          body::after {
            content: "GAONGIL EDU";
            position: fixed;
            left: 50%;
            top: 54%;
            transform: translate(-50%, -50%) rotate(-18deg);
            color: rgba(201, 151, 67, .09);
            font-size: 50px;
            font-weight: 900;
            letter-spacing: 8px;
            white-space: nowrap;
            z-index: 0;
            pointer-events: none;
          }
          header, section, footer { position: relative; z-index: 1; }
          header {
            display: grid;
            grid-template-columns: auto 1fr auto;
            align-items: center;
            gap: 10px;
            border: 1px solid #e8edf4;
            border-top: 3px solid #c99743;
            border-radius: 9px;
            padding: 7px 9px;
            background: rgba(255, 255, 255, .92);
            box-shadow: 0 4px 12px rgba(15, 23, 42, .06);
          }
          header img { width: 104px; height: 34px; object-fit: contain; background: #050505; border-radius: 5px; }
          .headline { min-width: 0; }
          h1 { margin: 0; font-size: 14px; line-height: 1.1; color: #0f172a; }
          h2 { margin: 8px 0 5px; font-size: 10px; line-height: 1.2; color: #0f172a; }
          .sub { margin-top: 2px; color: #64748b; font-size: 7.5px; font-weight: 800; }
          .contact-badge {
            display: inline-flex;
            align-items: center;
            justify-content: center;
            min-height: 22px;
            border: 1px solid #c99743;
            border-radius: 999px;
            padding: 3px 8px;
            background: linear-gradient(180deg, #fff7df, #f1d491);
            color: #5f3900;
            font-size: 8px;
            font-weight: 900;
            white-space: nowrap;
          }
          .info { display: grid; grid-template-columns: repeat(5, 1fr); gap: 4px; margin: 8px 0; }
          .info div { border: 1px solid #d8dee8; border-radius: 5px; padding: 4px 5px; background: rgba(255,255,255,.88); }
          .info b { display: block; color: #64748b; font-size: 6.5px; line-height: 1.1; }
          .info span { display: block; margin-top: 2px; font-size: 8px; font-weight: 900; color: #0f172a; }
          .memo { border: 1px solid #d8dee8; border-radius: 6px; min-height: 34px; padding: 5px 6px; background: rgba(255,255,255,.88); white-space: pre-wrap; line-height: 1.38; }
          .report-card {
            margin-top: 8px;
            border: 1px solid #d8dee8;
            border-radius: 7px;
            overflow: hidden;
            background: rgba(255,255,255,.94);
            break-inside: auto;
            page-break-inside: auto;
          }
          .report-card h2 { margin: 0; padding: 6px 8px; background: linear-gradient(90deg, #101827, #23324a); color: #fff; font-size: 9px; }
          .meta { margin: 0; padding: 5px 8px; background: #fff8e8; color: #5f3900; font-size: 7.5px; font-weight: 900; }
          table { width: 100%; border-collapse: collapse; table-layout: fixed; }
          th, td { border-top: 1px solid #e5e7eb; padding: 4px 5px; text-align: center; font-size: 7.2px; line-height: 1.24; word-break: keep-all; overflow-wrap: anywhere; }
          th { background: #edf2f7; color: #26374f; font-weight: 900; }
          .report-subtitle { margin: 6px 8px 4px; font-size: 8px; color: #92400e; font-weight: 900; }
          .plan-report { margin: 0 8px 6px; width: calc(100% - 16px); table-layout: auto; }
          .plan-report th:nth-child(1) { width: 18%; }
          .plan-report th:nth-child(2) { width: 8%; }
          .plan-report td:nth-child(3), .plan-report td:nth-child(4) { text-align: left; }
          .muted { margin: 4px 8px 6px; color: #64748b; font-size: 7.4px; }
          footer {
            margin-top: 10px;
            border-top: 1px solid #d8dee8;
            padding-top: 5px;
            color: #64748b;
            font-size: 7.2px;
            display: flex;
            justify-content: space-between;
            gap: 10px;
          }
        </style>
      </head>
      <body>
        <header>
          <img src="${logoUrl}" alt="가온길 에듀" />
          <div class="headline">
            <h1>정시결과 상담 보고서</h1>
            <div class="sub">가온길 에듀 · 가온길 입시전략연구소 · ${today}</div>
          </div>
          <div class="contact-badge">상담문의 ${contactPhone}</div>
        </header>
        <section class="info">
          <div><b>학생이름</b><span>${studentValue("name")}</span></div>
          <div><b>학교</b><span>${studentValue("school")}</span></div>
          <div><b>내신</b><span>${studentValue("grade")}</span></div>
          <div><b>희망학과</b><span>${studentValue("desiredMajor")}</span></div>
          <div><b>희망대학</b><span>${studentValue("desiredUniversity")}</span></div>
        </section>
        <section>
          <h2>상담내용</h2>
          <div class="memo">${state.student.memo ? escapeHtml(state.student.memo) : "미입력"}</div>
        </section>
        ${rows}
        <footer><span>본 자료는 상담 참고용입니다.</span><span>상담문의 ${contactPhone} · 가온길 에듀 가온길 입시전략연구소</span></footer>
        <script>window.addEventListener("load", () => setTimeout(() => window.print(), 250));</script>
      </body>
    </html>
  `;
  const report = window.open("", "_blank");
  if (!report) {
    alert("팝업이 차단되었습니다. 팝업 허용 후 다시 눌러 주세요.");
    return;
  }
  report.document.open();
  report.document.write(html);
  report.document.close();
}
function renderSummary(records) {
  const vals = records.map((r) => latest(r, avg70)).filter((v) => v !== null);
  const med = vals.length ? medianOf(vals) : null;
  const unis = new Set(records.map((r) => r.unvCd)).size;
  const scaleShown = records.filter(hasHwansanFallback).length;
  const target = toNumber(state.percentile);
  const matchNote = target === null ? "" :
    ` · <strong class="hl-match">내 백분위 ${target} ±${escapeHtml(state.band)}</strong> 매칭`;
  const scaleNote = scaleShown ? ` · 환산70 표시 <strong>${scaleShown.toLocaleString("ko-KR")}</strong>건` : "";
  document.querySelector("#resultSummary").innerHTML = `
    <strong>${records.length.toLocaleString("ko-KR")}</strong>개 모집단위
    · ${unis}개 대학
    · 전체 ${DATA.records.length.toLocaleString("ko-KR")}건 중
    · 평균백분위 70% 중앙값 <strong>${med == null ? "–" : med}</strong>${matchNote}${scaleNote}`;
}
function medianOf(values) {
  const s = [...values].sort((a, b) => a - b);
  const m = Math.floor(s.length / 2);
  return s.length % 2 ? s[m] : Math.round(((s[m - 1] + s[m]) / 2) * 10) / 10;
}

function gunTag(record) {
  const cls = { "가": "comp", "나": "subj", "다": "" }[record.gun] || "";
  const label = ["가", "나", "다", "라", "마"].includes(record.gun) ? `${record.gun}군` : (record.gun || "기타");
  return `<span class="track-tag ${cls}">${escapeHtml(label)}</span>`;
}

function sortableTh(extra, key, label, sub) {
  const active = state.sort === key;
  return `<th class="${extra} sortable${active ? " active" : ""}" data-sort="${key}" role="button" tabindex="0" title="${escapeAttr(label)} 정렬">${escapeHtml(label)}${sub ? ` <span>${escapeHtml(sub)}</span>` : ""}<i class="sort-mark">▲</i></th>`;
}

function renderResults(records) {
  if (!records.length) return `<div class="empty"><div>조건에 맞는 모집단위가 없습니다.</div></div>`;
  const start = (state.page - 1) * state.pageSize;
  const pageRecords = records.slice(start, start + state.pageSize);
  const maxPage = Math.max(1, Math.ceil(records.length / state.pageSize));
  const selected = byId(state.selectedId) || pageRecords[0];
  return `
    <div class="result-layout">
      <div class="table-shell">
        <div class="table-scroll">
          <table>
            <thead>
              <tr>
                <th class="col-select">선택</th>
                <th class="col-uni">대학</th>
                <th class="col-major">모집단위 · 전형</th>
                <th class="col-yr">모집</th>
                <th class="col-yr">경쟁률</th>
                ${sortableTh("col-yr col-primary", "avg70_desc", "평균백분위 70%", "환산70 별도표시")}
              </tr>
            </thead>
            <tbody>${pageRecords.map(renderRow).join("")}</tbody>
          </table>
        </div>
        <div class="pager">
          <span>${(start + 1).toLocaleString("ko-KR")}-${Math.min(start + state.pageSize, records.length).toLocaleString("ko-KR")} / ${records.length.toLocaleString("ko-KR")}</span>
          <div class="pager-actions">
            <button class="button secondary" data-action="prev-page" ${state.page <= 1 ? "disabled" : ""}>이전</button>
            <button class="button secondary" data-action="next-page" ${state.page >= maxPage ? "disabled" : ""}>다음</button>
          </div>
        </div>
      </div>
      ${renderDetail(selected)}
    </div>`;
}

function renderRow(record) {
  const sel = String(record.id) === String(state.selectedId) ? "selected" : "";
  const checked = state.savedIds.has(String(record.id)) ? "checked" : "";
  return `
    <tr class="${sel}" data-id="${record.id}" tabindex="0" role="button" aria-pressed="${sel ? "true" : "false"}">
      <td class="col-select">
        <input class="save-check" type="checkbox" data-save-id="${escapeAttr(record.id)}" ${checked} aria-label="${escapeAttr(record.university)} ${escapeAttr(record.dept)} 저장" />
      </td>
      <td class="col-uni"><div class="cell-main"><strong title="${escapeAttr(record.university)}">${escapeHtml(record.university)}</strong><span>${escapeHtml(record.region)}</span></div></td>
      <td class="col-major"><div class="cell-main"><strong title="${escapeAttr(record.dept)}">${escapeHtml(record.dept)}${record.variant ? ` <span class="variant-tag">${escapeHtml(record.variant)}</span>` : ""}</strong><span title="${escapeAttr(record.jname)}">${gunTag(record)} <b class="jeonhyeong">${escapeHtml(shortAdmission(record.jname))}</b>${rowStatusTags(record)}</span></div></td>
      <td class="col-yr">${latestCell(record, recruit)}</td>
      <td class="col-yr">${latestCell(record, competition)}</td>
      <td class="col-yr col-primary">${score3(record)}${diffBadge(record)}</td>
    </tr>`;
}

function cellVal(v) { return v == null ? "–" : v; }
function latestCell(record, accessor) {
  const found = latestEntry(record, accessor);
  if (!found) return "–";
  const year = found.year === RESULT_YEAR ? "" : ` <span class="cell-year">${String(found.year).slice(2)}</span>`;
  return `${escapeHtml(found.value)}${year}`;
}

// 한 지표의 3개년 값을 한 셀에 미니표기. 2026 강조.
function yr3(record, accessor) {
  const cells = YEARS.map((y) => {
    const v = accessor(record, y);
    const now = y === RESULT_YEAR;
    return `<span class="y${now ? " now" : ""}"><i>${String(y).slice(2)}</i>${v == null ? "–" : v}</span>`;
  }).join("");
  return `<div class="yr3">${cells}</div>`;
}

function score3(record) {
  const cells = YEARS.map((y) => {
    const metric = resultScore(record, y);
    const now = y === RESULT_YEAR;
    const cls = ["y", now ? "now" : "", metric.type === "scale" ? "scale" : "", metric.type === "empty" ? "empty" : ""].filter(Boolean).join(" ");
    const label = metric.type === "scale" ? "<em>환</em>" : "";
    const value = metric.value == null ? "–" : metric.value;
    return `<span class="${cls}" title="${escapeAttr(metric.title)}"><i>${String(y).slice(2)}</i>${label}<b>${escapeHtml(value)}</b></span>`;
  }).join("");
  return `<div class="yr3 score3">${cells}</div>`;
}

// 수능 반영 과목 수 배지 — 반영비율 표에 명시된 소수영역(1~3과목) 모집단위만(확인된 것만)
function areaTag(record) {
  if (!record.areas) return "";
  const n = record.areas.length;
  return ` <span class="area-tag" title="이 모집단위는 수능 ${n}과목(${record.areas.join("·")})만 반영합니다. 평균백분위가 4과목 반영 대학과 다른 척도이니 비교에 주의하세요.">수능 ${n}과목</span>`;
}

function scaleTag(record) {
  return "";
}

function missingYearTag(record) {
  if (yearData(record, RESULT_YEAR) || !hasAnyYearData(record)) return "";
  if (relatedHistory(record).some((r) => yearData(r, RESULT_YEAR))) {
    return ` <span class="year-tag related-year" title="같은 대학·모집단위의 ${RESULT_YEAR}학년도 결과가 전형명 또는 모집군이 바뀐 별도 원자료 행에 있습니다. 상세의 관련 전형 결과를 확인하세요.">관련연도</span>`;
  }
  return ` <span class="year-tag related-year" title="전형명 또는 모집군 변경으로 ${RESULT_YEAR}학년도 결과가 다른 원자료 행에 있을 수 있습니다. 대학명과 모집단위 중심으로 함께 확인하세요.">관련연도</span>`;
}

function rowStatusTags(record) {
  return `${areaTag(record)}${scaleTag(record)}${missingYearTag(record)}`;
}

function scaleOnlyNotice(record) {
  if (!hasHwansanFallback(record)) return "";
  return `<p class="cmp-note warn">백분위가 없는 연도는 <b>대학별 환산점수 70%컷</b>을 파란색 환산70으로 표시합니다. 환산점수는 대학별 만점·산출식이 달라 대학 간 백분위 비교와 내 백분위 매칭에서는 제외하고, 같은 대학·같은 전형 안의 참고값으로 보세요.</p>`;
}

// 내 백분위 입력 시: 최신 70%컷과의 차를 표기(+여유 / -부족)
function diffBadge(record) {
  const d = pctDiff(record);
  if (d === null) return "";
  const sign = d > 0 ? "+" : "";
  const cls = d >= 0 ? "up" : "down";
  return `<div class="diff-badge ${cls}" title="내 백분위 − 70%컷">${sign}${d.toFixed(1)}</div>`;
}

/* ---------- 상세 패널 ---------- */
function renderDetail(record) {
  if (!record) return `<aside class="detail-panel"><div class="panel panel-pad empty">선택된 모집단위가 없습니다.</div></aside>`;
  return `
    <aside class="detail-panel">
      <section class="panel panel-pad">
        <div class="detail-head">
          <div class="chip-row">
            ${gunTag(record)}
            <span class="chip">${escapeHtml(record.region)}</span>
            <span class="chip">${escapeHtml(record.jtype || "수능위주")}</span>
            ${record.variant ? `<span class="chip">${escapeHtml(record.variant)}</span>` : ""}
          </div>
          <h2>${escapeHtml(record.university)} ${escapeHtml(record.dept)}</h2>
          <p class="detail-jeonhyeong">${escapeHtml(record.jname)}</p>
        </div>
        ${record.areas ? `<p class="area-note">⚠ 이 모집단위는 수능 <b>${record.areas.length}과목</b>(${record.areas.join("·")})만 반영합니다(반영비율 표 기준). 평균백분위는 이 과목들의 평균이라 4과목 반영 대학과 직접 비교는 부적절합니다.</p>` : ""}
        ${scaleOnlyNotice(record)}
        <div class="section-title"><h3>모집 · 경쟁 · 충원</h3><span>2024·2025·2026</span></div>
        ${recruitTable(record)}
        ${relatedHistoryTable(record)}
      </section>
      <section class="panel panel-pad">
        <div class="section-title"><h3>수능 백분위 (3개년)</h3><span>국·수·탐·영</span></div>
        <p class="cmp-note">백분위는 대학 간 단순 비교를 위해 사용한 공통 척도입니다. <b>표준점수·환산점수</b>를 반영하는 대학은 실제 반영식에 따라 백분위 순서와 유불리가 달라질 수 있습니다.</p>
        <div class="sub-h">70%컷 (국·수·탐·영)</div>
        ${pctTable(record, "p70")}
        <div class="sub-h">50%컷 (국·수·탐·영)</div>
        ${pctTable(record, "p50")}
        <details class="method-details" style="margin-top:12px">
          <summary>수능 환산점수 (대학별 산출식 참고)</summary>
          <p class="cmp-note warn">환산점수는 대학별 만점·산출식이 달라 대학 간 직접 비교보다 같은 대학·같은 전형 안의 참고값으로 보세요.</p>
          ${hwansanTable(record)}
        </details>
        ${notes(record)}
      </section>
    </aside>`;
}

// 모집·경쟁·충원 (3개년)
function recruitTable(record) {
  const rows = YEARS.map((y) => {
    const d = yearData(record, y);
    const now = y === RESULT_YEAR ? "now-row" : "";
    if (!d) return `<tr class="${now}"><th>${y}</th><td colspan="5" class="muted-cell">자료 없음</td></tr>`;
    return `<tr class="${now}"><th>${y}</th><td>${gunTag({ gun: d.gun || record.gun })}</td><td class="year-jname" title="${escapeAttr(d.jname || record.jname)}">${escapeHtml(d.jname || record.jname)}</td><td>${fmt(d.m?.[2])}</td><td>${fmt(d.c)}</td><td>${fmt(d.w)}</td></tr>`;
  }).join("");
  return `<div class="table-shell detail-3yr"><table>
    <thead><tr><th>연도</th><th>군</th><th>전형</th><th>모집</th><th>경쟁률</th><th>충원</th></tr></thead>
    <tbody>${rows}</tbody></table></div>`;
}

function relatedHistoryTable(record) {
  const rows = relatedHistory(record).flatMap((r) => (
    YEARS.map((y) => ({ record: r, year: y, data: yearData(r, y) }))
      .filter((row) => row.data)
  ));
  if (!rows.length) return "";
  rows.sort((a, b) => (
    a.year - b.year ||
    String(a.record.gun || "").localeCompare(String(b.record.gun || ""), "ko") ||
    String(a.record.jname || "").localeCompare(String(b.record.jname || ""), "ko")
  ));
  const body = rows.map(({ record: r, year, data }) => (
    `<tr>
      <th>${year}</th>
      <td>${gunTag(r)}</td>
      <td class="related-name" title="${escapeAttr(r.jname)}">${escapeHtml(shortAdmission(r.jname))}</td>
      <td>${fmt(data.m?.[2])}</td>
      <td>${fmt(data.c)}</td>
      <td>${fmt(data.w)}</td>
      <td>${scoreInline(r, year)}</td>
    </tr>`
  )).join("");
  return `<div class="related-history">
    <div class="section-title"><h3>모집군 변경/관련 전형 결과</h3><span>원자료 별도 행</span></div>
    <p class="related-note">같은 대학·모집단위·전형 계열이지만 모집군 또는 전형명이 달라 별도 원자료 행으로 보관된 결과입니다.</p>
    <div class="table-shell detail-3yr related-table"><table>
      <thead><tr><th>연도</th><th>군</th><th>전형</th><th>모집</th><th>경쟁률</th><th>충원</th><th>평균70/환산70</th></tr></thead>
      <tbody>${body}</tbody>
    </table></div>
  </div>`;
}

function scoreInline(record, year) {
  const metric = resultScore(record, year);
  if (metric.value == null) return "–";
  if (metric.type === "scale") {
    return `<span class="inline-scale" title="${escapeAttr(metric.title)}">환산 ${escapeHtml(metric.value)}</span>`;
  }
  return `<strong>${escapeHtml(metric.value)}</strong>`;
}

function tamgu(p) {
  const a = fmt(p.t1), b = fmt(p.t2);
  if (a === "–" && b === "–") return "–";
  if (b === "–") return a;
  if (a === "–") return b;
  return `${a} / ${b}`;
}

// 수능 백분위(70%컷 또는 50%컷)를 3개년 과목별로. 2026 강조.
// 연도별 발표 표 구조에 따라 제공되는 백분위 항목만 표시(미제공 칸은 자료 없음).
function pctTable(record, key) {
  const rows = YEARS.map((y) => {
    const d = yearData(record, y);
    const now = y === RESULT_YEAR ? "now-row" : "";
    const p = d?.[key];
    if (!p) return `<tr class="${now}"><th>${y}</th><td colspan="6" class="muted-cell">자료 없음</td></tr>`;
    return `<tr class="${now}"><th>${y}</th><td>${fmt(p.kor)}</td><td>${fmt(p.math)}</td><td>${tamgu(p)}</td><td><strong>${fmt(p.avg)}</strong></td><td>${fmt(p.eng)}</td><td>${fmt(p.hist)}</td></tr>`;
  }).join("");
  return `<div class="table-shell detail-3yr"><table>
    <thead><tr><th>연도</th><th>국어</th><th>수학</th><th>탐구</th><th>평균</th><th>영어</th><th>한국사</th></tr></thead>
    <tbody>${rows}</tbody></table></div>`;
}

// 수능 환산점수 (3개년) — 연도별 만점·척도 달라 직접 비교 부적절
function hwansanTable(record) {
  const rows = YEARS.map((y) => {
    const d = yearData(record, y);
    const now = y === RESULT_YEAR ? "now-row" : "";
    if (!d) return `<tr class="${now}"><th>${y}</th><td colspan="3" class="muted-cell">자료 없음</td></tr>`;
    return `<tr class="${now}"><th>${y}</th><td>${fmt(d.hs?.[0])}</td><td>${fmt(d.hs?.[1])}</td><td>${fmt(d.hs?.[2])}</td></tr>`;
  }).join("");
  return `<div class="table-shell detail-3yr"><table>
    <thead><tr><th>연도</th><th>환산50%</th><th>환산70%</th><th>총점</th></tr></thead>
    <tbody>${rows}</tbody></table></div>`;
}

function notes(record) {
  const items = YEARS.map((y) => {
    const d = yearData(record, y);
    return d?.note ? `<li><b>${y}</b> ${escapeHtml(d.note)}</li>` : "";
  }).filter(Boolean).join("");
  return items ? `<ul class="note-list">${items}</ul>` : "";
}

/* ---------- 초기화 ---------- */
function showBootError(title, detail) {
  const app = document.querySelector("#app");
  if (app) app.innerHTML = `<div class="boot-panel error"><strong>${escapeHtml(title)}</strong><span>${escapeHtml(detail)}</span></div>`;
}
async function init() {
  try {
    DATA = await loadJeongsiData();
  } catch (e) {
    showBootError("입결 데이터를 불러오지 못했습니다.", `${DATA_URL} 또는 ${DATA_SCRIPT_URL} 파일을 확인하세요. (${e.message})`);
    return;
  }
  if (!DATA.records?.length) {
    showBootError("데이터가 비어 있습니다.", "scripts/prepare_data.py를 실행해 data/jeongsi-data.json을 생성하세요.");
    return;
  }
  mount();
}
init();
