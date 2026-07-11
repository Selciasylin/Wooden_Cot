// ─────────────────────────────────────────────────────────────
// MY ORDERS — list page
// Loads once, everything after (search, pagination) is fetch —
// the page itself never reloads.
// ─────────────────────────────────────────────────────────────

const LIMIT = 5;
let currentPage = 1;

// Statuses that mean the item reached the customer
const DELIVERED_STAGE = [
  "Delivered",
  "Return Requested",
  "Returned",
  "Return Rejected",
];

// ── Derive ONE order-level status from per-item statuses ──
// We never store this in DB — always calculated fresh from items,
// so it can never go out of sync.
function getOrderStatus(items) {
  const statuses = items.map((i) => i.status);

  if (statuses.every((s) => s === "Cancelled")) return "Cancelled";

  // Judge the rest ignoring cancelled items
  const active = statuses.filter((s) => s !== "Cancelled");

  if (active.every((s) => s === "Returned")) return "Returned";
  if (active.every((s) => DELIVERED_STAGE.includes(s))) return "Delivered";
  if (active.every((s) => s === "Shipped")) return "Shipped";
  if (active.some((s) => DELIVERED_STAGE.includes(s)))
    return "Partially Delivered";
  if (active.some((s) => s === "Shipped")) return "Partially Shipped";

  return "Pending";
}

// ── "2 of 3 delivered" helper — shown for partial orders ──
function getProgressText(items) {
  const active = items.filter((i) => i.status !== "Cancelled");
  const delivered = active.filter((i) =>
    DELIVERED_STAGE.includes(i.status)
  ).length;

  if (delivered > 0 && delivered < active.length) {
    return `${delivered} of ${active.length} delivered`;
  }
  return "";
}

// ── Map status → badge class ──
function statusBadge(status) {
  const map = {
    Pending: "st-pending",
    Shipped: "st-shipped",
    "Partially Shipped": "st-partial",
    "Partially Delivered": "st-partial",
    "Out for Delivery": "st-shipped",
    Delivered: "st-delivered",
    Cancelled: "st-cancelled",
    "Return Requested": "st-requested",
    Returned: "st-returned",
    "Return Rejected": "st-rejected",
  };
  return `<span class="status-badge ${map[status] || "st-pending"}">${status}</span>`;
}

// ── Format date like "July 10, 2026" ──
function formatDate(dateStr) {
  return new Date(dateStr).toLocaleDateString("en-IN", {
    year: "numeric",
    month: "long",
    day: "2-digit",
  });
}

// ── Load orders ──
async function loadOrders(page = 1, search = "") {
  const res = await fetch(`/orders/data?page=${page}&search=${search}`);
  const data = await res.json();

  if (data.status !== "SUCCESS") {
    showToast("Failed to load orders", false);
    return;
  }

  renderOrders(data.orders);
  renderPagination(data.totalPages, data.currentPage);
  updateEntriesText(data.currentPage, data.orders.length, data.totalOrders);

  document.getElementById("orderCount").innerText =
    `${data.totalOrders} orders`;
}

// ── Render table rows ──
function renderOrders(orders) {
  const tbody = document.getElementById("ordersBody");
  const table = document.getElementById("ordersTable");
  const emptyState = document.getElementById("emptyState");

  tbody.innerHTML = "";

  if (orders.length === 0) {
    table.style.display = "none";
    emptyState.style.display = "block";
    return;
  }

  table.style.display = "block";
  emptyState.style.display = "none";

  orders.forEach((order) => {
    const orderStatus = getOrderStatus(order.items);
    const progressText = getProgressText(order.items);
    const firstImage = order.items[0]?.image || "";
    const itemText =
      order.items.length === 1 ? "1 item" : `${order.items.length} items`;

    tbody.innerHTML += `
      <tr>
        <td data-label="Order ID">
          <span class="order-id">#${order.orderId}</span>
        </td>
        <td data-label="Date">
          <span class="order-date">${formatDate(order.createdAt)}</span>
        </td>
        <td data-label="Items">
          <div class="items-cell">
            <img class="items-thumb" src="${firstImage}" alt="product">
            <span class="items-count">${itemText}</span>
          </div>
        </td>
        <td data-label="Total">
          <span class="total-val">₹${order.totalAmount.toLocaleString("en-IN")}</span>
        </td>
        <td data-label="Status">
          ${statusBadge(orderStatus)}
          ${progressText ? `<span class="status-sub">${progressText}</span>` : ""}
        </td>
        <td data-label="Action">
          <a href="/orders/${order.orderId}" class="btn-view">View</a>
        </td>
      </tr>
    `;
  });
}

// ── Pagination ──
function renderPagination(totalPages, current) {
  currentPage = current;
  const pagination = document.getElementById("pagination");
  pagination.innerHTML = "";

  if (totalPages <= 1) return;

  const search = document.getElementById("orderSearch").value;

  pagination.innerHTML += `
    <li class="page-item ${current === 1 ? "disabled" : ""}">
      <a class="page-link" onclick="loadOrders(${current - 1}, '${search}')">Previous</a>
    </li>
  `;

  for (let i = 1; i <= totalPages; i++) {
    pagination.innerHTML += `
      <li class="page-item ${i === current ? "active" : ""}">
        <a class="page-link" onclick="loadOrders(${i}, '${search}')">${i}</a>
      </li>
    `;
  }

  pagination.innerHTML += `
    <li class="page-item ${current === totalPages ? "disabled" : ""}">
      <a class="page-link" onclick="loadOrders(${current + 1}, '${search}')">Next</a>
    </li>
  `;
}

// ── Entries info text ──
function updateEntriesText(page, count, total) {
  const info = document.getElementById("entriesInfo");
  if (total === 0) {
    info.textContent = "";
    return;
  }
  const start = (page - 1) * LIMIT + 1;
  const end = start + count - 1;
  info.textContent = `Showing ${start} to ${end} of ${total} orders`;
}

// ── Search by order id — fetch only, no reload ──
document.getElementById("orderSearch").addEventListener("input", (e) => {
  loadOrders(1, e.target.value.trim());
});

// ── Init ──
document.addEventListener("DOMContentLoaded", () => {
  loadOrders();
});