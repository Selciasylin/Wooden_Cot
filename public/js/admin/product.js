let allProducts = [];

const ALLOWED_IMAGE_TYPES = ["image/jpeg", "image/png", "image/webp"];
const MAX_IMAGE_SIZE = 2 * 1024 * 1024; // 2MB

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
  if (error) {
    error.textContent = message;
  }
}

function clearErrors(form) {
  form.querySelectorAll(".error").forEach((el) => (el.textContent = ""));
}
//validateAddProduct
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
  let sizeSelected = false;

  ["single", "queen", "king"].forEach((size) => {
    const chk = document.getElementById("chk-" + size);

    if (chk.checked) {
      sizeSelected = true;
      const withDrawerChecked = document.getElementById(
        `add-chk-${size}-drawer`,
      )?.checked;
      const withoutDrawerChecked = document.getElementById(
        `add-chk-${size}-nodrawer`,
      )?.checked;

      if (!withDrawerChecked && !withoutDrawerChecked) {
        document.getElementById(`error-${size}`).textContent =
          "Select at least one variant type";
        valid = false;
      }
      const withQty = document.getElementById(`add-qty-${size}-drawer`);
      const withPrice = document.getElementById(`add-price-${size}-drawer`);

      const withoutQty = document.getElementById(`add-qty-${size}-nodrawer`);
      const withoutPrice = document.getElementById(
        `add-price-${size}-nodrawer`,
      );

      if (withDrawerChecked) {
        if (!withQty.value) {
          document.getElementById(`error-${size}`).textContent =
            "Enter quantity (with drawer)";
          valid = false;
        } else if (!withPrice.value) {
          document.getElementById(`error-${size}`).textContent =
            "Enter price (with drawer)";
          valid = false;
        }
      }

      if (withoutDrawerChecked) {
        if (!withoutQty.value) {
          document.getElementById(`error-${size}`).textContent =
            "Enter quantity (without drawer)";
          valid = false;
        } else if (!withoutPrice.value) {
          document.getElementById(`error-${size}`).textContent =
            "Enter price (without drawer)";
          valid = false;
        }
      }
    }
  });
  if (!sizeSelected) {
    document.getElementById("error-size").textContent =
      "Select at least one size"; // simple for now
    valid = false;
  }
  // IMAGE VALIDATION
  let imageCount = 0;

  for (let i = 0; i < 4; i++) {
    if (document.getElementById(`fileInput-${i}`).files[0]) {
      imageCount++;
    }
  }

  if (imageCount === 0) {
    document.getElementById("error-image").textContent =
      "Add at least one image";
    valid = false;
  }
  return valid;
}
//validateEditProduct
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

  let sizeSelected = false;
  ["single", "queen", "king"].forEach((size) => {
    const chk = document.getElementById("chk-edit-" + size);

    if (chk.checked) {
      sizeSelected = true;

      const withQty = document.getElementById(`edit-qty-${size}-drawer`);
      const withPrice = document.getElementById(`edit-price-${size}-drawer`);

      const withoutQty = document.getElementById(`edit-qty-${size}-nodrawer`);
      const withoutPrice = document.getElementById(
        `edit-price-${size}-nodrawer`,
      );
      if (
        (!withQty.value || !withPrice.value) &&
        (!withoutQty.value || !withoutPrice.value)
      ) {
        showError(withQty || withoutQty, "Enter at least one variant");
        valid = false;
      }
    }
  });
  if (!sizeSelected) {
    document.getElementById("edit-error-size").textContent =
      "Select at least one size";
    valid = false;
  }
  let imageCount = 0;

  for (let i = 0; i < 4; i++) {
    if (document.getElementById(`editFileInput-${i}`).files[0]) {
      imageCount++;
    }
  }

  const existingImages = window.currentImages || [];

  if (imageCount === 0 && existingImages.length === 0) {
    document.getElementById("edit-error-image").textContent =
      "Add at least one image";
    valid = false;
  }
  return valid;
}

//pagination
let currentPage = 1;
async function loadProducts(page = 1, search = "") {
  const res = await fetch(`/admin/products/data?page=${page}&search=${search}`);
  const data = await res.json();
  allProducts = data.products;
  if (data.status !== "SUCCESS") {
    return;
  }
  renderTable(data.products);
  renderPagination(data.totalPages, data.currentPage);
}

//table render

function renderTable(products) {
  const tbody = document.getElementById("productTableBody");
  tbody.innerHTML = "";
  if (products.length === 0) {
    tbody.innerHTML = `<tr><td colspan="6">No products</td></tr>`;
    return;
  }
  console.log(products)
  products.forEach((p) => {
    tbody.innerHTML += `
      <tr>
        <td><img src="${p.images[0]}" class="product-img"/></td>
        <td>${p.name}</td>
        <td>${p.category.name}</td>
       <td>
        ${
          p.sizes.some((s) => {
            const v = s.variants || {};
            return (
              (v.withDrawer && v.withDrawer.quantity > 0) ||
              (v.withoutDrawer && v.withoutDrawer.quantity > 0)
            );
          })
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

function renderPagination(totalPages, current) {
  const pagination = document.getElementById("pagination");
  pagination.innerHTML = "";

  const search = document.getElementById("searchCategory").value;

  for (let i = 1; i <= totalPages; i++) {
    pagination.innerHTML += `
      <li class="page-item ${i === current ? "active" : ""}">
        <a class="page-link" onclick="loadProducts(${i}, '${search}')">${i}</a>
      </li>
    `;
  }
}

document.getElementById("addProductBtn").addEventListener("click", async () => {
  if (!validateAddProduct()) return;
  const btn = document.getElementById("addProductBtn");
  btn.innerText = "Adding...";
  btn.disabled = true;

  const formData = new FormData();

  formData.append("name", document.getElementById("name").value);
  formData.append("category", document.getElementById("category").value);
  formData.append("description", document.getElementById("description").value);

  // sizes
  const sizes = [];

  if (document.getElementById("chk-single").checked) {
    const singleWithQty = document.getElementById(
      "add-qty-single-drawer",
    )?.value;
    const singleWithPrice = document.getElementById(
      "add-price-single-drawer",
    )?.value;

    const singleWithoutQty = document.getElementById(
      "add-qty-single-nodrawer",
    )?.value;
    const singleWithoutPrice = document.getElementById(
      "add-price-single-nodrawer",
    )?.value;

    sizes.push({
      size: "single",
      variants: {
        ...(singleWithQty &&
          singleWithPrice && {
            withDrawer: {
              quantity: singleWithQty,
              price: singleWithPrice,
            },
          }),
        ...(singleWithoutQty &&
          singleWithoutPrice && {
            withoutDrawer: {
              quantity: singleWithoutQty,
              price: singleWithoutPrice,
            },
          }),
      },
    });
  }
  if (document.getElementById("chk-queen").checked) {
    const queenWithQty = document.getElementById("add-qty-queen-drawer")?.value;
    const queenWithPrice = document.getElementById(
      "add-price-queen-drawer",
    )?.value;

    const queenWithoutQty = document.getElementById(
      "add-qty-queen-nodrawer",
    )?.value;
    const queenWithoutPrice = document.getElementById(
      "add-price-queen-nodrawer",
    )?.value;

    sizes.push({
      size: "queen",
      variants: {
        ...(queenWithQty &&
          queenWithPrice && {
            withDrawer: {
              quantity: queenWithQty,
              price: queenWithPrice,
            },
          }),
        ...(queenWithoutQty &&
          queenWithoutPrice && {
            withoutDrawer: {
              quantity: queenWithoutQty,
              price: queenWithoutPrice,
            },
          }),
      },
    });
  }
  if (document.getElementById("chk-king").checked) {
    const kingWithQty = document.getElementById("add-qty-king-drawer")?.value;
    const kingWithPrice = document.getElementById(
      "add-price-king-drawer",
    )?.value;

    const kingWithoutQty = document.getElementById(
      "add-qty-king-nodrawer",
    )?.value;
    const kingWithoutPrice = document.getElementById(
      "add-price-king-nodrawer",
    )?.value;

    sizes.push({
      size: "king",
      variants: {
        ...(kingWithQty &&
          kingWithPrice && {
            withDrawer: {
              quantity: kingWithQty,
              price: kingWithPrice,
            },
          }),
        ...(kingWithoutQty &&
          kingWithoutPrice && {
            withoutDrawer: {
              quantity: kingWithoutQty,
              price: kingWithoutPrice,
            },
          }),
      },
    });
  }
  formData.append("sizes", JSON.stringify(sizes));

  // images
  for (let i = 0; i < 4; i++) {
    const file = document.getElementById(`fileInput-${i}`).files[0];
    if (file) {
      formData.append("images", file);
    }
  }
  try {
    const res = await fetch("/admin/products", {
      method: "POST",
      body: formData,
    });

    const data = await res.json();

    if (data.status === "ERROR") {
      document.getElementById("error-image").textContent = data.message; // 👈 show inside modal
      return;
    }
    // success
    showToast(data.message);
    if (data.status === "SUCCESS") {
      bootstrap.Modal.getInstance(
        document.getElementById("addProductModal"),
      ).hide();
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
//delete
let deleteId = null;
function deleteProduct(id) {
  deleteId = id;
  new bootstrap.Modal(document.getElementById("confirmDeleteModal")).show();
}
document
  .getElementById("confirmDeleteBtn")
  .addEventListener("click", async () => {
    const res = await fetch(`/admin/products/${deleteId}`, {
      method: "DELETE",
    });
    const data = await res.json();
    showToast(data.message);
    loadProducts();
    bootstrap.Modal.getInstance(
      document.getElementById("confirmDeleteModal"),
    ).hide();
  });

document.getElementById("searchCategory").addEventListener("input", (e) => {
  loadProducts(1, e.target.value);
});
//editProduct
async function editProduct(id) {
  const product = allProducts.find((p) => p._id === id);

  if (!product) return;

  // fill basic fields
  document.getElementById("editProductName").value = product.name;
  document.getElementById("editProductCategory").value = product.category._id;
  document.getElementById("editProductDesc").value = product.description;

  // reset sizes
  ["single", "queen", "king"].forEach((size) => {
    document.getElementById(`chk-edit-${size}`).checked = false;
    document.getElementById(`edit-${size}-subtypes`).classList.remove("show");
  });

  // fill sizes
  product.sizes.forEach((s) => {
    document.getElementById(`chk-edit-${s.size}`).checked = true;
    document.getElementById(`edit-${s.size}-subtypes`).classList.add("show");
    const v = s.variants || {};

    const withQtyEl = document.getElementById(`edit-qty-${s.size}-drawer`);
    const withPriceEl = document.getElementById(`edit-price-${s.size}-drawer`);

    const withoutQtyEl = document.getElementById(`edit-qty-${s.size}-nodrawer`);
    const withoutPriceEl = document.getElementById(
      `edit-price-${s.size}-nodrawer`,
    );
    // WITH DRAWER
    if (withQtyEl) withQtyEl.value = v.withDrawer?.quantity ?? "";
    if (withPriceEl) withPriceEl.value = v.withDrawer?.price ?? "";

    // WITHOUT DRAWER
    if (withoutQtyEl) withoutQtyEl.value = v.withoutDrawer?.quantity ?? "";
    if (withoutPriceEl) withoutPriceEl.value = v.withoutDrawer?.price ?? "";
  });
  // store ID globally
  window.editingProductId = id;

  // store current images
  window.currentImages = product.images;
  // ✅ ADD THIS CLEAN VERSION
for (let i = 0; i < 4; i++) {
  const slot = document.getElementById(`edit-slot-${i}`);
  if (slot) slot.innerHTML = "Add Image";
}

product.images.forEach((img, index) => {
  const slot = document.getElementById(`edit-slot-${index}`);
  if (slot) {
    slot.innerHTML = `<img src="${img}" class="w-100 h-100">
      <button
        type="button"
        class="slot-remove"
        onclick="removeEditSlot(event, ${index})"
      >
        <i class="bi bi-x"></i>
      </button>`;
  }
});

  // open modal
  new bootstrap.Modal(document.getElementById("editProductModal")).show();
}

document
  .getElementById("editProductBtn")
  .addEventListener("click", async () => {
    if (!validateEditProduct()) return;
    const btn = document.getElementById("editProductBtn");
    btn.innerText = "Saving...";
    btn.disabled = true;
    const formData = new FormData();

    formData.append("name", document.getElementById("editProductName").value);
    formData.append(
      "category",
      document.getElementById("editProductCategory").value,
    );
    formData.append(
      "description",
      document.getElementById("editProductDesc").value,
    );

    // sizes
    const sizes = [];

    // SINGLE
    if (document.getElementById("chk-edit-single").checked) {
      const withQty = document.getElementById("edit-qty-single-drawer")?.value;
      const withPrice = document.getElementById(
        "edit-price-single-drawer",
      )?.value;

      const withoutQty = document.getElementById(
        "edit-qty-single-nodrawer",
      )?.value;
      const withoutPrice = document.getElementById(
        "edit-price-single-nodrawer",
      )?.value;

      sizes.push({
        size: "single",
        variants: {
          ...(withQty &&
            withPrice && {
              withDrawer: {
                quantity: withQty,
                price: withPrice,
              },
            }),
          ...(withoutQty &&
            withoutPrice && {
              withoutDrawer: {
                quantity: withoutQty,
                price: withoutPrice,
              },
            }),
        },
      });
    }

    // QUEEN
    if (document.getElementById("chk-edit-queen").checked) {
      const withQty = document.getElementById("edit-qty-queen-drawer")?.value;
      const withPrice = document.getElementById(
        "edit-price-queen-drawer",
      )?.value;

      const withoutQty = document.getElementById(
        "edit-qty-queen-nodrawer",
      )?.value;
      const withoutPrice = document.getElementById(
        "edit-price-queen-nodrawer",
      )?.value;

      sizes.push({
        size: "queen",
        variants: {
          ...(withQty &&
            withPrice && {
              withDrawer: {
                quantity: withQty,
                price: withPrice,
              },
            }),
          ...(withoutQty &&
            withoutPrice && {
              withoutDrawer: {
                quantity: withoutQty,
                price: withoutPrice,
              },
            }),
        },
      });
    }

    // KING
    if (document.getElementById("chk-edit-king").checked) {
      const withQty = document.getElementById("edit-qty-king-drawer")?.value;
      const withPrice = document.getElementById(
        "edit-price-king-drawer",
      )?.value;

      const withoutQty = document.getElementById(
        "edit-qty-king-nodrawer",
      )?.value;
      const withoutPrice = document.getElementById(
        "edit-price-king-nodrawer",
      )?.value;

      sizes.push({
        size: "king",
        variants: {
          ...(withQty &&
            withPrice && {
              withDrawer: {
                quantity: withQty,
                price: withPrice,
              },
            }),
          ...(withoutQty &&
            withoutPrice && {
              withoutDrawer: {
                quantity: withoutQty,
                price: withoutPrice,
              },
            }),
        },
      });
    }
    formData.append("sizes", JSON.stringify(sizes));

    // send current images if no new upload
    formData.append(
      "currentImages",
      window.currentImages ? JSON.stringify(window.currentImages) : "[]",
    );

    // new images
    for (let i = 0; i < 4; i++) {
      const file = document.getElementById(`editFileInput-${i}`).files[0];
      if (file) {
        formData.append("images", file);
      }
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
        bootstrap.Modal.getInstance(
          document.getElementById("editProductModal"),
        ).hide();
        loadProducts();
      }
    } catch (err) {
      console.error(err);
    } finally {
      btn.innerText = "Save Changes";
      btn.disabled = false;
    }
  });
//viewProduct
async function viewProduct(id) {

  const product = allProducts.find((p) => p._id === id);
  if (!product) return;

  // 🔹 BASIC DETAILS
  document.getElementById("viewName").innerText = product.name;
  document.getElementById("viewCategory").innerText = product.category;
  document.getElementById("viewDescription").innerText = product.description;

  // 🔹 STOCK STATUS
  const inStock = product.sizes.some((s) => {
    const v = s.variants || {};
    return (
      (v.withDrawer && v.withDrawer.quantity > 0) ||
      (v.withoutDrawer && v.withoutDrawer.quantity > 0)
    );
  });

  document.getElementById("viewAvailability").innerHTML = inStock
    ? `<span class="badge-instock">In Stock</span>`
    : `<span class="badge-outofstock">Out of Stock</span>`;

  document.getElementById("viewStatus").innerHTML = product.isListed
    ? `<span class="badge bg-success">Listed</span>`
    : `<span class="badge bg-secondary">Unlisted</span>`;

  // 🔹 IMAGES
  const mainImg = document.getElementById("viewMainImage");
  if (mainImg) {
    mainImg.src = product.images[0] || "";
  }

  const container = document.getElementById("viewImagesContainer");
  container.innerHTML = "";

  product.images.slice(1).forEach((img) => {
    container.innerHTML += `
      <div class="col-6">
        <img src="${img}" class="w-100 rounded" style="height:80px;object-fit:cover;">
      </div>
    `;
  });

  // 🔥 🔥 TABLE RENDERING (NEW PART)
  const tbody = document.getElementById("viewSizeTableBody");
  tbody.innerHTML = ""; // clear old data

  product.sizes.forEach((s) => {
    const v = s.variants || {};

    // Without Drawer
    tbody.innerHTML += `
      <tr>
        <td>${s.size}</td>
        <td>No Drawer</td>
        <td>${v.withoutDrawer?.quantity ?? 0}</td>
        <td>${v.withoutDrawer?.price ?? 0}</td>
      </tr>
    `;

    // With Drawer
    tbody.innerHTML += `
      <tr>
        <td>${s.size}</td>
        <td>With Drawer</td>
        <td>${v.withDrawer?.quantity ?? 0}</td>
        <td>${v.withDrawer?.price ?? 0}</td>
      </tr>
    `;
  });

  // 🔹 OPEN MODAL
  new bootstrap.Modal(document.getElementById("viewProductModal")).show();
}

// 🔥 HELPER FUNCTION (ADD ONCE)
function capitalize(str) {
  return str.charAt(0).toUpperCase() + str.slice(1);
}
window.viewProduct = viewProduct;
window.editProduct = editProduct;
window.deleteProduct = deleteProduct;
//show error message in div
function showToast(msg) {
  const toast = document.createElement("div");
  toast.className = "toast position-fixed bottom-0 end-0 m-3 show";
  toast.innerHTML = `
    <div class="toast-body bg-dark text-white">${msg}</div>
  `;
  document.body.appendChild(toast);

  setTimeout(() => toast.remove(), 3000);
}
let toggleProductId = null;

function toggleStatus(id) {
  toggleProductId = id;

  const product = allProducts.find((p) => p._id === id);

  document.getElementById("toggleStatusText").textContent =
    product.isListed
      ? "Are you sure you want to unlist this product?"
      : "Are you sure you want to list this product?";

  new bootstrap.Modal(
    document.getElementById("toggleStatusModal"),
  ).show();
}

document.getElementById("confirmToggleBtn").addEventListener("click", async () => {
    const res = await fetch(`/admin/products/toggle/${toggleProductId}`, {
      method: "PATCH",
    });

    const data = await res.json();

    showToast(data.message);

    loadProducts();

    bootstrap.Modal.getInstance(
      document.getElementById("toggleStatusModal"),
    ).hide();
  });
window.onload = () => {
  loadProducts();
};
document.getElementById("clearSearch").addEventListener("click", () => {
  const input = document.getElementById("searchCategory");

  input.value = ""; // clear input
  loadProducts(1, ""); // reload all products
});
function resetAddProductModal() {
  const form = document.getElementById("addProductForm");
  form.reset();

  for (let i = 0; i < 4; i++) {
    const input = document.getElementById(`fileInput-${i}`);
    if (input) input.value = "";

    const slot = document.getElementById(`slot-${i}`);
    if (slot) slot.innerHTML = "Add Image";
  }

  document.querySelectorAll(".error").forEach(el => el.textContent = "");
}
window.addEventListener("DOMContentLoaded", () => {

  // CONNECT SLOT CLICK
  for (let i = 0; i < 4; i++) {
    const slot = document.getElementById(`slot-${i}`);
    const input = document.getElementById(`fileInput-${i}`);

    if (slot && input) {
      slot.addEventListener("click", () => input.click());
    }

    const editSlot = document.getElementById(`edit-slot-${i}`);
    const editInput = document.getElementById(`editFileInput-${i}`);

    if (editSlot && editInput) {
      editSlot.addEventListener("click", () => editInput.click());
    }
  }

  // PREVIEW
  for (let i = 0; i < 4; i++) {

  const input = document.getElementById(`fileInput-${i}`);
  if (input) {
    input.addEventListener("change", function () {
      if (this.files && this.files[0]) {
        openCrop(i, this, "add"); // ✅ THIS FIXES YOUR ISSUE
      }
    });
  }

  const editInput = document.getElementById(`editFileInput-${i}`);
  if (editInput) {
    editInput.addEventListener("change", function () {
      if (this.files && this.files[0]) {
        openCrop(i, this, "edit"); // ✅ FOR EDIT ALSO
      }
    });
  }
}
});
