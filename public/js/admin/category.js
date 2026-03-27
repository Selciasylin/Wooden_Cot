
        function showError(input, message){
            const error = input.parentElement.querySelector(".error-message")
            if(error){
                error.textContent = message
            }
        }

        function clearErrors(){
            document.querySelectorAll(".error-message")
            .forEach(el => el.textContent = "")
        }

        function showMessage(type, text){
            const alertBox = document.getElementById("alertBox")
            alertBox.innerHTML = `
                <div class="alert ${type === "success" ? "alert-success" : "alert-danger"} text-center">
                    ${text}
                </div>
            `
            setTimeout(()=>{
                alertBox.innerHTML=""
            },2000)
        }
        function validateCategoryForm(){
            clearErrors()
            let valid = true
            const name = document.getElementById("addCategoryName")
            const description = document.getElementById("addCategoryDescription")
            const image = document.getElementById("addCategoryImage")

            if(!name.value.trim()){
                showError(name,"Category name is required")
                valid=false
            }

            if(!description.value.trim()){
                showError(description,"Description is required")
                valid=false
            }

            if(!image.files.length){
                showError(image,"Category image is required")
                valid=false
            }

            return valid
        }
        async function submitAddCategory() {
            if(!validateCategoryForm()) return
            const formData = new FormData();
            formData.append("name", document.getElementById("addCategoryName").value);
            formData.append("description", document.getElementById("addCategoryDescription").value);
            formData.append("image", document.getElementById("addCategoryImage").files[0]);
            try{
            const res = await fetch("/admin/categories", {
                method: "POST",
                body: formData
            });
            const data = await res.json();
            if (data.status === "SUCCESS") {
               showMessage("success", data.message)
                setTimeout(()=>{location.reload()},1500)
            } else{
            showMessage("error", data.message)
        }
        }catch(err){
            console.error(err)
            showMessage("error","Server error")
        }
    }
        let editingId = null;
        function editCategory(id, name, description, image) {
            editingId = id;
            document.getElementById("editCategoryName").value = name;
            document.getElementById("editCategoryDescription").value = description;
            document.getElementById("currentCategoryImage").src = image;
        }
        function validateEditCategory(){
            clearErrors()
            let valid=true
            const name=document.getElementById("editCategoryName")
            const description=document.getElementById("editCategoryDescription")

            if(!name.value.trim()){
                showError(name,"Category name required")
                valid=false
            }

            if(!description.value.trim()){
                showError(description,"Description required")
                valid=false
            }

            return valid
        }
        async function submitEditCategory() {
            if(!validateEditCategory()) return
            const formData = new FormData();
            formData.append("name", document.getElementById("editCategoryName").value);
            formData.append("description", document.getElementById("editCategoryDescription").value);
            const file = document.getElementById("editCategoryImage").files[0];
            if (file) formData.append("image", file);
            try{
            const res = await fetch(`/admin/categories/${editingId}`, {
                method: "PUT",
                body: formData
            });
            const data = await res.json();
            if (data.status === "SUCCESS") {
                showMessage("success", data.message)
                setTimeout(()=>{
                    location.reload()
                },1500)
            } else{
            showMessage("error", data.message)
        }
        }catch(err){
            console.error(err)
            showMessage("error","Server error")
        }
    }
        async function toggleList(id) {
            try{
            const res = await fetch(`/admin/categories/toggle/${id}`, {
                method: "PATCH"
            });
            const data = await res.json();
            if (data.status === "SUCCESS") {
                showMessage("success", data.message)
                setTimeout(()=>{
                    location.reload()
                },1000)
            }else{
                showMessage("error", data.message)
            }
        }catch(err){
            console.error(err)
            showMessage("error","Server error")

        }
    }
    async function loadCategories(page = 1) {
    const search = document.getElementById("searchCategory").value;
    const res = await fetch(`/admin/categoriesData?search=${encodeURIComponent(search)}&page=${page}`);
    const data = await res.json();
    if(data.status !== "SUCCESS") return;
    const tbody = document.getElementById("categoriesTableBody");
    tbody.innerHTML = "";
    if(data.categories.length === 0){
        tbody.innerHTML = `
        <tr>
            <td colspan="5" class="text-center text-muted py-4">
                No category found
            </td>
        </tr>`;
        return;
    }
    data.categories.forEach(category => {
        tbody.innerHTML += `
        <tr>
            <td>${category.name}</td>
            <td>
                <img src="${category.image}" class="rounded"
                style="width:60px;height:40px;object-fit:cover;">
            </td>
            <td>${category.description}</td>
            <td>
                <button class="${category.isListed ? 'btn btn-listed':'btn btn-unlisted'}"
                onclick="toggleList('${category._id}')">
                ${category.isListed ? 'Listed':'Unlisted'}
                </button>
            </td>
            <td>
                <button class="btn btn-sm btn-outline-secondary"
                data-bs-toggle="modal"
                data-bs-target="#editCategoryModal"
                onclick="editCategory(
                    '${category._id}',
                    '${category.name}',
                    '${category.description}',
                    '${category.image}'
                )">
                <i class="bi bi-pencil"></i>
                </button>
            </td>
        </tr>`;
    });
    renderPagination(data.totalPages, page);
}
function renderPagination(totalPages, currentPage){
    const pagination = document.getElementById("pagination");
    pagination.innerHTML = "";

    if(currentPage > 1){
        pagination.innerHTML += `
        <li class="page-item">
            <a class="page-link" href="#" onclick="loadCategories(${currentPage-1})">Previous</a>
        </li>`;
    }

    for(let i=1;i<=totalPages;i++){
        pagination.innerHTML += `
        <li class="page-item ${i===currentPage ? 'active':''}">
            <a class="page-link" href="#" onclick="loadCategories(${i})">${i}</a>
        </li>`;
    }

    if(currentPage < totalPages){
        pagination.innerHTML += `
        <li class="page-item">
            <a class="page-link" href="#" onclick="loadCategories(${currentPage+1})">Next</a>
        </li>`;
    }
}
let timeout;

document.getElementById("searchCategory")
.addEventListener("keyup", () => {
   clearTimeout(timeout);
   timeout = setTimeout(()=>{
      loadCategories(1);
   },400);
});
document.getElementById("clearSearch")
.addEventListener("click", () => {
    document.getElementById("searchCategory").value = "";
    loadCategories(1);
});
document.addEventListener("DOMContentLoaded", () => {
    loadCategories(1);
});
 