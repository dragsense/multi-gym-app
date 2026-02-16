import { Eye, Pencil, Trash2, LayoutGrid, ExternalLink, EyeOff } from "lucide-react";
import { useTransition } from "react";

// Types
import type { IPage } from "@shared/interfaces/cms.interface";
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
  handlePreview?: (id: string) => void;
  handlePublish?: (id: string) => void;
  handleDraft?: (id: string) => void;
  componentId?: string;
  t: (key: string) => string;
}

export const pageItemViews = ({
  handleEdit,
  handleDelete,
  handleView,
  handlePreview,
  handlePublish,
  handleDraft,
  componentId = "page-item-views",
  t,
}: IItemViewArgs) => {
  const [, startTransition] = useTransition();

  // Table columns
  const columns: ColumnDef<IPage>[] = [
    {
      accessorKey: "title",
      header: t("title"),
      cell: ({ row }) => (
        <div className="flex items-center gap-2">
          <LayoutGrid className="h-4 w-4 text-muted-foreground" />
          <span className="font-medium">{row.original.title}</span>
        </div>
      ),
    },
    {
      accessorKey: "slug",
      header: t("slug"),
      cell: ({ row }) => (
        <span className="text-muted-foreground">{row.original.slug}</span>
      ),
    },
    {
      accessorKey: "isPublished",
      header: t("status"),
      cell: ({ row }) =>
        row.original.isPublished ? t("published") : t("unpublished"),
    },
    {
      accessorKey: "publishedAt",
      header: t("publishedAt"),
      cell: ({ row }) =>
        row.original.publishedAt
          ? new Date(row.original.publishedAt).toLocaleDateString()
          : "-",
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
          {handlePreview && row.original.isPublished && (
            <Button
              variant="ghost"
              size="sm"
              onClick={() =>
                startTransition(() => handlePreview(row.original.id))
              }
              title={t("preview")}
            >
              <ExternalLink className="h-4 w-4" />
            </Button>
          )}
          <Button
            variant="ghost"
            size="sm"
            onClick={() => startTransition(() => handleEdit(row.original.id))}
            title={t("edit")}
          >
            <Pencil className="h-4 w-4" />
          </Button>
          {handlePublish && handleDraft && (
            <Button
              variant="ghost"
              size="sm"
              onClick={() =>
                startTransition(() =>
                  row.original.isPublished
                    ? handleDraft(row.original.id)
                    : handlePublish(row.original.id)
                )
              }
              title={row.original.isPublished ? t("draft") : t("publish")}
            >
              {row.original.isPublished ? (
                <EyeOff className="h-4 w-4" />
              ) : (
                <Eye className="h-4 w-4" />
              )}
            </Button>
          )}
          {!row.original.isSystem && (
            <Button
              variant="ghost"
              size="sm"
              onClick={() => startTransition(() => handleDelete(row.original.id))}
              title={t("delete")}
            >
              <Trash2 className="h-4 w-4 text-red-500" />
            </Button>
          )}
        </div>
      ),
    },
  ];

  const listItem = (item: IPage) => {
    return (
      <AppCard
        key={item.id}
        className="hover:shadow-md transition-shadow"
        data-component-id={componentId}
      >
        <div className="flex flex-col gap-4">
          <div className="flex-1 w-full">
            <h3 className="font-semibold text-lg text-gray-900 mb-2">
              {item.title}
            </h3>
            <div className="flex items-center gap-2 text-sm text-muted-foreground mb-3">
              <LayoutGrid className="h-4 w-4" />
              <span>{item.slug}</span>
            </div>
            <p className="text-sm text-muted-foreground">
              {item.isPublished ? t("published") : t("unpublished")}
            </p>
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
            {handlePreview && item.isPublished && (
              <Button
                variant="ghost"
                size="sm"
                onClick={() => startTransition(() => handlePreview(item.slug))}
                title={t("preview")}
              >
                <ExternalLink className="h-4 w-4" />
              </Button>
            )}
            <Button
              variant="ghost"
              size="sm"
              onClick={() => startTransition(() => handleEdit(item.id))}
              title={t("edit")}
            >
              <Pencil className="h-4 w-4" />
            </Button>
            {handlePublish && handleDraft && (
              <Button
                variant="ghost"
                size="sm"
                onClick={() =>
                  startTransition(() =>
                    item.isPublished ? handleDraft(item.id) : handlePublish(item.id)
                  )
                }
                title={item.isPublished ? t("draft") : t("publish")}
              >
                {item.isPublished ? (
                  <EyeOff className="h-4 w-4" />
                ) : (
                  <Eye className="h-4 w-4" />
                )}
              </Button>
            )}
            {!item.isSystem && (
              <Button
                variant="ghost"
                size="sm"
                onClick={() => startTransition(() => handleDelete(item.id))}
                title={t("delete")}
              >
                <Trash2 className="h-4 w-4 text-red-500" />
              </Button>
            )}
          </div>
        </div>
      </AppCard>
    );
  };

  return { columns, listItem };
};
