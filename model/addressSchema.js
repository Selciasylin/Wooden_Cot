const mongoose = require("mongoose");

const addressSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
    required: true
  },

  fullName: {
    type: String,
    required: true,
    trim: true
  },

  phone: {
    type: String,
    required: true,
    match: /^[0-9]{10}$/   // Indian 10-digit number
  },

  addressLine1: {
    type: String,
    required: true,
    trim: true
  },

  addressLine2: {
    type: String,
    trim: true
  },

  city: {
    type: String,
    required: true,
    trim: true
  },

  state: {
    type: String,
    required: true
  },

  zip: {
    type: String,
    required: true,
    match: /^[0-9]{6}$/   // Indian pincode
  },

  country: {
    type: String,
    default: "India"
  },

  addressType: {
    type: String,
    enum: ["Home", "Office", "Other"],
    required: true
  },

  isDefault: {
    type: Boolean,
    default: false
  }

}, { timestamps: true });

module.exports = mongoose.model("Address", addressSchema);