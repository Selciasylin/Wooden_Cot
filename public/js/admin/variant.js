let allVariants = [];

async function loadVariants(page = 1, search = "") {
  const res = await fetch(`/admin/variants/data?page=${page}&search=${search}`);
  const data = await res.json();
  if (data.status !== "SUCCESS") return;
  allVariants = data.variants;
  renderTable(data.variants);
  renderPagination(data.totalPages, data.currentPage);
}

// RENDER TABLE — no delete button
function renderTable(variants) {
  const tbody = document.getElementById("variantsTableBody");
  tbody.innerHTML = "";
  if (variants.length === 0) {
    tbody.innerHTML = `<tr><td colspan="4">No variants found</td></tr>`;
    return;
  }
  variants.forEach((v) => {
    tbody.innerHTML += `
      <tr>
        <td>${v.type}</td>
        <td>
          ${v.options
            .map((opt) => `<span class="option-badge">${opt.value}</span>`)
            .join("")}
        </td>
        <td>
          ${
            v.isListed
              ? `<button class="btn-listed" onclick="toggleStatus('${v._id}')">Listed</button>`
              : `<button class="btn-unlisted" onclick="toggleStatus('${v._id}')">Unlisted</button>`
          }
        </td>
        <td>
          <button
            class="btn btn-sm btn-outline-secondary me-1"
            onclick="viewVariant('${v._id}')"
          >
            <i class="bi bi-eye"></i>
          </button>
          <button
            class="btn btn-sm btn-outline-primary"
            onclick="editVariant('${v._id}')"
          >
            <i class="bi bi-pencil"></i>
          </button>
        </td>
      </tr>
    `;
  });
}

// VALIDATION
function validateVariant(typeId, containerId, typeErrorId, optionsErrorId) {
  let valid = true;
  const type = document.getElementById(typeId);
  const optionInputs = document.querySelectorAll(`#${containerId} input`);
  document.getElementById(typeErrorId).textContent = "";
  document.getElementById(optionsErrorId).textContent = "";
  if (!type.value.trim()) {
    document.getElementById(typeErrorId).textContent = "Variant type is required";
    valid = false;
  }
  const options = [];
  optionInputs.forEach((input) => {
    if (input.value.trim()) options.push({ value: input.value.trim() });
  });
  if (options.length === 0) {
    document.getElementById(optionsErrorId).textContent = "At least one option required";
    valid = false;
  }
  return valid;
}

// ADD VARIANT
document.getElementById("addVariantBtn").addEventListener("click", async () => {
  const valid = validateVariant(
    "addVariantType",
    "addOptionsContainer",
    "addTypeError",
    "addOptionsError"
  );
  if (!valid) return;
  const options = [];
  document.querySelectorAll("#addOptionsContainer input").forEach((input) => {
    if (input.value.trim()) options.push({ value: input.value.trim() });
  });
  const body = {
    type: document.getElementById("addVariantType").value,
    options,
  };
  const res = await fetch("/admin/variants", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
  const data = await res.json();
  showToast(data.message);
  if (data.status === "SUCCESS") {
    bootstrap.Modal.getInstance(document.getElementById("addVariantModal")).hide();
    loadVariants();
    document.getElementById("addVariantForm").reset();
  }
});

// EDIT VARIANT — open modal
let editVariantId = null;
function editVariant(id) {
  const variant = allVariants.find((v) => v._id === id);
  if (!variant) return;
  editVariantId = id;
  document.getElementById("editVariantType").value = variant.type;
  const container = document.getElementById("editOptionsContainer");
  container.innerHTML = "";
  variant.options.forEach((opt) => {
    container.innerHTML += `
      <div class="option-input-group">
        <div class="d-flex gap-2">
          <input type="text" class="form-control form-control-sm" value="${opt.value}">
          <button type="button" class="btn btn-danger btn-sm" onclick="removeOptionField(this)">
            <i class="bi bi-trash"></i>
          </button>
        </div>
      </div>
    `;
  });
  new bootstrap.Modal(document.getElementById("editVariantModal")).show();
}

// UPDATE VARIANT
document.getElementById("editVariantBtn").addEventListener("click", async () => {
  const valid = validateVariant(
    "editVariantType",
    "editOptionsContainer",
    "editTypeError",
    "editOptionsError"
  );
  if (!valid) return;
  const options = [];
  document.querySelectorAll("#editOptionsContainer input").forEach((input) => {
    if (input.value.trim()) options.push({ value: input.value.trim() });
  });
  const body = {
    type: document.getElementById("editVariantType").value,
    options,
  };
  const res = await fetch(`/admin/variants/${editVariantId}`, {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
  const data = await res.json();
  showToast(data.message);
  if (data.status === "SUCCESS") {
    bootstrap.Modal.getInstance(document.getElementById("editVariantModal")).hide();
    loadVariants();
  }
});

// VIEW VARIANT
function viewVariant(id) {
  const variant = allVariants.find((v) => v._id === id);
  if (!variant) return;
  document.getElementById("viewVariantType").innerText = variant.type;
  const container = document.getElementById("viewVariantOptions");
  container.innerHTML = "";
  variant.options.forEach((opt) => {
    container.innerHTML += `<span class="option-badge">${opt.value}</span>`;
  });
  new bootstrap.Modal(document.getElementById("viewVariantModal")).show();
}

// TOGGLE STATUS
let toggleVariantId = null;
function toggleStatus(id) {
  toggleVariantId = id;
  const variant = allVariants.find((v) => v._id === id);
  document.getElementById("toggleStatusText").textContent = variant.isListed
    ? "Are you sure to unlist this variant?"
    : "Are you sure to list this variant?";
  new bootstrap.Modal(document.getElementById("toggleStatusModal")).show();
}
document.getElementById("confirmToggleBtn").addEventListener("click", async () => {
  const res = await fetch(`/admin/variants/toggle/${toggleVariantId}`, {
    method: "PATCH",
  });
  const data = await res.json();
  showToast(data.message);
  loadVariants();
  bootstrap.Modal.getInstance(document.getElementById("toggleStatusModal")).hide();
});

// SEARCH
document.getElementById("searchVariant").addEventListener("input", (e) => {
  loadVariants(1, e.target.value);
});
document.getElementById("clearSearch").addEventListener("click", () => {
  document.getElementById("searchVariant").value = "";
  loadVariants(1, "");
});

// PAGINATION
function renderPagination(totalPages, currentPage) {
  const pagination = document.getElementById("pagination");
  pagination.innerHTML = "";
  const search = document.getElementById("searchVariant").value;
  pagination.innerHTML += `
    <li class="page-item ${currentPage === 1 ? "disabled" : ""}">
      <a class="page-link" onclick="loadVariants(${currentPage - 1}, '${search}')">Previous</a>
    </li>
  `;
  for (let i = 1; i <= totalPages; i++) {
    pagination.innerHTML += `
      <li class="page-item ${i === currentPage ? "active" : ""}">
        <a class="page-link" onclick="loadVariants(${i}, '${search}')">${i}</a>
      </li>
    `;
  }
  pagination.innerHTML += `
    <li class="page-item ${currentPage === totalPages ? "disabled" : ""}">
      <a class="page-link" onclick="loadVariants(${currentPage + 1}, '${search}')">Next</a>
    </li>
  `;
}

// TOAST
function showToast(message) {
  const toast = document.createElement("div");
  toast.className = "toast position-fixed bottom-0 end-0 m-3 show";
  toast.innerHTML = `<div class="toast-body bg-dark text-white">${message}</div>`;
  document.body.appendChild(toast);
  setTimeout(() => toast.remove(), 3000);
}

window.onload = () => loadVariants();