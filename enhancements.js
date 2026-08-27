/* Goalora first-run onboarding + zero-start goal behavior */
(function(){
  const DATA_KEY='goalora-data-v1';
  const GUIDE_KEY='goalora-first-run-guide-v1';
  const style=document.createElement('style');
  style.textContent=`
    .goalora-guide{position:fixed;inset:0;z-index:9999;display:none;align-items:center;justify-content:center;background:rgba(8,12,28,.68);backdrop-filter:blur(8px);padding:20px}
    .goalora-guide.open{display:flex}
    .goalora-guide-card{width:min(720px,100%);max-height:min(88vh,760px);overflow:auto;background:var(--panel,#fff);color:var(--text,#111827);border:1px solid var(--border,#e7e9f2);border-radius:24px;box-shadow:0 28px 80px rgba(0,0,0,.22);padding:30px}
    .goalora-guide-top{display:flex;align-items:flex-start;justify-content:space-between;gap:16px}
    .goalora-guide-icon{width:54px;height:54px;border-radius:16px;display:grid;place-items:center;background:linear-gradient(135deg,#635bff,#8b7cff);color:#fff;font-size:25px;box-shadow:0 10px 24px rgba(99,91,255,.28)}
    .goalora-guide-card h2{font-size:30px;margin:18px 0 8px}.goalora-guide-card>p{color:var(--muted,#667085);line-height:1.65;margin:0 0 22px}
    .guide-steps{display:grid;gap:12px;margin:18px 0 24px}.guide-step{display:flex;gap:14px;align-items:flex-start;padding:14px;border:1px solid var(--border,#e7e9f2);border-radius:16px;background:var(--surface,#fafbff)}
    .guide-num{flex:0 0 32px;width:32px;height:32px;border-radius:50%;display:grid;place-items:center;background:rgba(99,91,255,.12);color:#635bff;font-weight:800}.guide-step strong{display:block;margin-bottom:4px}.guide-step span{display:block;color:var(--muted,#667085);font-size:13px;line-height:1.5}
    .guide-tip{padding:14px 16px;border-radius:16px;background:rgba(99,91,255,.08);border:1px solid rgba(99,91,255,.16);color:var(--muted,#667085);font-size:13px;line-height:1.55;margin-bottom:22px}.guide-actions{display:flex;justify-content:flex-end;gap:10px;flex-wrap:wrap}
    .guide-link{position:fixed;right:22px;bottom:22px;z-index:900;background:var(--panel,#fff);color:var(--text,#111827);border:1px solid var(--border,#e7e9f2);box-shadow:0 10px 24px rgba(0,0,0,.12);border-radius:999px;padding:10px 15px;font-weight:700;cursor:pointer}
    @media(max-width:640px){.goalora-guide-card{padding:22px;border-radius:20px}.goalora-guide-card h2{font-size:25px}.guide-link{right:14px;bottom:14px}}
  `;
  document.head.appendChild(style);

  function safeLoad(){try{const raw=localStorage.getItem(DATA_KEY);return raw?JSON.parse(raw):null}catch{return null}}
  function safeSave(data){try{localStorage.setItem(DATA_KEY,JSON.stringify(data));return true}catch{return false}}

  // Freshen the existing demo workspace once so all starting goals are truly zeroed.
  // This keeps the current repository/demo from opening with artificial progress.
  (function zeroInitialGoals(){
    const marker='goalora-zero-start-v2';
    if(localStorage.getItem(marker)) return;
    const data=safeLoad();
    if(data && Array.isArray(data.goals)){
      data.goals=data.goals.map(g=>({...g,progress:0,current:0,status:'Not Started',checklist:Array.isArray(g.checklist)?g.checklist.map(i=>({...i,done:false})):[]}));
      safeSave(data);
      localStorage.setItem(marker,'1');
    }
  })();

  function openGuide(){document.getElementById('goaloraGuide')?.classList.add('open')}
  function closeGuide(){document.getElementById('goaloraGuide')?.classList.remove('open');try{localStorage.setItem(GUIDE_KEY,'1')}catch{}}

  function buildGuide(){
    if(document.getElementById('goaloraGuide')) return;
    const wrap=document.createElement('div');
    wrap.id='goaloraGuide';wrap.className='goalora-guide';
    wrap.innerHTML=`<div class="goalora-guide-card" role="dialog" aria-modal="true" aria-labelledby="guideTitle">
      <div class="goalora-guide-top"><div class="goalora-guide-icon">◎</div><button class="icon-btn" id="guideClose" aria-label="Close user guide">×</button></div>
      <div class="eyebrow">Welcome to Goalora</div>
      <h2 id="guideTitle">Plan it. Start at zero. Build it step by step.</h2>
      <p>This quick guide shows you how Goalora works the first time you open it. Your goals begin at <strong>0%</strong> so your progress grows from your real actions.</p>
      <div class="guide-steps">
        <div class="guide-step"><div class="guide-num">1</div><div><strong>Create a goal</strong><span>Open <b>＋ New Goal</b>, choose a category, add a deadline, target amount, description and checklist. New goals start at 0%.</span></div></div>
        <div class="guide-step"><div class="guide-num">2</div><div><strong>Break it into actions</strong><span>Use the checklist for the small steps that move the main goal forward. Tick actions off as you complete them.</span></div></div>
        <div class="guide-step"><div class="guide-num">3</div><div><strong>Move the progress runner</strong><span>Open a goal whenever you make real progress and update its percentage. Start at 0%, then move toward 100%.</span></div></div>
        <div class="guide-step"><div class="guide-num">4</div><div><strong>Use the dashboard</strong><span>Dashboard shows your total goals, in-progress goals, completed goals, average progress and upcoming deadlines.</span></div></div>
        <div class="guide-step"><div class="guide-num">5</div><div><strong>Make Goalora yours</strong><span>Create your own categories, add notes, habits, reminders and a vision board. Use Settings to export a backup.</span></div></div>
      </div>
      <div class="guide-tip"><strong>Best practice:</strong> Do not set a goal to 50% just because you created it. Let 0% mean “I have not started yet” and update the runner when you actually move forward.</div>
      <div class="guide-actions"><button class="secondary" id="guideLater">Close guide</button><button class="primary" id="guideStart">Create my first goal</button></div>
    </div>`;
    document.body.appendChild(wrap);
    document.getElementById('guideClose').addEventListener('click',closeGuide);
    document.getElementById('guideLater').addEventListener('click',closeGuide);
    document.getElementById('guideStart').addEventListener('click',()=>{closeGuide();document.getElementById('sidebarNewGoal')?.click()});
    wrap.addEventListener('click',e=>{if(e.target===wrap)closeGuide()});

    const help=document.createElement('button');help.className='guide-link';help.type='button';help.textContent='? User Guide';help.title='Open Goalora user guide';help.addEventListener('click',openGuide);document.body.appendChild(help);
  }

  // Ensure every NEW goal starts at zero before the original save handler reads the form.
  document.addEventListener('submit',function(e){
    if(e.target?.id==='goalForm'){
      const title=document.getElementById('goalModalTitle')?.textContent||'';
      if(/create a goal/i.test(title)){
        const progress=document.getElementById('goalProgress');
        const progressValue=document.getElementById('progressValue');
        const status=e.target.elements.status;
        if(progress) progress.value='0';
        if(progressValue) progressValue.textContent='0%';
        if(status) status.value='Not Started';
        const current=e.target.elements.current;
        if(current && !current.value) current.value='0';
      }
    }
  },true);

  // Whenever the create form opens, visibly reset the runner to the starting point.
  document.addEventListener('click',function(e){
    const btn=e.target.closest?.('#headNewGoal,#sidebarNewGoal,[data-open-goal],#guideStart');
    if(!btn) return;
    setTimeout(()=>{
      const title=document.getElementById('goalModalTitle')?.textContent||'';
      if(/create a goal/i.test(title)){
        const p=document.getElementById('goalProgress');const pv=document.getElementById('progressValue');const s=document.querySelector('#goalForm select[name="status"]');
        if(p)p.value='0';if(pv)pv.textContent='0%';if(s)s.value='Not Started';
      }
    },0);
  });

  buildGuide();
  // Show only on the first visit. Existing local data remains intact after that.
  let seen=false;try{seen=localStorage.getItem(GUIDE_KEY)==='1'}catch{}
  if(!seen) setTimeout(openGuide,450);
})();
