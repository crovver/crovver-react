/**
 * FeatureGuard Component
 * Conditionally renders children based on feature access
 */

import { ReactNode } from "react";
import { useFeatureAccess } from "../hooks/useFeatureAccess";

export interface FeatureGuardProps {
  /** Feature key to check */
  feature?: string;
  /** Alias for feature */
  featureKey?: string;
  /** Content to render when feature is not accessible */
  fallback?: ReactNode;
  /** Whether to check remotely via API */
  checkRemote?: boolean;
  /** Custom loading component */
  loadingComponent?: ReactNode;
  /** Children to render when access is granted */
  children: ReactNode;
}

/**
 * FeatureGuard Component
 *
 * Conditionally renders children based on feature access.
 * If user doesn't have access, renders fallback component.
 *
 * @example
 * ```tsx
 * <FeatureGuard
 *   feature="advanced-analytics"
 *   fallback={<UpgradePrompt />}
 * >
 *   <AdvancedAnalytics />
 * </FeatureGuard>
 * ```
 */
export function FeatureGuard({
  feature,
  featureKey,
  fallback = null,
  checkRemote = false,
  loadingComponent = null,
  children,
}: FeatureGuardProps) {
  const resolvedFeature = (feature || featureKey) ?? "";
  const { hasAccess, isLoading } = useFeatureAccess(
    resolvedFeature,
    checkRemote
  );

  if (isLoading) {
    return <>{loadingComponent}</>;
  }

  if (!hasAccess) {
    return <>{fallback}</>;
  }

  return <>{children}</>;
}
