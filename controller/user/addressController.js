const addressService = require("../../services/user/addressService");
const { addressZodSchema } = require("../../validations/addressValidation");
async function renderAddress(req, res) {
  try {
    const user = await addressService.getUserById(req.session.userId);
    const addresses = await addressService.getUserAddresses(req.session.userId);

    res.render("user/profile/addressDetails", { user,addresses});
  } catch {
    console.error("Internal Error:", error);
    req.session.message = {
      type: "error",
      text: "Something went wrong",
    };
    return res.redirect("/");
  }
}
async function addAddress(req, res) {
  try {
    const userId = req.session.userId;
    const validatedData = addressZodSchema.parse(req.body);
    await addressService.addAddress(userId, validatedData);
    return res.json({
      success: true,
      message: "Address added successfully",
    });
  } catch (error) {
    if (error.name === "ZodError") {
      return res.json({
        success: false,
        message: error.errors[0].message,
      });
    }
    return res.json({
      success: false,
      message: error.message || "Something went wrong",
    });
  }
}
async function updateAddress(req, res) {
  try {
    const userId = req.session.userId;
    const addressId = req.params.id;
    const validatedData = addressZodSchema.parse(req.body);
    await addressService.updateAddress(userId, addressId, validatedData);
    return res.json({
      success: true,
      message: "Address updated successfully",
    });
  } catch (error) {
    return res.json({
      success: false,
      message: error.message,
    });
  }
}
async function deleteAddress(req, res) {
  try {
    const userId = req.session.userId;
    const addressId = req.params.id;
    await addressService.deleteAddress(userId, addressId);
    return res.json({
      success: true,
      message: "Address deleted successfully",
    });
  } catch (error) {
    return res.json({
      success: false,
      message: error.message,
    });
  }
}

module.exports = { renderAddress, addAddress, updateAddress, deleteAddress };
