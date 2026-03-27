const { z } = require("zod");

const sizeZodSchema = z.object({

    size: z.enum(["single", "queen", "king"]),

    quantity: z
        .coerce.number()
        .min(0, "Quantity must be 0 or more"),

    price: z
        .coerce.number()
        .min(0, "Price must be greater than 0")

});

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