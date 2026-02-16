// External Libraries

// Types
import type { IPlatformOwnerDashboardStats } from "@shared/interfaces/platform-owner-dashboard.interface";

// Handlers
import { SingleHandler } from '@/handlers';

// Components
import { PlatformOwnerDashboardControls, PlatformOwnerDashboardView, type IPlatformOwnerDashboardExtraProps } from "@/components/admin";

// Layouts
import { PageInnerLayout } from "@/layouts";

// API
import { fetchPlatformOwnerDashboardStats } from "@/services/platform-owner-dashboard.api";

// Stores
import type { TSingleHandlerStore } from "@/stores";

export default function PlatformOwnerDashboardPage() {
  const STORE_KEY = "platformOwnerDashboard";

  return (
    <SingleHandler<IPlatformOwnerDashboardStats, IPlatformOwnerDashboardExtraProps>
      queryFn={(_id, queryParams) => {
        const params: Record<string, string | undefined> = {};

        const customRange = queryParams?.customRange as { from?: Date; to?: Date } | undefined;
        
        // Only send dates if custom range is provided - backend will default to last 30 days
        if (customRange?.from) {
          params.from = customRange.from.toISOString().split("T")[0];
        }

        if (customRange?.to) {
          params.to = customRange.to.toISOString().split("T")[0];
        }

        return fetchPlatformOwnerDashboardStats(params);
      }}
      storeKey={STORE_KEY}
      enabled={true}
      SingleComponent={({ storeKey, store }) => {
        if (!store) {
          return <div>Dashboard store "{storeKey}" not found. Did you forget to register it?</div>;
        }
        return (
          <PageInnerLayout
            Header={
              <Header
                store={store}
              />
            }
          >
            <PlatformOwnerDashboardView storeKey={storeKey} store={store} />
          </PageInnerLayout>
        );
      }}
      singleProps={{
        customRange: undefined
      }}
      initialParams={{
        customRange: undefined
      }}    
    />
  );
}

interface HeaderProps {
  store: TSingleHandlerStore<IPlatformOwnerDashboardStats, IPlatformOwnerDashboardExtraProps>;
}

const Header = ({
  store
}: HeaderProps) => (
  <PlatformOwnerDashboardControls store={store} />
);
