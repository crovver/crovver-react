/**
 * Subscription Gate Component
 * Checks if tenant has an active subscription and shows gate/paywall if not
 */

"use client";

import { useSubscription } from "../hooks/useSubscription";
import { useBillingRedirect } from "../hooks/useBillingRedirect";
import { useCrovverContext } from "../context/CrovverContext";
import { CROVVER_URL } from "../config";

interface SubscriptionGateProps {
  children: React.ReactNode;
  showSoftPaywall?: boolean; // If true, shows content with overlay; if false, completely blocks content
}

export function SubscriptionGate({
  children,
  showSoftPaywall = false,
}: SubscriptionGateProps) {
  const { subscription, isLoading, isActive } = useSubscription();
  const { redirectToCheckout, isRedirecting } = useBillingRedirect();
  const { config } = useCrovverContext();

  const portalUrl = config.portalUrl || CROVVER_URL.PORTAL;

  // Show loading state
  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Checking subscription status...</p>
        </div>
      </div>
    );
  }

  // Show paywall if no active subscription
  if (!isActive) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-red-50 to-orange-50">
        <div className="max-w-2xl mx-auto px-6 py-12">
          <div className="bg-white rounded-2xl shadow-xl p-8 text-center">
            {/* Icon */}
            <div className="w-20 h-20 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-6">
              <svg
                className="w-10 h-10 text-red-600"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z"
                />
              </svg>
            </div>

            {/* Title */}
            <h1 className="text-3xl font-bold text-gray-900 mb-4">
              Subscription Required
            </h1>

            {/* Message */}
            <p className="text-lg text-gray-600 mb-2">
              {subscription?.status === "canceled"
                ? "Your subscription has been canceled."
                : subscription?.status === "expired"
                  ? "Your subscription has expired."
                  : subscription?.status === "past_due"
                    ? "Your subscription payment is past due."
                    : "You need an active subscription to access this application."}
            </p>

            {subscription && (
              <div className="bg-gray-50 rounded-lg p-4 mb-6 text-sm text-gray-700">
                <p>
                  <strong>Current Status:</strong>{" "}
                  <span className="capitalize">{subscription.status}</span>
                </p>
                {subscription.subscription?.currentPeriodEnd && (
                  <p className="mt-1">
                    <strong>Period End:</strong>{" "}
                    {new Date(
                      subscription.subscription.currentPeriodEnd
                    ).toLocaleDateString()}
                  </p>
                )}
              </div>
            )}

            <p className="text-gray-500 mb-8">
              Choose a plan to get started and unlock all features.
            </p>

            {/* CTA Buttons */}
            <div className="space-y-3">
              <button
                onClick={() => redirectToCheckout()}
                disabled={isRedirecting}
                className="w-full bg-indigo-600 hover:bg-indigo-700 disabled:bg-gray-400 text-white font-semibold text-lg px-8 py-4 rounded-lg transition-colors disabled:cursor-not-allowed flex items-center justify-center"
              >
                {isRedirecting ? (
                  <>
                    <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white mr-2"></div>
                    Redirecting...
                  </>
                ) : (
                  <>View Plans & Pricing →</>
                )}
              </button>

              {/* Direct link as fallback */}
              <a
                href={`${portalUrl}/pricing`}
                className="block text-sm text-indigo-600 hover:text-indigo-700 underline"
              >
                Or visit {portalUrl}/pricing directly
              </a>
            </div>

            {/* Help text */}
            <div className="mt-8 pt-6 border-t border-gray-200 text-sm text-gray-500">
              <p>
                Need help? Contact{" "}
                <a
                  href="mailto:support@crovver.com"
                  className="text-indigo-600 hover:underline"
                >
                  support@crovver.com
                </a>
              </p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Soft paywall: show content with overlay
  if (showSoftPaywall && !isActive) {
    return (
      <div className="relative">
        {/* Blurred content */}
        <div className="filter blur-sm pointer-events-none">{children}</div>

        {/* Overlay */}
        <div className="absolute inset-0 bg-black bg-opacity-50 flex items-center justify-center">
          <div className="bg-white rounded-lg shadow-xl p-8 max-w-md text-center">
            <h2 className="text-2xl font-bold text-gray-900 mb-4">
              Upgrade Required
            </h2>
            <p className="text-gray-600 mb-6">
              This feature requires an active subscription.
            </p>
            <button
              onClick={() => redirectToCheckout()}
              disabled={isRedirecting}
              className="bg-indigo-600 hover:bg-indigo-700 disabled:bg-gray-400 text-white font-semibold px-6 py-3 rounded-lg transition-colors"
            >
              {isRedirecting ? "Redirecting..." : "View Plans"}
            </button>
          </div>
        </div>
      </div>
    );
  }

  // Active subscription - show content
  return <>{children}</>;
}

/**
 * Subscription Status Badge Component
 * Shows current subscription status in the UI
 */
export function SubscriptionBadge() {
  const { subscription, isLoading, plan } = useSubscription();

  if (isLoading) {
    return (
      <div className="inline-flex items-center px-3 py-1 rounded-full text-sm bg-gray-100 text-gray-600">
        <div className="animate-spin rounded-full h-3 w-3 border-b-2 border-gray-600 mr-2"></div>
        Loading...
      </div>
    );
  }

  if (!subscription) {
    return (
      <div className="inline-flex items-center px-3 py-1 rounded-full text-sm bg-red-100 text-red-800">
        <span className="w-2 h-2 bg-red-600 rounded-full mr-2"></span>
        No Subscription
      </div>
    );
  }

  const statusColors = {
    active: "bg-green-100 text-green-800",
    trialing: "bg-blue-100 text-blue-800",
    past_due: "bg-yellow-100 text-yellow-800",
    canceled: "bg-red-100 text-red-800",
    expired: "bg-gray-100 text-gray-800",
  };

  const statusDotColors = {
    active: "bg-green-600",
    trialing: "bg-blue-600",
    past_due: "bg-yellow-600",
    canceled: "bg-red-600",
    expired: "bg-gray-600",
  };

  const status = subscription.status as keyof typeof statusColors;

  return (
    <div
      className={`inline-flex items-center px-3 py-1 rounded-full text-sm ${
        statusColors[status] || "bg-gray-100 text-gray-800"
      }`}
    >
      <span
        className={`w-2 h-2 ${
          statusDotColors[status] || "bg-gray-600"
        } rounded-full mr-2`}
      ></span>
      {plan?.name || "Unknown Plan"} • {subscription.status}
    </div>
  );
}
