/* Goalora universal back navigation */
(function(){
  const NAV_KEY='goalora-nav-stack-v1';
  let stack=[];
  try{stack=JSON.parse(sessionStorage.getItem(NAV_KEY)||'[]')}catch{stack=[]}
  function persist(){try{sessionStorage.setItem(NAV_KEY,JSON.stringify(stack.slice(-20)))}catch{}}
  function current(){return typeof state==='object'&&state?state.view:'dashboard'}
  function push(view){if(!view)return;if(stack.at(-1)!==view)stack.push(view);persist()}
  function go(view){if(typeof setView==='function'){setView(view);return}window.location.href='./'}
  function back(){
    if(stack.length>1){stack.pop();const previous=stack.at(-1)||'dashboard';persist();go(previous)}
    else go('dashboard');
  }
  function addBackButton(){
    const content=document.getElementById('content');
    if(!content||current()==='dashboard') return;
    const head=content.querySelector('.page-head');
    if(!head||head.querySelector('.goalora-back')) return;
    const button=document.createElement('button');
    button.className='secondary goalora-back';button.type='button';button.setAttribute('aria-label','Go back');button.textContent='← Back';
    button.addEventListener('click',back);
    const left=head.querySelector(':scope > div:first-child');
    if(left) left.prepend(button); else head.prepend(button);
  }
  function patch(){
    const v=current();
    if(!stack.length) stack=['dashboard'];
    if(stack.at(-1)!==v) push(v);
    setTimeout(addBackButton,0);
  }
  const style=document.createElement('style');
  style.textContent=`.goalora-back{display:inline-flex;align-items:center;gap:6px;margin-bottom:11px;padding:8px 12px;font-size:11px}.goalora-back:hover{transform:translateX(-1px)}`;
  document.head.appendChild(style);
  document.addEventListener('click',e=>{const nav=e.target.closest?.('[data-view],[data-nav]');if(nav){const v=nav.dataset.view||nav.dataset.nav;if(v)push(v);setTimeout(addBackButton,0)}});
  const originalRender=window.render;
  if(typeof originalRender==='function'){
    window.render=function(){originalRender();patch()};
  }
  window.addEventListener('popstate',back);
  if(typeof history!=='undefined'&&history.replaceState){history.replaceState({goalora:true},'',location.href)}
  setTimeout(patch,0);
  window.goaloraBack=back;
})();
