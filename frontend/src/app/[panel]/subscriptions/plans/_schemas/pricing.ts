// Bentuk response GET /api/v1/main/public/pricing — account type beserta plan-nya.
export type PricingPlan = {
  id: string;
  name: string;
  duration_months: number; // 0 = lifetime
  price: number;
  description?: string;
  quota?: number | null;
  used_quota?: number;
};

export type PricingItem = {
  id: string;
  name: string;
  description: string;
  is_recommended: boolean;
  benefits: string[];
  plans: PricingPlan[];
};
