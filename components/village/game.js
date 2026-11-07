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
  coins: 30,
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

  /* 퀘스트 */
  questClaims: [],

  /* 정원 */
  gardenPlots: [],
  gardenSeeds: {},
  selectedGardenSeed: null,
  fertilizer: 3,

  /* 활동 통계 */
  stats: {
    seedsPlanted: 0,
    seedsBought: 0,
    waters: 0,
    fertilizers: 0,
    harvests: 0,
    petGreetings: 0,
    breaths: 0,
    journals: 0,
    shellFinds: 0
  },

  /* 펫 */
  petCurrency: 0,
  petCoins: 0,

  ownedPets: ["bunny"],
  selectedPet: "bunny",

  petFragments: {},

  petAccessories: {
    bunny: {
      hat: "none",
      outfit: "none"
    }
  },

  selectedPetAccessory: {
    hat: "none",
    outfit: "none"
  }
};

let state = { ...defaults };

try {
  const saved = JSON.parse(
    localStorage.getItem("mongleMindSave") || "null"
  );

  if (saved) {
    state = {
      ...defaults,
      ...saved,
      stats: {
        ...defaults.stats,
        ...(saved.stats || {})
      },
      petAccessories: {
        ...defaults.petAccessories,
        ...(saved.petAccessories || {})
      },
      selectedPetAccessory: {
        ...defaults.selectedPetAccessory,
        ...(saved.selectedPetAccessory || {})
      }
    };
  }
} catch (e) {}

/* =========================================================
   오래된 저장 데이터 보정
========================================================= */

if (!Array.isArray(state.questClaims)) state.questClaims = [];

if (!Array.isArray(state.ownedPets)) {
  state.ownedPets = ["bunny"];
}

if (!state.ownedPets.includes("bunny")) {
  state.ownedPets.unshift("bunny");
}

if (!state.petAccessories || typeof state.petAccessories !== "object") {
  state.petAccessories = {};
}

if (!state.petAccessories.bunny) {
  state.petAccessories.bunny = {
    hat: "none",
    outfit: "none"
  };
}

if (!state.petFragments || typeof state.petFragments !== "object") {
  state.petFragments = {};
}

if (!state.stats || typeof state.stats !== "object") {
  state.stats = { ...defaults.stats };
}

state.stats = {
  ...defaults.stats,
  ...state.stats
};

if (typeof state.petCurrency !== "number") {
  state.petCurrency = 0;
}

if (typeof state.petCoins !== "number") {
  state.petCoins = 0;
}

if (!state.selectedPet || !state.ownedPets.includes(state.selectedPet)) {
  state.selectedPet = "bunny";
}

if (!state.selectedPetAccessory) {
  state.selectedPetAccessory = {
    hat: "none",
    outfit: "none"
  };
}

if (!Array.isArray(state.gardenPlots) || state.gardenPlots.length !== 6) {
  state.gardenPlots = Array.from({ length: 6 }, (_, i) => ({
    id: i,
    seedId: null,
    plantedAt: 0,
    growthBonus: 0,
    waterCount: 0,
    fertilizerCount: 0,
    lastWateredAt: 0
  }));
}

if (!state.gardenSeeds || typeof state.gardenSeeds !== "object") {
  state.gardenSeeds = {};
}

if (typeof state.fertilizer !== "number") {
  state.fertilizer = 3;
}

if (typeof state.x !== "number" || Math.abs(state.x) > 20) {
  state.x = 0;
}

if (typeof state.z !== "number" || Math.abs(state.z) > 20) {
  state.z = 4;
}

if (typeof state.journalText !== "string") {
  state.journalText = "";
}

if (!state.roomDecor) {
  state.roomDecor = "lavender";
}

/* =========================================================
   펫 데이터
========================================================= */

const PETS = {
  bunny: {
    id: "bunny",
    name: "몽글토끼",
    icon: "🐰",
    rarity: "기본",
    color: 0xfff4ec,
    earColor: 0xe8b9c2,
    rate: 0,
    duplicateCoins: 10,
    fragmentNeed: 10
  },

  puppy: {
    id: "puppy",
    name: "구름강아지",
    icon: "🐶",
    rarity: "일반",
    color: 0xe8c39b,
    earColor: 0xc9956b,
    rate: 38,
    duplicateCoins: 15,
    fragmentNeed: 10
  },

  cat: {
    id: "cat",
    name: "달빛고양이",
    icon: "🐱",
    rarity: "일반",
    color: 0xcfc7df,
    earColor: 0xa99dbc,
    rate: 30,
    duplicateCoins: 18,
    fragmentNeed: 10
  },

  fox: {
    id: "fox",
    name: "살구여우",
    icon: "🦊",
    rarity: "희귀",
    color: 0xf0a66c,
    earColor: 0xd77a4f,
    rate: 18,
    duplicateCoins: 25,
    fragmentNeed: 15
  },

  bear: {
    id: "bear",
    name: "솜사탕곰",
    icon: "🐻",
    rarity: "희귀",
    color: 0xc9a78d,
    earColor: 0xa98268,
    rate: 10,
    duplicateCoins: 30,
    fragmentNeed: 15
  },

  star: {
    id: "star",
    name: "별빛친구",
    icon: "⭐",
    rarity: "특별",
    color: 0xf3d47b,
    earColor: 0xf1bd62,
    rate: 4,
    duplicateCoins: 50,
    fragmentNeed: 20
  }
};

const PET_LIST = Object.values(PETS);

/* =========================================================
   펫 액세서리
========================================================= */

const PET_HATS = {
  none: {
    id: "none",
    name: "없음",
    icon: "—",
    price: 0
  },

  flower: {
    id: "flower",
    name: "꽃 머리핀",
    icon: "🌸",
    price: 15
  },

  beret: {
    id: "beret",
    name: "포근 베레모",
    icon: "🧢",
    price: 25
  },

  crown: {
    id: "crown",
    name: "별 왕관",
    icon: "👑",
    price: 40
  },

  leaf: {
    id: "leaf",
    name: "숲의 잎모자",
    icon: "🍃",
    price: 30
  }
};

const PET_OUTFITS = {
  none: {
    id: "none",
    name: "없음",
    icon: "—",
    price: 0
  },

  scarf: {
    id: "scarf",
    name: "포근 목도리",
    icon: "🧣",
    price: 20
  },

  cape: {
    id: "cape",
    name: "작은 망토",
    icon: "🪽",
    price: 35
  },

  ribbon: {
    id: "ribbon",
    name: "리본 장식",
    icon: "🎀",
    price: 25
  }
};

/* =========================================================
   펫 뽑기 퀘스트
========================================================= */

const QUESTS = [
  {
    id: "pet_draw_1",
    icon: "✨",
    title: "새로운 친구 만나기",
    description: "펫 뽑기를 1회 진행해 보세요.",
    goal: 1,
    rewardPetCurrency: 3,
    rewardCoins: 0,
    getProgress: () => state.stats.petDraws || 0
  },

  {
    id: "pet_draw_3",
    icon: "🎁",
    title: "친구를 찾아서",
    description: "펫 뽑기를 3회 진행해 보세요.",
    goal: 3,
    rewardPetCurrency: 5,
    rewardCoins: 5,
    getProgress: () => state.stats.petDraws || 0
  },

  {
    id: "pet_collect_2",
    icon: "🐾",
    title: "친구 둘",
    description: "서로 다른 펫 2종을 모아 보세요.",
    goal: 2,
    rewardPetCurrency: 8,
    rewardCoins: 10,
    getProgress: () => state.ownedPets.length
  },

  {
    id: "pet_collect_4",
    icon: "📖",
    title: "작은 펫 도감",
    description: "서로 다른 펫 4종을 모아 보세요.",
    goal: 4,
    rewardPetCurrency: 12,
    rewardCoins: 15,
    getProgress: () => state.ownedPets.length
  },

  {
    id: "pet_fragment_5",
    icon: "🧩",
    title: "조각 모으기",
    description: "펫 조각을 5개 모아 보세요.",
    goal: 5,
    rewardPetCurrency: 4,
    rewardCoins: 0,
    getProgress: () =>
      Object.values(state.petFragments || {}).reduce(
        (sum, n) => sum + Number(n || 0),
        0
      )
  },

  {
    id: "garden_harvest_2",
    icon: "🌷",
    title: "정원에서 수확하기",
    description: "정원에서 식물을 2번 수확해 보세요.",
    goal: 2,
    rewardPetCurrency: 3,
    rewardCoins: 10,
    getProgress: () => state.stats.harvests
  },

  {
    id: "water_3",
    icon: "💧",
    title: "정원 돌보기",
    description: "식물에게 물을 3번 주세요.",
    goal: 3,
    rewardPetCurrency: 3,
    rewardCoins: 5,
    getProgress: () => state.stats.waters
  },

  {
    id: "breath_1",
    icon: "🌿",
    title: "잠깐의 쉼",
    description: "호흡 활동을 끝까지 완료해 보세요.",
    goal: 1,
    rewardPetCurrency: 3,
    rewardCoins: 5,
    getProgress: () => state.stats.breaths
  },

  {
    id: "journal_1",
    icon: "💭",
    title: "마음 남기기",
    description: "오늘의 마음을 기록해 보세요.",
    goal: 1,
    rewardPetCurrency: 3,
    rewardCoins: 5,
    getProgress: () => state.stats.journals
  },

  {
    id: "shell_1",
    icon: "🐚",
    title: "숨겨진 반짝임",
    description: "마을에 숨겨진 조개를 찾아 보세요.",
    goal: 1,
    rewardPetCurrency: 5,
    rewardCoins: 8,
    getProgress: () => state.stats.shellFinds
  }
];

if (typeof state.stats.petDraws !== "number") {
  state.stats.petDraws = 0;
}

/* =========================================================
   정원 데이터
========================================================= */

const PLANTS = {
  tulip: {
    id: "tulip",
    name: "튤립",
    icon: "🌷",
    price: 10,
    growth: 30,
    reward: 20,
    xp: 10
  },

  sunflower: {
    id: "sunflower",
    name: "해바라기",
    icon: "🌻",
    price: 15,
    growth: 45,
    reward: 28,
    xp: 13
  },

  lavender: {
    id: "lavender",
    name: "라벤더",
    icon: "💜",
    price: 20,
    growth: 55,
    reward: 35,
    xp: 16
  },

  strawberry: {
    id: "strawberry",
    name: "딸기",
    icon: "🍓",
    price: 25,
    growth: 65,
    reward: 45,
    xp: 20
  },

  mint: {
    id: "mint",
    name: "민트",
    icon: "🌿",
    price: 18,
    growth: 50,
    reward: 32,
    xp: 15
  },

  moonflower: {
    id: "moonflower",
    name: "달빛꽃",
    icon: "🌙",
    price: 40,
    growth: 80,
    reward: 75,
    xp: 30
  }
};

/* =========================================================
   변수
========================================================= */

let keys = {};
let toastTimer;
let breathTimer;
let breathStep = 0;
let breathing = false;
let last = 0;

let walkBlend = 0;
let walkPhase = 0;

const colors = {
  lavender: 0xb7a5e5,
  peach: 0xefb39e,
  mint: 0x9acdb5
};

const moodNames = {
  calm: "차분한 마음을 기록했어요.",
  happy: "기쁜 마음을 기록했어요.",
  tired: "지친 마음을 기록했어요.",
  worried: "걱정되는 마음을 기록했어요."
};

/* =========================================================
   Three.js 마을
========================================================= */

const scene = new THREE.Scene();

scene.background = new THREE.Color(0xbadcf3);
scene.fog = new THREE.Fog(0xd5e7ce, 28, 60);

const camera = new THREE.PerspectiveCamera(43, 1, 0.1, 120);
camera.position.set(0, 6.5, 27);

const renderer = new THREE.WebGLRenderer({
  antialias: true
});

renderer.setPixelRatio(
  Math.min(devicePixelRatio || 1, 2)
);

renderer.shadowMap.enabled = true;
renderer.shadowMap.type = THREE.PCFSoftShadowMap;
renderer.outputColorSpace = THREE.SRGBColorSpace;
renderer.toneMapping = THREE.ACESFilmicToneMapping;
renderer.toneMappingExposure = 1.15;

root.replaceChildren(renderer.domElement);

scene.add(
  new THREE.HemisphereLight(
    0xfff7ed,
    0x78936c,
    2
  )
);

const sun = new THREE.DirectionalLight(
  0xffefd7,
  3
);

sun.position.set(-8, 17, 10);
sun.castShadow = true;
sun.shadow.mapSize.set(1024, 1024);
scene.add(sun);

const M = c =>
  new THREE.MeshStandardMaterial({
    color: c,
    roughness: 0.86
  });

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
  dark: M(0x43343b),
  pink: M(0xf1b5c5),
  gold: M(0xf1c76f),
  pinks: M(0xf3a4c4),
  lilac: M(0xc8a9ec),
  yellow: M(0xffdc85)
};

function add(
  g,
  mat,
  parent,
  x,
  y,
  z,
  sx = 1,
  sy = 1,
  sz = 1
) {
  const o = new THREE.Mesh(g, mat);

  o.position.set(x, y, z);
  o.scale.set(sx, sy, sz);

  o.castShadow = true;
  o.receiveShadow = true;

  parent.add(o);

  return o;
}

function box(
  parent,
  x,
  y,
  z,
  w,
  h,
  d,
  mat
) {
  return add(
    new THREE.BoxGeometry(w, h, d),
    mat,
    parent,
    x,
    y,
    z
  );
}

function ball(
  parent,
  x,
  y,
  z,
  sx,
  sy,
  sz,
  mat
) {
  return add(
    new THREE.SphereGeometry(1, 18, 12),
    mat,
    parent,
    x,
    y,
    z,
    sx,
    sy,
    sz
  );
}

/* 바닥 */

const ground = add(
  new THREE.PlaneGeometry(90, 90),
  m.grass,
  scene,
  0,
  -0.12,
  0
);

ground.rotation.x = -Math.PI / 2;

/* 길 */

for (let i = 0; i < 15; i++) {
  const p = box(
    scene,
    Math.sin(i * 0.28) * 1.6,
    0.01,
    11 - i * 1.55,
    4.2,
    0.07,
    1.65,
    i % 3 ? m.path : m.path2
  );

  p.rotation.y =
    Math.sin(i * 0.28) * -0.1;
}

/* 연못 */

const pond = add(
  new THREE.CylinderGeometry(3, 3, 0.15, 40),
  m.water,
  scene,
  7,
  0.03,
  1,
  1,
  1,
  0.72
);

const rim = add(
  new THREE.TorusGeometry(3, 0.16, 8, 40),
  m.white,
  scene,
  7,
  0.12,
  1,
  1,
  1,
  0.72
);

rim.rotation.x = Math.PI / 2;

/* 집 */

const house = new THREE.Group();
scene.add(house);

house.position.set(-5, 0, -5);

box(
  house,
  0,
  1.1,
  0,
  5.3,
  2.2,
  4,
  m.cream
);

const r1 = box(
  house,
  -1.3,
  2.45,
  0,
  3.2,
  0.2,
  4.8,
  m.roof
);

r1.rotation.z = 0.52;

const r2 = box(
  house,
  1.3,
  2.45,
  0,
  3.2,
  0.2,
  4.8,
  m.roof2
);

r2.rotation.z = -0.52;

box(
  house,
  0,
  0.85,
  2.04,
  1,
  1.65,
  0.15,
  m.wood
);

ball(
  house,
  0.3,
  0.85,
  2.15,
  0.06,
  0.06,
  0.04,
  m.gold
);

for (const x of [-1.6, 1.6]) {
  box(
    house,
    x,
    1.35,
    2.05,
    0.8,
    0.7,
    0.12,
    M(0x9cced8)
  );

  box(
    house,
    x,
    1.35,
    2.12,
    0.07,
    0.7,
    0.04,
    m.white
  );

  box(
    house,
    x,
    1.35,
    2.12,
    0.8,
    0.07,
    0.04,
    m.white
  );
}

/* 나무 */

function tree(x, z, s = 1) {
  const g = new THREE.Group();

  scene.add(g);

  g.position.set(x, 0, z);
  g.scale.setScalar(s);

  add(
    new THREE.CylinderGeometry(
      0.2,
      0.28,
      1.5,
      10
    ),
    m.wood,
    g,
    0,
    0.75,
    0
  );

  ball(
    g,
    0,
    1.95,
    0,
    0.95,
    1.05,
    0.9,
    m.leaf
  );

  ball(
    g,
    -0.52,
    1.75,
    0.02,
    0.7,
    0.75,
    0.7,
    m.leaf2
  );

  ball(
    g,
    0.55,
    1.8,
    -0.03,
    0.7,
    0.8,
    0.7,
    m.leaf3
  );

  ball(
    g,
    -0.15,
    2.48,
    0.1,
    0.62,
    0.68,
    0.6,
    m.leaf2
  );
}

[
  [-10, -8, 1.2],
  [-9, 1, 0.9],
  [-10, 7, 1.1],
  [10, -8, 1.2],
  [11, -2, 0.95],
  [10, 8, 1.1],
  [4, -10, 0.8],
  [-2, -12, 0.8]
].forEach(a => tree(...a));

/* 꽃 */

const flowerGroups = [];

function flower(
  x,
  z,
  color,
  scale = 1
) {
  const g = new THREE.Group();

  scene.add(g);

  g.position.set(x, 0, z);
  g.scale.setScalar(scale);

  add(
    new THREE.CylinderGeometry(
      0.025,
      0.04,
      0.42,
      7
    ),
    M(0x6f9d68),
    g,
    0,
    0.22,
    0
  );

  for (let i = 0; i < 5; i++) {
    const a =
      i * Math.PI * 2 / 5;

    ball(
      g,
      Math.cos(a) * 0.14,
      0.46,
      Math.sin(a) * 0.14,
      0.12,
      0.08,
      0.12,
      color
    );
  }

  ball(
    g,
    0,
    0.48,
    0,
    0.075,
    0.07,
    0.075,
    m.gold
  );

  flowerGroups.push(g);
}

function bed(x, z) {
  box(
    scene,
    x,
    0.08,
    z,
    4.1,
    0.17,
    2.1,
    M(0x7c9d68)
  );

  box(
    scene,
    x,
    0.17,
    z,
    3.8,
    0.1,
    1.8,
    M(0x80624c)
  );

  const cs = [
    m.pinks,
    m.yellow,
    m.white,
    m.lilac
  ];

  for (let i = 0; i < 5; i++) {
    for (let j = 0; j < 2; j++) {
      flower(
        x - 1.5 + i * 0.75,
        z - 0.45 + j * 0.85,
        cs[(i + j) % 4],
        0.72
      );
    }
  }
}

bed(-7, 2.8);
bed(1, -1.2);
bed(7, 7);

for (let i = 0; i < 42; i++) {
  const x =
    Math.sin(i * 12.3) * 12;

  const z =
    Math.cos(i * 7.1) * 11;

  if (
    Math.abs(x) < 3 &&
    z > 0 &&
    z < 10
  ) continue;

  flower(
    x,
    z,
    [
      m.pinks,
      m.yellow,
      m.white,
      m.lilac
    ][i % 4],
    0.45 + (i % 3) * 0.1
  );
}

/* 울타리 */

for (let i = 0; i < 7; i++) {
  box(
    scene,
    -10 + i * 0.62,
    0.43,
    4.8,
    0.12,
    0.86,
    0.12,
    m.white
  );

  if (i < 6) {
    box(
      scene,
      -9.7 + i * 0.62,
      0.52,
      4.8,
      0.58,
      0.12,
      0.12,
      M(0xb98767)
    );
  }
}

/* 가로등 */

function lamp(x, z) {
  add(
    new THREE.CylinderGeometry(
      0.07,
      0.1,
      1.3,
      10
    ),
    m.wood,
    scene,
    x,
    0.65,
    z
  );

  box(
    scene,
    x,
    1.36,
    z,
    0.48,
    0.4,
    0.48,
    m.cream
  );

  ball(
    scene,
    x,
    1.36,
    z,
    0.12,
    0.13,
    0.12,
    m.gold
  );
}

lamp(-2, -1);
lamp(3, 4);
lamp(-8, 6);

/* 관목 */

const shrubMat = M(0x7fae79);
const shrubLight = M(0xa9cd91);
const stoneMat = M(0xd7c9b5);
const pinkMat = M(0xf3bfd0);

function shrub(x, z, s = 1) {
  const g = new THREE.Group();

  scene.add(g);

  g.position.set(x, 0, z);
  g.scale.setScalar(s);

  ball(
    g,
    0,
    0.35,
    0,
    0.52,
    0.38,
    0.45,
    shrubMat
  );

  ball(
    g,
    -0.32,
    0.43,
    0.02,
    0.34,
    0.31,
    0.34,
    shrubLight
  );

  ball(
    g,
    0.3,
    0.4,
    -0.06,
    0.34,
    0.3,
    0.34,
    shrubLight
  );

  flower(
    x - 0.1,
    z - 0.05,
    pinkMat,
    0.42
  );
}

[
  [-4, 4],
  [-3, 4.3],
  [-2, 4.4],
  [4, 2],
  [4.6, 2.2],
  [5.2, 2.1],
  [-8, -2],
  [-7.2, -2.1],
  [8, 4.5],
  [8.8, 4.6],
  [-6, -8],
  [-4, -8],
  [6, -6],
  [8, -6]
].forEach((p, i) =>
  shrub(
    p[0],
    p[1],
    i % 3 === 0 ? 0.9 : 0.7
  )
);

/* 돌 */

function steppingStone(x, z, rot = 0) {
  const o = add(
    new THREE.CylinderGeometry(
      0.32,
      0.36,
      0.09,
      7
    ),
    stoneMat,
    scene,
    x,
    0.02,
    z
  );

  o.rotation.y = rot;
}

for (let i = 0; i < 7; i++) {
  steppingStone(
    -2.6 + i * 0.78,
    7.2 + Math.sin(i * 0.55) * 0.18,
    i * 0.2
  );

  steppingStone(
    3.1 + i * 0.65,
    -4.2 + Math.sin(i * 0.7) * 0.22,
    i * 0.17
  );
}

/* 버섯 */

function mushroom(x, z, s = 1) {
  const g = new THREE.Group();

  scene.add(g);

  g.position.set(x, 0, z);
  g.scale.setScalar(s);

  add(
    new THREE.CylinderGeometry(
      0.12,
      0.16,
      0.42,
      10
    ),
    M(0xffefdc),
    g,
    0,
    0.21,
    0
  );

  ball(
    g,
    0,
    0.45,
    0,
    0.36,
    0.19,
    0.35,
    M(0xe995a7)
  );
}

mushroom(-8, 4, 0.8);
mushroom(-4, -3, 0.7);
mushroom(9, -3, 0.9);
mushroom(5, 8, 0.65);

/* 우편함 */

function mailbox(x, z) {
  const g = new THREE.Group();

  scene.add(g);

  g.position.set(x, 0, z);

  add(
    new THREE.CylinderGeometry(
      0.055,
      0.07,
      1.1,
      8
    ),
    m.wood,
    g,
    0,
    0.55,
    0
  );

  box(
    g,
    0,
    1.15,
    0,
    0.65,
    0.48,
    0.42,
    M(0xd58c9a)
  );

  box(
    g,
    0,
    1.18,
    0.22,
    0.3,
    0.08,
    0.025,
    m.cream
  );
}

mailbox(-2.8, -4.2);

/* 표지판 */

function signpost(
  x,
  z,
  labelColor = 0xe9b6c6
) {
  const g = new THREE.Group();

  scene.add(g);

  g.position.set(x, 0, z);

  add(
    new THREE.CylinderGeometry(
      0.06,
      0.08,
      1.5,
      8
    ),
    m.wood,
    g,
    0,
    0.75,
    0
  );

  box(
    g,
    0,
    1.35,
    0,
    0.95,
    0.48,
    0.13,
    M(labelColor)
  );
}

signpost(3.6, -3.7);
signpost(-8, 0, 0xb8c9e8);

/* =========================================================
   캐릭터
========================================================= */

const avatar = new THREE.Group();
scene.add(avatar);

const limbs = [];

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

const characterLoader = new GLTFLoader();

const characterUrls = [
  "https://cdn.jsdelivr.net/gh/boyoung0819/mongle-mind@main/components/village/character.glb",
  "https://raw.githubusercontent.com/boyoung0819/mongle-mind/main/components/village/character.glb"
];

let loadedCharacter = null;

function loadOriginalCharacter(urlIndex = 0) {
  if (urlIndex >= characterUrls.length) {
    console.error(
      "모든 주소에서 character.glb를 불러오지 못했습니다."
    );

    toast(
      "캐릭터 파일을 불러오지 못했어요."
    );

    return;
  }

  characterLoader.load(
    characterUrls[urlIndex],
    gltf => {
      loadedCharacter = gltf.scene;

      const bounds =
        new THREE.Box3().setFromObject(
          loadedCharacter
        );

      const size =
        bounds.getSize(
          new THREE.Vector3()
        );

      const center =
        bounds.getCenter(
          new THREE.Vector3()
        );

      const height =
        Math.max(size.y, 0.001);

      loadedCharacter.scale.setScalar(
        3 / height
      );

      loadedCharacter.position.set(
        -center.x *
          loadedCharacter.scale.x,

        -bounds.min.y *
          loadedCharacter.scale.y,

        -center.z *
          loadedCharacter.scale.z
      );

      loadedCharacter.userData.walkBaseY =
        loadedCharacter.position.y;

      loadedCharacter.userData.walkBaseRotationX =
        loadedCharacter.rotation.x;

      loadedCharacter.userData.walkBaseRotationZ =
        loadedCharacter.rotation.z;

      loadedCharacter.traverse(obj => {
        if (!obj.isMesh) return;

        obj.castShadow = true;
        obj.receiveShadow = true;
      });

      avatar.add(loadedCharacter);
    },

    undefined,

    error => {
      console.warn(
        "캐릭터 로드 실패",
        error
      );

      loadOriginalCharacter(
        urlIndex + 1
      );
    }
  );
}

loadOriginalCharacter();

/* =========================================================
   펫 3D 모델
========================================================= */

const pet = new THREE.Group();
scene.add(pet);

let petBodyGroup = null;

function clearGroup(group) {
  while (group.children.length) {
    const child = group.children.pop();

    child.traverse(obj => {
      if (obj.geometry) {
        obj.geometry.dispose();
      }

      if (obj.material) {
        if (Array.isArray(obj.material)) {
          obj.material.forEach(m => m.dispose());
        } else {
          obj.material.dispose();
        }
      }
    });
  }
}

function createPetModel(petId) {
  clearGroup(pet);

  const data =
    PETS[petId] || PETS.bunny;

  petBodyGroup =
    new THREE.Group();

  pet.add(petBodyGroup);

  const bodyMat =
    M(data.color);

  const earMat =
    M(data.earColor);

  /* 몸 */

  ball(
    petBodyGroup,
    0,
    0.42,
    0,
    0.45,
    0.36,
    0.4,
    bodyMat
  );

  /* 머리 */

  ball(
    petBodyGroup,
    0,
    0.78,
    -0.02,
    0.34,
    0.32,
    0.32,
    bodyMat
  );

  /* 귀 */

  if (petId === "cat") {
    for (const x of [-0.21, 0.21]) {
      const ear = add(
        new THREE.ConeGeometry(
          0.14,
          0.38,
          4
        ),
        earMat,
        petBodyGroup,
        x,
        1.05,
        -0.02
      );

      ear.rotation.z =
        x < 0 ? -0.25 : 0.25;
    }
  } else if (petId === "fox") {
    for (const x of [-0.22, 0.22]) {
      const ear = add(
        new THREE.ConeGeometry(
          0.16,
          0.45,
          5
        ),
        earMat,
        petBodyGroup,
        x,
        1.05,
        -0.02
      );

      ear.rotation.z =
        x < 0 ? -0.2 : 0.2;
    }
  } else if (petId === "star") {
    for (let i = 0; i < 5; i++) {
      const a =
        i * Math.PI * 2 / 5;

      ball(
        petBodyGroup,
        Math.cos(a) * 0.25,
        0.82 +
          Math.sin(a) * 0.25,
        -0.03,
        0.13,
        0.13,
        0.13,
        bodyMat
      );
    }
  } else {
    for (const x of [-0.21, 0.21]) {
      ball(
        petBodyGroup,
        x,
        1.02,
        -0.02,
        0.12,
        0.22,
        0.12,
        earMat
      );
    }
  }

  /* 눈 */

  for (const x of [-0.12, 0.12]) {
    ball(
      petBodyGroup,
      x,
      0.8,
      0.28,
      0.035,
      0.045,
      0.025,
      m.dark
    );
  }

  /* 볼 */

  ball(
    petBodyGroup,
    -0.18,
    0.69,
    0.27,
    0.055,
    0.035,
    0.02,
    m.pink
  );

  ball(
    petBodyGroup,
    0.18,
    0.69,
    0.27,
    0.055,
    0.035,
    0.02,
    m.pink
  );

  /* 꼬리 */

  if (petId !== "star") {
    ball(
      petBodyGroup,
      0,
      0.42,
      -0.38,
      0.18,
      0.18,
      0.18,
      bodyMat
    );
  }

  /* 액세서리 */

  applyPetAccessories();
}

function applyPetAccessories() {
  if (!petBodyGroup) return;

  const petId =
    state.selectedPet;

  const acc =
    state.petAccessories[petId] || {
      hat: "none",
      outfit: "none"
    };

  /* 액세서리 그룹 제거 */

  const old =
    petBodyGroup.getObjectByName(
      "petAccessories"
    );

  if (old) {
    petBodyGroup.remove(old);
  }

  const group =
    new THREE.Group();

  group.name =
    "petAccessories";

  petBodyGroup.add(group);

  /* 모자 */

  if (acc.hat === "flower") {
    ball(
      group,
      0,
      1.08,
      0,
      0.13,
      0.08,
      0.13,
      M(0xf19bb4)
    );

    for (let i = 0; i < 5; i++) {
      const a =
        i * Math.PI * 2 / 5;

      ball(
        group,
        Math.cos(a) * 0.12,
        1.08,
        Math.sin(a) * 0.12,
        0.07,
        0.04,
        0.07,
        M(0xffd5e2)
      );
    }
  }

  if (acc.hat === "beret") {
    ball(
      group,
      0,
      1.05,
      0,
      0.3,
      0.09,
      0.27,
      M(0xb998d9)
    );
  }

  if (acc.hat === "crown") {
    for (let i = 0; i < 3; i++) {
      const tooth = add(
        new THREE.ConeGeometry(
          0.06,
          0.22,
          5
        ),
        m.gold,
        group,
        -0.12 + i * 0.12,
        1.1,
        0
      );

      tooth.rotation.z =
        i === 1 ? 0 : 0.12;
    }
  }

  if (acc.hat === "leaf") {
    const leaf = ball(
      group,
      0,
      1.08,
      0,
      0.24,
      0.06,
      0.12,
      m.leaf2
    );

    leaf.rotation.z =
      -0.25;
  }

  /* 옷 */

  if (acc.outfit === "scarf") {
    const scarf = add(
      new THREE.TorusGeometry(
        0.29,
        0.07,
        8,
        24
      ),
      M(0xef9da9),
      group,
      0,
      0.68,
      0
    );

    scarf.rotation.x =
      Math.PI / 2;
  }

  if (acc.outfit === "cape") {
    const cape = add(
      new THREE.ConeGeometry(
        0.48,
        0.65,
        4,
        1,
        true
      ),
      M(0x9f8fd2),
      group,
      0,
      0.45,
      -0.18
    );

    cape.rotation.x =
      Math.PI;
  }

  if (acc.outfit === "ribbon") {
    ball(
      group,
      -0.15,
      0.6,
      0.3,
      0.12,
      0.07,
      0.04,
      M(0xef86a6)
    );

    ball(
      group,
      0.15,
      0.6,
      0.3,
      0.12,
      0.07,
      0.04,
      M(0xef86a6)
    );

    ball(
      group,
      0,
      0.6,
      0.3,
      0.06,
      0.06,
      0.04,
      M(0xf1c76f)
    );
  }
}

createPetModel(
  state.selectedPet
);

/* =========================================================
   숨겨진 조개
========================================================= */

const shell = new THREE.Group();
scene.add(shell);

shell.position.set(
  8,
  0.15,
  5
);

ball(
  shell,
  0,
  0.1,
  0,
  0.22,
  0.11,
  0.17,
  M(0xf4d6a2)
);

for (let i = -1; i <= 1; i++) {
  const q = add(
    new THREE.TorusGeometry(
      0.09,
      0.01,
      5,
      12,
      Math.PI
    ),
    m.white,
    shell,
    i * 0.06,
    0.14,
    0
  );

  q.rotation.x =
    Math.PI / 2;
}

const sceneStatus =
  $("sceneStatus");

/* =========================================================
   저장
========================================================= */

function save() {
  try {
    localStorage.setItem(
      "mongleMindSave",
      JSON.stringify(state)
    );
  } catch (e) {}

  updateUI();
}

/* =========================================================
   스타일
========================================================= */

function injectPetStyles() {
  if (document.getElementById("monglePetStyles")) {
    return;
  }

  const style =
    document.createElement("style");

  style.id =
    "monglePetStyles";

  style.textContent = `
    .mm-pet-ui {
      display:flex;
      flex-direction:column;
      gap:18px;
      margin-top:18px;
    }

    .mm-pet-card,
    .mm-pet-section {
      background:rgba(255,255,255,.84);
      border:1px solid rgba(120,100,150,.12);
      border-radius:24px;
      padding:18px;
      box-shadow:0 10px 30px rgba(80,60,100,.08);
    }

    .mm-pet-title {
      display:flex;
      align-items:center;
      justify-content:space-between;
      gap:12px;
      margin-bottom:12px;
    }

    .mm-pet-title h3 {
      margin:0;
      font-size:18px;
    }

    .mm-pet-currency {
      display:flex;
      gap:8px;
      flex-wrap:wrap;
    }

    .mm-currency {
      padding:8px 12px;
      border-radius:999px;
      background:#faf5ff;
      font-weight:700;
      font-size:13px;
    }

    .mm-pet-grid {
      display:grid;
      grid-template-columns:repeat(3,minmax(0,1fr));
      gap:10px;
    }

    .mm-pet-item {
      border:1px solid #eee7f5;
      background:#fff;
      border-radius:18px;
      padding:12px;
      text-align:center;
      cursor:pointer;
      transition:.18s;
    }

    .mm-pet-item:hover {
      transform:translateY(-2px);
    }

    .mm-pet-item.active {
      border:2px solid #b998d9;
      background:#faf5ff;
    }

    .mm-pet-icon {
      font-size:38px;
      margin-bottom:5px;
    }

    .mm-pet-name {
      font-weight:800;
      font-size:14px;
    }

    .mm-pet-rarity {
      font-size:11px;
      opacity:.65;
      margin-top:3px;
    }

    .mm-pet-button {
      border:0;
      border-radius:14px;
      padding:10px 13px;
      background:#9d82c4;
      color:#fff;
      font-weight:800;
      cursor:pointer;
      margin-top:8px;
      width:100%;
    }

    .mm-pet-button.secondary {
      background:#f1eafa;
      color:#6e5689;
    }

    .mm-pet-button:disabled {
      opacity:.45;
      cursor:not-allowed;
    }

    .mm-pet-accessory-grid {
      display:grid;
      grid-template-columns:repeat(4,minmax(0,1fr));
      gap:8px;
    }

    .mm-accessory {
      border:1px solid #eee7f5;
      background:#fff;
      border-radius:16px;
      padding:10px 5px;
      text-align:center;
      cursor:pointer;
    }

    .mm-accessory.active {
      border:2px solid #b998d9;
      background:#faf5ff;
    }

    .mm-accessory-icon {
      font-size:25px;
    }

    .mm-accessory-name {
      font-size:11px;
      margin-top:4px;
      font-weight:700;
    }

    .mm-fragment {
      display:flex;
      align-items:center;
      justify-content:space-between;
      gap:8px;
      padding:10px 0;
      border-bottom:1px solid #f0ebf4;
    }

    .mm-fragment:last-child {
      border-bottom:0;
    }

    .mm-quest {
      padding:15px;
      border-radius:18px;
      background:#fff;
      border:1px solid #eee7f5;
      margin-bottom:10px;
    }

    .mm-quest.completed {
      background:#faf5ff;
      border-color:#d8c7eb;
    }

    .mm-quest-top {
      display:flex;
      gap:10px;
      align-items:flex-start;
    }

    .mm-quest-icon {
      font-size:26px;
    }

    .mm-quest-body {
      flex:1;
    }

    .mm-quest-name {
      font-weight:800;
    }

    .mm-quest-desc {
      font-size:12px;
      opacity:.7;
      margin-top:3px;
    }

    .mm-quest-progress {
      margin-top:10px;
      height:8px;
      background:#eeeaf2;
      border-radius:99px;
      overflow:hidden;
    }

    .mm-quest-progress > div {
      height:100%;
      background:#b998d9;
      border-radius:99px;
      transition:.3s;
    }

    .mm-quest-bottom {
      display:flex;
      align-items:center;
      justify-content:space-between;
      gap:8px;
      margin-top:10px;
      font-size:12px;
    }

    .mm-gacha-result {
      text-align:center;
      padding:18px;
      border-radius:20px;
      background:linear-gradient(135deg,#fff8fd,#f6f1ff);
      margin-top:12px;
      display:none;
    }

    .mm-gacha-result.show {
      display:block;
      animation:mmPop .35s ease;
    }

    @keyframes mmPop {
      from {
        transform:scale(.9);
        opacity:0;
      }
      to {
        transform:scale(1);
        opacity:1;
      }
    }

    @media(max-width:700px) {
      .mm-pet-grid {
        grid-template-columns:repeat(2,minmax(0,1fr));
      }

      .mm-pet-accessory-grid {
        grid-template-columns:repeat(2,minmax(0,1fr));
      }
    }
  `;

  document.head.appendChild(style);
}

injectPetStyles();

/* =========================================================
   펫 화면 생성
========================================================= */

let petUI = null;
let questUI = null;
let petResultTimer = null;

function ensurePetUI() {
  const screen =
    document.querySelector(
      '[data-screen="dress"]'
    );

  if (!screen) return;

  if (!petUI) {
    petUI =
      document.createElement("div");

    petUI.className =
      "mm-pet-ui";

    screen.appendChild(petUI);

    petUI.addEventListener(
      "click",
      handlePetClick
    );
  }
}

function ensureQuestUI() {
  const screen =
    document.querySelector(
      '[data-screen="quests"]'
    );

  if (!screen) return;

  if (!questUI) {
    questUI =
      document.createElement("div");

    questUI.className =
      "mm-pet-ui";

    screen.appendChild(questUI);

    questUI.addEventListener(
      "click",
      handleQuestClick
    );
  }
}

/* =========================================================
   펫 화면 렌더링
========================================================= */

function renderPetUI() {
  ensurePetUI();

  if (!petUI) return;

  const selected =
    PETS[state.selectedPet] ||
    PETS.bunny;

  const acc =
    state.petAccessories[state.selectedPet] ||
    {
      hat: "none",
      outfit: "none"
    };

  const owned =
    new Set(state.ownedPets);

  petUI.innerHTML = `
    <div class="mm-pet-card">

      <div class="mm-pet-title">
        <h3>🐾 나의 펫</h3>

        <div class="mm-pet-currency">
          <span class="mm-currency">
            ✨ 별빛 ${state.petCurrency}
          </span>

          <span class="mm-currency">
            🪙 펫 코인 ${state.petCoins}
          </span>
        </div>
      </div>

      <div style="
        display:flex;
        align-items:center;
        gap:16px;
        padding:14px;
        border-radius:20px;
        background:#faf7fd;
      ">
        <div style="font-size:58px;">
          ${selected.icon}
        </div>

        <div>
          <div style="
            font-size:18px;
            font-weight:900;
          ">
            ${selected.name}
          </div>

          <div style="
            font-size:12px;
            opacity:.65;
            margin-top:4px;
          ">
            ${selected.rarity} · 현재 데리고 다니는 펫
          </div>
        </div>
      </div>
    </div>

    <div class="mm-pet-section">

      <div class="mm-pet-title">
        <h3>🎁 펫 뽑기</h3>
      </div>

      <div style="
        font-size:13px;
        line-height:1.6;
        opacity:.75;
      ">
        별빛을 사용해서 새로운 펫을 만나 보세요.
        <br>
        중복된 펫이 나오면 자동으로 펫 코인으로 바뀌어요.
      </div>

      <button
        class="mm-pet-button"
        data-pet-action="draw"
        ${state.petCurrency < 1 ? "disabled" : ""}
      >
        ✨ 별빛 1개로 뽑기
      </button>

      <div
        class="mm-gacha-result"
        id="petGachaResult"
      ></div>
    </div>

    <div class="mm-pet-section">

      <div class="mm-pet-title">
        <h3>📖 펫 도감</h3>
        <span style="font-size:12px;opacity:.6;">
          ${state.ownedPets.length}/${PET_LIST.length}
        </span>
      </div>

      <div class="mm-pet-grid">
        ${PET_LIST.map(p => {
          const has =
            owned.has(p.id);

          return `
            <div
              class="mm-pet-item ${
                state.selectedPet === p.id
                  ? "active"
                  : ""
              }"
              data-pet-action="select"
              data-pet-id="${p.id}"
            >

              <div class="mm-pet-icon">
                ${has ? p.icon : "❔"}
              </div>

              <div class="mm-pet-name">
                ${has ? p.name : "???"
                }
              </div>

              <div class="mm-pet-rarity">
                ${p.rarity}
              </div>

              ${
                has
                  ? `<button
                      class="mm-pet-button secondary"
                      data-pet-action="select"
                      data-pet-id="${p.id}"
                    >
                      ${
                        state.selectedPet === p.id
                          ? "현재 펫"
                          : "선택하기"
                      }
                    </button>`
                  : ""
              }
            </div>
          `;
        }).join("")}
      </div>
    </div>

    <div class="mm-pet-section">

      <div class="mm-pet-title">
        <h3>🎀 펫 꾸미기</h3>
      </div>

      <div style="
        font-size:13px;
        opacity:.7;
        margin-bottom:10px;
      ">
        ${selected.name}에게 원하는 장식을 골라 주세요.
      </div>

      <div style="
        font-weight:800;
        font-size:13px;
        margin-bottom:7px;
      ">
        🎩 모자
      </div>

      <div class="mm-pet-accessory-grid">
        ${Object.values(PET_HATS).map(h => `
          <div
            class="mm-accessory ${
              acc.hat === h.id
                ? "active"
                : ""
            }"
            data-pet-action="hat"
            data-accessory="${h.id}"
          >
            <div class="mm-accessory-icon">
              ${h.icon}
            </div>

            <div class="mm-accessory-name">
              ${h.name}
            </div>

            ${
              h.price > 0
                ? `<div style="
                    font-size:10px;
                    opacity:.55;
                    margin-top:3px;
                  ">
                    🪙 ${h.price}
                  </div>`
                : ""
            }
          </div>
        `).join("")}
      </div>

      <div style="
        font-weight:800;
        font-size:13px;
        margin:
          16px 0 7px;
      ">
        🧣 옷
      </div>

      <div class="mm-pet-accessory-grid">
        ${Object.values(PET_OUTFITS).map(o => `
          <div
            class="mm-accessory ${
              acc.outfit === o.id
                ? "active"
                : ""
            }"
            data-pet-action="outfit"
            data-accessory="${o.id}"
          >
            <div class="mm-accessory-icon">
              ${o.icon}
            </div>

            <div class="mm-accessory-name">
              ${o.name}
            </div>

            ${
              o.price > 0
                ? `<div style="
                    font-size:10px;
                    opacity:.55;
                    margin-top:3px;
                  ">
                    🪙 ${o.price}
                  </div>`
                : ""
            }
          </div>
        `).join("")}
      </div>

    </div>

    <div class="mm-pet-section">

      <div class="mm-pet-title">
        <h3>🧩 펫 조각 상점</h3>
      </div>

      <div style="
        font-size:13px;
        line-height:1.6;
        opacity:.7;
        margin-bottom:10px;
      ">
        펫 코인으로 원하는 펫의 조각을 구매할 수 있어요.
        조각이 충분히 모이면 펫을 직접 합성할 수 있어요.
      </div>

      ${PET_LIST
        .filter(p => p.id !== "bunny")
        .map(p => {
          const fragments =
            Number(
              state.petFragments[p.id] || 0
            );

          const canCraft =
            fragments >= p.fragmentNeed;

          return `
            <div class="mm-fragment">

              <div>
                <div style="
                  font-weight:800;
                ">
                  ${p.icon} ${p.name}
                </div>

                <div style="
                  font-size:11px;
                  opacity:.6;
                  margin-top:3px;
                ">
                  🧩 ${fragments}/${p.fragmentNeed}
                </div>
              </div>

              <div style="
                display:flex;
                gap:6px;
              ">

                <button
                  class="mm-pet-button secondary"
                  style="
                    width:auto;
                    margin:0;
                  "
                  data-pet-action="fragment"
                  data-pet-id="${p.id}"
                  ${state.petCoins < 5 ? "disabled" : ""}
                >
                  🪙 5
                </button>

                <button
                  class="mm-pet-button"
                  style="
                    width:auto;
                    margin:0;
                  "
                  data-pet-action="craft"
                  data-pet-id="${p.id}"
                  ${!canCraft || owned.has(p.id)
                    ? "disabled"
                    : ""}
                >
                  ${
                    owned.has(p.id)
                      ? "보유 중"
                      : "합성"
                  }
                </button>

              </div>

            </div>
          `;
        }).join("")}

    </div>
  `;
}

/* =========================================================
   펫 클릭 처리
========================================================= */

function handlePetClick(e) {
  const target =
    e.target.closest(
      "[data-pet-action]"
    );

  if (!target) return;

  const action =
    target.dataset.petAction;

  if (action === "draw") {
    drawPet();
    return;
  }

  if (action === "select") {
    const id =
      target.dataset.petId;

    if (!id) return;

    if (!state.ownedPets.includes(id)) {
      return;
    }

    state.selectedPet = id;

    if (!state.petAccessories[id]) {
      state.petAccessories[id] = {
        hat: "none",
        outfit: "none"
      };
    }

    createPetModel(id);
    save();

    toast(
      `${PETS[id].name}을 선택했어요!`
    );

    return;
  }

  if (action === "hat") {
    const id =
      target.dataset.accessory;

    equipPetHat(id);
    return;
  }

  if (action === "outfit") {
    const id =
      target.dataset.accessory;

    equipPetOutfit(id);
    return;
  }

  if (action === "fragment") {
    const id =
      target.dataset.petId;

    buyFragment(id);
    return;
  }

  if (action === "craft") {
    const id =
      target.dataset.petId;

    craftPet(id);
  }
}

/* =========================================================
   펫 뽑기
========================================================= */

function drawPet() {
  if (state.petCurrency < 1) {
    toast(
      "별빛이 부족해요. 퀘스트를 완료해 보세요!"
    );

    return;
  }

  state.petCurrency -= 1;

  state.stats.petDraws =
    (state.stats.petDraws || 0) + 1;

  const roll =
    Math.random() * 100;

  let sum = 0;
  let result = PETS.puppy;

  for (const petData of PET_LIST) {
    if (petData.id === "bunny") {
      continue;
    }

    sum += petData.rate;

    if (roll <= sum) {
      result = petData;
      break;
    }
  }

  if (state.ownedPets.includes(result.id)) {
    state.petCoins +=
      result.duplicateCoins;

    save();

    showGachaResult(
      `중복 펫!`,
      `${result.icon} ${result.name}`,
      `이미 가지고 있는 펫이라 🪙 펫 코인 ${result.duplicateCoins}개로 바뀌었어요.`
    );

    return;
  }

  state.ownedPets.push(
    result.id
  );

  if (!state.petAccessories[result.id]) {
    state.petAccessories[result.id] = {
      hat: "none",
      outfit: "none"
    };
  }

  save();

  showGachaResult(
    `새로운 친구 등장!`,
    `${result.icon} ${result.name}`,
    `${result.rarity} 펫을 새롭게 만났어요!`
  );
}

function showGachaResult(
  title,
  name,
  description
) {
  const result =
    document.getElementById(
      "petGachaResult"
    );

  if (!result) return;

  result.innerHTML = `
    <div style="
      font-size:13px;
      font-weight:800;
      opacity:.65;
    ">
      ${title}
    </div>

    <div style="
      font-size:42px;
      margin:8px 0;
    ">
      ${name}
    </div>

    <div style="
      font-size:13px;
    ">
      ${description}
    </div>
  `;

  result.classList.add("show");

  clearTimeout(
    petResultTimer
  );

  petResultTimer =
    setTimeout(() => {
      result.classList.remove(
        "show"
      );
    }, 5000);
}

/* =========================================================
   펫 꾸미기
========================================================= */

function equipPetHat(id) {
  const item =
    PET_HATS[id];

  if (!item) return;

  const petId =
    state.selectedPet;

  if (!state.petAccessories[petId]) {
    state.petAccessories[petId] = {
      hat: "none",
      outfit: "none"
    };
  }

  if (
    id !== "none" &&
    item.price > 0 &&
    state.petCoins < item.price
  ) {
    toast(
      "펫 코인이 부족해요."
    );

    return;
  }

  if (
    id !== "none" &&
    state.petAccessories[petId].hat !== id
  ) {
    state.petCoins -=
      item.price;
  }

  state.petAccessories[petId].hat =
    id;

  createPetModel(
    state.selectedPet
  );

  save();

  toast(
    `${item.name}을 적용했어요.`
  );
}

function equipPetOutfit(id) {
  const item =
    PET_OUTFITS[id];

  if (!item) return;

  const petId =
    state.selectedPet;

  if (!state.petAccessories[petId]) {
    state.petAccessories[petId] = {
      hat: "none",
      outfit: "none"
    };
  }

  if (
    id !== "none" &&
    item.price > 0 &&
    state.petCoins < item.price
  ) {
    toast(
      "펫 코인이 부족해요."
    );

    return;
  }

  if (
    id !== "none" &&
    state.petAccessories[petId].outfit !== id
  ) {
    state.petCoins -=
      item.price;
  }

  state.petAccessories[petId].outfit =
    id;

  createPetModel(
    state.selectedPet
  );

  save();

  toast(
    `${item.name}을 적용했어요.`
  );
}

/* =========================================================
   펫 조각 상점
========================================================= */

function buyFragment(petId) {
  const data =
    PETS[petId];

  if (!data) return;

  if (state.petCoins < 5) {
    toast(
      "펫 코인이 부족해요."
    );

    return;
  }

  state.petCoins -= 5;

  state.petFragments[petId] =
    Number(
      state.petFragments[petId] || 0
    ) + 1;

  save();

  toast(
    `${data.icon} ${data.name} 조각을 얻었어요!`
  );
}

function craftPet(petId) {
  const data =
    PETS[petId];

  if (!data) return;

  const current =
    Number(
      state.petFragments[petId] || 0
    );

  if (
    current < data.fragmentNeed
  ) {
    toast(
      `조각이 ${data.fragmentNeed - current}개 더 필요해요.`
    );

    return;
  }

  if (
    state.ownedPets.includes(petId)
  ) {
    toast(
      "이미 가지고 있는 펫이에요."
    );

    return;
  }

  state.petFragments[petId] =
    current - data.fragmentNeed;

  state.ownedPets.push(
    petId
  );

  state.petAccessories[petId] = {
    hat: "none",
    outfit: "none"
  };

  save();

  toast(
    `${data.icon} ${data.name}을 합성했어요!`
  );
}

/* =========================================================
   퀘스트 UI
========================================================= */

function renderQuestUI() {
  ensureQuestUI();

  if (!questUI) return;

  questUI.innerHTML = `
    <div class="mm-pet-section">

      <div class="mm-pet-title">
        <h3>✨ 별빛 퀘스트</h3>

        <div class="mm-pet-currency">
          <span class="mm-currency">
            ✨ 별빛 ${state.petCurrency}
          </span>

          <span class="mm-currency">
            🪙 펫 코인 ${state.petCoins}
          </span>
        </div>
      </div>

      <div style="
        font-size:13px;
        line-height:1.6;
        opacity:.7;
      ">
        별빛은 펫 뽑기에 사용하는 새로운 재화예요.
        마을에서 다양한 활동을 하면 별빛 퀘스트를
        완료할 수 있어요.
      </div>

    </div>

    ${QUESTS.map(q => {
      const progress =
        Math.min(
          q.goal,
          Math.max(
            0,
            Number(
              q.getProgress()
            )
          )
        );

      const claimed =
        state.questClaims.includes(
          q.id
        );

      const completed =
        progress >= q.goal;

      const percent =
        Math.min(
          100,
          progress /
            q.goal *
            100
        );

      return `
        <div class="mm-quest ${
          completed
            ? "completed"
            : ""
        }">

          <div class="mm-quest-top">

            <div class="mm-quest-icon">
              ${q.icon}
            </div>

            <div class="mm-quest-body">

              <div class="mm-quest-name">
                ${q.title}
              </div>

              <div class="mm-quest-desc">
                ${q.description}
              </div>

              <div class="mm-quest-progress">
                <div
                  style="
                    width:${percent}%;
                  "
                ></div>
              </div>

              <div class="mm-quest-bottom">

                <span>
                  ${progress} / ${q.goal}
                </span>

                <span>
                  ✨ +${q.rewardPetCurrency}
                  ${
                    q.rewardCoins > 0
                      ? ` · 🪙 +${q.rewardCoins}`
                      : ""
                  }
                </span>

                <button
                  class="mm-pet-button"
                  style="
                    width:auto;
                    margin:0;
                  "
                  data-quest-action="claim"
                  data-quest-id="${q.id}"
                  ${
                    !completed ||
                    claimed
                      ? "disabled"
                      : ""
                  }
                >
                  ${
                    claimed
                      ? "보상 받음 ✓"
                      : completed
                        ? "보상 받기"
                        : "진행 중"
                  }
                </button>

              </div>

            </div>

          </div>

        </div>
      `;
    }).join("")}
  `;
}

function handleQuestClick(e) {
  const button =
    e.target.closest(
      "[data-quest-action]"
    );

  if (!button) return;

  if (
    button.dataset.questAction !==
    "claim"
  ) {
    return;
  }

  claimQuest(
    button.dataset.questId
  );
}

function claimQuest(id) {
  const quest =
    QUESTS.find(
      q => q.id === id
    );

  if (!quest) return;

  if (
    state.questClaims.includes(id)
  ) {
    return;
  }

  const progress =
    Number(
      quest.getProgress()
    );

  /* 중요:
     조건을 만족하지 않았으면
     절대로 보상을 지급하지 않는다.
  */

  if (progress < quest.goal) {
    toast(
      "아직 퀘스트를 완료하지 않았어요."
    );

    return;
  }

  state.questClaims.push(id);

  state.petCurrency +=
    quest.rewardPetCurrency;

  state.coins +=
    quest.rewardCoins;

  xp(10);

  save();

  toast(
    `퀘스트 완료! ✨ 별빛 +${quest.rewardPetCurrency}${
      quest.rewardCoins
        ? ` · 🪙 코인 +${quest.rewardCoins}`
        : ""
    }`
  );
}

/* =========================================================
   UI
========================================================= */

function updateUI() {
  const coins =
    $("coins");

  const level =
    $("level");

  const xpEl =
    $("xp");

  const flowers =
    $("flowers");

  if (coins) {
    coins.textContent =
      state.coins;
  }

  if (level) {
    level.textContent =
      state.level;
  }

  if (xpEl) {
    xpEl.textContent =
      state.xp;
  }

  if (flowers) {
    flowers.textContent =
      state.flowers;
  }

  const gardenCoins =
    $("gardenCoins");

  if (gardenCoins) {
    gardenCoins.textContent =
      state.coins;
  }

  const waterStatus =
    $("waterStatus");

  if (waterStatus) {
    waterStatus.textContent =
      state.watered
        ? "돌봄 완료"
        : "아직 안 했어요";
  }

  const roomPreview =
    $("roomPreview");

  if (roomPreview) {
    roomPreview.dataset.theme =
      state.roomDecor ||
      "lavender";
  }

  const moodSaved =
    $("moodSaved");

  if (moodSaved) {
    moodSaved.textContent =
      state.mood
        ? moodNames[state.mood]
        : "기분을 기록하지 않아도 괜찮아요.";
  }

  document
    .querySelectorAll(".mood")
    .forEach(b => {
      b.classList.toggle(
        "selected",
        b.dataset.mood ===
          state.mood
      );
    });

  document
    .querySelectorAll(".nav-item")
    .forEach(b => {
      b.classList.toggle(
        "active",
        b.dataset.nav ===
          state.nav
      );
    });

  document
    .querySelectorAll("[data-room-decor]")
    .forEach(b => {
      b.classList.toggle(
        "active",
        b.dataset.roomDecor ===
          state.roomDecor
      );
    });

  const journal =
    $("journalText");

  if (
    journal &&
    journal.value !==
      state.journalText
  ) {
    journal.value =
      state.journalText;
  }

  const roomLabel =
    $("roomDecorLabel");

  if (roomLabel) {
    roomLabel.textContent =
      ({
        lavender:
          "라벤더 포근방",
        peach:
          "피치 햇살방",
        mint:
          "민트 숲속방"
      })[
        state.roomDecor
      ] || "나만의 방";
  }

  renderPetUI();
  renderQuestUI();
}

/* =========================================================
   토스트
========================================================= */

function toast(s) {
  const e =
    $("toast");

  if (!e) return;

  e.textContent = s;

  e.classList.add(
    "show"
  );

  clearTimeout(
    toastTimer
  );

  toastTimer =
    setTimeout(() => {
      e.classList.remove(
        "show"
      );
    }, 2400);
}

/* =========================================================
   경험치
========================================================= */

function levelUp() {
  while (state.xp >= 100) {
    state.xp -= 100;
    state.level++;
    state.coins += 15;

    toast(
      "레벨 업! 코인 +15"
    );
  }
}

function xp(n) {
  state.xp += n;
  levelUp();
}

/* =========================================================
   대화창
========================================================= */

function closeDialog() {
  const dialog =
    $("dialog");

  if (dialog) {
    dialog.hidden = true;
  }
}

const closeDialogButton =
  $("closeDialog");

if (closeDialogButton) {
  closeDialogButton.addEventListener(
    "click",
    closeDialog
  );
}

function dialog(
  name,
  text,
  actions = []
) {
  $("dialogName").textContent =
    name;

  $("dialogText").textContent =
    text;

  const h =
    $("dialogActions");

  h.replaceChildren();

  actions.forEach(a => {
    const b =
      document.createElement(
        "button"
      );

    b.textContent =
      a.label;

    b.onclick =
      a.action;

    h.appendChild(b);
  });

  $("dialog").hidden =
    false;
}

/* =========================================================
   마을 상호작용
========================================================= */

function target() {
  const a = [
    {
      id: "garden",
      x: -7,
      z: 2.8,
      r: 2.7,
      label: "정원 관리"
    },

    {
      id: "animal",
      x: 2.5,
      z: 5.7,
      r: 2.5,
      label: "펫 만나기"
    },

    {
      id: "house",
      x: -5,
      z: -1.5,
      r: 3,
      label: "집 앞에서 쉬기"
    },

    {
      id: "shell",
      x: 8,
      z: 5,
      r: 1.8,
      label: "숨겨진 조개"
    }
  ];

  return a.find(t =>
    Math.hypot(
      avatar.position.x - t.x,
      avatar.position.z - t.z
    ) < t.r &&
    !(
      t.id === "shell" &&
      state.foundShell
    )
  );
}

function interact() {
  const t =
    target();

  if (!t) {
    toast(
      "마을의 장소나 펫 가까이 다가가 E를 눌러 보세요."
    );

    return;
  }

  if (t.id === "garden") {
    showPage("garden");
    return;
  }

  if (t.id === "animal") {
    dialog(
      "포근한 친구",
      "오늘도 잘 지냈어? 함께 천천히 놀아 보자.",
      [
        {
          label: "인사하기",
          action: () => {
            state.stats.petGreetings++;
            xp(5);
            save();
            closeDialog();

            toast(
              "펫과 인사했어요. 경험치 +5"
            );
          }
        },

        {
          label: "펫 꾸미러 가기",
          action: () => {
            closeDialog();
            showPage("dress");
          }
        },

        {
          label: "닫기",
          action: closeDialog
        }
      ]
    );

    return;
  }

  if (t.id === "shell") {
    state.foundShell = true;

    state.stats.shellFinds++;

    state.coins += 8;

    xp(8);

    shell.visible =
      false;

    closeDialog();

    save();

    toast(
      "반짝이는 조개 발견! 코인 +8"
    );

    return;
  }

  dialog(
    "작은 집",
    "오늘 하루도 여기까지 온 것만으로 충분해요. 잠시 쉬어 가요.",
    [
      {
        label: "정원 둘러보기",
        action: () => {
          avatar.position.set(
            -7,
            0,
            2.8
          );

          closeDialog();

          showPage(
            "garden"
          );
        }
      },

      {
        label: "펫 꾸미기",
        action: () => {
          closeDialog();
          showPage(
            "dress"
          );
        }
      },

      {
        label: "산책 계속하기",
        action: closeDialog
      }
    ]
  );
}

/* =========================================================
   페이지 이동
========================================================= */

function showPage(page) {
  const allowed = [
    "home",
    "village",
    "dress",
    "garden",
    "room",
    "journal",
    "quests"
  ];

  if (
    !allowed.includes(page)
  ) {
    page = "home";
  }

  state.nav = page;

  document
    .querySelectorAll("[data-screen]")
    .forEach(el => {
      el.hidden =
        el.dataset.screen !==
        page;
    });

  const titles = {
    home:
      "나만의 작은 쉼",

    village:
      "몽글마을 산책",

    dress:
      "나의 펫 꾸미기",

    garden:
      "나만의 정원",

    room:
      "나만의 방",

    journal:
      "마음 돌보기",

    quests:
      "오늘의 작은 퀘스트"
  };

  const title =
    $("pageTitle");

  if (title) {
    title.textContent =
      titles[page];
  }

  document
    .querySelectorAll(".nav-item")
    .forEach(b => {
      b.classList.toggle(
        "active",
        b.dataset.nav ===
          page
      );
    });

  save();

  if (
    page === "village"
  ) {
    requestAnimationFrame(
      () => resize()
    );
  }

  if (
    page === "home"
  ) {
    window.scrollTo({
      top: 0,
      behavior: "smooth"
    });
  }
}

document
  .querySelectorAll("[data-page]")
  .forEach(b => {
    b.addEventListener(
      "click",
      () =>
        showPage(
          b.dataset.page
        )
    );
  });

document
  .querySelectorAll(".nav-item")
  .forEach(b => {
    b.addEventListener(
      "click",
      () =>
        showPage(
          b.dataset.nav
        )
    );
  });

document
  .querySelectorAll("[data-home]")
  .forEach(b => {
    b.addEventListener(
      "click",
      () =>
        showPage("home")
    );
  });

/* =========================================================
   정원
========================================================= */

const GARDEN_PLANTS = {
  tulip: {
    name: "튤립",
    icon: "🌷",
    price: 10,
    growth: 30,
    reward: 20,
    xp: 10
  },

  sunflower: {
    name: "해바라기",
    icon: "🌻",
    price: 15,
    growth: 45,
    reward: 28,
    xp: 13
  },

  lavender: {
    name: "라벤더",
    icon: "💜",
    price: 20,
    growth: 55,
    reward: 35,
    xp: 16
  },

  strawberry: {
    name: "딸기",
    icon: "🍓",
    price: 25,
    growth: 65,
    reward: 45,
    xp: 20
  },

  mint: {
    name: "민트",
    icon: "🌿",
    price: 18,
    growth: 50,
    reward: 32,
    xp: 15
  },

  moonflower: {
    name: "달빛꽃",
    icon: "🌙",
    price: 40,
    growth: 80,
    reward: 75,
    xp: 30
  },

  daisy: {
    name: "데이지",
    icon: "🌼",
    price: 8,
    growth: 25,
    reward: 16,
    xp: 8
  },

  cosmos: {
    name: "코스모스",
    icon: "🌸",
    price: 22,
    growth: 60,
    reward: 42,
    xp: 18
  },

  hydrangea: {
    name: "수국",
    icon: "🪻",
    price: 30,
    growth: 70,
    reward: 55,
    xp: 24
  },

  tomato: {
    name: "방울토마토",
    icon: "🍅",
    price: 28,
    growth: 75,
    reward: 60,
    xp: 26
  },

  clover: {
    name: "네잎클로버",
    icon: "☘️",
    price: 45,
    growth: 90,
    reward: 90,
    xp: 35
  }
};


/* =========================================================
   정원 기본 상태
========================================================= */

const GARDEN_PLOT_COUNT = 8;

if (!Array.isArray(state.gardenPlots)) {
  state.gardenPlots = [];
}

while (
  state.gardenPlots.length <
  GARDEN_PLOT_COUNT
) {
  state.gardenPlots.push({
    id:
      state.gardenPlots.length,
    plant: null,
    plantedAt: 0,
    watered: 0,
    fertilized: false
  });
}

if (
  typeof state.gardenSeeds !==
  "object" ||
  state.gardenSeeds === null
) {
  state.gardenSeeds = {};
}

if (
  typeof state.fertilizer !==
  "number"
) {
  state.fertilizer = 3;
}


/* =========================================================
   정원 스타일
========================================================= */

function installGardenStyle() {

  if (
    document.getElementById(
      "mongleGardenStyle"
    )
  ) {
    return;
  }

  const style =
    document.createElement(
      "style"
    );

  style.id =
    "mongleGardenStyle";

  style.textContent = `

    .mongle-garden {
      width: 100%;
      box-sizing: border-box;
      padding: 22px;
      border-radius: 28px;
      background:
        linear-gradient(
          180deg,
          #f9fff5 0%,
          #f1f8ec 100%
        );
      border: 1px solid #e0ead9;
      box-shadow:
        0 18px 50px
        rgba(74, 103, 63, .10);
    }

    .garden-header {
      display: flex;
      align-items: center;
      justify-content: space-between;
      gap: 16px;
      margin-bottom: 20px;
      flex-wrap: wrap;
    }

    .garden-title {
      font-size: 26px;
      font-weight: 800;
      color: #3e5137;
    }

    .garden-subtitle {
      margin-top: 5px;
      color: #7b8975;
      font-size: 14px;
    }

    .garden-resource {
      display: flex;
      gap: 8px;
      flex-wrap: wrap;
    }

    .garden-pill {
      padding: 9px 14px;
      border-radius: 999px;
      background: white;
      border: 1px solid #e0e8da;
      font-weight: 700;
      color: #52634b;
    }

    .garden-shop {
      margin-bottom: 22px;
      padding: 18px;
      border-radius: 22px;
      background: rgba(255,255,255,.82);
      border: 1px solid #e4eadf;
    }

    .garden-shop-title {
      font-size: 18px;
      font-weight: 800;
      color: #46563f;
      margin-bottom: 13px;
    }

    .garden-seeds {
      display: grid;
      grid-template-columns:
        repeat(
          auto-fit,
          minmax(135px, 1fr)
        );
      gap: 10px;
    }

    .garden-seed-card {
      border: 1px solid #e2e9de;
      background: #fff;
      border-radius: 18px;
      padding: 13px;
      cursor: pointer;
      transition:
        transform .16s ease,
        box-shadow .16s ease,
        border-color .16s ease;
    }

    .garden-seed-card:hover {
      transform: translateY(-2px);
      box-shadow:
        0 8px 20px
        rgba(65, 89, 57, .10);
      border-color: #b8caa9;
    }

    .garden-seed-icon {
      font-size: 30px;
      margin-bottom: 5px;
    }

    .garden-seed-name {
      font-weight: 800;
      color: #485743;
    }

    .garden-seed-info {
      margin-top: 4px;
      font-size: 12px;
      color: #899384;
      line-height: 1.5;
    }

    .garden-seed-buy {
      width: 100%;
      margin-top: 9px;
      border: 0;
      border-radius: 11px;
      padding: 8px;
      background: #eef5e9;
      color: #52664a;
      font-weight: 800;
      cursor: pointer;
    }

    .garden-field {
      padding: 20px;
      border-radius: 24px;
      background:
        linear-gradient(
          145deg,
          #dbeccf,
          #c8dfb8
        );
      border: 1px solid #bfd5af;
    }

    .garden-field-title {
      font-weight: 800;
      color: #52664a;
      margin-bottom: 14px;
    }

    .garden-plots {
      display: grid;
      grid-template-columns:
        repeat(
          auto-fit,
          minmax(180px, 1fr)
        );
      gap: 14px;
    }

    .garden-plot {
      min-height: 210px;
      padding: 15px;
      border-radius: 21px;
      background:
        linear-gradient(
          180deg,
          #a9794f,
          #93643e
        );
      border: 3px solid
        rgba(255,255,255,.35);
      box-shadow:
        inset 0 4px 0
        rgba(255,255,255,.08),
        0 8px 18px
        rgba(72, 61, 43, .15);
      display: flex;
      flex-direction: column;
      justify-content: space-between;
      position: relative;
      overflow: hidden;
    }

    .garden-plot.empty {
      cursor: pointer;
    }

    .garden-plot.empty:hover {
      transform: translateY(-2px);
    }

    .garden-plot-number {
      color: rgba(255,255,255,.72);
      font-size: 12px;
      font-weight: 700;
    }

    .garden-empty {
      flex: 1;
      display: flex;
      align-items: center;
      justify-content: center;
      text-align: center;
      color: rgba(255,255,255,.82);
      font-size: 14px;
      line-height: 1.6;
    }

    .garden-plant {
      flex: 1;
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
    }

    .garden-plant-icon {
      font-size: 58px;
      filter:
        drop-shadow(
          0 5px 5px
          rgba(0,0,0,.16)
        );
      transition:
        transform .25s ease;
    }

    .garden-plot:hover
    .garden-plant-icon {
      transform:
        translateY(-3px)
        rotate(-2deg);
    }

    .garden-plant-name {
      color: white;
      font-weight: 800;
      margin-top: 3px;
    }

    .garden-progress {
      width: 100%;
      height: 8px;
      margin-top: 8px;
      border-radius: 999px;
      background:
        rgba(255,255,255,.28);
      overflow: hidden;
    }

    .garden-progress-fill {
      height: 100%;
      border-radius: inherit;
      background: #f7ffd9;
      transition:
        width .5s ease;
    }

    .garden-time {
      color: rgba(255,255,255,.85);
      font-size: 11px;
      text-align: center;
      margin-top: 5px;
    }

    .garden-actions {
      display: flex;
      gap: 6px;
      margin-top: 9px;
    }

    .garden-action {
      flex: 1;
      border: 0;
      border-radius: 10px;
      padding: 8px 5px;
      font-size: 12px;
      font-weight: 800;
      cursor: pointer;
      background: white;
      color: #53634c;
    }

    .garden-action:hover {
      transform: translateY(-1px);
    }

    .garden-action:disabled {
      opacity: .42;
      cursor: not-allowed;
      transform: none;
    }

    .garden-ready {
      animation:
        gardenReady 1.4s
        ease-in-out infinite;
    }

    @keyframes gardenReady {
      0%,100% {
        transform: scale(1);
      }

      50% {
        transform: scale(1.05);
      }
    }

    .garden-water-animation {
      position: absolute;
      inset: 0;
      pointer-events: none;
      display: flex;
      justify-content: center;
      align-items: center;
      font-size: 35px;
      opacity: 0;
      z-index: 5;
    }

    .garden-water-animation.play {
      animation:
        gardenWater .8s
        ease-out;
    }

    @keyframes gardenWater {
      0% {
        opacity: 0;
        transform:
          translateY(-35px)
          scale(.7);
      }

      25% {
        opacity: 1;
      }

      100% {
        opacity: 0;
        transform:
          translateY(35px)
          scale(1.15);
      }
    }

    .garden-fertilizer-animation {
      position: absolute;
      inset: 0;
      pointer-events: none;
      display: flex;
      align-items: center;
      justify-content: center;
      font-size: 30px;
      opacity: 0;
      z-index: 5;
    }

    .garden-fertilizer-animation.play {
      animation:
        gardenFertilizer .9s
        ease-out;
    }

    @keyframes gardenFertilizer {
      0% {
        opacity: 0;
        transform: scale(.5);
      }

      30% {
        opacity: 1;
      }

      100% {
        opacity: 0;
        transform: scale(1.4);
      }
    }

    .garden-tip {
      margin-top: 16px;
      padding: 13px 15px;
      border-radius: 15px;
      background: rgba(255,255,255,.65);
      color: #6d7967;
      font-size: 13px;
      line-height: 1.6;
    }

    @media(max-width:700px) {

      .mongle-garden {
        padding: 15px;
      }

      .garden-plots {
        grid-template-columns:
          repeat(2, 1fr);
      }

      .garden-plot {
        min-height: 190px;
      }

    }

  `;

  document.head.appendChild(
    style
  );
}


/* =========================================================
   정원 상태 정리
========================================================= */

function normalizeGarden() {

  if (
    !Array.isArray(
      state.gardenPlots
    )
  ) {
    state.gardenPlots = [];
  }

  while (
    state.gardenPlots.length <
    GARDEN_PLOT_COUNT
  ) {

    state.gardenPlots.push({
      id:
        state.gardenPlots.length,
      plant: null,
      plantedAt: 0,
      watered: 0,
      fertilized: false
    });

  }

  state.gardenPlots =
    state.gardenPlots
      .slice(
        0,
        GARDEN_PLOT_COUNT
      )
      .map(
        (plot, index) => ({
          id: index,
          plant:
            plot &&
            plot.plant
              ? plot.plant
              : null,
          plantedAt:
            Number(
              plot &&
              plot.plantedAt
            ) || 0,
          watered:
            Number(
              plot &&
              plot.watered
            ) || 0,
          fertilized:
            !!(
              plot &&
              plot.fertilized
            )
        })
      );

  if (
    typeof state.gardenSeeds !==
    "object" ||
    state.gardenSeeds === null
  ) {
    state.gardenSeeds = {};
  }

  if (
    typeof state.fertilizer !==
    "number"
  ) {
    state.fertilizer = 3;
  }
}


/* =========================================================
   성장 계산
========================================================= */

function gardenProgress(
  plot,
  now = Date.now()
) {

  if (
    !plot ||
    !plot.plant
  ) {
    return {
      percent: 0,
      ready: false,
      remaining: 0
    };
  }

  const plant =
    GARDEN_PLANTS[
      plot.plant
    ];

  if (!plant) {
    return {
      percent: 0,
      ready: false,
      remaining: 0
    };
  }

  let seconds =
    plant.growth;

  /*
    물을 줄 때마다
    성장 시간이 조금씩 감소
  */

  seconds -=
    plot.watered * 5;

  /*
    비료를 사용하면
    성장 시간이 추가 감소
  */

  if (plot.fertilized) {
    seconds -= 10;
  }

  seconds =
    Math.max(
      10,
      seconds
    );

  const elapsed =
    Math.max(
      0,
      (now -
        plot.plantedAt) /
        1000
    );

  const percent =
    Math.min(
      100,
      Math.floor(
        elapsed /
        seconds *
        100
      )
    );

  return {
    percent,
    ready:
      percent >= 100,
    remaining:
      Math.max(
        0,
        Math.ceil(
          seconds -
          elapsed
        )
      )
  };
}


/* =========================================================
   시간 표시
========================================================= */

function gardenTimeText(
  seconds
) {

  if (
    seconds <= 0
  ) {
    return "수확할 수 있어요! 🌸";
  }

  const m =
    Math.floor(
      seconds / 60
    );

  const s =
    seconds % 60;

  if (m > 0) {
    return (
      `${m}분 ${s}초 후 성장`
    );
  }

  return (
    `${s}초 후 성장`
  );
}


/* =========================================================
   정원 화면 만들기
========================================================= */

function ensureGardenUI() {

  let screen =
    document.querySelector(
      '[data-screen="garden"]'
    );

  if (!screen) {
    return null;
  }

  let root =
    document.getElementById(
      "mongleGarden"
    );

  if (root) {
    return root;
  }

  root =
    document.createElement(
      "div"
    );

  root.id =
    "mongleGarden";

  root.className =
    "mongle-garden";

  screen.appendChild(
    root
  );

  return root;
}


/* =========================================================
   정원 렌더링
========================================================= */

function renderGardenUI() {

  normalizeGarden();
  installGardenStyle();

  const root =
    ensureGardenUI();

  if (!root) {
    return;
  }

  const seedTypes =
    Object.keys(
      GARDEN_PLANTS
    );

  const seeds =
    seedTypes
      .map(id => {

        const plant =
          GARDEN_PLANTS[id];

        const count =
          Number(
            state.gardenSeeds[id]
          ) || 0;

        return `
          <div
            class="garden-seed-card"
          >

            <div
              class="garden-seed-icon"
            >
              ${plant.icon}
            </div>

            <div
              class="garden-seed-name"
            >
              ${plant.name}
            </div>

            <div
              class="garden-seed-info"
            >
              🌱 ${count}개 보유<br>
              ⏰ 약 ${plant.growth}초<br>
              🪙 ${plant.price} 코인
            </div>

            <button
              class="garden-seed-buy"
              data-garden-buy="${id}"
            >
              씨앗 구매
            </button>

          </div>
        `;

      })
      .join("");


  const plots =
    state.gardenPlots
      .map(
        (plot, index) => {

          if (!plot.plant) {

            return `
              <div
                class="garden-plot empty"
              >

                <div
                  class="garden-plot-number"
                >
                  밭 ${index + 1}
                </div>

                <div
                  class="garden-empty"
                >
                  🌱<br>
                  씨앗을 골라<br>
                  이곳에 심어 보세요
                </div>

              </div>
            `;

          }

          const plant =
            GARDEN_PLANTS[
              plot.plant
            ];

          if (!plant) {
            return "";
          }

          const progress =
            gardenProgress(
              plot
            );

          const ready =
            progress.ready;

          return `
            <div
              class="
                garden-plot
                ${ready
                  ? "garden-ready"
                  : ""}
              "
              data-garden-plot="${index}"
            >

              <div
                class="garden-plot-number"
              >
                밭 ${index + 1}
              </div>

              <div
                class="garden-plant"
              >

                <div
                  class="garden-plant-icon"
                >
                  ${plant.icon}
                </div>

                <div
                  class="garden-plant-name"
                >
                  ${plant.name}
                </div>

                <div
                  class="garden-progress"
                >
                  <div
                    class="garden-progress-fill"
                    style="
                      width:
                      ${progress.percent}%
                    "
                  ></div>
                </div>

                <div
                  class="garden-time"
                >
                  ${
                    ready
                      ? "✨ 다 자랐어요!"
                      : gardenTimeText(
                          progress.remaining
                        )
                  }
                </div>

              </div>

              <div
                class="
                  garden-water-animation
                "
                id="gardenWaterFx${index}"
              >
                💧💧💧
              </div>

              <div
                class="
                  garden-fertilizer-animation
                "
                id="gardenFertilizerFx${index}"
              >
                ✨🌱✨
              </div>

              <div
                class="garden-actions"
              >

                <button
                  class="garden-action"
                  data-garden-water="${index}"
                  ${
                    ready
                      ? "disabled"
                      : ""
                  }
                >
                  💧 물주기
                </button>

                <button
                  class="garden-action"
                  data-garden-fertilize="${index}"
                  ${
                    ready ||
                    plot.fertilized ||
                    state.fertilizer <= 0
                      ? "disabled"
                      : ""
                  }
                >
                  ✨ 비료
                </button>

                <button
                  class="garden-action"
                  data-garden-harvest="${index}"
                  ${
                    ready
                      ? ""
                      : "disabled"
                  }
                >
                  🧺 수확
                </button>

              </div>

            </div>
          `;

        }
      )
      .join("");


  root.innerHTML = `

    <div
      class="garden-header"
    >

      <div>

        <div
          class="garden-title"
        >
          🌱 나만의 정원
        </div>

        <div
          class="garden-subtitle"
        >
          씨앗을 심고 물과 비료를 주며
          천천히 키워 보세요.
        </div>

      </div>

      <div
        class="garden-resource"
      >

        <div
          class="garden-pill"
        >
          🪙 ${state.coins}
        </div>

        <div
          class="garden-pill"
        >
          ✨ 비료 ${state.fertilizer}
        </div>

      </div>

    </div>


    <div
      class="garden-shop"
    >

      <div
        class="garden-shop-title"
      >
        🌼 씨앗 상점
      </div>

      <div
        class="garden-seeds"
      >
        ${seeds}
      </div>

    </div>


    <div
      class="garden-field"
    >

      <div
        class="garden-field-title"
      >
        🪴 나의 텃밭
      </div>

      <div
        class="garden-plots"
      >
        ${plots}
      </div>

    </div>


    <div
      class="garden-tip"
    >
      💡 <b>정원 가꾸기 팁</b><br>
      씨앗을 산 뒤 빈 밭을 눌러 심을 수 있어요.
      물을 주면 성장 속도가 빨라지고,
      비료를 사용하면 더 빠르게 자라요.
      다 자란 식물은 수확해서 코인과 경험치를 얻을 수 있어요.
    </div>

  `;

  bindGardenEvents();
}


/* =========================================================
   씨앗 심기
========================================================= */

function plantGardenSeed(
  plotIndex
) {

  normalizeGarden();

  const plot =
    state.gardenPlots[
      plotIndex
    ];

  if (!plot) {
    return;
  }

  if (plot.plant) {
    toast(
      "이미 식물이 자라고 있어요. 🌱"
    );
    return;
  }

  const available =
    Object.keys(
      GARDEN_PLANTS
    ).filter(
      id =>
        (
          Number(
            state.gardenSeeds[id]
          ) || 0
        ) > 0
    );

  if (
    available.length === 0
  ) {

    toast(
      "심을 씨앗이 없어요. 씨앗 상점에서 먼저 구매해 주세요. 🌱"
    );

    return;
  }

  /*
    씨앗이 하나뿐이면
    바로 심기
  */

  if (
    available.length === 1
  ) {

    plantSelectedGardenSeed(
      plotIndex,
      available[0]
    );

    return;
  }

  /*
    여러 종류의 씨앗이 있으면
    선택창 표시
  */

  showGardenSeedPicker(
    plotIndex,
    available
  );
}


/* =========================================================
   씨앗 선택창
========================================================= */

function showGardenSeedPicker(
  plotIndex,
  available
) {

  const old =
    document.getElementById(
      "gardenSeedPicker"
    );

  if (old) {
    old.remove();
  }

  const overlay =
    document.createElement(
      "div"
    );

  overlay.id =
    "gardenSeedPicker";

  overlay.style.cssText = `
    position: fixed;
    inset: 0;
    z-index: 99999;
    display: flex;
    align-items: center;
    justify-content: center;
    padding: 20px;
    background: rgba(39,48,35,.38);
    backdrop-filter: blur(5px);
  `;

  const box =
    document.createElement(
      "div"
    );

  box.style.cssText = `
    width: min(520px, 100%);
    max-height: 80vh;
    overflow-y: auto;
    padding: 22px;
    border-radius: 26px;
    background: #fffdf8;
    box-shadow:
      0 24px 70px
      rgba(0,0,0,.20);
  `;

  box.innerHTML = `

    <div
      style="
        display:flex;
        justify-content:space-between;
        align-items:center;
        gap:12px;
        margin-bottom:6px;
      "
    >

      <div
        style="
          font-size:21px;
          font-weight:800;
          color:#43523d;
        "
      >
        🌱 어떤 씨앗을 심을까요?
      </div>

      <button
        id="closeGardenSeedPicker"
        style="
          border:0;
          width:34px;
          height:34px;
          border-radius:50%;
          background:#f0f2ed;
          cursor:pointer;
          font-size:17px;
        "
      >
        ✕
      </button>

    </div>

    <div
      style="
        color:#899384;
        font-size:13px;
        margin-bottom:16px;
      "
    >
      밭에 심을 씨앗을 골라주세요.
    </div>

    <div
      style="
        display:grid;
        grid-template-columns:
          repeat(
            auto-fit,
            minmax(140px,1fr)
          );
        gap:10px;
      "
    >

      ${available.map(id => {

        const plant =
          GARDEN_PLANTS[id];

        const count =
          Number(
            state.gardenSeeds[id]
          ) || 0;

        return `

          <button
            data-pick-garden-seed="${id}"
            style="
              border:1px solid #e1e8dc;
              border-radius:18px;
              padding:16px 12px;
              background:white;
              cursor:pointer;
              text-align:center;
            "
          >

            <div
              style="
                font-size:40px;
                margin-bottom:5px;
              "
            >
              ${plant.icon}
            </div>

            <div
              style="
                font-weight:800;
                color:#4b5945;
              "
            >
              ${plant.name}
            </div>

            <div
              style="
                margin-top:4px;
                color:#87917f;
                font-size:12px;
              "
            >
              보유 ${count}개
            </div>

          </button>

        `;

      }).join("")}

    </div>

  `;

  overlay.appendChild(
    box
  );

  document.body.appendChild(
    overlay
  );

  const close =
    () => {
      overlay.remove();
    };

  const closeButton =
    document.getElementById(
      "closeGardenSeedPicker"
    );

  if (closeButton) {
    closeButton.addEventListener(
      "click",
      close
    );
  }

  overlay.addEventListener(
    "click",
    event => {

      if (
        event.target ===
        overlay
      ) {
        close();
      }

    }
  );

  overlay
    .querySelectorAll(
      "[data-pick-garden-seed]"
    )
    .forEach(
      button => {

        button.addEventListener(
          "click",
          () => {

            const id =
              button.dataset
                .pickGardenSeed;

            close();

            plantSelectedGardenSeed(
              plotIndex,
              id
            );

          }
        );

      }
    );
}


/* =========================================================
   선택한 씨앗 심기
========================================================= */

function plantSelectedGardenSeed(
  plotIndex,
  seedId
) {

  normalizeGarden();

  const plot =
    state.gardenPlots[
      plotIndex
    ];

  const plant =
    GARDEN_PLANTS[
      seedId
    ];

  if (
    !plot ||
    !plant
  ) {
    return;
  }

  if (plot.plant) {

    toast(
      "이미 식물이 자라고 있어요. 🌱"
    );

    return;
  }

  const count =
    Number(
      state.gardenSeeds[
        seedId
      ]
    ) || 0;

  if (
    count <= 0
  ) {

    toast(
      "이 씨앗은 인벤토리에 없어요."
    );

    return;
  }

  state.gardenSeeds[
    seedId
  ] =
    count - 1;

  plot.plant =
    seedId;

  plot.plantedAt =
    Date.now();

  plot.watered =
    0;

  plot.fertilized =
    false;

  state.stats.seedsPlanted++;

  save();

  renderGardenUI();

  toast(
    `${plant.icon} ${plant.name}을(를) 심었어요! 🌱`
  );
}

   
/* =========================================================
   씨앗 구매
========================================================= */

function buyGardenSeed(
  id
) {

  const plant =
    GARDEN_PLANTS[id];

  if (!plant) {
    return;
  }

  if (
    state.coins <
    plant.price
  ) {

    toast(
      "코인이 부족해요. 🪙"
    );

    return;
  }

  state.coins -=
    plant.price;

  /*
    씨앗을 인벤토리에 저장
    같은 씨앗을 여러 개 사면
    수량이 누적됨
  */

  state.gardenSeeds[id] =
    (
      Number(
        state.gardenSeeds[id]
      ) || 0
    ) + 1;

  state.stats.seedsBought++;

  save();

  renderGardenUI();

  toast(
    `${plant.icon} ${plant.name} 씨앗이 인벤토리에 들어왔어요! 🌱`
  );
}


/* =========================================================
   물주기
========================================================= */

function waterGarden(
  index
) {

  const plot =
    state.gardenPlots[
      index
    ];

  if (
    !plot ||
    !plot.plant
  ) {
    return;
  }

  const progress =
    gardenProgress(
      plot
    );

  if (progress.ready) {
    toast(
      "이 식물은 이제 수확할 수 있어요! 🌸"
    );

    return;
  }

  if (
    plot.watered >= 3
  ) {

    toast(
      "이 식물은 오늘 충분히 물을 마셨어요. 💧"
    );

    return;
  }

  plot.watered++;

  state.stats.waters++;

  save();

  const fx =
    document.getElementById(
      `gardenWaterFx${index}`
    );

  if (fx) {

    fx.classList.remove(
      "play"
    );

    void fx.offsetWidth;

    fx.classList.add(
      "play"
    );

  }

  setTimeout(
    () => {
      renderGardenUI();
    },
    650
  );

  toast(
    "물을 촉촉하게 줬어요. 💧"
  );
}


/* =========================================================
   비료
========================================================= */

function fertilizeGarden(
  index
) {

  const plot =
    state.gardenPlots[
      index
    ];

  if (
    !plot ||
    !plot.plant
  ) {
    return;
  }

  if (
    plot.fertilized
  ) {

    toast(
      "이미 비료를 준 식물이에요. ✨"
    );

    return;
  }

  if (
    state.fertilizer <= 0
  ) {

    toast(
      "비료가 없어요. ✨"
    );

    return;
  }

  plot.fertilized =
    true;

  state.fertilizer--;

  state.stats.fertilizers++;

  save();

  const fx =
    document.getElementById(
      `gardenFertilizerFx${index}`
    );

  if (fx) {

    fx.classList.remove(
      "play"
    );

    void fx.offsetWidth;

    fx.classList.add(
      "play"
    );

  }

  setTimeout(
    () => {
      renderGardenUI();
    },
    750
  );

  toast(
    "비료를 줬어요! 식물이 더 빠르게 자라요. ✨"
  );
}


/* =========================================================
   수확
========================================================= */

function harvestGarden(
  index
) {

  const plot =
    state.gardenPlots[
      index
    ];

  if (
    !plot ||
    !plot.plant
  ) {
    return;
  }

  const progress =
    gardenProgress(
      plot
    );

  if (
    !progress.ready
  ) {

    toast(
      "아직 자라고 있어요. 조금만 더 기다려 주세요. 🌱"
    );

    return;
  }

  const plant =
    GARDEN_PLANTS[
      plot.plant
    ];

  state.coins +=
    plant.reward;

  state.flowers++;

  state.stats.harvests++;

  xp(
    plant.xp
  );

  plot.plant =
    null;

  plot.plantedAt =
    0;

  plot.watered =
    0;

  plot.fertilized =
    false;

  save();

  renderGardenUI();

  toast(
    `${plant.icon} ${plant.name} 수확 완료! 🪙 +${plant.reward}`
  );
}


/* =========================================================
   정원 클릭 이벤트
========================================================= */

function bindGardenEvents() {

  document
    .querySelectorAll(
      "[data-garden-buy]"
    )
    .forEach(
      button => {

        button.addEventListener(
          "click",
          event => {

            event.stopPropagation();

            const id =
              button.dataset
                .gardenBuy;

            buyGardenSeed(
              id
            );

          }
        );

      }
    );


  document
    .querySelectorAll(
      "[data-garden-water]"
    )
    .forEach(
      button => {

        button.addEventListener(
          "click",
          event => {

            event.stopPropagation();

            waterGarden(
              Number(
                button.dataset
                  .gardenWater
              )
            );

          }
        );

      }
    );


  document
    .querySelectorAll(
      "[data-garden-fertilize]"
    )
    .forEach(
      button => {

        button.addEventListener(
          "click",
          event => {

            event.stopPropagation();

            fertilizeGarden(
              Number(
                button.dataset
                  .gardenFertilize
              )
            );

          }
        );

      }
    );


  document
    .querySelectorAll(
      "[data-garden-harvest]"
    )
    .forEach(
      button => {

        button.addEventListener(
          "click",
          event => {

            event.stopPropagation();

            harvestGarden(
              Number(
                button.dataset
                  .gardenHarvest
              )
            );

          }
        );

      }
    );


  document
    .querySelectorAll(
      ".garden-plot.empty"
    )
    .forEach(
      plot => {

        plot.addEventListener(
          "click",
          () => {

            plantGardenSeed(
              Number(
                plot.dataset
                  .gardenPlot
              ) || 0
            );

          }
        );

      }
    );

}


/* =========================================================
   정원 성장 자동 업데이트
========================================================= */

let gardenTicker =
  null;

function startGardenTicker() {

  if (gardenTicker) {
    return;
  }

  gardenTicker =
    setInterval(
      () => {

        if (
          state.nav !==
          "garden"
        ) {
          return;
        }

        renderGardenUI();

      },
      1000
    );

}


/* =========================================================
   정원 입장
========================================================= */

const originalShowPage =
  showPage;

showPage =
  function(page) {

    originalShowPage(
      page
    );

    if (
      page === "garden"
    ) {

      normalizeGarden();

      setTimeout(
        () => {
          renderGardenUI();
        },
        0
      );

      startGardenTicker();

    }

  };


/* =========================================================
   기존 정원 버튼
========================================================= */

const gardenWater =
  $("gardenWater");

if (gardenWater) {

  gardenWater.addEventListener(
    "click",
    () => {

      showPage(
        "garden"
      );

    }
  );

}
   
/* =========================================================
   방
========================================================= */

document
  .querySelectorAll(
    "[data-room-decor]"
  )
  .forEach(b => {
    b.addEventListener(
      "click",
      () => {
        state.roomDecor =
          b.dataset.roomDecor;

        save();

        toast(
          "방 분위기를 바꿨어요."
        );
      }
    );
  });

/* =========================================================
   마음 기록
========================================================= */

const journalInput =
  $("journalText");

const journalSave =
  $("journalSave");

if (journalInput) {
  journalInput.value =
    state.journalText ||
    "";
}

/* 상태 버튼 클릭 */

document
  .querySelectorAll(".mood")
  .forEach(button => {
    button.addEventListener(
      "click",
      () => {
        const mood =
          button.dataset.mood;

        if (!mood) {
          return;
        }

        state.mood =
          mood;

        save();

        document
          .querySelectorAll(".mood")
          .forEach(b => {
            b.classList.toggle(
              "selected",
              b.dataset.mood ===
                state.mood
            );
          });

        const moodSaved =
          $("moodSaved");

        if (moodSaved) {
          moodSaved.textContent =
            moodNames[mood] ||
            "오늘의 마음을 기록했어요.";
        }

        toast(
          "오늘의 마음을 선택했어요. 💜"
        );
      }
    );
  });

/* 글 기록 저장 */

if (journalSave) {
  journalSave.addEventListener(
    "click",
    () => {
      state.journalText =
        journalInput
          ? journalInput.value.slice(
              0,
              1200
            )
          : "";

      state.journalDate =
        new Date().toLocaleDateString(
          "ko-KR"
        );

      state.stats.journals++;

      save();

      toast(
        "오늘의 마음을 기록했어요."
      );
    }
  );
}
   
/* =========================================================
   호흡
========================================================= */

showPage(
  state.nav || "home"
);

function stopBreath() {
  breathing =
    false;

  clearTimeout(
    breathTimer
  );

  const box =
    $("breathBox");

  if (box) {
    box.hidden = true;
  }

  const label =
    $("breathLabel");

  if (label) {
    label.textContent =
      "함께 천천히 호흡하기";
  }

  const circle =
    $("breathCircle");

  if (circle) {
    circle.classList.remove(
      "expand"
    );
  }
}

const breathBtn =
  $("breathBtn");

if (breathBtn) {
  breathBtn.onclick =
    () => {
      if (breathing) {
        stopBreath();
        return;
      }

      breathing =
        true;

      breathStep =
        0;

      $("breathBox").hidden =
        false;

      $("breathLabel").textContent =
        "호흡 활동 진행 중";

      $("breathInstruction").textContent =
        "편안한 만큼만 따라 해요. 언제든 그만할 수 있어요.";

      const c =
        $("breathCircle");

      const t =
        $("breathText");

      const steps = [
        [
          "천천히 들이쉬어요",
          true
        ],

        [
          "편안하게 내쉬어요",
          false
        ]
      ];

      function tick() {
        if (!breathing) return;

        const s =
          steps[
            breathStep++ %
              2
          ];

        t.textContent =
          s[0];

        c.classList.toggle(
          "expand",
          s[1]
        );

        breathTimer =
          setTimeout(
            tick,
            4000
          );
      }

      tick();

      breathTimer =
        setTimeout(
          () => {
            if (!breathing) {
              return;
            }

            state.stats.breaths++;

            save();

            stopBreath();

            toast(
              "호흡 활동을 끝까지 완료했어요. ✨ 별빛 퀘스트에 반영됐어요!"
            );
          },
          30000
        );
    };
}

const stopBreathButton =
  $("stopBreath");

if (stopBreathButton) {
  stopBreathButton.onclick =
    stopBreath;
}

/* =========================================================
   키보드 이동
========================================================= */

window.addEventListener(
  "keydown",
  e => {
    keys[
      e.key.toLowerCase()
    ] = true;

    if (
      [
        "ArrowUp",
        "ArrowDown",
        "ArrowLeft",
        "ArrowRight",
        " "
      ].includes(e.key)
    ) {
      e.preventDefault();
    }

    if (
      e.key.toLowerCase() ===
        "e" &&
      $("dialog").hidden
    ) {
      interact();
    }

    if (
      e.key === "Escape"
    ) {
      closeDialog();
    }
  }
);

window.addEventListener(
  "keyup",
  e =>
    keys[
      e.key.toLowerCase()
    ] = false
);

window.addEventListener(
  "blur",
  () =>
    keys = {}
);

/* =========================================================
   화면 이동 버튼
========================================================= */

document
  .querySelectorAll(
    ".touch-pad button"
  )
  .forEach(b => {
    const k =
      b.dataset.k.toLowerCase();

    const start = e => {
      e.preventDefault();
      keys[k] = true;
    };

    const end = e => {
      e.preventDefault();
      keys[k] = false;
    };

    b.addEventListener(
      "pointerdown",
      start
    );

    b.addEventListener(
      "pointerup",
      end
    );

    b.addEventListener(
      "pointerleave",
      end
    );

    b.addEventListener(
      "pointercancel",
      end
    );
  });

/* =========================================================
   마우스 클릭 이동
========================================================= */

renderer.domElement.addEventListener(
  "pointerdown",
  e => {
    const r =
      renderer.domElement.getBoundingClientRect();

    const ray =
      new THREE.Raycaster();

    ray.setFromCamera(
      new THREE.Vector2(
        (e.clientX - r.left) /
            r.width *
            2 -
          1,

        -(
          (e.clientY - r.top) /
            r.height *
            2 -
          1
        )
      ),
      camera
    );

    const p =
      new THREE.Vector3();

    if (
      ray.ray.intersectPlane(
        new THREE.Plane(
          new THREE.Vector3(
            0,
            1,
            0
          ),
          0
        ),
        p
      )
    ) {
      avatar.userData.dest =
        new THREE.Vector3(
          THREE.MathUtils.clamp(
            p.x,
            -13,
            13
          ),
          0,
          THREE.MathUtils.clamp(
            p.z,
            -13,
            13
          )
        );
    }
  }
);

/* =========================================================
   초기 위치
========================================================= */

avatar.position.set(
  THREE.MathUtils.clamp(
    state.x,
    -13,
    13
  ),
  0,
  THREE.MathUtils.clamp(
    state.z,
    -13,
    13
  )
);

if (state.foundShell) {
  shell.visible =
    false;
}

updateUI();

/* =========================================================
   화면 크기
========================================================= */

function resize() {
  const w =
    Math.max(
      root.clientWidth,
      320
    );

  const h =
    Math.max(
      root.clientHeight,
      320
    );

  renderer.setSize(
    w,
    h,
    false
  );

  camera.aspect =
    w / h;

  camera.updateProjectionMatrix();
}

new ResizeObserver(
  resize
).observe(root);

resize();

/* =========================================================
   자동 UI 갱신
========================================================= */

setInterval(() => {
  if (
    state.nav ===
      "dress" ||
    state.nav ===
      "quests"
  ) {
    updateUI();
  }
}, 2000);

/* =========================================================
   게임 루프
========================================================= */

function animate(t) {
  requestAnimationFrame(
    animate
  );

  const dt =
    Math.min(
      (t - last) / 1000 || 0,
      0.05
    );

  last = t;

  let moving =
    false;

  if (
    $("dialog").hidden
  ) {
    let dx = 0;
    let dz = 0;

    if (
      keys.arrowleft ||
      keys.a
    ) {
      dx--;
    }

    if (
      keys.arrowright ||
      keys.d
    ) {
      dx++;
    }

    if (
      keys.arrowup ||
      keys.w
    ) {
      dz--;
    }

    if (
      keys.arrowdown ||
      keys.s
    ) {
      dz++;
    }

    if (
      avatar.userData.dest
    ) {
      const v =
        avatar.userData.dest
          .clone()
          .sub(
            avatar.position
          );

      v.y = 0;

      if (
        v.length() < 0.2
      ) {
        avatar.userData.dest =
          null;
      } else {
        v.normalize();

        dx = v.x;
        dz = v.z;
      }
    }

    if (dx || dz) {
      const len =
        Math.hypot(
          dx,
          dz
        );

      dx /= len;
      dz /= len;

      moving =
        true;

      avatar.position.x =
        THREE.MathUtils.clamp(
          avatar.position.x +
            dx * dt * 4,
          -13,
          13
        );

      avatar.position.z =
        THREE.MathUtils.clamp(
          avatar.position.z +
            dz * dt * 4,
          -13,
          13
        );

      avatar.rotation.y =
        Math.atan2(
          dx,
          dz
        );

      limbs.forEach(
        l => {
          l.o.rotation.x =
            Math.sin(
              t * 0.012
            ) *
            (
              l.kind ===
              "leg"
                ? 0.45
                : 0.22
            ) *
            l.side;
        }
      );
    } else {
      limbs.forEach(
        l =>
          l.o.rotation.x =
            0
      );
    }
  }

  /* 캐릭터 걷기 */

  walkBlend =
    THREE.MathUtils.damp(
      walkBlend,
      moving ? 1 : 0,
      8,
      dt
    );

  if (moving) {
    walkPhase +=
      dt * 8;
  }

  if (loadedCharacter) {
    const baseY =
      loadedCharacter
        .userData
        .walkBaseY ??
      loadedCharacter.position.y;

    const baseRotX =
      loadedCharacter
        .userData
        .walkBaseRotationX ??
      0;

    const baseRotZ =
      loadedCharacter
        .userData
        .walkBaseRotationZ ??
      0;

    const bounce =
      Math.abs(
        Math.sin(
          walkPhase * 2
        )
      ) *
      0.055 *
      walkBlend;

    const idle =
      Math.sin(
        t * 0.0018
      ) *
      0.009 *
      (1 - walkBlend);

    loadedCharacter.position.y =
      baseY +
      bounce +
      idle;

    loadedCharacter.rotation.x =
      baseRotX -
      0.018 *
        walkBlend;

    loadedCharacter.rotation.z =
      baseRotZ +
      Math.sin(
        walkPhase
      ) *
      0.025 *
      walkBlend;
  }

  avatar.position.y =
    0;

  /* 펫 따라오기 */

  pet.position.set(
    avatar.position.x +
      0.9,

    Math.abs(
      Math.sin(
        t * 0.003
      )
    ) *
      0.05,

    avatar.position.z +
      1
  );

  pet.rotation.y =
    Math.sin(
      t * 0.001
    ) *
    0.15;

  /* 카메라 */

  camera.position.lerp(
    new THREE.Vector3(
      avatar.position.x,
      6.5,
      avatar.position.z +
        27
    ),
    0.055
  );

  camera.lookAt(
    avatar.position.x,
    1.45,
    avatar.position.z -
      1
  );

  const near =
    target();

  if (sceneStatus) {
    sceneStatus.textContent =
      near
        ? `E · ${near.label}`
        : "나만의 속도로 산책해요";
  }

  /* 저장 */

  state.x =
    avatar.position.x;

  state.z =
    avatar.position.z;

  renderer.render(
    scene,
    camera
  );
}

requestAnimationFrame(
  animate
);

})();
