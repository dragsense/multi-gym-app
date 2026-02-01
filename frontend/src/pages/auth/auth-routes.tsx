// src/routes/auth.routes.tsx
import { lazy } from "react";
import { PUBLIC_ROUTES } from "@/config/routes.config";
import { createRouteElement } from "@/lib/route-utils";

// React 19: Lazy load auth pages with enhanced performance
const LoginPage = lazy(() => import("./login"));
const SignupPage = lazy(() => import("./signup"));
const ForgotPasswordPage = lazy(() => import("./forgot-password"));
const ResetPasswordPage = lazy(() => import("./reset-password"));
const VerifyOtpPage = lazy(() => import("./otp"));
const ImpersonatePage = lazy(() => import("./impersonate"));

// React 19: Enhanced auth routes with lazy loading and Suspense
const authRoutes = [
  {
    path: PUBLIC_ROUTES.LOGIN,
    element: createRouteElement(LoginPage, "Authentication", ["preparing", "secure", "login", "experience"]),
  },
  {
    path: PUBLIC_ROUTES.SIGNUP,
    element: createRouteElement(SignupPage, "Authentication", ["preparing", "signup", "form"]),
  },
  {
    path: PUBLIC_ROUTES.FORGOT_PASSWORD,
    element: createRouteElement(ForgotPasswordPage, "Authentication", ["loading", "password", "recovery"]),
  },
  {
    path: PUBLIC_ROUTES.RESET_PASSWORD,
    element: createRouteElement(ResetPasswordPage, "Authentication", ["loading", "password", "reset", "form"]),
  },
  {
    path: PUBLIC_ROUTES.VERIFY_OTP,
    element: createRouteElement(VerifyOtpPage, "Authentication", ["loading", "otp", "verification"]),
  },
  {
    path: PUBLIC_ROUTES.IMPERSONATE,
    element: createRouteElement(ImpersonatePage, "Authentication", ["verifying", "credentials"]),
  },
];

export default authRoutes;
