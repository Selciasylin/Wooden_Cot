const User = require("../../model/userSchema");
const Address = require("../../model/addressSchema");
const cartService = require("./cartService");
const appError = require("../../utils/appError");
 

const SHIPPING_COST = 100;

// Reusable helper
async function getUser(userId) {
  return await User.findById(userId).lean();
}

// Get addresses + cart summary for checkout page
async function getCheckoutData(userId) {
  const [addresses, cartData] = await Promise.all([
    Address.find({ userId }).sort({ isDefault: -1, createdAt: -1 }).lean(),
    cartService.getCartProducts(userId),
  ]);

  const subtotal = cartData.subtotal;
  const shipping = cartData.products.length > 0 ? SHIPPING_COST : 0;
  const total = subtotal + shipping;

  return {
    addresses,
    products: cartData.products,
    totalProducts: cartData.totalProducts,
    subtotal,
    shipping,
    total,
  };
}

// Add address from checkout page — same logic as address page
async function addAddress(userId, data) {
  if (data.isDefault) {
    await Address.updateMany({ userId }, { $set: { isDefault: false } });
  }

  const existingCount = await Address.countDocuments({ userId });
  if (existingCount === 0) {
    data.isDefault = true;
  }

  const address = await Address.create({ userId, ...data });
  return address;
}

async function updateAddress(userId, addressId, data) {
  const address = await Address.findOne({
    _id: addressId,
    userId,
  });
  if (!address) {
    throw new appError("Address not found", 404);
  }
  if (data.isDefault) {
    await Address.updateMany({ userId }, { $set: { isDefault: false } });
  }
  Object.assign(address, data);
  await address.save();
  return address;
}

async function deleteAddress(userId, addressId) {
  const count = await Address.countDocuments({
    userId,
  });

  if (count <= 1) {
    throw new appError("At least one address is required", 400);
  }

  const address = await Address.findOne({
    _id: addressId,
    userId,
  });

  if (!address) {
    throw new appError("Address not found", 404);
  }
  await address.deleteOne();
  return true;
}

 

module.exports = {
  getUser,
  getCheckoutData,
  addAddress,
  updateAddress,
  deleteAddress,
};
