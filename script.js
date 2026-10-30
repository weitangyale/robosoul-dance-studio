(() => {
'use strict';
const host=document.getElementById('robot');
const scene=new THREE.Scene();scene.background=new THREE.Color(0xf0f5fa);
const camera=new THREE.PerspectiveCamera(42,1,.1,100);camera.position.set(4.8,3.1,7.8);
const renderer=new THREE.WebGLRenderer({antialias:true});renderer.setPixelRatio(Math.min(devicePixelRatio,2));host.appendChild(renderer.domElement);
const controls=new THREE.OrbitControls(camera,renderer.domElement);controls.target.set(0,1.85,0);controls.enableDamping=true;controls.minDistance=3;controls.maxDistance=15;camera.lookAt(controls.target);
scene.add(new THREE.HemisphereLight(0xffffff,0x8293a6,1.2));const sun=new THREE.DirectionalLight(0xffffff,1.2);sun.position.set(4,8,6);scene.add(sun);
const mat=(c)=>new THREE.MeshStandardMaterial({color:c,roughness:.55,metalness:.12});const white=mat(0xe9eef4),dark=mat(0x3b4554),metal=mat(0x9ba9b7),blue=mat(0x00a9ff),black=mat(0x152638);
function box(parent,w,h,d,x,y,z,m){const o=new THREE.Mesh(new THREE.BoxGeometry(w,h,d),m);o.position.set(x,y,z);parent.add(o);return o}
function sphere(parent,r,x,y,z,m){const o=new THREE.Mesh(new THREE.SphereGeometry(r,16,12),m);o.position.set(x,y,z);parent.add(o);return o}
function pivot(parent,x,y,z){const o=new THREE.Group();o.position.set(x,y,z);parent.add(o);return o}
const robot=new THREE.Group();scene.add(robot);
box(robot,1.24,1.02,.56,0,2.75,0,white);box(robot,1.12,.10,.59,0,3.24,0,metal);box(robot,.87,.26,.48,0,2.12,0,metal);
box(robot,.18,.19,.18,0,3.38,0,metal);box(robot,.68,.57,.48,0,3.76,0,white);
box(robot,.56,.23,.51,0,3.78,.015,black);sphere(robot,.10,-.16,3.78,.285,blue);sphere(robot,.10,.16,3.78,.285,blue);
// Chest label is a canvas texture, mapped onto a flat panel facing +Z.
const canvas=document.createElement('canvas');canvas.width=1024;canvas.height=1024;
const ctx=canvas.getContext('2d');ctx.fillStyle='#ffffff';ctx.fillRect(0,0,1024,1024);
ctx.fillStyle='#173d63';ctx.textAlign='center';ctx.textBaseline='middle';
const lines=['Las Cruces','Academy','Computing','Club'];
ctx.font='bold 112px Arial';
lines.forEach((line,i)=>ctx.fillText(line,512,170+i*225,960));
const labelTexture=new THREE.CanvasTexture(canvas);
const label=new THREE.Mesh(new THREE.PlaneGeometry(1.03,.76),new THREE.MeshBasicMaterial({map:labelTexture,side:THREE.DoubleSide}));
label.position.set(0,2.77,.287);robot.add(label);
const joints=[];
function register(name,parent,axis,min,max){joints.push({name,parent,axis,min,max});return parent}
function arm(side){const s=side==='Left'?-1:1;const shoulder=pivot(robot,s*.75,3.11,0);sphere(shoulder,.16,0,0,0,metal);
register(side+' shoulder forward',shoulder,'x',-180,90);
const roll=pivot(shoulder,0,0,0);register(side+' shoulder sideways',roll,'z',side==='Left'?-180:0,side==='Left'?0:180);
box(roll,.31,.66,.34,0,-.38,0,white);box(roll,.32,.24,.36,0,-.25,0,dark);
const elbow=pivot(roll,0,-.78,0);sphere(elbow,.13,0,0,0,metal);register(side+' elbow',elbow,'x',-125,0);
box(elbow,.26,.60,.30,0,-.36,0,white);box(elbow,.31,.14,.33,0,-.57,0,dark);box(elbow,.23,.24,.25,0,-.77,.02,metal);
}
function leg(side){const s=side==='Left'?-1:1;const hip=pivot(robot,s*.36,2.05,0);sphere(hip,.16,0,0,0,metal);register(side+' hip forward',hip,'x',-85,85);
const hipRoll=pivot(hip,0,0,0);register(side+' hip sideways',hipRoll,'z',side==='Left'?-45:0,side==='Left'?0:45);
box(hipRoll,.43,.75,.43,0,-.45,0,white);box(hipRoll,.44,.24,.45,0,-.29,0,dark);
const knee=pivot(hipRoll,0,-.90,0);sphere(knee,.15,0,0,0,metal);register(side+' knee',knee,'x',0,120);
box(knee,.38,.69,.40,0,-.42,0,white);box(knee,.40,.22,.43,0,-.30,0,dark);
const ankle=pivot(knee,0,-.87,0);sphere(ankle,.13,0,0,0,metal);register(side+' ankle forward',ankle,'x',-55,55);
const ankleRoll=pivot(ankle,0,0,0);register(side+' ankle sideways',ankleRoll,'z',-35,35);
box(ankleRoll,.43,.17,.76,0,-.11,.18,white);box(ankleRoll,.43,.07,.76,0,-.21,.18,dark);
}
arm('Left');arm('Right');leg('Left');leg('Right');
const sliders=document.getElementById('sliders');joints.forEach((j,i)=>{const div=document.createElement('div');div.className='joint';const label=document.createElement('label');const name=document.createElement('span');name.textContent=String(i+1).padStart(2,'0')+' · '+j.name;const value=document.createElement('output');value.textContent='0°';label.append(name,value);const input=document.createElement('input');input.type='range';input.min=j.min;input.max=j.max;input.value=0;input.step=1;input.addEventListener('input',()=>{j.parent.rotation[j.axis]=Number(input.value)*Math.PI/180;value.textContent=input.value+'°'});div.append(label,input);sliders.appendChild(div);j.input=input;j.value=value});
function getPose(){return joints.map(j=>Number(j.input.value))}
function setPose(pose){joints.forEach((j,i)=>{const angle=Math.max(j.min,Math.min(j.max,Number(pose[i])||0));j.parent.rotation[j.axis]=angle*Math.PI/180;j.input.value=angle;j.value.textContent=angle+'°'})}
const status=document.getElementById('status');
function announce(msg){status.textContent=msg}
let savedPoses=[],frames=[],playing=false,playToken=0,selected=-1;
function stopPlayback(){playing=false;playToken++;document.getElementById('playDance').disabled=false}
function resetPose(){stopPlayback();setPose(Array(joints.length).fill(0));announce('Reset to neutral pose.')}
document.getElementById('reset').addEventListener('click',resetPose);
function validPose(p){return Array.isArray(p)&&p.length===joints.length&&p.every(x=>typeof x==='number'&&Number.isFinite(x))}
function durationValue(){const el=document.getElementById('frameDuration');const ms=Number(el.value);return Number.isFinite(ms)?Math.max(100,Math.min(10000,Math.round(ms))):600}
function makeButton(label,action){const b=document.createElement('button');b.textContent=label;b.addEventListener('click',action);return b}
function renderPoses(){
 const list=document.getElementById('savedPoses');list.replaceChildren();
 if(!savedPoses.length){list.textContent='No saved poses yet.';return}
 savedPoses.forEach((p,i)=>{
  const item=document.createElement('div');item.className='item item-line';
  const name=document.createElement('span');name.textContent=p.name;
  const actions=document.createElement('div');actions.className='item-actions';
  actions.append(
   makeButton('Apply',()=>{stopPlayback();setPose(p.angles);announce('Applied '+p.name)}),
   makeButton('Add to Dance',()=>{
    stopPlayback();frames.push({duration:durationValue(),angles:p.angles.slice()});
    selected=frames.length-1;renderFrames();announce('Added '+p.name+' as frame '+frames.length);
   }),
   makeButton('Delete',()=>{savedPoses.splice(i,1);renderPoses()})
  );
  item.append(name,actions);list.append(item);
 });
}
function renderFrames(){const list=document.getElementById('timeline');list.replaceChildren();document.getElementById('frameCount').textContent=frames.length+' frame'+(frames.length===1?'':'s');if(!frames.length){list.textContent='No frames yet. Add Frame to build a dance.';return}frames.forEach((f,i)=>{const item=document.createElement('div');item.className='item'+(i===selected?' selected':'');const top=document.createElement('div');top.className='item-line';const name=document.createElement('strong');name.textContent='Frame '+(i+1);const d=document.createElement('input');d.type='number';d.min=100;d.max=10000;d.step=100;d.value=f.duration;d.title='Duration in milliseconds';d.addEventListener('change',()=>{const v=Number(d.value);f.duration=Number.isFinite(v)?Math.max(100,Math.min(10000,Math.round(v))):600;d.value=f.duration});const ms=document.createElement('span');ms.textContent='ms';top.append(name,d,ms);const actions=document.createElement('div');actions.className='item-actions';actions.append(makeButton('View',()=>{stopPlayback();selected=i;setPose(f.angles);renderFrames();announce('Viewing frame '+(i+1))}),makeButton('Update',()=>{stopPlayback();f.angles=getPose();selected=i;renderFrames();announce('Updated frame '+(i+1))}),makeButton('↑',()=>{if(i>0){[frames[i-1],frames[i]]=[frames[i],frames[i-1]];selected=-1;renderFrames()}}),makeButton('↓',()=>{if(i<frames.length-1){[frames[i+1],frames[i]]=[frames[i],frames[i+1]];selected=-1;renderFrames()}}),makeButton('Delete',()=>{stopPlayback();frames.splice(i,1);selected=-1;renderFrames()}));item.append(top,actions);list.append(item)})}
document.getElementById('savePose').addEventListener('click',()=>{stopPlayback();savedPoses.push({name:'Pose '+(savedPoses.length+1),angles:getPose()});renderPoses();announce('Pose saved. Use Apply to recall it.')});
document.getElementById('addFrame').addEventListener('click',()=>{stopPlayback();frames.push({duration:durationValue(),angles:getPose()});selected=frames.length-1;renderFrames();announce('Added frame '+frames.length)});
function lerpPose(a,b,t){return a.map((v,i)=>v+(b[i]-v)*t)}
async function playDance(){if(!frames.length){announce('Add at least one frame first.');return}stopPlayback();playing=true;const token=playToken;document.getElementById('playDance').disabled=true;announce('Playing '+frames.length+' frames…');let from=getPose();for(let i=0;i<frames.length;i++){if(!playing||token!==playToken)return;selected=i;renderFrames();const to=frames[i].angles.slice();const duration=frames[i].duration;const start=performance.now();await new Promise(resolve=>{function tick(now){if(!playing||token!==playToken){resolve();return}const t=Math.min(1,(now-start)/duration);setPose(lerpPose(from,to,t));if(t<1)requestAnimationFrame(tick);else resolve()}requestAnimationFrame(tick)});from=to}if(token===playToken){playing=false;document.getElementById('playDance').disabled=false;announce('Dance complete!')}}
document.getElementById('playDance').addEventListener('click',playDance);
document.getElementById('stopDance').addEventListener('click',()=>{stopPlayback();announce('Playback stopped.')});
document.getElementById('downloadDance').addEventListener('click',()=>{const data={format:'RoboSoulDanceStudio',version:1,joints:joints.map(j=>({name:j.name,min:j.min,max:j.max})),poses:savedPoses,frames};const blob=new Blob([JSON.stringify(data,null,2)],{type:'application/json'});const url=URL.createObjectURL(blob);const a=document.createElement('a');a.href=url;a.download='las-cruces-academy-dance.json';a.click();setTimeout(()=>URL.revokeObjectURL(url),1000);announce('Dance JSON downloaded.')});
document.getElementById('loadDance').addEventListener('change',async e=>{const file=e.target.files[0];if(!file)return;try{const data=JSON.parse(await file.text());if(data.format!=='RoboSoulDanceStudio'||data.version!==1||!Array.isArray(data.frames)||data.frames.length>2000||!data.frames.every(f=>validPose(f.angles)&&Number.isFinite(f.duration)&&f.duration>=100&&f.duration<=10000)||!Array.isArray(data.poses)||data.poses.length>2000||!data.poses.every(p=>typeof p.name==='string'&&validPose(p.angles))||!Array.isArray(data.joints)||data.joints.length!==joints.length||!data.joints.every((j,i)=>j.name===joints[i].name))throw Error('Incompatible or invalid dance JSON');stopPlayback();frames=data.frames.map(f=>({angles:f.angles.slice(),duration:f.duration}));savedPoses=data.poses.map(p=>({name:p.name.slice(0,80),angles:p.angles.slice()}));selected=-1;renderFrames();renderPoses();announce('Dance loaded: '+frames.length+' frames.')}catch(err){announce('Could not load: '+err.message)}e.target.value=''});
renderPoses();renderFrames();

const floor=new THREE.Mesh(new THREE.PlaneGeometry(100,100),new THREE.MeshStandardMaterial({color:0xe0e8ef}));floor.rotation.x=-Math.PI/2;floor.position.y=-.05;scene.add(floor);const grid=new THREE.GridHelper(12,24,0xb8c9d8,0xd6e0e8);grid.position.y=-.04;scene.add(grid);
function resize(){const w=host.clientWidth,h=host.clientHeight;camera.aspect=w/h;camera.updateProjectionMatrix();renderer.setSize(w,h,false)}window.addEventListener('resize',resize);resize();
function animate(){requestAnimationFrame(animate);controls.update();renderer.render(scene,camera)}animate();
})();
