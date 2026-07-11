// ─────────────────────────────────────────────────────────────
// SINGLE ORDER PAGE
// URL: /orders/:orderId
// Page loads once; cancel/return actions re-fetch data — no reload.
// ─────────────────────────────────────────────────────────────

// Read orderId from URL — /orders/ORD-20260710-4831
const orderId = window.location.pathname.split("/").pop();

let currentOrder = null;
let actionItemId = null; // which item the modal is acting on (null = whole order)

// Statuses that mean the item reached the customer
const DELIVERED_STAGE = [
  "Delivered",
  "Return Requested",
  "Returned",
  "Return Rejected",
];

// ── Same derived status logic as orders list page ──
function getOrderStatus(items) {
  const statuses = items.map((i) => i.status);

  if (statuses.every((s) => s === "Cancelled")) return "Cancelled";

  const active = statuses.filter((s) => s !== "Cancelled");

  if (active.every((s) => s === "Returned")) return "Returned";
  if (active.every((s) => DELIVERED_STAGE.includes(s))) return "Delivered";
  if (active.every((s) => s === "Shipped")) return "Shipped";
  if (active.some((s) => DELIVERED_STAGE.includes(s)))
    return "Partially Delivered";
  if (active.some((s) => s === "Shipped")) return "Partially Shipped";

  return "Pending";
}

// ── "2 of 3 delivered" text for partial orders ──
function getProgressText(items) {
  const active = items.filter((i) => i.status !== "Cancelled");
  const delivered = active.filter((i) =>
    DELIVERED_STAGE.includes(i.status)
  ).length;

  if (delivered > 0 && delivered < active.length) {
    return `${delivered} of ${active.length} items delivered`;
  }
  return "";
}

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

// ── Load order details ──
async function loadOrder() {
  const res = await fetch(`/orders/data/${orderId}`);
  const data = await res.json();

  if (data.status !== "SUCCESS") {
    showToast(data.message || "Failed to load order", false);
    setTimeout(() => (window.location.href = "/orders"), 1500);
    return;
  }

  currentOrder = data.order;
  renderHeader(currentOrder);
  renderItems(currentOrder);
  renderAddress(currentOrder.shippingAddress);
  renderTimeline(currentOrder);
  renderSummary(currentOrder);
  renderPayment(currentOrder);
  toggleCancelOrderBtn(currentOrder);
}

// ── Header ──
function renderHeader(order) {
  document.getElementById("orderIdTitle").innerText = `Order #${order.orderId}`;
  document.getElementById("orderDate").innerText =
    `Placed on ${formatDate(order.createdAt)}`;
  document.getElementById("orderStatusBadge").innerHTML =
    statusBadge(getOrderStatus(order.items));
  document.getElementById("orderProgress").innerText =
    getProgressText(order.items);

  // Invoice is a direct download link — no fetch needed
  document.getElementById("invoiceBtn").href =
    `/orders/${order.orderId}/invoice`;
}

// ── Items table with per-item status + action ──
function renderItems(order) {
  const tbody = document.getElementById("orderItemsBody");
  tbody.innerHTML = "";

  order.items.forEach((item) => {
    const badges = item.variantOptions
      .map((opt) => `<span class="variant-badge">${opt}</span>`)
      .join("");

    // Action depends on item status:
    //   Pending          → Cancel (reason optional)
    //   Delivered        → Return (reason mandatory)
    //   Return Requested → waiting for admin, no action
    //   others           → no action
    let actionBtn = `<span class="no-action">—</span>`;
    if (item.status === "Pending") {
      actionBtn = `
        <button class="btn-item-cancel" onclick="openCancelModal('${item._id}')">
          Cancel
        </button>`;
    } else if (item.status === "Delivered") {
      actionBtn = `
        <button class="btn-item-return" onclick="openReturnModal('${item._id}')">
          Return
        </button>`;
    } else if (item.status === "Return Requested") {
      actionBtn = `<span class="no-action">Awaiting approval</span>`;
    }

    tbody.innerHTML += `
      <tr>
        <td data-label="Product">
          <div class="prod-cell">
            <a href="/product/${item.productId}">
              <img class="prod-img" src="${item.image}" alt="${item.productName}">
            </a>
            <div>
              <div class="prod-name">${item.productName}</div>
              <div class="d-flex gap-1 flex-wrap">${badges}</div>
            </div>
          </div>
        </td>
        <td data-label="Qty"><span class="qty-badge">×${item.quantity}</span></td>
        <td data-label="Price">
          <span class="price-val">₹${item.price.toLocaleString("en-IN")}</span>
        </td>
        <td data-label="Total">
          <span class="total-val">₹${item.itemTotal.toLocaleString("en-IN")}</span>
        </td>
        <td data-label="Status">${statusBadge(item.status)}</td>
        <td data-label="Action">${actionBtn}</td>
      </tr>
    `;
  });
}

// ── Shipping address snapshot ──
function renderAddress(addr) {
  document.getElementById("shippingAddress").innerHTML = `
    <span class="addr-type-badge">${addr.addressType}</span>
    <div class="addr-name">${addr.fullName}</div>
    <div class="addr-line">
      ${addr.addressLine1}${addr.addressLine2 ? ", " + addr.addressLine2 : ""}
    </div>
    <div class="addr-line">${addr.city}, ${addr.state} - ${addr.zip}</div>
    <div class="addr-line">${addr.country}</div>
    <div class="addr-line"><i class="bi bi-telephone me-1"></i>${addr.phone}</div>
  `;
}

// ── Timeline ──
function renderTimeline(order) {
  const overallStatus = getOrderStatus(order.items);
  const timeline = document.getElementById("orderTimeline");

  // Fully cancelled order → short timeline
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

  // Normal flow: Placed → Shipped → Delivered
  const steps = ["Order Placed", "Shipped", "Delivered"];

  // How far the order has progressed
  let progress = 0; // placed is always done
  if (
    ["Shipped", "Partially Shipped", "Partially Delivered", "Delivered", "Returned"].includes(
      overallStatus
    )
  ) {
    progress = 1;
  }
  if (["Delivered", "Returned"].includes(overallStatus)) progress = 2;

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

// ── Payment info ──
function renderPayment(order) {
  const methodNames = {
    COD: "Cash on Delivery",
    RAZORPAY: "Razorpay",
    WALLET: "Wallet",
  };
  document.getElementById("paymentMethod").innerText =
    methodNames[order.paymentMethod] || order.paymentMethod;
  document.getElementById("paymentStatus").innerHTML =
    statusBadge(order.paymentStatus);
}

// ── Cancel whole order button — only when ALL items are Pending ──
function toggleCancelOrderBtn(order) {
  const btn = document.getElementById("cancelOrderBtn");
  const allPending = order.items.every((i) => i.status === "Pending");
  btn.style.display = allPending ? "flex" : "none";
}

// ─────────────────────────────────────────────────────────────
// CANCEL — reason is OPTIONAL
// ─────────────────────────────────────────────────────────────
function openCancelModal(itemId) {
  actionItemId = itemId; // specific item
  document.getElementById("cancelModalTitle").innerText = "Cancel Item";
  document.getElementById("cancelModalText").innerText =
    "Are you sure you want to cancel this item?";
  resetCancelModal();
  new bootstrap.Modal(document.getElementById("cancelModal")).show();
}

// Cancel whole order
document.getElementById("cancelOrderBtn").addEventListener("click", () => {
  actionItemId = null; // null = whole order
  document.getElementById("cancelModalTitle").innerText = "Cancel Order";
  document.getElementById("cancelModalText").innerText =
    "Are you sure you want to cancel this entire order?";
  resetCancelModal();
  new bootstrap.Modal(document.getElementById("cancelModal")).show();
});

function resetCancelModal() {
  document.getElementById("cancelReason").value = "";
  document.getElementById("cancelComment").value = "";
}

document.getElementById("confirmCancelBtn").addEventListener("click", async () => {
  const btn = document.getElementById("confirmCancelBtn");
  btn.disabled = true;
  btn.innerText = "Cancelling...";

  // Reason optional — combine dropdown + comment if given
  const reasonSelect = document.getElementById("cancelReason").value;
  const comment = document.getElementById("cancelComment").value.trim();
  const reason = [reasonSelect, comment].filter(Boolean).join(" — ");

  try {
    const res = await fetch(`/orders/${orderId}/cancel`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ itemId: actionItemId, reason }),
    });
    const data = await res.json();

    showToast(data.message, data.status === "SUCCESS");

    if (data.status === "SUCCESS") {
      bootstrap.Modal.getInstance(
        document.getElementById("cancelModal")
      ).hide();
      loadOrder(); // re-fetch — statuses, timeline, buttons refresh without reload
    }
  } catch (err) {
    showToast("Something went wrong", false);
  } finally {
    btn.disabled = false;
    btn.innerText = "Yes, Cancel";
  }
});

// ─────────────────────────────────────────────────────────────
// RETURN — reason is MANDATORY, raises a request for admin review
// ─────────────────────────────────────────────────────────────
function openReturnModal(itemId) {
  actionItemId = itemId;
  document.getElementById("returnReason").value = "";
  document.getElementById("returnComment").value = "";
  document.getElementById("returnReasonError").innerText = "";
  new bootstrap.Modal(document.getElementById("returnModal")).show();
}

document.getElementById("confirmReturnBtn").addEventListener("click", async () => {
  const reasonSelect = document.getElementById("returnReason").value;
  const errorEl = document.getElementById("returnReasonError");

  // Mandatory validation
  if (!reasonSelect) {
    errorEl.innerText = "Please select a reason for the return";
    return;
  }
  errorEl.innerText = "";

  const comment = document.getElementById("returnComment").value.trim();
  const reason = [reasonSelect, comment].filter(Boolean).join(" — ");

  const btn = document.getElementById("confirmReturnBtn");
  btn.disabled = true;
  btn.innerText = "Submitting...";

  try {
    const res = await fetch(`/orders/${orderId}/return`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ itemId: actionItemId, reason }),
    });
    const data = await res.json();

    showToast(data.message, data.status === "SUCCESS");

    if (data.status === "SUCCESS") {
      bootstrap.Modal.getInstance(
        document.getElementById("returnModal")
      ).hide();
      loadOrder(); // re-fetch — item shows "Return Requested" without reload
    }
  } catch (err) {
    showToast("Something went wrong", false);
  } finally {
    btn.disabled = false;
    btn.innerText = "Submit Return Request";
  }
});

// Expose for inline onclick
window.openCancelModal = openCancelModal;
window.openReturnModal = openReturnModal;

// ── Init ──
document.addEventListener("DOMContentLoaded", () => {
  loadOrder();
});