const GOLANG_PREFIX = "/api/v1/main";

export const ENDPOINT = {
  GOLANG_API: {
    ACCOUNT_TYPE: `${GOLANG_PREFIX}/account-types`,
    SUBSCRIPTION_PLAN: `${GOLANG_PREFIX}/subscription-plans`,
    PUBLIC_ACCOUNT_TYPE: `${GOLANG_PREFIX}/public/account-types`,
    PUBLIC_SUBSCRIPTION_PLAN: `${GOLANG_PREFIX}/public/subscription-plans`,
    MEMBER_MANAGEMENT: `${GOLANG_PREFIX}/admin/members`,
  },
  RUST_API: {
    USERS: `/api/v1/users`,
  }
};
