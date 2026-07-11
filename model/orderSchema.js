const mongoose = require("mongoose");

const orderSchema = new mongoose.Schema({

    orderId:{
        type:String,
        unique:true,
        required:true
    },

    userId:{
        type:mongoose.Schema.Types.ObjectId,
        ref:"User",
        required:true
    },

    // Snapshot of ordered items — name/price copied at order time,
    // so future admin edits never change past orders
    items:[
        {
            productId:{
                type:mongoose.Schema.Types.ObjectId,
                ref:"Product",
                required:true
            },

            variantId:{
                type:mongoose.Schema.Types.ObjectId,
                required:true
            },

            productName:{
                type:String,
                required:true
            },

            image:{
                type:String
            },

            variantOptions:[
                {
                    type:String
                }
            ],

            price:{
                type:Number,
                required:true
            },

            quantity:{
                type:Number,
                required:true
            },

            itemTotal:{
                type:Number,
                required:true
            },

            // Per-item status — each item can be shipped/cancelled/returned separately
           status: {
            type: String,
            enum: [
                "Pending",
                "Shipped",
                "Out for Delivery",
                "Partially Shipped",
                "Delivered",
                "Partially Delivered",
                "Cancelled",
                "Returned",
            ],
            default: "Pending",
            },

            cancelReason:{
                type:String,
                default:""
            },

            returnReason:{
                type:String,
                default:""
            }
        }
    ],

    // Snapshot of delivery address — copied, not referenced,
    // so editing/deleting the address later never affects this order
    shippingAddress:{
        fullName:String,
        phone:String,
        addressLine1:String,
        addressLine2:String,
        city:String,
        state:String,
        zip:String,
        country:String,
        addressType:String
    },

    paymentMethod:{
        type:String,
        enum:["COD","RAZORPAY","WALLET"],
        default:"COD"
    },

    paymentStatus:{
        type:String,
        enum:["Pending","Paid","Failed","Refunded"],
        default:"Pending"
    },

    subtotal:{
        type:Number,
        required:true
    },

    shippingCost:{
        type:Number,
        default:0
    },

    discount:{
        type:Number,
        default:0
    },

    totalAmount:{
        type:Number,
        required:true
    },

    orderStatus:{
        type:String,
        enum:["Pending","Shipped","Out for Delivery","Partially Shipped","Delivered","Partially Delivered","Cancelled","Returned"],
        default:"Pending"
    }

},{
    timestamps:true
});

module.exports = mongoose.model("Order",orderSchema);