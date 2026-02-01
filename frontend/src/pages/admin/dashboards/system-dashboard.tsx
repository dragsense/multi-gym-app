import { useId } from "react";
import { PageInnerLayout } from "@/layouts";
import { HealthDashboard } from "@/components/admin";
import { SingleHandler, ListHandler } from "@/handlers";
import { getHealthStatus } from "@/services/health.api";
import { fetchDatabaseConnections } from "@/services/database.api";
import type { IHealthStatus } from "@shared/interfaces/health.interface";
import type { IDatabaseConnection } from "@shared/interfaces";
import type { TDatabaseConnectionListData } from "@shared/types";
import { useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { useI18n } from "@/hooks/use-i18n";
import { buildSentence } from "@/locales/translations";
import { DatabaseConnectionsList } from "@/components/admin/database";

export default function SystemDashboardPage() {
  const componentId = useId();

  const queryClient = useQueryClient();

  const STORE_KEY = "health-dashboard";

  const handleRefreshAll = () => {
    queryClient.invalidateQueries({ queryKey: [STORE_KEY + "-single"] });
  };

  const refetchHealth = () => {
    queryClient.invalidateQueries({ queryKey: [STORE_KEY + "-single"] });
  }

  const DATABASE_STORE_KEY = "database-connections";

  return (
    <PageInnerLayout Header={<Header handleRefreshAll={handleRefreshAll} />}>
      <div className="space-y-8" data-component-id={componentId}>
        <SingleHandler<IHealthStatus>
          queryFn={getHealthStatus}
          SingleComponent={HealthDashboard}
          singleProps={{
            refetch: refetchHealth,
          }}
          storeKey={STORE_KEY}
          enabled={true}
        />
        <ListHandler<IDatabaseConnection, TDatabaseConnectionListData>
          queryFn={fetchDatabaseConnections}
          ListComponent={DatabaseConnectionsList}
          storeKey={DATABASE_STORE_KEY}
          initialParams={{ limit: 10, page: 1 }}
        />
      </div>
    </PageInnerLayout>
  );
}

const Header = ({ handleRefreshAll }: { handleRefreshAll: () => void }) => {
  const { t } = useI18n();
  return (
    <Button
      onClick={handleRefreshAll}
    >
      {buildSentence(t, 'refresh', 'all')}
    </Button>
  );
};
