// ─────────────────────────────────────────────────────────────
// ADMIN ORDERS — list page
// Page loads once; search, filter, sort, pagination are all
// fetch-based — no page reloads.
// ─────────────────────────────────────────────────────────────

const LIMIT = 5;

// Current filter state — sent to the server on every load
let currentPage = 1;

// Statuses that mean the item reached the customer
const DELIVERED_STAGE = [
  "Delivered",
  "Return Requested",
  "Returned",
  "Return Rejected",
];

// ── Derive ONE order-level status from per-item statuses ──
// (same logic as the user side — kept in sync)
function getOrderStatus(items) {
  const statuses = items.map((i) => i.status);

  if (statuses.every((s) => s === "Cancelled")) return "Cancelled";

  const active = statuses.filter((s) => s !== "Cancelled");

  if (active.every((s) => s === "Returned")) return "Returned";
  if (active.every((s) => DELIVERED_STAGE.includes(s))) return "Delivered";
  if (active.every((s) => s === "Out for Delivery")) return "Out for Delivery";
  if (active.every((s) => s === "Shipped" || s === "Out for Delivery"))
    return "Shipped";
  if (active.some((s) => DELIVERED_STAGE.includes(s)))
    return "Partially Delivered";
  if (active.some((s) => s === "Shipped" || s === "Out for Delivery"))
    return "Partially Shipped";

  return "Pending";
}

function statusBadge(status) {
  const map = {
    Pending: "st-pending",
    Shipped: "st-shipped",
    "Out for Delivery": "st-shipped",
    "Partially Shipped": "st-partial",
    "Partially Delivered": "st-partial",
    Delivered: "st-delivered",
    Cancelled: "st-cancelled",
    "Return Requested": "st-requested",
    Returned: "st-returned",
    "Return Rejected": "st-rejected",
  };
  return `<span class="status-badge ${map[status] || "st-pending"}">${status}</span>`;
}

function formatDate(dateStr) {
  return new Date(dateStr).toLocaleDateString("en-IN", {
    year: "numeric",
    month: "short",
    day: "2-digit",
  });
}

// ── Load orders with current filters ──
async function loadOrders(page = 1) {
  currentPage = page;
  const search = document.getElementById("orderSearch").value.trim();
  const status = document.getElementById("statusFilter").value;
  const sort = document.getElementById("sortSelect").value;

  try {
    const res = await fetch(
      `/admin/orders/data?page=${page}&search=${search}&status=${status}&sort=${sort}`
    );
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    const data = await res.json();

    if (data.status !== "SUCCESS") {
      showToast(data.message || "Failed to load orders");
      return;
    }
    renderTable(data.orders);
    renderPagination(data.totalPages, data.currentPage);
    updateEntriesText(data.currentPage, data.orders.length, data.totalOrders);
  } catch (err) {
    console.error("loadOrders failed:", err);
    showToast("Something went wrong loading orders");
  }
}
// ── Render table rows ──
function renderTable(orders) {
  const tbody = document.getElementById("ordersTableBody");
  tbody.innerHTML = "";

  if (orders.length === 0) {
    tbody.innerHTML = `<tr><td colspan="7" class="text-center py-4 text-muted">No orders found</td></tr>`;
    return;
  }

  orders.forEach((order) => {
    const orderStatus = getOrderStatus(order.items);

    // Customer details come from populate("userId")
    const customer = order.userId || {};
    const custName =
      [customer.firstName, customer.lastName].filter(Boolean).join(" ") ||
      "Unknown";

    // Count pending return requests to alert the admin
    const returnCount = order.items.filter(
      (i) => i.status === "Return Requested"
    ).length;

    tbody.innerHTML += `
      <tr>
        <td><span class="order-id">#${order.orderId}</span></td>
        <td>
          <div class="cust-name">${custName}</div>
          <div class="cust-email">${customer.email || ""}</div>
        </td>
        <td class="small">${formatDate(order.createdAt)}</td>
        <td class="small">${order.paymentMethod}</td>
        <td class="fw-semibold small">₹${order.totalAmount.toLocaleString("en-IN")}</td>
        <td>
          ${statusBadge(orderStatus)}
          ${
            returnCount > 0
              ? `<span class="status-sub"><i class="bi bi-exclamation-circle me-1"></i>${returnCount} return request${returnCount > 1 ? "s" : ""}</span>`
              : ""
          }
        </td>
        <td>
          <a href="/admin/orders/${order.orderId}" class="btn-details">Details</a>
        </td>
      </tr>
    `;
  });
}

// ── Pagination (same pattern as admin products) ──
function renderPagination(totalPages, current) {
  const pagination = document.getElementById("pagination");
  pagination.innerHTML = "";

  if (totalPages <= 1) return;

  pagination.innerHTML += `
    <li class="page-item ${current === 1 ? "disabled" : ""}">
      <a class="page-link" onclick="loadOrders(${current - 1})">Previous</a>
    </li>
  `;

  for (let i = 1; i <= totalPages; i++) {
    pagination.innerHTML += `
      <li class="page-item ${i === current ? "active" : ""}">
        <a class="page-link" onclick="loadOrders(${i})">${i}</a>
      </li>
    `;
  }

  pagination.innerHTML += `
    <li class="page-item ${current === totalPages ? "disabled" : ""}">
      <a class="page-link" onclick="loadOrders(${current + 1})">Next</a>
    </li>
  `;
}

// ── Entries info ──
function updateEntriesText(page, count, total) {
  const info = document.getElementById("entriesInfo");
  if (total === 0) {
    info.textContent = "";
    return;
  }
  const start = (page - 1) * LIMIT + 1;
  const end = start + count - 1;
  info.textContent = `Showing ${start} to ${end} of ${total} entries`;
}

// ── Toast (same as admin product page) ──
function showToast(msg) {
  const toast = document.createElement("div");
  toast.className = "toast position-fixed bottom-0 end-0 m-3 show";
  toast.innerHTML = `<div class="toast-body bg-dark text-white">${msg}</div>`;
  document.body.appendChild(toast);
  setTimeout(() => toast.remove(), 3000);
}

// ── Filter events — every change reloads via fetch, page 1 ──
document.getElementById("orderSearch").addEventListener("input", () => {
  loadOrders(1);
});
document.getElementById("statusFilter").addEventListener("change", () => {
  loadOrders(1);
});
document.getElementById("sortSelect").addEventListener("change", () => {
  loadOrders(1);
});

// Clear — reset all filters back to default
document.getElementById("clearFilters").addEventListener("click", () => {
  document.getElementById("orderSearch").value = "";
  document.getElementById("statusFilter").value = "";
  document.getElementById("sortSelect").value = "newest";
  loadOrders(1);
});

// ── Init ──
window.onload = () => {
  loadOrders();
};