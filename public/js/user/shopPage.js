
async function loadProducts(page = 1) {

  const search =
    document.getElementById("searchInput")?.value || "";

  const material =
    document.querySelector(".material-filter:checked")?.value || "";

  const size =
    document.querySelector(".size-filter:checked")?.value || "";

  const storage =
    document.querySelector(".storage-filter:checked")?.value || "";

  const price =
    document.querySelector(".price-filter:checked")?.value || "";

  const sort =
    document.getElementById("sortSelect")?.value || "";

  const res = await fetch(
    `/shop/products?page=${page}&search=${search}&material=${material}&size=${size}&storage=${storage}&price=${price}&sort=${sort}`
  );

  const data = await res.json();

  renderProducts(data.products);

  renderPagination(data.totalPages, data.currentPage);

}

function renderProducts(products) {

  const container =
    document.getElementById("productsContainer");

  container.innerHTML = "";

  if (products.length === 0) {

    container.innerHTML = `
      <div class="text-center py-5">
        <h4>No Products Found</h4>
      </div>
    `;

    return;
  }

  products.forEach(product => {

    const defaultSize = product.sizes[0];

    const variant =
      defaultSize?.variants?.withDrawer ||
      defaultSize?.variants?.withoutDrawer;

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
                ₹${variant?.price || "N/A"}
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

  const pagination =
    document.getElementById("pagination");

  pagination.innerHTML = "";

  for (let i = 1; i <= totalPages; i++) {

    pagination.innerHTML += `

      <li class="page-item ${i === currentPage ? "active" : ""}">

        <a class="page-link"
          href="#"
          onclick="loadProducts(${i})">

          ${i}

        </a>

      </li>
    `;
  }

}

// SEARCH
document
  .getElementById("searchInput")
  .addEventListener("input", () => {

    loadProducts(1);

  });

// SORT
document
  .getElementById("sortSelect")
  .addEventListener("change", () => {

    loadProducts(1);

  });

// FILTERS
document.querySelectorAll(".material-filter, .size-filter, .storage-filter, .price-filter")
.forEach(filter => {
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

  document
  .getElementById("clearFilters")
  .addEventListener("click", () => {

    document
      .querySelectorAll(
        ".material-filter, .size-filter, .storage-filter, .price-filter"
      )
      .forEach(filter => {

        filter.checked = false;

      });

    document.getElementById("sortSelect").value = "";

    loadProducts(1);

  });