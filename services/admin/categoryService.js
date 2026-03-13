const Category = require("../../model/categorySchema");
const appError = require("../../utils/appError");
async function getAllCategories() {
  const categories = await Category.find().sort({ createdAt: -1 });
  return categories;
}
async function createCategory(data) {
  const existing = await Category.findOne({
    name: { $regex: `^${data.name}$`, $options: "i" },
  });
  if (existing) {
    throw new appError("Category already exists");
  }
  const category = await Category.create(data);
  return category;
}

async function updateCategory(id, data) {
  const category = await Category.findById(id);
  if (!category) {
    throw new appError("Category not found");
  }
  category.name = data.name;
  category.description = data.description;
  if (data.image) {
    category.image = data.image;
  }
  await category.save();
  return category;
}

async function toggleCategoryStatus(id) {
  const category = await Category.findById(id);
  if (!category) {
    throw new appError("Category not found");
  }
  category.isListed = !category.isListed;
  await category.save();
  return category;
}

module.exports = {
  getAllCategories,
  createCategory,
  updateCategory,
  toggleCategoryStatus,
};
