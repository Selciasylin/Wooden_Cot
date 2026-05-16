const Product = require("../../model/productSchema");
const Variant = require("../../model/variantSchema");
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
  .populate({
    path:"variants.options"
  })
  .lean();
  if (!product || !product.category) {
    throw new appError("Product not available");
  }
  const variantDocs =
await Variant.find().lean();

const variantMap = {};

variantDocs.forEach(variantDoc => {

   const matchedOptions =
   variantDoc.options.filter(option => {

      return product.variants.some(productVariant =>

         productVariant.options.some(
            productOption =>

            productOption._id.toString() ===
            option._id.toString()
         )

      );

   });

   if(matchedOptions.length){

      variantMap[variantDoc.type] =
      matchedOptions;
   }

});

product.variantGroups = variantMap;
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
