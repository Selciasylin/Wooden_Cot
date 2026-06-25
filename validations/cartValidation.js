const { z } = require("zod");

const addCartSchema = z.object({

  productId: z
  .string()
  .min(1, "Product id is required"),

  variantId: z.
  string().
  nullable().
  optional(),
});

// Used in updateQuantity controller
const updateCartSchema = z.object({

  cartItemId: z
  .string()
  .min(1, "Cart item id is required"),

  action: z
  .enum(["increment", "decrement"], {
    errorMap: () => ({ message: "Action must be increment or decrement" }),
  }),
  
});

module.exports = { addCartSchema, updateCartSchema };