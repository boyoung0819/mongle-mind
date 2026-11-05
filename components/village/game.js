import * as THREE from "https://cdn.jsdelivr.net/npm/three@0.164.1/build/three.module.js";
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

    /* 기존 데이터와 호환 */
    questClaims: [],

    gardenPlots: [],
    gardenSeeds: {},
    selectedGardenSeed: null,
    fertilizer: 3,

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
      petDraws: 0,
      petInteractions: 0
    },

    /* 새 펫 시스템 */
    petCurrency: 0,
    petCoins: 0,

    ownedPets: [],
    selectedPet: null,

    firstPetTutorialDone: false,

    petFragments: {},

    /* 장착 중인 아이템 */
    petAccessories: {},

    /* 실제 구매해서 보유한 아이템 */
    ownedPetAccessories: {
      hats: [],
      outfits: []
    },

    /* 펫 방 */
    petRoomDecor: {
      floor: "cream",
      wall: "lavender",
      furniture: "basic"
    }
  };

  let state = {
    ...defaults,
    stats: { ...defaults.stats },
    ownedPetAccessories: {
      hats: [],
      outfits: []
    },
    petRoomDecor: {
      ...defaults.petRoomDecor
    }
  };

  /* =========================================================
     저장 데이터 불러오기
  ========================================================= */

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

        ownedPetAccessories: {
          ...defaults.ownedPetAccessories,
          ...(saved.ownedPetAccessories || {})
        },

        petRoomDecor: {
          ...defaults.petRoomDecor,
          ...(saved.petRoomDecor || {})
        }
      };
    }
  } catch (e) {
    console.warn("저장 데이터를 읽지 못했습니다.", e);
  }

  /* =========================================================
     오래된 저장 데이터 보정
  ========================================================= */

  if (!Array.isArray(state.questClaims)) {
    state.questClaims = [];
  }

  if (!Array.isArray(state.ownedPets)) {
    state.ownedPets = [];
  }

  if (!state.petFragments || typeof state.petFragments !== "object") {
    state.petFragments = {};
  }

  if (!state.petAccessories || typeof state.petAccessories !== "object") {
    state.petAccessories = {};
  }

  if (
    !state.ownedPetAccessories ||
    typeof state.ownedPetAccessories !== "object"
  ) {
    state.ownedPetAccessories = {
      hats: [],
      outfits: []
    };
  }

  if (!Array.isArray(state.ownedPetAccessories.hats)) {
    state.ownedPetAccessories.hats = [];
  }

  if (!Array.isArray(state.ownedPetAccessories.outfits)) {
    state.ownedPetAccessories.outfits = [];
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

  if (typeof state.firstPetTutorialDone !== "boolean") {
    state.firstPetTutorialDone = false;
  }

  if (
    typeof state.x !== "number" ||
    Math.abs(state.x) > 20
  ) {
    state.x = 0;
  }

  if (
    typeof state.z !== "number" ||
    Math.abs(state.z) > 20
  ) {
    state.z = 4;
  }

  if (typeof state.journalText !== "string") {
    state.journalText = "";
  }

  if (!state.roomDecor) {
    state.roomDecor = "lavender";
  }

  if (!state.petRoomDecor) {
    state.petRoomDecor = {
      floor: "cream",
      wall: "lavender",
      furniture: "basic"
    };
  }

  /*
   * 예전 버전에서 bunny를 가지고 있던 사용자는
   * 기존 펫을 잃지 않도록 유지한다.
   */
  if (
    saved &&
    Array.isArray(saved.ownedPets) &&
    saved.ownedPets.includes("bunny") &&
    !state.ownedPets.includes("bunny")
  ) {
    state.ownedPets.push("bunny");
  }

  /*
   * 기존 버전에서 bunny가 기본 펫이었던 저장 데이터의 경우
   * selectedPet이 bunny였으면 그대로 유지한다.
   */
  if (
    saved &&
    saved.selectedPet === "bunny" &&
    state.ownedPets.includes("bunny") &&
    !state.selectedPet
  ) {
    state.selectedPet = "bunny";
  }

  /* =========================================================
     기본 변수
  ========================================================= */

  let keys = {};

  let toastTimer = null;
  let breathTimer = null;
  let breathStep = 0;
  let breathing = false;

  let last = 0;

  let walkBlend = 0;
  let walkPhase = 0;

  let petResultTimer = null;

  let petUI = null;
  let questUI = null;

  let petView = "main";

  /* =========================================================
     색상 / 이름
  ========================================================= */

  const colors = {
    lavender: 0xb7a5e5,
    peach: 0xefb39e,
    mint: 0x9acdb5
  };

  const names = {
    lavender: "라벤더",
    peach: "피치",
    mint: "민트"
  };

  const moodNames = {
    calm: "차분한 마음을 기록했어요.",
    happy: "기쁜 마음을 기록했어요.",
    tired: "지친 마음을 기록했어요.",
    worried: "걱정되는 마음을 기록했어요."
  };

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
      rate: 30,
      duplicateCoins: 12,
      fragmentNeed: 10
    },

    cat: {
      id: "cat",
      name: "달빛고양이",
      icon: "🐱",
      rarity: "일반",
      color: 0xcfc7df,
      earColor: 0xa99dbc,
      rate: 25,
      duplicateCoins: 14,
      fragmentNeed: 10
    },

    hamster: {
      id: "hamster",
      name: "포근햄찌",
      icon: "🐹",
      rarity: "일반",
      color: 0xf0c6a8,
      earColor: 0xe3a88c,
      rate: 15,
      duplicateCoins: 16,
      fragmentNeed: 10
    },

    duck: {
      id: "duck",
      name: "몽실오리",
      icon: "🐥",
      rarity: "일반",
      color: 0xffdf76,
      earColor: 0xf1b45d,
      rate: 10,
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
      rate: 7,
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
      rate: 5,
      duplicateCoins: 30,
      fragmentNeed: 15
    },

    raccoon: {
      id: "raccoon",
      name: "밤하늘너구리",
      icon: "🦝",
      rarity: "희귀",
      color: 0xa9a4b6,
      earColor: 0x777486,
      rate: 3,
      duplicateCoins: 35,
      fragmentNeed: 15
    },

    deer: {
      id: "deer",
      name: "별숲사슴",
      icon: "🦌",
      rarity: "매우 희귀",
      color: 0xd6b48f,
      earColor: 0xb88e68,
      rate: 2.5,
      duplicateCoins: 50,
      fragmentNeed: 20
    },

    panda: {
      id: "panda",
      name: "구름판다",
      icon: "🐼",
      rarity: "매우 희귀",
      color: 0xe8e8e8,
      earColor: 0x4d4d55,
      rate: 1.5,
      duplicateCoins: 60,
      fragmentNeed: 20
    },

    unicorn: {
      id: "unicorn",
      name: "꿈결유니콘",
      icon: "🦄",
      rarity: "전설",
      color: 0xf3d7ff,
      earColor: 0xd4a8ec,
      rate: 0.7,
      duplicateCoins: 90,
      fragmentNeed: 25
    },

    star: {
      id: "star",
      name: "별빛친구",
      icon: "⭐",
      rarity: "전설",
      color: 0xf3d47b,
      earColor: 0xf1bd62,
      rate: 0.3,
      duplicateCoins: 120,
      fragmentNeed: 25
    }
  };

  const PET_LIST = Object.values(PETS);

  const PET_RARITY_INFO = [
    {
      name: "일반",
      rate: 80,
      className: "common"
    },
    {
      name: "희귀",
      rate: 15,
      className: "rare"
    },
    {
      name: "매우 희귀",
      rate: 4,
      className: "very-rare"
    },
    {
      name: "전설",
      rate: 1,
      className: "legendary"
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
    },

    ribbon: {
      id: "ribbon",
      name: "작은 리본",
      icon: "🎀",
      price: 35
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

    flowerCape: {
      id: "flowerCape",
      name: "꽃빛 망토",
      icon: "🌷",
      price: 45
    },

    cloud: {
      id: "cloud",
      name: "구름 포근옷",
      icon: "☁️",
      price: 55
    }
  };

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
     반복 / 단계형 퀘스트
  ========================================================= */

  const QUESTS = [
    {
      id: "pet_interaction",
      icon: "🐾",
      title: "친구와 인사하기",
      description: "펫과 한 번 인사해 보세요.",
      type: "repeat",
      goal: 1,
      rewardPetCurrency: 1,
      rewardCoins: 2,
      getProgress: () =>
        state.stats.petInteractions || 0
    },

    {
      id: "pet_draw",
      icon: "✨",
      title: "새로운 친구 만나기",
      description: "펫 뽑기를 진행해 보세요.",
      type: "stage",
      goals: [1, 3, 5, 8, 12, 18],
      rewardPetCurrency: 2,
      rewardCoins: 3,
      getProgress: () =>
        state.stats.petDraws || 0
    },

    {
      id: "pet_collect",
      icon: "📖",
      title: "작은 펫 도감",
      description: "서로 다른 펫을 모아 보세요.",
      type: "stage",
      goals: [2, 4, 6, 8, 10, 12],
      rewardPetCurrency: 3,
      rewardCoins: 5,
      getProgress: () =>
        state.ownedPets.length
    },

    {
      id: "pet_fragment",
      icon: "🧩",
      title: "조각 모으기",
      description: "펫 조각을 모아 보세요.",
      type: "repeat",
      goal: 5,
      rewardPetCurrency: 1,
      rewardCoins: 0,
      getProgress: () =>
        Object.values(
          state.petFragments || {}
        ).reduce(
          (sum, n) =>
            sum + Number(n || 0),
          0
        )
    },

    {
      id: "garden_harvest",
      icon: "🌷",
      title: "정원에서 수확하기",
      description: "식물을 수확해 보세요.",
      type: "stage",
      goals: [2, 5, 10, 18, 30],
      rewardPetCurrency: 2,
      rewardCoins: 8,
      getProgress: () =>
        state.stats.harvests || 0
    },

    {
      id: "water",
      icon: "💧",
      title: "정원 돌보기",
      description: "식물에게 물을 주세요.",
      type: "stage",
      goals: [3, 6, 12, 20, 35],
      rewardPetCurrency: 1,
      rewardCoins: 4,
      getProgress: () =>
        state.stats.waters || 0
    },

    {
      id: "breath",
      icon: "🌿",
      title: "잠깐의 쉼",
      description: "호흡 활동을 끝까지 완료해 보세요.",
      type: "stage",
      goals: [1, 3, 5, 8, 12],
      rewardPetCurrency: 2,
      rewardCoins: 3,
      getProgress: () =>
        state.stats.breaths || 0
    },

    {
      id: "journal",
      icon: "💭",
      title: "마음 남기기",
      description: "오늘의 마음을 기록해 보세요.",
      type: "stage",
      goals: [1, 3, 5, 8, 12],
      rewardPetCurrency: 2,
      rewardCoins: 3,
      getProgress: () =>
        state.stats.journals || 0
    },

    {
      id: "shell",
      icon: "🐚",
      title: "숨겨진 반짝임",
      description: "마을의 조개를 찾아 보세요.",
      type: "repeat",
      goal: 1,
      rewardPetCurrency: 2,
      rewardCoins: 8,
      getProgress: () =>
        state.stats.shellFinds || 0
    }
  ];

  /*
   * 퀘스트 진행 상태.
   * 예:
   * questStages.pet_draw = 0
   * 1회 완료 → 1
   * 다음 목표 3회
   */
  if (
    !state.questStages ||
    typeof state.questStages !== "object"
  ) {
    state.questStages = {};
  }

  /* =========================================================
     Three.js 장면
  ========================================================= */

  const scene = new THREE.Scene();

  scene.background =
    new THREE.Color(0xbadcf3);

  scene.fog =
    new THREE.Fog(
      0xd5e7ce,
      28,
      60
    );

  const camera =
    new THREE.PerspectiveCamera(
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

  const renderer =
    new THREE.WebGLRenderer({
      antialias: true
    });

  renderer.setPixelRatio(
    Math.min(
      devicePixelRatio || 1,
      2
    )
  );

  renderer.shadowMap.enabled =
    true;

  renderer.shadowMap.type =
    THREE.PCFSoftShadowMap;

  renderer.outputColorSpace =
    THREE.SRGBColorSpace;

  renderer.toneMapping =
    THREE.ACESFilmicToneMapping;

  renderer.toneMappingExposure =
    1.15;

  root.replaceChildren(
    renderer.domElement
  );

  /* =========================================================
     조명
  ========================================================= */

  scene.add(
    new THREE.HemisphereLight(
      0xfff7ed,
      0x78936c,
      2
    )
  );

  const sun =
    new THREE.DirectionalLight(
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

  /* =========================================================
     재질
  ========================================================= */

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
    const o =
      new THREE.Mesh(
        g,
        mat
      );

    o.position.set(
      x,
      y,
      z
    );

    o.scale.set(
      sx,
      sy,
      sz
    );

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
      new THREE.BoxGeometry(
        w,
        h,
        d
      ),
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
      new THREE.SphereGeometry(
        1,
        18,
        12
      ),
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

  /* =========================================================
     바닥
  ========================================================= */

  const ground =
    add(
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

  ground.rotation.x =
    -Math.PI / 2;

  /* =========================================================
     길
  ========================================================= */

  for (
    let i = 0;
    i < 15;
    i++
  ) {
    const p =
      box(
        scene,
        Math.sin(
          i * 0.28
        ) * 1.6,
        0.01,
        11 -
          i * 1.55,
        4.2,
        0.07,
        1.65,
        i % 3
          ? m.path
          : m.path2
      );

    p.rotation.y =
      Math.sin(
        i * 0.28
      ) * -0.1;
  }

  /* =========================================================
     연못
  ========================================================= */

  const pond =
    add(
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

  const rim =
    add(
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

  /*
   * 지붕 방향 수정
   */
  const r1 =
    box(
      house,
      -1.3,
      2.45,
      0,
      3.2,
      0.2,
      4.8,
      m.roof
    );

  r1.rotation.z =
    0.52;

  const r2 =
    box(
      house,
      1.3,
      2.45,
      0,
      3.2,
      0.2,
      4.8,
      m.roof2
    );

  r2.rotation.z =
    -0.52;

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

  for (
    const x of [-1.6, 1.6]
  ) {
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

    g.scale.setScalar(
      scale
    );

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

    for (
      let i = 0;
      i < 5;
      i++
    ) {
      const a =
        i *
        Math.PI *
        2 /
        5;

      ball(
        g,
        Math.cos(a) *
          0.14,
        0.46,
        Math.sin(a) *
          0.14,
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

    for (
      let i = 0;
      i < 5;
      i++
    ) {
      for (
        let j = 0;
        j < 2;
        j++
      ) {
        flower(
          x - 1.5 +
            i * 0.75,
          z - 0.45 +
            j * 0.85,
          cs[
            (i + j) %
              4
          ],
          0.72
        );
      }
    }
  }

  bed(-7, 2.8);
  bed(1, -1.2);
  bed(7, 7);

  for (
    let i = 0;
    i < 42;
    i++
  ) {
    const x =
      Math.sin(
        i * 12.3
      ) * 12;

    const z =
      Math.cos(
        i * 7.1
      ) * 11;

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
      0.45 +
        (i % 3) *
          0.1
    );
  }

  /* =========================================================
     울타리
  ========================================================= */

  for (
    let i = 0;
    i < 7;
    i++
  ) {
    box(
      scene,
      -10 +
        i * 0.62,
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
        -9.7 +
          i * 0.62,
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

    const l =
      new THREE.PointLight(
        0xffd69b,
        0.5,
        4
      );

    l.position.set(
      x,
      1.5,
      z
    );

    scene.add(l);
  }

  lamp(-2, -1);
  lamp(3, 4);
  lamp(-8, 6);

  /* =========================================================
     관목
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
  ].forEach(
    (p, i) =>
      shrub(
        p[0],
        p[1],
        i % 3 === 0
          ? 0.9
          : 0.7
      )
  );

  /* =========================================================
     돌길
  ========================================================= */

  function steppingStone(
    x,
    z,
    rot = 0
  ) {
    const o =
      add(
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

    o.rotation.y =
      rot;
  }

  for (
    let i = 0;
    i < 7;
    i++
  ) {
    steppingStone(
      -2.6 +
        i * 0.78,
      7.2 +
        Math.sin(
          i * 0.55
        ) *
          0.18,
      i * 0.2
    );

    steppingStone(
      3.1 +
        i * 0.65,
      -4.2 +
        Math.sin(
          i * 0.7
        ) *
          0.22,
      i * 0.17
    );
  }

  /* =========================================================
     버섯
  ========================================================= */

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

    for (
      let i = 0;
      i < 3;
      i++
    ) {
      ball(
        g,
        Math.cos(
          i * 2.1
        ) *
          0.18,
        0.52,
        Math.sin(
          i * 2.1
        ) *
          0.16,
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

  /* =========================================================
     우편함
  ========================================================= */

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

  /* =========================================================
     표지판
  ========================================================= */

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

  signpost(
    3.6,
    -3.7
  );

  signpost(
    -8,
    0,
    0xb8c9e8
  );

  /* =========================================================
     집 주변 돌
  ========================================================= */

  for (
    let i = 0;
    i < 22;
    i++
  ) {
    const a =
      i * 2.399;

    const x =
      Math.cos(a) *
        (5.2 +
          (i % 3) *
            0.25) -
      5;

    const z =
      Math.sin(a) *
        (3.8 +
          (i % 2) *
            0.35) -
      5;

    const rock =
      add(
        new THREE.DodecahedronGeometry(
          0.22 +
            (i % 3) *
              0.04,
          0
        ),
        stoneMat,
        scene,
        x,
        0.1,
        z,
        0.9,
        0.55,
        0.8
      );

    rock.rotation.y =
      a;
  }

  /* =========================================================
     캐릭터
  ========================================================= */

  const avatar =
    new THREE.Group();

  scene.add(avatar);

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
      urlIndex >=
      characterUrls.length
    ) {
      console.error(
        "character.glb를 불러오지 못했습니다."
      );

      toast(
        "캐릭터 파일을 불러오지 못했어요."
      );

      return;
    }

    characterLoader.load(
      characterUrls[urlIndex],

      gltf => {
        loadedCharacter =
          gltf.scene;

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

            obj.castShadow =
              true;

            obj.receiveShadow =
              true;
          }
        );

        avatar.add(
          loadedCharacter
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
     펫 3D
  ========================================================= */

  const pet =
    new THREE.Group();

  scene.add(pet);

  pet.visible =
    !!state.selectedPet;

  function clearGroup(
    group
  ) {
    while (
      group.children.length
    ) {
      group.remove(
        group.children[0]
      );
    }
  }

  function createPetModel(
    petId
  ) {
    clearGroup(pet);

    if (
      !petId ||
      !PETS[petId] ||
      !state.ownedPets.includes(
        petId
      )
    ) {
      pet.visible = false;
      return;
    }

    pet.visible = true;

    const data =
      PETS[petId];

    const bodyMat =
      M(data.color);

    const earMat =
      M(data.earColor);

    const eyeMat =
      m.dark;

    /*
     * 몸
     */
    ball(
      pet,
      0,
      0.42,
      0,
      0.45,
      0.36,
      0.4,
      bodyMat
    );

    /*
     * 머리
     */
    ball(
      pet,
      0,
      0.78,
      -0.02,
      0.34,
      0.32,
      0.32,
      bodyMat
    );

    /*
     * 귀
     */
    if (
      petId === "cat" ||
      petId === "fox" ||
      petId === "bunny" ||
      petId === "hamster"
    ) {
      for (
        const x of [-0.21, 0.21]
      ) {
        const ear =
          ball(
            pet,
            x,
            1.04,
            -0.02,
            0.12,
            0.22,
            0.12,
            earMat
          );

        if (
          petId === "fox" ||
          petId === "cat"
        ) {
          ear.scale.y =
            1.35;
        }
      }
    } else if (
      petId === "bear" ||
      petId === "panda" ||
      petId === "raccoon"
    ) {
      for (
        const x of [-0.21, 0.21]
      ) {
        ball(
          pet,
          x,
          1.02,
          -0.02,
          0.13,
          0.13,
          0.11,
          earMat
        );
      }
    } else if (
      petId === "deer"
    ) {
      for (
        const x of [-0.2, 0.2]
      ) {
        ball(
          pet,
          x,
          1.02,
          -0.02,
          0.08,
          0.16,
          0.08,
          earMat
        );

        box(
          pet,
          x,
          1.23,
          -0.02,
          0.035,
          0.28,
          0.035,
          earMat
        );
      }
    } else if (
      petId === "duck"
    ) {
      ball(
        pet,
        0,
        0.72,
        0.33,
        0.13,
        0.06,
        0.04,
        M(0xf29b55)
      );
    } else if (
      petId === "unicorn"
    ) {
      for (
        const x of [-0.19, 0.19]
      ) {
        ball(
          pet,
          x,
          1.02,
          -0.02,
          0.09,
          0.16,
          0.09,
          earMat
        );
      }

      const horn =
        new THREE.Mesh(
          new THREE.ConeGeometry(
            0.07,
            0.28,
            10
          ),
          M(0xd8b4f2)
        );

      horn.position.set(
        0,
        1.16,
        0
      );

      horn.rotation.z =
        Math.PI / 2;

      horn.rotation.x =
        Math.PI / 2;

      horn.castShadow = true;

      pet.add(horn);
    } else if (
      petId === "star"
    ) {
      ball(
        pet,
        0,
        1.04,
        0,
        0.12,
        0.12,
        0.12,
        M(0xffe89c)
      );
    }

    /*
     * 눈
     */
    ball(
      pet,
      -0.12,
      0.8,
      0.285,
      0.035,
      0.045,
      0.02,
      eyeMat
    );

    ball(
      pet,
      0.12,
      0.8,
      0.285,
      0.035,
      0.045,
      0.02,
      eyeMat
    );

    /*
     * 볼
     */
    ball(
      pet,
      -0.2,
      0.71,
      0.27,
      0.06,
      0.035,
      0.02,
      m.pink
    );

    ball(
      pet,
      0.2,
      0.71,
      0.27,
      0.06,
      0.035,
      0.02,
      m.pink
    );

    /*
     * 코
     */
    ball(
      pet,
      0,
      0.72,
      0.31,
      0.045,
      0.035,
      0.02,
      M(0x9d777a)
    );

    /*
     * 꼬리
     */
    if (
      petId !== "duck" &&
      petId !== "star"
    ) {
      ball(
        pet,
        0.42,
        0.48,
        -0.08,
        0.18,
        0.18,
        0.18,
        bodyMat
      );
    }

    applyPetAccessories();
  }

  /* =========================================================
     펫 액세서리 렌더링
  ========================================================= */

  function applyPetAccessories() {
    if (
      !state.selectedPet
    ) {
      return;
    }

    const acc =
      state.petAccessories[
        state.selectedPet
      ] || {
        hat: "none",
        outfit: "none"
      };

    /*
     * 모자
     */
    if (
      acc.hat ===
      "flower"
    ) {
      ball(
        pet,
        0.22,
        1.05,
        0.02,
        0.13,
        0.08,
        0.13,
        M(0xffa6c5)
      );

      ball(
        pet,
        0.22,
        1.05,
        0.02,
        0.045,
        0.045,
        0.045,
        m.gold
      );
    }

    if (
      acc.hat ===
      "beret"
    ) {
      ball(
        pet,
        0,
        1.05,
        -0.01,
        0.29,
        0.1,
        0.27,
        M(0xa88bc5)
      );
    }

    if (
      acc.hat ===
      "crown"
    ) {
      const crown =
        new THREE.Mesh(
          new THREE.ConeGeometry(
            0.16,
            0.3,
            5
          ),
          m.gold
        );

      crown.position.set(
        0,
        1.14,
        0
      );

      crown.castShadow =
        true;

      pet.add(crown);
    }

    if (
      acc.hat ===
      "leaf"
    ) {
      const leaf =
        new THREE.Mesh(
          new THREE.SphereGeometry(
            0.16,
            12,
            8
          ),
          m.leaf2
        );

      leaf.scale.set(
        1,
        0.35,
        1.5
      );

      leaf.position.set(
        0.18,
        1.08,
        0
      );

      leaf.rotation.z =
        -0.35;

      leaf.castShadow =
        true;

      pet.add(leaf);
    }

    if (
      acc.hat ===
      "ribbon"
    ) {
      ball(
        pet,
        -0.18,
        1.02,
        0.04,
        0.12,
        0.07,
        0.05,
        M(0xf08eb5)
      );

      ball(
        pet,
        0.18,
        1.02,
        0.04,
        0.12,
        0.07,
        0.05,
        M(0xf08eb5)
      );
    }

    /*
     * 옷
     */
    if (
      acc.outfit ===
      "scarf"
    ) {
      ball(
        pet,
        0,
        0.58,
        0.02,
        0.43,
        0.09,
        0.38,
        M(0xf19aaf)
      );
    }

    if (
      acc.outfit ===
      "cape"
    ) {
      const cape =
        new THREE.Mesh(
          new THREE.ConeGeometry(
            0.48,
            0.8,
            4,
            1,
            true
          ),
          M(0xa995dc)
        );

      cape.rotation.x =
        Math.PI / 2;

      cape.position.set(
        0,
        0.5,
        -0.22
      );

      cape.castShadow =
        true;

      pet.add(cape);
    }

    if (
      acc.outfit ===
      "flowerCape"
    ) {
      ball(
        pet,
        0,
        0.5,
        -0.05,
        0.47,
        0.22,
        0.4,
        M(0xf0b0c6)
      );

      ball(
        pet,
        -0.2,
        0.58,
        0.2,
        0.08,
        0.08,
        0.05,
        m.gold
      );

      ball(
        pet,
        0.2,
        0.58,
        0.2,
        0.08,
        0.08,
        0.05,
        m.gold
      );
    }

    if (
      acc.outfit ===
      "cloud"
    ) {
      ball(
        pet,
        0,
        0.5,
        0,
        0.48,
        0.24,
        0.42,
        m.white
      );

      ball(
        pet,
        -0.25,
        0.56,
        0.02,
        0.2,
        0.18,
        0.2,
        m.white
      );

      ball(
        pet,
        0.25,
        0.56,
        0.02,
        0.2,
        0.18,
        0.2,
        m.white
      );
    }
  }

  /*
   * 기존 펫이 있으면 표시.
   * 신규 사용자는 아무 펫도 나오지 않는다.
   */
  if (
    state.selectedPet &&
    state.ownedPets.includes(
      state.selectedPet
    )
  ) {
    createPetModel(
      state.selectedPet
    );
  } else {
    pet.visible = false;
  }

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

  for (
    let i = -1;
    i <= 1;
    i++
  ) {
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
      localStorage.setItem(
        "mongleMindSave",
        JSON.stringify(
          state
        )
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
     펫 UI 스타일
  ========================================================= */

  function injectPetStyles() {
    if (
      document.getElementById(
        "monglePetStyles"
      )
    ) {
      return;
    }

    const style =
      document.createElement(
        "style"
      );

    style.id =
      "monglePetStyles";

    style.textContent = `
      .mm-pet-ui {
        margin-top: 18px;
      }

      .mm-pet-card,
      .mm-pet-section {
        background: rgba(255,255,255,.88);
        border: 1px solid rgba(150,120,180,.10);
        border-radius: 24px;
        padding: 18px;
        margin-bottom: 16px;
        box-shadow: 0 12px 30px rgba(90,70,110,.07);
      }

      .mm-pet-title {
        display:flex;
        justify-content:space-between;
        align-items:center;
        gap:12px;
        margin-bottom:13px;
      }

      .mm-pet-title h3 {
        margin:0;
        font-size:17px;
      }

      .mm-pet-currency {
        display:flex;
        gap:6px;
        flex-wrap:wrap;
        justify-content:flex-end;
      }

      .mm-currency {
        padding:7px 10px;
        border-radius:999px;
        background:#f6f0fb;
        font-size:11px;
        font-weight:800;
      }

      .mm-pet-button {
        border:0;
        border-radius:14px;
        padding:11px 14px;
        background:linear-gradient(135deg,#b99ce8,#d6b5f1);
        color:white;
        font-weight:900;
        cursor:pointer;
        margin-top:10px;
        transition:.18s;
      }

      .mm-pet-button:hover {
        transform:translateY(-1px);
      }

      .mm-pet-button.secondary {
        background:#f1edf6;
        color:#66577a;
      }

      .mm-pet-button:disabled {
        opacity:.45;
        cursor:not-allowed;
        transform:none;
      }

      .mm-pet-grid {
        display:grid;
        grid-template-columns:repeat(4,minmax(0,1fr));
        gap:10px;
      }

      .mm-pet-item {
        border:1px solid #eee8f4;
        border-radius:18px;
        padding:12px 8px;
        text-align:center;
        background:#fff;
        cursor:pointer;
        transition:.18s;
      }

      .mm-pet-item:hover {
        transform:translateY(-2px);
        box-shadow:0 8px 20px rgba(80,60,100,.08);
      }

      .mm-pet-item.active {
        border-color:#b89bdf;
        background:#faf6ff;
        box-shadow:0 0 0 2px rgba(184,155,223,.12);
      }

      .mm-pet-icon {
        font-size:38px;
        line-height:1.1;
        margin-bottom:6px;
      }

      .mm-pet-name {
        font-size:12px;
        font-weight:900;
      }

      .mm-pet-rarity {
        font-size:10px;
        margin-top:4px;
        opacity:.58;
      }

      .mm-pet-accessory-grid {
        display:grid;
        grid-template-columns:repeat(4,minmax(0,1fr));
        gap:8px;
      }

      .mm-accessory {
        border:1px solid #eee8f4;
        border-radius:16px;
        padding:10px 6px;
        text-align:center;
        background:white;
        cursor:pointer;
      }

      .mm-accessory.active {
        border-color:#b89bdf;
        background:#faf6ff;
      }

      .mm-accessory.owned {
        border-color:#d7c5eb;
      }

      .mm-accessory-icon {
        font-size:26px;
      }

      .mm-accessory-name {
        font-size:10px;
        font-weight:800;
        margin-top:5px;
      }

      .mm-fragment {
        display:flex;
        align-items:center;
        justify-content:space-between;
        gap:10px;
        padding:11px 0;
        border-bottom:1px solid #eeeaf1;
      }

      .mm-fragment:last-child {
        border-bottom:0;
      }

      .mm-quest {
        background:rgba(255,255,255,.9);
        border-radius:20px;
        padding:14px;
        margin-bottom:10px;
        border:1px solid #eee8f4;
      }

      .mm-quest.completed {
        background:#faf6ff;
        border-color:#d9c9eb;
      }

      .mm-quest-top {
        display:flex;
        gap:12px;
      }

      .mm-quest-icon {
        font-size:30px;
        width:42px;
        text-align:center;
      }

      .mm-quest-body {
        flex:1;
      }

      .mm-quest-name {
        font-weight:900;
        font-size:14px;
      }

      .mm-quest-desc {
        font-size:11px;
        opacity:.65;
        margin-top:4px;
      }

      .mm-quest-progress {
        height:7px;
        background:#eeeaf2;
        border-radius:999px;
        overflow:hidden;
        margin-top:9px;
      }

      .mm-quest-progress > div {
        height:100%;
        background:linear-gradient(90deg,#b89cdf,#dfb9df);
        border-radius:999px;
      }

      .mm-quest-bottom {
        display:flex;
        align-items:center;
        justify-content:space-between;
        gap:8px;
        margin-top:8px;
        font-size:11px;
      }

      .mm-gacha-result {
        display:none;
        margin-top:12px;
        padding:16px;
        border-radius:20px;
        background:linear-gradient(135deg,#fff8fb,#f7f1ff);
        text-align:center;
      }

      .mm-gacha-result.show {
        display:block;
        animation:mmPetPop .25s ease-out;
      }

      @keyframes mmPetPop {
        from {
          opacity:0;
          transform:translateY(8px) scale(.98);
        }
        to {
          opacity:1;
          transform:none;
        }
      }

      .mm-probability {
        display:grid;
        gap:7px;
        margin-top:10px;
      }

      .mm-probability-row {
        display:flex;
        justify-content:space-between;
        align-items:center;
        padding:8px 10px;
        border-radius:12px;
        background:#faf8fc;
        font-size:11px;
      }

      .mm-probability-row strong {
        font-size:12px;
      }

      .mm-pet-room {
        min-height:360px;
        border-radius:26px;
        padding:20px;
        position:relative;
        overflow:hidden;
        background:
          radial-gradient(circle at 80% 18%,rgba(255,255,255,.95) 0 5%,transparent 6%),
          linear-gradient(180deg,#eadcf4 0 58%,#d8c0a4 58% 100%);
      }

      .mm-pet-room::after {
        content:"";
        position:absolute;
        inset:auto 0 0 0;
        height:42%;
        background:
          radial-gradient(circle at 20% 40%,rgba(255,255,255,.55) 0 2%,transparent 2.5%),
          radial-gradient(circle at 70% 70%,rgba(255,255,255,.4) 0 2%,transparent 2.5%);
        pointer-events:none;
      }

      .mm-pet-room-header {
        position:relative;
        z-index:2;
        display:flex;
        justify-content:space-between;
        align-items:center;
      }

      .mm-pet-room-title {
        font-size:20px;
        font-weight:1000;
      }

      .mm-room-pet {
        position:relative;
        z-index:2;
        font-size:92px;
        text-align:center;
        margin-top:45px;
        filter:drop-shadow(0 15px 10px rgba(60,40,70,.16));
      }

      .mm-room-furniture {
        position:absolute;
        z-index:1;
        bottom:55px;
        left:12%;
        width:76%;
        display:flex;
        justify-content:space-between;
        align-items:flex-end;
      }

      .mm-room-bed {
        width:145px;
        height:62px;
        border-radius:28px 28px 12px 12px;
        background:#f6c7d7;
        box-shadow:0 8px 0 rgba(130,90,100,.12);
      }

      .mm-room-table {
        width:80px;
        height:65px;
        border-radius:12px;
        background:#b98b72;
        box-shadow:0 8px 0 rgba(80,60,50,.12);
      }

      .mm-room-plant {
        font-size:38px;
      }

      .mm-pet-room-actions {
        position:relative;
        z-index:3;
        display:flex;
        gap:8px;
        justify-content:center;
        flex-wrap:wrap;
        margin-top:15px;
      }

      .mm-tutorial {
        padding:15px;
        border-radius:18px;
        background:linear-gradient(135deg,#fff5fa,#f5efff);
        border:1px solid #eadcf5;
        margin-top:12px;
      }

      .mm-tutorial-title {
        font-weight:1000;
        margin-bottom:5px;
      }

      @media(max-width:700px) {
        .mm-pet-grid {
          grid-template-columns:repeat(3,minmax(0,1fr));
        }

        .mm-pet-accessory-grid {
          grid-template-columns:repeat(3,minmax(0,1fr));
        }

        .mm-pet-title {
          align-items:flex-start;
          flex-direction:column;
        }

        .mm-pet-currency {
          justify-content:flex-start;
        }
      }
    `;

    document.head.appendChild(
      style
    );
  }

  injectPetStyles();

  /* =========================================================
     펫 UI 생성
  ========================================================= */

  function ensurePetUI() {
    const screen =
      document.querySelector(
        '[data-screen="dress"]'
      );

    if (!screen) {
      return;
    }

    if (!petUI) {
      petUI =
        document.createElement(
          "div"
        );

      petUI.className =
        "mm-pet-ui";

      screen.appendChild(
        petUI
      );

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

    if (!screen) {
      return;
    }

    if (!questUI) {
      questUI =
        document.createElement(
          "div"
        );

      questUI.className =
        "mm-pet-ui";

      screen.appendChild(
        questUI
      );

      questUI.addEventListener(
        "click",
        handleQuestClick
      );
    }
  }

  /* =========================================================
     펫 화면
  ========================================================= */

  function renderPetUI() {
    ensurePetUI();

    if (!petUI) return;

    const owned =
      new Set(
        state.ownedPets
      );

    /*
     * 펫이 하나도 없는 신규 사용자
     */
    if (
      state.ownedPets.length === 0
    ) {
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
            text-align:center;
            padding:25px 12px 15px;
          ">

            <div style="
              font-size:70px;
              opacity:.45;
              margin-bottom:12px;
            ">
              ❔
            </div>

            <div style="
              font-size:18px;
              font-weight:1000;
            ">
              아직 함께할 펫이 없어요
            </div>

            <div style="
              font-size:13px;
              opacity:.65;
              line-height:1.7;
              margin-top:7px;
            ">
              첫 번째 펫은 특별한 방법으로 만날 수 있어요.
              <br>
              처음 한 번은 무료예요.
            </div>

            <button
              class="mm-pet-button"
              data-pet-action="first-draw"
              style="
                font-size:14px;
                padding:13px 22px;
              "
            >
              🌟 첫 번째 펫 만나기
            </button>

          </div>

          ${
            !state.firstPetTutorialDone
              ? `
                <div class="mm-tutorial">
                  <div class="mm-tutorial-title">
                    🌱 처음이라면
                  </div>

                  <div style="
                    font-size:12px;
                    line-height:1.7;
                    opacity:.7;
                  ">
                    첫 번째 뽑기는 별빛을 사용하지 않아요.
                    <br>
                    그리고 처음 만나는 친구는
                    <strong>몽글토끼</strong>로 정해져 있어요.
                  </div>
                </div>
              `
              : ""
          }

        </div>

        ${renderGachaInfo()}
      `;

      return;
    }

    /*
     * 펫 방
     */
    if (
      petView === "room"
    ) {
      renderPetRoom();
      return;
    }

    const selected =
      PETS[
        state.selectedPet
      ] || PETS.bunny;

    const acc =
      state.petAccessories[
        state.selectedPet
      ] || {
        hat: "none",
        outfit: "none"
      };

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

          <div style="
            font-size:58px;
          ">
            ${selected.icon}
          </div>

          <div style="
            flex:1;
          ">

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
              ${selected.rarity} · 지금 함께하는 친구
            </div>

            <button
              class="mm-pet-button secondary"
              data-pet-action="room"
              style="
                margin-top:8px;
              "
            >
              🏠 ${selected.name}의 방으로
            </button>

          </div>

        </div>

      </div>

      <div class="mm-pet-section">

        <div class="mm-pet-title">
          <h3>🎁 펫 뽑기</h3>
        </div>

        <div style="
          font-size:13px;
          line-height:1.7;
          opacity:.75;
        ">
          별빛은 천천히 모이는 특별한 재화예요.
          <br>
          뽑기를 하면 새로운 친구를 만날 수 있어요.
        </div>

        <button
          class="mm-pet-button"
          data-pet-action="draw"
          ${state.petCurrency < 20 ? "disabled" : ""}
        >
          ✨ 별빛 20개로 뽑기
        </button>

        ${
          state.petCurrency < 20
            ? `
              <div style="
                font-size:11px;
                opacity:.55;
                margin-top:7px;
              ">
                현재 ${state.petCurrency}/20
              · 퀘스트를 완료하면 별빛을 얻을 수 있어요.
              </div>
            `
            : ""
        }

        <div
          class="mm-gacha-result"
          id="petGachaResult"
        ></div>

      </div>

      ${renderGachaInfo()}

      <div class="mm-pet-section">

        <div class="mm-pet-title">

          <h3>📖 펫 도감</h3>

          <span style="
            font-size:12px;
            opacity:.6;
          ">
            ${state.ownedPets.length}/${PET_LIST.length}
          </span>

        </div>

        <div style="
          font-size:11px;
          opacity:.55;
          margin-bottom:10px;
        ">
          펫을 선택하면 그 친구의 방으로 이동할 수 있어요.
        </div>

        <div class="mm-pet-grid">

          ${PET_LIST.map(
            p => {
              const has =
                owned.has(
                  p.id
                );

              return `
                <div
                  class="mm-pet-item ${
                    state.selectedPet ===
                    p.id
                      ? "active"
                      : ""
                  }"
                  data-pet-action="select"
                  data-pet-id="${p.id}"
                >

                  <div class="mm-pet-icon">
                    ${
                      has
                        ? p.icon
                        : "❔"
                    }
                  </div>

                  <div class="mm-pet-name">
                    ${
                      has
                        ? p.name
                        : "???"
                    }
                  </div>

                  <div class="mm-pet-rarity">
                    ${p.rarity}
                  </div>

                  ${
                    has
                      ? `
                        <button
                          class="mm-pet-button secondary"
                          data-pet-action="room-select"
                          data-pet-id="${p.id}"
                          style="
                            width:100%;
                            margin-top:7px;
                            font-size:10px;
                            padding:8px 5px;
                          "
                        >
                          ${
                            state.selectedPet ===
                            p.id
                              ? "내 펫"
                              : "선택"
                          }
                        </button>
                      `
                      : ""
                  }

                </div>
              `;
            }
          ).join("")}

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
          아이템은 한 번 구매하면
          <strong>영구적으로 내 옷장에 들어가요.</strong>
          <br>
          이후 장착하거나 벗을 때는 다시 돈을 내지 않아요.
        </div>

        <div style="
          font-weight:800;
          font-size:13px;
          margin-bottom:7px;
        ">
          🎩 모자
        </div>

        <div class="mm-pet-accessory-grid">

          ${Object.values(
            PET_HATS
          )
            .map(
              h => {
                const isOwned =
                  h.id ===
                  "none" ||
                  state
                    .ownedPetAccessories
                    .hats
                    .includes(
                      h.id
                    );

                const isActive =
                  acc.hat ===
                  h.id;

                return `
                  <div
                    class="mm-accessory ${
                      isActive
                        ? "active"
                        : ""
                    } ${
                      isOwned
                        ? "owned"
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
                      h.id ===
                      "none"
                        ? `
                          <div style="
                            font-size:10px;
                            opacity:.5;
                            margin-top:3px;
                          ">
                            장착 해제
                          </div>
                        `
                        : isOwned
                          ? `
                            <div style="
                              font-size:10px;
                              color:#8b72aa;
                              margin-top:3px;
                              font-weight:900;
                            ">
                              ${
                                isActive
                                  ? "장착 중"
                                  : "보유 중"
                              }
                            </div>
                          `
                          : `
                            <div style="
                              font-size:10px;
                              opacity:.55;
                              margin-top:3px;
                            ">
                              🪙 ${h.price}
                            </div>
                          `
                    }

                  </div>
                `;
              }
            )
            .join("")}

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

          ${Object.values(
            PET_OUTFITS
          )
            .map(
              o => {
                const isOwned =
                  o.id ===
                  "none" ||
                  state
                    .ownedPetAccessories
                    .outfits
                    .includes(
                      o.id
                    );

                const isActive =
                  acc.outfit ===
                  o.id;

                return `
                  <div
                    class="mm-accessory ${
                      isActive
                        ? "active"
                        : ""
                    } ${
                      isOwned
                        ? "owned"
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
                      o.id ===
                      "none"
                        ? `
                          <div style="
                            font-size:10px;
                            opacity:.5;
                            margin-top:3px;
                          ">
                            장착 해제
                          </div>
                        `
                        : isOwned
                          ? `
                            <div style="
                              font-size:10px;
                              color:#8b72aa;
                              margin-top:3px;
                              font-weight:900;
                            ">
                              ${
                                isActive
                                  ? "장착 중"
                                  : "보유 중"
                              }
                            </div>
                          `
                          : `
                            <div style="
                              font-size:10px;
                              opacity:.55;
                              margin-top:3px;
                            ">
                              🪙 ${o.price}
                            </div>
                          `
                    }

                  </div>
                `;
              }
            )
            .join("")}

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
          펫 코인으로 원하는 펫의 조각을 모을 수 있어요.
          조각을 충분히 모으면 펫을 직접 합성할 수 있어요.
        </div>

        ${PET_LIST
          .filter(
            p =>
              p.id !==
              "bunny"
          )
          .map(
            p => {
              const fragments =
                Number(
                  state
                    .petFragments[
                      p.id
                    ] || 0
                );

              const canCraft =
                fragments >=
                p.fragmentNeed;

              return `
                <div class="mm-fragment">

                  <div>

                    <div style="
                      font-weight:800;
                    ">
                      ${p.icon}
                      ${p.name}
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
                      ${
                        state.petCoins < 5
                          ? "disabled"
                          : ""
                      }
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
                      ${
                        !canCraft ||
                        owned.has(
                          p.id
                        )
                          ? "disabled"
                          : ""
                      }
                    >
                      ${
                        owned.has(
                          p.id
                        )
                          ? "보유 중"
                          : "합성"
                      }
                    </button>

                  </div>

                </div>
              `;
            }
          )
          .join("")}

      </div>
    `;
  }

  /* =========================================================
     확률 UI
  ========================================================= */

  function renderGachaInfo() {
    return `
      <div class="mm-pet-section">

        <div class="mm-pet-title">
          <h3>📊 뽑기 확률</h3>
          <span style="
            font-size:11px;
            opacity:.55;
          ">
            일반 뽑기 기준
          </span>
        </div>

        <div style="
          font-size:11px;
          line-height:1.6;
          opacity:.6;
        ">
          확률은 항상 공개되어 있어요.
          첫 번째 무료 튜토리얼 뽑기는
          확률과 관계없이 몽글토끼가 등장해요.
        </div>

        <div class="mm-probability">

          ${PET_RARITY_INFO.map(
            r => `
              <div class="mm-probability-row">

                <span>
                  ${r.name}
                </span>

                <strong>
                  ${r.rate}%
                </strong>

              </div>
            `
          ).join("")}

        </div>

      </div>
    `;
  }

  /* =========================================================
     펫 방
  ========================================================= */

  function renderPetRoom() {
    const selected =
      PETS[
        state.selectedPet
      ];

    if (!selected) {
      petView = "main";
      renderPetUI();
      return;
    }

    petUI.innerHTML = `

      <div class="mm-pet-section">

        <div class="mm-pet-title">

          <h3>🏠 ${selected.name}의 방</h3>

          <span style="
            font-size:12px;
            opacity:.55;
          ">
            ${selected.rarity}
          </span>

        </div>

        <div class="mm-pet-room">

          <div class="mm-pet-room-header">

            <div class="mm-pet-room-title">
              포근한 작은 방
            </div>

            <button
              class="mm-pet-button secondary"
              data-pet-action="back"
              style="
                margin:0;
              "
            >
              ← 펫 화면
            </button>

          </div>

          <div class="mm-room-pet">
            ${selected.icon}
          </div>

          <div class="mm-room-furniture">

            <div>
              <div class="mm-room-bed"></div>
              <div style="
                text-align:center;
                font-size:11px;
                margin-top:4px;
                opacity:.65;
              ">
                포근한 침대
              </div>
            </div>

            <div class="mm-room-plant">
              🌿
            </div>

            <div>
              <div class="mm-room-table"></div>
              <div style="
                text-align:center;
                font-size:11px;
                margin-top:4px;
                opacity:.65;
              ">
                작은 테이블
              </div>
            </div>

          </div>

        </div>

        <div class="mm-pet-room-actions">

          <button
            class="mm-pet-button"
            data-pet-action="interact-pet"
          >
            💗 ${selected.name}와 놀기
          </button>

          <button
            class="mm-pet-button secondary"
            data-pet-action="customize"
          >
            🎀 펫 꾸미기
          </button>

        </div>

      </div>

      <div class="mm-pet-section">

        <div class="mm-pet-title">
          <h3>🛋️ 방 꾸미기</h3>
        </div>

        <div style="
          font-size:12px;
          opacity:.65;
          line-height:1.6;
        ">
          지금은 기본 방부터 시작해요.
          앞으로 펫별 가구와 벽지, 바닥을
          더 추가할 수 있도록 만들어 둔 구조예요.
        </div>

        <div class="mm-pet-accessory-grid"
             style="margin-top:12px;">

          <div
            class="mm-accessory active"
            data-pet-action="room-decor"
            data-room-decor="lavender"
          >
            <div class="mm-accessory-icon">
              💜
            </div>
            <div class="mm-accessory-name">
              라벤더
            </div>
          </div>

          <div
            class="mm-accessory"
            data-pet-action="room-decor"
            data-room-decor="peach"
          >
            <div class="mm-accessory-icon">
              🍑
            </div>
            <div class="mm-accessory-name">
              피치
            </div>
          </div>

          <div
            class="mm-accessory"
            data-pet-action="room-decor"
            data-room-decor="mint"
          >
            <div class="mm-accessory-icon">
              🌿
            </div>
            <div class="mm-accessory-name">
              민트
            </div>
          </div>

        </div>

      </div>
    `;
  }

  /* =========================================================
     펫 클릭
  ========================================================= */

  function handlePetClick(e) {
    const target =
      e.target.closest(
        "[data-pet-action]"
      );

    if (!target) {
      return;
    }

    const action =
      target.dataset.petAction;

    if (
      action ===
      "first-draw"
    ) {
      firstPetDraw();
      return;
    }

    if (
      action ===
      "draw"
    ) {
      drawPet();
      return;
    }

    if (
      action ===
      "select" ||
      action ===
      "room-select"
    ) {
      const id =
        target.dataset.petId;

      if (!id) return;

      if (
        !state.ownedPets.includes(
          id
        )
      ) {
        return;
      }

      selectPet(id);

      if (
        action ===
        "room-select"
      ) {
        petView =
          "room";
      }

      renderPetUI();

      return;
    }

    if (
      action ===
      "room"
    ) {
      petView =
        "room";

      renderPetUI();

      return;
    }

    if (
      action ===
      "back"
    ) {
      petView =
        "main";

      renderPetUI();

      return;
    }

    if (
      action ===
      "customize"
    ) {
      petView =
        "main";

      renderPetUI();

      return;
    }

    if (
      action ===
      "interact-pet"
    ) {
      interactWithPet();
      return;
    }

    if (
      action ===
      "hat"
    ) {
      equipPetHat(
        target.dataset.accessory
      );

      return;
    }

    if (
      action ===
      "outfit"
    ) {
      equipPetOutfit(
        target.dataset.accessory
      );

      return;
    }

    if (
      action ===
      "fragment"
    ) {
      buyFragment(
        target.dataset.petId
      );

      return;
    }

    if (
      action ===
      "craft"
    ) {
      craftPet(
        target.dataset.petId
      );

      return;
    }

    if (
      action ===
      "room-decor"
    ) {
      state.petRoomDecor.wall =
        target.dataset.roomDecor;

      save();

      toast(
        "펫 방 분위기를 바꿨어요."
      );

      return;
    }
  }

  /* =========================================================
     첫 번째 무료 펫
  ========================================================= */

  function firstPetDraw() {
    /*
     * 이미 펫을 가지고 있는 사용자는
     * 기존 데이터를 건드리지 않는다.
     */
    if (
      state.ownedPets.length > 0
    ) {
      if (
        state.selectedPet
      ) {
        petView =
          "room";

        renderPetUI();
      }

      return;
    }

    state.ownedPets = [
      "bunny"
    ];

    state.selectedPet =
      "bunny";

    state.petAccessories.bunny =
      {
        hat: "none",
        outfit: "none"
      };

    state.firstPetTutorialDone =
      true;

    state.stats.petDraws =
      (state.stats.petDraws || 0) +
      1;

    createPetModel(
      "bunny"
    );

    save();

    showGachaResult(
      "첫 번째 친구 등장!",
      "🐰 몽글토끼",
      "처음 만난 친구는 몽글토끼예요. 이제 함께 작은 마을을 돌아다녀 보세요!"
    );

    petView =
      "room";

    renderPetUI();

    toast(
      "무료 첫 뽑기 완료! 몽글토끼가 함께해요."
    );
  }

  /* =========================================================
     일반 펫 뽑기
  ========================================================= */

  function drawPet() {
    const COST = 20;

    if (
      state.petCurrency <
      COST
    ) {
      toast(
        "별빛이 부족해요. 퀘스트를 완료해 보세요!"
      );

      return;
    }

    state.petCurrency -=
      COST;

    state.stats.petDraws =
      (state.stats.petDraws || 0) +
      1;

    const roll =
      Math.random() * 100;

    let sum = 0;

    let result =
      PETS.puppy;

    for (
      const petData of PET_LIST
    ) {
      if (
        petData.id ===
        "bunny"
      ) {
        continue;
      }

      sum +=
        petData.rate;

      if (
        roll <=
        sum
      ) {
        result =
          petData;

        break;
      }
    }

    /*
     * 중복
     */
    if (
      state.ownedPets.includes(
        result.id
      )
    ) {
      state.petCoins +=
        result.duplicateCoins;

      save();

      showGachaResult(
        "중복 펫!",
        `${result.icon} ${result.name}`,
        `이미 가지고 있는 친구예요. 대신 🪙 펫 코인 ${result.duplicateCoins}개를 받았어요.`
      );

      return;
    }

    /*
     * 신규
     */
    state.ownedPets.push(
      result.id
    );

    state.petAccessories[
      result.id
    ] = {
      hat: "none",
      outfit: "none"
    };

    state.selectedPet =
      result.id;

    createPetModel(
      result.id
    );

    save();

    showGachaResult(
      "새로운 친구 등장!",
      `${result.icon} ${result.name}`,
      `${result.rarity} 펫을 새롭게 만났어요! 이제 도감에 등록되었어요.`
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

    if (!result) {
      return;
    }

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
        line-height:1.6;
      ">
        ${description}
      </div>
    `;

    result.classList.add(
      "show"
    );

    clearTimeout(
      petResultTimer
    );

    petResultTimer =
      setTimeout(
        () => {
          result.classList.remove(
            "show"
          );
        },
        5000
      );
  }

  /* =========================================================
     펫 선택
  ========================================================= */

  function selectPet(
    id
  ) {
    if (
      !PETS[id] ||
      !state.ownedPets.includes(
        id
      )
    ) {
      return;
    }

    state.selectedPet =
      id;

    if (
      !state.petAccessories[id]
    ) {
      state.petAccessories[id] =
        {
          hat: "none",
          outfit: "none"
        };
    }

    createPetModel(
      id
    );

    save();

    toast(
      `${PETS[id].name}과 함께할게요.`
    );
  }

  /* =========================================================
     펫과 놀기
  ========================================================= */

  function interactWithPet() {
    if (
      !state.selectedPet
    ) {
      return;
    }

    state.stats.petInteractions =
      (state.stats.petInteractions || 0) +
      1;

    /*
     * 별빛은 너무 쉽게 쌓이지 않도록
     * 일반 상호작용에서는 별빛을 주지 않는다.
     */
    xp(4);

    save();

    toast(
      `${PETS[state.selectedPet].name}와 포근하게 놀았어요.`
    );
  }

  /* =========================================================
     액세서리 구매 / 장착
  ========================================================= */

  function equipPetHat(
    id
  ) {
    const item =
      PET_HATS[id];

    if (!item) return;

    const petId =
      state.selectedPet;

    if (!petId) {
      toast(
        "먼저 펫을 선택해 주세요."
      );

      return;
    }

    if (
      !state.petAccessories[
        petId
      ]
    ) {
      state.petAccessories[
        petId
      ] = {
        hat: "none",
        outfit: "none"
      };
    }

    /*
     * 없음 = 무료 해제
     */
    if (
      id === "none"
    ) {
      state.petAccessories[
        petId
      ].hat = "none";

      createPetModel(
        petId
      );

      save();

      toast(
        "모자를 벗었어요."
      );

      return;
    }

    const owned =
      state
        .ownedPetAccessories
        .hats.includes(
          id
        );

    /*
     * 아직 구매하지 않았다면
     * 딱 한 번만 비용 지불
     */
    if (!owned) {
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

      state
        .ownedPetAccessories
        .hats
        .push(id);

      toast(
        `${item.name}을 구매했어요!`
      );
    }

    /*
     * 구매 후에는 무료 장착
     */
    state.petAccessories[
      petId
    ].hat = id;

    createPetModel(
      petId
    );

    save();

    if (owned) {
      toast(
        `${item.name}을 장착했어요.`
      );
    }
  }

  function equipPetOutfit(
    id
  ) {
    const item =
      PET_OUTFITS[id];

    if (!item) return;

    const petId =
      state.selectedPet;

    if (!petId) {
      toast(
        "먼저 펫을 선택해 주세요."
      );

      return;
    }

    if (
      !state.petAccessories[
        petId
      ]
    ) {
      state.petAccessories[
        petId
      ] = {
        hat: "none",
        outfit: "none"
      };
    }

    if (
      id === "none"
    ) {
      state.petAccessories[
        petId
      ].outfit =
        "none";

      createPetModel(
        petId
      );

      save();

      toast(
        "옷을 벗었어요."
      );

      return;
    }

    const owned =
      state
        .ownedPetAccessories
        .outfits.includes(
          id
        );

    if (!owned) {
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

      state
        .ownedPetAccessories
        .outfits
        .push(id);

      toast(
        `${item.name}을 구매했어요!`
      );
    }

    state.petAccessories[
      petId
    ].outfit = id;

    createPetModel(
      petId
    );

    save();

    if (owned) {
      toast(
        `${item.name}을 장착했어요.`
      );
    }
  }

  /* =========================================================
     펫 조각
  ========================================================= */

  function buyFragment(
    petId
  ) {
    const data =
      PETS[petId];

    if (!data) return;

    if (
      state.petCoins <
      5
    ) {
      toast(
        "펫 코인이 부족해요."
      );

      return;
    }

    state.petCoins -=
      5;

    state.petFragments[
      petId
    ] =
      Number(
        state.petFragments[
          petId
        ] || 0
      ) + 1;

    save();

    toast(
      `${data.icon} ${data.name} 조각을 얻었어요!`
    );
  }

  function craftPet(
    petId
  ) {
    const data =
      PETS[petId];

    if (!data) return;

    const current =
      Number(
        state.petFragments[
          petId
        ] || 0
      );

    if (
      current <
      data.fragmentNeed
    ) {
      toast(
        `조각이 ${
          data.fragmentNeed -
          current
        }개 더 필요해요.`
      );

      return;
    }

    if (
      state.ownedPets.includes(
        petId
      )
    ) {
      toast(
        "이미 가지고 있는 펫이에요."
      );

      return;
    }

    state.petFragments[
      petId
    ] =
      current -
      data.fragmentNeed;

    state.ownedPets.push(
      petId
    );

    state.petAccessories[
      petId
    ] = {
      hat: "none",
      outfit: "none"
    };

    state.selectedPet =
      petId;

    createPetModel(
      petId
    );

    save();

    toast(
      `${data.icon} ${data.name}을 합성했어요!`
    );
  }

  /* =========================================================
     퀘스트 UI
  ========================================================= */

  function getQuestGoal(
    quest
  ) {
    if (
      quest.type ===
      "repeat"
    ) {
      return quest.goal;
    }

    const stage =
      Number(
        state.questStages[
          quest.id
        ] || 0
      );

    const index =
      Math.min(
        stage,
        quest.goals.length - 1
      );

    return quest.goals[
      index
    ];
  }

  function isQuestClaimed(
    quest
  ) {
    if (
      quest.type ===
      "repeat"
    ) {
      return false;
    }

    return false;
  }

  function renderQuestUI() {
    ensureQuestUI();

    if (!questUI) {
      return;
    }

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
          line-height:1.7;
          opacity:.7;
        ">
          별빛은 펫 뽑기에 사용하는 특별한 재화예요.
          <br>
          퀘스트는 완료하면 다시 진행하거나
          다음 단계로 넘어가요.
        </div>

      </div>

      ${QUESTS.map(
        quest => {
          const progress =
            Math.max(
              0,
              Number(
                quest.getProgress()
              )
            );

          const goal =
            getQuestGoal(
              quest
            );

          const completed =
            progress >=
            goal;

          const percent =
            Math.min(
              100,
              progress /
                goal *
                100
            );

          const stage =
            Number(
              state.questStages[
                quest.id
              ] || 0
            );

          return `
            <div class="mm-quest ${
              completed
                ? "completed"
                : ""
            }">

              <div class="mm-quest-top">

                <div class="mm-quest-icon">
                  ${quest.icon}
                </div>

                <div class="mm-quest-body">

                  <div class="mm-quest-name">
                    ${quest.title}
                    ${
                      quest.type ===
                      "stage"
                        ? `
                          <span style="
                            font-size:9px;
                            opacity:.45;
                            margin-left:4px;
                          ">
                            STAGE ${stage + 1}
                          </span>
                        `
                        : ""
                    }
                  </div>

                  <div class="mm-quest-desc">
                    ${quest.description}
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
                      ${Math.min(
                        progress,
                        goal
                      )} / ${goal}
                    </span>

                    <span>
                      ✨ +${
                        quest.rewardPetCurrency
                      }
                      ${
                        quest.rewardCoins > 0
                          ? ` · 🪙 +${quest.rewardCoins}`
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
                      data-quest-id="${quest.id}"
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

                </div>

              </div>

            </div>
          `;
        }
      ).join("")}
    `;
  }

  function handleQuestClick(
    e
  ) {
    const button =
      e.target.closest(
        "[data-quest-action]"
      );

    if (!button) {
      return;
    }

    if (
      button.dataset
        .questAction !==
      "claim"
    ) {
      return;
    }

    claimQuest(
      button.dataset.questId
    );
  }

  function claimQuest(
    id
  ) {
    const quest =
      QUESTS.find(
        q =>
          q.id === id
      );

    if (!quest) {
      return;
    }

    const progress =
      Number(
        quest.getProgress()
      );

    const goal =
      getQuestGoal(
        quest
      );

    /*
     * 미완료면 절대 보상을 주지 않는다.
     */
    if (
      progress <
      goal
    ) {
      toast(
        "아직 퀘스트를 완료하지 않았어요."
      );

      return;
    }

    /*
     * 반복 퀘스트
     * 현재 진행량에서 목표만큼 소비해서
     * 다시 0부터 진행되는 느낌을 만든다.
     *
     * 실제 통계는 유지하고
     * questRepeatBase에 기준점을 저장한다.
     */
    if (
      quest.type ===
      "repeat"
    ) {
      if (
        !state.questRepeatBase
      ) {
        state.questRepeatBase =
          {};
      }

      const base =
        Number(
          state.questRepeatBase[
            id
          ] || 0
        );

      const available =
        progress -
        base;

      if (
        available <
        goal
      ) {
        toast(
          "아직 퀘스트를 완료하지 않았어요."
        );

        return;
      }

      state.questRepeatBase[
        id
      ] =
        base +
        goal;
    } else {
      /*
       * 단계형 퀘스트
       */
      const currentStage =
        Number(
          state.questStages[
            id
          ] || 0
        );

      const nextStage =
        currentStage + 1;

      state.questStages[
        id
      ] =
        Math.min(
          nextStage,
          quest.goals.length
        );
    }

    state.petCurrency +=
      quest.rewardPetCurrency;

    state.coins +=
      quest.rewardCoins;

    xp(10);

    save();

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
     UI 업데이트
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
          ? moodNames[
              state.mood
            ]
          : "기분을 기록하지 않아도 괜찮아요.";
    }

    document
      .querySelectorAll(
        ".mood"
      )
      .forEach(b => {
        b.classList.toggle(
          "selected",
          b.dataset.mood ===
            state.mood
        );
      });

    document
      .querySelectorAll(
        ".nav-item"
      )
      .forEach(b => {
        b.classList.toggle(
          "active",
          b.dataset.nav ===
            state.nav
        );
      });

    document
      .querySelectorAll(
        "[data-room-decor]"
      )
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
        ] ||
        "나만의 방";
    }

    renderPetUI();
    renderQuestUI();
  }

  /* =========================================================
     토스트
  ========================================================= */

  function toast(
    text
  ) {
    const e =
      $("toast");

    if (!e) {
      return;
    }

    e.textContent =
      text;

    e.classList.add(
      "show"
    );

    clearTimeout(
      toastTimer
    );

    toastTimer =
      setTimeout(
        () => {
          e.classList.remove(
            "show"
          );
        },
        2400
      );
  }

  /* =========================================================
     경험치
  ========================================================= */

  function levelUp() {
    while (
      state.xp >= 100
    ) {
      state.xp -=
        100;

      state.level++;

      state.coins +=
        15;

      toast(
        "레벨 업! 코인 +15"
      );
    }
  }

  function xp(
    n
  ) {
    state.xp +=
      n;

    levelUp();
  }

  /* =========================================================
     대화창
  ========================================================= */

  function closeDialog() {
    const dialog =
      $("dialog");

    if (dialog) {
      dialog.hidden =
        true;
    }
  }

  const closeDialogButton =
    $("closeDialog");

  if (
    closeDialogButton
  ) {
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
    const nameEl =
      $("dialogName");

    const textEl =
      $("dialogText");

    const actionsEl =
      $("dialogActions");

    const dialogEl =
      $("dialog");

    if (
      !nameEl ||
      !textEl ||
      !actionsEl ||
      !dialogEl
    ) {
      return;
    }

    nameEl.textContent =
      name;

    textEl.textContent =
      text;

    actionsEl.replaceChildren();

    actions.forEach(
      a => {
        const b =
          document.createElement(
            "button"
          );

        b.textContent =
          a.label;

        b.onclick =
          a.action;

        actionsEl.appendChild(
          b
        );
      }
    );

    dialogEl.hidden =
      false;
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

    return targets.find(
      t =>
        Math.hypot(
          avatar.position.x -
            t.x,

          avatar.position.z -
            t.z
        ) <
          t.r &&
        !(
          t.id ===
            "shell" &&
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

    if (
      t.id ===
      "garden"
    ) {
      showPage(
        "garden"
      );

      return;
    }

    if (
      t.id ===
      "animal"
    ) {
      dialog(
        "포근한 친구",
        "오늘도 잘 지냈어? 함께 천천히 놀아 보자.",
        [
          {
            label:
              "인사하기",

            action:
              () => {
                state.stats.petGreetings++;

                state.stats.petInteractions++;

                xp(5);

                save();

                closeDialog();

                toast(
                  "펫과 인사했어요. 경험치 +5"
                );
              }
          },

          {
            label:
              "펫 화면",

            action:
              () => {
                closeDialog();

                showPage(
                  "dress"
                );
              }
          },

          {
            label:
              "닫기",

            action:
              closeDialog
          }
        ]
      );

      return;
    }

    if (
      t.id ===
      "shell"
    ) {
      state.foundShell =
        true;

      state.stats.shellFinds++;

      state.coins +=
        8;

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
          label:
            "정원 둘러보기",

          action:
            () => {
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
            "펫 화면",

          action:
            () => {
              closeDialog();

              showPage(
                "dress"
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
     페이지 이동
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
      page =
        "home";
    }

    state.nav =
      page;

    /*
     * 기존 HTML 화면을 그대로 사용
     */
    document
      .querySelectorAll(
        "[data-screen]"
      )
      .forEach(
        el => {
          el.hidden =
            el.dataset.screen !==
            page;
        }
      );

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
      .querySelectorAll(
        ".nav-item"
      )
      .forEach(
        b => {
          b.classList.toggle(
            "active",
            b.dataset.nav ===
              page
          );
        }
      );

    /*
     * 캐릭터 꾸미기 관련 기존 UI가 HTML에 남아 있다면
     * 숨긴다.
     */
    if (
      page ===
      "dress"
    ) {
      document
        .querySelectorAll(
          ".character-outfit,.outfit-section"
        )
        .forEach(
          el =>
            el.style.display =
              "none"
        );
    }

    /*
     * 화면 이동 시 저장하되
     * UI 무한 재렌더링은 방지
     */
    try {
      localStorage.setItem(
        "mongleMindSave",
        JSON.stringify(
          state
        )
      );
    } catch (e) {}

    if (
      page ===
      "village"
    ) {
      requestAnimationFrame(
        () =>
          resize()
      );
    }

    if (
      page ===
      "home"
    ) {
      window.scrollTo({
        top: 0,
        behavior:
          "smooth"
      });
    }
  }

  document
    .querySelectorAll(
      "[data-page]"
    )
    .forEach(
      b => {
        b.addEventListener(
          "click",
          () =>
            showPage(
              b.dataset.page
            )
        );
      }
    );

  document
    .querySelectorAll(
      ".nav-item"
    )
    .forEach(
      b => {
        b.addEventListener(
          "click",
          () =>
            showPage(
              b.dataset.nav
            )
        );
      }
    );

  document
    .querySelectorAll(
      "[data-home]"
    )
    .forEach(
      b => {
        b.addEventListener(
          "click",
          () =>
            showPage(
              "home"
            )
        );
      }
    );

  /* =========================================================
     정원
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
    .forEach(
      b => {
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
     호흡
  ========================================================= */

  function stopBreath() {
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
          $(
            "breathInstruction"
          );

        if (instruction) {
          instruction.textContent =
            "편안한 만큼만 따라 해요. 언제든 그만할 수 있어요.";
        }

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
          if (!breathing) {
            return;
          }

          const s =
            steps[
              breathStep++ %
                2
            ];

          if (t) {
            t.textContent =
              s[0];
          }

          if (c) {
            c.classList.toggle(
              "expand",
              s[1]
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
            () => {
              if (
                !breathing
              ) {
                return;
              }

              state.stats.breaths++;

              save();

              stopBreath();

              toast(
                "호흡 활동을 끝까지 완료했어요. 퀘스트에 반영됐어요!"
              );
            },
            30000
          );
      };
  }

  const stopBreathButton =
    $("stopBreath");

  if (
    stopBreathButton
  ) {
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
        ].includes(
          e.key
        )
      ) {
        e.preventDefault();
      }

      const dialogEl =
        $("dialog");

      if (
        e.key.toLowerCase() ===
          "e" &&
        dialogEl &&
        dialogEl.hidden
      ) {
        interact();
      }

      if (
        e.key ===
        "Escape"
      ) {
        closeDialog();
      }
    }
  );

  window.addEventListener(
    "keyup",
    e =>
      (keys[
        e.key.toLowerCase()
      ] = false)
  );

  window.addEventListener(
    "blur",
    () =>
      (keys = {})
  );

  /* =========================================================
     화면 이동 버튼
  ========================================================= */

  document
    .querySelectorAll(
      ".touch-pad button"
    )
    .forEach(
      b => {
        const k =
          b.dataset.k.toLowerCase();

        const start =
          e => {
            e.preventDefault();

            keys[k] =
              true;
          };

        const end =
          e => {
            e.preventDefault();

            keys[k] =
              false;
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
      }
    );

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
          (e.clientX -
            r.left) /
              r.width *
              2 -
            1,

          -(
            (e.clientY -
              r.top) /
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

  if (
    state.foundShell
  ) {
    shell.visible =
      false;
  }

  /*
   * 펫이 없으면 마을에서도 안 보이게 한다.
   */
  if (
    !state.selectedPet ||
    !state.ownedPets.includes(
      state.selectedPet
    )
  ) {
    pet.visible =
      false;
  }

  /* =========================================================
     UI 첫 렌더링
  ========================================================= */

  showPage(
    state.nav ||
      "home"
  );

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

  if (
    typeof ResizeObserver !==
    "undefined"
  ) {
    new ResizeObserver(
      resize
    ).observe(root);
  }

  resize();

  /* =========================================================
     자동 UI 갱신
  ========================================================= */

  setInterval(
    () => {
      if (
        state.nav ===
          "dress" ||
        state.nav ===
          "quests"
      ) {
        updateUI();
      }
    },
    2500
  );

  /* =========================================================
     게임 루프
  ========================================================= */

  function animate(t) {
    requestAnimationFrame(
      animate
    );

    const dt =
      Math.min(
        (t - last) /
            1000 ||
          0,
        0.05
      );

    last = t;

    let moving =
      false;

    const dialogEl =
      $("dialog");

    if (
      !dialogEl ||
      dialogEl.hidden
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
          v.length() <
          0.2
        ) {
          avatar.userData.dest =
            null;
        } else {
          v.normalize();

          dx =
            v.x;

          dz =
            v.z;
        }
      }

      if (
        dx ||
        dz
      ) {
        const len =
          Math.hypot(
            dx,
            dz
          );

        dx /=
          len;

        dz /=
          len;

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
      }
    }

    /* =======================================================
       캐릭터 걷기
    ======================================================= */

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
        loadedCharacter
          .position
          .y;

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
            walkPhase *
              2
          )
        ) *
        0.055 *
        walkBlend;

      const idle =
        Math.sin(
          t *
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

    /* =======================================================
       펫 따라오기
    ======================================================= */

    if (
      pet.visible
    ) {
      const targetX =
        avatar.position.x +
        0.9;

      const targetZ =
        avatar.position.z +
        1;

      pet.position.x =
        THREE.MathUtils.damp(
          pet.position.x,
          targetX,
          5,
          dt
        );

      pet.position.z =
        THREE.MathUtils.damp(
          pet.position.z,
          targetZ,
          5,
          dt
        );

      pet.position.y =
        Math.abs(
          Math.sin(
            t *
              0.003
          )
        ) *
        0.05;

      pet.rotation.y =
        Math.sin(
          t *
            0.001
        ) *
        0.15;
    }

    /* =======================================================
       카메라
    ======================================================= */

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

    /* =======================================================
       상호작용 안내
    ======================================================= */

    const near =
      target();

    if (sceneStatus) {
      sceneStatus.textContent =
        near
          ? `E · ${near.label}`
          : "나만의 속도로 산책해요";
    }

    /* =======================================================
       저장 위치
    ======================================================= */

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
