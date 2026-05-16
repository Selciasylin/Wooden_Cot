const { z } = require("zod");

const productVariantSchema = z.object({

  options: z
    .array(z.string())
    .min(1, "Select at least one variant option"),

  quantity: z
    .coerce
    .number()
    .min(0, "Quantity cannot be negative"),

  price: z
    .coerce
    .number()
    .positive("Price must be greater than 0")

});

const productZodSchema = z.object({

  name: z
    .string()
    .trim()
    .min(3, "Product name must be at least 3 characters")
    .max(100, "Product name too long"),

  category: z
    .string()
    .min(1, "Category is required"),

  description: z
    .string()
    .trim()
    .min(10, "Description must be at least 10 characters")
    .max(1000, "Description too long"),

  variants: z
    .array(productVariantSchema)
    .min(1, "At least one product variant is required"),

  images: z
    .array(z.string())
    .min(1, "At least one image is required")
    .max(4, "Maximum 4 images allowed")

});

module.exports = {
  productZodSchema
};