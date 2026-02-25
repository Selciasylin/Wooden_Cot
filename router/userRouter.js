const express = require("express");
const router = express.Router();
const passport = require("passport");
const userController = require("../controller/user/userController");
const profileController = require("../controller/user/profileController");
const { isLoggedIn } = require("../middleware/authMiddleware");


//authentication
router.get("/signup", userController.renderSignUp);
router.post('/signup',userController.register);
router.get("/signin",userController.renderSignIn);
router.post("/signin",userController.login)
router.get('/verifyOtp',userController.renderOtpPage)
router.post('/verifyOtp',userController.verifyOtp)
router.get('/forgotPassword',userController.renderforgotPassword)
router.post('/forgotPassword',userController.forgotPassword)
router.get('/resetPassword',userController.renderResetPassword)
router.post('/resetPassword',userController.resetPassword)
//profile
router.get("/profile", isLoggedIn, profileController.renderProfile);
router.post("/profile/update",isLoggedIn,profileController.updateProfile)
router.post("/profile/changePassword", isLoggedIn, profileController.changePassword);
//google authentication
router.get("/auth/google",passport.authenticate("google", { scope: ["profile", "email"] }));
router.get("/auth/google/callback",passport.authenticate("google", {failureRedirect: "/login",}),userController.googleCallback);
//home page
router.get('/',userController.renderHome);

module.exports = router;
