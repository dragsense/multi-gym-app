import { Eye, Pencil, Trash2, Briefcase, User } from "lucide-react";
import { useTransition } from "react";

// Types
import { type ITrainerService } from "@shared/interfaces/trainer-service.interface";
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
  componentId?: string;
  t: (key: string) => string;
}

export const itemViews = ({
  handleEdit,
  handleDelete,
  handleView,
  componentId = "trainer-service-item-views",
  t,
}: IItemViewArgs) => {
  const [, startTransition] = useTransition();

  // Table columns
  const columns: ColumnDef<ITrainerService>[] = [
    {
      accessorKey: "title",
      header: t("title"),
      cell: ({ row }) => (
        <div className="flex items-center gap-2">
          <Briefcase className="h-4 w-4 text-muted-foreground" />
          <span className="font-medium">{row.original.title}</span>
        </div>
      ),
    },
    {
      accessorKey: "description",
      header: t("description"),
      cell: ({ row }) => (
        <span className="text-muted-foreground line-clamp-2 max-w-md">
          {row.original.description || "-"}
        </span>
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

  const listItem = (item: ITrainerService) => {
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
                {item.title}
              </h3>
            </div>
            
            {/* Description */}
            {item.description && (
              <p className="text-sm text-muted-foreground mb-3 line-clamp-2">
                {item.description}
              </p>
            )}

      
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

