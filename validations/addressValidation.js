const { z } = require("zod");

const addressZodSchema = z.object({

  fullName: z
    .string()
    .trim()
    .min(3, "Full name must be at least 3 characters")
    .max(100, "Full name is too long"),

  phone: z
    .string()
    .trim()
    .regex(/^[0-9]{10}$/, "Phone number must be 10 digits"),

  addressLine1: z
    .string()
    .trim()
    .min(3, "Address Line 1 is required")
    .max(200, "Address Line 1 is too long"),

  addressLine2: z
    .string()
    .trim()
    .max(200, "Address Line 2 is too long")
    .optional(),

  city: z
    .string()
    .trim()
    .min(2, "City is required")
    .max(100, "City name is too long"),

  state: z
    .string()
    .trim()
    .min(2, "State is required")
    .max(100, "State name is too long"),

  zip: z
    .string()
    .trim()
    .regex(/^[0-9]{6}$/, "ZIP code must be a valid 6 digit pincode"),

  country: z
    .string()
    .trim()
    .default("India"),

  addressType: z.enum(
    ["Home", "Office", "Other"],
    {
      errorMap: () => ({ message: "Invalid address type" })
    }
  ),

  isDefault: z
    .boolean()
    .optional()

});

module.exports = { addressZodSchema };