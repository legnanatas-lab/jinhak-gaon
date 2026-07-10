/*
 * 대학발표 입시결과 조회
 * 대학이 발표한 2024·2025·2026 수시 입결의 70%컷·50%컷을
 * 모집단위별로 3개년 비교하는 데이터 조회 도구. (참고용, 판정/추천 없음)
 * 모집·경쟁·충원은 상세 패널에서 참고 표기(2024/25는 보조 XLSX 계열대표).
 */
let DATA = { metadata: {}, records: [] };
const DATA_URL = "./data/admission-data.json";
const DATA_SCRIPT_URL = "./data/admission-data.js";
const DATA_GLOBAL = "__GAONGIL_ADMISSION_DATA__";
const PLAN2027 = Array.isArray(window.__GAONGIL_SUSI_2027_PLAN__) ? window.__GAONGIL_SUSI_2027_PLAN__ : [];
const YEARS = [2024, 2025, 2026];

const METRICS = [
  { key: "grade70", label: "70%컷", kind: "grade" },
  { key: "grade50", label: "50%컷", kind: "grade" },
];

const ADMISSION_RESULT_LINKS = [
  { key: "susi", label: "수시결과", href: "./susi.html?v=26" },
  { key: "jeongsi", label: "정시결과", href: "./jeongsi/index.html?v=26" },
];

const RESOURCE_LINKS_2028 = [
  { key: "gyogwa70cut", label: "5등급 변환 교과 70% 컷", href: "./gyogwa70cut.html?v=25" },
  { key: "jonghap70cut", label: "5등급 변환 종합 70% 컷", href: "./jonghap70cut.html?v=25" },
  { key: "gyogwa_change_2028", label: "교과전형 변화", href: "./2028gyogwa-change.html" },
  { key: "hakjong2028", label: "학생부종합 안내", href: "./hakjong2028.html" },
  { key: "castrow2028", label: "수능최저 빠른보기", href: "./2028castrow.html" },
  { key: "suneung2028", label: "수능·정시 안내", href: "./2028suneung.html" },
  { key: "gyogwa2028", label: "교과 반영 방법", href: "./2028gyogwa.html" },
  { key: "uni15_2028", label: "15개 대학 분석", href: "./202815uni.html" },
  { key: "ist2028", label: "과학기술원", href: "./2028ist.html" },
  { key: "edu2028", label: "교육대학교", href: "./2028edu.html" },
  { key: "nonsul2028", label: "논술전형", href: "./2028nonsul.html" },
];

const RESOURCE_LINKS_COUNSELING = [
  { key: "unimo", label: "대학 등록금", href: "./unimo.html" },
  { key: "jonghap_eval", label: "종합 서류평가", href: "./jonghap_eval.html" },
  { key: "jonghap_interview", label: "종합 면접평가", href: "./jonghap_interview.html" },
  { key: "sub2", label: "선택과목 추천", href: "./sub2.html" },
  { key: "jinrodesign", label: "진로·학업 설계", href: "./jinrodesign.html" },
];
const RESOURCE_LINKS_INFO = [
  { key: "unimap", label: "4년제 대학 입학 안내 지도", href: "./unimap.html" },
  { key: "twounimap", label: "전문대 입학 안내 지도", href: "./2unimap.html" },
  { key: "highschoolmap", label: "고등학교 지도", href: "./highschoolmap.html" },
];

const RESOURCE_LINKS_LEARNING = [
  { key: "preview", label: "내신 학습법", href: "./preview.html" },
  { key: "csat2028", label: "2028 수능 5교과", href: "./csat2028.html" },
  { key: "sciencetam", label: "과학 탐구활동", href: "./sciencetam.html" },
  { key: "socialtam", label: "사회 탐구활동", href: "./socialtam.html" },
  { key: "ai_prompt", label: "AI 데이터 분석", href: "./ai_prompt.html" },
  { key: "aisc", label: "지구과학 탐구주제", href: "./aisc.html" },
  { key: "saenggibu_check", label: "생기부 점검", href: "./saenggibu_check.html" },
];

const RESOURCE_LINKS_2027 = [
  { key: "gosa", label: "2027학년도 수시 대학별고사 일정 캘린더", href: "./2027gosa.html" },
  { key: "gyogwa", label: "학생부교과", href: "./2027gyogwa.html" },
  { key: "special", label: "농어촌학생", href: "./2027special.html" },
  { key: "chuchon", label: "학교장추천", href: "./2027chuchon.html" },
  { key: "localmedi", label: "지역인재", href: "./localmedi.html" },
  { key: "cheomdan", label: "계약·첨단학과", href: "./2027cheomdan.html" },
  { key: "medi", label: "지역의사", href: "./2027medi.html" },
  { key: "yeche", label: "예체능 비실기", href: "./2027yeche.html" },
  { key: "specialized", label: "특성화고 기준학과", href: "./2027-specialized-highschool-standards.html" },
  { key: "procollege6", label: "전문대 간호·보건", href: "./procollege6.html" },
  { key: "prelearning", label: "선행학습 보고서", href: "./2026prelearning-report.html" },
  { key: "susi_download", label: "수시모집요강", href: "./2027susi-download.html" },
];

const state = {
  query: "",
  university: "",
  major: "",
  regions: new Set(),
  tracks: new Set(),
  domains: new Set(),
  field: "",
  grade: "",
  sort: "cut70",
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

// 단일 등급 필터: 입력 등급 ±GRADE_BAND 범위의 2026 70%컷만 표시.
const GRADE_BAND = 0.2;

let lastView = [];

/* ---------- 유틸 ---------- */

function byId(id) {
  return DATA.records.find((record) => String(record.id) === String(id));
}

function normalize(value) {
  return String(value || "")
    .trim()
    .toLowerCase()
    .replace(/\s+/g, "")
    .replace(/[\(\)\[\]\{\}·ㆍ,./_\-:]/g, "");
}

function toNumber(value) {
  if (value === "" || value === null || value === undefined) return null;
  const number = Number(value);
  return Number.isFinite(number) ? number : null;
}

function formatNumber(value, digits = 2) {
  if (value === null || value === undefined || Number.isNaN(value)) return "–";
  const number = Number(value);
  if (!Number.isFinite(number)) return "–";
  if (digits === 0) return Math.round(number).toLocaleString("ko-KR");
  return number.toLocaleString("ko-KR", { minimumFractionDigits: 0, maximumFractionDigits: digits });
}

function formatGrade(value) {
  return formatNumber(value, 2);
}

function fmtMetric(kind, value) {
  if (value === null || value === undefined || Number.isNaN(value)) return "–";
  return formatGrade(value);
}

function escapeHtml(value) {
  return String(value ?? "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
}

function escapeAttr(value) {
  return escapeHtml(value);
}

function debounce(fn, wait = 160) {
  let timer = null;
  return (...args) => {
    if (timer) clearTimeout(timer);
    timer = setTimeout(() => {
      timer = null;
      fn(...args);
    }, wait);
  };
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

async function loadAdmissionData() {
  if (window[DATA_GLOBAL]?.records?.length) return window[DATA_GLOBAL];
  if (location.protocol === "file:") {
    return loadDataScript(DATA_SCRIPT_URL, DATA_GLOBAL);
  }
  try {
    const response = await fetch(DATA_URL, { cache: "no-cache" });
    if (!response.ok) throw new Error(`HTTP ${response.status}`);
    return response.json();
  } catch (error) {
    if (window[DATA_GLOBAL]?.records?.length) return window[DATA_GLOBAL];
    try {
      return await loadDataScript(DATA_SCRIPT_URL, DATA_GLOBAL);
    } catch {
      throw error;
    }
  }
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

function topMenusHtml(currentKey = "susi") {
  return [
    resourceMenuHtml("입시결과", ADMISSION_RESULT_LINKS, currentKey, "입시결과 메뉴"),
    resourceMenuHtml("상담자료", RESOURCE_LINKS_COUNSELING, currentKey, "상담자료 메뉴"),
    resourceMenuHtml("2028 자료", RESOURCE_LINKS_2028, currentKey, "2028 학년도 대입 자료 메뉴"),
    resourceMenuHtml("2027 자료", RESOURCE_LINKS_2027, currentKey, "2027 학년도 대입 자료 메뉴"),
    resourceMenuHtml("정보", RESOURCE_LINKS_INFO, currentKey, "정보 메뉴"),
    resourceMenuHtml("학습", RESOURCE_LINKS_LEARNING, currentKey, "학습 메뉴"),
  ].join("");
}

/* ---------- 연도별 데이터 접근 ---------- */

// 특정 연도의 지표 묶음을 반환(없으면 null).
// 70/50컷은 어디가 CSV(정확), 모집·경쟁·충원은 2024/2025=수시 XLSX 계열대표(참고)·2026=해당 전형.
// 신뢰할 수 없는 등급(1.0/1.0 placeholder, 50>70 역전)은 모든 연도에서 자료없음(null) 처리.
function yearData(record, year) {
  let data;
  if (year === 2026) {
    data = {
      grade70: record.grade70,
      grade50: record.grade50,
      recruit: record.recruit2026 ?? null,
      competition: record.competition2026 ?? null,
      waitlist: record.waitlist2026 ?? null,
      realCompetition: record.realCompetition2026 ?? null,
      fillRate: record.fillRate2026 ?? null,
    };
  } else {
    const history = record.history?.years?.[String(year)];
    if (!history) return null;
    data = {
      grade70: history.grade70 ?? null,
      grade50: history.grade50 ?? null,
      recruit: history.recruit ?? null,
      competition: history.competition ?? null,
      waitlist: history.waitlist ?? null,
      realCompetition: history.realCompetition ?? null,
      fillRate: history.fillRate ?? null,
    };
  }
  const placeholder = data.grade50 === 1 && data.grade70 === 1;
  const inverted = data.grade50 !== null && data.grade70 !== null && data.grade50 > data.grade70;
  if (placeholder || inverted) {
    data.grade50 = null;
    data.grade70 = null;
  }
  return data;
}

function metricValue(record, year, key) {
  const data = yearData(record, year);
  return data ? data[key] : null;
}

function delta2526(record) {
  return record.history?.trend?.deltaFrom2025 ?? null;
}

/* ---------- 필터 / 정렬 ---------- */

// 공백/쉼표로 먼저 나눈 뒤 각 토큰을 정규화한다(여러 단어 AND 검색).
function tokenize(value) {
  return String(value || "")
    .split(/[\s,]+/)
    .map(normalize)
    .filter(Boolean);
}

function passesTokens(tokens, haystack) {
  return tokens.every((token) => haystack.includes(token));
}

function passesText(record, value, fields) {
  const tokens = tokenize(value);
  if (!tokens.length) return true;
  const haystack = fields.map((field) => normalize(record[field])).join("");
  return passesTokens(tokens, haystack);
}

function filteredRecords() {
  const grade = toNumber(state.grade);
  const lo = grade === null ? null : grade - GRADE_BAND;
  const hi = grade === null ? null : grade + GRADE_BAND;
  const queryTokens = tokenize(state.query);

  return DATA.records.filter((record) => {
    if (queryTokens.length && !passesTokens(queryTokens, record.searchText)) return false;
    if (!passesText(record, state.university, ["university", "universityCanon"])) return false;
    if (!passesText(record, state.major, ["major", "program"])) return false;
    if (state.regions.size && !state.regions.has(record.region)) return false;
    if (state.tracks.size && !state.tracks.has(record.track)) return false;
    if (state.domains.size && !state.domains.has(record.domain || "미분류")) return false;
    if (state.field && (record.field || "미분류") !== state.field) return false;
    // 등급 필터: 입력 등급 ±0.5의 2026 70%컷만(자료없음 제외).
    if (grade !== null) {
      const cut70 = metricValue(record, 2026, "grade70");
      if (cut70 === null || cut70 < lo || cut70 > hi) return false;
    }
    return true;
  });
}

function sortRecords(records) {
  const sorted = [...records];
  const asc = (value) => (value ?? Infinity);
  // 정렬도 표시되는 2026 값 기준(placeholder·역전 등급은 null → 맨 뒤로).
  const v = (record, key) => metricValue(record, 2026, key);
  sorted.sort((a, b) => {
    switch (state.sort) {
      case "cut50":
        return asc(v(a, "grade50")) - asc(v(b, "grade50")) || a.university.localeCompare(b.university, "ko");
      case "change":
        return asc(delta2526(a)) - asc(delta2526(b));
      case "cut70":
      default:
        return asc(v(a, "grade70")) - asc(v(b, "grade70")) || a.university.localeCompare(b.university, "ko");
    }
  });
  return sorted;
}

function visibleRecords() {
  lastView = sortRecords(filteredRecords());
  if (!state.selectedId || !lastView.some((record) => record.id === state.selectedId)) {
    state.selectedId = lastView[0]?.id || null;
  }
  const maxPage = Math.max(1, Math.ceil(lastView.length / state.pageSize));
  if (state.page > maxPage) state.page = maxPage;
  return lastView;
}

/* ---------- 마운트 ---------- */

function mount() {
  const app = document.querySelector("#app");
  app.innerHTML = `
    <header class="topbar">
      <div class="topbar-inner">
        <div class="brand">
          <div class="brand-mark logo-mark">
            <img src="./assets/gaongil-logo.png" alt="가온길 에듀 가온길 입시전략연구소" />
          </div>
          <div>
            <h1>수시결과 + 2027 모집정보</h1>
            <p>2024·2025·2026 입결을 선택하면 같은 대학·학과의 2027 모집인원·전형방법·수능최저를 함께 확인합니다.</p>
          </div>
        </div>
        <div class="top-actions">
          <a class="button secondary" href="./index.html" title="메인페이지로 이동">메인</a>
          ${topMenusHtml("susi")}
        </div>
      </div>
    </header>

    <div class="notice-bar" role="note">
      <span class="notice-tag">⚠ 주의</span>
      <span>사례등급은 대학 등급산출방법에 따라 평균등급과 차이가 날 수 있습니다. 2027 모집정보는 같은 대학·학과명 기준으로 연결되며 최종 지원 전 모집요강 확인이 필요합니다.</span>
    </div>

    <section id="savedPanel" class="saved-panel" aria-live="polite"></section>

    <main class="main-layout">
      <aside class="sidebar">
        ${renderFilterPanel()}
      </aside>
      <section class="content">
        <div class="panel">
          <div class="toolbar">
            <div class="field">
              <label for="query">통합 검색</label>
              <input id="query" class="control" value="${escapeAttr(state.query)}" placeholder="대학, 학과, 전형, 지역" />
            </div>
            <div class="field">
              <label for="university">대학명</label>
              <input id="university" class="control" value="${escapeAttr(state.university)}" placeholder="예: 경북대" />
            </div>
            <div class="field">
              <label for="major">모집단위</label>
              <input id="major" class="control" value="${escapeAttr(state.major)}" placeholder="예: 간호, 컴퓨터" />
            </div>
            <div class="field">
              <label for="sort">정렬</label>
              <select id="sort" class="select">
                ${option("cut70", "2026 70%컷 낮은순", state.sort)}
                ${option("cut50", "2026 50%컷 낮은순", state.sort)}
                ${option("change", "70%컷 강화순(25→26)", state.sort)}
              </select>
            </div>
          </div>
          <div id="resultSummary" class="result-summary"></div>
          <div id="tabContent" class="tab-content"></div>
        </div>
        <footer class="site-footer">
          <div class="footer-brand gaongil-footer-brand">
            <img src="./assets/gaongil-logo.png" alt="가온길 에듀" />
            <span>
              <strong>가온길 에듀</strong>
              <em>가온길 입시전략연구소</em>
            </span>
          </div>
          <div><strong>제작</strong> 가온길 에듀 가온길 입시전략연구소</div>
          <div><strong>출처</strong> 대입정보포털(ADIGA) · 대학별 발표 수시 입결</div>
        </footer>
      </section>
    </main>
  `;

  bindStaticEvents();
  renderDynamic();
}

function renderFilterPanel() {
  return `
    <section class="panel panel-pad">
      <div class="section-title">
        <h2>필터</h2>
        <span>수시 입결</span>
      </div>
      <div class="field-grid">
        <div class="field">
          <label for="grade">내신 등급</label>
          <input id="grade" class="control" type="number" min="1" max="9" step="0.01" value="${escapeAttr(state.grade)}" placeholder="예: 3.5" inputmode="decimal" />
          <span class="field-hint">입력 등급 ±${GRADE_BAND} 범위의 70%컷만 표시</span>
        </div>
        <div class="field">
          <span class="label">중심전형</span>
          <div class="check-list compact">
            ${distributionChecks("track", DATA.metadata.distributions?.tracks || [])}
          </div>
        </div>
        <div class="field">
          <span class="label">인문/자연</span>
          <div class="check-list compact">
            ${distributionChecks("domain", DATA.metadata.distributions?.domains || [])}
          </div>
        </div>
        <div class="field">
          <label for="field">계열</label>
          <select id="field" class="select">
            ${fieldOptions()}
          </select>
          <span class="field-hint">대학어디가 소계열 분류 기준</span>
        </div>
        <div class="field">
          <span class="label">지역</span>
          <div class="check-list">
            ${distributionChecks("region", DATA.metadata.distributions?.regions || [])}
          </div>
        </div>
      </div>
    </section>
  `;
}

const FILTER_SETS = { region: () => state.regions, track: () => state.tracks, domain: () => state.domains };

function distributionChecks(type, items) {
  return items
    .map((item) => {
      const set = FILTER_SETS[type]();
      const checked = set.has(item.name) ? "checked" : "";
      return `
        <label class="check-item">
          <input type="checkbox" data-filter="${type}" value="${escapeAttr(item.name)}" ${checked} />
          <span>${escapeHtml(item.name)}</span>
          <span class="count">${formatNumber(item.count, 0)}</span>
        </label>
      `;
    })
    .join("");
}

// 계열(소계열) 드롭다운 — 건수 많은 순(메타 분포 순서 유지).
function fieldOptions() {
  const items = DATA.metadata.distributions?.fields || [];
  const head = `<option value="" ${state.field === "" ? "selected" : ""}>전체 계열</option>`;
  return head + items
    .map((item) => option(item.name, `${item.name} (${formatNumber(item.count, 0)})`, state.field))
    .join("");
}

function option(value, label, selected) {
  return `<option value="${escapeAttr(value)}" ${value === selected ? "selected" : ""}>${escapeHtml(label)}</option>`;
}

/* ---------- 이벤트 ---------- */

const debouncedRender = debounce(renderDynamic, 160);

function bindStaticEvents() {
  for (const id of ["query", "university", "major", "grade"]) {
    document.querySelector(`#${id}`).addEventListener("input", (event) => {
      state[id] = event.target.value;
      state.page = 1;
      debouncedRender();
    });
  }

  document.querySelector("#sort").addEventListener("change", (event) => {
    state.sort = event.target.value;
    state.page = 1;
    renderDynamic();
  });

  document.querySelector(".sidebar").addEventListener("change", (event) => {
    const target = event.target;
    if (target.matches("#field")) {
      state.field = target.value;
      state.page = 1;
      renderDynamic();
      return;
    }
    const type = target.dataset?.filter;
    if (type && FILTER_SETS[type]) {
      toggleSet(FILTER_SETS[type](), target.value, target.checked);
      state.page = 1;
      renderDynamic();
    }
  });

  document.querySelector(".top-actions").addEventListener("click", (event) => {
    if (event.target.closest("[data-action='reset']")) resetState();
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
  document.addEventListener("click", (event) => {
    if (event.target.closest(".resource-menu")) return;
    menus.forEach((menu) => {
      menu.open = false;
    });
  });
  document.addEventListener("keydown", (event) => {
    if (event.key !== "Escape") return;
    menus.forEach((menu) => {
      menu.open = false;
    });
  });
}

function toggleSet(set, value, checked) {
  if (checked) set.add(value);
  else set.delete(value);
}

function handleTabClick(event) {
  const saveToggle = event.target.closest("[data-save-id]");
  if (saveToggle) {
    const id = saveToggle.dataset.saveId;
    if (saveToggle.checked) state.savedIds.add(id);
    else state.savedIds.delete(id);
    state.selectedId = id;
    renderDynamic();
    focusRow(id);
    return;
  }
  const action = event.target.closest("[data-action]")?.dataset.action;
  if (action === "prev-page") {
    state.page = Math.max(1, state.page - 1);
    renderDynamic();
    return;
  }
  if (action === "next-page") {
    const maxPage = Math.max(1, Math.ceil(lastView.length / state.pageSize));
    state.page = Math.min(maxPage, state.page + 1);
    renderDynamic();
    return;
  }
  const header = event.target.closest("th[data-sort]");
  if (header) {
    state.sort = header.dataset.sort;
    state.page = 1;
    const select = document.querySelector("#sort");
    if (select) select.value = state.sort;
    renderDynamic();
    return;
  }
  const row = event.target.closest("tr[data-id]");
  if (row) {
    state.selectedId = row.dataset.id;
    renderDynamic();
    focusRow(state.selectedId);
  }
}

function handleSavedClick(event) {
  const reset = event.target.closest("[data-action='reset']");
  if (reset) {
    resetState();
    return;
  }
  const print = event.target.closest("[data-action='print-report']");
  if (print) {
    printSavedReport();
    return;
  }
  const clear = event.target.closest("[data-action='clear-saved']");
  if (clear) {
    state.savedIds.clear();
    renderDynamic();
    return;
  }
  const remove = event.target.closest("[data-remove-saved]");
  if (remove) {
    state.savedIds.delete(remove.dataset.removeSaved);
    renderDynamic();
    return;
  }
  const focus = event.target.closest("[data-focus-saved]");
  if (focus) {
    state.selectedId = focus.dataset.focusSaved;
    state.page = Math.max(1, Math.ceil((lastView.findIndex((record) => String(record.id) === String(state.selectedId)) + 1) / state.pageSize));
    renderDynamic();
    focusRow(state.selectedId);
  }
}

function handleSavedInput(event) {
  const key = event.target.dataset?.student;
  if (!key || !(key in state.student)) return;
  state.student[key] = event.target.value;
}

function focusRow(id) {
  if (!id) return;
  const el = document.querySelector(`#tabContent tr[data-id="${CSS.escape(id)}"]`);
  if (el) el.focus();
}

function handleTabKeydown(event) {
  const header = event.target.closest("th[data-sort]");
  if (header && (event.key === "Enter" || event.key === " ")) {
    event.preventDefault();
    state.sort = header.dataset.sort;
    state.page = 1;
    const select = document.querySelector("#sort");
    if (select) select.value = state.sort;
    renderDynamic();
    return;
  }
  const row = event.target.closest("tr[data-id]");
  if (!row) return;
  if (event.key === "Enter" || event.key === " ") {
    event.preventDefault();
    state.selectedId = row.dataset.id;
    renderDynamic();
    focusRow(state.selectedId);
  } else if (event.key === "ArrowDown" || event.key === "ArrowUp") {
    event.preventDefault();
    const sibling = event.key === "ArrowDown" ? row.nextElementSibling : row.previousElementSibling;
    if (sibling && sibling.matches("tr[data-id]")) sibling.focus();
  }
}

function resetState() {
  Object.assign(state, {
    query: "",
    university: "",
    major: "",
    field: "",
    grade: "",
    sort: "cut70",
    page: 1,
    selectedId: null,
  });
  state.regions.clear();
  state.tracks.clear();
  state.domains.clear();
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
            <b>${escapeHtml(record.university)} ${escapeHtml(record.major)}</b>
            <span>${trackTag(record)} ${escapeHtml(record.program)}</span>
            <em class="saved-plan-count">2027 모집정보 ${findPlansForRecord(record).length}건</em>
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

function reportGradeRows(record) {
  return YEARS.map((year) => {
    const data = yearData(record, year) || {};
    const fillRate = data.fillRate == null ? "–" : `${formatNumber(data.fillRate, 0)}%`;
    return `
      <tr>
        <td>${year}</td>
        <td>${formatGrade(data.grade70)}</td>
        <td>${formatGrade(data.grade50)}</td>
        <td>${formatNumber(data.recruit, 0)}</td>
        <td>${formatNumber(data.competition, 2)}</td>
        <td>${fillRate}</td>
      </tr>
    `;
  }).join("");
}


function reportPlanRows(record) {
  const plans = findPlansForRecord(record).slice(0, 8);
  if (!plans.length) return '<p class="muted">연결된 2027 모집정보 없음</p>';
  return `<table class="plan-report"><thead><tr><th>2027 전형</th><th>모집</th><th>전형방법</th><th>수능최저</th></tr></thead><tbody>${plans.map(plan => `<tr><td>${escapeHtml(planShortText(plan))}</td><td>${escapeHtml(String(plan.n || ''))}</td><td>${escapeHtml(String(plan.method || ''))}</td><td>${escapeHtml(String(plan.min || ''))}</td></tr>`).join('')}</tbody></table>`;
}

function printSavedReport() {
  const saved = savedRecords();
  if (!saved.length) {
    alert("먼저 표 왼쪽 선택 칸에서 모집단위를 저장해 주세요.");
    return;
  }
  const logoUrl = new URL("./assets/gaongil-logo.png", location.href).href;
  const today = new Date().toLocaleDateString("ko-KR");
  const contactPhone = "010-2370-7602";
  const rows = saved.map((record, index) => `
    <section class="report-card">
      <h2>${index + 1}. ${escapeHtml(record.university)} ${escapeHtml(record.major)}</h2>
      <p class="meta">${escapeHtml(record.region)} · ${escapeHtml(record.track)} · ${escapeHtml(record.program)}</p>
      <h3 class="report-subtitle">2027 모집정보</h3>
      ${reportPlanRows(record)}
      <h3 class="report-subtitle">입결 컷·경쟁 3개년</h3>
      <table>
        <thead><tr><th>연도</th><th>70%컷</th><th>50%컷</th><th>모집</th><th>경쟁률</th><th>충원율</th></tr></thead>
        <tbody>${reportGradeRows(record)}</tbody>
      </table>
    </section>
  `).join("");
  const html = `
    <!doctype html>
    <html lang="ko">
      <head>
        <meta charset="UTF-8" />
        <title>수시결과 상담 보고서</title>
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
            <h1>수시결과 상담 보고서</h1>
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
  const cut70 = records.map((record) => metricValue(record, 2026, "grade70")).filter((value) => value !== null);
  const median = cut70.length ? medianOf(cut70) : null;
  const universities = new Set(records.map((record) => record.university)).size;
  document.querySelector("#resultSummary").innerHTML = `
    <strong>${formatNumber(records.length, 0)}</strong>개 모집단위
    · ${formatNumber(universities, 0)}개 대학
    · 전체 ${formatNumber(DATA.records.length, 0)}건 중
    · 2026 70%컷 중앙값 <strong>${formatGrade(median)}</strong>
  `;
}

function medianOf(values) {
  const sorted = [...values].sort((a, b) => a - b);
  const mid = Math.floor(sorted.length / 2);
  return sorted.length % 2 ? sorted[mid] : (sorted[mid - 1] + sorted[mid]) / 2;
}

function trackTag(record) {
  if (record.trackType === "comprehensive") return `<span class="track-tag comp">종합</span>`;
  if (record.trackType === "subject") return `<span class="track-tag subj">교과</span>`;
  return escapeHtml(record.track);
}

// 정렬 가능한 표 헤더. 클릭 시 해당 기준으로 정렬되고 활성 표시(▲)된다.
function sortableTh(extraClass, sortKey, label, sub) {
  const active = state.sort === sortKey;
  return `<th class="${extraClass} sortable${active ? " active" : ""}" data-sort="${sortKey}" role="button" tabindex="0" title="${escapeAttr(label)} 정렬" aria-label="${escapeAttr(label)} 정렬">${escapeHtml(label)}${sub ? ` <span>${escapeHtml(sub)}</span>` : ""}<i class="sort-mark">▲</i></th>`;
}

// 한 지표의 3개년 값(24·25·26)을 한 셀에 압축 표기. 2026 강조.
function yr3(record, metric) {
  const cells = YEARS.map((year) => {
    const value = metricValue(record, year, metric.key);
    return `<span class="y${year === 2026 ? " now" : ""}"><i>${String(year).slice(2)}</i>${fmtMetric(metric.kind, value)}</span>`;
  }).join("");
  return `<div class="yr3">${cells}</div>`;
}

function renderResults(records) {
  if (!records.length) {
    return `<div class="empty"><div>조건에 맞는 모집단위가 없습니다.</div></div>`;
  }

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
                ${sortableTh("col-yr col-primary", "cut70", "70%컷", "24 · 25 · 26")}
                ${sortableTh("col-yr", "cut50", "50%컷", "24 · 25 · 26")}
                ${sortableTh("col-spark", "change", "70%컷 추이", "25→26")}
              </tr>
            </thead>
            <tbody>
              ${pageRecords.map(renderResultRow).join("")}
            </tbody>
          </table>
        </div>
        <div class="pager">
          <span>${formatNumber(start + 1, 0)}-${formatNumber(Math.min(start + state.pageSize, records.length), 0)} / ${formatNumber(records.length, 0)}</span>
          <div class="pager-actions">
            <button class="button secondary" data-action="prev-page" ${state.page <= 1 ? "disabled" : ""}>이전</button>
            <button class="button secondary" data-action="next-page" ${state.page >= maxPage ? "disabled" : ""}>다음</button>
          </div>
        </div>
      </div>
      ${renderDetail(selected)}
    </div>
  `;
}

function renderResultRow(record) {
  const selected = String(record.id) === String(state.selectedId) ? "selected" : "";
  const checked = state.savedIds.has(String(record.id)) ? "checked" : "";
  const ariaLabel = `${record.university} ${record.major}, 2026 70%컷 ${formatGrade(metricValue(record, 2026, "grade70"))}`;
  return `
    <tr class="${selected}" data-id="${record.id}" tabindex="0" role="button" aria-pressed="${selected ? "true" : "false"}" aria-label="${escapeAttr(ariaLabel)}">
      <td class="col-select">
        <input class="save-check" type="checkbox" data-save-id="${escapeAttr(record.id)}" ${checked} aria-label="${escapeAttr(record.university)} ${escapeAttr(record.major)} 저장" />
      </td>
      <td class="col-uni">
        <div class="cell-main">
          <strong title="${escapeAttr(record.university)}">${escapeHtml(record.university)}</strong>
          <span>${escapeHtml(record.region)}</span>
        </div>
      </td>
      <td class="col-major">
        <div class="cell-main">
          <strong title="${escapeAttr(record.major)}">${escapeHtml(record.major)}</strong>
          <span title="${escapeAttr(record.program)}">${trackTag(record)} <b class="jeonhyeong">${escapeHtml(record.program)}</b></span>
          <small class="plan-link-hint">2027 모집정보 ${findPlansForRecord(record).length}건</small>
        </div>
      </td>
      <td class="col-yr col-primary">${yr3(record, METRICS[0])}</td>
      <td class="col-yr">${yr3(record, METRICS[1])}</td>
      <td class="col-spark">${trendCell(record)}</td>
    </tr>
  `;
}

function renderDetail(record) {
  if (!record) {
    return `<aside class="detail-panel"><div class="panel panel-pad empty">선택된 모집단위가 없습니다.</div></aside>`;
  }
  const delta = delta2526(record);
  const deltaText =
    delta === null
      ? ""
      : `<span class="delta ${trendClass(record)}">25→26 ${delta > 0 ? "+" : ""}${formatGrade(delta)}</span>`;

  return `
    <aside class="detail-panel">
      <section class="panel panel-pad">
        <div class="detail-head">
          <div class="chip-row">
            ${trackTag(record)}
            <span class="chip">${escapeHtml(record.region)}</span>
            ${record.domain ? `<span class="chip">${escapeHtml(record.domain)}</span>` : ""}
            ${record.field ? `<span class="chip">${escapeHtml(record.field)}</span>` : ""}
          </div>
          <h2>${escapeHtml(record.university)} ${escapeHtml(record.major)}</h2>
          <p class="detail-jeonhyeong">${escapeHtml(record.program)}</p>
        </div>
        <div class="section-title">
          <h3>입결 컷 (3개년)</h3>
          ${deltaText}
        </div>
        ${renderCutTable(record)}
        <div class="trend-chart">${trendChart(record)}</div>
        <div class="chart-legend">
          <span class="lg lg70">70%컷</span>
          <span class="lg lg50">50%컷</span>
        </div>
      </section>
      <section class="panel panel-pad plan-2027-panel">
        <div class="section-title plan-title">
          <h3>2027학년도 수시모집정보</h3>
          <span>같은 대학·학과 기준</span>
        </div>
        ${renderPlanTable(record, {limit: 20})}
      </section>
      <section class="panel panel-pad">
        <div class="section-title">
          <h3>모집 · 경쟁 (3개년)</h3>
          <span>수시 입결</span>
        </div>
        ${renderCompTable(record)}
      </section>
    </aside>
  `;
}

function renderCutTable(record) {
  const rows = YEARS.map((year) => {
    const data = yearData(record, year);
    const now = year === 2026 ? "now-row" : "";
    const g70 = data ? fmtMetric("grade", data.grade70) : "–";
    const g50 = data ? fmtMetric("grade", data.grade50) : "–";
    return `<tr class="${now}"><th>${year}</th><td>${g70}</td><td>${g50}</td></tr>`;
  }).join("");
  return `
    <div class="table-shell detail-3yr">
      <table>
        <thead><tr><th>연도</th><th>70%컷</th><th>50%컷</th></tr></thead>
        <tbody>${rows}</tbody>
      </table>
    </div>
  `;
}

function renderCompTable(record) {
  const fmtCount = (v) => (v == null ? "–" : `${formatNumber(v, 0)}`);
  const fmtRatio = (v) => (v == null ? "–" : formatNumber(v, 2));
  const fmtPct = (v) => (v == null ? "–" : `${Math.round(v * 100)}%`);
  const rows = YEARS.map((year) => {
    const data = yearData(record, year);
    const now = year === 2026 ? "now-row" : "";
    if (!data || (data.recruit == null && data.competition == null)) {
      return `<tr class="${now}"><th>${year}</th><td colspan="4" class="muted-cell">자료 없음</td></tr>`;
    }
    return `
      <tr class="${now}">
        <th>${year}</th>
        <td>${fmtCount(data.recruit)}</td>
        <td>${fmtRatio(data.competition)}</td>
        <td>${fmtRatio(data.realCompetition)}</td>
        <td>${fmtPct(data.fillRate)}</td>
      </tr>
    `;
  }).join("");
  return `
    <div class="table-shell detail-3yr">
      <table>
        <thead><tr><th>연도</th><th>모집</th><th>경쟁률</th><th>실질경쟁</th><th>충원율</th></tr></thead>
        <tbody>${rows}</tbody>
      </table>
    </div>
  `;
}


/* ---------- 2027 모집정보 연결 ---------- */
const PLAN2027_INDEX = new Map();
const PLAN2027_UNI_INDEX = new Map();
let PLAN2027_INDEX_READY = false;

function baseUniName(value) {
  return normalize(String(value || '').replace(/\([^)]*\)/g, '').replace(/대학$/,'대'));
}

function majorKey(value) {
  return normalize(String(value || '')
    .replace(/학부|학과|전공|계열|과\(의예과\)|\(의예과\)|\(.*?\)/g, '')
    .replace(/의학/g, '의예')
    .replace(/치의학/g, '치의예')
    .replace(/한의학/g, '한의예')
    .replace(/약학/g, '약학')
    .replace(/수의학/g, '수의예'));
}

function buildPlanIndex() {
  if (PLAN2027_INDEX_READY) return;
  for (const plan of PLAN2027) {
    const uk = baseUniName(plan.u);
    const mk = majorKey(plan.m);
    if (!uk || !mk) continue;
    const key = `${uk}|${mk}`;
    if (!PLAN2027_INDEX.has(key)) PLAN2027_INDEX.set(key, []);
    PLAN2027_INDEX.get(key).push(plan);
    if (!PLAN2027_UNI_INDEX.has(uk)) PLAN2027_UNI_INDEX.set(uk, []);
    PLAN2027_UNI_INDEX.get(uk).push(plan);
  }
  PLAN2027_INDEX_READY = true;
}

function typeMatchesPlan(record, plan) {
  const pt = String(plan.t || plan.p || '');
  if (record.trackType === 'subject') return /교과|지역균형|학교장|추천/.test(pt);
  if (record.trackType === 'comprehensive') return /종합|서류|면접|학생부종합/.test(pt);
  return true;
}

function programSimilarity(record, plan) {
  const a = normalize(record.program || '');
  const b = normalize(`${plan.t || ''}${plan.p || ''}`);
  if (!a || !b) return 0;
  if (a === b) return 8;
  if (a.includes(b) || b.includes(a)) return 6;
  let score = 0;
  for (const token of ['일반','지역','균형','추천','학교장','농어촌','기회','특성화','고른','면접','서류','논술','교과','종합']) {
    if (a.includes(token) && b.includes(token)) score += 1;
  }
  return score;
}

function findPlansForRecord(record) {
  if (!record) return [];
  buildPlanIndex();
  const uk = baseUniName(record.university || record.universityCanon);
  const mk = majorKey(record.major);
  let candidates = PLAN2027_INDEX.get(`${uk}|${mk}`) || [];
  if (!candidates.length && uk && mk) {
    // 부분 일치 보완: 의학과(의예과) vs 의예과, 학부/전공 표기 차이 등
    candidates = (PLAN2027_UNI_INDEX.get(uk) || []).filter(plan => {
      const pm = majorKey(plan.m);
      return pm && (pm.includes(mk) || mk.includes(pm));
    });
  }
  const seen = new Set();
  const unique = [];
  for (const plan of candidates) {
    const key = [plan.u, plan.m, plan.t, plan.p, plan.n, plan.method, plan.min].map(x => String(x || '')).join('|');
    if (seen.has(key)) continue;
    seen.add(key);
    unique.push(plan);
  }
  return unique
    .sort((a, b) => {
      const sa = (typeMatchesPlan(record, a) ? 20 : 0) + programSimilarity(record, a);
      const sb = (typeMatchesPlan(record, b) ? 20 : 0) + programSimilarity(record, b);
      return sb - sa || String(a.t || '').localeCompare(String(b.t || ''), 'ko') || String(a.p || '').localeCompare(String(b.p || ''), 'ko');
    })
    .slice(0, 18);
}

function planShortText(plan) {
  return `${plan.t || '전형'} ${plan.p || ''}`.trim();
}

function compactText(value, fallback='–') {
  const text = String(value || '').trim();
  return text ? escapeHtml(text) : fallback;
}

function renderPlanTable(record, options = {}) {
  const plans = findPlansForRecord(record);
  if (!plans.length) {
    return `<div class="plan-empty">같은 대학·학과명으로 연결된 2027 모집정보가 없습니다. 학과 명칭이 바뀌었거나 통합모집일 수 있으므로 2027 모집요강에서 직접 확인하세요.</div>`;
  }
  const limit = options.limit || plans.length;
  const list = plans.slice(0, limit);
  return `
    <div class="plan-count">연결된 2027 모집정보 <b>${formatNumber(plans.length, 0)}</b>건${plans.length > limit ? ` · 상위 ${limit}건 표시` : ''}</div>
    <div class="table-shell plan-table-shell">
      <table class="plan-table">
        <colgroup>
          <col class="plan-col-type" />
          <col class="plan-col-n" />
          <col class="plan-col-method" />
          <col class="plan-col-min" />
        </colgroup>
        <thead><tr><th>2027 전형</th><th>모집</th><th>전형방법</th><th>수능최저</th></tr></thead>
        <tbody>
          ${list.map(plan => `
            <tr class="${typeMatchesPlan(record, plan) ? 'plan-related' : ''}">
              <th><b>${compactText(plan.t)}</b><span>${compactText(plan.p)}</span></th>
              <td class="numlike">${compactText(plan.n)}</td>
              <td>${compactText(plan.method)}</td>
              <td>${compactText(plan.min, '미반영')}</td>
            </tr>
          `).join('')}
        </tbody>
      </table>
    </div>
    <details class="plan-more"><summary>교과·서류·면접·일정 세부정보 보기</summary>
      <div class="plan-more-list">
      ${list.map(plan => `
        <article>
          <strong>${compactText(plan.u)} ${compactText(plan.m)} · ${compactText(plan.t)} ${compactText(plan.p)}</strong>
          <dl>
            <dt>교과</dt><dd>${compactText(plan.subj)}</dd>
            <dt>서류</dt><dd>${compactText(plan.doc)}</dd>
            <dt>면접</dt><dd>${compactText(plan.iv)}</dd>
            <dt>일정</dt><dd>${[plan.ann1 && `1단계 ${plan.ann1}`, plan.ivdate && `면접 ${plan.ivdate}`, plan.nonsul && `논술 ${plan.nonsul}`, plan.prac && `실기 ${plan.prac}`, plan.ann && `최초 ${plan.ann}`].filter(Boolean).map(escapeHtml).join(' · ') || '–'}</dd>
            <dt>비고</dt><dd>${compactText(plan.note)}</dd>
          </dl>
        </article>
      `).join('')}
      </div>
    </details>
  `;
}

/* ---------- 추세 / 차트 ---------- */

function cutSeries(record, key) {
  return YEARS.map((year) => ({ year, value: metricValue(record, year, key) }));
}

function trendValues(record) {
  return cutSeries(record, "grade70");
}

// 70컷 변화 방향 → 색상 클래스. 등급은 낮을수록 우수: delta<0이면 컷 상승(강화).
function trendClass(record) {
  const delta = delta2526(record);
  if (delta === null) return "flat";
  if (delta <= -0.3) return "up"; // 강화(컷 상승·어려워짐)
  if (delta >= 0.3) return "down"; // 완화(쉬워짐)
  return "flat";
}

function sparkline(record) {
  const values = trendValues(record).filter((item) => item.value !== null);
  if (values.length < 2) return `<span class="spark-empty">–</span>`;
  const width = 84;
  const height = 28;
  const pad = 4;
  const min = Math.min(...values.map((item) => item.value));
  const max = Math.max(...values.map((item) => item.value));
  const spread = Math.max(0.2, max - min);
  const points = values.map((item) => {
    const x = pad + ((item.year - 2024) / 2) * (width - pad * 2);
    const y = pad + ((item.value - min) / spread) * (height - pad * 2);
    return { x, y };
  });
  const line = points.map((p) => `${p.x},${p.y}`).join(" ");
  const last = points[points.length - 1];
  return `
    <svg class="spark ${trendClass(record)}" viewBox="0 0 ${width} ${height}" role="img" aria-label="70%컷 추이">
      <polyline class="line" points="${line}"></polyline>
      <circle class="dot end" cx="${last.x}" cy="${last.y}" r="2.6"></circle>
    </svg>
  `;
}

// 표의 "70%컷 추이" 칸: 스파크라인 + 25→26 변화(강화/완화/유사) 색상 배지.
function trendCell(record) {
  const delta = delta2526(record);
  const direction = record.history?.trend?.direction;
  let badge = `<span class="delta flat">–</span>`;
  if (delta !== null && direction && direction !== "자료부족") {
    if (direction === "유사") {
      badge = `<span class="delta flat">유사</span>`;
    } else {
      badge = `<span class="delta ${trendClass(record)}">${direction} ${formatGrade(Math.abs(delta))}</span>`;
    }
  }
  return `<div class="trend-cell">${sparkline(record)}${badge}</div>`;
}

function trendChart(record) {
  const s70 = cutSeries(record, "grade70");
  const s50 = cutSeries(record, "grade50");
  const present = [...s70, ...s50].filter((item) => item.value !== null).map((item) => item.value);
  if (present.length < 2) {
    return `<div class="empty">연결된 3개년 자료가 부족합니다.</div>`;
  }
  const width = 360;
  const height = 134;
  const padX = 30;
  const padY = 26;
  const min = Math.min(...present);
  const max = Math.max(...present);
  const spread = Math.max(0.4, max - min);
  const project = (series) =>
    series.map((item) => {
      const x = padX + ((item.year - 2024) / 2) * (width - padX * 2);
      if (item.value === null) return { ...item, x, y: null };
      const y = padY + ((item.value - min) / spread) * (height - padY * 2);
      return { ...item, x, y };
    });
  const p70 = project(s70);
  const p50 = project(s50);
  const poly = (pts) => pts.filter((p) => p.y !== null).map((p) => `${p.x},${p.y}`).join(" ");
  const dots = (pts, cls, label) =>
    pts
      .map((p) => {
        if (p.y === null) return "";
        const text = label ? `<text x="${p.x}" y="${p.y - 9}" text-anchor="middle">${formatGrade(p.value)}</text>` : "";
        return `<circle class="dot ${cls}" cx="${p.x}" cy="${p.y}" r="${label ? 4.5 : 3}"></circle>${text}`;
      })
      .join("");
  return `
    <svg viewBox="0 0 ${width} ${height}" role="img" aria-label="2024~2026 70%·50%컷 추이">
      <line class="axis" x1="${padX}" x2="${width - padX}" y1="${height - padY}" y2="${height - padY}"></line>
      <polyline class="line line50" points="${poly(p50)}"></polyline>
      <polyline class="line line70" points="${poly(p70)}"></polyline>
      ${dots(p50, "d50", false)}
      ${dots(p70, "d70", true)}
      ${s70.map((item) => {
        const x = padX + ((item.year - 2024) / 2) * (width - padX * 2);
        return `<text class="xlabel" x="${x}" y="${height - 6}" text-anchor="middle">${item.year}</text>`;
      }).join("")}
    </svg>
  `;
}

/* ---------- 초기화 ---------- */

function showBootError(title, detail) {
  const app = document.querySelector("#app");
  if (app) {
    app.innerHTML = `<div class="boot-panel error"><strong>${escapeHtml(title)}</strong><span>${escapeHtml(detail)}</span></div>`;
  }
}

async function init() {
  try {
    DATA = await loadAdmissionData();
  } catch (error) {
    showBootError("입결 데이터를 불러오지 못했습니다.", `${DATA_URL} 또는 ${DATA_SCRIPT_URL} 파일을 확인하세요. (${error.message})`);
    return;
  }
  if (!DATA.records?.length) {
    showBootError("데이터가 비어 있습니다.", "scripts/prepare_data.py를 실행해 data/admission-data.json을 생성하세요.");
    return;
  }
  mount();
}

init();
