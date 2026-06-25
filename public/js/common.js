function showToast(message){

    const container =
    document.querySelector(".toast-container");

    if(!container) return;

    const toast = document.createElement("div");

    toast.className =
    "toast custom-toast show";

    toast.innerHTML = `
        <div class="d-flex justify-content-between align-items-center">
            <div class="toast-body">
                ${message}
            </div>
            <button
                type="button"
                class="btn-close"
                onclick="this.closest('.toast').remove()">
            </button>
        </div>
    `;

    container.appendChild(toast);

    setTimeout(() => {
        toast.remove();
    },2500);

}