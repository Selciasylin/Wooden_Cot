function showError(input, message) {
  const error = input.parentElement.querySelector(".error-message");
  if (error) {
    error.textContent = message;
  }
}

function clearErrors() {
  document
    .querySelectorAll(".error-message")
    .forEach((el) => (el.textContent = ""));
}
function validateCategoryForm() {
  clearErrors();
  let valid = true;
  const name = document.getElementById("addCategoryName");
  const description = document.getElementById("addCategoryDescription");
  const image = document.getElementById("addCategoryImage");

  if (!name.value.trim()) {
    showError(name, "Category name is required");
    valid = false;
  }

  if (!description.value.trim()) {
    showError(description, "Description is required");
    valid = false;
  }

  if (!image.files.length) {
    showError(image, "Category image is required");
    valid = false;
  }

  return valid;
}
async function submitAddCategory() {
  if (!validateCategoryForm()) return;
  const btn = document.getElementById("addCategoryBtn");
  btn.innerText = "Adding...";
  btn.disabled = true;
  const formData = new FormData();
  formData.append("name", document.getElementById("addCategoryName").value);
  formData.append(
    "description",
    document.getElementById("addCategoryDescription").value,
  );
  formData.append(
    "image",
    document.getElementById("addCategoryImage").files[0],
  );
  try {
    const res = await fetch("/admin/categories", {
      method: "POST",
      body: formData,
    });
    const data = await res.json();
    if (data.status === "SUCCESS") {
      document.getElementById("addCategoryForm").reset();
      document.getElementById("addCategoryPreview").classList.add("d-none");
      showToast(data.message, "success");
      bootstrap.Modal.getInstance(
        document.getElementById("addCategoryModal"),
      ).hide();
      loadCategories(1);
    } else {
      showToast(data.message, "error");
    }
  } catch (err) {
    console.error(err);
    showToast("server error", "error");
  }
  btn.innerText = "Add Category";
  btn.disabled = false;
}
let editingId = null;
function editCategory(id, name, description, image) {
  editingId = id;
  document.getElementById("editCategoryName").value = name;
  document.getElementById("editCategoryDescription").value = description;
  document.getElementById("currentCategoryImage").src = image;
}
function validateEditCategory() {
  clearErrors();
  let valid = true;
  const name = document.getElementById("editCategoryName");
  const description = document.getElementById("editCategoryDescription");

  if (!name.value.trim()) {
    showError(name, "Category name required");
    valid = false;
  }

  if (!description.value.trim()) {
    showError(description, "Description required");
    valid = false;
  }

  return valid;
}
async function submitEditCategory() {
  if (!validateEditCategory()) return;

  const btn = document.getElementById("editCategoryBtn");
  btn.innerText = "Saving...";
  btn.disabled = true;

  const nameInput = document.getElementById("editCategoryName");
  const descInput = document.getElementById("editCategoryDescription");
  const imageInput = document.getElementById("editCategoryImage");
  const currentImg = document.getElementById("currentCategoryImage");

  const formData = new FormData();
  formData.append("name", nameInput.value);
  formData.append("description", descInput.value);
  formData.append("currentImage", currentImg.src);

  if (imageInput.files[0]) {
    formData.append("image", imageInput.files[0]);
  }

  try {
    const res = await fetch(`/admin/categories/${editingId}`, {
      method: "PUT",
      body: formData,
    });

    const data = await res.json();

    if (data.status === "SUCCESS") {
      showToast(data.message, "success");

      bootstrap.Modal.getInstance(
        document.getElementById("editCategoryModal"),
      ).hide();

      loadCategories(1); // ✅ no delay
    } else {
      showToast(data.message, "error");
    }
  } catch (err) {
    console.error(err);
    showToast("Server error", "error");
  }

  btn.innerText = "Save Changes";
  btn.disabled = false;
}

//togglebutton
let toggleCategoryId = null;
function toggleList(id) {
  toggleCategoryId = id;
  const button = event.target;
  const isListed = button.innerText.trim() === "Listed";
  document.getElementById("toggleCategoryText").textContent =
    isListed
      ? "Are you sure to unlist this category?"
      : "Are you sure to list this category?";
  new bootstrap.Modal(
    document.getElementById("toggleCategoryModal")
  ).show();
}

document
  .getElementById("confirmCategoryToggleBtn")
  .addEventListener("click", async () => {
    try {
      const res = await fetch(
        `/admin/categories/toggle/${toggleCategoryId}`,
        {
          method: "PATCH",
        }
      );

      const data = await res.json();

      if (data.status === "SUCCESS") {
        showToast(data.message, "success");
        loadCategories(currentPage);
      } else {
        showToast(data.message, "error");
      }
    } catch (error) {
      console.error(error);
      showToast("Server error", "error");
    }

    bootstrap.Modal.getInstance(
      document.getElementById("toggleCategoryModal")
    ).hide();
  });

async function loadCategories(page = 1) {
  currentPage = page;
  const search = document.getElementById("searchCategory").value;
  const res = await fetch(
    `/admin/categoriesData?search=${encodeURIComponent(search)}&page=${page}`
  );
  const data = await res.json();
  if (data.status !== "SUCCESS") return;
  const tbody = document.getElementById("categoriesTableBody");
  tbody.innerHTML = "";
  if (data.categories.length === 0) {
    tbody.innerHTML = `
      <tr>
        <td colspan="5"
          class="text-center text-muted py-4">
          No category found
        </td>
      </tr>
    `;
    document.getElementById("pagination").innerHTML = "";
    return;
  }
  data.categories.forEach((category) => {
    tbody.innerHTML += `
      <tr>
        <td>${category.name}</td>
        <td>
          <img
            src="${category.image}"
            class="rounded"
            style="
              width:60px;
              height:40px;
              object-fit:cover;
            "
          >
        </td>

        <td>${category.description}</td>

        <td>
          <button
            class="${category.isListed
              ? "btn btn-listed"
              : "btn btn-unlisted"}"
            onclick="toggleList('${category._id}')"
          >
            ${category.isListed ? "Listed" : "Unlisted"}
          </button>
        </td>

        <td>

          <button
            class="btn btn-sm btn-outline-secondary"

            data-bs-toggle="modal"

            data-bs-target="#editCategoryModal"

            onclick="editCategory(
              '${category._id}',
              '${category.name}',
              '${category.description}',
              '${category.image}'
            )"
          >
            <i class="bi bi-pencil"></i>
          </button>

        </td>

      </tr>
    `;
  });
  renderPagination(data.totalPages, page);
  updateEntriesText(
    page,
    data.categories.length,
    data.totalCategories
  );
}
let currentPage = 1;

function renderPagination(totalPages, page) {
  currentPage = page;
  const pagination = document.getElementById("pagination");
  pagination.innerHTML = "";
  const search = document.getElementById("searchCategory").value;
  pagination.innerHTML += `
    <li class="page-item ${page === 1 ? "disabled" : ""}">
      <a
        class="page-link"
        href="#"
        onclick="loadCategories(${page - 1}, '${search}')"
      >
        Previous
      </a>
    </li>
  `;

  for (let i = 1; i <= totalPages; i++) {
    pagination.innerHTML += `
      <li class="page-item ${i === page ? "active" : ""}">
        <a
          class="page-link"
          href="#"
          onclick="loadCategories(${i}, '${search}')"
        >
          ${i}
        </a>
      </li>
    `;
  }

  pagination.innerHTML += `
    <li class="page-item ${page === totalPages ? "disabled" : ""}">
      <a
        class="page-link"
        href="#"
        onclick="loadCategories(${page + 1}, '${search}')"
      >
        Next
      </a>
    </li>
  `;
}
let timeout;

document.getElementById("searchCategory").addEventListener("keyup", () => {
  clearTimeout(timeout);
  timeout = setTimeout(() => {
    loadCategories(1);
  }, 400);
});
document.getElementById("clearSearch").addEventListener("click", () => {
  document.getElementById("searchCategory").value = "";
  loadCategories(1);
});
document.addEventListener("DOMContentLoaded", () => {
  loadCategories(1);
});
function showToast(msg, type = "success") {
  const toast = document.createElement("div");
  toast.className = `toast position-fixed bottom-0 end-0 m-3 show`;

  toast.innerHTML = `
    <div class="toast-body ${
      type === "success" ? "bg-dark text-white" : "bg-danger text-white"
    }">
      ${msg}
    </div>
  `;

  document.body.appendChild(toast);

  setTimeout(() => toast.remove(), 3000);
}

function updateEntriesText(page, count, total) {
  const limit = 5;
  const start = (page - 1) * limit + 1;
  const end = start + count - 1;
  document.getElementById("entriesInfo").textContent =
    `Showing ${start} to ${end} of ${total} entries`;
}
//image preview
document.getElementById("addCategoryImage").addEventListener("change", function () {
    const file = this.files[0];
    if (!file) return;
    const preview = document.getElementById("addCategoryPreview");
    preview.src = URL.createObjectURL(file);
    preview.classList.remove("d-none");
  });
