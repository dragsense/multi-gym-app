import { Eye, Pencil, Trash2, Tag, DollarSign, Percent } from "lucide-react";
import { useTransition } from "react";

// Types
import { type IServiceOffer } from "@shared/interfaces/service-offer.interface";
import type { ColumnDef } from "@tanstack/react-table";

// Components
import { Button } from "@/components/ui/button";
import { AppCard } from "@/components/layout-ui/app-card";
import { Badge } from "@/components/ui/badge";

// Utils
import { useI18n } from "@/hooks/use-i18n";
import { EServiceOfferStatus } from "@shared/enums/service-offer.enum";
import { cn } from "@/lib/utils";
import { buildSentence } from "@/locales/translations";
import { formatCurrency } from "@/lib/utils";

interface IItemViewArgs {
  handleEdit: (id: string) => void;
  handleDelete: (id: string) => void;
  handleView: (id: string) => void;
  componentId?: string;
  t: (key: string) => string;
}

const statusColors: Record<EServiceOfferStatus, string> = {
  [EServiceOfferStatus.ACTIVE]: "bg-green-100 text-green-800",
  [EServiceOfferStatus.INACTIVE]: "bg-gray-100 text-gray-800",
};

export const itemViews = ({
  handleEdit,
  handleDelete,
  handleView,
  componentId = "service-offer-item-views",
  t,
}: IItemViewArgs) => {
  const [, startTransition] = useTransition();

  // Table columns
  const columns: ColumnDef<IServiceOffer>[] = [
    {
      accessorKey: "name",
      header: t("name"),
      cell: ({ row }) => (
        <div className="flex items-center gap-2">
          <Tag className="h-4 w-4 text-muted-foreground" />
          <span className="font-medium">{row.original.name}</span>
        </div>
      ),
    },
    {
      id: "price",
      header: buildSentence(t, "offer", "price"),
      cell: ({ row }) => {
        const discountAmount = (Number(row.original.offerPrice) * (Number(row.original.discount) || 0)) / 100;
        const finalPrice = Number(row.original.offerPrice) - discountAmount;
        return (
          <div className="flex items-center gap-2">
            <DollarSign className="h-4 w-4 text-green-600" />
            {row.original.discount > 0 ? (
              <div className="flex items-center gap-2">
                <span className="line-through text-muted-foreground text-sm">
                  {formatCurrency(row.original.offerPrice)}
                </span>
                <span className="font-semibold text-primary">
                  {formatCurrency(finalPrice)}
                </span>
              </div>
            ) : (
              <span className="font-medium">{formatCurrency(row.original.offerPrice)}</span>
            )}
          </div>
        );
      },
    },
    {
      accessorKey: "discount",
      header: buildSentence(t, "discount", "percentage"),
      cell: ({ row }) => (
        row.original.discount > 0 ? (
          <div className="flex items-center gap-2">
            <Percent className="h-4 w-4 text-muted-foreground" />
            <Badge variant="secondary" className="text-xs">
              {row.original.discount}%
            </Badge>
          </div>
        ) : (
          <span className="text-muted-foreground">-</span>
        )
      ),
    },
    {
      id: "trainerService",
      header: buildSentence(t, "trainer", "service", "attached"),
      cell: ({ row }) => (
        row.original.trainerService ? (
          <span className="text-muted-foreground">
            {row.original.trainerService.title}
          </span>
        ) : (
          <span className="text-muted-foreground">-</span>
        )
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

  const listItem = (item: IServiceOffer) => {
    const discountAmount = (Number(item.offerPrice) * (Number(item.discount) || 0)) / 100;
    const finalPrice = Number(item.offerPrice) - discountAmount;

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
                {item.name}
              </h3>
              <Badge className={cn(statusColors[item.status], "text-xs")}>
                {item.status.replace('_', ' ')}
              </Badge>
            </div>
            
            {/* Price and Discount */}
            <div className="space-y-2 text-sm text-muted-foreground mb-3">
              <div className="flex items-center gap-2">
                <DollarSign className="h-4 w-4" />
                <span className="font-medium">
                  {item.discount > 0 ? (
                    <>
                      <span className="line-through text-muted-foreground mr-2">
                        ${item.offerPrice}
                      </span>
                      <span className="text-primary font-semibold">
                        ${finalPrice.toFixed(2)}
                      </span>
                    </>
                  ) : (
                    <span>${item.offerPrice}</span>
                  )}
                </span>
              </div>
              {item.discount > 0 && (
                <div className="flex items-center gap-2">
                  <Percent className="h-4 w-4" />
                  <Badge variant="secondary" className="text-xs">
                    {item.discount}% {t('discount')}
                  </Badge>
                </div>
              )}
              {item.trainerService && (
                <div className="flex items-center gap-2">
                  <Tag className="h-4 w-4" />
                  <span className="truncate">{item.trainerService.title}</span>
                </div>
              )}
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

