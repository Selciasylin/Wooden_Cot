const checkoutService = require("../../services/user/checkoutService");
const { addressZodSchema } = require("../../validations/addressValidation");

// Render the checkout page
async function renderCheckout(req, res) {
  try {
    const user = await checkoutService.getUser(req.session.userId);
    res.render("user/profile/checkout", { user });
  } catch (error) {
    console.error("Internal Error:", error);
    req.session.message = { type: "error", text: "Something went wrong" };
    return res.redirect("/");
  }
}

// GET /checkout/data — addresses + cart summary
async function getCheckoutData(req, res) {
  try {
    const result = await checkoutService.getCheckoutData(req.session.userId);
    return res.json({ status: "SUCCESS", ...result });
  } catch (error) {
    console.error("Internal Error:", error);
    return res.json({ status: "ERROR", message: "Something went wrong" });
  }
}

// POST /checkout/address — add address from checkout page
async function addAddress(req, res) {
  try {
    const userId = req.session.userId;

    // Convert isDefault string to boolean if needed
    if (req.body.isDefault !== undefined) {
      req.body.isDefault = req.body.isDefault === "true" || req.body.isDefault === true;
    }

    const validatedData = addressZodSchema.parse(req.body);
    const address = await checkoutService.addAddress(userId, validatedData);

    return res.json({ status: "SUCCESS", message: "Address added successfully", address });
  } catch (error) {
    if (error.name === "ZodError") {
      const messages = error.errors.map((e) => e.message).join(", ");
      return res.json({ status: "ERROR", message: messages });
    }
    if (error.isOperational) {
      return res.json({ status: "ERROR", message: error.message });
    }
    console.error("Internal Error:", error);
    return res.json({ status: "ERROR", message: "Something went wrong" });
  }
}

async function updateAddress(req,res){
  try{

    const userId = req.session.userId;
    const addressId = req.params.id;

    const validatedData =
      addressZodSchema.parse(req.body);

    await checkoutService.updateAddress(
      userId,
      addressId,
      validatedData
    );

    return res.json({
      status:"SUCCESS",
      message:"Address updated"
    });

  }catch(error){
     return res.json({
       status:"ERROR",
       message:error.message
     });
  }
}

async function deleteAddress(req,res){

  try{

    const userId = req.session.userId;

    await checkoutService.deleteAddress(
      userId,
      req.params.id
    );

    return res.json({
      status:"SUCCESS",
      message:"Address deleted"
    });

  }catch(error){

    return res.json({
      status:"ERROR",
      message:error.message
    });
  }
}

module.exports = {
  renderCheckout,
  getCheckoutData,
  addAddress,
  updateAddress,
  deleteAddress,
};