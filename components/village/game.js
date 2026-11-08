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
journalHistory: {},
journalSelectedDate: "",

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

/* =========================================================
   펫 옷장 영구 소장 데이터
========================================================= */

if (
  !Array.isArray(state.petOwnedHats)
) {
  state.petOwnedHats = [
    "none"
  ];
}

if (
  !Array.isArray(state.petOwnedOutfits)
) {
  state.petOwnedOutfits = [
    "none"
  ];
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
    rarityClass: "basic",
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
    rarityClass: "common",
    color: 0xe8c39b,
    earColor: 0xc9956b,
    rate: 27,
    duplicateCoins: 15,
    fragmentNeed: 10
  },

  cat: {
    id: "cat",
    name: "달빛고양이",
    icon: "🐱",
    rarity: "일반",
    rarityClass: "common",
    color: 0xcfc7df,
    earColor: 0xa99dbc,
    rate: 23,
    duplicateCoins: 18,
    fragmentNeed: 10
  },

  fox: {
    id: "fox",
    name: "살구여우",
    icon: "🦊",
    rarity: "희귀",
    rarityClass: "rare",
    color: 0xf0a66c,
    earColor: 0xd77a4f,
    rate: 12,
    duplicateCoins: 25,
    fragmentNeed: 15
  },

  bear: {
    id: "bear",
    name: "솜사탕곰",
    icon: "🐻",
    rarity: "희귀",
    rarityClass: "rare",
    color: 0xc9a78d,
    earColor: 0xa98268,
    rate: 10,
    duplicateCoins: 30,
    fragmentNeed: 15
  },

  deer: {
    id: "deer",
    name: "새벽사슴",
    icon: "🦌",
    rarity: "희귀",
    rarityClass: "rare",
    color: 0xe8c6a5,
    earColor: 0xb98762,
    rate: 9,
    duplicateCoins: 35,
    fragmentNeed: 15
  },

  otter: {
    id: "otter",
    name: "말랑수달",
    icon: "🦦",
    rarity: "초희귀",
    rarityClass: "super",
    color: 0xb88f78,
    earColor: 0x9b725f,
    rate: 7,
    duplicateCoins: 40,
    fragmentNeed: 18
  },

  raccoon: {
    id: "raccoon",
    name: "별밤너구리",
    icon: "🦝",
    rarity: "초희귀",
    rarityClass: "super",
    color: 0x8d91a6,
    earColor: 0x686d82,
    rate: 5,
    duplicateCoins: 45,
    fragmentNeed: 18
  },

  penguin: {
    id: "penguin",
    name: "눈송이펭귄",
    icon: "🐧",
    rarity: "전설",
    rarityClass: "legend",
    color: 0x8da9c9,
    earColor: 0x6c809f,
    rate: 4,
    duplicateCoins: 60,
    fragmentNeed: 20
  },

  dragon: {
    id: "dragon",
    name: "새벽용",
    icon: "🐉",
    rarity: "전설",
    rarityClass: "legend",
    color: 0xa98ed4,
    earColor: 0x7d63ae,
    rate: 2,
    duplicateCoins: 80,
    fragmentNeed: 25
  },

  unicorn: {
    id: "unicorn",
    name: "별구름유니콘",
    icon: "🦄",
    rarity: "특별",
    rarityClass: "special",
    color: 0xf1c9e8,
    earColor: 0xd8a8df,
    rate: 0.5,
    duplicateCoins: 120,
    fragmentNeed: 30
  },

  star: {
    id: "star",
    name: "별빛친구",
    icon: "⭐",
    rarity: "특별",
    rarityClass: "special",
    color: 0xf3d47b,
    earColor: 0xf1bd62,
    rate: 0.5,
    duplicateCoins: 150,
    fragmentNeed: 30
  }
};

const PET_LIST = Object.values(PETS);


/* =========================================================
   희귀도별 확률 정보
========================================================= */

const PET_RARITIES = [
  {
    id: "common",
    name: "일반",
    rate: 50,
    icon: "●"
  },
  {
    id: "rare",
    name: "희귀",
    rate: 31,
    icon: "◆"
  },
  {
    id: "super",
    name: "초희귀",
    rate: 12,
    icon: "✦"
  },
  {
    id: "legend",
    name: "전설",
    rate: 6,
    icon: "★"
  },
  {
    id: "special",
    name: "특별",
    rate: 1,
    icon: "🌟"
  }
];

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
   펫 액세서리 영구 소장 목록
========================================================= */

if (
  !Array.isArray(state.petOwnedHats)
) {
  state.petOwnedHats = [
    "none"
  ];
}

if (
  !Array.isArray(state.petOwnedOutfits)
) {
  state.petOwnedOutfits = [
    "none"
  ];
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
   몽글마을 확장 장식
   기존 마을 오브젝트는 그대로 유지합니다.
========================================================= */


/* ---------------------------------------------------------
   작은 집
--------------------------------------------------------- */

function addVillageHouse(
  x,
  z,
  bodyColor,
  roofColor,
  scale = 1
) {

  const g =
    new THREE.Group();

  scene.add(g);

  g.position.set(
    x,
    0,
    z
  );

  g.scale.setScalar(
    scale
  );


  /* 집 몸체 */

  box(
    g,
    0,
    0.9,
    0,
    3.2,
    1.8,
    2.7,
    M(bodyColor)
  );


  /* 지붕 왼쪽 */

  const roofLeft =
    box(
      g,
      -0.78,
      1.92,
      0,
      2.15,
      0.18,
      3.15,
      M(roofColor)
    );

  roofLeft.rotation.z =
    0.52;


  /* 지붕 오른쪽 */

  const roofRight =
    box(
      g,
      0.78,
      1.92,
      0,
      2.15,
      0.18,
      3.15,
      M(roofColor)
    );

  roofRight.rotation.z =
    -0.52;


  /* 문 */

  box(
    g,
    0,
    0.67,
    1.39,
    0.65,
    1.25,
    0.12,
    m.wood
  );


  /* 문 손잡이 */

  ball(
    g,
    0.18,
    0.68,
    1.47,
    0.055,
    0.055,
    0.035,
    m.gold
  );


  /* 창문 */

  for (
    const wx of [-0.95, 0.95]
  ) {

    box(
      g,
      wx,
      1.15,
      1.39,
      0.65,
      0.55,
      0.1,
      M(0xaed7df)
    );


    box(
      g,
      wx,
      1.15,
      1.45,
      0.055,
      0.55,
      0.025,
      m.white
    );


    box(
      g,
      wx,
      1.15,
      1.45,
      0.65,
      0.055,
      0.025,
      m.white
    );
  }


  /* 굴뚝 */

  box(
    g,
    0.9,
    2.15,
    -0.35,
    0.38,
    0.75,
    0.38,
    m.wood
  );


  /* 집 앞 화분 */

  box(
    g,
    -1.25,
    0.23,
    1.55,
    0.32,
    0.25,
    0.32,
    M(0xd9909e)
  );

  ball(
    g,
    -1.25,
    0.47,
    1.55,
    0.17,
    0.2,
    0.17,
    m.leaf2
  );


  box(
    g,
    1.25,
    0.23,
    1.55,
    0.32,
    0.25,
    0.32,
    M(0xc8a9ec)
  );

  ball(
    g,
    1.25,
    0.47,
    1.55,
    0.17,
    0.2,
    0.17,
    m.leaf3
  );
}


/* 작은 집 배치 */

addVillageHouse(
  7.8,
  -6.3,
  0xf5dfc9,
  0xd58f9d,
  0.78
);

addVillageHouse(
  -8.4,
  7.2,
  0xe7d8ef,
  0xb7a0d6,
  0.72
);


/* ---------------------------------------------------------
   중앙 작은 광장
--------------------------------------------------------- */

const villageSquare =
  new THREE.Group();

scene.add(
  villageSquare
);

villageSquare.position.set(
  0,
  0,
  2.4
);


/* 광장 바닥 */

add(
  new THREE.CylinderGeometry(
    3.2,
    3.2,
    0.1,
    32
  ),
  M(0xe8dcc8),
  villageSquare,
  0,
  0.04,
  0
);


/* 중앙 장식 */

add(
  new THREE.CylinderGeometry(
    2.25,
    2.25,
    0.07,
    32
  ),
  M(0xf7ead8),
  villageSquare,
  0,
  0.11,
  0
);


/* ---------------------------------------------------------
   작은 분수
--------------------------------------------------------- */

const villageFountain =
  new THREE.Group();

scene.add(
  villageFountain
);

villageFountain.position.set(
  0,
  0,
  2.4
);


/* 분수 받침 */

add(
  new THREE.CylinderGeometry(
    1.05,
    1.2,
    0.3,
    24
  ),
  M(0xd0bda2),
  villageFountain,
  0,
  0.22,
  0
);


/* 물 */

add(
  new THREE.CylinderGeometry(
    0.82,
    0.82,
    0.06,
    24
  ),
  m.water,
  villageFountain,
  0,
  0.4,
  0
);


/* 가운데 기둥 */

add(
  new THREE.CylinderGeometry(
    0.13,
    0.2,
    0.9,
    12
  ),
  M(0xd6b58c),
  villageFountain,
  0,
  0.82,
  0
);


/* 꼭대기 */

ball(
  villageFountain,
  0,
  1.35,
  0,
  0.25,
  0.18,
  0.25,
  m.pink
);


/* ---------------------------------------------------------
   벤치
--------------------------------------------------------- */

function addVillageBench(
  x,
  z,
  rotation = 0
) {

  const g =
    new THREE.Group();

  scene.add(g);

  g.position.set(
    x,
    0,
    z
  );

  g.rotation.y =
    rotation;


  /* 앉는 부분 */

  box(
    g,
    0,
    0.48,
    0,
    1.7,
    0.18,
    0.45,
    m.wood
  );


  /* 등받이 */

  box(
    g,
    0,
    0.88,
    -0.18,
    1.7,
    0.55,
    0.12,
    m.wood
  );


  /* 다리 */

  box(
    g,
    -0.58,
    0.22,
    0,
    0.12,
    0.44,
    0.12,
    m.wood
  );

  box(
    g,
    0.58,
    0.22,
    0,
    0.12,
    0.44,
    0.12,
    m.wood
  );
}


addVillageBench(
  -3.7,
  2.2,
  Math.PI / 2
);

addVillageBench(
  3.7,
  2.2,
  -Math.PI / 2
);


/* ---------------------------------------------------------
   작은 시장
--------------------------------------------------------- */

function addVillageMarket(
  x,
  z
) {

  const g =
    new THREE.Group();

  scene.add(g);

  g.position.set(
    x,
    0,
    z
  );


  /* 기둥 */

  for (
    const px of [-1.2, 1.2]
  ) {

    add(
      new THREE.CylinderGeometry(
        0.08,
        0.1,
        2,
        10
      ),
      m.wood,
      g,
      px,
      1,
      0
    );
  }


  /* 천막 */

  box(
    g,
    0,
    2.05,
    0,
    3,
    0.18,
    1.8,
    M(0xe7a6b8)
  );


  /* 판매대 */

  box(
    g,
    0,
    0.78,
    0,
    2.6,
    0.25,
    1.15,
    m.wood
  );


  /* 과일 */

  ball(
    g,
    -0.7,
    1.05,
    0,
    0.2,
    0.2,
    0.2,
    M(0xf18c9e)
  );

  ball(
    g,
    -0.2,
    1.05,
    0,
    0.2,
    0.2,
    0.2,
    m.yellow
  );

  ball(
    g,
    0.3,
    1.05,
    0,
    0.2,
    0.2,
    0.2,
    m.leaf2
  );

  ball(
    g,
    0.8,
    1.05,
    0,
    0.2,
    0.2,
    0.2,
    m.lilac
  );


  /* 간판 */

  box(
    g,
    0,
    1.55,
    0,
    1.4,
    0.45,
    0.12,
    M(0xffe6bb)
  );
}


addVillageMarket(
  -8,
  -1
);


/* ---------------------------------------------------------
   우물
--------------------------------------------------------- */

function addVillageWell(
  x,
  z
) {

  const g =
    new THREE.Group();

  scene.add(g);

  g.position.set(
    x,
    0,
    z
  );


  /* 돌벽 */

  add(
    new THREE.CylinderGeometry(
      0.85,
      1,
      0.58,
      16
    ),
    M(0xc8b99f),
    g,
    0,
    0.29,
    0
  );


  /* 물 */

  add(
    new THREE.CylinderGeometry(
      0.57,
      0.57,
      0.05,
      20
    ),
    m.water,
    g,
    0,
    0.6,
    0
  );


  /* 기둥 */

  for (
    const px of [-0.65, 0.65]
  ) {

    add(
      new THREE.CylinderGeometry(
        0.07,
        0.09,
        1.65,
        8
      ),
      m.wood,
      g,
      px,
      1.05,
      0
    );
  }


  /* 지붕 */

  box(
    g,
    0,
    1.95,
    0,
    1.9,
    0.18,
    1.25,
    m.roof2
  );
}


addVillageWell(
  8,
  5
);


/* ---------------------------------------------------------
   작은 나무 울타리
--------------------------------------------------------- */

function addVillageFence(
  x,
  z,
  count,
  rotation = 0
) {

  const g =
    new THREE.Group();

  scene.add(g);

  g.position.set(
    x,
    0,
    z
  );

  g.rotation.y =
    rotation;


  for (
    let i = 0;
    i < count;
    i++
  ) {

    box(
      g,
      i * 0.65,
      0.42,
      0,
      0.1,
      0.84,
      0.1,
      m.wood
    );


    if (
      i < count - 1
    ) {

      box(
        g,
        i * 0.65 + 0.32,
        0.58,
        0,
        0.65,
        0.08,
        0.08,
        m.wood
      );

      box(
        g,
        i * 0.65 + 0.32,
        0.32,
        0,
        0.65,
        0.08,
        0.08,
        m.wood
      );
    }
  }
}


addVillageFence(
  -8.8,
  3.8,
  7,
  0
);

addVillageFence(
  5.2,
  -7,
  6,
  0
);


/* ---------------------------------------------------------
   꽃 장식 추가
--------------------------------------------------------- */

const extraVillageFlowers = [
  [-5.3, 1.0, m.pinks],
  [-4.8, 1.5, m.yellow],
  [-4.3, 1.0, m.lilac],

  [4.5, 0.8, m.pinks],
  [5.0, 1.3, m.white],
  [5.5, 0.8, m.yellow],

  [-1.2, -5.5, m.lilac],
  [-0.5, -5.8, m.pinks],
  [0.2, -5.5, m.yellow],
  [0.9, -5.8, m.white]
];


extraVillageFlowers.forEach(
  ([x, z, color]) => {

    flower(
      x,
      z,
      color,
      0.58
    );
  }
);


/* ---------------------------------------------------------
   작은 나무 추가
--------------------------------------------------------- */

const extraVillageTrees = [
  [-6.5, -1.5, 0.62],
  [-5.7, -1.0, 0.52],

  [6.2, -2.5, 0.68],
  [8.7, 0.0, 0.58],

  [-1.8, 7.8, 0.65],
  [2.0, 8.2, 0.58],

  [-10.2, 3.0, 0.68],
  [10.4, 5.0, 0.72]
];


extraVillageTrees.forEach(
  ([x, z, s]) => {

    tree(
      x,
      z,
      s
    );
  }
);


/* ---------------------------------------------------------
   추가 화단
--------------------------------------------------------- */

bed(
  -3.8,
  5.5
);

bed(
  3.8,
  5.5
);


/* ---------------------------------------------------------
   추가 가로등
--------------------------------------------------------- */

lamp(
  -4.8,
  3.0
);

lamp(
  4.8,
  3.0
);

lamp(
  -1.5,
  7.0
);

lamp(
  1.8,
  7.0
);


/* ---------------------------------------------------------
   작은 휴식 공간
--------------------------------------------------------- */

addVillageBench(
  0,
  -6.5,
  0
);

flower(
  -1.2,
  -6.2,
  m.pinks,
  0.7
);

flower(
  1.2,
  -6.2,
  m.lilac,
  0.7
);


/* ---------------------------------------------------------
   마을 입구 아치
--------------------------------------------------------- */

function addVillageArch(
  x,
  z
) {

  const g =
    new THREE.Group();

  scene.add(g);

  g.position.set(
    x,
    0,
    z
  );


  /* 왼쪽 기둥 */

  add(
    new THREE.CylinderGeometry(
      0.14,
      0.18,
      2.8,
      10
    ),
    m.wood,
    g,
    -1.8,
    1.4,
    0
  );


  /* 오른쪽 기둥 */

  add(
    new THREE.CylinderGeometry(
      0.14,
      0.18,
      2.8,
      10
    ),
    m.wood,
    g,
    1.8,
    1.4,
    0
  );


  /* 위쪽 가로대 */

  box(
    g,
    0,
    2.7,
    0,
    4,
    0.25,
    0.3,
    m.wood
  );


  /* 꽃 장식 */

  ball(
    g,
    -1.2,
    2.75,
    0,
    0.2,
    0.18,
    0.2,
    m.pinks
  );

  ball(
    g,
    -0.7,
    2.8,
    0,
    0.2,
    0.18,
    0.2,
    m.lilac
  );

  ball(
    g,
    0.7,
    2.8,
    0,
    0.2,
    0.18,
    0.2,
    m.yellow
  );

  ball(
    g,
    1.2,
    2.75,
    0,
    0.2,
    0.18,
    0.2,
    m.pinks
  );
}


addVillageArch(
  0,
  10.5
);
   
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

/* =========================================================
   마을 펫 모델 동기화
========================================================= */

let renderedPetKey = "";

function getPetRenderKey() {

  const petId =
    state.selectedPet || "bunny";

  const acc =
    state.petAccessories[petId] || {
      hat: "none",
      outfit: "none"
    };

  return (
    petId +
    "|" +
    acc.hat +
    "|" +
    acc.outfit
  );
}

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

  const darkMat =
    M(0x43343b);

  const whiteMat =
    M(0xfff9ef);

  const bellyMat =
    M(0xf7f2ec);

  /* =========================================================
     🐰 토끼
  ========================================================= */

  if (petId === "bunny") {

    ball(
      petBodyGroup,
      0,
      0.42,
      0,
      0.45,
      0.38,
      0.42,
      bodyMat
    );

    ball(
      petBodyGroup,
      0,
      0.82,
      -0.02,
      0.34,
      0.32,
      0.32,
      bodyMat
    );

    /* 긴 귀 */

    for (const x of [-0.18, 0.18]) {

      ball(
        petBodyGroup,
        x,
        1.16,
        -0.02,
        0.11,
        0.32,
        0.10,
        earMat
      );

    }

    /* 꼬리 */

    ball(
      petBodyGroup,
      0,
      0.42,
      -0.43,
      0.20,
      0.20,
      0.20,
      whiteMat
    );
  }


  /* =========================================================
     🐶 강아지
  ========================================================= */

  else if (petId === "puppy") {

    ball(
      petBodyGroup,
      0,
      0.43,
      0,
      0.47,
      0.39,
      0.44,
      bodyMat
    );

    ball(
      petBodyGroup,
      0,
      0.82,
      0.02,
      0.37,
      0.34,
      0.35,
      bodyMat
    );

    /* 처진 귀 */

    for (const x of [-0.25, 0.25]) {

      ball(
        petBodyGroup,
        x,
        0.88,
        0.02,
        0.13,
        0.28,
        0.18,
        earMat
      );

    }

    /* 주둥이 */

    ball(
      petBodyGroup,
      0,
      0.72,
      0.31,
      0.16,
      0.12,
      0.12,
      bellyMat
    );

    ball(
      petBodyGroup,
      0,
      0.74,
      0.40,
      0.055,
      0.045,
      0.04,
      darkMat
    );

    /* 꼬리 */

    const puppyTail =
      ball(
        petBodyGroup,
        0.34,
        0.48,
        -0.36,
        0.15,
        0.24,
        0.15,
        bodyMat
      );

    puppyTail.rotation.z =
      -0.5;
  }


  /* =========================================================
     🐱 고양이
  ========================================================= */

  else if (petId === "cat") {

    ball(
      petBodyGroup,
      0,
      0.43,
      0,
      0.43,
      0.36,
      0.40,
      bodyMat
    );

    ball(
      petBodyGroup,
      0,
      0.82,
      -0.02,
      0.34,
      0.32,
      0.32,
      bodyMat
    );

    /* 뾰족한 귀 */

    for (const x of [-0.20, 0.20]) {

      const ear =
        add(
          new THREE.ConeGeometry(
            0.15,
            0.42,
            5
          ),
          earMat,
          petBodyGroup,
          x,
          1.08,
          -0.02
        );

      ear.rotation.z =
        x < 0
          ? -0.18
          : 0.18;
    }

    /* 긴 꼬리 */

    const tail =
      add(
        new THREE.TorusGeometry(
          0.20,
          0.07,
          8,
          16,
          Math.PI * 1.45
        ),
        bodyMat,
        petBodyGroup,
        0.28,
        0.52,
        -0.30
      );

    tail.rotation.y =
      Math.PI / 2;
  }


  /* =========================================================
     🦊 여우
  ========================================================= */

  else if (petId === "fox") {

    ball(
      petBodyGroup,
      0,
      0.43,
      0,
      0.44,
      0.37,
      0.41,
      bodyMat
    );

    /* 여우 머리 */

    ball(
      petBodyGroup,
      0,
      0.84,
      -0.02,
      0.36,
      0.34,
      0.34,
      bodyMat
    );

    /* 큰 귀 */

    for (const x of [-0.23, 0.23]) {

      const ear =
        add(
          new THREE.ConeGeometry(
            0.17,
            0.50,
            5
          ),
          earMat,
          petBodyGroup,
          x,
          1.12,
          -0.02
        );

      ear.rotation.z =
        x < 0
          ? -0.20
          : 0.20;
    }

    /* 뾰족한 주둥이 */

    const muzzle =
      add(
        new THREE.ConeGeometry(
          0.16,
          0.34,
          5
        ),
        bodyMat,
        petBodyGroup,
        0,
        0.70,
        0.30
      );

    muzzle.rotation.x =
      Math.PI / 2;

    /* 풍성한 꼬리 */

    const tail =
      add(
        new THREE.ConeGeometry(
          0.22,
          0.65,
          8
        ),
        earMat,
        petBodyGroup,
        0.38,
        0.46,
        -0.35
      );

    tail.rotation.x =
      Math.PI / 2;
  }


  /* =========================================================
     🐻 곰
  ========================================================= */

  else if (petId === "bear") {

    ball(
      petBodyGroup,
      0,
      0.43,
      0,
      0.50,
      0.42,
      0.45,
      bodyMat
    );

    ball(
      petBodyGroup,
      0,
      0.82,
      -0.02,
      0.37,
      0.34,
      0.34,
      bodyMat
    );

    /* 둥근 귀 */

    for (const x of [-0.24, 0.24]) {

      ball(
        petBodyGroup,
        x,
        1.04,
        -0.02,
        0.14,
        0.14,
        0.12,
        earMat
      );

    }

    /* 배 */

    ball(
      petBodyGroup,
      0,
      0.40,
      0.37,
      0.25,
      0.25,
      0.07,
      bellyMat
    );
  }


  /* =========================================================
     🦌 사슴
  ========================================================= */

  else if (petId === "deer") {

    ball(
      petBodyGroup,
      0,
      0.43,
      0,
      0.44,
      0.38,
      0.40,
      bodyMat
    );

    ball(
      petBodyGroup,
      0,
      0.84,
      -0.02,
      0.33,
      0.34,
      0.32,
      bodyMat
    );

    /* 긴 귀 */

    for (const x of [-0.22, 0.22]) {

      ball(
        petBodyGroup,
        x,
        1.08,
        -0.02,
        0.10,
        0.24,
        0.08,
        earMat
      );

    }

    /* 뿔 */

    for (const x of [-0.13, 0.13]) {

      const antler =
        new THREE.Group();

      antler.position.set(
        x,
        1.15,
        -0.02
      );

      petBodyGroup.add(
        antler
      );

      const stem =
        add(
          new THREE.CylinderGeometry(
            0.035,
            0.045,
            0.30,
            6
          ),
          earMat,
          antler,
          0,
          0.12,
          0
        );

      const branch =
        add(
          new THREE.CylinderGeometry(
            0.025,
            0.035,
            0.16,
            6
          ),
          earMat,
          antler,
          x < 0
            ? -0.06
            : 0.06,
          0.22,
          0
        );

      branch.rotation.z =
        x < 0
          ? -0.55
          : 0.55;
    }
  }


  /* =========================================================
     🦦 수달
  ========================================================= */

  else if (petId === "otter") {

    ball(
      petBodyGroup,
      0,
      0.43,
      0,
      0.48,
      0.38,
      0.50,
      bodyMat
    );

    ball(
      petBodyGroup,
      0,
      0.82,
      -0.04,
      0.34,
      0.32,
      0.32,
      bodyMat
    );

    /* 작은 둥근 귀 */

    for (const x of [-0.21, 0.21]) {

      ball(
        petBodyGroup,
        x,
        1.02,
        -0.02,
        0.09,
        0.09,
        0.07,
        earMat
      );

    }

    /* 밝은 배 */

    ball(
      petBodyGroup,
      0,
      0.43,
      0.42,
      0.25,
      0.27,
      0.08,
      bellyMat
    );

    /* 납작한 꼬리 */

    box(
      petBodyGroup,
      0,
      0.36,
      -0.48,
      0.28,
      0.10,
      0.35,
      earMat
    );
  }


  /* =========================================================
     🦝 너구리
  ========================================================= */

  else if (petId === "raccoon") {

    ball(
      petBodyGroup,
      0,
      0.43,
      0,
      0.46,
      0.38,
      0.43,
      bodyMat
    );

    ball(
      petBodyGroup,
      0,
      0.82,
      -0.02,
      0.35,
      0.33,
      0.33,
      bodyMat
    );

    /* 둥근 귀 */

    for (const x of [-0.22, 0.22]) {

      ball(
        petBodyGroup,
        x,
        1.04,
        -0.02,
        0.12,
        0.12,
        0.10,
        earMat
      );

    }

    /* 눈 주변 마스크 */

    box(
      petBodyGroup,
      0,
      0.80,
      0.285,
      0.43,
      0.13,
      0.025,
      darkMat
    );

    /* 눈 다시 표시 */

    for (const x of [-0.12, 0.12]) {

      ball(
        petBodyGroup,
        x,
        0.81,
        0.31,
        0.035,
        0.045,
        0.025,
        whiteMat
      );

      ball(
        petBodyGroup,
        x,
        0.81,
        0.335,
        0.018,
        0.025,
        0.015,
        darkMat
      );

    }

    /* 줄무늬 꼬리 */

    for (let i = 0; i < 4; i++) {

      ball(
        petBodyGroup,
        0,
        0.45 + i * 0.06,
        -0.45 - i * 0.02,
        0.19 - i * 0.02,
        0.10,
        0.14,
        i % 2 === 0
          ? earMat
          : bodyMat
      );

    }
  }


  /* =========================================================
     🐧 펭귄
  ========================================================= */

  else if (petId === "penguin") {

    /* 검은 몸 */

    ball(
      petBodyGroup,
      0,
      0.46,
      0,
      0.43,
      0.52,
      0.38,
      darkMat
    );

    /* 둥근 머리 */

    ball(
      petBodyGroup,
      0,
      0.90,
      -0.02,
      0.34,
      0.33,
      0.32,
      darkMat
    );

    /* 하얀 배 */

    ball(
      petBodyGroup,
      0,
      0.46,
      0.34,
      0.29,
      0.40,
      0.08,
      whiteMat
    );

    /* 얼굴 */

    ball(
      petBodyGroup,
      -0.12,
      0.94,
      0.29,
      0.045,
      0.055,
      0.025,
      whiteMat
    );

    ball(
      petBodyGroup,
      0.12,
      0.94,
      0.29,
      0.045,
      0.055,
      0.025,
      whiteMat
    );

    /* 부리 */

    const beak =
      new THREE.ConeGeometry(
        0.07,
        0.16,
        4
      );

    const beakMesh =
      add(
        beak,
        M(0xf0a85c),
        petBodyGroup,
        0,
        0.87,
        0.34
      );

    beakMesh.rotation.x =
      Math.PI / 2;

    /* 날개 */

    ball(
      petBodyGroup,
      -0.43,
      0.48,
      0,
      0.10,
      0.30,
      0.18,
      darkMat
    );

    ball(
      petBodyGroup,
      0.43,
      0.48,
      0,
      0.10,
      0.30,
      0.18,
      darkMat
    );

    /* 발 */

    for (const x of [-0.16, 0.16]) {

      ball(
        petBodyGroup,
        x,
        0.06,
        0.08,
        0.13,
        0.06,
        0.20,
        M(0xf0a85c)
      );

    }
  }


  /* =========================================================
     🐉 용
  ========================================================= */

  else if (petId === "dragon") {

    ball(
      petBodyGroup,
      0,
      0.45,
      0,
      0.46,
      0.40,
      0.44,
      bodyMat
    );

    ball(
      petBodyGroup,
      0,
      0.84,
      -0.02,
      0.36,
      0.34,
      0.34,
      bodyMat
    );

    /* 뿔 */

    for (const x of [-0.16, 0.16]) {

      const horn =
        add(
          new THREE.ConeGeometry(
            0.07,
            0.28,
            5
          ),
          earMat,
          petBodyGroup,
          x,
          1.12,
          -0.02
        );

      horn.rotation.z =
        x < 0
          ? -0.18
          : 0.18;
    }

    /* 날개 */

    for (const x of [-0.42, 0.42]) {

      const wing =
        new THREE.ConeGeometry(
          0.25,
          0.50,
          3
        );

      const wingMesh =
        add(
          wing,
          earMat,
          petBodyGroup,
          x,
          0.62,
          -0.05
        );

      wingMesh.rotation.z =
        x < 0
          ? -1.0
          : 1.0;
    }

    /* 용 꼬리 */

    const tail =
      add(
        new THREE.ConeGeometry(
          0.16,
          0.55,
          6
        ),
        earMat,
        petBodyGroup,
        0,
        0.40,
        -0.48
      );

    tail.rotation.x =
      Math.PI / 2;
  }


  /* =========================================================
     🦄 유니콘
  ========================================================= */

  else if (petId === "unicorn") {

    ball(
      petBodyGroup,
      0,
      0.44,
      0,
      0.44,
      0.39,
      0.42,
      bodyMat
    );

    ball(
      petBodyGroup,
      0,
      0.84,
      -0.02,
      0.35,
      0.34,
      0.34,
      bodyMat
    );

    /* 귀 */

    for (const x of [-0.20, 0.20]) {

      const ear =
        add(
          new THREE.ConeGeometry(
            0.10,
            0.25,
            5
          ),
          earMat,
          petBodyGroup,
          x,
          1.08,
          -0.02
        );

      ear.rotation.z =
        x < 0
          ? -0.18
          : 0.18;
    }

    /* 뿔 */

    const horn =
      add(
        new THREE.ConeGeometry(
          0.07,
          0.38,
          6
        ),
        M(0xf4d57b),
        petBodyGroup,
        0,
        1.20,
        0
      );

    /* 갈기 */

    for (let i = 0; i < 4; i++) {

      ball(
        petBodyGroup,
        -0.23,
        0.78 + i * 0.10,
        -0.12,
        0.07,
        0.10,
        0.06,
        i % 2 === 0
          ? M(0xd9a8ec)
          : M(0x9dcff0)
      );

    }

    /* 꼬리 */

    const tail =
      ball(
        petBodyGroup,
        0,
        0.45,
        -0.43,
        0.18,
        0.25,
        0.16,
        M(0xd9a8ec)
      );

    tail.rotation.x =
      -0.35;
  }


  /* =========================================================
     ⭐ 별빛친구
  ========================================================= */

  else if (petId === "star") {

    /* 중앙 몸 */

    ball(
      petBodyGroup,
      0,
      0.62,
      0,
      0.42,
      0.42,
      0.25,
      bodyMat
    );

    /* 별 모양 돌기 */

    for (let i = 0; i < 5; i++) {

      const angle =
        i * Math.PI * 2 / 5;

      const spike =
        add(
          new THREE.ConeGeometry(
            0.15,
            0.38,
            5
          ),
          bodyMat,
          petBodyGroup,
          Math.cos(angle) * 0.32,
          0.62 +
            Math.sin(angle) * 0.32,
          0
        );

      spike.rotation.z =
        -Math.sin(angle) * 1.1;
    }

    /* 얼굴 */

    for (const x of [-0.11, 0.11]) {

      ball(
        petBodyGroup,
        x,
        0.68,
        0.25,
        0.035,
        0.045,
        0.025,
        darkMat
      );

    }
  }


  /* =========================================================
     기본 안전장치
  ========================================================= */

  else {

    ball(
      petBodyGroup,
      0,
      0.42,
      0,
      0.45,
      0.36,
      0.40,
      bodyMat
    );

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


/* =========================================================
   공통 얼굴
========================================================= */

if (
  petId !== "penguin" &&
  petId !== "raccoon" &&
  petId !== "star"
) {

  for (const x of [-0.12, 0.12]) {

    ball(
      petBodyGroup,
      x,
      0.82,
      0.365,
      0.042,
      0.052,
      0.032,
      darkMat
    );

  }
}
   
  /* =========================================================
     공통 볼터치
  ========================================================= */

  if (
    petId !== "penguin"
  ) {

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

  }


  /* =========================================================
     액세서리
  ========================================================= */

  applyPetAccessories();
}
   
/* =========================================================
   펫 액세서리
   마을에서도 잘 보이도록 크기와 위치를 조정
========================================================= */

function applyPetAccessories() {

  if (!petBodyGroup) {
    return;
  }

  const petId =
    state.selectedPet || "bunny";

  const acc =
    state.petAccessories[petId] || {
      hat: "none",
      outfit: "none"
    };

  /* 기존 액세서리 제거 */

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


  /* =========================================================
     🎩 모자
  ========================================================= */

  /* 🌸 꽃 머리핀 */

  if (acc.hat === "flower") {

    /* 가운데 꽃 */

    ball(
      group,
      0,
      1.14,
      0.03,
      0.16,
      0.09,
      0.16,
      M(0xf19bb4)
    );

    /* 꽃잎 */

    for (let i = 0; i < 5; i++) {

      const angle =
        i * Math.PI * 2 / 5;

      ball(
        group,
        Math.cos(angle) * 0.15,
        1.14 +
          Math.sin(angle) * 0.08,
        0.04,
        0.085,
        0.055,
        0.085,
        M(0xffd5e2)
      );

    }
  }


  /* 🧢 포근 베레모 */

  if (acc.hat === "beret") {

    ball(
      group,
      0,
      1.10,
      0,
      0.34,
      0.12,
      0.30,
      M(0xb998d9)
    );

    /* 베레모 꼭지 */

    ball(
      group,
      0,
      1.21,
      0,
      0.07,
      0.06,
      0.07,
      M(0x9f80c5)
    );
  }


  /* 👑 별 왕관 */

  if (acc.hat === "crown") {

    /* 왕관 바닥 */

    const crownBase =
      new THREE.TorusGeometry(
        0.25,
        0.045,
        6,
        18
      );

    const crown =
      add(
        crownBase,
        m.gold,
        group,
        0,
        1.12,
        0
      );

    crown.rotation.x =
      Math.PI / 2;


    /* 왕관 뾰족한 부분 */

    for (let i = 0; i < 3; i++) {

      const tooth =
        add(
          new THREE.ConeGeometry(
            0.075,
            0.28,
            5
          ),
          m.gold,
          group,
          -0.17 +
            i * 0.17,
          1.25,
          0
        );

      tooth.rotation.z =
        i === 0
          ? -0.12
          : i === 2
          ? 0.12
          : 0;
    }


    /* 가운데 보석 */

    ball(
      group,
      0,
      1.13,
      0.27,
      0.055,
      0.055,
      0.04,
      M(0xf5a7d5)
    );
  }


  /* 🍃 숲의 잎모자 */

  if (acc.hat === "leaf") {

    const leaf =
      ball(
        group,
        0.04,
        1.13,
        0,
        0.30,
        0.08,
        0.16,
        m.leaf2
      );

    leaf.rotation.z =
      -0.30;


    /* 잎맥 */

    const vein =
      box(
        group,
        0.04,
        1.13,
        0.08,
        0.23,
        0.025,
        0.025,
        m.leaf
      );

    vein.rotation.z =
      -0.30;
  }


  /* =========================================================
     🧣 옷
  ========================================================= */

  /* 🧣 포근 목도리 */

  if (acc.outfit === "scarf") {

    const scarf =
      add(
        new THREE.TorusGeometry(
          0.36,
          0.085,
          10,
          28
        ),
        M(0xef9da9),
        group,
        0,
        0.64,
        0
      );

    scarf.rotation.x =
      Math.PI / 2;


    /* 목도리 끝 */

    box(
      group,
      0.20,
      0.52,
      0.04,
      0.12,
      0.34,
      0.07,
      M(0xef9da9)
    );

    box(
      group,
      0.29,
      0.50,
      0.05,
      0.12,
      0.27,
      0.07,
      M(0xf4b2bb)
    );
  }


  /* 🪽 작은 망토 */

  if (acc.outfit === "cape") {

    /* 목 부분 */

    const capeCollar =
      add(
        new THREE.TorusGeometry(
          0.33,
          0.075,
          8,
          24
        ),
        M(0x9f8fd2),
        group,
        0,
        0.66,
        0
      );

    capeCollar.rotation.x =
      Math.PI / 2;


    /* 몸을 감싸는 망토 */

    const cape =
      add(
        new THREE.ConeGeometry(
          0.55,
          0.72,
          16,
          1,
          true
        ),
        M(0x9f8fd2),
        group,
        0,
        0.38,
        -0.02
      );

    cape.rotation.x =
      Math.PI;


    /* 망토 안쪽 */

    const innerCape =
      add(
        new THREE.ConeGeometry(
          0.43,
          0.62,
          16,
          1,
          true
        ),
        M(0xc7b5ed),
        group,
        0,
        0.39,
        0.01
      );

    innerCape.rotation.x =
      Math.PI;
  }


  /* 🎀 리본 장식 */

  if (acc.outfit === "ribbon") {

    /* 왼쪽 리본 */

    ball(
      group,
      -0.18,
      0.63,
      0.35,
      0.15,
      0.10,
      0.045,
      M(0xef86a6)
    );

    /* 오른쪽 리본 */

    ball(
      group,
      0.18,
      0.63,
      0.35,
      0.15,
      0.10,
      0.045,
      M(0xef86a6)
    );

    /* 가운데 매듭 */

    ball(
      group,
      0,
      0.63,
      0.38,
      0.075,
      0.075,
      0.055,
      M(0xf1c76f)
    );


    /* 리본 꼬리 */

    const leftTail =
      box(
        group,
        -0.08,
        0.48,
        0.34,
        0.08,
        0.25,
        0.035,
        M(0xef86a6)
      );

    leftTail.rotation.z =
      -0.25;


    const rightTail =
      box(
        group,
        0.08,
        0.48,
        0.34,
        0.08,
        0.25,
        0.035,
        M(0xef86a6)
      );

    rightTail.rotation.z =
      0.25;
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
   펫 뽑기 연출 스타일
========================================================= */

function injectGachaStyles() {

  if (
    document.getElementById(
      "mongleGachaStyles"
    )
  ) {
    return;
  }

  const style =
    document.createElement("style");

  style.id =
    "mongleGachaStyles";

  style.textContent = `

    .mm-gacha-layout {
      display:grid;
      grid-template-columns:
        minmax(0,1.35fr)
        minmax(280px,.85fr);
      gap:16px;
      align-items:stretch;
    }

    .mm-gacha-main {
      min-height:330px;
      border-radius:24px;
      padding:24px;
      display:flex;
      flex-direction:column;
      align-items:center;
      justify-content:center;
      text-align:center;
      overflow:hidden;

      background:
        radial-gradient(
          circle at 50% 25%,
          #ffffff 0%,
          #f7f0ff 45%,
          #eee3fb 100%
        );

      border:1px solid #eadff5;
    }

    .mm-gacha-badge {
      font-size:11px;
      padding:6px 10px;
      border-radius:999px;
      background:#f4edfc;
      color:#876ca2;
      font-weight:800;
    }

    .mm-gacha-orb {
      width:112px;
      height:112px;
      border-radius:50%;
      position:relative;

      display:flex;
      align-items:center;
      justify-content:center;

      background:
        radial-gradient(
          circle,
          #ffffff 0%,
          #eee2ff 38%,
          #c5a4eb 72%,
          #9d79ca 100%
        );

      box-shadow:
        0 0 22px
        rgba(180,145,225,.45),
        0 0 65px
        rgba(199,166,239,.28);

      animation:
        mmGachaFloat
        2.4s ease-in-out infinite;
    }

    .mm-gacha-orb::before {
      content:"";
      position:absolute;
      inset:-12px;
      border-radius:50%;
      border:1px solid
        rgba(177,143,224,.3);

      animation:
        mmGachaRing
        2s ease-out infinite;
    }

    .mm-gacha-orb-core {
      width:62px;
      height:62px;
      border-radius:50%;

      background:
        radial-gradient(
          circle,
          #ffffff,
          #e5d4ff
        );

      box-shadow:
        inset 0 0 20px
        rgba(255,255,255,.9);
    }

    .mm-gacha-orb-star {
      position:absolute;
      z-index:2;
      font-size:32px;

      filter:
        drop-shadow(
          0 0 9px
          rgba(255,255,255,.95)
        );

      animation:
        mmGachaStar
        1.5s ease-in-out infinite;
    }

    .mm-gacha-question {
      margin-top:17px;
      font-size:20px;
      font-weight:900;
      color:#56466b;
    }

    .mm-gacha-description {
      margin-top:6px;
      font-size:11px;
      line-height:1.6;
      color:#9c91a6;
    }

    .mm-gacha-buttons {
      width:100%;
      display:grid;
      grid-template-columns:1fr 1fr;
      gap:9px;
      margin-top:17px;
    }

    .mm-gacha-buttons
    .mm-pet-button {
      margin-top:0;
    }

    .mm-gacha-rates {
      border-radius:24px;
      padding:20px;
      background:#fff;
      border:1px solid #eadff5;
    }

    .mm-gacha-rates-title {
      font-size:17px;
      font-weight:900;
      color:#57466c;
    }

    .mm-gacha-rates-sub {
      margin-top:4px;
      margin-bottom:12px;
      font-size:11px;
      color:#a39aa9;
    }

    .mm-rarity-row {
      display:flex;
      align-items:center;
      justify-content:space-between;
      gap:10px;

      padding:11px 12px;
      margin-top:7px;

      border-radius:14px;
      background:#faf8fc;

      border-left:4px solid #c9c2d1;
    }

    .mm-rarity-row.rare {
      border-left-color:#86aed1;
    }

    .mm-rarity-row.super {
      border-left-color:#a57bd6;
    }

    .mm-rarity-row.legend {
      border-left-color:#dda64f;
    }

    .mm-rarity-row.special {
      border-left-color:#e77db7;

      background:
        linear-gradient(
          135deg,
          #fff9fd,
          #f6edff
        );
    }

    .mm-rarity-name {
      font-weight:900;
      font-size:12px;
      color:#57466c;
    }

    .mm-rarity-pets {
      margin-top:3px;
      font-size:9px;
      line-height:1.45;
      color:#a39aaa;
    }

    .mm-rarity-rate {
      font-size:15px;
      font-weight:900;
      color:#74598d;
      white-space:nowrap;
    }

    .mm-gacha-rate-note {
      margin-top:12px;
      font-size:9px;
      line-height:1.5;
      color:#aaa1ad;
    }


    /* 실제 뽑기 화면 */

    .mm-gacha-overlay {
      position:fixed;
      inset:0;
      z-index:999999;

      display:flex;
      align-items:center;
      justify-content:center;

      background:
        radial-gradient(
          circle at center,
          rgba(135,101,177,.2),
          rgba(35,24,48,.82)
        );

      backdrop-filter:blur(7px);

      animation:
        mmOverlayIn
        .25s ease;
    }

    .mm-gacha-stage {
      width:min(430px,88vw);
      min-height:390px;

      position:relative;
      overflow:hidden;

      border-radius:30px;
      padding:30px;

      text-align:center;

      background:
        radial-gradient(
          circle at 50% 25%,
          #ffffff,
          #f1e5ff 55%,
          #d9c2f1
        );

      box-shadow:
        0 30px 100px
        rgba(15,8,25,.4);

      animation:
        mmStageIn
        .5s
        cubic-bezier(.2,.9,.2,1);
    }

    .mm-gacha-capsule {
      width:150px;
      height:150px;

      margin:25px auto;

      border-radius:50%;

      display:flex;
      align-items:center;
      justify-content:center;

      background:
        radial-gradient(
          circle,
          #ffffff 0%,
          #eee1ff 35%,
          #c2a0eb 68%,
          #966bc5 100%
        );

      box-shadow:
        0 0 25px
        rgba(204,171,244,.9),
        0 0 80px
        rgba(200,163,241,.7);

      animation:
        mmCapsuleShake
        1s ease-in-out infinite;
    }

    .mm-gacha-capsule-icon {
      font-size:70px;

      filter:
        drop-shadow(
          0 8px 15px
          rgba(80,50,110,.2)
        );
    }

    .mm-gacha-reveal {
      animation:
        mmReveal
        .7s
        cubic-bezier(.2,1.5,.3,1);
    }

    .mm-gacha-reveal-icon {
      font-size:86px;
      margin-top:5px;

      filter:
        drop-shadow(
          0 12px 15px
          rgba(80,50,110,.18)
        );
    }

    .mm-gacha-reveal-rarity {
      margin-top:5px;
      font-size:13px;
      font-weight:900;
    }

    .mm-gacha-reveal-name {
      margin-top:5px;
      font-size:27px;
      font-weight:900;
      color:#50405f;
    }

    .mm-gacha-reveal-desc {
      margin-top:8px;
      font-size:12px;
      line-height:1.5;
      color:#918598;
    }

    .mm-gacha-close {
      border:0;
      margin-top:20px;

      padding:10px 28px;

      border-radius:14px;

      background:#9876c2;
      color:#fff;

      font-weight:900;
      cursor:pointer;
    }

    .mm-gacha-particle {
      position:absolute;
      pointer-events:none;

      font-size:20px;

      animation:
        mmParticle
        1.4s
        ease-out
        forwards;
    }


    @keyframes mmGachaFloat {
      0%,100% {
        transform:translateY(0);
      }

      50% {
        transform:translateY(-8px);
      }
    }

    @keyframes mmGachaStar {
      0%,100% {
        transform:scale(.9)
        rotate(-8deg);
      }

      50% {
        transform:scale(1.2)
        rotate(8deg);
      }
    }

    @keyframes mmGachaRing {
      0% {
        transform:scale(.8);
        opacity:.7;
      }

      100% {
        transform:scale(1.4);
        opacity:0;
      }
    }

    @keyframes mmOverlayIn {
      from {
        opacity:0;
      }

      to {
        opacity:1;
      }
    }

    @keyframes mmStageIn {
      from {
        opacity:0;
        transform:
          scale(.82)
          translateY(20px);
      }

      to {
        opacity:1;
        transform:
          scale(1)
          translateY(0);
      }
    }

    @keyframes mmCapsuleShake {
      0%,100% {
        transform:
          scale(1)
          rotate(0);
      }

      25% {
        transform:
          scale(1.04)
          rotate(-5deg);
      }

      75% {
        transform:
          scale(1.07)
          rotate(5deg);
      }
    }

    @keyframes mmReveal {
      0% {
        opacity:0;
        transform:
          scale(.2)
          rotate(-15deg);
      }

      70% {
        opacity:1;
        transform:
          scale(1.15)
          rotate(5deg);
      }

      100% {
        transform:
          scale(1)
          rotate(0);
      }
    }

    @keyframes mmParticle {
      0% {
        opacity:0;
        transform:
          translate(0,0)
          scale(.3);
      }

      20% {
        opacity:1;
      }

      100% {
        opacity:0;
        transform:
          translate(
            var(--x),
            var(--y)
          )
          scale(1.2);
      }
    }

    @media(max-width:760px) {

      .mm-gacha-layout {
        grid-template-columns:1fr;
      }

      .mm-gacha-buttons {
        grid-template-columns:1fr;
      }

    }

  `;

  document.head.appendChild(style);
}

injectGachaStyles();

/* =========================================================
   실제 펫 뽑기 연출
========================================================= */

function getPetRarityColor(
  rarityClass
) {

  if (
    rarityClass === "common"
  ) {
    return "#9b93a5";
  }

  if (
    rarityClass === "rare"
  ) {
    return "#659bc5";
  }

  if (
    rarityClass === "super"
  ) {
    return "#956bd0";
  }

  if (
    rarityClass === "legend"
  ) {
    return "#d29438";
  }

  if (
    rarityClass === "special"
  ) {
    return "#df69ad";
  }

  return "#806a91";
}


function playPetGachaEffect(
  result,
  duplicate = false
) {

  const old =
    document.querySelector(
      ".mm-gacha-overlay"
    );

  if (old) {
    old.remove();
  }


  const overlay =
    document.createElement("div");

  overlay.className =
    "mm-gacha-overlay";


  const stage =
    document.createElement("div");

  stage.className =
    "mm-gacha-stage";


  /* 파티클 */

  const particleIcons = [
    "✨",
    "✦",
    "⭐",
    "💫",
    "🌟"
  ];

  for (
    let i = 0;
    i < 26;
    i++
  ) {

    const particle =
      document.createElement("div");

    particle.className =
      "mm-gacha-particle";

    particle.textContent =
      particleIcons[
        Math.floor(
          Math.random() *
          particleIcons.length
        )
      ];

    particle.style.left =
      `${15 + Math.random() * 70}%`;

    particle.style.top =
      `${30 + Math.random() * 40}%`;

    particle.style.setProperty(
      "--x",
      `${(Math.random() - .5) * 430}px`
    );

    particle.style.setProperty(
      "--y",
      `${(Math.random() - .5) * 430}px`
    );

    particle.style.animationDelay =
      `${Math.random() * .5}s`;

    stage.appendChild(
      particle
    );
  }


  const capsule =
    document.createElement("div");

  capsule.className =
    "mm-gacha-capsule";

  capsule.innerHTML = `
    <div
      class="mm-gacha-capsule-icon"
    >
      ✨
    </div>
  `;

  stage.appendChild(
    capsule
  );


  const loadingText =
    document.createElement("div");

  loadingText.style.fontWeight =
    "900";

  loadingText.style.color =
    "#76608b";

  loadingText.textContent =
    "별빛이 모이고 있어요...";

  stage.appendChild(
    loadingText
  );


  overlay.appendChild(
    stage
  );

  document.body.appendChild(
    overlay
  );


  let delay = 1150;


  if (
    result.rarityClass ===
    "rare"
  ) {
    delay = 1400;
  }

  if (
    result.rarityClass ===
    "super"
  ) {
    delay = 1650;
  }

  if (
    result.rarityClass ===
    "legend"
  ) {
    delay = 2000;
  }

  if (
    result.rarityClass ===
    "special"
  ) {
    delay = 2450;
  }


  setTimeout(() => {

    stage.innerHTML = "";


    /* 다시 파티클 */

    for (
      let i = 0;
      i < 30;
      i++
    ) {

      const particle =
        document.createElement("div");

      particle.className =
        "mm-gacha-particle";

      particle.textContent =
        particleIcons[
          Math.floor(
            Math.random() *
            particleIcons.length
          )
        ];

      particle.style.left =
        `${10 + Math.random() * 80}%`;

      particle.style.top =
        `${20 + Math.random() * 60}%`;

      particle.style.setProperty(
        "--x",
        `${(Math.random() - .5) * 500}px`
      );

      particle.style.setProperty(
        "--y",
        `${(Math.random() - .5) * 500}px`
      );

      stage.appendChild(
        particle
      );
    }


    const reveal =
      document.createElement("div");

    reveal.className =
      "mm-gacha-reveal";


    const color =
      getPetRarityColor(
        result.rarityClass
      );


    reveal.innerHTML = `

      <div
        class="mm-gacha-reveal-icon"
      >
        ${result.icon}
      </div>

      <div
        class="mm-gacha-reveal-rarity"
        style="
          color:${color};
        "
      >
        ${result.rarity}
        · ${result.rate}%
      </div>

      <div
        class="mm-gacha-reveal-name"
      >
        ${result.name}
      </div>

      <div
        class="mm-gacha-reveal-desc"
      >
        ${
          duplicate
            ? `이미 만난 친구예요!<br>
               🪙 펫 코인 ${result.duplicateCoins}개를 받았어요.`
            : `새로운 친구가 도감에 추가되었어요!`
        }
      </div>

      <button
        class="mm-gacha-close"
      >
        확인
      </button>

    `;


    stage.appendChild(
      reveal
    );


    const close =
      reveal.querySelector(
        ".mm-gacha-close"
      );


    if (close) {

      close.addEventListener(
        "click",
        () => {
          overlay.remove();
        }
      );

    }

  }, delay);
}
   
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

<div class="mm-pet-section">

  <div class="mm-pet-title">
    <h3>🎁 펫 뽑기</h3>

    <div class="mm-gacha-badge">
      ✨ 별빛으로 친구 만나기
    </div>
  </div>

  <div class="mm-gacha-layout">

    <!-- 왼쪽 : 뽑기 -->

    <div class="mm-gacha-main">

      <div class="mm-gacha-orb">
        <div class="mm-gacha-orb-star">
          ✨
        </div>

        <div class="mm-gacha-orb-core">
        </div>
      </div>

      <div class="mm-gacha-question">
        새로운 친구를 만나볼까요?
      </div>

      <div class="mm-gacha-description">
        별빛을 모아 신비한 펫을 만나 보세요.
        <br>
        중복된 펫은 펫 코인으로 바뀌어요.
      </div>

      <div class="mm-gacha-buttons">

        <button
          class="mm-pet-button"
          data-pet-action="draw"
          ${state.petCurrency < 5 ? "disabled" : ""}
        >
          ✨ 5개로 1회 뽑기
        </button>

        <button
          class="mm-pet-button"
          data-pet-action="drawFive"
          ${state.petCurrency < 20 ? "disabled" : ""}
        >
          ✨ 20개로 5회 뽑기
        </button>

      </div>

      <div
        class="mm-gacha-result"
        id="petGachaResult"
      ></div>

    </div>


    <!-- 오른쪽 : 확률표 -->

    <div class="mm-gacha-rates">

      <div class="mm-gacha-rates-title">
        📊 등장 확률
      </div>

      <div class="mm-gacha-rates-sub">
        희귀도가 높을수록 만나기 어려워요.
      </div>

      ${
        PET_RARITIES.map(rarity => {

          const pets =
            PET_LIST.filter(
              p =>
                p.rarityClass ===
                rarity.id
            );

          return `
            <div
              class="
                mm-rarity-row
                ${rarity.id}
              "
            >

              <div class="mm-rarity-left">

                <div class="mm-rarity-name">
                  ${rarity.icon}
                  ${rarity.name}
                </div>

                <div class="mm-rarity-pets">
                  ${
                    pets.map(
                      p =>
                        `${p.icon} ${p.name} ${p.rate}%`
                    ).join(" · ")
                  }
                </div>

              </div>

              <div class="mm-rarity-rate">
                ${rarity.rate}%
              </div>

            </div>
          `;

        }).join("")
      }

      <div class="mm-gacha-rate-note">
        ※ 기본 펫 「몽글토끼」는 처음부터 함께해요.
      </div>

    </div>

  </div>

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

if (action === "drawFive") {
  drawPetFive();
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

/* =========================================================
   펫 1회 뽑기
========================================================= */

function drawPet() {

  const cost = 5;

  if (
    state.petCurrency < cost
  ) {

    toast(
      "별빛 5개가 필요해요. ✨"
    );

    return;
  }


  state.petCurrency -= cost;


  state.stats.petDraws =
    (state.stats.petDraws || 0) + 1;


  const roll =
    Math.random() * 100;


  let sum = 0;

  let result =
    PETS.puppy;


  for (
    const petData of PET_LIST
  ) {

    if (
      petData.id === "bunny"
    ) {
      continue;
    }


    sum +=
      petData.rate;


    if (
      roll <= sum
    ) {

      result =
        petData;

      break;
    }
  }


  let duplicate =
    false;


  /* 중복 */

  if (
    state.ownedPets.includes(
      result.id
    )
  ) {

    duplicate = true;


    state.petCoins +=
      result.duplicateCoins;

  }

  /* 새로운 펫 */

  else {

    state.ownedPets.push(
      result.id
    );


    if (
      !state.petAccessories[
        result.id
      ]
    ) {

      state.petAccessories[
        result.id
      ] = {
        hat: "none",
        outfit: "none"
      };

    }

  }


  save();

  renderPetUI();


  playPetGachaEffect(
    result,
    duplicate
  );
}


/* =========================================================
   펫 5회 뽑기
========================================================= */

function drawPetFive() {

  const cost = 20;

  if (state.petCurrency < cost) {

    toast(
      "별빛 20개가 필요해요. ✨"
    );

    return;
  }

  state.petCurrency -= cost;

  state.stats.petDraws =
    (state.stats.petDraws || 0) + 5;

  const results = [];

  for (let i = 0; i < 5; i++) {

    const roll =
      Math.random() * 100;

    let sum = 0;

    let result =
      PETS.puppy;

    for (
      const petData of PET_LIST
    ) {

      if (petData.id === "bunny") {
        continue;
      }

      sum += petData.rate;

      if (roll <= sum) {
        result = petData;
        break;
      }
    }

    let duplicate = false;

    if (
      state.ownedPets.includes(
        result.id
      )
    ) {

      duplicate = true;

      state.petCoins +=
        result.duplicateCoins;

    } else {

      state.ownedPets.push(
        result.id
      );

      if (
        !state.petAccessories[
          result.id
        ]
      ) {

        state.petAccessories[
          result.id
        ] = {
          hat: "none",
          outfit: "none"
        };

      }

    }

    results.push({
      pet: result,
      duplicate: duplicate
    });

  }

  save();

  renderPetUI();

  playPetGachaEffectFive(
    results
  );

}

/* =========================================================
   펫 5회 뽑기 이펙트
========================================================= */

function playPetGachaEffectFive(results) {

  let index = 0;

  function showNext() {

    if (index >= results.length) {

      const resultText =
        results
          .map(item => {

            const p =
              item.pet;

            return item.duplicate
              ? `${p.icon} ${p.name} · 중복`
              : `${p.icon} ${p.name}`;

          })
          .join("  ·  ");

      showGachaResult(
        "✨ 5회 뽑기 완료!",
        resultText,
        "새로운 친구와 펫 코인을 확인해 보세요!"
      );

      renderPetUI();

      return;
    }

    const item =
      results[index];

    index++;

    playPetGachaEffect(
      item.pet,
      item.duplicate
    );

    setTimeout(
      showNext,
      3000
    );

  }

  showNext();

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


  if (
    !state.petAccessories[petId]
  ) {

    state.petAccessories[petId] = {
      hat: "none",
      outfit: "none"
    };
  }


  if (
    !Array.isArray(
      state.petOwnedHats
    )
  ) {

    state.petOwnedHats = [
      "none"
    ];
  }


  /* 아무것도 안 쓰기 */

  if (
    id === "none"
  ) {

    state.petAccessories[
      petId
    ].hat = "none";

    createPetModel(
      state.selectedPet
    );

    save();

    renderPetUI();

    toast(
      "모자를 벗었어요."
    );

    return;
  }


  /* 처음 구매 */

  const alreadyOwned =
    state.petOwnedHats.includes(
      id
    );


  if (
    !alreadyOwned
  ) {

    if (
      state.petCoins <
      item.price
    ) {

      toast(
        "펫 코인이 부족해요."
      );

      return;
    }


    state.petCoins -=
      item.price;


    state.petOwnedHats.push(
      id
    );


    toast(
      `${item.name}을 구매했어요! 이제 내 옷장에 영구 소장돼요. 🎀`
    );
  }


  /* 착용 */

  state.petAccessories[
    petId
  ].hat = id;


  createPetModel(
    state.selectedPet
  );

  save();

  renderPetUI();


  if (
    alreadyOwned
  ) {

    toast(
      `${item.name}을 착용했어요.`
    );
  }
}


function equipPetOutfit(id) {

  const item =
    PET_OUTFITS[id];

  if (!item) return;


  const petId =
    state.selectedPet;


  if (
    !state.petAccessories[petId]
  ) {

    state.petAccessories[petId] = {
      hat: "none",
      outfit: "none"
    };
  }


  if (
    !Array.isArray(
      state.petOwnedOutfits
    )
  ) {

    state.petOwnedOutfits = [
      "none"
    ];
  }


  /* 아무것도 입지 않기 */

  if (
    id === "none"
  ) {

    state.petAccessories[
      petId
    ].outfit = "none";


    createPetModel(
      state.selectedPet
    );

    save();

    renderPetUI();

    toast(
      "옷을 벗었어요."
    );

    return;
  }


  /* 처음 구매 */

  const alreadyOwned =
    state.petOwnedOutfits.includes(
      id
    );


  if (
    !alreadyOwned
  ) {

    if (
      state.petCoins <
      item.price
    ) {

      toast(
        "펫 코인이 부족해요."
      );

      return;
    }


    state.petCoins -=
      item.price;


    state.petOwnedOutfits.push(
      id
    );


    toast(
      `${item.name}을 구매했어요! 이제 내 옷장에 영구 소장돼요. 👗`
    );
  }


  /* 착용 */

  state.petAccessories[
    petId
  ].outfit = id;


  createPetModel(
    state.selectedPet
  );

  save();

  renderPetUI();


  if (
    alreadyOwned
  ) {

    toast(
      `${item.name}을 착용했어요.`
    );
  }
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
   반복 퀘스트 시스템
========================================================= */

/*
  퀘스트마다
  "마지막으로 보상을 받은 시점의 진행도"를 저장합니다.

  예:
  물주기 현재 통계 = 7
  목표 = 3
  마지막 기준 = 4

  → 현재 퀘스트 진행도 = 7 - 4 = 3

  보상을 받으면 기준을 7로 변경

  → 현재 진행도 = 7 - 7 = 0
*/


function ensureQuestProgressBase() {

  if (
    !state.questProgressBase ||
    typeof state.questProgressBase !== "object"
  ) {

    state.questProgressBase = {};

  }


  QUESTS.forEach(q => {

    /*
      이미 기준값이 있으면 그대로 사용
    */

    if (
      typeof state.questProgressBase[q.id]
      === "number"
    ) {

      return;

    }


    /*
      예전에 이미 보상을 받은 퀘스트라면
      현재 진행도를 새로운 시작점으로 설정합니다.

      이렇게 해야 기존 저장 데이터에서
      이미 받은 보상을 다시 받는 문제가 없습니다.
    */

    if (
      Array.isArray(state.questClaims) &&
      state.questClaims.includes(q.id)
    ) {

      state.questProgressBase[q.id] =
        Number(
          q.getProgress()
        ) || 0;

      return;

    }


    /*
      아직 보상을 받지 않은 퀘스트는
      기존 진행도를 그대로 사용할 수 있도록
      시작점을 0으로 설정합니다.
    */

    state.questProgressBase[q.id] = 0;

  });

}


/* =========================================================
   반복 퀘스트 진행도
========================================================= */

function getRepeatableQuestProgress(q) {

  ensureQuestProgressBase();


  const current =
    Number(
      q.getProgress()
    ) || 0;


  const base =
    Number(
      state.questProgressBase[q.id]
    ) || 0;


  return Math.max(
    0,
    current - base
  );

}


/* =========================================================
   퀘스트 UI
========================================================= */

function renderQuestUI() {

  ensureQuestUI();

  if (!questUI) {
    return;
  }


  ensureQuestProgressBase();


  questUI.innerHTML = `

    <div class="mm-pet-section">

      <div class="mm-pet-title">

        <h3>
          ✨ 별빛 퀘스트
        </h3>

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
        <br>
        퀘스트를 완료하면 다시 새로운 목표에 도전할 수 있어요. 🌱

      </div>

    </div>


    ${QUESTS.map(q => {

      /*
        마지막 보상 이후의 활동만 계산
      */

      const progress =
        Math.min(
          q.goal,
          Math.max(
            0,
            getRepeatableQuestProgress(q)
          )
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


      const completionCount =
        state.questCompletions &&
        Number(
          state.questCompletions[q.id]
        ) || 0;


      return `

        <div class="
          mm-quest
          ${
            completed
              ? "completed"
              : ""
          }
        ">

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
                    !completed
                      ? "disabled"
                      : ""
                  }
                >

                  ${
                    completed
                      ? "보상 받기"
                      : "진행 중"
                  }

                </button>

              </div>


              ${
                completionCount > 0
                  ? `
                    <div style="
                      margin-top:6px;
                      font-size:11px;
                      opacity:.55;
                    ">
                      ✨ ${completionCount}회 완료
                    </div>
                  `
                  : ""
              }

            </div>

          </div>

        </div>

      `;

    }).join("")}

  `;

}


/* =========================================================
   퀘스트 클릭
========================================================= */

function handleQuestClick(e) {

  const button =
    e.target.closest(
      "[data-quest-action]"
    );


  if (!button) {
    return;
  }


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


/* =========================================================
   퀘스트 보상 받기
========================================================= */

function claimQuest(id) {

  ensureQuestProgressBase();


  const quest =
    QUESTS.find(
      q => q.id === id
    );


  if (!quest) {
    return;
  }


  /*
    마지막 보상 이후의
    실제 퀘스트 진행도
  */

  const progress =
    getRepeatableQuestProgress(
      quest
    );


  /*
    목표를 달성하지 않았다면
    보상을 지급하지 않습니다.
  */

  if (
    progress <
    quest.goal
  ) {

    toast(
      "아직 퀘스트를 완료하지 않았어요. 🌱"
    );

    return;

  }


  /*
    별빛 지급
  */

  state.petCurrency +=
    Number(
      quest.rewardPetCurrency
    ) || 0;


  /*
    코인 지급
  */

  state.coins +=
    Number(
      quest.rewardCoins
    ) || 0;


  /*
    경험치 지급
  */

  xp(10);


  /*
    완료 횟수 기록
  */

  if (
    !state.questCompletions ||
    typeof state.questCompletions !== "object"
  ) {

    state.questCompletions = {};

  }


  state.questCompletions[id] =
    (
      Number(
        state.questCompletions[id]
      ) || 0
    ) + 1;


  /*
    ⭐ 핵심

    현재 진행도를
    새로운 시작점으로 저장합니다.

    예:

    물주기 3회 달성
    현재 통계 = 8

    보상 받기

    기준값 = 8

    화면:

    0 / 3

    이후 물주기:

    9 → 1 / 3
    10 → 2 / 3
    11 → 3 / 3

    다시 보상 가능
  */

  state.questProgressBase[id] =
    Number(
      quest.getProgress()
    ) || 0;


  /*
    예전 일회성 questClaims는
    반복 퀘스트에서는 더 이상 사용하지 않습니다.

    다만 기존 저장 데이터와의 호환을 위해
    배열 자체는 그대로 둡니다.
  */


  save();


  /*
    화면 갱신
  */

  renderQuestUI();


  /*
    완료 알림
  */

  toast(
    `퀘스트 완료! ✨ 별빛 +${
      quest.rewardPetCurrency
    }${
      quest.rewardCoins
        ? ` · 🪙 코인 +${quest.rewardCoins}`
        : ""
    }`
  );

}

/* =========================================================
   날짜별 마음 기록
========================================================= */

function getTodayJournalDate() {
  const now = new Date();

  const y = now.getFullYear();

  const m = String(
    now.getMonth() + 1
  ).padStart(2, "0");

  const d = String(
    now.getDate()
  ).padStart(2, "0");

  return `${y}-${m}-${d}`;
}


function ensureJournalState() {

  if (
    !state.journalHistory ||
    typeof state.journalHistory !== "object"
  ) {
    state.journalHistory = {};
  }

  if (
    typeof state.journalText !== "string"
  ) {
    state.journalText = "";
  }

  if (
    !state.journalDate
  ) {
    state.journalDate =
      getTodayJournalDate();
  }

  /*
     예전에 작성한 기존 마음 기록이 있다면
     날짜별 기록으로 한 번 옮겨 줍니다.
  */
  if (
    state.journalText &&
    Object.keys(
      state.journalHistory
    ).length === 0
  ) {

    state.journalHistory[
      state.journalDate
    ] = {
      mood:
        state.mood || null,

      text:
        state.journalText
    };
  }

  if (
    !state.journalSelectedDate
  ) {
    state.journalSelectedDate =
      getTodayJournalDate();
  }
}


function getJournalRecord(date) {

  ensureJournalState();

  return (
    state.journalHistory[date] || {
      mood: null,
      text: ""
    }
  );
}


function formatJournalDate(date) {

  const parts =
    date.split("-");

  if (
    parts.length !== 3
  ) {
    return date;
  }

  return (
    `${parts[0]}년 ` +
    `${Number(parts[1])}월 ` +
    `${Number(parts[2])}일`
  );
}


function updateJournalUI() {

  ensureJournalState();

  const picker =
    $("journalDatePicker");

  const label =
    $("journalDateLabel");

  const readOnly =
    $("journalReadOnly");

  const input =
    $("journalText");

  const saveButton =
    $("journalSave");

  const moodSaved =
    $("moodSaved");

  const editNotice =
    $("journalEditNotice");


  const selectedDate =
    state.journalSelectedDate ||
    getTodayJournalDate();

  const today =
    getTodayJournalDate();

  const isToday =
    selectedDate === today;


  const record =
    getJournalRecord(
      selectedDate
    );


  /* 날짜 선택 */

  if (picker) {

    picker.value =
      selectedDate;

    picker.max =
      today;
  }


  /* 날짜 표시 */

  if (label) {

    label.textContent =
      formatJournalDate(
        selectedDate
      );
  }


  /* 읽기 전용 안내 */

  if (readOnly) {

    readOnly.textContent =
      isToday
        ? "오늘의 기록은 자유롭게 작성하고 수정할 수 있어요."
        : "지난 기록은 읽기만 할 수 있어요.";
  }


  /* 마음 글 */

  if (input) {

    if (
      input.value !==
      record.text
    ) {
      input.value =
        record.text;
    }

    input.readOnly =
      !isToday;

    input.classList.toggle(
      "journal-readonly",
      !isToday
    );
  }


  /* 저장 버튼 */

  if (saveButton) {

    saveButton.disabled =
      !isToday;

    saveButton.textContent =
      isToday
        ? "마음 기록 저장하기"
        : "지난 기록은 수정할 수 없어요";
  }


  /* 수정 안내 */

  if (editNotice) {

    editNotice.textContent =
      isToday
        ? "오늘의 기록은 저장한 뒤에도 자유롭게 수정할 수 있어요."
        : "지난 기록은 수정할 수 없어요.";
  }


  /* 기분 버튼 */

  document
    .querySelectorAll(".mood")
    .forEach(button => {

      button.classList.toggle(
        "selected",
        button.dataset.mood ===
          record.mood
      );

      button.disabled =
        !isToday;
    });


  /* 기분 표시 */

  if (moodSaved) {

    moodSaved.textContent =
      record.mood
        ? moodNames[
            record.mood
          ]
        : "기분을 기록하지 않아도 괜찮아요.";
  }
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
      data-garden-plot="${index}"
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

const journalDatePicker =
  $("journalDatePicker");


/* =========================================================
   날짜 선택
========================================================= */

if (journalDatePicker) {

  journalDatePicker.addEventListener(
    "change",
    () => {

      const today =
        getTodayJournalDate();

      let selectedDate =
        journalDatePicker.value;

      /*
         미래 날짜는 선택할 수 없도록 합니다.
      */
      if (
        !selectedDate ||
        selectedDate > today
      ) {
        selectedDate =
          today;

        journalDatePicker.value =
          today;
      }

      state.journalSelectedDate =
        selectedDate;

      updateJournalUI();

      save();
    }
  );
}


/* =========================================================
   기분 선택
========================================================= */

document
  .querySelectorAll(".mood")
  .forEach(button => {

    button.addEventListener(
      "click",
      () => {

        ensureJournalState();

        const today =
          getTodayJournalDate();

        const selectedDate =
          state.journalSelectedDate ||
          today;

        /*
           지난 기록은 수정할 수 없습니다.
        */
        if (
          selectedDate !==
          today
        ) {
          return;
        }

        const mood =
          button.dataset.mood;

        if (!mood) {
          return;
        }


        /*
           오늘 날짜의 기록을 가져옵니다.
        */
        const record =
          getJournalRecord(
            selectedDate
          );


        record.mood =
          mood;


        state.journalHistory[
          selectedDate
        ] = record;


        /*
           기존 상태와도 연결해 둡니다.
        */
        state.mood =
          mood;


        save();

        updateJournalUI();


        toast(
          "오늘의 마음을 선택했어요. 💜"
        );
      }
    );
  });


/* =========================================================
   글 기록 저장
========================================================= */

if (journalSave) {

  journalSave.addEventListener(
    "click",
    () => {

      ensureJournalState();

      const today =
        getTodayJournalDate();

      const selectedDate =
        state.journalSelectedDate ||
        today;


      /*
         오늘만 저장할 수 있습니다.
      */
      if (
        selectedDate !==
        today
      ) {
        return;
      }


      const text =
        journalInput
          ? journalInput.value
              .slice(
                0,
                1200
              )
          : "";


      const oldRecord =
        getJournalRecord(
          selectedDate
        );


      /*
         오늘 날짜의 기존 기록이
         처음 저장되는 경우에만
         기록 횟수를 1 증가시킵니다.

         같은 날 여러 번 수정해도
         journals가 계속 증가하지 않습니다.
      */
      const wasEmpty =
        !oldRecord.text &&
        !oldRecord.mood;


      state.journalHistory[
        selectedDate
      ] = {

        mood:
          oldRecord.mood ||
          null,

        text:
          text
      };


      /*
         기존 상태와 연결
      */
      state.journalText =
        text;

      state.journalDate =
        selectedDate;


      /*
         오늘 처음 기록했을 때만
         활동 통계를 증가시킵니다.
      */
      if (
        wasEmpty
      ) {

        state.stats.journals++;

      }


      save();

      updateJournalUI();


      toast(
        "오늘의 마음을 기록했어요. 💜"
      );
    }
  );
}

/* =========================================================
   처음 화면에 날짜별 기록 반영
========================================================= */

ensureJournalState();

updateJournalUI();

/* =========================================================
   🌿 마음 돌보기 - 작은 쉼 활동
========================================================= */

let mindCareReady = false;
/* =========================================================
   🌿 오늘의 마음 돌보기 기록
========================================================= */

let mindCareToday = {
  rain: false,
  color: false,
  cloud: false,
  quiet: false
};

function completeMindCareToday(type) {

  if (!mindCareToday[type]) {
    mindCareToday[type] = true;
  }

  updateMindCareTodayUI();
}

function updateMindCareTodayUI() {

  const items =
    document.querySelectorAll(
      "[data-mind-care-today]"
    );

  items.forEach(item => {

    const type =
      item.dataset.mindCareToday;

    const done =
      mindCareToday[type];

    item.textContent =
      done
        ? "✓ 완료"
        : "아직 안 했어요";

    item.style.color =
      done
        ? "#708f7b"
        : "#9aa4b3";

    item.style.background =
      done
        ? "rgba(185,221,208,.35)"
        : "rgba(255,255,255,.6)";

  });
}
let mindCareRainTimer = null;
let mindCareClouds = [];

function ensureMindCareUI() {

  if (mindCareReady) {
    return;
  }

  const journalScreen =
    document.querySelector(
      '[data-screen="journal"]'
    );

  if (!journalScreen) {
    return;
  }

  const breathCard =
    journalScreen.querySelector(
      ".breath-card"
    );

  if (!breathCard) {
    return;
  }

  const section =
    document.createElement("section");

  section.className =
    "content-card mind-care-activities";

  section.innerHTML = `
    <div class="section-title">
      <div>
        <span class="eyebrow">
          LITTLE REST
        </span>

        <h2>
          지금 필요한 작은 쉼
        </h2>
      </div>

      <span class="soft-pill">
        원할 때만
      </span>
    </div>

    <p class="helper-text">
      꼭 무언가를 해야 하는 건 아니에요.
      마음에 맞는 활동 하나만 천천히 골라봐요.
    </p>

    <div
      style="
        display:grid;
        grid-template-columns:repeat(2,minmax(0,1fr));
        gap:12px;
        margin-top:16px;
      "
    >

<button
  type="button"
  class="mind-care-action"
  data-mind-care="rain"
        style="
          border:1px solid rgba(120,140,180,.18);
          border-radius:20px;
          padding:20px 14px;
          background:linear-gradient(145deg,#eef6ff,#f8f3ff);
          cursor:pointer;
          text-align:left;
        "
      >
        <div style="font-size:28px;">🌧️</div>

        <strong
          style="
            display:block;
            margin-top:8px;
            font-size:15px;
          "
        >
          빗소리 쉼터
        </strong>

<span
  style="
    display:block;
    margin-top:5px;
    font-size:12px;
    opacity:.62;
    line-height:1.5;
  "
>
  잠시 비를 바라보며 쉬어요.
</span>

<span
  data-mind-care-today="rain"
  style="
    display:block;
    margin-top:6px;
    font-size:11px;
    color:#9aa4b3;
  "
>
  아직 안 했어요
</span>
      </button>


      <button
        type="button"
        class="mind-care-action"
data-mind-care="color"
        style="
          border:1px solid rgba(180,150,190,.18);
          border-radius:20px;
          padding:20px 14px;
          background:linear-gradient(145deg,#fff5f7,#f5f1ff);
          cursor:pointer;
          text-align:left;
        "
      >
        <div style="font-size:28px;">🎨</div>

        <strong
          style="
            display:block;
            margin-top:8px;
            font-size:15px;
          "
        >
          마음 색 고르기
        </strong>

<span
  style="
    display:block;
    margin-top:5px;
    font-size:12px;
    opacity:.62;
    line-height:1.5;
  "
>
  지금의 마음과 가까운 색을 골라요.
</span>

<span
  data-mind-care-today="color"
  style="
    display:block;
    margin-top:6px;
    font-size:11px;
    color:#9aa4b3;
  "
>
  아직 안 했어요
</span>

</button>

      <button
        type="button"
        class="mind-care-action"
data-mind-care="cloud"
        style="
          border:1px solid rgba(150,160,180,.18);
          border-radius:20px;
          padding:20px 14px;
          background:linear-gradient(145deg,#f3f8ff,#f5f5ff);
          cursor:pointer;
          text-align:left;
        "
      >
        <div style="font-size:28px;">🫧</div>

        <strong
          style="
            display:block;
            margin-top:8px;
            font-size:15px;
          "
        >
          몽글이 내려놓기
        </strong>

        <span
          style="
            display:block;
            margin-top:5px;
            font-size:12px;
            opacity:.62;
            line-height:1.5;
          "
        >
          잠시 내려놓고 싶은 생각을 골라요.
        </span>
        <span
  data-mind-care-today="cloud"
  style="
    display:block;
    margin-top:6px;
    font-size:11px;
    color:#9aa4b3;
  "
>
  아직 안 했어요
</span>
      </button>


      <button
        type="button"
        class="mind-care-action"
data-mind-care="quiet"
        style="
          border:1px solid rgba(170,150,180,.18);
          border-radius:20px;
          padding:20px 14px;
          background:linear-gradient(145deg,#f6f2ff,#fff8ef);
          cursor:pointer;
          text-align:left;
        "
      >
        <div style="font-size:28px;">🌙</div>

        <strong
          style="
            display:block;
            margin-top:8px;
            font-size:15px;
          "
        >
          조용한 쉼
        </strong>

        <span
          style="
            display:block;
            margin-top:5px;
            font-size:12px;
            opacity:.62;
            line-height:1.5;
          "
        >
          아무것도 하지 않고 잠시 머물러요.
        </span>
<span
  data-mind-care-today="quiet"
  style="
    display:block;
    margin-top:6px;
    font-size:11px;
    color:#9aa4b3;
  "
>
  아직 안 했어요
</span>
      </button>

    </div>

    <div
      id="mindCareActivity"
      style="
        margin-top:16px;
      "
    ></div>
  `;

  breathCard.before(
    section
  );

  mindCareReady = true;

  bindMindCareButtons();
}

/* =========================================================
   마음 돌보기 버튼
========================================================= */

function bindMindCareButtons() {

  document
    .querySelectorAll(
      "[data-mind-care]"
    )
    .forEach(button => {

      button.addEventListener(
        "click",
        () => {

          const type =
            button.dataset.mindCare;

          if (type === "rain") {
            openRainRest();
          }

          if (type === "color") {
            openMindColor();
          }

          if (type === "cloud") {
            openMongleCloud();
          }

          if (type === "quiet") {
            openQuietRest();
          }

        }
      );

    });

}


/* =========================================================
   활동 영역
========================================================= */

function getMindCareActivity() {

  return $(
    "mindCareActivity"
  );

}


/* =========================================================
   🌧️ 빗소리 쉼터
========================================================= */

function openRainRest() {

  const activity =
    getMindCareActivity();

  if (!activity) {
    return;
  }

  clearMindCareTimers();

  activity.innerHTML = `

    <div
      style="
        position:relative;
        overflow:hidden;
        min-height:560px;
        border-radius:28px;
        background:
          linear-gradient(
            180deg,
            #9fb8c8 0%,
            #b9cbd2 38%,
            #8099a0 100%
          );
        box-shadow:
          0 18px 45px
          rgba(70,90,100,.16);
      "
    >

      <!-- 하늘 -->
      <div
        style="
          position:absolute;
          inset:0;
          background:
            radial-gradient(
              circle at 25% 20%,
              rgba(255,255,255,.32),
              transparent 24%
            ),
            linear-gradient(
              180deg,
              rgba(255,255,255,.10),
              transparent 55%
            );
          pointer-events:none;
        "
      ></div>


      <!-- 구름 -->
      <div
        style="
          position:absolute;
          top:48px;
          left:8%;
          width:170px;
          height:55px;
          border-radius:50px;
          background:rgba(245,250,252,.42);
          filter:blur(1px);
          animation:
            mindCloudMove 8s ease-in-out infinite alternate;
        "
      ></div>

      <div
        style="
          position:absolute;
          top:90px;
          right:5%;
          width:210px;
          height:60px;
          border-radius:50px;
          background:rgba(240,248,250,.35);
          filter:blur(1px);
          animation:
            mindCloudMove2 10s ease-in-out infinite alternate;
        "
      ></div>


      <!-- 뒤쪽 나무 -->
      <div
        style="
          position:absolute;
          left:4%;
          bottom:125px;
          width:115px;
          height:270px;
        "
      >

        <div
          style="
            position:absolute;
            left:51px;
            bottom:0;
            width:18px;
            height:150px;
            border-radius:12px;
            background:#675b55;
          "
        ></div>

        <div
          style="
            position:absolute;
            left:0;
            top:35px;
            width:115px;
            height:115px;
            border-radius:50%;
            background:#58766d;
            box-shadow:
              35px -25px 0 #66867b,
              75px 10px 0 #506e66,
              22px 30px 0 #719087;
          "
        ></div>

      </div>


      <!-- 오른쪽 나무 -->
      <div
        style="
          position:absolute;
          right:2%;
          bottom:120px;
          width:130px;
          height:300px;
        "
      >

        <div
          style="
            position:absolute;
            right:55px;
            bottom:0;
            width:20px;
            height:170px;
            border-radius:12px;
            background:#625752;
          "
        ></div>

        <div
          style="
            position:absolute;
            right:0;
            top:35px;
            width:125px;
            height:125px;
            border-radius:50%;
            background:#52736a;
            box-shadow:
              -35px -22px 0 #67887e,
              -72px 18px 0 #4c6c63,
              -20px 35px 0 #71948a;
          "
        ></div>

      </div>


      <!-- 작은 연못 -->
      <div
        style="
          position:absolute;
          left:50%;
          bottom:65px;
          transform:translateX(-50%);
          width:330px;
          height:120px;
          border-radius:50%;
          background:
            radial-gradient(
              ellipse at center,
              rgba(205,235,238,.75),
              rgba(104,153,161,.72) 55%,
              rgba(72,111,117,.60) 100%
            );
          box-shadow:
            inset 0 8px 20px
            rgba(255,255,255,.18),
            0 12px 30px
            rgba(40,70,75,.16);
        "
      >

        <!-- 물결 -->
        <div
          style="
            position:absolute;
            left:50%;
            top:45%;
            width:70px;
            height:20px;
            transform:translate(-50%,-50%);
            border:2px solid rgba(235,250,250,.52);
            border-radius:50%;
            animation:
              pondRipple 3s ease-out infinite;
          "
        ></div>

        <div
          style="
            position:absolute;
            left:50%;
            top:45%;
            width:70px;
            height:20px;
            transform:translate(-50%,-50%);
            border:2px solid rgba(235,250,250,.38);
            border-radius:50%;
            animation:
              pondRipple 3s ease-out 1.5s infinite;
          "
        ></div>

      </div>


      <!-- 연못 옆 돌 -->
      <div
        style="
          position:absolute;
          left:28%;
          bottom:75px;
          width:38px;
          height:20px;
          border-radius:50%;
          background:#718184;
          transform:rotate(-8deg);
        "
      ></div>

      <div
        style="
          position:absolute;
          right:28%;
          bottom:72px;
          width:45px;
          height:23px;
          border-radius:50%;
          background:#687a7d;
          transform:rotate(12deg);
        "
      ></div>


      <!-- 벤치 -->
      <div
        style="
          position:absolute;
          left:50%;
          bottom:190px;
          transform:translateX(-50%);
          width:150px;
          height:80px;
        "
      >

        <div
          style="
            position:absolute;
            top:10px;
            left:0;
            width:150px;
            height:25px;
            border-radius:10px;
            background:#765f54;
            box-shadow:
              0 5px 0 #614d45;
          "
        ></div>

        <div
          style="
            position:absolute;
            top:42px;
            left:0;
            width:150px;
            height:20px;
            border-radius:8px;
            background:#80685b;
          "
        ></div>

        <div
          style="
            position:absolute;
            left:18px;
            top:35px;
            width:10px;
            height:45px;
            background:#554943;
            transform:rotate(8deg);
          "
        ></div>

        <div
          style="
            position:absolute;
            right:18px;
            top:35px;
            width:10px;
            height:45px;
            background:#554943;
            transform:rotate(-8deg);
          "
        ></div>

      </div>


      <!-- 빗방울 영역 -->
      <div
        id="rainDrops"
        style="
          position:absolute;
          inset:0;
          overflow:hidden;
          pointer-events:none;
        "
      ></div>


      <!-- 떨어지는 낙엽 -->
      <div
        id="rainLeaves"
        style="
          position:absolute;
          inset:0;
          overflow:hidden;
          pointer-events:none;
        "
      ></div>


      <!-- 따뜻한 조명 -->
      <div
        style="
          position:absolute;
          left:22%;
          bottom:170px;
          width:12px;
          height:12px;
          border-radius:50%;
          background:#ffe9a8;
          box-shadow:
            0 0 18px
            8px rgba(255,230,150,.20);
        "
      ></div>

      <div
        style="
          position:absolute;
          right:21%;
          bottom:165px;
          width:12px;
          height:12px;
          border-radius:50%;
          background:#ffe9a8;
          box-shadow:
            0 0 18px
            8px rgba(255,230,150,.20);
        "
      ></div>


      <!-- 안내 패널 -->
      <div
        style="
          position:absolute;
          left:20px;
          right:20px;
          top:20px;
          padding:18px 20px;
          border-radius:22px;
          background:
            rgba(40,60,70,.30);
          backdrop-filter:blur(10px);
          color:white;
          box-shadow:
            0 10px 30px
            rgba(30,50,60,.12);
        "
      >

        <div
          style="
            font-size:12px;
            letter-spacing:.14em;
            opacity:.72;
            margin-bottom:5px;
          "
        >
          RAINY LITTLE REST
        </div>

        <div
          style="
            font-size:23px;
            font-weight:700;
          "
        >
          잠깐, 여기서 쉬어가요
        </div>

        <div
          style="
            margin-top:7px;
            font-size:13px;
            line-height:1.6;
            opacity:.82;
          "
        >
          빗소리를 들으며 아무것도 하지 않아도 괜찮아요.
        </div>

      </div>


      <!-- 하단 컨트롤 -->
      <div
        style="
          position:absolute;
          left:20px;
          right:20px;
          bottom:20px;
          display:flex;
          align-items:center;
          gap:10px;
          flex-wrap:wrap;
        "
      >

        <button
          type="button"
          id="rainSoundToggle"
          style="
            border:0;
            border-radius:14px;
            padding:11px 15px;
            background:
              rgba(255,255,255,.82);
            color:#41545c;
            font-weight:700;
            cursor:pointer;
          "
        >
          🔊 소리 켜짐
        </button>

        <div
          style="
            display:flex;
            align-items:center;
            gap:8px;
            padding:10px 13px;
            border-radius:14px;
            background:
              rgba(255,255,255,.72);
          "
        >

          <span
            style="
              font-size:12px;
              color:#50616a;
            "
          >
            🔉
          </span>

          <input
            id="rainVolume"
            type="range"
            min="0"
            max="1"
            step="0.01"
            value="${rainMasterVolume}"
            style="
              width:110px;
            "
          />

        </div>

        <button
          type="button"
          id="rainClose"
          style="
            margin-left:auto;
            border:0;
            border-radius:14px;
            padding:11px 17px;
            background:
              rgba(255,255,255,.92);
            color:#40545d;
            font-weight:700;
            cursor:pointer;
          "
        >
          🌿 이제 괜찮아요
        </button>

      </div>

    </div>
  `;


  /* =====================================================
     🌧️ 빗소리 시작
  ===================================================== */

  startRainSound();


  /* =====================================================
     🌧️ 빗방울 애니메이션
  ===================================================== */

  startRainAnimation();


  /* =====================================================
     🍃 낙엽
  ===================================================== */

  const leaves =
    $("rainLeaves");

  if (leaves) {

    const createLeaf = () => {

      if (!leaves.isConnected) {
        return;
      }

      const leaf =
        document.createElement("span");

      leaf.textContent =
        Math.random() > .5
          ? "🍃"
          : "🍂";

      leaf.style.position =
        "absolute";

      leaf.style.left =
        `${Math.random() * 100}%`;

      leaf.style.top =
        "-30px";

      leaf.style.fontSize =
        `${12 + Math.random() * 10}px`;

      leaf.style.opacity =
        `${0.35 + Math.random() * 0.35}`;

      leaf.style.transition =
        "transform 4.5s linear, opacity 4.5s linear";

      leaves.appendChild(leaf);

      requestAnimationFrame(() => {

        leaf.style.transform =
          `translate(
            ${-80 + Math.random() * 160}px,
            ${500 + Math.random() * 100}px
          )
          rotate(
            ${180 + Math.random() * 360}deg
          )`;

        leaf.style.opacity =
          "0";

      });

      setTimeout(() => {

        leaf.remove();

      }, 4800);

    };


    const leafTimer =
      setInterval(
        createLeaf,
        2300
      );

    mindCareRainTimer =
      leafTimer;

  }


  /* =====================================================
     🌿 버튼
  ===================================================== */

  const toggle =
    $("rainSoundToggle");

  if (toggle) {

    toggle.addEventListener(
      "click",
      () => {

        const muted =
          toggleRainSound();

        toggle.textContent =
          muted
            ? "🔇 소리 꺼짐"
            : "🔊 소리 켜짐";

      }
    );

  }


  const volume =
    $("rainVolume");

  if (volume) {

    volume.addEventListener(
      "input",
      () => {

        setRainVolume(
          volume.value
        );

      }
    );

  }


  const close =
    $("rainClose");

  if (close) {

    close.addEventListener(
      "click",
      () => {

        stopRainSound();

        clearMindCareTimers();

        activity.innerHTML = `
          <div
            style="
              padding:30px;
              text-align:center;
              border-radius:22px;
              background:
                linear-gradient(
                  135deg,
                  #eef6f5,
                  #f7f2f8
                );
            "
          >

            <div
              style="
                font-size:36px;
                margin-bottom:12px;
              "
            >
              🌿
            </div>

            <div
              style="
                font-size:20px;
                font-weight:700;
                color:#53646a;
              "
            >
              잘 쉬었어요.
            </div>

            <div
              style="
                margin-top:8px;
                color:#7b888c;
                line-height:1.7;
              "
            >
              지금의 나에게도<br>
              잠깐 쉬어갈 시간이 필요했어요.
            </div>

          </div>
        `;

        addMindCareXP(3);
   
      completeMindCareToday("rain");

      }
    );

  }

}
   
/* =========================================================
   빗방울 애니메이션
========================================================= */

function startRainAnimation() {

  const area =
    $("rainDrops");

  if (!area) {
    return;
  }

  let count = 0;

  mindCareRainTimer =
    setInterval(
      () => {

        if (!area.isConnected) {
          clearMindCareTimers();
          return;
        }

        const drop =
          document.createElement("span");

        drop.textContent = "│";

        drop.style.position =
          "absolute";

        drop.style.left =
          `${Math.random() * 100}%`;

        drop.style.top =
          `${-20 - Math.random() * 80}px`;

        drop.style.fontSize =
          `${9 + Math.random() * 10}px`;

        drop.style.color =
          "rgba(235,245,255,.75)";

        drop.style.opacity =
          `${0.18 + Math.random() * 0.35}`;

        drop.style.filter =
          "blur(.2px)";

        drop.style.transition =
          "transform 1.2s linear, opacity 1.2s linear";

        area.appendChild(drop);

        requestAnimationFrame(
          () => {

            drop.style.transform =
              `translateY(${380 + Math.random() * 100}px)`;

            drop.style.opacity =
              "0";

          }
        );

        setTimeout(
          () => {
            drop.remove();
          },
          1400
        );

        count++;

      },
      90
    );

}

/* =========================================================
   🌧️ 빗소리 Web Audio
========================================================= */

let rainAudioContext = null;
let rainNoiseSource = null;
let rainNoiseGain = null;
let rainFilter = null;
let rainMuted = false;
let rainMasterVolume = 0.35;
let rainDropTimer = null;


/* =========================================================
   빗소리 시작
========================================================= */

function startRainSound() {

  try {

    if (!rainAudioContext) {

      rainAudioContext =
        new (
          window.AudioContext ||
          window.webkitAudioContext
        )();

    }

    if (
      rainAudioContext.state ===
      "suspended"
    ) {

      rainAudioContext.resume();

    }

    stopRainSound(false);

    const ctx =
      rainAudioContext;

    /*
       부드러운 백색 잡음 생성
    */

    const buffer =
      ctx.createBuffer(
        1,
        ctx.sampleRate * 2,
        ctx.sampleRate
      );

    const data =
      buffer.getChannelData(0);

    for (
      let i = 0;
      i < data.length;
      i++
    ) {

      data[i] =
        Math.random() * 2 - 1;

    }

    rainNoiseSource =
      ctx.createBufferSource();

    rainNoiseSource.buffer =
      buffer;

    rainNoiseSource.loop =
      true;


    /*
       저음 + 고음이 너무 강하지 않도록 필터
    */

    rainFilter =
      ctx.createBiquadFilter();

    rainFilter.type =
      "lowpass";

    rainFilter.frequency.value =
      4200;

    rainFilter.Q.value =
      0.35;


    /*
       전체 볼륨
    */

    rainNoiseGain =
      ctx.createGain();

    rainNoiseGain.gain.value =
      rainMuted
        ? 0
        : rainMasterVolume;


    rainNoiseSource
      .connect(rainFilter)
      .connect(rainNoiseGain)
      .connect(ctx.destination);

    rainNoiseSource.start();

    /*
       가끔 작은 빗방울 소리
    */

    startRainDropsSound();

  }
  catch (error) {

    console.warn(
      "빗소리를 시작할 수 없어요.",
      error
    );

  }

}


/* =========================================================
   빗소리 정지
========================================================= */

function stopRainSound(
  closeContext = false
) {

  if (rainDropTimer) {

    clearInterval(
      rainDropTimer
    );

    rainDropTimer =
      null;

  }

  if (rainNoiseSource) {

    try {
      rainNoiseSource.stop();
    }
    catch (error) {}

    rainNoiseSource.disconnect();
    rainNoiseSource =
      null;

  }

  if (rainFilter) {

    rainFilter.disconnect();
    rainFilter =
      null;

  }

  if (rainNoiseGain) {

    rainNoiseGain.disconnect();
    rainNoiseGain =
      null;

  }

  if (
    closeContext &&
    rainAudioContext
  ) {

    rainAudioContext.close();

    rainAudioContext =
      null;

  }

}


/* =========================================================
   작은 빗방울 소리
========================================================= */

function startRainDropsSound() {

  if (!rainAudioContext) {
    return;
  }

  rainDropTimer =
    setInterval(
      () => {

        if (!rainAudioContext) {
          return;
        }

        if (rainMuted) {
          return;
        }

        playSmallRainDrop();

      },
      450 + Math.random() * 900
    );

}


/* =========================================================
   가까운 빗방울 하나
========================================================= */

function playSmallRainDrop() {

  const ctx =
    rainAudioContext;

  if (!ctx) {
    return;
  }

  const now =
    ctx.currentTime;

  const oscillator =
    ctx.createOscillator();

  const gain =
    ctx.createGain();

  oscillator.type =
    "sine";

  oscillator.frequency.setValueAtTime(
    1100 + Math.random() * 900,
    now
  );

  oscillator.frequency.exponentialRampToValueAtTime(
    500 + Math.random() * 300,
    now + 0.08
  );

  gain.gain.setValueAtTime(
    0,
    now
  );

  gain.gain.linearRampToValueAtTime(
    0.035,
    now + 0.008
  );

  gain.gain.exponentialRampToValueAtTime(
    0.001,
    now + 0.10
  );

  oscillator
    .connect(gain)
    .connect(ctx.destination);

  oscillator.start(now);

  oscillator.stop(
    now + 0.12
  );

}


/* =========================================================
   볼륨
========================================================= */

function setRainVolume(
  value
) {

  rainMasterVolume =
    Math.max(
      0,
      Math.min(
        1,
        Number(value) || 0
      )
    );

  if (rainNoiseGain) {

    rainNoiseGain.gain.value =
      rainMuted
        ? 0
        : rainMasterVolume;

  }

}


/* =========================================================
   음소거
========================================================= */

function toggleRainSound() {

  rainMuted =
    !rainMuted;

  if (rainNoiseGain) {

    rainNoiseGain.gain.value =
      rainMuted
        ? 0
        : rainMasterVolume;

  }

  return rainMuted;

}   

/* =========================================================
   🎨 마음 색 고르기
========================================================= */

function openMindColor() {

  const activity =
    getMindCareActivity();

  if (!activity) {
    return;
  }

  clearMindCareTimers();

  activity.innerHTML = `

    <div
      id="mindColorSpace"
      style="
        position:relative;
        overflow:hidden;

        min-height:500px;

        padding:30px;

        border-radius:28px;

        background:
          linear-gradient(
            145deg,
            #f3effa,
            #eef6f8
          );

        transition:
          background 1s ease,
          box-shadow 1s ease;

        box-shadow:
          0 18px 45px
          rgba(100,110,150,.12);
      "
    >

      <!-- 빛 -->
      <div
        style="
          position:absolute;
          width:230px;
          height:230px;

          left:-80px;
          top:-70px;

          border-radius:50%;

          background:
            rgba(255,255,255,.45);

          filter:blur(12px);

          pointer-events:none;
        "
      ></div>


      <div
        style="
          position:absolute;
          width:260px;
          height:260px;

          right:-100px;
          bottom:-100px;

          border-radius:50%;

          background:
            rgba(255,255,255,.35);

          filter:blur(15px);

          pointer-events:none;
        "
      ></div>


      <!-- 제목 -->
      <div
        style="
          position:relative;
          z-index:2;

          text-align:center;
        "
      >

        <div
          style="
            font-size:12px;
            letter-spacing:.15em;

            color:#8792a6;

            margin-bottom:8px;
          "
        >
          MY LITTLE COLOR
        </div>


        <div
          style="
            font-size:25px;
            font-weight:750;

            color:#5d687d;
          "
        >
          오늘 내 마음은 어떤 색일까요?
        </div>


        <div
          style="
            margin-top:9px;

            color:#8c97a8;

            font-size:14px;
            line-height:1.7;
          "
        >
          지금 가장 끌리는 색 하나를 골라보세요.<br>
          정답은 없어요.
        </div>

      </div>


      <!-- 색 선택 -->
      <div
        style="
          position:relative;
          z-index:3;

          display:grid;

          grid-template-columns:
            repeat(
              5,
              minmax(0,1fr)
            );

          gap:12px;

          max-width:560px;

          margin:32px auto 0;
        "
      >

        <button
          type="button"
          class="mind-color-choice"
          data-color="#f6c7c7"
          data-name="포근한 분홍"
          data-message="조금 더 다정하게 나를 바라봐요."
          style="
            aspect-ratio:1;

            border:0;

            border-radius:22px;

            background:#f6c7c7;

            cursor:pointer;

            box-shadow:
              0 8px 20px
              rgba(150,100,110,.12);

            transition:
              transform .2s ease,
              box-shadow .2s ease;
          "
          aria-label="포근한 분홍"
        ></button>


        <button
          type="button"
          class="mind-color-choice"
          data-color="#f6dfaa"
          data-name="따뜻한 노랑"
          data-message="작은 빛 하나도 충분해요."
          style="
            aspect-ratio:1;

            border:0;

            border-radius:22px;

            background:#f6dfaa;

            cursor:pointer;

            box-shadow:
              0 8px 20px
              rgba(160,140,80,.12);

            transition:
              transform .2s ease,
              box-shadow .2s ease;
          "
          aria-label="따뜻한 노랑"
        ></button>


        <button
          type="button"
          class="mind-color-choice"
          data-color="#b9ddd0"
          data-name="편안한 초록"
          data-message="천천히 숨을 고르듯 쉬어가요."
          style="
            aspect-ratio:1;

            border:0;

            border-radius:22px;

            background:#b9ddd0;

            cursor:pointer;

            box-shadow:
              0 8px 20px
              rgba(80,130,110,.12);

            transition:
              transform .2s ease,
              box-shadow .2s ease;
          "
          aria-label="편안한 초록"
        ></button>


        <button
          type="button"
          class="mind-color-choice"
          data-color="#b9d7ef"
          data-name="맑은 하늘"
          data-message="마음에도 조금의 공간을 만들어줘요."
          style="
            aspect-ratio:1;

            border:0;

            border-radius:22px;

            background:#b9d7ef;

            cursor:pointer;

            box-shadow:
              0 8px 20px
              rgba(80,120,160,.12);

            transition:
              transform .2s ease,
              box-shadow .2s ease;
          "
          aria-label="맑은 하늘"
        ></button>


        <button
          type="button"
          class="mind-color-choice"
          data-color="#cbbce7"
          data-name="조용한 보라"
          data-message="오늘은 조용히 머물러도 괜찮아요."
          style="
            aspect-ratio:1;

            border:0;

            border-radius:22px;

            background:#cbbce7;

            cursor:pointer;

            box-shadow:
              0 8px 20px
              rgba(110,90,150,.12);

            transition:
              transform .2s ease,
              box-shadow .2s ease;
          "
          aria-label="조용한 보라"
        ></button>

      </div>


      <!-- 선택 결과 -->
      <div
        id="mindColorResult"
        style="
          position:relative;
          z-index:3;

          min-height:110px;

          margin:
            32px auto 0;

          max-width:520px;

          padding:
            22px;

          box-sizing:border-box;

          border-radius:22px;

          background:
            rgba(255,255,255,.55);

          text-align:center;

          transition:
            background .8s ease;
        "
      >

        <div
          style="
            font-size:13px;
            color:#9aa4b3;
          "
        >
          마음에 드는 색을 하나 골라보세요.
        </div>

      </div>


    </div>
  `;


  /* =====================================================
     요소
  ===================================================== */

  const space =
    $("mindColorSpace");

  const result =
    $("mindColorResult");

  const choices =
    document.querySelectorAll(
      ".mind-color-choice"
    );


  if (
    !space ||
    !result ||
    !choices.length
  ) {
    return;
  }


  /* =====================================================
     색 선택
  ===================================================== */

  choices.forEach(
    button => {

      button.addEventListener(
        "mouseenter",
        () => {

          button.style.transform =
            "translateY(-5px) scale(1.03)";

          button.style.boxShadow =
            "0 14px 28px rgba(100,110,150,.18)";

        }
      );


      button.addEventListener(
        "mouseleave",
        () => {

          button.style.transform =
            "translateY(0) scale(1)";

          button.style.boxShadow =
            "0 8px 20px rgba(100,110,150,.12)";

        }
      );


      button.addEventListener(
        "click",
        () => {

          const color =
            button.dataset.color;

          const name =
            button.dataset.name;

          const message =
            button.dataset.message;


          /* -------------------------------------------
             배경 변화
          ------------------------------------------- */

          space.style.background =
            `
              linear-gradient(
                145deg,
                ${color},
                #ffffff
              )
            `;


          space.style.boxShadow =
            `
              0 18px 45px
              ${color}55
            `;


          /* -------------------------------------------
             선택 표시
          ------------------------------------------- */

          choices.forEach(
            other => {

              other.style.transform =
                "scale(1)";

              other.style.boxShadow =
                "0 8px 20px rgba(100,110,150,.12)";

            }
          );


          button.style.transform =
            "scale(1.08)";


          button.style.boxShadow =
            `
              0 0 0 5px
              rgba(255,255,255,.85),
              0 15px 30px
              rgba(100,110,150,.18)
            `;

/* =====================================================
   🌸 마음 색 선택 효과
===================================================== */

const effectLayer =
  document.createElement("div");

effectLayer.style.position =
  "absolute";

effectLayer.style.inset =
  "0";

effectLayer.style.overflow =
  "hidden";

effectLayer.style.pointerEvents =
  "none";

effectLayer.style.zIndex =
  "10";

space.appendChild(
  effectLayer
);


/* -----------------------------------------------------
   ✨ 빛 알갱이
----------------------------------------------------- */

for (
  let i = 0;
  i < 14;
  i++
) {

  const sparkle =
    document.createElement("span");

  sparkle.textContent =
    i % 3 === 0
      ? "✦"
      : "·";

  sparkle.style.position =
    "absolute";

  sparkle.style.left =
    "50%";

  sparkle.style.top =
    "45%";

  sparkle.style.color =
    "rgba(255,255,255,.9)";

  sparkle.style.fontSize =
    `${10 + Math.random() * 12}px`;

  sparkle.style.opacity =
    "0";

  sparkle.style.transform =
    "translate(-50%,-50%) scale(.4)";

  sparkle.style.transition =
    `
      transform 1.5s ease-out,
      opacity .6s ease
    `;

  effectLayer.appendChild(
    sparkle
  );


  requestAnimationFrame(
    () => {

      sparkle.style.opacity =
        "1";

      sparkle.style.transform =
        `
          translate(
            ${-170 + Math.random() * 340}px,
            ${-130 + Math.random() * 260}px
          )
          scale(
            ${.6 + Math.random() * .9}
          )
        `;

    }
  );


  setTimeout(
    () => {

      sparkle.style.opacity =
        "0";

    },
    700
  );


  setTimeout(
    () => {

      sparkle.remove();

    },
    1700
  );

}


/* -----------------------------------------------------
   🌸 작은 꽃잎
----------------------------------------------------- */

for (
  let i = 0;
  i < 6;
  i++
) {

  const petal =
    document.createElement("span");

  petal.textContent =
    "🌸";

  petal.style.position =
    "absolute";

  petal.style.left =
    "50%";

  petal.style.top =
    "45%";

  petal.style.fontSize =
    `${12 + Math.random() * 7}px`;

  petal.style.opacity =
    "0";

  petal.style.transition =
    `
      transform 2.4s ease-out,
      opacity .8s ease
    `;

  effectLayer.appendChild(
    petal
  );


  requestAnimationFrame(
    () => {

      petal.style.opacity =
        ".75";

      petal.style.transform =
        `
          translate(
            ${-200 + Math.random() * 400}px,
            ${-100 + Math.random() * 230}px
          )
          rotate(
            ${-120 + Math.random() * 240}deg
          )
        `;

    }
  );


  setTimeout(
    () => {

      petal.style.opacity =
        "0";

    },
    1300
  );


  setTimeout(
    () => {

      petal.remove();

    },
    2600
  );

}


/* -----------------------------------------------------
   ✨ 효과 레이어 정리
----------------------------------------------------- */

setTimeout(
  () => {

    effectLayer.remove();

  },
  2800
);
           
          /* -------------------------------------------
             결과
          ------------------------------------------- */

          result.style.background =
            "rgba(255,255,255,.72)";


          result.innerHTML = `

            <div
              style="
                width:34px;
                height:34px;

                margin:0 auto 10px;

                border-radius:50%;

                background:${color};

                box-shadow:
                  0 5px 15px
                  ${color}88;
              "
            ></div>


            <div
              style="
                font-size:16px;
                font-weight:700;

                color:#5d687d;
              "
            >
              오늘의 마음 · ${name}
            </div>


            <div
              style="
                margin-top:6px;

                font-size:13px;

                color:#8994a5;

                line-height:1.6;
              "
            >
              ${message}
            </div>

          `;


          addMindCareXP(2);

completeMindCareToday("color");
        }
      );

    }
  );

}

/* =========================================================
   🫧 몽글이 내려놓기
========================================================= */

function openMongleCloud() {

  const activity =
    getMindCareActivity();

  if (!activity) {
    return;
  }

  clearMindCareTimers();

  activity.innerHTML = `

    <div
      style="
        position:relative;
        overflow:hidden;
        min-height:500px;
        padding:28px;
        border-radius:28px;

        background:
          radial-gradient(
            circle at 20% 20%,
            rgba(255,255,255,.95),
            transparent 28%
          ),
          radial-gradient(
            circle at 80% 30%,
            rgba(220,238,255,.65),
            transparent 32%
          ),
          linear-gradient(
            145deg,
            #edf5ff,
            #f8f1ff
          );

        box-shadow:
          0 18px 45px
          rgba(100,120,160,.12);
      "
    >

      <!-- 배경 몽글 -->
      <div
        style="
          position:absolute;
          width:150px;
          height:150px;
          border-radius:50%;
          left:-45px;
          top:100px;
          background:rgba(255,255,255,.45);
          filter:blur(4px);
        "
      ></div>

      <div
        style="
          position:absolute;
          width:180px;
          height:180px;
          border-radius:50%;
          right:-60px;
          bottom:60px;
          background:rgba(220,230,255,.38);
          filter:blur(5px);
        "
      ></div>


      <!-- 제목 -->
      <div
        style="
          position:relative;
          z-index:2;
          text-align:center;
        "
      >

        <div
          style="
            font-size:12px;
            letter-spacing:.15em;
            color:#8290a8;
            margin-bottom:8px;
          "
        >
          LET IT FLOAT
        </div>

        <div
          style="
            font-size:25px;
            font-weight:750;
            color:#59677f;
          "
        >
          잠깐 내려놓아도 괜찮아요
        </div>

        <div
          style="
            margin-top:9px;
            color:#8b96a9;
            font-size:14px;
            line-height:1.7;
          "
        >
          지금 마음에 걸리는 것을 적어보세요.<br>
          적은 마음은 몽글이가 하늘로 가져갈 거예요.
        </div>

      </div>


      <!-- 입력 -->
      <div
        style="
          position:relative;
          z-index:3;
          max-width:520px;
          margin:28px auto 0;
        "
      >

        <textarea
          id="mongleCloudInput"
          maxlength="80"
          placeholder="예: 오늘은 조금 피곤했어"
          style="
            width:100%;
            min-height:100px;
            resize:none;

            box-sizing:border-box;

            border:
              1px solid
              rgba(150,165,190,.25);

            border-radius:20px;

            padding:17px;

            background:
              rgba(255,255,255,.78);

            color:#59677f;

            font-size:14px;
            line-height:1.6;

            outline:none;

            box-shadow:
              0 8px 25px
              rgba(100,120,160,.07);
          "
        ></textarea>


        <div
          style="
            display:flex;
            justify-content:space-between;
            align-items:center;
            margin-top:10px;
          "
        >

          <span
            id="mongleCloudCount"
            style="
              font-size:12px;
              color:#9ba5b6;
            "
          >
            0 / 80
          </span>

          <button
            id="mongleCloudRelease"
            type="button"
            style="
              border:0;
              border-radius:15px;

              padding:
                11px 18px;

              background:
                linear-gradient(
                  135deg,
                  #aebee8,
                  #cdb9e8
                );

              color:white;

              font-weight:700;

              cursor:pointer;

              box-shadow:
                0 8px 20px
                rgba(130,145,190,.18);
            "
          >
            🫧 내려놓기
          </button>

        </div>

      </div>


      <!-- 몽글이가 떠오르는 공간 -->
      <div
        id="mongleCloudSky"
        style="
          position:relative;
          z-index:2;

          height:180px;

          margin:
            18px auto 0;

          max-width:650px;

          overflow:hidden;

          border-radius:24px;

          background:
            linear-gradient(
              180deg,
              rgba(255,255,255,.34),
              rgba(225,237,255,.20)
            );
        "
      >

        <div
          style="
            position:absolute;
            left:50%;
            top:50%;
            transform:
              translate(-50%,-50%);

            color:#a2adbf;
            font-size:13px;

            pointer-events:none;
          "
        >
          여기에 몽글이가 떠올라요
        </div>

      </div>


      <!-- 결과 -->
      <div
        id="mongleCloudMessage"
        style="
          position:relative;
          z-index:3;

          min-height:28px;

          margin-top:14px;

          text-align:center;

          color:#79879c;

          font-size:13px;
        "
      ></div>


    </div>
  `;


  /* =====================================================
     요소
  ===================================================== */

  const input =
    $("mongleCloudInput");

  const count =
    $("mongleCloudCount");

  const release =
    $("mongleCloudRelease");

  const sky =
    $("mongleCloudSky");

  const message =
    $("mongleCloudMessage");


  if (
    !input ||
    !count ||
    !release ||
    !sky ||
    !message
  ) {
    return;
  }


  /* =====================================================
     글자 수
  ===================================================== */

  input.addEventListener(
    "input",
    () => {

      count.textContent =
        `${input.value.length} / 80`;

    }
  );


  /* =====================================================
     몽글이 만들기
  ===================================================== */

  release.addEventListener(
    "click",
    () => {

      const text =
        input.value.trim();

      if (!text) {

        message.textContent =
          "마음에 있는 말을 한 줄만 적어봐요.";

        input.focus();

        return;
      }


      /* -----------------------------------------------
         기존 안내 문구 숨기기
      ----------------------------------------------- */

      const placeholder =
        sky.querySelector(
          "div"
        );

      if (placeholder) {
        placeholder.style.display =
          "none";
      }


      /* -----------------------------------------------
         몽글이
      ----------------------------------------------- */

      const cloud =
        document.createElement("div");

      cloud.style.position =
        "absolute";
       
cloud.style.zIndex =
  "5";
       
cloud.style.left =
  `${50 + (Math.random() * 20 - 10)}%`;

cloud.style.bottom =
  "5px";

cloud.style.width =
  `${180 + Math.random() * 45}px`;

cloud.style.minHeight =
  "90px";

cloud.style.padding =
  "20px 24px";

cloud.style.boxSizing =
  "border-box";

cloud.style.display =
  "flex";

cloud.style.alignItems =
  "center";

cloud.style.justifyContent =
  "center";

cloud.style.textAlign =
  "center";

cloud.style.borderRadius =
  "60px";

cloud.style.background =
  "rgba(255,255,255,.97)";

cloud.style.color =
  "#66758f";

cloud.style.fontSize =
  "15px";

cloud.style.fontWeight =
  "600";

cloud.style.lineHeight =
  "1.6";

cloud.style.boxShadow =
  `
    0 12px 30px
    rgba(100,120,160,.16),
    0 0 0 8px
    rgba(255,255,255,.16)
  `;

cloud.style.opacity =
  "0";

cloud.style.transform =
  "translate(-50%, 25px) scale(.72)";

cloud.style.transition =
  "transform 7s cubic-bezier(.2,.7,.2,1), opacity 1.2s ease";
/* =====================================================
   ✨ 몽글이 빛가루
===================================================== */

const sparkleCount = 7;

for (
  let i = 0;
  i < sparkleCount;
  i++
) {

  const sparkle =
    document.createElement("span");

  sparkle.textContent =
    i % 2 === 0
      ? "✦"
      : "·";

  sparkle.style.position =
    "absolute";

  sparkle.style.left =
    `${25 + Math.random() * 50}%`;

  sparkle.style.bottom =
    `${20 + Math.random() * 25}px`;

  sparkle.style.color =
    "rgba(255,255,255,.9)";

  sparkle.style.fontSize =
    `${10 + Math.random() * 9}px`;

  sparkle.style.opacity =
    "0";

  sparkle.style.pointerEvents =
    "none";

  sparkle.style.zIndex =
    "5";

  sparkle.style.transition =
    `
      transform 4s ease-out,
      opacity 1s ease
    `;

  sky.appendChild(
    sparkle
  );


  requestAnimationFrame(
    () => {

      sparkle.style.opacity =
        "1";

      sparkle.style.transform =
        `
          translate(
            ${-35 + Math.random() * 70}px,
            ${-130 - Math.random() * 100}px
          )
          scale(
            ${0.7 + Math.random() * 0.8}
          )
        `;

    }
  );


  setTimeout(
    () => {

      sparkle.style.opacity =
        "0";

    },
    2500
  );


  setTimeout(
    () => {

      sparkle.remove();

    },
    4500
  );

}

      /*
       * 문장이 너무 길어도
       * 화면을 깨뜨리지 않도록 제한
       */
      cloud.textContent =
        text.slice(0, 80);


      sky.appendChild(
        cloud
      );


      /* -----------------------------------------------
         등장
      ----------------------------------------------- */

      requestAnimationFrame(
        () => {

          cloud.style.opacity =
            "1";

          cloud.style.transform =
            "translateY(0) scale(1)";

        }
      );


      /* -----------------------------------------------
         천천히 떠오르기
      ----------------------------------------------- */

setTimeout(
  () => {

    if (!cloud.isConnected) {
      return;
    }

    cloud.style.transform =
      "translate(-50%, -210px) scale(.88)";

    cloud.style.opacity =
      "0";

  },
  1200
);

      /* -----------------------------------------------
         사라진 뒤 정리
      ----------------------------------------------- */

      setTimeout(
        () => {

          cloud.remove();

        },
        6000
      );


      /* -----------------------------------------------
         메시지
      ----------------------------------------------- */

      message.textContent =
        "🫧 잠깐 내려놓았어요.";


      /* -----------------------------------------------
         입력 초기화
      ----------------------------------------------- */

      input.value = "";

      count.textContent =
        "0 / 80";


      /* -----------------------------------------------
         작은 보상
      ----------------------------------------------- */

      addMindCareXP(2);

      completeMindCareToday("cloud");

    }
  );

}

/* =========================================================
   🌙 조용한 쉼
========================================================= */

function openQuietRest() {

  const activity =
    getMindCareActivity();

  if (!activity) {
    return;
  }

  clearMindCareTimers();

  activity.innerHTML = `

    <div
      id="quietRestSpace"
      style="
        position:relative;
        overflow:hidden;

        min-height:520px;

        padding:30px;

        border-radius:30px;

        background:
          radial-gradient(
            circle at 70% 18%,
            rgba(255,255,255,.16),
            transparent 12%
          ),
          radial-gradient(
            circle at 20% 75%,
            rgba(142,170,220,.16),
            transparent 25%
          ),
          linear-gradient(
            160deg,
            #18233f,
            #27385c 55%,
            #4b5279
          );

        box-shadow:
          0 22px 55px
          rgba(45,55,100,.22);

        cursor:pointer;
      "
    >

      <!-- 🌙 달 -->

      <div
        id="quietMoon"
        style="
          position:absolute;

          width:105px;
          height:105px;

          right:11%;
          top:55px;

          border-radius:50%;

          background:
            radial-gradient(
              circle at 35% 30%,
              #ffffff,
              #f6f0d2 65%,
              #e6dcae
            );

          box-shadow:
            0 0 30px
            rgba(255,248,210,.35),

            0 0 80px
            rgba(255,248,210,.16);

          transition:
            transform 1s ease;
        "
      ></div>


      <!-- 🌌 별 영역 -->

      <div
        id="quietStars"
        style="
          position:absolute;
          inset:0;

          overflow:hidden;

          pointer-events:none;
        "
      ></div>


      <!-- ☁️ 멀리 있는 구름 -->

      <div
        style="
          position:absolute;

          width:260px;
          height:80px;

          left:-80px;
          bottom:105px;

          border-radius:50%;

          background:
            rgba(180,195,225,.08);

          filter:blur(10px);

          animation:
            quietCloudMove 18s
            ease-in-out infinite
            alternate;

          pointer-events:none;
        "
      ></div>


      <div
        style="
          position:absolute;

          width:320px;
          height:90px;

          right:-120px;
          bottom:80px;

          border-radius:50%;

          background:
            rgba(180,195,225,.07);

          filter:blur(12px);

          animation:
            quietCloudMove2 22s
            ease-in-out infinite
            alternate;

          pointer-events:none;
        "
      ></div>


      <!-- 🌿 언덕 -->

      <div
        style="
          position:absolute;

          left:-10%;
          right:-10%;
          bottom:-85px;

          height:190px;

          border-radius:
            50% 50% 0 0;

          background:
            linear-gradient(
              180deg,
              #17243b,
              #101b2e
            );

          pointer-events:none;
        "
      ></div>


      <!-- ✨ 안내 -->

      <div
        style="
          position:relative;

          z-index:5;

          text-align:center;

          padding-top:20px;

          color:white;
        "
      >

        <div
          style="
            font-size:12px;

            letter-spacing:.18em;

            color:
              rgba(255,255,255,.55);

            margin-bottom:10px;
          "
        >
          QUIET NIGHT
        </div>


        <div
          style="
            font-size:26px;

            font-weight:750;

            letter-spacing:-.03em;
          "
        >
          잠시 아무것도 하지 않아도 괜찮아요
        </div>


        <div
          style="
            margin-top:10px;

            font-size:14px;

            line-height:1.8;

            color:
              rgba(255,255,255,.68);
          "
        >
          밤하늘을 바라보듯 천천히 머물러보세요.<br>
          화면을 한 번 눌러 작은 별빛을 만들어도 좋아요.
        </div>

      </div>


      <!-- 🌟 가운데 메시지 -->

      <div
        id="quietRestMessage"
        style="
          position:absolute;

          z-index:6;

          left:50%;
          top:53%;

          transform:
            translate(-50%,-50%);

          width:min(430px,80%);

          padding:18px 22px;

          box-sizing:border-box;

          border-radius:24px;

          background:
            rgba(255,255,255,.08);

          border:
            1px solid
            rgba(255,255,255,.12);

          backdrop-filter:
            blur(8px);

          text-align:center;

          color:
            rgba(255,255,255,.78);

          font-size:14px;

          line-height:1.7;

          pointer-events:none;
        "
      >
        오늘은 여기서<br>
        잠깐 쉬어가요.
      </div>


      <!-- 🌙 닫기 -->

      <button
        id="quietRestClose"
        type="button"
        style="
          position:absolute;

          z-index:10;

          left:50%;
          bottom:25px;

          transform:
            translateX(-50%);

          border:0;

          padding:12px 22px;

          border-radius:999px;

          background:
            rgba(255,255,255,.14);

          color:
            rgba(255,255,255,.9);

          font-size:13px;

          cursor:pointer;

          backdrop-filter:
            blur(8px);

          transition:
            transform .2s ease,
            background .2s ease;
        "
      >
        🌙 이만 쉬어갈게요
      </button>

    </div>
  `;


  const space =
    $("quietRestSpace");

  const stars =
    $("quietStars");

  const message =
    $("quietRestMessage");

  const close =
    $("quietRestClose");


  if (
    !space ||
    !stars ||
    !message ||
    !close
  ) {
    return;
  }


  /* =====================================================
     ✨ 별 만들기
  ===================================================== */

  for (
    let i = 0;
    i < 55;
    i++
  ) {

    const star =
      document.createElement("span");

    star.textContent =
      i % 9 === 0
        ? "✦"
        : "·";

    star.style.position =
      "absolute";

    star.style.left =
      `${Math.random() * 100}%`;

    star.style.top =
      `${Math.random() * 75}%`;

    star.style.color =
      "rgba(255,255,255,.85)";

    star.style.fontSize =
      `${4 + Math.random() * 8}px`;

    star.style.opacity =
      `${.25 + Math.random() * .65}`;

    star.style.transition =
      `
        opacity
        ${1.5 + Math.random() * 2}s
        ease-in-out
      `;

    stars.appendChild(
      star
    );


    setInterval(
      () => {

        if (!star.isConnected) {
          return;
        }

        star.style.opacity =
          `${.2 + Math.random() * .75}`;

      },
      1200 + Math.random() * 1800
    );

  }


  /* =====================================================
     🌠 화면 클릭 → 별빛
  ===================================================== */

  space.addEventListener(
    "click",
    event => {

      if (
        event.target === close
      ) {
        return;
      }


      const rect =
        space.getBoundingClientRect();

      const x =
        event.clientX -
        rect.left;

      const y =
        event.clientY -
        rect.top;


      const star =
        document.createElement("span");

      star.textContent =
        "✦";

      star.style.position =
        "absolute";

      star.style.left =
        `${x}px`;

      star.style.top =
        `${y}px`;

      star.style.zIndex =
        "8";

      star.style.color =
        "#fff8d8";

      star.style.fontSize =
        "18px";

      star.style.pointerEvents =
        "none";

      star.style.transform =
        "translate(-50%,-50%) scale(.3)";

      star.style.opacity =
        "0";

      star.style.transition =
        `
          transform 1.2s ease-out,
          opacity 1.2s ease-out
        `;

      space.appendChild(
        star
      );


      requestAnimationFrame(
        () => {

          star.style.opacity =
            "1";

          star.style.transform =
            `
              translate(-50%,-50%)
              scale(1.5)
            `;

        }
      );


      setTimeout(
        () => {

          star.style.opacity =
            "0";

          star.style.transform =
            `
              translate(-50%,-50%)
              scale(.4)
            `;

        },
        550
      );


      setTimeout(
        () => {

          star.remove();

        },
        1400
      );

    }
  );


  /* =====================================================
     🌙 달 살짝 움직이기
  ===================================================== */

  const moon =
    $("quietMoon");

  if (moon) {

    setTimeout(
      () => {

        moon.style.transform =
          "translateY(-8px)";

      },
      100
    );

  }


  /* =====================================================
     🌙 닫기
  ===================================================== */

  close.addEventListener(
    "mouseenter",
    () => {

      close.style.transform =
        "translateX(-50%) translateY(-3px)";

      close.style.background =
        "rgba(255,255,255,.22)";

    }
  );


  close.addEventListener(
    "mouseleave",
    () => {

      close.style.transform =
        "translateX(-50%)";

      close.style.background =
        "rgba(255,255,255,.14)";

    }
  );


  close.addEventListener(
    "click",
    event => {

      event.stopPropagation();

      addMindCareXP(2);
       
      completeMindCareToday("quiet");
       
      message.innerHTML =
        `
          🌙 잘 쉬었어요.<br>
          <span style="
            font-size:12px;
            color:rgba(255,255,255,.55);
          ">
            천천히 다시 돌아가도 괜찮아요.
          </span>
        `;

      close.textContent =
        "✓ 오늘의 작은 쉼 완료";

      close.disabled =
        true;

      close.style.opacity =
        ".65";

    }
  );

}
   
/* =========================================================
   작은 경험치 보상
========================================================= */

function addMindCareXP(amount) {

  const value =
    Number(amount || 0);

  if (!value) {
    return;
  }

  state.xp =
    Number(state.xp || 0) +
    value;

  while (
    state.xp >= 100
  ) {

    state.xp -= 100;

    state.level =
      Number(state.level || 1) +
      1;

    toast(
      "🌱 마음 돌보기로 레벨이 올랐어요!"
    );

  }

  save();
  updateUI();

}


/* =========================================================
   마음 돌보기 정리
========================================================= */

function clearMindCareTimers() {

  if (mindCareRainTimer) {

    clearInterval(
      mindCareRainTimer
    );

    mindCareRainTimer =
      null;

  }

}


/* =========================================================
   마음 돌보기 UI 준비
========================================================= */

ensureMindCareUI();


/* =========================================================
   🌿 마음 돌보기 디자인
========================================================= */

const mindCareStyle =
  document.createElement("style");

mindCareStyle.textContent = `
@keyframes quietCloudMove {

  from {
    transform:
      translateX(-20px);
  }

  to {
    transform:
      translateX(80px);
  }

}


@keyframes quietCloudMove2 {

  from {
    transform:
      translateX(30px);
  }

  to {
    transform:
      translateX(-70px);
  }

}
  @keyframes mindCloudMove {
    from {
      transform: translateX(-8px);
    }

    to {
      transform: translateX(35px);
    }
  }

  @keyframes mindCloudMove2 {
    from {
      transform: translateX(20px);
    }

    to {
      transform: translateX(-35px);
    }
  }

  @keyframes pondRipple {

    0% {
      transform:
        translate(-50%, -50%)
        scale(.6);

      opacity:.75;
    }

    70% {
      opacity:.2;
    }

    100% {
      transform:
        translate(-50%, -50%)
        scale(2.8);

      opacity:0;
    }

  }

  .mind-care-action {
    transition:
      transform .2s ease,
      box-shadow .2s ease;
  }

  .mind-care-action:hover {
    transform:
      translateY(-3px);

    box-shadow:
      0 10px 25px
      rgba(100,110,150,.10);
  }

  .mind-care-action:active {
    transform:
      translateY(0)
      scale(.98);
  }
`;

document.head.appendChild(
  mindCareStyle
);
   
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

  /* =========================================================
     펫 따라오기 + 현재 선택 펫 동기화
  ========================================================= */

  const currentPetKey =
    getPetRenderKey();

  if (
    currentPetKey !== renderedPetKey
  ) {

    createPetModel(
      state.selectedPet
    );

  }

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
