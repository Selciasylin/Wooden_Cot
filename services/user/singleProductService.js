const Product = require("../../model/productSchema");
const appError = require("../../utils/appError");

async function getProductById(productId) {
  const product = await Product.findOne({
    _id: productId,
    isDeleted: false,
    isListed: true
  })
  .populate({
    path: "category",
    match: { isListed: true}
  })
  .lean();
  if (!product || !product.category) {
    throw new appError("Product not available");
  }

  return product;
}

async function getRelatedProducts(categoryId, productId) {
  return await Product.find({
    category: categoryId,
    _id: { $ne: productId },
    isDeleted: false,
    isListed: true
  })
  .limit(4)
  .lean();
} 
module.exports = { getProductById, getRelatedProducts};
