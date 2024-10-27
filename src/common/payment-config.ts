type ZaloPayConfig = {
    app_id: string;
    key1: string;
    key2: string;
    endpoint: string;
};

if (!process.env.ZALO_APP_ID) {
    throw new Error("[zalo-config]: zalo app ID must be specified");
} else if (!process.env.ZALO_KEY_1 || !process.env.ZALO_KEY_2) {
    throw new Error("[zalo-config]: zalo key must be specified");
} else if (!process.env.ZALO_ENDPOINT) {
    throw new Error("[zalo-config]: zalo endpoint must be specified");
}

export const zaloPayConfig: ZaloPayConfig = {
    app_id: process.env.ZALO_APP_ID,
    key1: process.env.ZALO_KEY_1,
    key2: process.env.ZALO_KEY_2,
    endpoint: process.env.ZALO_ENDPOINT,
};
