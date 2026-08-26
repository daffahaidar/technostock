const GOLANG_PREFIX = "/api/v1/main";

export const ENDPOINT = {
  GOLANG_API: {
    ACCOUNT_TYPE: `${GOLANG_PREFIX}/account-types`,
    SUBSCRIPTION_PLAN: `${GOLANG_PREFIX}/subscription-plans`,
    VOUCHER: `${GOLANG_PREFIX}/vouchers`,
    PUBLIC_ACCOUNT_TYPE: `${GOLANG_PREFIX}/public/account-types`,
    PUBLIC_SUBSCRIPTION_PLAN: `${GOLANG_PREFIX}/public/subscription-plans`,
    PUBLIC_VOUCHER_CHECK: (code: string) =>
      `${GOLANG_PREFIX}/public/vouchers/check/${encodeURIComponent(code)}`,
    MEMBER_MANAGEMENT: `${GOLANG_PREFIX}/admin/members`,
    SUBSCRIPTION_BUY: `${GOLANG_PREFIX}/subscriptions/buy`,
    SUBSCRIPTION_MY_ACTIVE: `${GOLANG_PREFIX}/subscriptions/my-active`,
    TRANSACTION_SYNC: (orderId: string) =>
      `${GOLANG_PREFIX}/subscriptions/transactions/${encodeURIComponent(orderId)}/sync`,
  },
  RUST_API: {
    USERS: `/api/v1/users`,
  }
};
