let variantData = [];
let selectedOptions = [];
// 🔥 LOAD DATA
document.addEventListener("DOMContentLoaded", async () => {
  const res = await fetch(`/product/variant/${productId}`);
  const data = await res.json();
  if (data.success) {
    variantData = data.variants;

    if (variantData.length > 0) {
      const lowestVariant = variantData.reduce((lowest, current) => {
        return current.price < lowest.price ? current : lowest;
      });
      selectedOptions = [];

      lowestVariant.options.forEach((optionId) => {
        const btn = document.querySelector(`[data-option="${optionId}"]`);
        if (btn) {
          selectedOptions.push({
            type: btn.dataset.type,
            optionId: optionId.toString(),
          });
        }
      });
      highlightOptions();
      updatePrice();
      updateAvailableOptions();
      updateWishlistButton();
    }
  }
});

function selectOption(button) {
  if (button.disabled) return;

  const optionId = button.dataset.option;
  const variantType = button.dataset.type;

  if (variantType === "Size") {
    selectedOptions = selectedOptions.filter(
      (item) => item.type !== "Size" && item.type !== "Storage",
    );
  }

  if (variantType === "Storage") {
    selectedOptions = selectedOptions.filter((item) => item.type !== "Storage");
  }

  selectedOptions.push({
    type: variantType,
    optionId,
  });

  highlightOptions();
  updateAvailableOptions();
  updatePrice();
  updateWishlistButton();
}

function highlightOptions() {
  document.querySelectorAll(".variant-option").forEach((btn) => {
    // Remove all classes first
    btn.classList.remove("btn-custom", "active", "btn-outline-secondary");
    const exists = selectedOptions.find(
      (item) => item.optionId === btn.dataset.option,
    );
    if (exists) {
      // Active state - use btn-custom
      btn.classList.add("btn-custom", "active");
    } else {
      // Inactive state - use outline
      btn.classList.add("btn-outline-secondary");
    }
  });
}

function updatePrice() {
  let matchedVariant = null;
  // selected option ids
  const selectedIds = selectedOptions.map((item) => item.optionId.toString());
  // DEFAULT FIRST VARIANT
  if (selectedIds.length === 0) {
    matchedVariant = variantData[0];
  } else {
    matchedVariant = variantData.find((variant) => {
      // HANDLE BOTH OBJECTS & IDS
      const variantOptionIds = variant.options.map((option) => {
        // populated object
        if (typeof option === "object") {
          return option._id.toString();
        }
        // direct ObjectId/string
        return option.toString();
      });
      // EXACT MATCH
      return (
        variantOptionIds.length === selectedIds.length &&
        selectedIds.every((id) => variantOptionIds.includes(id))
      );
    });
  }
  if (!matchedVariant) return;
  // PRICE
  document.getElementById("price").innerText = `₹${matchedVariant.price}`;
  // STOCK
  const stockStatus = document.getElementById("stockStatus");
  if (matchedVariant.quantity > 0) {
    stockStatus.innerHTML = `
            <i class="bi bi-check-circle me-1"></i>
            In Stock (${matchedVariant.quantity} left)
        `;
    stockStatus.className = "badge bg-success px-3 py-2";
  } else {
    stockStatus.innerHTML = `
            <i class="bi bi-x-circle me-1"></i>
            Out Of Stock
        `;
    stockStatus.className = "badge bg-danger px-3 py-2";
  }
}

function updateAvailableOptions() {
  document.querySelectorAll(".variant-option").forEach((btn) => {
    const optionType = btn.dataset.type;

    if (optionType === "Size") {
      btn.disabled = false;
      return;
    }
    const optionId = btn.dataset.option;

    const otherSelections = selectedOptions
      .filter((item) => item.type !== optionType)
      .map((item) => item.optionId);

    const isAvailable = variantData.some((variant) => {
      const variantOptionIds = variant.options.map((id) => id.toString());

      return (
        otherSelections.every((id) => variantOptionIds.includes(id)) &&
        variantOptionIds.includes(optionId)
      );
    });
    btn.disabled = !isAvailable;
  });
}

//addToWishlist
async function addToWishlist() {
  const selectedIds = selectedOptions.map((item) => item.optionId);

  const matchedVariant = variantData.find((variant) => {
    const variantIds = variant.options.map((option) =>
      typeof option === "object" ? option._id.toString() : option.toString()
    );
    return (
      variantIds.length === selectedIds.length &&
      selectedIds.every((id) => variantIds.includes(id))
    );
  });

  if (!matchedVariant) return;

  const res = await fetch("/wishlist/add", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ productId, variantId: matchedVariant._id }),
  });

  const data = await res.json();
  showToast(data.message);  // always show toast, success or error

  if (data.success) {
    wishlistVariantIds.push(data.variantId.toString()); // use the variantId the server confirmed
    updateWishlistButton();
  }
}
function updateWishlistButton() {
    
    const selectedIds = selectedOptions.map(item => item.optionId);

    const matchedVariant = variantData.find(variant => {
        const variantIds = variant.options.map(option =>
            typeof option === "object" ? option._id.toString() : option.toString()
        );

        return variantIds.length === selectedIds.length &&
               selectedIds.every(id => variantIds.includes(id));
    });

    if (!matchedVariant) return;

    const btn = document.getElementById("wishlistBtn");
    const isWishlisted = wishlistVariantIds.includes(matchedVariant._id.toString());

    btn.classList.toggle("btn-danger", isWishlisted);
    btn.classList.toggle("btn-outline-danger", !isWishlisted);

}

//addToCart

async function addToCart() {
    const selectedIds = selectedOptions.map(item => item.optionId);
    const matchedVariant = variantData.find((variant) => {
        const variantIds = variant.options.map(option =>
            typeof option === "object"
                ? option._id.toString()
                : option.toString()
        );
        return (
            variantIds.length === selectedIds.length &&
            selectedIds.every(id => variantIds.includes(id))
        );
    });

    if (!matchedVariant) {
        showToast("Please select a variant");
        return;
    }

    const res = await fetch("/cart/add", {
        method: "POST",
        headers: {
            "Content-Type": "application/json",
        },
        body: JSON.stringify({
            productId,
            variantId: matchedVariant._id,
        }),
    });
    const data = await res.json();
    showToast(data.message);

}