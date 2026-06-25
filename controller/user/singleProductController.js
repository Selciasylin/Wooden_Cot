const singleProductService = require("../../services/user/singleProductService");
const variantService = require("../../services/admin/variantService");

async function renderSingleProduct(req, res) {
  try {
    const productId = req.params.id;
    const product = await singleProductService.getProductById(productId);
    const variants = await variantService.getAllVariants();
    const relatedProducts = await singleProductService.getRelatedProducts(
      product.category._id,
      productId,
    );
    const wishlistVariantIds = await singleProductService.getWishlistVariantIds(
      req.session.userId,
      productId,
    );
    res.render("user/singleProduct", {
      product,
      variants,
      relatedProducts,
      wishlistVariantIds,
    });
    
  } catch (error) {
    console.error("Error:", error);
    if (error.isOperational) {
      req.session.message = {
        type: "error",
        text: error.message,
      };
    } else {
      req.session.message = {
        type: "error",
        text: "Product not found",
      };
    }
    return res.redirect("/shop");
  }
}

async function getVariantData(req, res) {
  try {
    const productId = req.params.id;
    const product = await singleProductService.getProductById(productId);
    return res.json({
      success: true,
      variants: product.variants,
    });
  } catch (error) {
    return res.json({
      success: false,
      message: "Error fetching variant",
    });
  }
}

module.exports = { renderSingleProduct, getVariantData };
