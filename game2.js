import * as THREE from 'https://cdn.jsdelivr.net/npm/three@0.180.0/build/three.module.js';

const $ = id => document.getElementById(id);
const clamp = (v,a,b) => Math.max(a,Math.min(b,v));
let scene,camera,renderer,clock,truck,world,road,traffic=[];
let speed=0,steer=0,distance=0,fuel=100,damage=0,money=Number(localStorage.getItem('kenyaTruckerMoney')||0);
let running=false,paused=false,cameraMode=0,night=false,rain=false,lastSave=0;
const keys={};
const ROUTE=160000;

const colors={road:0x25292b,grass:0x60794b,dirt:0x8b7558,red:0xc73832,cream:0xd7cdb6,green:0x315a3c,metal:0x303538,glass:0x14252b};
function mat(c,r=.8,m=0){return new THREE.MeshStandardMaterial({color:c,roughness:r,metalness:m});}
function box(w,h,d,c,x=0,y=0,z=0,r=.8){const m=new THREE.Mesh(new THREE.BoxGeometry(w,h,d),mat(c,r));m.position.set(x,y,z);m.castShadow=true;m.receiveShadow=true;return m;}
function cyl(r,h,c,x=0,y=0,z=0,rx=0){const m=new THREE.Mesh(new THREE.CylinderGeometry(r,r,h,24),mat(c,.65,.15));m.position.set(x,y,z);m.rotation.x=rx;m.castShadow=true;return m;}
function label(text,scale=1){const cv=document.createElement('canvas');cv.width=512;cv.height=128;const x=cv.getContext('2d');x.fillStyle='rgba(8,14,17,.82)';x.roundRect(8,12,496,104,18);x.fill();x.fillStyle='#ffd36b';x.font='bold 42px Arial';x.textAlign='center';x.fillText(text,256,79);const s=new THREE.Sprite(new THREE.SpriteMaterial({map:new THREE.CanvasTexture(cv),transparent:true}));s.scale.set(14*scale,3.5*scale,1);return s;}

init();
function init(){
 scene=new THREE.Scene();scene.background=new THREE.Color(0x9bbfd0);scene.fog=new THREE.Fog(0x9bbfd0,180,1100);clock=new THREE.Clock();
 camera=new THREE.PerspectiveCamera(62,innerWidth/innerHeight,.1,3000);
 renderer=new THREE.WebGLRenderer({antialias:true,powerPreference:'high-performance'});renderer.setPixelRatio(Math.min(devicePixelRatio,1.8));renderer.setSize(innerWidth,innerHeight);renderer.shadowMap.enabled=true;renderer.shadowMap.type=THREE.PCFSoftShadowMap;renderer.outputColorSpace=THREE.SRGBColorSpace;renderer.toneMapping=THREE.ACESFilmicToneMapping;renderer.toneMappingExposure=1.1;renderer.domElement.id='game';document.body.appendChild(renderer.domElement);
 const hemi=new THREE.HemisphereLight(0xdff3ff,0x4f402f,2.2);scene.add(hemi);
 const sun=new THREE.DirectionalLight(0xffe7bd,3.5);sun.position.set(-250,450,180);sun.castShadow=true;sun.shadow.mapSize.set(2048,2048);sun.shadow.camera.left=-500;sun.shadow.camera.right=500;sun.shadow.camera.top=500;sun.shadow.camera.bottom=-500;scene.add(sun);window.sun=sun;window.hemi=hemi;
 buildWorld();buildTruck();buildTraffic();bind();resize();window.addEventListener('resize',resize);$('continueBtn').disabled=!localStorage.getItem('kenyaTruckerSave');setTimeout(()=>$('loading').classList.add('hidden'),600);renderer.setAnimationLoop(loop);
}
function buildWorld(){
 world=new THREE.Group();scene.add(world);
 const ground=new THREE.Mesh(new THREE.PlaneGeometry(3200,3200),mat(colors.grass));ground.rotation.x=-Math.PI/2;ground.position.y=-.04;ground.receiveShadow=true;world.add(ground);
 road=new THREE.Group();world.add(road);
 const asphalt=new THREE.Mesh(new THREE.PlaneGeometry(20,2600),mat(colors.road));asphalt.rotation.x=-Math.PI/2;asphalt.position.set(0,.02,-900);asphalt.receiveShadow=true;road.add(asphalt);
 for(let z=-2200;z<350;z+=26)road.add(box(.25,.035,11,0xe4d89f,0,.07,z));
 for(const x of [-9.1,9.1])for(let z=-2200;z<350;z+=18)road.add(box(.13,.035,8,0xf1eee3,x,.075,z));
 for(let z=-20;z>-2100;z-=55){tree((Math.random()<.5?-1:1)*(18+Math.random()*90),z,.8+Math.random()*1.5);if(Math.random()>.3)tree((Math.random()<.5?-1:1)*(30+Math.random()*120),z-20,.7+Math.random());}
 town('NAIROBI',0,-90,0);town('NAIVASHA',-430,-3,1);town('MAU SUMMIT',-920,3,1);town('NAKURU',-1300,-2,1);
 for(let z=-260;z>-1900;z-=170)hill(z);
 mountainRange(-980);signs();stations();bridges();flags();
}
function tree(x,z,s){const g=new THREE.Group();g.add(cyl(.25*s,2.7*s,0x60412a,0,1.35*s));const c=new THREE.Mesh(new THREE.SphereGeometry(1.55*s,10,8),mat(Math.random()>.5?0x315d35:0x416d3d));c.position.y=3.2*s;c.castShadow=true;g.add(c);g.position.set(x,0,z);world.add(g);}
function town(name,z,x){const g=new THREE.Group();for(let i=0;i<14;i++){const w=5+Math.random()*9,h=4+Math.random()*10,d=5+Math.random()*9;const b=box(w,h,d,Math.random()>.5?0xb9ae9d:0x777d79,(Math.random()-.5)*28,h/2,(Math.random()-.5)*100);g.add(b);g.add(box(w+.3,.45,d+.3,Math.random()>.5?0x453d38:0x6a3e32,b.position.x,h+.25,b.position.z));}const l=label(name,1.1);l.position.set(0,12,-45);g.add(l);g.position.set(x,0,z);world.add(g);}
function hill(z){for(let i=0;i<6;i++){const h=18+Math.random()*30,w=40+Math.random()*70,m=new THREE.Mesh(new THREE.ConeGeometry(w,h,7),mat(0x526747));m.position.set((i%2?-1:1)*(75+Math.random()*150),h/2,z-i*35);m.scale.z=1.7;m.castShadow=true;world.add(m);}}
function mountainRange(z){for(let i=0;i<10;i++){const h=65+Math.random()*110,w=70+Math.random()*100,m=new THREE.Mesh(new THREE.ConeGeometry(w,h,7),mat(0x556069));m.position.set((i-4.5)*110,h/2,z-Math.random()*90);m.castShadow=true;world.add(m);}}
function signs(){[{z:-390,t:'NAIVASHA 54 KM'},{z:-790,t:'MAU SUMMIT 112 KM'},{z:-1220,t:'NAKURU 40 KM'}].forEach(s=>{world.add(cyl(.1,4,0x55504a,-12,2,s.z));const b=box(5,1.7,.18,0x205638,-12,4.15,s.z);world.add(b);const l=label(s.t,.55);l.position.set(-12,4.15,s.z-.2);world.add(l);});}
function stations(){[-520,-1050].forEach(z=>{const g=new THREE.Group();g.add(box(24,5,20,0xc8bca8,35,2.5,z));g.add(box(25,.6,21,0xb52f2b,35,5.25,z));for(let i=0;i<3;i++)g.add(box(3,2,2,0xded6bd,27+i*7,1,z-12));const l=label('FUEL',.8);l.position.set(35,7,z);g.add(l);world.add(g);});}
function bridges(){for(const z of [-690,-1510]){world.add(box(30,1.5,14,0x56585a,0,3,z));for(let x=-12;x<=12;x+=4)world.add(box(.45,3,.45,0x3e4142,x,1.5,z));}}
function flags(){for(const z of [-80,-450,-900,-1260]){for(const x of [-14,14]){world.add(cyl(.07,4,0x6b5234,x,2,z));const f=new THREE.Mesh(new THREE.PlaneGeometry(1.7,1),new THREE.MeshStandardMaterial({color:0x111111,side:THREE.DoubleSide}));f.position.set(x+(x<0?.8:-.8),3.25,z);f.rotation.y=x<0?0:Math.PI;const c=document.createElement('canvas');c.width=170;c.height=100;const q=c.getContext('2d');q.fillStyle='#000';q.fillRect(0,0,170,25);q.fillStyle='#d22';q.fillRect(0,25,170,50);q.fillStyle='#16813b';q.fillRect(0,75,170,25);f.material.map=new THREE.CanvasTexture(c);f.material.needsUpdate=true;world.add(f);}}}

function buildTruck(){
 truck=new THREE.Group();truck.position.set(0,0,8);scene.add(truck);
 const red=0xc92f2f, dark=0x17191b, chrome=0xa9adb0, black=0x0b0d0f, glass=0x132b35;
 const chassis=box(3.65,.38,9.2,dark,0,1.12,-.35,.35);truck.add(chassis);
 // realistic long-haul tractor proportions
 const lowerCab=box(3.35,1.55,2.9,red,0,2.05,2.35,.42);truck.add(lowerCab);
 const upperCab=box(3.32,2.35,2.72,red,0,3.85,2.28,.45);truck.add(upperCab);
 // sloped windshield and side windows
 const windshield=box(2.72,1.0,.10,glass,0,4.35,.86,.08);windshield.rotation.x=-.10;truck.add(windshield);
 for(const sx of [-1.66,1.66]){const side=box(.09,1.18,1.72,glass,sx,3.95,2.20,.08);side.rotation.z=sx<0?-.04:.04;truck.add(side);}
 // window pillars and door seams
 for(const sx of [-1.54,1.54])truck.add(box(.09,1.5,.12,red,sx,3.9,1.30,.12));
 for(const sx of [-1.61,1.61])truck.add(box(.05,1.65,1.65,dark,sx,2.65,2.28,.2));
 truck.add(box(2.9,.07,1.65,chrome,0,4.99,2.28,.3));
 // front grille, bumper and lower fascia
 truck.add(box(3.48,.55,.38,chrome,0,.88,3.85,.25));
 truck.add(box(2.15,1.0,.10,0x262a2c,0,1.65,3.78,.12));
 for(let x=-.78;x<=.78;x+=.39)truck.add(box(.07,.82,.13,chrome,x,1.65,3.84,.2));
 // headlights and indicators
 for(const x of [-1.15,1.15]){
   const lamp=new THREE.Mesh(new THREE.BoxGeometry(.55,.32,.12),new THREE.MeshStandardMaterial({color:0xfff3c4,emissive:0xffe38a,emissiveIntensity:.45,roughness:.25,metalness:.15}));lamp.position.set(x,1.55,3.88);truck.add(lamp);
   const indicator=new THREE.Mesh(new THREE.BoxGeometry(.28,.16,.10),new THREE.MeshStandardMaterial({color:0xff8c25,emissive:0xff6414,emissiveIntensity:.35}));indicator.position.set(x*1.25,1.35,3.89);truck.add(indicator);
 }
 // bonnet lip / Kenya-style red cab detailing
 truck.add(box(3.1,.12,.30,chrome,0,2.65,3.78,.3));
 truck.add(box(2.95,.08,2.0,0x9f2225,0,4.99,2.25,.5));
 // fifth wheel and realistic box trailer
 truck.add(box(2.45,.32,1.65,0x303438,0,1.55,-.15,.3));
 const trailer=box(3.22,2.85,6.05,0xe3ded2,0,3.35,-3.35,.65);truck.add(trailer);
 // trailer side panels
 for(let z=-.8;z>=-5.8;z-=1)truck.add(box(3.27,.045,.035,0xb7b1a6,0,3.35,z,.4));
 truck.add(box(3.28,.20,6.15,0x17663c,0,4.87,-3.35,.5));
 truck.add(box(3.32,.12,.18,0x33373a,0,1.82,-6.42,.3));
 // rear doors, hinges and reflective strips
 truck.add(box(1.48,2.35,.08,0xd6d0c4,-.76,3.35,-6.42,.25));truck.add(box(1.48,2.35,.08,0xd6d0c4,.76,3.35,-6.42,.25));
 for(const x of [-1.58,1.58])truck.add(box(.08,2.3,.12,chrome,x,3.35,-6.45,.2));
 for(const x of [-1.15,1.15])truck.add(box(.62,.16,.08,0xffb51e,x,1.9,-6.48,.1));
 // green tarp/roof strip and side mirrors
 for(const sx of [-1,1]){
   const arm=box(.10,.10,.75,dark,sx*1.92,4.25,1.62,.25);arm.rotation.x=.18;truck.add(arm);
   const mirror=box(.30,.55,.16,black,sx*2.03,4.18,1.25,.15);truck.add(mirror);
 }
 // twin exhaust stacks with caps
 for(const sx of [-1.32,1.32]){truck.add(cyl(.13,2.9,chrome,sx,3.0,-.55));truck.add(cyl(.17,.12,dark,sx,4.48,-.55));}
 // fuel tanks and side steps
 for(const sx of [-1.86,1.86]){truck.add(cyl(.38,2.25,chrome,sx,1.55,.15,Math.PI/2));truck.add(box(.38,.30,.95,dark,sx,1.05,1.55,.25));}
 // wheels: realistic wide tyres, hubs, rims and mudguards
 const wheelZ=[2.35,-.55,-2.05,-4.15,-5.65];
 wheelZ.forEach((z,idx)=>[-1,1].forEach(sx=>{
   const tire=new THREE.Mesh(new THREE.CylinderGeometry(idx<2?.68:.64,idx<2?.68:.64,.48,32),new THREE.MeshStandardMaterial({color:black,roughness:.9,metalness:.02}));
   tire.rotation.z=Math.PI/2;tire.position.set(sx*1.83,.72,z);tire.castShadow=true;truck.add(tire);
   const rim=new THREE.Mesh(new THREE.CylinderGeometry(.34,.34,.51,24),new THREE.MeshStandardMaterial({color:chrome,roughness:.3,metalness:.8}));rim.rotation.z=Math.PI/2;rim.position.set(sx*1.84,.72,z);truck.add(rim);
   const hub=new THREE.Mesh(new THREE.CylinderGeometry(.12,.12,.54,18),new THREE.MeshStandardMaterial({color:0x555a5e,roughness:.25,metalness:.9}));hub.rotation.z=Math.PI/2;hub.position.set(sx*1.85,.72,z);truck.add(hub);
 }));
 // mudguards above rear axles
 for(const z of [-.55,-2.05,-4.15,-5.65])for(const sx of [-1,1])truck.add(box(.28,.22,1.55,dark,sx*1.86,1.30,z,.4));
 // cab interior visible through glass
 truck.add(box(1.9,.35,.45,dark,0,2.55,1.45,.25));
 const steering=new THREE.Mesh(new THREE.TorusGeometry(.34,.055,12,24),new THREE.MeshStandardMaterial({color:dark,roughness:.55}));steering.position.set(-.72,2.85,1.55);steering.rotation.x=Math.PI/2;truck.add(steering);
 truck.add(box(.72,1.15,.72,0x252525,-.72,2.35,1.45,.55));
 truck.add(box(.72,1.15,.72,0x252525,.72,2.35,1.45,.55));
 // running lights
 for(let x=-1.3;x<=1.3;x+=.65){const l=new THREE.Mesh(new THREE.BoxGeometry(.18,.09,.08),new THREE.MeshStandardMaterial({color:0xffd77a,emissive:0xffa21a,emissiveIntensity:.3}));l.position.set(x,2.95,3.90);truck.add(l);}
}
function vehicle(big=false){const g=new THREE.Group();const cs=[0xe8e7df,0x293b48,0x9b312b,0xd0a448,0x3c5b4b];const c=cs[Math.floor(Math.random()*cs.length)];g.add(box(big?2.8:2.2,big?1.7:1.25,big?5.8:4.2,c,0,big?1.45:1.05,0,.6));g.add(box(big?2.5:2,big?1.15:.8,1.7,colors.glass,0,big?2.45:1.8,.65,.15));for(const x of [-1,1])for(const z of [-1.35,1.35]){const w=cyl(.38,.3,0x111315,x*(big?1.3:1.05),.55,z);w.rotation.z=Math.PI/2;g.add(w);}g.userData.speed=12+Math.random()*20;g.userData.dir=Math.random()>.5?1:-1;return g;}
function buildTraffic(){for(let i=0;i<16;i++){const v=vehicle(i%4===0);v.position.set(i%2?4.4:-4.4,0,-80-i*120-Math.random()*180);traffic.push(v);scene.add(v);}}

function start(load=false){speed=0;steer=0;distance=0;fuel=100;damage=0;truck.position.set(0,0,8);truck.rotation.set(0,0,0);if(load){try{const s=JSON.parse(localStorage.getItem('kenyaTruckerSave'));if(s){distance=s.distance||0;fuel=s.fuel??100;damage=s.damage||0;money=s.money||money;truck.position.z=8-distance/10;}}catch{}}$('menu').classList.add('hidden');$('complete').classList.add('hidden');$('hud').classList.remove('hidden');running=true;paused=false;touch();toast(load?'Journey restored':'Cargo loaded — Nairobi to Nakuru');}
function save(){localStorage.setItem('kenyaTruckerSave',JSON.stringify({distance,fuel,damage,money}));}
function finish(){running=false;$('hud').classList.add('hidden');$('touch').classList.add('hidden');const pay=Math.max(0,Math.round(8500-damage*55));money+=pay;localStorage.setItem('kenyaTruckerMoney',money);localStorage.removeItem('kenyaTruckerSave');$('completeTitle').textContent='NAKURU REACHED';$('completeSummary').textContent=`Delivery complete. Truck condition: ${Math.round(100-damage)}%.`;$('earned').textContent=`+ KSh ${pay.toLocaleString()}`;$('complete').classList.remove('hidden');}
function toast(t){const e=$('toast');e.textContent=t;e.classList.add('show');clearTimeout(window.tt);window.tt=setTimeout(()=>e.classList.remove('show'),2600);}
function touch(){if(innerWidth<=760)$('touch').classList.remove('hidden');}
function input(){return{l:keys.ArrowLeft||keys.a||keys.A,r:keys.ArrowRight||keys.d||keys.D,g:keys.ArrowUp||keys.w||keys.W,b:keys.ArrowDown||keys.s||keys.S};}
function drive(dt){const i=input();const ts=(i.l?-1:0)+(i.r?1:0);steer+=(ts-steer)*Math.min(1,dt*8);if(i.g)speed+=12*dt;else speed-=2.1*dt;if(i.b)speed-=25*dt;speed=clamp(speed,0,43);truck.position.x+=steer*(speed/43)*3.4*dt;truck.position.x=clamp(truck.position.x,-7.1,7.1);truck.rotation.y+=(steer*.09-truck.rotation.y)*dt*5;truck.position.z-=speed*dt;distance+=speed*dt;fuel-=.22*dt+speed*.0015*dt*60;if(fuel<=0){fuel=0;speed=Math.max(0,speed-15*dt);toast('OUT OF FUEL — find a fuel station');}if(Math.abs(truck.position.x)>6.7&&speed>15)damage=clamp(damage+dt*1.5,0,100);checkTraffic();if(distance>=ROUTE)finish();if(performance.now()-lastSave>6500){save();lastSave=performance.now();}}
function checkTraffic(){traffic.forEach(v=>{v.position.z+=v.userData.dir*v.userData.speed*.018;if(v.position.z>truck.position.z+250)v.position.z=truck.position.z-1900-Math.random()*500;if(v.position.z<truck.position.z-2200)v.position.z=truck.position.z+300+Math.random()*500;const dz=Math.abs(v.position.z-truck.position.z),dx=Math.abs(v.position.x-truck.position.x);if(dz<5.5&&dx<2.35&&speed>5){damage=clamp(damage+.5,0,100);speed*=.72;toast('COLLISION — cargo damaged');}});}
function hud(){const km=Math.min(160,Math.round(distance/1000));$('speed').textContent=Math.round(speed*3.6);$('fuel').textContent=Math.round(fuel);$('damage').textContent=Math.round(damage);$('money').textContent=`KSh ${money.toLocaleString()}`;$('fuelBar').style.width=`${fuel}%`;$('damageBar').style.width=`${damage}%`;$('routeDistance').textContent=`${km} km / 160 km`;$('missionText').textContent=distance<52000?'Follow the A104 toward Naivasha.':distance<112000?'Rift Valley climb — watch your speed.':'Final leg — Nakuru is ahead.';const p=clamp(distance/ROUTE,0,1);$('mapTruck').style.left=`${18+p*64}%`;$('mapTruck').style.top=`${61-p*38}%`;}
function cam(dt){const t=new THREE.Vector3();if(cameraMode===0){t.set(truck.position.x*.55,5.3,truck.position.z+13);camera.position.lerp(t,1-Math.pow(.001,dt));camera.lookAt(truck.position.x,2.2,truck.position.z-18);}else{t.set(truck.position.x,3.65,truck.position.z+1.2);camera.position.lerp(t,1-Math.pow(.001,dt));camera.lookAt(truck.position.x,3.55,truck.position.z-45);}}
function toggleNight(){night=!night;scene.background.set(night?0x08121e:0x9bbfd0);scene.fog.color.set(night?0x08121e:0x9bbfd0);window.sun.intensity=night?.65:3.5;window.hemi.intensity=night?.45:2.2;window.sun.color.set(night?0x9bb8e8:0xffe7bd);toast(night?'Night driving':'Daylight driving');}
function bind(){
 $('startBtn').onclick=()=>start(false);$('continueBtn').onclick=()=>start(true);$('pauseBtn').onclick=()=>{if(running){paused=true;$('pause').classList.remove('hidden');}};$('resumeBtn').onclick=()=>{paused=false;$('pause').classList.add('hidden');};$('restartBtn').onclick=()=>start(false);$('menuBtn').onclick=()=>{running=false;paused=false;$('pause').classList.add('hidden');$('hud').classList.add('hidden');$('menu').classList.remove('hidden');$('touch').classList.add('hidden');};$('nextRouteBtn').onclick=()=>start(false);
 window.addEventListener('keydown',e=>{keys[e.key]=true;if(['ArrowUp','ArrowDown','ArrowLeft','ArrowRight',' '].includes(e.key))e.preventDefault();if(e.key.toLowerCase()==='c'){cameraMode=(cameraMode+1)%2;toast(cameraMode?'Cabin view':'Chase view');}if(e.key.toLowerCase()==='n'&&running)toggleNight();if(e.key==='Escape'&&running){paused=!paused;$('pause').classList.toggle('hidden',!paused);}});window.addEventListener('keyup',e=>keys[e.key]=false);
 document.querySelectorAll('[data-control]').forEach(b=>{const k={left:'ArrowLeft',right:'ArrowRight',accelerate:'ArrowUp',brake:'ArrowDown'}[b.dataset.control];const on=e=>{e.preventDefault();keys[k]=true};const off=e=>{e.preventDefault();keys[k]=false};b.addEventListener('pointerdown',on);b.addEventListener('pointerup',off);b.addEventListener('pointercancel',off);b.addEventListener('pointerleave',off);});
 const nightBtn=document.createElement('button');nightBtn.className='hud-button';nightBtn.textContent='☾';nightBtn.title='Toggle day/night';nightBtn.onclick=toggleNight;$('pauseBtn').before(nightBtn);
 const camBtn=$('touchCamera');if(camBtn)camBtn.onclick=()=>{cameraMode=(cameraMode+1)%2;toast(cameraMode?'Cabin view':'Chase view');};
}
function loop(){const dt=Math.min(clock.getDelta(),.04);if(running&&!paused){drive(dt);hud();}cam(dt);renderer.render(scene,camera);}
function resize(){camera.aspect=innerWidth/innerHeight;camera.updateProjectionMatrix();renderer.setSize(innerWidth,innerHeight);if(running)touch();}
