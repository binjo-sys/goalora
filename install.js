/* Goalora install / Android APK download */
(function(){
  const APK_URL='https://github.com/binjo-sys/goalora/releases/download/android-latest/Goalora.apk';
  const FALLBACK_RELEASE='https://github.com/binjo-sys/goalora/releases/tag/android-latest';
  const style=document.createElement('style');
  style.textContent=`
    .install-hero{margin:0 0 18px;padding:20px 22px;border:1px solid var(--line);border-radius:18px;background:linear-gradient(135deg,rgba(99,91,255,.12),rgba(34,184,255,.08));display:flex;align-items:center;justify-content:space-between;gap:16px;box-shadow:var(--shadow)}
    .install-hero h3{margin:0 0 5px;font-size:17px}.install-hero p{margin:0;color:var(--muted);font-size:11px;line-height:1.5}.install-actions{display:flex;gap:8px;flex-wrap:wrap;flex:0 0 auto}
    .install-help{font-size:11px;color:var(--muted);margin-top:8px}.install-help strong{color:var(--text)}
    @media(max-width:720px){.install-hero{align-items:flex-start;flex-direction:column}.install-actions{width:100%}.install-actions button{flex:1}}
  `;document.head.appendChild(style);

  function isStandalone(){return window.matchMedia?.('(display-mode: standalone)').matches||window.navigator.standalone===true}
  function isAndroid(){return /Android/i.test(navigator.userAgent)}
  function updateHelp(text){const help=document.getElementById('installHelp');if(help)help.innerHTML=text}
  function downloadApk(){
    updateHelp('<strong>Downloading:</strong> Goalora.apk is starting. When the download finishes, open the file and tap Install.');
    window.location.assign(APK_URL);
  }
  function install(){
    if(isAndroid()) { downloadApk(); return; }
    showManualHelp();
  }
  function showTip(){
    if(isStandalone()) return;
    if(document.getElementById('installTip')) return;
    const tip=document.createElement('div');tip.id='installTip';tip.className='install-hero';
    tip.innerHTML=`<div><h3>${isAndroid()?'Download Goalora for Android':'Install Goalora'}</h3><p>${isAndroid()?'Tap the button to download the real Goalora APK directly.':'Install Goalora from your browser as an app.'}</p><div class="install-help" id="installHelp"><strong>${isAndroid()?'Android:':'Browser:'}</strong> ${isAndroid()?'The APK download will start immediately. Open the downloaded file and tap Install.':'Use your browser’s Install/Add to Home Screen option.'}</div></div><div class="install-actions"><button class="primary" id="installHeroBtn">⇩ ${isAndroid()?'Download Goalora APK':'Install Goalora'}</button><button class="secondary" id="installDismiss">Not now</button></div>`;
    const content=document.getElementById('content'); if(content) content.prepend(tip);
    document.getElementById('installHeroBtn').addEventListener('click',install);
    document.getElementById('installDismiss').addEventListener('click',()=>tip.remove());
  }
  function showManualHelp(){
    const help=document.getElementById('installHelp');if(!help)return;
    const isIOS=/iPhone|iPad|iPod/i.test(navigator.userAgent);
    help.innerHTML=isIOS
      ? '<strong>iPhone/iPad:</strong> this APK is Android-only. Use Safari → Add to Home Screen for the web app.'
      : '<strong>Browser:</strong> use the browser menu → Install app / Add to Home screen.';
  }
  window.goaloraInstall={install,showTip,apkUrl:APK_URL,releaseUrl:FALLBACK_RELEASE};
  window.addEventListener('load',()=>{
    const btn=document.getElementById('installBtn');
    if(btn) btn.addEventListener('click',install);
    if(!isStandalone())setTimeout(showTip,900);
  });
})();
