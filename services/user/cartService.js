const Cart = require("../../model/cartSchema");
const Product = require("../../model/productSchema");
const Variant = require("../../model/variantSchema");
const User = require("../../model/userSchema");
const appError = require("../../utils/appError");

const SHIPPING_COST = 100;

// Reusable helper — get user by ID
async function getUser(userId) {
  return await User.findById(userId).lean();
}

// Get all cart products with pagination
async function getCartProducts(userId, filters) {
  const cart = await Cart.findOne({ userId })
    .populate({ path: "products.productId" })
    .lean();

  if (!cart || cart.products.length === 0) {
    return { products: [], totalProducts: 0, subtotal: 0 };
  }

  const validProducts = cart.products.filter((item) => item.productId);
  const variantsData = await Variant.find({ isDeleted: false }).lean();

  const formattedProducts = validProducts.map((item) => {
    const variant = item.productId.variants.find(
      (v) => v._id.toString() === item.variantId.toString()
    );

    const optionNames = variant
      ? variant.options.map((optionId) => {
          for (const variantType of variantsData) {
            const found = variantType.options.find(
              (opt) => opt._id.toString() === optionId.toString()
            );
            if (found) return found.value;
          }
          return optionId;
        })
      : [];

    const price = variant ? variant.price : 0;
    const stock = variant ? variant.quantity : 0;

    return {
      cartItemId: item._id,
      productId: item.productId._id,
      productName: item.productId.name,
      image: item.productId.images[0],
      variant: { options: optionNames, price, stock },
      quantity: item.quantity,
      itemTotal: price * item.quantity,
    };
  });

  const subtotal = formattedProducts.reduce((total, item) => total + item.itemTotal, 0);

  return {
    products: formattedProducts,
    totalProducts: formattedProducts.length,
    subtotal,
  };
}

// Add item to cart — called from shop page or product page
async function addToCart(userId, productId, variantId) {
  let cart = await Cart.findOne({ userId });
  if (!cart) {
    cart = new Cart({ userId, products: [] });
  }

  // If no variantId sent (from shop page), pick the cheapest variant as default
  if (!variantId) {
    const product = await Product.findById(productId);
    const defaultVariant = product.variants.reduce((lowest, current) =>
      current.price < lowest.price ? current : lowest
    );
    variantId = defaultVariant._id.toString();
  }

  // Check if this exact product+variant combo already exists in cart
  const alreadyExists = cart.products.find(
    (item) =>
      item.productId.toString() === productId.toString() &&
      item.variantId?.toString() === variantId.toString()
  );

  if (alreadyExists) {
      alreadyExists.quantity += 1;
      await cart.save();
      return;
  }

  cart.products.push({ productId, variantId, quantity: 1 });
  await cart.save();
}

// Update quantity of a cart item
async function updateQuantity(userId, cartItemId, action) {
  const cart = await Cart.findOne({ userId })
    .populate({ path: "products.productId" })
    .lean();

  if (!cart) throw new appError("Cart not found", 404);

  // Find the specific item
  const item = cart.products.find(
    (p) => p._id.toString() === cartItemId
  );
  if (!item) throw new appError("Cart item not found", 404);

  const variant = item.productId.variants.find(
    (v) => v._id.toString() === item.variantId.toString()
  );

  const stock = variant ? variant.quantity : 0;
  let newQuantity = item.quantity;

  if (action === "increment") {
    if (newQuantity >= stock) {
      throw new appError(`Only ${stock} items available in stock`, 400);
    }
    newQuantity += 1;
  } else if (action === "decrement") {
    if (newQuantity <= 1) {
      throw new appError("Quantity cannot go below 1", 400);
    }
    newQuantity -= 1;
  }

  // Update in DB using updateOne to avoid lean conflicts
  await Cart.updateOne(
    { userId, "products._id": cartItemId },
    { $set: { "products.$.quantity": newQuantity } }
  );

  // Recalculate subtotal from fresh DB read
  const updatedCart = await Cart.findOne({ userId })
    .populate({ path: "products.productId" })
    .lean();

  const subtotal = updatedCart.products.reduce((total, p) => {
    const v = p.productId.variants.find(
      (vv) => vv._id.toString() === p.variantId.toString()
    );
    return total + (v ? v.price * p.quantity : 0);
  }, 0);

  const price = variant ? variant.price : 0;

  return {
    newQuantity,
    itemTotal: price * newQuantity,
    subtotal,
  };
}

// Remove a single item from cart
async function removeCartItem(userId, cartItemId) {
  const cart = await Cart.findOne({ userId })
    .populate({ path: "products.productId" })
    .lean();

  if (!cart) throw new appError("Cart not found", 404);

  // Remove the item
  await Cart.updateOne(
    { userId },
    { $pull: { products: { _id: cartItemId } } }
  );

  // Recalculate subtotal after removal
  const updatedCart = await Cart.findOne({ userId })
    .populate({ path: "products.productId" })
    .lean();

  const subtotal = updatedCart
    ? updatedCart.products.reduce((total, p) => {
        const v = p.productId?.variants?.find(
          (vv) => vv._id.toString() === p.variantId.toString()
        );
        return total + (v ? v.price * p.quantity : 0);
      }, 0)
    : 0;

  return { subtotal };
}

module.exports = {
  getUser,
  getCartProducts,
  addToCart,
  updateQuantity,
  removeCartItem,
};