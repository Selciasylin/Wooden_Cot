function toggleBlock(userId, button) {
  fetch(`/admin/toggleUser/${userId}`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
  })
    .then((res) => res.json())
    .then((data) => {
      if (data.success) {
        if (data.isBlocked) {
          button.textContent = "Unblock";
          button.classList.remove("btn-block-custom");
          button.classList.add("btn-unblock-custom");
        } else {
          button.textContent = "Block";
          button.classList.remove("btn-unblock-custom");
          button.classList.add("btn-block-custom");
        }
      } else {
        alert(data.message);
      }
    })
    .catch((err) => {
      console.error("Error:", err);
      alert("Something went wrong");
    });
}
async function loadCustomers(page = 1) {
  const search = document.getElementById("searchCustomers").value;
  const res = await fetch(
    `/admin/customersData?search=${encodeURIComponent(search)}&page=${page}`,
  );
  const data = await res.json();
  if (!data.success) return;
  const tbody = document.getElementById("customerTableBody");
  tbody.innerHTML = "";
  if (data.users.length === 0) {
    tbody.innerHTML = `
        <tr>
            <td colspan="5" class="text-center">No Users Found</td>
        </tr>`;
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
                    class="btn ${user.isBlocked ? "btn-unblock-custom" : "btn-block-custom"}">
                    ${user.isBlocked ? "Unblock" : "Block"}
                </button>
            </td>
        </tr>`;
  });
  renderPagination(data.totalPages, page);
}
function renderPagination(totalPages, currentPage) {
  const pagination = document.getElementById("pagination");
  pagination.innerHTML = "";
  for (let i = 1; i <= totalPages; i++) {
    pagination.innerHTML += `
        <li class="page-item ${i === currentPage ? "active" : ""}">
            <a class="page-link" href="#" onclick="loadCustomers(${i})">${i}</a>
        </li>`;
  }
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
