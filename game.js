import * as THREE from 'https://cdn.jsdelivr.net/npm/three@0.180.0/build/three.module.js';

const $ = id => document.getElementById(id);
const clamp = (v,a,b) => Math.max(a,Math.min(b,v));
const kmh = v => Math.round(Math.abs(v)*3.6);

let scene, camera, renderer, clock;
let truck, truckBody, cab, wheels = [], roadGroup, worldGroup;
let traffic = [], scenery = [], routeMarkers = [];
let speed = 0, steer = 0, distance = 0, fuel = 100, damage = 0;
let money = Number(localStorage.getItem('kenyaTruckerMoney') || 0);
let cameraMode = 0, running = false, paused = false, toastTimer;
let lastSave = 0;
const keys = {};
const routeLength = 160000;
const startZ = 0;

const route = {
  name:'Nairobi → Nakuru', from:'Nairobi', to:'Nakuru', cargo:'Tea & packaged goods', pay:8500,
  stops:[{z:0,name:'NAIROBI'},{z:54000,name:'NAIVASHA'},{z:112000,name:'MAU SUMMIT'},{z:160000,name:'NAKURU'}]
};

init();

function init(){
  scene = new THREE.Scene();
  scene.background = new THREE.Color(0x8eb7c6);
  scene.fog = new THREE.Fog(0x8eb7c6, 260, 1050);
  clock = new THREE.Clock();

  camera = new THREE.PerspectiveCamera(63, innerWidth/innerHeight, .1, 3000);
  camera.position.set(0,5,13);

  renderer = new THREE.WebGLRenderer({antialias:true,powerPreference:'high-performance'});
  renderer.setPixelRatio(Math.min(devicePixelRatio,1.8));
  renderer.setSize(innerWidth,innerHeight);
  renderer.shadowMap.enabled = true;
  renderer.shadowMap.type = THREE.PCFSoftShadowMap;
  renderer.outputColorSpace = THREE.SRGBColorSpace;
  renderer.toneMapping = THREE.ACESFilmicToneMapping;
  renderer.toneMappingExposure = 1.05;
  renderer.domElement.id = 'game';
  document.body.appendChild(renderer.domElement);

  const hemi = new THREE.HemisphereLight(0xcfe9ff,0x5c4935,2.1); scene.add(hemi);
  const sun = new THREE.DirectionalLight(0xfff1cf,3.2); sun.position.set(-250,450,220); sun.castShadow=true;
  sun.shadow.mapSize.set(2048,2048); sun.shadow.camera.left=-600; sun.shadow.camera.right=600; sun.shadow.camera.top=600; sun.shadow.camera.bottom=-600; scene.add(sun);

  buildWorld();
  buildTruck();
  buildTraffic();
  bindUI();
  resize();
  window.addEventListener('resize',resize);
  $('continueBtn').disabled = !localStorage.getItem('kenyaTruckerSave');
  setTimeout(()=>{ $('loading').classList.add('hidden'); },450);
  renderer.setAnimationLoop(loop);
}

function mat(color, rough=1, metal=0){return new THREE.MeshStandardMaterial({color,roughness:rough,metalness:metal});}
function box(w,h,d,color,x=0,y=0,z=0,rough=1){const m=new THREE.Mesh(new THREE.BoxGeometry(w,h,d),mat(color,rough));m.position.set(x,y,z);m.castShadow=true;m.receiveShadow=true;return m;}
function cyl(r,h,color,x=0,y=0,z=0,rotX=0){const m=new THREE.Mesh(new THREE.CylinderGeometry(r,r,h,16),mat(color));m.position.set(x,y,z);m.rotation.x=rotX;m.castShadow=true;return m;}

function buildWorld(){
  worldGroup = new THREE.Group(); scene.add(worldGroup);
  const ground = new THREE.Mesh(new THREE.PlaneGeometry(3000,3000),mat(0x687b50));
  ground.rotation.x=-Math.PI/2; ground.position.y=-.03; ground.receiveShadow=true; worldGroup.add(ground);

  roadGroup = new THREE.Group(); worldGroup.add(roadGroup);
  const road = new THREE.Mesh(new THREE.PlaneGeometry(18,2200),mat(0x2b3032)); road.rotation.x=-Math.PI/2; road.position.set(0,.01,-700); road.receiveShadow=true; roadGroup.add(road);
  const shoulderL = new THREE.Mesh(new THREE.PlaneGeometry(3,2200),mat(0x8b806c)); shoulderL.rotation.x=-Math.PI/2; shoulderL.position.set(-10.5,.015,-700); roadGroup.add(shoulderL);
  const shoulderR = shoulderL.clone(); shoulderR.position.x=10.5; roadGroup.add(shoulderR);
  for(let z=-1750;z<350;z+=24){
    const dash=box(.25,.025,10,0xd9d4a4,0,.08,z);roadGroup.add(dash);
  }
  for(let z=-1750;z<350;z+=18){
    const edgeL=box(.12,.025,8,0xf1eee0,-8.6,.08,z);roadGroup.add(edgeL);
    const edgeR=edgeL.clone();edgeR.position.x=8.6;roadGroup.add(edgeR);
  }
  addTown(0,-90,9,'NAIROBI'); addTown(-3,-430,10,'NAIVASHA'); addTown(2,-880,12,'MAU'); addTown(-2,-1280,11,'NAKURU');
  for(let z=-20;z>-1700;z-=48){
    addTree((Math.random()>.5?1:-1)*(18+Math.random()*60),z, .8+Math.random()*1.7);
    if(Math.random()>.25)addTree((Math.random()>.5?1:-1)*(25+Math.random()*100),z-12,.7+Math.random()*1.4);
  }
  for(let z=-220;z>-1550;z-=170) addHill(z);
  addMountainRange(-1050);
  addRoadSigns();
  addFuelStations();
}

function addTree(x,z,s){
  const g=new THREE.Group();
  g.add(cyl(.22*s,2.5*s,0x5b3d25,0,1.25*s,0));
  const crown=new THREE.Mesh(new THREE.SphereGeometry(1.45*s,10,8),mat(Math.random()>.5?0x365c31:0x456d38));crown.position.y=3.1*s;crown.castShadow=true;g.add(crown);
  g.position.set(x,0,z); worldGroup.add(g); scenery.push(g);
}
function addHill(z){
  for(let i=0;i<7;i++){const h=15+Math.random()*28,w=35+Math.random()*55;const m=new THREE.Mesh(new THREE.ConeGeometry(w,h,7),mat(0x4e6544));m.position.set((i%2?1:-1)*(80+Math.random()*150),h/2,z-i*35);m.scale.z=1.8;m.castShadow=true;worldGroup.add(m);}
}
function addMountainRange(z){
  for(let i=0;i<8;i++){const h=70+Math.random()*100,w=70+Math.random()*100;const m=new THREE.Mesh(new THREE.ConeGeometry(w,h,6),mat(0x4d5960));m.position.set((i-3.5)*110,h/2,z-Math.random()*80);m.scale.z=1.2;m.castShadow=true;worldGroup.add(m);}
}
function addTown(x,z,scale,name){
  const g=new THREE.Group();
  for(let i=0;i<10;i++){
    const w=6+Math.random()*8,h=4+Math.random()*8,d=6+Math.random()*9;
    const b=box(w,h,d,Math.random()>.6?0xb9aa91:0x858e88,(Math.random()-.5)*scale*2,h/2,(Math.random()-.5)*120);g.add(b);
    const roof=box(w+.4,.45,d+.4,0x493f37,b.position.x,h+.25,b.position.z);g.add(roof);
  }
  const sign=box(12,3,.25,0xead49b,0,9,-35);g.add(sign);
  g.position.set(x,0,z); worldGroup.add(g);
  const label=makeLabel(name); label.position.set(x,11,z-35); worldGroup.add(label);
}
function makeLabel(text){
  const c=document.createElement('canvas');c.width=512;c.height=128;const ctx=c.getContext('2d');ctx.fillStyle='rgba(5,10,12,.75)';ctx.roundRect(8,15,496,98,18);ctx.fill();ctx.fillStyle='#f4c45e';ctx.font='bold 44px Arial';ctx.textAlign='center';ctx.fillText(text,256,80);const t=new THREE.CanvasTexture(c);const s=new THREE.SpriteMaterial({map:t,transparent:true});const sp=new THREE.Sprite(s);sp.scale.set(18,4.5,1);return sp;}
function addRoadSigns(){
  const signs=[{z:-380,text:'NAIVASHA  54 KM'},{z:-780,text:'MAU SUMMIT  112 KM'},{z:-1220,text:'NAKURU  40 KM'}];
  signs.forEach((s,i)=>{const post=cyl(.09,4,0x56514a,-12,2,s.z);worldGroup.add(post);const board=box(4.8,1.7,.16,0x1c4d35,-12,4.1,s.z);worldGroup.add(board);const label=makeLabel(s.text);label.scale.set(8,2,1);label.position.set(-12,4.1,s.z-.12);worldGroup.add(label);});
}
function addFuelStations(){
  [-520,-1000].forEach(z=>{const g=new THREE.Group();g.add(box(22,5,18,0xc2b6a2,34,2.5,z));g.add(box(22.5,.6,18.5,0xb13f32,34,5.3,z));for(let i=0;i<3;i++)g.add(box(3,2,2,0xded6bd,26+i*7,1,z-11));const l=makeLabel('FUEL');l.scale.set(6,2,1);l.position.set(34,7,z);g.add(l);worldGroup.add(g);});
}

function buildTruck(){
  truck=new THREE.Group();truck.position.set(0,0,8);scene.add(truck);
  truckBody=box(3.2,1.9,6.8,0xb8322d,0,1.6,0,.65);truck.add(truckBody);
  cab=box(3.15,2.9,3.2,0xc43a31,0,3.4,1.55,.55);truck.add(cab);
  const windshield=box(2.65,1.05,0.08,0x1d2b31,0,3.85,-.08,.2);truck.add(windshield);
  const sideL=box(.08,1.05,1.5,0x172227,-1.59,3.8,1.45,.2);truck.add(sideL);const sideR=sideL.clone();sideR.position.x=1.59;truck.add(sideR);
  truck.add(box(3.35,.25,7.0,0x282b2c,0,2.55,-.1,.4));
  const bumper=box(3.5,.45,.55,0x33383a,0,.75,3.3,.35);truck.add(bumper);
  const cargo=box(3.05,2.45,5.1,0xd7d0b9,0,3.15,-2.3,.9);truck.add(cargo);
  const tarp=box(3.15,.18,5.2,0x2f4e3b,0,4.42,-2.3,.8);truck.add(tarp);
  for(const x of [-1.72,1.72]) for(const z of [-2.25,.8,2.35]){const w=cyl(.58,.42,0x17191a,x,.7,z,Math.PI/2);w.rotation.z=Math.PI/2;truck.add(w);w.userData.baseX=x;wheels.push(w);}
  const exhaust=cyl(.13,2.8,0x303335,1.45,2.5,-2.5);truck.add(exhaust);
  const mirrorL=box(.18,.45,.5,0x15191b,-1.85,3.45,.7);truck.add(mirrorL);const mirrorR=mirrorL.clone();mirrorR.position.x=1.85;truck.add(mirrorR);
  const trailerLight=box(.7,.25,.08,0xf3c94e,0,2.2,-5);truck.add(trailerLight);
}

function buildTraffic(){
  for(let i=0;i<11;i++){const car=makeVehicle(i%3===0);car.position.set((i%2?4.2:-4.2),0,-80-i*125-Math.random()*100);car.userData.speed=16+Math.random()*18;car.userData.dir=i%2?1:-1;traffic.push(car);scene.add(car);}
}
function makeVehicle(big=false){const g=new THREE.Group();const color=[0xeeeeee,0x293b48,0x9c322c,0xd1a44c,0x3e5b4c][Math.floor(Math.random()*5)];g.add(box(big?2.8:2.2,big?1.7:1.25,big?5.8:4.1,color,0,big?1.45:1.05,0,.6));g.add(box(big?2.6:2.0,big?1.2:.85,1.7,0x1c292d,0,big?2.5:1.85,.65,.2));for(const x of [-1.05,1.05])for(const z of [-1.35,1.35]){const w=cyl(.38,.3,0x151719,x,.55,z,Math.PI/2);g.add(w)}return g}

function startGame(load=false){
  resetPhysics();
  if(load){try{const s=JSON.parse(localStorage.getItem('kenyaTruckerSave'));if(s){distance=s.distance||0;fuel=s.fuel??100;damage=s.damage||0;money=s.money||money;truck.position.z=-distance/10;}}catch{}}
  $('menu').classList.add('hidden');$('hud').classList.remove('hidden');running=true;paused=false;showTouch();showToast(load?'Journey restored.':'Cargo loaded. Nairobi to Nakuru.');
}
function resetPhysics(){speed=0;steer=0;distance=0;fuel=100;damage=0;truck.position.set(0,0,8);truck.rotation.set(0,0,0);}
function pauseGame(){if(!running)return;paused=true;$('pause').classList.remove('hidden');}
function resumeGame(){paused=false;$('pause').classList.add('hidden');}
function endToMenu(){paused=false;running=false;$('pause').classList.add('hidden');$('hud').classList.add('hidden');$('menu').classList.remove('hidden');hideTouch();}
function completeRoute(){running=false;$('hud').classList.add('hidden');hideTouch();const bonus=Math.max(0,Math.round(8500-damage*55));money+=bonus;localStorage.setItem('kenyaTruckerMoney',money);localStorage.removeItem('kenyaTruckerSave');$('completeTitle').textContent='Nakuru reached';$('completeSummary').textContent=`Cargo delivered with ${Math.round(100-damage)}% truck condition remaining.`;$('earned').textContent=`+ KSh ${bonus.toLocaleString()}`;$('complete').classList.remove('hidden');}

function saveGame(){localStorage.setItem('kenyaTruckerSave',JSON.stringify({distance,fuel,damage,money}));}
function updateHud(){
  $('speed').textContent=kmh(speed);$('fuel').textContent=Math.round(fuel);$('damage').textContent=Math.round(damage);$('money').textContent=`KSh ${money.toLocaleString()}`;
  $('fuelBar').style.width=`${fuel}%`;$('damageBar').style.width=`${damage}%`;
  const km=Math.min(160,Math.round(distance/1000));$('routeDistance').textContent=`${km} km / 160 km`;
  $('missionText').textContent=distance<52000?'Follow the A104 and keep the cargo safe.':distance<112000?'Climb toward the Rift Valley.':'Final leg — Nakuru is ahead.';
  const p=clamp(distance/routeLength,0,1);$('mapTruck').style.left=`${18+p*64}%`;$('mapTruck').style.top=`${61-p*38}%`;
}
function showToast(t){const el=$('toast');el.textContent=t;el.classList.add('show');clearTimeout(toastTimer);toastTimer=setTimeout(()=>el.classList.remove('show'),2600)}
function showTouch(){if(innerWidth<=760)$('touch').classList.remove('hidden')}
function hideTouch(){$('touch').classList.add('hidden')}

function input(){
  const left=keys.ArrowLeft||keys.a||keys.A;const right=keys.ArrowRight||keys.d||keys.D;
  const gas=keys.ArrowUp||keys.w||keys.W;const brake=keys.ArrowDown||keys.s||keys.S;
  return {left,right,gas,brake};
}
function drive(dt){
  const i=input();
  const targetSteer=(i.left?-1:0)+(i.right?1:0);steer += (targetSteer-steer)*Math.min(1,dt*7);
  if(i.gas) speed += 12*dt; else speed -= 2.2*dt;
  if(i.brake) speed -= 24*dt;
  speed=clamp(speed,0,42);
  const steeringEffect=(speed/42)*3.1;
  truck.position.x += steer*steeringEffect*dt;
  truck.position.x=clamp(truck.position.x,-7.2,7.2);
  truck.rotation.y += (steer*.08-truck.rotation.y)*dt*5;
  truck.position.z -= speed*dt;
  distance += speed*dt;
  fuel -= (0.0035+speed*.00008)*dt*60;
  if(fuel<=0){fuel=0;speed=Math.max(0,speed-12*dt);showToast('Out of fuel — find a fuel station.');}
  if(Math.abs(truck.position.x)>6.8 && speed>16){damage=Math.min(100,damage+dt*1.6);}
  wheels.forEach(w=>w.rotation.x-=speed*dt*1.8);
  checkTraffic();
  if(distance>=routeLength)completeRoute();
  if(performance.now()-lastSave>7000){saveGame();lastSave=performance.now();}
}
function checkTraffic(){
  traffic.forEach(v=>{
    v.position.z += v.userData.dir*v.userData.speed*0.018;
    if(v.position.z>truck.position.z+250)v.position.z=truck.position.z-1700-Math.random()*400;
    if(v.position.z<truck.position.z-2100)v.position.z=truck.position.z+300+Math.random()*400;
    const dz=Math.abs(v.position.z-truck.position.z),dx=Math.abs(v.position.x-truck.position.x);
    if(dz<5&&dx<2.4&&speed>5){damage=Math.min(100,damage+0.45);speed*=.78;showToast('Collision — cargo damaged!');}
  });
}

function updateCamera(dt){
  const target=new THREE.Vector3();
  if(cameraMode===0){target.set(truck.position.x*.55,4.9,truck.position.z+12);camera.position.lerp(target,1-Math.pow(.001,dt));const look=new THREE.Vector3(truck.position.x,2.1,truck.position.z-15);camera.lookAt(look);}
  else {target.set(truck.position.x,3.35,truck.position.z+0.4);camera.position.lerp(target,1-Math.pow(.001,dt));const look=new THREE.Vector3(truck.position.x,3.35,truck.position.z-40);camera.lookAt(look);}
}
function loop(){
  const dt=Math.min(clock.getDelta(),.04);
  if(running&&!paused){drive(dt);updateHud();}
  updateCamera(dt);
  renderer.render(scene,camera);
}
function resize(){camera.aspect=innerWidth/innerHeight;camera.updateProjectionMatrix();renderer.setSize(innerWidth,innerHeight);if(running)showTouch();}

function bindUI(){
  $('startBtn').onclick=()=>startGame(false);$('continueBtn').onclick=()=>startGame(true);
  $('pauseBtn').onclick=pauseGame;$('resumeBtn').onclick=resumeGame;$('restartBtn').onclick=()=>{resetPhysics();$('pause').classList.add('hidden');running=true;showToast('Route restarted.');};$('menuBtn').onclick=endToMenu;
  $('nextRouteBtn').onclick=()=>{$('complete').classList.add('hidden');startGame(false)};
  $('touchCamera').onclick=()=>{cameraMode=(cameraMode+1)%2;showToast(cameraMode?'Cabin camera':'Chase camera');};
  window.addEventListener('keydown',e=>{keys[e.key]=true;if(['ArrowUp','ArrowDown','ArrowLeft','ArrowRight',' '].includes(e.key))e.preventDefault();if(e.key.toLowerCase()==='c')cameraMode=(cameraMode+1)%2;if(e.key.toLowerCase()==='r'&&running)resetPhysics();if(e.key==='Escape'&&running){paused?resumeGame():pauseGame();}});
  window.addEventListener('keyup',e=>keys[e.key]=false);
  document.querySelectorAll('[data-control]').forEach(btn=>{const c=btn.dataset.control;const down=e=>{e.preventDefault();keys[c==='accelerate'?'ArrowUp':c==='brake'?'ArrowDown':c==='left'?'ArrowLeft':'ArrowRight']=true};const up=e=>{e.preventDefault();keys[c==='accelerate'?'ArrowUp':c==='brake'?'ArrowDown':c==='left'?'ArrowLeft':'ArrowRight']=false};btn.addEventListener('pointerdown',down);btn.addEventListener('pointerup',up);btn.addEventListener('pointercancel',up);btn.addEventListener('pointerleave',up);});
}
