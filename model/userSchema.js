const mongoose = require("mongoose");

const userSchema = new mongoose.Schema({

    firstName: {
        type: String,
        required: true,
        trim: true
    },

    lastName: {
        type: String,
        required: true,
        trim: true
    },

    email: {
        type: String,
        required: true,
        unique: true,
        lowercase: true,
        trim: true
    },

    phoneNumber: {
        type: String,
        required: true
    },

    referralCode: {
        type: String,
        trim: true,
        default: null
    },

    password: {
        type: String,
        required: true
    },

    profileImage: {
        type: String,
    },

    googleId: {
    type: String,
    },
    
    isVerified:{
    type: Boolean,
    default: false
    },

    isBlocked: {
    type: Boolean,
    default: false,
    },
},
{ timestamps: true });

module.exports = mongoose.model("User", userSchema);
