/* Goalora Smart Goal Planner
   Category templates + quantity/amount based automatic progress.
*/
(function(){
  const TEMPLATES={
    'Clothes':{unit:'items',items:['Trousers','Shirts','T-shirts','Jeans','Shorts','Dresses','Skirts','Jackets','Sweaters','Hoodies','Suits','Shoes','Sandals','Bags','Belts','Underwear','Socks','Caps','Other'],examples:['Build my wardrobe','Buy 5 trousers','Complete my wardrobe']},
    'House':{unit:'items',items:['Bed','Mattress','Sofa','Dining table','Chairs','Wardrobe','Curtains','Carpet','TV','Fridge','Cooker','Microwave','Kitchen utensils','Bedding','Bathroom items','Decorations','Other'],examples:['Furnish my bedroom','Buy 4 chairs','Set up my house']},
    'Education':{unit:'items',items:['Books','Course','Unit','Exam','Assignment','Certificate','Skill','Training','Revision sessions','School fees','Other'],examples:['Read 5 books','Complete a course','Finish my semester']},
    'Finance':{unit:'items',items:['Savings','Emergency fund','Investment','Debt repayment','Rent','School fees','Business capital','Phone','Car','Land','House','Other'],examples:['Save KSh 100,000','Build an emergency fund','Pay off debt']},
    'Health & Fitness':{unit:'items',items:['Gym sessions','Runs','Walks','Workouts','Meals','Water days','Medical checkup','Dental visit','Sleep days','Weight milestone','Other'],examples:['Complete 20 workouts','Run 50 km','Drink enough water for 30 days']},
    'Travel':{unit:'items',items:['Destination','Trip','Flight','Bus ticket','Hotel night','Activity','Passport task','Visa task','Travel fund','Other'],examples:['Visit 3 destinations','Plan a holiday','Save for a trip']},
    'Personal Growth':{unit:'items',items:['Book','Course','Skill','Habit','Journal days','Meditation days','Project','Challenge','Other'],examples:['Read 10 books','Learn a new skill','Complete a 30-day challenge']},
    'Relationships':{unit:'items',items:['Date','Family visit','Call','Gift','Quality-time day','Trip','Activity','Milestone','Other'],examples:['Plan 5 dates','Visit family 4 times','Create more quality time']},
    'Business':{unit:'items',items:['Customer','Product','Sale','Order','Client','Lead','Campaign','Project','Employee','Business task','Other'],examples:['Get 20 customers','Make 50 sales','Launch a product']},
    'Fun & Hobbies':{unit:'items',items:['Book','Movie','Game','Workout','Drawing','Song','Project','Event','Trip','Other'],examples:['Read 5 novels','Finish 3 art projects','Play 10 games']},
    'Spirituality':{unit:'items',items:['Prayer day','Reading day','Service','Study session','Meditation','Fellowship','Reflection day','Other'],examples:['Complete 30 days of prayer','Read a book','Attend 10 services']},
    'Lifestyle':{unit:'items',items:['Morning routine','Declutter task','Cooking day','Self-care day','Digital detox day','Home task','Personal task','Other'],examples:['Complete a 30-day routine','Declutter my room','Build a better routine']}
  };
  const FALLBACK={unit:'items',items:['Task','Item','Session','Step','Milestone','Other'],examples:['Complete 5 tasks','Finish my project','Reach my target']};
  const esc=v=>String(v??'').replace(/[&<>\"']/g,m=>({'&':'&amp;','<':'&lt;','>':'&gt;','\"':'&quot;',"'":'&#039;'}[m]));
  const template=cat=>TEMPLATES[cat]||FALLBACK;
  function style(){if(document.getElementById('smartGoalStyle'))return;const s=document.createElement('style');s.id='smartGoalStyle';s.textContent=`.smart-goal-box{grid-column:1/-1;padding:15px 16px;border:1px solid var(--line);border-radius:15px;background:linear-gradient(145deg,rgba(99,91,255,.07),rgba(35,184,231,.04))}.smart-goal-title{display:flex;justify-content:space-between;gap:10px;align-items:center;margin-bottom:10px}.smart-goal-title strong{font-size:13px}.smart-auto{font-size:9px;font-weight:850;padding:5px 8px;border-radius:99px;background:rgba(29,187,131,.11);color:var(--success)}.smart-goal-grid{display:grid;grid-template-columns:1fr 1fr 1fr;gap:10px}.smart-goal-grid label{font-size:10px}.smart-goal-grid input,.smart-goal-grid select{margin-top:6px;width:100%}.smart-progress-message{margin-top:10px;color:var(--muted);font-size:10px;line-height:1.45}.smart-examples{display:flex;gap:6px;flex-wrap:wrap;margin-top:9px}.smart-example{background:var(--surface);border:1px solid var(--line);color:var(--muted);padding:6px 8px;border-radius:9px;font-size:9px;cursor:pointer}.smart-example:hover{color:var(--primary);border-color:var(--primary)}@media(max-width:700px){.smart-goal-grid{grid-template-columns:1fr 1fr}}@media(max-width:480px){.smart-goal-grid{grid-template-columns:1fr}}`;document.head.appendChild(s)}
  function form(){return document.getElementById('goalForm')}
  function getCat(){return form()?.elements.category?.value||''}
  function findGoal(id){try{return window.goaloraData?.get?.().goals?.find(g=>g.id===id)}catch{return null}}
  function ensureFields(){
    const f=form();if(!f)return null;style();
    let box=document.getElementById('smartGoalBox');
    if(!box){box=document.createElement('div');box.id='smartGoalBox';box.className='smart-goal-box';const actions=f.querySelector('.form-actions');f.insertBefore(box,actions||null)}
    return box;
  }
  function refreshBox(existing){
    const f=form(),box=ensureFields();if(!f||!box)return;
    const t=template(getCat());
    box.innerHTML=`<div class="smart-goal-title"><strong>Smart progress</strong><span class="smart-auto">AUTOMATIC %</span></div><div class="smart-goal-grid"><label>What are you tracking?<select id="smartItem">${t.items.map(x=>`<option value="${esc(x)}">${esc(x)}</option>`).join('')}</select></label><label>Target quantity<input id="smartTarget" type="number" min="1" step="1" placeholder="e.g. 5"></label><label>Completed so far<input id="smartCompleted" type="number" min="0" step="1" value="0" placeholder="e.g. 1"></label></div><div class="smart-progress-message" id="smartMessage">Set a target and update how many you have completed. Goalora calculates the percentage for you.</div><div class="smart-examples">${t.examples.map(x=>`<button type="button" class="smart-example" data-example="${esc(x)}">${esc(x)}</button>`).join('')}</div>`;
    const old=existing||{};
    const item=document.getElementById('smartItem'),target=document.getElementById('smartTarget'),done=document.getElementById('smartCompleted');
    if(old.item&&[...item.options].some(o=>o.value===old.item))item.value=old.item; else if(old.item){item.value='Other'}
    target.value=old.targetQty??'';done.value=old.completedQty??0;
    const update=()=>{const a=Math.max(0,Number(target.value||0)),b=Math.max(0,Number(done.value||0));const p=a?Math.min(100,Math.round(b/a*100)):0;const pv=document.getElementById('progressValue');if(pv)pv.textContent=p+'%';const slider=document.getElementById('goalProgress');if(slider){slider.value=p;slider.dispatchEvent(new Event('input',{bubbles:true}))}const msg=document.getElementById('smartMessage');if(msg)msg.textContent=a?`${b} of ${a} ${item.value.toLowerCase()} completed → ${p}% automatically.`:'Set a target and update how many you have completed. Goalora calculates the percentage for you.';};
    target.addEventListener('input',update);done.addEventListener('input',update);item.addEventListener('change',update);
    box.querySelectorAll('[data-example]').forEach(b=>b.addEventListener('click',()=>{const txt=b.dataset.example;f.elements.name.value=txt;const m=txt.match(/\b(\d+)\b/);if(m)target.value=m[1];update()}));
    update();
  }
  function setCategoryOptions(){const f=form();if(!f)return;const sub=f.elements.subcategory;if(!sub)return;const old=sub.value;const t=template(getCat());if(sub.tagName==='SELECT'){sub.innerHTML=`<option value="">Choose an item / area</option>${t.items.map(x=>`<option value="${esc(x)}">${esc(x)}</option>`).join('')}<option value="Custom">Custom</option>`;if(old&&[...sub.options].some(o=>o.value===old))sub.value=old}else{sub.setAttribute('list','goalSubcategoryList');let dl=document.getElementById('goalSubcategoryList');if(!dl){dl=document.createElement('datalist');dl.id='goalSubcategoryList';document.body.appendChild(dl)}dl.innerHTML=t.items.map(x=>`<option value="${esc(x)}">`).join('')}}
  function afterOpen(id){setCategoryOptions();const g=findGoal(id);refreshBox(g||null);}
  function install(){
    const f=form();if(!f||f.dataset.smartInstalled)return;f.dataset.smartInstalled='1';
    f.elements.category?.addEventListener('change',()=>{setCategoryOptions();refreshBox(null)});
    f.elements.subcategory?.addEventListener('change',()=>{});
    document.addEventListener('click',e=>{
      const edit=e.target.closest?.('[data-edit]');const goal=e.target.closest?.('[data-goal]');const newBtn=e.target.closest?.('#headNewGoal,#sidebarNewGoal');
      if(edit){setTimeout(()=>afterOpen(edit.dataset.edit),20);return}
      if(newBtn){setTimeout(()=>afterOpen(null),20);return}
      if(goal&&!edit){/* opening detail needs no planner UI */}
    });
    document.addEventListener('submit',e=>{
      if(e.target!==f)return;
      const target=Number(document.getElementById('smartTarget')?.value||0),completed=Number(document.getElementById('smartCompleted')?.value||0),item=document.getElementById('smartItem')?.value||'';
      const progress=target?Math.min(100,Math.max(0,Math.round(completed/target*100))):0;
      const progressEl=f.elements.progress;if(progressEl)progressEl.value=progress;const pv=document.getElementById('progressValue');if(pv)pv.textContent=progress+'%';
      const name=f.elements.name.value;
      setTimeout(()=>{const d=window.goaloraData?.get?.();if(!d?.goals)return;let g=d.goals.find(x=>x.name===name);if(g){g.targetQty=target;g.completedQty=Math.min(completed,target||completed);g.goalItem=item;g.progress=progress;g.status=progress>=100?'Completed':progress>0?'In Progress':'Not Started';if(target===0&&Number(g.target||0)>0&&Number(g.current||0)>=Number(g.target))g.progress=100;window.goaloraData.save?.();window.render?.()}},80);
    },true);
  }
  style();
  const observer=new MutationObserver(()=>{if(form())install()});observer.observe(document.body,{childList:true,subtree:true});
  window.addEventListener('load',()=>setTimeout(()=>{install();setCategoryOptions()},100));
})();
