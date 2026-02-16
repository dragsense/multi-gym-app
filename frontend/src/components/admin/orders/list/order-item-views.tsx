import { Eye } from "lucide-react";
import { useTransition } from "react";
import { Button } from "@/components/ui/button";
import { AppCard } from "@/components/layout-ui/app-card";
import type { IOrder } from "@shared/interfaces/order.interface";
import type { ColumnDef } from "@tanstack/react-table";
import { formatCurrency, formatDate } from "@shared/lib/format.utils";
import type { IUserSettings } from "@shared/interfaces/settings.interface";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { Calendar, DollarSign, ImageIcon } from "lucide-react";
import { EOrderStatus } from "@shared/enums/order.enum";
import { Badge } from "@/components/ui/badge";

interface IOrderItemViewArgs {
  handleView: (id: string) => void;
  componentId?: string;
  settings?: IUserSettings;
  t: (key: string) => string;
}

export function orderItemViews({
  handleView,
  componentId = "order-item-views",
  settings,
  t,
}: IOrderItemViewArgs) {
  const [, startTransition] = useTransition();

  // Helper for status colors
  const getStatusColor = (status: string) => {
    switch (status?.toUpperCase()) {
      case "PENDING": return "bg-yellow-100 text-yellow-800";
      case "PAID": return "bg-green-100 text-green-800";
      case "FULLFILLED":
      case "FULFILLED": return "bg-blue-100 text-blue-800";
      case "SHIPPED": return "bg-purple-100 text-purple-800";
      case "CANCELLED": return "bg-gray-100 text-gray-800";
      default: return "bg-gray-100 text-gray-800";
    }
  };

  const columns: ColumnDef<IOrder>[] = [
    {
      accessorKey: "orderRef",
      header: t("reference"),
      cell: ({ row }) => {
        // @ts-ignore - Types might not fully reflect relations yet
        const imageUrl = row.original.lineItems?.[0]?.product?.defaultImages?.[0]?.url;

        return (
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-md overflow-hidden bg-muted flex items-center justify-center border shrink-0">
              {imageUrl ? (
                <img src={imageUrl} alt="Product" className="h-full w-full object-cover" />
              ) : (
                <ImageIcon className="h-5 w-5 text-muted-foreground" />
              )}
            </div>
            <span className="font-medium">{row.original.orderRef ?? row.original.id}</span>
          </div>
        );
      },
    },
    {
      accessorKey: "createdAt",
      header: t("date"),
      cell: ({ row }) => (
        <div className="flex items-center gap-1">
          <Calendar className="h-4 w-4 text-muted-foreground" />
          <span>{formatDate(row.original.createdAt, settings)}</span>
        </div>
      ),
    },
    {
      accessorKey: "totalAmount",
      header: t("amount"),
      cell: ({ row }) => (
        <div className="flex items-center gap-1">
          <DollarSign className="h-4 w-4 text-green-600" />
          <span className="font-medium">
            {formatCurrency(row.original.totalAmount, undefined, undefined, 2, 2, settings)}
          </span>
        </div>
      ),
    },
    {
      accessorKey: "status",
      header: t("status"),
      cell: ({ row }) => (
        <Badge variant="outline" className={getStatusColor(row.original.status)}>{row.original.status}</Badge>
      ),
    },
    {
      id: "actions",
      header: t("actions"),
      cell: ({ row }) => (
        <Tooltip>
          <TooltipTrigger asChild>
            <Button
              variant="ghost"
              size="sm"
              onClick={(e) => {
                e.stopPropagation();
                handleView(row.original.id);
              }}
              data-component-id={componentId}
            >
              <Eye className="h-4 w-4" />
            </Button>
          </TooltipTrigger>
          <TooltipContent>{t("view")}</TooltipContent>
        </Tooltip>
      ),
    },
  ];

  const listItem = (item: IOrder) => {
    // @ts-ignore
    const imageUrl = item.lineItems?.[0]?.product?.defaultImages?.[0]?.url;

    return (
      <AppCard
        className="p-4 hover:shadow-md transition-shadow"
        data-component-id={componentId}
      >
        <div className="space-y-4">
          <div className="flex justify-between items-start">
            <div className="flex gap-4">
              <div className="h-16 w-16 rounded-md overflow-hidden bg-muted flex items-center justify-center border shrink-0">
                {imageUrl ? (
                  <img src={imageUrl} alt="Product" className="h-full w-full object-cover" />
                ) : (
                  <ImageIcon className="h-6 w-6 text-muted-foreground" />
                )}
              </div>
              <div>
                <h3 className="font-semibold text-lg">{item.orderRef ?? item.id}</h3>
                <div className="mt-2">
                  <Badge variant="outline" className={getStatusColor(item.status)}>{item.status}</Badge>
                </div>
              </div>
            </div>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => startTransition(() => handleView(item.id))}
              title={t("view")}
            >
              <Eye className="h-4 w-4 text-muted-foreground" />
            </Button>
          </div>

          <div className="space-y-2 text-sm text-muted-foreground ml-20">
            <div className="flex items-center gap-2">
              <DollarSign className="h-4 w-4" />
              <span>
                <strong>{t("amount")}:</strong>{" "}
                {formatCurrency(item.totalAmount, undefined, undefined, 2, 2, settings)}
              </span>
            </div>
            <div className="flex items-center gap-2">
              <Calendar className="h-4 w-4" />
              <span>
                <strong>{t("date")}:</strong>{" "}
                {formatDate(item.createdAt, settings)}
              </span>
            </div>
          </div>
        </div>
      </AppCard>
    );
  };

  return { columns, listItem };
}
