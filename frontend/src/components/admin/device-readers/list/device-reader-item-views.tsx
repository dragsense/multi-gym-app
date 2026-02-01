import { Eye, Pencil, Trash2, Radio } from "lucide-react";
import { useTransition } from "react";

// Types
import { type IDeviceReader } from "@shared/interfaces/device-reader.interface";
import type { ColumnDef } from "@tanstack/react-table";

// Components
import { Button } from "@/components/ui/button";
import { AppCard } from "@/components/layout-ui/app-card";
import { Badge } from "@/components/ui/badge";

// Utils
import { useI18n } from "@/hooks/use-i18n";
import { EDeviceReaderStatus } from "@shared/enums/device-reader.enum";
import { cn } from "@/lib/utils";
import { buildSentence } from "@/locales/translations";

interface IItemViewArgs {
  handleEdit: (id: string) => void;
  handleDelete: (id: string) => void;
  handleView: (id: string) => void;
  componentId?: string;
  t: (key: string) => string;
}

const statusColors: Record<EDeviceReaderStatus, string> = {
  [EDeviceReaderStatus.ACTIVE]: "bg-green-100 text-green-800",
  [EDeviceReaderStatus.INACTIVE]: "bg-gray-100 text-gray-800",
  [EDeviceReaderStatus.MAINTENANCE]: "bg-yellow-100 text-yellow-800",
};

export const itemViews = ({
  handleEdit,
  handleDelete,
  handleView,
  componentId = "device-reader-item-views",
  t,
}: IItemViewArgs) => {
  const [, startTransition] = useTransition();

  // Table columns
  const columns: ColumnDef<IDeviceReader>[] = [
    {
      accessorKey: "deviceName",
      header: buildSentence(t, "device", "name"),
      cell: ({ row }) => (
        <div className="flex items-center gap-2">
          <Radio className="h-4 w-4 text-muted-foreground" />
          <span className="font-medium">{row.original.deviceName}</span>
        </div>
      ),
    },
    {
      accessorKey: "macAddress",
      header: buildSentence(t, "mac", "address"),
      cell: ({ row }) => (
        <span className="text-muted-foreground font-mono text-sm">
          {row.original.macAddress}
        </span>
      ),
    },
    {
      accessorKey: "status",
      header: t("status"),
      cell: ({ row }) => (
        <Badge className={cn(statusColors[row.original.status], "text-xs")}>
          {row.original.status.replace('_', ' ')}
        </Badge>
      ),
    },
    {
      id: "actions",
      header: buildSentence(t, "actions"),
      cell: ({ row }) => (
        <div className="flex items-center gap-2">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => startTransition(() => handleView(row.original.id))}
            title={t("view")}
          >
            <Eye className="h-4 w-4" />
          </Button>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => startTransition(() => handleEdit(row.original.id))}
            title={t("edit")}
          >
            <Pencil className="h-4 w-4" />
          </Button>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => startTransition(() => handleDelete(row.original.id))}
            title={t("delete")}
          >
            <Trash2 className="h-4 w-4 text-red-500" />
          </Button>
        </div>
      ),
    },
  ];

  const listItem = (item: IDeviceReader) => {
    return (
      <AppCard 
        key={item.id}
        className="hover:shadow-md transition-shadow"
        data-component-id={componentId}
      >
        <div className="flex flex-col gap-4">
          {/* Title and Details */}
          <div className="flex-1 w-full">
            <div className="flex items-center justify-between mb-2">
              <h3 className="font-semibold text-lg text-gray-900">
                {item.deviceName}
              </h3>
              <Badge className={cn(statusColors[item.status], "text-xs")}>
                {item.status.replace('_', ' ')}
              </Badge>
            </div>
            
            {/* MAC Address */}
            <div className="flex items-center gap-2 text-sm text-muted-foreground mb-3">
              <Radio className="h-4 w-4" />
              <span>{item.macAddress}</span>
            </div>
          </div>

          {/* Actions at Bottom */}
          <div className="flex items-center justify-end gap-2 pt-3 border-t">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => startTransition(() => handleView(item.id))}
              title={t('view')}
            >
              <Eye className="h-4 w-4" />
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => startTransition(() => handleEdit(item.id))}
              title={t('edit')}
            >
              <Pencil className="h-4 w-4" />
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => startTransition(() => handleDelete(item.id))}
              title={t('delete')}
            >
              <Trash2 className="h-4 w-4 text-red-500" />
            </Button>
          </div>
        </div>
      </AppCard>
    );
  };

  return { columns, listItem };
};

