const Product = require("../../model/productSchema");
const appError = require("../../utils/appError");

//  GET ALL PRODUCTS
async function getAllProducts() {
  const products = await Product.find({ isDeleted: false })
    .populate("category")
    .sort({
      createdAt: -1,
    });
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
    totalProducts: total,
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
    data.variants.some(
      (v) => v.options.length === 0 || v.price <= 0 || v.quantity < 0,
    )
  ) {
    throw new appError("Invalid product variant");
  }
  const seen = new Set();
  for (const v of data.variants) {
    const key = [...v.options].sort().join("-");
    if (seen.has(key)) {
      throw new appError("Duplicate variant combination");
    }
    seen.add(key);
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
  if (data.variants.some(
      (v) => v.options.length === 0 || v.price <= 0 || v.quantity < 0,)) {
    throw new appError("Invalid product variant");
  }
  const seen = new Set();
  for (const v of data.variants) {
    const key = [...v.options].sort().join("-");
    if (seen.has(key)) {
      throw new appError("Duplicate variant combination");
    }
    seen.add(key);
  }

  product.name = data.name;
  product.category = data.category;
  product.description = data.description;
  product.variants = data.variants;
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
