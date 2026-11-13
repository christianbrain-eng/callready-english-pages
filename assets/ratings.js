const siteRoot=new URL('../',document.currentScript.src);document.querySelectorAll('a[href="/"]').forEach(a=>a.href=siteRoot.href);document.querySelectorAll('[data-grade-link]').forEach(a=>a.href=new URL('ratings/?level='+a.dataset.gradeLink,siteRoot).href);
const GRADES = Object.freeze({high:'상',medium:'중',low:'하'});
const RATING_KEY = 'callready-word-ratings-v1';
function normalizeState(raw, keys){
 const ratings=Object.create(null); let max=0;
 if(raw && typeof raw==='object' && raw.version===1 && raw.ratings && typeof raw.ratings==='object'){
  for(const key of keys){const r=raw.ratings[key];if(r && Object.hasOwn(GRADES,r.grade) && Number.isFinite(r.updatedAt) && r.updatedAt>0 && Number.isSafeInteger(r.order) && r.order>0){ratings[key]={grade:r.grade,updatedAt:r.updatedAt,order:r.order};max=Math.max(max,r.order)}}
 }
 return {version:1,nextOrder:max+1,ratings};
}
function assignRating(state,key,grade,keys,now=Date.now()){
 if(!keys.includes(key)||!Object.hasOwn(GRADES,grade))throw Error('Invalid rating');
 if(!Number.isFinite(now)||now<=0)throw Error('Invalid timestamp');
 const clean=normalizeState(state,keys);
 clean.ratings[key]={grade,updatedAt:now,order:clean.nextOrder};clean.nextOrder++;
 return clean;
}
function orderedKeys(state,grade,keys){
 return keys.filter(k=>state.ratings[k]?.grade===grade).sort((a,b)=>state.ratings[b].order-state.ratings[a].order || a.localeCompare(b));
}

const data=JSON.parse(document.querySelector('#rating-data').textContent),keys=data.map(a=>a.lemma),tabs=[...document.querySelectorAll('[role=tab]')],panels=[...document.querySelectorAll('[role=tabpanel]')];
const isLibrary=location.pathname.replace(/\/$/,'').endsWith('/ratings');
const labels=GRADES;let state,storageAvailable=true,current=-1,visible=[];
function load(){try{return normalizeState(JSON.parse(localStorage.getItem(RATING_KEY)),keys)}catch{storageAvailable=false;return normalizeState(null,keys)}}
state=load();
function level(){const value=new URLSearchParams(location.search).get('level');return Object.hasOwn(labels,value)?value:'high'}
function formatTime(value){return new Intl.DateTimeFormat('ko-KR',{timeZone:'Asia/Seoul',month:'numeric',day:'numeric',hour:'2-digit',minute:'2-digit',second:'2-digit',hour12:false}).format(value)}
function select(index,focus=false){if(!visible.includes(index))return;current=index;tabs.forEach((t,i)=>{t.setAttribute('aria-selected',String(i===index));t.tabIndex=i===index?0:-1;panels[i].hidden=i!==index});const pos=visible.indexOf(index);document.querySelector('#counter').textContent=`${pos+1} / ${visible.length}`;document.querySelector('#current-label').textContent=isLibrary?`${visible.length}개`:`${index+1} / 200`;document.querySelector('#prev').disabled=pos===0;document.querySelector('#next').disabled=pos===visible.length-1;const url=new URL(location.href);url.hash=`tab-${index+1}`;history.replaceState(null,'',url);if(focus)tabs[index].focus();tabs[index].scrollIntoView({block:'nearest',inline:'nearest'});}
function render(preferred=current){
 const grade=level();visible=isLibrary?orderedKeys(state,grade,keys).map(k=>keys.indexOf(k)):keys.map((_,i)=>i);
 document.body.classList.toggle('rating-library',isLibrary);
 document.querySelector('#library-title').textContent=isLibrary?`${labels[grade]} 평가 표현`:'공부한 표현을 상·중·하로 정리하세요.';
 document.querySelector('#library-description').textContent=isLibrary?'최근에 평가하거나 등급을 바꾼 표현부터 보여줍니다.':'각 문장을 공부한 뒤 평가하세요. 같은 브라우저에서 기록을 이어볼 수 있습니다.';
 document.querySelector('#library-back').hidden=!isLibrary;
 document.querySelector('#list-title').textContent=isLibrary?'최근 평가순':'전체 표현';
 for(const [g,label] of Object.entries(labels)){const count=orderedKeys(state,g,keys).length;document.querySelectorAll(`[data-grade-link="${g}"]`).forEach(a=>{a.textContent=`${label} ${count}`;a.setAttribute('aria-current',isLibrary&&grade===g?'page':'false')})}
 const rated=Object.keys(state.ratings).length;document.querySelector('#rating-progress').textContent=`평가 완료 ${rated} / 200 · 미평가 ${200-rated}`;
 document.querySelector('#storage-note').textContent=storageAvailable?'평가 기록은 이 브라우저에 저장됩니다. 다른 브라우저·기기와 자동으로 공유되지 않습니다.':'브라우저 저장을 사용할 수 없어, 이 화면을 열어 둔 동안에만 평가가 유지됩니다.';
 tabs.forEach((t,i)=>{t.hidden=!visible.includes(i);const r=state.ratings[keys[i]];const badge=t.querySelector('.tab-rating');badge.textContent=r?labels[r.grade]:'미평가';t.querySelector('.tab-date').textContent=isLibrary&&r?formatTime(r.updatedAt):'';panels[i].querySelectorAll('.grade-button').forEach(b=>b.checked=r?.grade===b.dataset.grade);panels[i].querySelector('.rating-date').textContent=r?`${labels[r.grade]} · 마지막 평가 ${formatTime(r.updatedAt)} (한국 시간)`:'아직 평가하지 않았습니다.';});
 if(isLibrary)visible.forEach(i=>document.querySelector('.tabs').append(tabs[i]));
 document.querySelector('#rating-empty').hidden=visible.length>0;document.querySelector('#rating-empty-text').textContent=`아직 ${labels[grade]}로 평가한 표현이 없습니다. 전체 학습에서 상·중·하를 선택해 주세요.`;
 document.querySelector('.controls').hidden=visible.length===0;
 if(!visible.length){panels.forEach(p=>p.hidden=true);current=-1;document.querySelector('#current-label').textContent='0개';const u=new URL(location.href);u.hash='';history.replaceState(null,'',u)}
 else select(visible.includes(preferred)?preferred:visible[0]);
}
function rate(index,grade){state=assignRating(state,keys[index],grade,keys);try{localStorage.setItem(RATING_KEY,JSON.stringify(state));storageAvailable=true}catch{storageAvailable=false}const moved=isLibrary&&grade!==level();render(index);document.querySelector('#rating-status').textContent=`${data[index].lemma}을(를) ${labels[grade]}로 분류했습니다.${moved?' 다른 등급으로 옮겨 현재 목록에서 제외했습니다.':''}`;}
panels.forEach((p,i)=>p.querySelectorAll('.grade-button').forEach(b=>b.addEventListener('change',()=>{if(b.checked)rate(i,b.dataset.grade)})));
tabs.forEach((t,i)=>{t.addEventListener('click',()=>select(i));t.addEventListener('keydown',e=>{const p=visible.indexOf(i);let next;if(e.key==='ArrowRight'||e.key==='ArrowDown')next=visible[(p+1)%visible.length];else if(e.key==='ArrowLeft'||e.key==='ArrowUp')next=visible[(p+visible.length-1)%visible.length];else if(e.key==='Home')next=visible[0];else if(e.key==='End')next=visible[visible.length-1];else return;e.preventDefault();select(next,true)})});
document.querySelector('#prev').addEventListener('click',()=>select(visible[visible.indexOf(current)-1]));document.querySelector('#next').addEventListener('click',()=>select(visible[visible.indexOf(current)+1]));
document.querySelectorAll('[data-grade-link]').forEach(a=>a.addEventListener('click',e=>{if(!isLibrary)return;e.preventDefault();const url=new URL(a.href);history.pushState(null,'',url);current=-1;render()}));
function fromUrl(){const m=location.hash.match(/^#tab-(\d+)$/);render(m?Number(m[1])-1:current)}
addEventListener('popstate',fromUrl);addEventListener('hashchange',fromUrl);addEventListener('storage',e=>{if(e.key===RATING_KEY||e.key===null){state=load();render()}});fromUrl();
