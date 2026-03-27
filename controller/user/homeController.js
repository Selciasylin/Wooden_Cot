const homeService = require("../../services/user/homeService");

async function renderHome(req, res) {
  try {
    const categories = await homeService.getListedCategories();
    res.render("user/homePage", {
      categories,
    });
  } catch (error) {
    console.log(error);
    res.render("user/homePage", {
      categories: [],
    });
  }
}
module.exports = {
  renderHome,
};
