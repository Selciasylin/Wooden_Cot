let currentPage = 1;

async function loadWishlist(page = 1, search = "") {
  const res = await fetch(`/wishlist/data?page=${page}&search=${search}`);
  const data = await res.json();
  console.log(data.products);

  const tbody = document.getElementById("wishlistBody");
  tbody.innerHTML = "";

  if (data.products.length === 0) {
    document.getElementById("wishlistTable").style.display = "none";
    document.getElementById("emptyState").style.display = "flex";
    document.getElementById("wlFooter").style.display = "none";

    document.getElementById("emptyState").innerHTML = `
            <i class="bi bi-heart"></i>
            <p>Your wishlist is empty</p>
            <a href="/shop" class="btn btn-custom mt-3">Continue Shopping</a>
        `;

    return;
  }

  document.getElementById("wishlistTable").style.display = "table";
  document.getElementById("emptyState").style.display = "none";
  document.getElementById("wlFooter").style.display = "flex";

  data.products.forEach((item) => {
    console.log(item.variant);

   const variantValues = item.variant
    ? item.variant.options.map(option =>
    `<span class="variant-badge">${option}</span>`
    ).join("")
    : "";

    const outOfStock = item.variant && item.variant.quantity <= 0;
    console.log(item.variant?.price);
    tbody.innerHTML += `
            <tr>
                <td>
                    <div class="prod-cell">
                        <a href="/product/${item.productId}">
                            <img src="${item.image}" class="prod-img">
                        </a>

                        <div>
                            <div class="prod-name">${item.productName}</div>
                            <div class="prod-variants">${variantValues}</div>
                        </div>
                    </div>
                </td>

                <td>
                    <span class="price-val">₹${item.variant ? item.variant.price : ""}</span>
                </td>

                <td>
                    ${
                      outOfStock
                        ? `<button class="btn-cart" disabled>Out Of Stock</button>`
                        : `<button class="btn-cart" onclick="moveToCart('${item.wishlistItemId}')"><i class="bi bi-cart-plus"></i> Add To Cart</button>`
                    }
                </td>

                <td>
                    <button class="btn-remove" onclick="openDeleteModal('${item.wishlistItemId}')">
                        <i class="bi bi-trash"></i>
                    </button>
                </td>
            </tr>
        `;
  });

  renderPagination(data.totalPages, page);

  document.getElementById("itemCount").innerText =
    `${data.totalProducts} items`;

  document.getElementById("pgInfo").innerText =
    `Showing ${data.startIndex} - ${data.endIndex} of ${data.totalProducts} entries`;
}
//deleteWishlist
let deleteWishlistId = null;

function openDeleteModal(id) {
  deleteWishlistId = id;
  new bootstrap.Modal(document.getElementById("deleteModal")).show();
}
document.getElementById("confirmDelete").addEventListener("click", async () => {
  const res = await fetch(`/wishlist/delete/${deleteWishlistId}`, {
    method: "DELETE",
  });

  const data = await res.json();

  showToast(data.message, data.success);

  if (data.status === "SUCCESS") {
    loadWishlist(currentPage);

    bootstrap.Modal.getInstance(document.getElementById("deleteModal")).hide();
  }
});

async function moveToCart(id) {
  const res = await fetch(`/wishlist/moveToCart/${id}`, {
    method: "POST",
  });
  const data = await res.json();
  showToast(data.message, data.success);
  if (data.status === "SUCCESS") {
    loadWishlist(currentPage);
  }
}

function renderPagination(totalPages, page) {
  currentPage = page;

  const pagination = document.querySelector(".pagination");

  pagination.innerHTML = "";

  pagination.innerHTML += `
        <li class="page-item ${page === 1 ? "disabled" : ""}">
            <button
                class="page-link"
                onclick="loadWishlist(${page - 1})">
                Prev
            </button>
        </li>
    `;

  for (let i = 1; i <= totalPages; i++) {
    pagination.innerHTML += `
            <li class="page-item ${page === i ? "active" : ""}">
                <button
                    class="page-link"
                    onclick="loadWishlist(${i})">
                    ${i}
                </button>
            </li>
        `;
  }

  pagination.innerHTML += `
        <li class="page-item ${page === totalPages ? "disabled" : ""}">
            <button
                class="page-link"
                onclick="loadWishlist(${page + 1})">
                Next
            </button>
        </li>
    `;
}

document.getElementById("searchInput").addEventListener("input", (e) => {
  loadWishlist(1, e.target.value);
});

document.addEventListener("DOMContentLoaded", () => {
  loadWishlist();
});
