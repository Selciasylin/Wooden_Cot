const mongoose = require("mongoose");

const otpSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
    required: true
  },
  otp: {
    type: String,
    required: true
  },
  otpPurpose: {
    type: String, // signup / forgotPassword / changeEmail
    required: true
  },
  otpExpiry: {
    type: Date,
    required: true
  },
  newEmail: {
    type: String, // only used when otpPurpose === "changeEmail"
    default: null
  }
}, { timestamps: true });

module.exports = mongoose.model("Otp", otpSchema);