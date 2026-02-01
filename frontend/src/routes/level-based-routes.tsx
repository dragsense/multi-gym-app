import { useRoutes } from "react-router-dom";
import { useAuthUser } from "@/hooks/use-auth-user";
import { adminRoutesByLevel } from "@/pages/admin/admin-routes";
import { filterStaffRoutes, baseStaffRoutes } from "@/pages/admin/admin-routes";
import { EUserLevels } from "@shared/enums";
import { useMemo } from "react";

/**
 * Dynamic routes component that filters routes based on user level, permissions, and subscription features
 */
export default function LevelBasedRoutes() {
  const { user } = useAuthUser();
  
  const routes = useMemo(() => {
    if (!user) return [];

    // Get subscription features from user object (added by /auth/me endpoint)
    const subscriptionFeatures = (user as any)?.subscriptionFeatures || [];

    // For staff level, use the special filterStaffRoutes function
    if (user.level === EUserLevels.STAFF) {
      return filterStaffRoutes(baseStaffRoutes, user, subscriptionFeatures);
    }

    // For other levels, use adminRoutesByLevel
    const getRoutes = adminRoutesByLevel[user.level];
    if (!getRoutes) return [];

    return getRoutes(user, subscriptionFeatures);
  }, [user]);

  return useRoutes(routes);
}
