(() => {
  let ctx = null, master = null, ambience = null, enabled = true;
  const $ = id => document.getElementById(id);
  function initAudio(){
    if(ctx){ if(ctx.state==='suspended') ctx.resume(); return; }
    ctx = new (window.AudioContext || window.webkitAudioContext)();
    master = ctx.createGain(); master.gain.value = .055; master.connect(ctx.destination);
    const osc = ctx.createOscillator(), filter = ctx.createBiquadFilter();
    osc.type='sine'; osc.frequency.value=54; filter.type='lowpass'; filter.frequency.value=180;
    osc.connect(filter); filter.connect(master); osc.start(); ambience=osc;
  }
  function tone(freq,dur=.12,type='sine',gain=.06){
    if(!enabled || !ctx) return;
    const o=ctx.createOscillator(), g=ctx.createGain(); o.type=type; o.frequency.value=freq;
    g.gain.setValueAtTime(gain,ctx.currentTime); g.gain.exponentialRampToValueAtTime(.001,ctx.currentTime+dur);
    o.connect(g);g.connect(master);o.start();o.stop(ctx.currentTime+dur);
  }
  function heartbeat(){
    if(!enabled||!ctx)return;
    tone(72,.12,'sine',.11); setTimeout(()=>tone(58,.16,'sine',.08),150);
  }
  const start=$('startBtn'), sound=$('soundBtn'), choices=$('choices');
  if(start) start.addEventListener('click',()=>{initAudio(); tone(220,.35,'triangle',.12); setTimeout(()=>tone(330,.5,'sine',.07),180); heartbeat();});
  if(sound) sound.addEventListener('click',()=>{enabled=!enabled; sound.textContent=enabled?'🔊':'🔇'; if(enabled){initAudio();tone(440,.12,'sine',.08);}});
  if(choices) choices.addEventListener('click',e=>{if(e.target.closest('.choice')){initAudio();tone(150,.08,'square',.035);setTimeout(heartbeat,90);}});
  setInterval(()=>{ if(document.hidden || !enabled) return; heartbeat(); }, 5200);
})();
