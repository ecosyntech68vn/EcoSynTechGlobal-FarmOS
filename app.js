const catalog = [
  {
    id: "soil-sense",
    name: "EcoSyn SoilSense 4X",
    category: "sensor",
    price: 6800000,
    badge: "Ban chay",
    summary: "Cam bien dat 4-trong-1 cho do am, nhiet do, pH va EC.",
    specs: ["LoRaWAN", "IP67", "Pin 24 thang"]
  },
  {
    id: "air-pulse",
    name: "EcoSyn AirPulse",
    category: "sensor",
    price: 5200000,
    badge: "Moi",
    summary: "Cam bien vi khi hau cho nhiet do, do am khong khi va anh sang.",
    specs: ["Tuong thich nha kinh", "Sai so thap", "Canh bao som"]
  },
  {
    id: "water-guard",
    name: "EcoSyn WaterGuard",
    category: "sensor",
    price: 4700000,
    badge: "On farm",
    summary: "Cam bien muc nuoc va luu luong cho bon chua, kenh cap va tram bom.",
    specs: ["Muc nuoc", "Luu luong", "Bao rong"]
  },
  {
    id: "bridge-x2",
    name: "EcoSyn Bridge X2",
    category: "gateway",
    price: 15800000,
    badge: "Pro",
    summary: "Gateway LoRaWAN + 4G/LTE giup giu ket noi on dinh tai khu vuc xa.",
    specs: ["SIM kep", "UPS 8 gio", "Edge sync"]
  },
  {
    id: "field-hub",
    name: "EcoSyn FieldHub Mini",
    category: "gateway",
    price: 11800000,
    badge: "Compact",
    summary: "Gateway gon nhe phu hop nha kinh, khu gieo trong va farm nho.",
    specs: ["Wi-Fi/4G", "Lap nhanh", "Monitoring"]
  },
  {
    id: "valve-kit",
    name: "EcoSyn Valve Control Kit",
    category: "control",
    price: 9600000,
    badge: "Tiet kiem nuoc",
    summary: "Bo dieu khien van tuoi 2 zone kem relay an toan va cam bien ap suat.",
    specs: ["2 zone", "12V/24V", "Rule IF THEN"]
  },
  {
    id: "pump-brain",
    name: "EcoSyn Pump Brain",
    category: "control",
    price: 12400000,
    badge: "Automation",
    summary: "Dieu khien bom trung tam, phat hien ro ri va khoa lien dong khi co su co.",
    specs: ["3 pha", "Flow sensor", "Safety lock"]
  },
  {
    id: "cloud-plus",
    name: "EcoCloud Plus",
    category: "cloud",
    price: 9900000,
    badge: "Hang nam",
    summary: "Dashboard, canh bao, lich su hoat dong va bao cao ROI co ban.",
    specs: ["Cloud 12 thang", "Alert", "Bao cao PDF"]
  },
  {
    id: "cloud-enterprise",
    name: "EcoCloud Enterprise",
    category: "cloud",
    price: 26000000,
    badge: "Da trang trai",
    summary: "Bao cao ESG, quan ly nhieu site va phan quyen theo doi nhom van hanh.",
    specs: ["Multi-site", "ESG", "API"]
  }
];

const plannerModels = {
  starter: {
    label: "EcoSyn Starter Kit",
    basePrice: 76000000,
    items: ["4 SoilSense 4X", "1 AirPulse", "1 FieldHub Mini", "EcoCloud Plus"],
    payback: 15,
    water: 18,
    labor: 10
  },
  growth: {
    label: "EcoSyn Growth Kit",
    basePrice: 128000000,
    items: ["8 SoilSense 4X", "2 AirPulse", "1 WaterGuard", "1 Bridge X2", "2 Valve Control Kit", "EcoCloud Plus"],
    payback: 11,
    water: 31,
    labor: 22
  },
  pro: {
    label: "EcoSyn Pro Automation",
    basePrice: 218000000,
    items: ["12 SoilSense 4X", "2 AirPulse", "2 WaterGuard", "1 Bridge X2", "2 Pump Brain", "4 Valve Control Kit", "EcoCloud Enterprise"],
    payback: 9,
    water: 39,
    labor: 34
  }
};

const cropAdjustments = {
  vegetable: { factor: 1, roi: 1, summary: "Tap trung on dinh vi khi hau va tuoi chinh xac cho nha kinh." },
  fruit: { factor: 1.14, roi: 1.18, summary: "Uu tien zone tuoi theo cay va theo doi muc nuoc, EC, vi khi hau." },
  rice: { factor: 1.08, roi: 0.94, summary: "Tap trung giamsat mo rong, canh bao va toi uu van hanh ngoai troi." },
  herb: { factor: 0.96, roi: 1.08, summary: "Can do chinh xac cao, phu hop canh tac duoc lieu va rau gia vi." }
};

const goalAdjustments = {
  water: { bonus: 0, water: 7, labor: 0, roiText: "Tiet kiem nuoc la thong diep de chot deal." },
  yield: { bonus: 12000000, water: 1, labor: 2, roiText: "Co the nhan manh tac dong toi nang suat va on dinh chat luong." },
  labor: { bonus: 8000000, water: 0, labor: 8, roiText: "Phu hop farm dang can cat thao tac thu cong va giam phu thuoc nhan su." },
  trace: { bonus: 15000000, water: 0, labor: 3, roiText: "De upsell cloud, bao cao ESG va truy xuat sau ban dau." }
};

const state = {
  activeFilter: "all",
  searchQuery: "",
  cart: new Map(),
  plannerBundle: null
};

const formatter = new Intl.NumberFormat("vi-VN");

const qs = (selector, scope = document) => scope.querySelector(selector);
const qsa = (selector, scope = document) => Array.from(scope.querySelectorAll(selector));

function formatVnd(value) {
  return `${formatter.format(Math.round(value))} VND`;
}

function createPlannerBundle() {
  const form = qs("#plannerForm");
  if (!form) {
    return null;
  }

  const farmSize = Number(form.elements.farmSize.value);
  const cropType = form.elements.cropType.value;
  const automationLevel = form.elements.automationLevel.value;
  const businessGoal = form.elements.businessGoal.value;
  const budgetRange = Number(form.elements.budgetRange.value);

  const model = plannerModels[automationLevel];
  const crop = cropAdjustments[cropType];
  const goal = goalAdjustments[businessGoal];

  const sizeFactor = farmSize <= 1 ? 0.92 : farmSize <= 3 ? 1 : farmSize <= 8 ? 1.18 : 1.42;
  const price = model.basePrice * crop.factor * sizeFactor + goal.bonus;
  const serviceFee = Math.max(8000000, price * 0.09);
  const waterSaving = model.water + goal.water + (farmSize > 8 ? 3 : 0);
  const laborSaving = model.labor + goal.labor + (automationLevel === "pro" ? 4 : 0);
  const payback = Math.max(7, Math.round(model.payback + (farmSize > 8 ? 1 : 0) - (budgetRange > 180 ? 1 : 0)));
  const annualValue = (price * 1.18 * crop.roi) + (waterSaving * 850000);

  return {
    id: `bundle-${automationLevel}-${cropType}-${businessGoal}`,
    name: model.label,
    price,
    serviceFee,
    payback,
    waterSaving,
    laborSaving,
    annualValue,
    summary: `${crop.summary} Cau hinh nay phu hop quy mo ${farmSize <= 1 ? "nho" : farmSize <= 8 ? "vua" : "lon"} va uu tien ${form.elements.businessGoal.selectedOptions[0].textContent.toLowerCase()}.`,
    narrative: goal.roiText,
    items: [...model.items, `Ngan sach muc tieu: ${budgetRange}M VND`],
    badge: "Goi de xuat",
    category: "bundle"
  };
}

function renderPlanner() {
  const bundle = createPlannerBundle();
  if (!bundle) {
    return;
  }

  state.plannerBundle = bundle;

  qs("#bundleName").textContent = bundle.name;
  qs("#bundleSummary").textContent = bundle.summary;
  qs("#bundlePrice").textContent = formatVnd(bundle.price);
  qs("#bundlePayback").textContent = `${bundle.payback} thang`;
  qs("#bundleWater").textContent = `${bundle.waterSaving}%`;
  qs("#bundleLabor").textContent = `${bundle.laborSaving}%`;
  qs("#roiValue").textContent = `+${formatVnd(bundle.annualValue)} / nam`;
  qs("#roiNarrative").textContent = bundle.narrative;
  qs("#bundleItems").innerHTML = bundle.items.map((item) => `<li>${item}</li>`).join("");
}

function renderCatalog() {
  const grid = qs("#catalogGrid");
  if (!grid) {
    return;
  }

  const filtered = catalog.filter((item) => {
    const matchesFilter = state.activeFilter === "all" || item.category === state.activeFilter;
    const haystack = `${item.name} ${item.summary} ${item.specs.join(" ")}`.toLowerCase();
    const matchesSearch = haystack.includes(state.searchQuery.toLowerCase());
    return matchesFilter && matchesSearch;
  });

  if (filtered.length === 0) {
    grid.innerHTML = `
      <article class="catalog-card">
        <h3>Khong tim thay san pham phu hop</h3>
        <p>Thu doi bo loc hoac tu khoa de mo rong ket qua.</p>
      </article>
    `;
    return;
  }

  grid.innerHTML = filtered.map((item) => `
    <article class="catalog-card">
      <header>
        <div>
          <p class="mini-label">${item.badge}</p>
          <h3>${item.name}</h3>
        </div>
        <span class="tag">${item.category}</span>
      </header>
      <p>${item.summary}</p>
      <div class="spec-row">${item.specs.map((spec) => `<span>${spec}</span>`).join("")}</div>
      <strong>${formatVnd(item.price)}</strong>
      <div class="card-actions">
        <button class="ghost add-product" type="button" data-id="${item.id}">Them vao bao gia</button>
      </div>
    </article>
  `).join("");
}

function addToCart(item, serviceFee = 0) {
  const current = state.cart.get(item.id);
  if (current) {
    current.qty += 1;
    current.serviceFee = Math.max(current.serviceFee, serviceFee);
  } else {
    state.cart.set(item.id, {
      id: item.id,
      name: item.name,
      price: item.price,
      qty: 1,
      serviceFee
    });
  }

  renderCart();
  setCartOpen(true);
}

function changeQty(id, delta) {
  const item = state.cart.get(id);
  if (!item) {
    return;
  }

  item.qty += delta;
  if (item.qty <= 0) {
    state.cart.delete(id);
  }

  renderCart();
}

function renderCart() {
  const cartItems = qs("#cartItems");
  const subtotalValue = qs("#subtotalValue");
  const serviceValue = qs("#serviceValue");
  const totalValue = qs("#totalValue");
  const countNodes = qsa(".cart-count");

  const items = Array.from(state.cart.values());
  const itemCount = items.reduce((sum, item) => sum + item.qty, 0);
  const subtotal = items.reduce((sum, item) => sum + item.price * item.qty, 0);
  const service = items.reduce((sum, item) => sum + item.serviceFee, 0);
  const total = subtotal + service;

  countNodes.forEach((node) => {
    node.textContent = String(itemCount);
  });

  subtotalValue.textContent = formatVnd(subtotal);
  serviceValue.textContent = formatVnd(service);
  totalValue.textContent = formatVnd(total);

  if (items.length === 0) {
    cartItems.innerHTML = `
      <div class="cart-item">
        <strong>Chua co thanh phan nao trong bao gia.</strong>
        <p>Hay them san pham tu catalog hoac chon goi de xuat trong cong cu tu van.</p>
      </div>
    `;
    return;
  }

  cartItems.innerHTML = items.map((item) => `
    <article class="cart-item">
      <header>
        <strong>${item.name}</strong>
        <span>${formatVnd(item.price)}</span>
      </header>
      <footer>
        <div class="qty-controls">
          <button type="button" data-qty="-1" data-id="${item.id}">-</button>
          <span>${item.qty}</span>
          <button type="button" data-qty="1" data-id="${item.id}">+</button>
        </div>
        <strong>${formatVnd(item.price * item.qty + item.serviceFee)}</strong>
      </footer>
    </article>
  `).join("");
}

function setCartOpen(open) {
  document.body.classList.toggle("cart-open", open);
  const drawer = qs(".cart-drawer");
  if (drawer) {
    drawer.setAttribute("aria-hidden", String(!open));
  }
}

function bindFilters() {
  const filterRow = qs("#filterRow");
  const search = qs("#catalogSearch");

  filterRow?.addEventListener("click", (event) => {
    const target = event.target;
    if (!(target instanceof HTMLButtonElement)) {
      return;
    }

    state.activeFilter = target.dataset.filter || "all";
    qsa(".filter-button", filterRow).forEach((button) => {
      button.classList.toggle("active", button === target);
    });
    renderCatalog();
  });

  search?.addEventListener("input", () => {
    state.searchQuery = search.value.trim();
    renderCatalog();
  });
}

function bindCatalogActions() {
  const grid = qs("#catalogGrid");
  grid?.addEventListener("click", (event) => {
    const target = event.target;
    if (!(target instanceof HTMLButtonElement)) {
      return;
    }

    const id = target.dataset.id;
    if (!id) {
      return;
    }

    const item = catalog.find((product) => product.id === id);
    if (item) {
      addToCart(item);
    }
  });
}

function bindPlanner() {
  const plannerForm = qs("#plannerForm");
  const budgetRange = qs("#budgetRange");
  const budgetValue = qs("#budgetValue");
  const addBundleButton = qs("#addBundleToCart");

  budgetRange?.addEventListener("input", () => {
    budgetValue.textContent = `${budgetRange.value}M VND`;
    renderPlanner();
  });

  plannerForm?.addEventListener("change", renderPlanner);
  plannerForm?.addEventListener("submit", (event) => {
    event.preventDefault();
    renderPlanner();
  });

  addBundleButton?.addEventListener("click", () => {
    if (state.plannerBundle) {
      addToCart(state.plannerBundle, state.plannerBundle.serviceFee);
    }
  });
}

function bindCart() {
  qsa("[data-open-cart]").forEach((node) => {
    node.addEventListener("click", () => setCartOpen(true));
  });

  qsa("[data-close-cart]").forEach((node) => {
    node.addEventListener("click", () => setCartOpen(false));
  });

  qs("#cartItems")?.addEventListener("click", (event) => {
    const target = event.target;
    if (!(target instanceof HTMLButtonElement)) {
      return;
    }

    const id = target.dataset.id;
    const delta = Number(target.dataset.qty);
    if (!id || !delta) {
      return;
    }

    changeQty(id, delta);
  });
}

function bindForms() {
  const contactForm = qs("#contactForm");
  const contactMessage = qs("#contactMessage");
  const quoteForm = qs("#quoteForm");
  const quoteMessage = qs("#quoteMessage");

  contactForm?.addEventListener("submit", (event) => {
    event.preventDefault();
    const company = contactForm.elements.company.value.trim();
    contactMessage.textContent = `Da ghi nhan yeu cau cua ${company || "doanh nghiep"}. EcoSynTech se lien he trong 48 gio.`;
    contactForm.reset();
  });

  quoteForm?.addEventListener("submit", (event) => {
    event.preventDefault();
    const items = Array.from(state.cart.values());
    if (items.length === 0) {
      quoteMessage.textContent = "Hay them it nhat mot san pham hoac mot goi de xuat vao bao gia.";
      return;
    }

    quoteMessage.textContent = `Da tao yeu cau bao gia voi ${items.length} hang muc. Doi sales co the dung thong tin nay de chot demo tiep theo.`;
    quoteForm.reset();
  });
}

function bindPricing() {
  qsa("[data-plan]").forEach((button) => {
    button.addEventListener("click", () => {
      const plan = button.getAttribute("data-plan");
      if (plan === "Starter") {
        addToCart({ id: "plan-starter", name: "Goi Starter", price: 69000000 }, 7000000);
      } else if (plan === "Growth") {
        addToCart({ id: "plan-growth", name: "Goi Growth", price: 138000000 }, 12000000);
      } else {
        addToCart({ id: "plan-enterprise", name: "Goi Enterprise", price: 240000000 }, 25000000);
      }
    });
  });
}

function bindNavigation() {
  const menuButton = qs(".menu-button");
  const nav = qs(".nav");

  menuButton?.addEventListener("click", () => {
    nav?.classList.toggle("open");
  });

  nav?.addEventListener("click", (event) => {
    if (event.target instanceof HTMLAnchorElement) {
      nav.classList.remove("open");
    }
  });
}

function setupReveal() {
  const items = qsa(".reveal");
  if (!("IntersectionObserver" in window)) {
    items.forEach((item) => item.classList.add("is-visible"));
    return;
  }

  const observer = new IntersectionObserver((entries) => {
    entries.forEach((entry) => {
      if (entry.isIntersecting) {
        entry.target.classList.add("is-visible");
        observer.unobserve(entry.target);
      }
    });
  }, { threshold: 0.12 });

  items.forEach((item) => observer.observe(item));
}

function init() {
  renderPlanner();
  renderCatalog();
  renderCart();
  bindNavigation();
  bindFilters();
  bindCatalogActions();
  bindPlanner();
  bindCart();
  bindForms();
  bindPricing();
  setupReveal();
}

document.addEventListener("DOMContentLoaded", init);
