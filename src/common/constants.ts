enum ResponseMessage {
    SUCCESS = "Successfull!",
    BLANK_INPUT = "Input cannot be blank!",
    TOKEN_INVALID = "Token is invalid!",
    TOKEN_MISSING = "Missing token!",
    ACCESS_DENIED = "Access denied!",
    ATTR_TYPE_ALREADY_EXISTS = "Attribute type already exists!",
    ATTR_TYPE_NOT_FOUND = "Attribute type not found!",
    ATTR_OPTION_ALREADY_EXISTS = "Attribute type already exists!",
    ATTR_OPTION_NOT_FOUND = "Attribute option not found!",
    PROVIDER_ALREADY_EXISTS = "Provider already exists!",
    PROVIDER_NOT_FOUND = "Provider not found!",
    PROVIDER_DELETE_FAIL = "Provider fail to delete: there are still many product relate to this provider!",
    CATEGORY_ALREADY_EXISTS = "Category already exists!",
    CATEGORY_NOT_FOUND = "Category not found!",
    CATEGORY_DELETE_FAIL = "Category fail to delete: there are still many product relate to this category!",
    USER_ALREADY_EXISTS = "User already exists!",
    USER_ALREADY_LOGIN = "User already login!",
    USER_NOT_FOUND = "User not found!",
    WRONG_PASSWORD = "Wrong password!",
    GENERATE_TOKEN_ERROR = "Generate token error!",
    PRODUCT_NOT_FOUND = "Product not found!",
    REQUEST_MAC_NOT_EQUAL = "mac not equal",
}

enum RequestMethod {
    POST = "POST",
    PUT = "PUT",
    GET = "GET",
    DELETE = "DELETE",
    PATCH = "PATCH",
}

enum UserRole {
    ADMIN = "ADMIN",
    CLIENT = "CLIENT",
}

enum AuthToken {
    RF = "refreshToken",
    AC = "accessToken",
}

export {ResponseMessage, RequestMethod, AuthToken, UserRole};
