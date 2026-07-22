const $ = id => document.getElementById(id);

const state = {
  cat: null,
  gyogwa: '',
  gwamok: '',
  yeong: '',
  kw: '',
  activeId: null
};

const esc = value => String(value ?? '').replace(/[&<>"']/g, char => ({
  '&': '&amp;',
  '<': '&lt;',
  '>': '&gt;',
  '"': '&quot;',
  "'": '&#39;'
}[char]));

const compact = (value, length = 72) => {
  const text = String(value ?? '').replace(/\s+/g, ' ').trim();
  return text.length > length ? `${text.slice(0, length - 1)}…` : text;
};

const cats = APP_META.categories;
const catBySlug = Object.fromEntries(cats.map(cat => [cat.slug, cat]));
const STORAGE_KEY = 'gaongil-selected-topics-v2';
const KCI_URL = 'https://www.kci.go.kr/kciportal/landing/articleSearch.kci';

const SEARCH_PROVIDERS = [
  {
    key: 'riss',
    name: 'RISS',
    sub: '학위논문·학술논문',
    icon: '📚',
    build: query => `https://www.riss.kr/search/Search.do?isDetailSearch=N&searchGubun=true&viewYn=OP&query=${encodeURIComponent(query)}`
  },
  {
    key: 'naver',
    name: 'NAVER 지식백과',
    sub: '개념·용어 검색',
    icon: '🟢',
    build: query => `https://terms.naver.com/search.naver?query=${encodeURIComponent(query)}`
  },
  {
    key: 'scholar',
    name: 'Google Scholar',
    sub: '국내외 학술자료',
    icon: '🎓',
    build: query => `https://scholar.google.co.kr/scholar?hl=ko&q=${encodeURIComponent(query)}`
  },
  {
    key: 'dbpia',
    name: 'DBpia',
    sub: '국내 학술논문 DB',
    icon: '📖',
    build: query => `https://www.dbpia.co.kr/search/topSearch?query=${encodeURIComponent(query)}`
  },
  {
    key: 'kci',
    name: 'KCI',
    sub: '한국연구재단 등재논문',
    icon: '🏛️',
    build: () => KCI_URL,
    copiesQuery: true
  }
];

const QUERY_STOPWORDS = new Set([
  '대한', '관한', '관련', '하는', '통한', '위한', '에서', '으로', '보고서', '탐구', '주제',
  '분석', '연구', '프로젝트', '활동', '사례', '영향', '평가', '방안', '효과', '의미'
]);

let selectedKeys = new Set(loadSelected());
let expandedSelectedKeys = new Set();
let toastTimer = null;

function itemKey(item) {
  return `${item._slug}:${item._sourceIndex}`;
}

function loadSelected() {
  try {
    const value = JSON.parse(localStorage.getItem(STORAGE_KEY) || '[]');
    return Array.isArray(value) ? value : [];
  } catch (error) {
    return [];
  }
}

function saveSelected() {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify([...selectedKeys]));
  } catch (error) {
    // 사생활 보호 모드 등 localStorage가 막힌 환경에서도 화면 기능은 계속 동작한다.
  }
  updateSelectedCount();
}

function updateSelectedCount() {
  const count = $('selectedCount');
  if (count) count.textContent = selectedKeys.size;

  const sub = $('selectedDrawerSub');
  if (sub) sub.textContent = `총 ${selectedKeys.size}개 주제를 선택했습니다.`;
}

function selectedItems() {
  const map = new Map(DATA.map(item => [itemKey(item), item]));
  return [...selectedKeys].map(key => map.get(key)).filter(Boolean);
}

function isSelected(item) {
  return selectedKeys.has(itemKey(item));
}

function softColor(hex) {
  const value = String(hex || '#d6ad63').replace('#', '');
  const r = parseInt(value.slice(0, 2), 16);
  const g = parseInt(value.slice(2, 4), 16);
  const b = parseInt(value.slice(4, 6), 16);
  return `rgba(${r},${g},${b},.12)`;
}

function setTheme(cat) {
  const color = cat?.color || '#d6ad63';
  document.documentElement.style.setProperty('--cat', color);
  document.documentElement.style.setProperty('--cat-soft', softColor(color));
}

function normalizeQueryText(value) {
  return String(value || '')
    .replace(/[【】\[\]{}<>「」『』“”‘’]/g, ' ')
    .replace(/\([^)]*영문[^)]*\)/gi, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

function meaningfulKeywordParts(value) {
  return normalizeQueryText(value)
    .split(/[,;/·|]+/)
    .map(part => part.trim())
    .filter(Boolean)
    .filter(part => !QUERY_STOPWORDS.has(part))
    .filter(part => part.length >= 2)
    .slice(0, 3);
}

function stripReportSuffix(value) {
  return normalizeQueryText(value)
    .replace(/\s*(탐구\s*)?보고서\s*$/g, '')
    .replace(/\s*탐구\s*$/g, '')
    .trim();
}

function mainSearchQuery(item) {
  const keywordParts = meaningfulKeywordParts(item.keyword);
  if (keywordParts.length) return keywordParts.join(' ');

  const title = stripReportSuffix(item.title);
  if (title) return title;

  const topic = normalizeQueryText(item.topic)
    .replace(/[?!。]/g, ' ')
    .split(/[.。]/)[0]
    .trim();
  return compact(topic || '학술 탐구', 50);
}

function followupSearchQuery(followup, item) {
  const title = stripReportSuffix(followup?.title);
  const main = mainSearchQuery(item);

  if (title) {
    const normalizedTitle = title
      .replace(/\s+/g, ' ')
      .replace(/^(관련|후속)\s*/g, '')
      .trim();
    return compact(normalizedTitle, 70);
  }

  return main;
}

function providerLinks(query) {
  return SEARCH_PROVIDERS.map(provider => ({
    ...provider,
    url: provider.build(query),
    query
  }));
}

function sourceCardsHTML(query, compactMode = false) {
  return providerLinks(query).map(provider => {
    const copyClass = provider.copiesQuery ? ' copyQueryLink' : '';
    const dataQuery = provider.copiesQuery ? ` data-copy-query="${esc(query)}"` : '';
    const aria = provider.copiesQuery
      ? `${provider.name} 공식 검색 페이지 열기. 검색어 ${query}가 복사됩니다.`
      : `${provider.name}에서 ${query} 검색`;

    if (compactMode) {
      return `<a class="fuSearchBtn${copyClass}" href="${esc(provider.url)}" target="_blank" rel="noopener"${dataQuery} aria-label="${esc(aria)}"><span>${provider.icon}</span>${esc(provider.name)}</a>`;
    }

    return `<a class="sourceLinkCard${copyClass}" href="${esc(provider.url)}" target="_blank" rel="noopener"${dataQuery} aria-label="${esc(aria)}"><span class="sourceLinkIcon">${provider.icon}</span><span class="sourceLinkText"><strong>${esc(provider.name)}</strong><small>${esc(provider.sub)}</small></span>${provider.copiesQuery ? '<span class="sourceLinkHint">검색어 복사</span>' : ''}</a>`;
  }).join('');
}

function navHTML() {
  return cats.map(cat => `<button class="navItem ${state.cat === cat.slug ? 'active' : ''}" data-cat="${esc(cat.slug)}" style="--cat:${cat.color};--cat-soft:${softColor(cat.color)}"><span class="navIcon">${cat.icon}</span><span class="navName">${cat.category}</span><span class="navCount">${cat.count}개</span></button>`).join('');
}

function bindNav() {
  $('navList').innerHTML = navHTML();
  document.querySelectorAll('.navItem').forEach(button => {
    button.onclick = () => selectCat(button.dataset.cat);
  });
}

function renderHome() {
  setTheme(null);
  bindNav();

  $('content').innerHTML = `
    <section class="hero">
      <div>
        <h1>진로 계열부터 고르고,<br>탐구주제까지 한 번에 설정</h1>
        <p>원하는 계열을 선택한 뒤 교과, 과목, 영역, 키워드로 탐구주제를 찾을 수 있습니다. 마음에 드는 주제는 ‘선택 담기’로 저장하고 상단 목록에서 한꺼번에 비교하세요.</p>
      </div>
      <div class="heroStats">
        <div class="statBox"><div class="statNum">7</div><div class="statLabel">선택 가능 계열</div></div>
        <div class="statBox"><div class="statNum">${APP_META.total.toLocaleString()}</div><div class="statLabel">통합 탐구주제</div></div>
        <div class="statBox"><div class="statNum">5</div><div class="statLabel">키워드 자료 검색처</div></div>
        <div class="statBox"><div class="statNum">KCI</div><div class="statLabel">공식 논문 검색 연결</div></div>
      </div>
    </section>
    <section class="catGrid">
      ${cats.map(cat => `<button class="catCard" data-cat="${esc(cat.slug)}"><div class="catTop"><span class="catEmoji">${cat.icon}</span><span class="catCount">총 ${cat.count}개</span></div><div class="catName">${cat.category}</div><div class="catDesc">${cat.subtitle}</div><div class="catFields">${cat.fields}</div></button>`).join('')}
    </section>
    <div class="ocrNote">각 탐구주제와 후속활동에 맞는 검색어를 자동으로 만들고, RISS·NAVER 지식백과·Google Scholar·DBpia·KCI에서 바로 검색할 수 있도록 연결했습니다. KCI는 공식 논문 검색 페이지를 열면서 검색어를 자동 복사합니다.</div>`;

  document.querySelectorAll('.catCard').forEach(button => {
    button.onclick = () => selectCat(button.dataset.cat);
  });

  updateSelectedCount();
}

function selectCat(slug) {
  state.cat = slug;
  state.gyogwa = '';
  state.gwamok = '';
  state.yeong = '';
  state.kw = '';
  state.activeId = null;
  renderExplore();
}

function baseData() {
  return DATA.filter(item => item._slug === state.cat);
}

function unique(list, key) {
  return [...new Set(list.map(item => item[key]).filter(Boolean))]
    .sort((a, b) => String(a).localeCompare(String(b), 'ko'));
}

function filteredData() {
  const keyword = state.kw.trim().toLowerCase();

  return baseData().filter(item => {
    if (state.gyogwa && item.gyogwa !== state.gyogwa) return false;
    if (state.gwamok && item.gwamok !== state.gwamok) return false;
    if (state.yeong && item.yeongnyeok !== state.yeong) return false;

    if (keyword) {
      const haystack = [
        item.gyogwa,
        item.gwamok,
        item.yeongnyeok,
        item.keyword,
        item.topic,
        item.dept,
        item.title,
        item.intro,
        item.body1,
        item.body2,
        item.concl
      ].join(' ').toLowerCase();

      if (!haystack.includes(keyword)) return false;
    }

    return true;
  });
}

function optionHTML(values, selected, label) {
  return `<option value="">${label}</option>${values.map(value => `<option value="${esc(value)}" ${value === selected ? 'selected' : ''}>${esc(value)}</option>`).join('')}`;
}

function renderExplore() {
  const cat = catBySlug[state.cat];
  setTheme(cat);
  bindNav();

  const all = baseData();
  const gyogwas = unique(all, 'gyogwa');
  const gwamoks = unique(all.filter(item => !state.gyogwa || item.gyogwa === state.gyogwa), 'gwamok');
  const yeongs = unique(all.filter(item => (!state.gyogwa || item.gyogwa === state.gyogwa) && (!state.gwamok || item.gwamok === state.gwamok)), 'yeongnyeok');
  const list = filteredData();

  if (!state.activeId && list[0]) state.activeId = list[0]._sourceIndex;

  $('content').innerHTML = `
    <section class="exploreHead">
      <div class="exploreIcon">${cat.icon}</div>
      <div>
        <div class="exploreTitle">${cat.category} 탐구주제 설정</div>
        <div class="exploreSub">${cat.subtitle} · 총 ${cat.count}개 주제</div>
      </div>
      <button class="backBtn" id="homeBtn">전체 계열 보기</button>
    </section>
    <section class="stepbar">
      <div class="step done"><span class="stepNum">1</span>계열 선택</div><span class="arrow">›</span>
      <div class="step ${state.gyogwa ? 'done' : 'active'}"><span class="stepNum">2</span>교과</div><span class="arrow">›</span>
      <div class="step ${state.gwamok ? 'done' : 'active'}"><span class="stepNum">3</span>과목</div><span class="arrow">›</span>
      <div class="step ${state.yeong ? 'done' : 'active'}"><span class="stepNum">4</span>영역</div><span class="arrow">›</span>
      <div class="step active"><span class="stepNum">5</span>탐구주제</div>
    </section>
    <section class="explorer">
      <aside class="panel filterPanel">
        <div class="filterTop">
          <div class="label">Filter</div>
          <div class="filterGrid">
            <select id="selGyogwa">${optionHTML(gyogwas, state.gyogwa, '전체 교과')}</select>
            <select id="selGwamok">${optionHTML(gwamoks, state.gwamok, '전체 과목')}</select>
            <select id="selYeong">${optionHTML(yeongs, state.yeong, '전체 영역')}</select>
          </div>
        </div>
        <div class="searchBox">
          <input class="searchInput" id="kwInput" value="${esc(state.kw)}" placeholder="키워드, 학과, 주제 검색">
          <button class="resetBtn" id="resetBtn">초기화</button>
        </div>
        <div class="listHead"><span>검색 결과 ${list.length.toLocaleString()}개</span><span>${cat.category}</span></div>
        <div class="topicList" id="topicList">${topicListHTML(list)}</div>
      </aside>
      <main class="panel detailPane" id="detailPane">${detailHTML(list.find(item => item._sourceIndex === state.activeId) || list[0])}</main>
    </section>`;

  $('homeBtn').onclick = () => {
    state.cat = null;
    state.activeId = null;
    renderHome();
  };

  $('selGyogwa').onchange = event => {
    state.gyogwa = event.target.value;
    state.gwamok = '';
    state.yeong = '';
    state.activeId = null;
    renderExplore();
  };

  $('selGwamok').onchange = event => {
    state.gwamok = event.target.value;
    state.yeong = '';
    state.activeId = null;
    renderExplore();
  };

  $('selYeong').onchange = event => {
    state.yeong = event.target.value;
    state.activeId = null;
    renderExplore();
  };

  $('kwInput').oninput = event => {
    state.kw = event.target.value;
    state.activeId = null;
    clearTimeout(window.__kwTimer);
    window.__kwTimer = setTimeout(renderExplore, 140);
  };

  $('resetBtn').onclick = () => {
    state.gyogwa = '';
    state.gwamok = '';
    state.yeong = '';
    state.kw = '';
    state.activeId = null;
    renderExplore();
  };

  bindTopicItems();
  bindDetailActions();
  updateSelectedCount();
}

function topicListHTML(list) {
  if (!list.length) {
    return '<div class="noResults">검색 결과가 없습니다.<br>필터나 검색어를 바꿔보세요.</div>';
  }

  return list.map(item => `<button class="topicItem ${item._sourceIndex === state.activeId ? 'active' : ''}" data-id="${item._sourceIndex}"><div class="topicTitle">${esc(item.title || compact(item.topic, 80))}</div><div class="topicMeta">${esc([item.gyogwa, item.gwamok, item.yeongnyeok, item.keyword].filter(Boolean).join(' · '))}</div>${isSelected(item) ? '<span class="topicPickMark" title="선택됨">✓</span>' : ''}</button>`).join('');
}

function bindTopicItems() {
  document.querySelectorAll('.topicItem').forEach(button => {
    button.onclick = () => {
      state.activeId = Number(button.dataset.id);
      updateDetail();
    };
  });
}

function updateDetail() {
  const list = filteredData();
  const item = list.find(candidate => candidate._sourceIndex === state.activeId) || list[0];
  $('topicList').innerHTML = topicListHTML(list);
  $('detailPane').innerHTML = detailHTML(item);
  bindTopicItems();
  bindDetailActions();
}

function detailHTML(item) {
  if (!item) {
    return '<div class="empty"><div class="emptyIcon">🔎</div><div class="emptyTitle">탐구주제를 선택하세요</div><div>왼쪽 목록에서 주제를 누르면 상세 내용이 표시됩니다.</div></div>';
  }

  const query = mainSearchQuery(item);

  return `
    <div class="detailInner">
      <section class="infoBanner">
        <div class="dTitle">${esc(item.title || '교과세특 탐구주제')}</div>
        <div class="tags">
          ${item.gyogwa ? `<span class="tag">${esc(item.gyogwa)}</span>` : ''}
          ${item.gwamok ? `<span class="tag">${esc(item.gwamok)}</span>` : ''}
          ${item.yeongnyeok ? `<span class="tag">${esc(item.yeongnyeok)}</span>` : ''}
          ${item.keyword ? `<span class="tag hl">${esc(compact(item.keyword, 50))}</span>` : ''}
        </div>
        <div class="infoGrid">
          <div class="infoBlock"><div class="infoLabel">관련 학과</div><div class="infoVal">${esc(item.dept || '-')}</div></div>
          <div class="infoBlock"><div class="infoLabel">성취기준</div><div class="infoVal">${esc(compact(item.std || '-', 320))}</div></div>
        </div>
        <div class="detailActions">
          <button class="pickBtn ${isSelected(item) ? 'active' : ''}" id="pickBtn" data-key="${esc(itemKey(item))}">${isSelected(item) ? '✓ 선택됨 · 목록에서 빼기' : '＋ 선택 담기'}</button>
          <button class="pickBtn" id="openSelectedFromDetail">🗂 선택 목록 보기</button>
        </div>
      </section>

      <section class="sec">
        <div class="secHead"><span class="secIcon">💡</span><span class="secTitle">탐구주제</span><span class="secBadge">Topic</span></div>
        <div class="bodyText">${esc(item.topic || '-')}</div>
      </section>

      <section class="sec">
        <div class="secHead"><span class="secIcon">📝</span><span class="secTitle">보고서 개요</span><span class="secBadge">Structure</span></div>
        <div class="reportGrid">
          ${item.intro ? reportBlock('서론', item.intro, 'intro') : ''}
          ${item.body1 ? reportBlock('본론 1', item.body1, 'body1') : ''}
          ${item.body2 ? reportBlock('본론 2', item.body2, 'body2') : ''}
          ${item.concl ? reportBlock('결론', item.concl, 'concl') : ''}
        </div>
      </section>

      <section class="sec sourceSection">
        <div class="secHead"><span class="secIcon">🔗</span><span class="secTitle">관련 자료 링크</span><span class="secBadge">키워드 바로 검색</span></div>
        <div class="sourceIntro">아래 검색처는 모두 같은 핵심 검색어를 사용합니다. 사이트별 검색 결과를 비교하여 논문·개념·사례 자료를 골라보세요.</div>
        <div class="sourceQueryRow"><span class="sourceQueryLabel">검색어</span><strong class="sourceQueryText">${esc(query)}</strong><button class="copyQueryBtn" type="button" data-copy-only="${esc(query)}">복사</button></div>
        <div class="sourceLinkGrid">${sourceCardsHTML(query)}</div>
        <div class="sourceNote">KCI는 주소에 검색어를 직접 넣는 방식이 안정적이지 않아, 공식 논문 검색 페이지를 열면서 검색어를 자동 복사하도록 구성했습니다. 열린 KCI 검색창에 붙여넣으면 됩니다.</div>
      </section>

      ${Array.isArray(item.fu) && item.fu.length ? `<section class="sec"><div class="secHead"><span class="secIcon">🚀</span><span class="secTitle">후속활동</span><span class="secBadge">Next</span></div><div class="fuList">${item.fu.map((followup, index) => fuHTML(followup, index, item)).join('')}</div></section>` : ''}
    </div>`;
}

function reportBlock(label, text, className) {
  return `<div class="reportBlock ${className}"><div class="reportLabel">${label}</div><div class="bodyText">${esc(text)}</div></div>`;
}

function fuHTML(followup, index, item) {
  const query = followupSearchQuery(followup, item);

  return `<article class="fuItem"><div class="fuTop"><span class="fuNum">${index + 1}</span><div class="fuTitle">${esc(followup.title || '후속활동')}</div></div><div class="fuDesc">${esc(followup.desc || '')}</div><div class="fuSearchBox"><div class="fuSearchQuery"><span>검색어</span><strong>${esc(query)}</strong><button type="button" class="copyQueryBtn mini" data-copy-only="${esc(query)}">복사</button></div><div class="fuLinkGrid">${sourceCardsHTML(query, true)}</div></div></article>`;
}

function bindCopyActions(root = document) {
  root.querySelectorAll('[data-copy-only]').forEach(button => {
    button.addEventListener('click', () => {
      const query = button.dataset.copyOnly || '';
      copyText(query).then(() => showToast(`검색어 “${query}”를 복사했습니다.`));
    });
  });

  root.querySelectorAll('.copyQueryLink').forEach(link => {
    link.addEventListener('click', () => {
      const query = link.dataset.copyQuery || '';
      copyText(query).then(() => showToast(`KCI 검색어 “${query}”를 복사했습니다.`));
    });
  });
}

function bindDetailActions() {
  const pickButton = $('pickBtn');
  if (pickButton) pickButton.onclick = () => toggleSelected(pickButton.dataset.key);

  const openSelected = $('openSelectedFromDetail');
  if (openSelected) openSelected.onclick = openSelectedModal;

  bindCopyActions($('content') || document);
}

function toggleSelected(key) {
  if (selectedKeys.has(key)) {
    selectedKeys.delete(key);
    showToast('선택 목록에서 제거했습니다.');
  } else {
    selectedKeys.add(key);
    showToast('선택 목록에 담았습니다.');
  }

  saveSelected();
  if (state.cat) updateDetail();
  renderSelectedDrawer();
}

function selectedInlineDetailHTML(item) {
  const query = mainSearchQuery(item);
  const reportParts = [
    item.intro ? reportBlock('서론', item.intro, 'intro') : '',
    item.body1 ? reportBlock('본론 1', item.body1, 'body1') : '',
    item.body2 ? reportBlock('본론 2', item.body2, 'body2') : '',
    item.concl ? reportBlock('결론', item.concl, 'concl') : ''
  ].filter(Boolean).join('');

  return `
    <div class="selectedDetailTop">
      <div class="infoBlock"><div class="infoLabel">관련 학과</div><div class="infoVal">${esc(item.dept || '-')}</div></div>
      <div class="infoBlock"><div class="infoLabel">성취기준</div><div class="infoVal">${esc(compact(item.std || '-', 360))}</div></div>
    </div>
    <section class="selectedDetailSection">
      <div class="selectedDetailHeading"><span>💡</span> 탐구주제</div>
      <div class="bodyText">${esc(item.topic || '-')}</div>
    </section>
    ${reportParts ? `<section class="selectedDetailSection"><div class="selectedDetailHeading"><span>📝</span> 보고서 개요</div><div class="reportGrid">${reportParts}</div></section>` : ''}
    <section class="selectedDetailSection sourceSection">
      <div class="selectedDetailHeading"><span>🔗</span> 관련 자료 검색</div>
      <div class="sourceQueryRow"><span class="sourceQueryLabel">검색어</span><strong class="sourceQueryText">${esc(query)}</strong><button class="copyQueryBtn" type="button" data-copy-only="${esc(query)}">복사</button></div>
      <div class="sourceLinkGrid">${sourceCardsHTML(query)}</div>
      <div class="sourceNote">KCI는 공식 논문 검색 페이지를 열면서 검색어를 복사합니다. 열린 검색창에 붙여넣어 사용하세요.</div>
    </section>
    ${Array.isArray(item.fu) && item.fu.length ? `<section class="selectedDetailSection"><div class="selectedDetailHeading"><span>🚀</span> 후속활동</div><div class="fuList">${item.fu.map((followup, index) => fuHTML(followup, index, item)).join('')}</div></section>` : ''}`;
}

function groupSelected(items) {
  return cats
    .map(cat => ({ cat, items: items.filter(item => item._slug === cat.slug) }))
    .filter(group => group.items.length);
}

function renderSelectedDrawer() {
  const body = $('selectedDrawerBody');
  if (!body) return;

  const items = selectedItems();
  updateSelectedCount();

  if (!items.length) {
    expandedSelectedKeys.clear();
    body.innerHTML = '<div class="selectedEmpty">아직 선택한 주제가 없습니다.<br>탐구주제 상세 화면에서 ‘선택 담기’를 눌러보세요.</div>';
    return;
  }

  body.innerHTML = groupSelected(items).map(group => `
    <section class="selectedGroup">
      <h3 class="selectedGroupTitle"><span>${group.cat.icon}</span>${group.cat.category} <span class="navCount">${group.items.length}개</span></h3>
      ${group.items.map(item => {
        const key = itemKey(item);
        const expanded = expandedSelectedKeys.has(key);
        return `<article class="selectedCard ${expanded ? 'expanded' : ''}" data-selected-key="${esc(key)}">
          <div class="selectedCardSummary">
            <div class="selectedCardMain">
              <div class="selectedCardCat">${esc(item._category)} · ${esc([item.gyogwa, item.gwamok].filter(Boolean).join(' · '))}</div>
              <div class="selectedCardTitle">${esc(item.title || compact(item.topic, 60))}</div>
              <div class="selectedCardTopic">${esc(compact(item.topic, 185))}</div>
            </div>
            <div class="selectedCardActions">
              <button class="smallAction viewAction" type="button" data-toggle-key="${esc(key)}" aria-expanded="${expanded ? 'true' : 'false'}">${expanded ? '접기' : '보기'}</button>
              <button class="smallAction danger" type="button" data-remove-key="${esc(key)}">삭제</button>
            </div>
          </div>
          <div class="selectedInlineDetail" ${expanded ? '' : 'hidden'}>${selectedInlineDetailHTML(item)}</div>
        </article>`;
      }).join('')}
    </section>`).join('');

  body.querySelectorAll('[data-toggle-key]').forEach(button => {
    button.onclick = () => {
      const key = button.dataset.toggleKey;
      const card = button.closest('.selectedCard');
      const detail = card?.querySelector('.selectedInlineDetail');
      if (!card || !detail) return;

      const willOpen = detail.hidden;
      detail.hidden = !willOpen;
      card.classList.toggle('expanded', willOpen);
      button.textContent = willOpen ? '접기' : '보기';
      button.setAttribute('aria-expanded', willOpen ? 'true' : 'false');

      if (willOpen) {
        expandedSelectedKeys.add(key);
        setTimeout(() => card.scrollIntoView({ behavior: 'smooth', block: 'nearest' }), 40);
      } else {
        expandedSelectedKeys.delete(key);
      }
    };
  });

  body.querySelectorAll('[data-remove-key]').forEach(button => {
    button.onclick = () => {
      const key = button.dataset.removeKey;
      selectedKeys.delete(key);
      expandedSelectedKeys.delete(key);
      saveSelected();
      renderSelectedDrawer();
      if (state.cat) updateDetail();
    };
  });

  bindCopyActions(body);
}

function openSelectedModal() {
  $('selectedModal').classList.add('open');
  $('selectedModal').setAttribute('aria-hidden', 'false');
  document.body.style.overflow = 'hidden';
  renderSelectedDrawer();
}

function closeSelectedModal() {
  $('selectedModal').classList.remove('open');
  $('selectedModal').setAttribute('aria-hidden', 'true');
  document.body.style.overflow = '';
  document.body.classList.remove('printSelected');
}

function copyText(text) {
  if (!text) return Promise.resolve(false);

  if (navigator.clipboard && window.isSecureContext) {
    return navigator.clipboard.writeText(text)
      .then(() => true)
      .catch(() => fallbackCopy(text));
  }

  return Promise.resolve(fallbackCopy(text));
}

function fallbackCopy(text) {
  const textarea = document.createElement('textarea');
  textarea.value = text;
  textarea.style.position = 'fixed';
  textarea.style.opacity = '0';
  document.body.appendChild(textarea);
  textarea.select();

  let copied = false;
  try {
    copied = document.execCommand('copy');
  } catch (error) {
    copied = false;
  }

  textarea.remove();
  return copied;
}

function selectedText() {
  return selectedItems().map((item, index) => `${index + 1}. [${item._category}] ${item.title}\n- ${[item.gyogwa, item.gwamok, item.yeongnyeok].filter(Boolean).join(' / ')}\n- 키워드: ${item.keyword || '-'}\n- 탐구주제: ${item.topic || '-'}`).join('\n\n');
}

function showToast(message) {
  const toast = $('toast');
  if (!toast) return;

  toast.textContent = message;
  toast.classList.add('show');
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => toast.classList.remove('show'), 2200);
}

$('selectedOpenBtn').onclick = openSelectedModal;
$('selectedCloseBtn').onclick = closeSelectedModal;
$('selectedModal').addEventListener('click', event => {
  if (event.target === $('selectedModal')) closeSelectedModal();
});

$('copySelectedBtn').onclick = () => {
  if (!selectedKeys.size) {
    showToast('복사할 주제가 없습니다.');
    return;
  }
  copyText(selectedText()).then(() => showToast('선택한 주제 목록을 복사했습니다.'));
};

$('clearSelectedBtn').onclick = () => {
  if (!selectedKeys.size) return;
  if (confirm('선택한 주제를 모두 비울까요?')) {
    selectedKeys.clear();
    expandedSelectedKeys.clear();
    saveSelected();
    renderSelectedDrawer();
    if (state.cat) updateDetail();
    showToast('선택 목록을 비웠습니다.');
  }
};

$('printSelectedBtn').onclick = () => {
  if (!selectedKeys.size) {
    showToast('인쇄할 주제가 없습니다.');
    return;
  }
  document.body.classList.add('printSelected');
  window.print();
  setTimeout(() => document.body.classList.remove('printSelected'), 500);
};

document.addEventListener('keydown', event => {
  if (event.key === 'Escape') closeSelectedModal();
});

updateSelectedCount();
renderHome();
