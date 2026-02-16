// External Libraries
import type { ColumnDef } from "@tanstack/react-table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  MoreHorizontal,
  Edit,
  Trash2,
  Eye,
  Shield,
  CheckCircle,
  XCircle,
  Clock
} from "lucide-react";

// Components
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

// Types
import type { IRole } from '@shared/interfaces';
import type { IUserSettings } from '@shared/interfaces/settings.interface';

// Utils
import { formatDate } from '@/lib/utils';

export const itemViews = ({
  editRole,
  deleteRole,
  viewPermissions,
  settings,
}: {
  editRole: (roleId: string) => void;
  deleteRole: (roleId: string) => void;
  viewPermissions: (roleId: string) => void;
  settings?: IUserSettings;
}) => {
  const columns: ColumnDef<IRole>[] = [
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
      header: "Role Name",
      cell: ({ row }) => {
        const name = row.getValue<string>("name");
        return (
          <span className="font-medium">{name}</span>
        );
      },
    },
    {
      accessorKey: "code",
      header: "Code",
      cell: ({ row }) => {
        const code = row.getValue<string>("code");
        return (
          <span className="font-mono text-sm bg-muted px-2 py-1 rounded">{code}</span>
        );
      },
    },
    {
      accessorKey: "description",
      header: "Description",
      cell: ({ row }) => {
        const description = row.getValue<string>("description");
        return (
          <span className="text-muted-foreground">{description || 'No description'}</span>
        );
      },
    },
    
    {
      accessorKey: "isSystem",
      header: "System Role",
      cell: ({ row }) => {
        const isSystem = row.getValue<boolean>("isSystem");
        return (
          <Badge variant={isSystem ? "destructive" : "secondary"}>
            {isSystem ? "System" : "Custom"}
          </Badge>
        );
      },
    },
    {
      accessorKey: "rolePermissionsCount",
      header: "Permissions",
      cell: ({ row }) => {
        const rolePermissionsCount = row.getValue<number>("rolePermissionsCount");
        return (
          <div className="flex items-center gap-1">
            <Shield className="w-4 h-4 text-muted-foreground" />
            <span className="text-sm text-muted-foreground">
              {rolePermissionsCount} permission{rolePermissionsCount !== 1 ? 's' : ''}
            </span>
          </div>
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
        const role = row.original;

        return (
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" className="h-8 w-8 p-0">
                <span className="sr-only">Open menu</span>
                <MoreHorizontal className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem onClick={() => viewPermissions(role.id)}>
                <Eye className="mr-2 h-4 w-4" />
                View Permissions
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => editRole(role.id)}>
                <Edit className="mr-2 h-4 w-4" />
                Edit Role
              </DropdownMenuItem>
              {!role.isSystem && (
                <DropdownMenuItem
                  onClick={() => deleteRole(role.id)}
                  className="text-destructive"
                >
                  <Trash2 className="mr-2 h-4 w-4" />
                  Delete Role
                </DropdownMenuItem>
              )}
            </DropdownMenuContent>
          </DropdownMenu>
        );
      },
    },
  ];

  return { columns };
};
