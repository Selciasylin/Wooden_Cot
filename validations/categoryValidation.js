const { z } = require("zod");

const categoryZodSchema = z.object({

    name: z
        .string()
        .min(2, "Category name must be at least 2 characters")
        .max(50, "Category name too long")
        .trim(),

    description: z
        .string()
        .min(5, "Description must be at least 5 characters")
        .max(300, "Description too long")
        .trim(),

    image: z
        .string()
        .min(1, "Image is required")

});

module.exports = {
    categoryZodSchema
};