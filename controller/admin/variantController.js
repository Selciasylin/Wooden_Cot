const variantService = require("../../services/admin/variantService");
const { variantZodSchema } = require("../../validations/variantValidation");

// RENDER PAGE
async function renderVariantPage(req, res) {
  try {
    const variants = await variantService.getAllVariants();
    res.render("admin/adminManagement/variant", { variants });
  } catch (error) {
    console.log(error);
    res.redirect("/admin/dashboard");
  }
}

// GET VARIANTS (AJAX)
async function getVariants(req, res) {
  try {
    const search = req.query.search || "";
    const page = parseInt(req.query.page) || 1;
    const limit = 5;
    const result = await variantService.getVariants(search, page, limit);
    res.json({
      status: "SUCCESS",
      variants: result.variants,
      totalPages: result.totalPages,
      currentPage: page,
    });
  } catch (error) {
    console.log(error);
    res.json({ status: "ERROR", message: "Failed to load variants" });
  }
}

// CREATE VARIANT
async function createVariant(req, res) {
  try {
    const validated = variantZodSchema.parse(req.body);
    await variantService.createVariant(validated);
    res.json({ status: "SUCCESS", message: "Variant created successfully" });
  } catch (error) {
    if (error.name === "ZodError") {
      return res.json({ status: "ERROR", message: error.issues[0].message });
    }
    if (error.isOperational) {
      return res.json({ status: "ERROR", message: error.message });
    }
    console.log(error);
    res.json({ status: "ERROR", message: "Something went wrong" });
  }
}

// UPDATE VARIANT
async function updateVariant(req, res) {
  try {
    const validated = variantZodSchema.parse(req.body);
    await variantService.updateVariant(req.params.id, validated);
    res.json({ status: "SUCCESS", message: "Variant updated successfully" });
  } catch (error) {
    if (error.name === "ZodError") {
      return res.json({ status: "ERROR", message: error.issues[0].message });
    }
    if (error.isOperational) {
      return res.json({ status: "ERROR", message: error.message });
    }
    console.log(error);
    res.json({ status: "ERROR", message: "Something went wrong" });
  }
}

// TOGGLE STATUS
async function toggleVariantStatus(req, res) {
  try {
    const result = await variantService.toggleVariantStatus(req.params.id);
    res.json({
      status: "SUCCESS",
      message: result.isListed ? "Variant listed" : "Variant unlisted",
    });
  } catch (error) {
    if (error.isOperational) {
      return res.json({ status: "ERROR", message: error.message });
    }
    console.log(error);
    res.json({ status: "ERROR", message: "Something went wrong" });
  }
}

module.exports = {
  renderVariantPage,
  getVariants,
  createVariant,
  updateVariant,
  toggleVariantStatus,
};