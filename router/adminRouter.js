const express = require("express");
const router = express.Router();
const authController = require("../controller/admin/authController")
//adminAuth
router.get("/signin",authController.renderSignIn)
router.post("/signin",authController.validateSignIn)
//dashboard
router.get("/dashboard",authController.renderDashboard)
//customers
router.get("/customers",authController.renderCustomers)
router.post("/toggleUser/:id", authController.toggleUserBlock);
module.exports = router