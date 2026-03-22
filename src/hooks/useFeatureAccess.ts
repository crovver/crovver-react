/**
 * useFeatureAccess Hook
 * Check if user has access to a specific feature
 */

import { useState, useEffect, useCallback } from "react";
import { useCrovverContext } from "../context/CrovverContext";

export interface UseFeatureAccessReturn {
  /** Does user have access to this feature? */
  hasAccess: boolean;
  /** Alias for hasAccess */
  canAccess: boolean;
  /** Loading state */
  isLoading: boolean;
  /** Error state */
  error: Error | null;
  /** Redirect to upgrade/checkout */
  redirectToUpgrade: () => void;
  /** Refresh feature access check */
  refresh: () => Promise<void>;
}

/**
 * Hook to check feature access
 *
 * @param feature - Feature key to check
 * @param checkRemote - Whether to check via API (default: false)
 *
 * @example
 * ```tsx
 * function AnalyticsPage() {
 *   const { hasAccess, isLoading, redirectToUpgrade } =
 *     useFeatureAccess('advanced-analytics');
 *
 *   if (isLoading) return <Spinner />;
 *
 *   if (!hasAccess) {
 *     return (
 *       <PaywallCard
 *         feature="Advanced Analytics"
 *         onUpgrade={redirectToUpgrade}
 *       />
 *     );
 *   }
 *
 *   return <AdvancedAnalytics />;
 * }
 * ```
 */
export function useFeatureAccess(
  feature: string,
  checkRemote = false
): UseFeatureAccessReturn {
  const {
    hasFeature,
    checkFeatureAccess,
    redirectToCheckout,
    isLoading: subscriptionLoading,
  } = useCrovverContext();

  const [isChecking, setIsChecking] = useState(false);
  const [hasAccess, setHasAccess] = useState(false);
  const [error, setError] = useState<Error | null>(null);

  /**
   * Check feature access (local or remote)
   */
  const checkAccess = useCallback(async () => {
    setIsChecking(true);
    setError(null);

    try {
      if (checkRemote) {
        // Check via API
        const result = await checkFeatureAccess(feature);
        setHasAccess(result);
      } else {
        // Check locally
        setHasAccess(hasFeature(feature));
      }
    } catch (err) {
      setError(
        err instanceof Error ? err : new Error("Failed to check feature access")
      );
      setHasAccess(false);
    } finally {
      setIsChecking(false);
    }
  }, [feature, checkRemote, hasFeature, checkFeatureAccess]);

  /**
   * Redirect to upgrade
   */
  const redirectToUpgrade = useCallback(() => {
    redirectToCheckout({ requiredFeature: feature });
  }, [feature, redirectToCheckout]);

  /**
   * Check access on mount and when dependencies change
   */
  useEffect(() => {
    if (!subscriptionLoading) {
      checkAccess();
    }
  }, [checkAccess, subscriptionLoading]);

  return {
    hasAccess,
    canAccess: hasAccess,
    isLoading: subscriptionLoading || isChecking,
    error,
    redirectToUpgrade,
    refresh: checkAccess,
  };
}
