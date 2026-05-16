const mongoose = require("mongoose");

const optionSchema = new mongoose.Schema({

  value: {
    type: String,
    required: true,
    trim: true
  },

  isListed: {
    type: Boolean,
    default: true
  },

  isDeleted: {
    type: Boolean,
    default: false
  }

}, { timestamps: true });


const variantSchema = new mongoose.Schema({

  type: {
    type: String,
    required: true,
    trim: true,
    unique: true
  },

  options: [optionSchema],

  isListed: {
    type: Boolean,
    default: true
  },

  isDeleted: {
    type: Boolean,
    default: false
  }

}, { timestamps: true });

module.exports = mongoose.model(
  "Variant",
  variantSchema
);