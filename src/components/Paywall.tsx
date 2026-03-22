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

// ─── Default Loading UI ───────────────────────────────────────────────────────

function DefaultLoading() {
  const containerStyle: CSSProperties = {
    minHeight: "100vh",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    background: "#f9fafb",
  };
  const spinnerStyle: CSSProperties = {
    width: 40,
    height: 40,
    border: "3px solid #e5e7eb",
    borderTop: "3px solid #4f46e5",
    borderRadius: "50%",
    animation: "crovver-spin 0.8s linear infinite",
  };

  return (
    <div style={containerStyle}>
      <style>{`@keyframes crovver-spin { to { transform: rotate(360deg); } }`}</style>
      <div style={{ textAlign: "center" }}>
        <div style={spinnerStyle} />
        <p style={{ marginTop: 12, color: "#6b7280", fontSize: 14 }}>
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
}: {
  onUpgrade: () => void;
  isRedirecting: boolean;
  style?: CSSProperties;
}) {
  const containerStyle: CSSProperties = {
    minHeight: "100vh",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    background: "linear-gradient(135deg, #eff6ff 0%, #eef2ff 100%)",
    padding: "2rem",
  };

  const cardStyle: CSSProperties = {
    background: "#fff",
    borderRadius: 16,
    padding: "3rem 2.5rem",
    maxWidth: 480,
    width: "100%",
    textAlign: "center",
    boxShadow: "0 20px 60px rgba(0,0,0,0.08), 0 4px 16px rgba(0,0,0,0.04)",
    ...style,
  };

  const iconWrapStyle: CSSProperties = {
    width: 72,
    height: 72,
    background: "#eef2ff",
    borderRadius: "50%",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    margin: "0 auto 1.5rem",
  };

  const buttonStyle: CSSProperties = {
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    width: "100%",
    padding: "0.875rem 1.5rem",
    background: isRedirecting ? "#a5b4fc" : "#4f46e5",
    color: "#fff",
    border: "none",
    borderRadius: 10,
    fontSize: 16,
    fontWeight: 600,
    cursor: isRedirecting ? "not-allowed" : "pointer",
    transition: "background 0.2s",
    marginTop: "1.5rem",
  };

  return (
    <div style={containerStyle}>
      <div style={cardStyle}>
        <div style={iconWrapStyle}>
          <svg
            width="32"
            height="32"
            fill="none"
            stroke="#4f46e5"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
            viewBox="0 0 24 24"
          >
            <rect x="3" y="11" width="18" height="11" rx="2" ry="2" />
            <path d="M7 11V7a5 5 0 0 1 10 0v4" />
          </svg>
        </div>

        <h1
          style={{
            fontSize: 26,
            fontWeight: 700,
            color: "#111827",
            margin: "0 0 0.75rem",
          }}
        >
          Subscription Required
        </h1>

        <p
          style={{
            fontSize: 15,
            color: "#6b7280",
            lineHeight: 1.6,
            margin: "0 0 0.5rem",
          }}
        >
          You need an active subscription to access this content.
        </p>
        <p style={{ fontSize: 14, color: "#9ca3af", margin: 0 }}>
          Choose a plan to unlock all features.
        </p>

        <button
          style={buttonStyle}
          onClick={onUpgrade}
          disabled={isRedirecting}
        >
          {isRedirecting ? (
            <>
              <span
                style={{
                  width: 16,
                  height: 16,
                  border: "2px solid rgba(255,255,255,0.4)",
                  borderTop: "2px solid #fff",
                  borderRadius: "50%",
                  display: "inline-block",
                  animation: "crovver-spin 0.8s linear infinite",
                }}
              />
              Redirecting…
            </>
          ) : (
            "View Plans & Pricing →"
          )}
        </button>

        <style>{`@keyframes crovver-spin { to { transform: rotate(360deg); } }`}</style>
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
  const { isLoading, isActive, redirectToCheckout } = useCrovverContext();
  const [isRedirecting, setIsRedirecting] = useState(false);

  const handleUpgrade = async () => {
    setIsRedirecting(true);
    try {
      await redirectToCheckout();
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
      />
    );
  }

  return <>{children}</>;
}
