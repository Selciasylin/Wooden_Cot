const express = require("express");
const router = express.Router();
const passport = require("passport");
const userController = require("../controller/user/userController");
const homeController = require("../controller/user/homeController");
const profileController = require("../controller/user/profileController");
const addressController = require("../controller/user/addressController");
const productController = require("../controller/user/productController")
const singleProductController = require("../controller/user/singleProductController");
const { isLoggedIn, preventAuthAccess } = require("../middleware/authMiddleware");
const noCache = require("../middleware/noCacheMiddleware")

router.use(
  ["/signup", "/signin", "/verifyOtp", "/forgotPassword", "/resetPassword"],
  noCache
);
//authentication
router.get("/signup",preventAuthAccess,userController.renderSignUp);
router.post('/signup',preventAuthAccess,userController.register);
router.get("/signin",preventAuthAccess,userController.renderSignIn);
router.post("/signin",preventAuthAccess,userController.login)
router.get('/verifyOtp',preventAuthAccess,userController.renderOtpPage)
router.post('/verifyOtp',preventAuthAccess,userController.verifyOtp)
router.get('/forgotPassword',preventAuthAccess,userController.renderforgotPassword)
router.post('/forgotPassword',preventAuthAccess,userController.forgotPassword)
router.get('/resetPassword',preventAuthAccess,userController.renderResetPassword)
router.post('/resetPassword',preventAuthAccess,userController.resetPassword)
router.post("/resendOtp",preventAuthAccess,userController.resendSignupOtp);
router.post("/signOut",userController.signOut)

//google authentication
router.get("/auth/google",passport.authenticate("google", { scope: ["profile", "email"] }));
router.get("/auth/google/callback",passport.authenticate("google", {failureRedirect: "/login",}),userController.googleCallback);

//home page
router.get('/',homeController.renderHome);

router.use(noCache)
//profile
router.get("/profile", isLoggedIn, profileController.renderProfile);
router.post("/profile/update",isLoggedIn,profileController.updateProfile)
router.post("/profile/changePassword", isLoggedIn, profileController.changePassword);
router.get("/address" ,isLoggedIn,addressController.renderAddress)
router.post("/address" ,isLoggedIn, addressController.addAddress);
router.put("/address/:id" ,isLoggedIn, addressController.updateAddress);
router.delete("/address/:id", addressController.deleteAddress);

//productListing
router.get("/shop",isLoggedIn,productController.renderShop)
router.get("/shop/products", productController.getFilteredProducts);

//singleProduct
router.get("/product/:id",singleProductController.renderSingleProduct);
router.get("/product/variant/:id", singleProductController.getVariantData);

module.exports = router;
