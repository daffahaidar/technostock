const MAIN_PREFIX = "/api/v1/main";

export const ENDPOINT = {
  MAIN_SERVICE: {
    ACCOUNT_TYPE: `${MAIN_PREFIX}/account-types`,
    SUBSCRIPTION_PLAN: `${MAIN_PREFIX}/subscription-plans`,
    VOUCHER: `${MAIN_PREFIX}/vouchers`,
    PUBLIC_ACCOUNT_TYPE: `${MAIN_PREFIX}/public/account-types`,
    PUBLIC_SUBSCRIPTION_PLAN: `${MAIN_PREFIX}/public/subscription-plans`,
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
  }
};
