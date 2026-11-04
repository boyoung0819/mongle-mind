import * as THREE from "three";
import { GLTFLoader } from "https://cdn.jsdelivr.net/npm/three@0.164.1/examples/jsm/loaders/GLTFLoader.js";

(() => {
const root = document.getElementById("world");
if (!root || root.dataset.ready === "1") return;
root.dataset.ready = "1";

const $ = id => document.getElementById(id);
const defaults = {
  x: 0, z: 4, coins: 30, xp: 0, level: 1,
  flowers: 0, outfit: "lavender", mood: null,
  watered: false, foundShell: false, nav: "village"
};

let state = { ...defaults };
try {
  const saved = JSON.parse(localStorage.getItem("mongleMindSave") || "null");
  if (saved) state = { ...state, ...saved };
} catch (e) {}

if (typeof state.x !== "number" || Math.abs(state.x) > 20) state.x = 0;
if (typeof state.z !== "number" || Math.abs(state.z) > 20) state.z = 4;

let keys = {};
let toastTimer, breathTimer, breathStep = 0, breathing = false, last = 0;
let walkBlend = 0;
let walkPhase = 0;

const colors = {
  lavender: 0xb7a5e5,
  peach: 0xefb39e,
  mint: 0x9acdb5
};
const names = {
  lavender: "라벤더 룩",
  peach: "피치 룩",
  mint: "민트 룩"
};
const moodNames = {
  calm: "차분한 마음을 기록했어요.",
  happy: "기쁜 마음을 기록했어요.",
  tired: "지친 마음을 기록했어요.",
  worried: "걱정되는 마음을 기록했어요."
};

const scene = new THREE.Scene();
scene.background = new THREE.Color(0xbadcf3);
scene.fog = new THREE.Fog(0xd5e7ce, 28, 60);

const camera = new THREE.PerspectiveCamera(43, 1, 0.1, 120);
camera.position.set(0, 6.5, 27);

const renderer = new THREE.WebGLRenderer({ antialias: true });
renderer.setPixelRatio(Math.min(devicePixelRatio || 1, 2));
renderer.shadowMap.enabled = true;
renderer.shadowMap.type = THREE.PCFSoftShadowMap;
renderer.outputColorSpace = THREE.SRGBColorSpace;
renderer.toneMapping = THREE.ACESFilmicToneMapping;
renderer.toneMappingExposure = 1.15;
root.replaceChildren(renderer.domElement);

scene.add(new THREE.HemisphereLight(0xfff7ed, 0x78936c, 2));

const sun = new THREE.DirectionalLight(0xffefd7, 3);
sun.position.set(-8, 17, 10);
sun.castShadow = true;
sun.shadow.mapSize.set(1024, 1024);
scene.add(sun);

const M = c => new THREE.MeshStandardMaterial({ color: c, roughness: 0.86 });

const m = {
  grass: M(0x9fc88d),
  path: M(0xe9d8bb),
  path2: M(0xf6e9d2),
  wood: M(0x986b54),
  cream: M(0xffead7),
  roof: M(0xc78391),
  roof2: M(0xe4a5a6),
  leaf: M(0x6f9d72),
  leaf2: M(0x9bc58c),
  leaf3: M(0xb8d59d),
  water: M(0x7fc4d1),
  white: M(0xfff9ef),
  skin: M(0xf5d4c1),
  hair: M(0x76515a),
  dark: M(0x43343b),
  pink: M(0xf1b5c5),
  gold: M(0xf1c76f),
  pinks: M(0xf3a4c4),
  lilac: M(0xc8a9ec),
  yellow: M(0xffdc85)
};

function add(g, mat, parent, x, y, z, sx = 1, sy = 1, sz = 1) {
  const o = new THREE.Mesh(g, mat);
  o.position.set(x, y, z);
  o.scale.set(sx, sy, sz);
  o.castShadow = true;
  o.receiveShadow = true;
  parent.add(o);
  return o;
}

function box(parent, x, y, z, w, h, d, mat) {
  return add(new THREE.BoxGeometry(w, h, d), mat, parent, x, y, z);
}

function ball(parent, x, y, z, sx, sy, sz, mat) {
  return add(
    new THREE.SphereGeometry(1, 18, 12),
    mat, parent, x, y, z, sx, sy, sz
  );
}

// 바닥과 길
const ground = add(
  new THREE.PlaneGeometry(90, 90),
  m.grass, scene, 0, -0.12, 0
);
ground.rotation.x = -Math.PI / 2;

for (let i = 0; i < 15; i++) {
  const p = box(
    scene,
    Math.sin(i * 0.28) * 1.6,
    0.01,
    11 - i * 1.55,
    4.2, 0.07, 1.65,
    i % 3 ? m.path : m.path2
  );
  p.rotation.y = Math.sin(i * 0.28) * -0.1;
}

// 연못
const pond = add(
  new THREE.CylinderGeometry(3, 3, 0.15, 40),
  m.water, scene, 7, 0.03, 1, 1, 1, 0.72
);
const rim = add(
  new THREE.TorusGeometry(3, 0.16, 8, 40),
  m.white, scene, 7, 0.12, 1, 1, 1, 0.72
);
rim.rotation.x = Math.PI / 2;

// 집
const house = new THREE.Group();
scene.add(house);
house.position.set(-5, 0, -5);

box(house, 0, 1.1, 0, 5.3, 2.2, 4, m.cream);

// 수정: 지붕의 양쪽 경사 방향을 바로잡음
const r1 = box(house, -1.3, 2.45, 0, 3.2, 0.2, 4.8, m.roof);
r1.rotation.z = 0.52;

const r2 = box(house, 1.3, 2.45, 0, 3.2, 0.2, 4.8, m.roof2);
r2.rotation.z = -0.52;

box(house, 0, 0.85, 2.04, 1, 1.65, 0.15, m.wood);
ball(house, 0.3, 0.85, 2.15, 0.06, 0.06, 0.04, m.gold);

for (const x of [-1.6, 1.6]) {
  box(house, x, 1.35, 2.05, 0.8, 0.7, 0.12, M(0x9cced8));
  box(house, x, 1.35, 2.12, 0.07, 0.7, 0.04, m.white);
  box(house, x, 1.35, 2.12, 0.8, 0.07, 0.04, m.white);
}

// 나무
function tree(x, z, s = 1) {
  const g = new THREE.Group();
  scene.add(g);
  g.position.set(x, 0, z);
  g.scale.setScalar(s);

  add(new THREE.CylinderGeometry(0.2, 0.28, 1.5, 10), m.wood, g, 0, 0.75, 0);
  ball(g, 0, 1.95, 0, 0.95, 1.05, 0.9, m.leaf);
  ball(g, -0.52, 1.75, 0.02, 0.7, 0.75, 0.7, m.leaf2);
  ball(g, 0.55, 1.8, -0.03, 0.7, 0.8, 0.7, m.leaf3);
  ball(g, -0.15, 2.48, 0.1, 0.62, 0.68, 0.6, m.leaf2);
}

[
  [-10, -8, 1.2], [-9, 1, 0.9], [-10, 7, 1.1],
  [10, -8, 1.2], [11, -2, 0.95], [10, 8, 1.1],
  [4, -10, 0.8], [-2, -12, 0.8]
].forEach(a => tree(...a));

// 꽃
const flowerGroups = [];

function flower(x, z, color, scale = 1) {
  const g = new THREE.Group();
  scene.add(g);
  g.position.set(x, 0, z);
  g.scale.setScalar(scale);

  add(new THREE.CylinderGeometry(0.025, 0.04, 0.42, 7), M(0x6f9d68), g, 0, 0.22, 0);

  for (let i = 0; i < 5; i++) {
    const a = i * Math.PI * 2 / 5;
    ball(g, Math.cos(a) * 0.14, 0.46, Math.sin(a) * 0.14, 0.12, 0.08, 0.12, color);
  }

  ball(g, 0, 0.48, 0, 0.075, 0.07, 0.075, m.gold);
  flowerGroups.push(g);
}

function bed(x, z) {
  box(scene, x, 0.08, z, 4.1, 0.17, 2.1, M(0x7c9d68));
  box(scene, x, 0.17, z, 3.8, 0.1, 1.8, M(0x80624c));

  const cs = [m.pinks, m.yellow, m.white, m.lilac];

  for (let i = 0; i < 5; i++) {
    for (let j = 0; j < 2; j++) {
      flower(x - 1.5 + i * 0.75, z - 0.45 + j * 0.85, cs[(i + j) % 4], 0.72);
    }
  }
}

bed(-7, 2.8);
bed(1, -1.2);
bed(7, 7);

for (let i = 0; i < 42; i++) {
  const x = Math.sin(i * 12.3) * 12;
  const z = Math.cos(i * 7.1) * 11;

  if (Math.abs(x) < 3 && z > 0 && z < 10) continue;

  flower(x, z, [m.pinks, m.yellow, m.white, m.lilac][i % 4], 0.45 + (i % 3) * 0.1);
}

// 작은 울타리
for (let i = 0; i < 7; i++) {
  box(scene, -10 + i * 0.62, 0.43, 4.8, 0.12, 0.86, 0.12, m.white);
  if (i < 6) {
    box(scene, -9.7 + i * 0.62, 0.52, 4.8, 0.58, 0.12, 0.12, M(0xb98767));
  }
}

// 가로등
function lamp(x, z) {
  add(new THREE.CylinderGeometry(0.07, 0.1, 1.3, 10), m.wood, scene, x, 0.65, z);
  box(scene, x, 1.36, z, 0.48, 0.4, 0.48, m.cream);
  ball(scene, x, 1.36, z, 0.12, 0.13, 0.12, m.gold);

  const l = new THREE.PointLight(0xffd69b, 0.5, 4);
  l.position.set(x, 1.5, z);
  scene.add(l);
}

lamp(-2, -1);
lamp(3, 4);
lamp(-8, 6);

// 관목, 돌길, 꽃, 버섯, 우편함, 표지판
const shrubMat = M(0x7fae79);
const shrubLight = M(0xa9cd91);
const stoneMat = M(0xd7c9b5);
const pinkMat = M(0xf3bfd0);

function shrub(x, z, s = 1) {
  const g = new THREE.Group();
  scene.add(g);
  g.position.set(x, 0, z);
  g.scale.setScalar(s);

  ball(g, 0, 0.35, 0, 0.52, 0.38, 0.45, shrubMat);
  ball(g, -0.32, 0.43, 0.02, 0.34, 0.31, 0.34, shrubLight);
  ball(g, 0.3, 0.4, -0.06, 0.34, 0.3, 0.34, shrubLight);
  flower(x - 0.1, z - 0.05, pinkMat, 0.42);
}

[
  [-4, 4], [-3, 4.3], [-2, 4.4], [4, 2], [4.6, 2.2],
  [5.2, 2.1], [-8, -2], [-7.2, -2.1], [8, 4.5],
  [8.8, 4.6], [-6, -8], [-4, -8], [6, -6], [8, -6]
].forEach((p, i) => shrub(p[0], p[1], i % 3 === 0 ? 0.9 : 0.7));

function steppingStone(x, z, rot = 0) {
  const o = add(new THREE.CylinderGeometry(0.32, 0.36, 0.09, 7), stoneMat, scene, x, 0.02, z);
  o.rotation.y = rot;
}

for (let i = 0; i < 7; i++) {
  steppingStone(-2.6 + i * 0.78, 7.2 + Math.sin(i * 0.55) * 0.18, i * 0.2);
  steppingStone(3.1 + i * 0.65, -4.2 + Math.sin(i * 0.7) * 0.22, i * 0.17);
}

function mushroom(x, z, s = 1) {
  const g = new THREE.Group();
  scene.add(g);
  g.position.set(x, 0, z);
  g.scale.setScalar(s);

  add(new THREE.CylinderGeometry(0.12, 0.16, 0.42, 10), M(0xffefdc), g, 0, 0.21, 0);
  ball(g, 0, 0.45, 0, 0.36, 0.19, 0.35, M(0xe995a7));

  for (let i = 0; i < 3; i++) {
    ball(g, Math.cos(i * 2.1) * 0.18, 0.52, Math.sin(i * 2.1) * 0.16, 0.045, 0.035, 0.045, m.white);
  }
}

mushroom(-8, 4, 0.8);
mushroom(-4, -3, 0.7);
mushroom(9, -3, 0.9);
mushroom(5, 8, 0.65);

function mailbox(x, z) {
  const g = new THREE.Group();
  scene.add(g);
  g.position.set(x, 0, z);

  add(new THREE.CylinderGeometry(0.055, 0.07, 1.1, 8), m.wood, g, 0, 0.55, 0);
  box(g, 0, 1.15, 0, 0.65, 0.48, 0.42, M(0xd58c9a));
  box(g, 0, 1.18, 0.22, 0.3, 0.08, 0.025, m.cream);
  ball(g, 0.24, 1.13, 0.23, 0.035, 0.035, 0.025, m.gold);
}

mailbox(-2.8, -4.2);

function signpost(x, z, labelColor = 0xe9b6c6) {
  const g = new THREE.Group();
  scene.add(g);
  g.position.set(x, 0, z);

  add(new THREE.CylinderGeometry(0.06, 0.08, 1.5, 8), m.wood, g, 0, 0.75, 0);
  box(g, 0, 1.35, 0, 0.95, 0.48, 0.13, M(labelColor));
  ball(g, 0, 1.35, 0.09, 0.07, 0.07, 0.03, m.gold);
}

signpost(3.6, -3.7);
signpost(-8, 0, 0xb8c9e8);

// 집 주변의 둥근 돌
for (let i = 0; i < 22; i++) {
  const a = i * 2.399;
  const x = Math.cos(a) * (5.2 + (i % 3) * 0.25) - 5;
  const z = Math.sin(a) * (3.8 + (i % 2) * 0.35) - 5;
  const rock = add(new THREE.DodecahedronGeometry(0.22 + (i % 3) * 0.04, 0), stoneMat, scene, x, 0.1, z, 0.9, 0.55, 0.8);
  rock.rotation.y = a;
}

// 캐릭터: 사용자가 제공한 원본 character.glb를 직접 불러옵니다.
const avatar = new THREE.Group();
scene.add(avatar);

const avatarShadow = add(
  new THREE.CircleGeometry(0.65, 24),
  new THREE.MeshBasicMaterial({ color: 0x536d4b, transparent: true, opacity: 0.16 }),
  avatar, 0, 0.025, 0
);
avatarShadow.rotation.x = -Math.PI / 2;

const characterLoader = new GLTFLoader();
const characterUrls = [
  "https://cdn.jsdelivr.net/gh/boyoung0819/mongle-mind@main/components/village/character.glb",
  "https://raw.githubusercontent.com/boyoung0819/mongle-mind/main/components/village/character.glb"
];

let loadedCharacter = null;
let characterLoadIndex = 0;

function applyOutfitColor(outfit) {
  // 현재 제공된 GLB는 몸과 의상이 하나의 메시/재질로 합쳐져 있어
  // 전체 캐릭터를 물들이지 않도록 원본 텍스처를 그대로 보존합니다.
  // 의상별 색상 적용은 의상 메시가 분리된 모델이 준비되면 연결합니다.
}

function loadOriginalCharacter() {
  if (characterLoadIndex >= characterUrls.length) {
    console.error("원본 character.glb를 모든 주소에서 불러오지 못했습니다.");
    toast("원본 캐릭터를 불러오지 못했어요. GitHub의 components/village/character.glb 위치를 확인해 주세요.");
    return;
  }

  const url = characterUrls[characterLoadIndex++];

  characterLoader.load(
    url,
    gltf => {
      loadedCharacter = gltf.scene;
      loadedCharacter.visible = true;
      loadedCharacter.updateMatrixWorld(true);

      // 원본 모델의 크기와 중심을 계산해 마을 바닥에 자연스럽게 배치합니다.
      const bounds = new THREE.Box3().setFromObject(loadedCharacter);
      const size = bounds.getSize(new THREE.Vector3());
      const center = bounds.getCenter(new THREE.Vector3());
      const height = Math.max(size.y, 0.001);
      const scale = 3.0 / height;

      loadedCharacter.scale.setScalar(scale);
      loadedCharacter.position.set(
        -center.x * scale,
        -bounds.min.y * scale,
        -center.z * scale
      );

      loadedCharacter.userData.walkBaseY = loadedCharacter.position.y;
      loadedCharacter.userData.walkBaseRotationX = loadedCharacter.rotation.x;
      loadedCharacter.userData.walkBaseRotationZ = loadedCharacter.rotation.z;

      loadedCharacter.traverse(obj => {
        if (!obj.isMesh) return;
        obj.visible = true;
        obj.castShadow = true;
        obj.receiveShadow = true;

        // 원본 GLB의 색상과 내장 텍스처를 그대로 보존합니다.
        // 하나로 합쳐진 메시이므로 전체 재질에 의상 색을 덮어씌우지 않습니다.
        const materials = Array.isArray(obj.material) ? obj.material : [obj.material];
        materials.forEach(material => {
          if (material) material.needsUpdate = true;
        });
      });

      avatar.add(loadedCharacter);
      loadedCharacter.updateMatrixWorld(true);
      console.info("원본 character.glb 로딩 완료:", url);
    },
    progress => {
      if (progress.total > 0) {
        console.info(`캐릭터 로딩 중: ${Math.round(progress.loaded / progress.total * 100)}%`);
      }
    },
    error => {
      console.warn(`캐릭터 주소 로딩 실패: ${url}`, error);
      loadOriginalCharacter();
    }
  );
}

loadOriginalCharacter();

// 반려동물
const pet = new THREE.Group();
scene.add(pet);

ball(pet, 0, 0.42, 0, 0.45, 0.36, 0.4, m.white);
ball(pet, 0, 0.78, -0.02, 0.34, 0.32, 0.32, m.white);

for (const x of [-0.21, 0.21]) {
  ball(pet, x, 1.02, -0.02, 0.12, 0.22, 0.12, M(0xe5c4bd));
  ball(pet, x * 0.6, 0.8, 0.28, 0.03, 0.04, 0.02, m.dark);
  ball(pet, x * 0.9, 0.69, 0.28, 0.06, 0.035, 0.02, m.pink);
}
ball(pet, 0, 0.72, 0.3, 0.045, 0.035, 0.02, M(0x9d777a));

// 숨겨진 조개
const shell = new THREE.Group();
scene.add(shell);
shell.position.set(8, 0.15, 5);

ball(shell, 0, 0.1, 0, 0.22, 0.11, 0.17, M(0xf4d6a2));

for (let i = -1; i <= 1; i++) {
  const q = add(new THREE.TorusGeometry(0.09, 0.01, 5, 12, Math.PI), m.white, shell, i * 0.06, 0.14, 0);
  q.rotation.x = Math.PI / 2;
}

const sceneStatus = $("sceneStatus");

function save() {
  try {
    localStorage.setItem("mongleMindSave", JSON.stringify(state));
  } catch (e) {}
  updateUI();
}

function updateUI() {
  $("coins").textContent = state.coins;
  $("level").textContent = state.level;
  $("xp").textContent = state.xp;
  $("flowers").textContent = state.flowers;
  $("outfitLabel").textContent = names[state.outfit] || names.lavender;

  document.querySelectorAll(".outfit").forEach(b =>
    b.classList.toggle("active", b.dataset.outfit === state.outfit)
  );

  document.querySelectorAll(".mood").forEach(b =>
    b.classList.toggle("selected", b.dataset.mood === state.mood)
  );

  $("moodSaved").textContent = state.mood
    ? moodNames[state.mood]
    : "기분을 기록하지 않아도 괜찮아요.";

  document.querySelectorAll(".nav-item").forEach(b =>
    b.classList.toggle("active", b.dataset.nav === state.nav)
  );
}

function toast(s) {
  const e = $("toast");
  e.textContent = s;
  e.classList.add("show");
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => e.classList.remove("show"), 2400);
}

function levelUp() {
  while (state.xp >= 100) {
    state.xp -= 100;
    state.level++;
    state.coins += 15;
    toast("레벨 업! 코인 +15");
  }
  save();
}

function xp(n) {
  state.xp += n;
  levelUp();
}

function closeDialog() {
  $("dialog").hidden = true;
}

$("closeDialog").addEventListener("click", closeDialog);

function dialog(name, text, actions = []) {
  $("dialogName").textContent = name;
  $("dialogText").textContent = text;

  const h = $("dialogActions");
  h.replaceChildren();

  actions.forEach(a => {
    const b = document.createElement("button");
    b.textContent = a.label;
    b.onclick = a.action;
    h.appendChild(b);
  });

  $("dialog").hidden = false;
}

function target() {
  const a = [
    { id: "garden", x: -7, z: 2.8, r: 2.7, label: "꽃 돌보기" },
    { id: "animal", x: 2.5, z: 5.7, r: 2.5, label: "포근이 만나기" },
    { id: "house", x: -5, z: -1.5, r: 3, label: "집 앞에서 쉬기" },
    { id: "shell", x: 8, z: 5, r: 1.8, label: "숨겨진 조개" }
  ];

  return a.find(t =>
    Math.hypot(avatar.position.x - t.x, avatar.position.z - t.z) < t.r &&
    !(t.id === "shell" && state.foundShell)
  );
}

function interact() {
  const t = target();

  if (!t) {
    toast("꽃밭이나 친구 가까이 다가가 E를 눌러 보세요.");
    return;
  }

  if (t.id === "garden") {
    dialog("작은 꽃밭", "꽃들이 햇살을 머금고 있어요. 꽃을 돌보거나 잠시 바라봐도 좋아요.", [
      {
        label: "꽃에 물 주기",
        action: () => {
          state.watered = true;
          state.flowers++;
          state.coins += 5;
          xp(10);
          save();
          closeDialog();
          toast("꽃 1개와 코인 5개를 얻었어요.");
        }
      },
      {
        label: "꽃 구경하기",
        action: () => {
          closeDialog();
          toast("꽃을 천천히 바라보는 것도 좋아요.");
        }
      }
    ]);
  } else if (t.id === "animal") {
    dialog("포근이", "안녕! 나는 포근이야. 여기서는 서두르지 않아도 돼.", [
      {
        label: "인사하기",
        action: () => {
          xp(5);
          closeDialog();
          toast("포근이와 인사했어요. 경험치 +5");
        }
      },
      {
        label: "꽃 선물하기 (꽃 1개)",
        action: () => {
          if (state.flowers < 1) {
            toast("먼저 정원에서 꽃을 모아 봐요.");
            return;
          }
          state.flowers--;
          state.coins += 10;
          save();
          closeDialog();
          toast("포근이가 기뻐해요! 코인 +10");
        }
      }
    ]);
  } else if (t.id === "shell") {
    state.foundShell = true;
    state.coins += 8;
    xp(8);
    shell.visible = false;
    closeDialog();
    toast("반짝이는 조개 발견! 코인 +8");
  } else {
    dialog("작은 집", "오늘 하루도 여기까지 온 것만으로 충분해요. 잠시 쉬어 가요.", [
      {
        label: "정원 둘러보기",
        action: () => {
          state.nav = "garden";
          avatar.position.set(-7, 0, 2.8);
          save();
          closeDialog();
        }
      },
      {
        label: "산책 계속하기",
        action: closeDialog
      }
    ]);
  }
}

// 수정: 의상 버튼과 모델 재질 연결
document.querySelectorAll(".outfit").forEach(b => {
  b.onclick = () => {
    state.outfit = b.dataset.outfit;
    applyOutfitColor(state.outfit);
    save();
    toast("의상 선택을 저장했어요. 현재 캐릭터 모델은 원본 색상을 유지해요.");
  };
});

document.querySelectorAll(".mood").forEach(b => {
  b.onclick = () => {
    state.mood = b.dataset.mood;
    save();
    toast("오늘의 마음을 기록했어요. 기록은 평가되지 않아요.");
  };
});

document.querySelectorAll(".nav-item").forEach(b => {
  b.onclick = () => {
    state.nav = b.dataset.nav;
    save();

    if (state.nav === "garden") avatar.position.set(-7, 0, 2.8);
    if (state.nav === "village") avatar.position.set(0, 0, 4);

    toast(({
      village: "마을을 천천히 둘러봐요.",
      garden: "정원에 도착했어요.",
      room: "내 방 꾸미기는 다음 단계에서 확장할게요.",
      journal: "오늘의 마음을 오른쪽에서 기록할 수 있어요."
    })[state.nav]);
  };
});

function stopBreath() {
  breathing = false;
  clearTimeout(breathTimer);
  $("breathBox").hidden = true;
  $("breathLabel").textContent = "함께 천천히 호흡하기";
  $("breathCircle").classList.remove("expand");
}

$("breathBtn").onclick = () => {
  if (breathing) {
    stopBreath();
    return;
  }

  breathing = true;
  breathStep = 0;
  $("breathBox").hidden = false;
  $("breathLabel").textContent = "호흡 활동 진행 중";
  $("breathInstruction").textContent = "편안한 만큼만 따라 해요. 언제든 그만할 수 있어요.";

  const c = $("breathCircle");
  const t = $("breathText");
  const steps = [
    ["천천히 들이쉬어요", true],
    ["편안하게 내쉬어요", false]
  ];

  function tick() {
    if (!breathing) return;
    const s = steps[breathStep++ % 2];
    t.textContent = s[0];
    c.classList.toggle("expand", s[1]);
    breathTimer = setTimeout(tick, 4000);
  }

  tick();
  breathTimer = setTimeout(stopBreath, 30000);
};

$("stopBreath").onclick = stopBreath;

// 키보드 이동과 상호작용
window.addEventListener("keydown", e => {
  keys[e.key.toLowerCase()] = true;

  if (["ArrowUp", "ArrowDown", "ArrowLeft", "ArrowRight", " "].includes(e.key)) {
    e.preventDefault();
  }

  if (e.key.toLowerCase() === "e" && $("dialog").hidden) interact();
  if (e.key === "Escape") closeDialog();
});

window.addEventListener("keyup", e => keys[e.key.toLowerCase()] = false);
window.addEventListener("blur", () => keys = {});

// 화면의 이동 버튼
document.querySelectorAll(".touch-pad button").forEach(b => {
  const k = b.dataset.k.toLowerCase();

  const start = e => {
    e.preventDefault();
    keys[k] = true;
  };

  const end = e => {
    e.preventDefault();
    keys[k] = false;
  };

  b.addEventListener("pointerdown", start);
  b.addEventListener("pointerup", end);
  b.addEventListener("pointerleave", end);
  b.addEventListener("pointercancel", end);
});

// 마우스로 땅을 클릭하면 해당 위치로 이동
renderer.domElement.addEventListener("pointerdown", e => {
  if (e.target.closest("button")) return;

  const r = renderer.domElement.getBoundingClientRect();
  const ray = new THREE.Raycaster();

  ray.setFromCamera(
    new THREE.Vector2(
      (e.clientX - r.left) / r.width * 2 - 1,
      -(e.clientY - r.top) / r.height * 2 + 1
    ),
    camera
  );

  const p = new THREE.Vector3();

  if (ray.ray.intersectPlane(new THREE.Plane(new THREE.Vector3(0, 1, 0), 0), p)) {
    avatar.userData.dest = new THREE.Vector3(
      THREE.MathUtils.clamp(p.x, -13, 13),
      0,
      THREE.MathUtils.clamp(p.z, -13, 13)
    );
  }
});

avatar.position.set(
  THREE.MathUtils.clamp(state.x, -13, 13),
  0,
  THREE.MathUtils.clamp(state.z, -13, 13)
);

if (state.foundShell) shell.visible = false;
updateUI();

function resize() {
  const w = Math.max(root.clientWidth, 320);
  const h = Math.max(root.clientHeight, 320);

  renderer.setSize(w, h, false);
  camera.aspect = w / h;
  camera.updateProjectionMatrix();
}

new ResizeObserver(resize).observe(root);
resize();

// 게임 루프
function animate(t) {
  requestAnimationFrame(animate);

  const dt = Math.min((t - last) / 1000 || 0, 0.05);
  last = t;

  let moving = false;

  if ($("dialog").hidden) {
    let dx = 0, dz = 0;

    if (keys.arrowleft || keys.a) dx--;
    if (keys.arrowright || keys.d) dx++;
    if (keys.arrowup || keys.w) dz--;
    if (keys.arrowdown || keys.s) dz++;

    if (avatar.userData.dest) {
      const v = avatar.userData.dest.clone().sub(avatar.position);
      v.y = 0;

      if (v.length() < 0.2) {
        avatar.userData.dest = null;
      } else {
        v.normalize();
        dx = v.x;
        dz = v.z;
      }
    }

    if (dx || dz) {
      const len = Math.hypot(dx, dz);
      dx /= len;
      dz /= len;
      moving = true;

      avatar.position.x = THREE.MathUtils.clamp(avatar.position.x + dx * dt * 4, -13, 13);
      avatar.position.z = THREE.MathUtils.clamp(avatar.position.z + dz * dt * 4, -13, 13);
      avatar.rotation.y = Math.atan2(dx, dz);

      limbs.forEach(l => {
        l.o.rotation.x = Math.sin(t * 0.012) * (l.kind === "leg" ? 0.45 : 0.22) * l.side;
      });
    } else {
      limbs.forEach(l => l.o.rotation.x = 0);
    }
  }

  // 뼈대가 없는 GLB 모델을 위한 부드러운 몸통 움직임
  walkBlend = THREE.MathUtils.damp(walkBlend, moving ? 1 : 0, 8, dt);
  if (moving) walkPhase += dt * 8;

  if (loadedCharacter) {
    const baseY = loadedCharacter.userData.walkBaseY ?? loadedCharacter.position.y;
    const baseRotX = loadedCharacter.userData.walkBaseRotationX ?? 0;
    const baseRotZ = loadedCharacter.userData.walkBaseRotationZ ?? 0;

    // 제공된 GLB는 뼈대/걷기 애니메이션이 없는 단일 메시입니다.
    // 원본 외형을 유지하면서 이동 시 가벼운 통통 튀는 움직임만 적용합니다.
    const bounce = Math.abs(Math.sin(walkPhase * 2)) * 0.045 * walkBlend;
    const idle = Math.sin(t * 0.0018) * 0.008 * (1 - walkBlend);

    loadedCharacter.position.y = baseY + bounce + idle;
    loadedCharacter.rotation.x = baseRotX - 0.012 * walkBlend;
    loadedCharacter.rotation.z = baseRotZ + Math.sin(walkPhase) * 0.018 * walkBlend;
  }

  // 캐릭터 그림자가 바닥에서 들뜨지 않도록 고정
  avatar.position.y = 0;

  pet.position.set(
    avatar.position.x + 0.9,
    Math.abs(Math.sin(t * 0.003)) * 0.05,
    avatar.position.z + 1
  );

  pet.rotation.y = Math.sin(t * 0.001) * 0.15;

  camera.position.lerp(
    new THREE.Vector3(avatar.position.x, 6.5, avatar.position.z + 27),
    0.055
  );

  camera.lookAt(avatar.position.x, 1.45, avatar.position.z - 1);

  const near = target();
  $("sceneStatus").textContent = near
    ? `E · ${near.label}`
    : "나만의 속도로 산책해요";

  renderer.render(scene, camera);
}

requestAnimationFrame(animate);
})();
