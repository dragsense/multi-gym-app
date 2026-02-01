

import { lazy, Suspense, useId } from "react";
import { COMMON_ROUTES, PUBLIC_ROUTES } from "@/config/routes.config";
import { AppLoader } from "@/components/layout-ui/app-loader";

// React 19: Lazy load common pages with enhanced performance
const NotFound = lazy(() => import("./404"));
const UnauthorizedPage = lazy(() => import("./unauthorized"));
const PublicPage = lazy(() => import("./public-pages/page"));

// React 19: Enhanced loading component for common routes
const CommonRouteLoadingFallback = () => {
  const componentId = useId();

  return (
    <div className="h-screen w-screen">
      <AppLoader
        data-component-id={componentId}
      >
        <div className="text-center mb-4">
          <h3 className="text-lg font-semibold text-foreground">Loading Page</h3>
          <p className="text-sm text-muted-foreground">Please wait while we load the content...</p>
        </div>
      </AppLoader>
    </div>

  );
};

// React 19: Enhanced common routes with lazy loading and Suspense
const commonRoutes = [
  {
    path: PUBLIC_ROUTES.PAGE,
    element: (
      <Suspense fallback={<CommonRouteLoadingFallback />}>
        <PublicPage />
      </Suspense>
    ),
  },
  {
    path: COMMON_ROUTES.NOT_FOUND,
    element: (
      <Suspense fallback={<CommonRouteLoadingFallback />}>
        <NotFound />
      </Suspense>
    ),
  },
  {
    path: COMMON_ROUTES.UNAUTHORIZED,
    element: (
      <Suspense fallback={<CommonRouteLoadingFallback />}>
        <UnauthorizedPage />
      </Suspense>
    ),
  }
];

export default commonRoutes;

export { default as authRoutes } from "./auth/auth-routes";
export { default as adminRoutes } from "./admin/admin-routes";
