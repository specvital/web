"use client";

import { useAuth } from "@/features/auth";

import { PricingCard } from "./pricing-card";
import { PRICING_PLANS } from "../constants/plans";
import { useCurrentPlan } from "../hooks/use-current-plan";

export const PricingGrid = () => {
  const { isAuthenticated } = useAuth();
  const { data: currentTier } = useCurrentPlan(isAuthenticated);

  return (
    <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
      {PRICING_PLANS.map((plan) => (
        <PricingCard currentTier={currentTier} key={plan.tier} plan={plan} />
      ))}
    </div>
  );
};
