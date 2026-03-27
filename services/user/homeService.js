const Category = require("../../model/categorySchema");
const appError = require("../../utils/appError");

async function getListedCategories() {
  try {
    const categories = await Category
      .find({ isListed: true })
      .select("name image description");
    return categories;
  } catch (error) {
    throw new appError("Failed to fetch categories");
  }
}

module.exports = {
  getListedCategories
};