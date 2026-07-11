const adminOrderService = require("../../services/admin/adminOrderService");
const {
  updateStatusSchema,
  returnActionSchema,
} = require("../../validations/adminOrderValidation");

const ORDERS_PER_PAGE = 5;

// ───────── RENDER ORDERS PAGE ─────────
async function renderOrders(req, res) {
  try {
    res.render("admin/adminManagement/adminOrders", {
      message: req.session.message || null,
    });
    req.session.message = null;
  } catch (error) {
    console.error(error);
    req.session.message = { type: "error", text: "Something went wrong" };
    res.redirect("/admin/dashboard");
  }
}

// ───────── RENDER SINGLE ORDER PAGE ─────────
async function renderOrderDetails(req, res) {
  try {
    res.render("admin/adminManagement/adminOrderDetails", {
      message: req.session.message || null,
    });
    req.session.message = null;
  } catch (error) {
    console.error(error);
    req.session.message = { type: "error", text: "Something went wrong" };
    res.redirect("/admin/orders");
  }
}

// ───────── GET ORDERS (AJAX) ─────────
async function getOrdersData(req, res) {
  try {
    const search = req.query.search || "";
    const status = req.query.status || "";
    const sort = req.query.sort || "newest";
    const page = parseInt(req.query.page) || 1;

    const result = await adminOrderService.getOrders(
      search,
      status,
      sort,
      page,
      ORDERS_PER_PAGE
    );

    res.json({
      status: "SUCCESS",
      orders: result.orders,
      totalPages: result.totalPages,
      totalOrders: result.totalOrders,
      currentPage: page,
    });
  } catch (error) {
    console.error(error);
    res.json({ status: "ERROR", message: "Failed to load orders" });
  }
}

// ───────── GET SINGLE ORDER (AJAX) ─────────
async function getOrderDetailsData(req, res) {
  try {
    const order = await adminOrderService.getOrderDetails(req.params.orderId);
    res.json({ status: "SUCCESS", order });
  } catch (error) {
    if (error.isOperational) {
      return res.json({ status: "ERROR", message: error.message });
    }
    console.error(error);
    res.json({ status: "ERROR", message: "Something went wrong" });
  }
}

async function updateStatus(req, res) {
  try {
    const validated = updateStatusSchema.parse(req.body); // now needs itemId too

    await adminOrderService.updateOrderStatus(
      req.params.orderId,
      validated.itemId,
      validated.status
    );

    res.json({ status: "SUCCESS", message: `Item marked as ${validated.status}` });
  } catch (error) {
    if (error.name === "ZodError") return res.json({ status: "ERROR", message: error.issues[0].message });
    if (error.isOperational) return res.json({ status: "ERROR", message: error.message });
    console.error(error);
    res.json({ status: "ERROR", message: "Something went wrong" });
  }
}

// ───────── APPROVE / REJECT RETURN ─────────
async function handleReturn(req, res) {
  try {
    const validated = returnActionSchema.parse(req.body);

    await adminOrderService.handleReturn(
      req.params.orderId,
      validated.itemId,
      validated.action
    );

    res.json({
      status: "SUCCESS",
      message:
        validated.action === "approve"
          ? "Return approved and stock updated"
          : "Return request rejected",
    });
  } catch (error) {
    if (error.name === "ZodError") {
      return res.json({ status: "ERROR", message: error.issues[0].message });
    }
    if (error.isOperational) {
      return res.json({ status: "ERROR", message: error.message });
    }
    console.error(error);
    res.json({ status: "ERROR", message: "Something went wrong" });
  }
}

module.exports = {
  renderOrders,
  renderOrderDetails,
  getOrdersData,
  getOrderDetailsData,
  updateStatus,
  handleReturn,
};