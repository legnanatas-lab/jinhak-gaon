(function(){
  const session=GaongilAuth.requirePageAccess(); if(session===false) return;
  GaongilAuth.installAccessLinkGuards();
  const data=window.GAONGIL_SITE_DATA;
  const requestedPage=new URLSearchParams(location.search).get('page');
  const pageFile=requestedPage || document.documentElement.dataset.pageFile || 'index.html';
  const sectionHref=(file)=>file==='index.html'?file:`section.html?page=${encodeURIComponent(file)}`;
  const nav=document.querySelector('#nav');
  const userName=document.querySelector('#userName');
  const adminLink=document.querySelector('#adminLink');
  const logoutBtn=document.querySelector('#logoutBtn');
  if(userName) userName.textContent=session?(session.name||session.username||session.id)+'님':'방문자';
  if(adminLink) adminLink.style.display=session&&session.role==='admin'?'inline-flex':'none';
  if(logoutBtn) logoutBtn.addEventListener('click', () => GaongilAuth.logout('login.html'));
  const topPages=(data.pages||[]).filter(p=>!p.hidden);
  if(nav){
    function navItemHref(item){ return String((item && item.url) || '#').replace(/^\.\//,''); }
    const navHtml = topPages.map((p) => {
      if (p.file === 'index.html') {
        return `<a class="nav-home-pill" href="${esc(p.file)}" ${p.file===pageFile?'aria-current="page"':''}>${esc(p.name)}</a>`;
      }
      const items = p.items || [];
      const itemLinks = items.map((item) => `<a href="${esc(navItemHref(item))}" role="menuitem">${esc(item.title || '자료')}</a>`).join('');
      const active = p.file === pageFile ? ' active' : '';
      const wide = items.length >= 6 ? ' wide' : '';
      return `<details class="nav-menu${active}"><summary>${esc(p.name)}</summary><div class="nav-menu-list${wide}" role="menu" aria-label="${esc(p.name)} 메뉴">${itemLinks}</div></details>`;
    }).join('');
    nav.innerHTML = navHtml;
    document.addEventListener('click', (event) => {
      document.querySelectorAll('.nav-menu').forEach((menu) => {
        if (menu.open && !menu.contains(event.target)) menu.open = false;
      });
    });
    document.querySelectorAll('.nav-menu').forEach((menu) => {
      menu.addEventListener('toggle', () => {
        if (!menu.open) return;
        document.querySelectorAll('.nav-menu').forEach((other) => {
          if (other !== menu) other.open = false;
        });
      });
    });
  }
  function esc(s){return String(s??'').replace(/[&<>"]/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[c]));}
  function isExternal(url){ return /^https?:\/\//i.test(url||''); }
  function openHref(item){ return item.url || '#'; }
  function renderHero(page){
    const total=(data.pages.find(p=>p.file==='archive.html')?.items || []).length || data.pages.reduce((n,p)=>n+(p.items?p.items.length:0),0);
    const ready=(data.pages.find(p=>p.file==='archive.html')?.items || []).filter(i=>i.status!=='신규').length;
    return `<section class="hero"><p class="eyebrow">Gaongil Edu Admission Lab</p><h1>${esc(page.name)}</h1><p>${esc(page.description||page.short||'목적별 자료를 빠르게 찾고 바로 실행할 수 있습니다.')}</p><div class="quick-stats"><span class="stat-chip">전체 자료 ${total}개</span><span class="stat-chip">HTML 보유 ${ready}개</span><span class="stat-chip">신규 자리표시자 포함</span></div></section>`;
  }
  function linkCard(item){
    const tags=(item.tags||[]).slice(0,4).map(t=>`<span class="tag ${t==='2027'?'blue':t==='2028'?'green':t==='results'?'red':'gold'}">${esc(t)}</span>`).join('');
    const target=isExternal(item.url)?' target="_blank" rel="noopener"':'';
    const badge=item.status==='신규'?'준비 중 페이지':'자료 열기';
    const statusClass=item.status==='신규'?' preparing':' ready';
    return `<a class="link-card${statusClass}" href="${esc(openHref(item))}"${target} data-tags="${esc((item.tags||[]).join(' '))}" data-title="${esc(item.title)}"><span class="label">${badge}</span><h3>${esc(item.title)}</h3><p>${esc(item.current||'가온길 자료')}</p><small>${esc(item.url)}</small><div class="meta-row">${tags}</div></a>`;
  }
  function renderHome(page){
    const cards=topPages.filter(p=>p.file!=='index.html').map(p=>`<a class="card" href="${sectionHref(p.file)}"><span class="label">바로가기</span><h3>${esc(p.name)}</h3><p>${esc(p.short||p.description||'')}</p></a>`).join('');
    const allItems=(data.pages.find(p=>p.file==='archive.html')?.items || []);
    return renderHero(page)+`<main class="main"><section class="section"><div class="section-head"><h2>상단 메뉴</h2><p>메뉴 구성안 기준 9개 탭</p></div><div class="grid">${cards}</div></section><section class="section"><div class="section-head"><h2>전체 자료 빠른 검색</h2><p>HTML이 없는 자료도 준비 중 페이지로 연결됩니다.</p></div>${renderToolbar()}<div id="cards" class="link-list">${allItems.map(linkCard).join('')}</div></section></main>`;
  }
  function renderToolbar(){
    const tags=['전체','2027','2028','results','download','student','major','statistics','teaching'];
    return `<div class="toolbar"><label class="searchbox"><input id="searchInput" type="search" placeholder="자료명, 태그, 주제 검색"></label><div class="tag-filter" id="tagFilter">${tags.map((t,i)=>`<button type="button" class="${i===0?'on':''}" data-tag="${t==='전체'?'':t}">${t}</button>`).join('')}</div></div>`;
  }
  function renderPage(page){
    const groups={};
    (page.items||[]).forEach(it=>{(groups[it.current||'자료'] ||= []).push(it);});
    const sections=Object.entries(groups).map(([name,items])=>`<section class="section"><div class="section-head"><h2>${esc(name)}</h2><p>${items.length}개 자료</p></div><div class="link-list">${items.map(linkCard).join('')}</div></section>`).join('');
    return renderHero(page)+`<main class="main">${renderToolbar()}<div id="cards">${sections || '<div class="empty">등록된 자료가 없습니다.</div>'}</div></main>`;
  }
  function setupSearch(){
    const input=document.querySelector('#searchInput'); const filters=document.querySelector('#tagFilter'); if(!input) return;
    let tag='';
    function apply(){
      const q=input.value.trim().toLowerCase();
      document.querySelectorAll('.link-card').forEach(card=>{
        const txt=(card.dataset.title+' '+card.textContent).toLowerCase();
        const tags=(card.dataset.tags||'').toLowerCase();
        const okQ=!q || txt.includes(q);
        const okTag=!tag || tags.includes(tag.toLowerCase());
        card.style.display=(okQ&&okTag)?'block':'none';
      });
    }
    input.addEventListener('input',apply);
    filters?.addEventListener('click',e=>{const b=e.target.closest('button'); if(!b) return; filters.querySelectorAll('button').forEach(x=>x.classList.remove('on')); b.classList.add('on'); tag=b.dataset.tag||''; apply();});
  }
  const page=(data.pages||[]).find(p=>p.file===pageFile)||data.pages[0];
  const shell=document.querySelector('#shellRender');
  if(shell){ shell.innerHTML = page.file==='index.html' ? renderHome(page) : renderPage(page); setupSearch(); }
})();
