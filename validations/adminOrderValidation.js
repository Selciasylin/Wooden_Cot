const { z } = require("zod");

// Used in updateStatus controller
const updateStatusSchema = z.object({
  itemId: z.string().min(1, "Item ID is required"),
  status: z.enum(
    ["Pending", "Shipped", "Out for Delivery", "Delivered", "Cancelled"],
    {
      errorMap: () => ({ message: "Invalid order status" }),
    }
  ),
});

// Used in handleReturn controller
const returnActionSchema = z.object({
  itemId: z.string().min(1, "Order item id is required"),
  action: z.enum(["approve", "reject"], {
    errorMap: () => ({ message: "Action must be approve or reject" }),
  }),
});

module.exports = {
  updateStatusSchema,
  returnActionSchema,
};