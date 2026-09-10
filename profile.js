const profileStore={
  get(){try{return JSON.parse(localStorage.getItem('novella-profile')||'null')}catch{return null}},
  save(p){localStorage.setItem('novella-profile',JSON.stringify(p))},
  clear(){localStorage.removeItem('novella-profile')}
};
function profileStats(){
  const saved=JSON.parse(localStorage.getItem('novella-saved')||'[]');
  const started=BOOKS.filter(b=>Number(localStorage.getItem('novella-progress-'+b.id)||0)>0);
  const finished=BOOKS.filter(b=>Number(localStorage.getItem('novella-progress-'+b.id)||0)>=100);
  return {saved:saved.length,started:started.length,finished:finished.length};
}
function initials(name){return String(name||'Reader').trim().split(/\s+/).slice(0,2).map(x=>x[0]).join('').toUpperCase()||'R'}
function showProfile(){
  const p=profileStore.get()||{name:'',bio:''};
  const s=profileStats();
  $('#profileContent').innerHTML=`<div class="profile-head"><div class="avatar">${initials(p.name)}</div><div><div class="eyebrow">Reader profile</div><h2>${p.name?`Welcome back, ${esc(p.name)}`:'Create your reader profile'}</h2><p class="muted">Keep your reading identity and library close at hand.</p></div></div><div class="profile-stats"><div><strong>${s.saved}</strong><span>Saved</span></div><div><strong>${s.started}</strong><span>Started</span></div><div><strong>${s.finished}</strong><span>Finished</span></div></div><form id="profileForm" class="profile-form"><label>Name<input id="profileName" maxlength="40" value="${esc(p.name)}" placeholder="Your name"></label><label>Bio <span class="muted">optional</span><textarea id="profileBio" maxlength="160" placeholder="Tell readers a little about you">${esc(p.bio)}</textarea></label><div class="profile-actions"><button type="submit" class="primary">Save profile</button>${p.name?'<button type="button" class="secondary" id="clearProfile">Clear</button>':''}</div></form>`;
  $('#profile').classList.remove('hidden');
  $('#profileForm').onsubmit=e=>{e.preventDefault();const name=$('#profileName').value.trim();const bio=$('#profileBio').value.trim();if(!name){$('#profileName').focus();return}profileStore.save({name,bio,updated:Date.now()});showProfile();render()};
  $('#clearProfile')?.addEventListener('click',()=>{profileStore.clear();showProfile();render()});
}
function closeProfile(){$('#profile').classList.add('hidden')}
function updateGreeting(){const p=profileStore.get();const hero=document.querySelector('.hero .eyebrow');if(hero&&p?.name)hero.textContent=`Welcome back, ${p.name}`;}
document.addEventListener('DOMContentLoaded',()=>{ $('#profileBtn')?.addEventListener('click',showProfile); $('#closeProfile')?.addEventListener('click',closeProfile); $('#profile')?.addEventListener('click',e=>{if(e.target.id==='profile')closeProfile()}); document.addEventListener('keydown',e=>{if(e.key==='Escape')closeProfile()}); updateGreeting(); });
window.addEventListener('storage',updateGreeting);
