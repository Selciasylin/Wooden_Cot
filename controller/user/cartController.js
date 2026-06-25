const cartService = require("../../services/user/cartService");
const { addCartSchema, updateCartSchema } = require("../../validations/cartValidation");

// Render the cart page
async function renderCart(req, res) {
  try {
    const user = await cartService.getUser(req.session.userId);
    res.render("user/profile/cart", { user });
  } catch (error) {
    console.error("Internal Error:", error);
    req.session.message = { type: "error", text: "Something went wrong" };
    return res.redirect("/");
  }
}

// Get cart data as JSON (called by fetch)
async function getCartData(req, res) {
  try {
    const result = await cartService.getCartProducts(req.session.userId);
    return res.json({
      status: "SUCCESS",
      products: result.products,
      totalProducts: result.totalProducts,
      subtotal: result.subtotal,
    });
  } catch (error) {
    console.error("Internal Error:", error);
    return res.json({ status: "ERROR", message: "Something went wrong" });
  }
}

// Add item to cart (called from shop page or product page)
async function addToCart(req, res) {
  try {
    const userId = req.session.userId;
    if (!userId) {
      return res.json({ success: false, message: "Please login to continue" });
    }

    const validatedData = addCartSchema.parse(req.body);
    await cartService.addToCart(userId, validatedData.productId, validatedData.variantId);

    return res.json({ success: true, message: "Added to cart" });
  } catch (error) {
    return res.json({
      success: false,
      message: error.isOperational ? error.message : "Something went wrong",
    });
  }
}

// Update quantity (+1 or -1)
async function updateQuantity(req, res) {
  try {
    const validatedData = updateCartSchema.parse(req.body);
    const result = await cartService.updateQuantity(
      req.session.userId,
      validatedData.cartItemId,
      validatedData.action // "increment" or "decrement"
    );

    return res.json({
      status: "SUCCESS",
      message: "Quantity updated",
      newQuantity: result.newQuantity,
      itemTotal: result.itemTotal,
      subtotal: result.subtotal,
    });
  } catch (error) {
    if (error.isOperational) {
      return res.json({ status: "ERROR", message: error.message });
    }
    console.error("Internal Error:", error);
    return res.json({ status: "ERROR", message: "Something went wrong" });
  }
}

// Remove item from cart
async function removeCartItem(req, res) {
  try {
    const cartItemId = req.params.id;
    const result = await cartService.removeCartItem(req.session.userId, cartItemId);

    return res.json({
      status: "SUCCESS",
      message: "Item removed from cart",
      subtotal: result.subtotal,
    });
  } catch (error) {
    if (error.isOperational) {
      return res.json({ status: "ERROR", message: error.message });
    }
    console.error("Internal Error:", error);
    return res.json({ status: "ERROR", message: "Something went wrong" });
  }
}

module.exports = {
  renderCart,
  getCartData,
  addToCart,
  updateQuantity,
  removeCartItem,
};