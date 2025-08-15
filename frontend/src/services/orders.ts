import { ENV } from "../lib/env";
import { mockBuyNow, mockListMyOrders, mockListSold } from "../mocks/orders";

export const OrderService = {
    buyNow(token: string, productId: string) {
        if (ENV.USE_MOCKS) return mockBuyNow(token, productId);
        throw new Error("TODO");
    },
    myOrders(token: string) {
        if (ENV.USE_MOCKS) return mockListMyOrders(token);
        throw new Error("TODO");
    },
    sold(token: string) {
        if (ENV.USE_MOCKS) return mockListSold(token);
        throw new Error("TODO");
    },
};

export default OrderService;
