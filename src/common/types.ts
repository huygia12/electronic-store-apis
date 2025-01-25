import type {
    AttributeOption,
    AttributeType,
    Category,
    Invoice,
    InvoiceProduct,
    ItemImage,
    Product,
    ProductItem,
    Provider,
    Review,
    userRole,
} from "@prisma/client";
import {ReviewCreationRequest} from "./schemas";
import {SocketIOError} from "@/errors/custom-error";

//Attributes
type Attribute = AttributeType & {attributeOptions: AttributeOption[]};

type AttributeOptionType = AttributeOption & {attributeType: AttributeType};

type ProductAttributeType = {
    attributeOption: AttributeOptionType;
};

//Provider
type ProviderWithProductTotal = Provider & {productQuantity: number};

//Category
type CategoryWithProductTotal = Category & {
    productQuantity: number;
};

//Product
type ProductItemType = ProductItem & {itemImages: ItemImage[]};

type ProductJoinWithItems = Product & {category: Category} & {
    provider: Provider;
} & {productItems: ProductItem[]};

type ItemDictionary = {
    [itemID: string]: ProductWithSpecificItem;
};

type ProductSummary = Product & {
    category: Category;
    provider: Provider;
    productItems: {thump: string; price: number; discount: number | null}[];
};

type ProductFullJoin = Product & {
    category: Category;
    provider: Provider;
    productAttributes: ProductAttributeType[];
    productItems: ProductItemType[];
};

interface ProductStatus {
    rating: number;
}

type ProductWithSpecificItem = {
    discount: number | null;
    price: number;
    productName: string;
    quantity: number;
    productCode: string;
    color: string;
    storage: string | null;
    categoryName: string;
    providerName: string;
    thump: string | null;
    itemID: string;
    productID: string;
};

//User
interface UserDTO {
    userID: string;
    userName: string;
    email: string;
    phoneNumber: string | null;
    avatar: string | null;
    isBanned: boolean | null;
    role: userRole;
    createdAt: Date;
    updateAt: Date;
    refreshTokensUsed: string[];
}

interface UserResponseDTO {
    userID: string;
    userName: string;
    email: string;
    phoneNumber: string | null;
    avatar: string | null;
    isBanned: boolean | null;
    role: userRole;
    createdAt: Date;
    updateAt: Date;
}

interface UserInTokenPayload {
    userID: string;
    userName: string;
    email: string;
    avatar: string | null;
    role: userRole;
}

//Order
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

type InvoiceFullJoin = Invoice & {invoiceProducts: InvoiceProduct[]};

//Statistic
interface InvoiceStatistic {
    date: Date;
    order: number;
    revenue: number;
}

//Review
type ReviewFullJoin = Review & {
    childrenReview: (Review & {
        childrenReview: Review[];
        user: {
            userID: string;
            userName: string;
            avatar: string | null;
            role: userRole;
            createdAt: Date;
        };
        product: {productName: string};
    })[];
    user: {
        userID: string;
        userName: string;
        avatar: string | null;
        role: userRole;
        createdAt: Date;
    };
    product: {productName: string};
};

//Events
interface ClientEvents {
    "product:join": (payload: {productID: string}) => void;
    "product:leave": (payload: {productID: string}) => void;
    "review:create": (
        payload: ReviewCreationRequest,
        callback: (status: SocketIOError | undefined) => void
    ) => void;
    "review:delete": (
        payload: {reviewID: string},
        callback: (status: SocketIOError | undefined) => void
    ) => void;
    "user:ban": (
        payload: {userID: string; banned: boolean},
        callback: (error: SocketIOError | undefined) => void
    ) => void;
}

interface ServerEvents {
    "review:create": (payload: {review: ReviewFullJoin}) => void;
    "review:delete": (payload: {review: Review}) => void;
    "user:ban": (payload: {userID: string}) => void;
}

export type {
    Attribute,
    ProviderWithProductTotal,
    CategoryWithProductTotal,
    UserDTO,
    UserInTokenPayload,
    UserResponseDTO,
    ProductSummary,
    ProductFullJoin,
    ProductJoinWithItems,
    ProductStatus,
    ZaloPaymentOrder,
    ZaloPaymentResult,
    ProductWithSpecificItem,
    InvoiceStatistic,
    InvoiceFullJoin,
    ClientEvents,
    ServerEvents,
    ReviewFullJoin,
    ItemDictionary,
};
