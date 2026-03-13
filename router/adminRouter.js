const express = require("express");
const router = express.Router();
const authController = require("../controller/admin/authController")
const categoryController=require("../controller/admin/categoryController")
const upload = require("../middleware/multer");
//adminAuth
router.get("/signin",authController.renderSignIn)
router.post("/signin",authController.validateSignIn)
//dashboard
router.get("/dashboard",authController.renderDashboard)
//customers
router.get("/customers",authController.renderCustomers)
router.post("/toggleUser/:id", authController.toggleUserBlock);
//categoryManagement
router.get("/categories",categoryController.renderCategoryPage)
router.post("/categories",upload.single("image"),categoryController.createCategory);
router.put("/categories/:id",upload.single("image"),categoryController.updateCategory);
router.patch("/categories/toggle/:id",categoryController.toggleCategory);

module.exports = router