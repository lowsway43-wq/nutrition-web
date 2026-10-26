
/* ==================================================
   NUTRIHEALTH - APLIKASI UTAMA
   Dashboard, Kalender, Food Diary, Login, dan Riwayat
================================================== */

const API_BASE = "http://127.0.0.1:8000";
const API_URL = `${API_BASE}/api`;
const $ = (id) => document.getElementById(id);

let foodData = [];
let meals = [];
let water = 0;
let mealId = 1;
let currentUser = null;
let authMode = "login";

let currentDate = new Date();
currentDate.setDate(1);

let selectedDate = new Date();
selectedDate.setHours(0, 0, 0, 0);

let activeMealDate = localDateKey(selectedDate);

/* ==================================================
   FORMAT ANGKA DAN NOTIFIKASI
================================================== */

function fmt(number) {
  return Number(number || 0).toLocaleString("id-ID", {
    maximumFractionDigits: 1
  });
}

function toast(message) {
  const element = $("toast");

  if (!element) {
    console.log(message);
    return;
  }

  element.textContent = message;
  element.style.display = "block";

  clearTimeout(toast.timer);

  toast.timer = setTimeout(() => {
    element.style.display = "none";
  }, 2800);
}

/* ==================================================
   RIWAYAT NUTRISI
================================================== */

function localDateKey(date) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");

  return `${year}-${month}-${day}`;
}

function historyStorageKey() {
  const account = currentUser?.email
    ? currentUser.email.toLowerCase()
    : "guest";

  return `nutrihealth_meal_history_${account}`;
}

function readMealHistory() {
  try {
    return JSON.parse(
      localStorage.getItem(historyStorageKey()) || "{}"
    ) || {};
  } catch (error) {
    console.error("Gagal membaca riwayat nutrisi:", error);
    return {};
  }
}

function saveCurrentMeals() {
  try {
    const history = readMealHistory();

    history[activeMealDate] = meals;

    localStorage.setItem(
      historyStorageKey(),
      JSON.stringify(history)
    );
  } catch (error) {
    console.error("Gagal menyimpan riwayat nutrisi:", error);
    toast("Riwayat gagal disimpan di browser.");
  }
}

function loadMealsForDate(dateKey) {
  activeMealDate = dateKey;

  const history = readMealHistory();

  meals = Array.isArray(history[dateKey])
    ? history[dateKey]
    : [];

  mealId = meals.reduce(
    (highest, meal) =>
      Math.max(highest, Number(meal.mealId) || 0),
    0
  ) + 1;

  renderMeals();
  updateSummary();

  if ($("nutritionHistoryPage")) {
    renderHistoryPage();
  }
}

function getMealTotals(items) {
  return items.reduce((total, meal) => {
    total.cal += Number(meal.cal) || 0;
    total.carb += Number(meal.carb) || 0;
    total.protein += Number(meal.protein) || 0;
    total.fat += Number(meal.fat) || 0;

    return total;
  }, {
    cal: 0,
    carb: 0,
    protein: 0,
    fat: 0
  });
}

function formatDateKey(dateKey) {
  const [year, month, day] = dateKey.split("-").map(Number);

  return new Intl.DateTimeFormat("id-ID", {
    weekday: "long",
    day: "numeric",
    month: "long",
    year: "numeric"
  }).format(new Date(year, month - 1, day));
}

function setupNutritionHistoryPage() {
  const nav = document.querySelector(".nav");
  const main = document.querySelector(".main");

  if (!nav || !main || $("nutritionHistoryNav")) {
    return;
  }

  /* Tambahkan menu Riwayat Nutrisi di sidebar */
  const historyButton = document.createElement("button");

  historyButton.type = "button";
  historyButton.id = "nutritionHistoryNav";
  historyButton.dataset.nav = "Nutrition History";
  historyButton.innerHTML =
    '<span class="nav-icon">◷</span>Riwayat Nutrisi';

  const settingsButton = nav.querySelector(
    '[data-nav="Settings"]'
  );

  if (settingsButton) {
    nav.insertBefore(historyButton, settingsButton);
  } else {
    nav.appendChild(historyButton);
  }

  /* Buat halaman Riwayat Nutrisi */
  const page = document.createElement("section");

  page.id = "nutritionHistoryPage";
  page.className = "calorie-history-page";
  page.style.display = "none";

  page.innerHTML = `
    <div class="history-heading">
      <div>
        <p class="history-eyebrow">CATATAN HARIAN</p>
        <h2>Riwayat Nutrisi</h2>
        <p class="sub">
          Lihat makanan yang sudah kamu catat dan total nutrisinya.
        </p>
      </div>

      <button
        type="button"
        class="history-back"
        id="historyBackButton"
      >
        ← Kembali ke Dashboard
      </button>
    </div>

    <div
      class="history-today-card"
      id="historyTodaySummary"
    ></div>

    <h3 class="history-list-title">
      Riwayat berdasarkan tanggal
    </h3>

    <div
      id="historyDaysList"
      class="history-days-list"
    ></div>

    <p class="history-disclaimer">
      Riwayat ini disimpan di browser/perangkat yang digunakan.
      Data belum tersinkron ke database Laravel.
    </p>
  `;

  main.appendChild(page);

  /* Tampilan halaman riwayat */
  const style = document.createElement("style");

  style.id = "nutritionHistoryStyles";

  style.textContent = `
    .main.history-mode > :not(.topbar):not(#nutritionHistoryPage) {
      display: none !important;
    }

    .main.history-mode #nutritionHistoryPage {
      display: block !important;
    }

    .calorie-history-page {
      margin-top: 24px;
    }

    .history-heading {
      display: flex;
      align-items: flex-start;
      justify-content: space-between;
      gap: 16px;
      flex-wrap: wrap;
      margin-bottom: 22px;
    }

    .history-eyebrow {
      color: var(--green, #27845f);
      font-size: 11px;
      font-weight: 800;
      letter-spacing: 1.5px;
      margin: 0 0 6px;
    }

    .history-heading h2 {
      margin: 0 0 7px;
      color: var(--ink, #203344);
      font-size: 28px;
    }

    .history-heading .sub {
      margin: 0;
    }

    .history-back {
      border: 1px solid var(--line, #e7ece8);
      background: #fff;
      color: var(--ink, #203344);
      border-radius: 12px;
      padding: 11px 14px;
      cursor: pointer;
      font: inherit;
      font-weight: 700;
    }

    .history-today-card {
      background: linear-gradient(135deg, #e2f6eb, #f5fbf6);
      border: 1px solid #d5ecdf;
      border-radius: 18px;
      padding: 22px;
      margin-bottom: 25px;
    }

    .history-date {
      color: #537261;
      font-size: 13px;
      margin-bottom: 8px;
    }

    .history-calories {
      color: #1d704d;
      font-size: 32px;
      font-weight: 800;
      line-height: 1.2;
    }

    .history-small {
      color: #557064;
      font-size: 13px;
      margin-top: 6px;
    }

    .history-macros {
      display: flex;
      flex-wrap: wrap;
      gap: 10px;
      margin-top: 16px;
    }

    .history-macros span {
      display: flex;
      flex-direction: column;
      gap: 4px;
      background: rgba(255,255,255,.78);
      border: 1px solid #d5ecdf;
      border-radius: 10px;
      padding: 10px 13px;
      color: #557064;
      font-size: 12px;
    }

    .history-macros strong {
      color: #1d704d;
      font-size: 15px;
    }

    .history-list-title {
      font-size: 18px;
      margin: 0 0 14px;
    }

    .history-days-list {
      display: grid;
      gap: 14px;
    }

    .history-day-card {
      border: 1px solid var(--line, #e7ece8);
      border-radius: 16px;
      padding: 18px;
      background: #fff;
    }

    .history-day-top {
      display: flex;
      justify-content: space-between;
      gap: 12px;
      align-items: flex-start;
      margin-bottom: 12px;
    }

    .history-day-top h4 {
      margin: 0 0 4px;
      font-size: 15px;
    }

    .history-day-top p {
      margin: 0;
      color: var(--muted, #7a8b98);
      font-size: 12px;
    }

    .history-day-total {
      white-space: nowrap;
      color: #1d704d;
      font-weight: 800;
    }

    .history-food-row {
      display: flex;
      justify-content: space-between;
      gap: 12px;
      border-top: 1px solid #edf1ee;
      padding: 10px 0 0;
      margin-top: 10px;
      font-size: 13px;
    }

    .history-food-row span:last-child {
      white-space: nowrap;
      font-weight: 700;
    }

    .history-empty {
      border: 1px dashed var(--line, #e7ece8);
      border-radius: 14px;
      padding: 25px;
      text-align: center;
      color: var(--muted, #7a8b98);
      background: #fff;
    }

    .history-disclaimer {
      color: var(--muted, #7a8b98);
      font-size: 12px;
      margin-top: 20px;
    }

    @media(max-width:600px) {
      .history-heading h2 {
        font-size: 23px;
      }

      .history-today-card {
        padding: 17px;
      }

      .history-day-card {
        padding: 14px;
      }

      .history-day-total {
        font-size: 13px;
      }
    }
  `;

  document.head.appendChild(style);

  $("historyBackButton").addEventListener(
    "click",
    showDashboardPage
  );

  historyButton.addEventListener("click", () => {
    setActiveNavigation(historyButton);
    showNutritionHistoryPage();
  });
}

function setActiveNavigation(activeButton) {
  document
    .querySelectorAll(".nav button[data-nav]")
    .forEach((button) => {
      button.classList.toggle(
        "active",
        button === activeButton
      );
    });
}

function showNutritionHistoryPage() {
  const main = document.querySelector(".main");
  const page = $("nutritionHistoryPage");

  if (!main || !page) return;

  main.classList.add("history-mode");
  page.style.display = "block";

  renderHistoryPage();

  window.scrollTo({
    top: 0,
    behavior: "smooth"
  });
}

function showDashboardPage() {
  const main = document.querySelector(".main");
  const page = $("nutritionHistoryPage");

  if (main) {
    main.classList.remove("history-mode");
  }

  if (page) {
    page.style.display = "none";
  }

  const dashboardButton = document.querySelector(
    '.nav button[data-nav="Dashboard"]'
  );

  if (dashboardButton) {
    setActiveNavigation(dashboardButton);
  }

  window.scrollTo({
    top: 0,
    behavior: "smooth"
  });
}

function renderHistoryPage() {
  const summary = $("historyTodaySummary");
  const list = $("historyDaysList");

  if (!summary || !list) return;

  const history = readMealHistory();
  const todayKey = localDateKey(new Date());

  const todayMeals = Array.isArray(history[todayKey])
    ? history[todayKey]
    : [];

  const todayTotals = getMealTotals(todayMeals);

  summary.innerHTML = `
    <div class="history-date">
      Hari ini · ${formatDateKey(todayKey)}
    </div>

    <div class="history-calories">
      ${fmt(todayTotals.cal)} kkal
    </div>

    <div class="history-small">
      ${todayMeals.length} makanan dicatat
    </div>

    <div class="history-macros">
      <span>
        Karbohidrat
        <strong>${fmt(todayTotals.carb)} g</strong>
      </span>

      <span>
        Protein
        <strong>${fmt(todayTotals.protein)} g</strong>
      </span>

      <span>
        Lemak
        <strong>${fmt(todayTotals.fat)} g</strong>
      </span>
    </div>
  `;

  const dates = Object.keys(history)
    .filter((dateKey) =>
      Array.isArray(history[dateKey]) &&
      history[dateKey].length > 0
    )
    .sort((a, b) => b.localeCompare(a));

  if (!dates.length) {
    list.innerHTML = `
      <div class="history-empty">
        Belum ada riwayat nutrisi.
        Tambahkan makanan dari dashboard, lalu riwayat
        harianmu akan muncul di sini.
      </div>
    `;

    return;
  }

  list.innerHTML = dates.map((dateKey) => {
    const dayMeals = history[dateKey];
    const totals = getMealTotals(dayMeals);

    const foodRows = dayMeals.map((meal) => `
      <div class="history-food-row">
        <span>
          ${escapeHTML(meal.name)}
          ${
            meal.portion
              ? `<span style="color:#7a8b98">
                  · ${escapeHTML(meal.portion)}
                </span>`
              : ""
          }
        </span>

        <span>${fmt(meal.cal)} kkal</span>
      </div>
    `).join("");

    return `
      <article class="history-day-card">
        <div class="history-day-top">
          <div>
            <h4>${escapeHTML(formatDateKey(dateKey))}</h4>
            <p>${dayMeals.length} makanan</p>
          </div>

          <div class="history-day-total">
            ${fmt(totals.cal)} kkal
          </div>
        </div>

        <div class="history-macros">
          <span>
            Karbohidrat
            <strong>${fmt(totals.carb)} g</strong>
          </span>

          <span>
            Protein
            <strong>${fmt(totals.protein)} g</strong>
          </span>

          <span>
            Lemak
            <strong>${fmt(totals.fat)} g</strong>
          </span>
        </div>

        ${foodRows}

        <button
          type="button"
          data-history-date="${dateKey}"
          style="
            margin-top:14px;
            border:0;
            background:#e2f6eb;
            color:#1d704d;
            border-radius:9px;
            padding:9px 12px;
            font-weight:700;
            cursor:pointer
          "
        >
          Lihat tanggal ini di kalender
        </button>
      </article>
    `;
  }).join("");

  list.querySelectorAll("[data-history-date]")
    .forEach((button) => {
      button.addEventListener("click", () => {
        const [year, month, day] =
          button.dataset.historyDate.split("-").map(Number);

        selectedDate = new Date(year, month - 1, day);
        selectedDate.setHours(0, 0, 0, 0);

        currentDate = new Date(year, month - 1, 1);

        renderCalendar();
        loadMealsForDate(button.dataset.historyDate);
        showDashboardPage();

        toast(
          `Menampilkan catatan ${formatDateKey(
            button.dataset.historyDate
          )}.`
        );
      });
    });
}

/* ==================================================
   KONEKSI API MAKANAN
================================================== */

function mapFood(food) {
  const photos = {
    "Nasi Putih": "assets/rice.jpg",
    "Telur Rebus": "assets/chicken.jpg",
    "Pisang": "🍌",
    "Teh Manis": "assets/tea.jpg"
  };

  return {
    id: food.id,
    name: food.name,
    meal: food.category || "Makanan",
    emoji: photos[food.name] || "🍽️",
    portion: `${Number(food.serving_size)} ${food.serving_unit}`,
    cal: Number(food.calories) || 0,
    carb: Number(food.carbohydrates) || 0,
    protein: Number(food.protein) || 0,
    fat: Number(food.fat) || 0
  };
}

async function loadFoods() {
  try {
    const response = await fetch(`${API_URL}/foods`, {
      headers: {
        Accept: "application/json"
      }
    });

    if (!response.ok) {
      throw new Error("Gagal mengambil data makanan.");
    }

    const result = await response.json();
    const foods = Array.isArray(result) ? result : result.data;

    if (!Array.isArray(foods)) {
      throw new Error("Format data makanan dari API tidak sesuai.");
    }

    foodData = foods.map(mapFood);
    renderOptions($("foodSearch").value);
  } catch (error) {
    console.error("Error API makanan:", error);
    toast("Gagal memuat makanan. Periksa server Laravel.");
  }
}

/* ==================================================
   CATATAN MAKANAN
================================================== */

function addMeal(id) {
  const food = foodData.find(
    (item) => Number(item.id) === Number(id)
  );

  if (!food) return;

  meals.push({
    ...food,
    mealId: mealId++
  });

  saveCurrentMeals();
  renderMeals();
  updateSummary();

  $("foodPicker").style.display = "none";

  toast(`${food.name} ditambahkan ke catatan.`);
}

function removeMeal(id) {
  meals = meals.filter(
    (meal) => Number(meal.mealId) !== Number(id)
  );

  saveCurrentMeals();
  renderMeals();
  updateSummary();
  renderHistoryPage();
}

function renderMeals() {
  const list = $("mealList");

  if (!list) return;

  if (!meals.length) {
    list.innerHTML = `
      <p class="sub" style="padding:22px 0;text-align:center">
        Belum ada makanan dicatat.
        Pilih "Tambah Makanan" untuk memulai.
      </p>
    `;

    return;
  }

  list.innerHTML = meals.map((meal) => {
    const image = String(meal.emoji || "🍽️").startsWith("assets/")
      ? `<img class="food-photo" src="${meal.emoji}" alt="">`
      : `<div class="meal-emoji">${escapeHTML(meal.emoji || "🍽️")}</div>`;

    return `
      <div class="meal">
        ${image}

        <div class="meal-info">
          <strong>${escapeHTML(meal.name)}</strong>
          <small>${escapeHTML(meal.portion || "")}</small>
        </div>

        <div class="meal-cal">
          ${fmt(meal.cal)} kkal
          <button type="button" data-remove="${meal.mealId}">
            Hapus
          </button>
        </div>
      </div>
    `;
  }).join("");
}

function updateSummary() {
  const totals = getMealTotals(meals);

  [
    ["carb", totals.carb, 250],
    ["protein", totals.protein, 150],
    ["fat", totals.fat, 70]
  ].forEach(([key, value, target]) => {
    if ($(key + "Pct")) {
      $(key + "Pct").textContent =
        Math.round((value / target) * 100) + "%";
    }

    if ($(key + "Fill")) {
      $(key + "Fill").style.width =
        Math.min(100, (value / target) * 100) + "%";
    }

    if ($(key + "Text")) {
      $(key + "Text").textContent =
        `${fmt(value)} g tercatat dari contoh target ${target} g`;
    }
  });

  renderActiveTarget();
}

function renderOptions(query = "") {
  const search = $("foodSearch");
  const options = $("foodOptions");

  if (!search || !options) return;

  const q = query.toLowerCase().trim();

  const filtered = foodData.filter((food) =>
    food.name.toLowerCase().includes(q)
  );

  options.innerHTML = filtered.length
    ? filtered.map((food) => {
        const icon = String(food.emoji).startsWith("assets/")
          ? `<img src="${food.emoji}" alt=""
              style="width:26px;height:26px;object-fit:cover;border-radius:50%;vertical-align:middle">`
          : escapeHTML(food.emoji);

        return `
          <button
            type="button"
            data-add="${food.id}"
            style="
              text-align:left;
              padding:10px;
              border:1px solid var(--line);
              background:#fff;
              border-radius:10px
            "
          >
            ${icon}
            ${escapeHTML(food.name)} — ${fmt(food.cal)} kkal
          </button>
        `;
      }).join("")
    : '<p class="sub">Makanan tidak ditemukan.</p>';
}

/* Amankan teks dari HTML yang tidak diinginkan */
function escapeHTML(value) {
  return String(value ?? "").replace(/[&<>"']/g, (character) => ({
    "&": "&amp;",
    "<": "&lt;",
    ">": "&gt;",
    '"': "&quot;",
    "'": "&#39;"
  })[character]);
}

/* ==================================================
   PENGHITUNG AIR
================================================== */

function updateWater() {
  if ($("waterCount")) {
    $("waterCount").textContent = `${water} dari 8 gelas`;
  }

  if ($("waterFill")) {
    $("waterFill").style.width = `${(water / 8) * 100}%`;
  }
}


/* ==================================================
   NAVIGASI TARGET NUTRISI
================================================== */

const nutritionTargets = [
  {
    key: "cal",
    title: "Target Kalori",
    subtitle: "Ringkasan asupan energi harian",
    unit: "kkal",
    target: 2000,
    color: "#27845f",
    background: "#d8f1e5"
  },
  {
    key: "protein",
    title: "Target Protein",
    subtitle: "Ringkasan asupan protein harian",
    unit: "g",
    target: 150,
    color: "#f5b33d",
    background: "#fff0d2"
  },
  {
    key: "carb",
    title: "Target Karbohidrat",
    subtitle: "Ringkasan asupan karbohidrat harian",
    unit: "g",
    target: 250,
    color: "#45ad8a",
    background: "#d8f1e5"
  },
  {
    key: "fat",
    title: "Target Lemak",
    subtitle: "Ringkasan asupan lemak harian",
    unit: "g",
    target: 70,
    color: "#6ea7ef",
    background: "#e3efff"
  }
];

let activeTargetIndex = 0;

function setupTargetCarousel() {
  const card = $("targetCard") || document.querySelector(".budget");

  if (!card) {
    console.error("Kartu target nutrisi tidak ditemukan.");
    return;
  }

  const prevButton = $("targetPrev");
  const nextButton = $("targetNext");
  const indicators = card.querySelector(".target-indicators");

  if (
    !prevButton ||
    !nextButton ||
    !$("targetTitle") ||
    !$("targetUnit") ||
    !$("donut") ||
    !$("remainingText")
  ) {
    console.error("Elemen carousel target nutrisi belum lengkap.");
    return;
  }

  // Buat indikator untuk setiap target nutrisi.
  if (indicators) {
    indicators.innerHTML = nutritionTargets
      .map(
        (target, index) => `
          <button
            type="button"
            class="target-dot ${
              index === activeTargetIndex ? "active" : ""
            }"
            data-target-dot="${index}"
            aria-label="Tampilkan ${target.title}"
            aria-pressed="${index === activeTargetIndex}"
          ></button>
        `
      )
      .join("");
  }

  // Pasang event hanya satu kali.
  if (card.dataset.carouselReady !== "true") {
    prevButton.addEventListener("click", (event) => {
      event.preventDefault();

      activeTargetIndex =
        (activeTargetIndex - 1 + nutritionTargets.length) %
        nutritionTargets.length;

      renderActiveTarget();
    });

    nextButton.addEventListener("click", (event) => {
      event.preventDefault();

      activeTargetIndex =
        (activeTargetIndex + 1) % nutritionTargets.length;

      renderActiveTarget();
    });

    if (indicators) {
      indicators.addEventListener("click", (event) => {
        const dot = event.target.closest("[data-target-dot]");

        if (!dot) return;

        const index = Number(dot.dataset.targetDot);

        if (
          !Number.isInteger(index) ||
          index < 0 ||
          index >= nutritionTargets.length
        ) {
          return;
        }

        activeTargetIndex = index;
        renderActiveTarget();
      });
    }

    card.dataset.carouselReady = "true";
  }

  renderActiveTarget();
}

function renderActiveTarget() {
  const card = $("targetCard") || document.querySelector(".budget");

  if (!card) return;

  const target = nutritionTargets[activeTargetIndex];

  if (!target) return;

  const totals = getMealTotals(meals);
  const value = Number(totals[target.key]) || 0;

  const percentage = Math.min(
    100,
    Math.max(0, (value / target.target) * 100)
  );

  const heading = $("targetTitle") || card.querySelector("h3");
  const subtitle = card.querySelector(".target-heading .sub");
  const targetUnit = $("targetUnit");
  const calorieValue = $("calorieValue");
  const remainingText = $("remainingText");
  const donut = $("donut");

  if (
    !heading ||
    !targetUnit ||
    !calorieValue ||
    !remainingText ||
    !donut
  ) {
    console.error("Elemen tampilan target nutrisi tidak lengkap.");
    return;
  }

  // Perbarui judul dan keterangan.
  heading.textContent = target.title;

  if (subtitle) {
    subtitle.textContent = target.subtitle;
  }

  // Perbarui angka asupan dan target.
  calorieValue.textContent = fmt(value);
  targetUnit.textContent = `/ ${fmt(target.target)} ${target.unit}`;

  remainingText.textContent =
    `${fmt(Math.max(0, target.target - value))} ` +
    `${target.unit} dari target tersisa`;

  // Perbarui warna sesuai nutrisi yang dipilih.
  card.dataset.target = target.key;

  card.style.setProperty("--target-color", target.color);
  card.style.setProperty(
    "--target-background",
    target.background
  );

  // Perbarui diagram donat.
  donut.style.background =
    `conic-gradient(
      ${target.color} 0% ${percentage}%,
      ${target.background} ${percentage}% 100%
    )`;

  // Perbarui indikator yang sedang aktif.
  card.querySelectorAll("[data-target-dot]").forEach((dot, index) => {
    const isActive = index === activeTargetIndex;

    dot.classList.toggle("active", isActive);
    dot.setAttribute("aria-pressed", String(isActive));
  });
}


/* ==================================================
   KALENDER
================================================== */

function renderCalendar() {
  const grid = $("calendarGrid");
  const label = $("monthLabel");

  if (!grid || !label) return;

  const year = currentDate.getFullYear();
  const month = currentDate.getMonth();

  const firstDay = new Date(year, month, 1).getDay();
  const daysInMonth = new Date(year, month + 1, 0).getDate();

  label.textContent = new Intl.DateTimeFormat("id-ID", {
    month: "long",
    year: "numeric"
  }).format(currentDate);

  const labels = ["Min", "Sen", "Sel", "Rab", "Kam", "Jum", "Sab"];

  let html = labels
    .map((day) => `<span>${day}</span>`)
    .join("");

  /* Kosongkan kotak sebelum tanggal pertama */
  for (let i = 0; i < firstDay; i++) {
    html += "<span></span>";
  }

  /* Tampilkan seluruh nomor tanggal */
  for (let day = 1; day <= daysInMonth; day++) {
    const selected =
      day === selectedDate.getDate() &&
      month === selectedDate.getMonth() &&
      year === selectedDate.getFullYear();

    html += `
      <button
        type="button"
        class="${selected ? "selected" : ""}"
        data-day="${day}"
        aria-label="${day}"
        aria-pressed="${selected}"
      >
        ${day}
      </button>
    `;
  }

  grid.innerHTML = html;
}

/* ==================================================
   LOGIN DAN REGISTRASI
================================================== */

function getXsrfToken() {
  const cookie = document.cookie
    .split("; ")
    .find((item) => item.startsWith("XSRF-TOKEN="));

  return cookie
    ? decodeURIComponent(cookie.split("=").slice(1).join("="))
    : "";
}

async function getCsrfCookie() {
  const response = await fetch(
    `${API_BASE}/sanctum/csrf-cookie`,
    {
      method: "GET",
      credentials: "include",
      headers: {
        Accept: "application/json"
      }
    }
  );

  if (!response.ok) {
    throw new Error(
      "Tidak bisa mendapatkan CSRF cookie dari Laravel."
    );
  }
}

async function apiRequest(path, options = {}) {
  const method = (options.method || "GET").toUpperCase();

  const headers = {
    Accept: "application/json",
    ...(options.body ? {
      "Content-Type": "application/json"
    } : {}),
    ...(options.headers || {})
  };

  if (!["GET", "HEAD", "OPTIONS"].includes(method)) {
    const token = getXsrfToken();

    if (token) {
      headers["X-XSRF-TOKEN"] = token;
    }

    headers["X-Requested-With"] = "XMLHttpRequest";
  }

  const response = await fetch(`${API_URL}${path}`, {
    ...options,
    method,
    headers,
    credentials: "include"
  });

  const contentType = response.headers.get("content-type") || "";

  const result = contentType.includes("application/json")
    ? await response.json()
    : {};

  if (!response.ok) {
    const validationMessages = result.errors
      ? Object.values(result.errors).flat().join(" ")
      : "";

    throw new Error(
      validationMessages ||
      result.message ||
      `Permintaan gagal (${response.status}).`
    );
  }

  return result;
}

function updateAccountUI() {
  const loggedIn = Boolean(currentUser);

  if ($("profileName")) {
    $("profileName").textContent = loggedIn
      ? currentUser.name
      : "Pengunjung";
  }

  if ($("profileStatus")) {
    $("profileStatus").textContent = loggedIn
      ? (currentUser.email || "Akun NutriHealth")
      : "Mode Tamu";
  }

  if ($("welcomeTitle")) {
    $("welcomeTitle").textContent = loggedIn
      ? `Halo, ${currentUser.name} 🌱`
      : "Halo, Sahabat Sehat 🌱";
  }

  if ($("authButtonText")) {
    $("authButtonText").textContent = loggedIn
      ? "Logout"
      : "Login / Daftar";
  }

  if ($("authButton")) {
    $("authButton").dataset.nav = loggedIn
      ? "Logout"
      : "Login";
  }
}

function openAuth(mode = "login") {
  setAuthMode(mode);

  $("authOverlay").style.display = "flex";
  $("authError").textContent = "";

  setTimeout(() => {
    const field = $(mode === "register" ? "authName" : "authEmail");

    if (field) field.focus();
  }, 50);
}

function closeAuth() {
  $("authOverlay").style.display = "none";
  $("authError").textContent = "";
  $("authForm").reset();
}

function setAuthMode(mode) {
  authMode = mode;

  const registering = mode === "register";

  $("authTitle").textContent = registering
    ? "Buat Akun NutriHealth"
    : "Selamat Datang!";

  $("authDescription").textContent = registering
    ? "Daftar untuk mulai menggunakan akun NutriHealth."
    : "Login untuk mengakses akun NutriHealth.";

  $("nameGroup").style.display =
    registering ? "block" : "none";

  $("confirmPasswordGroup").style.display =
    registering ? "block" : "none";

  $("authName").required = registering;
  $("authPasswordConfirm").required = registering;

  $("authPassword").autocomplete = registering
    ? "new-password"
    : "current-password";

  $("authSubmit").textContent = registering
    ? "Daftar Sekarang"
    : "Login";

  $("authSwitchText").textContent = registering
    ? "Sudah punya akun?"
    : "Belum punya akun?";

  $("authSwitch").textContent = registering
    ? "Login"
    : "Daftar sekarang";

  $("authError").textContent = "";
}

async function checkSession() {
  try {
    const result = await apiRequest("/me");
    currentUser = result.user || null;
  } catch (error) {
    currentUser = null;

    if (error.message.includes("Failed to fetch")) {
      console.warn(
        "Belum dapat memeriksa sesi Laravel.",
        error
      );
    }
  }

  updateAccountUI();

  /* Muat catatan tanggal yang sedang dipilih */
  loadMealsForDate(localDateKey(selectedDate));
}

async function submitAuth(event) {
  event.preventDefault();

  const registering = authMode === "register";
  const submitButton = $("authSubmit");

  const email = $("authEmail").value.trim();
  const password = $("authPassword").value;

  const payload = {
    email,
    password
  };

  if (registering) {
    payload.name = $("authName").value.trim();

    payload.password_confirmation =
      $("authPasswordConfirm").value;

    if (password !== payload.password_confirmation) {
      $("authError").textContent =
        "Konfirmasi password tidak sama.";

      return;
    }
  }

  submitButton.disabled = true;
  submitButton.textContent = "Memproses...";
  $("authError").textContent = "";

  try {
    await getCsrfCookie();

    const endpoint = registering
      ? "/register"
      : "/login";

    const result = await apiRequest(endpoint, {
      method: "POST",
      body: JSON.stringify(payload)
    });

    currentUser = result.user || null;

    if (!currentUser) {
      const me = await apiRequest("/me");
      currentUser = me.user || null;
    }

    updateAccountUI();

    loadMealsForDate(localDateKey(selectedDate));

    closeAuth();

    toast(result.message || (
      registering
        ? "Registrasi berhasil."
        : "Login berhasil."
    ));
  } catch (error) {
    console.error("Kesalahan autentikasi:", error);

    $("authError").textContent =
      error.message ||
      "Terjadi kesalahan. Periksa server Laravel dan coba lagi.";
  } finally {
    submitButton.disabled = false;

    submitButton.textContent = registering
      ? "Daftar Sekarang"
      : "Login";
  }
}

async function logout() {
  if (!currentUser) {
    openAuth("login");
    return;
  }

  try {
    await getCsrfCookie();

    const result = await apiRequest("/logout", {
      method: "POST",
      body: JSON.stringify({})
    });

    currentUser = null;

    updateAccountUI();
    loadMealsForDate(localDateKey(selectedDate));

    toast(result.message || "Logout berhasil.");
  } catch (error) {
    console.error("Kesalahan logout:", error);

    toast(
      "Logout gagal. Periksa koneksi ke server Laravel."
    );
  }
}

/* ==================================================
   EVENT LISTENERS
================================================== */

/* Tombol tambah makanan */
$("addFoodBtn").addEventListener("click", () => {
  const picker = $("foodPicker");

  picker.style.display =
    picker.style.display === "none"
      ? "block"
      : "none";

  renderOptions($("foodSearch").value);

  if (picker.style.display === "block") {
    $("foodSearch").focus();
  }
});

$("foodSearch").addEventListener("input", (event) => {
  renderOptions(event.target.value);
});

/* Klik makanan untuk menambahkan ke catatan */
$("foodOptions").addEventListener("click", (event) => {
  const button = event.target.closest("[data-add]");

  if (button) {
    addMeal(Number(button.dataset.add));
  }
});

/* Hapus makanan dari catatan */
$("mealList").addEventListener("click", (event) => {
  const button = event.target.closest("[data-remove]");

  if (button) {
    removeMeal(Number(button.dataset.remove));
  }
});

/* Pencarian makanan dari kolom pencarian utama */
$("globalSearch").addEventListener("input", (event) => {
  $("foodPicker").style.display = "block";
  $("foodSearch").value = event.target.value;

  renderOptions(event.target.value);

  $("foodPicker").scrollIntoView({
    behavior: "smooth",
    block: "center"
  });
});

/* Tambah air */
$("moreWater").addEventListener("click", () => {
  water = Math.min(8, water + 1);

  updateWater();

  if (water === 8) {
    toast("Target demonstrasi minum air tercapai!");
  }
});

/* Kurangi air */
$("lessWater").addEventListener("click", () => {
  water = Math.max(0, water - 1);

  updateWater();
});

/* Notifikasi */
$("notify").addEventListener("click", () => {
  toast("Belum ada notifikasi baru.");
});

/* Tantangan kesehatan */
$("challengeBtn").addEventListener("click", () => {
  toast(
    "Tantangan: tambahkan buah dan sayur ke menu harianmu!"
  );
});

/* Kalender bulan sebelumnya */
$("prevMonth").addEventListener("click", () => {
  currentDate.setMonth(currentDate.getMonth() - 1);
  renderCalendar();
});

/* Kalender bulan berikutnya */
$("nextMonth").addEventListener("click", () => {
  currentDate.setMonth(currentDate.getMonth() + 1);
  renderCalendar();
});

/* Klik nomor tanggal pada kalender */
$("calendarGrid").addEventListener("click", (event) => {
  const button = event.target.closest("[data-day]");

  if (!button) return;

  const day = Number(button.dataset.day);

  selectedDate = new Date(
    currentDate.getFullYear(),
    currentDate.getMonth(),
    day
  );

  selectedDate.setHours(0, 0, 0, 0);

  renderCalendar();

  /* Muat catatan khusus untuk tanggal yang dipilih */
  loadMealsForDate(localDateKey(selectedDate));

  toast(
    `Tanggal dipilih: ${selectedDate.getDate()} ` +
    new Intl.DateTimeFormat("id-ID", {
      month: "long",
      year: "numeric"
    }).format(selectedDate)
  );
});

/* Tombol login/logout pada sidebar */
$("authButton").addEventListener("click", async () => {
  if (currentUser) {
    await logout();
  } else {
    openAuth("login");
  }
});

/* Form login dan registrasi */
$("authForm").addEventListener("submit", submitAuth);

$("authSwitch").addEventListener("click", () => {
  setAuthMode(
    authMode === "login" ? "register" : "login"
  );
});

$("authClose").addEventListener("click", closeAuth);
$("continueGuest").addEventListener("click", closeAuth);

$("authOverlay").addEventListener("click", (event) => {
  if (event.target === $("authOverlay")) {
    closeAuth();
  }
});

document.addEventListener("keydown", (event) => {
  if (
    event.key === "Escape" &&
    $("authOverlay").style.display !== "none"
  ) {
    closeAuth();
  }
});

/* ==================================================
   NAVIGASI SIDEBAR
================================================== */

/* Buat menu Riwayat Nutrisi */
setupNutritionHistoryPage();

/* Navigasi fitur yang sudah ada */
document
  .querySelectorAll(".nav button[data-nav]")
  .forEach((button) => {
    if (
      button.id === "authButton" ||
      button.id === "nutritionHistoryNav"
    ) {
      return;
    }

    button.addEventListener("click", () => {
      const name = button.dataset.nav;

      document
        .querySelectorAll(".nav button[data-nav]")
        .forEach((item) => {
          item.classList.remove("active");
        });

      button.classList.add("active");

      if (name === "Dashboard") {
        showDashboardPage();
      } else if (name === "Food Diary") {
        $("mealList").scrollIntoView({
          behavior: "smooth",
          block: "center"
        });
      } else if (name === "Nutrition") {
        document.querySelector(".lower-grid").scrollIntoView({
          behavior: "smooth"
        });
      } else if (name === "Water Tracker") {
        document.querySelector(".water-controls").scrollIntoView({
          behavior: "smooth"
        });
      } else if (name === "Progress") {
        document.querySelector(".activity").scrollIntoView({
          behavior: "smooth"
        });
      } else if (name === "Settings") {
        toast("Pengaturan akun belum tersedia.");
      } else {
        window.scrollTo({
          top: 0,
          behavior: "smooth"
        });
      }
    });
  });

/* ==================================================
   MULAI APLIKASI
================================================== */

setupTargetCarousel();

renderCalendar();
renderMeals();
updateSummary();
updateWater();
updateAccountUI();

loadFoods();
checkSession();