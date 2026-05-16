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

function renderProducts(products) {
  const container = document.getElementById("productsContainer");
  container.innerHTML = "";
  if (products.length === 0) {
    container.innerHTML = `
      <div class="text-center py-5">
        <h4>No Products Found</h4>
      </div>
    `;
    return;
  }

  products.forEach((product) => {
    const lowestPrice = product.variants?.length
      ? Math.min(...product.variants.map((variant) => variant.price))
      : 0;
    container.innerHTML += `
      <div class="col-lg-4 col-md-6 col-6">
        <div class="product-card">
          <div class="card-img-wrap">
            <img src="${product.images[0]}" alt="Product">
            <div class="card-actions">
              <a class="card-action-btn" href="#">
                <i class="bi bi-heart"></i>
              </a>
              <a class="card-action-btn"
                href="/product/${product._id}">
                <i class="bi bi-eye"></i>
              </a>
            </div>
          </div>
          <div class="card-body">
            <div class="product-name">
              ${product.name}
            </div>
            <div class="price-row">
              <span class="text-success fw-bold fs-3">
                ₹${lowestPrice || "N/A"}
              </span>
            </div>
            <button class="btn-add-cart">
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
            Previous
         </a>
      </li>

      <li class="page-item disabled">
         <span class="page-link">
            Page ${currentPage} of ${totalPages}
         </span>
      </li>

      <li class="page-item ${currentPage === totalPages ? "disabled" : ""}">
         <a class="page-link" href="#" onclick="loadProducts(${currentPage + 1})">
            Next
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