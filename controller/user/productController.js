const productService = require("../../services/user/productService");
const categoryService = require("../../services/admin/categoryService");

async function renderShop(req, res) {
  try {
    const products = await productService.getAllProducts();
    const materials = await categoryService.getAllCategories();
    console.log(materials)
    res.render("user/productListing", {
      products,
      materials
    });

  } catch (error) {
    console.error("Error:", error);
    req.session.message = {
      type: "error",
      text: "Something went wrong",
    };
    return res.redirect("/");
  }
}

async function getFilteredProducts(req, res) {
  try {

    const search = req.query.search || "";
    const page = parseInt(req.query.page) || 1;
    const limit = 6;

    const material = req.query.material || "";
    const size = req.query.size || "";
    const storage = req.query.storage || "";
    const price = req.query.price || "";
    const sort = req.query.sort || "";

    const result = await productService.getFilteredProducts({
      search,
      page,
      limit,
      material,
      size,
      storage,
      price,
      sort
    });

    res.json({
      status: "SUCCESS",
      products: result.products,
      totalPages: result.totalPages,
      currentPage: page
    });

  } catch (error) {
    console.log(error);

    res.json({
      status: "ERROR",
      message: "Failed to load products"
    });
  }
}
 
module.exports = { renderShop,getFilteredProducts };