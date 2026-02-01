import { Eye, Pencil, Trash2, Mail, Power, PowerOff } from "lucide-react";
import { useTransition } from "react";

// Types
import type { IEmailTemplate } from "@shared/interfaces/cms.interface";
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
  handleActivate?: (id: string) => void;
  handleDeactivate?: (id: string) => void;
  componentId?: string;
  t: (key: string) => string;
}

export const emailTemplateItemViews = ({
  handleEdit,
  handleDelete,
  handleView,
  handleActivate,
  handleDeactivate,
  componentId = "email-template-item-views",
  t,
}: IItemViewArgs) => {
  const [, startTransition] = useTransition();

  // Table columns
  const columns: ColumnDef<IEmailTemplate>[] = [
    {
      accessorKey: "name",
      header: t("name"),
      cell: ({ row }) => (
        <div className="flex items-center gap-2">
          <Mail className="h-4 w-4 text-muted-foreground" />
          <span className="font-medium">{row.original.name}</span>
        </div>
      ),
    },
    {
      accessorKey: "identifier",
      header: t("identifier"),
      cell: ({ row }) => (
        <span className="text-muted-foreground">{row.original.identifier}</span>
      ),
    },
    {
      accessorKey: "subject",
      header: t("subject"),
      cell: ({ row }) => (
        <span className="text-muted-foreground">{row.original.subject}</span>
      ),
    },
    {
      accessorKey: "isActive",
      header: t("status"),
      cell: ({ row }) =>
        row.original.isActive ? t("active") : t("inactive"),
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
          {handleActivate && handleDeactivate && (
            <Button
              variant="ghost"
              size="sm"
              onClick={() =>
                startTransition(() =>
                  row.original.isActive
                    ? handleDeactivate(row.original.id)
                    : handleActivate(row.original.id)
                )
              }
              title={row.original.isActive ? t("deactivate") : t("activate")}
            >
              {row.original.isActive ? (
                <PowerOff className="h-4 w-4" />
              ) : (
                <Power className="h-4 w-4" />
              )}
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

  const listItem = (item: IEmailTemplate) => {
    return (
      <AppCard
        key={item.id}
        className="hover:shadow-md transition-shadow"
        data-component-id={componentId}
      >
        <div className="flex flex-col gap-4">
          <div className="flex-1 w-full">
            <h3 className="font-semibold text-lg text-gray-900 mb-2">
              {item.name}
            </h3>
            <div className="flex items-center gap-2 text-sm text-muted-foreground mb-3">
              <Mail className="h-4 w-4" />
              <span>{item.identifier}</span>
            </div>
            <p className="text-sm text-muted-foreground">{item.subject}</p>
          </div>
          <div className="flex items-center justify-end gap-2 pt-3 border-t">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => startTransition(() => handleView(item.id))}
              title={t("view")}
            >
              <Eye className="h-4 w-4" />
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => startTransition(() => handleEdit(item.id))}
              title={t("edit")}
            >
              <Pencil className="h-4 w-4" />
            </Button>
            {handleActivate && handleDeactivate && (
              <Button
                variant="ghost"
                size="sm"
                onClick={() =>
                  startTransition(() =>
                    item.isActive ? handleDeactivate(item.id) : handleActivate(item.id)
                  )
                }
                title={item.isActive ? t("deactivate") : t("activate")}
              >
                {item.isActive ? (
                  <PowerOff className="h-4 w-4" />
                ) : (
                  <Power className="h-4 w-4" />
                )}
              </Button>
            )}
            <Button
              variant="ghost"
              size="sm"
              onClick={() => startTransition(() => handleDelete(item.id))}
              title={t("delete")}
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
