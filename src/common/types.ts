import type {
    AttributeOption,
    AttributeType,
    Category,
    ItemImage,
    Product,
    ProductItem,
    Provider,
    userRoles,
} from "@prisma/client";

type Nullable<T> = T | null;

type Optional<T> = T | undefined;

type Attribute = AttributeType & {attributeOptions: AttributeOption[]};

type ProviderType = Provider & {productQuantity: number};

type CategoryType = Category & {
    productQuantity: number;
};

type AttributeOptionType = AttributeOption & {attributeType: AttributeType};

type ProductAttributeType = {
    attributeOption: AttributeOptionType;
};

type ProductItemType = ProductItem & {itemImages: ItemImage[]};

type ProductFullJoin = Product & {
    productAttributes: ProductAttributeType[];
    productItems: ProductItemType[];
};

interface UserDTO {
    userID: string;
    userName: string;
    email: string;
    phoneNumber: Nullable<string>;
    avatar: Nullable<string>;
    isBanned: Nullable<boolean>;
    role: userRoles;
    createdAt: Date;
    updateAt: Date;
    refreshTokensUsed: string[];
}

interface UserResponseDTO {
    userID: string;
    userName: string;
    email: string;
    phoneNumber: Nullable<string>;
    avatar: Nullable<string>;
    isBanned: Nullable<boolean>;
    role: userRoles;
    createdAt: Date;
    updateAt: Date;
}

interface UserInTokenPayload {
    userID: string;
    userName: string;
    email: string;
    avatar: Nullable<string>;
    role: userRoles;
}

interface ZaloPaymentOrder {
    app_id: number;
    app_trans_id: string;
    app_user: string;
    app_time: number; // miliseconds
    item: string; // Json array
    embed_data: string; // Json string
    amount: number;
    description: string;
    bank_code: string;
    mac: string;
    callback_url: string;
}

interface ZaloPaymentResult {
    return_code: number;
    return_message: string;
}

export type {
    Nullable,
    Optional,
    Attribute,
    ProviderType,
    CategoryType,
    UserDTO,
    UserInTokenPayload,
    UserResponseDTO,
    ProductFullJoin,
    ZaloPaymentOrder,
    ZaloPaymentResult,
};
