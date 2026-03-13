const User = require("../../model/userSchema");
const Address = require("../../model/addressSchema");
const bcrypt = require("bcryptjs");
const appError = require("../../utils/appError");
async function getUserById(userId) {
  const user = await User.findById(userId).lean();
  if (!user) {
    throw new appError("User not found");
  }
  return user;
}
async function getUserAddresses(userId) {
  const addresses = await Address.find({ userId }).lean();
  return addresses;

}
async function addAddress(userId, data) {
  const address = await Address.create({
    userId,
    ...data,
  });
  return address;
}
async function updateAddress(userId, addressId, data) {
  const address = await Address.findOneAndUpdate(
    { _id: addressId, userId },
    data,
    { new: true },
  );
  if (!address) {
    throw new appError("Address not found");
  }
  return address;
}
async function deleteAddress(userId, addressId) {
  const address = await Address.findOneAndDelete({
    _id: addressId,
    userId,
  });
  if (!address) {
    throw new appError("Address not found");
  }
  return true;
}
module.exports = { getUserById, getUserAddresses, addAddress, updateAddress, deleteAddress };
