const { z } = require("zod");

const variantSchema = z.object({
  quantity: z.coerce.number().min(0),
  price: z.coerce.number().min(0)
});

const sizeZodSchema = z.object({
  size: z.enum(["single", "queen", "king"]),
  variants: z.object({
    withDrawer: variantSchema.optional(),
    withoutDrawer: variantSchema.optional()
  })
}).refine((data) => {
  return (
    (data.variants.withDrawer?.price > 0 && data.variants.withDrawer?.quantity >= 0) ||
    (data.variants.withoutDrawer?.price > 0 && data.variants.withoutDrawer?.quantity >= 0)
  );
}, {
  message: "At least one variant must have valid price & quantity"
});

// Product schema
const productZodSchema = z.object({
  name: z
    .string()
    .min(3, "Product name must be at least 3 characters")
    .max(100, "Product name too long")
    .trim(),

  category: z
    .string()
    .min(1, "Category is required"),

  description: z
    .string()
    .min(10, "Description must be at least 10 characters")
    .max(1000, "Description too long")
    .trim(),

  sizes: z
    .array(sizeZodSchema)
    .min(1, "Select at least one size"),

  images: z
    .array(z.string())
    .min(1, "At least one image required")
    .max(4, "Maximum 4 images allowed")
});

module.exports = {
  productZodSchema
};