// src/routes/appRouter.tsx
import { Navigate, createBrowserRouter } from "react-router-dom";
import { lazy } from "react";
import { ROOT_ROUTE, SUPER_ADMIN_SEGMENT, ADMIN_SEGMENT, MEMBER_SEGMENT, MEMBER_ONBOARDING_ROUTE, BUSINESS_ONBOARDING_ROUTE, PLATFORM_OWNER_SEGMENT, ADMIN_ROUTES, STAFF_SEGMENT } from "@/config/routes.config";
import { createRouteElement } from "@/lib/route-utils";

// Pages Routes - React 19: Lazy loaded with enhanced performance
import commonRoutes, { authRoutes, adminRoutes } from "@/pages/routes";
import LevelBasedRedirect from "./routes/level-based-redirect";
import BusinessOnboardingCheckRedirect from "./routes/business-check-redirect";
import MemberOnboardingCheckRedirect from "./routes/member-onboarding-check-redirect";
import LevelBasedRoutes from "./routes/level-based-routes";
const MemberOnboardingPage = lazy(() => import("./pages/member-onboarding/onboarding"));
const BusinessOnboardingPage = lazy(() => import("./pages/business-onboarding/onboarding"));

// React 19: Lazy load layouts with enhanced performance
const MainLayout = lazy(() => import("@/layouts/MainLayout"));
const DashboardLayoutWrapper = lazy(() => import("@/layouts/DashboardLayout").then(module => ({ default: module.DashboardLayoutWrapper })));
const AuthLayout = lazy(() => import("@/layouts/AuthLayout"));
const PrivateRoute = lazy(() => import("@/routes/private-route"));
const PublicRoute = lazy(() => import("@/routes/public-route"));


// React 19: Enhanced route configuration with lazy loading
const appRouter = createBrowserRouter([
  {
    path: ROOT_ROUTE,
    element: createRouteElement(MainLayout, "App", ["initializing", "application"]),
    children: [
      {
        element: createRouteElement(PublicRoute, "App", ["loading", "public", "routes"]),
        children: [
          {
            element: createRouteElement(AuthLayout, "App", ["loading", "authentication"]),
            children: authRoutes,
          },
        ],
      },
      {
        element: createRouteElement(PrivateRoute, "App", ["loading", "private", "routes"]),
        children: [
          {
            element: <BusinessOnboardingCheckRedirect />,
            children: [
              {
                element: <MemberOnboardingCheckRedirect />,
                children: [
                  {
                    index: true,
                    element: <LevelBasedRedirect />,
                  },
                  {
                    element: <LevelBasedRedirect />,
                    children: [
                      {
                        element: createRouteElement(DashboardLayoutWrapper, "App", ["loading", "dashboard"]),
                        children: [
                          {
                            path: `${PLATFORM_OWNER_SEGMENT}/*`,
                            element: <LevelBasedRoutes />,
                          },
                          {
                            path: `${ADMIN_SEGMENT}/*`,
                            element: <LevelBasedRoutes />,
                          },
                          {
                            path: `${SUPER_ADMIN_SEGMENT}/*`,
                            element: <LevelBasedRoutes />,
                          },
                          {
                            path: `${STAFF_SEGMENT}/*`,
                            element: <LevelBasedRoutes />,
                          },
                          {
                            path: `${MEMBER_SEGMENT}/*`,
                            element: <LevelBasedRoutes />,
                          },
                      
                        ],
                      },
                     
                      {
                        path: MEMBER_ONBOARDING_ROUTE.MEMBER_ONBOARDING,
                        element: createRouteElement(MemberOnboardingPage, "App", ["loading", "member", "onboarding"]),
                      },
                      {
                        path: BUSINESS_ONBOARDING_ROUTE.BUSINESS_ONBOARDING,
                        element: createRouteElement(BusinessOnboardingPage, "App", ["loading", "business", "onboarding"]),
                      },
                    ],
                  },
                ],
              },
            ],
          },
        ],
      },
      ...commonRoutes,

    ],
  },
]);

export default appRouter;
