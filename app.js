(function(){
"use strict";
var KEY="dachaja_checks_v1", VKEY="dachaja_votes_v1";
var CAT_COLOR={"AI 브리핑·AI 검색":"#7c3aed","랭킹·신뢰도":"#db2777","콘텐츠 작성 가이드":"#059669","스팸·어뷰징·광고표시":"#dc2626","검색 화면·블록":"#2563eb","블로그 기능·정책":"#ea580c","클립·숏폼":"#0891b2","웹마스터·서치어드바이저":"#4b5563","종료·변경된 서비스":"#a16207"};
var IMPACT_CLS={"높음":"t-hi","중간":"t-mid","낮음":"t-lo"};
var state={q:"",s:"all",cat:"전체"}, DATA=null;
var checks=load(KEY), votes=load(VKEY);
function load(k){try{return JSON.parse(localStorage.getItem(k))||{}}catch(e){return {}}}
function save(k,v){try{localStorage.setItem(k,JSON.stringify(v))}catch(e){}}
function esc(s){return String(s).replace(/[&<>"']/g,function(c){return {"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[c]})}
function $(id){return document.getElementById(id)}
function tid(it,i){return it.id+"#"+i}
function daysBetween(a,b){return Math.round((new Date(b)-new Date(a))/864e5)}
function toast(m){var t=document.createElement("div");t.className="toast";t.textContent=m;document.body.appendChild(t);setTimeout(function(){t.remove()},1800)}

fetch("data.json?v="+Date.now(),{cache:"no-store"}).then(function(r){return r.json()}).then(function(d){DATA=d;init()}).catch(function(){ $("list").innerHTML='<div class="empty">데이터를 불러오지 못했어요. 새로고침 해 주세요.</div>' });

function init(){
  $("updated").textContent=DATA.lastUpdated;
  $("note").textContent=DATA.note||"";
  $("srcs").innerHTML=DATA.checkedSources.map(function(s){return '<a href="'+esc(s.url)+'" target="_blank" rel="noopener">'+esc(s.name)+'</a>'}).join(" · ");
  var cats=["전체"];DATA.items.forEach(function(i){if(cats.indexOf(i.category)<0)cats.push(i.category)});
  $("catChips").innerHTML=cats.map(function(c){return '<button data-c="'+esc(c)+'"'+(c==="전체"?' class="on"':'')+'>'+esc(c)+'</button>'}).join("");
  $("q").addEventListener("input",function(e){state.q=e.target.value.trim().toLowerCase();render()});
  $("statusChips").addEventListener("click",function(e){var b=e.target.closest("button");if(!b)return;state.s=b.dataset.s;on("statusChips",b);render()});
  $("catChips").addEventListener("click",function(e){var b=e.target.closest("button");if(!b)return;state.cat=b.dataset.c;on("catChips",b);render()});
  document.addEventListener("change",function(e){
    if(e.target.matches(".todo input")){var k=e.target.dataset.k;if(e.target.checked){checks[k]=Date.now()}else{delete checks[k]}save(KEY,checks);
      var card=e.target.closest(".card");updateCard(card);stats();today();
      if(e.target.checked){var it=find(card.dataset.id);if(it&&it.todos.every(function(_,i){return checks[tid(it,i)]}))toast("🎉 이 항목 완료! 잘하셨어요");else toast("✅ 체크 완료")}}
  });
  document.addEventListener("click",function(e){var b=e.target.closest(".vote button");if(!b)return;var id=b.dataset.id,v=b.dataset.v;votes[id]=votes[id]===v?undefined:v;if(!votes[id])delete votes[id];save(VKEY,votes);renderRumors()});
  $("reset").addEventListener("click",function(){if(confirm("체크 표시를 모두 지울까요?")){checks={};save(KEY,checks);render()}});
  render();
}
function on(id,b){[].forEach.call($(id).children,function(x){x.classList.toggle("on",x===b)})}
function find(id){for(var i=0;i<DATA.items.length;i++)if(DATA.items[i].id===id)return DATA.items[i]}
function doneCount(it){return it.todos.filter(function(_,i){return checks[tid(it,i)]}).length}
function match(txt){return !state.q||txt.toLowerCase().indexOf(state.q)>=0}
function itemText(it){return [it.title,it.summary,it.category,it.date,it.todos.join(" "),it.sources.map(function(s){return s.name}).join(" ")].join(" ")}

function render(){
  var showItems=state.s!=="unverified";
  var list=showItems?DATA.items.filter(function(it){
    if(state.cat!=="전체"&&it.category!==state.cat)return false;
    if(state.s==="todo"&&doneCount(it)===it.todos.length)return false;
    return match(itemText(it));
  }):[];
  var html="",yr="";
  list.forEach(function(it){
    var y=it.date.slice(0,4);if(y!==yr){yr=y;html+='<div class="year"><span>'+y+'년</span></div>'}
    html+=card(it);
  });
  $("list").innerHTML=html;
  renderDailyTop();
  renderRumors();
  var rumorShown=$("rumors").innerHTML!=="";
  $("empty").hidden=!!(list.length||rumorShown);
  stats();today();
}
function card(it){
  var c=CAT_COLOR[it.category]||"#6d28d9", isNew=daysBetween(it.date,DATA.lastUpdated)<=30;
  var dn=doneCount(it);
  return '<article class="card'+(dn===it.todos.length?' done':'')+'" data-id="'+esc(it.id)+'" style="--c:'+c+'">'+
   '<div class="meta"><b>'+esc(it.date.replace(/-/g,"."))+'</b>'+(isNew?'<span class="tag t-new">NEW</span>':'')+
   '<span class="tag t-cat">'+esc(it.category)+'</span><span class="tag '+(IMPACT_CLS[it.impact]||"")+'">영향 '+esc(it.impact)+'</span><span class="tag t-ok">✅ 공식 확인</span></div>'+
   '<h2>'+esc(it.title)+'</h2><p class="sum">'+esc(it.summary)+'</p>'+
   '<div class="todos"><h4><span>📝 내 블로그에 적용할 일</span><span class="cnt">'+dn+'/'+it.todos.length+'</span></h4>'+
   it.todos.map(function(t,i){var k=tid(it,i);return '<label class="todo"><input type="checkbox" data-k="'+esc(k)+'"'+(checks[k]?' checked':'')+'><span>'+esc(t)+'</span></label>'}).join("")+'</div>'+
   '<div class="src">'+it.sources.map(function(s){return '<a href="'+esc(s.url)+'" target="_blank" rel="noopener">🔗 '+esc(s.name)+'</a>'}).join("")+'</div></article>';
}
function updateCard(card){var it=find(card.dataset.id);var dn=doneCount(it);card.querySelector(".cnt").textContent=dn+"/"+it.todos.length;card.classList.toggle("done",dn===it.todos.length)}
function renderRumors(){
  if(state.s==="confirmed"||state.s==="todo"||state.cat!=="전체"){$("rumors").innerHTML="";return}
  var rs=DATA.unverified.filter(function(r){return match([r.title,r.claim,r.officialNote].join(" "))});
  if(!rs.length){$("rumors").innerHTML="";return}
  $("rumors").innerHTML='<h2>❓ 미확인 소문 vs 공식 입장</h2><p>업계에서 도는 이야기 중 <b>네이버 공식 근거가 없는 것</b>입니다. 근거로 쓰지 마세요. 아래 "공식 입장"은 관련 공식 글에서 확인된 내용만 적었습니다.</p>'+
   rs.map(function(r){var v=votes[r.id];return '<div class="rcard"><span class="tag t-un">❓ 미확인</span><h3>'+esc(r.title)+'</h3><p class="claim">소문: '+esc(r.claim)+'</p>'+
    '<div class="off"><b>공식 확인 결과</b> · '+esc(r.officialNote)+'</div>'+
    (r.related&&r.related.length?'<div class="src">'+r.related.map(function(s){return '<a href="'+esc(s.url)+'" target="_blank" rel="noopener">🔗 '+esc(s.name)+'</a>'}).join("")+'</div>':'')+
    '<div class="vote"><button data-id="'+esc(r.id)+'" data-v="heard"'+(v==="heard"?' class="on"':'')+'>👂 들어봤어요</button><button data-id="'+esc(r.id)+'" data-v="believed"'+(v==="believed"?' class="on"':'')+'>😅 믿었었어요</button><button data-id="'+esc(r.id)+'" data-v="new"'+(v==="new"?' class="on"':'')+'>💡 처음 알았어요</button></div></div>'}).join("");
}

function renderDailyTop(){
  var box=$("dailytop"); if(!box)return;
  var dt=DATA.dailyTop; if(!dt||!dt.items||!dt.items.length){box.innerHTML="";return}
  var html='<div class="dt-box"><h3>🔥 전날 탑티어 <span>'+esc(dt.forDate||'')+'</span></h3>';
  if(dt.note) html+='<p class="dt-note">'+esc(dt.note)+'</p>';
  html+='<ol>'+dt.items.map(function(it,i){
    var src=(it.sources||[]).map(function(s){return '<a href="'+esc(s.url)+'" target="_blank" rel="noopener">'+esc(s.name)+'</a>'}).join(' · ');
    return '<li><b>'+esc(it.title)+'</b><span class="why">'+esc(it.why||'')+'</span>'+(src?'<div class="src">'+src+'</div>':'')+(it.apply?'<div class="apply">적용: '+esc(it.apply)+'</div>':'')+'</li>';
  }).join('')+'</ol></div>';
  box.innerHTML=html;
}

function stats(){
  var tot=0,dn=0;DATA.items.forEach(function(it){tot+=it.todos.length;dn+=doneCount(it)});
  var recent=DATA.items.filter(function(it){return daysBetween(it.date,DATA.lastUpdated)<=30}).length;
  var pct=tot?Math.round(dn*100/tot):0;
  $("stats").innerHTML=st(DATA.items.length,"✅ 확인됨")+st(DATA.unverified.length,"❓ 미확인")+st(recent,"🆕 최근 30일")+st(dn+"/"+tot,"📝 할 일");
  $("pct").textContent=pct+"%";$("bar").style.width=pct+"%";
  $("cheer").textContent=pct===0?"첫 체크를 해 보세요! 아래 '오늘의 한 가지'부터 시작해요 💪":pct<30?"좋은 출발이에요 🌱":pct<70?"절반 가까이 왔어요 🚀":pct<100?"거의 다 왔어요 🔥":"모두 완료! 알고리즘 마스터 🏆";
}
function st(n,l){return '<div class="stat"><b>'+n+'</b><span>'+l+'</span></div>'}
var skip=0;
function today(){
  var pool=[];DATA.items.forEach(function(it){if(it.impact==="낮음")return;it.todos.forEach(function(t,i){if(!checks[tid(it,i)])pool.push({it:it,i:i,t:t})})});
  if(!pool.length){$("today").innerHTML="";return}
  var p=pool[(skip)%pool.length];
  $("today").innerHTML='<div class="box"><h3>🎯 오늘의 한 가지</h3><p>'+esc(p.t)+'</p><p style="font-size:12.5px;color:#6b6488">근거: '+esc(p.it.date)+' · '+esc(p.it.title)+'</p><button class="do">했어요 ✅</button><button class="skip">다른 거 🔄</button></div>';
  $("today").querySelector(".do").onclick=function(){checks[tid(p.it,p.i)]=Date.now();save(KEY,checks);render();toast("🎉 오늘의 한 가지 완료!")};
  $("today").querySelector(".skip").onclick=function(){skip++;today()};
}
})();
