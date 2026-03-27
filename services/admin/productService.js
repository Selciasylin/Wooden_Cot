const Product = require("../../model/productSchema");
const appError = require("../../utils/appError");

//  GET ALL PRODUCTS
async function getAllProducts() {
  const products = await Product.find({ isDeleted: false }).sort({
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
  const product = await Product.create(data);
  return product;
}

// ───────── UPDATE PRODUCT ─────────
async function updateProduct(id, data) {
  const product = await Product.findById(id);
  if (!product) {
    throw new appError("Product not found");
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

module.exports = {
  getAllProducts,
  getProducts,
  createProduct,
  updateProduct,
  deleteProduct,
};
