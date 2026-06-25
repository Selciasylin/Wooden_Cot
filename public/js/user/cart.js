
const SHIPPING = 100;

async function loadCart() {
  const res = await fetch("/cart/data");
  const data = await res.json();

  const tbody = document.getElementById("cartBody");
  tbody.innerHTML = "";

  if (data.products.length === 0) {
    // Full width when empty — no summary needed
    document.getElementById("itemsCol").className = "col-lg-12";
    document.getElementById("cartTable").style.display = "none";
    document.getElementById("summaryCard").style.display = "none";
    document.getElementById("emptyState").style.display = "block";
    document.getElementById("itemCount").innerText = "0 items";
    return;
  }

  // Has items — 8+4 layout
  document.getElementById("itemsCol").className = "col-lg-8";
  document.getElementById("cartTable").style.display = "block";
  document.getElementById("summaryCard").style.display = "block";
  document.getElementById("emptyState").style.display = "none";


  data.products.forEach((item) => {
    const variantBadges = item.variant.options
      .map((opt) => `<span class="badge-variant">${opt}</span>`)
      .join("");

    const isMinusDisabled = item.quantity <= 1;
    const isPlusDisabled = item.quantity >= item.variant.stock;

    tbody.innerHTML += `
      <tr id="row-${item.cartItemId}">
        <td data-label="Product">
          <div class="prod-cell">
            <a href="/product/${item.productId}">
              <img class="prod-img" src="${item.image}" alt="${item.productName}">
            </a>
            <div>
              <div class="prod-name">${item.productName}</div>
              <div class="d-flex gap-1 flex-wrap mt-1">${variantBadges}</div>
            </div>
          </div>
        </td>
        <td data-label="Quantity">
          <div class="qty-ctrl">
            <button class="qty-btn" onclick="changeQty('${item.cartItemId}', 'decrement')" ${isMinusDisabled ? "disabled" : ""}>−</button>
            <input class="qty-num" id="qty-${item.cartItemId}" value="${item.quantity}" readonly>
            <button class="qty-btn" onclick="changeQty('${item.cartItemId}', 'increment')" ${isPlusDisabled ? "disabled" : ""}>+</button>
          </div>
          ${isPlusDisabled ? `<div style="font-size:10px;color:#c0392b;margin-top:4px;">Max stock reached</div>` : ""}
        </td>
        <td data-label="Price">
          <span class="price-val">₹${item.variant.price.toLocaleString("en-IN")}</span>
        </td>
        <td data-label="Total">
          <span class="total-val" id="total-${item.cartItemId}">₹${item.itemTotal.toLocaleString("en-IN")}</span>
        </td>
        <td data-label="Remove">
          <button class="btn-rm" onclick="openDeleteModal('${item.cartItemId}')">
            <i class="bi bi-trash3"></i>
          </button>
        </td>
      </tr>
    `;
  });

  document.getElementById("itemCount").innerText = `${data.totalProducts} items`;
  updateSummary(data.subtotal);
}

async function changeQty(cartItemId, action) {
  const res = await fetch("/cart/update", {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ cartItemId, action }),
  });
  const data = await res.json();

  if (data.status === "SUCCESS") {
    document.getElementById(`qty-${cartItemId}`).value = data.newQuantity;
    document.getElementById(`total-${cartItemId}`).innerText = `₹${data.itemTotal.toLocaleString("en-IN")}`;
    updateSummary(data.subtotal);
    loadCart(); // reload to refresh disabled states on buttons
  } else {
    showToast(data.message, false);
  }
}

function updateSummary(subtotal) {
  const discount = 0;
  const shipping = SHIPPING;
  const total = subtotal - discount + shipping;

  document.getElementById("summarySubtotal").innerText = `₹${subtotal.toLocaleString("en-IN")}`;
  document.getElementById("summaryDiscount").innerText = "-₹0";
  document.getElementById("summaryShipping").innerText = `₹${shipping.toLocaleString("en-IN")}`;
  document.getElementById("summaryCoupon").innerText = "-₹0";
  document.getElementById("summaryTotal").innerText = `₹${total.toLocaleString("en-IN")}`;
}

let deleteCartItemId = null;

function openDeleteModal(id) {
  deleteCartItemId = id;
  new bootstrap.Modal(document.getElementById("deleteModal")).show();
}

document.getElementById("confirmDelete").addEventListener("click", async () => {
  const res = await fetch(`/cart/remove/${deleteCartItemId}`, { method: "DELETE" });
  const data = await res.json();

  showToast(data.message, data.status === "SUCCESS");

  if (data.status === "SUCCESS") {
    loadCart();
    bootstrap.Modal.getInstance(document.getElementById("deleteModal")).hide();
  }
});

document.addEventListener("DOMContentLoaded", () => {
  loadCart();
});