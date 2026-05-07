const Product = require("../../model/productSchema");
const User = require("../../model/userSchema");
const appError = require("../../utils/appError");

async function getUserById(userId) {
  const user = await User.findById(userId).lean();
  if (!user) throw new appError("User not found");
  return user;
}

async function getAllProducts() {
  const products = await Product.find({
    isDeleted: false,
    isListed: true
  })
  .populate({
    path: "category",
    match: { isListed: true } // 🔥 important
  })
  .lean();

  // remove products whose category is null
   return products.filter(p => p.category !== null);
}

async function getFilteredProducts(filters) {

  const {
    search,
    page,
    limit,
    material,
    size,
    storage,
    price,
    sort
  } = filters;

  const query = {
    isDeleted: false,
    isListed: true,
    name: { $regex: search, $options: "i" }
  };

  // material filter
  if (material) {
    query.category = material;
  }

  // size filter
  if (size) {
    query["sizes.size"] = size;
  }

  // storage filter
  if (storage === "withDrawer") {
    query["sizes.variants.withDrawer"] = { $exists: true };
  }

  if (storage === "withoutDrawer") {
    query["sizes.variants.withoutDrawer"] = { $exists: true };
  }

  const products = await Product.find(query)
    .populate({
      path: "category",
      match: { isListed: true }
    })
    .lean();

  // remove null category
  let filteredProducts = products.filter(p => p.category !== null);

  // PRICE FILTER
  if (price) {

    filteredProducts = filteredProducts.filter(product => {

      const firstSize = product.sizes[0];

      const variant =
        firstSize?.variants?.withDrawer ||
        firstSize?.variants?.withoutDrawer;

      const productPrice = variant?.price || 0;

      if (price === "1") {
        return productPrice < 25000;
      }

      if (price === "2") {
        return productPrice >= 25000 && productPrice <= 50000;
      }

      if (price === "3") {
        return productPrice >= 50000 && productPrice <= 75000;
      }

      if (price === "4") {
        return productPrice > 75000;
      }

    });

  }

  // SORTING
  if (sort === "lowToHigh") {

    filteredProducts.sort((a, b) => {

      const aPrice =
        a.sizes[0]?.variants?.withDrawer?.price ||
        a.sizes[0]?.variants?.withoutDrawer?.price;

      const bPrice =
        b.sizes[0]?.variants?.withDrawer?.price ||
        b.sizes[0]?.variants?.withoutDrawer?.price;

      return aPrice - bPrice;
    });

  }

  if (sort === "highToLow") {

    filteredProducts.sort((a, b) => {

      const aPrice =
        a.sizes[0]?.variants?.withDrawer?.price ||
        a.sizes[0]?.variants?.withoutDrawer?.price;

      const bPrice =
        b.sizes[0]?.variants?.withDrawer?.price ||
        b.sizes[0]?.variants?.withoutDrawer?.price;

      return bPrice - aPrice;
    });

  }

  if (sort === "newest") {

    filteredProducts.sort(
      (a, b) => new Date(b.createdAt) - new Date(a.createdAt)
    );

  }

  // PAGINATION
  const total = filteredProducts.length;

  const start = (page - 1) * limit;
  const end = start + limit;

  const paginatedProducts = filteredProducts.slice(start, end);

  return {
    products: paginatedProducts,
    totalPages: Math.ceil(total / limit)
  };
}

module.exports = { getUserById, getAllProducts, getFilteredProducts }