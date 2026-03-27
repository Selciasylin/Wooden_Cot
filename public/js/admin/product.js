 function showError(input, message) {
    const error = input.parentElement.querySelector(".error");
    if (error) {
        error.textContent = message;
    }
}

function clearErrors(form) {
    form.querySelectorAll(".error").forEach(el => el.textContent = "");
}
function validateAddProduct() {

    const form = document.getElementById("addProductForm");
    clearErrors(form);

    let valid = true;

    const name = document.getElementById("name");
    const category = document.getElementById("category");
    const description = document.getElementById("description");

    // NAME
    if (!name.value.trim() || name.value.trim().length < 3) {
        showError(name, "Minimum 3 characters required");
        valid = false;
    }

    // CATEGORY
    if (!category.value) {
        showError(category, "Select category");
        valid = false;
    }

    // DESCRIPTION
    if (!description.value.trim() || description.value.trim().length < 10) {
        showError(description, "Minimum 10 characters required");
        valid = false;
    }

    // SIZE VALIDATION
    let sizeSelected = false;

    ["single", "queen", "king"].forEach(size => {

        const chk = document.getElementById("chk-" + size);

        if (chk.checked) {
            sizeSelected = true;

            const qtyInput = document.querySelector(`.qty-${size}`);
            const priceInput = document.querySelector(`.price-${size}`);

            if (!qtyInput.value || qtyInput.value < 0) {
                showError(qtyInput, "Invalid quantity");
                valid = false;
            }

            if (!priceInput.value || priceInput.value <= 0) {
                showError(priceInput, "Invalid price");
                valid = false;
            }
        }
    });

    if (!sizeSelected) {
        document.getElementById("error-size").textContent = "Select at least one size";// simple for now
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
        document.getElementById("error-image").textContent = "Add at least one image";
        valid = false;
    }

    return valid;
}
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
    ["single", "queen", "king"].forEach(size => {
        const chk = document.getElementById("chk-edit-" + size);
        if (chk.checked) {
            sizeSelected = true;

            const qtyInput = document.querySelector(`.edit-qty-${size}`);
            const priceInput = document.querySelector(`.edit-price-${size}`);

            if (!qtyInput.value || qtyInput.value < 0) {
                showError(qtyInput, "Invalid quantity");
                valid = false;
            }

            if (!priceInput.value || priceInput.value <= 0) {
                showError(priceInput, "Invalid price");
                valid = false;
            }
        }
    });
    if (!sizeSelected) {
        document.getElementById("edit-error-size").textContent = "Select at least one size";
        valid = false;
    }
     let imageCount = 0;

    for (let i = 0; i < 4; i++) {
        if (document.getElementById(`fileInput-${i}`).files[0]) {
            imageCount++;
        }
    }

    if (imageCount === 0) {
        document.getElementById("edit-error-image").textContent = "Add at least one image";
        valid = false;
    }

    return valid;
}
document.getElementById("addProductBtn").addEventListener("click", () => {
    if (!validateAddProduct()) return;
});

document.getElementById("editProductBtn").addEventListener("click", () => {
    if (!validateEditProduct()) return;
});
let currentPage = 1;
async function loadProducts(page = 1, search = "") {
  const res = await fetch(`/admin/products/data?page=${page}&search=${search}`);
  const data = await res.json();
  if (data.status !== "SUCCESS"){
     return;
  }
  renderTable(data.products);
  renderPagination(data.totalPages, data.currentPage);
}

function renderTable(products) {
  const tbody = document.getElementById("productTableBody");
  tbody.innerHTML = "";
  if (products.length === 0) {
    tbody.innerHTML = `<tr><td colspan="6">No products</td></tr>`;
    return;
  }
  products.forEach(p => {
    tbody.innerHTML += `
      <tr>
        <td><img src="${p.images[0]}" class="product-img"/></td>
        <td>${p.name}</td>
        <td>${p.category}</td>
        <td>
        ${
            p.sizes.some(s => s.quantity > 0)
            ? `<span class="badge bg-success-subtle text-success px-3 py-2 rounded-pill">In Stock</span>`
            : `<span class="badge bg-danger-subtle text-danger px-3 py-2 rounded-pill">Out of Stock</span>`
        }
        </td>
        <td>
        ${
            p.isListed
            ? `<span class="badge px-3 py-2 rounded-pill" style="background:#a88c64;color:white;">Listed</span>`
            : `<span class="badge bg-secondary px-3 py-2 rounded-pill">Unlisted</span>`
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

  for (let i = 1; i <= totalPages; i++) {
    pagination.innerHTML += `
      <li class="page-item ${i === current ? "active" : ""}">
        <a class="page-link" onclick="loadProducts(${i})">${i}</a>
      </li>
    `;
  }
}

document.getElementById("addProductBtn").addEventListener("click", async () => {

  const formData = new FormData();

  formData.append("name", document.getElementById("name").value);
  formData.append("category", document.getElementById("category").value);
  formData.append("description", document.getElementById("description").value);

  // sizes
  const sizes = [];

  if (document.getElementById("chk-single").checked) {
    sizes.push({
      size: "single",
      quantity: document.querySelector(".qty-single").value,
      price: document.querySelector(".price-single").value
    });
  }

  if (document.getElementById("chk-queen").checked) {
    sizes.push({
      size: "queen",
      quantity: document.querySelector(".qty-queen").value,
      price: document.querySelector(".price-queen").value
    });
  }

  if (document.getElementById("chk-king").checked) {
    sizes.push({
      size: "king",
      quantity: document.querySelector(".qty-king").value,
      price: document.querySelector(".price-king").value
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

  const res = await fetch("/admin/products", {
    method: "POST",
    body: formData
  });

  const data = await res.json();

  alert(data.message);

  if (data.status === "SUCCESS") {
    loadProducts();
    bootstrap.Modal.getInstance(document.getElementById("addProductModal")).hide();
  }
});

async function deleteProduct(id) {
  if (!confirm("Delete product?")) return;

  const res = await fetch(`/admin/products/${id}`, {
    method: "DELETE"
  });

  const data = await res.json();
  alert(data.message);

  loadProducts();
}

document.getElementById("searchCategory").addEventListener("input", (e) => {
  loadProducts(1, e.target.value);
});

async function editProduct(id) {
  const res = await fetch(`/admin/products/data?page=1`); // reuse data
  const data = await res.json();

  const product = data.products.find(p => p._id === id);

  if (!product) return;

  // fill basic fields
  document.getElementById("editProductName").value = product.name;
  document.getElementById("editProductCategory").value = product.category;
  document.getElementById("editProductDesc").value = product.description;

  // reset sizes
  ["single","queen","king"].forEach(size => {
    document.getElementById(`chk-edit-${size}`).checked = false;
    document.getElementById(`fields-edit-${size}`).classList.remove("show");
  });

  // fill sizes
  product.sizes.forEach(s => {
    document.getElementById(`chk-edit-${s.size}`).checked = true;
    document.getElementById(`fields-edit-${s.size}`).classList.add("show");

    document.querySelector(`.edit-qty-${s.size}`).value = s.quantity;
    document.querySelector(`.edit-price-${s.size}`).value = s.price;
  });

  // store ID globally
  window.editingProductId = id;

  // store current images
  window.currentImages = product.images;

  // fill images preview
  product.images.forEach((img, index) => {
    const slot = document.getElementById(`edit-slot-${index}`);
    slot.innerHTML = `
      <img src="${img}">
      <button class="slot-remove" onclick="removeEditSlot(event, ${index})">
        ✕
      </button>
    `;
  });

  // open modal
  new bootstrap.Modal(document.getElementById("editProductModal")).show();
}

document.getElementById("editProductBtn").addEventListener("click", async () => {

  const formData = new FormData();

  formData.append("name", document.getElementById("editProductName").value);
  formData.append("category", document.getElementById("editProductCategory").value);
  formData.append("description", document.getElementById("editProductDesc").value);

  // sizes
  const sizes = [];

  if (document.getElementById("chk-edit-single").checked) {
    sizes.push({
      size: "single",
      quantity: document.querySelector(".edit-qty-single").value,
      price: document.querySelector(".edit-price-single").value
    });
  }

  if (document.getElementById("chk-edit-queen").checked) {
    sizes.push({
      size: "queen",
      quantity: document.querySelector(".edit-qty-queen").value,
      price: document.querySelector(".edit-price-queen").value
    });
  }

  if (document.getElementById("chk-edit-king").checked) {
    sizes.push({
      size: "king",
      quantity: document.querySelector(".edit-qty-king").value,
      price: document.querySelector(".edit-price-king").value
    });
  }

  formData.append("sizes", JSON.stringify(sizes));

  // send current images if no new upload
  formData.append("currentImages", JSON.stringify(window.currentImages || []));

  // new images
  for (let i = 0; i < 4; i++) {
    const file = document.getElementById(`editFileInput-${i}`).files[0];
    if (file) {
      formData.append("images", file);
    }
  }

  const res = await fetch(`/admin/products/${window.editingProductId}`, {
    method: "PUT",
    body: formData
  });

  const data = await res.json();

  alert(data.message);

  if (data.status === "SUCCESS") {
    loadProducts();
    bootstrap.Modal.getInstance(document.getElementById("editProductModal")).hide();
  }
});

 async function viewProduct(id) {
  const res = await fetch(`/admin/products/data?page=1`);
  const data = await res.json();

  const product = data.products.find(p => p._id === id);
  if (!product) return;

  // TEXT
  document.getElementById("viewName").innerText = product.name;
  document.getElementById("viewCategory").innerText = product.category;
  document.getElementById("viewDescription").innerText = product.description;

  // STOCK
  const inStock = product.sizes.some(s => s.quantity > 0);

  document.getElementById("viewAvailability").innerHTML =
    inStock
      ? `<span class="badge-instock">In Stock</span>`
      : `<span class="badge-outofstock">Out of Stock</span>`;

  document.getElementById("viewStatus").innerHTML =
    product.isListed
      ? `<span class="badge bg-success">Listed</span>`
      : `<span class="badge bg-secondary">Unlisted</span>`;

  // IMAGES
  document.getElementById("viewMainImage").src = product.images[0] || "";

  document.getElementById("viewImg1").src = product.images[1] || "";
  document.getElementById("viewImg2").src = product.images[2] || "";
  document.getElementById("viewImg3").src = product.images[3] || "";

  // SIZE TABLE
  const tbody = document.getElementById("viewSizeTable");
  tbody.innerHTML = "";

  product.sizes.forEach(s => {
    tbody.innerHTML += `
      <tr>
        <td>${s.size}</td>
        <td>${s.quantity}</td>
        <td>₹${s.price}</td>
      </tr>
    `;
  });

  // OPEN MODAL
  new bootstrap.Modal(document.getElementById("viewProductModal")).show();
}
window.viewProduct = viewProduct;
window.editProduct = editProduct;
window.deleteProduct = deleteProduct;
loadProducts();