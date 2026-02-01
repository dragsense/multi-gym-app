// External Libraries
import { type JSX, useId, useTransition } from "react";
import { type ColumnDef } from "@tanstack/react-table";
import { MoreHorizontal } from "lucide-react";

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

// Types
import type { IMembership } from "@shared/interfaces/membership.interface";
import { Badge } from "@/components/ui/badge";
import { AppCard } from "@/components/layout-ui/app-card";
import { formatDate } from "@/lib/utils";

const MembershipActions = ({
  membership,
  handleEdit,
  handleDelete,
  handleView,
}: {
  membership: IMembership;
  handleEdit?: (id: string) => void;
  handleDelete?: (id: string) => void;
  handleView?: (id: string) => void;
}) => {
  // React 19: Essential IDs and transitions
  const componentId = useId();
  const [, startTransition] = useTransition();

  const handleViewClick = () => {
    if (handleView) {
      startTransition(() => handleView(membership.id));
    }
  };

  const handleEditClick = () => {
    if (handleEdit) {
      startTransition(() => handleEdit(membership.id));
    }
  };

  const handleDeleteClick = () => {
    if (handleDelete) {
      startTransition(() => handleDelete(membership.id));
    }
  };

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" className="h-8 w-8 p-0" data-component-id={componentId}>
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
        {handleEdit && (
          <DropdownMenuItem onClick={handleEditClick}>
            Edit
          </DropdownMenuItem>
        )}
        <DropdownMenuSeparator />
        {handleDelete && (
          <DropdownMenuItem onClick={handleDeleteClick} className="text-destructive">
            Delete
          </DropdownMenuItem>
        )}
      </DropdownMenuContent>
    </DropdownMenu>
  );
};

export const membershipItemViews = ({
  handleEdit,
  handleDelete,
  handleView,
}: {
  handleEdit?: (id: string) => void;
  handleDelete?: (id: string) => void;
  handleView?: (id: string) => void;
}) => {
  const columns: ColumnDef<IMembership>[] = [
    {
      accessorKey: "title",
      header: "Title",
      cell: ({ row }) => {
        const membership = row.original;
        return (
          <div className="font-medium">{membership.title}</div>
        );
      },
    },
    {
      accessorKey: "enabled",
      header: "Status",
      cell: ({ row }) => {
        const membership = row.original;
        return (
          <Badge variant={membership.enabled ? "default" : "secondary"}>
            {membership.enabled ? "Enabled" : "Disabled"}
          </Badge>
        );
      },
    },
    {
      accessorKey: "price",
      header: "Price",
      cell: ({ row }) => {
        const membership = row.original;
        return membership.price ? `$${Number(membership.price).toFixed(2)}` : "-";
      },
    },
    {
      accessorKey: "pricePeriod",
      header: "Price Period",
      cell: ({ row }) => {
        const membership = row.original;
        return membership.pricePeriod ? `${membership.pricePeriod} months` : "-";
      },
    },
    {
      accessorKey: "calculatedPrice",
      header: "Calculated Price",
      cell: ({ row }) => {
        const membership = row.original;
        return membership.calculatedPrice ? `$${Number(membership.calculatedPrice).toFixed(2)}` : "-";
      },
    },
    {
      accessorKey: "billingFrequency",
      header: "Billing Frequency",
      cell: ({ row }) => {
        const membership = row.original;
        return membership.billingFrequency || "-";
      },
    },
    {
      accessorKey: "sortOrder",
      header: "Sort Order",
      cell: ({ row }) => {
        const membership = row.original;
        return membership.sortOrder ?? 0;
      },
    },
    {
      id: "actions",
      cell: ({ row }) => {
        const membership = row.original;
        return <MembershipActions membership={membership} handleEdit={handleEdit} handleDelete={handleDelete} handleView={handleView} />;
      },
    },
  ];

  const listItem = (membership: IMembership): JSX.Element => {
    return (
      <AppCard key={membership.id} className="p-4">
        <div className="flex items-start justify-between">
          <div className="space-y-2 flex-1">
            <div className="flex items-center gap-2">
              <h3 className="font-semibold">{membership.title}</h3>
              <Badge variant={membership.enabled ? "default" : "secondary"}>
                {membership.enabled ? "Enabled" : "Disabled"}
              </Badge>
            </div>
            {membership.description && (
              <p className="text-sm text-muted-foreground">{membership.description}</p>
            )}
            <div className="flex gap-4 text-sm text-muted-foreground">
              {membership.price && (
                <span>Price: ${Number(membership.price).toFixed(2)}</span>
              )}
              {membership.calculatedPrice && (
                <span>Calculated: ${Number(membership.calculatedPrice).toFixed(2)}</span>
              )}
              {membership.billingFrequency && (
                <span>Billing: {membership.billingFrequency}</span>
              )}
            </div>
            {membership.createdAt && (
              <p className="text-xs text-muted-foreground">
                Created: {formatDate(membership.createdAt)}
              </p>
            )}
          </div>
          <MembershipActions membership={membership} handleEdit={handleEdit} handleDelete={handleDelete} handleView={handleView} />
        </div>
      </AppCard>
    );
  };

  return { columns, listItem };
};

