const Product = require("../../model/productSchema");
const appError = require("../../utils/appError");

//  GET ALL PRODUCTS
async function getAllProducts() {
  const products = await Product.find({ isDeleted: false })
  .populate("category").sort({
    createdAt: -1,
  });
  console.log(products)
  return products;
}

// GET PRODUCTS WITH SEARCH + PAGINATION
async function getProducts(search, page, limit) {
  const query = {
    isDeleted: false,
    name: { $regex: search, $options: "i" },
  };
  const skip = (page - 1) * limit;
  const products = await Product.find(query)
    .populate("category")
    .sort({ createdAt: -1 })
    .skip(skip)
    .limit(limit);
  const total = await Product.countDocuments(query);
  return {
    products,
    totalPages: Math.ceil(total / limit),
  };
}

//CREATE PRODUCT
async function createProduct(data) {
  const existing = await Product.findOne({
    name: { $regex: `^${data.name}$`, $options: "i" },
  });
  if (existing) {
    throw new appError("Product already exists");
  }
  if (
    data.sizes.some((s) => {
      const v = s.variants || {};

      const withValid =
        v.withDrawer && v.withDrawer.price > 0 && v.withDrawer.quantity >= 0;

      const withoutValid =
        v.withoutDrawer &&
        v.withoutDrawer.price > 0 &&
        v.withoutDrawer.quantity >= 0;

      return !withValid && !withoutValid;
    })
  ) {
    throw new appError("Each size must have at least one valid variant");
  }
  const product = await Product.create(data);
  return product;
}

// ───────── UPDATE PRODUCT ─────────
async function updateProduct(id, data) {
  const product = await Product.findById(id);
  if (!product) {
    throw new appError("Product not found");
  }
  if (
    data.sizes.some((s) => {
      const v = s.variants || {};

      const withValid =
        v.withDrawer && v.withDrawer.price > 0 && v.withDrawer.quantity >= 0;

      const withoutValid =
        v.withoutDrawer &&
        v.withoutDrawer.price > 0 &&
        v.withoutDrawer.quantity >= 0;

      return !withValid && !withoutValid;
    })
  ) {
    throw new appError("Each size must have at least one valid variant");
  }

  product.name = data.name;
  product.category = data.category;
  product.description = data.description;
  product.sizes = data.sizes;
  if (data.images && data.images.length > 0) {
    product.images = data.images;
  }
  await product.save();
  return product;
}

// ───────── SOFT DELETE ─────────
async function deleteProduct(id) {
  const product = await Product.findById(id);
  if (!product) {
    throw new appError("Product not found");
  }
  product.isDeleted = true;
  await product.save();
  return product;
}

// ───────── TOGGLE PRODUCT STATUS ─────────
async function toggleProductStatus(id) {
  const product = await Product.findById(id);
  if (!product) {
    throw new appError("Product not found");
  }
  product.isListed = !product.isListed;
  await product.save();
  return product;
}

module.exports = {
  getAllProducts,
  getProducts,
  createProduct,
  updateProduct,
  deleteProduct,
  toggleProductStatus,
};
