/* Goalora account gate + local-first account management. */
(function(){
  const SESSION_KEY='goalora-auth-session';
  const USERS_KEY='goalora-users-v1';
  const API_KEY='goalora-api-url';
  const DATA_KEY='goalora-data-v1';
  const defaultApi='';
  const apiBase=()=>{try{return localStorage.getItem(API_KEY)||defaultApi}catch{return defaultApi}};
  const session=()=>{try{return JSON.parse(localStorage.getItem(SESSION_KEY)||'null')}catch{return null}};
  const setSession=(v)=>{try{localStorage.setItem(SESSION_KEY,JSON.stringify(v))}catch{}};
  const clearSession=()=>{try{localStorage.removeItem(SESSION_KEY)}catch{}};
  const getUsers=()=>{try{return JSON.parse(localStorage.getItem(USERS_KEY)||'[]')}catch{return []}};
  const setUsers=(u)=>{try{localStorage.setItem(USERS_KEY,JSON.stringify(u));return true}catch{return false}};
  const getData=()=>{try{return JSON.parse(localStorage.getItem(DATA_KEY)||'null')}catch{return null}};
  const setData=(d)=>{try{localStorage.setItem(DATA_KEY,JSON.stringify(d));return true}catch{return false}};
  const esc=(v='')=>String(v).replace(/[&<>"']/g,m=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#039;'}[m]));
  const hash=async(text)=>{const data=new TextEncoder().encode(text);const digest=await crypto.subtle.digest('SHA-256',data);return Array.from(new Uint8Array(digest)).map(b=>b.toString(16).padStart(2,'0')).join('')};
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
    if(document.getElementById('accountGate')) return;
    const style=document.createElement('style');
    style.textContent=`
      #accountGate{position:fixed;inset:0;z-index:10000;background:linear-gradient(145deg,#f7f8ff 0%,#eef2ff 48%,#f9fbff 100%);display:grid;place-items:center;padding:24px;overflow:auto}
      #accountGate.hidden{display:none}
      .gate-card{width:min(460px,100%);background:rgba(255,255,255,.96);border:1px solid #dde2f2;border-radius:24px;padding:30px;box-shadow:0 24px 70px rgba(26,30,58,.14)}
      .gate-brand{display:flex;align-items:center;gap:12px;margin-bottom:22px}.gate-logo{width:48px;height:48px;border-radius:15px;display:grid;place-items:center;background:#635bff;color:#fff;font-size:25px;font-weight:900;box-shadow:0 12px 28px rgba(99,91,255,.25)}
      .gate-brand strong{display:block;font-size:23px}.gate-brand span{display:block;color:#667085;font-size:12px;margin-top:2px}
      .gate-title{margin-bottom:6px;font-size:28px}.gate-sub{margin:0 0 20px;color:#667085;font-size:13px;line-height:1.55}
      .gate-tabs{display:grid;grid-template-columns:1fr 1fr;background:#f2f4fa;padding:4px;border-radius:12px;margin-bottom:18px}.gate-tab{padding:10px;border:0;background:transparent;color:#667085;font-weight:800;border-radius:9px}.gate-tab.active{background:#fff;color:#182230;box-shadow:0 4px 14px rgba(24,34,48,.08)}
      .gate-form{display:grid;gap:13px}.gate-form label{display:grid;gap:6px;font-size:11px;font-weight:800;color:#344054}.gate-form input{width:100%;padding:12px 13px;border:1px solid #d7dce8;border-radius:12px;outline:none;font:inherit;font-size:13px}.gate-form input:focus{border-color:#635bff;box-shadow:0 0 0 3px rgba(99,91,255,.12)}
      .gate-btn{width:100%;padding:13px;border:0;border-radius:12px;background:#635bff;color:#fff;font-weight:850;cursor:pointer}.gate-btn:disabled{opacity:.6}.gate-note{margin-top:13px;color:#667085;font-size:10px;line-height:1.5;text-align:center}
      .gate-error{display:none;padding:10px 12px;border-radius:10px;background:#fff0f0;color:#b42318;font-size:11px}.gate-error.show{display:block}
      .account-status{display:flex;align-items:center;gap:8px;padding:10px 12px;border:1px solid var(--line);border-radius:12px;background:var(--surface-2);font-size:11px;color:var(--muted)}
      .account-dot{width:8px;height:8px;border-radius:50%;background:var(--warning)}.account-dot.online{background:var(--success)}
      .auth-note{font-size:11px;line-height:1.5;color:var(--muted);margin-top:7px}.auth-tabs{display:grid;grid-template-columns:1fr 1fr;background:var(--surface-2);padding:4px;border-radius:12px;margin-bottom:16px}.auth-tab{padding:9px;border-radius:9px;background:transparent;color:var(--muted);font-weight:750;font-size:12px}.auth-tab.active{background:var(--surface);color:var(--text);box-shadow:var(--shadow)}
      .account-card{display:grid;gap:14px}.account-user{display:flex;justify-content:space-between;align-items:center;gap:12px;padding:14px;border:1px solid var(--line);border-radius:14px}.account-user strong{display:block;font-size:14px}.account-user span{display:block;font-size:11px;color:var(--muted);margin-top:3px}
      .cloud-pill{display:inline-flex;align-items:center;gap:6px;border-radius:99px;padding:5px 9px;background:rgba(29,187,131,.1);color:var(--success);font-size:9px;font-weight:800}.cloud-pill.off{background:var(--surface-2);color:var(--muted)}
    `;document.head.appendChild(style);

    const gate=document.createElement('section');gate.id='accountGate';gate.innerHTML=`<div class="gate-card">
      <div class="gate-brand"><div class="gate-logo">◎</div><div><strong>Goalora</strong><span>Plan. Focus. Achieve.</span></div></div>
      <h1 class="gate-title">Your goals. Your account.</h1>
      <p class="gate-sub">Create an account to enter Goalora and keep your personal workspace protected on this device.</p>
      <div class="gate-tabs"><button class="gate-tab active" data-gate-tab="login">Sign in</button><button class="gate-tab" data-gate-tab="register">Create account</button></div>
      <div class="gate-error" id="gateError"></div>
      <form id="gateForm" class="gate-form">
        <label id="gateNameWrap" style="display:none">Your name<input name="displayName" maxlength="60" placeholder="e.g. Emmanuel"></label>
        <label>Email address<input name="email" type="email" required autocomplete="email" placeholder="you@example.com"></label>
        <label>Password<input name="password" type="password" required minlength="8" autocomplete="current-password" placeholder="At least 8 characters"></label>
        <label id="gateConfirmWrap" style="display:none">Confirm password<input name="confirm" type="password" minlength="8" placeholder="Repeat your password"></label>
        <button class="gate-btn" id="gateSubmit" type="submit">Sign in</button>
      </form>
      <div class="gate-note">Your local account is stored securely enough for this prototype using a SHA-256 password hash. Cloud accounts can be connected later for multi-device sync.</div>
    </div>`;
    document.body.appendChild(gate);

    let mode='login';
    const setMode=(next)=>{mode=next;document.querySelectorAll('[data-gate-tab]').forEach(x=>x.classList.toggle('active',x.dataset.gateTab===mode));document.getElementById('gateNameWrap').style.display=mode==='register'?'grid':'none';document.getElementById('gateConfirmWrap').style.display=mode==='register'?'grid':'none';document.getElementById('gateSubmit').textContent=mode==='register'?'Create account':'Sign in';document.getElementById('gateForm').reset();showError('')};
    const showError=(msg)=>{const e=document.getElementById('gateError');if(!e)return;e.textContent=msg;e.classList.toggle('show',!!msg)};
    document.querySelectorAll('[data-gate-tab]').forEach(btn=>btn.addEventListener('click',()=>setMode(btn.dataset.gateTab)));
    document.getElementById('gateForm').addEventListener('submit',async e=>{
      e.preventDefault();
      const f=e.currentTarget;const submit=document.getElementById('gateSubmit');submit.disabled=true;showError('');
      try{
        const email=f.email.value.trim().toLowerCase();const password=f.password.value;
        if(password.length<8)throw new Error('Password must be at least 8 characters.');
        const users=getUsers();
        if(mode==='register'){
          if(!f.displayName.value.trim())throw new Error('Enter your name.');
          if(password!==f.confirm.value)throw new Error('Passwords do not match.');
          if(users.some(u=>u.email===email))throw new Error('An account with that email already exists.');
          const user={id:'u-'+crypto.randomUUID(),email,displayName:f.displayName.value.trim(),passwordHash:await hash(password),createdAt:new Date().toISOString()};
          users.push(user);setUsers(users);setSession({user:{id:user.id,email:user.email,displayName:user.displayName},local:true});
          toast('Account created');openApp();
        }else{
          const user=users.find(u=>u.email===email);if(!user||user.passwordHash!==await hash(password))throw new Error('Incorrect email or password.');
          setSession({user:{id:user.id,email:user.email,displayName:user.displayName},local:true});toast('Signed in');openApp();
        }
      }catch(err){showError(err.message||'Unable to continue.')}finally{submit.disabled=false}
    });
  }

  function openApp(){const g=document.getElementById('accountGate');if(g){g.classList.add('hidden');g.setAttribute('aria-hidden','true')}document.getElementById('appShell')?.classList.remove('auth-locked');updateProfile();}
  function enforceGate(){inject();if(session()){openApp();return}const shell=document.getElementById('appShell');if(shell){shell.classList.add('auth-locked');shell.style.visibility='hidden';}document.getElementById('accountGate').classList.remove('hidden')}

  function open(){inject();renderAccount();document.getElementById('overlay')?.classList.add('open');document.getElementById('accountModal').classList.add('open');document.getElementById('accountModal').setAttribute('aria-hidden','false')}
  function close(){const m=document.getElementById('accountModal');if(!m)return;document.getElementById('overlay')?.classList.remove('open');m.classList.remove('open');m.setAttribute('aria-hidden','true')}
  function renderAccount(){
    let modal=document.getElementById('accountModal');
    if(!modal){modal=document.createElement('section');modal.className='modal';modal.id='accountModal';modal.setAttribute('aria-hidden','true');modal.innerHTML=`<div class="modal-head"><div><p class="eyebrow">Your Goalora account</p><h2>Account & Cloud Sync</h2></div><button class="icon-btn" id="accountClose">×</button></div><div id="accountBody"></div>`;document.body.appendChild(modal);document.getElementById('accountClose').addEventListener('click',close)}
    const body=document.getElementById('accountBody');if(!body)return;const s=session();
    if(s){body.innerHTML=`<div class="account-card"><div class="account-user"><div><strong>${esc(s.user?.displayName||'Goalora user')}</strong><span>${esc(s.user?.email||'')}</span></div><span class="cloud-pill">● Signed in</span></div><div class="account-status"><span class="account-dot ${apiBase()?'online':''}"></span>${apiBase()?'Cloud API configured':'Local account active'}</div><p class="auth-note">Your account is required to enter Goalora. Cloud sync can be connected later for multi-device access.</p><div class="form-actions"><button class="danger" id="logoutBtn">Sign out</button></div></div>`;document.getElementById('logoutBtn').addEventListener('click',logout)}
  }
  async function logout(){clearSession();close();enforceGate();toast('Signed out')}
  async function refreshSession(){if(!session())return;if(!session().local){try{const me=await request('/api/auth/me');setSession({...session(),user:me.user})}catch{clearSession();enforceGate()}}}
  function updateProfile(){const s=session();const profile=document.getElementById('profileBtn');if(profile){const text=profile.querySelector('span:nth-child(2)');const avatar=profile.querySelector('.avatar');if(text)text.textContent=s?.user?.displayName||'Account';if(avatar)avatar.textContent=(s?.user?.displayName||'E').trim().charAt(0).toUpperCase()||'E';}const btn=document.getElementById('cloudAccountBtn');if(btn)btn.textContent=s?'Account · Signed in':'Account · Sign in'}
  function addSettingsCard(){const tryAdd=()=>{const grid=document.querySelector('.settings-grid');if(!grid||document.getElementById('cloudAccountSetting'))return;const card=document.createElement('div');card.className='setting';card.id='cloudAccountSetting';card.innerHTML=`<h3>Account & cloud sync</h3><p>Your Goalora account protects access to your workspace on this device.</p><div class="setting-actions"><button class="primary" id="cloudAccountBtn">Account · Sign in</button></div>`;grid.prepend(card);document.getElementById('cloudAccountBtn').addEventListener('click',open);updateProfile()};setTimeout(tryAdd,0)};
  const originalRender=window.render;if(originalRender)window.render=function(){if(session())originalRender();addSettingsCard();updateProfile()};
  window.goaloraAccount={open,syncNow:async(silent=false)=>{try{const res=await request('/api/sync',{method:'POST',body:JSON.stringify({data:getData()||{}})});if(res.data){setData(res.data);if(window.render)window.render()}if(!silent)toast('Goalora synced')}catch(err){if(!silent)toast(err.message==='CLOUD_API_NOT_CONFIGURED'?'Connect the Goalora API first':'Sync failed')}},logout,refreshSession,apiBase,setApiUrl:(url)=>{try{localStorage.setItem(API_KEY,url.trim().replace(/\/$/,''))}catch{}updateProfile();toast('Cloud API URL saved')}};
  window.addEventListener('load',()=>{enforceGate();refreshSession();addSettingsCard();updateProfile()});
  window.addEventListener('keydown',e=>{if(e.key==='Escape'&&document.getElementById('accountModal')?.classList.contains('open'))close()});
})();