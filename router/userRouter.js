const express = require("express");
const router = express.Router();
const passport = require("passport");
const userController = require("../controller/user/userController");
const profileController = require("../controller/user/profileController");
const addressController = require("../controller/user/addressController");
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
router.post("/resendSignupOtp",preventAuthAccess,userController.resendSignupOtp);

//google authentication
router.get("/auth/google",passport.authenticate("google", { scope: ["profile", "email"] }));
router.get("/auth/google/callback",passport.authenticate("google", {failureRedirect: "/login",}),userController.googleCallback);

//home page
router.get('/',userController.renderHome);

//profile
router.get("/profile", isLoggedIn, profileController.renderProfile);
router.post("/profile/update",isLoggedIn,profileController.updateProfile)
router.post("/profile/changePassword", isLoggedIn, profileController.changePassword);
router.get("/address" ,isLoggedIn,addressController.renderAddress)
router.post("/address" ,isLoggedIn, addressController.addAddress);
router.put("/address/:id" ,isLoggedIn, addressController.updateAddress);
router.delete("/address/:id", addressController.deleteAddress);

module.exports = router;
