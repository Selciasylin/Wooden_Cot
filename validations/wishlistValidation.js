const { z } = require("zod");

const addWishlistSchema = z.object({

    productId: z
    .string()
    .min(1,"Product id is required"),

    variantId: z
    .string()
    .nullable()
    .optional()
});

const wishlistIdSchema = z.object({

    id: z
    .string()
    .min(1,"Wishlist item id is required")

});

module.exports = {
    addWishlistSchema,
    wishlistIdSchema
};