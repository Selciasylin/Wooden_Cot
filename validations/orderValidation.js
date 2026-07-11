const { z } = require("zod");

// Used in placeOrder controller
const placeOrderSchema = z.object({

  addressId: z
  .string()
  .min(1, "Delivery address is required"),

  paymentMethod: z
  .enum(["COD"], {
    errorMap: () => ({ message: "Only Cash on Delivery is available now" }),
  }),

});

// Used in cancelOrder controller
// itemId null = cancel the whole order, reason is OPTIONAL for cancel
const cancelOrderSchema = z.object({

  itemId: z
  .string()
  .nullable()
  .optional(),

  reason: z
  .string()
  .optional()
  .default(""),

});

// Used in returnOrder controller
// reason is MANDATORY for return requests
const returnOrderSchema = z.object({

  itemId: z
  .string()
  .min(1, "Order item id is required"),

  reason: z
  .string()
  .trim()
  .min(1, "Return reason is required"),

});

module.exports = {
  placeOrderSchema,
  cancelOrderSchema,
  returnOrderSchema,
};