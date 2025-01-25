import {RequestMethod, ResponseMessage} from "./constants";
import zod, {ZodSchema, z} from "zod";

const blankCheck = () =>
    zod
        .string()
        .trim()
        .refine((value) => value !== "", {
            message: ResponseMessage.BLANK_INPUT,
        });

const attributeTypeSchema = zod
    .object({
        typeValue: blankCheck(),
    })
    .strict();

const attributeOptionSchema = zod
    .object({
        optionValue: blankCheck(),
    })
    .strict();

const providerSchema = zod
    .object({
        providerName: blankCheck(),
    })
    .strict();

const categorySchema = zod
    .object({
        categoryName: blankCheck(),
    })
    .strict();

const signupSchema = zod
    .object({
        userName: blankCheck(),
        email: blankCheck(),
        password: blankCheck(),
        phoneNumber: blankCheck().optional(),
        avatar: blankCheck().optional(),
    })
    .strict();

const loginSchema = zod
    .object({
        email: blankCheck(),
        password: blankCheck(),
    })
    .strict();

const userUpdateSchema = zod
    .object({
        email: blankCheck().optional(),
        userName: blankCheck().optional(),
        phoneNumber: blankCheck().optional(),
        avatar: blankCheck().optional(),
        isBanned: zod.boolean().optional(),
    })
    .strict();

const passwordUpdateSchema = zod
    .object({
        oldPassword: blankCheck(),
        newPassword: blankCheck(),
    })
    .strict();

const productItemSchema = zod
    .object({
        thump: blankCheck(),
        quantity: zod.number(),
        price: zod.number(),
        productCode: blankCheck(),
        discount: zod.number(),
        color: blankCheck(),
        storage: blankCheck().optional(),
        itemImages: zod
            .array(blankCheck())
            .refine((value) => value.length !== 0, {
                message: "itemImages cannot be empty",
            }),
    })
    .strict();

const productSchema = zod
    .object({
        productName: blankCheck(),
        description: blankCheck().optional(),
        length: zod.number(),
        width: zod.number(),
        height: zod.number(),
        weight: zod.number(),
        warranty: zod.number(),
        categoryID: blankCheck(),
        providerID: blankCheck(),
        options: zod
            .array(blankCheck())
            .refine((value) => value.length !== 0, {
                message: "options cannot be empty",
            })
            .optional(),
        productItems: zod
            .array(productItemSchema)
            .refine((value) => value.length !== 0, {
                message: "productItems cannot be empty",
            }),
    })
    .strict();

const orderProductSchema = zod.object({
    productID: blankCheck(),
    itemID: blankCheck(),
    quantity: zod.number(),
});

const orderUpdateSchema = zod.object({
    status: zod.string().optional(),
    paymentID: zod.string().optional(),
    payment: zod.string().optional(),
});

const orderSchema = zod.object({
    district: blankCheck(),
    ward: blankCheck(),
    province: blankCheck(),
    phoneNumber: blankCheck(),
    detailAddress: blankCheck(),
    email: blankCheck(),
    userID: blankCheck(),
    note: z.string().optional(),
    shippingFee: z.number().optional(),
    shippingTime: z.number().optional(),
    invoiceProducts: z
        .array(orderProductSchema)
        .refine((value) => value.length !== 0, {
            message: "orderProducts cannot be empty",
        }),
});

const reviewCreationSchema = zod.object({
    reviewContent: blankCheck(),
    rating: zod.number().nullable(),
    productID: blankCheck(),
    userID: blankCheck(),
    parentID: blankCheck().nullable(),
});

const slidesUpdateSchema = zod.array(
    zod.object({
        url: blankCheck(),
        ref: blankCheck().nullable(),
        index: zod.number().min(1),
    })
);

const bannerUpdateSchema = zod.object({
    newBanner: zod.string().nullable(),
    position: zod.string(),
});

const reviewDeletionSchema = zod.object({
    reviewID: blankCheck(),
});

const storeUpdateSchema = zod.object({
    storeName: blankCheck(),
    description: zod.string().nullable(),
    address: zod.string().nullable(),
    phoneNumber: zod.string().nullable(),
    email: zod.string().nullable(),
});

const banUserSchema = zod.object({
    userID: blankCheck(),
    banned: zod.boolean(),
});

const signupForNotificationSchema = zod
    .object({
        email: z.string().email(),
    })
    .strict();

export type AttributeTypeRequest = z.infer<typeof attributeTypeSchema>;

export type AttributeOptionRequest = z.infer<typeof attributeOptionSchema>;

export type ProviderRequest = z.infer<typeof providerSchema>;

export type CategoryRequest = z.infer<typeof categorySchema>;

export type SignupRequest = z.infer<typeof signupSchema>;

export type LoginRequest = z.infer<typeof loginSchema>;

export type UserUpdateRequest = z.infer<typeof userUpdateSchema>;

export type PasswordUpdateRequest = z.infer<typeof passwordUpdateSchema>;

export type UserBanningRequest = z.infer<typeof banUserSchema>;

export type ProductRequest = z.infer<typeof productSchema>;

export type ProductItemRequest = z.infer<typeof productItemSchema>;

export type OrderProductRequest = z.infer<typeof orderProductSchema>;

export type OrderRequest = z.infer<typeof orderSchema>;

export type ReviewCreationRequest = z.infer<typeof reviewCreationSchema>;

export type ReviewDeletionRequest = z.infer<typeof reviewDeletionSchema>;

export type SlidesUpdateRequest = z.infer<typeof slidesUpdateSchema>;

export type BannerUpdateRequest = z.infer<typeof bannerUpdateSchema>;

export type OrderUpdateRequest = z.infer<typeof orderUpdateSchema>;

export type SignupForNotification = z.infer<typeof signupForNotificationSchema>;

export default {
    ["/attributes"]: {
        [RequestMethod.POST]: attributeTypeSchema,
    },
    ["/attributes/:typeID"]: {
        [RequestMethod.PUT]: attributeTypeSchema,
    },
    ["/attributes/:typeID/options"]: {
        [RequestMethod.POST]: attributeOptionSchema,
    },
    ["/attributes/:typeID/options/:optionID"]: {
        [RequestMethod.PUT]: attributeOptionSchema,
    },
    ["/providers"]: {
        [RequestMethod.POST]: providerSchema,
    },
    ["/providers/:id"]: {
        [RequestMethod.PUT]: providerSchema,
    },
    ["/categories"]: {
        [RequestMethod.POST]: categorySchema,
    },
    ["/categories/:id"]: {
        [RequestMethod.PUT]: categorySchema,
    },
    ["/users/signup"]: {
        [RequestMethod.POST]: signupSchema,
    },
    ["/users/login"]: {
        [RequestMethod.POST]: loginSchema,
    },
    ["/users/:id"]: {
        [RequestMethod.PUT]: userUpdateSchema,
    },
    ["/users/:id/password"]: {
        [RequestMethod.PATCH]: passwordUpdateSchema,
    },
    ["/products"]: {
        [RequestMethod.POST]: productSchema,
    },
    ["/products/:id"]: {
        [RequestMethod.PUT]: productSchema,
    },
    ["/invoices"]: {
        [RequestMethod.POST]: orderSchema,
    },
    ["/invoices/:id"]: {
        [RequestMethod.PATCH]: orderUpdateSchema,
    },
    ["/stores/:id/slides"]: {
        [RequestMethod.PATCH]: slidesUpdateSchema,
    },
    ["/stores/:id/banners"]: {
        [RequestMethod.PATCH]: bannerUpdateSchema,
    },
    ["/stores/:id"]: {
        [RequestMethod.PUT]: storeUpdateSchema,
    },
    ["/notification"]: {
        [RequestMethod.POST]: signupForNotificationSchema,
    },
    ["review"]: {
        ["create"]: reviewCreationSchema,
        ["delete"]: reviewDeletionSchema,
    },
    ["user"]: {
        ["ban"]: banUserSchema,
    },
} as {[key: string]: {[method: string]: ZodSchema}};
