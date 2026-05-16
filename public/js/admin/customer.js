let toggleCustomerId = null;
let toggleButton = null;

function toggleBlock(userId, button) {
  toggleCustomerId = userId;
  toggleButton = button;
  const isBlocked =
    button.textContent.trim() === "Unblock";
  document.getElementById("toggleCustomerText").textContent =
    isBlocked
      ? "Are you sure to unblock this customer?"
      : "Are you sure to block this customer?";
  new bootstrap.Modal(
    document.getElementById("toggleCustomerModal")
  ).show();
}
document.getElementById("confirmToggleCustomerBtn").addEventListener("click", async () => {
    try{
      const res = await fetch(
        `/admin/toggleUser/${toggleCustomerId}`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
        }
      );
      const data = await res.json();
      if (data.success) {
        loadCustomers(currentPage);
      } else {
        alert(data.message);
      }
    } catch (err) {
      console.error(err);
      alert("Something went wrong");
    }
    bootstrap.Modal.getInstance(
      document.getElementById("toggleCustomerModal")
    ).hide();

  });
async function loadCustomers(page = 1) {
  currentPage = page;
  const search = document.getElementById("searchCustomers").value;
  const res = await fetch(`/admin/customersData?search=${encodeURIComponent(search)}&page=${page}`);
  const data = await res.json();
  if (!data.success) return;
  const tbody = document.getElementById("customerTableBody");
  tbody.innerHTML = "";
  if (data.users.length === 0) {
    tbody.innerHTML = `
      <tr>
        <td colspan="5" class="text-center">
          No Users Found
        </td>
      </tr>
    `;
    document.getElementById("pagination").innerHTML = "";
    return;
  }

  data.users.forEach((user) => {
    tbody.innerHTML += `
      <tr>

        <td>${user.firstName}</td>

        <td>${user.lastName}</td>

        <td>${user.email}</td>

        <td>${user.phoneNumber}</td>

        <td>

          <button
            onclick="toggleBlock('${user._id}', this)"
            class="btn ${
              user.isBlocked
                ? "btn-unblock-custom"
                : "btn-block-custom"
            }"
          >
            ${user.isBlocked ? "Unblock" : "Block"}
          </button>
        </td>
      </tr>
    `;
  });
  renderPagination(data.totalPages, page);
  updateEntriesText(
    page,
    data.users.length,
    data.totalUsers
  );
}

let currentPage = 1;

function renderPagination(totalPages, page) {
  currentPage = page;
  const pagination = document.getElementById("pagination");
  pagination.innerHTML = "";
  pagination.innerHTML += `
    <li class="page-item ${page === 1 ? "disabled" : ""}">
      <a class="page-link" href="#" onclick="loadCustomers(${page - 1})">
        Previous
      </a>
    </li>
  `;

  for (let i = 1; i <= totalPages; i++) {

    pagination.innerHTML += `
      <li class="page-item ${i === page ? "active" : ""}">
        <a class="page-link" href="#" onclick="loadCustomers(${i})">
          ${i}
        </a>
      </li>
    `;
  }

  pagination.innerHTML += `
    <li class="page-item ${page === totalPages ? "disabled" : ""}">
      <a class="page-link" href="#" onclick="loadCustomers(${page + 1})">
        Next
      </a>
    </li>
  `;
}

document.getElementById("searchCustomers").addEventListener("keyup", () => {
  loadCustomers(1);
});

document.getElementById("resetSearch").addEventListener("click", () => {
  document.getElementById("searchCustomers").value = "";
  loadCustomers(1);
});
document.addEventListener("DOMContentLoaded", () => {
  loadCustomers(1);
});

function updateEntriesText(page, count, total) {
  const limit = 5;
  const start = (page - 1) * limit + 1;
  const end = start + count - 1;
  document.getElementById("entriesInfo").textContent =
    `Showing ${start} to ${end} of ${total} entries`;
}
