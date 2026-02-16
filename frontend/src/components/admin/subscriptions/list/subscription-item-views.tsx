// External Libraries
import { type JSX, useId, useMemo, useTransition } from "react";
import { type ColumnDef } from "@tanstack/react-table";
import { MoreHorizontal, Tag } from "lucide-react";

// UI Components
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Badge } from "@/components/ui/badge";
import { AppCard } from "@/components/layout-ui/app-card";

// Types
import type { ISubscription } from "@shared/interfaces";
import { ESubscriptionStatus, ESubscriptionType } from "@shared/enums";

import {
  Tooltip,
  TooltipTrigger,
  TooltipContent
} from "@/components/ui/tooltip"

const SubscriptionActions = ({
  subscription,
  handleEdit,
  handleDelete,
  handleView,
}: {
  subscription: ISubscription;
  handleEdit?: (id: string) => void;
  handleDelete?: (id: string) => void;
  handleView?: (id: string) => void;
}) => {
  const componentId = useId();
  const [, startTransition] = useTransition();

  const handleViewClick = () => {
    if (handleView) startTransition(() => handleView(subscription.id));
  };
  const handleEditClick = () => {
    if (handleEdit) startTransition(() => handleEdit(subscription.id));
  };
  const handleDeleteClick = () => {
    if (handleDelete) startTransition(() => handleDelete(subscription.id));
  };

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          variant="ghost"
          className="h-8 w-8 p-0"
          data-component-id={componentId}
        >
          <span className="sr-only">Open menu</span>
          <MoreHorizontal className="h-4 w-4" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        <DropdownMenuLabel>Actions</DropdownMenuLabel>
        <DropdownMenuSeparator />
        {handleView && (
          <DropdownMenuItem onClick={handleViewClick}>
            View Details
          </DropdownMenuItem>
        )}
        <DropdownMenuSeparator />
        {handleEdit && (
          <DropdownMenuItem onClick={handleEditClick}>Edit</DropdownMenuItem>
        )}
        {handleDelete && (
          <DropdownMenuItem
            className="text-destructive"
            onClick={handleDeleteClick}
          >
            Delete
          </DropdownMenuItem>
        )}
      </DropdownMenuContent>
    </DropdownMenu>
  );
};

const SubscriptionListItem = ({
  item,
  handleEdit,
  handleDelete,
  handleView,
}: {
  item: ISubscription;
  handleEdit?: (id: string) => void;
  handleDelete?: (id: string) => void;
  handleView?: (id: string) => void;
}) => {
  const componentId = useId();

  return (
    <AppCard data-component-id={componentId}>
      <div className="flex flex-col sm:flex-row items-start gap-3">
        <div className="flex-1 w-full space-y-3">
          <div className="flex items-center gap-1 flex-wrap">
          </div>

          <div className="flex items-center gap-2 p-2 rounded bg-primary/5 border border-primary/20">
            <div className="w-8 h-8 rounded bg-primary/20 flex items-center justify-center text-primary font-bold text-sm flex-shrink-0">
              {item.title.charAt(0).toUpperCase()}
            </div>
            <div className="flex-1 min-w-0">
              <div className="space-y-1 text-sm">
                <div className="truncate font-medium">{item.title}</div>
                <div className="truncate text-muted-foreground">
                  ${item.price}
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="flex-shrink-0 self-start">
          <SubscriptionActions
            subscription={item}
            handleEdit={handleEdit}
            handleDelete={handleDelete}
            handleView={handleView}
          />
        </div>
      </div>
    </AppCard>
  );
};

export const SubscriptionItemViews = ({
  handleEdit,
  handleDelete,
  handleView,
}: {
  handleEdit?: (id: string) => void;
  handleDelete?: (id: string) => void;
  handleView?: (id: string) => void;
}): {
  columns: ColumnDef<ISubscription>[];
  listItem: (item: ISubscription) => JSX.Element;
} => {
  const columns: ColumnDef<ISubscription>[] = [
    {
      accessorKey: "title",
      header: "Title",
      cell: ({ row }) => {
        const title = row.original.title;
        return (
          <span className="capitalize">{title}</span>
        );
      },
    },
    {
      accessorKey: "features",
      header: "Features",
      cell: ({ row }) => {
        const features = row.original.features || [];
        const firstThree = features.slice(0, 3);
        const remaining = features.slice(3);

        return (
          <div className="flex flex-wrap gap-1">
            {firstThree.map((feature) => (
              <Badge variant="secondary" key={feature} className="capitalize">
                {feature.toLowerCase()}
              </Badge>
            ))}

            {remaining.length > 0 && (
              <Tooltip>
                <TooltipTrigger asChild>
                  <Badge
                    variant="outline"
                    className="cursor-pointer"
                  >
                    +{remaining.length} more
                  </Badge>
                </TooltipTrigger>
                <TooltipContent>
                  <div className="flex flex-col gap-1">
                    {remaining.map((feature) => (
                      <div key={feature} className="capitalize">
                        {feature.toLowerCase()}
                      </div>
                    ))}
                  </div>
                </TooltipContent>
              </Tooltip>
            )}
          </div>
        );
      },
    },
    {
      accessorKey: "price",
      header: "Price (per month)",
      cell: ({ row }) => {
        const { price, discountPercentage } = row.original;
        const discountedPrice = discountPercentage
          ? (price - (price * discountPercentage) / 100).toFixed(2)
          : price;

        return (
          <div className="flex flex-col text-sm">
            {discountPercentage ? (
              <>
                <span className="font-medium text-green-700">${discountedPrice}</span>
                <span className="line-through text-muted-foreground">${price}</span>
              </>
            ) : (
              <span className="font-medium">${price}</span>
            )}
          </div>
        );
      },
    },
    {
      accessorKey: "discountPercentage",
      header: "Discount (%)",
      cell: ({ row }) => row.original.discountPercentage ?? "-",
    },
    {
      accessorKey: "status",
      header: "Status",
      cell: ({ row }) => {
        const status = row.original.status;

        const getStatusClass = (status) => {
          switch (status) {
            case ESubscriptionStatus.ACTIVE: return "bg-green-100 text-green-800";
            case ESubscriptionStatus.EXPIRED: return "bg-gray-100 text-gray-800";
            case ESubscriptionStatus.INACTIVE: return "bg-red-100 text-red-800";
            default: return "bg-gray-100 text-gray-800";
          }
        };

        return <Badge className={getStatusClass(status) + " capitalize"}>{status}</Badge>;
      },
    },
    {
      accessorKey: "frequency",
      header: "Frequency",
      cell: ({ row }) => {
        const frequencies = row.original.frequency || [];

        return (
          <div className="flex flex-wrap gap-1">
            {frequencies.map((freq) => (
              <Badge variant="secondary" key={freq} className="capitalize">
                {freq.toLowerCase()}
              </Badge>
            ))}
          </div>
        );
      },
    },

    {
      accessorKey: "autoRenewal",
      header: "Auto Renewal",
      cell: ({ row }) => (row.original.autoRenewal ? "Yes" : "No"),
    },
    {
      id: "actions",
      cell: ({ row }) => (
        <SubscriptionActions
          subscription={row.original}
          handleEdit={handleEdit}
          handleDelete={handleDelete}
          handleView={handleView}
        />
      ),
    },
  ];

  const listItem = (item: ISubscription) => {
    return (
      <SubscriptionListItem
        item={item}
        handleEdit={handleEdit}
        handleDelete={handleDelete}
        handleView={handleView}
      />
    );
  };

  return { columns, listItem };
};
