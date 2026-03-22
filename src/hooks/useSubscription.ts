/**
 * useSubscription Hook
 * Provides subscription data and status
 */

import { useCrovverContext } from "../context/CrovverContext";
import type { SubscriptionStatus } from "../types";

export interface UseSubscriptionReturn {
  /** Current subscription data */
  subscription: SubscriptionStatus | null;
  /** Loading state */
  isLoading: boolean;
  /** Error state */
  error: Error | null;
  /** Quick check: is subscription active? */
  isActive: boolean;
  /** Current plan details */
  plan: SubscriptionStatus["plan"];
  /** Tenant details */
  tenant: SubscriptionStatus["tenant"] | null;
  /** Subscription details */
  subscriptionDetails: SubscriptionStatus["subscription"];
  /** Refresh subscription data */
  refresh: () => Promise<void>;
}

/**
 * Hook to access subscription status
 *
 * @example
 * ```tsx
 * function Dashboard() {
 *   const { subscription, isLoading, isActive, plan } = useSubscription();
 *
 *   if (isLoading) return <Spinner />;
 *   if (!isActive) return <PaywallMessage />;
 *
 *   return <DashboardContent plan={plan} />;
 * }
 * ```
 */
export function useSubscription(): UseSubscriptionReturn {
  const { subscription, isLoading, error, isActive, refreshSubscription } =
    useCrovverContext();

  return {
    subscription,
    isLoading,
    error,
    isActive,
    plan: subscription?.plan || null,
    tenant: subscription?.tenant || null,
    subscriptionDetails: subscription?.subscription || null,
    refresh: refreshSubscription,
  };
}
