const express = require("express");
const router = express.Router();
const authController = require("../controller/admin/authController")
const customerController=require("../controller/admin/customerController")
const categoryController=require("../controller/admin/categoryController")
const productController=require("../controller/admin/productController")
const variantController = require("../controller/admin/variantController");
const upload = require("../middleware/multer");
//adminAuth
router.get("/signin",authController.renderSignIn)
router.post("/signin",authController.validateSignIn)
//dashboard
router.get("/dashboard",authController.renderDashboard)
//customers
router.get("/customers",customerController.renderCustomers)
router.post("/toggleUser/:id", customerController.toggleUserBlock);
router.get("/customersData", customerController.getCustomersData)
//categoryManagement
router.get("/categories",categoryController.renderCategoryPage)
router.post("/categories",upload.single("image"),categoryController.createCategory);
router.put("/categories/:id",upload.single("image"),categoryController.updateCategory);
router.patch("/categories/toggle/:id",categoryController.toggleCategory);
router.get("/categoriesData", categoryController.getCategories);
//variantManagement
router.get("/variants", variantController.renderVariantPage);
router.get("/variants/data", variantController.getVariants);
router.post("/variants", variantController.createVariant);
router.put("/variants/:id", variantController.updateVariant);
 router.patch("/variants/toggle/:id",variantController.toggleVariantStatus);
//productManagement
router.get("/products",productController.renderProductPage)
router.get("/products/data", productController.getProducts);
router.patch("/products/toggle/:id", productController.toggleProductStatus);
router.post("/products", upload.array("images", 4), productController.createProduct);
router.put("/products/:id", upload.array("images", 4), productController.updateProduct);
router.delete("/products/:id", productController.deleteProduct);

module.exports = router