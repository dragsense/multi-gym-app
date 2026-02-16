// External Libraries
import { type JSX, useId, useTransition } from "react";
import { type ColumnDef } from "@tanstack/react-table";
import { MoreHorizontal, Building2, LogIn } from "lucide-react";
import React from "react";
import { toast } from "sonner";

// Services
import { loginToBusiness } from "@/services/business/business.api";

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
import { AppCard } from "@/components/layout-ui/app-card";

// Types
import type { IBusiness } from "@shared/interfaces";

const BusinessActions = ({
  business,
  handleEdit,
  handleDelete,
  handleView,
  handleLoginToBusiness,
}: {
  business: IBusiness;
  handleEdit?: (id: string) => void;
  handleDelete?: (id: string) => void;
  handleView?: (id: string) => void;
  handleLoginToBusiness?: (id: string) => void;
}) => {
  const componentId = useId();
  const [, startTransition] = useTransition();

  const handleViewClick = (e: React.MouseEvent<HTMLDivElement>) => {
    e.stopPropagation();
    e.preventDefault();
      if (handleView) startTransition(() => handleView(business.id));
  };
  const handleEditClick = (e: React.MouseEvent<HTMLDivElement>) => {
    e.stopPropagation();
    e.preventDefault();
    if (handleEdit) startTransition(() => handleEdit(business.id));
  };
  const handleDeleteClick = (e: React.MouseEvent<HTMLDivElement>) => {
    e.stopPropagation();
    e.preventDefault();
    if (handleDelete) startTransition(() => handleDelete(business.id));
  };
  const handleLoginClick = (e: React.MouseEvent<HTMLDivElement>) => {
    e.stopPropagation();
    e.preventDefault();
    if (handleLoginToBusiness) startTransition(() => handleLoginToBusiness(business.id));
  };

  // Check if business has subdomain and tenantId (required for login)
  const canLoginToBusiness = business.subdomain && business.tenantId;

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
        {canLoginToBusiness && handleLoginToBusiness && (
          <DropdownMenuItem onClick={handleLoginClick}>
            <LogIn className="mr-2 h-4 w-4" />
            Login to Business
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

const BusinessListItem = ({
  item,
  handleEdit,
  handleDelete,
  handleView,
  handleLoginToBusiness,
}: {
  item: IBusiness;
  handleEdit?: (id: string) => void;
  handleDelete?: (id: string) => void;
  handleView?: (id: string) => void;
  handleLoginToBusiness?: (id: string) => void;
}) => {
  const componentId = useId();
  const [, startTransition] = useTransition();

  const handleCardClick = () => {
    if (handleView) {
      startTransition(() => handleView(item.id));
    }
  };

  return (
    <AppCard 
      data-component-id={componentId}
      className="cursor-pointer hover:bg-muted/50 transition-colors"
      onClick={handleCardClick}
    >
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4 flex-1">
          <div className="w-12 h-12 rounded-lg bg-primary/10 flex items-center justify-center">
            <Building2 className="w-6 h-6 text-primary" />
          </div>
          <div className="flex-1 min-w-0">
            <h3 className="font-semibold text-lg truncate">{item.name}</h3>
            {item.subdomain && (
              <span className="text-sm text-muted-foreground">
                {item.subdomain}
              </span>
            )}
            {item.tenantId && (
              <span className="text-sm text-muted-foreground">
                {item.tenantId}
              </span>
            )}
            {item.user && ( 
              <span className="text-sm text-muted-foreground">
                {item.user.firstName} {item.user.lastName}
              </span>
            )}
          </div>
        </div>
        <BusinessActions
          business={item}
          handleEdit={handleEdit}
          handleDelete={handleDelete}
          handleView={handleView}
          handleLoginToBusiness={handleLoginToBusiness}
        />
      </div>
    </AppCard>
  );
};

export const BusinessItemViews = ({
  handleEdit,
  handleDelete,
  handleView,
  handleLoginToBusiness,
}: {
  handleEdit?: (id: string) => void;
  handleDelete?: (id: string) => void;
  handleView?: (id: string) => void;
  handleLoginToBusiness?: (id: string) => void;
}): {
  columns: ColumnDef<IBusiness>[];
  listItem: (item: IBusiness) => JSX.Element;
} => {
  const columns: ColumnDef<IBusiness>[] = [
    {
      accessorKey: "name",
      header: "Name",
      cell: ({ row }) => (
        <div className="font-medium">{row.original.name}</div>
      ),
    },
    {
      accessorKey: "subdomain",
      header: "Subdomain",
      cell: ({ row }) => (
        <div className="text-muted-foreground">{row.original.subdomain}</div>
      ),
    },
    {
      accessorKey: "tenantId",
      header: "Tenant ID",
      cell: ({ row }) => (
        <div className="text-muted-foreground">{row.original.tenantId}</div>
      ),
    },  
    {
      accessorKey: "user",
      header: "Owner",
      cell: ({ row }) => (
        <div className="text-sm">
          {row.original.user ? (
            <div className="space-y-0.5">
              <div className="font-medium">
                {row.original.user.firstName} {row.original.user.lastName}
              </div>
              <div className="text-xs text-muted-foreground">
                {row.original.user.email}
              </div>
            </div>
          ) : (
            "-"
          )}
        </div>
      ),
    },
    {
      id: "actions",
      cell: ({ row }) => (
        <BusinessActions
          business={row.original}
          handleEdit={handleEdit}
          handleDelete={handleDelete}
          handleView={handleView}
          handleLoginToBusiness={handleLoginToBusiness}
        />
      ),
    },
  ];

  return {
    columns,
    listItem: (item: IBusiness) => (
      <BusinessListItem
        item={item}
        handleEdit={handleEdit}
        handleDelete={handleDelete}
        handleView={handleView}
        handleLoginToBusiness={handleLoginToBusiness}
      />
    ),
  };
};
