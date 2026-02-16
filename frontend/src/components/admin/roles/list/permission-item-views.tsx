// External Libraries
import type { ColumnDef } from "@tanstack/react-table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  MoreHorizontal,
  Edit,
  Trash2,
  Shield,
} from "lucide-react";

// Components
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

// Types
import type { IPermission } from '@shared/interfaces';
import type { IUserSettings } from '@shared/interfaces/settings.interface';

// Utils
import { formatDate } from '@/lib/utils';

export const itemViews = ({
  editPermission,
  deletePermission,
  settings,
}: {
  editPermission: (permissionId: string) => void;
  deletePermission: (permissionId: string) => void;
  settings?: IUserSettings;
}) => {
  const columns: ColumnDef<IPermission>[] = [
    {
      accessorKey: "id",
      header: "ID",
      cell: ({ row }) => {
        const id = row.getValue<string>("id");
        return (
          <span className="font-mono text-sm">{id}</span>
        );
      },
    },
    {
      accessorKey: "name",
      header: "Permission Name",
      cell: ({ row }) => {
        const name = row.getValue<string>("name");
        return (
          <span className="font-medium">{name}</span>
        );
      },
    },
    {
      accessorKey: "displayName",
      header: "Display Name",
      cell: ({ row }) => {
        const displayName = row.getValue<string>("displayName");
        return (
          <span className="text-muted-foreground">{displayName || 'No display name'}</span>
        );
      },
    },
    {
      accessorKey: "action",
      header: "Action",
      cell: ({ row }) => {
        const action = row.getValue<string>("action");
        return (
          <Badge variant="outline" className="font-mono">
            {action}
          </Badge>
        );
      },
    },
    {
      accessorKey: "resource",
      header: "Resource",
      cell: ({ row }) => {
        const resource = row.getValue<any>("resource");
        return (
          <span className="text-sm">{resource?.displayName || resource?.name || 'N/A'}</span>
        );
      },
    },
    {
      accessorKey: "createdAt",
      header: "Created",
      cell: ({ row }) => {
        const createdAt = row.getValue<string>("createdAt");
        return (
          <span className="text-sm text-muted-foreground">
            {formatDate(createdAt, settings)}
          </span>
        );
      },
    },
    {
      id: "actions",
      header: "Actions",
      cell: ({ row }) => {
        const permission = row.original;

        return (
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" className="h-8 w-8 p-0">
                <span className="sr-only">Open menu</span>
                <MoreHorizontal className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem onClick={() => editPermission(permission.id)}>
                <Edit className="mr-2 h-4 w-4" />
                Edit Permission
              </DropdownMenuItem>
              <DropdownMenuItem
                onClick={() => deletePermission(permission.id)}
                className="text-destructive"
              >
                <Trash2 className="mr-2 h-4 w-4" />
                Delete Permission
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        );
      },
    },
  ];

  return { columns };
};
