import { Eye, Pencil, Trash2, MapPin, DoorOpen } from "lucide-react";
import { useTransition } from "react";

// Types
import { type ILocation } from "@shared/interfaces/location.interface";
import type { ColumnDef } from "@tanstack/react-table";

// Components
import { Button } from "@/components/ui/button";
import { AppCard } from "@/components/layout-ui/app-card";

// Utils
import { useI18n } from "@/hooks/use-i18n";
import { buildSentence } from "@/locales/translations";

interface IItemViewArgs {
  handleEdit: (id: string) => void;
  handleDelete: (id: string) => void;
  handleView: (id: string) => void;
  handleManageDoors?: (id: string) => void;
  componentId?: string;
  t: (key: string) => string;
}

export const itemViews = ({
  handleEdit,
  handleDelete,
  handleView,
  handleManageDoors,
  componentId = "location-item-views",
  t,
}: IItemViewArgs) => {
  // React 19: Essential IDs and transitions - MUST be called at top level
  const [, startTransition] = useTransition();

  // Table columns
  const columns: ColumnDef<ILocation>[] = [
    {
      accessorKey: "name",
      header: t("name"),
      cell: ({ row }) => (
        <div className="flex items-center gap-2">
          <MapPin className="h-4 w-4 text-muted-foreground" />
          <span className="font-medium">{row.original.name}</span>
        </div>
      ),
    },
    {
      accessorKey: "address",
      header: t("address"),
      cell: ({ row }) => (
        <span className="text-muted-foreground">{row.original.address}</span>
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
          {handleManageDoors && (
            <Button
              variant="ghost"
              size="sm"
              onClick={() => startTransition(() => handleManageDoors(row.original.id))}
              title={t("manageDoors")}
            >
              <DoorOpen className="h-4 w-4" />
            </Button>
          )}
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

  const listItem = (item: ILocation) => {
    return (
      <AppCard 
        key={item.id}
        className="hover:shadow-md transition-shadow"
        data-component-id={componentId}
      >
        <div className="flex flex-col gap-4">
          {/* Title and Details */}
          <div className="flex-1 w-full">
            <h3 className="font-semibold text-lg text-gray-900 mb-2">
              {item.name}
            </h3>
            
            {/* Address */}
            <div className="flex items-center gap-2 text-sm text-muted-foreground mb-3">
              <MapPin className="h-4 w-4" />
              <span>{item.address}</span>
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
            {handleManageDoors && (
              <Button
                variant="ghost"
                size="sm"
                onClick={() => startTransition(() => handleManageDoors(item.id))}
                title={t('manageDoors')}
              >
                <DoorOpen className="h-4 w-4" />
              </Button>
            )}
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

