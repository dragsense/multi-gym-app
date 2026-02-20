// External Libraries
import { Outlet } from "react-router-dom";
import { useId } from "react";

// UI Components
import { Toaster } from "@/components/ui/sonner";

// Stores
import type { IBusinessTheme } from "@shared/interfaces";
import { SingleHandler } from "@/handlers/single-handler";
import { fetchCurrentBusinessTheme } from "@/services/business/business-theme.api";
import { BusinessThemeComponent } from "@/components/layout-ui/business-theme";
import { BUSINESS_THEME_STORE_KEY } from "@/components/layout-ui/business-theme";

interface MainLayoutProps {}

export default function MainLayout({}: MainLayoutProps) {
  // React 19: Essential IDs
  const componentId = useId();

  return (
    <div className="p-2" data-component-id={componentId}>
      {/* Load business theme using SingleHandler */}
      <SingleHandler<IBusinessTheme | null, {}>
        storeKey={BUSINESS_THEME_STORE_KEY}
        enabled={true}
        name="Business Theme"
        queryFn={async (_id, _queryParams) => {
          return fetchCurrentBusinessTheme();
        }}
        SingleComponent={({ storeKey, store }) => (
          <BusinessThemeComponent storeKey={storeKey} store={store}>
            <Outlet />
          </BusinessThemeComponent>
        )}
      />

      <Toaster />
    </div>
  );
}
