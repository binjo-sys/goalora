/* Goalora install experience */
(function(){
  let deferred=null;
  const style=document.createElement('style');
  style.textContent=`
    .install-hero{margin:0 0 18px;padding:20px 22px;border:1px solid var(--line);border-radius:18px;background:linear-gradient(135deg,rgba(99,91,255,.12),rgba(34,184,255,.08));display:flex;align-items:center;justify-content:space-between;gap:16px;box-shadow:var(--shadow)}
    .install-hero h3{margin:0 0 5px;font-size:17px}.install-hero p{margin:0;color:var(--muted);font-size:11px;line-height:1.5}.install-actions{display:flex;gap:8px;flex-wrap:wrap;flex:0 0 auto}
    .install-help{font-size:11px;color:var(--muted);margin-top:8px}.install-help strong{color:var(--text)}
    @media(max-width:720px){.install-hero{align-items:flex-start;flex-direction:column}.install-actions{width:100%}.install-actions button{flex:1}}
  `;document.head.appendChild(style);

  function isStandalone(){return window.matchMedia?.('(display-mode: standalone)').matches||window.navigator.standalone===true}
  function showTip(){
    if(isStandalone()) return;
    if(document.getElementById('installTip')) return;
    const tip=document.createElement('div');tip.id='installTip';tip.className='install-hero';
    tip.innerHTML=`<div><h3>Install Goalora on your phone</h3><p>Open Goalora from your app launcher like a normal app. Your data and offline experience stay with the installed app.</p><div class="install-help" id="installHelp"><strong>Android:</strong> tap Install Goalora. If your browser does not offer direct install, use the browser menu → Add to Home screen.</div></div><div class="install-actions"><button class="primary" id="installHeroBtn">⇩ Install Goalora</button><button class="secondary" id="installDismiss">Not now</button></div>`;
    const content=document.getElementById('content'); if(content) content.prepend(tip);
    document.getElementById('installHeroBtn').addEventListener('click',install);
    document.getElementById('installDismiss').addEventListener('click',()=>tip.remove());
  }
  async function install(){
    if(deferred){deferred.prompt();const r=await deferred.userChoice;deferred=null;if(r.outcome==='accepted'){toast?.('Goalora installed');document.getElementById('installTip')?.remove()}return}
    showManualHelp();
  }
  function showManualHelp(){
    const help=document.getElementById('installHelp');
    if(!help)return;
    const isIOS=/iPhone|iPad|iPod/i.test(navigator.userAgent);
    help.innerHTML=isIOS
      ? '<strong>iPhone/iPad:</strong> tap Share in Safari → Add to Home Screen → Add.'
      : '<strong>Android:</strong> tap your browser menu ⋮ → Add to Home screen or Install app → Add.';
  }
  window.addEventListener('beforeinstallprompt',e=>{e.preventDefault();deferred=e;document.getElementById('installBtn')?.style.setProperty('display','grid');showTip();});
  window.addEventListener('appinstalled',()=>{deferred=null;document.getElementById('installTip')?.remove();try{toast('Goalora installed successfully')}catch{}});
  window.goaloraInstall={install,showTip};
  window.addEventListener('load',()=>{if(!isStandalone())setTimeout(showTip,900)});
})();
