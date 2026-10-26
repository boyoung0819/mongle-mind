
(() => {
  const canvas = document.getElementById('world');
  if (!canvas || canvas.dataset.ready === '1') return;
  canvas.dataset.ready = '1';
  const ctx = canvas.getContext('2d');
  const W = canvas.width, H = canvas.height;
  const $ = id => document.getElementById(id);
  const defaults = {x:480,y:340,coins:30,xp:0,level:1,flowers:0,outfit:'lavender',mood:null,watered:false,foundShell:false,nav:'village'};
  let state = {...defaults};
  try { const saved = JSON.parse(localStorage.getItem('mongleMindSave') || 'null'); if (saved) state = {...state,...saved}; } catch(e) {}
  let keys = {}, toastTimer, breathTimer, breathStep = 0, breathing = false;
  const outfits = {lavender:'#b7a5e5',peach:'#efb39e',mint:'#9acdb5'};
  const outfitNames = {lavender:'라벤더 룩',peach:'피치 룩',mint:'민트 룩'};
  const moodNames = {calm:'차분한 마음을 기록했어요.',happy:'기쁜 마음을 기록했어요.',tired:'지친 마음을 기록했어요.',worried:'걱정되는 마음을 기록했어요.'};
  const flowerBeds = [{x:270,y:300},{x:310,y:330},{x:350,y:300},{x:675,y:300},{x:715,y:330}];
  function save(){ try{localStorage.setItem('mongleMindSave',JSON.stringify(state));}catch(e){} updateUI(); }
  function updateUI(){
    $('coins').textContent=state.coins; $('level').textContent=state.level; $('xp').textContent=state.xp;
    $('flowers').textContent=state.flowers; $('outfitLabel').textContent=outfitNames[state.outfit]||'라벤더 룩';
    document.querySelectorAll('.outfit').forEach(b=>b.classList.toggle('active',b.dataset.outfit===state.outfit));
    document.querySelectorAll('.mood').forEach(b=>b.classList.toggle('selected',b.dataset.mood===state.mood));
    $('moodSaved').textContent=state.mood?moodNames[state.mood]:'기분을 기록하지 않아도 괜찮아요.';
    document.querySelectorAll('.nav-item').forEach(b=>b.classList.toggle('active',b.dataset.nav===state.nav));
  }
  function toast(msg){const el=$('toast');el.textContent=msg;el.classList.add('show');clearTimeout(toastTimer);toastTimer=setTimeout(()=>el.classList.remove('show'),2200);}
  function ellipse(x,y,rx,ry,color){ctx.fillStyle=color;ctx.beginPath();ctx.ellipse(x,y,rx,ry,0,0,Math.PI*2);ctx.fill();}
  function rounded(x,y,w,h,r,color){ctx.fillStyle=color;ctx.beginPath();ctx.roundRect(x,y,w,h,r);ctx.fill();}
  function drawFlower(x,y,scale=1,petal='#f3a9c2'){
    ctx.strokeStyle='#6e9c77';ctx.lineWidth=3*scale;ctx.beginPath();ctx.moveTo(x,y+9*scale);ctx.lineTo(x,y+25*scale);ctx.stroke();
    ellipse(x-5*scale,y+18*scale,5*scale,2.5*scale,'#8fbd8b');ellipse(x+5*scale,y+21*scale,5*scale,2.5*scale,'#8fbd8b');
    for(let i=0;i<5;i++){let a=i*Math.PI*2/5;ellipse(x+Math.cos(a)*6*scale,y+Math.sin(a)*6*scale,4.5*scale,4.5*scale,petal);}
    ellipse(x,y,3.2*scale,3.2*scale,'#f5d47e');
  }
  function drawTree(x,y,s=1){
    ellipse(x,y+28*s,24*s,8*s,'#b2caa6');
    rounded(x-4*s,y+2*s,8*s,30*s,4*s,'#b98970');
    ellipse(x,y-12*s,22*s,24*s,'#8fbd91');ellipse(x-13*s,y-2*s,14*s,16*s,'#a8cda2');ellipse(x+13*s,y-2*s,14*s,16*s,'#79ad83');
    ellipse(x-6*s,y-18*s,3*s,3*s,'#c4dfb7');
  }
  function drawHouse(x,y){
    // soft shadow, walls and roof
    ellipse(x+4,y+66,93,17,'#b4cbb0');
    rounded(x-65,y-10,130,83,9,'#f8e6d8');
    ctx.fillStyle='#c68e8b';ctx.beginPath();ctx.moveTo(x-78,y-8);ctx.lineTo(x,y-75);ctx.lineTo(x+78,y-8);ctx.closePath();ctx.fill();
    ctx.fillStyle='#d9a4a0';ctx.beginPath();ctx.moveTo(x-57,y-12);ctx.lineTo(x,y-61);ctx.lineTo(x+57,y-12);ctx.closePath();ctx.fill();
    rounded(x-17,y+28,34,45,12,'#a77d91');ellipse(x+7,y+48,2,2,'#f8dca0');
    rounded(x-49,y+6,25,26,5,'#b7d5d8');rounded(x+24,y+6,25,26,5,'#b7d5d8');
    ctx.strokeStyle='#fff4e8';ctx.lineWidth=4;ctx.beginPath();ctx.moveTo(x-36,y+6);ctx.lineTo(x-36,y+32);ctx.moveTo(x-49,y+19);ctx.lineTo(x-24,y+19);ctx.moveTo(x+36,y+6);ctx.lineTo(x+36,y+32);ctx.moveTo(x+24,y+19);ctx.lineTo(x+49,y+19);ctx.stroke();
    rounded(x-80,y+62,160,10,5,'#e7c6a9');
  }
  function drawCharacter(x,y){
    const c=outfits[state.outfit]||outfits.lavender;
    ellipse(x,y+22,23,8,'#739a7b55');
    // feet and body
    rounded(x-13,y+3,10,17,5,'#f4d8c6');rounded(x+3,y+3,10,17,5,'#f4d8c6');
    rounded(x-17,y-21,34,31,12,c);
    // arms
    ctx.strokeStyle='#f4d8c6';ctx.lineWidth=8;ctx.lineCap='round';ctx.beginPath();ctx.moveTo(x-14,y-15);ctx.lineTo(x-21,y-1);ctx.moveTo(x+14,y-15);ctx.lineTo(x+21,y-1);ctx.stroke();
    // neck and head
    rounded(x-5,y-29,10,11,4,'#f4d8c6');ellipse(x,y-42,22,23,'#f7dfcf');
    // hair cap
    ctx.fillStyle='#6d5b65';ctx.beginPath();ctx.ellipse(x,y-51,23,16,0,Math.PI,Math.PI*2);ctx.fill();
    ellipse(x-16,y-43,7,10,'#6d5b65');ellipse(x+16,y-43,7,10,'#6d5b65');
    // face
    ellipse(x-7,y-40,1.8,2.3,'#51404b');ellipse(x+7,y-40,1.8,2.3,'#51404b');
    ctx.strokeStyle='#bd837e';ctx.lineWidth=1.5;ctx.beginPath();ctx.arc(x,y-35,4,0.2,Math.PI-0.2);ctx.stroke();
    ellipse(x-12,y-35,3.5,2,'#efb1b2');ellipse(x+12,y-35,3.5,2,'#efb1b2');
    // collar
    ctx.fillStyle='#fff5ed';ctx.beginPath();ctx.moveTo(x-7,y-23);ctx.lineTo(x,y-16);ctx.lineTo(x+7,y-23);ctx.closePath();ctx.fill();
  }
  function drawAnimal(x,y){
    ellipse(x,y+14,18,6,'#6f947255');
    // ears
    ellipse(x-10,y-7,6,11,'#d5b6a6');ellipse(x+10,y-7,6,11,'#d5b6a6');
    ellipse(x,y,17,15,'#f3e9dc');ellipse(x-6,y-1,1.7,2,'#5c5155');ellipse(x+6,y-1,1.7,2,'#5c5155');
    ellipse(x,y+4,2,2,'#b98586');ellipse(x-10,y+3,3,2,'#edc0b9');ellipse(x+10,y+3,3,2,'#edc0b9');
  }
  function draw(){
    ctx.clearRect(0,0,W,H);
    // sky and meadow
    const grad=ctx.createLinearGradient(0,0,0,H);grad.addColorStop(0,'#dcebf0');grad.addColorStop(.43,'#e7efd9');grad.addColorStop(1,'#c4ddb9');ctx.fillStyle=grad;ctx.fillRect(0,0,W,H);
    // soft clouds
    ellipse(130,76,40,15,'#ffffff80');ellipse(155,69,27,19,'#ffffff80');ellipse(177,78,30,13,'#ffffff80');
    ellipse(750,88,36,13,'#ffffff80');ellipse(772,81,24,17,'#ffffff80');ellipse(794,90,29,12,'#ffffff80');
    // distant hills
    ellipse(110,180,210,95,'#c4ddbc');ellipse(470,180,260,105,'#c0d8b8');ellipse(850,176,230,100,'#c7dfbd');
    // path
    ctx.fillStyle='#e8d8bd';ctx.beginPath();ctx.moveTo(380,620);ctx.lineTo(470,320);ctx.lineTo(560,320);ctx.lineTo(680,620);ctx.closePath();ctx.fill();
    ctx.fillStyle='#f1e5cf';ctx.beginPath();ctx.moveTo(422,620);ctx.lineTo(485,330);ctx.lineTo(530,330);ctx.lineTo(640,620);ctx.closePath();ctx.fill();
    // pond
    ellipse(780,380,100,51,'#8dc5cf');ellipse(780,374,84,38,'#a9d9dc');ellipse(750,364,22,5,'#e5f7f1');
    // flower beds
    rounded(206,270,174,100,19,'#b3c99a');rounded(213,277,160,85,15,'#94b17d');
    rounded(623,267,170,101,19,'#b3c99a');rounded(630,275,156,85,15,'#94b17d');
    flowerBeds.forEach((p,i)=>{if(!(state.watered && i===0))drawFlower(p.x,p.y,1.15,['#f3a9c2','#f4d88a','#f1f0f7','#e5a9d8'][i%4]);});
    if(state.watered){drawFlower(270,300,1.4,'#f2a7c2');}
    // house and trees
    drawTree(95,205,1.2);drawTree(165,150,.8);drawTree(865,215,1.1);drawTree(840,150,.8);
    drawHouse(485,205);
    // small fence
    ctx.strokeStyle='#f5ead8';ctx.lineWidth=6;ctx.lineCap='round';ctx.beginPath();ctx.moveTo(190,400);ctx.lineTo(350,400);ctx.moveTo(190,390);ctx.lineTo(190,410);ctx.moveTo(230,390);ctx.lineTo(230,410);ctx.moveTo(270,390);ctx.lineTo(270,410);ctx.moveTo(310,390);ctx.lineTo(310,410);ctx.moveTo(350,390);ctx.lineTo(350,410);ctx.stroke();
    // animal friend
    drawAnimal(700,405);
    // garden sign
    rounded(75,340,95,34,10,'#fff9e9');ctx.fillStyle='#7f9b70';ctx.font='bold 12px sans-serif';ctx.textAlign='center';ctx.fillText('작은 꽃밭',122,361);
    // shell / hidden item
    if(!state.foundShell){ellipse(815,408,8,5,'#fff1d1');ellipse(815,405,5,4,'#f8d9a4');}
    // character
    drawCharacter(state.x,state.y);
    // prompt when close to targets
    const target=nearTarget();
    if(target){rounded(state.x-44,state.y-86,88,25,10,'#fffdf2ed');ctx.fillStyle='#71647d';ctx.font='bold 11px sans-serif';ctx.textAlign='center';ctx.fillText('E  '+target.label,state.x,state.y-70);}
    // glints
    const t=Date.now()/900;for(let i=0;i<4;i++){let x=245+i*165+Math.sin(t+i)*4,y=125+(i%2)*45+Math.cos(t+i)*5;ctx.fillStyle='#fff8d9aa';ctx.font='15px serif';ctx.fillText('✧',x,y);}
    requestAnimationFrame(draw);
  }
  function nearTarget(){
    const targets=[{x:485,y:235,label:'집 앞에서 쉬기',id:'house',r:85},{x:310,y:320,label:'꽃 돌보기',id:'garden',r:70},{x:700,y:405,label:'동물 친구',id:'animal',r:58},{x:815,y:405,label:'숨겨진 조개',id:'shell',r:50}];
    return targets.find(t=>Math.hypot(state.x-t.x,state.y-t.y)<t.r && !(t.id==='shell'&&state.foundShell))||null;
  }
  function showDialog(name,text,actions=[]){
    $('dialogName').textContent=name;$('dialogText').textContent=text;
    const holder=$('dialogActions');holder.innerHTML='';
    actions.forEach(a=>{const b=document.createElement('button');b.textContent=a.label;b.onclick=a.action;holder.appendChild(b);});
    $('dialog').hidden=false;
  }
  function closeDialog(){$('dialog').hidden=true;}
  $('closeDialog').addEventListener('click',closeDialog);
  function interact(){
    const t=nearTarget();
    if(!t){toast('주변을 천천히 둘러봐요. 가까이 다가가면 상호작용할 수 있어요.');return;}
    if(t.id==='garden'){
      showDialog('작은 꽃밭','꽃들이 햇살을 머금고 있어요. 오늘은 꽃을 돌보거나 잠시 바라봐도 좋아요.',[
        {label:state.watered?'꽃을 다시 살펴보기':'꽃에 물 주기',action:()=>{state.watered=true;state.flowers+=1;state.coins+=5;gainXP(10);save();closeDialog();toast('꽃이 반짝여요! 꽃 1개와 코인 5개를 얻었어요.');}},
        {label:'꽃 구경하기',action:()=>{closeDialog();toast('꽃을 천천히 바라보는 것도 좋은 시간이 될 수 있어요.');}}
      ]);
    } else if(t.id==='animal'){
      showDialog('포근이','안녕! 나는 포근이야. 여기서는 서두르지 않아도 돼. 잠깐 같이 쉬어 갈래?',[
        {label:'인사하기',action:()=>{state.xp+=5;save();closeDialog();toast('포근이와 인사했어요. 경험치 +5');checkLevel();}},
        {label:'꽃 선물하기 (꽃 1개)',action:()=>{if(state.flowers<1){toast('먼저 정원에서 꽃을 모아 봐요.');return;}state.flowers--;state.coins+=10;save();closeDialog();toast('포근이가 기뻐해요! 코인 +10');}}
      ]);
    } else if(t.id==='shell'){
      state.foundShell=true;state.coins+=8;state.xp+=8;save();closeDialog();toast('반짝이는 조개를 발견했어요! 코인 +8, 경험치 +8');checkLevel();
    } else {
      showDialog('작은 집','오늘 하루도 여기까지 온 것만으로 충분해요. 원한다면 잠시 숨을 고르고 쉬어 가요.',[
        {label:'정원으로 돌아가기',action:()=>{state.nav='garden';save();closeDialog();toast('정원에서 꽃을 돌볼 수 있어요.');}},
        {label:'마을 산책 계속하기',action:()=>{closeDialog();toast('원하는 만큼 천천히 둘러봐요.');}}
      ]);
    }
  }
  function gainXP(n){state.xp+=n;checkLevel();}
  function checkLevel(){while(state.xp>=100){state.xp-=100;state.level++;state.coins+=15;toast('레벨 업! 새로운 장식을 위한 코인 +15');}save();}
  function move(){
    if($('dialog').hidden===false)return;
    let dx=0,dy=0;if(keys.ArrowLeft||keys.a||keys.A)dx-=1;if(keys.ArrowRight||keys.d||keys.D)dx+=1;if(keys.ArrowUp||keys.w||keys.W)dy-=1;if(keys.ArrowDown||keys.s||keys.S)dy+=1;
    if(dx||dy){const len=Math.hypot(dx,dy);state.x=Math.max(35,Math.min(W-35,state.x+dx/len*2.6));state.y=Math.max(115,Math.min(H-30,state.y+dy/len*2.6));}
  }
  function loop(){move();requestAnimationFrame(loop);}
  window.addEventListener('keydown',e=>{if(['ArrowUp','ArrowDown','ArrowLeft','ArrowRight',' '].includes(e.key))e.preventDefault();keys[e.key]=true;if(e.key==='e'||e.key==='E')interact();});
  window.addEventListener('keyup',e=>keys[e.key]=false);
  canvas.addEventListener('pointerdown',e=>{const r=canvas.getBoundingClientRect();const x=(e.clientX-r.left)*W/r.width,y=(e.clientY-r.top)*H/r.height;state.x=x;state.y=y;save();});
  // Touch-friendly movement controls
  const pad=document.createElement('div');pad.className='touch-pad';pad.innerHTML='<button data-k="ArrowUp">▲</button><div><button data-k="ArrowLeft">◀</button><button data-k="ArrowDown">▼</button><button data-k="ArrowRight">▶</button></div>';
  document.querySelector('.scene-wrap').appendChild(pad);
  pad.querySelectorAll('button').forEach(b=>{const k=b.dataset.k;const start=e=>{e.preventDefault();keys[k]=true;};const end=e=>{e.preventDefault();keys[k]=false;};b.addEventListener('pointerdown',start);b.addEventListener('pointerup',end);b.addEventListener('pointerleave',end);b.addEventListener('pointercancel',end);});
  document.querySelectorAll('.outfit').forEach(b=>b.addEventListener('click',()=>{state.outfit=b.dataset.outfit;save();toast(outfitNames[state.outfit]+'으로 갈아입었어요.');}));
  document.querySelectorAll('.mood').forEach(b=>b.addEventListener('click',()=>{state.mood=b.dataset.mood;save();toast('오늘의 마음을 기록했어요. 기록은 평가되지 않아요.');}));
  document.querySelectorAll('.nav-item').forEach(b=>b.addEventListener('click',()=>{
    state.nav=b.dataset.nav;save();
    const messages={village:'마을을 천천히 둘러봐요.',garden:'꽃밭 가까이 가서 E를 눌러 보세요.',room:'내 방 꾸미기는 다음 업데이트에서 확장할 예정이에요.',journal:'오른쪽 패널에서 오늘의 마음을 기록할 수 있어요.'};
    toast(messages[state.nav]||'천천히 둘러봐요.');
    if(state.nav==='garden'){state.x=300;state.y=325;}
  }));
  $('breathBtn').addEventListener('click',()=>{
    if(breathing){stopBreath();return;}
    breathing=true;breathStep=0;$('breathBox').hidden=false;$('breathLabel').textContent='호흡 활동 진행 중';$('breathInstruction').textContent='편안한 만큼만 따라 해요. 숨을 억지로 깊게 쉬지 않아도 돼요.';
    const circle=$('breathCircle'),text=$('breathText');
    const steps=[['천천히 들이쉬어요',true],['편안하게 내쉬어요',false]];
    function tick(){if(!breathing)return;const s=steps[breathStep%2];text.textContent=s[0];circle.classList.toggle('expand',s[1]);breathStep++;breathTimer=setTimeout(tick,4000);}
    tick();toast('30초 동안 천천히 쉬어 가요. 언제든 그만할 수 있어요.');
    breathTimer=setTimeout(stopBreath,30000);
  });
  function stopBreath(){breathing=false;clearTimeout(breathTimer);$('breathBox').hidden=true;$('breathLabel').textContent='함께 천천히 호흡하기';$('breathCircle').classList.remove('expand');toast('함께 쉬어 가줘서 고마워요.');}
  $('stopBreath').addEventListener('click',stopBreath);
  updateUI();draw();loop();
})();
