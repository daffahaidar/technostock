const GOLANG_PREFIX = "/api/v1/main";

export const ENDPOINT = {
  GOLANG_API: {
    PRODUCT_CATEGORY: `${GOLANG_PREFIX}/product-category`,
    PRODUCT_PLAN: `${GOLANG_PREFIX}/product-plan`,
    PUBLIC_PRODUCT_PLAN: `${GOLANG_PREFIX}/public/product-plan/category`,
    PUBLIC_PRODUCT_PLAN_DETAIL: `${GOLANG_PREFIX}/public/product-plan`,
    BUY_PRODUCT: `${GOLANG_PREFIX}/product/buy`,
    ACCOUNT_TYPE: `${GOLANG_PREFIX}/account-types`,
    SUBSCRIPTION_PLAN: `${GOLANG_PREFIX}/subscription-plans`,
    PUBLIC_ACCOUNT_TYPE: `${GOLANG_PREFIX}/public/account-types`,
    PUBLIC_SUBSCRIPTION_PLAN: `${GOLANG_PREFIX}/public/subscription-plans`,
  },
};
