/**
 * useBillingRedirect Hook
 * Provides functions to redirect to billing/checkout
 */

import { useCallback } from "react";
import { useCrovverContext } from "../context/CrovverContext";

export interface UseBillingRedirectReturn {
  /** Redirect to checkout/pricing page */
  redirectToCheckout: (options?: {
    requiredFeature?: string;
    requiredPlan?: string;
    productSlug?: string;
  }) => void;
  /** Redirect to billing portal */
  redirectToBilling: () => void;
  /** Redirect an expired gateway subscription to the portal renewal page */
  redirectToRenewal: (options?: { productSlug?: string }) => void;
  /** Is operation in progress */
  isRedirecting: boolean;
}

/**
 * Hook for billing-related redirects
 *
 * @example
 * ```tsx
 * function UpgradeButton() {
 *   const { redirectToCheckout } = useBillingRedirect();
 *
 *   return (
 *     <button onClick={() => redirectToCheckout({ requiredPlan: 'pro' })}>
 *       Upgrade to Pro
 *     </button>
 *   );
 * }
 * ```
 */
export function useBillingRedirect(): UseBillingRedirectReturn {
  const {
    redirectToCheckout: checkout,
    redirectToPortal,
    redirectToRenewal: renewal,
  } = useCrovverContext();

  const redirectToCheckout = useCallback(
    (options?: { requiredFeature?: string; requiredPlan?: string; productSlug?: string }) => {
      checkout(options);
    },
    [checkout]
  );

  const redirectToBilling = useCallback(() => {
    redirectToPortal();
  }, [redirectToPortal]);

  const redirectToRenewal = useCallback(
    (options?: { productSlug?: string }) => {
      renewal(options);
    },
    [renewal]
  );

  return {
    redirectToCheckout,
    redirectToBilling,
    redirectToRenewal,
    isRedirecting: false,
  };
}
