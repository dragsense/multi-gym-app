import { Navigate, Outlet, useLocation } from "react-router-dom";
import { useAuthUser } from "@/hooks/use-auth-user";
import { MEMBER_ONBOARDING_ROUTE, PUBLIC_ROUTES, ROUTES_REDIRECTS } from "@/config/routes.config";
import { AppLoader } from "@/components/layout-ui/app-loader";
import { EUserLevels } from "@shared/enums";
import { useMemo } from "react";

const MemberOnboardingCheckRedirect = () => {
  const { user, isLoading } = useAuthUser();
  const location = useLocation();

  if (isLoading) return <AppLoader />;

  if (!user) return <Outlet />;


  const onboardingPath = useMemo(() => `/${MEMBER_ONBOARDING_ROUTE.MEMBER_ONBOARDING}`, []);
  const isOnMemberOnboardingRoute = useMemo(() => {
    return location.pathname === onboardingPath ||
      location.pathname.startsWith(`${onboardingPath}/`);
  }, [location.pathname, onboardingPath]);


  // If user is MEMBER level
  if (user.level === EUserLevels.MEMBER) {
    const memberOnboardingStep = localStorage.getItem('member_onboarding_step');
    const needsOnboarding = memberOnboardingStep && parseInt(memberOnboardingStep) < 4;

    // If needs onboarding but already on onboarding route, don't redirect (avoid loop)
    if (needsOnboarding && !isOnMemberOnboardingRoute) {
      return <Navigate to={MEMBER_ONBOARDING_ROUTE.MEMBER_ONBOARDING} replace />;
    }

    // If completed onboarding or doesn't need it, allow normal routing
    if (needsOnboarding) {
      return <Outlet />;
    }
  }

  // If user is on member onboarding route, redirect to their appropriate route
  if (isOnMemberOnboardingRoute) {
    return <Navigate to={ROUTES_REDIRECTS[user.level]} replace />;
  }

  // For non-MEMBER users on other routes, allow normal routing
  return <Outlet />;
};

export default MemberOnboardingCheckRedirect;

