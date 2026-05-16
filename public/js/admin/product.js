const variantsFromBackend = JSON.parse(
  document.getElementById("variant-data").textContent
);

// ─────────────────────────────────────────────────────────────
// ADD VARIANT ROW
//
// type = "add"  → ADD modal: skip unlisted variants entirely
// type = "edit" → EDIT modal: show unlisted but disabled + warning
// ─────────────────────────────────────────────────────────────
function addVariantRow(type = "add") {
  const container =
    type === "add"
      ? document.getElementById("variantCombinations")
      : document.getElementById("editVariantCombinations");

  const row = document.createElement("div");
  row.className = "border rounded p-3 mb-3 variant-row";

  // ── Get all option IDs already saved in this product ──
  // (set from editProduct before calling addVariantRow)
  const savedOptionIds = window.currentVariantOptions || [];

  let selects = "";

  variantsFromBackend.forEach((variant) => {
    // ADD modal: skip unlisted variant types
    if (type === "add" && !variant.isListed) return;

    if (type === "edit" && !variant.isListed) {
      // Check: does this product actually USE any option from this variant?
      const productUsesThisVariant = variant.options.some((opt) =>
        savedOptionIds.includes(opt._id)
      );
      // If product doesn't use this unlisted variant → skip entirely
      if (!productUsesThisVariant) return;
    }

    const isVariantUnlisted = !variant.isListed;

    const visibleOptions = variant.options.filter((opt) => !opt.isDeleted);

    const optionHTML = visibleOptions
      .map((opt) => {
        if (type === "add" && !opt.isListed) return "";
        const isOptUnlisted = !opt.isListed;
        const disabledAttr = isVariantUnlisted || isOptUnlisted ? "disabled" : "";
        const labelSuffix = isOptUnlisted ? " (unlisted)" : "";
        return `<option value="${opt._id}" ${disabledAttr}>${opt.value}${labelSuffix}</option>`;
      })
      .join("");

    const unlistedBadge = isVariantUnlisted
      ? `<span class="badge bg-warning text-dark ms-1" style="font-size:10px;">Unlisted</span>`
      : "";

    const selectDisabled = type === "edit" && isVariantUnlisted ? "disabled" : "";
    const disabledTitle = type === "edit" && isVariantUnlisted
      ? `title="This variant type is unlisted and cannot be changed"`
      : "";

    selects += `
      <div class="col-md-4 mb-2">
        <label class="form-label">
          ${variant.type} ${unlistedBadge}
        </label>
        <select
          class="form-select variant-option ${isVariantUnlisted && type === "edit" ? "bg-light text-muted" : ""}"
          data-variant="${variant._id}"
          ${selectDisabled}
          ${disabledTitle}
        >
          <option value="">Select ${variant.type}</option>
          ${optionHTML}
        </select>
        ${
          type === "edit" && isVariantUnlisted
            ? `<small class="text-warning">
                <i class="bi bi-exclamation-triangle-fill me-1"></i>
                This variant is unlisted — cannot be changed
               </small>`
            : ""
        }
      </div>
    `;
  });

  if (type === "add" && selects.trim() === "") {
    selects = `<div class="col-12 text-muted small">No listed variant types available.</div>`;
  }

  row.innerHTML = `
    <div class="row">
      ${selects}
      <div class="col-md-2">
        <label>Qty</label>
        <input type="number" class="form-control variant-qty" min="0">
      </div>
      <div class="col-md-2">
        <label>Price</label>
        <input type="number" class="form-control variant-price" min="0">
      </div>
      <div class="col-12 text-end mt-2">
        <button
          type="button"
          class="btn btn-danger btn-sm"
          onclick="this.closest('.variant-row').remove()"
        >
          Remove
        </button>
      </div>
    </div>
  `;

  container.appendChild(row);
}

// ─────────────────────────────────────────────────────────────
// REST OF product.js — unchanged below
// ─────────────────────────────────────────────────────────────

let allProducts = [];

const ALLOWED_IMAGE_TYPES = ["image/jpeg", "image/png", "image/webp"];
const MAX_IMAGE_SIZE = 2 * 1024 * 1024;

function validateImageFile(file) {
  if (!ALLOWED_IMAGE_TYPES.includes(file.type)) {
    return "Only JPG, PNG and WEBP images are allowed";
  }
  if (file.size > MAX_IMAGE_SIZE) {
    return "Image size must be less than 2MB";
  }
  return null;
}

function showError(input, message) {
  const error = input.parentElement.querySelector(".error");
  if (error) error.textContent = message;
}

function clearErrors(form) {
  form.querySelectorAll(".error").forEach((el) => (el.textContent = ""));
}

function collectVariants(type = "add") {
  const container =
    type === "add"
      ? document.getElementById("variantCombinations")
      : document.getElementById("editVariantCombinations");
  if (!container) return [];
  const rows = container.querySelectorAll(".variant-row");
  const variants = [];
  rows.forEach((row) => {
    const options = [];
    row.querySelectorAll(".variant-option").forEach((select) => {
      // Skip disabled selects (unlisted variants in edit modal)
      if (!select.disabled && select.value) {
        options.push(select.value);
      }
    });
    if (options.length === 0) return;
    variants.push({
      options,
      quantity: row.querySelector(".variant-qty").value,
      price: row.querySelector(".variant-price").value,
    });
  });
  return variants;
}

// VALIDATE ADD PRODUCT
function validateAddProduct() {
  const form = document.getElementById("addProductForm");
  clearErrors(form);
  let valid = true;
  const name = document.getElementById("name");
  const category = document.getElementById("category");
  const description = document.getElementById("description");
  if (!name.value.trim() || name.value.trim().length < 3) {
    showError(name, "Minimum 3 characters required");
    valid = false;
  }
  if (!category.value) {
    showError(category, "Select category");
    valid = false;
  }
  if (!description.value.trim() || description.value.trim().length < 10) {
    showError(description, "Minimum 10 characters required");
    valid = false;
  }
  document.getElementById("error-variants").textContent = "";
  const variants = collectVariants("add");
  const seen = new Set();
  for (const v of variants) {
    const key = [...v.options].sort().join("-");
    if (seen.has(key)) {
      document.getElementById("error-variants").textContent = "Duplicate variant combination";
      valid = false;
      break;
    }
    seen.add(key);
  }
  if (variants.length === 0) {
    document.getElementById("error-variants").textContent = "Add at least one variant";
    valid = false;
  }
  variants.forEach((v) => {
    if (v.options.length === 0 || !v.quantity || !v.price) {
      document.getElementById("error-variants").textContent = "Fill all variant fields";
      valid = false;
    }
  });
  let imageCount = 0;
  for (let i = 0; i < 4; i++) {
    if (document.getElementById(`fileInput-${i}`).files[0]) imageCount++;
  }
  if (imageCount === 0) {
    document.getElementById("error-image").textContent = "Add at least one image";
    valid = false;
  }
  return valid;
}

// VALIDATE EDIT PRODUCT
function validateEditProduct() {
  const form = document.getElementById("editProductForm");
  clearErrors(form);
  let valid = true;
  const name = document.getElementById("editProductName");
  const category = document.getElementById("editProductCategory");
  const description = document.getElementById("editProductDesc");
  if (!name.value.trim() || name.value.trim().length < 3) {
    showError(name, "Minimum 3 characters required");
    valid = false;
  }
  if (!category.value) {
    showError(category, "Select category");
    valid = false;
  }
  if (!description.value.trim() || description.value.trim().length < 10) {
    showError(description, "Minimum 10 characters required");
    valid = false;
  }
  const variants = collectVariants("edit");
  const seen = new Set();
  for (const v of variants) {
    const key = [...v.options].sort().join("-");
    if (seen.has(key)) {
      document.getElementById("edit-error-variants").textContent = "Duplicate variant combination";
      valid = false;
      break;
    }
    seen.add(key);
  }
  if (variants.length === 0) {
    document.getElementById("edit-error-variants").textContent = "Add at least one variant";
    valid = false;
  }
  variants.forEach((v) => {
    if (v.options.length === 0 || !v.quantity || !v.price) {
      document.getElementById("edit-error-variants").textContent = "Fill all variant fields";
      valid = false;
    }
  });
  let imageCount = 0;
  for (let i = 0; i < 4; i++) {
    if (document.getElementById(`editFileInput-${i}`).files[0]) imageCount++;
  }
  const existingImages = window.currentImages || [];
  if (imageCount === 0 && existingImages.length === 0) {
    document.getElementById("edit-error-image").textContent = "Add at least one image";
    valid = false;
  }
  return valid;
}

// LOAD PRODUCTS
async function loadProducts(page = 1, search = "") {
  const res = await fetch(`/admin/products/data?page=${page}&search=${search}`);
  const data = await res.json();
  allProducts = data.products;
  if (data.status !== "SUCCESS") return;
  renderTable(data.products);
  renderPagination(data.totalPages, data.currentPage);
  updateEntriesText(page,
  data.products.length,
  data.totalProducts
);
}

// RENDER TABLE
function renderTable(products) {
  const tbody = document.getElementById("productTableBody");
  tbody.innerHTML = "";
  if (products.length === 0) {
    tbody.innerHTML = `<tr><td colspan="6">No products</td></tr>`;
    return;
  }
  products.forEach((p) => {
    tbody.innerHTML += `
      <tr>
        <td><img src="${p.images[0]}" class="product-img"/></td>
        <td>${p.name}</td>
        <td>${p.category.name}</td>
        <td>
          ${
            p.variants.some((v) => v.quantity > 0)
              ? `<span class="badge bg-success-subtle text-success px-3 py-2 rounded-pill">In Stock</span>`
              : `<span class="badge bg-danger-subtle text-danger px-3 py-2 rounded-pill">Out of Stock</span>`
          }
        </td>
        <td>
          ${
            p.isListed
              ? `<button class="btn-listed" onclick="toggleStatus('${p._id}')">Listed</button>`
              : `<button class="btn-unlisted" onclick="toggleStatus('${p._id}')">Unlisted</button>`
          }
        </td>
        <td class="text-center">
          <div class="actions">
            <button class="btn btn-light border btn-sm" onclick="viewProduct('${p._id}')">
              <i class="bi bi-eye"></i>
            </button>
            <button class="btn btn-outline-primary btn-sm" onclick="editProduct('${p._id}')">
              <i class="bi bi-pencil"></i>
            </button>
            <button class="btn btn-outline-danger btn-sm" onclick="deleteProduct('${p._id}')">
              <i class="bi bi-trash"></i>
            </button>
          </div>
        </td>
      </tr>
    `;
  });
}

let currentPage = 1;

function renderPagination(totalPages, current) {
  currentPage = current;
  const pagination = document.getElementById("pagination");
  pagination.innerHTML = "";
  const search = document.getElementById("searchCategory").value;
  pagination.innerHTML += `
    <li class="page-item ${current === 1 ? "disabled" : ""}">
      <a
        class="page-link"
        onclick="loadProducts(${current - 1}, '${search}')"
      >
        Previous
      </a>
    </li>
  `;

  for (let i = 1; i <= totalPages; i++) {

    pagination.innerHTML += `
      <li class="page-item ${i === current ? "active" : ""}">
        <a
          class="page-link"
          onclick="loadProducts(${i}, '${search}')"
        >
          ${i}
        </a>
      </li>
    `;
  }

  pagination.innerHTML += `
    <li class="page-item ${current === totalPages ? "disabled" : ""}">
      <a
        class="page-link"
        onclick="loadProducts(${current + 1}, '${search}')"
      >
        Next
      </a>
    </li>
  `;
}
//entires info
function updateEntriesText(page, count, total) {
  const limit = 5;
  const start = (page - 1) * limit + 1;
  const end = start + count - 1;
  document.getElementById("entriesInfo").textContent =
    `Showing ${start} to ${end} of ${total} entries`;
}

// ADD PRODUCT
document.getElementById("addProductBtn").addEventListener("click", async () => {
  if (!validateAddProduct()) return;
  const btn = document.getElementById("addProductBtn");
  btn.innerText = "Adding...";
  btn.disabled = true;
  const formData = new FormData();
  formData.append("name", document.getElementById("name").value);
  formData.append("category", document.getElementById("category").value);
  formData.append("description", document.getElementById("description").value);
  formData.append("variants", JSON.stringify(collectVariants("add")));
  for (let i = 0; i < 4; i++) {
    const file = document.getElementById(`fileInput-${i}`).files[0];
    if (file) formData.append("images", file);
  }
  try {
    const res = await fetch("/admin/products", { method: "POST", body: formData });
    const data = await res.json();
    if (data.status === "ERROR") {
      document.getElementById("error-image").textContent = data.message;
      return;
    }
    showToast(data.message);
    if (data.status === "SUCCESS") {
      bootstrap.Modal.getInstance(document.getElementById("addProductModal")).hide();
      resetAddProductModal();
      loadProducts();
    }
  } catch (err) {
    console.error(err);
  } finally {
    btn.innerText = "Add Product";
    btn.disabled = false;
  }
});

// DELETE PRODUCT
let deleteId = null;
function deleteProduct(id) {
  deleteId = id;
  new bootstrap.Modal(document.getElementById("confirmDeleteModal")).show();
}
document.getElementById("confirmDeleteBtn").addEventListener("click", async () => {
  const res = await fetch(`/admin/products/${deleteId}`, { method: "DELETE" });
  const data = await res.json();
  showToast(data.message);
  loadProducts();
  bootstrap.Modal.getInstance(document.getElementById("confirmDeleteModal")).hide();
});

// SEARCH
document.getElementById("searchCategory").addEventListener("input", (e) => {
  loadProducts(1, e.target.value);
});

// EDIT PRODUCT — populate modal
async function editProduct(id) {
  const product = allProducts.find((p) => p._id === id);
  if (!product) return;
  document.getElementById("editProductName").value = product.name;
  document.getElementById("editProductCategory").value = product.category._id;
  document.getElementById("editProductDesc").value = product.description;
  const container = document.getElementById("editVariantCombinations");
  container.innerHTML = "";
  product.variants.forEach((v) => {
    window.currentVariantOptions = v.options;
    addVariantRow("edit");
    const rows = container.querySelectorAll(".variant-row");
    const lastRow = rows[rows.length - 1];
    const selects = lastRow.querySelectorAll(".variant-option");
    selects.forEach((select) => {
      // Match saved option even if select is disabled (unlisted variant)
      const matchingOption = Array.from(select.options).find((opt) =>
        v.options.includes(opt.value)
      );
      if (matchingOption) select.value = matchingOption.value;
    });
    lastRow.querySelector(".variant-qty").value = v.quantity;
    lastRow.querySelector(".variant-price").value = v.price;
  });
  window.editingProductId = id;
  window.currentImages = product.images;
  for (let i = 0; i < 4; i++) {
    const slot = document.getElementById(`edit-slot-${i}`);
    if (slot) slot.innerHTML = "Add Image";
  }
  product.images.forEach((img, index) => {
    const slot = document.getElementById(`edit-slot-${index}`);
    if (slot) {
      slot.innerHTML = `<img src="${img}" class="w-100 h-100">
        <button type="button" class="slot-remove" onclick="removeEditSlot(event, ${index})">
          <i class="bi bi-x"></i>
        </button>`;
    }
  });
  new bootstrap.Modal(document.getElementById("editProductModal")).show();
}

// UPDATE PRODUCT
document.getElementById("editProductBtn").addEventListener("click", async () => {
  if (!validateEditProduct()) return;
  const btn = document.getElementById("editProductBtn");
  btn.innerText = "Saving...";
  btn.disabled = true;
  const formData = new FormData();
  formData.append("name", document.getElementById("editProductName").value);
  formData.append("category", document.getElementById("editProductCategory").value);
  formData.append("description", document.getElementById("editProductDesc").value);
  formData.append("variants", JSON.stringify(collectVariants("edit")));
  formData.append(
    "currentImages",
    window.currentImages ? JSON.stringify(window.currentImages) : "[]"
  );
  for (let i = 0; i < 4; i++) {
    const file = document.getElementById(`editFileInput-${i}`).files[0];
    if (file) formData.append("images", file);
  }
  try {
    const res = await fetch(`/admin/products/${window.editingProductId}`, {
      method: "PUT",
      body: formData,
    });
    const data = await res.json();
    if (data.status === "ERROR") {
      document.getElementById("edit-error-image").textContent = data.message;
      return;
    }
    showToast(data.message);
    if (data.status === "SUCCESS") {
      bootstrap.Modal.getInstance(document.getElementById("editProductModal")).hide();
      loadProducts();
    }
  } catch (err) {
    console.error(err);
  } finally {
    btn.innerText = "Save Changes";
    btn.disabled = false;
  }
});

// VIEW PRODUCT
function getOptionName(optionId) {
  for (const variant of variantsFromBackend) {
    const found = variant.options.find((opt) => opt._id === optionId);
    if (found) return found.value;
  }
  return optionId;
}

async function viewProduct(id) {
  const product = allProducts.find((p) => p._id === id);
  if (!product) return;
  document.getElementById("viewName").innerText = product.name;
  document.getElementById("viewCategory").innerText = product.category.name;
  document.getElementById("viewDescription").innerText = product.description;
  const inStock = product.variants.some((v) => v.quantity > 0);
  document.getElementById("viewAvailability").innerHTML = inStock
    ? `<span class="badge-instock">In Stock</span>`
    : `<span class="badge-outofstock">Out of Stock</span>`;
  document.getElementById("viewStatus").innerHTML = product.isListed
    ? `<span class="badge bg-success">Listed</span>`
    : `<span class="badge bg-secondary">Unlisted</span>`;
  const mainImg = document.getElementById("viewMainImage");
  if (mainImg) mainImg.src = product.images[0] || "";
  const imgContainer = document.getElementById("viewImagesContainer");
  imgContainer.innerHTML = "";
  product.images.slice(1).forEach((img) => {
    imgContainer.innerHTML += `
      <div class="col-6">
        <img src="${img}" class="w-100 rounded" style="height:80px;object-fit:cover;">
      </div>
    `;
  });
  const tbody = document.getElementById("viewSizeTableBody");
  tbody.innerHTML = "";
  product.variants.forEach((v) => {
    const optionNames = v.options.map(getOptionName).join(" / ");
    tbody.innerHTML += `
      <tr>
        <td>${optionNames}</td>
        <td>${v.quantity}</td>
        <td>${v.price}</td>
      </tr>
    `;
  });
  new bootstrap.Modal(document.getElementById("viewProductModal")).show();
}

window.viewProduct = viewProduct;
window.editProduct = editProduct;
window.deleteProduct = deleteProduct;

// TOAST
function showToast(msg) {
  const toast = document.createElement("div");
  toast.className = "toast position-fixed bottom-0 end-0 m-3 show";
  toast.innerHTML = `<div class="toast-body bg-dark text-white">${msg}</div>`;
  document.body.appendChild(toast);
  setTimeout(() => toast.remove(), 3000);
}

// TOGGLE PRODUCT STATUS
let toggleProductId = null;
function toggleStatus(id) {
  toggleProductId = id;
  const product = allProducts.find((p) => p._id === id);
  document.getElementById("toggleStatusText").textContent = product.isListed
    ? "Are you sure you want to unlist this product?"
    : "Are you sure you want to list this product?";
  new bootstrap.Modal(document.getElementById("toggleStatusModal")).show();
}
document.getElementById("confirmToggleBtn").addEventListener("click", async () => {
  const res = await fetch(`/admin/products/toggle/${toggleProductId}`, { method: "PATCH" });
  const data = await res.json();
  showToast(data.message);
  loadProducts();
  bootstrap.Modal.getInstance(document.getElementById("toggleStatusModal")).hide();
});

// CLEAR SEARCH
document.getElementById("clearSearch").addEventListener("click", () => {
  document.getElementById("searchCategory").value = "";
  loadProducts(1, "");
});

// RESET ADD MODAL
function resetAddProductModal() {
  const form = document.getElementById("addProductForm");
  document.getElementById("variantCombinations").innerHTML = "";
  form.reset();
  addVariantRow();
  for (let i = 0; i < 4; i++) {
    const input = document.getElementById(`fileInput-${i}`);
    if (input) input.value = "";
    const slot = document.getElementById(`slot-${i}`);
    if (slot) slot.innerHTML = "Add Image";
  }
  document.querySelectorAll(".error").forEach((el) => (el.textContent = ""));
}

// DOM LOAD — image slots connect
window.addEventListener("DOMContentLoaded", () => {
  for (let i = 0; i < 4; i++) {
    const slot = document.getElementById(`slot-${i}`);
    const input = document.getElementById(`fileInput-${i}`);
    if (slot && input) slot.addEventListener("click", () => input.click());
    const editSlot = document.getElementById(`edit-slot-${i}`);
    const editInput = document.getElementById(`editFileInput-${i}`);
    if (editSlot && editInput) editSlot.addEventListener("click", () => editInput.click());
  }
  for (let i = 0; i < 4; i++) {
    const input = document.getElementById(`fileInput-${i}`);
    if (input) {
      input.addEventListener("change", function () {
        if (this.files && this.files[0]) openCrop(i, this, "add");
      });
    }
    const editInput = document.getElementById(`editFileInput-${i}`);
    if (editInput) {
      editInput.addEventListener("change", function () {
        if (this.files && this.files[0]) openCrop(i, this, "edit");
      });
    }
  }
});

window.onload = () => {
  loadProducts();
  addVariantRow();
};