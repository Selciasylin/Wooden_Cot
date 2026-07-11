// ─────────────────────────────────────────────────────────────
// ADMIN SINGLE ORDER PAGE
// URL: /admin/orders/:orderId
// Page loads once; status updates and return actions re-fetch
// the order — no page reloads.
// ─────────────────────────────────────────────────────────────

const orderId = window.location.pathname.split("/").pop();

let currentOrder = null;

// What the confirm modal is about to do:
// { type: "status", status } OR { type: "return", itemId, action }
let pendingAction = null;

const DELIVERED_STAGE = [
  "Delivered",
  "Return Requested",
  "Returned",
  "Return Rejected",
];

// ── Derived order-level status (same logic everywhere) ──
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
    Paid: "st-delivered",
    Failed: "st-cancelled",
    Refunded: "st-returned",
  };
  return `<span class="status-badge ${map[status] || "st-pending"}">${status}</span>`;
}

function formatDate(dateStr) {
  return new Date(dateStr).toLocaleDateString("en-IN", {
    year: "numeric",
    month: "long",
    day: "2-digit",
  });
}

function formatDateTime(dateStr) {
  return new Date(dateStr).toLocaleString("en-IN", {
    year: "numeric",
    month: "short",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
  });
}

// ── Load order ──
async function loadOrder() {
  const res = await fetch(`/admin/orders/data/${orderId}`);
  const data = await res.json();

  if (data.status !== "SUCCESS") {
    showToast(data.message || "Failed to load order");
    setTimeout(() => (window.location.href = "/admin/orders"), 1500);
    return;
  }

  currentOrder = data.order;
  renderHeader(currentOrder);
  renderItems(currentOrder);
  renderCustomer(currentOrder);
  renderAddress(currentOrder.shippingAddress);
  renderTimeline(currentOrder);
  renderSummary(currentOrder);
  renderPayment(currentOrder);
  renderReturnRequests(currentOrder);
  toggleActionButtons(currentOrder);
}

// ── Header ──
function renderHeader(order) {
  document.getElementById("orderIdTitle").innerText = `Order #${order.orderId}`;
  document.getElementById("orderDate").innerText =
    `Placed on ${formatDateTime(order.createdAt)}`;
  document.getElementById("orderStatusBadge").innerHTML = statusBadge(
    getOrderStatus(order.items),
  );
}

// ── Items table ──
function renderItems(order) {
  const tbody = document.getElementById("orderItemsBody");
  tbody.innerHTML = "";

  const FORWARD = ["Pending", "Shipped", "Out for Delivery"];
  const nextStatusMap = {
    Pending: ["Shipped", "Cancelled"],
    Shipped: ["Out for Delivery", "Cancelled"],
    "Out for Delivery": ["Delivered", "Cancelled"],
  };

  order.items.forEach((item) => {
    const badges = item.variantOptions
      .map((opt) => `<span class="variant-badge">${opt}</span>`)
      .join(" ");
    const canUpdate = FORWARD.includes(item.status);

    const actionCell = canUpdate
      ? `
        <div class="d-flex gap-1">
          <select class="form-select form-select-sm item-status-select" style="width:auto;font-size:11px;">
            ${nextStatusMap[item.status].map((s) => `<option value="${s}">${s}</option>`).join("")}
          </select>
          <button class="btn-custom btn-sm py-1 px-2" style="font-size:11px;"
            onclick="openItemStatusConfirm('${item._id}', this)">Go</button>
        </div>`
      : "";

    tbody.innerHTML += `
      <tr>
        <td>
          <div class="prod-cell">
            <img class="prod-img" src="${item.image}" alt="${item.productName}">
            <div>
              <div class="prod-name">${item.productName}</div>
              <div class="d-flex gap-1 flex-wrap mt-1">${badges}</div>
            </div>
          </div>
        </td>
        <td class="small">×${item.quantity}</td>
        <td class="small">₹${item.price.toLocaleString("en-IN")}</td>
        <td class="small fw-semibold">₹${item.itemTotal.toLocaleString("en-IN")}</td>
        <td>${statusBadge(item.status)}</td>
        <td>${actionCell}</td>
      </tr>
    `;
  });
}

function openItemStatusConfirm(itemId, btn) {
  const select = btn.previousElementSibling;
  const status = select.value;
  pendingAction = { type: "status", itemId, status };
  document.getElementById("confirmStatusText").innerText =
    `Mark this product as "${status}"?`;
  new bootstrap.Modal(document.getElementById("confirmStatusModal")).show();
}
window.openItemStatusConfirm = openItemStatusConfirm;

// ── Customer details (from populate) ──
function renderCustomer(order) {
  const customer = order.userId || {};
  const custName =
    [customer.firstName, customer.lastName].filter(Boolean).join(" ") ||
    "Unknown";

  document.getElementById("customerDetails").innerHTML = `
    <div class="col-md-6">
      <div class="detail-label">Full Name</div>
      <div class="detail-value">${custName}</div>
    </div>
    <div class="col-md-6">
      <div class="detail-label">Email</div>
      <div class="detail-value">${customer.email || "-"}</div>
    </div>
    <div class="col-md-6">
      <div class="detail-label">Phone</div>
      <div class="detail-value">${customer.phoneNumber || "-"}</div>
    </div>
    <div class="col-md-6">
      <div class="detail-label">Customer ID</div>
      <div class="detail-value">${customer._id || "-"}</div>
    </div>
  `;
}

// ── Shipping address snapshot ──
function renderAddress(addr) {
  document.getElementById("shippingAddress").innerHTML = `
    <span class="addr-type-badge">${addr.addressType}</span><br>
    <strong>${addr.fullName}</strong><br>
    ${addr.addressLine1}${addr.addressLine2 ? ", " + addr.addressLine2 : ""}<br>
    ${addr.city}, ${addr.state} - ${addr.zip}<br>
    ${addr.country}<br>
    <i class="bi bi-telephone me-1"></i>${addr.phone}
  `;
}

// ── Timeline ──
function renderTimeline(order) {
  const overallStatus = getOrderStatus(order.items);
  const timeline = document.getElementById("orderTimeline");

  if (overallStatus === "Cancelled") {
    timeline.innerHTML = `
      <div class="tl-step done">
        <div class="tl-dot"></div>
        <div class="tl-label">Order Placed</div>
        <div class="tl-date">${formatDateTime(order.createdAt)}</div>
      </div>
      <div class="tl-step cancelled">
        <div class="tl-dot"></div>
        <div class="tl-label">Order Cancelled</div>
      </div>
    `;
    return;
  }

  const steps = ["Order Placed", "Shipped", "Out for Delivery", "Delivered"];

  let progress = 0;
  if (
    [
      "Shipped",
      "Partially Shipped",
      "Out for Delivery",
      "Partially Delivered",
      "Delivered",
      "Returned",
    ].includes(overallStatus)
  ) {
    progress = 1;
  }
  if (
    [
      "Out for Delivery",
      "Partially Delivered",
      "Delivered",
      "Returned",
    ].includes(overallStatus)
  ) {
    progress = 2;
  }
  if (["Delivered", "Returned"].includes(overallStatus)) progress = 3;

  timeline.innerHTML = steps
    .map((label, index) => {
      const done = index <= progress;
      const dateHTML =
        index === 0
          ? `<div class="tl-date">${formatDateTime(order.createdAt)}</div>`
          : done
            ? ""
            : `<div class="tl-date">Pending</div>`;
      return `
        <div class="tl-step ${done ? "done" : ""}">
          <div class="tl-dot"></div>
          <div class="tl-label">${label}</div>
          ${dateHTML}
        </div>
      `;
    })
    .join("");
}

// ── Price details ──
function renderSummary(order) {
  document.getElementById("summarySubtotal").innerText =
    `₹${order.subtotal.toLocaleString("en-IN")}`;
  document.getElementById("summaryShipping").innerText =
    `₹${order.shippingCost.toLocaleString("en-IN")}`;
  document.getElementById("summaryDiscount").innerText =
    `-₹${(order.discount || 0).toLocaleString("en-IN")}`;
  document.getElementById("summaryTotal").innerText =
    `₹${order.totalAmount.toLocaleString("en-IN")}`;
}

// ── Payment ──
function renderPayment(order) {
  const methodNames = {
    COD: "Cash on Delivery",
    RAZORPAY: "Razorpay",
    WALLET: "Wallet",
  };
  document.getElementById("paymentMethod").innerText =
    methodNames[order.paymentMethod] || order.paymentMethod;
  document.getElementById("paymentStatus").innerHTML = statusBadge(
    order.paymentStatus,
  );
}

// ── Return requests card ──
function renderReturnRequests(order) {
  const card = document.getElementById("returnCard");
  const container = document.getElementById("returnRequests");

  const requests = order.items.filter((i) => i.status === "Return Requested");

  if (requests.length === 0) {
    card.style.display = "none";
    return;
  }

  card.style.display = "block";
  container.innerHTML = "";

  requests.forEach((item) => {
    container.innerHTML += `
      <div class="return-item">
        <div class="return-prod">${item.productName} ×${item.quantity}</div>
        <div class="return-reason">
          <i class="bi bi-chat-left-text me-1"></i>${item.returnReason || "No reason given"}
        </div>
        <div class="d-flex gap-2">
          <button class="btn-approve" onclick="openReturnConfirm('${item._id}', 'approve')">
            <i class="bi bi-check-lg me-1"></i>Approve
          </button>
          <button class="btn-reject" onclick="openReturnConfirm('${item._id}', 'reject')">
            <i class="bi bi-x-lg me-1"></i>Reject
          </button>
        </div>
      </div>
    `;
  });
}

// ── Show/hide action buttons based on order state ──
function toggleActionButtons(order) {
  const FORWARD = ["Pending", "Shipped", "Out for Delivery"];
  const hasForwardItems = order.items.some((i) => FORWARD.includes(i.status));

  document.getElementById("updateStatusBtn").disabled = !hasForwardItems;
  document.getElementById("statusSelect").disabled = !hasForwardItems;
  document.getElementById("cancelOrderBtn").style.display = hasForwardItems
    ? "block"
    : "none";
}

// ─────────────────────────────────────────────────────────────
// ACTIONS — all go through one confirm modal, then fetch
// ─────────────────────────────────────────────────────────────

// Update status button
document.getElementById("updateStatusBtn").addEventListener("click", () => {
  const status = document.getElementById("statusSelect").value;
  pendingAction = { type: "status", status };
  document.getElementById("confirmStatusText").innerText =
    `Mark this order as "${status}"?`;
  new bootstrap.Modal(document.getElementById("confirmStatusModal")).show();
});

// Cancel order button
document.getElementById("cancelOrderBtn").addEventListener("click", () => {
  pendingAction = { type: "status", status: "Cancelled" };
  document.getElementById("confirmStatusText").innerText =
    "Cancel this order? Stock will be added back.";
  new bootstrap.Modal(document.getElementById("confirmStatusModal")).show();
});

// Return approve/reject buttons
function openReturnConfirm(itemId, action) {
  pendingAction = { type: "return", itemId, action };
  document.getElementById("confirmStatusText").innerText =
    action === "approve"
      ? "Approve this return? Stock will be added back."
      : "Reject this return request?";
  new bootstrap.Modal(document.getElementById("confirmStatusModal")).show();
}
window.openReturnConfirm = openReturnConfirm;

// Confirm modal "Yes" — runs whichever action is pending
document
  .getElementById("confirmStatusBtn")
  .addEventListener("click", async () => {
    if (!pendingAction) return;

    const btn = document.getElementById("confirmStatusBtn");
    btn.disabled = true;

    let url = "";
    let body = {};

    if (pendingAction.type === "status") {
      url = `/admin/orders/${orderId}/status`;
      body = { itemId: pendingAction.itemId, status: pendingAction.status };
    } else {
      url = `/admin/orders/${orderId}/return`;
      body = { itemId: pendingAction.itemId, action: pendingAction.action };
    }

    try {
      const res = await fetch(url, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      const data = await res.json();

      showToast(data.message);

      if (data.status === "SUCCESS") {
        loadOrder(); // re-fetch — badges, timeline, buttons refresh, no reload
      }
    } catch (err) {
      showToast("Something went wrong");
    } finally {
      btn.disabled = false;
      pendingAction = null;
      bootstrap.Modal.getInstance(
        document.getElementById("confirmStatusModal"),
      ).hide();
    }
  });

// ── Toast (same as admin product page) ──
function showToast(msg) {
  const toast = document.createElement("div");
  toast.className = "toast position-fixed bottom-0 end-0 m-3 show";
  toast.innerHTML = `<div class="toast-body bg-dark text-white">${msg}</div>`;
  document.body.appendChild(toast);
  setTimeout(() => toast.remove(), 3000);
}

// ── Init ──
window.onload = () => {
  loadOrder();
};
