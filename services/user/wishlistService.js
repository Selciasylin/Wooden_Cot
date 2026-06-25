const Wishlist = require("../../model/wishlistSchema");
const Product = require("../../model/productSchema");
const Variant = require("../../model/variantSchema");
const User = require("../../model/userSchema");
//const Cart = require("../../model/cartSchema");
const appError = require("../../utils/appError");

async function getUser(userId) {
  return await User.findById(userId).lean();
}

async function getWishlistProducts(userId, filters) {
  const search = filters.search || "";
  const page = parseInt(filters.page) || 1;
  const limit = 5;
  const wishlist = await Wishlist.findOne({ userId })
    .populate({
      path: "products.productId",
      populate: {
        path: "category",
      },
    })
    .lean();
  if (!wishlist) {
    return {
      products: [],
      totalPages: 0,
      totalProducts: 0,
      currentPage: 1,
    };
  }
  let products = wishlist.products.filter((item) => {
    if (!item.productId) return false;
    return item.productId.name.toLowerCase().includes(search.toLowerCase());
  });
  const totalProducts = products.length;
  const start = (page - 1) * limit;
  const end = start + limit;
  products = products.slice(start, end);
  const variantsData = await Variant.find({ isDeleted: false }).lean();
  const formattedProducts = products.map((item) => {
    let variant;
    if (item.variantId) {
      variant = item.productId.variants.find(
        (variant) => variant._id.toString() === item.variantId.toString(),
      );
    } else {
  variant = item.productId.variants.reduce(
    (lowest, current) =>
      current.price < lowest.price ? current : lowest
  );
}
    const optionNames = variant.options.map((optionId) => {
      for (const variantType of variantsData) {
        const found = variantType.options.find(
          (option) => option._id.toString() === optionId.toString(),
        );

        if (found) return found.value;
      }

      return optionId;
    });

    return {
      wishlistItemId: item._id,
      productId: item.productId._id,
      productName: item.productId.name,
      image: item.productId.images[0],

      variant: {
        ...variant,
        options: optionNames,
      },
    };
  });
  return {
    products: formattedProducts,
    totalPages: Math.ceil(totalProducts / limit),
    totalProducts,
    currentPage: page,
    startIndex: start + 1,
    endIndex: Math.min(end, totalProducts),
  };
}

async function addToWishlist(userId, productId, variantId) {
  let wishlist = await Wishlist.findOne({ userId });
  if (!wishlist) {
    wishlist = new Wishlist({ userId, products: [] });
  }

  // Resolve default variant first, so duplicate check uses the real ID
  if (!variantId) {
    const product = await Product.findById(productId);
    const defaultVariant = product.variants.reduce((lowest, current) =>
      current.price < lowest.price ? current : lowest
    );
    variantId = defaultVariant._id.toString();
  }

  const alreadyExists = wishlist.products.find(
    (item) =>
      item.productId.toString() === productId.toString() &&
      item.variantId?.toString() === variantId.toString()
  );

  if (alreadyExists) {
    throw new appError("Product already in wishlist", 400);
  }

  wishlist.products.push({ productId, variantId });
  await wishlist.save();
  return variantId.toString();   // ← return string
}

async function removeWishlistProduct(userId, wishlistItemId) {
  const wishlist = await Wishlist.findOne({ userId });
  if (!wishlist) {
    throw new appError("Wishlist not found", 404);
  }
  wishlist.products = wishlist.products.filter(
    (item) => item._id.toString() !== wishlistItemId,
  );
  await wishlist.save();
  return true;
}

async function moveToCart(userId, wishlistItemId) {
  const wishlist = await Wishlist.findOne({ userId });
  const wishlistItem = wishlist.products.find(
    (item) => item._id.toString() === wishlistItemId,
  );
  if (!wishlistItem) {
    throw new appError("Wishlist item not found", 404);
  }
  const product = await Product.findById(wishlistItem.productId);
  const variant = product.variants.find(
    (variant) => variant._id.toString() === wishlistItem.variantId.toString(),
  );
  if (!variant || variant.quantity <= 0) {
    throw new appError("Product out of stock", 400);
  }
  let cart = await Cart.findOne({ userId });
  if (!cart) {
    cart = new Cart({
      userId,
      products: [],
    });
  }
  const existingCartItem = cart.products.find(
    (item) =>
      item.productId.toString() === wishlistItem.productId.toString() &&
      item.variantId.toString() === wishlistItem.variantId.toString(),
  );
  if (existingCartItem) {
    existingCartItem.quantity += 1;
  } else {
    cart.products.push({
      productId: wishlistItem.productId,
      variantId: wishlistItem.variantId,
      quantity: 1,
    });
  }
  await cart.save();
  wishlist.products = wishlist.products.filter(
    (item) => item._id.toString() !== wishlistItemId,
  );
  await wishlist.save();
  return true;
}

module.exports = {
  getUser,
  getWishlistProducts,
  addToWishlist,
  removeWishlistProduct,
  moveToCart,
};
