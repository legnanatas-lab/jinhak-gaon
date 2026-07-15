'use strict';
const D = window.__GAONGIL_PROCOLLEGE6_DATA__;
const META = window.__GAONGIL_PROCOLLEGE6_META__;
if (!D || !META) {
  throw new Error('전문대 데이터를 불러오지 못했습니다.');
}
const Y=META.years, R=D.rows;
const GCOL=['#fde8ef;color:#b3215f','#e3effd;color:#1d4ed8','#e7f6ee;color:#15803d','#fdeee0;color:#c2570b','#efe9fb;color:#6d28d9','#dff3f0;color:#0c6e62'];
const $=s=>document.querySelector(s);
const esc=s=>String(s).replace(/[&<>"]/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[c]));
const NF=n=>n.toLocaleString('ko-KR');
const WATERMARK_TEXT='가온길 입시전략 연구소 상담문의 010-2370-7602';
const CONTACT_PHONE='010-2370-7602';

const S={tab:'ex',g:-1,y:2,t:-1,s:-1,d:-1,reg:new Set(),q:'',grade:null,sc:'',sd:1,n:400,tn:300,only3:false,trs:'0',univ:-1,cmp:[],student:{name:'',school:'',grade:'',desiredMajor:'',desiredUniversity:'',memo:''}};

/* ── 행 접근 ── */
const uOf=r=>D.u[r[2]];
function uname(r){const u=uOf(r);return (u.o&&u.oy.includes(Y[r[0]]))?u.o:u.n}
function udisp(ui){const u=D.u[ui];return u.n+(u.amb?'('+D.r[u.r]+')':'')}
function udispOld(ui){const u=D.u[ui];return esc(udisp(ui))+(u.o?' <i class="old">구 '+esc(u.o)+'</i>':'')}
const zn=v=>(v===0||v==null)?null:v;
function fmtZ(v){return v==null?'<span class="mut">–</span>':v===0?'<span class="z" title="0 = 미입력 또는 지원자 없음 (원자료 표기 그대로)">0</span>':esc(String(v))}
function bdg(b){return b==null?'<i class="bb b0" title="점수산출기준 미표기(원자료)">·</i>':b===0?'<i class="bb b1">등급</i>':'<i class="bb b2">백분위</i>'}
function snCell(r,fi){const v=r[fi];if(v==null)return '<span class="mut">–</span>';return fmtZ(v)+(r[3]===2?bdg(r[8]):'')}
function kvSpan(k,v,cls){return '<div class="uvm'+(cls?' '+cls:'')+'"><span class="k">'+k+'</span><span class="v">'+v+'</span></div>'}
const rnd=v=>Math.round(v*100)/100;

/* ── 필터링 ── */
const snVis=()=>S.t===2||S.t<0;
function fRows(useYear){
  const q=S.q.trim();const out=[];
  for(let i=0;i<R.length;i++){const r=R[i];
    if(useYear&&S.y>=0&&r[0]!==S.y)continue;
    if(S.g>=0&&r[1]!==S.g)continue;
    if(S.t>=0&&r[3]!==S.t)continue;
    if(S.s>=0&&r[7]!==S.s)continue;
    if(S.d>=0&&r[6]!==S.d)continue;
    if(S.reg.size&&!S.reg.has(uOf(r).r))continue;
    if(q&&!(uname(r).includes(q)||uOf(r).n.includes(q)||D.m[r[4]].includes(q)))continue;
    out.push(i);}
  return out;}

/* ── 탐색 탭 ── */
const COLS=[
 {k:'y', h:'학년도', vis:()=>S.y<0, g:i=>R[i][0], t:i=>Y[R[i][0]], d0:1},
 {k:'rg',h:'지역', g:i=>uOf(R[i]).r, t:i=>D.r[uOf(R[i]).r], d0:1},
 {k:'u', h:'대학', g:i=>uname(R[i]), t:i=>esc(uname(R[i]))+(uOf(R[i]).amb?' <i class="old">'+D.r[uOf(R[i]).r]+'</i>':''), d0:1, cls:'tl'},
 {k:'gr',h:'계열', vis:()=>S.g<0, g:i=>R[i][1], t:i=>D.g[R[i][1]].replace('계열',''), d0:1},
 {k:'m', h:'전공', g:i=>D.m[R[i][4]], t:i=>esc(D.m[R[i][4]])+(R[i][6]?' <i class="ynight">야간</i>':''), d0:1, cls:'tl'},
 {k:'t', h:'시기', g:i=>R[i][3], t:i=>D.t[R[i][3]], d0:1},
 {k:'s', h:'전형', g:i=>R[i][7], t:i=>D.s[R[i][7]], d0:1},
 {k:'q', h:'정원*', g:i=>R[i][5], t:i=>fmtZ(R[i][5]), d0:-1},
 {k:'c', h:'경쟁률', g:i=>zn(R[i][9]), t:i=>fmtZ(R[i][9]), d0:-1},
 {k:'ha',h:'합격자평균<small>학생부 등급</small>', g:i=>zn(R[i][11]), t:i=>fmtZ(R[i][11]), d0:1},
 {k:'hm',h:'합격자최저<small>학생부 등급</small>', g:i=>zn(R[i][13]), t:i=>fmtZ(R[i][13]), d0:1},
 {k:'sa',h:'수능평균<small>정시</small>', vis:snVis, g:i=>zn(R[i][10]), t:i=>snCell(R[i],10), d0:1},
 {k:'sm',h:'수능최저<small>정시</small>', vis:snVis, g:i=>zn(R[i][12]), t:i=>snCell(R[i],12), d0:1},
];
function sortIdxs(idxs){
  if(!S.sc)return idxs;
  const col=COLS.find(c=>c.k===S.sc);if(!col)return idxs;
  const dir=S.sd;
  return idxs.slice().sort((a,b)=>{
    const va=col.g(a),vb=col.g(b);
    const na=va==null,nb=vb==null;
    if(na&&nb)return a-b; if(na)return 1; if(nb)return -1;
    if(typeof va==='string'){const c=va.localeCompare(vb,'ko');return c?c*dir:a-b}
    return va<vb?-dir:va>vb?dir:a-b;});
}
function gcls(r){
  if(S.grade==null||r[3]===2)return '';
  const ha=r[11];if(ha==null||ha===0)return '';
  const d=ha-S.grade;
  return d>=0.5?'g-ez':d<=-0.5?'g-hd':'g-md';
}
function median(a){if(!a.length)return null;const s=a.slice().sort((x,y)=>x-y);const m=s.length>>1;return s.length%2?s[m]:rnd((s[m-1]+s[m])/2)}
function renderEx(){
  let idxs=fRows(true);
  idxs=sortIdxs(idxs);
  const vis=COLS.filter(c=>!c.vis||c.vis());
  const uset=new Set(idxs.map(i=>R[i][2]));
  const medc=median(idxs.map(i=>R[i][9]).filter(v=>v>0));
  const medh=median(idxs.map(i=>R[i][11]).filter(v=>v>0));
  $('#stats').innerHTML=
    '<div class="stat"><b>'+NF(idxs.length)+'</b><span>모집단위 행</span></div>'+
    '<div class="stat"><b>'+NF(uset.size)+'</b><span>대학(캠퍼스)</span></div>'+
    '<div class="stat"><b>'+(medc==null?'–':medc)+'</b><span>경쟁률 중위값 <i title="0·미입력 제외">*</i></span></div>'+
    '<div class="stat"><b>'+(medh==null?'–':medh)+'</b><span>합격자평균(학생부) 중위 <i title="0·미입력 제외">*</i></span></div>';
  $('#gradeLegend').classList.toggle('show',S.grade!=null);
  $('#extbl thead').innerHTML='<tr><th title="비교 담기">담기</th>'+vis.map(c=>'<th data-k="'+c.k+'">'+c.h+(S.sc===c.k?'<span class="arr">'+(S.sd>0?'▲':'▼')+'</span>':'')+'</th>').join('')+'</tr>';
  const show=idxs.slice(0,S.n);
  const html=show.map(i=>{
    const r=R[i],key=r[2]+'-'+r[4]+'-'+r[6]+'-'+r[3]+'-'+r[7];
    return '<tr data-i="'+i+'" class="'+gcls(r)+'"><td><input type="checkbox" class="cmpck" data-key="'+key+'"'+(S.cmp.includes(key)?' checked':'')+'></td>'+
      vis.map(c=>'<td'+(c.cls?' class="'+c.cls+'"':'')+'>'+c.t(i)+'</td>').join('')+'</tr>';
  }).join('');
  $('#extbl tbody').innerHTML=html||'<tr><td colspan="'+(vis.length+1)+'" style="padding:30px;color:var(--mut)">조건에 맞는 모집단위가 없습니다</td></tr>';
  const mb=$('#more-ex');
  if(idxs.length>S.n){mb.style.display='block';mb.textContent='더 보기 ('+NF(S.n)+' / '+NF(idxs.length)+')'}else mb.style.display='none';
  $('#printinfo').textContent='전문대학 간호·보건 6개 학과 3개년 입시결과 — '+filterSummary()+' · 모집단위 '+NF(idxs.length)+'행 · 출처 전문대학포털 입시결과서비스(수집 '+META.collected+')';
}
function filterSummary(){
  const p=[];
  p.push(S.g<0?'계열 전체':D.g[S.g]);
  p.push(S.y<0?'2024~2026':Y[S.y]+'학년도');
  if(S.t>=0)p.push(D.t[S.t]); if(S.s>=0)p.push(D.s[S.s]+'전형'); if(S.d>=0)p.push(D.d[S.d]);
  if(S.reg.size)p.push([...S.reg].map(i=>D.r[i]).join('·'));
  if(S.q.trim())p.push('검색 "'+S.q.trim()+'"');
  return p.join(' · ');
}

/* ── 상세 확장 ── */
function groupRows(u,m,d,t,s){
  const ys=[null,null,null];
  for(let i=0;i<R.length;i++){const r=R[i];
    if(r[2]===u&&r[4]===m&&r[6]===d&&r[3]===t&&r[7]===s)ys[r[0]]=i;}
  return ys;}
function detailHtml(u,m,d,t,s){
  const ys=groupRows(u,m,d,t,s);
  const key=u+'-'+m+'-'+d+'-'+t+'-'+s;
  let rowsH='';
  for(let y=2;y>=0;y--){
    const i=ys[y];
    if(i==null){rowsH+='<tr><td><b>'+Y[y]+'</b></td><td colspan="6" class="mut">자료 없음 (미모집 또는 미공시)</td></tr>';continue}
    const r=R[i];
    rowsH+='<tr><td><b>'+Y[y]+'</b></td><td>'+fmtZ(r[5])+'</td><td>'+fmtZ(r[9])+'</td><td>'+fmtZ(r[11])+'</td><td>'+fmtZ(r[13])+'</td><td>'+snCell(r,10)+'</td><td>'+snCell(r,12)+'</td></tr>';
  }
  return '<div class="detbox"><b class="t">'+udispOld(u)+' · '+esc(D.m[m])+(d?' <i class="ynight">야간</i>':'')+' · '+D.t[t]+' · '+D.s[s]+(s>0?' (특별전형)':'')+'</b>'+
    '<table class="dettbl"><tr><th>학년도</th><th>정원*</th><th>경쟁률</th><th>합격자평균(학생부)</th><th>합격자최저(학생부)</th><th>수능평균</th><th>수능최저</th></tr>'+rowsH+'</table>'+
    '<button class="detbtn b-cmp" data-key="'+key+'">+ 비교에 담기</button>'+
    '<button class="detbtn b-uv" data-u="'+u+'">이 대학 전체 보기</button></div>';
}
function toggleDetail(tr){
  const next=tr.nextElementSibling;
  const open=next&&next.classList.contains('det');
  document.querySelectorAll('#extbl tr.det').forEach(e=>e.remove());
  if(open)return;
  const r=R[+tr.dataset.i];
  const td=document.createElement('tr');td.className='det';
  td.innerHTML='<td colspan="'+tr.children.length+'">'+detailHtml(r[2],r[4],r[6],r[3],r[7])+'</td>';
  tr.after(td);
}

/* ── 추이 탭 ── */
function spark(vals){
  const pts=vals.map((v,i)=>v>0?[7+i*25,v]:null).filter(Boolean);
  if(pts.length<2)return '';
  const ys=pts.map(p=>p[1]);let mn=Math.min(...ys),mx=Math.max(...ys);
  if(mx-mn<1e-9)mx=mn+1;
  const sy=v=>(17-(v-mn)/(mx-mn)*12).toFixed(1);
  return '<svg class="spk" viewBox="0 0 64 22" width="64" height="22"><path d="M'+pts.map(p=>p[0]+' '+sy(p[1])).join('L')+'" fill="none" stroke="currentColor" stroke-width="1.5"/>'+pts.map(p=>'<circle cx="'+p[0]+'" cy="'+sy(p[1])+'" r="2" fill="currentColor"/>').join('')+'</svg>';
}
function delta(cur,prev){
  if(cur==null||prev==null||cur===0||prev===0)return '';
  const d=rnd(cur-prev);
  if(Math.abs(d)<0.005)return '<i class="dz">±0</i>';
  return d>0?'<i class="du">▲'+Math.abs(d)+'</i>':'<i class="dd">▼'+Math.abs(d)+'</i>';
}
function renderTr(){
  const idxs=fRows(false);
  const map=new Map();
  for(const i of idxs){const r=R[i];const k=r[2]+'-'+r[4]+'-'+r[6]+'-'+r[3]+'-'+r[7];
    let g=map.get(k);if(!g){g=[null,null,null];map.set(k,g)}g[r[0]]=i;}
  let arr=[...map.entries()];
  const n3=arr.filter(([,g])=>g[0]!=null&&g[1]!=null&&g[2]!=null).length;
  if(S.only3)arr=arr.filter(([,g])=>g[0]!=null&&g[1]!=null&&g[2]!=null);
  const jeongsi=S.t===2;
  const mfi=jeongsi?10:11;        // 평균 필드: 정시필터=수능평균, 그외=학생부평균
  const val=(g,y,fi)=>g[y]==null?null:R[g[y]][fi];
  const sorters={
    '0':(a,b)=>{
      const ra=R[(a[1][0]??a[1][1]??a[1][2])],rb=R[(b[1][0]??b[1][1]??b[1][2])];
      const ua=D.u[ra[2]],ub=D.u[rb[2]];
      return (ua.r-ub.r)||ua.n.localeCompare(ub.n,'ko')||D.m[ra[4]].localeCompare(D.m[rb[4]],'ko')||(ra[6]-rb[6])||(ra[3]-rb[3])||(ra[7]-rb[7]);},
    '1':(a,b)=>((zn(val(b[1],2,9))??-1)-(zn(val(a[1],2,9))??-1)),
    '2':(a,b)=>((zn(val(a[1],2,mfi))??99)-(zn(val(b[1],2,mfi))??99)),
    '3':(a,b)=>((zn(val(b[1],2,mfi))??-1)-(zn(val(a[1],2,mfi))??-1)),
  };
  arr.sort(sorters[S.trs]||sorters['0']);
  $('#trcount').textContent='모집단위 '+NF(arr.length)+'개'+(S.only3?'':' (3개년 모두 있는 단위 '+NF(n3)+'개)');
  const mh=jeongsi?'수능평균':'합격자평균(학생부)';
  $('#trtbl thead').innerHTML='<tr><th>지역</th><th>대학</th><th>전공</th><th>시기</th><th>전형</th>'+
    '<th>경쟁률<small>2024</small></th><th>경쟁률<small>2025</small></th><th>경쟁률<small>2026</small></th><th>추이</th>'+
    '<th>'+mh+'<small>2024</small></th><th>'+mh+'<small>2025</small></th><th>'+mh+'<small>2026</small></th></tr>';
  const show=arr.slice(0,S.tn);
  $('#trtbl tbody').innerHTML=show.map(([k,g])=>{
    const any=R[(g[0]??g[1]??g[2])];
    const u=any[2];
    const cs=[0,1,2].map(y=>val(g,y,9));
    const ms=[0,1,2].map(y=>val(g,y,mfi));
    const cCells=cs.map((v,y)=>'<td class="ycell">'+(v==null?'<span class="mut">–</span>':'<b>'+fmtZ(v)+'</b>')+(y>0?delta(v,cs[y-1]):'')+'</td>').join('');
    const mCells=ms.map((v,y)=>{
      let badge='';
      if(jeongsi&&v!=null&&g[y]!=null)badge=bdg(R[g[y]][8]);
      return '<td class="ycell">'+(v==null?'<span class="mut">–</span>':fmtZ(v)+badge)+(y>0?delta(v,ms[y-1]):'')+'</td>';
    }).join('');
    return '<tr data-i="'+(g[2]??g[1]??g[0])+'"><td>'+D.r[D.u[u].r]+'</td><td class="tl">'+udispOld(u)+'</td><td class="tl">'+esc(D.m[any[4]])+(any[6]?' <i class="ynight">야간</i>':'')+'</td><td>'+D.t[any[3]]+'</td><td>'+D.s[any[7]]+'</td>'+cCells+'<td>'+spark(cs)+'</td>'+mCells+'</tr>';
  }).join('')||'<tr><td colspan="12" style="padding:30px;color:var(--mut)">조건에 맞는 모집단위가 없습니다</td></tr>';
  const mb=$('#more-tr');
  if(arr.length>S.tn){mb.style.display='block';mb.textContent='더 보기 ('+NF(S.tn)+' / '+NF(arr.length)+')'}else mb.style.display='none';
}

/* ── 대학별 탭 ── */
function buildUvSel(){
  const sel=$('#uvsel');
  let cur=-2,html='<option value="-1">대학을 선택하세요 (지역순)</option>';
  D.u.forEach((u,i)=>{
    if(u.r!==cur){if(cur!==-2)html+='</optgroup>';html+='<optgroup label="'+D.r[u.r]+'">';cur=u.r}
    html+='<option value="'+i+'">'+esc(udisp(i))+(u.o?' (구 '+esc(u.o)+')':'')+'</option>';
  });
  html+='</optgroup>';sel.innerHTML=html;
}
function renderUv(){
  $('#uvsel').value=String(S.univ);
  const body=$('#uvbody');
  if(S.univ<0){body.innerHTML='<div class="hint">위에서 대학을 선택하면 해당 대학의 간호·보건 6개 학과군 모집단위 전체와 3개년 결과가 표시됩니다.<br>탐색 탭의 행 상세에서 「이 대학 전체 보기」로도 이동할 수 있습니다.</div>';return}
  const u=D.u[S.univ];
  const idxs=[];for(let i=0;i<R.length;i++)if(R[i][2]===S.univ)idxs.push(i);
  const lk=new Map();   // m|d|t|s|y -> i
  const cards=new Map();// g|m|d -> Set("t-s")
  for(const i of idxs){const r=R[i];
    lk.set(r[4]+'|'+r[6]+'|'+r[3]+'|'+r[7]+'|'+r[0],i);
    const ck=r[1]+'|'+r[4]+'|'+r[6];
    if(!cards.has(ck))cards.set(ck,new Set());
    cards.get(ck).add(r[3]+'-'+r[7]);}
  const years=[...new Set(idxs.map(i=>Y[R[i][0]]))].sort();
  let h='<div class="uvhead"><h2>'+udispOld(S.univ)+'</h2><div class="meta"><span class="regtag">'+D.r[u.r]+'</span>간호·보건 6개 학과군 모집단위 '+NF(idxs.length)+'행 · 수록 연도 '+years.join('·')+(u.o?' · '+esc(u.o)+'는 교명 변경 전 표기('+u.oy.join('·')+')':'')+'</div>'+
    '<div class="meta" style="margin-top:4px"><span class="z">0</span>=미입력 또는 지원자 없음 · –=자료 없음 · 합격자 평균·최저의 <b>내신</b>=학생부 등급(작을수록 상위), <span style="color:var(--teal)">수능</span>은 정시에만 <i class="bb b1">등급</i><i class="bb b2">백분위</i> 병기</div></div>';
  const ckeys=[...cards.keys()].sort((a,b)=>{
    const[a1,a2,a3]=a.split('|').map(Number),[b1,b2,b3]=b.split('|').map(Number);
    return a1-b1||D.m[a2].localeCompare(D.m[b2],'ko')||a3-b3;});
  h+='<div class="cards">';
  for(const ck of ckeys){
    const[g,m,d]=ck.split('|').map(Number);
    const combos=[...cards.get(ck)].map(x=>x.split('-').map(Number)).sort((a,b)=>a[0]-b[0]||a[1]-b[1]);
    let rowsH='';
    for(const[t,s]of combos){
      const key=S.univ+'-'+m+'-'+d+'-'+t+'-'+s;
      let cells='';
      for(let y=0;y<3;y++){
        const i=lk.get(m+'|'+d+'|'+t+'|'+s+'|'+y);
        if(i==null){cells+='<td><span class="mut">–</span></td>';continue}
        const r=R[i];
        cells+='<td>'+kvSpan('경쟁률',fmtZ(r[9]),'hd')+kvSpan('정원',fmtZ(r[5]),'dim')+
          kvSpan('내신 평균',fmtZ(r[11]))+kvSpan('내신 최저',fmtZ(r[13]))+
          (r[3]===2&&(r[10]!=null||r[12]!=null)?kvSpan('수능 평균',fmtZ(r[10])+(r[10]!=null?bdg(r[8]):''),'sn')+kvSpan('수능 최저',fmtZ(r[12]),'sn'):'')+'</td>';
      }
      rowsH+='<tr><td style="white-space:nowrap">'+D.t[t]+'</td><td style="white-space:nowrap">'+D.s[s]+'</td>'+cells+'<td><button class="addc b-cmp" data-key="'+key+'" title="비교에 담기">+</button></td></tr>';
    }
    h+='<div class="card"><h3>'+esc(D.m[m])+(d?' <i class="ynight">야간</i>':'')+'<span class="gtag" style="background:'+GCOL[g]+'">'+D.g[g].replace('계열','')+'</span></h3>'+
      '<table><tr><th>시기</th><th>전형</th><th>2024</th><th>2025</th><th>2026</th><th></th></tr>'+rowsH+'</table></div>';
  }
  h+='</div>';
  body.innerHTML=h;
}

/* ── 비교 탭 ── */
function renderCmp(){
  const body=$('#cmpbody');
  $('#cmpn').textContent=S.cmp.length?'('+S.cmp.length+')':'';
  const fab=$('#cmpfab');
  fab.classList.toggle('show',S.cmp.length>0&&S.tab!=='cmp');
  $('#cmpfabTxt').textContent='비교 담기 '+S.cmp.length+'개';
  if(S.tab!=='cmp')return;
  if(!S.cmp.length){body.innerHTML='<div class="hint">아직 담긴 모집단위가 없습니다.<br>탐색 탭에서 행 왼쪽 체크박스를 누르거나, 행 상세·대학별 화면의 「+ 비교에 담기」를 누르면 PDF 보고서에 담을 수 있습니다.</div>';return}
  const items=S.cmp.map(k=>{const[u,m,d,t,s]=k.split('-').map(Number);return{k,u,m,d,t,s,ys:groupRows(u,m,d,t,s)}});
  const anyJ=items.some(it=>it.t===2);
  let h='<div class="table-wrap" style="max-height:none"><table class="cmptbl"><thead><tr><th class="lbl">항목</th>';
  for(const it of items)h+='<th>'+esc(udisp(it.u))+'<small>'+esc(D.m[it.m])+(it.d?' 야간':'')+' · '+D.t[it.t]+' · '+D.s[it.s]+'</small><button class="rm" data-x="'+esc(it.k)+'">제외 ✕</button></th>';
  h+='</tr></thead><tbody>';
  const row=(lbl,fn)=>{let r='<tr><td>'+lbl+'</td>';for(const it of items)r+='<td>'+fn(it)+'</td>';return r+'</tr>'};
  h+=row('지역',it=>D.r[D.u[it.u].r]);
  h+=row('계열',it=>D.g[R[(it.ys[0]??it.ys[1]??it.ys[2])][1]].replace('계열',''));
  h+=row('주/야',it=>D.d[it.d]);
  for(let y=2;y>=0;y--){
    h+='<tr class="ysep"><td colspan="'+(items.length+1)+'">'+Y[y]+'학년도</td></tr>';
    const cell=(it,fi)=>{const i=it.ys[y];return i==null?'<span class="mut">–</span>':fmtZ(R[i][fi])};
    h+=row('정원*',it=>cell(it,5));
    h+=row('경쟁률',it=>{const i=it.ys[y];return i==null?'<span class="mut">–</span>':'<b>'+fmtZ(R[i][9])+'</b>'});
    h+=row('합격자평균(학생부)',it=>cell(it,11));
    h+=row('합격자최저(학생부)',it=>cell(it,13));
    if(anyJ){
      h+=row('수능평균',it=>{const i=it.ys[y];return i==null?'<span class="mut">–</span>':snCell(R[i],10)});
      h+=row('수능최저',it=>{const i=it.ys[y];return i==null?'<span class="mut">–</span>':snCell(R[i],12)});
    }
  }
  h+='</tbody></table></div><div class="tfoot-note">– = 해당 연도 자료 없음(미모집 또는 미공시) · 자세한 기준은 「활용 안내」 참고</div>';
  body.innerHTML=h;
}
function syncCmpChecks(){
  document.querySelectorAll('#extbl .cmpck').forEach(cb=>{cb.checked=S.cmp.includes(cb.dataset.key)});
}
function addCmp(key){
  if(S.cmp.includes(key)){S.cmp=S.cmp.filter(k=>k!==key);toast('비교에서 제외했습니다');}
  else{S.cmp.push(key);toast('비교에 담았습니다 ('+S.cmp.length+'개)')}
  renderConsultPanel();
  renderCmp();if(S.tab==='ex')syncCmpChecks();
  updateHash();
}

/* ── 상담 PDF 패널/출력 ── */
function consultItems(){
  return S.cmp.map(k=>{
    const[u,m,d,t,s]=k.split('-').map(Number);
    return{k,u,m,d,t,s,ys:groupRows(u,m,d,t,s)};
  });
}
function renderConsultPanel(){
  const panel=$('#consultPanel');
  if(!panel)return;
  const items=consultItems();
  const input=(key,label,ph)=>'<div class="consult-field"><label for="consult-'+key+'">'+label+'</label><input class="consult-control" id="consult-'+key+'" data-student="'+key+'" value="'+esc(S.student[key]||'')+'" placeholder="'+ph+'"></div>';
  const cards=items.map((it,idx)=>{
    const meta=D.r[D.u[it.u].r]+' · '+D.g[R[(it.ys[0]??it.ys[1]??it.ys[2])][1]].replace('계열','')+' · '+D.t[it.t]+' · '+D.s[it.s]+(it.d?' · 야간':'');
    return '<div class="saved-card"><b>'+(idx+1)+'. '+esc(udisp(it.u))+' '+esc(D.m[it.m])+'</b><span>'+esc(meta)+'</span><button type="button" data-consult-remove="'+esc(it.k)+'">선택 제외</button></div>';
  }).join('');
  panel.innerHTML=
    '<section class="consult-panel" aria-label="학생정보 및 PDF 출력">'+
      '<div class="consult-head"><div><h2>학생정보</h2><p>선택한 모집단위와 함께 PDF 보고서에 표시됩니다.</p></div><div class="consult-count">선택 '+items.length+'개</div></div>'+
      '<div class="consult-grid">'+
        input('name','학생이름','예: 홍길동')+
        input('school','학교','예: 가온고')+
        input('grade','내신','예: 4.30')+
        input('desiredMajor','희망학과','예: 간호학과')+
        input('desiredUniversity','희망대학','예: 동남보건대')+
        '<div class="consult-field full"><label for="consult-memo">상담내용</label><textarea class="consult-control" id="consult-memo" data-student="memo" placeholder="상담 중 확인한 강점, 보완점, 지원전략을 입력하세요.">'+esc(S.student.memo||'')+'</textarea></div>'+
      '</div>'+
      '<div class="consult-actions">'+
        '<button type="button" class="consult-btn primary" data-consult-action="print"'+(items.length?'':' disabled')+'>PDF 저장</button>'+
        '<button type="button" class="consult-btn" data-consult-action="clear"'+(items.length?'':' disabled')+'>선택 비우기</button>'+
        '<button type="button" class="consult-btn" data-consult-action="reset">초기화</button>'+
      '</div>'+
      (items.length?'<div class="saved-preview">'+cards+'</div>':'<div class="saved-empty">탐색 표의 체크박스나 상세/대학별 화면의 “비교에 담기” 버튼으로 PDF에 넣을 모집단위를 선택하세요.</div>')+
    '</section>';
}
function reportValue(v){return v==null?'<span class="muted">–</span>':v===0?'<span class="zero">0</span>':esc(String(v))}
function reportScore(r,fi){
  const v=r[fi];
  if(v==null)return '<span class="muted">–</span>';
  const type=r[3]===2?(r[8]==null?'기준 미표기':D.b[r[8]]):'';
  return reportValue(v)+(type?'<span class="score-type">'+esc(type)+'</span>':'');
}
function reportStudentValue(key){return S.student[key]?esc(S.student[key]):'미입력'}
function printConsultReport(){
  const items=consultItems();
  if(!items.length){alert('먼저 PDF에 담을 모집단위를 선택해 주세요.');return}
  const logoUrl=new URL('./assets/gaongil-logo.png?v=20260712-logo',location.href).href;
  const watermarkUrl=new URL('./assets/gaongil-watermark.png?v=20260712-logo',location.href).href;
  const today=new Date().toLocaleDateString('ko-KR');
  const cards=items.map((it,idx)=>{
    const title=esc(udisp(it.u))+' '+esc(D.m[it.m])+(it.d?' <span class="night">야간</span>':'');
    const meta=esc(D.r[D.u[it.u].r])+' · '+esc(D.g[R[(it.ys[0]??it.ys[1]??it.ys[2])][1]].replace('계열',''))+' · '+esc(D.t[it.t])+' · '+esc(D.s[it.s]);
    const yearRows=[2,1,0].map(y=>{
      const i=it.ys[y];
      if(i==null)return '<tr><td><b>'+Y[y]+'</b></td><td colspan="6" class="muted">자료 없음 (미모집 또는 미공시)</td></tr>';
      const r=R[i];
      return '<tr><td><b>'+Y[y]+'</b></td><td>'+reportValue(r[5])+'</td><td>'+reportValue(r[9])+'</td><td>'+reportValue(r[11])+'</td><td>'+reportValue(r[13])+'</td><td>'+reportScore(r,10)+'</td><td>'+reportScore(r,12)+'</td></tr>';
    }).join('');
    return '<section class="report-card"><h2>'+(idx+1)+'. '+title+'</h2><p class="meta">'+meta+'</p><table><thead><tr><th>학년도</th><th>정원*</th><th>경쟁률</th><th>합격자평균<br>학생부</th><th>합격자최저<br>학생부</th><th>수능평균</th><th>수능최저</th></tr></thead><tbody>'+yearRows+'</tbody></table></section>';
  }).join('');
  const html='<!doctype html><html lang="ko"><head><meta charset="UTF-8"><title>전문대학 간호·보건 상담 보고서</title><style>'+
    '@page{size:A4;margin:8mm}*{box-sizing:border-box}html,body{min-height:100%}body{margin:0;color:#111827;background:radial-gradient(circle at 12% 8%,rgba(201,151,67,.12),transparent 28%),linear-gradient(180deg,#fff 0%,#f8fafc 100%);font-family:"Malgun Gothic","Apple SD Gothic Neo",Arial,sans-serif;font-size:8px;line-height:1.32;-webkit-print-color-adjust:exact;print-color-adjust:exact}'+
    'body::before{content:"";position:fixed;left:50%;top:50%;width:62%;height:72%;transform:translate(-50%,-50%);background:url("'+watermarkUrl+'") center/contain no-repeat;opacity:.085;z-index:0;pointer-events:none}'+
    'header,section,footer{position:relative;z-index:1}header{display:grid;grid-template-columns:auto 1fr auto;align-items:center;gap:10px;border:1px solid #e8edf4;border-top:3px solid #c99743;border-radius:9px;padding:7px 9px;background:rgba(255,255,255,.92);box-shadow:0 4px 12px rgba(15,23,42,.06)}'+
    'header img{width:104px;height:34px;object-fit:contain;background:#050505;border-radius:5px}.headline{min-width:0}h1{margin:0;font-size:14px;line-height:1.1;color:#0f172a}h2{margin:8px 0 5px;font-size:10px;line-height:1.2;color:#0f172a}.sub{margin-top:2px;color:#64748b;font-size:7.5px;font-weight:800}.contact-badge{display:inline-flex;align-items:center;justify-content:center;min-height:22px;border:1px solid #c99743;border-radius:999px;padding:3px 8px;background:linear-gradient(180deg,#fff7df,#f1d491);color:#5f3900;font-size:8px;font-weight:900;white-space:nowrap}'+
    '.info{display:grid;grid-template-columns:repeat(5,1fr);gap:4px;margin:8px 0}.info div{border:1px solid #d8dee8;border-radius:5px;padding:4px 5px;background:rgba(255,255,255,.88)}.info b{display:block;color:#64748b;font-size:6.5px;line-height:1.1}.info span{display:block;margin-top:2px;font-size:8px;font-weight:900;color:#0f172a}.memo{border:1px solid #d8dee8;border-radius:6px;min-height:34px;padding:5px 6px;background:rgba(255,255,255,.88);white-space:pre-wrap;line-height:1.38}'+
    '.report-card{margin-top:8px;border:1px solid #d8dee8;border-radius:7px;overflow:hidden;background:rgba(255,255,255,.94);break-inside:avoid;page-break-inside:avoid}.report-card h2{margin:0;padding:6px 8px;background:linear-gradient(90deg,#101827,#23324a);color:#fff;font-size:9px}.night{font-size:7px;border:1px solid rgba(255,255,255,.45);border-radius:4px;padding:1px 4px}.meta{margin:0;padding:5px 8px;background:#fff8e8;color:#5f3900;font-size:7.5px;font-weight:900}table{width:100%;border-collapse:collapse;table-layout:fixed}th,td{border-top:1px solid #e5e7eb;padding:4px 5px;text-align:center;font-size:7.2px;line-height:1.24;word-break:keep-all;overflow-wrap:anywhere}th{background:#edf2f7;color:#26374f;font-weight:900}.score-type{display:inline-block;margin-left:3px;border-radius:4px;background:#eaf2ff;color:#1d4ed8;font-size:6px;font-weight:900;padding:1px 3px}.zero{color:#94a3b8}.muted{color:#64748b}footer{margin-top:10px;border-top:1px solid #d8dee8;padding-top:5px;color:#64748b;font-size:7.2px;display:flex;justify-content:space-between;gap:10px}'+
    '</style></head><body><header><img src="'+logoUrl+'" alt="가온길 에듀"><div class="headline"><h1>전문대학 간호·보건 상담 보고서</h1><div class="sub">가온길 에듀 · 가온길 입시전략 연구소 · '+today+'</div></div><div class="contact-badge">상담문의 '+CONTACT_PHONE+'</div></header>'+
    '<section class="info"><div><b>학생이름</b><span>'+reportStudentValue('name')+'</span></div><div><b>학교</b><span>'+reportStudentValue('school')+'</span></div><div><b>내신</b><span>'+reportStudentValue('grade')+'</span></div><div><b>희망학과</b><span>'+reportStudentValue('desiredMajor')+'</span></div><div><b>희망대학</b><span>'+reportStudentValue('desiredUniversity')+'</span></div></section>'+
    '<section><h2>상담내용</h2><div class="memo">'+(S.student.memo?esc(S.student.memo):'미입력')+'</div></section>'+cards+
    '<footer><span>본 자료는 상담 참고용입니다.</span><span>'+WATERMARK_TEXT+'</span></footer><script>window.addEventListener("load",()=>setTimeout(()=>window.print(),250));<\/script></body></html>';
  const report=window.open('','_blank');
  if(!report){alert('팝업이 차단되었습니다. 팝업 허용 후 다시 눌러 주세요.');return}
  report.document.open();
  report.document.write(html);
  report.document.close();
}

/* ── 토스트/해시 ── */
let toastTimer=null;
function toast(msg){const t=$('#toast');t.textContent=msg;t.classList.add('show');clearTimeout(toastTimer);toastTimer=setTimeout(()=>t.classList.remove('show'),1800)}
function updateHash(){
  const p=[];
  if(S.tab!=='ex')p.push('tab='+S.tab);
  if(S.g>=0)p.push('g='+S.g);
  if(S.y!==2)p.push('y='+S.y);
  if(S.t>=0)p.push('t='+S.t);
  if(S.s>=0)p.push('s='+S.s);
  if(S.d>=0)p.push('d='+S.d);
  if(S.reg.size)p.push('r='+[...S.reg].join('.'));
  if(S.q.trim())p.push('q='+encodeURIComponent(S.q.trim()));
  if(S.grade!=null)p.push('gr='+S.grade);
  if(S.only3)p.push('o3=1');
  if(S.trs!=='0')p.push('ts='+S.trs);
  if(S.sc)p.push('sc='+S.sc+'.'+(S.sd>0?1:0));
  if(S.univ>=0)p.push('uv='+S.univ);
  if(S.cmp.length)p.push('cmp='+S.cmp.join(','));
  history.replaceState(null,'',p.length?'#'+p.join('&'):location.pathname+location.search);
}
function parseHash(){
  const h=location.hash.replace(/^#/,'');
  const kv={};h.split('&').forEach(x=>{const i=x.indexOf('=');if(i>0)kv[x.slice(0,i)]=x.slice(i+1)});
  const num=(v,lo,hi,dv)=>{const n=parseInt(v,10);return isNaN(n)||n<lo||n>hi?dv:n};
  S.tab=['ex','tr','uv','cmp','gd'].includes(kv.tab)?kv.tab:'ex';
  S.g=num(kv.g,0,5,-1);S.y=kv.y!==undefined?num(kv.y,-1,2,2):2;
  S.t=num(kv.t,0,2,-1);S.s=num(kv.s,0,4,-1);S.d=num(kv.d,0,1,-1);
  S.reg=new Set((kv.r||'').split('.').map(x=>parseInt(x,10)).filter(n=>n>=0&&n<16));
  S.q=kv.q?decodeURIComponent(kv.q):'';
  const g=parseFloat(kv.gr);S.grade=(!isNaN(g)&&g>=1&&g<=9)?g:null;
  S.only3=kv.o3==='1';
  S.trs=['0','1','2','3'].includes(kv.ts)?kv.ts:'0';
  S.sc='';S.sd=1;
  if(kv.sc){const[c,d]=kv.sc.split('.');if(COLS.some(x=>x.k===c)){S.sc=c;S.sd=d==='0'?-1:1}}
  S.univ=num(kv.uv,0,D.u.length-1,-1);
  S.cmp=(kv.cmp||'').split(',').filter(k=>{
    if(!/^\d+-\d+-\d+-\d+-\d+$/.test(k))return false;
    const[u,m,d,t,s]=k.split('-').map(Number);
    return u<D.u.length&&m<D.m.length&&d<2&&t<3&&s<5;
  });
}

/* ── 필터 UI ── */
function buildChips(){
  const mk=(f,arr,labels)=>{
    const box=document.querySelector('.fchips[data-f="'+f+'"]');
    box.innerHTML='<button class="chip" data-f="'+f+'" data-v="-1">전체</button>'+
      arr.map((_,i)=>'<button class="chip" data-f="'+f+'" data-v="'+i+'">'+labels[i]+'</button>').join('');
  };
  mk('g',D.g,D.g.map(x=>x.replace('계열','')));
  mk('y',Y,Y.map(String));
  mk('t',D.t,D.t);
  mk('s',D.s,D.s.map((x,i)=>i===0?x:x+'<small>·특별</small>'));
  mk('d',D.d,D.d);
  mk('reg',D.r,D.r);
}
function updFilterUI(){
  document.querySelectorAll('.chip').forEach(ch=>{
    const f=ch.dataset.f,v=+ch.dataset.v;
    let on=false;
    if(f==='reg')on=v<0?S.reg.size===0:S.reg.has(v);
    else on=(S[f==='y'?'y':f]===v)||(v<0&&S[f==='y'?'y':f]<0);
    ch.classList.toggle('on',on);
  });
  $('#q').value=S.q;
  $('#grade').value=S.grade==null?'':S.grade;
  $('#only3').checked=S.only3;
  $('#trsort').value=S.trs;
  $('#row-y').style.display=S.tab==='tr'?'none':'';
  $('#gradewrap').style.display=S.tab==='tr'?'none':'';
}

/* ── 탭 전환/렌더 ── */
function go(){
  document.querySelectorAll('.tabbtn').forEach(b=>b.classList.toggle('on',b.dataset.tab===S.tab));
  for(const[t,id]of Object.entries({ex:'sec-ex',tr:'sec-tr',uv:'sec-uv',cmp:'sec-cmp',gd:'sec-gd'}))
    document.getElementById(id).hidden=(S.tab!==t);
  $('#filters').style.display=(S.tab==='ex'||S.tab==='tr')?'':'none';
  updFilterUI();
  renderConsultPanel();
  if(S.tab==='ex')renderEx();
  else if(S.tab==='tr')renderTr();
  else if(S.tab==='uv')renderUv();
  renderCmp();
  updateHash();
}
function onFilterChange(){S.n=400;S.tn=300;go()}

/* ── 이벤트 ── */
document.addEventListener('click',e=>{
  const consultAction=e.target.closest('[data-consult-action]');
  if(consultAction){
    const action=consultAction.dataset.consultAction;
    if(action==='print')printConsultReport();
    if(action==='clear'){S.cmp=[];renderConsultPanel();renderCmp();if(S.tab==='ex')renderEx();updateHash();toast('선택을 비웠습니다');}
    if(action==='reset'){
      S.student={name:'',school:'',grade:'',desiredMajor:'',desiredUniversity:'',memo:''};
      S.cmp=[];renderConsultPanel();renderCmp();if(S.tab==='ex')renderEx();updateHash();toast('학생정보와 선택을 초기화했습니다');
    }
    return;
  }
  const consultRemove=e.target.closest('[data-consult-remove]');
  if(consultRemove){
    S.cmp=S.cmp.filter(k=>k!==consultRemove.dataset.consultRemove);
    renderConsultPanel();renderCmp();if(S.tab==='ex')renderEx();updateHash();toast('선택에서 제외했습니다');
    return;
  }
  const tb=e.target.closest('.tabbtn');
  if(tb){S.tab=tb.dataset.tab;go();return}
  const chip=e.target.closest('.chip');
  if(chip){
    const f=chip.dataset.f,v=+chip.dataset.v;
    if(f==='reg'){if(v<0)S.reg.clear();else S.reg.has(v)?S.reg.delete(v):S.reg.add(v)}
    else S[f]=v===S[f]&&v>=0?-1:v;          // 같은 칩 재클릭 시 전체로
    onFilterChange();return;
  }
  if(e.target.matches('.cmpck')){addCmp(e.target.dataset.key);return}
  const bc=e.target.closest('.b-cmp');
  if(bc){addCmp(bc.dataset.key);return}
  const bu=e.target.closest('.b-uv');
  if(bu){S.univ=+bu.dataset.u;S.tab='uv';go();window.scrollTo({top:0});return}
  const rm=e.target.closest('.rm');
  if(rm){S.cmp=S.cmp.filter(k=>k!==rm.dataset.x);renderConsultPanel();renderCmp();updateHash();return}
  const th=e.target.closest('#extbl th[data-k]');
  if(th){const k=th.dataset.k;const col=COLS.find(c=>c.k===k);
    if(S.sc===k)S.sd=-S.sd;else{S.sc=k;S.sd=col.d0}
    renderEx();updateHash();return}
  const tr1=e.target.closest('#extbl tbody tr[data-i]');
  if(tr1){toggleDetail(tr1);return}
  const tr2=e.target.closest('#trtbl tbody tr[data-i]');
  if(tr2){const r=R[+tr2.dataset.i];S.univ=r[2];S.tab='uv';go();window.scrollTo({top:0});return}
});
document.addEventListener('input',e=>{
  const field=e.target.closest('[data-student]');
  if(!field)return;
  const key=field.dataset.student;
  if(Object.prototype.hasOwnProperty.call(S.student,key))S.student[key]=field.value;
});
$('#q').addEventListener('input',()=>{S.q=$('#q').value;S.n=400;S.tn=300;S.tab==='tr'?renderTr():renderEx();updateHash()});
$('#grade').addEventListener('input',()=>{const v=parseFloat($('#grade').value);S.grade=(!isNaN(v)&&v>=1&&v<=9)?v:null;if(S.tab==='ex')renderEx();updateHash()});
$('#btn-reset').addEventListener('click',()=>{S.g=-1;S.y=2;S.t=-1;S.s=-1;S.d=-1;S.reg.clear();S.q='';S.grade=null;S.sc='';S.sd=1;S.only3=false;S.trs='0';onFilterChange()});
$('#btn-link').addEventListener('click',()=>{
  if(navigator.clipboard&&navigator.clipboard.writeText){
    navigator.clipboard.writeText(location.href).then(()=>toast('현재 화면 링크를 복사했습니다')).catch(()=>toast('복사 실패 — 주소창에서 직접 복사해 주세요'));
  }else toast('이 환경에서는 자동 복사가 안 됩니다 — 주소창에서 직접 복사해 주세요');
});
$('#more-ex').addEventListener('click',()=>{S.n+=400;renderEx()});
$('#more-tr').addEventListener('click',()=>{S.tn+=300;renderTr()});
$('#only3').addEventListener('change',()=>{S.only3=$('#only3').checked;S.tn=300;renderTr();updateHash()});
$('#trsort').addEventListener('change',()=>{S.trs=$('#trsort').value;S.tn=300;renderTr();updateHash()});
$('#uvsel').addEventListener('change',()=>{S.univ=+$('#uvsel').value;renderUv();updateHash()});
$('#gotoCmp').addEventListener('click',()=>{S.tab='cmp';go();window.scrollTo({top:0})});
$('#clrCmp').addEventListener('click',()=>{S.cmp=[];renderConsultPanel();renderCmp();if(S.tab==='ex')renderEx();updateHash()});
window.addEventListener('hashchange',()=>{parseHash();go()});

/* ── 초기화 ── */
$('#gd-collected').textContent=META.collected;
$('#gd-univ').textContent=NF(META.univ);
$('#gd-total').textContent=NF(META.total);
$('#ft-collected').textContent='(수집 '+META.collected+')';
buildChips();buildUvSel();parseHash();go();
