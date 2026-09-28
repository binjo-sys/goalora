const $=s=>document.querySelector(s), $$=s=>[...document.querySelectorAll(s)];
const toast=m=>{const t=$('#toast');t.textContent=m;t.classList.add('show');clearTimeout(window.__toast);window.__toast=setTimeout(()=>t.classList.remove('show'),2200)};
let beforeState=null, beforeMode=false, mode='photo', photoImg=null, photoState={brightness:100,contrast:100,saturation:100,blur:0,filter:'none',mood:'none',text:'',rotation:0,flip:false,sticker:'none',aspect:'original',textX:.5,textY:.12,stickerX:.5,stickerY:.82}, history=[],future=[],drawHistory=[];
const canvas=$('#photoCanvas'),ctx=canvas.getContext('2d');
function showMode(m){mode=m;$('.mode.active')?.classList.remove('active');$('[data-mode="'+m+'"]').classList.add('active');$('#photoWorkspace').classList.toggle('hidden',m!=='photo');$('#videoWorkspace').classList.toggle('hidden',m!=='video')}
$$('.mode').forEach(b=>b.onclick=()=>showMode(b.dataset.mode));
$('#themeBtn').onclick=()=>{document.body.classList.toggle('light');toast('Appearance changed')};
function snapshot(){if(!photoImg)return;history.push(JSON.stringify(photoState));if(history.length>25)history.shift();future=[]}
function renderPhoto(){if(!photoImg)return; const saved=photoState; if(beforeMode)photoState={...photoState,brightness:100,contrast:100,saturation:100,blur:0,filter:'none',mood:'none',text:'',sticker:'none'};$('#canvasWrap').dataset.ratio=photoState.aspect;canvas.width=photoImg.naturalWidth;canvas.height=photoImg.naturalHeight;ctx.save();ctx.filter='brightness('+photoState.brightness+'%) contrast('+photoState.contrast+'%) saturate('+photoState.saturation+'%) blur('+photoState.blur+'px) '+photoState.filter;ctx.translate(canvas.width/2,canvas.height/2);ctx.rotate(photoState.rotation*Math.PI/180);ctx.scale(photoState.flip?-1:1,1);ctx.drawImage(photoImg,-photoImg.naturalWidth/2,-photoImg.naturalHeight/2);ctx.restore();if(photoState.mood!=='none'){ctx.save();ctx.globalCompositeOperation='multiply';ctx.fillStyle=photoState.mood==='warm'?'rgba(255,160,80,.16)':photoState.mood==='cool'?'rgba(70,130,255,.15)':'rgba(110,70,160,.14)';ctx.fillRect(0,0,canvas.width,canvas.height);ctx.restore()}if(photoState.sticker!=='none'){ctx.save();ctx.font=Math.max(34,canvas.width*.07)+'px sans-serif';ctx.textAlign='center';ctx.fillText(photoState.sticker,canvas.width*photoState.stickerX,canvas.height*photoState.stickerY);ctx.restore()}if(photoState.text){ctx.save();ctx.fillStyle='#fff';ctx.textAlign='center';ctx.font=Math.max(24,canvas.width*.045)+'px Space Grotesk, sans-serif';ctx.shadowColor='#000';ctx.shadowBlur=12;ctx.fillText(photoState.text,canvas.width*photoState.textX,canvas.height*photoState.textY);ctx.restore()}canvas.style.display='block';$('#photoDrop').style.display='none';photoState=saved}
function loadPhoto(file){if(!file?.type.startsWith('image/'))return toast('Choose an image file');const url=URL.createObjectURL(file);const im=new Image();im.onload=()=>{photoImg=im;photoState={brightness:100,contrast:100,saturation:100,blur:0,filter:'none',mood:'none',text:'',rotation:0,flip:false,sticker:'none'};history=[];future=[];renderPhoto();toast('Photo loaded')};im.src=url}
$('#choosePhoto').onclick=$('#photoUploadBtn').onclick=()=>$('#photoInput').click();$('#photoInput').onchange=e=>loadPhoto(e.target.files[0]);
$('#canvasWrap').ondragover=e=>{e.preventDefault()};$('#canvasWrap').ondrop=e=>{e.preventDefault();loadPhoto(e.dataTransfer.files[0])};
const tools={adjust:()=>'<div class="control"><label>Brightness <output id="brightOut">100</output></label><input id="brightness" type="range" min="40" max="180" value="'+photoState.brightness+'"></div><div class="control"><label>Contrast <output id="contrastOut">100</output></label><input id="contrast" type="range" min="40" max="180" value="'+photoState.contrast+'"></div><div class="control"><label>Saturation <output id="satOut">100</output></label><input id="saturation" type="range" min="0" max="200" value="'+photoState.saturation+'"></div><div class="control"><label>Soft blur <output id="blurOut">0</output></label><input id="blur" type="range" min="0" max="8" step=".5" value="'+photoState.blur+'"></div>',
filter:()=>'<p class="hint">Give your image a different character with one tap.</p><div class="filter-grid">'+[['none','Original'],['grayscale(1)','B&W'],['sepia(1)','Vintage'],['contrast(1.25) saturate(.75)','Cinematic'],['saturate(1.8)','Pop'],['hue-rotate(25deg) saturate(1.4)','Dream']].map(x=>'<button class="choice '+(photoState.filter===x[0]?'active':'')+'" data-filter="'+x[0]+'">'+x[1]+'</button>').join('')+'</div>',
text:()=>'<div class="control"><label>Headline</label><input class="text-input" id="overlayText" maxlength="36" placeholder="Type something..." value="'+photoState.text.replace(/"/g,'&quot;')+'"></div><p class="hint">Your text appears as a clean editorial overlay. Use it for stories, posters and mood cards.</p>',
draw:()=>'<button class="choice" id="rotateLeft">↺ Rotate</button> <button class="choice" id="rotateRight">↻ Rotate</button><button class="choice" id="flipPhoto">⇋ Flip</button><p class="hint">Drawing mode turns the canvas into your sketchbook. Choose a color and draw directly on the image.</p><div class="control"><label>Brush size <output id="brushOut">8</output></label><input id="brush" type="range" min="2" max="35" value="8"></div><button class="choice" id="drawToggle">Start drawing</button>',
mood:()=>'<p class="hint">Mood is a subtle color treatment designed for stories.</p><div class="filter-grid"><button class="choice" data-sticker="✨">✨ Spark</button><button class="choice" data-sticker="❤️">❤️ Love</button><button class="choice" data-sticker="☀️">☀️ Sunny</button><button class="choice" data-sticker="👀">👀 Eyes</button><button class="choice" data-sticker="😂">😂 LOL</button><button class="choice" data-sticker="🔥">🔥 Fire</button><button class="choice" data-sticker="★">★ Star</button><button class="choice" data-sticker="♥">♥ Heart</button></div><div class="mood-grid">'+[['none','Clean'],['warm','Golden'],['cool','Midnight'],['dream','Dream']].map(x=>'<button class="choice '+(photoState.mood===x[0]?'active':'')+'" data-mood="'+x[0]+'">'+x[1]+'</button>').join('')+'</div>',
remix:()=>'<p class="hint">Remix gives your photo an instant creative direction.</p><div class="filter-grid"><button class="choice" data-remix="magazine">Magazine</button><button class="choice" data-remix="poster">Poster</button><button class="choice" data-remix="noir">Noir</button><button class="choice" data-remix="neon">Neon</button></div><div class="section-title">Magic Edit</div><div class="magic-grid"><button class="choice" data-magic="auto">✦ Auto Enhance</button><button class="choice" data-magic="night">Night Fix</button><button class="choice" data-magic="cinematic">Cinematic</button><button class="choice" data-magic="moody">Moody</button><button class="choice" data-magic="bright">Bright</button><button class="choice" data-magic="pop">Color Pop</button><button class="choice" data-magic="dream">Dream</button><button class="choice" data-magic="portrait">Portrait Glow</button></div><button class="choice magic-surprise" id="magicSurprise">↯ Surprise Me</button><div class="section-title">Canvas ratio</div><div class="ratio-grid"><button class="choice" data-ratio="original">Original</button><button class="choice" data-ratio="1:1">1 : 1</button><button class="choice" data-ratio="4:5">4 : 5</button><button class="choice" data-ratio="9:16">9 : 16</button><button class="choice" data-ratio="16:9">16 : 9</button></div>'};
function panelTool(name){const title=name[0].toUpperCase()+name.slice(1);$('#toolTitle').textContent=title;$('#toolContent').innerHTML=tools[name]();bindTool(name)}
function bindTool(name){if(name==='text'){if(!$('#textX'))$('#toolContent').insertAdjacentHTML('beforeend','<div class="control"><label>Position <output id="textPosOut">12%</output></label><input id="textX" type="range" min="5" max="95" value="50"><input id="textY" type="range" min="5" max="95" value="12"></div>');$('#textX').value=photoState.textX*100;$('#textY').value=photoState.textY*100;$('#textX').oninput=e=>{photoState.textX=+e.target.value/100;renderPhoto()};$('#textY').oninput=e=>{photoState.textY=+e.target.value/100;$('#textPosOut').textContent=e.target.value+'%';renderPhoto()};}if(name==='text'){const inp=$('#overlayText');inp.oninput=e=>{photoState.text=e.target.value;renderPhoto()};}if(name==='remix'){$('[data-magic]').forEach(b=>b.onclick=()=>{snapshot();const r={auto:[108,106,108,'none','none','Auto Enhance'],night:[125,118,92,'contrast(1.05) saturate(.88)','cool','Night Fix'],cinematic:[102,122,82,'contrast(1.12) saturate(.78)','none','Cinematic'],moody:[92,126,82,'contrast(1.08) saturate(.82)','dream','Moody'],bright:[122,104,112,'none','warm','Bright'],pop:[106,112,148,'saturate(1.12)','none','Color Pop'],dream:[108,96,118,'hue-rotate(12deg) saturate(1.08)','dream','Dream'],portrait:[112,104,106,'contrast(.98) saturate(1.04)','warm','Portrait Glow']}[b.dataset.magic];[photoState.brightness,photoState.contrast,photoState.saturation,photoState.filter,photoState.mood]=r.slice(0,5);renderPhoto();toast(r[5]+' applied')});$('#magicSurprise').onclick=()=>{$('[data-magic]')[Math.floor(Math.random()*$('[data-magic]').length)].click()};$('[data-ratio]').forEach(b=>b.onclick=()=>{snapshot();photoState.aspect=b.dataset.ratio;renderPhoto();panelTool('remix');toast('Ratio set to '+b.dataset.ratio)})}if(name==='adjust'){$$('#toolContent input').forEach(i=>i.oninput=()=>{snapshot();photoState.brightness=+$('#brightness').value;photoState.contrast=+$('#contrast').value;photoState.saturation=+$('#saturation').value;photoState.blur=+$('#blur').value;$('#brightOut').textContent=photoState.brightness;$('#contrastOut').textContent=photoState.contrast;$('#satOut').textContent=photoState.saturation;$('#blurOut').textContent=photoState.blur;renderPhoto()})}
if(name==='filter')$$('[data-filter]').forEach(b=>b.onclick=()=>{snapshot();photoState.filter=b.dataset.filter;panelTool('filter');renderPhoto()});

if(name==='mood'){$('[data-sticker]').forEach(b=>b.onclick=()=>{photoState.sticker=b.dataset.sticker;renderPhoto()});}if(name==='mood'){if(!$('#stickerX'))$('#toolContent').insertAdjacentHTML('beforeend','<div class="control"><label>Sticker position <output id="stickerPosOut">82%</output></label><input id="stickerX" type="range" min="5" max="95" value="50"><input id="stickerY" type="range" min="5" max="95" value="82"></div>');$('#stickerX').value=photoState.stickerX*100;$('#stickerY').value=photoState.stickerY*100;$('#stickerX').oninput=e=>{photoState.stickerX=+e.target.value/100;renderPhoto()};$('#stickerY').oninput=e=>{photoState.stickerY=+e.target.value/100;$('#stickerPosOut').textContent=e.target.value+'%';renderPhoto()};}$('[data-mood]').forEach(b=>b.onclick=()=>{snapshot();photoState.mood=b.dataset.mood;panelTool('mood');renderPhoto()});
if(name==='remix')$$('[data-remix]').forEach(b=>b.onclick=()=>{snapshot();const r=b.dataset.remix;if(r==='magazine'){photoState.filter='contrast(1.12) saturate(.8)';photoState.text='THE MOMENT'}if(r==='poster'){photoState.filter='contrast(1.3) saturate(1.5)';photoState.text='MAKE IT MATTER'}if(r==='noir'){photoState.filter='grayscale(1) contrast(1.35)';photoState.text='AFTER DARK'}if(r==='neon'){photoState.filter='saturate(2) hue-rotate(35deg)';photoState.text='NIGHT ENERGY'}renderPhoto();toast('Remix applied')});
if(name==='draw'){if($('#drawToggle'))$('#drawToggle').onclick=()=>startDrawing(+$('#brush').value);$('#rotateLeft').onclick=()=>{snapshot();photoState.rotation=(photoState.rotation+270)%360;renderPhoto()};$('#rotateRight').onclick=()=>{snapshot();photoState.rotation=(photoState.rotation+90)%360;renderPhoto()};$('#flipPhoto').onclick=()=>{snapshot();photoState.flip=!photoState.flip;renderPhoto()}}}
$$('.tool').filter(b=>b.dataset.tool).forEach(b=>b.onclick=()=>{$$('.tool').filter(x=>x.dataset.tool).forEach(x=>x.classList.remove('active'));b.classList.add('active');panelTool(b.dataset.tool)});
$('#undoBtn').onclick=()=>{if(!history.length)return toast('Nothing to undo');future.push(JSON.stringify(photoState));photoState=JSON.parse(history.pop());renderPhoto()};
$('#redoBtn').onclick=()=>{if(!future.length)return toast('Nothing to redo');history.push(JSON.stringify(photoState));photoState=JSON.parse(future.pop());renderPhoto()};
$('#resetBtn').onclick=()=>{if(!photoImg)return;photoState={brightness:100,contrast:100,saturation:100,blur:0,filter:'none',mood:'none',text:'',rotation:0,flip:false,sticker:'none'};history=[];future=[];renderPhoto();toast('Photo reset')};
const beforeBtn=document.createElement('button');beforeBtn.className='secondary';beforeBtn.id='beforeAfterBtn';beforeBtn.textContent='◐ Before';$('#downloadPhoto').before(beforeBtn);beforeBtn.onclick=()=>{beforeMode=!beforeMode;beforeBtn.textContent=beforeMode?'◉ Original':'◐ Before';renderPhoto();toast(beforeMode?'Showing original':'Showing edits')};
$('#downloadPhoto').onclick=()=>{if(!photoImg)return toast('Add a photo first');const a=document.createElement('a');a.download='nexa-studio-'+Date.now()+'.png';a.href=canvas.toDataURL('image/png');a.click();toast('Photo exported')};
function startDrawing(size){if(!photoImg)return toast('Add a photo first');canvas.dataset.drawing='1';canvas.onpointerdown=e=>{if(canvas.dataset.drawing!=='1')return;const p=point(e);ctx.beginPath();ctx.moveTo(p.x,p.y);canvas.setPointerCapture?.(e.pointerId)};canvas.onpointermove=e=>{if(canvas.dataset.drawing!=='1'||!e.buttons)return;const p=point(e);ctx.lineTo(p.x,p.y);ctx.strokeStyle='#b8ff55';ctx.lineWidth=size;ctx.lineCap='round';ctx.stroke()};canvas.onpointerup=()=>{};toast('Drawing mode on — drag across the canvas')};function point(e){const r=canvas.getBoundingClientRect();return{x:(e.clientX-r.left)*canvas.width/r.width,y:(e.clientY-r.top)*canvas.height/r.height}}
panelTool('adjust');

let videoUrl='',videoReady=false;const video=$('#video');
function loadVideo(file){if(!file?.type.startsWith('video/'))return toast('Choose a video file');videoUrl=URL.createObjectURL(file);video.src=videoUrl;video.style.display='block';$('#videoDrop').style.display='none';videoReady=true;video.onloadedmetadata=()=>{$('#duration').textContent=fmt(video.duration);$('#endTime').value=video.duration.toFixed(1);$('#scrubber').max=video.duration;$('#endTime').max=video.duration;toast('Video loaded')}}
$('#chooseVideo').onclick=$('#videoUploadBtn').onclick=()=>$('#videoInput').click();$('#videoInput').onchange=e=>loadVideo(e.target.files[0]);
$('#playBtn').onclick=()=>{if(!videoReady)return toast('Add a video first');video.paused?video.play():video.pause();};video.ontimeupdate=()=>{$('#currentTime').textContent=fmt(video.currentTime);$('#scrubber').value=video.currentTime;if(+$('#endTime').value&&video.currentTime>=+$('#endTime').value)video.pause()};$('#scrubber').oninput=e=>video.currentTime=+e.target.value;
$('#startTime').onchange=e=>{if(videoReady)video.currentTime=Math.max(0,Math.min(+e.target.value,video.duration))};$('#endTime').onchange=e=>{if(videoReady)e.target.value=Math.min(video.duration,Math.max(+$('#startTime').value+.1,+e.target.value))};
function fmt(s){s=Math.max(0,s||0);return String(Math.floor(s/60)).padStart(2,'0')+':'+String(Math.floor(s%60)).padStart(2,'0')}
const vtools={trim:()=>'<p class="hint">Set the start and end points below, then preview your selection.</p>',speed:()=>'<div class="control"><label>Playback speed <output id="speedOut">1×</output></label><input id="speed" type="range" min=".25" max="2" step=".25" value="1"></div><p class="hint">Speed changes apply to preview. Export records the selected clip at the chosen speed.</p>',filter:()=>'<div class="filter-grid">'+[['none','Original'],['grayscale(1)','B&W'],['sepia(1)','Vintage'],['contrast(1.25) saturate(.7)','Film'],['saturate(1.7)','Pop'],['hue-rotate(25deg)','Dream']].map(x=>'<button class="choice" data-vfilter="'+x[0]+'">'+x[1]+'</button>').join('')+'</div>',text:()=>'<div class="control"><label>Video title</label><input class="text-input" id="videoOverlayInput" maxlength="36" placeholder="Your words..."></div>',audio:()=>'<p class="hint">Add your own soundtrack locally. Browser export support for audio tracks varies by device.</p><input id="audioInput" type="file" accept="audio/*">'};
function vpanelTool(name){$('#vtoolTitle').textContent=name[0].toUpperCase()+name.slice(1);$('#vtoolContent').innerHTML=vtools[name]();if(name==='speed')$('#speed').oninput=e=>{video.playbackRate=+e.target.value;$('#speedOut').textContent=e.target.value+'×'};if(name==='text')$('#videoOverlayInput').oninput=e=>$('#videoText').textContent=e.target.value;if(name==='filter')$$('[data-vfilter]').forEach(b=>b.onclick=()=>{video.style.filter=b.dataset.vfilter})}
$$('.tool').filter(b=>b.dataset.vtool).forEach(b=>b.onclick=()=>{$$('.tool').filter(x=>x.dataset.vtool).forEach(x=>x.classList.remove('active'));b.classList.add('active');vpanelTool(b.dataset.vtool)});vpanelTool('trim');
$('#exportVideo').onclick=async()=>{if(!videoReady)return toast('Add a video first');const start=+$('#startTime').value,end=+$('#endTime').value||video.duration;if(end<=start)return toast('End time must be after start');video.currentTime=start;const stream=video.captureStream?.();if(!stream||!MediaRecorder)return toast('Video export is not supported by this browser');const chunks=[];const rec=new MediaRecorder(stream,{mimeType:'video/webm'});rec.ondataavailable=e=>e.data.size&&chunks.push(e.data);rec.onstop=()=>{const blob=new Blob(chunks,{type:'video/webm'}),a=document.createElement('a');a.href=URL.createObjectURL(blob);a.download='nexa-studio-clip.webm';a.click();toast('Video exported')};video.muted=false;rec.start();video.play();const stop=()=>{if(video.currentTime>=end){video.pause();rec.stop();video.removeEventListener('timeupdate',stop)}};video.addEventListener('timeupdate',stop);};

let cameraStream=null,cameraFacing='environment',recording=null,recordChunks=[];const cameraModal=$('#cameraModal'),cameraPreview=$('#cameraPreview');async function openCamera(){cameraModal.classList.remove('hidden');$('#cameraStatus').textContent='Requesting camera…';try{await startCamera()}catch(e){$('#cameraStatus').textContent='Camera permission unavailable.';toast('Camera could not be opened')}}async function startCamera(){if(cameraStream)cameraStream.getTracks().forEach(t=>t.stop());cameraStream=await navigator.mediaDevices.getUserMedia({video:{facingMode:cameraFacing,width:{ideal:1920},height:{ideal:1080}},audio:true});cameraPreview.srcObject=cameraStream;$('#cameraStatus').textContent=cameraFacing==='environment'?'Rear camera':'Front camera'}function closeCamera(){if(recording)stopRecording();if(cameraStream)cameraStream.getTracks().forEach(t=>t.stop());cameraStream=null;cameraPreview.srcObject=null;cameraModal.classList.add('hidden')}$('#captureLaunch').onclick=openCamera;$('#closeCamera').onclick=closeCamera;$('#cameraFlip').onclick=async()=>{cameraFacing=cameraFacing==='environment'?'user':'environment';try{await startCamera()}catch(e){toast('Camera switch unavailable')}};$('#cameraShutter').onclick=()=>{if(!cameraStream)return;const c=document.createElement('canvas');c.width=cameraPreview.videoWidth;c.height=cameraPreview.videoHeight;c.getContext('2d').drawImage(cameraPreview,0,0,c.width,c.height);c.toBlob(blob=>{if(blob){loadPhoto(new File([blob],'nexa-capture.jpg',{type:'image/jpeg'}));closeCamera();showMode('photo');toast('Captured — ready to edit')}},'image/jpeg',.94)};$('#cameraRecord').onclick=()=>{if(recording){stopRecording();return}if(!window.MediaRecorder||!cameraStream)return toast('Video recording is not supported here');recordChunks=[];recording=new MediaRecorder(cameraStream,{mimeType:'video/webm'});recording.ondataavailable=e=>e.data.size&&recordChunks.push(e.data);recording.onstop=()=>{const blob=new Blob(recordChunks,{type:'video/webm'});loadVideo(new File([blob],'nexa-capture.webm',{type:'video/webm'}));closeCamera();showMode('video');toast('Video captured — ready to edit');recording=null;$('#cameraRecord').textContent='●'};recording.start();$('#cameraRecord').textContent='■';$('#cameraStatus').textContent='Recording…'};function stopRecording(){if(recording&&recording.state!=='inactive')recording.stop()}
/* STORY STUDIO */
let storyItems=[],storyIndex=0,storyTimer=3;
const storyView=$('#storiesView'),profileView=$('#profileView'),chatView=$('#chatView'),discoverView=$('#discoverView'),editorViews=[$('#photoWorkspace'),$('#videoWorkspace')];
function setView(v){$('.nav-item').forEach(x=>x.classList.toggle('active',x.dataset.view===v));storyView.classList.toggle('hidden',v!=='stories');profileView?.classList.toggle('hidden',v!=='profile');chatView?.classList.toggle('hidden',v!=='chat');discoverView?.classList.toggle('hidden',v!=='discover');editorViews.forEach(x=>x.classList.toggle('hidden',v!=='editor'));}
$('.nav-item').forEach(b=>b.onclick=()=>setView(b.dataset.view));
$('#storyAdd').onclick=()=>$('#storyInput').click();
$('#storyInput').onchange=e=>{const files=[...e.target.files].filter(f=>f.type.startsWith('image/')).slice(0,8);if(!files.length)return;storyItems=[];storyIndex=0;files.forEach(f=>{const u=URL.createObjectURL(f);const im=new Image();im.onload=()=>{storyItems.push(im);if(storyItems.length===files.length)renderStory()};im.src=u});toast(files.length+' moments added')};
function renderStory(){
 if(!storyItems.length)return;
 const p=$('#storyPreview');p.innerHTML='<img class="story-slide" id="storySlide"><div class="story-thumbs">'+storyItems.map((im,i)=>'<img class="story-thumb '+(i===storyIndex?'active':'')+'" data-si="'+i+'" src="'+im.src+'">').join('')+'</div>';
 const im=storyItems[storyIndex];$('#storySlide').src=im.src;$$('.story-thumb').forEach(t=>t.onclick=()=>{storyIndex=+t.dataset.si;renderStory()});
}
$('#storyPrev').onclick=()=>{if(!storyItems.length)return;storyIndex=(storyIndex-1+storyItems.length)%storyItems.length;renderStory()};
$('#storyNext').onclick=()=>{if(!storyItems.length)return;storyIndex=(storyIndex+1)%storyItems.length;renderStory()};
$('#storyDuration').oninput=e=>$('#storyDurationOut').textContent=e.target.value+'s';
$('#storyExport').onclick=()=>{
 if(!storyItems.length)return toast('Add some moments first');
 const title=$('#storyTitle').value.trim();
 storyItems.forEach((im,i)=>{const c=document.createElement('canvas'),w=1080,h=1920;c.width=w;c.height=h;const x=c.getContext('2d');x.fillStyle='#090a0f';x.fillRect(0,0,w,h);const scale=Math.min((w-80)/im.naturalWidth,(h-260)/im.naturalHeight);const dw=im.naturalWidth*scale,dh=im.naturalHeight*scale;x.drawImage(im,(w-dw)/2,100+(h-300-dh)/2,dw,dh);if(title){x.fillStyle='#fff';x.font='700 52px sans-serif';x.textAlign='center';x.fillText(title,w/2,1820)}x.fillStyle='#b8ff55';x.font='700 22px sans-serif';x.fillText('✦ NEXA STUDIO  '+(i+1)+'/'+storyItems.length,w/2,1875);c.toBlob(b=>{const a=document.createElement('a');a.href=URL.createObjectURL(b);a.download='nexa-story-'+String(i+1).padStart(2,'0')+'.png';a.click()},'image/png')});toast('Story exported as '+storyItems.length+' images')};

/* NEXA SOCIAL CHAT */
const chatPeople=[{id:'amani',name:'Amani',letter:'A',status:'active now',preview:'That edit is fire 🔥',time:'now'},{id:'melissa',name:'Melissa',letter:'M',status:'active 12m ago',preview:'See you tomorrow 🫶',time:'12m'},{id:'kevin',name:'Kevin',letter:'K',status:'active 1h ago',preview:'Sent a photo',time:'1h'},{id:'lisa',name:'Lisa',letter:'L',status:'active 3h ago',preview:'Voice note · 0:18',time:'3h'}];
let activeChat='amani',chatData=JSON.parse(localStorage.getItem('nexaChats')||'{}');
function chatMessages(){return chatData[activeChat]||[{from:'them',text:'Welcome to NEXA 👋'},{from:'them',text:'Send me something.'}]}
function saveChats(){localStorage.setItem('nexaChats',JSON.stringify(chatData))}
function renderThreads(filter=''){const box=$('#chatThreads');if(!box)return;box.innerHTML=chatPeople.filter(p=>p.name.toLowerCase().includes(filter.toLowerCase())).map(p=>'<button class="chat-thread '+(p.id===activeChat?'active':'')+'" data-chat="'+p.id+'"><span class="thread-avatar">'+p.letter+'</span><span class="thread-copy"><b>'+p.name+'</b><small>'+p.preview+'</small></span><time>'+p.time+'</time></button>').join('');$$('.chat-thread').forEach(b=>b.onclick=()=>openChat(b.dataset.chat))}
function openChat(id){activeChat=id;const p=chatPeople.find(x=>x.id===id);$('#chatName').textContent=p.name;$('#chatStatus').textContent='● '+p.status;$('.chat-avatar').textContent=p.letter;renderThreads($('#chatSearch')?.value||'');renderMessages();if(window.innerWidth<800)document.querySelector('.chat-list')?.classList.add('mobile-hidden')}
function renderMessages(){const box=$('#chatMessages');if(!box)return;box.innerHTML=chatMessages().map(m=>'<div class="bubble-row '+m.from+'"><div class="bubble">'+m.text+'</div></div>').join('');box.scrollTop=box.scrollHeight}
function sendChat(){const input=$('#chatInput'),text=input.value.trim();if(!text)return;chatData[activeChat]=[...chatMessages(),{from:'me',text}];saveChats();input.value='';renderMessages();setTimeout(()=>{chatData[activeChat]=[...chatMessages(),{from:'them',text:'Seen ✓'}];saveChats();renderMessages()},700)}
$('#sendChat')?.addEventListener('click',sendChat);$('#chatInput')?.addEventListener('keydown',e=>{if(e.key==='Enter')sendChat()});$('#chatSearch')?.addEventListener('input',e=>renderThreads(e.target.value));$('#newChatBtn')?.addEventListener('click',()=>toast('New chat — choose someone from your contacts'));$('#attachChat')?.addEventListener('click',()=>toast('Media picker ready for the next connection layer'));$('#voiceCall')?.addEventListener('click',()=>toast('Voice calling UI ready'));$('#videoCall')?.addEventListener('click',()=>toast('Video calling UI ready'));$('#chatBack')?.addEventListener('click',()=>document.querySelector('.chat-list')?.classList.remove('mobile-hidden'));renderThreads();renderMessages();

/* NEXA PROFILE + SOCIAL POLISH */
const profileName=$('#profileName');
const savedProfile=localStorage.getItem('nexaProfileName');
if(savedProfile&&profileName)profileName.textContent=savedProfile;
$('#editProfileBtn')?.addEventListener('click',()=>{const current=profileName?.textContent||'Nexa Creator';const name=prompt('Your NEXA display name',current);if(name?.trim()){profileName.textContent=name.trim();localStorage.setItem('nexaProfileName',name.trim());toast('Profile updated')}});

function updateSnapScore(){const score=Object.values(chatData||{}).reduce((n,a)=>n+a.filter(x=>x.from==='me').length,0);const el=$('#snapScore');if(el)el.textContent=score}
updateSnapScore();

/* NEXA CAMERA EXPERIENCE */
let cameraLens='none',cameraFlash=false;
const lensStrip=$('#lensStrip'),cameraPreview=$('#cameraPreview');
function applyCameraLens(){if(!cameraPreview)return;const map={none:'none',mono:'grayscale(1) contrast(1.08)',warm:'sepia(.18) saturate(1.15) contrast(1.04)',cool:'hue-rotate(18deg) saturate(.92)',vivid:'saturate(1.45) contrast(1.08)'};cameraPreview.style.filter=map[cameraLens]||'none'}
$('#cameraLens')?.addEventListener('click',()=>{lensStrip?.classList.toggle('open')});
lensStrip?.querySelectorAll('[data-lens]').forEach(b=>b.addEventListener('click',()=>{cameraLens=b.dataset.lens;lensStrip.querySelectorAll('button').forEach(x=>x.classList.remove('active'));b.classList.add('active');applyCameraLens();lensStrip.classList.remove('open');toast(b.textContent+' lens')}));
$('#cameraFlash')?.addEventListener('click',()=>{cameraFlash=!cameraFlash;$('#cameraFlash').classList.toggle('active',cameraFlash);toast(cameraFlash?'Flash enabled':'Flash off')});
const oldShutter=$('#cameraShutter');
oldShutter?.addEventListener('click',async()=>{if(!cameraPreview?.srcObject)return;const track=cameraPreview.srcObject.getVideoTracks()[0];const settings=track?.getSettings?.()||{};const w=settings.width||1280,h=settings.height||720;const c=document.createElement('canvas');c.width=w;c.height=h;const x=c.getContext('2d');if(cameraFlash){document.body.classList.add('camera-flash');setTimeout(()=>document.body.classList.remove('camera-flash'),100)}x.translate(c.width,0);x.scale(-1,1);x.filter=getComputedStyle(cameraPreview).filter;x.drawImage(cameraPreview,0,0,c.width,c.height);c.toBlob(blob=>{if(!blob)return;loadPhoto(new File([blob],'nexa-snap.jpg',{type:'image/jpeg'}));closeCamera();setView('editor');toast('Snap captured')},'image/jpeg',.94)});

/* NEXA SNAP COMPOSER */
let snapBlobUrl=null,snapDuration=3;
function openSnapComposer(file){const modal=$('#snapComposer'),img=$('#snapImage');if(!modal||!img)return;snapBlobUrl=URL.createObjectURL(file);img.src=snapBlobUrl;$('#snapCaption').value='';modal.classList.remove('hidden')}
function closeSnapComposer(){const m=$('#snapComposer');if(m)m.classList.add('hidden');if(snapBlobUrl){URL.revokeObjectURL(snapBlobUrl);snapBlobUrl=null}}
$('#snapClose')?.addEventListener('click',closeSnapComposer);
$('#snapComposer')?.addEventListener('click',e=>{if(e.target.id==='snapComposer')closeSnapComposer()});
$('#snapComposer')?.querySelectorAll('[data-snap-time]').forEach(b=>b.addEventListener('click',()=>{snapDuration=b.dataset.snapTime;$('#snapComposer').querySelectorAll('[data-snap-time]').forEach(x=>x.classList.remove('active'));b.classList.add('active')}));
$('#snapSave')?.addEventListener('click',()=>{if(!snapBlobUrl)return;const a=document.createElement('a');a.href=snapBlobUrl;a.download='nexa-snap.jpg';a.click();toast('Snap saved')});
$('#snapStory')?.addEventListener('click',()=>{localStorage.setItem('nexaLatestStory',JSON.stringify({src:snapBlobUrl,caption:$('#snapCaption').value.trim(),created:Date.now(),expires:Date.now()+86400000}));closeSnapComposer();setView('stories');toast('Added to Story')});
$('#snapSend')?.addEventListener('click',()=>{const caption=$('#snapCaption').value.trim();chatData[activeChat]=[...chatMessages(),{from:'me',text:caption||'📸 Snap',snap:true,duration:snapDuration,created:Date.now()}];saveChats();updateSnapScore();closeSnapComposer();setView('chat');renderMessages();toast('Snap sent to '+chatPeople.find(p=>p.id===activeChat)?.name)});

const originalLoadPhoto=loadPhoto;
loadPhoto=function(file){originalLoadPhoto(file);if(file&&file.name==='nexa-snap.jpg'){setTimeout(()=>{openSnapComposer(file)},80)}};

/* NEXA CAMERA-FIRST SHELL */
let homeStream=null,homeLens='none',homePanel=null;
const homeVideo=$('#homeCameraPreview');
async function startHomeCamera(){if(!homeVideo||homeStream)return;try{homeStream=await navigator.mediaDevices.getUserMedia({video:{facingMode:'user'},audio:false});homeVideo.srcObject=homeStream}catch(e){toast('Camera permission needed')}}
function setHomeLens(l){homeLens=l;const map={none:'none',mono:'grayscale(1)',warm:'sepia(.2) saturate(1.15)',vivid:'saturate(1.5) contrast(1.08)'};homeVideo.style.filter=map[l]||'none';$('#homeLensLabel').textContent='NEXA · '+l.toUpperCase();$$('.lens-pill').forEach(b=>b.classList.toggle('active',b.dataset.homeLens===l))}
$$('.lens-pill').forEach(b=>b.addEventListener('click',()=>setHomeLens(b.dataset.homeLens)));
$('#homeFlip')?.addEventListener('click',async()=>{if(!homeStream)return;homeStream.getTracks().forEach(t=>t.stop());homeStream=null;const facing=homeVideo.dataset.facing==='environment'?'user':'environment';homeVideo.dataset.facing=facing;try{homeStream=await navigator.mediaDevices.getUserMedia({video:{facingMode:facing},audio:false});homeVideo.srcObject=homeStream}catch(e){toast('Camera unavailable')}});
$('#homeCapture')?.addEventListener('click',()=>{$('#captureLaunch')?.click()});
$('#homeGallery')?.addEventListener('click',()=>$('#photoInput')?.click());
$('#homeProfile')?.addEventListener('click',()=>setView('profile'));
$('#homeSettings')?.addEventListener('click',()=>toast('NEXA settings coming next'));
function openPanel(type){const p=$('#socialPanel');if(!p)return;homePanel=type;p.classList.remove('hidden-panel');$('#panelTitle').textContent=type==='chat'?'Chat':type==='discover'?'Discover':'Stories';const box=$('#panelContent');if(type==='chat'){renderThreads();box.innerHTML='<div class="panel-chat-list" id="homeThreads"></div>';const src=$('#chatThreads');if(src)$('#homeThreads').innerHTML=src.innerHTML;$$('#homeThreads .chat-thread').forEach(b=>b.addEventListener('click',()=>{setView('chat');openChat(b.dataset.chat)}))}else if(type==='stories'){box.innerHTML='<div class="panel-hero"><b>Your Stories</b><span>Share moments that disappear after 24 hours.</span><button class="primary" id="homeStoryBtn">＋ Create Story</button></div>'}else{box.innerHTML='<div class="panel-hero"><b>Discover NEXA</b><span>Creators, moments and ideas from the NEXA community.</span><div class="discover-mini-grid"><div>✦ Spotlight</div><div>◉ Creators</div><div>⌁ Trending</div></div></div>'}}
$$('.panel-back').forEach(b=>b.addEventListener('click',()=>$('#socialPanel')?.classList.add('hidden-panel')));
startHomeCamera();

/* NEXA GESTURE NAVIGATION */
(()=>{
 const shell=$('#nexaAppShell'), home=$('#cameraHome'), panel=$('#socialPanel'); if(!shell||!home||!panel)return;
 let sx=0,sy=0,st=0;
 function show(type){
   if(type==='camera'){panel.classList.add('hidden-panel');home.style.transform='translateX(0)';return}
   openPanel(type); home.style.transform=type==='chat'?'translateX(-18%)':'translateX(18%)';
 }
 shell.addEventListener('touchstart',e=>{const t=e.changedTouches[0];sx=t.clientX;sy=t.clientY;st=Date.now()},{passive:true});
 shell.addEventListener('touchend',e=>{const t=e.changedTouches[0],dx=t.clientX-sx,dy=t.clientY-sy;if(Date.now()-st>650||Math.abs(dx)<70||Math.abs(dx)<Math.abs(dy)*1.25)return;if(dx<0)show('chat');else show('discover')},{passive:true});
 let md=false,mx=0;
 shell.addEventListener('pointerdown',e=>{if(e.pointerType==='mouse'){md=true;mx=e.clientX}});
 shell.addEventListener('pointerup',e=>{if(!md)return;md=false;const dx=e.clientX-mx;if(Math.abs(dx)>110)show(dx<0?'chat':'discover')});
 document.addEventListener('keydown',e=>{if(e.key==='Escape')show('camera')});
})();

/* NEXA STORIES 2.0 */
(()=>{
 const viewer=$('#storyViewer'),img=$('#storyViewerImage'),name=$('#storyViewerName'),meta=$('#storyViewerMeta'),bar=$('.story-progress i');
 let timer=null,liked=false;
 function showStory(src,n='Your Story',m='Just now'){if(!viewer||!img)return;img.src=src;name.textContent=n;meta.textContent=m;liked=false;$('#storyReact').textContent='♡';viewer.classList.remove('hidden');bar.style.animation='none';void bar.offsetWidth;bar.style.animation='storyProgress 5s linear forwards';clearTimeout(timer);timer=setTimeout(closeStory,5000)}
 function closeStory(){viewer?.classList.add('hidden');clearTimeout(timer)}
 $('#storyViewerClose')?.addEventListener('click',closeStory);
 $('#storyReact')?.addEventListener('click',()=>{liked=!liked;$('#storyReact').textContent=liked?'♥':'♡'});
 $('#storyReply')?.addEventListener('click',()=>{closeStory();setView('chat');toast('Story reply ready')});
 $('#storyShare')?.addEventListener('click',()=>toast('Story sharing ready'));
 window.nexaShowStory=showStory;
 const latest=localStorage.getItem('nexaLatestStory');
 if(latest){try{const x=JSON.parse(latest);if(x.expires>Date.now())window.nexaLatestStory=x;else localStorage.removeItem('nexaLatestStory')}catch{}}
})();

/* NEXA STORY RAIL */
(()=>{
 const rail=$('#storyRail');
 $('#homeStories')?.addEventListener('click',()=>rail?.classList.toggle('open'));
 const colors=['linear-gradient(135deg,#b8ff55,#7c5cff)','linear-gradient(135deg,#ff7aa8,#7c5cff)','linear-gradient(135deg,#55d9ff,#b8ff55)','linear-gradient(135deg,#ffd166,#ff6b8a)'];
 $$('.story-circle').forEach((b,i)=>{b.querySelector('span').style.background=colors[i%colors.length];b.addEventListener('click',()=>{const id=b.dataset.story;const p=chatPeople.find(x=>x.id===id);const latest=window.nexaLatestStory;if(latest)nexaShowStory(latest.src,p?.name||b.textContent.trim(),'Today');else{const c=document.createElement('canvas');c.width=900;c.height=1600;const x=c.getContext('2d');x.fillStyle=['#11131a','#17122a','#0f1a18','#1a1115'][i];x.fillRect(0,0,c.width,c.height);x.fillStyle='#fff';x.font='700 58px Space Grotesk';x.fillText(p?.name||'NEXA',70,180);x.font='34px DM Sans';x.fillText('A moment shared on NEXA.',70,250);nexaShowStory(c.toDataURL(),p?.name||'NEXA','Today')}})});
 $('#storyAddHome')?.addEventListener('click',()=>{$('#captureLaunch')?.click()});
})();

/* MOBILE CAMERA DEFAULTS */
if(window.innerWidth<=700){
  const rail=$('#storyRail');
  const homeStories=$('#homeStories');
  if(rail&&homeStories) rail.classList.remove('open');
}

/* NEXA MOBILE SOCIAL + DIRECT CAPTURE */
(()=>{
  const panel=$('#socialPanel');
  if(!panel)return;
  function renderMobileChat(personId){
    const p=chatPeople.find(x=>x.id===personId)||chatPeople[0];
    activeChat=p.id;
    const messages=chatMessages();
    $('#panelTitle').textContent=p.name;
    const box=$('#panelContent');
    box.innerHTML='<div class="nexa-mobile-chat"><div class="mobile-chat-head"><button class="round-glass" id="mobileChatBack">‹</button><div class="mobile-chat-person"><b>'+p.name+'</b><span>'+p.status+'</span></div><button class="round-glass">⋮</button></div><div class="mobile-chat-messages" id="mobileChatMessages"></div><div class="mobile-chat-compose"><button class="round-glass" id="mobileChatAttach">＋</button><input class="mobile-chat-input" id="mobileChatInput" placeholder="Message…"><button class="mobile-chat-send" id="mobileChatSend">➤</button></div></div>';
    const list=$('#mobileChatMessages');
    messages.forEach(m=>{const row=document.createElement('div');row.className='mobile-bubble-row '+(m.from==='me'?'me':'them');const b=document.createElement('div');b.className='mobile-bubble';b.textContent=m.text||'📸 Snap';row.appendChild(b);list.appendChild(row)});
    list.scrollTop=list.scrollHeight;
    $('#mobileChatBack').onclick=()=>openPanel('chat');
    const send=()=>{
      const input=$('#mobileChatInput');const text=input.value.trim();if(!text)return;
      chatData[activeChat]=[...chatMessages(),{from:'me',text,created:Date.now()}];saveChats();input.value='';renderMobileChat(activeChat);
    };
    $('#mobileChatSend').onclick=send;
    $('#mobileChatInput').onkeydown=e=>{if(e.key==='Enter')send()};
  }
  window.openPanel=function(type){
    const p=$('#socialPanel');if(!p)return;
    homePanel=type;p.classList.remove('hidden-panel');
    $('#panelTitle').textContent=type==='chat'?'Chat':type==='discover'?'Discover':'Stories';
    const box=$('#panelContent');
    if(type==='chat'){
      box.innerHTML='<div class="mobile-chat-home"><div class="mobile-chat-search">⌕ <span>Search chats</span></div><div class="mobile-chat-list" id="mobileChatList"></div></div>';
      const list=$('#mobileChatList');
      chatPeople.forEach(person=>{
        const b=document.createElement('button');b.className='mobile-thread';b.innerHTML='<span class="mobile-thread-avatar">'+person.letter+'</span><span class="mobile-thread-copy"><b>'+person.name+'</b><small>'+person.preview+'</small></span><time>'+person.time+'</time>';
        b.onclick=()=>renderMobileChat(person.id);list.appendChild(b);
      });
    }else if(type==='stories'){
      box.innerHTML='<div class="panel-hero"><b>Your Stories</b><span>Share moments that disappear after 24 hours.</span><button class="primary" id="homeStoryBtn">＋ Create Story</button></div>';
      $('#homeStoryBtn')?.addEventListener('click',()=>$('#homeCapture')?.click());
    }else{
      box.innerHTML='<div class="panel-hero"><b>Discover NEXA</b><span>Creators, moments and ideas from the NEXA community.</span><div class="discover-mini-grid"><div>✦ Spotlight</div><div>◉ Creators</div><div>⌁ Trending</div></div></div>';
    }
  };
  $('#homeCapture')?.addEventListener('click',()=>{
    if(!homeVideo?.videoWidth)return $('#captureLaunch')?.click();
    const c=document.createElement('canvas');c.width=homeVideo.videoWidth;c.height=homeVideo.videoHeight;
    const x=c.getContext('2d');if(homeVideo.style.filter)x.filter=homeVideo.style.filter;
    x.translate(c.width,0);x.scale(-1,1);x.drawImage(homeVideo,0,0,c.width,c.height);
    c.toBlob(blob=>{if(blob){loadPhoto(new File([blob],'nexa-snap.jpg',{type:'image/jpeg'}))}},'image/jpeg',.94);
  });
})();

/* NEXA CAMERA RELIABILITY PATCH */
(()=>{
  const video=$('#homeCameraPreview'), shell=$('#cameraHome');
  if(!video||!shell)return;
  const oldCapture=$('#homeCapture');
  if(oldCapture){
    const fresh=oldCapture.cloneNode(true);
    oldCapture.replaceWith(fresh);
  }
  const capture=$('#homeCapture');
  let facing='user', starting=false;

  function cameraMessage(message,buttonText='Enable camera'){
    let ui=$('#cameraPermissionCard');
    if(!ui){
      ui=document.createElement('div');
      ui.id='cameraPermissionCard';
      ui.innerHTML='<div class="camera-permission-inner"><div class="camera-permission-icon">◉</div><b id="cameraPermissionTitle">NEXA Camera</b><span id="cameraPermissionText"></span><button id="cameraPermissionBtn" class="primary">'+buttonText+'</button></div>';
      shell.appendChild(ui);
      $('#cameraPermissionBtn').onclick=()=>requestHomeCamera();
    }
    $('#cameraPermissionText').textContent=message;
    ui.classList.remove('hidden');
  }
  function hideCameraMessage(){ $('#cameraPermissionCard')?.classList.add('hidden') }

  async function requestHomeCamera(){
    if(starting)return;
    starting=true;
    try{
      if(!navigator.mediaDevices?.getUserMedia)throw new Error('MEDIA_UNAVAILABLE');
      if(homeStream){homeStream.getTracks().forEach(t=>t.stop());homeStream=null}
      const stream=await navigator.mediaDevices.getUserMedia({
        video:{facingMode:facing,width:{ideal:1280},height:{ideal:720}},
        audio:false
      });
      homeStream=stream;
      video.srcObject=stream;
      video.muted=true;
      video.playsInline=true;
      await video.play().catch(()=>{});
      video.dataset.facing=facing;
      hideCameraMessage();
    }catch(e){
      const msg=e?.name==='NotAllowedError'
        ? 'Allow camera access in your browser settings, then tap Enable camera again.'
        : e?.name==='NotFoundError'
        ? 'No camera was found on this device.'
        : e?.name==='NotReadableError'
        ? 'The camera is busy. Close other apps using the camera and try again.'
        : 'Camera could not start. Tap to try again.';
      cameraMessage(msg);
    }finally{starting=false}
  }

  window.nexaRequestCamera=requestHomeCamera;
  capture.onclick=()=>{
    if(!homeStream){requestHomeCamera();return}
    if(!video.videoWidth){toast('Camera is still starting…');return}
    const c=document.createElement('canvas');
    c.width=video.videoWidth;c.height=video.videoHeight;
    const x=c.getContext('2d');
    x.save();
    if(facing==='user'){x.translate(c.width,0);x.scale(-1,1)}
    x.filter=getComputedStyle(video).filter||'none';
    x.drawImage(video,0,0,c.width,c.height);
    x.restore();
    c.toBlob(blob=>{
      if(blob)loadPhoto(new File([blob],'nexa-snap.jpg',{type:'image/jpeg'}));
    },'image/jpeg',.94);
  };

  $('#homeFlip')?.addEventListener('click',async e=>{
    e.stopImmediatePropagation();
    facing=facing==='user'?'environment':'user';
    await requestHomeCamera();
  });

  cameraMessage('Tap once to give NEXA permission to use your camera.');
  requestHomeCamera();
})();


/* NEXA FINAL INTERACTION SAFETY NET */
(()=>{
  const id=x=>document.getElementById(x), video=id('homeCameraPreview'), home=id('cameraHome');
  if(!video||!home)return;
  ['homeCapture','homeFlip','homeGallery','homeStories','homeSettings','homeProfile'].forEach(k=>{
    const el=id(k); if(el){const fresh=el.cloneNode(true);el.replaceWith(fresh);}
  });
  let facing='user',busy=false;
  function card(message='Camera access is required to capture photos.'){
    let c=id('cameraPermissionCard');
    if(!c){c=document.createElement('div');c.id='cameraPermissionCard';c.innerHTML='<div class="camera-permission-inner"><div class="camera-permission-icon">◉</div><b>NEXA Camera</b><span id="cameraPermissionText"></span><button type="button" id="cameraPermissionBtn" class="primary">Enable camera</button></div>';home.appendChild(c);}
    id('cameraPermissionText').textContent=message;c.classList.remove('hidden');id('cameraPermissionBtn').onclick=()=>startCamera();
  }
  async function startCamera(){
    if(busy)return;busy=true;
    try{
      if(!window.isSecureContext)throw new Error('secure');
      if(!navigator.mediaDevices?.getUserMedia)throw new Error('media');
      if(window.homeStream){window.homeStream.getTracks().forEach(t=>t.stop());window.homeStream=null;}
      let stream;
      try{stream=await navigator.mediaDevices.getUserMedia({video:{facingMode:facing,width:{ideal:1280},height:{ideal:720}},audio:false});}
      catch(e){stream=await navigator.mediaDevices.getUserMedia({video:true,audio:false});}
      window.homeStream=stream;video.srcObject=stream;video.muted=true;video.setAttribute('playsinline','');video.setAttribute('autoplay','');video.dataset.facing=facing;await video.play();id('cameraPermissionCard')?.classList.add('hidden');
    }catch(e){
      card(e?.name==='NotAllowedError'?'Camera permission was denied. Allow camera access, then tap Enable camera.':e?.name==='NotReadableError'?'The camera is busy in another app.':'Camera could not start. Tap Enable camera to try again.');
    }finally{busy=false;}
  }
  id('homeCapture').onclick=()=>{
    if(!window.homeStream||!video.videoWidth){startCamera();return;}
    const c=document.createElement('canvas');c.width=video.videoWidth;c.height=video.videoHeight;const x=c.getContext('2d');x.save();if(facing==='user'){x.translate(c.width,0);x.scale(-1,1);}x.filter=getComputedStyle(video).filter||'none';x.drawImage(video,0,0);x.restore();c.toBlob(b=>b&&typeof loadPhoto==='function'&&loadPhoto(new File([b],'nexa-snap.jpg',{type:'image/jpeg'})),'image/jpeg',.94);
  };
  id('homeFlip').onclick=()=>{facing=facing==='user'?'environment':'user';startCamera();};
  id('homeGallery').onclick=()=>id('photoInput')?.click();
  id('homeStories').onclick=()=>id('storyRail')?.classList.toggle('open');
  id('homeSettings').onclick=()=>toast('NEXA settings');
  id('homeProfile').onclick=()=>typeof setView==='function'&&setView('profile');
  id('storyAddHome').onclick=()=>id('homeCapture').click();
  card('Tap Enable camera to start NEXA camera.');
  window.nexaRequestCamera=startCamera;
})();
