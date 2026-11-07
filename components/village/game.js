import * as THREE from "three";
import { GLTFLoader } from "https://cdn.jsdelivr.net/npm/three@0.164.1/examples/jsm/loaders/GLTFLoader.js";

(() => {
const root = document.getElementById("world");
if (!root || root.dataset.ready === "1") return;
root.dataset.ready = "1";

const $ = id => document.getElementById(id);

/* =========================================================
   기본 저장 데이터
========================================================= */

const defaults = {
  x: 0,
  z: 4,
  coins: 50,
  xp: 0,
  level: 1,

  flowers: 0,
  mood: null,

  watered: false,
  foundShell: false,

  nav: "home",
  roomDecor: "lavender",
  journalText: "",
  journalDate: "",

  questClaims: [],

  /* 정원 확장 데이터 */
  gardenPlots: [],
  gardenSeeds: { tulip: 2 }, // 기본 씨앗 제공
  selectedGardenSeed: "tulip",
  fertilizer: 5,

  stats: {
    seedsPlanted: 0,
    seedsBought: 0,
    waters: 0,
    fertilizers: 0,
    harvests: 0,
    petGreetings: 0,
    breaths: 0,
    journals: 0,
    shellFinds: 0,
    petDraws: 0
  },

  /* 펫 및 영구 소유 액세서리 데이터 */
  petCurrency: 6, // 초기 별빛 제공
  petCoins: 20,

  ownedPets: ["bunny"],
  selectedPet: "bunny",

  // 영구 소유한 펫 의상 아이템 리스트 (ID 저장)
  ownedPetHats: ["none"],
  ownedPetOutfits: ["none"],

  petFragments: {},

  petAccessories: {
    bunny: { hat: "none", outfit: "none" }
  }
};

let state = { ...defaults };

try {
  const saved = JSON.parse(localStorage.getItem("mongleMindSave") || "null");
  if (saved) {
    state = {
      ...defaults,
      ...saved,
      stats: { ...defaults.stats, ...(saved.stats || {}) },
      gardenSeeds: { ...defaults.gardenSeeds, ...(saved.gardenSeeds || {}) },
      petAccessories: { ...defaults.petAccessories, ...(saved.petAccessories || {}) },
      ownedPetHats: Array.from(new Set(["none", ...(saved.ownedPetHats || [])])),
      ownedPetOutfits: Array.from(new Set(["none", ...(saved.ownedPetOutfits || [])]))
    };
  }
} catch (e) {}

/* 보정 */
if (!Array.isArray(state.questClaims)) state.questClaims = [];
if (!Array.isArray(state.ownedPets)) state.ownedPets = ["bunny"];
if (!state.ownedPets.includes("bunny")) state.ownedPets.unshift("bunny");
if (!state.petAccessories.bunny) state.petAccessories.bunny = { hat: "none", outfit: "none" };

if (!Array.isArray(state.gardenPlots) || state.gardenPlots.length !== 6) {
  state.gardenPlots = Array.from({ length: 6 }, (_, i) => ({
    id: i,
    seedId: null,
    plantedAt: 0,
    growthBonus: 0,
    waterCount: 0,
    fertilizerCount: 0
  }));
}

/* =========================================================
   확장된 펫 데이터 및 확률 표기용
========================================================= */

const PETS = {
  bunny: { id: "bunny", name: "몽글토끼", icon: "🐰", rarity: "기본", color: 0xfff4ec, earColor: 0xe8b9c2, rate: 0, duplicateCoins: 10, fragmentNeed: 10 },
  puppy: { id: "puppy", name: "구름강아지", icon: "🐶", rarity: "일반", color: 0xe8c39b, earColor: 0xc9956b, rate: 45, duplicateCoins: 15, fragmentNeed: 10 },
  cat:   { id: "cat",   name: "달빛고양이", icon: "🐱", rarity: "일반", color: 0xcfc7df, earColor: 0xa99dbc, rate: 30, duplicateCoins: 18, fragmentNeed: 10 },
  fox:   { id: "fox",   name: "살구여우",   icon: "🦊", rarity: "희귀", color: 0xf0a66c, earColor: 0xd77a4f, rate: 15, duplicateCoins: 25, fragmentNeed: 15 },
  bear:  { id: "bear",  name: "솜사탕곰",   icon: "🐻", rarity: "희귀", color: 0xc9a78d, earColor: 0xa98268, rate: 7,  duplicateCoins: 30, fragmentNeed: 15 },
  star:  { id: "star",  name: "별빛드래곤", icon: "🐉", rarity: "전설", color: 0xf3d47b, earColor: 0xf1bd62, rate: 2.7, duplicateCoins: 60, fragmentNeed: 20 },
  unicorn: { id: "unicorn", name: "무지개유니콘", icon: "🦄", rarity: "신화", color: 0xfce4ec, earColor: 0xf48fb1, rate: 0.3, duplicateCoins: 120, fragmentNeed: 30 }
};

const PET_LIST = Object.values(PETS);

/* =========================================================
   펫 액세서리 (영구 소유 가능)
========================================================= */

const PET_HATS = {
  none:   { id: "none",   name: "없음",       icon: "—",  price: 0 },
  flower: { id: "flower", name: "🌸 꽃 머리핀", icon: "🌸", price: 15 },
  beret:  { id: "beret",  name: "🧢 포근 베레모", icon: "🧢", price: 25 },
  crown:  { id: "crown",  name: "👑 별 왕관",   icon: "👑", price: 50 },
  leaf:   { id: "leaf",   name: "🍃 숲 나뭇잎", icon: "🍃", price: 20 }
};

const PET_OUTFITS = {
  none:   { id: "none",   name: "없음",       icon: "—",  price: 0 },
  scarf:  { id: "scarf",  name: "🧣 포근 목도리", icon: "🧣", price: 20 },
  cape:   { id: "cape",   name: "🪽 작은 망토",  icon: "🪽", price: 35 },
  ribbon: { id: "ribbon", name: "🎀 분홍 리본",  icon: "🎀", price: 25 }
};

/* =========================================================
   확장된 정원 모종 데이터
========================================================= */

const PLANTS = {
  tulip:      { id: "tulip",      name: "튤립",    icon: "🌷", price: 10, growth: 15, reward: 22, xp: 8 },
  sunflower:  { id: "sunflower",  name: "해바라기", icon: "🌻", price: 18, growth: 25, reward: 38, xp: 14 },
  lavender:   { id: "lavender",   name: "라벤더",  icon: "💜", price: 25, growth: 35, reward: 55, xp: 20 },
  strawberry: { id: "strawberry", name: "딸기",    icon: "🍓", price: 35, growth: 50, reward: 80, xp: 28 },
  mint:       { id: "mint",       name: "애플민트", icon: "🌿", price: 20, growth: 20, reward: 40, xp: 12 },
  moonflower: { id: "moonflower", name: "달빛꽃",  icon: "🌙", price: 60, growth: 90, reward: 150, xp: 50 }
};

/* =========================================================
   퀘스트 데이터
========================================================= */

const QUESTS = [
  { id: "pet_draw_1", icon: "✨", title: "새로운 친구 만나기", description: "펫 뽑기를 1회 진행해 보세요.", goal: 1, rewardPetCurrency: 3, rewardCoins: 10, getProgress: () => state.stats.petDraws || 0 },
  { id: "pet_collect_2", icon: "🐾", title: "친구 둘", description: "서로 다른 펫 2종을 모아 보세요.", goal: 2, rewardPetCurrency: 5, rewardCoins: 15, getProgress: () => state.ownedPets.length },
  { id: "garden_harvest_3", icon: "🌷", title: "풍성한 정원 수확", description: "정원에서 식물을 3번 수확해 보세요.", goal: 3, rewardPetCurrency: 4, rewardCoins: 20, getProgress: () => state.stats.harvests },
  { id: "water_5", icon: "💧", title: "정성껏 물주기", description: "식물에게 물을 5번 주세요.", goal: 5, rewardPetCurrency: 3, rewardCoins: 15, getProgress: () => state.stats.waters },
  { id: "breath_1", icon: "🌿", title: "잠깐의 쉼", description: "호흡 활동을 끝까지 완료해 보세요.", goal: 1, rewardPetCurrency: 3, rewardCoins: 10, getProgress: () => state.stats.breaths },
  { id: "journal_1", icon: "💭", title: "마음 남기기", description: "오늘의 마음을 기록해 보세요.", goal: 1, rewardPetCurrency: 3, rewardCoins: 10, getProgress: () => state.stats.journals }
];

/* =========================================================
   Three.js 3D 환경 구성
========================================================= */

let keys = {};
let toastTimer;
let breathTimer;
let breathStep = 0;
let breathing = false;
let last = 0;

let walkBlend = 0;
let walkPhase = 0;
let isWateringAnim = false;
let wateringTimer = null;

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
  grass: M(0x9fc88d), path: M(0xe9d8bb), path2: M(0xf6e9d2), wood: M(0x986b54),
  cream: M(0xffead7), roof: M(0xc78391), roof2: M(0xe4a5a6), leaf: M(0x6f9d72),
  leaf2: M(0x9bc58c), leaf3: M(0xb8d59d), water: M(0x7fc4d1), white: M(0xfff9ef),
  dark: M(0x43343b), pink: M(0xf1b5c5), gold: M(0xf1c76f), pinks: M(0xf3a4c4),
  lilac: M(0xc8a9ec), yellow: M(0xffdc85)
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
  return add(new THREE.SphereGeometry(1, 18, 12), mat, parent, x, y, z, sx, sy, sz);
}

/* 마을 지형 */
const ground = add(new THREE.PlaneGeometry(90, 90), m.grass, scene, 0, -0.12, 0);
ground.rotation.x = -Math.PI / 2;

for (let i = 0; i < 15; i++) {
  const p = box(scene, Math.sin(i * 0.28) * 1.6, 0.01, 11 - i * 1.55, 4.2, 0.07, 1.65, i % 3 ? m.path : m.path2);
  p.rotation.y = Math.sin(i * 0.28) * -0.1;
}

/* 집 및 주변 요소 */
const house = new THREE.Group();
scene.add(house);
house.position.set(-5, 0, -5);
box(house, 0, 1.1, 0, 5.3, 2.2, 4, m.cream);
const r1 = box(house, -1.3, 2.45, 0, 3.2, 0.2, 4.8, m.roof); r1.rotation.z = 0.52;
const r2 = box(house, 1.3, 2.45, 0, 3.2, 0.2, 4.8, m.roof2); r2.rotation.z = -0.52;
box(house, 0, 0.85, 2.04, 1, 1.65, 0.15, m.wood);

/* 3D 정원 화분 및 식물 노드 오브젝트 그룹 */
const 3dGardenGroup = new THREE.Group();
scene.add(3dGardenGroup);
3dGardenGroup.position.set(-7, 0, 2.8);

const plotMeshes = [];

function init3DGarden() {
  for (let i = 0; i < 6; i++) {
    const row = Math.floor(i / 3);
    const col = i % 3;
    const px = (col - 1) * 1.3;
    const pz = (row - 0.5) * 1.3;

    // 화분 바닥
    box(3dGardenGroup, px, 0.06, pz, 1.1, 0.12, 1.1, M(0x80624c));

    const plantContainer = new THREE.Group();
    plantContainer.position.set(px, 0.12, pz);
    3dGardenGroup.add(plantContainer);

    plotMeshes.push(plantContainer);
  }
}
init3DGarden();

function update3DGardenVisuals() {
  const now = Date.now();
  state.gardenPlots.forEach((plot, i) => {
    const container = plotMeshes[i];
    while (container.children.length) container.remove(container.children[0]);

    if (!plot.seedId) return;

    const plant = PLANTS[plot.seedId];
    const elapsed = (now - plot.plantedAt) / 1000 + (plot.growthBonus || 0);
    const progress = Math.min(1, elapsed / plant.growth);

    if (progress < 0.4) {
      // 1단계: 씨앗/새싹
      ball(container, 0, 0.1, 0, 0.12, 0.15, 0.12, M(0x6f9d68));
    } else if (progress < 0.95) {
      // 2단계: 줄기와 잎
      add(new THREE.CylinderGeometry(0.03, 0.04, 0.35, 8), M(0x6f9d68), container, 0, 0.17, 0);
      ball(container, 0.08, 0.22, 0, 0.1, 0.05, 0.08, M(0x8bc34a));
    } else {
      // 3단계: 개화 완료!
      add(new THREE.CylinderGeometry(0.04, 0.05, 0.45, 8), M(0x6f9d68), container, 0, 0.22, 0);
      ball(container, 0, 0.48, 0, 0.22, 0.18, 0.22, m.pinks);
      ball(container, 0, 0.52, 0, 0.1, 0.1, 0.1, m.gold);
    }
  });
}

/* 꽃 흔들림 효과용 */
const flowerGroups = [];

/* =========================================================
   캐릭터 GLTF 로드
========================================================= */

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

function loadOriginalCharacter(urlIndex = 0) {
  if (urlIndex >= characterUrls.length) return;

  characterLoader.load(
    characterUrls[urlIndex],
    gltf => {
      loadedCharacter = gltf.scene;
      const bounds = new THREE.Box3().setFromObject(loadedCharacter);
      const size = bounds.getSize(new THREE.Vector3());
      const center = bounds.getCenter(new THREE.Vector3());
      const height = Math.max(size.y, 0.001);

      loadedCharacter.scale.setScalar(3 / height);
      loadedCharacter.position.set(
        -center.x * loadedCharacter.scale.x,
        -bounds.min.y * loadedCharacter.scale.y,
        -center.z * loadedCharacter.scale.z
      );

      loadedCharacter.userData.walkBaseY = loadedCharacter.position.y;
      loadedCharacter.traverse(obj => {
        if (obj.isMesh) { obj.castShadow = true; obj.receiveShadow = true; }
      });
      avatar.add(loadedCharacter);
    },
    undefined,
    () => loadOriginalCharacter(urlIndex + 1)
  );
}
loadOriginalCharacter();

/* =========================================================
   3D 펫 모델링
========================================================= */

const pet = new THREE.Group();
scene.add(pet);
let petBodyGroup = null;

function clearGroup(group) {
  while (group.children.length) {
    const child = group.children.pop();
    child.traverse(obj => {
      if (obj.geometry) obj.geometry.dispose();
      if (obj.material) {
        if (Array.isArray(obj.material)) obj.material.forEach(m => m.dispose());
        else obj.material.dispose();
      }
    });
  }
}

function createPetModel(petId) {
  clearGroup(pet);
  const data = PETS[petId] || PETS.bunny;
  petBodyGroup = new THREE.Group();
  pet.add(petBodyGroup);

  const bodyMat = M(data.color);
  const earMat = M(data.earColor);

  ball(petBodyGroup, 0, 0.42, 0, 0.45, 0.36, 0.4, bodyMat);
  ball(petBodyGroup, 0, 0.78, -0.02, 0.34, 0.32, 0.32, bodyMat);

  if (petId === "cat") {
    for (const x of [-0.21, 0.21]) {
      const ear = add(new THREE.ConeGeometry(0.14, 0.38, 4), earMat, petBodyGroup, x, 1.05, -0.02);
      ear.rotation.z = x < 0 ? -0.25 : 0.25;
    }
  } else if (petId === "fox") {
    for (const x of [-0.22, 0.22]) {
      const ear = add(new THREE.ConeGeometry(0.16, 0.45, 5), earMat, petBodyGroup, x, 1.05, -0.02);
      ear.rotation.z = x < 0 ? -0.2 : 0.2;
    }
  } else {
    for (const x of [-0.21, 0.21]) {
      ball(petBodyGroup, x, 1.02, -0.02, 0.12, 0.22, 0.12, earMat);
    }
  }

  for (const x of [-0.12, 0.12]) {
    ball(petBodyGroup, x, 0.8, 0.28, 0.035, 0.045, 0.025, m.dark);
  }
  ball(petBodyGroup, -0.18, 0.69, 0.27, 0.055, 0.035, 0.02, m.pink);
  ball(petBodyGroup, 0.18, 0.69, 0.27, 0.055, 0.035, 0.02, m.pink);

  applyPetAccessories();
}

function applyPetAccessories() {
  if (!petBodyGroup) return;

  const petId = state.selectedPet;
  const acc = state.petAccessories[petId] || { hat: "none", outfit: "none" };

  const old = petBodyGroup.getObjectByName("petAccessories");
  if (old) petBodyGroup.remove(old);

  const group = new THREE.Group();
  group.name = "petAccessories";
  petBodyGroup.add(group);

  if (acc.hat === "flower") {
    ball(group, 0, 1.08, 0, 0.13, 0.08, 0.13, M(0xf19bb4));
  } else if (acc.hat === "beret") {
    ball(group, 0, 1.05, 0, 0.3, 0.09, 0.27, M(0xb998d9));
  } else if (acc.hat === "crown") {
    for (let i = 0; i < 3; i++) {
      const tooth = add(new THREE.ConeGeometry(0.06, 0.22, 5), m.gold, group, -0.12 + i * 0.12, 1.1, 0);
      tooth.rotation.z = i === 1 ? 0 : 0.12;
    }
  } else if (acc.hat === "leaf") {
    const leaf = ball(group, 0, 1.08, 0, 0.24, 0.06, 0.12, m.leaf2);
    leaf.rotation.z = -0.25;
  }

  if (acc.outfit === "scarf") {
    const scarf = add(new THREE.TorusGeometry(0.29, 0.07, 8, 24), M(0xef9da9), group, 0, 0.68, 0);
    scarf.rotation.x = Math.PI / 2;
  } else if (acc.outfit === "cape") {
    const cape = add(new THREE.ConeGeometry(0.48, 0.65, 4, 1, true), M(0x9f8fd2), group, 0, 0.45, -0.18);
    cape.rotation.x = Math.PI;
  } else if (acc.outfit === "ribbon") {
    ball(group, 0, 0.6, 0.3, 0.1, 0.07, 0.04, M(0xef86a6));
  }
}

createPetModel(state.selectedPet);

/* 숨겨진 조개 */
const shell = new THREE.Group();
scene.add(shell);
shell.position.set(8, 0.15, 5);
ball(shell, 0, 0.1, 0, 0.22, 0.11, 0.17, M(0xf4d6a2));

const sceneStatus = $("sceneStatus");

/* =========================================================
   저장 및 스타일 주입
========================================================= */

function save() {
  try {
    localStorage.setItem("mongleMindSave", JSON.stringify(state));
  } catch (e) {}
  updateUI();
}

function injectPetStyles() {
  if (document.getElementById("monglePetStyles")) return;
  const style = document.createElement("style");
  style.id = "monglePetStyles";
  style.textContent = `
    .mm-pet-ui { display:flex; flex-direction:column; gap:18px; margin-top:18px; }
    .mm-pet-card, .mm-pet-section { background:rgba(255,255,255,.86); border:1px solid rgba(120,100,150,.14); border-radius:24px; padding:18px; box-shadow:0 10px 30px rgba(80,60,100,.08); }
    .mm-pet-title { display:flex; align-items:center; justify-content:space-between; gap:12px; margin-bottom:12px; }
    .mm-pet-title h3 { margin:0; font-size:18px; }
    .mm-pet-currency { display:flex; gap:8px; flex-wrap:wrap; }
    .mm-currency { padding:8px 12px; border-radius:999px; background:#faf5ff; font-weight:700; font-size:13px; color:#5e35b1; }
    .mm-pet-grid { display:grid; grid-template-columns:repeat(3,minmax(0,1fr)); gap:10px; }
    .mm-pet-item { border:1px solid #eee7f5; background:#fff; border-radius:18px; padding:12px; text-align:center; cursor:pointer; transition:.18s; position:relative; }
    .mm-pet-item:hover { transform:translateY(-2px); }
    .mm-pet-item.active { border:2px solid #9b72cf; background:#faf5ff; }
    .mm-pet-icon { font-size:38px; margin-bottom:5px; }
    .mm-pet-name { font-weight:800; font-size:14px; }
    .mm-pet-rarity { font-size:11px; opacity:.75; margin-top:3px; font-weight:700; color:#7e57c2; }
    .mm-pet-button { border:0; border-radius:14px; padding:9px 12px; background:#9d82c4; color:#fff; font-weight:800; cursor:pointer; margin-top:8px; width:100%; transition:0.2s; }
    .mm-pet-button:hover { background:#8b6bb8; }
    .mm-pet-button.secondary { background:#f1eafa; color:#6e5689; }
    .mm-pet-button:disabled { opacity:.45; cursor:not-allowed; }
    .mm-pet-accessory-grid { display:grid; grid-template-columns:repeat(4,minmax(0,1fr)); gap:8px; }
    .mm-accessory { border:1px solid #eee7f5; background:#fff; border-radius:16px; padding:10px 5px; text-align:center; cursor:pointer; position:relative; }
    .mm-accessory.active { border:2px solid #9b72cf; background:#faf5ff; }
    .mm-accessory.owned::after { content:"✓소유"; position:absolute; top:4px; right:6px; font-size:9px; background:#ab47bc; color:#fff; padding:1px 4px; border-radius:6px; }
    .mm-accessory-icon { font-size:25px; }
    .mm-accessory-name { font-size:11px; margin-top:4px; font-weight:700; }
    .mm-rate-box { background:#f3e5f5; border-radius:14px; padding:10px 14px; font-size:12px; margin-bottom:12px; color:#4a148c; line-height:1.5; }
    .mm-gacha-result { text-align:center; padding:18px; border-radius:20px; background:linear-gradient(135deg,#fff8fd,#f6f1ff); margin-top:12px; display:none; }
    .mm-gacha-result.show { display:block; animation:mmPop .35s ease; }
    @keyframes mmPop { from { transform:scale(.9); opacity:0; } to { transform:scale(1); opacity:1; } }
  `;
  document.head.appendChild(style);
}
injectPetStyles();

/* =========================================================
   펫 UI 및 방 생성
========================================================= */

let petUI = null;
let questUI = null;
let petResultTimer = null;

function ensurePetUI() {
  const screen = document.querySelector('[data-screen="dress"]');
  if (!screen) return;
  if (!petUI) {
    petUI = document.createElement("div");
    petUI.className = "mm-pet-ui";
    screen.appendChild(petUI);
    petUI.addEventListener("click", handlePetClick);
  }
}

function ensureQuestUI() {
  const screen = document.querySelector('[data-screen="quests"]');
  if (!screen) return;
  if (!questUI) {
    questUI = document.createElement("div");
    questUI.className = "mm-pet-ui";
    screen.appendChild(questUI);
    questUI.addEventListener("click", handleQuestClick);
  }
}

function renderPetUI() {
  ensurePetUI();
  if (!petUI) return;

  const selected = PETS[state.selectedPet] || PETS.bunny;
  const acc = state.petAccessories[state.selectedPet] || { hat: "none", outfit: "none" };
  const owned = new Set(state.ownedPets);

  petUI.innerHTML = `
    <!-- 펫 전용 방 헤더 -->
    <div class="mm-pet-card" style="background:linear-gradient(135deg, #f3e5f5 0%, #fff 100%);">
      <div class="mm-pet-title">
        <h3>🏠 ${selected.name}의 포근한 방</h3>
        <div class="mm-pet-currency">
          <span class="mm-currency">✨ 별빛 ${state.petCurrency}</span>
          <span class="mm-currency">🪙 펫 코인 ${state.petCoins}</span>
        </div>
      </div>
      <div style="display:flex; align-items:center; gap:20px; padding:14px; border-radius:20px; background:rgba(255,255,255,0.8);">
        <div style="font-size:64px; animation:mmPop 0.5s;">${selected.icon}</div>
        <div>
          <div style="font-size:20px; font-weight:900; color:#4a148c;">${selected.name}</div>
          <div style="font-size:13px; color:#7e57c2; margin-top:4px; font-weight:700;">
            [${selected.rarity} 등급] · 나를 따라다니는 펫
          </div>
        </div>
      </div>
    </div>

    <!-- 펫 뽑기 (확률 표기 포함) -->
    <div class="mm-pet-section">
      <div class="mm-pet-title">
        <h3>🎁 펫 뽑기 (별빛 3개 소모)</h3>
      </div>
      
      <div class="mm-rate-box">
        <b>🎲 획득 확률 안내</b><br>
        • 일반(구름강아지/달빛고양이): 75%<br>
        • 희귀(살구여우/솜사탕곰): 22%<br>
        • 전설(별빛드래곤): 2.7% | 🌟 <b>신화(무지개유니콘)</b>: 0.3%
      </div>

      <button class="mm-pet-button" data-pet-action="draw" ${state.petCurrency < 3 ? "disabled" : ""}>
        ✨ 별빛 3개로 새로운 펫 뽑기
      </button>

      <div class="mm-gacha-result" id="petGachaResult"></div>
    </div>

    <!-- 펫 도감 -->
    <div class="mm-pet-section">
      <div class="mm-pet-title">
        <h3>📖 펫 도감</h3>
        <span style="font-size:12px; opacity:.7;">${state.ownedPets.length} / ${PET_LIST.length} 종</span>
      </div>
      <div class="mm-pet-grid">
        ${PET_LIST.map(p => {
          const has = owned.has(p.id);
          return `
            <div class="mm-pet-item ${state.selectedPet === p.id ? "active" : ""}" data-pet-action="select" data-pet-id="${p.id}">
              <div class="mm-pet-icon">${has ? p.icon : "❔"}</div>
              <div class="mm-pet-name">${has ? p.name : "???"}</div>
              <div class="mm-pet-rarity">${p.rarity}</div>
              ${has ? `<button class="mm-pet-button secondary" style="font-size:11px; padding:4px 8px;">${state.selectedPet === p.id ? "방 방문중" : "선택하기"}</button>` : ""}
            </div>
          `;
        }).join("")}
      </div>
    </div>

    <!-- 펫 옷장 (영구 소유 및 탈착) -->
    <div class="mm-pet-section">
      <div class="mm-pet-title">
        <h3>🎀 펫 전용 옷장</h3>
        <span style="font-size:11px; color:#888;">구매한 옷은 영구 소유하며 자유롭게 입히고 벗길 수 있습니다!</span>
      </div>

      <div style="font-weight:800; font-size:13px; margin-bottom:7px;">🎩 모자 선택</div>
      <div class="mm-pet-accessory-grid">
        ${Object.values(PET_HATS).map(h => {
          const isOwned = state.ownedPetHats.includes(h.id);
          const isEquipped = acc.hat === h.id;
          return `
            <div class="mm-accessory ${isEquipped ? "active" : ""} ${isOwned && h.id !== 'none' ? 'owned' : ''}" data-pet-action="hat" data-accessory="${h.id}">
              <div class="mm-accessory-icon">${h.icon}</div>
              <div class="mm-accessory-name">${h.name}</div>
              <div style="font-size:10px; margin-top:3px; color:#666;">
                ${isEquipped ? '<b>[착용중]</b>' : isOwned ? '소유함' : `🪙 ${h.price}`}
              </div>
            </div>
          `;
        }).join("")}
      </div>

      <div style="font-weight:800; font-size:13px; margin:16px 0 7px;">🧣 의상 선택</div>
      <div class="mm-pet-accessory-grid">
        ${Object.values(PET_OUTFITS).map(o => {
          const isOwned = state.ownedPetOutfits.includes(o.id);
          const isEquipped = acc.outfit === o.id;
          return `
            <div class="mm-accessory ${isEquipped ? "active" : ""} ${isOwned && o.id !== 'none' ? 'owned' : ''}" data-pet-action="outfit" data-accessory="${o.id}">
              <div class="mm-accessory-icon">${o.icon}</div>
              <div class="mm-accessory-name">${o.name}</div>
              <div style="font-size:10px; margin-top:3px; color:#666;">
                ${isEquipped ? '<b>[착용중]</b>' : isOwned ? '소유함' : `🪙 ${o.price}`}
              </div>
            </div>
          `;
        }).join("")}
      </div>
    </div>
  `;
}

function handlePetClick(e) {
  const target = e.target.closest("[data-pet-action]");
  if (!target) return;

  const action = target.dataset.petAction;

  if (action === "draw") { drawPet(); return; }
  if (action === "select") {
    const id = target.dataset.petId;
    if (!id || !state.ownedPets.includes(id)) return;

    state.selectedPet = id;
    if (!state.petAccessories[id]) {
      state.petAccessories[id] = { hat: "none", outfit: "none" };
    }
    createPetModel(id);
    save();
    toast(`${PETS[id].name}의 방으로 이동했습니다!`);
    return;
  }

  if (action === "hat") { equipPetHat(target.dataset.accessory); return; }
  if (action === "outfit") { equipPetOutfit(target.dataset.accessory); }
}

/* =========================================================
   펫 뽑기 & 소유형 의상 로직
========================================================= */

function drawPet() {
  if (state.petCurrency < 3) {
    toast("별빛이 부족해요! (필요: ✨3개)");
    return;
  }

  state.petCurrency -= 3;
  state.stats.petDraws = (state.stats.petDraws || 0) + 1;

  const roll = Math.random() * 100;
  let sum = 0;
  let result = PETS.puppy;

  for (const petData of PET_LIST) {
    if (petData.id === "bunny") continue;
    sum += petData.rate;
    if (roll <= sum) { result = petData; break; }
  }

  if (state.ownedPets.includes(result.id)) {
    state.petCoins += result.duplicateCoins;
    save();
    showGachaResult(`중복 펫 획득!`, `${result.icon} ${result.name}`, `이미 보유 중인 펫입니다. 🪙 펫 코인 ${result.duplicateCoins}개로 환산되었습니다.`);
    return;
  }

  state.ownedPets.push(result.id);
  if (!state.petAccessories[result.id]) {
    state.petAccessories[result.id] = { hat: "none", outfit: "none" };
  }
  save();
  showGachaResult(`🎉 축하합니다!`, `${result.icon} ${result.name}`, `[${result.rarity}] 등급의 펫을 새롭게 만났습니다!`);
}

function showGachaResult(title, name, description) {
  const result = document.getElementById("petGachaResult");
  if (!result) return;
  result.innerHTML = `
    <div style="font-size:13px; font-weight:800; opacity:.65;">${title}</div>
    <div style="font-size:42px; margin:8px 0;">${name}</div>
    <div style="font-size:13px;">${description}</div>
  `;
  result.classList.add("show");
  clearTimeout(petResultTimer);
  petResultTimer = setTimeout(() => result.classList.remove("show"), 5000);
}

function equipPetHat(id) {
  const item = PET_HATS[id];
  if (!item) return;

  const petId = state.selectedPet;
  if (!state.petAccessories[petId]) state.petAccessories[petId] = { hat: "none", outfit: "none" };

  const currentHat = state.petAccessories[petId].hat;

  // 이미 착용 중이면 해제
  if (currentHat === id) {
    state.petAccessories[petId].hat = "none";
    createPetModel(petId);
    save();
    toast(`${item.name}을(를) 벗었습니다.`);
    return;
  }

  // 구매하지 않은 옷이면 구입 후 영구 소유 저장
  if (!state.ownedPetHats.includes(id) && item.price > 0) {
    if (state.petCoins < item.price) {
      toast("펫 코인이 부족합니다.");
      return;
    }
    state.petCoins -= item.price;
    state.ownedPetHats.push(id);
    toast(`${item.name}을(를) 구매하여 영구 소유합니다!`);
  }

  state.petAccessories[petId].hat = id;
  createPetModel(petId);
  save();
  toast(`${item.name}을(를) 착용했습니다.`);
}

function equipPetOutfit(id) {
  const item = PET_OUTFITS[id];
  if (!item) return;

  const petId = state.selectedPet;
  if (!state.petAccessories[petId]) state.petAccessories[petId] = { hat: "none", outfit: "none" };

  const currentOutfit = state.petAccessories[petId].outfit;

  if (currentOutfit === id) {
    state.petAccessories[petId].outfit = "none";
    createPetModel(petId);
    save();
    toast(`${item.name}을(를) 벗었습니다.`);
    return;
  }

  if (!state.ownedPetOutfits.includes(id) && item.price > 0) {
    if (state.petCoins < item.price) {
      toast("펫 코인이 부족합니다.");
      return;
    }
    state.petCoins -= item.price;
    state.ownedPetOutfits.push(id);
    toast(`${item.name}을(를) 구매하여 영구 소유합니다!`);
  }

  state.petAccessories[petId].outfit = id;
  createPetModel(petId);
  save();
  toast(`${item.name}을(를) 착용했습니다.`);
}

/* =========================================================
   정원 UI 및 실시간 물주기 모션
========================================================= */

let gardenUI = null;

function ensureGardenUI() {
  const screen = document.querySelector('[data-screen="garden"]');
  if (!screen) return;
  if (!gardenUI) {
    gardenUI = document.createElement("div");
    gardenUI.className = "mm-pet-ui";
    screen.appendChild(gardenUI);
    gardenUI.addEventListener("click", handleGardenClick);
  }
}

function renderGardenUI() {
  ensureGardenUI();
  if (!gardenUI) return;

  const now = Date.now();

  gardenUI.innerHTML = `
    <div class="mm-pet-section">
      <div class="mm-pet-title">
        <h3>🌷 온라인 마음 정원</h3>
        <div class="mm-pet-currency">
          <span class="mm-currency">🪙 코인 ${state.coins}</span>
          <span class="mm-currency">🧪 비료 ${state.fertilizer}개</span>
        </div>
      </div>
      <div style="font-size:13px; opacity:.75; line-height:1.5;">
        원하는 모종을 구매하여 심어보세요! 물을 주면 캐릭터가 직접 정원으로 이동해 물을 줍니다.
      </div>
    </div>

    <!-- 모종 상점 및 선택 -->
    <div class="mm-pet-section">
      <div class="mm-pet-title"><h3>🌱 모종 상점 & 선택</h3></div>
      <div class="mm-pet-accessory-grid">
        ${Object.values(PLANTS).map(p => {
          const count = state.gardenSeeds[p.id] || 0;
          const isSelected = state.selectedGardenSeed === p.id;
          return `
            <div class="mm-accessory ${isSelected ? 'active' : ''}" data-garden-action="selectSeed" data-seed-id="${p.id}">
              <div class="mm-accessory-icon">${p.icon}</div>
              <div class="mm-accessory-name">${p.name}</div>
              <div style="font-size:10px; color:#777; margin-top:2px;">보유: ${count}개</div>
              <button class="mm-pet-button secondary" style="margin-top:6px; padding:3px 6px; font-size:10px;" data-garden-action="buySeed" data-seed-id="${p.id}">
                🪙 ${p.price} 구매
              </button>
            </div>
          `;
        }).join('')}
      </div>
    </div>

    <!-- 정원 밭 (6개 슬롯) -->
    <div class="mm-pet-section">
      <div class="mm-pet-title"><h3>🏡 나만의 밭 (6칸)</h3></div>
      <div class="mm-pet-grid">
        ${state.gardenPlots.map((plot, i) => {
          if (!plot.seedId) {
            return `
              <div class="mm-pet-item" data-garden-action="plant" data-plot-index="${i}">
                <div class="mm-pet-icon">🪴</div>
                <div class="mm-pet-name">빈 밭 ${i + 1}</div>
                <div style="font-size:11px; color:#888;">클릭하여 모종 심기</div>
              </div>
            `;
          }

          const plant = PLANTS[plot.seedId];
          const elapsed = (now - plot.plantedAt) / 1000 + (plot.growthBonus || 0);
          const isReady = elapsed >= plant.growth;
          const percent = Math.min(100, Math.floor((elapsed / plant.growth) * 100));

          return `
            <div class="mm-pet-item active">
              <div class="mm-pet-icon">${isReady ? plant.icon : '🌱'}</div>
              <div class="mm-pet-name">${plant.name}</div>
              <div class="mm-pet-rarity">${isReady ? '🌸 수확 가능!' : `성장 중 (${percent}%)`}</div>
              <div style="display:flex; gap:4px; margin-top:8px;">
                ${isReady ? `
                  <button class="mm-pet-button" data-garden-action="harvest" data-plot-index="${i}">수확하기</button>
                ` : `
                  <button class="mm-pet-button secondary" data-garden-action="water" data-plot-index="${i}">💧 물주기</button>
                  <button class="mm-pet-button secondary" data-garden-action="fertilize" data-plot-index="${i}">🧪 비료</button>
                `}
              </div>
            </div>
          `;
        }).join('')}
      </div>
    </div>
  `;
}

function triggerWateringAnimation() {
  isWateringAnim = true;
  // 캐릭터를 정원 위치로 이동
  avatar.position.set(-7, 0, 4.2);
  avatar.rotation.y = Math.PI;

  toast("💧 정원으로 다가가 식물에 물을 주고 있어요!");

  clearTimeout(wateringTimer);
  wateringTimer = setTimeout(() => {
    isWateringAnim = false;
  }, 2000);
}

function handleGardenClick(e) {
  const target = e.target.closest("[data-garden-action]");
  if (!target) return;

  const action = target.dataset.gardenAction;

  if (action === "selectSeed") {
    const id = target.dataset.seedId;
    state.selectedGardenSeed = id;
    save();
    toast(`${PLANTS[id].name} 모종을 심기용으로 선택했어요.`);
    return;
  }

  if (action === "buySeed") {
    e.stopPropagation();
    const id = target.dataset.seedId;
    const plant = PLANTS[id];

    if (state.coins < plant.price) {
      toast("코인이 부족해요.");
      return;
    }

    state.coins -= plant.price;
    state.gardenSeeds[id] = (state.gardenSeeds[id] || 0) + 1;
    state.stats.seedsBought = (state.stats.seedsBought || 0) + 1;
    save();
    toast(`${plant.name} 모종을 구매했어요!`);
    return;
  }

  if (action === "plant") {
    const index = Number(target.dataset.plotIndex);
    const seedId = state.selectedGardenSeed;

    if (!seedId) {
      toast("먼저 심을 모종을 선택해 주세요.");
      return;
    }

    if ((state.gardenSeeds[seedId] || 0) <= 0) {
      toast("선택한 모종의 보유 수량이 없습니다. 상점에서 구매해 보세요!");
      return;
    }

    state.gardenSeeds[seedId] -= 1;
    state.gardenPlots[index] = {
      id: index,
      seedId: seedId,
      plantedAt: Date.now(),
      growthBonus: 0,
      waterCount: 0,
      fertilizerCount: 0
    };
    state.stats.seedsPlanted = (state.stats.seedsPlanted || 0) + 1;
    save();
    toast(`${PLANTS[seedId].name} 모종을 밭에 심었습니다!`);
    return;
  }

  if (action === "water") {
    const index = Number(target.dataset.plotIndex);
    const plot = state.gardenPlots[index];
    if (!plot || !plot.seedId) return;

    plot.growthBonus = (plot.growthBonus || 0) + 8;
    plot.waterCount = (plot.waterCount || 0) + 1;
    state.stats.waters = (state.stats.waters || 0) + 1;
    state.watered = true;
    save();

    triggerWateringAnimation();
    return;
  }

  if (action === "fertilize") {
    const index = Number(target.dataset.plotIndex);
    const plot = state.gardenPlots[index];
    if (!plot || !plot.seedId) return;

    if (state.fertilizer < 1) {
      toast("비료가 부족해요.");
      return;
    }

    state.fertilizer -= 1;
    plot.growthBonus = (plot.growthBonus || 0) + 20;
    plot.fertilizerCount = (plot.fertilizerCount || 0) + 1;
    state.stats.fertilizers = (state.stats.fertilizers || 0) + 1;
    save();
    toast("영양 비료를 주어 성장을 크게 앞당겼습니다!");
    return;
  }

  if (action === "harvest") {
    const index = Number(target.dataset.plotIndex);
    const plot = state.gardenPlots[index];
    if (!plot || !plot.seedId) return;

    const plant = PLANTS[plot.seedId];
    state.coins += plant.reward;
    state.flowers += 1;
    state.stats.harvests = (state.stats.harvests || 0) + 1;
    xp(plant.xp);

    state.gardenPlots[index] = {
      id: index,
      seedId: null,
      plantedAt: 0,
      growthBonus: 0,
      waterCount: 0,
      fertilizerCount: 0
    };

    save();
    toast(`🌸 ${plant.name} 수확 완료! 코인 +${plant.reward}, 경험치 +${plant.xp}`);
  }
}

/* =========================================================
   퀘스트 & UI 업데이트
========================================================= */

function renderQuestUI() {
  ensureQuestUI();
  if (!questUI) return;

  questUI.innerHTML = `
    <div class="mm-pet-section">
      <div class="mm-pet-title">
        <h3>✨ 별빛 퀘스트</h3>
        <div class="mm-pet-currency">
          <span class="mm-currency">✨ 별빛 ${state.petCurrency}</span>
          <span class="mm-currency">🪙 코인 ${state.coins}</span>
        </div>
      </div>
    </div>

    ${QUESTS.map(q => {
      const progress = Math.min(q.goal, Math.max(0, Number(q.getProgress())));
      const claimed = state.questClaims.includes(q.id);
      const completed = progress >= q.goal;
      const percent = Math.min(100, (progress / q.goal) * 100);

      return `
        <div class="mm-quest ${completed ? "completed" : ""}" style="padding:14px; border-radius:18px; background:#fff; margin-bottom:10px; border:1px solid #eee;">
          <div style="display:flex; justify-content:space-between; align-items:center;">
            <div>
              <div style="font-weight:800;">${q.icon} ${q.title}</div>
              <div style="font-size:12px; color:#666; margin-top:2px;">${q.description} (${progress}/${q.goal})</div>
            </div>
            <button class="mm-pet-button" style="width:auto; margin:0; padding:6px 12px;" data-quest-action="claim" data-quest-id="${q.id}" ${!completed || claimed ? "disabled" : ""}>
              ${claimed ? "완료됨 ✓" : completed ? "보상받기" : "진행중"}
            </button>
          </div>
        </div>
      `;
    }).join("")}
  `;
}

function handleQuestClick(e) {
  const button = e.target.closest("[data-quest-action]");
  if (!button || button.dataset.questAction !== "claim") return;
  claimQuest(button.dataset.questId);
}

function claimQuest(id) {
  const quest = QUESTS.find(q => q.id === id);
  if (!quest || state.questClaims.includes(id)) return;

  if (Number(quest.getProgress()) < quest.goal) return;

  state.questClaims.push(id);
  state.petCurrency += quest.rewardPetCurrency;
  state.coins += quest.rewardCoins;
  xp(12);
  save();
  toast(`퀘스트 완료 보상 획득! ✨별빛 +${quest.rewardPetCurrency}`);
}

function updateUI() {
  const coins = $("coins");
  const level = $("level");
  const xpEl = $("xp");
  if (coins) coins.textContent = state.coins;
  if (level) level.textContent = state.level;
  if (xpEl) xpEl.textContent = state.xp;

  renderPetUI();
  renderQuestUI();
  renderGardenUI();
  update3DGardenVisuals();
}

function toast(s) {
  const e = $("toast");
  if (!e) return;
  e.textContent = s;
  e.classList.add("show");
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => e.classList.remove("show"), 2400);
}

function levelUp() {
  while (state.xp >= 100) {
    state.xp -= 100;
    state.level++;
    state.coins += 20;
    toast("🎉 레벨 업! 보상 코인 +20");
  }
}

function xp(n) {
  state.xp += n;
  levelUp();
}

function closeDialog() {
  const dialog = $("dialog");
  if (dialog) dialog.hidden = true;
}

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

/* 상호작용 타겟 */
function target() {
  const a = [
    { id: "garden", x: -7, z: 2.8, r: 2.7, label: "정원 관리" },
    { id: "animal", x: 2.5, z: 5.7, r: 2.5, label: "펫 전용 방" },
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
    toast("마을 장소나 펫 가까이 다가가 E를 눌러보세요.");
    return;
  }

  if (t.id === "garden") { showPage("garden"); return; }
  if (t.id === "animal") { showPage("dress"); return; }
  if (t.id === "shell") {
    state.foundShell = true;
    state.coins += 10;
    xp(10);
    shell.visible = false;
    save();
    toast("반짝이는 조개 발견! 코인 +10");
    return;
  }
}

function showPage(page) {
  const allowed = ["home", "village", "dress", "garden", "room", "journal", "quests"];
  if (!allowed.includes(page)) page = "home";

  state.nav = page;
  document.querySelectorAll("[data-screen]").forEach(el => {
    el.hidden = el.dataset.screen !== page;
  });

  document.querySelectorAll(".nav-item").forEach(b => {
    b.classList.toggle("active", b.dataset.nav === page);
  });

  save();
  if (page === "village") requestAnimationFrame(() => resize());
}

document.querySelectorAll("[data-page]").forEach(b => b.addEventListener("click", () => showPage(b.dataset.page)));
document.querySelectorAll(".nav-item").forEach(b => b.addEventListener("click", () => showPage(b.dataset.nav)));

/* =========================================================
   이동 및 키보드 조작
========================================================= */

window.addEventListener("keydown", e => {
  keys[e.key.toLowerCase()] = true;
  if (["ArrowUp", "ArrowDown", "ArrowLeft", "ArrowRight", " "].includes(e.key)) e.preventDefault();
  if (e.key.toLowerCase() === "e" && $("dialog").hidden) interact();
  if (e.key === "Escape") closeDialog();
});

window.addEventListener("keyup", e => keys[e.key.toLowerCase()] = false);

/* =========================================================
   3D 애니메이션 루프
========================================================= */

function resize() {
  const w = Math.max(root.clientWidth, 320);
  const h = Math.max(root.clientHeight, 320);
  renderer.setSize(w, h, false);
  camera.aspect = w / h;
  camera.updateProjectionMatrix();
}

new ResizeObserver(resize).observe(root);
resize();
showPage(state.nav || "home");
updateUI();

function animate(t) {
  requestAnimationFrame(animate);

  const dt = Math.min((t - last) / 1000 || 0, 0.05);
  last = t;

  let moving = false;

  if ($("dialog").hidden && !isWateringAnim) {
    let dx = 0, dz = 0;
    if (keys.arrowleft || keys.a) dx--;
    if (keys.arrowright || keys.d) dx++;
    if (keys.arrowup || keys.w) dz--;
    if (keys.arrowdown || keys.s) dz++;

    if (dx || dz) {
      const len = Math.hypot(dx, dz);
      dx /= len; dz /= len;
      moving = true;

      avatar.position.x = THREE.MathUtils.clamp(avatar.position.x + dx * dt * 4.5, -13, 13);
      avatar.position.z = THREE.MathUtils.clamp(avatar.position.z + dz * dt * 4.5, -13, 13);
      avatar.rotation.y = Math.atan2(dx, dz);
    }
  }

  // 걷기 / 물주기 모션 연출
  walkBlend = THREE.MathUtils.damp(walkBlend, moving ? 1 : 0, 8, dt);
  if (moving) walkPhase += dt * 8;

  if (loadedCharacter) {
    const baseY = loadedCharacter.userData.walkBaseY ?? 0;

    if (isWateringAnim) {
      // 물주는 인사/기우뚱 모션
      loadedCharacter.rotation.x = Math.sin(t * 0.01) * 0.25 + 0.2;
      loadedCharacter.position.y = baseY;
    } else {
      const bounce = Math.abs(Math.sin(walkPhase * 2)) * 0.055 * walkBlend;
      loadedCharacter.position.y = baseY + bounce;
      loadedCharacter.rotation.x = -0.018 * walkBlend;
    }
  }

  // 펫 따라오기
  pet.position.set(
    avatar.position.x + 0.9,
    Math.abs(Math.sin(t * 0.003)) * 0.05,
    avatar.position.z + 1
  );
  pet.rotation.y = avatar.rotation.y;

  // 실시간 3D 정원 식물 성장 상태 갱신
  update3DGardenVisuals();

  // 카메라 동기화
  camera.position.lerp(new THREE.Vector3(avatar.position.x, 6.5, avatar.position.z + 27), 0.055);
  camera.lookAt(avatar.position.x, 1.45, avatar.position.z - 1);

  const near = target();
  if (sceneStatus) {
    sceneStatus.textContent = near ? `E · ${near.label}` : "나만의 정원과 펫을 가꿔보세요";
  }

  state.x = avatar.position.x;
  state.z = avatar.position.z;

  renderer.render(scene, camera);
}

requestAnimationFrame(animate);

})();
