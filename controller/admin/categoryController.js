const categoryService = require("../../services/admin/categoryService");
const { categoryZodSchema } = require("../../validations/categoryValidation");
const { uploadToCloudinary } = require("../../utils/cloudinary");
async function renderCategoryPage(req, res) {
  try {
    const categories = await categoryService.getAllCategories();
    res.render("admin/adminManagement/category", { categories });
  } catch (error) {
    console.error("Internal Error:", error);
    req.session.message = {
      type: "error",
      text: "Something went wrong",
    };
    return res.redirect("/admin/dashboard");
  }
}
async function createCategory(req, res) {
  try {
    if (!req.file) {
      return res.json({
        status: "ERROR",
        message: "Category image is required",
      });
    }
    const uploadResult = await uploadToCloudinary(req.file.buffer);
    const validated = categoryZodSchema.parse({
      name: req.body.name,
      description: req.body.description,
      image: uploadResult.secure_url,
    });
    await categoryService.createCategory(validated);
    return res.json({
      status: "SUCCESS",
      message: "Category created successfully",
    });
  } catch (error) {
    if (error.isOperational) {
      return res.json({ status: "ERROR", message: error.message });
    }
    if (error.name === "ZodError") {
      return res.json({ status: "ERROR", message: error.errors[0].message });
    }
    console.error(error);
    res.json({ status: "ERROR", message: "Something went wrong" });
  }
}

async function updateCategory(req, res) {
  try {
    let imageUrl = req.body.currentImage;
    if (req.file) {
      const uploadResult = await uploadToCloudinary(req.file.buffer);
      imageUrl = uploadResult.secure_url;
    }
    const validated = categoryZodSchema.parse({
      name: req.body.name,
      description: req.body.description,
      image: imageUrl,
    });
    await categoryService.updateCategory(req.params.id, validated);
    res.json({
      status: "SUCCESS",
      message: "Category updated successfully",
    });
  } catch (error) {
    if (error.isOperational) {
      return res.json({ status: "ERROR", message: error.message });
    }
    if (error.name === "ZodError") {
      return res.json({ status: "ERROR", message: error.errors[0].message });
    }
    console.error(error);
    res.json({ status: "ERROR", message: "Something went wrong" });
  }
}

async function toggleCategory(req, res) {
  try {
    const category = await categoryService.toggleCategory(req.params.id);
    res.json({
      status: "SUCCESS",
      message: `Category ${category.isListed ? "listed" : "unlisted"} successfully`,
    });
  } catch (error) {
    if (error.isOperational) {
      return res.json({ status: "ERROR", message: error.message });
    }
    console.error(error);
    res.json({ status: "ERROR", message: "Something went wrong" });
  }
}
module.exports = {
  renderCategoryPage,
  createCategory,
  updateCategory,
  toggleCategory,
};
