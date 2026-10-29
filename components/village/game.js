import * as THREE from "three";
import { GLTFLoader } from "https://cdn.jsdelivr.net/npm/three@0.164.1/examples/jsm/loaders/GLTFLoader.js";
(() => {
const root=document.getElementById("world"); if(!root||root.dataset.ready==="1")return;root.dataset.ready="1";
const $=id=>document.getElementById(id),defaults={x:0,z:4,coins:30,xp:0,level:1,flowers:0,outfit:"lavender",mood:null,watered:false,foundShell:false,nav:"village"};
let state={...defaults};try{const s=JSON.parse(localStorage.getItem("mongleMindSave")||"null");if(s)state={...state,...s}}catch(e){}
if(typeof state.x!=="number"||Math.abs(state.x)>20)state.x=0;if(typeof state.z!=="number"||Math.abs(state.z)>20)state.z=4;
let keys={},toastTimer,breathTimer,breathStep=0,breathing=false,last=0;
const colors={lavender:0xb7a5e5,peach:0xefb39e,mint:0x9acdb5},names={lavender:"라벤더 룩",peach:"피치 룩",mint:"민트 룩"},moodNames={calm:"차분한 마음을 기록했어요.",happy:"기쁜 마음을 기록했어요.",tired:"지친 마음을 기록했어요.",worried:"걱정되는 마음을 기록했어요."};
const scene=new THREE.Scene();scene.background=new THREE.Color(0xbadcf3);scene.fog=new THREE.Fog(0xd5e7ce,28,60);
const camera=new THREE.PerspectiveCamera(43,1,.1,120);camera.position.set(0,16,21);
const renderer=new THREE.WebGLRenderer({antialias:true});renderer.setPixelRatio(Math.min(devicePixelRatio||1,2));renderer.shadowMap.enabled=true;renderer.shadowMap.type=THREE.PCFSoftShadowMap;renderer.outputColorSpace=THREE.SRGBColorSpace;renderer.toneMapping=THREE.ACESFilmicToneMapping;renderer.toneMappingExposure=1.15;root.replaceChildren(renderer.domElement);
scene.add(new THREE.HemisphereLight(0xfff7ed,0x78936c,2));const sun=new THREE.DirectionalLight(0xffefd7,3);sun.position.set(-8,17,10);sun.castShadow=true;sun.shadow.mapSize.set(1024,1024);scene.add(sun);
const M=c=>new THREE.MeshStandardMaterial({color:c,roughness:.86}),m={grass:M(0x9fc88d),path:M(0xe9d8bb),path2:M(0xf6e9d2),wood:M(0x986b54),cream:M(0xffead7),roof:M(0xc78391),roof2:M(0xe4a5a6),leaf:M(0x6f9d72),leaf2:M(0x9bc58c),leaf3:M(0xb8d59d),water:M(0x7fc4d1),white:M(0xfff9ef),skin:M(0xf5d4c1),hair:M(0x76515a),dark:M(0x43343b),pink:M(0xf1b5c5),gold:M(0xf1c76f),pinks:M(0xf3a4c4),lilac:M(0xc8a9ec),yellow:M(0xffdc85)};
function add(g,mat,parent,x,y,z,sx=1,sy=1,sz=1){const o=new THREE.Mesh(g,mat);o.position.set(x,y,z);o.scale.set(sx,sy,sz);o.castShadow=true;o.receiveShadow=true;parent.add(o);return o}
function box(parent,x,y,z,w,h,d,mat){return add(new THREE.BoxGeometry(w,h,d),mat,parent,x,y,z)}
function ball(parent,x,y,z,sx,sy,sz,mat){return add(new THREE.SphereGeometry(1,18,12),mat,parent,x,y,z,sx,sy,sz)}
const ground=add(new THREE.PlaneGeometry(90,90),m.grass,scene,0,-.12,0,1,1,1);ground.rotation.x=-Math.PI/2;
for(let i=0;i<15;i++){const p=box(scene,Math.sin(i*.28)*1.6,.01,11-i*1.55,4.2,.07,1.65,i%3?m.path:m.path2);p.rotation.y=Math.sin(i*.28)*-.1}
const pond=add(new THREE.CylinderGeometry(3,3,.15,40),m.water,scene,7,.03,1,1,1,.72);const rim=add(new THREE.TorusGeometry(3,.16,8,40),m.white,scene,7,.12,1,1,1,.72);rim.rotation.x=Math.PI/2;
const house=new THREE.Group();scene.add(house);house.position.set(-5,0,-5);box(house,0,1.1,0,5.3,2.2,4,m.cream);const r1=box(house,-1.3,2.45,0,3.2,.2,4.8,m.roof);r1.rotation.z=-.52;const r2=box(house,1.3,2.45,0,3.2,.2,4.8,m.roof2);r2.rotation.z=.52;box(house,0,.85,2.04,1,1.65,.15,m.wood);ball(house,.3,.85,2.15,.06,.06,.04,m.gold);for(const x of [-1.6,1.6]){box(house,x,1.35,2.05,.8,.7,.12,M(0x9cced8));box(house,x,1.35,2.12,.07,.7,.04,m.white);box(house,x,1.35,2.12,.8,.07,.04,m.white)}
function tree(x,z,s=1){const g=new THREE.Group();scene.add(g);g.position.set(x,0,z);g.scale.setScalar(s);add(new THREE.CylinderGeometry(.2,.28,1.5,10),m.wood,g,0,.75,0);ball(g,0,1.95,0,.95,1.05,.9,m.leaf);ball(g,-.52,1.75,.02,.7,.75,.7,m.leaf2);ball(g,.55,1.8,-.03,.7,.8,.7,m.leaf3);ball(g,-.15,2.48,.1,.62,.68,.6,m.leaf2)}
[[-10,-8,1.2],[-9,1,.9],[-10,7,1.1],[10,-8,1.2],[11,-2,.95],[10,8,1.1],[4,-10,.8],[-2,-12,.8]].forEach(a=>tree(...a));
const flowerGroups=[];function flower(x,z,color,scale=1){const g=new THREE.Group();scene.add(g);g.position.set(x,0,z);g.scale.setScalar(scale);add(new THREE.CylinderGeometry(.025,.04,.42,7),M(0x6f9d68),g,0,.22,0);for(let i=0;i<5;i++){let a=i*Math.PI*2/5;ball(g,Math.cos(a)*.14,.46,Math.sin(a)*.14,.12,.08,.12,color)}ball(g,0,.48,0,.075,.07,.075,m.gold);flowerGroups.push(g)}
function bed(x,z){box(scene,x,.08,z,4.1,.17,2.1,M(0x7c9d68));box(scene,x,.17,z,3.8,.1,1.8,M(0x80624c));const cs=[m.pinks,m.yellow,m.white,m.lilac];for(let i=0;i<5;i++)for(let j=0;j<2;j++)flower(x-1.5+i*.75,z-.45+j*.85,cs[(i+j)%4],.72)}
bed(-7,2.8);bed(1,-1.2);bed(7,7);for(let i=0;i<42;i++){let x=Math.sin(i*12.3)*12,z=Math.cos(i*7.1)*11;if(Math.abs(x)<3&&z>0&&z<10)continue;flower(x,z,[m.pinks,m.yellow,m.white,m.lilac][i%4],.45+(i%3)*.1)}
for(let i=0;i<7;i++){box(scene,-10+i*.62,.43,4.8,.12,.86,.12,m.white);if(i<6)box(scene,-9.7+i*.62,.52,4.8,.58,.12,.12,M(0xb98767))}
function lamp(x,z){add(new THREE.CylinderGeometry(.07,.1,1.3,10),m.wood,scene,x,.65,z);box(scene,x,1.36,z,.48,.4,.48,m.cream);ball(scene,x,1.36,z,.12,.13,.12,m.gold);const l=new THREE.PointLight(0xffd69b,.5,4);l.position.set(x,1.5,z);scene.add(l)}lamp(-2,-1);lamp(3,4);lamp(-8,6);
// 외부 3D 캐릭터 불러오기
const avatar = new THREE.Group();
scene.add(avatar);

// 의상 색상은 기존 UI와 호환되도록 유지
const outfitMat = M(colors[state.outfit] || colors.lavender);
const limbs = [];

// 캐릭터 발밑의 부드러운 그림자
const avatarShadow = add(
  new THREE.CircleGeometry(0.65, 24),
  new THREE.MeshBasicMaterial({
    color: 0x536d4b,
    transparent: true,
    opacity: 0.16
  }),
  avatar,
  0,
  0.025,
  0
);
avatarShadow.rotation.x = -Math.PI / 2;

// GitHub에 업로드한 GLB 모델 주소
const characterUrl =
  "https://raw.githubusercontent.com/boyoung0819/mongle-mind/main/components/village/character.glb";

const characterLoader = new GLTFLoader();

characterLoader.load(
  characterUrl,

  // 모델 로딩 성공
  (gltf) => {
    const character = gltf.scene;

    // 모델의 크기와 중심을 계산
    const bounds = new THREE.Box3().setFromObject(character);
    const size = bounds.getSize(new THREE.Vector3());
    const center = bounds.getCenter(new THREE.Vector3());

    // 모델 높이를 약 3단위로 자동 조절
    const height = Math.max(size.y, 0.001);
    const scale = 3 / height;
    character.scale.setScalar(scale);

    // 발바닥이 땅에 닿도록 위치 조정
    character.position.set(
      -center.x * scale,
      -bounds.min.y * scale,
      -center.z * scale
    );

    // 그림자 설정 및 의상 재질 색상 변경 지원
    character.traverse((object) => {
      if (!object.isMesh) return;

      object.castShadow = true;
      object.receiveShadow = true;

      const materials = Array.isArray(object.material)
        ? object.material
        : [object.material];

      const materialNames = materials
        .map((material) => material?.name || "")
        .join(" ")
        .toLowerCase();

      const objectName = (
        (object.name || "") + " " + materialNames
      ).toLowerCase();

      if (
        /dress|outfit|cloth|skirt|衣服|원피스|옷/.test(objectName)
      ) {
        const newMaterials = materials.map((material) => {
          const copy = material.clone();

          if (copy.color) {
            copy.color.setHex(colors[state.outfit] || colors.lavender);
          }

          return copy;
        });

        object.material = Array.isArray(object.material)
          ? newMaterials
          : newMaterials[0];
      }
    });

    avatar.add(character);
    console.log("몽글마음 3D 캐릭터 로딩 완료!");
  },

  // 로딩 진행 상황
  undefined,

  // 로딩 실패
  (error) => {
    console.error("character.glb 로딩 실패:", error);
    toast(
      "3D 캐릭터를 불러오지 못했어요. GitHub 파일 주소와 공개 설정을 확인해 주세요."
    );
  }
);
const pet=new THREE.Group();scene.add(pet);ball(pet,0,.42,0,.45,.36,.4,m.white);ball(pet,0,.78,-.02,.34,.32,.32,m.white);for(const x of [-.21,.21]){ball(pet,x,1.02,-.02,.12,.22,.12,M(0xe5c4bd));ball(pet,x*.6,.8,.28,.03,.04,.02,m.dark);ball(pet,x*.9,.69,.28,.06,.035,.02,m.pink)}ball(pet,0,.72,.3,.045,.035,.02,M(0x9d777a));
const shell=new THREE.Group();scene.add(shell);shell.position.set(8,.15,5);ball(shell,0,.1,0,.22,.11,.17,M(0xf4d6a2));for(let i=-1;i<=1;i++){let q=add(new THREE.TorusGeometry(.09,.01,5,12,Math.PI),m.white,shell,i*.06,.14,0);q.rotation.x=Math.PI/2}
const $sceneStatus=$("sceneStatus");
function save(){try{localStorage.setItem("mongleMindSave",JSON.stringify(state))}catch(e){}updateUI()}
function updateUI(){$("coins").textContent=state.coins;$("level").textContent=state.level;$("xp").textContent=state.xp;$("flowers").textContent=state.flowers;$("outfitLabel").textContent=names[state.outfit]||names.lavender;document.querySelectorAll(".outfit").forEach(b=>b.classList.toggle("active",b.dataset.outfit===state.outfit));document.querySelectorAll(".mood").forEach(b=>b.classList.toggle("selected",b.dataset.mood===state.mood));$("moodSaved").textContent=state.mood?moodNames[state.mood]:"기분을 기록하지 않아도 괜찮아요.";document.querySelectorAll(".nav-item").forEach(b=>b.classList.toggle("active",b.dataset.nav===state.nav))}
function toast(s){const e=$("toast");e.textContent=s;e.classList.add("show");clearTimeout(toastTimer);toastTimer=setTimeout(()=>e.classList.remove("show"),2400)}
function levelUp(){while(state.xp>=100){state.xp-=100;state.level++;state.coins+=15;toast("레벨 업! 코인 +15")}save()}
function xp(n){state.xp+=n;levelUp()}
function closeDialog(){$("dialog").hidden=true} $("closeDialog").addEventListener("click",closeDialog);
function dialog(name,text,actions=[]){$("dialogName").textContent=name;$("dialogText").textContent=text;const h=$("dialogActions");h.replaceChildren();actions.forEach(a=>{const b=document.createElement("button");b.textContent=a.label;b.onclick=a.action;h.appendChild(b)});$("dialog").hidden=false}
function target(){const a=[{id:"garden",x:-7,z:2.8,r:2.7,label:"꽃 돌보기"},{id:"animal",x:2.5,z:5.7,r:2.5,label:"포근이 만나기"},{id:"house",x:-5,z:-1.5,r:3,label:"집 앞에서 쉬기"},{id:"shell",x:8,z:5,r:1.8,label:"숨겨진 조개"}];return a.find(t=>Math.hypot(avatar.position.x-t.x,avatar.position.z-t.z)<t.r&&!(t.id==="shell"&&state.foundShell))}
function interact(){let t=target();if(!t){toast("꽃밭이나 친구 가까이 다가가 E를 눌러 보세요.");return}if(t.id==="garden")dialog("작은 꽃밭","꽃들이 햇살을 머금고 있어요. 꽃을 돌보거나 잠시 바라봐도 좋아요.",[{label:"꽃에 물 주기",action:()=>{state.watered=true;state.flowers++;state.coins+=5;xp(10);save();closeDialog();toast("꽃 1개와 코인 5개를 얻었어요.")}},{label:"꽃 구경하기",action:()=>{closeDialog();toast("꽃을 천천히 바라보는 것도 좋아요.")}}]);else if(t.id==="animal")dialog("포근이","안녕! 나는 포근이야. 여기서는 서두르지 않아도 돼.",[{label:"인사하기",action:()=>{xp(5);closeDialog();toast("포근이와 인사했어요. 경험치 +5")}},{label:"꽃 선물하기 (꽃 1개)",action:()=>{if(state.flowers<1){toast("먼저 정원에서 꽃을 모아 봐요.");return}state.flowers--;state.coins+=10;save();closeDialog();toast("포근이가 기뻐해요! 코인 +10")} }]);else if(t.id==="shell"){state.foundShell=true;state.coins+=8;xp(8);shell.visible=false;closeDialog();toast("반짝이는 조개 발견! 코인 +8")}else dialog("작은 집","오늘 하루도 여기까지 온 것만으로 충분해요. 잠시 쉬어 가요.",[{label:"정원 둘러보기",action:()=>{state.nav="garden";avatar.position.set(-7,0,2.8);save();closeDialog()}},{label:"산책 계속하기",action:closeDialog}])}
document.querySelectorAll(".outfit").forEach(b=>b.onclick=()=>{state.outfit=b.dataset.outfit;outfitMat.color.setHex(colors[state.outfit]);save();toast(names[state.outfit]+"으로 갈아입었어요.")});
document.querySelectorAll(".mood").forEach(b=>b.onclick=()=>{state.mood=b.dataset.mood;save();toast("오늘의 마음을 기록했어요. 기록은 평가되지 않아요.")});
document.querySelectorAll(".nav-item").forEach(b=>b.onclick=()=>{state.nav=b.dataset.nav;save();if(state.nav==="garden")avatar.position.set(-7,0,2.8);if(state.nav==="village")avatar.position.set(0,0,4);toast(({village:"마을을 천천히 둘러봐요.",garden:"정원에 도착했어요.",room:"내 방 꾸미기는 다음 단계에서 확장할게요.",journal:"오늘의 마음을 오른쪽에서 기록할 수 있어요."})[state.nav])});
function stopBreath(){breathing=false;clearTimeout(breathTimer);$("breathBox").hidden=true;$("breathLabel").textContent="함께 천천히 호흡하기";$("breathCircle").classList.remove("expand")}
$("breathBtn").onclick=()=>{if(breathing){stopBreath();return}breathing=true;breathStep=0;$("breathBox").hidden=false;$("breathLabel").textContent="호흡 활동 진행 중";$("breathInstruction").textContent="편안한 만큼만 따라 해요. 언제든 그만할 수 있어요.";const c=$("breathCircle"),t=$("breathText"),steps=[["천천히 들이쉬어요",true],["편안하게 내쉬어요",false]];function tick(){if(!breathing)return;let s=steps[breathStep++%2];t.textContent=s[0];c.classList.toggle("expand",s[1]);breathTimer=setTimeout(tick,4000)}tick();breathTimer=setTimeout(stopBreath,30000)};$("stopBreath").onclick=stopBreath;
window.addEventListener("keydown",e=>{keys[e.key.toLowerCase()]=true;if(["ArrowUp","ArrowDown","ArrowLeft","ArrowRight"," "].includes(e.key))e.preventDefault();if(e.key.toLowerCase()==="e"&&$("dialog").hidden)interact();if(e.key==="Escape")closeDialog()});window.addEventListener("keyup",e=>keys[e.key.toLowerCase()]=false);window.addEventListener("blur",()=>keys={});
document.querySelectorAll(".touch-pad button").forEach(b=>{let k=b.dataset.k.toLowerCase(),start=e=>{e.preventDefault();keys[k]=true},end=e=>{e.preventDefault();keys[k]=false};b.addEventListener("pointerdown",start);b.addEventListener("pointerup",end);b.addEventListener("pointerleave",end);b.addEventListener("pointercancel",end)});
renderer.domElement.addEventListener("pointerdown",e=>{if(e.target.closest("button"))return;const r=renderer.domElement.getBoundingClientRect(),ray=new THREE.Raycaster();ray.setFromCamera(new THREE.Vector2((e.clientX-r.left)/r.width*2-1,-(e.clientY-r.top)/r.height*2+1),camera);const p=new THREE.Vector3();if(ray.ray.intersectPlane(new THREE.Plane(new THREE.Vector3(0,1,0),0),p))avatar.userData.dest=new THREE.Vector3(THREE.MathUtils.clamp(p.x,-13,13),0,THREE.MathUtils.clamp(p.z,-13,13))});
avatar.position.set(THREE.MathUtils.clamp(state.x,-13,13),0,THREE.MathUtils.clamp(state.z,-13,13));if(state.foundShell)shell.visible=false;updateUI();
function resize(){let w=Math.max(root.clientWidth,320),h=Math.max(root.clientHeight,320);renderer.setSize(w,h,false);camera.aspect=w/h;camera.updateProjectionMatrix()}new ResizeObserver(resize).observe(root);resize();
function animate(t){requestAnimationFrame(animate);let dt=Math.min((t-last)/1000||0,.05);last=t;if($("dialog").hidden){let dx=0,dz=0;if(keys.arrowleft||keys.a)dx--;if(keys.arrowright||keys.d)dx++;if(keys.arrowup||keys.w)dz--;if(keys.arrowdown||keys.s)dz++;if(avatar.userData.dest){let v=avatar.userData.dest.clone().sub(avatar.position);v.y=0;if(v.length()<.2)avatar.userData.dest=null;else{v.normalize();dx=v.x;dz=v.z}}if(dx||dz){let len=Math.hypot(dx,dz);dx/=len;dz/=len;avatar.position.x=THREE.MathUtils.clamp(avatar.position.x+dx*dt*4,-13,13);avatar.position.z=THREE.MathUtils.clamp(avatar.position.z+dz*dt*4,-13,13);avatar.rotation.y=Math.atan2(dx,dz);limbs.forEach(l=>l.o.rotation.x=Math.sin(t*.012)*(l.kind==="leg"?.45:.22)*l.side)}else limbs.forEach(l=>l.o.rotation.x=0)}avatar.position.y=Math.sin(t*.0025)*.035;pet.position.set(avatar.position.x+.9,Math.abs(Math.sin(t*.003))*.05,avatar.position.z+1);pet.rotation.y=Math.sin(t*.001)*.15;camera.position.lerp(new THREE.Vector3(avatar.position.x,16,avatar.position.z+21),.04);camera.lookAt(avatar.position.x,0,avatar.position.z-1);let near=target();$("sceneStatus").textContent=near?`E · ${near.label}`:"나만의 속도로 산책해요";renderer.render(scene,camera)}requestAnimationFrame(animate);
})();
