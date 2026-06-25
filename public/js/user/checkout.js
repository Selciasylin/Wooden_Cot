const SHIPPING = 100;
let deleteAddressId = null;
let selectedAddressId = null;
let checkoutData = null;
let currentEditingAddress = null;
// ─── Load Checkout ───────────────────────────────────────────────────────────
async function loadCheckout() {
  const res = await fetch("/checkout/data");
  const data = await res.json();

  if (data.status !== "SUCCESS") {
    showToast("Failed to load checkout data", false);
    return;
  }

  checkoutData = data;
  renderAddresses(data.addresses);
  renderOrderItems(data.products);
  updateSummary(data.subtotal);
}

// ─── Render Address Cards ────────────────────────────────────────────────────
function renderAddresses(addresses) {
  const container = document.getElementById("addressContainer");
  container.innerHTML = "";

  if (addresses.length === 0) {
    container.innerHTML = `
      <div class="text-muted" style="font-size:13px;padding:10px 0;">
        No saved addresses. Add one below.
      </div>`;
    return;
  }

  addresses.forEach((addr) => {
    const isSelected = addr.isDefault && !selectedAddressId;
    if (isSelected) selectedAddressId = addr._id;

    const card = document.createElement("div");
    card.className = `addr-card ${isSelected ? "selected" : ""}`;
    card.id = `addr-${addr._id}`;
    card.onclick = () => selectAddress(addr._id);

    card.innerHTML = `
  <div class="addr-dot">
    <i class="bi bi-check"></i>
  </div>

  <div class="addr-type">${addr.addressType}</div>

  <div class="addr-name">${addr.fullName}</div>

  <div class="addr-line">
    ${addr.addressLine1}
    ${addr.addressLine2 ? ", " + addr.addressLine2 : ""}
  </div>

  <div class="addr-line">
    ${addr.city}, ${addr.state} - ${addr.zip}
  </div>

  <div class="addr-line">
    ${addr.phone}
  </div>

  <div class="mt-2 d-flex gap-2">
    <button
      class="btn btn-sm btn-outline-primary"
      onclick="event.stopPropagation(); editAddress('${addr._id}')">
      Edit
    </button>

    <button
      class="btn btn-sm btn-outline-danger"
      onclick="event.stopPropagation(); openDeleteModal('${addr._id}')">
      Delete
    </button>
  </div>
`;

    container.appendChild(card);
  });
}
function openDeleteModal(id){

  deleteAddressId = id;

  new bootstrap.Modal(
    document.getElementById(
      "deleteAddressModal"
    )
  ).show();
}

async function editAddress(id) {
  const address = checkoutData.addresses.find((a) => a._id === id);

  if (!address) return;

  document.getElementById("fullName").value = address.fullName;

  document.getElementById("phone").value = address.phone;

  document.getElementById("addressLine1").value = address.addressLine1;

  document.getElementById("addressLine2").value = address.addressLine2 || "";

  document.getElementById("city").value = address.city;

  document.getElementById("state").value = address.state;

  document.getElementById("zip").value = address.zip;

  document.getElementById("addressType").value = address.addressType;

  document.getElementById("isDefault").checked = address.isDefault;

  currentEditingAddress = id;

  new bootstrap.Modal(document.getElementById("addAddressModal")).show();
}

document
.getElementById("confirmDeleteBtn")
.addEventListener(
"click",
async () => {

  const res =
  await fetch(
  `/address/delete/${deleteAddressId}`,
  {
     method:"DELETE"
  });

  const data =
  await res.json();

  if(data.status==="SUCCESS"){

     bootstrap.Modal
     .getInstance(
       document.getElementById(
       "deleteAddressModal"
       )
     ).hide();

     showToast(
       "Address deleted",
       true
     );

     loadCheckout();

  }else{

     showToast(
       data.message,
       false
     );

  }

});

function selectAddress(id) {
  selectedAddressId = id;
  document
    .querySelectorAll(".addr-card")
    .forEach((c) => c.classList.remove("selected"));
  const card = document.getElementById(`addr-${id}`);
  if (card) card.classList.add("selected");
}

// ─── Render Order Items (read-only summary) ──────────────────────────────────
function renderOrderItems(products) {
  const tbody = document.getElementById("checkoutBody");
  tbody.innerHTML = "";

  products.forEach((item) => {
    const badges = item.variant.options
      .map((opt) => `<span class="badge-variant">${opt}</span>`)
      .join("");

    tbody.innerHTML += `
      <tr>
        <td data-label="Product">
          <div class="prod-cell">
            <img class="prod-img" src="${item.image}" alt="${item.productName}">
            <div>
              <div class="prod-name">${item.productName}</div>
              <div class="d-flex gap-1 flex-wrap mt-1">${badges}</div>
            </div>
          </div>
        </td>
        <td data-label="Qty"><span class="qty-badge">×${item.quantity}</span></td>
        <td data-label="Price"><span class="price-val">₹${item.variant.price.toLocaleString("en-IN")}</span></td>
        <td data-label="Total"><span class="total-val">₹${item.itemTotal.toLocaleString("en-IN")}</span></td>
      </tr>`;
  });
}

// ─── Update Summary ──────────────────────────────────────────────────────────
function updateSummary(subtotal) {
  const shipping = SHIPPING;
  const total = subtotal + shipping;

  document.getElementById("summarySubtotal").innerText =
    `₹${subtotal.toLocaleString("en-IN")}`;
  document.getElementById("summaryShipping").innerText =
    `₹${shipping.toLocaleString("en-IN")}`;
  document.getElementById("summaryDiscount").innerText = "-₹0";
  document.getElementById("summaryTotal").innerText =
    `₹${total.toLocaleString("en-IN")}`;
}

// ─── Add Address (from checkout modal) ──────────────────────────────────────
function validateAddressForm() {
  const fields = [
    "fullName",
    "phone",
    "addressLine1",
    "city",
    "state",
    "zip",
    "addressType",
  ];
  let valid = true;

  fields.forEach((id) => {
    const el = document.getElementById(id);
    if (!el) return;
    const errEl = document.getElementById(`${id}Error`);
    if (!el.value.trim()) {
      if (errEl) errEl.innerText = "This field is required";
      el.classList.add("is-invalid");
      valid = false;
    } else {
      if (errEl) errEl.innerText = "";
      el.classList.remove("is-invalid");
    }
  });

  // Phone validation
  const phoneEl = document.getElementById("phone");
  if (phoneEl && !/^[0-9]{10}$/.test(phoneEl.value.trim())) {
    document.getElementById("phoneError").innerText =
      "Enter a valid 10-digit phone number";
    phoneEl.classList.add("is-invalid");
    valid = false;
  }

  // ZIP validation
  const zipEl = document.getElementById("zip");
  if (zipEl && !/^[0-9]{6}$/.test(zipEl.value.trim())) {
    document.getElementById("zipError").innerText =
      "Enter a valid 6-digit pincode";
    zipEl.classList.add("is-invalid");
    valid = false;
  }

  return valid;
}

document
  .getElementById("saveAddressBtn")
  .addEventListener("click", async () => {
    if (!validateAddressForm()) return;

    const payload = {
      fullName: document.getElementById("fullName").value.trim(),
      phone: document.getElementById("phone").value.trim(),
      addressLine1: document.getElementById("addressLine1").value.trim(),
      addressLine2: document.getElementById("addressLine2")?.value.trim() || "",
      city: document.getElementById("city").value.trim(),
      state: document.getElementById("state").value.trim(),
      zip: document.getElementById("zip").value.trim(),
      country: "India",
      addressType: document.getElementById("addressType").value,
      isDefault: document.getElementById("isDefault")?.checked || false,
    };

    let url = "/checkout/address";
    let method = "POST";

    if (currentEditingAddress) {
      url = `/address/edit/${currentEditingAddress}`;
      method = "PUT";
    }

    const res = await fetch(url, {
      method,
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });
    const data = await res.json();

    if (data.status === "SUCCESS") {
      const isEdit = !!currentEditingAddress;

      currentEditingAddress = null;

      showToast(
        isEdit ? "Address updated successfully" : "Address added successfully",
        true,
      );
      bootstrap.Modal.getInstance(
        document.getElementById("addAddressModal"),
      ).hide();
      document.getElementById("addAddressForm").reset();
      await loadCheckout(); // reload to show new address
    } else {
      showToast(data.message, false);
    }
  });

// ─── Payment Method Selection ────────────────────────────────────────────────
let selectedPayment = "COD"; // default

document.querySelectorAll(".pay-item").forEach((item) => {
  item.addEventListener("click", () => {
    document
      .querySelectorAll(".pay-item")
      .forEach((i) => i.classList.remove("selected"));
    item.classList.add("selected");
    const payment = item.dataset.payment;

if (payment !== "COD") {
  showToast(
    "Coming Soon",
    false
  );
  return;
}

selectedPayment = payment;
  });
});

//place order modal
document
  .getElementById("openConfirmBtn")
  .addEventListener("click", () => {

    if (!selectedAddressId) {
      showToast(
        "Please select an address",
        false
      );
      return;
    }

    new bootstrap.Modal(
      document.getElementById(
        "thankYouModal"
      )
    ).show();

});
// ─── Init ────────────────────────────────────────────────────────────────────
document.addEventListener("DOMContentLoaded", () => {
  // Auto-select COD payment visually
  const codItem = document.querySelector('.pay-item[data-payment="COD"]');
  if (codItem) codItem.classList.add("selected");

  loadCheckout();
});
