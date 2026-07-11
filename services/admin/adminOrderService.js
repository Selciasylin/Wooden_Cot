const Order = require("../../model/orderSchema");
const Product = require("../../model/productSchema");
const User = require("../../model/userSchema");
const appError = require("../../utils/appError");


const FORWARD_FLOW = ["Pending", "Shipped", "Out for Delivery"];


async function restockVariant(productId, variantId, quantity) {
  await Product.updateOne(
    { _id: productId, "variants._id": variantId },
    { $inc: { "variants.$.quantity": quantity } }
  );
}

//GET ORDERS (search + filter + sort + pagination)
async function getOrders(search, status, sort, page, limit) {
  const query = {};
  if (search) {
    const users = await User.find({
      $or: [
        { firstName: { $regex: search, $options: "i" } },
        { lastName: { $regex: search, $options: "i" } },
        { email: { $regex: search, $options: "i" } },
      ],
    })
      .select("_id")
      .lean();

    const userIds = users.map((u) => u._id);

    query.$or = [
      { orderId: { $regex: search, $options: "i" } },
      { userId: { $in: userIds } },
    ];
  }
  if (status) {
    query["items.status"] = status;
  }

  let sortOption = { createdAt: -1 };
  if (sort === "oldest") sortOption = { createdAt: 1 };
  if (sort === "amount_high") sortOption = { totalAmount: -1 };
  if (sort === "amount_low") sortOption = { totalAmount: 1 };

  const skip = (page - 1) * limit;

  const orders = await Order.find(query)
    .populate("userId", "firstName lastName email")
    .sort(sortOption)
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
async function getOrderDetails(orderId) {
  const order = await Order.findOne({ orderId })
    .populate("userId", "firstName lastName email phoneNumber")
    .lean();

  if (!order) {
    throw new appError("Order not found", 404);
  }

  return order;
}

function deriveOrderStatus(items) {
  const DELIVERED_STAGE = ["Delivered", "Return Requested", "Returned", "Return Rejected"];
  const statuses = items.map((i) => i.status);
  if (statuses.every((s) => s === "Cancelled")) return "Cancelled";
  const active = statuses.filter((s) => s !== "Cancelled");
  if (active.length === 0) return "Cancelled";
  if (active.every((s) => s === "Returned")) return "Returned";
  if (active.every((s) => DELIVERED_STAGE.includes(s))) return "Delivered";
  if (active.every((s) => s === "Out for Delivery")) return "Out for Delivery";
  if (active.every((s) => s === "Shipped" || s === "Out for Delivery")) return "Shipped";
  if (active.some((s) => DELIVERED_STAGE.includes(s))) return "Partially Delivered";
  if (active.some((s) => s === "Shipped" || s === "Out for Delivery")) return "Partially Shipped";
  return "Pending";
}

// ───────── UPDATE SINGLE ITEM STATUS ─────────
async function updateOrderStatus(orderId, itemId, newStatus) {
  const order = await Order.findOne({ orderId });
  if (!order) throw new appError("Order not found", 404);

  const item = order.items.id(itemId);
  if (!item) throw new appError("Order item not found", 404);

  if (!FORWARD_FLOW.includes(item.status)) {
    throw new appError("This item cannot be updated further", 400);
  }

  if (newStatus === "Cancelled") {
    item.status = "Cancelled";
    item.cancelReason = "Cancelled by admin";
    await restockVariant(item.productId, item.variantId, item.quantity);
  } else {
    item.status = newStatus;
    if (newStatus === "Delivered" && order.paymentMethod === "COD") {
      order.paymentStatus = "Paid";
    }
  }

  order.orderStatus = deriveOrderStatus(order.items); // overall status auto re-derive
  await order.save();
  return order;
}

async function handleReturn(orderId, itemId, action) {
  const order = await Order.findOne({ orderId });

  if (!order) {
    throw new appError("Order not found", 404);
  }

  const item = order.items.id(itemId);

  if (!item) {
    throw new appError("Order item not found", 404);
  }
  if (item.status !== "Return Requested") {
    throw new appError("This item has no pending return request", 400);
  }

  if (action === "approve") {
    item.status = "Returned";
    await restockVariant(item.productId, item.variantId, item.quantity);
  } else {
    item.status = "Return Rejected";
  }

  await order.save();
  return order;
}

module.exports = {
  getOrders,
  getOrderDetails,
  updateOrderStatus,
  handleReturn,
};