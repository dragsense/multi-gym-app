// React & Hooks
import { Suspense, useId } from "react";
import { Navigate, Outlet, useLocation } from "react-router-dom";

// Custom Hooks
import { useAuthUser } from "@/hooks/use-auth-user";

// Config
import { PUBLIC_ROUTES } from "@/config/routes.config";


// Layout Components
import { AppLoader } from "@/components/layout-ui/app-loader";

export default function PrivateRoute() {
  // React 19: Essential IDs
  const componentId = useId();
  
  const { user, isLoading } = useAuthUser();
  const location = useLocation();

  if (isLoading) return <AppLoader />;

  if (!user) {
    return (
      <Navigate to={PUBLIC_ROUTES.LOGIN} state={{ from: location }} replace />
    );
  }

  return (
    <Suspense fallback={<AppLoader />}>
      <div data-component-id={componentId}>
        <Outlet />
      </div>
    </Suspense>
  );
}
