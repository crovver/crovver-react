/**
 * Paywall Component
 * Blocks access to content if tenant has no active subscription.
 * Auto-redirects to checkout (via signed JWT) or shows a fallback UI.
 */

import { useEffect, useState, ReactNode, CSSProperties } from "react";
import { useCrovverContext } from "../context/CrovverContext";

export interface PaywallProps {
  /** Content to show when subscription is active */
  children: ReactNode;
  /**
   * Custom fallback to render instead of the built-in paywall UI.
   * Receives redirectToCheckout so you can wire your own CTA.
   */
  fallback?: (redirectToCheckout: () => void) => ReactNode;
  /**
   * When true (default), automatically redirects to checkout
   * as soon as a missing subscription is detected.
   * The built-in paywall UI is shown while the redirect is in progress.
   */
  autoRedirect?: boolean;
  /** Custom loading component */
  loadingComponent?: ReactNode;
  /** Inline styles for the default paywall card */
  style?: CSSProperties;
}

const SPIN_KEYFRAMES = `@keyframes crovver-spin { to { transform: rotate(360deg); } }`;
const ACCENT = "#006d6f";
const ACCENT_HOVER = "#005759";
const ACCENT_LIGHT = "#e6f4f4";

// ─── Default Loading UI ───────────────────────────────────────────────────────

function DefaultLoading() {
  return (
    <div style={{
      minHeight: "100vh", display: "flex", alignItems: "center",
      justifyContent: "center", background: "#f5f5f3",
      fontFamily: "-apple-system, BlinkMacSystemFont, 'Inter', sans-serif",
    }}>
      <style>{SPIN_KEYFRAMES}</style>
      <div style={{ textAlign: "center" }}>
        <div style={{
          width: 36, height: 36, margin: "0 auto",
          border: "3px solid #e5e5e2",
          borderTopColor: ACCENT, borderRightColor: ACCENT,
          borderRadius: "50%", animation: "crovver-spin 0.7s linear infinite",
        }} />
        <p style={{ marginTop: 14, color: "#9a9a94", fontSize: 13.5, fontWeight: 500 }}>
          Checking subscription…
        </p>
      </div>
    </div>
  );
}

// ─── Default Paywall UI ───────────────────────────────────────────────────────

function DefaultPaywallUI({
  onUpgrade,
  isRedirecting,
  style,
  status,
}: {
  onUpgrade: () => void;
  isRedirecting: boolean;
  style?: CSSProperties;
  status?: string;
}) {
  const isExpired = status === "expired";

  return (
    <div style={{
      minHeight: "100vh", display: "flex", alignItems: "center",
      justifyContent: "center", background: "#f5f5f3", padding: "24px",
      fontFamily: "-apple-system, BlinkMacSystemFont, 'Inter', sans-serif",
    }}>
      <style>{SPIN_KEYFRAMES}</style>

      <div style={{
        background: "#fff",
        borderRadius: 18,
        padding: "48px 40px",
        maxWidth: 440, width: "100%",
        textAlign: "center",
        boxShadow: "0 8px 40px rgba(0,0,0,0.10), 0 0 0 1px rgba(0,0,0,0.04)",
        ...style,
      }}>
        {/* Icon */}
        <div style={{
          width: 68, height: 68, borderRadius: "50%",
          background: ACCENT_LIGHT,
          display: "flex", alignItems: "center", justifyContent: "center",
          margin: "0 auto 24px",
        }}>
          <svg width="30" height="30" fill="none" stroke={ACCENT}
            strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" viewBox="0 0 24 24">
            <rect x="3" y="11" width="18" height="11" rx="2" />
            <path d="M7 11V7a5 5 0 0 1 10 0v4" />
          </svg>
        </div>

        {/* Badge */}
        <div style={{
          display: "inline-flex", alignItems: "center", gap: 6,
          background: ACCENT_LIGHT, borderRadius: 9999,
          padding: "4px 12px", marginBottom: 16,
        }}>
          <span style={{ width: 6, height: 6, borderRadius: "50%", background: ACCENT, display: "inline-block" }} />
          <span style={{ fontSize: 12, fontWeight: 700, color: ACCENT, letterSpacing: "0.04em", textTransform: "uppercase" }}>
            Subscription Required
          </span>
        </div>

        <h1 style={{ fontSize: 24, fontWeight: 700, color: "#1a1a1a", margin: "0 0 10px", letterSpacing: "-0.03em" }}>
          Unlock full access
        </h1>

        <p style={{ fontSize: 14.5, color: "#5c5c58", lineHeight: 1.65, margin: "0 0 32px", maxWidth: 320, marginLeft: "auto", marginRight: "auto" }}>
          You need an active subscription to access this content.
          Choose a plan to get started.
        </p>

        {/* CTA */}
        <button
          onClick={onUpgrade}
          disabled={isRedirecting}
          style={{
            display: "flex", alignItems: "center", justifyContent: "center", gap: 8,
            width: "100%", padding: "13px 24px",
            background: isRedirecting ? "#52a8aa" : ACCENT,
            color: "#fff", border: "none", borderRadius: 10,
            fontSize: 15, fontWeight: 600,
            cursor: isRedirecting ? "not-allowed" : "pointer",
            transition: "background 0.15s", letterSpacing: "-0.01em",
          }}
          onMouseEnter={e => { if (!isRedirecting) (e.currentTarget as HTMLButtonElement).style.background = ACCENT_HOVER; }}
          onMouseLeave={e => { (e.currentTarget as HTMLButtonElement).style.background = isRedirecting ? "#52a8aa" : ACCENT; }}
        >
          {isRedirecting ? (
            <>
              <span style={{
                width: 15, height: 15, flexShrink: 0,
                border: "2px solid rgba(255,255,255,0.4)",
                borderTopColor: "#fff", borderRadius: "50%",
                display: "inline-block", animation: "crovver-spin 0.7s linear infinite",
              }} />
              Redirecting to plans…
            </>
          ) : isExpired ? (
            "Renew Plan →"
          ) : (
            "View Plans & Pricing →"
          )}
        </button>

        <p style={{ marginTop: 16, fontSize: 12.5, color: "#9a9a94" }}>
          Powered by{" "}
          <span style={{ fontWeight: 700, color: ACCENT, letterSpacing: "-0.02em" }}>Crovver</span>
        </p>
      </div>
    </div>
  );
}

// ─── Paywall Component ────────────────────────────────────────────────────────

/**
 * Paywall wraps protected content and enforces subscription access.
 *
 * @example
 * ```tsx
 * // Simplest usage – auto-redirects to checkout if no subscription
 * <Paywall>
 *   <YourProtectedContent />
 * </Paywall>
 *
 * // Custom fallback UI
 * <Paywall
 *   autoRedirect={false}
 *   fallback={(upgrade) => <MyUpgradeCard onUpgrade={upgrade} />}
 * >
 *   <YourProtectedContent />
 * </Paywall>
 * ```
 */
export function Paywall({
  children,
  fallback,
  autoRedirect = true,
  loadingComponent,
  style,
}: PaywallProps) {
  const {
    isLoading,
    isActive,
    redirectToCheckout,
    redirectToRenewal,
    redirectToPortal,
    subscription,
  } = useCrovverContext();
  const [isRedirecting, setIsRedirecting] = useState(false);

  const status = subscription?.status;
  const planName = subscription?.plan?.name;

  // Route the CTA by the API's renewal hint: an expired manual/redirect-gateway
  // sub goes to RENEWAL (checkout would hit the one-active-sub-per-product guard);
  // a recurring card failure goes to the portal to update payment; everything
  // else is a fresh checkout.
  const handleUpgrade = async () => {
    setIsRedirecting(true);
    const method = subscription?.renewal?.method;
    try {
      if (method === "gateway") {
        await redirectToRenewal();
      } else if (method === "stripe_update") {
        await redirectToPortal();
      } else {
        // For expired subs, pre-select their current plan so they don't have to pick again
        await redirectToCheckout(
          status === "expired" && planName ? { requiredPlan: planName } : undefined
        );
      }
    } finally {
      // Keep isRedirecting=true since we're navigating away
    }
  };

  // Auto-redirect when subscription check finishes
  useEffect(() => {
    if (!isLoading && !isActive && autoRedirect) {
      handleUpgrade();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isLoading, isActive, autoRedirect]);

  if (isLoading) {
    return <>{loadingComponent ?? <DefaultLoading />}</>;
  }

  if (!isActive) {
    if (fallback) {
      return <>{fallback(handleUpgrade)}</>;
    }
    return (
      <DefaultPaywallUI
        onUpgrade={handleUpgrade}
        isRedirecting={isRedirecting}
        style={style}
        status={status}
      />
    );
  }

  return <>{children}</>;
}
