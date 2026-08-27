/* Goalora UI recovery: never leave the user with a blank app if another script fails. */
(function(){
  const esc=v=>String(v??'').replace(/[&<>"']/g,m=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#039;'}[m]));
  const getSession=()=>{try{return JSON.parse(localStorage.getItem('goalora-auth-session')||'null')}catch{return null}};
  const getData=()=>{try{return JSON.parse(localStorage.getItem('goalora-data-v1')||'null')}catch{return null}};
  function renderFallback(){
    const content=document.getElementById('content');
    const shell=document.getElementById('appShell');
    if(!content || !shell || content.innerHTML.trim()) return;
    const s=getSession(); if(!s) return;
    const d=getData()||{goals:[],categories:[],notes:[],reminders:[],habitDays:[]};
    const name=esc(s.user?.displayName||'there');
    const goals=Array.isArray(d.goals)?d.goals:[];
    const cats=Array.isArray(d.categories)?d.categories:[];
    const done=goals.filter(g=>g.status==='Completed'||Number(g.progress||0)>=100).length;
    const active=goals.filter(g=>g.status==='In Progress').length;
    const avg=goals.length?Math.round(goals.reduce((a,g)=>a+Number(g.progress||0),0)/goals.length):0;
    content.innerHTML=`
      <div class="page-head"><div><p class="eyebrow">Goalora</p><h1>Welcome, ${name}! 👋</h1><p>Your goals, plans and progress — all in one place.</p></div><button class="primary" id="recoveryNewGoal">＋ New Goal</button></div>
      <div class="stats"><div class="stat"><small>Total Goals</small><strong>${goals.length}</strong><em>All your goals</em></div><div class="stat"><small>In Progress</small><strong>${active}</strong><em>Keep going</em></div><div class="stat"><small>Completed</small><strong>${done}</strong><em>Wins worth celebrating</em></div><div class="stat"><small>Avg. Progress</small><strong>${avg}%</strong><em>Overall momentum</em></div></div>
      <div class="grid-2"><div class="panel"><div class="panel-head"><h2>Your Categories</h2></div><div class="categories-grid">${cats.map(c=>`<div class="cat-card"><div class="cat-head"><div class="cat-icon">${esc(c.icon||'◎')}</div><div><strong>${esc(c.name)}</strong><span>${goals.filter(g=>g.category===c.name).length} goals</span></div></div></div>`).join('')||'<div class="empty"><strong>No categories yet</strong>Start by creating a goal.</div>'}</div></div><div class="panel motivation"><div class="eyebrow">Daily motivation</div><div class="quote">“Progress, not perfection. Keep moving.”</div><div class="author">— Goalora</div></div></div>
      <div class="panel"><div class="panel-head"><h2>Goals</h2><span class="badge">${goals.length} total</span></div>${goals.length?goals.slice(0,8).map(g=>`<div class="progress-row"><div><strong>${esc(g.name)}</strong><span>${esc(g.category||'General')}</span></div><div class="cell-progress"><strong>${Number(g.progress||0)}%</strong><div class="progress-line"><i style="width:${Math.max(0,Math.min(100,Number(g.progress||0)))}%"></i></div></div></div>`).join(''):'<div class="empty"><strong>Your workspace is ready.</strong>Create your first goal — it will start at 0%.</div>'}</div>`;
    document.getElementById('recoveryNewGoal')?.addEventListener('click',()=>window.openGoal?.());
  }
  window.addEventListener('error',()=>setTimeout(renderFallback,50));
  window.addEventListener('unhandledrejection',()=>setTimeout(renderFallback,50));
  window.addEventListener('load',()=>setTimeout(renderFallback,900));
})();
