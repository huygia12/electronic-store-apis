import {
    AttributeOption,
    AttributeType,
    Category,
    ItemImage,
    Product,
    ProductAttribute,
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

type ProductItemType = ProductItem & {itemImages: ItemImage[]};

type ProductFullJoin = Product & {
    productAttributes: ProductAttribute[];
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
};
