const mongoose = require("mongoose");

// Variant Schema (Drawer Types)
const variantSchema = new mongoose.Schema({
  quantity: {
    type: Number,
    required: true,
    min: 0
  },
  price: {
    type: Number,
    required: true,
    min: 0
  }
}, { _id: false });


// Size Schema
const sizeSchema = new mongoose.Schema({
  size: {
    type: String,
    enum: ["single", "queen", "king"],
    required: true
  },

  variants: {
    withDrawer: {
      type: variantSchema,
      required: false
    },
    withoutDrawer: {
      type: variantSchema,
      required: false
    }
  }

}, { _id: false });


// Product Schema
const productSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    trim: true
  },

  category: {
    type: mongoose.Types.ObjectId,
    ref:"Category",
    required: true
  },

  description: {
    type: String,
    required: true
  },

  sizes: [sizeSchema],

  images: {
    type: [String],
    validate: [arr => arr.length <= 4, "Max 4 images allowed"]
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

module.exports = mongoose.model("Product", productSchema);