import {RequestMethod, ResponseMessage} from "./constants";
import zod, {ZodSchema, z} from "zod";

const uniqueArray = <T>(array: T[]) => {
    return new Set(array).size === array.length;
};

const attributeTypeSchema = zod
    .object({
        typeValue: zod
            .string()
            .trim()
            .refine((value) => value !== "", {
                message: ResponseMessage.BLANK_INPUT,
            }),
    })
    .strict();

const attributeOptionSchema = zod
    .object({
        optionValue: zod
            .string()
            .trim()
            .refine((value) => value !== "", {
                message: ResponseMessage.BLANK_INPUT,
            }),
    })
    .strict();

const providerSchema = zod
    .object({
        providerName: zod
            .string()
            .trim()
            .refine((value) => value !== "", {
                message: ResponseMessage.BLANK_INPUT,
            }),
    })
    .strict();

const categorySchema = zod
    .object({
        categoryName: zod
            .string()
            .trim()
            .refine((value) => value !== "", {
                message: ResponseMessage.BLANK_INPUT,
            }),
    })
    .strict();

const signupSchema = zod
    .object({
        userName: zod
            .string()
            .trim()
            .refine((value) => value !== "", {
                message: ResponseMessage.BLANK_INPUT,
            }),
        email: zod
            .string()
            .trim()
            .refine((value) => value !== "", {
                message: ResponseMessage.BLANK_INPUT,
            }),
        password: zod
            .string()
            .trim()
            .refine((value) => value !== "", {
                message: ResponseMessage.BLANK_INPUT,
            }),
    })
    .strict();

const loginSchema = zod
    .object({
        email: zod
            .string()
            .trim()
            .refine((value) => value !== "", {
                message: ResponseMessage.BLANK_INPUT,
            }),
        password: zod
            .string()
            .trim()
            .refine((value) => value !== "", {
                message: ResponseMessage.BLANK_INPUT,
            }),
    })
    .strict();

const userUpdateSchema = zod
    .object({
        email: zod
            .string()
            .trim()
            .refine((value) => value !== "", {
                message: ResponseMessage.BLANK_INPUT,
            })
            .optional(),
        userName: zod
            .string()
            .trim()
            .refine((value) => value !== "", {
                message: ResponseMessage.BLANK_INPUT,
            })
            .optional(),
        phoneNumber: zod
            .string()
            .trim()
            .refine((value) => value !== "", {
                message: ResponseMessage.BLANK_INPUT,
            })
            .optional(),
        avatar: zod
            .string()
            .trim()
            .refine((value) => value !== "", {
                message: ResponseMessage.BLANK_INPUT,
            })
            .optional(),
        isBanned: zod
            .string()
            .trim()
            .refine((value) => value !== "", {
                message: ResponseMessage.BLANK_INPUT,
            })
            .optional(),
    })
    .strict();

const productItemSchema = zod
    .object({
        thump: zod
            .string()
            .trim()
            .refine((value) => value !== "", {
                message: ResponseMessage.BLANK_INPUT,
            }),
        quantity: zod.number(),
        price: zod.number(),
        productCode: zod
            .string()
            .trim()
            .refine((value) => value !== "", {
                message: ResponseMessage.BLANK_INPUT,
            }),
        discount: zod.number(),
        color: zod
            .string()
            .trim()
            .refine((value) => value !== "", {
                message: ResponseMessage.BLANK_INPUT,
            }),
        storage: zod
            .string()
            .trim()
            .refine((value) => value !== "", {
                message: ResponseMessage.BLANK_INPUT,
            })
            .optional(),
        itemImages: zod
            .array(
                zod
                    .string()
                    .trim()
                    .refine((value) => value !== "", {
                        message: ResponseMessage.BLANK_INPUT,
                    })
            )
            .refine((value) => value.length !== 0, {
                message: "itemImages cannot be empty",
            }),
    })
    .strict();

const productSchema = zod
    .object({
        productName: zod
            .string()
            .trim()
            .refine((value) => value !== "", {
                message: ResponseMessage.BLANK_INPUT,
            }),
        description: zod
            .string()
            .trim()
            .refine((value) => value !== "", {
                message: ResponseMessage.BLANK_INPUT,
            })
            .optional(),
        length: zod.number(),
        width: zod.number(),
        height: zod.number(),
        weight: zod.number(),
        warranty: zod.number(),
        categoryID: zod
            .string()
            .trim()
            .refine((value) => value !== "", {
                message: ResponseMessage.BLANK_INPUT,
            }),
        providerID: zod
            .string()
            .trim()
            .refine((value) => value !== "", {
                message: ResponseMessage.BLANK_INPUT,
            }),
        options: zod
            .array(
                zod
                    .string()
                    .trim()
                    .refine((value) => value !== "", {
                        message: ResponseMessage.BLANK_INPUT,
                    })
            )
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

export type AttributeTypeRequest = z.infer<typeof attributeTypeSchema>;

export type AttributeOptionRequest = z.infer<typeof attributeOptionSchema>;

export type ProviderRequest = z.infer<typeof providerSchema>;

export type CategoryRequest = z.infer<typeof categorySchema>;

export type SignupRequest = z.infer<typeof signupSchema>;

export type LoginRequest = z.infer<typeof loginSchema>;

export type UserUpdateRequest = z.infer<typeof userUpdateSchema>;

export type ProductRequest = z.infer<typeof productSchema>;

export type ProductItemRequest = z.infer<typeof productItemSchema>;

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
