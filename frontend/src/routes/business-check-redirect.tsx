import { Navigate, Outlet, useLocation } from "react-router-dom";
import { useMemo } from "react";
import { useAuthUser } from "@/hooks/use-auth-user";
import { useMyBusiness } from "@/hooks/use-my-business";
import { BUSINESS_ONBOARDING_ROUTE, PUBLIC_ROUTES, ROUTES_REDIRECTS } from "@/config/routes.config";
import { AppLoader } from "@/components/layout-ui/app-loader";
import { EUserLevels } from "@shared/enums";
import type { UserDto } from "@shared/dtos";
import { useMyBusinessSubscriptionStatus } from "@/hooks/use-my-business-subscription-status";

const BusinessCheckContent = ({ user }: { user: UserDto }) => {
  const { isActive: isSubscriptionActive, isLoading: isSubscriptionLoading } = useMyBusinessSubscriptionStatus({
    enabled: user.level === EUserLevels.SUPER_ADMIN,
  });
  const location = useLocation();

  const onboardingPath = useMemo(() => `/${BUSINESS_ONBOARDING_ROUTE.BUSINESS_ONBOARDING}`, []);
  const isOnBusinessOnboardingRoute = useMemo(() => {
    return location.pathname === onboardingPath ||
      location.pathname.startsWith(`${onboardingPath}/`);
  }, [location.pathname, onboardingPath]);

  // If user is ADMIN level
  if (user.level === EUserLevels.SUPER_ADMIN) {
    // Wait for business check to complete
    if (isSubscriptionLoading) {
      return <AppLoader />;
    }

    // Check if user has business from API
    if (!isSubscriptionActive) {
      // Get onboarding step from localStorage
      localStorage.setItem('business_onboarding_step', '1');

      // If needs onboarding and not on onboarding route, redirect to onboarding
      if (!isOnBusinessOnboardingRoute) {
        return <Navigate to={onboardingPath} replace />;
      }

      // If doesn't need onboarding (step >= 4) but no business, allow normal routing
      return <Outlet />;
    } else {
      // User has business - if on onboarding route, redirect to dashboard
      if (isOnBusinessOnboardingRoute) {
        return <Navigate to={ROUTES_REDIRECTS[user.level]} replace />;
      }
      // User has business and not on onboarding route, allow normal routing
      return <Outlet />;
    }
  }

  // Non-ADMIN user on onboarding route - redirect to their appropriate route
  if (isOnBusinessOnboardingRoute) {
    return <Navigate to={ROUTES_REDIRECTS[user.level]} replace />;
  }

  // For non-ADMIN users on other routes, allow normal routing
  return <Outlet />;
};

const BusinessOnboardingCheckRedirect = () => {
  const { user, isLoading: isUserLoading } = useAuthUser();

  if (isUserLoading) {
    return <AppLoader />;
  }

  if (!user) return <Navigate to={PUBLIC_ROUTES.LOGIN} replace />;

  return <BusinessCheckContent user={user} />;
};

export default BusinessOnboardingCheckRedirect; 