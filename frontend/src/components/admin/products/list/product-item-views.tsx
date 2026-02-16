import { Eye, Pencil, Trash2, Image as ImageIcon, Package, DollarSign } from "lucide-react";
import { useTransition } from "react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { AppCard } from "@/components/layout-ui/app-card";
import type { IProduct } from "@shared/interfaces/products/product.interface";
import { useI18n } from "@/hooks/use-i18n";
import { useUserSettings } from "@/hooks/use-user-settings";
import { formatDate } from "@/lib/utils";

interface IItemViewArgs {
  handleEdit: (id: string) => void;
  handleDelete: (id: string) => void;
  handleView: (id: string) => void;
  componentId?: string;
}

export function productItemViews({
  handleEdit,
  handleDelete,
  handleView,
  componentId = "product-item-views",
}: IItemViewArgs) {
  const [, startTransition] = useTransition();
  const { t } = useI18n();
  const { settings } = useUserSettings();

  const listItem = (item: IProduct) => {
    const thumb = item.defaultImages?.[0];
    const thumbUrl = typeof thumb === "object" && thumb?.url ? thumb.url : null;

    return (
      <AppCard
        key={item.id}
        className="overflow-hidden hover:shadow-lg transition-all duration-200"
        data-component-id={componentId}
      >
        <div className="flex flex-col h-full">
          {/* First column: default image */}
          <div className="relative w-full aspect-[4/3] bg-muted rounded-t-lg overflow-hidden shrink-0">
            {thumbUrl ? (
              <img
                src={thumbUrl}
                alt={item.name}
                className="w-full h-full object-cover"
                crossOrigin="anonymous"
              />
            ) : (
              <div className="w-full h-full flex items-center justify-center">
                <ImageIcon className="w-12 h-12 text-muted-foreground/50" />
              </div>
            )}
            {item.isActive === false && (
              <Badge variant="secondary" className="absolute top-2 right-2">
                {t("inactive")}
              </Badge>
            )}
          </div>

          <div className="flex flex-col flex-1 p-4 gap-3">
            <h3 className="font-semibold text-base line-clamp-2">{item.name}</h3>
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <DollarSign className="h-4 w-4 shrink-0" />
              <span>{Number(item.defaultPrice ?? 0).toFixed(2)}</span>
            </div>
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <Package className="h-4 w-4 shrink-0" />
              <span>
                {t("qty")}: {item.totalQuantity ?? 0}
              </span>
            </div>
            {item.createdAt && (
              <div className="text-xs text-muted-foreground mt-auto">
                {formatDate(item.createdAt, settings as any)}
              </div>
            )}

            <div className="flex items-center justify-end gap-1 pt-2 border-t">
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
              <Button
                variant="ghost"
                size="sm"
                onClick={() => startTransition(() => handleDelete(item.id))}
                title={t("delete")}
              >
                <Trash2 className="h-4 w-4 text-destructive" />
              </Button>
            </div>
          </div>
        </div>
      </AppCard>
    );
  };

  return { listItem };
}
