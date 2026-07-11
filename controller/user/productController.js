const productService = require("../../services/user/productService");
const categoryService = require("../../services/admin/categoryService");
const variantService = require("../../services/admin/variantService");

async function renderShop(req, res) {
  try {
    const products = await productService.getAllProducts();
    const materials = await categoryService.getAllCategories();
    const variants = await variantService.getAllVariants();
    const wishlistedVariantIds = await productService.getWishlistedVariantIds(req.session.userId);

    res.render("user/productListing", {
      products,
      materials,
      variants,
      wishlistedVariantIds,
    });

  } catch (error) {
    console.error("Error:", error);
    req.session.message = { type: "error", text: "Something went wrong" };
    return res.redirect("/");
  }
}

async function getFilteredProducts(req, res) {
  try {

    const search = req.query.search || "";
    const page = parseInt(req.query.page) || 1;
    const limit = 6;

    const material = req.query.material || "";
    const options = req.query.options || [];
    const price = req.query.price || "";
    const sort = req.query.sort || "";

    const result = await productService.getFilteredProducts({
      search,
      page,
      limit,
      material,
      options,
      price,
      sort
    });

    res.json({
    status: "SUCCESS",
    products: result.products,
    totalPages: result.totalPages,
    currentPage: page,
    totalProducts: result.totalProducts,
    startIndex: result.startIndex,
    endIndex: result.endIndex
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