const orderService = require("../../services/user/orderService");
const { generateInvoice } = require("../../utils/invoicePdf");
const {
  placeOrderSchema,
  cancelOrderSchema,
  returnOrderSchema,
} = require("../../validations/orderValidation");

const ORDERS_PER_PAGE = 5;

// Render the orders list page (skeleton only — data comes via fetch)
async function renderOrders(req, res) {
  try {
    const user = await orderService.getUser(req.session.userId);
    res.render("user/profile/order", { user });
  } catch (error) {
    console.error("Internal Error:", error);
    req.session.message = { type: "error", text: "Something went wrong" };
    return res.redirect("/");
  }
}

// Render the single order page (skeleton only — data comes via fetch)
async function renderOrderDetails(req, res) {
  try {
    const user = await orderService.getUser(req.session.userId);
    res.render("user/profile/orderDetails", { user });
  } catch (error) {
    console.error("Internal Error:", error);
    req.session.message = { type: "error", text: "Something went wrong" };
    return res.redirect("/orders");
  }
}

// GET /orders/data — orders list as JSON (called by orders.js)
async function getOrdersData(req, res) {
  try {
    const page = parseInt(req.query.page) || 1;
    const search = req.query.search || "";

    const result = await orderService.getOrders(
      req.session.userId,
      search,
      page,
      ORDERS_PER_PAGE
    );

    return res.json({
      status: "SUCCESS",
      orders: result.orders,
      totalPages: result.totalPages,
      currentPage: page,
      totalOrders: result.totalOrders,
    });
  } catch (error) {
    console.error("Internal Error:", error);
    return res.json({ status: "ERROR", message: "Something went wrong" });
  }
}

// GET /orders/data/:orderId — single order as JSON (called by orderDetails.js)
async function getOrderDetailsData(req, res) {
  try {
    const order = await orderService.getOrderDetails(
      req.session.userId,
      req.params.orderId
    );

    return res.json({ status: "SUCCESS", order });
  } catch (error) {
    if (error.isOperational) {
      return res.json({ status: "ERROR", message: error.message });
    }
    console.error("Internal Error:", error);
    return res.json({ status: "ERROR", message: "Something went wrong" });
  }
}

// POST /checkout/place-order
async function placeOrder(req, res) {
  try {
    const userId = req.session.userId;

    const validatedData = placeOrderSchema.parse(req.body);

    const order = await orderService.placeOrder(
      userId,
      validatedData.addressId,
      validatedData.paymentMethod
    );

    return res.json({
      status: "SUCCESS",
      message: "Order placed successfully",
      orderId: order.orderId,
    });
  } catch (error) {
    if (error.name === "ZodError") {
      const messages = error.errors.map((e) => e.message).join(", ");
      return res.json({ status: "ERROR", message: messages });
    }
    if (error.isOperational) {
      return res.json({ status: "ERROR", message: error.message });
    }
    console.error("Internal Error:", error);
    return res.json({ status: "ERROR", message: "Something went wrong" });
  }
}

// PATCH /orders/:orderId/cancel — cancel one item or the whole order
async function cancelOrder(req, res) {
  try {
    const validatedData = cancelOrderSchema.parse(req.body);

    await orderService.cancelOrder(
      req.session.userId,
      req.params.orderId,
      validatedData.itemId, // null = whole order
      validatedData.reason
    );

    return res.json({
      status: "SUCCESS",
      message: validatedData.itemId ? "Item cancelled" : "Order cancelled",
    });
  } catch (error) {
    if (error.name === "ZodError") {
      const messages = error.errors.map((e) => e.message).join(", ");
      return res.json({ status: "ERROR", message: messages });
    }
    if (error.isOperational) {
      return res.json({ status: "ERROR", message: error.message });
    }
    console.error("Internal Error:", error);
    return res.json({ status: "ERROR", message: "Something went wrong" });
  }
}

// PATCH /orders/:orderId/return — raise a return request for one item
async function returnOrder(req, res) {
  try {
    const validatedData = returnOrderSchema.parse(req.body);

    await orderService.returnOrder(
      req.session.userId,
      req.params.orderId,
      validatedData.itemId,
      validatedData.reason
    );

    return res.json({
      status: "SUCCESS",
      message: "Return request submitted for review",
    });
  } catch (error) {
    if (error.name === "ZodError") {
      const messages = error.errors.map((e) => e.message).join(", ");
      return res.json({ status: "ERROR", message: messages });
    }
    if (error.isOperational) {
      return res.json({ status: "ERROR", message: error.message });
    }
    console.error("Internal Error:", error);
    return res.json({ status: "ERROR", message: "Something went wrong" });
  }
}

// GET /orders/:orderId/invoice — generate PDF on the fly and download
// This is a direct link (not fetch), so on error we redirect with a
// session message instead of returning JSON
async function downloadInvoice(req, res) {
  try {
    const order = await orderService.getOrderDetails(
      req.session.userId,
      req.params.orderId
    );

    generateInvoice(order, res); // streams PDF straight to the response
  } catch (error) {
    console.error("Internal Error:", error);
    req.session.message = {
      type: "error",
      text: "Could not generate invoice",
    };
    return res.redirect("/orders");
  }
}

module.exports = {
  renderOrders,
  renderOrderDetails,
  getOrdersData,
  getOrderDetailsData,
  placeOrder,
  cancelOrder,
  returnOrder,
  downloadInvoice,
};