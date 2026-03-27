const productService = require("../../services/admin/productService");
const { productZodSchema } = require("../../validations/productValidation");
const { uploadToCloudinary } = require("../../utils/cloudinary");

// ───────── RENDER PRODUCT PAGE ─────────
async function renderProductPage(req, res) {
  try {
    const products = await productService.getAllProducts();
    res.render("admin/adminManagement/product", {
      products,
      message: req.session.message || null,
    });
    req.session.message = null;
  } catch (error) {
    console.error(error);
    req.session.message = {
      type: "error",
      text: "Something went wrong",
    };
    res.redirect("/admin/dashboard");
  }
}

//  GET PRODUCTS (AJAX)
async function getProducts(req, res) {
  try {
    const search = req.query.search || "";
    const page = parseInt(req.query.page) || 1;
    const limit = 5;
    const result = await productService.getProducts(search, page, limit);
    res.json({
      status: "SUCCESS",
      products: result.products,
      totalPages: result.totalPages,
      currentPage: page,
    });
  } catch (error) {
    console.error(error);
    res.json({ status: "ERROR", message: "Failed to load products" });
  }
}

// ───────── CREATE PRODUCT ─────────
async function createProduct(req, res) {
  try {
    const files = req.files;
    if (!files || files.length === 0) {
      return res.json({ status: "ERROR", message: "Images required" });
    }
    // upload images
    const imageUrls = [];
    for (const file of files) {
      const upload = await uploadToCloudinary(file.buffer);
      imageUrls.push(upload.secure_url);
    }
    const sizes = JSON.parse(req.body.sizes);
    const validated = productZodSchema.parse({
      name: req.body.name,
      category: req.body.category,
      description: req.body.description,
      sizes,
      images: imageUrls,
    });
    await productService.createProduct(validated);
    res.json({ status: "SUCCESS", message: "Product created" });
  } catch (error) {
    if (error.name === "ZodError") {
      return res.json({ status: "ERROR", message: error.errors[0].message });
    }
    if (error.isOperational) {
      return res.json({ status: "ERROR", message: error.message });
    }
    console.error(error);
    res.json({ status: "ERROR", message: "Something went wrong" });
  }
}

// ───────── UPDATE PRODUCT ─────────
async function updateProduct(req, res) {
  try {
    let imageUrls = JSON.parse(req.body.currentImages || "[]");
    if (req.files && req.files.length > 0) {
      imageUrls = [];
      for (const file of req.files) {
        const upload = await uploadToCloudinary(file.buffer);
        imageUrls.push(upload.secure_url);
      }
    }
    const sizes = JSON.parse(req.body.sizes);
    const validated = productZodSchema.parse({
      name: req.body.name,
      category: req.body.category,
      description: req.body.description,
      sizes,
      images: imageUrls,
    });
    await productService.updateProduct(req.params.id, validated);
    res.json({ status: "SUCCESS", message: "Updated successfully" });
  } catch (error) {
    if (error.name === "ZodError") {
      return res.json({ status: "ERROR", message: error.errors[0].message });
    }
    if (error.isOperational) {
      return res.json({ status: "ERROR", message: error.message });
    }
    console.error(error);
    res.json({ status: "ERROR", message: "Something went wrong" });
  }
}

// DELETE PRODUCT
async function deleteProduct(req, res) {
  try {
    await productService.deleteProduct(req.params.id);
    res.json({ status: "SUCCESS", message: "Deleted successfully" });
  } catch (error) {
    if (error.isOperational) {
      return res.json({ status: "ERROR", message: error.message });
    }
    console.error(error);
    res.json({ status: "ERROR", message: "Something went wrong" });
  }
}

module.exports = {
  renderProductPage,
  getProducts,
  createProduct,
  updateProduct,
  deleteProduct,
};
