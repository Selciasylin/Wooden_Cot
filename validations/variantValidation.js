const { z } = require("zod");

const optionSchema = z.object({

  value: z
    .string()
    .trim()
    .min(1, "Option value is required")
    .max(50, "Option value too long")

});

const variantZodSchema = z.object({

  type: z
    .string()
    .trim()
    .min(2, "Variant type is required")
    .max(50, "Variant type too long"),

  options: z
    .array(optionSchema)
    .min(1, "At least one option is required")

});

module.exports = {
  variantZodSchema
};