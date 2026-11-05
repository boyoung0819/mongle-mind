import * as THREE from "https://cdn.jsdelivr.net/npm/three@0.164.1/build/three.module.js";
import { GLTFLoader } from "https://cdn.jsdelivr.net/npm/three@0.164.1/examples/jsm/loaders/GLTFLoader.js";

/* =========================================================
   몽글마음
   game.js 전체 교체본
========================================================= */

(() => {
  "use strict";

  /* =========================================================
     기본
  ========================================================= */

  const $ = id => document.getElementById(id);

  const STORAGE_KEY = "mongleMindSave";

  const PAGE_TITLES = {
    home: "나만의 작은 쉼",
    village: "몽글마을 산책",
    dress: "나의 펫 꾸미기",
    garden: "나만의 정원",
    room: "나만의 방",
    journal: "마음 돌보기",
    quests: "오늘의 작은 퀘스트"
  };

  const DEFAULT_STATE = {
    nav: "home",

    coins: 30,
    xp: 0,
    level: 1,
    flowers: 0,

    mood: null,
    journalText: "",
    journalDate: "",

    roomDecor: "lavender",

    x: 0,
    z: 4,

    petCurrency: 0,
    petCoins: 0,

    firstPetTutorialDone: false,

    ownedPets: [],
    selectedPet: null,

    petFragments: {},

    petAccessories: {},

    stats: {
      petGreetings: 0,
      petDraws: 0,
      breaths: 0,
      journals: 0,
      waters: 0,
      harvests: 0,
      shellFinds: 0,
      gardenPlants: 0
    },

    questStages: {},
    questClaims: [],

    foundShell: false
  };


  /* =========================================================
     상태 불러오기
  ========================================================= */

  let state = loadState();

  function loadState() {
    let saved = {};

    try {
      saved = JSON.parse(
        localStorage.getItem(STORAGE_KEY) || "{}"
      ) || {};
    } catch (error) {
      console.warn("저장 데이터를 읽지 못했습니다.", error);
    }

    const result = {
      ...DEFAULT_STATE,
      ...saved,

      stats: {
        ...DEFAULT_STATE.stats,
        ...(saved.stats || {})
      },

      petFragments: {
        ...(saved.petFragments || {})
      },

      petAccessories: {
        ...(saved.petAccessories || {})
      },

      questStages: {
        ...(saved.questStages || {})
      },

      questClaims: Array.isArray(saved.questClaims)
        ? saved.questClaims
        : []
    };


    /* -------------------------------------------------------
       기존 버전 데이터 호환
    ------------------------------------------------------- */

    if (
      Array.isArray(saved.ownedPets) &&
      saved.ownedPets.length > 0
    ) {
      result.ownedPets = [...saved.ownedPets];
    }

    /*
      예전 버전에서 bunny를 기본 보유하도록 되어 있었다면
      기존 사용자의 토끼를 없애지 않는다.
    */
    if (
      saved.ownedPets &&
      Array.isArray(saved.ownedPets) &&
      saved.ownedPets.includes("bunny")
    ) {
      result.ownedPets = [...new Set([
        ...saved.ownedPets
      ])];
    }

    if (
      typeof saved.selectedPet === "string" &&
      saved.selectedPet
    ) {
      result.selectedPet = saved.selectedPet;
    }

    if (
      typeof saved.petCurrency !== "number"
    ) {
      result.petCurrency = 0;
    }

    if (
      typeof saved.petCoins !== "number"
    ) {
      result.petCoins = 0;
    }


    /* -------------------------------------------------------
       액세서리 기본 구조
    ------------------------------------------------------- */

    Object.keys(PETS).forEach(id => {
      if (!result.petAccessories[id]) {
        result.petAccessories[id] = {
          hat: "none",
          outfit: "none"
        };
      }
    });


    return result;
  }


  function saveState() {
    try {
      localStorage.setItem(
        STORAGE_KEY,
        JSON.stringify(state)
      );
    } catch (error) {
      console.warn("저장하지 못했습니다.", error);
    }

    updateTopUI();
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
      rate: 0,
      duplicateCoins: 10,
      fragmentNeed: 10,
      body: 0xf7e9df,
      ear: 0xe9b9c4
    },

    puppy: {
      id: "puppy",
      name: "구름강아지",
      icon: "🐶",
      rarity: "일반",
      rate: 40,
      duplicateCoins: 12,
      fragmentNeed: 10,
      body: 0xdab68e,
      ear: 0xb8895e
    },

    cat: {
      id: "cat",
      name: "달빛고양이",
      icon: "🐱",
      rarity: "일반",
      rate: 30,
      duplicateCoins: 15,
      fragmentNeed: 10,
      body: 0xcfc9dd,
      ear: 0xa9a1bf
    },

    fox: {
      id: "fox",
      name: "살구여우",
      icon: "🦊",
      rarity: "희귀",
      rate: 16,
      duplicateCoins: 22,
      fragmentNeed: 15,
      body: 0xef9f63,
      ear: 0xd97845
    },

    bear: {
      id: "bear",
      name: "솜사탕곰",
      icon: "🐻",
      rarity: "희귀",
      rate: 9,
      duplicateCoins: 28,
      fragmentNeed: 15,
      body: 0xc9aa93,
      ear: 0xa77f69
    },

    star: {
      id: "star",
      name: "별빛친구",
      icon: "⭐",
      rarity: "특별",
      rate: 5,
      duplicateCoins: 45,
      fragmentNeed: 20,
      body: 0xf3d47c,
      ear: 0xf0bd5b
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
     퀘스트
  ========================================================= */

  const QUESTS = [

    {
      id: "pet_interact",
      icon: "🐾",
      title: "작은 친구와 인사하기",
      description: "마을의 동물 친구에게 인사해 보세요.",
      stages: [1, 3, 5, 10],
      reward: 2,
      type: "petGreetings"
    },

    {
      id: "pet_draw",
      icon: "✨",
      title: "새로운 친구 만나기",
      description: "펫 뽑기를 진행해 보세요.",
      stages: [1, 3, 5, 10],
      reward: 3,
      type: "petDraws"
    },

    {
      id: "pet_collect",
      icon: "📖",
      title: "펫 도감 채우기",
      description: "서로 다른 펫을 모아 보세요.",
      stages: [1, 2, 4, 6],
      reward: 5,
      type: "petCollection"
    },

    {
      id: "garden_water",
      icon: "💧",
      title: "정원 돌보기",
      description: "식물에게 물을 주세요.",
      stages: [3, 6, 10, 15],
      reward: 2,
      type: "waters"
    },

    {
      id: "garden_harvest",
      icon: "🌷",
      title: "꽃 수확하기",
      description: "정원에서 꽃을 수확해 보세요.",
      stages: [2, 5, 10, 20],
      reward: 3,
      type: "harvests"
    },

    {
      id: "breathing",
      icon: "🌿",
      title: "잠깐의 쉼",
      description: "호흡 활동을 완료해 보세요.",
      stages: [1, 3, 5, 10],
      reward: 3,
      type: "breaths"
    },

    {
      id: "journal",
      icon: "💭",
      title: "마음 남기기",
      description: "오늘의 마음을 기록해 보세요.",
      stages: [1, 3, 5, 10],
      reward: 3,
      type: "journals"
    },

    {
      id: "shell",
      icon: "🐚",
      title: "숨겨진 반짝임",
      description: "마을의 숨겨진 조개를 찾아 보세요.",
      stages: [1, 2, 3, 5],
      reward: 4,
      type: "shellFinds"
    }
  ];


  /* =========================================================
     UI 업데이트
  ========================================================= */

  function updateTopUI() {

    const coins = $("coins");
    const level = $("level");
    const xp = $("xp");
    const flowers = $("flowers");
    const gardenCoins = $("gardenCoins");

    if (coins) {
      coins.textContent = state.coins;
    }

    if (level) {
      level.textContent = state.level;
    }

    if (xp) {
      xp.textContent = state.xp;
    }

    if (flowers) {
      flowers.textContent = state.flowers;
    }

    if (gardenCoins) {
      gardenCoins.textContent = state.coins;
    }

    const roomLabel = $("roomDecorLabel");

    if (roomLabel) {
      const labels = {
        lavender: "라벤더 포근방",
        peach: "피치 포근방",
        mint: "민트 포근방"
      };

      roomLabel.textContent =
        labels[state.roomDecor] ||
        labels.lavender;
    }
  }


  /* =========================================================
     페이지 이동
     
     가장 먼저 등록한다.
     3D 코드와 완전히 분리한다.
  ========================================================= */

  let currentPage = "home";

  function showPage(page) {

    if (!PAGE_TITLES[page]) {
      page = "home";
    }

    currentPage = page;
    state.nav = page;

    document
      .querySelectorAll("[data-screen]")
      .forEach(screen => {

        screen.hidden =
          screen.dataset.screen !== page;
      });


    const title = $("pageTitle");

    if (title) {
      title.textContent =
        PAGE_TITLES[page];
    }


    document
      .querySelectorAll(".nav-item")
      .forEach(button => {

        button.classList.toggle(
          "active",
          button.dataset.nav === page
        );
      });


    updateTopUI();


    if (page === "dress") {
      renderPetPage();
    }

    if (page === "quests") {
      renderQuestPage();
    }

    if (page === "room") {
      updateRoomPreview();
    }

    if (page === "journal") {
      updateJournalUI();
    }

    if (page === "garden") {
      updateGardenUI();
    }


    /*
      마을에 처음 들어왔을 때만
      Three.js를 시작한다.
    */
    if (page === "village") {
      initVillage();
    }


    saveState();
  }


  /* =========================================================
     클릭 이벤트
     
     이것을 game.js 초반에 바로 연결한다.
  ========================================================= */

  document.addEventListener(
    "click",
    event => {

      const pageButton =
        event.target.closest("[data-page]");

      const navButton =
        event.target.closest("[data-nav]");

      const homeButton =
        event.target.closest("[data-home]");


      if (pageButton) {

        event.preventDefault();

        showPage(
          pageButton.dataset.page
        );

        return;
      }


      if (navButton) {

        event.preventDefault();

        showPage(
          navButton.dataset.nav
        );

        return;
      }


      if (homeButton) {

        event.preventDefault();

        showPage("home");

        return;
      }

    },
    false
  );


  /* =========================================================
     토스트
  ========================================================= */

  let toastTimer = null;

  function toast(message) {

    const el = $("toast");

    if (!el) {
      return;
    }

    el.textContent = message;

    el.classList.add("show");

    clearTimeout(toastTimer);

    toastTimer = setTimeout(() => {
      el.classList.remove("show");
    }, 2600);
  }


  /* =========================================================
     XP
  ========================================================= */

  function addXP(amount) {

    state.xp += amount;

    while (state.xp >= 100) {

      state.xp -= 100;
      state.level += 1;

      toast(
        `레벨 업! 🌱 Lv.${state.level}`
      );
    }
  }


  /* =========================================================
     펫 UI
  ========================================================= */

  function renderPetPage() {

    const root = $("petRoomRoot");

    if (!root) {
      return;
    }


    const selected =
      state.selectedPet &&
      PETS[state.selectedPet]
        ? PETS[state.selectedPet]
        : null;


    root.innerHTML = `
      <div class="mm-pet-ui">

        ${
          !selected
            ? renderNoPetState()
            : renderPetRoom(selected)
        }

        ${renderPetDraw()}

        ${renderPetBook()}

        ${
          selected
            ? renderPetAccessories(selected)
            : ""
        }

        ${renderFragmentShop()}

      </div>
    `;

    applyPetUIStyles();
  }


  function renderNoPetState() {

    return `
      <section class="mm-pet-section mm-empty-pet">

        <div class="mm-empty-icon">
          🐾
        </div>

        <h2>
          아직 함께할 펫이 없어요.
        </h2>

        <p>
          첫 번째 펫은 무료로 만날 수 있어요.
        </p>

        <button
          class="mm-pet-button"
          data-pet-action="first-draw"
          type="button"
        >
          ✨ 첫 펫 만나기
        </button>

      </section>
    `;
  }


  function renderPetRoom(pet) {

    const acc =
      state.petAccessories[pet.id] || {
        hat: "none",
        outfit: "none"
      };


    return `
      <section class="mm-pet-section">

        <div class="mm-pet-title">

          <div>
            <h2>🐾 ${pet.name}</h2>

            <div style="
              font-size:12px;
              opacity:.65;
              margin-top:4px;
            ">
              ${pet.rarity} · 나의 작은 친구
            </div>
          </div>

          <div class="mm-pet-currency">

            <span class="mm-currency">
              ✨ ${state.petCurrency}
            </span>

            <span class="mm-currency">
              🪙 ${state.petCoins}
            </span>

          </div>

        </div>


        <div class="mm-pet-room">

          <div class="mm-pet-room-emoji">
            ${pet.icon}
          </div>

          <div>

            <strong>
              ${pet.name}의 작은 방
            </strong>

            <p>
              ${acc.hat !== "none"
                ? PET_HATS[acc.hat]?.icon || ""
                : ""}
              ${acc.outfit !== "none"
                ? PET_OUTFITS[acc.outfit]?.icon || ""
                : ""}
              오늘도 함께 쉬어요.
            </p>

          </div>

        </div>

      </section>
    `;
  }


  function renderPetDraw() {

    const canDraw =
      state.petCurrency >= 20;


    return `
      <section class="mm-pet-section">

        <div class="mm-pet-title">

          <h2>
            🎁 펫 뽑기
          </h2>

          <span class="mm-currency">
            ✨ ${state.petCurrency}
          </span>

        </div>


        <p>
          별빛 20개로 새로운 친구를 만날 수 있어요.
          중복 펫은 펫 코인으로 바뀌어요.
        </p>


        <button
          class="mm-pet-button"
          data-pet-action="draw"
          type="button"
          ${canDraw ? "" : "disabled"}
        >
          ✨ 별빛 20개로 뽑기
        </button>


        <div class="mm-gacha-rates">

          <strong>
            뽑기 확률
          </strong>

          <div>
            일반 70%
            · 희귀 25%
            · 특별 5%
          </div>

        </div>


        <div
          id="petGachaResult"
          class="mm-gacha-result"
        ></div>

      </section>
    `;
  }


  function renderPetBook() {

    return `
      <section class="mm-pet-section">

        <div class="mm-pet-title">

          <h2>
            📖 펫 도감
          </h2>

          <span>
            ${state.ownedPets.length}/${PET_LIST.length}
          </span>

        </div>


        <div class="mm-pet-grid">

          ${PET_LIST.map(pet => {

            const owned =
              state.ownedPets.includes(
                pet.id
              );

            const active =
              state.selectedPet === pet.id;


            return `
              <div
                class="mm-pet-item ${active ? "active" : ""}"
              >

                <div class="mm-pet-icon">
                  ${owned ? pet.icon : "❔"}
                </div>

                <div class="mm-pet-name">
                  ${owned ? pet.name : "???"}
                </div>

                <div class="mm-pet-rarity">
                  ${pet.rarity}
                </div>


                ${
                  owned
                    ? `
                      <button
                        class="mm-pet-button secondary"
                        data-pet-action="select"
                        data-pet-id="${pet.id}"
                        type="button"
                      >
                        ${
                          active
                            ? "현재 펫"
                            : "선택하기"
                        }
                      </button>
                    `
                    : ""
                }

              </div>
            `;
          }).join("")}

        </div>

      </section>
    `;
  }


  function renderPetAccessories(pet) {

    const acc =
      state.petAccessories[pet.id] || {
        hat: "none",
        outfit: "none"
      };


    return `
      <section class="mm-pet-section">

        <div class="mm-pet-title">

          <h2>
            🎀 ${pet.name} 꾸미기
          </h2>

          <span>
            🪙 ${state.petCoins}
          </span>

        </div>


        <p>
          한 번 구매한 장식은 계속 가지고 있을 수 있어요.
        </p>


        <h3>
          🎩 모자
        </h3>

        <div class="mm-pet-accessory-grid">

          ${Object.values(PET_HATS)
            .map(item => {

              const owned =
                isAccessoryOwned(
                  pet.id,
                  "hat",
                  item.id
                );

              const equipped =
                acc.hat === item.id;


              return `
                <button
                  class="
                    mm-accessory
                    ${equipped ? "active" : ""}
                  "
                  data-pet-action="accessory-hat"
                  data-accessory="${item.id}"
                  type="button"
                >

                  <span>
                    ${item.icon}
                  </span>

                  <strong>
                    ${item.name}
                  </strong>

                  ${
                    item.price === 0
                      ? `<small>기본</small>`
                      : owned
                        ? `<small>보유 · ${equipped ? "장착 중" : "장착"}</small>`
                        : `<small>🪙 ${item.price}</small>`
                  }

                </button>
              `;
            })
            .join("")}

        </div>


        <h3 style="margin-top:20px;">
          🧣 장식
        </h3>

        <div class="mm-pet-accessory-grid">

          ${Object.values(PET_OUTFITS)
            .map(item => {

              const owned =
                isAccessoryOwned(
                  pet.id,
                  "outfit",
                  item.id
                );

              const equipped =
                acc.outfit === item.id;


              return `
                <button
                  class="
                    mm-accessory
                    ${equipped ? "active" : ""}
                  "
                  data-pet-action="accessory-outfit"
                  data-accessory="${item.id}"
                  type="button"
                >

                  <span>
                    ${item.icon}
                  </span>

                  <strong>
                    ${item.name}
                  </strong>

                  ${
                    item.price === 0
                      ? `<small>기본</small>`
                      : owned
                        ? `<small>보유 · ${equipped ? "장착 중" : "장착"}</small>`
                        : `<small>🪙 ${item.price}</small>`
                  }

                </button>
              `;
            })
            .join("")}

        </div>

      </section>
    `;
  }


  function isAccessoryOwned(
    petId,
    type,
    itemId
  ) {

    if (itemId === "none") {
      return true;
    }


    const owned =
      state.petAccessories[petId]?.owned;


    if (
      owned &&
      Array.isArray(owned[type])
    ) {
      return owned[type].includes(
        itemId
      );
    }


    return false;
  }


  function ensureAccessoryInventory(petId) {

    if (!state.petAccessories[petId]) {

      state.petAccessories[petId] = {
        hat: "none",
        outfit: "none",
        owned: {
          hat: [],
          outfit: []
        }
      };

      return;
    }


    if (
      !state.petAccessories[petId].owned
    ) {

      state.petAccessories[petId].owned = {
        hat: [],
        outfit: []
      };
    }


    if (
      !Array.isArray(
        state.petAccessories[petId].owned.hat
      )
    ) {

      state.petAccessories[petId].owned.hat = [];
    }


    if (
      !Array.isArray(
        state.petAccessories[petId].owned.outfit
      )
    ) {

      state.petAccessories[petId].owned.outfit = [];
    }
  }


  function useAccessory(
    type,
    id
  ) {

    if (!state.selectedPet) {
      return;
    }


    const data =
      type === "hat"
        ? PET_HATS[id]
        : PET_OUTFITS[id];


    if (!data) {
      return;
    }


    ensureAccessoryInventory(
      state.selectedPet
    );


    const inventory =
      state.petAccessories[
        state.selectedPet
      ];


    if (id === "none") {

      inventory[type] = "none";

      saveState();

      renderPetPage();

      toast("장식을 벗겼어요.");

      return;
    }


    const owned =
      inventory.owned[type].includes(
        id
      );


    if (!owned) {

      if (
        state.petCoins <
        data.price
      ) {

        toast(
          "펫 코인이 부족해요."
        );

        return;
      }


      state.petCoins -=
        data.price;

      inventory.owned[type].push(
        id
      );

      toast(
        `${data.name}을 구매했어요!`
      );
    }


    inventory[type] = id;

    saveState();

    renderPetPage();
  }


  /* =========================================================
     첫 펫
  ========================================================= */

  function firstPetDraw() {

    if (
      state.firstPetTutorialDone
    ) {

      if (
        state.selectedPet
      ) {

        renderPetPage();

        return;
      }
    }


    state.firstPetTutorialDone =
      true;


    if (
      !state.ownedPets.includes(
        "bunny"
      )
    ) {

      state.ownedPets.push(
        "bunny"
      );
    }


    state.selectedPet =
      "bunny";


    ensureAccessoryInventory(
      "bunny"
    );


    addXP(10);

    saveState();

    renderPetPage();

    showPetResult(
      "첫 번째 친구가 도착했어요!",
      "🐰 몽글토끼",
      "첫 펫은 특별히 무료로 만났어요."
    );

    toast(
      "몽글토끼가 친구가 되었어요! 🐰"
    );
  }


  /* =========================================================
     일반 펫 뽑기
  ========================================================= */

  function drawPet() {

    if (
      state.petCurrency < 20
    ) {

      toast(
        "별빛이 부족해요. 퀘스트를 완료해 보세요!"
      );

      return;
    }


    state.petCurrency -= 20;

    state.stats.petDraws += 1;


    const result =
      rollPet();


    if (
      state.ownedPets.includes(
        result.id
      )
    ) {

      state.petCoins +=
        result.duplicateCoins;

      saveState();

      renderPetPage();

      showPetResult(
        "중복 펫!",
        `${result.icon} ${result.name}`,
        `펫 코인 ${result.duplicateCoins}개로 바뀌었어요.`
      );

      return;
    }


    state.ownedPets.push(
      result.id
    );

    state.selectedPet =
      result.id;


    ensureAccessoryInventory(
      result.id
    );


    addXP(15);

    saveState();

    renderPetPage();

    showPetResult(
      "새로운 친구 등장!",
      `${result.icon} ${result.name}`,
      `${result.rarity} 펫을 만났어요!`
    );
  }


  function rollPet() {

    const roll =
      Math.random() * 100;

    let total = 0;


    for (
      const pet of PET_LIST
    ) {

      if (
        pet.id === "bunny"
      ) {
        continue;
      }


      total += pet.rate;


      if (
        roll <= total
      ) {

        return pet;
      }
    }


    return PETS.puppy;
  }


  function showPetResult(
    title,
    name,
    description
  ) {

    const result =
      $("petGachaResult");


    if (!result) {
      return;
    }


    result.innerHTML = `
      <strong>
        ${title}
      </strong>

      <div style="
        font-size:42px;
        margin:10px 0;
      ">
        ${name}
      </div>

      <p>
        ${description}
      </p>
    `;


    result.classList.add(
      "show"
    );
  }


  /* =========================================================
     펫 조각 상점
  ========================================================= */

  function renderFragmentShop() {

    return `
      <section class="mm-pet-section">

        <div class="mm-pet-title">

          <h2>
            🧩 펫 조각 상점
          </h2>

          <span>
            🪙 ${state.petCoins}
          </span>

        </div>

        <p>
          펫 코인 5개로 원하는 펫 조각을 살 수 있어요.
        </p>


        ${PET_LIST
          .filter(
            pet =>
              pet.id !== "bunny"
          )
          .map(pet => {

            const count =
              Number(
                state.petFragments[
                  pet.id
                ] || 0
              );


            const need =
              pet.fragmentNeed;


            return `
              <div class="mm-fragment">

                <div>

                  <strong>
                    ${pet.icon}
                    ${pet.name}
                  </strong>

                  <div>
                    🧩 ${count}/${need}
                  </div>

                </div>


                <div>

                  <button
                    class="mm-pet-button secondary"
                    data-pet-action="fragment"
                    data-pet-id="${pet.id}"
                    type="button"
                    ${state.petCoins < 5 ? "disabled" : ""}
                  >
                    🪙 5
                  </button>


                  <button
                    class="mm-pet-button"
                    data-pet-action="craft"
                    data-pet-id="${pet.id}"
                    type="button"
                    ${
                      count < need ||
                      state.ownedPets.includes(
                        pet.id
                      )
                        ? "disabled"
                        : ""
                    }
                  >
                    ${
                      state.ownedPets.includes(
                        pet.id
                      )
                        ? "보유 중"
                        : "합성"
                    }
                  </button>

                </div>

              </div>
            `;
          })
          .join("")}

      </section>
    `;
  }


  function buyFragment(
    petId
  ) {

    const pet =
      PETS[petId];


    if (!pet) {
      return;
    }


    if (
      state.petCoins < 5
    ) {

      toast(
        "펫 코인이 부족해요."
      );

      return;
    }


    state.petCoins -= 5;


    state.petFragments[
      petId
    ] =
      Number(
        state.petFragments[
          petId
        ] || 0
      ) + 1;


    saveState();

    renderPetPage();

    toast(
      `${pet.icon} ${pet.name} 조각 +1`
    );
  }


  function craftPet(
    petId
  ) {

    const pet =
      PETS[petId];


    if (!pet) {
      return;
    }


    const count =
      Number(
        state.petFragments[
          petId
        ] || 0
      );


    if (
      count <
      pet.fragmentNeed
    ) {

      toast(
        `조각이 ${pet.fragmentNeed - count}개 더 필요해요.`
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
    ] -= pet.fragmentNeed;


    state.ownedPets.push(
      petId
    );

    state.selectedPet =
      petId;


    ensureAccessoryInventory(
      petId
    );


    saveState();

    renderPetPage();

    toast(
      `${pet.icon} ${pet.name}을 합성했어요!`
    );
  }


  /* =========================================================
     펫 UI 클릭
  ========================================================= */

  document.addEventListener(
    "click",
    event => {

      const action =
        event.target.closest(
          "[data-pet-action]"
        );


      if (!action) {
        return;
      }


      const type =
        action.dataset.petAction;


      if (
        type === "first-draw"
      ) {

        firstPetDraw();

        return;
      }


      if (
        type === "draw"
      ) {

        drawPet();

        return;
      }


      if (
        type === "select"
      ) {

        const id =
          action.dataset.petId;


        if (
          !state.ownedPets.includes(
            id
          )
        ) {
          return;
        }


        state.selectedPet =
          id;


        ensureAccessoryInventory(
          id
        );


        saveState();

        renderPetPage();

        toast(
          `${PETS[id].name}을 선택했어요.`
        );

        return;
      }


      if (
        type === "accessory-hat"
      ) {

        useAccessory(
          "hat",
          action.dataset.accessory
        );

        return;
      }


      if (
        type === "accessory-outfit"
      ) {

        useAccessory(
          "outfit",
          action.dataset.accessory
        );

        return;
      }


      if (
        type === "fragment"
      ) {

        buyFragment(
          action.dataset.petId
        );

        return;
      }


      if (
        type === "craft"
      ) {

        craftPet(
          action.dataset.petId
        );
      }

    }
  );


  /* =========================================================
     퀘스트
  ========================================================= */

  function getQuestProgress(
    quest
  ) {

    switch (quest.type) {

      case "petGreetings":
        return state.stats.petGreetings;

      case "petDraws":
        return state.stats.petDraws;

      case "petCollection":
        return state.ownedPets.length;

      case "waters":
        return state.stats.waters;

      case "harvests":
        return state.stats.harvests;

      case "breaths":
        return state.stats.breaths;

      case "journals":
        return state.stats.journals;

      case "shellFinds":
        return state.stats.shellFinds;

      default:
        return 0;
    }
  }


  function getQuestStage(
    quest
  ) {

    const value =
      Number(
        state.questStages[
          quest.id
        ] || 0
      );


    return Math.min(
      value,
      quest.stages.length - 1
    );
  }


  function renderQuestPage() {

    const root =
      $("questRoomRoot");


    if (!root) {
      return;
    }


    root.innerHTML = `

      <div class="mm-pet-ui">

        <section class="mm-pet-section">

          <div class="mm-pet-title">

            <h2>
              ✨ 별빛 퀘스트
            </h2>

            <span class="mm-currency">
              ✨ ${state.petCurrency}
            </span>

          </div>

          <p>
            활동을 하면서 별빛을 조금씩 모아
            새로운 펫을 만나 보세요.
          </p>

        </section>


        ${QUESTS.map(
          quest =>
            renderQuest(
              quest
            )
        ).join("")}

      </div>
    `;

    applyPetUIStyles();
  }


  function renderQuest(
    quest
  ) {

    const stage =
      getQuestStage(
        quest
      );


    const goal =
      quest.stages[
        stage
      ];


    const progress =
      Math.min(
        goal,
        getQuestProgress(
          quest
        )
      );


    const completed =
      progress >= goal;


    const percent =
      Math.round(
        progress /
        goal *
        100
      );


    return `
      <section class="
        mm-quest
        ${completed ? "completed" : ""}
      ">

        <div class="mm-quest-top">

          <div class="mm-quest-icon">
            ${quest.icon}
          </div>


          <div class="mm-quest-body">

            <div class="mm-quest-name">
              ${quest.title}
            </div>

            <div class="mm-quest-desc">
              ${quest.description}
            </div>


            <div class="mm-quest-progress">

              <div
                style="width:${percent}%"
              ></div>

            </div>


            <div class="mm-quest-bottom">

              <span>
                ${progress} / ${goal}
              </span>

              <span>
                ✨ +${quest.reward}
              </span>


              <button
                class="mm-pet-button"
                data-quest-action="claim"
                data-quest-id="${quest.id}"
                type="button"
                ${completed ? "" : "disabled"}
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

      </section>
    `;
  }


  document.addEventListener(
    "click",
    event => {

      const button =
        event.target.closest(
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
  );


  function claimQuest(
    id
  ) {

    const quest =
      QUESTS.find(
        q => q.id === id
      );


    if (!quest) {
      return;
    }


    const stage =
      getQuestStage(
        quest
      );


    const goal =
      quest.stages[
        stage
      ];


    const progress =
      getQuestProgress(
        quest
      );


    if (
      progress <
      goal
    ) {

      toast(
        "아직 완료하지 않았어요."
      );

      return;
    }


    state.petCurrency +=
      quest.reward;


    state.questStages[
      quest.id
    ] =
      Math.min(
        stage + 1,
        quest.stages.length - 1
      );


    addXP(10);


    saveState();

    renderQuestPage();

    toast(
      `퀘스트 완료! ✨ 별빛 +${quest.reward}`
    );
  }


  /* =========================================================
     정원
  ========================================================= */

  function updateGardenUI() {

    const water =
      $("waterStatus");


    if (water) {

      water.textContent =
        state.stats.waters > 0
          ? `물 주기 ${state.stats.waters}회`
          : "아직 안 했어요";
    }
  }


  document.addEventListener(
    "click",
    event => {

      const water =
        event.target.closest(
          "#gardenWater"
        );


      if (!water) {
        return;
      }


      state.stats.waters += 1;

      state.flowers += 1;

      state.coins += 5;

      state.petCurrency += 1;

      addXP(5);

      saveState();

      updateGardenUI();

      toast(
        "꽃을 돌봤어요! 🌷"
      );
    }
  );


  /* =========================================================
     방
  ========================================================= */

  function updateRoomPreview() {

    const preview =
      $("roomPreview");


    if (!preview) {
      return;
    }


    preview.dataset.theme =
      state.roomDecor;


    document
      .querySelectorAll(
        "[data-room-decor]"
      )
      .forEach(button => {

        button.classList.toggle(
          "active",
          button.dataset.roomDecor ===
            state.roomDecor
        );
      });
  }


  document.addEventListener(
    "click",
    event => {

      const button =
        event.target.closest(
          "[data-room-decor]"
        );


      if (!button) {
        return;
      }


      state.roomDecor =
        button.dataset.roomDecor;


      saveState();

      updateRoomPreview();

      toast(
        "방 분위기를 바꿨어요. 🪴"
      );
    }
  );


  /* =========================================================
     마음 기록
  ========================================================= */

  function updateJournalUI() {

    const input =
      $("journalText");


    if (input) {
      input.value =
        state.journalText || "";
    }


    document
      .querySelectorAll(
        "[data-mood]"
      )
      .forEach(button => {

        button.classList.toggle(
          "active",
          button.dataset.mood ===
            state.mood
        );
      });


    const saved =
      $("moodSaved");


    if (saved) {

      saved.textContent =
        state.mood
          ? `오늘의 마음: ${moodName(state.mood)}`
          : "기분을 기록하지 않아도 괜찮아요.";
    }
  }


  function moodName(
    mood
  ) {

    return {
      calm: "차분해요 🌿",
      happy: "기분이 좋아요 ☀️",
      tired: "조금 지쳤어요 🌙",
      worried: "조금 걱정돼요 ☁️"
    }[mood] || mood;
  }


  document.addEventListener(
    "click",
    event => {

      const mood =
        event.target.closest(
          "[data-mood]"
        );


      if (!mood) {
        return;
      }


      state.mood =
        mood.dataset.mood;


      saveState();

      updateJournalUI();

      toast(
        "오늘의 마음을 기록했어요."
      );
    }
  );


  document.addEventListener(
    "click",
    event => {

      const saveButton =
        event.target.closest(
          "#journalSave"
        );


      if (!saveButton) {
        return;
      }


      const input =
        $("journalText");


      if (!input) {
        return;
      }


      state.journalText =
        input.value.trim();


      state.journalDate =
        new Date()
          .toISOString()
          .slice(0, 10);


      state.stats.journals += 1;

      state.petCurrency += 2;

      addXP(8);

      saveState();

      toast(
        "마음 기록을 저장했어요. 💭"
      );
    }
  );


  /* =========================================================
     호흡
  ========================================================= */

  let breathing = false;
  let breathingTimer = null;
  let breathingSeconds = 0;


  document.addEventListener(
    "click",
    event => {

      const button =
        event.target.closest(
          "#breathBtn"
        );


      if (!button) {
        return;
      }


      if (breathing) {
        return;
      }


      startBreathing();
    }
  );


  document.addEventListener(
    "click",
    event => {

      const stop =
        event.target.closest(
          "#stopBreath"
        );


      if (!stop) {
        return;
      }


      stopBreathing();

      toast(
        "호흡 활동을 멈췄어요."
      );
    }
  );


  function startBreathing() {

    const box =
      $("breathBox");

    const text =
      $("breathText");

    const instruction =
      $("breathInstruction");


    if (!box) {
      return;
    }


    breathing = true;

    breathingSeconds = 30;


    box.hidden = false;


    if (text) {
      text.textContent =
        "천천히 숨 쉬어요";
    }


    if (instruction) {
      instruction.textContent =
        "편안한 속도로 호흡해요.";
    }


    clearInterval(
      breathingTimer
    );


    breathingTimer =
      setInterval(() => {

        breathingSeconds -= 1;


        if (instruction) {

          instruction.textContent =
            `${breathingSeconds}초 남았어요.`;
        }


        if (
          breathingSeconds <= 0
        ) {

          finishBreathing();
        }

      }, 1000);
  }


  function finishBreathing() {

    clearInterval(
      breathingTimer
    );


    breathing = false;


    state.stats.breaths += 1;

    state.petCurrency += 2;

    addXP(10);


    saveState();


    const box =
      $("breathBox");


    if (box) {
      box.hidden = true;
    }


    toast(
      "잘 쉬었어요. 🌿 별빛 +2"
    );
  }


  function stopBreathing() {

    clearInterval(
      breathingTimer
    );


    breathing = false;


    const box =
      $("breathBox");


    if (box) {
      box.hidden = true;
    }
  }


  /* =========================================================
     마을 3D
     
     이 부분은 페이지 이동과 완전히 분리되어 있음.
  ========================================================= */

  let villageInitialized = false;

  let scene = null;
  let camera = null;
  let renderer = null;

  let avatar = null;
  let avatarModel = null;

  let villagePet = null;

  let villageShell = null;

  let sceneStatus = null;

  let keys = {};

  let animationFrame = null;

  let targetPosition = null;

  let mouseX = 0;
  let mouseY = 0;

  let cameraYaw = 0;
  let cameraPitch = 0.32;


  function initVillage() {

    if (villageInitialized) {

      if (
        renderer &&
        renderer.domElement
      ) {

        setTimeout(
          resizeVillage,
          50
        );
      }

      return;
    }


    const root =
      $("world");


    if (!root) {
      return;
    }


    villageInitialized = true;


    try {

      createVillageScene();

      loadCharacter();

      createVillagePet();

      createShell();

      setupVillageControls();

      resizeVillage();

      animateVillage();

    } catch (error) {

      console.error(
        "3D 마을 초기화 오류:",
        error
      );


      /*
        3D가 실패해도 페이지 자체는
        계속 사용할 수 있도록 한다.
      */

      if (sceneStatus) {

        sceneStatus.textContent =
          "마을을 불러오는 중이에요.";
      }
    }
  }


  function createVillageScene() {

    const root =
      $("world");


    if (!root) {
      return;
    }


    scene =
      new THREE.Scene();


    scene.background =
      new THREE.Color(
        0xbadcf3
      );


    scene.fog =
      new THREE.Fog(
        0xbadcf3,
        20,
        55
      );


    camera =
      new THREE.PerspectiveCamera(
        43,
        1,
        0.1,
        100
      );


    camera.position.set(
      0,
      6.5,
      24
    );


    renderer =
      new THREE.WebGLRenderer({
        antialias: true,
        alpha: false
      });


    renderer.setPixelRatio(
      Math.min(
        window.devicePixelRatio || 1,
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
      1.05;


    renderer.domElement.style.width =
      "100%";


    renderer.domElement.style.height =
      "100%";


    renderer.domElement.style.display =
      "block";


    root.innerHTML = "";

    root.appendChild(
      renderer.domElement
    );


    const ambient =
      new THREE.HemisphereLight(
        0xdff5ff,
        0x8a745f,
        2.1
      );


    scene.add(
      ambient
    );


    const sun =
      new THREE.DirectionalLight(
        0xfff4df,
        3.0
      );


    sun.position.set(
      8,
      16,
      10
    );


    sun.castShadow =
      true;


    sun.shadow.mapSize.width =
      2048;


    sun.shadow.mapSize.height =
      2048;


    scene.add(
      sun
    );


    createGround();

    createPaths();

    createPond();

    createHouse();

    createTrees();

    createFlowers();

    createLamps();


    avatar =
      new THREE.Group();


    avatar.position.set(
      Number(state.x) || 0,
      0,
      Number(state.z) || 4
    );


    scene.add(
      avatar
    );


    sceneStatus =
      $("sceneStatus");
  }


  function createGround() {

    const ground =
      new THREE.Mesh(
        new THREE.PlaneGeometry(
          42,
          42
        ),
        new THREE.MeshStandardMaterial({
          color: 0x91bd7b,
          roughness: 1
        })
      );


    ground.rotation.x =
      -Math.PI / 2;


    ground.receiveShadow =
      true;


    scene.add(
      ground
    );
  }


  function createPaths() {

    const material =
      new THREE.MeshStandardMaterial({
        color: 0xe7d4ae,
        roughness: 1
      });


    const path1 =
      new THREE.Mesh(
        new THREE.BoxGeometry(
          3,
          0.08,
          42
        ),
        material
      );


    path1.position.y =
      0.04;


    scene.add(
      path1
    );


    const path2 =
      new THREE.Mesh(
        new THREE.BoxGeometry(
          42,
          0.08,
          3
        ),
        material
      );


    path2.position.y =
      0.05;


    scene.add(
      path2
    );
  }


  function createPond() {

    const pond =
      new THREE.Mesh(
        new THREE.CircleGeometry(
          5,
          48
        ),
        new THREE.MeshStandardMaterial({
          color: 0x78c7dc,
          roughness: 0.25,
          metalness: 0.05
        })
      );


    pond.rotation.x =
      -Math.PI / 2;


    pond.position.set(
      -9,
      0.08,
      -7
    );


    scene.add(
      pond
    );


    for (
      let i = 0;
      i < 10;
      i++
    ) {

      const angle =
        i / 10 *
        Math.PI *
        2;


      const rock =
        new THREE.Mesh(
          new THREE.SphereGeometry(
            0.35,
            12,
            8
          ),
          new THREE.MeshStandardMaterial({
            color: 0x8d9a8c
          })
        );


      rock.scale.y =
        0.55;


      rock.position.set(
        -9 +
          Math.cos(angle) *
          5.1,
        0.22,
        -7 +
          Math.sin(angle) *
          5.1
      );


      rock.castShadow =
        true;


      scene.add(
        rock
      );
    }
  }


  function createHouse() {

    const group =
      new THREE.Group();


    group.position.set(
      8,
      0,
      -6
    );


    const wall =
      new THREE.Mesh(
        new THREE.BoxGeometry(
          7,
          4.3,
          6
        ),
        new THREE.MeshStandardMaterial({
          color: 0xf8d9c9
        })
      );


    wall.position.y =
      2.15;


    wall.castShadow =
      true;


    wall.receiveShadow =
      true;


    group.add(
      wall
    );


    /*
      지붕을 두 박스가 아니라
      하나의 정상적인 지붕 형태로 만들어
      거꾸로 보이는 문제를 피한다.
    */

    const roof =
      new THREE.Mesh(
        new THREE.ConeGeometry(
          4.9,
          2.5,
          4
        ),
        new THREE.MeshStandardMaterial({
          color: 0xb96f77
        })
      );


    roof.rotation.y =
      Math.PI / 4;


    roof.position.y =
      5.5;


    roof.castShadow =
      true;


    group.add(
      roof
    );


    const door =
      new THREE.Mesh(
        new THREE.BoxGeometry(
          1.25,
          2.1,
          0.18
        ),
        new THREE.MeshStandardMaterial({
          color: 0x805c50
        })
      );


    door.position.set(
      0,
      1.05,
      3.08
    );


    group.add(
      door
    );


    for (
      const x of [-2, 2]
    ) {

      const window =
        new THREE.Mesh(
          new THREE.BoxGeometry(
            1.4,
            1.25,
            0.15
          ),
          new THREE.MeshStandardMaterial({
            color: 0x9ed7e7,
            roughness: 0.15
          })
        );


      window.position.set(
        x,
        2.5,
        3.08
      );


      group.add(
        window
      );
    }


    scene.add(
      group
    );
  }


  function createTrees() {

    const positions = [
      [-15, -12],
      [-14, 8],
      [15, 10],
      [14, -12],
      [-7, 13],
      [7, 13]
    ];


    positions.forEach(
      ([x, z], index) => {

        const group =
          new THREE.Group();


        const trunk =
          new THREE.Mesh(
            new THREE.CylinderGeometry(
              0.35,
              0.48,
              2.5,
              8
            ),
            new THREE.MeshStandardMaterial({
              color: 0x8b654e
            })
          );


        trunk.position.y =
          1.25;


        trunk.castShadow =
          true;


        group.add(
          trunk
        );


        const crown =
          new THREE.Mesh(
            new THREE.SphereGeometry(
              1.7 +
                (index % 2) *
                0.25,
              16,
              12
            ),
            new THREE.MeshStandardMaterial({
              color:
                index % 2
                  ? 0x76a96b
                  : 0x8fbc76
            })
          );


        crown.position.y =
          3.0;


        crown.castShadow =
          true;


        group.add(
          crown
        );


        group.position.set(
          x,
          0,
          z
        );


        scene.add(
          group
        );
      }
    );
  }


  function createFlowers() {

    const colors = [
      0xffd3df,
      0xffe4a9,
      0xcbb9ef,
      0xffffff
    ];


    for (
      let i = 0;
      i < 35;
      i++
    ) {

      const group =
        new THREE.Group();


      const stem =
        new THREE.Mesh(
          new THREE.CylinderGeometry(
            0.035,
            0.05,
            0.45,
            6
          ),
          new THREE.MeshStandardMaterial({
            color: 0x5f914e
          })
        );


      stem.position.y =
        0.22;


      group.add(
        stem
      );


      const flower =
        new THREE.Mesh(
          new THREE.SphereGeometry(
            0.17,
            8,
            8
          ),
          new THREE.MeshStandardMaterial({
            color:
              colors[
                i % colors.length
              ]
          })
        );


      flower.position.y =
        0.5;


      group.add(
        flower
      );


      const x =
        ((i * 7) % 34) - 17;


      const z =
        ((i * 11) % 34) - 17;


      if (
        Math.abs(x) < 2.2 ||
        Math.abs(z) < 2.2
      ) {
        continue;
      }


      group.position.set(
        x,
        0,
        z
      );


      scene.add(
        group
      );
    }
  }


  function createLamps() {

    [-5, 5].forEach(
      x => {

        const group =
          new THREE.Group();


        const pole =
          new THREE.Mesh(
            new THREE.CylinderGeometry(
              0.08,
              0.1,
              2.5,
              8
            ),
            new THREE.MeshStandardMaterial({
              color: 0x5e625d
            })
          );


        pole.position.y =
          1.25;


        group.add(
          pole
        );


        const light =
          new THREE.Mesh(
            new THREE.SphereGeometry(
              0.3,
              12,
              12
            ),
            new THREE.MeshStandardMaterial({
              color: 0xffedaa,
              emissive: 0xffd76a,
              emissiveIntensity: 0.8
            })
          );


        light.position.y =
          2.55;


        group.add(
          light
        );


        group.position.set(
          x,
          0,
          1
        );


        scene.add(
          group
        );
      }
    );
  }


  /* =========================================================
     캐릭터 GLB
  ========================================================= */

  function loadCharacter() {

    if (!avatar) {
      return;
    }


    const loader =
      new GLTFLoader();


    const urls = [
      "https://cdn.jsdelivr.net/gh/boyoung0819/mongle-mind@main/components/village/character.glb",
      "https://raw.githubusercontent.com/boyoung0819/mongle-mind/main/components/village/character.glb"
    ];


    let index = 0;


    function tryLoad() {

      if (
        index >= urls.length
      ) {

        createSimpleAvatarFallback();

        return;
      }


      const url =
        urls[index++];


      loader.load(
        url,

        gltf => {

          avatarModel =
            gltf.scene;


          const box =
            new THREE.Box3()
              .setFromObject(
                avatarModel
              );


          const size =
            box.getSize(
              new THREE.Vector3()
            );


          const height =
            size.y || 1;


          const scale =
            3 / height;


          avatarModel.scale.setScalar(
            scale
          );


          const afterBox =
            new THREE.Box3()
              .setFromObject(
                avatarModel
              );


          avatarModel.position.y =
            -afterBox.min.y;


          avatarModel.traverse(
            object => {

              if (
                object.isMesh
              ) {

                object.castShadow =
                  true;

                object.receiveShadow =
                  true;
              }
            }
          );


          avatar.add(
            avatarModel
          );

        },

        undefined,

        () => {

          tryLoad();
        }
      );
    }


    tryLoad();
  }


  function createSimpleAvatarFallback() {

    if (!avatar) {
      return;
    }


    const group =
      new THREE.Group();


    const body =
      new THREE.Mesh(
        new THREE.CapsuleGeometry(
          0.65,
          1.3,
          8,
          16
        ),
        new THREE.MeshStandardMaterial({
          color: 0xf4c9b8
        })
      );


    body.position.y =
      1.1;


    body.castShadow =
      true;


    group.add(
      body
    );


    const head =
      new THREE.Mesh(
        new THREE.SphereGeometry(
          0.75,
          20,
          20
        ),
        new THREE.MeshStandardMaterial({
          color: 0xffeadf
        })
      );


    head.position.y =
      2.25;


    head.castShadow =
      true;


    group.add(
      head
    );


    avatar.add(
      group
    );


    avatarModel =
      group;
  }


  /* =========================================================
     마을 펫
  ========================================================= */

  function createVillagePet() {

    if (!scene) {
      return;
    }


    if (
      villagePet
    ) {

      scene.remove(
        villagePet
      );
    }


    villagePet =
      new THREE.Group();


    const petId =
      state.selectedPet;


    if (!petId) {
      return;
    }


    const data =
      PETS[petId];


    if (!data) {
      return;
    }


    const body =
      new THREE.Mesh(
        new THREE.SphereGeometry(
          0.58,
          16,
          12
        ),
        new THREE.MeshStandardMaterial({
          color: data.body
        })
      );


    body.scale.y =
      0.9;


    body.position.y =
      0.7;


    body.castShadow =
      true;


    villagePet.add(
      body
    );


    const head =
      new THREE.Mesh(
        new THREE.SphereGeometry(
          0.48,
          16,
          12
        ),
        new THREE.MeshStandardMaterial({
          color: data.body
        })
      );


    head.position.y =
      1.25;


    head.castShadow =
      true;


    villagePet.add(
      head
    );


    const eyeMaterial =
      new THREE.MeshStandardMaterial({
        color: 0x40353d
      });


    [-0.17, 0.17].forEach(
      x => {

        const eye =
          new THREE.Mesh(
            new THREE.SphereGeometry(
              0.045,
              8,
              8
            ),
            eyeMaterial
          );


        eye.position.set(
          x,
          1.3,
          0.42
        );


        villagePet.add(
          eye
        );
      }
    );


    scene.add(
      villagePet
    );
  }


  /* =========================================================
     조개
  ========================================================= */

  function createShell() {

    if (!scene) {
      return;
    }


    villageShell =
      new THREE.Mesh(
        new THREE.SphereGeometry(
          0.3,
          12,
          8
        ),
        new THREE.MeshStandardMaterial({
          color: 0xf6b5ca
        })
      );


    villageShell.position.set(
      8,
      0.25,
      5
    );


    villageShell.scale.set(
      1,
      0.5,
      1
    );


    villageShell.castShadow =
      true;


    villageShell.visible =
      !state.foundShell;


    scene.add(
      villageShell
    );
  }


  /* =========================================================
     마을 상호작용
  ========================================================= */

  function setupVillageControls() {

    if (!renderer) {
      return;
    }


    const canvas =
      renderer.domElement;


    window.addEventListener(
      "keydown",
      event => {

        keys[
          event.key.toLowerCase()
        ] = true;


        if (
          event.key === "ArrowUp" ||
          event.key === "ArrowDown" ||
          event.key === "ArrowLeft" ||
          event.key === "ArrowRight" ||
          event.key === " "
        ) {

          event.preventDefault();
        }


        if (
          event.key.toLowerCase() === "e"
        ) {

          interactVillage();
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


    /*
      캔버스 클릭은
      UI 버튼과 충돌하지 않는다.
    */

    canvas.addEventListener(
      "pointerdown",
      event => {

        if (
          currentPage !==
          "village"
        ) {
          return;
        }


        const rect =
          canvas.getBoundingClientRect();


        const ndc =
          new THREE.Vector2(
            (
              (event.clientX -
                rect.left) /
                rect.width
            ) * 2 - 1,

            -(
              (
                (event.clientY -
                  rect.top) /
                  rect.height
              ) * 2 - 1
            )
          );


        const raycaster =
          new THREE.Raycaster();


        raycaster.setFromCamera(
          ndc,
          camera
        );


        const plane =
          new THREE.Plane(
            new THREE.Vector3(
              0,
              1,
              0
            ),
            0
          );


        const point =
          new THREE.Vector3();


        if (
          raycaster.ray.intersectPlane(
            plane,
            point
          )
        ) {

          targetPosition =
            new THREE.Vector3(
              THREE.MathUtils.clamp(
                point.x,
                -18,
                18
              ),
              0,
              THREE.MathUtils.clamp(
                point.z,
                -18,
                18
              )
            );
        }
      }
    );


    let dragging =
      false;


    let lastX = 0;
    let lastY = 0;


    canvas.addEventListener(
      "pointerdown",
      event => {

        if (
          event.button === 2
        ) {

          dragging = true;

          lastX =
            event.clientX;

          lastY =
            event.clientY;
        }
      }
    );


    window.addEventListener(
      "pointermove",
      event => {

        if (
          !dragging ||
          currentPage !==
            "village"
        ) {
          return;
        }


        const dx =
          event.clientX -
          lastX;


        const dy =
          event.clientY -
          lastY;


        lastX =
          event.clientX;

        lastY =
          event.clientY;


        cameraYaw -=
          dx * 0.008;


        cameraPitch =
          THREE.MathUtils.clamp(
            cameraPitch -
              dy * 0.005,
            0.08,
            0.75
          );
      }
    );


    window.addEventListener(
      "pointerup",
      () => {

        dragging = false;
      }
    );


    canvas.addEventListener(
      "contextmenu",
      event => {

        event.preventDefault();
      }
    );


    document
      .querySelectorAll(
        ".touch-pad button"
      )
      .forEach(button => {

        const key =
          button.dataset.k;


        button.addEventListener(
          "pointerdown",
          event => {

            event.preventDefault();

            keys[key] = true;
          }
        );


        button.addEventListener(
          "pointerup",
          () => {

            keys[key] = false;
          }
        );


        button.addEventListener(
          "pointerleave",
          () => {

            keys[key] = false;
          }
        );
      });
  }


  function interactVillage() {

    if (
      currentPage !==
      "village"
    ) {
      return;
    }


    if (!avatar) {
      return;
    }


    const x =
      avatar.position.x;


    const z =
      avatar.position.z;


    /*
      조개
    */

    if (
      villageShell &&
      villageShell.visible &&
      distance2D(
        x,
        z,
        villageShell.position.x,
        villageShell.position.z
      ) < 2
    ) {

      villageShell.visible =
        false;


      state.foundShell =
        true;


      state.stats.shellFinds +=
        1;


      state.coins += 8;

      state.petCurrency +=
        2;

      addXP(8);

      saveState();

      toast(
        "숨겨진 조개를 찾았어요! 🐚"
      );

      return;
    }


    /*
      마을 동물 친구
    */

    if (
      distance2D(
        x,
        z,
        -5,
        -1
      ) < 3
    ) {

      state.stats.petGreetings +=
        1;


      state.petCurrency +=
        1;


      addXP(5);

      saveState();

      toast(
        "동물 친구와 인사했어요! 🐾"
      );

      return;
    }


    toast(
      "조금 더 가까이 가면 상호작용할 수 있어요."
    );
  }


  function distance2D(
    x1,
    z1,
    x2,
    z2
  ) {

    return Math.sqrt(
      (x1 - x2) ** 2 +
      (z1 - z2) ** 2
    );
  }


  /* =========================================================
     마을 애니메이션
  ========================================================= */

  let lastTime =
    performance.now();


  function animateVillage(
    now = performance.now()
  ) {

    animationFrame =
      requestAnimationFrame(
        animateVillage
      );


    if (
      !renderer ||
      !scene ||
      !camera
    ) {
      return;
    }


    const dt =
      Math.min(
        0.05,
        (now - lastTime) /
          1000
      );


    lastTime =
      now;


    if (
      currentPage ===
      "village"
    ) {

      updateAvatarMovement(
        dt
      );


      updateCamera(
        dt
      );


      updateVillagePet(
        now
      );


      if (
        villageShell &&
        villageShell.visible
      ) {

        villageShell.rotation.y +=
          dt * 1.5;
      }
    }


    renderer.render(
      scene,
      camera
    );
  }


  function updateAvatarMovement(
    dt
  ) {

    if (!avatar) {
      return;
    }


    let dx = 0;
    let dz = 0;


    if (
      keys["w"] ||
      keys["arrowup"]
    ) {
      dz -= 1;
    }


    if (
      keys["s"] ||
      keys["arrowdown"]
    ) {
      dz += 1;
    }


    if (
      keys["a"] ||
      keys["arrowleft"]
    ) {
      dx -= 1;
    }


    if (
      keys["d"] ||
      keys["arrowright"]
    ) {
      dx += 1;
    }


    if (
      dx !== 0 ||
      dz !== 0
    ) {

      targetPosition =
        null;


      const length =
        Math.sqrt(
          dx * dx +
          dz * dz
        );


      dx /= length;
      dz /= length;


      const speed =
        4.2;


      avatar.position.x +=
        dx * speed * dt;


      avatar.position.z +=
        dz * speed * dt;


      avatar.rotation.y =
        Math.atan2(
          dx,
          dz
        );
    }


    else if (
      targetPosition
    ) {

      const vx =
        targetPosition.x -
        avatar.position.x;


      const vz =
        targetPosition.z -
        avatar.position.z;


      const distance =
        Math.sqrt(
          vx * vx +
          vz * vz
        );


      if (
        distance < 0.15
      ) {

        targetPosition =
          null;

      } else {

        const speed =
          4.0;


        avatar.position.x +=
          vx /
            distance *
            speed *
            dt;


        avatar.position.z +=
          vz /
            distance *
            speed *
            dt;


        avatar.rotation.y =
          Math.atan2(
            vx,
            vz
          );
      }
    }


    avatar.position.x =
      THREE.MathUtils.clamp(
        avatar.position.x,
        -18,
        18
      );


    avatar.position.z =
      THREE.MathUtils.clamp(
        avatar.position.z,
        -18,
        18
      );


    state.x =
      avatar.position.x;


    state.z =
      avatar.position.z;
  }


  function updateCamera() {

    if (
      !avatar ||
      !camera
    ) {
      return;
    }


    const distance =
      13;


    const horizontal =
      Math.cos(
        cameraPitch
      ) *
      distance;


    const vertical =
      Math.sin(
        cameraPitch
      ) *
      distance;


    const desired =
      new THREE.Vector3(
        avatar.position.x +
          Math.sin(
            cameraYaw
          ) *
          horizontal,

        avatar.position.y +
          3.0 +
          vertical,

        avatar.position.z +
          Math.cos(
            cameraYaw
          ) *
          horizontal
      );


    camera.position.lerp(
      desired,
      0.08
    );


    const lookAt =
      new THREE.Vector3(
        avatar.position.x,
        1.45,
        avatar.position.z
      );


    camera.lookAt(
      lookAt
    );
  }


  function updateVillagePet(
    now
  ) {

    if (
      !villagePet ||
      !avatar
    ) {
      return;
    }


    const target =
      new THREE.Vector3(
        avatar.position.x +
          1.0,
        0,
        avatar.position.z +
          0.8
      );


    villagePet.position.lerp(
      target,
      0.08
    );


    villagePet.position.y =
      Math.sin(
        now * 0.004
      ) *
      0.08;


    villagePet.rotation.y =
      avatar.rotation.y;
  }


  function resizeVillage() {

    if (
      !renderer ||
      !camera
    ) {
      return;
    }


    const root =
      $("world");


    if (!root) {
      return;
    }


    const width =
      Math.max(
        1,
        root.clientWidth
      );


    const height =
      Math.max(
        1,
        root.clientHeight
      );


    camera.aspect =
      width / height;


    camera.updateProjectionMatrix();


    renderer.setSize(
      width,
      height,
      false
    );
  }


  window.addEventListener(
    "resize",
    resizeVillage
  );


  /* =========================================================
     펫 UI 스타일
  ========================================================= */

  function applyPetUIStyles() {

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
        display:grid;
        gap:18px;
        max-width:1100px;
        margin:0 auto 100px;
      }

      .mm-pet-section {
        background:rgba(255,255,255,.88);
        border:1px solid rgba(120,90,130,.10);
        border-radius:26px;
        padding:24px;
        box-shadow:0 12px 35px rgba(90,70,100,.07);
      }

      .mm-pet-title {
        display:flex;
        justify-content:space-between;
        align-items:center;
        gap:12px;
        margin-bottom:14px;
      }

      .mm-pet-title h2 {
        margin:0;
        font-size:21px;
      }

      .mm-pet-currency {
        display:flex;
        gap:7px;
        flex-wrap:wrap;
      }

      .mm-currency {
        display:inline-flex;
        align-items:center;
        gap:4px;
        padding:8px 12px;
        border-radius:999px;
        background:#f7f1fb;
        font-size:13px;
        font-weight:800;
      }

      .mm-pet-section p {
        color:#6f6875;
        line-height:1.7;
        font-size:14px;
      }

      .mm-pet-button {
        border:0;
        border-radius:14px;
        padding:11px 16px;
        background:#7f6a9e;
        color:white;
        font-weight:800;
        cursor:pointer;
        margin-top:10px;
      }

      .mm-pet-button:hover {
        transform:translateY(-1px);
      }

      .mm-pet-button:disabled {
        opacity:.4;
        cursor:not-allowed;
        transform:none;
      }

      .mm-pet-button.secondary {
        background:#eee8f4;
        color:#675a70;
      }

      .mm-pet-grid {
        display:grid;
        grid-template-columns:repeat(auto-fit,minmax(135px,1fr));
        gap:12px;
      }

      .mm-pet-item {
        border:1px solid #eee7f1;
        border-radius:20px;
        padding:15px;
        text-align:center;
        background:#fff;
      }

      .mm-pet-item.active {
        border-color:#9b85b9;
        box-shadow:0 0 0 2px rgba(155,133,185,.12);
      }

      .mm-pet-icon {
        font-size:48px;
        margin-bottom:8px;
      }

      .mm-pet-name {
        font-weight:900;
        font-size:14px;
      }

      .mm-pet-rarity {
        font-size:11px;
        color:#9a8fa0;
        margin-top:4px;
      }

      .mm-pet-accessory-grid {
        display:grid;
        grid-template-columns:repeat(auto-fit,minmax(130px,1fr));
        gap:10px;
      }

      .mm-accessory {
        border:1px solid #eee7f1;
        background:#fff;
        border-radius:18px;
        padding:14px;
        cursor:pointer;
        display:flex;
        flex-direction:column;
        align-items:center;
        gap:5px;
      }

      .mm-accessory.active {
        border-color:#9b85b9;
        background:#f8f3fb;
      }

      .mm-accessory span {
        font-size:30px;
      }

      .mm-accessory strong {
        font-size:12px;
      }

      .mm-accessory small {
        color:#8d8391;
        font-size:10px;
      }

      .mm-fragment {
        display:flex;
        align-items:center;
        justify-content:space-between;
        gap:12px;
        padding:14px;
        border-radius:18px;
        background:#faf7fc;
        margin-top:9px;
      }

      .mm-fragment > div:last-child {
        display:flex;
        gap:5px;
      }

      .mm-fragment .mm-pet-button {
        margin-top:0;
        padding:8px 10px;
        font-size:11px;
      }

      .mm-pet-room {
        display:flex;
        align-items:center;
        gap:18px;
        padding:22px;
        border-radius:22px;
        background:linear-gradient(135deg,#f8f0fb,#fff8f1);
      }

      .mm-pet-room-emoji {
        font-size:78px;
        min-width:100px;
        text-align:center;
      }

      .mm-pet-room strong {
        font-size:18px;
      }

      .mm-empty-pet {
        text-align:center;
        padding:45px 24px;
      }

      .mm-empty-icon {
        font-size:70px;
        margin-bottom:10px;
      }

      .mm-gacha-rates {
        margin-top:15px;
        padding:13px;
        border-radius:15px;
        background:#faf7fc;
        font-size:12px;
        line-height:1.7;
      }

      .mm-gacha-result {
        display:none;
        margin-top:15px;
        padding:20px;
        text-align:center;
        border-radius:20px;
        background:#f7f0fb;
      }

      .mm-gacha-result.show {
        display:block;
      }

      .mm-quest {
        background:rgba(255,255,255,.9);
        border:1px solid rgba(120,90,130,.1);
        border-radius:22px;
        padding:18px;
      }

      .mm-quest.completed {
        border-color:#b6a2c9;
      }

      .mm-quest-top {
        display:flex;
        gap:15px;
        align-items:flex-start;
      }

      .mm-quest-icon {
        font-size:34px;
      }

      .mm-quest-body {
        flex:1;
      }

      .mm-quest-name {
        font-weight:900;
        font-size:15px;
      }

      .mm-quest-desc {
        font-size:12px;
        color:#817784;
        margin-top:4px;
      }

      .mm-quest-progress {
        height:8px;
        border-radius:999px;
        background:#eee8f2;
        overflow:hidden;
        margin-top:12px;
      }

      .mm-quest-progress > div {
        height:100%;
        border-radius:999px;
        background:#9b85b9;
      }

      .mm-quest-bottom {
        display:flex;
        align-items:center;
        gap:12px;
        flex-wrap:wrap;
        margin-top:10px;
        font-size:11px;
        color:#766b7c;
      }

      .mm-quest-bottom .mm-pet-button {
        margin-left:auto;
      }

      @media(max-width:700px) {

        .mm-pet-section {
          padding:18px;
          border-radius:20px;
        }

        .mm-pet-title {
          align-items:flex-start;
          flex-direction:column;
        }

        .mm-fragment {
          flex-direction:column;
          align-items:flex-start;
        }

        .mm-fragment > div:last-child {
          width:100%;
        }

        .mm-fragment .mm-pet-button {
          flex:1;
        }

      }

    `;


    document.head.appendChild(
      style
    );
  }


  /* =========================================================
     초기화
     
     여기서 페이지 이동부터 보여준다.
  ========================================================= */

  updateTopUI();

  applyPetUIStyles();

  showPage(
    state.nav &&
    PAGE_TITLES[state.nav]
      ? state.nav
      : "home"
  );


  /*
    기존 저장 데이터에서 bunny가
    선택되어 있는 경우에는 펫을 유지한다.
    신규 사용자는 펫이 없는 상태로 시작한다.
  */

  if (
    state.selectedPet &&
    state.ownedPets.includes(
      state.selectedPet
    )
  ) {

    ensureAccessoryInventory(
      state.selectedPet
    );
  }


  /* =========================================================
     주기적 저장
  ========================================================= */

  setInterval(
    () => {

      if (
        currentPage ===
        "village" &&
        avatar
      ) {

        state.x =
          avatar.position.x;

        state.z =
          avatar.position.z;
      }


      saveState();

    },
    5000
  );

})();
