(function(){
  "use strict";

  var resources = Array.isArray(window.GAONGIL_RESOURCES) ? window.GAONGIL_RESOURCES : [];
  var config = window.GAONGIL_CONFIG || {};
  var pageSize = Number(config.pageSize || 24);
  var resourceMap = new Map(resources.map(function(item){ return [item.id, item]; }));

  function loadSelection(){
    try{
      var saved = JSON.parse(sessionStorage.getItem("gaongil-rne-selected") || "[]");
      return new Set(saved.filter(function(id){ return resourceMap.has(id); }));
    }catch(err){
      return new Set();
    }
  }

  var state = {
    query:"",
    field:"all",
    year:"all",
    sort:"newest",
    page:1,
    view:localStorage.getItem("gaongil-rne-view") || "grid",
    selected:loadSelection()
  };

  var currentShown = [];

  var el = {
    search:document.getElementById("searchInput"),
    year:document.getElementById("yearSelect"),
    sort:document.getElementById("sortSelect"),
    clear:document.getElementById("clearBtn"),
    chips:document.getElementById("fieldChips"),
    grid:document.getElementById("cardGrid"),
    pagination:document.getElementById("pagination"),
    summary:document.getElementById("resultSummary"),
    gridView:document.getElementById("gridViewBtn"),
    listView:document.getElementById("listViewBtn"),
    selectPage:document.getElementById("selectPageBtn"),
    clearSelectionTop:document.getElementById("clearSelectionTopBtn"),
    modalBackdrop:document.getElementById("modalBackdrop"),
    modalClose:document.getElementById("modalClose"),
    modalTitle:document.getElementById("modalTitle"),
    modalMeta:document.getElementById("modalMeta"),
    modalBody:document.getElementById("modalBody"),
    selectionTray:document.getElementById("selectionTray"),
    selectedCount:document.getElementById("selectedCount"),
    openSelection:document.getElementById("openSelectionBtn"),
    copySelection:document.getElementById("copySelectionBtn"),
    clearSelection:document.getElementById("clearSelectionBtn"),
    selectionBackdrop:document.getElementById("selectionBackdrop"),
    selectionClose:document.getElementById("selectionClose"),
    selectionTitle:document.getElementById("selectionTitle"),
    selectionBody:document.getElementById("selectionBody"),
    toast:document.getElementById("toast")
  };

  function h(value){
    return String(value == null ? "" : value)
      .replace(/&/g,"&amp;").replace(/</g,"&lt;").replace(/>/g,"&gt;")
      .replace(/"/g,"&quot;").replace(/'/g,"&#039;");
  }

  function norm(value){
    return String(value == null ? "" : value)
      .normalize("NFKC").toLowerCase().replace(/\s+/g," ").trim();
  }

  function formatBytes(bytes){
    var n=Number(bytes||0);
    if(!n) return "용량 정보 없음";
    if(n<1024) return n+" B";
    if(n<1024*1024) return (n/1024).toFixed(1)+" KB";
    return (n/(1024*1024)).toFixed(1)+" MB";
  }

  function matchItem(item, query){
    if(!query) return true;
    var hay = norm([
      item.title,item.summary,item.field,item.track,
      (item.keywords||[]).join(" ")
    ].join(" "));
    var terms = query.split(" ").filter(Boolean);
    return terms.every(function(term){ return hay.indexOf(term)>-1; });
  }

  function getFiltered(){
    var q=norm(state.query);
    var list=resources.filter(function(item){
      if(state.field!=="all" && item.field!==state.field) return false;
      if(state.year!=="all" && String(item.year)!==state.year) return false;
      return matchItem(item,q);
    }).slice();

    if(state.sort==="oldest"){
      list.sort(function(a,b){ return a.year-b.year || a.boardNo-b.boardNo || a.title.localeCompare(b.title,"ko"); });
    }else if(state.sort==="title"){
      list.sort(function(a,b){ return a.title.localeCompare(b.title,"ko") || b.year-a.year; });
    }else{
      list.sort(function(a,b){ return b.year-a.year || b.boardNo-a.boardNo || a.title.localeCompare(b.title,"ko"); });
    }
    return list;
  }

  function metaHtml(item){
    return [
      '<span class="year-badge">'+h(item.year)+'</span>',
      '<span class="field-badge">'+h(item.field)+'</span>',
      item.track && item.track!=="일반" ? '<span class="track-badge">'+h(item.track)+'</span>' : ''
    ].join("");
  }

  function keywordsHtml(item,limit){
    var keys=(item.keywords||[]).slice(0,limit||4);
    return keys.length ? '<div class="keyword-list">'+keys.map(function(k){
      return '<span class="keyword">#'+h(k)+'</span>';
    }).join("")+'</div>' : "";
  }

  function downloadActionHtml(item, extraClass){
    if(item.hasDownload && item.downloadUrl){
      return '<a class="download-btn '+(extraClass||'')+'" href="'+h(item.downloadUrl)+'" target="_blank" rel="noopener">다운로드</a>';
    }
    return '<button class="unavailable-btn '+(extraClass||'')+'" type="button" disabled>다운로드 준비 중</button>';
  }

  function cardHtml(item){
    var selected=state.selected.has(item.id);
    return [
      '<article class="resource-card '+(selected?'selected':'')+'" data-card-id="'+h(item.id)+'">',
      ' <div class="card-body">',
      '  <div class="card-top">',
      '   <div class="card-meta">'+metaHtml(item)+'</div>',
      '   <label class="select-toggle">',
      '    <input type="checkbox" data-select="'+h(item.id)+'" '+(selected?'checked':'')+'>',
      '    <span>선택</span>',
      '   </label>',
      '  </div>',
      '  <h3>'+h(item.title)+'</h3>',
      '  <p class="summary">'+h(item.summary || "연구내용 요약이 등록되지 않았습니다.")+'</p>',
         keywordsHtml(item,4),
      ' </div>',
      ' <div class="card-actions">',
      '  <button class="detail-btn" type="button" data-detail="'+h(item.id)+'">상세보기</button>',
         downloadActionHtml(item,''),
      ' </div>',
      '</article>'
    ].join("");
  }

  function pageItems(totalPages,current){
    var out=[];
    if(totalPages<=7){
      for(var i=1;i<=totalPages;i++) out.push(i);
      return out;
    }
    out.push(1);
    var start=Math.max(2,current-1), end=Math.min(totalPages-1,current+1);
    if(start>2) out.push("…");
    for(var j=start;j<=end;j++) out.push(j);
    if(end<totalPages-1) out.push("…");
    out.push(totalPages);
    return out;
  }

  function renderPagination(total){
    var totalPages=Math.max(1,Math.ceil(total/pageSize));
    if(state.page>totalPages) state.page=totalPages;
    if(totalPages<=1){ el.pagination.innerHTML=""; return; }
    var parts=[];
    parts.push('<button class="page-btn" type="button" data-page="'+(state.page-1)+'" '+(state.page===1?'disabled':'')+'>‹</button>');
    pageItems(totalPages,state.page).forEach(function(p){
      if(p==="…"){
        parts.push('<button class="page-btn" type="button" disabled>…</button>');
      }else{
        parts.push('<button class="page-btn '+(p===state.page?'active':'')+'" type="button" data-page="'+p+'">'+p+'</button>');
      }
    });
    parts.push('<button class="page-btn" type="button" data-page="'+(state.page+1)+'" '+(state.page===totalPages?'disabled':'')+'>›</button>');
    el.pagination.innerHTML=parts.join("");
  }

  function saveSelection(){
    try{
      sessionStorage.setItem("gaongil-rne-selected",JSON.stringify(Array.from(state.selected)));
    }catch(err){ /* 저장 불가 환경에서는 현재 화면에서만 유지 */ }
  }

  function getSelectedItems(){
    return Array.from(state.selected).map(function(id){ return resourceMap.get(id); }).filter(Boolean);
  }

  function updateSelectionUi(){
    var count=state.selected.size;
    el.selectedCount.textContent=count.toLocaleString("ko-KR");
    el.selectionTray.classList.toggle("hidden",count===0);
    el.clearSelectionTop.classList.toggle("hidden",count===0);
    document.body.classList.toggle("has-selection",count>0);

    var allPageSelected=currentShown.length>0 && currentShown.every(function(item){ return state.selected.has(item.id); });
    el.selectPage.textContent=allPageSelected ? "현재 페이지 선택 해제" : "현재 페이지 전체 선택";
    el.selectPage.disabled=currentShown.length===0;
    el.selectPage.classList.toggle("active",allPageSelected);
  }

  function render(){
    var list=getFiltered();
    var start=(state.page-1)*pageSize;
    currentShown=list.slice(start,start+pageSize);
    el.grid.classList.toggle("list-view",state.view==="list");
    el.grid.innerHTML=currentShown.length ? currentShown.map(cardHtml).join("") :
      '<div class="empty">조건에 맞는 자료가 없습니다.<br>검색어 또는 필터를 바꿔 보세요.</div>';
    var filters=[];
    if(state.field!=="all") filters.push(state.field);
    if(state.year!=="all") filters.push(state.year+"년");
    if(state.query.trim()) filters.push("‘"+state.query.trim()+"’");
    el.summary.textContent=(filters.length?filters.join(" · ")+" 검색 결과 ":"전체 자료 ")+list.length.toLocaleString("ko-KR")+"건";
    renderPagination(list.length);
    syncViewButtons();
    updateSelectionUi();
  }

  function syncViewButtons(){
    el.gridView.classList.toggle("active",state.view==="grid");
    el.listView.classList.toggle("active",state.view==="list");
  }

  function setView(view){
    state.view=view;
    localStorage.setItem("gaongil-rne-view",view);
    render();
  }

  function showToast(text){
    el.toast.textContent=text;
    el.toast.classList.remove("hidden");
    clearTimeout(showToast.timer);
    showToast.timer=setTimeout(function(){ el.toast.classList.add("hidden"); },1800);
  }

  function copyText(text, successMessage){
    if(navigator.clipboard && navigator.clipboard.writeText){
      navigator.clipboard.writeText(text).then(function(){ showToast(successMessage); }).catch(function(){ fallbackCopy(text,successMessage); });
    }else{
      fallbackCopy(text,successMessage);
    }
  }

  function fallbackCopy(text, successMessage){
    var ta=document.createElement("textarea");
    ta.value=text;
    ta.setAttribute("readonly","");
    ta.style.position="fixed";
    ta.style.opacity="0";
    document.body.appendChild(ta);
    ta.select();
    try{
      document.execCommand("copy");
      showToast(successMessage);
    }catch(err){
      showToast("복사하지 못했습니다.");
    }
    ta.remove();
  }

  function itemCopyText(item){
    var keys=(item.keywords||[]).map(function(k){ return "#"+k; }).join(" ") || "없음";
    return [
      "제목: "+(item.title||""),
      "분야: "+(item.field||""),
      "연구내용 설명: "+(item.summary||"요약 정보가 없습니다."),
      "키워드: "+keys
    ].join("\n");
  }

  function selectedCopyText(){
    return getSelectedItems().map(function(item,index){
      return "["+(index+1)+"]\n"+itemCopyText(item);
    }).join("\n\n");
  }

  function setSelected(id,checked){
    if(!resourceMap.has(id)) return;
    if(checked) state.selected.add(id);
    else state.selected.delete(id);
    saveSelection();
    render();
    if(!el.selectionBackdrop.classList.contains("hidden")) renderSelectionModal();
  }

  function clearAllSelection(){
    state.selected.clear();
    saveSelection();
    render();
    closeSelectionModal();
    showToast("선택을 모두 해제했습니다.");
  }

  function toggleCurrentPage(){
    if(!currentShown.length) return;
    var allSelected=currentShown.every(function(item){ return state.selected.has(item.id); });
    currentShown.forEach(function(item){
      if(allSelected) state.selected.delete(item.id);
      else state.selected.add(item.id);
    });
    saveSelection();
    render();
    showToast(allSelected ? "현재 페이지 선택을 해제했습니다." : "현재 페이지 자료를 선택했습니다.");
  }

  function openDetail(id){
    var item=resourceMap.get(id);
    if(!item) return;
    el.modalMeta.innerHTML=metaHtml(item);
    el.modalTitle.textContent=item.title;
    var keys=keywordsHtml(item,7);
    el.modalBody.innerHTML=[
      '<div class="modal-info">',
      ' <div class="info-box"><span>연도</span><b>'+h(item.year)+'년</b></div>',
      ' <div class="info-box"><span>분야</span><b>'+h(item.field)+'</b></div>',
      ' <div class="info-box"><span>자료 용량</span><b>'+h(formatBytes(item.size))+'</b></div>',
      '</div>',
      '<section class="modal-section"><div class="modal-label">연구내용 설명</div><div class="modal-text">'+h(item.summary || "요약 정보가 없습니다.")+'</div></section>',
      '<section class="modal-section"><div class="modal-label">키워드</div>'+ (keys || '<div class="modal-text">등록된 키워드가 없습니다.</div>') +'</section>',
      '<div class="modal-actions">',
        downloadActionHtml(item,''),
      ' <button class="copy-btn" type="button" data-copy-item="'+h(item.id)+'">복사</button>',
      ' <button class="select-modal-btn '+(state.selected.has(item.id)?'active':'')+'" type="button" data-modal-select="'+h(item.id)+'">'+(state.selected.has(item.id)?'선택 해제':'선택')+'</button>',
      '</div>'
    ].join("");
    closeSelectionModal();
    el.modalBackdrop.classList.remove("hidden");
    document.body.style.overflow="hidden";
    el.modalClose.focus();
  }

  function closeModal(){
    el.modalBackdrop.classList.add("hidden");
    document.body.style.overflow="";
  }

  function selectionItemHtml(item){
    return [
      '<article class="selection-item">',
      ' <div class="selection-item-head">',
      '  <div class="card-meta">'+metaHtml(item)+'</div>',
      '  <button class="selection-remove" type="button" data-remove-selected="'+h(item.id)+'" aria-label="'+h(item.title)+' 선택 해제">선택 해제</button>',
      ' </div>',
      ' <h4>'+h(item.title)+'</h4>',
      ' <div class="selection-description"><b>연구내용 설명</b><p>'+h(item.summary || "요약 정보가 없습니다.")+'</p></div>',
      ' <div class="selection-description"><b>키워드</b>'+(keywordsHtml(item,99)||'<p>등록된 키워드가 없습니다.</p>')+'</div>',
      ' <div class="selection-item-actions">',
        downloadActionHtml(item,''),
      '  <button class="copy-btn" type="button" data-copy-item="'+h(item.id)+'">복사</button>',
      ' </div>',
      '</article>'
    ].join("");
  }

  function renderSelectionModal(){
    var items=getSelectedItems();
    el.selectionTitle.textContent="선택한 연구자료 "+items.length.toLocaleString("ko-KR")+"개";
    if(!items.length){
      el.selectionBody.innerHTML='<div class="empty">선택한 자료가 없습니다.</div>';
      return;
    }
    el.selectionBody.innerHTML=[
      '<div class="selection-modal-tools">',
      ' <p>선택한 자료의 제목, 분야, 연구내용 설명, 키워드를 한꺼번에 확인할 수 있습니다.</p>',
      ' <div>',
      '  <button class="copy-selection-modal" type="button" data-copy-selected>선택 내용 전체 복사</button>',
      '  <button class="clear-selection-modal" type="button" data-clear-selected>전체 선택 해제</button>',
      ' </div>',
      '</div>',
      '<div class="selection-list">',
        items.map(selectionItemHtml).join(""),
      '</div>'
    ].join("");
  }

  function openSelectionModal(){
    if(!state.selected.size) return;
    renderSelectionModal();
    closeModal();
    el.selectionBackdrop.classList.remove("hidden");
    document.body.style.overflow="hidden";
    el.selectionClose.focus();
  }

  function closeSelectionModal(){
    el.selectionBackdrop.classList.add("hidden");
    if(el.modalBackdrop.classList.contains("hidden")) document.body.style.overflow="";
  }

  var searchTimer;
  el.search.addEventListener("input",function(){
    clearTimeout(searchTimer);
    searchTimer=setTimeout(function(){
      state.query=el.search.value;
      state.page=1;
      render();
    },120);
  });

  el.year.addEventListener("change",function(){ state.year=el.year.value; state.page=1; render(); });
  el.sort.addEventListener("change",function(){ state.sort=el.sort.value; state.page=1; render(); });

  el.clear.addEventListener("click",function(){
    state.query=""; state.field="all"; state.year="all"; state.sort="newest"; state.page=1;
    el.search.value=""; el.year.value="all"; el.sort.value="newest";
    el.chips.querySelectorAll(".field-chip").forEach(function(btn){
      btn.classList.toggle("active",btn.dataset.field==="all");
    });
    render();
  });

  el.chips.addEventListener("click",function(e){
    var btn=e.target.closest(".field-chip");
    if(!btn) return;
    state.field=btn.dataset.field; state.page=1;
    el.chips.querySelectorAll(".field-chip").forEach(function(b){ b.classList.toggle("active",b===btn); });
    render();
  });

  el.grid.addEventListener("change",function(e){
    var input=e.target.closest("[data-select]");
    if(input) setSelected(input.dataset.select,input.checked);
  });

  el.grid.addEventListener("click",function(e){
    var btn=e.target.closest("[data-detail]");
    if(btn) openDetail(btn.dataset.detail);
  });

  el.pagination.addEventListener("click",function(e){
    var btn=e.target.closest("[data-page]");
    if(!btn || btn.disabled) return;
    state.page=Number(btn.dataset.page);
    render();
    document.getElementById("resources").scrollIntoView({behavior:"smooth",block:"start"});
  });

  el.gridView.addEventListener("click",function(){ setView("grid"); });
  el.listView.addEventListener("click",function(){ setView("list"); });
  el.selectPage.addEventListener("click",toggleCurrentPage);
  el.clearSelectionTop.addEventListener("click",clearAllSelection);

  el.modalClose.addEventListener("click",closeModal);
  el.modalBackdrop.addEventListener("click",function(e){ if(e.target===el.modalBackdrop) closeModal(); });

  el.modalBody.addEventListener("click",function(e){
    var copyBtn=e.target.closest("[data-copy-item]");
    if(copyBtn){
      var copyItem=resourceMap.get(copyBtn.dataset.copyItem);
      if(copyItem) copyText(itemCopyText(copyItem),"자료 내용을 복사했습니다.");
      return;
    }
    var selectBtn=e.target.closest("[data-modal-select]");
    if(selectBtn){
      var id=selectBtn.dataset.modalSelect;
      var willSelect=!state.selected.has(id);
      setSelected(id,willSelect);
      openDetail(id);
    }
  });

  el.openSelection.addEventListener("click",openSelectionModal);
  el.copySelection.addEventListener("click",function(){
    if(state.selected.size) copyText(selectedCopyText(),"선택한 자료 내용을 복사했습니다.");
  });
  el.clearSelection.addEventListener("click",clearAllSelection);

  el.selectionClose.addEventListener("click",closeSelectionModal);
  el.selectionBackdrop.addEventListener("click",function(e){ if(e.target===el.selectionBackdrop) closeSelectionModal(); });
  el.selectionBody.addEventListener("click",function(e){
    var removeBtn=e.target.closest("[data-remove-selected]");
    if(removeBtn){
      setSelected(removeBtn.dataset.removeSelected,false);
      if(!state.selected.size) closeSelectionModal();
      return;
    }
    var copyBtn=e.target.closest("[data-copy-item]");
    if(copyBtn){
      var item=resourceMap.get(copyBtn.dataset.copyItem);
      if(item) copyText(itemCopyText(item),"자료 내용을 복사했습니다.");
      return;
    }
    if(e.target.closest("[data-copy-selected]")){
      copyText(selectedCopyText(),"선택한 자료 내용을 복사했습니다.");
      return;
    }
    if(e.target.closest("[data-clear-selected]")) clearAllSelection();
  });

  document.addEventListener("keydown",function(e){
    if(e.key!=="Escape") return;
    if(!el.selectionBackdrop.classList.contains("hidden")) closeSelectionModal();
    else if(!el.modalBackdrop.classList.contains("hidden")) closeModal();
  });

  render();
})();
