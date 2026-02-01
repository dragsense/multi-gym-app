import { Database, CheckCircle, XCircle, AlertTriangle, Activity } from "lucide-react";
import { useTransition, useId } from "react";
import type { ColumnDef } from "@tanstack/react-table";
import type { IDatabaseConnection } from "@shared/interfaces";
import { Button } from "@/components/ui/button";
import { AppCard } from "@/components/layout-ui/app-card";
import { useI18n } from "@/hooks/use-i18n";
import { buildSentence } from "@/locales/translations";
import { EConnectionStatus } from "@shared/enums";

interface IDatabaseConnectionItemViewsArgs {
  handleView?: (id: string) => void;
  componentId?: string;
  t: (key: string) => string;
}

export function databaseConnectionItemViews({
  componentId = "database-connection-item-views",
  t,
}: IDatabaseConnectionItemViewsArgs) {
  const [, startTransition] = useTransition();
  const componentIdHook = useId();

  const getStatusIcon = (status: EConnectionStatus) => {
    switch (status) {
      case EConnectionStatus.READY:
        return <CheckCircle className="h-4 w-4 text-green-500" />;
      case EConnectionStatus.ERROR:
      case EConnectionStatus.DISCONNECTED:
        return <XCircle className="h-4 w-4 text-red-500" />;
      case EConnectionStatus.INITIALIZING:
      case EConnectionStatus.PENDING:
        return <AlertTriangle className="h-4 w-4 text-yellow-500" />;
      default:
        return <Activity className="h-4 w-4 text-gray-500" />;
    }
  };

  const getStatusColor = (status: EConnectionStatus) => {
    switch (status) {
      case EConnectionStatus.READY:
        return "text-green-600";
      case EConnectionStatus.ERROR:
      case EConnectionStatus.DISCONNECTED:
        return "text-red-600";
      case EConnectionStatus.INITIALIZING:
      case EConnectionStatus.PENDING:
        return "text-yellow-600";
      default:
        return "text-gray-600";
    }
  };

  // Table columns
  const columns: ColumnDef<IDatabaseConnection>[] = [
    {
      accessorKey: "connectionName",
      header: buildSentence(t, "connection", "name"),
      cell: ({ row }) => (
        <div className="flex items-center gap-2">
          <Database className="h-4 w-4 text-muted-foreground" />
          <span className="font-medium">{row.original.connectionName}</span>
        </div>
      ),
    },
    {
      accessorKey: "connectionType",
      header: buildSentence(t, "type"),
      cell: ({ row }) => (
        <span className="text-sm">{row.original.connectionType}</span>
      ),
    },
    {
      id: "host",
      header: buildSentence(t, "host"),
      cell: ({ row }) => (
        <span className="text-sm">{row.original.host}:{row.original.port}</span>
      ),
    },
    {
      accessorKey: "database",
      header: buildSentence(t, "database"),
      cell: ({ row }) => (
        <span className="text-sm">{row.original.database}</span>
      ),
    },
    {
      accessorKey: "databaseMode",
      header: buildSentence(t, "mode"),
      cell: ({ row }) => (
        <span className="text-sm">{row.original.databaseMode}</span>
      ),
    },
    {
      accessorKey: "status",
      header: buildSentence(t, "status"),
      cell: ({ row }) => (
        <div className="flex items-center gap-2">
          {getStatusIcon(row.original.status)}
          <span className={`text-sm font-medium ${getStatusColor(row.original.status)}`}>
            {row.original.status}
          </span>
        </div>
      ),
    },
    {
      accessorKey: "lastCheckedAt",
      header: buildSentence(t, "last", "checked"),
      cell: ({ row }) => (
        <span className="text-sm text-gray-600">
          {row.original.lastCheckedAt
            ? new Date(row.original.lastCheckedAt).toLocaleString()
            : "-"}
        </span>
      ),
    },
  ];

  // List item renderer
  const listItem = (item: IDatabaseConnection) => {
    return (
      <AppCard
        key={item.id}
        className="hover:shadow-md transition-shadow"
        data-component-id={componentId}
      >
        <div className="flex flex-col gap-4">
          <div className="flex-1 w-full">
            <div className="flex items-center gap-2 mb-2">
              <Database className="h-5 w-5 text-muted-foreground" />
              <h3 className="font-semibold text-lg text-gray-900">
                {item.connectionName}
              </h3>
            </div>
            <div className="grid grid-cols-2 gap-3 text-sm">
              <div>
                <span className="text-muted-foreground">
                  {buildSentence(t, "type")}:
                </span>
                <span className="ml-2 font-medium">{item.connectionType}</span>
              </div>
              <div>
                <span className="text-muted-foreground">
                  {buildSentence(t, "mode")}:
                </span>
                <span className="ml-2 font-medium">{item.databaseMode}</span>
              </div>
              <div>
                <span className="text-muted-foreground">
                  {buildSentence(t, "host")}:
                </span>
                <span className="ml-2 font-medium">
                  {item.host}:{item.port}
                </span>
              </div>
              <div>
                <span className="text-muted-foreground">
                  {buildSentence(t, "database")}:
                </span>
                <span className="ml-2 font-medium">{item.database}</span>
              </div>
            </div>
            <div className="mt-3 flex items-center gap-2">
              {getStatusIcon(item.status)}
              <span className={`text-sm font-medium ${getStatusColor(item.status)}`}>
                {item.status}
              </span>
              {item.lastCheckedAt && (
                <span className="text-xs text-muted-foreground ml-auto">
                  {buildSentence(t, "last", "checked")}:{" "}
                  {new Date(item.lastCheckedAt).toLocaleString()}
                </span>
              )}
            </div>
          </div>
        </div>
      </AppCard>
    );
  };

  return { columns, listItem };
}
