const Variant = require("../../model/variantSchema");
const appError = require("../../utils/appError");

// GET ALL VARIANTS (for product page render)
async function getAllVariants() {
 return await Variant.find({
   isDeleted:false,
   isListed:true
})
.sort({createdAt:1})
.lean();
}

// GET VARIANTS WITH SEARCH + PAGINATION
async function getVariants(search, page, limit) {
  const query = {
    isDeleted: false,
    type: { $regex: search, $options: "i" },
  };
  const skip = (page - 1) * limit;
  const variants = await Variant.find(query)
    .sort({ createdAt: -1 })
    .skip(skip)
    .limit(limit);
  const total = await Variant.countDocuments(query);
  return {
    variants,
    totalPages: Math.ceil(total / limit),
  };
}

// CREATE VARIANT
async function createVariant(data) {
  const existing = await Variant.findOne({
    type: { $regex: `^${data.type}$`, $options: "i" },
    isDeleted: false,
  });
  if (existing) {
    throw new appError("Variant type already exists");
  }
  return await Variant.create(data);
}

// UPDATE VARIANT
async function updateVariant(id, data) {
  const variant = await Variant.findById(id);
  if (!variant) {
    throw new appError("Variant not found");
  }
  variant.type = data.type;
  variant.options = data.options;
  await variant.save();
  return variant;
}

// TOGGLE STATUS
async function toggleVariantStatus(id) {
  const variant = await Variant.findById(id);
  if (!variant) {
    throw new appError("Variant not found");
  }
  variant.isListed = !variant.isListed;
  await variant.save();
  return variant;
}

module.exports = {
  getAllVariants,
  getVariants,
  createVariant,
  updateVariant,
  toggleVariantStatus,
};