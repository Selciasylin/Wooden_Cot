const mongoose = require("mongoose");

const productVariantSchema = new mongoose.Schema(
  {
    options: [{
        type: mongoose.Types.ObjectId,
        required: true,
      }],

    quantity: {
      type: Number,
      required: true,
      min: 0,
    },

    price: {
      type: Number,
      required: true,
      min: 0,
    },
  },
  { _id: false },
);

const productSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
      trim: true,
    },

    category: {
      type: mongoose.Types.ObjectId,
      ref: "Category",
      required: true,
    },

    description: {
      type: String,
      required: true,
    },

    variants: [productVariantSchema],

    images: {
      type: [String],

      validate: [(arr) => arr.length <= 4, "Maximum 4 images allowed"],
    },

    isListed: {
      type: Boolean,
      default: true,
    },

    isDeleted: {
      type: Boolean,
      default: false,
    },
  },
  { timestamps: true },
);

module.exports = mongoose.model("Product", productSchema);
