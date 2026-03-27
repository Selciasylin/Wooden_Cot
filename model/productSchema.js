const mongoose = require("mongoose");

const sizeSchema = new mongoose.Schema({
    size: {
        type: String,
        enum: ["single", "queen", "king"],
        required: true
    },
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

const productSchema = new mongoose.Schema({
    name: {
        type: String,
        required: true,
        trim: true
    },
    category: {
        type: String,
        required: true
    },
    description: {
        type: String,
        required: true
    },
    sizes: [sizeSchema],

    images: {
        type: [String], // store image URLs
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