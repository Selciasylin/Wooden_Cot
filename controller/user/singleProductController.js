const singleProductService = require("../../services/user/singleProductService");

async function renderSingleProduct(req, res) {
  try {
    const productId = req.params.id;
    const product = await singleProductService.getProductById(productId);
    const relatedProducts = await singleProductService.getRelatedProducts(product.category._id,productId);

    res.render("user/singleProduct", {
      product,
      relatedProducts
    });

  } catch (error) {
    console.error("Error:", error);
    if (error.isOperational) {
        req.session.message = {
          type: "error",
          text: error.message
        }
      }
    else{
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
      sizes: product.sizes
    });
  } catch (error) {
    return res.json({
      success: false,
      message: "Error fetching variant"
    });
  }
}

module.exports = { renderSingleProduct,getVariantData};
