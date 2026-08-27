const KEY='goalora-data-v1';
const themeKey='goalora-theme';
const quotes=[
  ['The future depends on what you do today.','Mahatma Gandhi'],
  ['Small steps every day create big results.','Goalora'],
  ['Your goals are the roadmap to your future.','Goalora'],
  ['Discipline turns intentions into achievements.','Goalora'],
  ['Progress, not perfection. Keep moving.','Goalora']
];
const defaultCategories=[
  ['Clothes','👕','blue'],['House','🏠','purple'],['Education','🎓','green'],['Finance','💰','orange'],
  ['Health & Fitness','❤️','pink'],['Travel','✈️','blue'],['Personal Growth','🌱','purple'],['Relationships','❤️','orange'],
  ['Business','💼','blue'],['Fun & Hobbies','🎮','pink'],['Spirituality','✨','green'],['Lifestyle','⭐','blue']
].map((x,i)=>({id:'cat-'+i,name:x[0],icon:x[1],color:x[2],createdAt:Date.now()}));
const sampleGoals=[
  {id:'g1',name:'Build a better wardrobe',category:'Clothes',subcategory:'Wardrobe',description:'Create a simple wardrobe with versatile everyday pieces.',priority:'High',status:'In Progress',progress:72,due:'2026-09-30',target:50000,current:32000,checklist:[{text:'List essentials',done:true},{text:'Set shopping budget',done:true},{text:'Buy shoes',done:false},{text:'Buy quality shirts',done:false}],createdAt:Date.now()-400000},
  {id:'g2',name:'Buy a comfortable bed',category:'House',subcategory:'Bedroom',description:'Upgrade the bedroom with a comfortable bed and bedding.',priority:'Medium',status:'In Progress',progress:50,due:'2026-10-15',target:30000,current:15000,checklist:[{text:'Compare prices',done:true},{text:'Choose mattress',done:false},{text:'Save remaining amount',done:false}],createdAt:Date.now()-300000},
  {id:'g3',name:'Save for a shopping spree',category:'Finance',subcategory:'Savings',description:'Build a dedicated shopping fund without touching emergency savings.',priority:'High',status:'In Progress',progress:30,due:'2026-09-20',target:80000,current:24000,checklist:[{text:'Open savings goal',done:true},{text:'Weekly deposit',done:false}],createdAt:Date.now()-200000},
  {id:'g4',name:'Complete a professional course',category:'Education',subcategory:'Skills',description:'Finish one useful certification and add it to my portfolio.',priority:'Medium',status:'Not Started',progress:0,due:'2026-11-30',target:12000,current:0,checklist:[{text:'Choose course',done:false},{text:'Register',done:false},{text:'Study weekly',done:false}],createdAt:Date.now()-100000},
  {id:'g5',name:'Morning workout routine',category:'Health & Fitness',subcategory:'Fitness',description:'Build a consistent 30-minute morning exercise habit.',priority:'Medium',status:'In Progress',progress:60,due:'2026-10-01',target:0,current:0,checklist:[{text:'Exercise Mon–Fri',done:true},{text:'Track sessions',done:true},{text:'Adjust routine',done:false}],createdAt:Date.now()-80000},
  {id:'g6',name:'Plan a weekend trip',category:'Travel',subcategory:'Trips',description:'Choose a nearby destination and build a realistic budget.',priority:'Low',status:'Not Started',progress:0,due:'2026-12-10',target:25000,current:0,checklist:[{text:'Pick destination',done:false},{text:'Check transport',done:false},{text:'Book accommodation',done:false}],createdAt:Date.now()-50000}
];
const starterNotes=[
  {id:'n1',title:'My dream wardrobe',body:'Keep it simple: neutral colors, good shoes, a few quality shirts and one great jacket.',createdAt:Date.now()-86400000},
  {id:'n2',title:'House ideas',body:'Bedroom first, then living room. Compare prices before buying anything.',createdAt:Date.now()-172800000},
  {id:'n3',title:'Monthly money plan',body:'Save first. Separate goal money from spending money. Review every Sunday.',createdAt:Date.now()-259200000}
];
const base={categories:defaultCategories,goals:sampleGoals,notes:starterNotes,reminders:[],habitDays:[],settings:{displayName:'Emmanuel'}};
let data=load();
let state={view:'dashboard',goalFilter:'all',search:'',editingGoalId:null};
let deferredInstallPrompt=null;

function load(){try{const raw=localStorage.getItem(KEY);return raw?JSON.parse(raw):structuredClone(base)}catch{return structuredClone(base)}}
function save(){localStorage.setItem(KEY,JSON.stringify(data));}
function esc(v=''){return String(v).replace(/[&<>\"']/g,m=>({'&':'&amp;','<':'&lt;','>':'&gt;','\"':'&quot;',"'":'&#039;'}[m]));}
function fmtDate(d){if(!d)return 'No date';const x=new Date(d+'T12:00:00');return x.toLocaleDateString(undefined,{month:'short',day:'numeric',year:'numeric'})}
function fmtMoney(n){return Number(n||0).toLocaleString('en-KE')}
function slug(s){return String(s).toLowerCase().replace(/[^a-z0-9]+/g,'-')}
function cat(name){return data.categories.find(c=>c.name===name)||{name:'Uncategorized',icon:'◎',color:'blue'}}
function avgProgress(){return data.goals.length?Math.round(data.goals.reduce((a,g)=>a+Number(g.progress||0),0)/data.goals.length):0}
function stats(){return {total:data.goals.length,done:data.goals.filter(g=>g.status==='Completed'||g.progress>=100).length,progress:data.goals.filter(g=>g.status==='In Progress').length,avg:avgProgress()}}
function getAccountName(){try{const s=JSON.parse(localStorage.getItem('goalora-auth-session')||'null');return (s?.user?.displayName||'').trim()||'Goalora user'}catch{return 'Goalora user'}}
function setView(view){state.view=view;render();window.scrollTo({top:0,behavior:'smooth'});document.getElementById('sidebar').classList.remove('open')}
function openModal(id){document.getElementById('overlay').classList.add('open');document.getElementById(id).classList.add('open');document.getElementById(id).setAttribute('aria-hidden','false')}
function closeModal(id){document.getElementById('overlay').classList.remove('open');const el=document.getElementById(id);el.classList.remove('open');el.setAttribute('aria-hidden','true')}
function toast(msg){const el=document.getElementById('toast');el.textContent=msg;el.classList.add('show');clearTimeout(window._toast);window._toast=setTimeout(()=>el.classList.remove('show'),2200)}
function statusClass(s){return s==='Completed'?'completed':s==='Not Started'?'not':''}
function priorityClass(p){return String(p||'').toLowerCase()}
function filteredGoals(){const q=state.search.trim().toLowerCase();return data.goals.filter(g=>{
  const matchFilter=state.goalFilter==='all'||(state.goalFilter==='completed'?(g.status==='Completed'||g.progress>=100):state.goalFilter==='progress'?g.status==='In Progress':g.status==='Not Started');
  const hay=[g.name,g.category,g.subcategory,g.description,g.priority,g.status].join(' ').toLowerCase();
  return matchFilter&&(!q||hay.includes(q));
})}
function viewHead(title,desc,button=true){return `<div class="page-head"><div><p class="eyebrow">Goalora</p><h1>${title}</h1><p>${desc}</p></div>${button?'<button class="primary" id="headNewGoal">＋ New Goal</button>':''}</div>`}
function categoryCards(){return `<div class="panel"><div class="panel-head"><h2>Goal Categories</h2><button class="link-btn" data-nav="categories">View all</button></div><div class="categories-grid">${data.categories.map(c=>{
  const goals=data.goals.filter(g=>g.category===c.name), p=goals.length?Math.round(goals.reduce((a,g)=>a+g.progress,0)/goals.length):0;
  return `<button class="cat-card" data-category="${esc(c.name)}"><div class="cat-head"><div class="cat-icon">${esc(c.icon)}</div><div><strong>${esc(c.name)}</strong><span>${goals.length} goal${goals.length===1?'':'s'}</span></div></div><div class="progress-line"><i style="width:${p}%"></i></div><div class="progress-meta"><span>Progress</span><strong>${p}%</strong></div></button>`}).join('')}</div></div>`}
function goalRow(g){const c=cat(g.category);return `<button class="goal-row" data-goal="${g.id}"><span class="goal-check">${esc(c.icon)}</span><span class="goal-main"><strong>${esc(g.name)}</strong><small>${esc(g.category)}${g.subcategory?' · '+esc(g.subcategory):''}</small></span><span class="goal-end"><span class="badge ${priorityClass(g.priority)}">${esc(g.priority)}</span><small>${fmtDate(g.due)}</small></span></button>`}
function dashboard(){const s=stats();const upcoming=[...data.goals].filter(g=>g.due&&!((g.status==='Completed'||g.progress>=100))).sort((a,b)=>new Date(a.due)-new Date(b.due)).slice(0,5);const q=quotes[new Date().getDate()%quotes.length];const name=esc(getAccountName());
 return `${viewHead('Welcome, '+name+'! 👋','Turn your ideas into goals, and your goals into progress.')}
 <div class="stats"><div class="stat"><div class="stat-top"><small>Total Goals</small><span class="stat-icon">◎</span></div><strong>${s.total}</strong><em>All your goals</em></div><div class="stat"><div class="stat-top"><small>In Progress</small><span class="stat-icon">↗</span></div><strong>${s.progress}</strong><em>Keep going</em></div><div class="stat"><div class="stat-top"><small>Completed</small><span class="stat-icon">✓</span></div><strong>${s.done}</strong><em>Wins worth celebrating</em></div><div class="stat"><div class="stat-top"><small>Avg. Progress</small><span class="stat-icon">✦</span></div><strong>${s.avg}%</strong><em>Across all goals</em></div></div>
 <div class="grid-2"><div class="panel">${categoryCards()}</div><div class="panel motivation"><div><div class="eyebrow">Daily motivation</div><div class="quote">“${esc(q[0])}”</div><div class="author">— ${esc(q[1])}</div></div></div></div>
 <div class="split"><div class="panel"><div class="panel-head"><h2>Upcoming Goals</h2><button class="link-btn" data-nav="goals">View all</button></div><div class="goal-list">${upcoming.length?upcoming.map(goalRow).join(''):'<div class="empty"><strong>No upcoming goals</strong>Add a deadline to keep your momentum visible.</div>'}</div></div><div class="panel"><div class="panel-head"><h2>Goal Progress</h2><button class="link-btn" data-nav="progress">Details</button></div><div style="position:relative"><div class="ring" style="--p:${s.avg*3.6}deg"></div><div class="ring-center"><strong>${s.avg}%</strong><small>average</small></div></div></div></div>
 <div class="table-panel panel"><div class="panel-head"><h2>All Goals at a Glance</h2><button class="link-btn" data-nav="goals">Manage goals</button></div><div class="table-scroll"><table class="goal-table"><thead><tr><th>Goal</th><th>Category</th><th>Progress</th><th>Due</th><th>Priority</th><th>Status</th></tr></thead><tbody>${data.goals.slice(0,7).map(g=>`<tr data-goal="${g.id}"><td><span class="row-title">${esc(g.name)}</span></td><td>${esc(g.category)}</td><td><div class="cell-progress"><span style="font-size:9px;color:var(--muted)">${g.progress}%</span><div class="progress-line"><i style="width:${g.progress}%"></i></div></div></td><td>${fmtDate(g.due)}</td><td><span class="badge ${priorityClass(g.priority)}">${esc(g.priority)}</span></td><td><span class="status ${statusClass(g.status)}">${esc(g.status)}</span></td></tr>`).join('')}</tbody></table></div></div>`}
function goalsView(){const items=filteredGoals();return `${viewHead('Your goals','Every goal has a place. Track the next action and keep moving.')}
<div class="toolbar"><div class="toolbar-left"><button class="filter-btn ${state.goalFilter==='all'?'active':''}" data-filter="all">All</button><button class="filter-btn ${state.goalFilter==='progress'?'active':''}" data-filter="progress">In Progress</button><button class="filter-btn ${state.goalFilter==='not'?'active':''}" data-filter="not">Not Started</button><button class="filter-btn ${state.goalFilter==='completed'?'active':''}" data-filter="completed">Completed</button></div><div class="toolbar-right"><select class="select" id="categoryFilter"><option value="">All categories</option>${data.categories.map(c=>`<option>${esc(c.name)}</option>`).join('')}</select><select class="select" id="sortGoals"><option value="due">Sort: Due date</option><option value="progress">Sort: Progress</option><option value="name">Sort: Name</option></select></div></div>
<div id="goalCards" class="cards-grid">${items.length?items.map(goalCard).join(''):'<div class="empty" style="grid-column:1/-1"><strong>No goals found</strong>Try another filter or create a new goal.</div>'}</div>`}
function goalCard(g){const c=cat(g.category);return `<article class="goal-card"><div class="goal-card-head"><span class="cat-icon">${esc(c.icon)}</span><span class="badge ${priorityClass(g.priority)}">${esc(g.priority)}</span></div><h3>${esc(g.name)}</h3><p>${esc(g.description||'No description yet.')}</p><div class="meta"><span class="badge">${esc(g.category)}</span>${g.subcategory?`<span class="badge">${esc(g.subcategory)}</span>`:''}<span class="badge">${fmtDate(g.due)}</span></div>${g.target?`<div class="money">KSh ${fmtMoney(g.current)} of <strong>KSh ${fmtMoney(g.target)}</strong></div>`:''}<div class="progress-meta"><span>${esc(g.status)}</span><strong>${g.progress}%</strong></div><div class="progress-line"><i style="width:${g.progress}%"></i></div><div class="card-actions"><button class="secondary" data-goal="${g.id}">Open</button><button class="primary" data-edit="${g.id}">Edit</button></div></article>`}
