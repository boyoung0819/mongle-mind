import * as THREE from "three";
import {
  GLTFLoader
} from "https://cdn.jsdelivr.net/npm/three@0.164.1/examples/jsm/loaders/GLTFLoader.js";

(() => {
  const root = document.getElementById("world");

  if (!root || root.dataset.ready === "1") return;

  root.dataset.ready = "1";

  const $ = id => document.getElementById(id);

  /* =========================================================
     기본 저장 데이터
  ========================================================= */

  const defaultStats = {
    seedsBought: 0,
    seedsPlanted: 0,
    waters: 0,
    fertilizers: 0,
    harvests: 0,
    petGreetings: 0,
    breaths: 0,
    journals: 0,
    outfitChanges: 0,
    shells: 0
  };

  const defaultGarden = {
    selectedSeed: null,
    fertilizer: 3,
    seedInventory: {},
    plots: []
  };

  const defaults = {
    x: 0,
    z: 4,

    coins: 30,
    xp: 0,
    level: 1,

    flowers: 0,

    outfit: "lavender",
    mood: null,

    watered: false,
    foundShell: false,

    nav: "home",

    roomDecor: "lavender",

    journalText: "",
    journalDate: "",

    questClaims: [],

    stats: {
      ...defaultStats
    },

    garden: {
      ...defaultGarden
    }
  };

  let state = structuredClone(defaults);

  try {
    const saved = JSON.parse(
      localStorage.getItem("mongleMindSave") || "null"
    );

    if (saved) {
      state = {
        ...defaults,
        ...saved,

        stats: {
          ...defaultStats,
          ...(saved.stats || {})
        },

        garden: {
          ...defaultGarden,
          ...(saved.garden || {})
        }
      };
    }
  } catch (e) {
    console.warn("저장 데이터를 불러오지 못했습니다.", e);
  }

  if (!Array.isArray(state.questClaims)) {
    state.questClaims = [];
  }

  if (!state.garden || typeof state.garden !== "object") {
    state.garden = structuredClone(defaultGarden);
  }

  if (!state.garden.seedInventory) {
    state.garden.seedInventory = {};
  }

  if (!Array.isArray(state.garden.plots)) {
    state.garden.plots = [];
  }

  if (typeof state.garden.fertilizer !== "number") {
    state.garden.fertilizer = 3;
  }

  if (typeof state.garden.selectedSeed !== "string") {
    state.garden.selectedSeed = null;
  }

  if (state.garden.plots.length !== 6) {
    state.garden.plots = Array.from({ length: 6 }, (_, i) => {
      return state.garden.plots[i] || {
        id: i,
        seedId: null,
        plantedAt: 0,
        growthBonus: 0,
        waterCount: 0,
        fertilizerCount: 0,
        lastWateredAt: 0,
        lastFertilizedAt: 0
      };
    });
  }

  if (typeof state.x !== "number") state.x = 0;
  if (typeof state.z !== "number") state.z = 4;
  if (typeof state.coins !== "number") state.coins = 30;
  if (typeof state.xp !== "number") state.xp = 0;
  if (typeof state.level !== "number") state.level = 1;

  /* =========================================================
     식물 데이터
  ========================================================= */

  const PLANTS = {
    tulip: {
      name: "튤립",
      icon: "🌷",
      price: 8,
      growth: 30,
      harvestCoins: 18,
      harvestXp: 8,
      description: "작고 예쁜 봄꽃",
      color: "#ef9fbd"
    },

    sunflower: {
      name: "해바라기",
      icon: "🌻",
      price: 12,
      growth: 40,
      harvestCoins: 26,
      harvestXp: 11,
      description: "햇살을 좋아하는 밝은 꽃",
      color: "#f3c95f"
    },

    lavender: {
      name: "라벤더",
      icon: "💜",
      price: 15,
      growth: 50,
      harvestCoins: 34,
      harvestXp: 14,
      description: "마음이 편안해지는 향기로운 꽃",
      color: "#b59adf"
    },

    strawberry: {
      name: "딸기",
      icon: "🍓",
      price: 18,
      growth: 60,
      harvestCoins: 42,
      harvestXp: 17,
      description: "달콤한 열매가 열리는 작물",
      color: "#e98c9f"
    },

    mint: {
      name: "민트",
      icon: "🌿",
      price: 20,
      growth: 70,
      harvestCoins: 48,
      harvestXp: 20,
      description: "싱그러운 향기가 나는 허브",
      color: "#83bd9a"
    },

    moonflower: {
      name: "달빛꽃",
      icon: "🌙",
      price: 35,
      growth: 90,
      harvestCoins: 85,
      harvestXp: 35,
      description: "밤이 되면 은은하게 빛나는 희귀한 꽃",
      color: "#c7b5ef",
      rare: true
    }
  };

  /* =========================================================
     퀘스트
  ========================================================= */

  const QUESTS = [
    {
      id: "buy_seed_2",
      icon: "🛒",
      title: "씨앗 장보기",
      description: "씨앗을 2개 구매해 보세요.",
      goal: 2,
      rewardCoins: 10,
      rewardXp: 12,
      progress: () => state.stats.seedsBought
    },

    {
      id: "plant_1",
      icon: "🌱",
      title: "첫 번째 씨앗",
      description: "씨앗을 1개 심어 보세요.",
      goal: 1,
      rewardCoins: 12,
      rewardXp: 15,
      progress: () => state.stats.seedsPlanted
    },

    {
      id: "water_3",
      icon: "💧",
      title: "촉촉한 정원",
      description: "식물에 물을 3번 주세요.",
      goal: 3,
      rewardCoins: 15,
      rewardXp: 18,
      progress: () => state.stats.waters
    },

    {
      id: "fertilizer_2",
      icon: "🧪",
      title: "쑥쑥 자라라",
      description: "비료를 2번 사용해 보세요.",
      goal: 2,
      rewardCoins: 18,
      rewardXp: 20,
      progress: () => state.stats.fertilizers
    },

    {
      id: "harvest_1",
      icon: "🧺",
      title: "첫 수확",
      description: "다 자란 식물을 1번 수확하세요.",
      goal: 1,
      rewardCoins: 20,
      rewardXp: 25,
      progress: () => state.stats.harvests
    },

    {
      id: "harvest_3",
      icon: "🌸",
      title: "풍성한 정원",
      description: "식물을 총 3번 수확하세요.",
      goal: 3,
      rewardCoins: 30,
      rewardXp: 35,
      progress: () => state.stats.harvests
    },

    {
      id: "pet_1",
      icon: "🐰",
      title: "포근이에게 인사",
      description: "포근이에게 먼저 인사를 건네 보세요.",
      goal: 1,
      rewardCoins: 8,
      rewardXp: 10,
      progress: () => state.stats.petGreetings
    },

    {
      id: "breath_1",
      icon: "🌬️",
      title: "잠깐의 쉼",
      description: "호흡 활동을 끝까지 완료해 보세요.",
      goal: 1,
      rewardCoins: 15,
      rewardXp: 20,
      progress: () => state.stats.breaths
    },

    {
      id: "journal_1",
      icon: "📔",
      title: "오늘의 마음",
      description: "오늘의 마음을 한 번 기록해 보세요.",
      goal: 1,
      rewardCoins: 12,
      rewardXp: 15,
      progress: () => state.stats.journals
    },

    {
      id: "outfit_1",
      icon: "👗",
      title: "새로운 분위기",
      description: "캐릭터의 의상을 바꿔 보세요.",
      goal: 1,
      rewardCoins: 10,
      rewardXp: 12,
      progress: () => state.stats.outfitChanges
    },

    {
      id: "shell_1",
      icon: "🐚",
      title: "숨겨진 보물",
      description: "마을에 숨겨진 조개를 찾아 보세요.",
      goal: 1,
      rewardCoins: 15,
      rewardXp: 18,
      progress: () => state.stats.shells
    }
  ];

  /* =========================================================
     기본 변수
  ========================================================= */

  let keys = {};

  let toastTimer;
  let breathTimer;

  let breathStep = 0;
  let breathing = false;
  let breathCompleted = false;

  let last = 0;

  let walkBlend = 0;
  let walkPhase = 0;

  let selectedGardenPlot = null;

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

  /* =========================================================
     화면 스타일
  ========================================================= */

  const style = document.createElement("style");

  style.textContent = `
    .mm-garden-ui,
    .mm-quest-ui {
      width: 100%;
      max-width: 1180px;
      margin: 0 auto;
      padding: 10px 4px 30px;
      box-sizing: border-box;
    }

    .mm-garden-head {
      display: flex;
      justify-content: space-between;
      align-items: center;
      gap: 14px;
      padding: 18px;
      margin-bottom: 16px;
      border-radius: 24px;
      background:
        linear-gradient(135deg, rgba(255,255,255,.94), rgba(250,244,255,.96));
      box-shadow: 0 12px 32px rgba(119,95,145,.10);
      border: 1px solid rgba(170,145,190,.14);
    }

    .mm-garden-title {
      font-size: 22px;
      font-weight: 900;
      color: #5c4c69;
    }

    .mm-garden-subtitle {
      margin-top: 5px;
      color: #8b7c93;
      font-size: 13px;
    }

    .mm-garden-money {
      display: flex;
      gap: 8px;
      flex-wrap: wrap;
      justify-content: flex-end;
    }

    .mm-garden-pill {
      padding: 9px 13px;
      border-radius: 999px;
      background: #f4ecff;
      color: #67517d;
      font-weight: 800;
      font-size: 13px;
    }

    .mm-garden-section {
      margin-top: 16px;
      padding: 18px;
      border-radius: 24px;
      background: rgba(255,255,255,.92);
      border: 1px solid rgba(160,140,180,.13);
      box-shadow: 0 10px 28px rgba(100,80,120,.08);
    }

    .mm-garden-section-title {
      font-size: 18px;
      font-weight: 900;
      color: #5f5069;
      margin-bottom: 13px;
    }

    .mm-seed-shop {
      display: grid;
      grid-template-columns: repeat(3, minmax(0,1fr));
      gap: 12px;
    }

    .mm-seed-card {
      position: relative;
      padding: 15px;
      border-radius: 20px;
      background: #fbf8ff;
      border: 1px solid #eee4f5;
      transition: transform .18s ease, box-shadow .18s ease;
    }

    .mm-seed-card:hover {
      transform: translateY(-2px);
      box-shadow: 0 9px 20px rgba(120,95,145,.12);
    }

    .mm-seed-card.rare {
      background: linear-gradient(145deg,#faf6ff,#f1e8ff);
    }

    .mm-seed-icon {
      font-size: 34px;
      margin-bottom: 6px;
    }

    .mm-seed-name {
      font-size: 16px;
      font-weight: 900;
      color: #5e5068;
    }

    .mm-seed-description {
      min-height: 34px;
      margin-top: 5px;
      font-size: 12px;
      line-height: 1.45;
      color: #92869b;
    }

    .mm-seed-price {
      margin-top: 9px;
      font-size: 13px;
      font-weight: 900;
      color: #9a6b43;
    }

    .mm-seed-actions {
      display: flex;
      gap: 6px;
      margin-top: 10px;
    }

    .mm-game-btn {
      border: 0;
      border-radius: 12px;
      padding: 9px 11px;
      cursor: pointer;
      font-weight: 800;
      font-size: 12px;
      background: #e9ddf8;
      color: #5e4a6d;
      transition: transform .15s ease, opacity .15s ease;
    }

    .mm-game-btn:hover {
      transform: translateY(-1px);
    }

    .mm-game-btn.primary {
      background: #c9b2eb;
      color: white;
    }

    .mm-game-btn.gold {
      background: #f0d79c;
      color: #70572e;
    }

    .mm-game-btn.green {
      background: #b9ddc3;
      color: #476b52;
    }

    .mm-game-btn:disabled {
      opacity: .42;
      cursor: not-allowed;
      transform: none;
    }

    .mm-selected-seed {
      margin-top: 13px;
      padding: 11px 13px;
      border-radius: 14px;
      background: #f5f0fb;
      color: #6e6078;
      font-size: 13px;
      font-weight: 700;
    }

    .mm-plots {
      display: grid;
      grid-template-columns: repeat(3, minmax(0,1fr));
      gap: 14px;
    }

    .mm-plot {
      min-height: 220px;
      padding: 15px;
      border-radius: 22px;
      background:
        linear-gradient(180deg,#fffdfa,#f8f2ea);
      border: 2px solid #eee3d7;
      position: relative;
      overflow: hidden;
    }

    .mm-plot.empty {
      background:
        radial-gradient(circle at 50% 35%,#fff,#f5eee6);
    }

    .mm-plot.ready {
      border-color: #d8c18a;
      box-shadow: 0 0 0 4px rgba(225,195,120,.12);
    }

    .mm-plot-number {
      position: absolute;
      top: 10px;
      left: 11px;
      font-size: 11px;
      color: #a99b8d;
      font-weight: 800;
    }

    .mm-plot-plant {
      text-align: center;
      padding-top: 18px;
    }

    .mm-plant-icon {
      font-size: 62px;
      line-height: 1;
      display: inline-block;
      filter: drop-shadow(0 7px 5px rgba(100,70,50,.12));
    }

    .mm-plant-icon.sprout {
      transform: scale(.72);
    }

    .mm-plant-icon.growing {
      transform: scale(.9);
    }

    .mm-plant-icon.mature {
      transform: scale(1.08);
      animation: mmPlantFloat 1.8s ease-in-out infinite;
    }

    @keyframes mmPlantFloat {
      0%,100% { transform:scale(1.08) translateY(0); }
      50% { transform:scale(1.12) translateY(-4px); }
    }

    .mm-empty-seed {
      font-size: 48px;
      opacity: .35;
      padding: 15px 0;
    }

    .mm-plot-name {
      font-size: 15px;
      font-weight: 900;
      color: #66584e;
      margin-top: 5px;
    }

    .mm-growth-label {
      margin-top: 7px;
      font-size: 12px;
      color: #95867b;
    }

    .mm-progress {
      height: 9px;
      margin-top: 8px;
      border-radius: 999px;
      overflow: hidden;
      background: #eee5dc;
    }

    .mm-progress > div {
      height: 100%;
      border-radius: inherit;
      background: linear-gradient(90deg,#a8cfae,#d5c0ef);
      transition: width .5s ease;
    }

    .mm-plot-actions {
      display: flex;
      flex-wrap: wrap;
      gap: 6px;
      justify-content: center;
      margin-top: 12px;
    }

    .mm-action-info {
      display: flex;
      justify-content: center;
      gap: 7px;
      margin-top: 8px;
      font-size: 11px;
      color: #9a8b81;
    }

    .mm-garden-fx {
      position: fixed;
      z-index: 99999;
      pointer-events: none;
      font-size: 34px;
      animation: mmWaterMove 850ms ease-out forwards;
    }

    @keyframes mmWaterMove {
      0% {
        opacity: 0;
        transform: translate(80px,-80px) rotate(-15deg) scale(.7);
      }

      20% {
        opacity: 1;
      }

      70% {
        opacity: 1;
      }

      100% {
        opacity: 0;
        transform: translate(0,0) rotate(5deg) scale(1);
      }
    }

    .mm-sparkle {
      position: fixed;
      z-index: 99999;
      pointer-events: none;
      font-size: 27px;
      animation: mmSparkle 800ms ease-out forwards;
    }

    @keyframes mmSparkle {
      0% {
        opacity: 0;
        transform: scale(.3);
      }

      30% {
        opacity: 1;
        transform: scale(1.2);
      }

      100% {
        opacity: 0;
        transform: translateY(-45px) scale(.7);
      }
    }

    .mm-quest-list {
      display: grid;
      grid-template-columns: repeat(2,minmax(0,1fr));
      gap: 13px;
    }

    .mm-quest-card {
      padding: 16px;
      border-radius: 20px;
      background: linear-gradient(145deg,#fff,#faf6ff);
      border: 1px solid #eee4f4;
      box-shadow: 0 7px 20px rgba(100,80,120,.06);
    }

    .mm-quest-card.completed {
      background: linear-gradient(145deg,#f8fff9,#f3fbf5);
      border-color: #d7eadb;
    }

    .mm-quest-top {
      display: flex;
      align-items: flex-start;
      gap: 10px;
    }

    .mm-quest-icon {
      width: 42px;
      height: 42px;
      display: grid;
      place-items: center;
      border-radius: 14px;
      background: #f1e8fa;
      font-size: 22px;
      flex: 0 0 auto;
    }

    .mm-quest-title {
      font-weight: 900;
      color: #5e5167;
    }

    .mm-quest-desc {
      margin-top: 4px;
      color: #92869b;
      font-size: 12px;
      line-height: 1.4;
    }

    .mm-quest-progress {
      margin-top: 13px;
      display: flex;
      justify-content: space-between;
      font-size: 12px;
      color: #82758b;
      font-weight: 800;
    }

    .mm-quest-progressbar {
      height: 8px;
      margin-top: 6px;
      border-radius: 999px;
      background: #eee8f1;
      overflow: hidden;
    }

    .mm-quest-progressbar > div {
      height: 100%;
      background: linear-gradient(90deg,#c6a9e8,#a9d5b3);
      border-radius: inherit;
      transition: width .3s ease;
    }

    .mm-quest-bottom {
      margin-top: 12px;
      display: flex;
      align-items: center;
      justify-content: space-between;
      gap: 8px;
    }

    .mm-quest-reward {
      font-size: 11px;
      color: #9a7a4c;
      font-weight: 800;
    }

    .mm-quest-message {
      margin-bottom: 14px;
      padding: 14px 16px;
      border-radius: 18px;
      background: #f8f2ff;
      color: #725f82;
      font-size: 13px;
      line-height: 1.5;
    }

    @media (max-width: 800px) {
      .mm-seed-shop {
        grid-template-columns: repeat(2,minmax(0,1fr));
      }

      .mm-plots {
        grid-template-columns: repeat(2,minmax(0,1fr));
      }

      .mm-quest-list {
        grid-template-columns: 1fr;
      }
    }

    @media (max-width: 520px) {
      .mm-seed-shop,
      .mm-plots {
        grid-template-columns: 1fr;
      }

      .mm-garden-head {
        flex-direction: column;
        align-items: flex-start;
      }
    }
  `;

  document.head.appendChild(style);

  /* =========================================================
     3D 마을
  ========================================================= */

  const scene = new THREE.Scene();

  scene.background = new THREE.Color(0xbadcf3);

  scene.fog = new THREE.Fog(
    0xd5e7ce,
    28,
    60
  );

  const camera = new THREE.PerspectiveCamera(
    43,
    1,
    0.1,
    120
  );

  camera.position.set(
    0,
    6.5,
    27
  );

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

  root.replaceChildren(
    renderer.domElement
  );

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

  sun.position.set(
    -8,
    17,
    10
  );

  sun.castShadow = true;

  sun.shadow.mapSize.set(
    1024,
    1024
  );

  scene.add(sun);

  const M = color =>
    new THREE.MeshStandardMaterial({
      color,
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
    skin: M(0xf5d4c1),
    hair: M(0x76515a),
    dark: M(0x43343b),
    pink: M(0xf1b5c5),
    gold: M(0xf1c76f),
    pinks: M(0xf3a4c4),
    lilac: M(0xc8a9ec),
    yellow: M(0xffdc85)
  };

  function add(
    geometry,
    material,
    parent,
    x,
    y,
    z,
    sx = 1,
    sy = 1,
    sz = 1
  ) {
    const object = new THREE.Mesh(
      geometry,
      material
    );

    object.position.set(
      x,
      y,
      z
    );

    object.scale.set(
      sx,
      sy,
      sz
    );

    object.castShadow = true;
    object.receiveShadow = true;

    parent.add(object);

    return object;
  }

  function box(
    parent,
    x,
    y,
    z,
    w,
    h,
    d,
    material
  ) {
    return add(
      new THREE.BoxGeometry(
        w,
        h,
        d
      ),
      material,
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
    material
  ) {
    return add(
      new THREE.SphereGeometry(
        1,
        18,
        12
      ),
      material,
      parent,
      x,
      y,
      z,
      sx,
      sy,
      sz
    );
  }

  /* =========================================================
     바닥
  ========================================================= */

  const ground = add(
    new THREE.PlaneGeometry(
      90,
      90
    ),
    m.grass,
    scene,
    0,
    -0.12,
    0
  );

  ground.rotation.x = -Math.PI / 2;

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

  /* =========================================================
     연못
  ========================================================= */

  const pond = add(
    new THREE.CylinderGeometry(
      3,
      3,
      0.15,
      40
    ),
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
    new THREE.TorusGeometry(
      3,
      0.16,
      8,
      40
    ),
    m.white,
    scene,
    7,
    0.12,
    1,
    1,
    1,
    0.72
  );

  rim.rotation.x =
    Math.PI / 2;

  /* =========================================================
     집
  ========================================================= */

  const house =
    new THREE.Group();

  scene.add(house);

  house.position.set(
    -5,
    0,
    -5
  );

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

  /* =========================================================
     나무
  ========================================================= */

  function tree(
    x,
    z,
    s = 1
  ) {
    const g =
      new THREE.Group();

    scene.add(g);

    g.position.set(
      x,
      0,
      z
    );

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
  ].forEach(a =>
    tree(...a)
  );

  /* =========================================================
     꽃
  ========================================================= */

  const flowerGroups = [];

  function flower(
    x,
    z,
    color,
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

  function bed(
    x,
    z
  ) {
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

  bed(
    -7,
    2.8
  );

  bed(
    1,
    -1.2
  );

  bed(
    7,
    7
  );

  for (let i = 0; i < 42; i++) {
    const x =
      Math.sin(i * 12.3) * 12;

    const z =
      Math.cos(i * 7.1) * 11;

    if (
      Math.abs(x) < 3 &&
      z > 0 &&
      z < 10
    ) {
      continue;
    }

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

  /* =========================================================
     울타리
  ========================================================= */

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

  /* =========================================================
     가로등
  ========================================================= */

  function lamp(
    x,
    z
  ) {
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

    const light =
      new THREE.PointLight(
        0xffd69b,
        0.5,
        4
      );

    light.position.set(
      x,
      1.5,
      z
    );

    scene.add(light);
  }

  lamp(-2, -1);
  lamp(3, 4);
  lamp(-8, 6);

  /* =========================================================
     관목 / 돌 / 버섯
  ========================================================= */

  const shrubMat =
    M(0x7fae79);

  const shrubLight =
    M(0xa9cd91);

  const stoneMat =
    M(0xd7c9b5);

  const pinkMat =
    M(0xf3bfd0);

  function shrub(
    x,
    z,
    s = 1
  ) {
    const g =
      new THREE.Group();

    scene.add(g);

    g.position.set(
      x,
      0,
      z
    );

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

  function steppingStone(
    x,
    z,
    rot = 0
  ) {
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

  function mushroom(
    x,
    z,
    s = 1
  ) {
    const g =
      new THREE.Group();

    scene.add(g);

    g.position.set(
      x,
      0,
      z
    );

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

    for (let i = 0; i < 3; i++) {
      ball(
        g,
        Math.cos(i * 2.1) * 0.18,
        0.52,
        Math.sin(i * 2.1) * 0.16,
        0.045,
        0.035,
        0.045,
        m.white
      );
    }
  }

  mushroom(-8, 4, 0.8);
  mushroom(-4, -3, 0.7);
  mushroom(9, -3, 0.9);
  mushroom(5, 8, 0.65);

  function mailbox(
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

    ball(
      g,
      0.24,
      1.13,
      0.23,
      0.035,
      0.035,
      0.025,
      m.gold
    );
  }

  mailbox(
    -2.8,
    -4.2
  );

  function signpost(
    x,
    z,
    labelColor = 0xe9b6c6
  ) {
    const g =
      new THREE.Group();

    scene.add(g);

    g.position.set(
      x,
      0,
      z
    );

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

    ball(
      g,
      0,
      1.35,
      0.09,
      0.07,
      0.07,
      0.03,
      m.gold
    );
  }

  signpost(3.6, -3.7);
  signpost(-8, 0, 0xb8c9e8);

  /* =========================================================
     캐릭터
  ========================================================= */

  const avatar =
    new THREE.Group();

  scene.add(avatar);

  const outfitMat =
    M(
      colors[state.outfit] ||
      colors.lavender
    );

  const limbs = [];

  const avatarShadow =
    add(
      new THREE.CircleGeometry(
        0.65,
        24
      ),
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

  avatarShadow.rotation.x =
    -Math.PI / 2;

  const characterLoader =
    new GLTFLoader();

  const characterUrls = [
    "https://cdn.jsdelivr.net/gh/boyoung0819/mongle-mind@main/components/village/character.glb",
    "https://raw.githubusercontent.com/boyoung0819/mongle-mind/main/components/village/character.glb"
  ];

  let loadedCharacter = null;

  function loadOriginalCharacter(
    urlIndex = 0
  ) {
    if (
      urlIndex >= characterUrls.length
    ) {
      console.error(
        "character.glb를 불러오지 못했습니다."
      );

      toast(
        "캐릭터 파일을 불러오지 못했어요. 잠시 후 새로고침해 주세요."
      );

      return;
    }

    characterLoader.load(
      characterUrls[urlIndex],

      gltf => {
        loadedCharacter =
          gltf.scene;

        const bounds =
          new THREE.Box3()
            .setFromObject(
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
          Math.max(
            size.y,
            0.001
          );

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

        loadedCharacter.traverse(
          obj => {
            if (!obj.isMesh) return;

            obj.castShadow = true;
            obj.receiveShadow = true;
          }
        );

        avatar.add(
          loadedCharacter
        );

        applyOutfitColor(
          state.outfit
        );
      },

      undefined,

      error => {
        console.warn(
          "캐릭터 로드 실패:",
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
     의상 색상 적용
  ========================================================= */

  function applyOutfitColor(
    outfit
  ) {
    if (!loadedCharacter) return;

    const color =
      colors[outfit] ||
      colors.lavender;

    loadedCharacter.traverse(
      obj => {
        if (!obj.isMesh) return;

        const name =
          String(
            obj.name || ""
          ).toLowerCase();

        const shouldColor =
          name.includes("cloth") ||
          name.includes("outfit") ||
          name.includes("dress") ||
          name.includes("shirt") ||
          name.includes("top") ||
          name.includes("clothes") ||
          name.includes("clothing");

        if (!shouldColor) return;

        const materials =
          Array.isArray(obj.material)
            ? obj.material
            : [obj.material];

        materials.forEach(
          material => {
            if (
              material &&
              material.color
            ) {
              material.color.setHex(
                color
              );
            }
          }
        );
      }
    );
  }

  /* =========================================================
     반려동물
  ========================================================= */

  const pet =
    new THREE.Group();

  scene.add(pet);

  ball(
    pet,
    0,
    0.42,
    0,
    0.45,
    0.36,
    0.4,
    m.white
  );

  ball(
    pet,
    0,
    0.78,
    -0.02,
    0.34,
    0.32,
    0.32,
    m.white
  );

  for (const x of [-0.21, 0.21]) {
    ball(
      pet,
      x,
      1.02,
      -0.02,
      0.12,
      0.22,
      0.12,
      M(0xe5c4bd)
    );

    ball(
      pet,
      x * 0.6,
      0.8,
      0.28,
      0.03,
      0.04,
      0.02,
      m.dark
    );

    ball(
      pet,
      x * 0.9,
      0.69,
      0.28,
      0.06,
      0.035,
      0.02,
      m.pink
    );
  }

  ball(
    pet,
    0,
    0.72,
    0.3,
    0.045,
    0.035,
    0.02,
    M(0x9d777a)
  );

  /* =========================================================
     숨겨진 조개
  ========================================================= */

  const shell =
    new THREE.Group();

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
    const q =
      add(
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
      state.x = avatar.position.x;
      state.z = avatar.position.z;

      localStorage.setItem(
        "mongleMindSave",
        JSON.stringify(state)
      );
    } catch (e) {
      console.warn(
        "저장 실패",
        e
      );
    }

    updateUI();
  }

  /* =========================================================
     경험치
  ========================================================= */

  function levelUp() {
    while (
      state.xp >= 100
    ) {
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
     토스트
  ========================================================= */

  function toast(message) {
    const element =
      $("toast");

    if (!element) return;

    element.textContent =
      message;

    element.classList.add(
      "show"
    );

    clearTimeout(
      toastTimer
    );

    toastTimer =
      setTimeout(
        () =>
          element.classList.remove(
            "show"
          ),
        2400
      );
  }

  /* =========================================================
     정원 계산
  ========================================================= */

  function getPlotProgress(
    plot,
    now = Date.now()
  ) {
    if (
      !plot ||
      !plot.seedId
    ) {
      return 0;
    }

    const plant =
      PLANTS[plot.seedId];

    if (!plant) return 0;

    const elapsed =
      Math.max(
        0,
        (now - plot.plantedAt) /
          1000
      );

    const effective =
      elapsed +
      (plot.growthBonus || 0);

    return Math.min(
      1,
      effective /
        plant.growth
    );
  }

  function getPlotStage(
    plot
  ) {
    const progress =
      getPlotProgress(plot);

    if (progress >= 1) {
      return "mature";
    }

    if (progress >= 0.65) {
      return "growing";
    }

    if (progress >= 0.25) {
      return "sprout";
    }

    return "seed";
  }

  function getGrowthText(
    plot
  ) {
    if (!plot.seedId) {
      return "빈 밭";
    }

    const plant =
      PLANTS[plot.seedId];

    const progress =
      getPlotProgress(plot);

    if (progress >= 1) {
      return "수확 가능!";
    }

    const remaining =
      Math.max(
        0,
        Math.ceil(
          plant.growth *
            (1 - progress)
        )
      );

    if (remaining >= 60) {
      return `약 ${Math.ceil(
        remaining / 60
      )}분 남음`;
    }

    return `${remaining}초 후 성장`;
  }

  /* =========================================================
     정원 UI 생성
  ========================================================= */

  let gardenUI = null;
  let questUI = null;

  function ensureGardenUI() {
    const screen =
      document.querySelector(
        '[data-screen="garden"]'
      );

    if (!screen) return null;

    if (gardenUI) return gardenUI;

    gardenUI =
      document.createElement(
        "div"
      );

    gardenUI.className =
      "mm-garden-ui";

    screen.appendChild(
      gardenUI
    );

    gardenUI.addEventListener(
      "click",
      e => {
        const button =
          e.target.closest(
            "[data-garden-action]"
          );

        if (!button) return;

        const action =
          button.dataset.gardenAction;

        const seedId =
          button.dataset.seed;

        const plotId =
          button.dataset.plot;

        if (action === "buy") {
          buySeed(seedId);
        }

        if (action === "select") {
          selectSeed(seedId);
        }

        if (action === "plant") {
          plantSeed(
            Number(plotId)
          );
        }

        if (action === "water") {
          waterPlot(
            Number(plotId)
          );
        }

        if (action === "fertilize") {
          fertilizePlot(
            Number(plotId)
          );
        }

        if (action === "harvest") {
          harvestPlot(
            Number(plotId)
          );
        }

        if (action === "buy-fertilizer") {
          buyFertilizer();
        }
      }
    );

    return gardenUI;
  }

  /* =========================================================
     정원 UI 렌더링
  ========================================================= */

  function renderGardenUI() {
    const ui =
      ensureGardenUI();

    if (!ui) return;

    const seedInventory =
      state.garden.seedInventory;

    const selected =
      state.garden.selectedSeed;

    const selectedPlant =
      selected
        ? PLANTS[selected]
        : null;

    const totalGrowing =
      state.garden.plots.filter(
        p =>
          p.seedId &&
          getPlotProgress(p) < 1
      ).length;

    const readyCount =
      state.garden.plots.filter(
        p =>
          p.seedId &&
          getPlotProgress(p) >= 1
      ).length;

    let html = `
      <div class="mm-garden-head">
        <div>
          <div class="mm-garden-title">
            🌱 나만의 작은 정원
          </div>

          <div class="mm-garden-subtitle">
            원하는 씨앗을 골라 심고, 물과 비료로 돌봐 주세요.
            시간이 지나면 식물이 자라요.
          </div>
        </div>

        <div class="mm-garden-money">
          <div class="mm-garden-pill">
            🪙 ${state.coins}
          </div>

          <div class="mm-garden-pill">
            🌿 성장 중 ${totalGrowing}
          </div>

          <div class="mm-garden-pill">
            🧺 수확 가능 ${readyCount}
          </div>

          <div class="mm-garden-pill">
            🧪 비료 ${state.garden.fertilizer}
          </div>
        </div>
      </div>

      <div class="mm-garden-section">
        <div class="mm-garden-section-title">
          🛒 씨앗 가게
        </div>

        <div class="mm-seed-shop">
    `;

    Object.entries(
      PLANTS
    ).forEach(
      ([id, plant]) => {
        const count =
          seedInventory[id] || 0;

        html += `
          <div class="mm-seed-card ${
            plant.rare
              ? "rare"
              : ""
          }">

            <div class="mm-seed-icon">
              ${plant.icon}
            </div>

            <div class="mm-seed-name">
              ${plant.name}
              ${
                plant.rare
                  ? " ✨"
                  : ""
              }
            </div>

            <div class="mm-seed-description">
              ${plant.description}
            </div>

            <div class="mm-seed-price">
              🪙 ${plant.price}
              · 보유 ${count}
            </div>

            <div class="mm-seed-actions">
              <button
                class="mm-game-btn primary"
                data-garden-action="buy"
                data-seed="${id}"
                ${
                  state.coins <
                  plant.price
                    ? "disabled"
                    : ""
                }
              >
                구매
              </button>

              <button
                class="mm-game-btn"
                data-garden-action="select"
                data-seed="${id}"
                ${
                  count <= 0
                    ? "disabled"
                    : ""
                }
              >
                ${
                  selected === id
                    ? "선택됨 ✓"
                    : "심을 씨앗"
                }
              </button>
            </div>

          </div>
        `;
      }
    );

    html += `
        </div>

        <div class="mm-selected-seed">
          ${
            selectedPlant
              ? `현재 선택:
                 ${selectedPlant.icon}
                 ${selectedPlant.name}
                 · 보유 ${
                   seedInventory[selected] ||
                   0
                 }개`
              : "씨앗을 선택한 뒤 아래 밭을 눌러 심어 보세요."
          }
        </div>

        <div style="
          display:flex;
          justify-content:flex-end;
          margin-top:10px;
        ">
          <button
            class="mm-game-btn gold"
            data-garden-action="buy-fertilizer"
          >
            🧪 비료 1개 구매 · 🪙 7
          </button>
        </div>
      </div>

      <div class="mm-garden-section">
        <div class="mm-garden-section-title">
          🌿 나의 밭
        </div>

        <div class="mm-plots">
    `;

    state.garden.plots.forEach(
      plot => {
        if (!plot.seedId) {
          html += `
            <div class="mm-plot empty">
              <div class="mm-plot-number">
                밭 ${plot.id + 1}
              </div>

              <div class="mm-plot-plant">
                <div class="mm-empty-seed">
                  🪴
                </div>

                <div class="mm-plot-name">
                  비어 있는 밭
                </div>

                <div class="mm-growth-label">
                  ${
                    selectedPlant
                      ? `${selectedPlant.icon} ${selectedPlant.name} 심기 준비 완료`
                      : "먼저 씨앗을 선택하세요"
                  }
                </div>

                <div class="mm-plot-actions">
                  <button
                    class="mm-game-btn green"
                    data-garden-action="plant"
                    data-plot="${plot.id}"
                    ${
                      selectedPlant
                        ? ""
                        : "disabled"
                    }
                  >
                    🌱 심기
                  </button>
                </div>
              </div>
            </div>
          `;

          return;
        }

        const plant =
          PLANTS[plot.seedId];

        const progress =
          getPlotProgress(plot);

        const stage =
          getPlotStage(plot);

        const mature =
          progress >= 1;

        const waterReady =
          !plot.lastWateredAt ||
          Date.now() -
            plot.lastWateredAt >
            8000;

        const fertilizerReady =
          !plot.lastFertilizedAt ||
          Date.now() -
            plot.lastFertilizedAt >
            10000;

        html += `
          <div class="mm-plot ${
            mature
              ? "ready"
              : ""
          }">

            <div class="mm-plot-number">
              밭 ${plot.id + 1}
            </div>

            <div class="mm-plot-plant">

              <div class="
                mm-plant-icon
                ${stage}
              ">
                ${
                  stage === "seed"
                    ? "🌰"
                    : stage === "sprout"
                      ? "🌱"
                      : plant.icon
                }
              </div>

              <div class="mm-plot-name">
                ${plant.name}
              </div>

              <div class="mm-growth-label">
                ${
                  mature
                    ? "✨ 다 자랐어요!"
                    : getGrowthText(plot)
                }
              </div>

              <div class="mm-progress">
                <div
                  style="
                    width:${Math.round(
                      progress * 100
                    )}%;
                  "
                ></div>
              </div>

              <div class="mm-action-info">
                <span>
                  💧 ${plot.waterCount}/3
                </span>

                <span>
                  🧪 ${plot.fertilizerCount}/2
                </span>
              </div>

              <div class="mm-plot-actions">

                ${
                  mature
                    ? `
                      <button
                        class="mm-game-btn gold"
                        data-garden-action="harvest"
                        data-plot="${plot.id}"
                      >
                        🧺 수확하기
                      </button>
                    `
                    : `
                      <button
                        class="mm-game-btn"
                        data-garden-action="water"
                        data-plot="${plot.id}"
                        ${
                          plot.waterCount >= 3 ||
                          !waterReady
                            ? "disabled"
                            : ""
                        }
                      >
                        💧 물주기
                      </button>

                      <button
                        class="mm-game-btn green"
                        data-garden-action="fertilize"
                        data-plot="${plot.id}"
                        ${
                          plot.fertilizerCount >= 2 ||
                          state.garden.fertilizer <= 0 ||
                          !fertilizerReady
                            ? "disabled"
                            : ""
                        }
                      >
                        🧪 비료
                      </button>
                    `
                }

              </div>

            </div>
          </div>
        `;
      }
    );

    html += `
        </div>
      </div>
    `;

    ui.innerHTML = html;
  }

  /* =========================================================
     씨앗 구매
  ========================================================= */

  function buySeed(
    seedId
  ) {
    const plant =
      PLANTS[seedId];

    if (!plant) return;

    if (
      state.coins <
      plant.price
    ) {
      toast(
        "코인이 부족해요."
      );

      return;
    }

    state.coins -=
      plant.price;

    state.garden.seedInventory[
      seedId
    ] =
      (state.garden.seedInventory[
        seedId
      ] || 0) + 1;

    state.stats.seedsBought++;

    save();

    toast(
      `${plant.icon} ${plant.name} 씨앗을 샀어요!`
    );
  }

  /* =========================================================
     씨앗 선택
  ========================================================= */

  function selectSeed(
    seedId
  ) {
    const count =
      state.garden.seedInventory[
        seedId
      ] || 0;

    if (count <= 0) {
      toast(
        "먼저 씨앗을 구매해 주세요."
      );

      return;
    }

    state.garden.selectedSeed =
      seedId;

    save();

    const plant =
      PLANTS[seedId];

    toast(
      `${plant.icon} ${plant.name}을 심을 준비가 됐어요.`
    );
  }

  /* =========================================================
     씨앗 심기
  ========================================================= */

  function plantSeed(
    plotId
  ) {
    const plot =
      state.garden.plots[
        plotId
      ];

    const seedId =
      state.garden.selectedSeed;

    if (!plot) return;

    if (plot.seedId) {
      toast(
        "이 밭에는 이미 식물이 자라고 있어요."
      );

      return;
    }

    if (!seedId) {
      toast(
        "먼저 씨앗을 선택해 주세요."
      );

      return;
    }

    const count =
      state.garden.seedInventory[
        seedId
      ] || 0;

    if (count <= 0) {
      toast(
        "선택한 씨앗이 없어요."
      );

      return;
    }

    plot.seedId =
      seedId;

    plot.plantedAt =
      Date.now();

    plot.growthBonus =
      0;

    plot.waterCount =
      0;

    plot.fertilizerCount =
      0;

    plot.lastWateredAt =
      0;

    plot.lastFertilizedAt =
      0;

    state.garden.seedInventory[
      seedId
    ]--;

    state.stats.seedsPlanted++;

    save();

    const plant =
      PLANTS[seedId];

    toast(
      `${plant.icon} ${plant.name}을 심었어요!`
    );
  }

  /* =========================================================
     정원 액션 애니메이션
  ========================================================= */

  function gardenFX(
    plotId,
    type
  ) {
    const plot =
      document.querySelector(
        `.mm-plot:nth-child(${plotId + 1})`
      );

    if (!plot) return;

    const rect =
      plot.getBoundingClientRect();

    const fx =
      document.createElement(
        "div"
      );

    fx.className =
      type === "water"
        ? "mm-garden-fx"
        : "mm-sparkle";

    fx.textContent =
      type === "water"
        ? "🪣💧"
        : "✨🧪✨";

    fx.style.left =
      `${rect.left + rect.width / 2}px`;

    fx.style.top =
      `${rect.top + 20}px`;

    document.body.appendChild(
      fx
    );

    setTimeout(
      () => fx.remove(),
      1000
    );
  }

  /* =========================================================
     물주기
  ========================================================= */

  function waterPlot(
    plotId
  ) {
    const plot =
      state.garden.plots[
        plotId
      ];

    if (!plot || !plot.seedId) {
      return;
    }

    const now =
      Date.now();

    if (
      plot.waterCount >= 3
    ) {
      toast(
        "이 식물은 오늘 물을 충분히 받았어요."
      );

      return;
    }

    if (
      plot.lastWateredAt &&
      now - plot.lastWateredAt <
        8000
    ) {
      toast(
        "조금 있다가 다시 물을 줄 수 있어요."
      );

      return;
    }

    gardenFX(
      plotId,
      "water"
    );

    plot.waterCount++;

    plot.lastWateredAt =
      now;

    plot.growthBonus +=
      8;

    state.watered =
      true;

    state.stats.waters++;

    save();

    toast(
      "💧 촉촉하게 물을 줬어요! 성장 속도가 조금 빨라졌어요."
    );
  }

  /* =========================================================
     비료 구매
  ========================================================= */

  function buyFertilizer() {
    const price = 7;

    if (
      state.coins <
      price
    ) {
      toast(
        "비료를 살 코인이 부족해요."
      );

      return;
    }

    state.coins -=
      price;

    state.garden.fertilizer++;

    save();

    toast(
      "🧪 비료 1개를 샀어요!"
    );
  }

  /* =========================================================
     비료 주기
  ========================================================= */

  function fertilizePlot(
    plotId
  ) {
    const plot =
      state.garden.plots[
        plotId
      ];

    if (!plot || !plot.seedId) {
      return;
    }

    if (
      state.garden.fertilizer <= 0
    ) {
      toast(
        "비료가 없어요."
      );

      return;
    }

    if (
      plot.fertilizerCount >= 2
    ) {
      toast(
        "이 식물에는 비료를 충분히 줬어요."
      );

      return;
    }

    const now =
      Date.now();

    if (
      plot.lastFertilizedAt &&
      now -
        plot.lastFertilizedAt <
        10000
    ) {
      toast(
        "비료를 너무 자주 줄 수는 없어요."
      );

      return;
    }

    gardenFX(
      plotId,
      "fertilizer"
    );

    state.garden.fertilizer--;

    plot.fertilizerCount++;

    plot.lastFertilizedAt =
      now;

    plot.growthBonus +=
      18;

    state.stats.fertilizers++;

    save();

    toast(
      "🧪 영양분을 듬뿍 줬어요! 식물이 더 빨리 자라요."
    );
  }

  /* =========================================================
     수확
  ========================================================= */

  function harvestPlot(
    plotId
  ) {
    const plot =
      state.garden.plots[
        plotId
      ];

    if (!plot || !plot.seedId) {
      return;
    }

    const progress =
      getPlotProgress(plot);

    if (progress < 1) {
      toast(
        "아직 다 자라지 않았어요."
      );

      return;
    }

    const plant =
      PLANTS[plot.seedId];

    state.coins +=
      plant.harvestCoins;

    state.flowers++;

    state.stats.harvests++;

    xp(
      plant.harvestXp
    );

    const plantName =
      plant.name;

    plot.seedId = null;
    plot.plantedAt = 0;
    plot.growthBonus = 0;
    plot.waterCount = 0;
    plot.fertilizerCount = 0;
    plot.lastWateredAt = 0;
    plot.lastFertilizedAt = 0;

    save();

    toast(
      `🧺 ${plant.icon} ${plantName} 수확 완료! 코인 +${plant.harvestCoins}`
    );
  }

  /* =========================================================
     퀘스트 UI
  ========================================================= */

  function ensureQuestUI() {
    const screen =
      document.querySelector(
        '[data-screen="quests"]'
      );

    if (!screen) return null;

    if (questUI) return questUI;

    questUI =
      document.createElement(
        "div"
      );

    questUI.className =
      "mm-quest-ui";

    screen.appendChild(
      questUI
    );

    questUI.addEventListener(
      "click",
      e => {
        const button =
          e.target.closest(
            "[data-quest-claim]"
          );

        if (!button) return;

        claimQuest(
          button.dataset.questClaim
        );
      }
    );

    return questUI;
  }

  function renderQuestUI() {
    const ui =
      ensureQuestUI();

    if (!ui) return;

    const completed =
      QUESTS.filter(q => {
        return (
          q.progress() >=
          q.goal
        );
      }).length;

    let html = `
      <div class="mm-garden-head">
        <div>
          <div class="mm-garden-title">
            📋 오늘의 작은 퀘스트
          </div>

          <div class="mm-garden-subtitle">
            해야 할 일을 억지로 몰아붙이지 않아도 괜찮아요.
            완료한 것만 보상을 받을 수 있어요.
          </div>
        </div>

        <div class="mm-garden-pill">
          ${completed} / ${QUESTS.length} 완료 가능
        </div>
      </div>

      <div class="mm-quest-message">
        🌱 퀘스트는 실제 게임 행동과 연결되어 있어요.
        진행도가 목표에 도달한 뒤에만 <b>보상 받기</b>가 활성화됩니다.
      </div>

      <div class="mm-quest-list">
    `;

    QUESTS.forEach(
      quest => {
        const progress =
          Math.min(
            quest.goal,
            quest.progress()
          );

        const done =
          progress >=
          quest.goal;

        const claimed =
          state.questClaims.includes(
            quest.id
          );

        const percent =
          Math.min(
            100,
            Math.round(
              (progress /
                quest.goal) *
                100
            )
          );

        html += `
          <div class="mm-quest-card ${
            done
              ? "completed"
              : ""
          }">

            <div class="mm-quest-top">

              <div class="mm-quest-icon">
                ${quest.icon}
              </div>

              <div>
                <div class="mm-quest-title">
                  ${quest.title}
                </div>

                <div class="mm-quest-desc">
                  ${quest.description}
                </div>
              </div>

            </div>

            <div class="mm-quest-progress">
              <span>
                진행도
              </span>

              <span>
                ${progress} / ${quest.goal}
              </span>
            </div>

            <div class="mm-quest-progressbar">
              <div
                style="
                  width:${percent}%;
                "
              ></div>
            </div>

            <div class="mm-quest-bottom">

              <div class="mm-quest-reward">
                🪙 +${quest.rewardCoins}
                · ⭐ +${quest.rewardXp} XP
              </div>

              <button
                class="mm-game-btn ${
                  claimed
                    ? ""
                    : done
                      ? "primary"
                      : ""
                }"
                data-quest-claim="${quest.id}"
                ${
                  claimed ||
                  !done
                    ? "disabled"
                    : ""
                }
              >
                ${
                  claimed
                    ? "보상 받음 ✓"
                    : done
                      ? "보상 받기"
                      : "진행 중"
                }
              </button>

            </div>

          </div>
        `;
      }
    );

    html += `
      </div>
    `;

    ui.innerHTML =
      html;
  }

  /* =========================================================
     퀘스트 보상
  ========================================================= */

  function claimQuest(
    questId
  ) {
    const quest =
      QUESTS.find(
        q =>
          q.id === questId
      );

    if (!quest) return;

    if (
      state.questClaims.includes(
        questId
      )
    ) {
      return;
    }

    const current =
      quest.progress();

    if (
      current <
      quest.goal
    ) {
      toast(
        "아직 퀘스트를 완료하지 않았어요."
      );

      return;
    }

    state.questClaims.push(
      questId
    );

    state.coins +=
      quest.rewardCoins;

    state.xp +=
      quest.rewardXp;

    levelUp();

    save();

    toast(
      `🎉 ${quest.title} 완료! 코인 +${quest.rewardCoins} · XP +${quest.rewardXp}`
    );
  }

  /* =========================================================
     전체 UI 업데이트
  ========================================================= */

  function updateUI() {
    const coins =
      $("coins");

    const level =
      $("level");

    const xpElement =
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

    if (xpElement) {
      xpElement.textContent =
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

    const outfitLabel =
      $("outfitLabel");

    if (outfitLabel) {
      outfitLabel.textContent =
        names[state.outfit] ||
        names.lavender;
    }

    document
      .querySelectorAll(
        ".outfit"
      )
      .forEach(
        button => {
          button.classList.toggle(
            "active",
            button.dataset.outfit ===
              state.outfit
          );
        }
      );

    document
      .querySelectorAll(
        ".mood"
      )
      .forEach(
        button => {
          button.classList.toggle(
            "selected",
            button.dataset.mood ===
              state.mood
          );
        }
      );

    const moodSaved =
      $("moodSaved");

    if (moodSaved) {
      moodSaved.textContent =
        state.mood
          ? moodNames[
              state.mood
            ]
          : "기분을 기록하지 않아도 괜찮아요.";
    }

    document
      .querySelectorAll(
        ".nav-item"
      )
      .forEach(
        button => {
          button.classList.toggle(
            "active",
            button.dataset.nav ===
              state.nav
          );
        }
      );

    document
      .querySelectorAll(
        "[data-room-decor]"
      )
      .forEach(
        button => {
          button.classList.toggle(
            "active",
            button.dataset.roomDecor ===
              state.roomDecor
          );
        }
      );

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
        ] ||
        "나만의 방";
    }

    renderGardenUI();
    renderQuestUI();
  }

  /* =========================================================
     대화창
  ========================================================= */

  function closeDialog() {
    const dialogBox =
      $("dialog");

    if (dialogBox) {
      dialogBox.hidden =
        true;
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
    const dialogName =
      $("dialogName");

    const dialogText =
      $("dialogText");

    const actionsBox =
      $("dialogActions");

    if (!dialogName || !dialogText) {
      return;
    }

    dialogName.textContent =
      name;

    dialogText.textContent =
      text;

    if (actionsBox) {
      actionsBox.replaceChildren();

      actions.forEach(
        action => {
          const button =
            document.createElement(
              "button"
            );

          button.textContent =
            action.label;

          button.onclick =
            action.action;

          actionsBox.appendChild(
            button
          );
        }
      );
    }

    const dialogBox =
      $("dialog");

    if (dialogBox) {
      dialogBox.hidden =
        false;
    }
  }

  /* =========================================================
     마을 상호작용
  ========================================================= */

  function target() {
    const targets = [
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
        label: "포근이 만나기"
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

    return targets.find(
      t =>
        Math.hypot(
          avatar.position.x -
            t.x,
          avatar.position.z -
            t.z
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
        "꽃밭이나 친구 가까이 다가가 E를 눌러 보세요."
      );

      return;
    }

    if (
      t.id === "garden"
    ) {
      showPage(
        "garden"
      );

      return;
    }

    if (
      t.id === "animal"
    ) {
      dialog(
        "포근이",
        "안녕! 나는 포근이야. 여기서는 서두르지 않아도 돼.",
        [
          {
            label: "인사하기",

            action: () => {
              state.stats.petGreetings++;

              xp(5);

              save();

              closeDialog();

              toast(
                "포근이와 인사했어요. 경험치 +5"
              );
            }
          },

          {
            label:
              "꽃 선물하기 (꽃 1개)",

            action: () => {
              if (
                state.flowers <
                1
              ) {
                toast(
                  "먼저 정원에서 꽃을 수확해 봐요."
                );

                return;
              }

              state.flowers--;

              state.coins +=
                10;

              save();

              closeDialog();

              toast(
                "포근이가 기뻐해요! 코인 +10"
              );
            }
          }
        ]
      );

      return;
    }

    if (
      t.id === "shell"
    ) {
      state.foundShell =
        true;

      state.stats.shells++;

      state.coins +=
        8;

      xp(8);

      shell.visible =
        false;

      save();

      toast(
        "🐚 반짝이는 조개 발견! 코인 +8"
      );

      return;
    }

    dialog(
      "작은 집",
      "오늘 하루도 여기까지 온 것만으로 충분해요. 잠시 쉬어 가요.",
      [
        {
          label:
            "정원 둘러보기",

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
          label:
            "산책 계속하기",

          action:
            closeDialog
        }
      ]
    );
  }

  /* =========================================================
     의상
  ========================================================= */

  document
    .querySelectorAll(
      ".outfit"
    )
    .forEach(
      button => {
        button.onclick =
          () => {
            const next =
              button.dataset
                .outfit;

            if (
              state.outfit !==
              next
            ) {
              state.stats
                .outfitChanges++;
            }

            state.outfit =
              next;

            applyOutfitColor(
              state.outfit
            );

            save();

            toast(
              names[
                state.outfit
              ] +
                "을 선택했어요."
            );
          };
      }
    );

  /* =========================================================
     감정
  ========================================================= */

  document
    .querySelectorAll(
      ".mood"
    )
    .forEach(
      button => {
        button.onclick =
          () => {
            state.mood =
              button.dataset
                .mood;

            save();

            toast(
              "오늘의 마음을 기록했어요. 기록은 평가되지 않아요."
            );
          };
      }
    );

  /* =========================================================
     화면 이동
  ========================================================= */

  function showPage(
    page
  ) {
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
      !allowed.includes(
        page
      )
    ) {
      page = "home";
    }

    state.nav =
      page;

    document
      .querySelectorAll(
        "[data-screen]"
      )
      .forEach(
        element => {
          element.hidden =
            element.dataset.screen !==
            page;
        }
      );

    const titles = {
      home:
        "나만의 작은 쉼",

      village:
        "몽글마을 산책",

      dress:
        "캐릭터 꾸미기",

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
      .querySelectorAll(
        ".nav-item"
      )
      .forEach(
        button => {
          button.classList.toggle(
            "active",
            button.dataset.nav ===
              page
          );
        }
      );

    try {
      state.x =
        avatar.position.x;

      state.z =
        avatar.position.z;

      localStorage.setItem(
        "mongleMindSave",
        JSON.stringify(state)
      );
    } catch (e) {}

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

    updateUI();
  }

  document
    .querySelectorAll(
      "[data-page]"
    )
    .forEach(
      button => {
        button.addEventListener(
          "click",
          () =>
            showPage(
              button.dataset.page
            )
        );
      }
    );

  document
    .querySelectorAll(
      ".nav-item"
    )
    .forEach(
      button => {
        button.addEventListener(
          "click",
          () =>
            showPage(
              button.dataset.nav
            )
        );
      }
    );

  document
    .querySelectorAll(
      "[data-home]"
    )
    .forEach(
      button => {
        button.addEventListener(
          "click",
          () =>
            showPage(
              "home"
            )
        );
      }
    );

  /* =========================================================
     기존 정원 버튼
     이제 무료 보상을 주지 않고 정원 화면으로 이동
  ========================================================= */

  const gardenWater =
    $("gardenWater");

  if (gardenWater) {
    gardenWater.addEventListener(
      "click",
      () =>
        showPage(
          "garden"
        )
    );
  }

  /* =========================================================
     방
  ========================================================= */

  document
    .querySelectorAll(
      "[data-room-decor]"
    )
    .forEach(
      button => {
        button.addEventListener(
          "click",
          () => {
            state.roomDecor =
              button.dataset
                .roomDecor;

            save();

            toast(
              "방 분위기를 바꿨어요."
            );
          }
        );
      }
    );

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
     기존 정적 퀘스트 버튼 숨기기
     실제 퀘스트 UI는 위에서 새로 생성
  ========================================================= */

  document
    .querySelectorAll(
      "[data-claim-quest]"
    )
    .forEach(
      button => {
        button.style.display =
          "none";
      }
    );

  /* =========================================================
     호흡 활동
  ========================================================= */

  function stopBreath(
    completed = false
  ) {
    breathing =
      false;

    clearTimeout(
      breathTimer
    );

    const box =
      $("breathBox");

    if (box) {
      box.hidden =
        true;
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

    if (
      completed &&
      !breathCompleted
    ) {
      breathCompleted =
        true;

      state.stats.breaths++;

      save();

      toast(
        "🌿 호흡 활동을 끝까지 완료했어요."
      );
    }
  }

  const breathButton =
    $("breathBtn");

  if (breathButton) {
    breathButton.onclick =
      () => {
        if (breathing) {
          stopBreath(
            false
          );

          return;
        }

        breathing =
          true;

        breathCompleted =
          false;

        breathStep =
          0;

        const box =
          $("breathBox");

        if (box) {
          box.hidden =
            false;
        }

        const label =
          $("breathLabel");

        if (label) {
          label.textContent =
            "호흡 활동 진행 중";
        }

        const instruction =
          $("breathInstruction");

        if (instruction) {
          instruction.textContent =
            "편안한 만큼만 따라 해요. 언제든 그만할 수 있어요.";
        }

        const circle =
          $("breathCircle");

        const text =
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

          const step =
            steps[
              breathStep++ %
                2
            ];

          if (text) {
            text.textContent =
              step[0];
          }

          if (circle) {
            circle.classList.toggle(
              "expand",
              step[1]
            );
          }

          breathTimer =
            setTimeout(
              tick,
              4000
            );
        }

        tick();

        breathTimer =
          setTimeout(
            () =>
              stopBreath(
                true
              ),
            30000
          );
      };
  }

  const stopBreathButton =
    $("stopBreath");

  if (stopBreathButton) {
    stopBreathButton.onclick =
      () =>
        stopBreath(
          false
        );
  }

  /* =========================================================
     키보드 이동
  ========================================================= */

  window.addEventListener(
    "keydown",
    event => {
      keys[
        event.key.toLowerCase()
      ] = true;

      if (
        [
          "ArrowUp",
          "ArrowDown",
          "ArrowLeft",
          "ArrowRight",
          " "
        ].includes(
          event.key
        )
      ) {
        event.preventDefault();
      }

      if (
        event.key.toLowerCase() ===
          "e" &&
        $("dialog") &&
        $("dialog").hidden
      ) {
        interact();
      }

      if (
        event.key ===
        "Escape"
      ) {
        closeDialog();
      }
    }
  );

  window.addEventListener(
    "keyup",
    event => {
      keys[
        event.key.toLowerCase()
      ] = false;
    }
  );

  window.addEventListener(
    "blur",
    () => {
      keys = {};
    }
  );

  /* =========================================================
     터치 이동
  ========================================================= */

  document
    .querySelectorAll(
      ".touch-pad button"
    )
    .forEach(
      button => {
        const key =
          button.dataset.k
            .toLowerCase();

        const start =
          event => {
            event.preventDefault();
            keys[key] =
              true;
          };

        const end =
          event => {
            event.preventDefault();
            keys[key] =
              false;
          };

        button.addEventListener(
          "pointerdown",
          start
        );

        button.addEventListener(
          "pointerup",
          end
        );

        button.addEventListener(
          "pointerleave",
          end
        );

        button.addEventListener(
          "pointercancel",
          end
        );
      }
    );

  /* =========================================================
     마우스로 이동
  ========================================================= */

  renderer.domElement.addEventListener(
    "pointerdown",
    event => {
      if (
        event.target.closest(
          "button"
        )
      ) {
        return;
      }

      const rect =
        renderer.domElement.getBoundingClientRect();

      const ray =
        new THREE.Raycaster();

      ray.setFromCamera(
        new THREE.Vector2(
          ((event.clientX -
            rect.left) /
            rect.width) *
            2 -
            1,

          -(
            ((event.clientY -
              rect.top) /
              rect.height) *
              2 -
            1
          )
        ),
        camera
      );

      const point =
        new THREE.Vector3();

      const plane =
        new THREE.Plane(
          new THREE.Vector3(
            0,
            1,
            0
          ),
          0
        );

      if (
        ray.ray.intersectPlane(
          plane,
          point
        )
      ) {
        avatar.userData.dest =
          new THREE.Vector3(
            THREE.MathUtils.clamp(
              point.x,
              -13,
              13
            ),
            0,
            THREE.MathUtils.clamp(
              point.z,
              -13,
              13
            )
          );
      }
    }
  );

  /* =========================================================
     초기 캐릭터 위치
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

  if (
    state.foundShell
  ) {
    shell.visible =
      false;
  }

  /* =========================================================
     화면 크기
  ========================================================= */

  function resize() {
    const width =
      Math.max(
        root.clientWidth,
        320
      );

    const height =
      Math.max(
        root.clientHeight,
        320
      );

    renderer.setSize(
      width,
      height,
      false
    );

    camera.aspect =
      width / height;

    camera.updateProjectionMatrix();
  }

  new ResizeObserver(
    resize
  ).observe(root);

  resize();

  /* =========================================================
     초기 화면
  ========================================================= */

  updateUI();

  showPage(
    state.nav || "home"
  );

  /* =========================================================
     정원 성장 실시간 업데이트
  ========================================================= */

  setInterval(
    () => {
      if (
        state.nav ===
        "garden"
      ) {
        renderGardenUI();
      }

      if (
        state.nav ===
        "quests"
      ) {
        renderQuestUI();
      }
    },
    1000
  );

  /* =========================================================
     게임 루프
  ========================================================= */

  function animate(
    time
  ) {
    requestAnimationFrame(
      animate
    );

    const dt =
      Math.min(
        (time - last) /
          1000 ||
          0,
        0.05
      );

    last = time;

    let moving =
      false;

    const dialogBox =
      $("dialog");

    if (
      !dialogBox ||
      dialogBox.hidden
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
        const direction =
          avatar.userData.dest
            .clone()
            .sub(
              avatar.position
            );

        direction.y = 0;

        if (
          direction.length() <
          0.2
        ) {
          avatar.userData.dest =
            null;
        } else {
          direction.normalize();

          dx =
            direction.x;

          dz =
            direction.z;
        }
      }

      if (
        dx ||
        dz
      ) {
        const length =
          Math.hypot(
            dx,
            dz
          );

        dx /=
          length;

        dz /=
          length;

        moving =
          true;

        avatar.position.x =
          THREE.MathUtils.clamp(
            avatar.position.x +
              dx *
                dt *
                4,
            -13,
            13
          );

        avatar.position.z =
          THREE.MathUtils.clamp(
            avatar.position.z +
              dz *
                dt *
                4,
            -13,
            13
          );

        avatar.rotation.y =
          Math.atan2(
            dx,
            dz
          );

        limbs.forEach(
          limb => {
            limb.o.rotation.x =
              Math.sin(
                time *
                  0.012
              ) *
              (limb.kind ===
              "leg"
                ? 0.45
                : 0.22) *
              limb.side;
          }
        );
      } else {
        limbs.forEach(
          limb => {
            limb.o.rotation.x =
              0;
          }
        );
      }
    }

    /* =====================================================
       GLB 캐릭터 걷기 느낌
    ===================================================== */

    walkBlend =
      THREE.MathUtils.damp(
        walkBlend,
        moving
          ? 1
          : 0,
        8,
        dt
      );

    if (moving) {
      walkPhase +=
        dt * 8;
    }

    if (
      loadedCharacter
    ) {
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
          time *
            0.0018
        ) *
        0.009 *
        (1 -
          walkBlend);

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

    /* =====================================================
       포근이 따라오기
    ===================================================== */

    pet.position.set(
      avatar.position.x +
        0.9,

      Math.abs(
        Math.sin(
          time *
            0.003
        )
      ) *
        0.05,

      avatar.position.z +
        1
    );

    pet.rotation.y =
      Math.sin(
        time *
          0.001
      ) *
      0.15;

    /* =====================================================
       카메라
    ===================================================== */

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

    /* =====================================================
       현재 상호작용 안내
    ===================================================== */

    const near =
      target();

    if (sceneStatus) {
      sceneStatus.textContent =
        near
          ? `E · ${near.label}`
          : "나만의 속도로 산책해요";
    }

    renderer.render(
      scene,
      camera
    );
  }

  requestAnimationFrame(
    animate
  );
})();
