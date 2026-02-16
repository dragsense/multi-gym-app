import { Navigate, Outlet, useLocation } from "react-router-dom";
import { useAuthUser } from "@/hooks/use-auth-user";
import { PUBLIC_ROUTES, ROOT_ROUTE, ROUTES_REDIRECTS, SEGMENTS, BUSINESS_ONBOARDING_ROUTE, MEMBER_ONBOARDING_ROUTE } from "@/config/routes.config";
import { AppLoader } from "@/components/layout-ui/app-loader";

const LevelBasedRedirect = () => {
  const { user, isLoading } = useAuthUser();
  const location = useLocation();

  if (isLoading) return <AppLoader />;

  if (!user) return <Navigate to={PUBLIC_ROUTES.LOGIN} replace />;

  // Allow onboarding routes to pass through
  const isOnOnboardingRoute = location.pathname.includes(`/${BUSINESS_ONBOARDING_ROUTE.BUSINESS_ONBOARDING}`) ||
                              location.pathname.includes(`/${MEMBER_ONBOARDING_ROUTE.MEMBER_ONBOARDING}`);

  if (isOnOnboardingRoute) {
    return <Outlet />;
  }

  if (!location.pathname.includes(SEGMENTS[user.level])
    || location.pathname === ROOT_ROUTE
    || location.pathname === SEGMENTS[user.level]
  ) {
    const redirectPath = ROUTES_REDIRECTS[user.level];

    return <Navigate to={redirectPath} replace />;
  }

  return <Outlet />;

};

export default LevelBasedRedirect; 