// React & Hooks
import type { ReactNode } from "react";
import { useId } from "react";

// External Libraries
import { Outlet } from "react-router-dom";

// Hooks
import { useI18n } from "@/hooks/use-i18n";
import { useAuthUser } from "@/hooks/use-auth-user";

import { EUserLevels } from "@shared/enums";

// Layout Components
import { AppSidebar } from "@/components/layout-ui/app-sidebar";
import { AppHeader } from "@/components/layout-ui/app-header";

// UI Components
import { SidebarInset, SidebarProvider } from "@/components/ui/sidebar";
import { useAutoPushSubscription } from "@/components/shared-ui/push-notification-setup";

// Page Components
import LocationSelection, { LOCATION_SELECTION_STORE_KEY } from "@/page-components/location/location-selection";



interface DashboardLayoutProps {
  children: ReactNode;
}



export default function DashboardLayout({ children }: DashboardLayoutProps) {
  // React 19: Essential IDs
  const componentId = useId();
  const { t, direction } = useI18n();
  const { user } = useAuthUser();

  const Admin = user?.level === EUserLevels.ADMIN;

  useAutoPushSubscription();

  return (
    <SidebarProvider>
      <AppSidebar />
      <SidebarInset
        className="w-100"
        data-component-id={componentId}
        dir={direction}
      >


        {/* Location Selection - Global Store for Super Admin */}
        {Admin && <LocationSelection />}

        <AppHeader />

        <div className="flex flex-1 flex-col p-4 lg:px-6 pb-2">
          <div className="@container/main flex flex-1 flex-col gap-2">
            {children}
          </div>
        </div>


        <footer className="text-center py-2 text-sm text-muted-foreground">
          © {new Date().getFullYear()} {t('appName')}
        </footer>
      </SidebarInset>
    </SidebarProvider>
  );
}

export function DashboardLayoutWrapper() {

  return (
    <DashboardLayout>
      <Outlet />
    </DashboardLayout>
  );
}
