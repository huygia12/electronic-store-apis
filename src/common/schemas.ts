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
        isBanned: blankCheck().optional(),
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

const invoiceProduct = zod.object({
    productID: blankCheck(),
    itemID: blankCheck(),
    quantity: zod.number(),
});

const orderSchema = zod.object({
    city: blankCheck(),
    ward: blankCheck(),
    province: blankCheck(),
    phoneNumber: blankCheck(),
    detailAddress: blankCheck(),
    userID: blankCheck(),
    note: z.string().optional(),
    invoiceProducts: z.array(invoiceProduct),
});

export type AttributeTypeRequest = z.infer<typeof attributeTypeSchema>;

export type AttributeOptionRequest = z.infer<typeof attributeOptionSchema>;

export type ProviderRequest = z.infer<typeof providerSchema>;

export type CategoryRequest = z.infer<typeof categorySchema>;

export type SignupRequest = z.infer<typeof signupSchema>;

export type LoginRequest = z.infer<typeof loginSchema>;

export type UserUpdateRequest = z.infer<typeof userUpdateSchema>;

export type ProductRequest = z.infer<typeof productSchema>;

export type ProductItemRequest = z.infer<typeof productItemSchema>;

export type OrderRequest = z.infer<typeof orderSchema>;

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
    ["/products"]: {
        [RequestMethod.POST]: productSchema,
    },
    ["/products/:id"]: {
        [RequestMethod.PUT]: productSchema,
    },
} as {[key: string]: {[method: string]: ZodSchema}};
