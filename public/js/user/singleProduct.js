
let variantData = [];
let selectedOptions = [];
// 🔥 LOAD DATA
document.addEventListener("DOMContentLoaded", async () => {
    const res = await fetch(`/product/variant/${productId}`);
    const data = await res.json();
    
    console.log("API:", data);
    
    if (data.success) {
        variantData = data.variants;
        console.log(variantData);
        // ✅ Show initial stock and price (first variant)
        if (variantData && variantData.length > 0) {
            document.getElementById("price").innerText = `₹${variantData[0].price}`;
            const stockStatus = document.getElementById("stockStatus");
            if (variantData[0].quantity > 0) {
                stockStatus.innerHTML = `
                    <i class="bi bi-check-circle me-1"></i>
                    In Stock (${variantData[0].quantity} left)
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
      }
});

function selectOption(button){
   if(button.disabled) return;
   const optionId = button.dataset.option;
   const variantType = button.dataset.type;
   selectedOptions = selectedOptions.filter(
      item => item.type !== variantType
   );
   selectedOptions.push({
      type: variantType,
      optionId
   });
   highlightOptions();
   updatePrice();
}

function highlightOptions() {
    document.querySelectorAll(".variant-option").forEach(btn => {
        // Remove all classes first
        btn.classList.remove("btn-custom", "active", "btn-outline-secondary");
        const exists = selectedOptions.find(
            item => item.optionId === btn.dataset.option
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
    const selectedIds =
    selectedOptions.map(item =>
        item.optionId.toString()
    );
    // DEFAULT FIRST VARIANT
    if (selectedIds.length === 0) {
      matchedVariant = variantData[0];
    } else {
        matchedVariant =
        variantData.find(variant => {
            // HANDLE BOTH OBJECTS & IDS
            const variantOptionIds =
            variant.options.map(option => {
                // populated object
                if (typeof option === "object") {
                    return option._id.toString();
                }
                // direct ObjectId/string
                return option.toString();
            });
            // EXACT MATCH
            return (
                variantOptionIds.length ===
                selectedIds.length &&
                selectedIds.every(id =>
                    variantOptionIds.includes(id)
                )
            );
        });
    }
    if (!matchedVariant) return;
    // PRICE
    document.getElementById("price").innerText =
    `₹${matchedVariant.price}`;
    // STOCK
    const stockStatus =
    document.getElementById("stockStatus");
    if (matchedVariant.quantity > 0) {
        stockStatus.innerHTML = `
            <i class="bi bi-check-circle me-1"></i>
            In Stock (${matchedVariant.quantity} left)
        `;
        stockStatus.className =
        "badge bg-success px-3 py-2";
    } else {
        stockStatus.innerHTML = `
            <i class="bi bi-x-circle me-1"></i>
            Out Of Stock
        `;
        stockStatus.className =
        "badge bg-danger px-3 py-2";
    }
}