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
    SlideShow,
    Store,
    userRoles,
} from "@prisma/client";
import {ReviewCreationRequest} from "./schemas";
import {SocketIOError} from "@/errors/custom-error";

//Ultility type
type Nullable<T> = T | null;

type Optional<T> = T | undefined;

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
    productItems: {thump: string}[];
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
    discount: Nullable<number>;
    price: number;
    productName: string;
    quantity: number;
    productCode: string;
    color: string;
    storage: Nullable<string>;
    categoryName: string;
    providerName: string;
    thump: Nullable<string>;
    itemID: string;
    productID: string;
};

//User
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
interface Statistic {
    users: number;
    products: number;
    invoices: {
        today: number;
        yesterday: number;
    };
    revenue: {
        today: number;
        yesterday: number;
    };
}

//Review
type ReviewFullJoin = Review & {
    childrenReview: (Review & {
        childrenReview: Review[];
        user: {
            userID: string;
            userName: string;
            avatar: Nullable<string>;
            role: userRoles;
            createdAt: Date;
        };
        product: {productName: string};
    })[];
    user: {
        userID: string;
        userName: string;
        avatar: Nullable<string>;
        role: userRoles;
        createdAt: Date;
    };
    product: {productName: string};
};

//Store
type StoreFullJoin = Store & {slideShows: SlideShow[]};

//Events
interface ClientEvents {
    "product:join": (payload: {productID: string}) => void;
    "product:leave": (payload: {productID: string}) => void;
    "review:create": (
        payload: ReviewCreationRequest,
        callback: (status: Optional<SocketIOError>) => void
    ) => void;
    "review:delete": (
        payload: {reviewID: string},
        callback: (status: Optional<SocketIOError>) => void
    ) => void;
}

interface ServerEvents {
    "review:create": (payload: {review: ReviewFullJoin}) => void;
    "review:delete": (payload: {review: Review}) => void;
}

export type {
    Nullable,
    Optional,
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
    Statistic,
    InvoiceFullJoin,
    ClientEvents,
    ServerEvents,
    ReviewFullJoin,
    StoreFullJoin,
    ItemDictionary,
};
