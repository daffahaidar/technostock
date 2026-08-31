const MAIN_PREFIX = "/api/v1/main";
const CHAT_PREFIX = "/api/v1/chat";

export const ENDPOINT = {
  MAIN_SERVICE: {
    ACCOUNT_TYPE: `${MAIN_PREFIX}/account-types`,
    SUBSCRIPTION_PLAN: `${MAIN_PREFIX}/subscription-plans`,
    VOUCHER: `${MAIN_PREFIX}/vouchers`,
    // Satu endpoint gabungan: account type + plan-nya sekaligus.
    PUBLIC_PRICING: `${MAIN_PREFIX}/public/pricing`,
    PUBLIC_SUBSCRIPTION_PLAN: `${MAIN_PREFIX}/public/subscription-plans`,
    PUBLIC_SUBSCRIPTION_PLAN_DETAIL: (id: string) =>
      `${MAIN_PREFIX}/public/subscription-plans/${encodeURIComponent(id)}`,
    PUBLIC_VOUCHER_CHECK: (code: string) =>
      `${MAIN_PREFIX}/public/vouchers/check/${encodeURIComponent(code)}`,
    MEMBER_MANAGEMENT: `${MAIN_PREFIX}/admin/members`,
    SUBSCRIPTION_BUY: `${MAIN_PREFIX}/subscriptions/buy`,
    SUBSCRIPTION_MY_ACTIVE: `${MAIN_PREFIX}/subscriptions/my-active`,
    TRANSACTION_SYNC: (orderId: string) =>
      `${MAIN_PREFIX}/subscriptions/transactions/${encodeURIComponent(orderId)}/sync`,
  },
  AUTH_SERVICE: {
    USERS: `/api/v1/users`,
    SIGN_UP: `/api/v1/auth/sign-up`,
  },
  MESSAGE_SERVICE: {
    CHAT_HISTORY: `${CHAT_PREFIX}/history`,
    CHAT_READ: `${CHAT_PREFIX}/read`,
    CHAT_UNREAD_COUNT: `${CHAT_PREFIX}/unread-count`,
  },
};
