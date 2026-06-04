/**
 * useFeatureAccess Hook
 * Check if user has access to a specific feature or product
 */

import { useState, useEffect, useCallback } from "react";
import { useCrovverContext } from "../context/CrovverContext";

export interface UseFeatureAccessOptions {
  /** Whether to check via API instead of local plan data (default: false) */
  checkRemote?: boolean;
  /**
   * Override the provider-level productSlug for this specific check.
   * Use when a component needs to gate on a different product than the
   * default set on CrovverProvider.
   */
  productSlug?: string;
}

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
 * Hook to check feature access or subscription existence.
 *
 * @param feature - Feature key to check. Optional when productSlug is provided
 *   (omitting feature performs a subscription-existence check for the product).
 * @param opts - Options: checkRemote, productSlug override
 *
 * @example
 * ```tsx
 * // Feature gate (local plan data)
 * const { hasAccess } = useFeatureAccess('advanced-analytics');
 *
 * // Feature gate scoped to a product (remote)
 * const { hasAccess } = useFeatureAccess('job-posting', { checkRemote: true, productSlug: 'ats' });
 *
 * // Subscription-existence check for a product
 * const { hasAccess: hasAts } = useFeatureAccess(undefined, { checkRemote: true, productSlug: 'ats' });
 * ```
 */
export function useFeatureAccess(
  feature?: string,
  opts: UseFeatureAccessOptions = {}
): UseFeatureAccessReturn {
  const { checkRemote = false, productSlug } = opts;

  const {
    hasFeature,
    checkFeatureAccess,
    redirectToCheckout,
    isLoading: subscriptionLoading,
  } = useCrovverContext();

  const [isChecking, setIsChecking] = useState(false);
  const [hasAccess, setHasAccess] = useState(false);
  const [error, setError] = useState<Error | null>(null);

  const checkAccess = useCallback(async () => {
    setIsChecking(true);
    setError(null);

    try {
      if (checkRemote) {
        const result = await checkFeatureAccess(feature, productSlug);
        setHasAccess(result);
      } else {
        // Local check only works when featureKey is present
        setHasAccess(feature ? hasFeature(feature) : false);
      }
    } catch (err) {
      setError(
        err instanceof Error ? err : new Error("Failed to check feature access")
      );
      setHasAccess(false);
    } finally {
      setIsChecking(false);
    }
  }, [feature, checkRemote, productSlug, hasFeature, checkFeatureAccess]);

  const redirectToUpgrade = useCallback(() => {
    redirectToCheckout({ requiredFeature: feature });
  }, [feature, redirectToCheckout]);

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
