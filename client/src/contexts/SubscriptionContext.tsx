import { createContext, useContext, type ReactNode } from "react";
import { trpc } from "@/lib/trpc";

export type PlanId = "free" | "prime_plus" | "prime_pro";

export const PLAN_FEATURES: Record<string, PlanId[]> = {
  basic_tracking:   ["free", "prime_plus", "prime_pro"],
  workout_guide:    ["free", "prime_plus", "prime_pro"],
  ai_coach:         ["prime_plus", "prime_pro"],
  community:        ["prime_plus", "prime_pro"],
  stats:            ["prime_plus", "prime_pro"],
  priority_support: ["prime_pro"],
  custom_programs:  ["prime_pro"],
};

interface SubscriptionContextValue {
  plan: PlanId;
  status: string;
  expiresAt: Date | null;
  isLoading: boolean;
  hasFeature: (feature: string) => boolean;
  isPremium: boolean;
}

const SubscriptionContext = createContext<SubscriptionContextValue>({
  plan: "free",
  status: "active",
  expiresAt: null,
  isLoading: false,
  hasFeature: () => false,
  isPremium: false,
});

export function SubscriptionProvider({ children }: { children: ReactNode }) {
  const { data, isLoading } = trpc.subscription.getStatus.useQuery(undefined, {
    retry: false,
    staleTime: 5 * 60 * 1000, // 5 minutes
  });

  const plan = (data?.plan ?? "free") as PlanId;
  const status = data?.status ?? "active";
  const expiresAt = data?.expiresAt ? new Date(data.expiresAt) : null;

  const hasFeature = (feature: string): boolean => {
    const allowedPlans = PLAN_FEATURES[feature];
    if (!allowedPlans) return false;
    return allowedPlans.includes(plan);
  };

  const isPremium = plan !== "free" && status === "active";

  return (
    <SubscriptionContext.Provider value={{ plan, status, expiresAt, isLoading, hasFeature, isPremium }}>
      {children}
    </SubscriptionContext.Provider>
  );
}

export function useSubscription() {
  return useContext(SubscriptionContext);
}
