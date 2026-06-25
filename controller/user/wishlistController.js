const wishlistService = require("../../services/user/wishlistService");
const {addWishlistSchema, wishlistIdSchema} = require("../../validations/wishlistValidation");
async function renderWishlist(req, res) {
  try {
    const user = await wishlistService.getUser(req.session.userId);
    res.render("user/profile/wishlist",{user});
  } catch (error) {
    console.error("Internal Error:", error);
    req.session.message = {
      type: "error",
      text: "Something went wrong",
    };
    return res.redirect("/");
  }
}

async function getWishlistData(req, res) {
  try {
    const search = req.query.search || "";
    const page = parseInt(req.query.page) || 1;
    const result = await wishlistService.getWishlistProducts(
      req.session.userId,
      {
        search,
        page,
      },
    );

    return res.json({
      status: "SUCCESS",
      products: result.products,
      totalPages: result.totalPages,
      currentPage: result.currentPage,
      totalProducts: result.totalProducts,
      startIndex: result.startIndex,
      endIndex: result.endIndex,
    });
  } catch (error) {
    console.error("Internal Error:", error);

    return res.json({
      status: "ERROR",
      message: "Something went wrong",
    });
  }
}

// wishlistController.js
async function addToWishlist(req, res) {
  try {
    const { productId, variantId } = req.body;
    const userId = req.session.userId;

    if (!userId) {
      return res.json({ success: false, message: "Please login to continue" });
    }

    const savedVariantId = await wishlistService.addToWishlist(userId, productId, variantId);

    return res.json({
      success: true,
      message: "Added to wishlist",
      variantId: savedVariantId,   // ← needed by single product page
    });

  } catch (error) {
    return res.json({
      success: false,
      message: error.isOperational ? error.message : "Something went wrong",
    });
  }
} 

async function removeWishlistProduct(req, res) {
  try {
    const validatedData = wishlistIdSchema.parse(req.params);
    await wishlistService.removeWishlistProduct(
      req.session.userId,
      validatedData.id,
    );
    return res.json({
      status: "SUCCESS",
      message: "Product removed from wishlist",
    });
  } catch (error) {
    if (error.isOperational) {
      return res.json({
        status: "ERROR",
        message: error.message,
      });
    }
    console.error("Internal Error:", error);
    return res.json({
      status: "ERROR",
      message: "Something went wrong",
    });
  }
}
async function moveWishlistToCart(req, res) {
  try {
    const validatedData = wishlistIdSchema.parse(req.params);
    await wishlistService.moveToCart(req.session.userId, validatedData.id);
    return res.json({
      status: "SUCCESS",
      message: "Product moved to cart",
    });
  } catch (error) {
    if (error.isOperational) {
      return res.json({
        status: "ERROR",
        message: error.message,
      });
    }
    console.error("Internal Error:", error);
    return res.json({
      status: "ERROR",
      message: "Something went wrong",
    });
  }
}

module.exports = {
  renderWishlist,
  getWishlistData,
  addToWishlist,
  removeWishlistProduct,
  moveWishlistToCart,
};
