const Order = require("../../model/orderSchema");
const Cart = require("../../model/cartSchema");
const Product = require("../../model/productSchema");
const Address = require("../../model/addressSchema");
const Variant = require("../../model/variantSchema");
const User = require("../../model/userSchema");
const appError = require("../../utils/appError");

const SHIPPING_COST = 100;

// Reusable helper — get user by ID
async function getUser(userId) {
  return await User.findById(userId).lean();
}

// Generate a unique readable order id — e.g. ORD-20260710-4831
function generateOrderId() {
  const date = new Date().toISOString().slice(0, 10).replace(/-/g, "");
  const random = Math.floor(1000 + Math.random() * 9000);
  return `ORD-${date}-${random}`;
}

// Add quantity back to a variant's stock — used on cancellation
async function restockVariant(productId, variantId, quantity) {
  await Product.updateOne(
    { _id: productId, "variants._id": variantId },
    { $inc: { "variants.$.quantity": quantity } }
  );
}

// ───────── PLACE ORDER (COD) ─────────
async function placeOrder(userId, addressId, paymentMethod) {
  // 1. Get cart with live product data
  const cart = await Cart.findOne({ userId })
    .populate({ path: "products.productId" })
    .lean();

  if (!cart || cart.products.length === 0) {
    throw new appError("Your cart is empty", 400);
  }

  // 2. Verify the address belongs to this user
  const address = await Address.findOne({ _id: addressId, userId }).lean();
  if (!address) {
    throw new appError("Delivery address not found", 404);
  }

  const variantsData = await Variant.find({ isDeleted: false }).lean();

  // 3. Validate every item against LIVE stock and build order items
  const orderItems = [];

  for (const item of cart.products) {
    const product = item.productId;

    if (!product || product.isDeleted || !product.isListed) {
      throw new appError(
        "Some products in your cart are no longer available",
        400
      );
    }

    const variant = product.variants.find(
      (v) => v._id.toString() === item.variantId.toString()
    );

    if (!variant) {
      throw new appError(
        `Selected variant of "${product.name}" is no longer available`,
        400
      );
    }

    // Live stock check — stock may have reduced after adding to cart
    if (variant.quantity < item.quantity) {
      throw new appError(
        `Only ${variant.quantity} left in stock for "${product.name}"`,
        400
      );
    }

    // Convert option IDs → readable names (e.g. "Queen", "White") for snapshot
    const optionNames = variant.options.map((optionId) => {
      for (const variantType of variantsData) {
        const found = variantType.options.find(
          (opt) => opt._id.toString() === optionId.toString()
        );
        if (found) return found.value;
      }
      return optionId.toString();
    });

    orderItems.push({
      productId: product._id,
      variantId: variant._id,
      productName: product.name,
      image: product.images[0],
      variantOptions: optionNames,
      price: variant.price,
      quantity: item.quantity,
      itemTotal: variant.price * item.quantity,
    });
  }

  // 4. Calculate totals
  const subtotal = orderItems.reduce((total, i) => total + i.itemTotal, 0);
  const shippingCost = SHIPPING_COST;
  const totalAmount = subtotal + shippingCost;

  // 5. Create the order (address snapshot copied here)
  const order = await Order.create({
    orderId: generateOrderId(),
    userId,
    items: orderItems,
    shippingAddress: {
      fullName: address.fullName,
      phone: address.phone,
      addressLine1: address.addressLine1,
      addressLine2: address.addressLine2 || "",
      city: address.city,
      state: address.state,
      zip: address.zip,
      country: address.country || "India",
      addressType: address.addressType,
    },
    paymentMethod,
    paymentStatus: "Pending", // COD — paid on delivery
    subtotal,
    shippingCost,
    totalAmount,
  });

  // 6. Decrement stock for every ordered item (variant level, atomic)
  for (const item of orderItems) {
    await Product.updateOne(
      { _id: item.productId, "variants._id": item.variantId },
      { $inc: { "variants.$.quantity": -item.quantity } }
    );
  }

  // 7. Clear the cart
  await Cart.updateOne({ userId }, { $set: { products: [] } });

  return order;
}

// ───────── GET ORDERS (search + pagination) ─────────
async function getOrders(userId, search, page, limit) {
  const query = { userId };

  if (search) {
    query.orderId = { $regex: search, $options: "i" };
  }

  const skip = (page - 1) * limit;

  const orders = await Order.find(query)
    .sort({ createdAt: -1 })
    .skip(skip)
    .limit(limit)
    .lean();

  const total = await Order.countDocuments(query);

  return {
    orders,
    totalPages: Math.ceil(total / limit),
    totalOrders: total,
  };
}

// ───────── GET SINGLE ORDER ─────────
async function getOrderDetails(userId, orderId) {
  // userId in the query = a user can only see their OWN orders
  const order = await Order.findOne({ orderId, userId }).lean();

  if (!order) {
    throw new appError("Order not found", 404);
  }

  return order;
}

// ───────── CANCEL ORDER / ITEM ─────────
// itemId given  → cancel that single item
// itemId null   → cancel the whole order (all items must be Pending)
// Reason is OPTIONAL. Cancelled stock is added back immediately,
// because the product never left the warehouse.
async function cancelOrder(userId, orderId, itemId, reason) {
  const order = await Order.findOne({ orderId, userId });

  if (!order) {
    throw new appError("Order not found", 404);
  }

  if (itemId) {
    // ── Cancel a single item ──
    const item = order.items.id(itemId);

    if (!item) {
      throw new appError("Order item not found", 404);
    }
    if (item.status !== "Pending") {
      throw new appError("Only pending items can be cancelled", 400);
    }

    item.status = "Cancelled";
    item.cancelReason = reason || "";

    await restockVariant(item.productId, item.variantId, item.quantity);
  } else {
    // ── Cancel the whole order ──
    const allPending = order.items.every((i) => i.status === "Pending");
    if (!allPending) {
      throw new appError(
        "Order cannot be cancelled because some items are already processed",
        400
      );
    }

    for (const item of order.items) {
      item.status = "Cancelled";
      item.cancelReason = reason || "";
      await restockVariant(item.productId, item.variantId, item.quantity);
    }

    order.orderStatus = "Cancelled";
  }

  await order.save();
  return order;
}

// ───────── RETURN REQUEST (single item) ─────────
// Only Delivered items can be returned. Reason is MANDATORY.
// This only RAISES a request — status becomes "Return Requested".
// Stock and refund move only after admin approves (admin side),
// because the product is physically with the customer and must
// come back and be verified first.
async function returnOrder(userId, orderId, itemId, reason) {
  const order = await Order.findOne({ orderId, userId });

  if (!order) {
    throw new appError("Order not found", 404);
  }

  const item = order.items.id(itemId);

  if (!item) {
    throw new appError("Order item not found", 404);
  }
  if (item.status !== "Delivered") {
    throw new appError("Only delivered items can be returned", 400);
  }

  item.status = "Return Requested";
  item.returnReason = reason;

  await order.save();
  return order;
}

module.exports = {
  getUser,
  placeOrder,
  getOrders,
  getOrderDetails,
  cancelOrder,
  returnOrder,
};