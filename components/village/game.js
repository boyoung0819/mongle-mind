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
  gardenStarterGiftClaimed: false,

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

const previousGardenPlots =
  Array.isArray(state.gardenPlots)
    ? state.gardenPlots
    : [];

state.gardenPlots = Array.from(
  { length: 8 },
  (_, i) => {
    const oldPlot = previousGardenPlots[i] || {};

    return {
      id: i,
      seedId:
        typeof oldPlot.seedId === "string"
          ? oldPlot.seedId
          : null,
      plantedAt: Number(oldPlot.plantedAt) || 0,
      growthBonus: Math.max(
        0,
        Number(oldPlot.growthBonus) || 0
      ),
      waterCount: Math.max(
        0,
        Number(oldPlot.waterCount) || 0
      ),
      fertilizerCount: Math.max(
        0,
        Number(oldPlot.fertilizerCount) || 0
      ),
      lastWateredAt: Number(oldPlot.lastWateredAt) || 0
    };
  }
);

if (!state.gardenSeeds || typeof state.gardenSeeds !== "object") {
  state.gardenSeeds = {};
}

Object.keys(state.gardenSeeds).forEach(id => {
  state.gardenSeeds[id] = Math.max(
    0,
    Math.floor(Number(state.gardenSeeds[id]) || 0)
  );
});

if (typeof state.fertilizer !== "number") {
  state.fertilizer = 3;
}

if (typeof state.gardenStarterGiftClaimed !== "boolean") {
  state.gardenStarterGiftClaimed = false;
}

/* 처음 시작하는 플레이어에게 데이지 모종 2개를 선물 */
if (!state.gardenStarterGiftClaimed) {
  state.gardenSeeds.daisy =
    (state.gardenSeeds.daisy || 0) + 2;
  state.selectedGardenSeed = "daisy";
  state.gardenStarterGiftClaimed = true;
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
  daisy: {
    id: "daisy",
    name: "구름데이지",
    icon: "🌼",
    price: 8,
    growthSeconds: 180,
    reward: 16,
    xp: 8,
    description: "처음 정원을 가꾸는 친구에게 추천해요."
  },

  tulip: {
    id: "tulip",
    name: "봄빛 튤립",
    icon: "🌷",
    price: 12,
    growthSeconds: 300,
    reward: 22,
    xp: 10,
    description: "따뜻한 봄기운을 담은 꽃이에요."
  },

  clover: {
    id: "clover",
    name: "행운 클로버",
    icon: "🍀",
    price: 14,
    growthSeconds: 360,
    reward: 25,
    xp: 11,
    description: "작은 행운이 자라는 초록 식물이에요."
  },

  mint: {
    id: "mint",
    name: "싱그러운 민트",
    icon: "🌿",
    price: 16,
    growthSeconds: 420,
    reward: 29,
    xp: 13,
    description: "보기만 해도 산뜻한 향기가 날 것 같아요."
  },

  lavender: {
    id: "lavender",
    name: "보랏빛 라벤더",
    icon: "🪻",
    price: 20,
    growthSeconds: 480,
    reward: 35,
    xp: 15,
    description: "차분한 보랏빛으로 정원을 채워요."
  },

  sunflower: {
    id: "sunflower",
    name: "햇살 해바라기",
    icon: "🌻",
    price: 22,
    growthSeconds: 540,
    reward: 40,
    xp: 17,
    description: "햇빛을 향해 고개를 드는 커다란 꽃이에요."
  },

  strawberry: {
    id: "strawberry",
    name: "달콤 딸기",
    icon: "🍓",
    price: 25,
    growthSeconds: 600,
    reward: 48,
    xp: 20,
    description: "꽃이 피고 나면 빨간 열매를 맺어요."
  },

  cosmos: {
    id: "cosmos",
    name: "가을 코스모스",
    icon: "🌸",
    price: 28,
    growthSeconds: 660,
    reward: 54,
    xp: 22,
    description: "바람에 살랑이는 가벼운 꽃잎이 예뻐요."
  },

  bluebell: {
    id: "bluebell",
    name: "하늘종꽃",
    icon: "🩵",
    price: 32,
    growthSeconds: 720,
    reward: 62,
    xp: 24,
    description: "맑은 하늘색 꽃이 방울처럼 피어나요."
  },

  rose: {
    id: "rose",
    name: "분홍 장미",
    icon: "🌹",
    price: 36,
    growthSeconds: 840,
    reward: 72,
    xp: 27,
    description: "정성껏 돌보면 아름다운 꽃을 피워요."
  },

  moonflower: {
    id: "moonflower",
    name: "달빛꽃",
    icon: "🌙",
    price: 45,
    growthSeconds: 960,
    reward: 88,
    xp: 32,
    description: "오래 기다린 뒤 만나는 신비로운 꽃이에요."
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

const GARDEN_PLOT_COUNT = 8;
let gardenRoot = null;
let gardenGrowthTimer = null;

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
                ? `<div class="mm-accessory-name">
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
        margin:15px 0 7px;
      ">
        👕 옷
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
                ? `<div class="mm-accessory-name">
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
        <h3>🧩 펫 조각</h3>
      </div>

      ${PET_LIST.map(p => {
        const count =
          Number(state.petFragments[p.id] || 0);

        const need =
          p.fragmentNeed;

        return `
          <div class="mm-fragment">
            <div>
              ${p.icon} ${p.name}
              <div style="font-size:11px;opacity:.65;">
                ${count} / ${need}
              </div>
            </div>

            <button
              class="mm-pet-button secondary"
              data-pet-action="craft"
              data-pet-id="${p.id}"
              ${count < need || owned.has(p.id) ? "disabled" : ""}
            >
              ${owned.has(p.id) ? "보유 중" : "조합하기"}
            </button>
          </div>
        `;
      }).join("")}
    </div>
  `;
}
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
   나만의 정원 - 모종, 성장, 물 주기, 비료, 수확
========================================================= */

function injectGardenStyles() {
  if ($("mongleGardenStyles")) return;

  const style = document.createElement("style");
  style.id = "mongleGardenStyles";
  style.textContent = `
    .mm-garden-ui {
      display:flex;
      flex-direction:column;
      gap:16px;
      margin-top:16px;
    }

    .mm-garden-landscape {
      position:relative;
      min-height:205px;
      overflow:hidden;
      isolation:isolate;
      border:1px solid #e2eddf;
      border-radius:24px;
      padding:24px 26px;
      background:linear-gradient(180deg,#dff1fb 0%,#f5f8e9 62%,#c7dfb5 63%,#b5d69f 100%);
      box-shadow:0 12px 28px rgba(92,126,91,.12);
    }

    .mm-garden-landscape::before,
    .mm-garden-landscape::after {
      content:"";
      position:absolute;
      z-index:-1;
      border-radius:50%;
      pointer-events:none;
    }

    .mm-garden-landscape::before {
      width:330px;
      height:155px;
      right:-30px;
      bottom:24px;
      background:#a9cf9b;
      box-shadow:-180px 35px 0 12px #b8d9a8;
    }

    .mm-garden-landscape::after {
      width:230px;
      height:110px;
      right:70px;
      bottom:10px;
      background:#8fc18a;
      box-shadow:-240px 35px 0 12px #a5cd91;
    }

    .mm-garden-sun {
      position:absolute;
      top:20px;
      right:28px;
      width:56px;
      height:56px;
      display:grid;
      place-items:center;
      border-radius:50%;
      background:radial-gradient(circle,#fff8cb 0 48%,#f6dc9c 72%);
      color:#e3ae62;
      font-size:26px;
      box-shadow:0 0 0 10px rgba(255,248,214,.22),0 0 32px rgba(255,229,164,.45);
      animation:mmGardenSun 5s ease-in-out infinite;
    }

    .mm-garden-cloud {
      position:absolute;
      color:#fff;
      font-size:35px;
      opacity:.8;
      animation:mmGardenCloud 24s linear infinite;
      pointer-events:none;
    }

    .mm-garden-cloud.one { top:24px; left:48%; }
    .mm-garden-cloud.two { top:75px; right:22%; font-size:25px; animation-duration:31s; }

    .mm-garden-banner-copy {
      position:relative;
      z-index:1;
      max-width:66%;
    }

    .mm-garden-eyebrow {
      color:#789d79;
      font-size:10px;
      font-weight:900;
      letter-spacing:1.7px;
    }

    .mm-garden-banner-copy h2 {
      margin:8px 0 6px;
      color:#466a4d;
      font-size:24px;
      line-height:1.35;
      letter-spacing:-.7px;
    }

    .mm-garden-banner-copy p {
      max-width:390px;
      margin:0;
      color:#66836b;
      font-size:11px;
      line-height:1.7;
    }

    .mm-garden-butterfly {
      position:absolute;
      right:16%;
      bottom:38px;
      z-index:1;
      font-size:32px;
      filter:drop-shadow(0 5px 7px #557c5830);
      animation:mmGardenButterfly 4.8s ease-in-out infinite;
    }

    .mm-garden-stat-row {
      display:grid;
      grid-template-columns:repeat(4,minmax(0,1fr));
      gap:9px;
    }

    .mm-garden-stat {
      min-width:0;
      display:flex;
      align-items:center;
      gap:10px;
      padding:12px 13px;
      border:1px solid #edf0e7;
      border-radius:16px;
      background:rgba(255,255,255,.92);
      box-shadow:0 5px 15px rgba(78,103,74,.045);
    }

    .mm-garden-stat-icon {
      width:36px;
      height:36px;
      flex:0 0 36px;
      display:grid;
      place-items:center;
      border-radius:12px;
      background:#f0f7eb;
      font-size:19px;
    }

    .mm-garden-stat small {
      display:block;
      color:#9a9c8c;
      font-size:10px;
    }

    .mm-garden-stat b {
      display:block;
      margin-top:2px;
      color:#526d50;
      font-size:16px;
      font-variant-numeric:tabular-nums;
    }

    .mm-garden-panel {
      padding:17px;
      border:1px solid #eaece3;
      border-radius:21px;
      background:rgba(255,255,255,.94);
      box-shadow:0 8px 24px rgba(81,100,75,.055);
    }

    .mm-garden-panel-head {
      display:flex;
      align-items:flex-end;
      justify-content:space-between;
      gap:12px;
      margin-bottom:13px;
    }

    .mm-garden-panel-head h3 {
      margin:0;
      color:#526d50;
      font-size:17px;
    }

    .mm-garden-panel-head p {
      margin:4px 0 0;
      color:#9a9d91;
      font-size:10px;
      line-height:1.5;
    }

    .mm-garden-hint {
      color:#90a184;
      font-size:10px;
      text-align:right;
    }

    .mm-garden-plot-grid {
      display:grid;
      grid-template-columns:repeat(4,minmax(0,1fr));
      gap:11px;
    }

    .mm-garden-plot {
      position:relative;
      min-width:0;
      min-height:248px;
      overflow:hidden;
      padding:12px;
      border:1px solid #e6eddd;
      border-radius:18px;
      background:linear-gradient(180deg,#f3f8ed 0%,#e9f3e2 60%,#d8e8ca 100%);
      transition:transform .18s,border-color .18s,box-shadow .18s;
    }

    .mm-garden-plot:hover {
      transform:translateY(-2px);
      border-color:#c7dcba;
      box-shadow:0 9px 18px rgba(82,119,76,.11);
    }

    .mm-garden-plot::before {
      content:"";
      position:absolute;
      left:-12%;
      right:-12%;
      bottom:78px;
      height:74px;
      border-radius:50% 50% 0 0;
      background:linear-gradient(180deg,#c1dda9,#a7ca91);
      opacity:.82;
      pointer-events:none;
    }

    .mm-garden-plot-number {
      position:relative;
      z-index:1;
      display:inline-flex;
      align-items:center;
      justify-content:center;
      min-width:25px;
      height:25px;
      padding:0 7px;
      border-radius:99px;
      background:rgba(255,255,255,.82);
      color:#819478;
      font-size:10px;
      font-weight:900;
    }

    .mm-garden-plot-art {
      position:relative;
      z-index:1;
      height:106px;
      display:flex;
      align-items:flex-end;
      justify-content:center;
      padding-bottom:9px;
    }

    .mm-garden-soil {
      position:absolute;
      left:13%;
      right:13%;
      bottom:6px;
      height:28px;
      border-radius:50%;
      background:radial-gradient(ellipse at 50% 35%,#9d7257 0 40%,#815e49 72%,#6d513f 100%);
      box-shadow:0 5px 0 rgba(91,112,68,.12);
    }

    .mm-garden-plant-emoji {
      position:relative;
      z-index:2;
      display:inline-block;
      font-size:49px;
      line-height:1;
      transform-origin:50% 100%;
      filter:drop-shadow(0 7px 5px rgba(65,91,54,.15));
      animation:mmGardenSway 3.4s ease-in-out infinite;
    }

    .mm-garden-plant-emoji.stage-seed { font-size:30px; }
    .mm-garden-plant-emoji.stage-sprout { font-size:37px; }
    .mm-garden-plant-emoji.stage-growing { font-size:45px; }
    .mm-garden-plant-emoji.stage-bud { font-size:53px; }
    .mm-garden-plot-empty .mm-garden-plot-art { align-items:center; }

    .mm-garden-empty-mark {
      display:grid;
      place-items:center;
      width:76px;
      height:76px;
      border:2px dashed #bad1ad;
      border-radius:50%;
      color:#91af82;
      background:#f7fbf2a8;
      font-size:30px;
    }

    .mm-garden-plot-info {
      position:relative;
      z-index:1;
      margin-top:2px;
      text-align:center;
    }

    .mm-garden-plot-info strong {
      display:block;
      color:#52694f;
      font-size:13px;
    }

    .mm-garden-plot-info small {
      display:block;
      min-height:16px;
      margin-top:3px;
      color:#87947e;
      font-size:10px;
    }

    .mm-garden-progress {
      height:7px;
      overflow:hidden;
      margin:9px 0 5px;
      border-radius:99px;
      background:#dce8d5;
    }

    .mm-garden-progress > span {
      display:block;
      height:100%;
      border-radius:99px;
      background:linear-gradient(90deg,#a9cc8b,#6fae78);
      transition:width .5s ease;
    }

    .mm-garden-progress-label {
      color:#94a08a;
      font-size:9px;
      font-variant-numeric:tabular-nums;
    }

    .mm-garden-plot-actions {
      position:relative;
      z-index:2;
      display:grid;
      grid-template-columns:repeat(2,minmax(0,1fr));
      gap:5px;
      margin-top:9px;
    }

    .mm-garden-action {
      min-width:0;
      border:1px solid #dfe9d8;
      border-radius:9px;
      padding:8px 3px;
      background:#fff;
      color:#688061;
      font-size:10px;
      font-weight:800;
      cursor:pointer;
      transition:background .16s,transform .16s;
    }

    .mm-garden-action:hover:not(:disabled) {
      transform:translateY(-1px);
      background:#f3f9ed;
    }

    .mm-garden-action.primary {
      grid-column:1/-1;
      border-color:#9fbe91;
      background:linear-gradient(135deg,#8fb77e,#a8ca91);
      color:white;
    }

    .mm-garden-action:disabled {
      opacity:.43;
      cursor:default;
    }

    .mm-garden-watering-can {
      position:absolute;
      top:15px;
      right:18px;
      z-index:5;
      display:none;
      font-size:27px;
      transform-origin:70% 75%;
      filter:drop-shadow(0 4px 3px #4f765533);
      pointer-events:none;
    }

    .mm-garden-water-drops {
      position:absolute;
      top:48px;
      right:20px;
      z-index:5;
      display:none;
      color:#55b8e8;
      font-size:17px;
      letter-spacing:3px;
      pointer-events:none;
    }

    .mm-garden-plot.mm-watering-active .mm-garden-watering-can {
      display:block;
      animation:mmGardenPour .75s ease-in-out 2;
    }

    .mm-garden-plot.mm-watering-active .mm-garden-water-drops {
      display:block;
      animation:mmGardenDrops .8s ease-in 2;
    }

    .mm-garden-plot.mm-fertilizing-active .mm-garden-plant-emoji {
      animation:mmGardenSparkle .9s ease-in-out 2;
    }

    .mm-garden-plot.mm-fertilizing-active .mm-garden-plot-art::after {
      content:"✨ ✨";
      position:absolute;
      top:18px;
      color:#e6bd64;
      font-size:17px;
      animation:mmGardenSparkle .9s ease-in-out 2;
    }

    .mm-garden-inventory {
      display:flex;
      flex-wrap:wrap;
      gap:8px;
    }
    <section class="mm-garden-stat-row">
      <div class="mm-garden-stat"><span class="mm-garden-stat-icon">🪙</span><span><small>보유 코인</small><b>${state.coins}</b></span></div>
      <div class="mm-garden-stat"><span class="mm-garden-stat-icon">🌱</span><span><small>모종 보관함</small><b>${seedTotal}개</b></span></div>
      <div class="mm-garden-stat"><span class="mm-garden-stat-icon">🧺</span><span><small>보유 비료</small><b>${state.fertilizer}개</b></span></div>
      <div class="mm-garden-stat"><span class="mm-garden-stat-icon">🌼</span><span><small>수확 준비</small><b>${ready}개</b></span></div>
    </section>

    <section class="mm-garden-panel">
      <div class="mm-garden-panel-head">
        <div><h3>🌿 나의 화단</h3><p>빈 화단에 모종을 심고 각 식물을 직접 돌봐 주세요.</p></div>
        <span class="mm-garden-hint">총 ${GARDEN_PLOT_COUNT}개 화단 · ${growing.length}개 성장 중</span>
      </div>
      <div class="mm-garden-plot-grid">
        ${state.gardenPlots.map(plot => renderGardenPlot(plot, now)).join("")}
      </div>
    </section>

    <section class="mm-garden-panel">
      <div class="mm-garden-panel-head">
        <div><h3>🎒 나의 모종 보관함</h3><p>심고 싶은 모종을 선택한 다음 빈 화단의 심기 버튼을 눌러 주세요.</p></div>
        <span class="mm-garden-hint">선택한 모종으로 심기</span>
      </div>
      <div class="mm-garden-inventory">
        ${inventory || `<div class="mm-garden-empty-note">아직 보유한 모종이 없어요.<br>아래 모종 상점에서 마음에 드는 모종을 구매해 보세요.</div>`}
      </div>
    </section>

    <section class="mm-garden-panel">
      <div class="mm-garden-panel-head">
        <div><h3>🪴 모종 상점</h3><p>다양한 꽃과 식물의 모종을 코인으로 구매할 수 있어요.</p></div>
        <span class="mm-garden-hint">현재 코인 ${state.coins}</span>
      </div>
      <div class="mm-garden-shop-grid">${shops}</div>
    </section>

    <section class="mm-garden-panel">
      <div class="mm-garden-panel-head">
        <div><h3>🌾 정원 관리 도구</h3><p>비료는 식물 한 그루에 한 번 사용할 수 있어요.</p></div>
      </div>
      <div class="mm-garden-fertilizer-row">
        <div><strong>🌿 성장 비료 묶음</strong><p>5개 구매 · 식물의 남은 성장 시간을 줄여 줘요.</p></div>
        <button data-garden-action="buy-fertilizer" type="button" ${state.coins < 25 ? "disabled" : ""}>🪙 25 코인 · 구매</button>
      </div>
    </section>

    <p class="mm-garden-footnote">식물은 화면을 닫아도 시간이 지나면 자라요. 물과 비료를 주면 더 빨리 자라고, 다 자란 식물은 수확할 수 있어요. 🌱</p>
  `;
}

function playGardenAnimation(plotId, type) {
  if (!gardenRoot) return;
  const card = gardenRoot.querySelector(`.mm-garden-plot[data-plot-id="${plotId}"]`);
  if (!card) return;

  const className = type === "watering"
    ? "mm-watering-active"
    : "mm-fertilizing-active";

  card.classList.remove("mm-watering-active", "mm-fertilizing-active");
  void card.offsetWidth;
  card.classList.add(className);

  setTimeout(() => {
    card.classList.remove(className);
  }, 1800);
}

function handleGardenClick(event) {
  const button = event.target.closest("[data-garden-action]");
  if (!button || button.disabled) return;

  const action = button.dataset.gardenAction;
  const plotId = Number(button.dataset.plotId);
  const plot = Number.isInteger(plotId)
    ? state.gardenPlots[plotId]
    : null;

  if (action === "buy-seed") {
    const plant = PLANTS[button.dataset.seedId];
    if (!plant) return;

    if (state.coins < plant.price) {
      toast("코인이 부족해요. 마을에서 활동하고 코인을 모아 보세요.");
      return;
    }

    state.coins -= plant.price;
    state.gardenSeeds[plant.id] =
      Number(state.gardenSeeds[plant.id] || 0) + 1;
    state.selectedGardenSeed = plant.id;
    state.stats.seedsBought++;
    save();
    toast(`${plant.name} 모종을 보관함에 넣었어요.`);
    return;
  }

  if (action === "select-seed") {
    const plantId = button.dataset.seedId;
    if (!PLANTS[plantId] || Number(state.gardenSeeds[plantId] || 0) <= 0) {
      toast("선택할 수 있는 모종이 없어요.");
      return;
    }
    state.selectedGardenSeed = plantId;
    save();
    return;
  }

  if (action === "buy-fertilizer") {
    const price = 25;
    if (state.coins < price) {
      toast("비료를 구매할 코인이 부족해요.");
      return;
    }
    state.coins -= price;
    state.fertilizer += 5;
    save();
    toast("성장 비료 5개를 구매했어요.");
    return;
  }

  if (!plot) return;

  if (action === "plant") {
    const seedId = state.selectedGardenSeed;
    const plant = PLANTS[seedId];
    if (plot.seedId) {
      toast("이미 식물이 자라고 있는 화단이에요.");
      return;
    }
    if (!plant || Number(state.gardenSeeds[seedId] || 0) <= 0) {
      toast("먼저 모종 상점에서 모종을 구매하거나 보관함에서 골라 주세요.");
      return;
    }

    state.gardenSeeds[seedId]--;
    if (state.gardenSeeds[seedId] <= 0) {
      delete state.gardenSeeds[seedId];
      if (state.selectedGardenSeed === seedId) {
        state.selectedGardenSeed =
          Object.keys(PLANTS).find(id => Number(state.gardenSeeds[id] || 0) > 0) || null;
      }
    }

    plot.seedId = seedId;
    plot.plantedAt = Date.now();
    plot.growthBonus = 0;
    plot.waterCount = 0;
    plot.fertilizerCount = 0;
    plot.lastWateredAt = 0;
    state.stats.seedsPlanted++;
    save();
    toast(`${plant.name} 모종을 심었어요. 이제 조금씩 자랄 거예요!`);
    return;
  }

  const progress = getGardenProgress(plot);
  const plant = progress.plant;

  if (!plant) {
    toast("먼저 빈 화단에 모종을 심어 주세요.");
    return;
  }

  if (action === "water") {
    if (progress.ready) {
      toast("식물이 다 자랐어요. 수확해 주세요!");
      return;
    }
    if (Number(plot.waterCount || 0) >= 3) {
      toast("이 식물은 물 주기를 충분히 받았어요.");
      return;
    }
    const cooldown = 45000 - (Date.now() - (Number(plot.lastWateredAt) || 0));
    if (cooldown > 0) {
      toast(`${Math.ceil(cooldown / 1000)}초 뒤에 다시 물을 줄 수 있어요.`);
      return;
    }

    plot.growthBonus =
      (Number(plot.growthBonus) || 0) +
      Math.round(plant.growthSeconds * 1000 * 0.12);
    plot.waterCount = Number(plot.waterCount || 0) + 1;
    plot.lastWateredAt = Date.now();
    state.stats.waters++;
    state.watered = true;
    xp(2);
    save();
    playGardenAnimation(plotId, "watering");
    toast(`${plant.name}에 물을 주었어요. 💧 잎이 촉촉해졌어요!`);
    return;
  }

  if (action === "fertilize") {
    if (progress.ready) {
      toast("이미 다 자란 식물이에요. 수확해 주세요!");
      return;
    }
    if (Number(plot.fertilizerCount || 0) >= 1) {
      toast("이 식물에는 이미 비료를 주었어요.");
      return;
    }
    if (state.fertilizer <= 0) {
      toast("비료가 부족해요. 정원 관리 도구에서 구매해 주세요.");
      return;
    }

    state.fertilizer--;
    plot.fertilizerCount = 1;
    plot.growthBonus =
      (Number(plot.growthBonus) || 0) +
      Math.round(plant.growthSeconds * 1000 * 0.22);
    state.stats.fertilizers++;
    xp(3);
    save();
    playGardenAnimation(plotId, "fertilizing");
    toast(`${plant.name}에 영양분을 주었어요. ✨ 더 건강하게 자랄 거예요!`);
    return;
  }

  if (action === "harvest") {
    if (!progress.ready) {
      toast("조금만 더 기다리면 수확할 수 있어요.");
      return;
    }

    state.flowers++;
    state.coins += plant.reward;
    state.stats.harvests++;
    xp(plant.xp);

    state.gardenPlots[plotId] = {
      id: plotId,
      seedId: null,
      plantedAt: 0,
      growthBonus: 0,
      waterCount: 0,
      fertilizerCount: 0,
      lastWateredAt: 0
    };

    save();
    toast(`${plant.name} 수확 완료! 코인 +${plant.reward} · 경험치 +${plant.xp}`);
  }
}

function startGardenGrowthTicker() {
  if (gardenGrowthTimer) return;

  gardenGrowthTimer = setInterval(() => {
    const screen = document.querySelector('[data-screen="garden"]');
    if (screen && !screen.hidden) {
      renderGardenUI();
    }
  }, 1000);
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
  renderGardenUI();
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

  if (page === "garden") {
    requestAnimationFrame(() => renderGardenUI());
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

})();
