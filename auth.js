/* Goalora account client: local-first, cloud-ready. */
(function(){
  const SESSION_KEY='goalora-auth-session';
  const API_KEY='goalora-api-url';
  const DATA_KEY='goalora-data-v1';
  const defaultApi='';
  const apiBase=()=>{try{return localStorage.getItem(API_KEY)||defaultApi}catch{return defaultApi}};
  const session=()=>{try{return JSON.parse(localStorage.getItem(SESSION_KEY)||'null')}catch{return null}};
  const setSession=(v)=>{try{localStorage.setItem(SESSION_KEY,JSON.stringify(v))}catch{}};
  const clearSession=()=>{try{localStorage.removeItem(SESSION_KEY)}catch{}};
  const getData=()=>{try{return JSON.parse(localStorage.getItem(DATA_KEY)||'null')}catch{return null}};
  const setData=(d)=>{try{localStorage.setItem(DATA_KEY,JSON.stringify(d));return true}catch{return false}};
  const esc=(v='')=>String(v).replace(/[&<>"']/g,m=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#039;'}[m]));
  const request=async(path,options={})=>{
    const base=apiBase();
    if(!base) throw new Error('CLOUD_API_NOT_CONFIGURED');
    const s=session();
    const headers={'Content-Type':'application/json',...(options.headers||{})};
    if(s?.token) headers.Authorization='Bearer '+s.token;
    const res=await fetch(base.replace(/\/$/,'')+path,{...options,headers});
    const body=await res.json().catch(()=>({}));
    if(!res.ok) throw new Error(body.message||body.code||'REQUEST_FAILED');
    return body;
  };
  function toast(msg){const e=document.getElementById('toast');if(!e)return;e.textContent=msg;e.classList.add('show');clearTimeout(window._goaloraAuthToast);window._goaloraAuthToast=setTimeout(()=>e.classList.remove('show'),2300)}
  function inject(){
    if(document.getElementById('accountModal')) return;
    const style=document.createElement('style');
    style.textContent=`
      .account-status{display:flex;align-items:center;gap:8px;padding:10px 12px;border:1px solid var(--line);border-radius:12px;background:var(--surface-2);font-size:11px;color:var(--muted)}
      .account-dot{width:8px;height:8px;border-radius:50%;background:var(--warning)}.account-dot.online{background:var(--success)}
      .auth-note{font-size:11px;line-height:1.5;color:var(--muted);margin-top:7px}.auth-tabs{display:grid;grid-template-columns:1fr 1fr;background:var(--surface-2);padding:4px;border-radius:12px;margin-bottom:16px}.auth-tab{padding:9px;border-radius:9px;background:transparent;color:var(--muted);font-weight:750;font-size:12px}.auth-tab.active{background:var(--surface);color:var(--text);box-shadow:var(--shadow)}
      .account-card{display:grid;gap:14px}.account-user{display:flex;justify-content:space-between;align-items:center;gap:12px;padding:14px;border:1px solid var(--line);border-radius:14px}.account-user strong{display:block;font-size:14px}.account-user span{display:block;font-size:11px;color:var(--muted);margin-top:3px}
      .cloud-pill{display:inline-flex;align-items:center;gap:6px;border-radius:99px;padding:5px 9px;background:rgba(29,187,131,.1);color:var(--success);font-size:9px;font-weight:800}.cloud-pill.off{background:var(--surface-2);color:var(--muted)}
    `;document.head.appendChild(style);
    const modal=document.createElement('section');modal.className='modal';modal.id='accountModal';modal.setAttribute('aria-hidden','true');
    modal.innerHTML=`<div class="modal-head"><div><p class="eyebrow">Your Goalora account</p><h2>Account & Cloud Sync</h2></div><button class="icon-btn" id="accountClose">×</button></div><div id="accountBody"></div>`;
    document.body.appendChild(modal);
    document.getElementById('accountClose').addEventListener('click',()=>close());
    document.getElementById('overlay')?.addEventListener('click',close);
  }
  function open(){inject();renderAccount();document.getElementById('overlay')?.classList.add('open');document.getElementById('accountModal').classList.add('open');document.getElementById('accountModal').setAttribute('aria-hidden','false')}
  function close(){const m=document.getElementById('accountModal');if(!m)return;document.getElementById('overlay')?.classList.remove('open');m.classList.remove('open');m.setAttribute('aria-hidden','true')}
  function renderAccount(){
    const body=document.getElementById('accountBody');if(!body)return;
    const s=session();
    if(s){
      body.innerHTML=`<div class="account-card"><div class="account-user"><div><strong>${esc(s.user?.displayName||'Goalora user')}</strong><span>${esc(s.user?.email||'')}</span></div><span class="cloud-pill">● Signed in</span></div><div class="account-status"><span class="account-dot ${apiBase()?'online':''}"></span>${apiBase()?'Cloud API configured':'Cloud API not connected yet'}</div><p class="auth-note">Your browser data remains available locally. When the Goalora Worker URL is configured, Sync uploads this workspace to your private account.</p><div class="form-actions"><button class="secondary" id="syncNow">Sync now</button><button class="danger" id="logoutBtn">Sign out</button></div></div>`;
      document.getElementById('syncNow').addEventListener('click',syncNow);document.getElementById('logoutBtn').addEventListener('click',logout);return;
    }
    body.innerHTML=`<div class="auth-tabs"><button class="auth-tab active" data-auth-tab="login">Sign in</button><button class="auth-tab" data-auth-tab="register">Create account</button></div><form id="authForm" class="form-grid"><label id="nameField" style="display:none">Display name<input name="displayName" maxlength="60" placeholder="Your name"></label><label>Email<input name="email" type="email" required autocomplete="email" placeholder="you@example.com"></label><label>Password<input name="password" type="password" required minlength="10" autocomplete="current-password" placeholder="At least 10 characters"></label><div class="form-actions wide"><button class="primary" type="submit" id="authSubmit">Sign in</button></div><p class="auth-note wide">Cloud accounts are optional. Goalora continues to work locally when cloud sync is unavailable.</p></form>`;
    let mode='login';
    document.querySelectorAll('[data-auth-tab]').forEach(btn=>btn.addEventListener('click',()=>{mode=btn.dataset.authTab;document.querySelectorAll('[data-auth-tab]').forEach(x=>x.classList.toggle('active',x===btn));document.getElementById('nameField').style.display=mode==='register'?'grid':'none';document.getElementById('authSubmit').textContent=mode==='register'?'Create account':'Sign in';document.getElementById('authForm').reset()}));
    document.getElementById('authForm').addEventListener('submit',async e=>{e.preventDefault();const f=e.currentTarget;const submit=document.getElementById('authSubmit');submit.disabled=true;try{const payload={email:f.email.value.trim(),password:f.password.value};if(mode==='register')payload.displayName=f.displayName.value.trim()||'Goalora user';const res=await request(mode==='register'?'/api/auth/register':'/api/auth/login',{method:'POST',body:JSON.stringify(payload)});setSession(res);toast(mode==='register'?'Account created':'Signed in');close();updateProfile();if(mode==='register')await syncNow(true)}catch(err){toast(err.message==='CLOUD_API_NOT_CONFIGURED'?'Cloud API is not configured yet':'Unable to '+(mode==='register'?'create account':'sign in'))}finally{submit.disabled=false}});
  }
  async function syncNow(silent=false){
    try{const res=await request('/api/sync',{method:'POST',body:JSON.stringify({data:getData()||{}})});if(res.data){setData(res.data);if(window.render)window.render()}if(!silent)toast('Goalora synced');}
    catch(err){if(!silent)toast(err.message==='CLOUD_API_NOT_CONFIGURED'?'Connect the Goalora API first':'Sync failed')}
  }
  async function logout(){try{await request('/api/auth/logout',{method:'POST'})}catch{}clearSession();close();updateProfile();toast('Signed out')}
  async function refreshSession(){const s=session();if(!s)return;try{const me=await request('/api/auth/me');setSession({...s,user:me.user})}catch{clearSession()}}
  function updateProfile(){const s=session();const profile=document.getElementById('profileBtn');if(profile){const text=profile.querySelector('span:nth-child(2)');const avatar=profile.querySelector('.avatar');if(text)text.textContent=s?.user?.displayName||'Emmanuel';if(avatar)avatar.textContent=(s?.user?.displayName||'E').trim().charAt(0).toUpperCase()||'E';}const btn=document.getElementById('cloudAccountBtn');if(btn)btn.textContent=s?'Account · Signed in':'Account · Local only'}
  function addSettingsCard(){
    const tryAdd=()=>{const grid=document.querySelector('.settings-grid');if(!grid||document.getElementById('cloudAccountSetting'))return;const card=document.createElement('div');card.className='setting';card.id='cloudAccountSetting';card.innerHTML=`<h3>Account & cloud sync</h3><p>Use a Goalora account to keep your workspace available across devices once cloud sync is connected.</p><div class="setting-actions"><button class="primary" id="cloudAccountBtn">Account · Local only</button></div>`;grid.prepend(card);document.getElementById('cloudAccountBtn').addEventListener('click',open);updateProfile()};setTimeout(tryAdd,0)};
  const originalRender=window.render; if(originalRender) window.render=function(){originalRender();addSettingsCard();updateProfile()};
  window.goaloraAccount={open,syncNow,logout,refreshSession,apiBase,setApiUrl:(url)=>{try{localStorage.setItem(API_KEY,url.trim().replace(/\/$/,''))}catch{}updateProfile();toast('Cloud API URL saved')}};
  window.addEventListener('load',()=>{inject();refreshSession();addSettingsCard();updateProfile()});
  window.addEventListener('keydown',e=>{if(e.key==='Escape'&&document.getElementById('accountModal')?.classList.contains('open'))close()});
})();
