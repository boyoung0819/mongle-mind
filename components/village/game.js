import * as THREE from "three";
import { GLTFLoader } from "https://cdn.jsdelivr.net/npm/three@0.164.1/examples/jsm/loaders/GLTFLoader.js";

(() => {
  const root = document.getElementById("world");

  if (!root || root.dataset.ready === "1") return;
  root.dataset.ready = "1";

  const $ = (id) => document.getElementById(id);

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
    nav: "village"
  };

  let state = { ...defaults };

  try {
    const saved = JSON.parse(
      localStorage.getItem("mongleMindSave") || "null"
    );
    if (saved) state = { ...state, ...saved };
  } catch (e) {}

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

  let keys = {};
  let toastTimer;
  let breathTimer;
  let breathing = false;
  let breathStep = 0;
  let last = 0;

  // --------------------------------------------------
  // 1. 장면과 카메라
  // --------------------------------------------------

  const scene = new THREE.Scene();
  scene.background = new THREE.Color(0xd9e9f5);
  scene.fog = new THREE.Fog(0xd9e9f5, 45, 100);

  const camera = new THREE.PerspectiveCamera(
    38,
    1,
    0.1,
    150
  );

  // 카메라를 이전보다 낮추고 정면에 가깝게 배치
  camera.position.set(0, 6.5, 20);

  const renderer = new THREE.WebGLRenderer({
    antialias: true,
    alpha: false
  });

  renderer.setPixelRatio(
    Math.min(window.devicePixelRatio || 1, 2)
  );

  renderer.shadowMap.enabled = true;
  renderer.shadowMap.type = THREE.PCFSoftShadowMap;
  renderer.outputColorSpace = THREE.SRGBColorSpace;
  renderer.toneMapping = THREE.ACESFilmicToneMapping;
  renderer.toneMappingExposure = 1.12;

  root.replaceChildren(renderer.domElement);

  const hemisphere = new THREE.HemisphereLight(
    0xfff7ed,
    0x718363,
    2.2
  );

  scene.add(hemisphere);

  const sun = new THREE.DirectionalLight(0xffefd9, 2.7);
  sun.position.set(-10, 18, 12);
  sun.castShadow = true;
  sun.shadow.mapSize.set(1536, 1536);
  sun.shadow.camera.left = -25;
  sun.shadow.camera.right = 25;
  sun.shadow.camera.top = 25;
  sun.shadow.camera.bottom = -25;

  scene.add(sun);

  const fillLight = new THREE.DirectionalLight(
    0xdceaff,
    0.8
  );

  fillLight.position.set(10, 8, -8);
  scene.add(fillLight);

  // --------------------------------------------------
  // 2. 재사용할 재질과 도형
  // --------------------------------------------------

  const M = (color, extra = {}) =>
    new THREE.MeshStandardMaterial({
      color,
      roughness: 0.86,
      ...extra
    });

  const mat = {
    grass: M(0xa8ce91),
    grassLight: M(0xb8d9a0),
    grassDark: M(0x8fb77e),

    path: M(0xe8d9c1),
    pathLight: M(0xf8ebd7),
    stone: M(0xd7cbb8),

    wood: M(0x986b50),
    woodLight: M(0xb98a66),

    wall: M(0xffead7),
    wallPink: M(0xf6d8d2),

    roof: M(0xc98393),
    roofLight: M(0xe5a5ae),

    leaf: M(0x729d70),
    leaf2: M(0x98bf84),
    leaf3: M(0xb7d39a),
    leafDark: M(0x5e895f),

    water: M(0x9bd9df, {
      roughness: 0.25,
      metalness: 0.05
    }),

    white: M(0xfffaf1),
    cream: M(0xffefd8),

    pink: M(0xf0b4c8),
    pinkDark: M(0xd88eaa),
    yellow: M(0xffdc83),
    lilac: M(0xc5a6e8),
    blue: M(0x9ccfe0),
    orange: M(0xf1b47f),

    dark: M(0x4a3b42),
    gold: M(0xf1c76f)
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
    const object = new THREE.Mesh(geometry, material);

    object.position.set(x, y, z);
    object.scale.set(sx, sy, sz);

    object.castShadow = true;
    object.receiveShadow = true;

    parent.add(object);

    return object;
  }

  function box(
    parent,
    x, y, z,
    width, height, depth,
    material
  ) {
    return add(
      new THREE.BoxGeometry(width, height, depth),
      material,
      parent,
      x, y, z
    );
  }

  function ball(
    parent,
    x, y, z,
    sx, sy, sz,
    material
  ) {
    return add(
      new THREE.SphereGeometry(1, 18, 14),
      material,
      parent,
      x, y, z,
      sx, sy, sz
    );
  }

  function cylinder(
    parent,
    x, y, z,
    topRadius,
    bottomRadius,
    height,
    material
  ) {
    return add(
      new THREE.CylinderGeometry(
        topRadius,
        bottomRadius,
        height,
        12
      ),
      material,
      parent,
      x, y, z
    );
  }

  // --------------------------------------------------
  // 3. 잔디밭과 산책로
  // --------------------------------------------------

  const ground = add(
    new THREE.PlaneGeometry(100, 100),
    mat.grass,
    scene,
    0, -0.13, 0
  );

  ground.rotation.x = -Math.PI / 2;
  ground.receiveShadow = true;

  // 산책로를 조금 더 자연스럽게 배치
  const pathPoints = [
    [0, 10, 4.8, 2.1],
    [0, 7, 4.5, 2.1],
    [0, 4, 4.4, 2.2],
    [0, 1, 4.5, 2.3],
    [0, -2, 4.4, 2.4],
    [-0.5, -5, 4.5, 2.5],
    [-1, -8, 4.7, 2.6],
    [-1, -11, 4.8, 2.8]
  ];

  pathPoints.forEach((p, i) => {
    const tile = box(
      scene,
      p[0], 0.005, p[1],
      p[2], 0.06, p[3],
      i % 3 === 0 ? mat.pathLight : mat.path
    );

    tile.rotation.y = Math.sin(i * 0.6) * 0.035;
  });

  // 길 가장자리의 작은 돌
  for (let i = 0; i < 24; i++) {
    const side = i % 2 === 0 ? -1 : 1;
    const z = 9 - i * 0.85;
    const x = side * (2.8 + Math.sin(i * 1.7) * 0.5);

    const stone = add(
      new THREE.DodecahedronGeometry(0.18, 0),
      i % 2 ? mat.stone : mat.pathLight,
      scene,
      x, 0.08, z,
      1.2, 0.45, 0.8
    );

    stone.rotation.y = i * 0.7;
  }

  // 잔디밭의 작은 언덕
  function hill(x, z, sx, sy, sz) {
    const h = ball(
      scene,
      x, -0.25, z,
      sx, sy, sz,
      mat.grassLight
    );

    h.castShadow = false;
    h.receiveShadow = true;
  }

  hill(-12, -7, 4, 1, 3);
  hill(13, -5, 3.5, 0.8, 4);
  hill(-12, 7, 3, 0.7, 3);
  hill(12, 9, 3.5, 0.8, 3);

  // --------------------------------------------------
  // 4. 연못
  // --------------------------------------------------

  const pondGroup = new THREE.Group();
  scene.add(pondGroup);
  pondGroup.position.set(7, 0, 1);

  add(
    new THREE.CylinderGeometry(3.2, 3.2, 0.22, 48),
    mat.white,
    pondGroup,
    0, 0.08, 0,
    1, 1, 0.76
  );

  add(
    new THREE.CylinderGeometry(2.98, 2.98, 0.12, 48),
    mat.blue,
    pondGroup,
    0, 0.2, 0,
    1, 1, 0.76
  );

  add(
    new THREE.CylinderGeometry(2.78, 2.78, 0.08, 48),
    mat.water,
    pondGroup,
    0, 0.25, 0,
    1, 1, 0.76
  );

  const pondRim = add(
    new THREE.TorusGeometry(3.05, 0.12, 10, 48),
    mat.cream,
    pondGroup,
    0, 0.3, 0,
    1, 0.76, 1
  );

  pondRim.rotation.x = Math.PI / 2;

  // 연못 위의 수련잎
  for (let i = 0; i < 4; i++) {
    const a = i * Math.PI * 0.65;

    const leaf = add(
      new THREE.CircleGeometry(0.25, 20),
      mat.leaf2,
      pondGroup,
      Math.cos(a) * 1.5,
      0.31,
      Math.sin(a) * 0.85
    );

    leaf.rotation.x = -Math.PI / 2;
  }

  // --------------------------------------------------
  // 5. 아기자기한 집
  // --------------------------------------------------

  const house = new THREE.Group();
  scene.add(house);
  house.position.set(-5, 0, -5);

  // 벽과 기초
  box(
    house,
    0, 1.15, 0,
    5.3, 2.3, 4,
    mat.wall
  );

  box(
    house,
    0, 0.12, 0,
    5.55, 0.24, 4.2,
    mat.woodLight
  );

  // 지붕 두 면
  const roofLeft = box(
    house,
    -1.25, 2.5, 0,
    3.2, 0.22, 4.7,
    mat.roof
  );

  roofLeft.rotation.z = -0.48;

  const roofRight = box(
    house,
    1.25, 2.5, 0,
    3.2, 0.22, 4.7,
    mat.roofLight
  );

  roofRight.rotation.z = 0.48;

  // 지붕 끝 장식
  box(
    house,
    0, 2.42, 2.35,
    0.2, 0.25, 0.18,
    mat.cream
  );

  // 굴뚝
  box(
    house,
    1.55, 2.8, -0.9,
    0.5, 1.1, 0.5,
    mat.wallPink
  );

  box(
    house,
    1.55, 3.36, -0.9,
    0.68, 0.15, 0.68,
    mat.roof
  );

  // 문
  box(
    house,
    0.15, 0.88, 2.06,
    1.02, 1.7, 0.15,
    mat.wood
  );

  ball(
    house,
    0.48, 0.9, 2.16,
    0.065, 0.065, 0.035,
    mat.gold
  );

  // 창문
  function windowFrame(parent, x, y, z) {
    box(
      parent,
      x, y, z,
      0.95, 0.82, 0.12,
      mat.white
    );

    box(
      parent,
      x, y, z + 0.08,
      0.76, 0.64, 0.05,
      mat.blue
    );

    box(
      parent,
      x, y, z + 0.12,
      0.07, 0.7, 0.04,
      mat.white
    );

    box(
      parent,
      x, y, z + 0.12,
      0.8, 0.07, 0.04,
      mat.white
    );
  }

  windowFrame(-1.6, 1.4, 2.05);
  windowFrame(1.75, 1.4, 2.05);

  // 창문 아래 화분
  for (const x of [-1.6, 1.75]) {
    box(
      house,
      x, 0.85, 2.25,
      0.75, 0.16, 0.25,
      mat.roof
    );

    for (let i = 0; i < 3; i++) {
      ball(
        house,
        x - 0.22 + i * 0.22,
        1.08, 2.25,
        0.11, 0.12, 0.11,
        i % 2 ? mat.pink : mat.yellow
      );
    }
  }

  // 집 앞 계단
  box(
    house,
    0.15, 0.12, 2.45,
    1.5, 0.2, 0.65,
    mat.stone
  );

  // --------------------------------------------------
  // 6. 나무와 관목
  // --------------------------------------------------

  function tree(x, z, scale = 1) {
    const group = new THREE.Group();
    scene.add(group);

    group.position.set(x, 0, z);
    group.scale.setScalar(scale);

    cylinder(
      group,
      0, 0.75, 0,
      0.2, 0.28, 1.5,
      mat.wood
    );

    ball(
      group,
      0, 1.95, 0,
      0.95, 1.05, 0.9,
      mat.leaf
    );

    ball(
      group,
      -0.48, 1.8, 0.03,
      0.68, 0.75, 0.68,
      mat.leaf2
    );

    ball(
      group,
      0.48, 1.85, -0.04,
      0.68, 0.8, 0.68,
      mat.leaf3
    );

    ball(
      group,
      -0.12, 2.42, 0.1,
      0.6, 0.65, 0.58,
      mat.leaf2
    );

    return group;
  }

  [
    [-10, -8, 1.1],
    [-9, 1, 0.85],
    [-11, 6, 1.15],
    [10, -8, 1.1],
    [11, -2, 0.9],
    [10, 8, 1.1],
    [4, -10, 0.75],
    [-2, -12, 0.8],
    [5, 10, 0.85],
    [-7, 10, 0.7]
  ].forEach((p) => tree(...p));

  function bush(x, z, scale = 1) {
    const group = new THREE.Group();
    scene.add(group);
    group.position.set(x, 0, z);
    group.scale.setScalar(scale);

    ball(
      group,
      0, 0.35, 0,
      0.65, 0.42, 0.5,
      mat.leaf
    );

    ball(
      group,
      -0.35, 0.38, 0.02,
      0.42, 0.36, 0.4,
      mat.leaf2
    );

    ball(
      group,
      0.32, 0.4, -0.03,
      0.4, 0.38, 0.4,
      mat.leaf3
    );

    return group;
  }

  [
    [-7.8, -2.1],
    [-8.2, -3.1],
    [-2.5, -5.1],
    [-7.8, 5.5],
    [4.3, -3.8],
    [9.5, 4.7],
    [5.4, 7.5],
    [-3.8, 8.1]
  ].forEach((p, i) => bush(p[0], p[1], 0.8 + (i % 3) * 0.15));

  // --------------------------------------------------
  // 7. 꽃밭과 꽃
  // --------------------------------------------------

  const flowerGroups = [];

  function flower(x, z, material, scale = 1) {
    const group = new THREE.Group();
    scene.add(group);

    group.position.set(x, 0, z);
    group.scale.setScalar(scale);

    cylinder(
      group,
      0, 0.22, 0,
      0.025, 0.04, 0.42,
      mat.leafDark
    );

    for (let i = 0; i < 5; i++) {
      const a = (i / 5) * Math.PI * 2;

      ball(
        group,
        Math.cos(a) * 0.14,
        0.46,
        Math.sin(a) * 0.14,
        0.12, 0.08, 0.12,
        material
      );
    }

    ball(
      group,
      0, 0.48, 0,
      0.075, 0.07, 0.075,
      mat.gold
    );

    flowerGroups.push(group);

    return group;
  }

  function flowerBed(x, z) {
    const group = new THREE.Group();
    scene.add(group);
    group.position.set(x, 0, z);

    // 나무 테두리
    box(
      group,
      0, 0.12, 0,
      4.1, 0.24, 2.2,
      mat.woodLight
    );

    box(
      group,
      0, 0.24, 0,
      3.85, 0.1, 1.95,
      mat.grassDark
    );

    box(
      group,
      0, 0.3, 0,
      3.65, 0.08, 1.75,
      M(0x795d49)
    );

    const flowerColors = [
      mat.pink,
      mat.yellow,
      mat.white,
      mat.lilac,
      mat.blue
    ];

    for (let i = 0; i < 5; i++) {
      for (let j = 0; j < 2; j++) {
        flower(
          x - 1.45 + i * 0.72,
          z - 0.48 + j * 0.9,
          flowerColors[(i + j) % flowerColors.length],
          0.7
        );
      }
    }
  }

  flowerBed(-7, 2.8);
  flowerBed(1, -1.2);
  flowerBed(7, 7);

  // 잔디밭에 자연스럽게 흩어진 작은 꽃
  for (let i = 0; i < 55; i++) {
    const x = Math.sin(i * 12.3) * 12;
    const z = Math.cos(i * 7.1) * 11;

    if (Math.abs(x) < 2.8 && z > 0 && z < 10) {
      continue;
    }

    flower(
      x,
      z,
      [
        mat.pink,
        mat.yellow,
        mat.white,
        mat.lilac
      ][i % 4],
      0.4 + (i % 3) * 0.08
    );
  }

  // --------------------------------------------------
  // 8. 우편함, 울타리, 가로등, 버섯
  // --------------------------------------------------

  function mailbox(x, z) {
    const g = new THREE.Group();
    scene.add(g);
    g.position.set(x, 0, z);

    cylinder(
      g,
      0, 0.48, 0,
      0.07, 0.1, 0.95,
      mat.wood
    );

    box(
      g,
      0, 1.05, 0,
      0.8, 0.55, 0.48,
      mat.blue
    );

    box(
      g,
      0, 1.35, 0,
      0.84, 0.08, 0.52,
      mat.roof
    );

    box(
      g,
      0.25, 1.07, 0.25,
      0.12, 0.13, 0.04,
      mat.white
    );
  }

  mailbox(-2.8, -1.8);

  function fence(x, z, count = 6) {
    for (let i = 0; i < count; i++) {
      box(
        scene,
        x + i * 0.6, 0.38, z,
        0.12, 0.75, 0.12,
        mat.white
      );
    }

    box(
      scene,
      x + (count - 1) * 0.3,
      0.55,
      z,
      count * 0.6,
      0.12,
      0.12,
      mat.woodLight
    );

    box(
      scene,
      x + (count - 1) * 0.3,
      0.3,
      z,
      count * 0.6,
      0.12,
      0.12,
      mat.woodLight
    );
  }

  fence(-10, 4.8, 7);
  fence(6.4, 8.5, 6);

  function lamp(x, z) {
    cylinder(
      scene,
      x, 0.65, z,
      0.07, 0.1, 1.3,
      mat.wood
    );

    box(
      scene,
      x, 1.36, z,
      0.5, 0.42, 0.5,
      mat.cream
    );

    ball(
      scene,
      x, 1.36, z,
      0.15, 0.15, 0.15,
      mat.yellow
    );

    const light = new THREE.PointLight(
      0xffd69b,
      0.45,
      4
    );

    light.position.set(x, 1.5, z);
    scene.add(light);
  }

  lamp(-2, -1);
  lamp(3, 4);
  lamp(-8, 6);
  lamp(5, -5);

  function mushroom(x, z, scale = 1) {
    const g = new THREE.Group();
    scene.add(g);
    g.position.set(x, 0, z);
    g.scale.setScalar(scale);

    cylinder(
      g,
      0, 0.22, 0,
      0.12, 0.16, 0.42,
      mat.white
    );

    ball(
      g,
      0, 0.48, 0,
      0.38, 0.22, 0.34,
      mat.pinkDark
    );

    for (let i = 0; i < 4; i++) {
      const a = i * Math.PI / 2;

      ball(
        g,
        Math.cos(a) * 0.2,
        0.57,
        Math.sin(a) * 0.2,
        0.045, 0.035, 0.045,
        mat.white
      );
    }
  }

  mushroom(-8.5, -0.8, 0.9);
  mushroom(-8.8, -1.6, 0.65);
  mushroom(5.5, 6.4, 0.85);
  mushroom(6.1, 6.1, 0.6);

  // --------------------------------------------------
  // 9. 캐릭터 모델 불러오기
  // --------------------------------------------------

  const avatar = new THREE.Group();
  scene.add(avatar);

  const outfitMat = M(
    colors[state.outfit] || colors.lavender
  );

  const avatarShadow = add(
    new THREE.CircleGeometry(0.65, 24),
    new THREE.MeshBasicMaterial({
      color: 0x536d4b,
      transparent: true,
      opacity: 0.16
    }),
    avatar,
    0, 0.025, 0
  );

  avatarShadow.rotation.x = -Math.PI / 2;

  const characterLoader = new GLTFLoader();

  const characterUrl =
    "https://raw.githubusercontent.com/boyoung0819/mongle-mind/main/components/village/character.glb";

  let loadedCharacter = null;
  let characterMixer = null;
  let walkAction = null;
  let idleAction = null;
  let isWalking = false;

  characterLoader.load(
    characterUrl,

    (gltf) => {
      loadedCharacter = gltf.scene;

      const bounds = new THREE.Box3().setFromObject(
        loadedCharacter
      );

      const size = bounds.getSize(
        new THREE.Vector3()
      );

      const center = bounds.getCenter(
        new THREE.Vector3()
      );

      const height = Math.max(size.y, 0.001);
      const scale = 3 / height;

      loadedCharacter.scale.setScalar(scale);

      loadedCharacter.position.set(
        -center.x * scale,
        -bounds.min.y * scale,
        -center.z * scale
      );

      loadedCharacter.traverse((obj) => {
        if (!obj.isMesh) return;

        obj.castShadow = true;
        obj.receiveShadow = true;
      });

      avatar.add(loadedCharacter);

      // GLB 파일에 걷기 애니메이션이 들어 있다면 사용
      if (gltf.animations && gltf.animations.length > 0) {
        characterMixer = new THREE.AnimationMixer(
          loadedCharacter
        );

        const walkClip = gltf.animations.find(
          (clip) => /walk|walking|run|move/i.test(clip.name)
        );

        const idleClip = gltf.animations.find(
          (clip) => /idle|stand|breath/i.test(clip.name)
        );

        if (walkClip) {
          walkAction = characterMixer.clipAction(walkClip);
          walkAction.play();
          walkAction.paused = true;
        }

        if (idleClip) {
          idleAction = characterMixer.clipAction(idleClip);
          idleAction.play();
        }

        console.log(
          "캐릭터 애니메이션:",
          gltf.animations.map((clip) => clip.name)
        );
      }

      console.log("캐릭터 모델을 불러왔어요.");
    },

    undefined,

    (error) => {
      console.error("character.glb 로딩 실패:", error);

      toast(
        "캐릭터를 불러오지 못했어요. 모델 파일 주소를 확인해 주세요."
      );
    }
  );

  // --------------------------------------------------
  // 10. 따라다니는 반려동물
  // --------------------------------------------------

  const pet = new THREE.Group();
  scene.add(pet);

  ball(
    pet,
    0, 0.42, 0,
    0.45, 0.36, 0.4,
    mat.white
  );

  ball(
    pet,
    0, 0.78, -0.02,
    0.34, 0.32, 0.32,
    mat.white
  );

  for (const x of [-0.21, 0.21]) {
    ball(
      pet,
      x, 1.02, -0.02,
      0.12, 0.22, 0.12,
      M(0xe5c4bd)
    );

    ball(
      pet,
      x * 0.6, 0.8, 0.28,
      0.03, 0.04, 0.02,
      mat.dark
    );

    ball(
      pet,
      x * 0.9, 0.69, 0.28,
      0.06, 0.035, 0.02,
      mat.pink
    );
  }

  ball(
    pet,
    0, 0.72, 0.3,
    0.045, 0.035, 0.02,
    M(0x9d777a)
  );

  // --------------------------------------------------
  // 11. 숨겨진 조개
  // --------------------------------------------------

  const shell = new THREE.Group();
  scene.add(shell);
  shell.position.set(8, 0.15, 5);

  ball(
    shell,
    0, 0.1, 0,
    0.22, 0.11, 0.17,
    M(0xf4d6a2)
  );

  for (let i = -1; i <= 1; i++) {
    const curve = add(
      new THREE.TorusGeometry(
        0.09, 0.01, 5, 12, Math.PI
      ),
      mat.white,
      shell,
      i * 0.06, 0.14, 0
    );

    curve.rotation.x = Math.PI / 2;
  }

  // --------------------------------------------------
  // 12. UI와 저장
  // --------------------------------------------------

  function save() {
    try {
      localStorage.setItem(
        "mongleMindSave",
        JSON.stringify(state)
      );
    } catch (e) {}

    updateUI();
  }

  function updateUI() {
    if ($("coins")) $("coins").textContent = state.coins;
    if ($("level")) $("level").textContent = state.level;
    if ($("xp")) $("xp").textContent = state.xp;
    if ($("flowers")) $("flowers").textContent = state.flowers;

    if ($("outfitLabel")) {
      $("outfitLabel").textContent =
        names[state.outfit] || names.lavender;
    }

    document.querySelectorAll(".outfit").forEach((button) => {
      button.classList.toggle(
        "active",
        button.dataset.outfit === state.outfit
      );
    });

    document.querySelectorAll(".mood").forEach((button) => {
      button.classList.toggle(
        "selected",
        button.dataset.mood === state.mood
      );
    });

    if ($("moodSaved")) {
      $("moodSaved").textContent = state.mood
        ? moodNames[state.mood]
        : "기분을 기록하지 않아도 괜찮아요.";
    }

    document.querySelectorAll(".nav-item").forEach((button) => {
      button.classList.toggle(
        "active",
        button.dataset.nav === state.nav
      );
    });
  }

  function toast(message) {
    if (!$("toast")) return;

    $("toast").textContent = message;
    $("toast").classList.add("show");

    clearTimeout(toastTimer);

    toastTimer = setTimeout(() => {
      $("toast").classList.remove("show");
    }, 2400);
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

  function xp(amount) {
    state.xp += amount;
    levelUp();
  }

  // --------------------------------------------------
  // 13. NPC 및 상호작용
  // --------------------------------------------------

  function closeDialog() {
    if ($("dialog")) $("dialog").hidden = true;
  }

  if ($("closeDialog")) {
    $("closeDialog").addEventListener("click", closeDialog);
  }

  function dialog(name, text, actions = []) {
    if (!$("dialog")) return;

    $("dialogName").textContent = name;
    $("dialogText").textContent = text;

    const holder = $("dialogActions");
    holder.replaceChildren();

    actions.forEach((item) => {
      const button = document.createElement("button");

      button.textContent = item.label;
      button.addEventListener("click", item.action);

      holder.appendChild(button);
    });

    $("dialog").hidden = false;
  }

  function target() {
    const targets = [
      {
        id: "garden",
        x: -7,
        z: 2.8,
        r: 2.7,
        label: "꽃 돌보기"
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

    return targets.find((item) => {
      const distance = Math.hypot(
        avatar.position.x - item.x,
        avatar.position.z - item.z
      );

      return (
        distance < item.r &&
        !(item.id === "shell" && state.foundShell)
      );
    });
  }

  function interact() {
    const nearby = target();

    if (!nearby) {
      toast("꽃밭이나 친구 가까이 다가가 E를 눌러 보세요.");
      return;
    }

    if (nearby.id === "garden") {
      dialog(
        "작은 꽃밭",
        "꽃들이 햇살을 머금고 있어요. 꽃을 돌보거나 잠시 바라봐도 좋아요.",
        [
          {
            label: "꽃에 물 주기",
            action: () => {
              state.watered = true;
              state.flowers++;
              state.coins += 5;

              xp(10);
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
        ]
      );
    } else if (nearby.id === "animal") {
      dialog(
        "포근이",
        "안녕! 나는 포근이야. 여기서는 서두르지 않아도 돼.",
        [
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
        ]
      );
    } else if (nearby.id === "shell") {
      state.foundShell = true;
      state.coins += 8;

      xp(8);

      shell.visible = false;
      closeDialog();

      toast("반짝이는 조개 발견! 코인 +8");
    } else {
      dialog(
        "작은 집",
        "오늘 하루도 여기까지 온 것만으로 충분해요. 잠시 쉬어 가요.",
        [
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
        ]
      );
    }
  }

  // --------------------------------------------------
  // 14. 의상 선택
  // --------------------------------------------------

  document.querySelectorAll(".outfit").forEach((button) => {
    button.onclick = () => {
      state.outfit = button.dataset.outfit;

      outfitMat.color.setHex(colors[state.outfit]);

      save();

      toast(
        (names[state.outfit] || "새 의상") +
        "을 선택했어요."
      );
    };
  });

  // --------------------------------------------------
  // 15. 감정 기록
  // --------------------------------------------------

  document.querySelectorAll(".mood").forEach((button) => {
    button.onclick = () => {
      state.mood = button.dataset.mood;

      save();

      toast(
        "오늘의 마음을 기록했어요. 기록은 평가되지 않아요."
      );
    };
  });

  // --------------------------------------------------
  // 16. 화면 메뉴
  // --------------------------------------------------

  document.querySelectorAll(".nav-item").forEach((button) => {
    button.onclick = () => {
      state.nav = button.dataset.nav;

      if (state.nav === "garden") {
        avatar.position.set(-7, 0, 2.8);
      }

      if (state.nav === "village") {
        avatar.position.set(0, 0, 4);
      }

      save();

      const messages = {
        village: "마을을 천천히 둘러봐요.",
        garden: "정원에 도착했어요.",
        room: "내 방 꾸미기는 다음 단계에서 확장할게요.",
        journal: "오늘의 마음을 기록해 봐요."
      };

      toast(messages[state.nav] || "천천히 둘러봐요.");
    };
  });

  // --------------------------------------------------
  // 17. 호흡 활동
  // --------------------------------------------------

  function stopBreath() {
    breathing = false;

    clearTimeout(breathTimer);

    if ($("breathBox")) $("breathBox").hidden = true;

    if ($("breathLabel")) {
      $("breathLabel").textContent = "함께 천천히 호흡하기";
    }

    if ($("breathCircle")) {
      $("breathCircle").classList.remove("expand");
    }
  }

  if ($("breathBtn")) {
    $("breathBtn").onclick = () => {
      if (breathing) {
        stopBreath();
        return;
      }

      breathing = true;
      breathStep = 0;

      $("breathBox").hidden = false;
      $("breathLabel").textContent = "호흡 활동 진행 중";

      $("breathInstruction").textContent =
        "편안한 만큼만 따라 해요. 언제든 그만할 수 있어요.";

      const circle = $("breathCircle");
      const text = $("breathText");

      const steps = [
        ["천천히 들이쉬어요", true],
        ["편안하게 내쉬어요", false]
      ];

      function tick() {
        if (!breathing) return;

        const step = steps[breathStep++ % 2];

        text.textContent = step[0];
        circle.classList.toggle("expand", step[1]);

        breathTimer = setTimeout(tick, 4000);
      }

      tick();

      breathTimer = setTimeout(stopBreath, 30000);
    };
  }

  if ($("stopBreath")) {
    $("stopBreath").onclick = stopBreath;
  }

  // --------------------------------------------------
  // 18. 키보드와 모바일 조작
  // --------------------------------------------------

  window.addEventListener("keydown", (event) => {
    keys[event.key.toLowerCase()] = true;

    if (
      [
        "ArrowUp",
        "ArrowDown",
        "ArrowLeft",
        "ArrowRight",
        " "
      ].includes(event.key)
    ) {
      event.preventDefault();
    }

    if (
      event.key.toLowerCase() === "e" &&
      $("dialog").hidden
    ) {
      interact();
    }

    if (event.key === "Escape") {
      closeDialog();
    }
  });

  window.addEventListener("keyup", (event) => {
    keys[event.key.toLowerCase()] = false;
  });

  window.addEventListener("blur", () => {
    keys = {};
  });

  document.querySelectorAll(".touch-pad button").forEach((button) => {
    const key = button.dataset.k.toLowerCase();

    const start = (event) => {
      event.preventDefault();
      keys[key] = true;
    };

    const end = (event) => {
      event.preventDefault();
      keys[key] = false;
    };

    button.addEventListener("pointerdown", start);
    button.addEventListener("pointerup", end);
    button.addEventListener("pointerleave", end);
    button.addEventListener("pointercancel", end);
  });

  // 마우스로 클릭한 위치까지 이동
  renderer.domElement.addEventListener("pointerdown", (event) => {
    if (event.target.closest("button")) return;

    const rect = renderer.domElement.getBoundingClientRect();

    const raycaster = new THREE.Raycaster();

    raycaster.setFromCamera(
      new THREE.Vector2(
        ((event.clientX - rect.left) / rect.width) * 2 - 1,
        -((event.clientY - rect.top) / rect.height) * 2 + 1
      ),
      camera
    );

    const point = new THREE.Vector3();

    const plane = new THREE.Plane(
      new THREE.Vector3(0, 1, 0),
      0
    );

    if (raycaster.ray.intersectPlane(plane, point)) {
      avatar.userData.dest = new THREE.Vector3(
        THREE.MathUtils.clamp(point.x, -13, 13),
        0,
        THREE.MathUtils.clamp(point.z, -13, 13)
      );
    }
  });

  // --------------------------------------------------
  // 19. 초기 위치와 화면 크기
  // --------------------------------------------------

  avatar.position.set(
    THREE.MathUtils.clamp(state.x, -13, 13),
    0,
    THREE.MathUtils.clamp(state.z, -13, 13)
  );

  if (state.foundShell) {
    shell.visible = false;
  }

  updateUI();

  function resize() {
    const width = Math.max(root.clientWidth, 320);
    const height = Math.max(root.clientHeight, 320);

    renderer.setSize(width, height, false);

    camera.aspect = width / height;
    camera.updateProjectionMatrix();
  }

  new ResizeObserver(resize).observe(root);
  resize();

  // --------------------------------------------------
  // 20. 게임 루프
  // --------------------------------------------------

  function animate(time) {
    requestAnimationFrame(animate);

    const dt = Math.min((time - last) / 1000 || 0, 0.05);
    last = time;

    let moving = false;

    if ($("dialog").hidden) {
      let dx = 0;
      let dz = 0;

      if (keys.arrowleft || keys.a) dx--;
      if (keys.arrowright || keys.d) dx++;
      if (keys.arrowup || keys.w) dz--;
      if (keys.arrowdown || keys.s) dz++;

      if (avatar.userData.dest) {
        const direction = avatar.userData.dest
          .clone()
          .sub(avatar.position);

        direction.y = 0;

        if (direction.length() < 0.2) {
          avatar.userData.dest = null;
        } else {
          direction.normalize();
          dx = direction.x;
          dz = direction.z;
        }
      }

      if (dx !== 0 || dz !== 0) {
        moving = true;

        const length = Math.hypot(dx, dz);

        dx /= length;
        dz /= length;

        avatar.position.x = THREE.MathUtils.clamp(
          avatar.position.x + dx * dt * 4,
          -13,
          13
        );

        avatar.position.z = THREE.MathUtils.clamp(
          avatar.position.z + dz * dt * 4,
          -13,
          13
        );

        // 이동 방향으로 캐릭터 회전
        avatar.rotation.y = Math.atan2(dx, dz);

        // 애니메이션이 없는 모델에는 작은 보행 움직임 적용
        if (!walkAction) {
          avatar.position.y = Math.abs(Math.sin(time * 0.018)) * 0.07;
        }
      }
    }

    // 걷기 애니메이션 전환
    if (moving !== isWalking) {
      isWalking = moving;

      if (walkAction) {
        if (isWalking) {
          if (idleAction) idleAction.fadeOut(0.15);

          walkAction.reset();
          walkAction.enabled = true;
          walkAction.paused = false;
          walkAction.fadeIn(0.15).play();
        } else {
          walkAction.fadeOut(0.15);

          if (idleAction) {
            idleAction.reset().fadeIn(0.15).play();
          }
        }
      }
    }

    if (characterMixer) {
      characterMixer.update(dt);
    }

    if (!moving) {
      avatar.position.y = Math.sin(time * 0.0025) * 0.025;
    }

    // 반려동물이 플레이어를 따라오기
    const petTarget = new THREE.Vector3(
      avatar.position.x + 0.9,
      0,
      avatar.position.z + 1
    );

    pet.position.lerp(petTarget, Math.min(dt * 5, 1));

    pet.position.y += Math.abs(
      Math.sin(time * 0.003)
    ) * 0.015;

    pet.rotation.y = Math.sin(time * 0.001) * 0.15;

    // 꽃이 살짝 흔들리는 효과
    flowerGroups.forEach((flower, i) => {
      flower.rotation.z =
        Math.sin(time * 0.0015 + i) * 0.035;
    });

    // 카메라를 낮추고 시선은 캐릭터 몸통 쪽으로
    // 이전보다 정면에 가까운 시점
    const cameraTarget = new THREE.Vector3(
      avatar.position.x,
      6.5,
      avatar.position.z + 20
    );

    camera.position.lerp(cameraTarget, 0.045);

    camera.lookAt(
      avatar.position.x,
      1.5,
      avatar.position.z - 1.5
    );

    const nearby = target();

    if ($("sceneStatus")) {
      $("sceneStatus").textContent = nearby
        ? `E · ${nearby.label}`
        : "나만의 속도로 산책해요";
    }

    renderer.render(scene, camera);
  }

  requestAnimationFrame(animate);
})();
