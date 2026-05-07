
let variantData = [];
let selectedSize = null;
let selectedStorage = null;

// 🔥 LOAD DATA
document.addEventListener("DOMContentLoaded", async () => {
  const res = await fetch(`/product/variant/${productId}`);
  const data = await res.json();

  console.log("API:", data);

  if (data.success) {
    variantData = data.sizes;

    // ✅ auto select first size
    if (variantData.length > 0) {
      selectedSize = variantData[0].size;

      highlightSize();
      updateStorageOptions();
      updatePrice();
    }
  }
});


// 🔥 SIZE CLICK
function selectSize(button) {
  selectedSize = button.dataset.size;

  highlightSize();
  updateStorageOptions();
  updatePrice();
}


// 🔥 STORAGE CLICK
function selectStorage(button) {
  selectedStorage = button.dataset.type;

  highlightStorage();
  updatePrice();
}


// 🔥 SIZE UI UPDATE
function highlightSize() {
  document.querySelectorAll('.size-option').forEach(btn => {
    btn.classList.remove('active','btn-custom');
    btn.classList.add('btn-outline-secondary');

    if (btn.dataset.size === selectedSize) {
      btn.classList.add('active','btn-custom');
      btn.classList.remove('btn-outline-secondary');
    }
  });
}


// 🔥 STORAGE ENABLE/DISABLE
function updateStorageOptions() {
  const sizeData = variantData.find(s => s.size === selectedSize);

  const withBtn = document.querySelector('[data-type="withDrawer"]');
  const withoutBtn = document.querySelector('[data-type="withoutDrawer"]');

  withBtn.disabled = !sizeData?.variants?.withDrawer;
  withoutBtn.disabled = !sizeData?.variants?.withoutDrawer;

  // ✅ DEFAULT RULE
  if (sizeData?.variants?.withoutDrawer) {
    selectedStorage = "withoutDrawer";
  } else {
    selectedStorage = "withDrawer";
  }

  highlightStorage();
}


// 🔥 STORAGE UI UPDATE
function highlightStorage() {
  document.querySelectorAll('.storage-option').forEach(btn => {
    btn.classList.remove('active','btn-custom');
    btn.classList.add('btn-outline-secondary');

    if (btn.dataset.type === selectedStorage) {
      btn.classList.add('active','btn-custom');
      btn.classList.remove('btn-outline-secondary');
    }
  });
}


// 🔥 PRICE UPDATE
function updatePrice() {

  if (!selectedSize || !selectedStorage) return;

  const sizeData =
    variantData.find(s => s.size === selectedSize);

  const variant =
    sizeData?.variants?.[selectedStorage];

  if (!variant) return;

  // 🔥 PRICE
  document.getElementById("price").innerText =
    `₹${variant.price}`;

  // 🔥 STOCK STATUS
  const stockStatus =
    document.getElementById("stockStatus");

  if (variant.quantity > 0) {

    stockStatus.innerHTML = `
      <i class="bi bi-check-circle me-1"></i>
      In Stock (${variant.quantity} left)
    `;

    stockStatus.className =
      "badge bg-success px-3 py-2";

  } else {

    stockStatus.innerHTML = `
      <i class="bi bi-x-circle me-1"></i>
      Out Of Stock
    `;

    stockStatus.className =
      "badge bg-danger px-3 py-2";
  }
}

 