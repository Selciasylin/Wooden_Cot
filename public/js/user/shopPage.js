async function loadProducts(page = 1) {
  const search = document.getElementById("searchInput")?.value || "";
  const material = document.querySelector(".material-filter:checked")?.value || "";
  const selectedOptions = [...document.querySelectorAll(".variant-filter:checked"),].map((input) => input.value);
  const price = document.querySelector(".price-filter:checked")?.value || "";
  const sort = document.getElementById("sortSelect")?.value || "";
  const queryParams = new URLSearchParams({
    page,
    search,
    material,
    price,
    sort,
  });

  selectedOptions.forEach((option) => {
    queryParams.append("options", option);
  });

  const res = await fetch(`/shop/products?${queryParams.toString()}`);
  const data = await res.json();
  renderProducts(data.products);
  renderPagination(data.totalPages, data.currentPage);
  renderPaginationInfo(data);
}

// Track which productIds map to their default variantId after first add
// so we can color the heart immediately without a reload
const productDefaultVariantMap = {};

function renderProducts(products) {
  const container = document.getElementById("productsContainer");
  container.innerHTML = "";

  if (products.length === 0) {
    container.innerHTML = `<div class="text-center py-5"><h4>No Products Found</h4></div>`;
    return;
  }

  products.forEach((product) => {
    const lowestVariant = product.variants?.length
      ? product.variants.reduce((lowest, current) =>
          current.price < lowest.price ? current : lowest
        )
      : null;
      // Replace the allOptionLabels block with this:
      const pillsHTML = lowestVariant?.resolvedOptions
    ?.map(label =>
      `<span style="font-size:11px;padding:2px 8px;border-radius:20px;background:#f5ede0;border:1px solid #e8e0d5;color:#888;white-space:nowrap;">${label}</span>`
    ).join('') || '';

    const lowestPrice = lowestVariant ? lowestVariant.price : 0;
    const defaultVariantId = lowestVariant?._id?.toString();

    // store mapping so addToWishlist can look it up
    if (defaultVariantId) {
      productDefaultVariantMap[product._id] = defaultVariantId;
    }

    // check if already wishlisted
    const isWishlisted = defaultVariantId && wishlistedVariantIds.includes(defaultVariantId);
    const heartClass = isWishlisted ? "bi-heart-fill text-danger" : "bi-heart";

    container.innerHTML += `
      <div class="col-lg-4 col-md-6 col-6">
        <div class="product-card">
          <div class="card-img-wrap">
            <img src="${product.images[0]}" alt="Product">
            <div class="card-actions">
              <button 
                type="button" 
                class="card-action-btn" 
                id="wishlistBtn-${product._id}"
                onclick="addToWishlist('${product._id}')">
                <i class="bi ${heartClass}" id="wishlistIcon-${product._id}"></i>
              </button>
              <a class="card-action-btn" href="/product/${product._id}">
                <i class="bi bi-eye"></i>
              </a> 
            </div>
          </div>
          <div class="card-body">
            <div class="product-name">${product.name}</div>
            <div style="display:flex;flex-wrap:wrap;gap:5px;margin:6px 0 8px;">${pillsHTML}</div> 
            <div class="price-row">
              <span class="text-success fw-bold fs-3">₹${lowestPrice || "N/A"}</span>
            </div>
           <button class="btn-add-cart" onclick="addToCart('${product._id}')">
              <i class="bi bi-cart-plus me-1"></i>
              Add to Cart
          </button>
          </div>
        </div>
      </div>
    `;
  });
}



function renderPagination(totalPages, currentPage) {

   const pagination = document.getElementById("pagination");

   pagination.innerHTML = `
      <li class="page-item ${currentPage === 1 ? "disabled" : ""}">
         <a class="page-link" href="#" onclick="loadProducts(${currentPage - 1})">
            <
         </a>
      </li>

      <li class="page-item disabled">
         <span class="page-link">
            Page ${currentPage} of ${totalPages}
         </span>
      </li>

      <li class="page-item ${currentPage === totalPages ? "disabled" : ""}">
         <a class="page-link" href="#" onclick="loadProducts(${currentPage + 1})">
            >
         </a>
      </li>
   `;
}
// SEARCH
document.getElementById("searchInput").addEventListener("input", () => {
  loadProducts(1);
});

// SORT
document.getElementById("sortSelect").addEventListener("change", () => {
  loadProducts(1);
});

// FILTERS
document
  .querySelectorAll(".material-filter, .variant-filter, .price-filter")
  .forEach((filter) => {
    filter.addEventListener("change", () => {
      loadProducts(1);
    });
  });

// INITIAL LOAD
window.addEventListener("DOMContentLoaded", () => {
  loadProducts();
});

document.getElementById("clearSearch").addEventListener("click", () => {
  document.getElementById("searchInput").value = "";
  loadProducts(1);
});

document.getElementById("clearFilters").addEventListener("click", () => {
  document
    .querySelectorAll(".material-filter, .variant-filter, .price-filter")
    .forEach((filter) => {
      filter.checked = false;
    });
  document.getElementById("sortSelect").value = "";
  loadProducts(1);
});

function renderPaginationInfo(data){
   const info = document.getElementById("paginationInfo");
   info.innerHTML = `
      Showing ${data.startIndex} - ${data.endIndex} of ${data.totalProducts}products`;
}

//addToWishlist
async function addToWishlist(productId) {
  const res = await fetch("/wishlist/add", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ productId, variantId: null }),
  });

  const data = await res.json();
  showToast(data.message);   // always shows — success or "already in wishlist"

  if (data.success) {
    // color the heart and track it
    const icon = document.getElementById(`wishlistIcon-${productId}`);
    if (icon) {
      icon.classList.remove("bi-heart");
      icon.classList.add("bi-heart-fill", "text-danger");
    }
    if (data.variantId) {
      wishlistedVariantIds.push(data.variantId.toString());
    }
  }
}

//addToCart

async function addToCart(productId) {

    const variantId = productDefaultVariantMap[productId];

    const res = await fetch("/cart/add", {
        method: "POST",
        headers: {
            "Content-Type": "application/json",
        },
        body: JSON.stringify({
            productId,
            variantId,
        }),
    });

    const data = await res.json();

    showToast(data.message);

}