const Product = require("../../model/productSchema");
const Variant = require("../../model/variantSchema");
const User = require("../../model/userSchema");
const Wishlist = require("../../model/wishlistSchema");
const appError = require("../../utils/appError");

function getLowestPrice(product) {
  if (!product.variants?.length) {
    return 0;
  }
  return Math.min(...product.variants.map((variant) => variant.price));
}

async function getAllProducts() {
  const products = await Product.find({
    isDeleted: false,
    isListed: true,
  })
    .populate({
      path: "category",
      match: { isListed: true }, // 🔥 important
    })
    .lean();
    let filteredProducts = products.filter((p) => p.category !== null);
  const allVariants = await Variant.find({ isDeleted: false }).lean();
  const optionMap = {};
  allVariants.forEach((variant) => {
    variant.options.forEach((opt) => {
      optionMap[opt._id.toString()] = opt.value;
    });
  });
  filteredProducts.forEach((product) => {
    product.variants?.forEach((v) => {
      v.resolvedOptions = v.options
        ?.map((id) => optionMap[id.toString()])
        .filter(Boolean);
    });
  });
  // remove products whose category is null
  return filteredProducts
}

async function getFilteredProducts(filters) {
  const { search, page, limit, material, options, price, sort } = filters;

  const query = {
    isDeleted: false,
    isListed: true,
    name: { $regex: search, $options: "i" },
  };

  // material filter
  if (material) {
    query.category = material;
  }

  if (options.length) {
    query.variants = {
      $elemMatch: {
        options: {
          $all: options,
        },
      },
    };
  }
  const products = await Product.find(query)
    .populate({
      path: "category",
      match: { isListed: true },
    })
    .lean();

  // remove null category
  let filteredProducts = products.filter((p) => p.category !== null);

  // PRICE FILTER
  if (price) {
    filteredProducts = filteredProducts.filter((product) => {
      const productPrice = getLowestPrice(product);
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
      return getLowestPrice(a) - getLowestPrice(b);
    });
  }

  if (sort === "highToLow") {
    filteredProducts.sort((a, b) => {
      return getLowestPrice(b) - getLowestPrice(a);
    });
  }

  if (sort === "newest") {
    filteredProducts.sort(
      (a, b) => new Date(b.createdAt) - new Date(a.createdAt),
    );
  }

  const allVariants = await Variant.find({ isDeleted: false }).lean();
  const optionMap = {};
  allVariants.forEach(variant => {
    variant.options.forEach(opt => {
      optionMap[opt._id.toString()] = opt.value;
    });
  });
  filteredProducts.forEach(product => {
    product.variants?.forEach(v => {
      v.resolvedOptions = v.options?.map(id => optionMap[id.toString()]).filter(Boolean);
    });
  });

  // PAGINATION
  const total = filteredProducts.length;
  const start = (page - 1) * limit;
  const end = start + limit;
  const paginatedProducts = filteredProducts.slice(start, end);
  const startIndex = start + 1;
  const endIndex = Math.min(start + limit, total);
  return {
    products: paginatedProducts,
    totalPages: Math.ceil(total / limit),
    totalProducts: total,
    startIndex,
    endIndex,
  };
}

async function getWishlistedVariantIds(userId) {
  if (!userId) return [];

  const wishlist = await Wishlist.findOne({ userId }).lean();
  if (!wishlist) return [];

  return wishlist.products.map((item) => item.variantId?.toString());
}

module.exports = {
  getAllProducts,
  getFilteredProducts,
  getWishlistedVariantIds,
};
