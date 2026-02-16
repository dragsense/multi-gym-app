// External Libraries
import type { ColumnDef } from "@tanstack/react-table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { 
  MoreHorizontal, 
  Edit, 
  Trash2, 
  Database,
  CheckCircle,
  XCircle
} from "lucide-react";

// Components
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

// Types
import type { IResource } from '@shared/interfaces';
import type { IUserSettings } from '@shared/interfaces/settings.interface';

// Utils
import { formatDate } from '@/lib/utils';

export const itemViews = ({
  editResource,
  deleteResource,
  settings,
}: {  
  editResource: (resourceId: string) => void;
  deleteResource: (resourceId: string) => void;
  settings?: IUserSettings;
}) => {
  const columns: ColumnDef<IResource>[] = [
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
      header: "Resource Name",
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
      accessorKey: "entityName",
      header: "Entity Name",
      cell: ({ row }) => {
        const entityName = row.getValue<string>("entityName");
        return (
          <span className="font-mono text-sm bg-muted px-2 py-1 rounded">{entityName}</span>
        );
      },
    },
    {
      accessorKey: "isActive",
      header: "Status",
      cell: ({ row }) => {
        const isActive = row.getValue<boolean>("isActive");
        
        return (
          <Badge variant={isActive ? "default" : "secondary"} className={isActive ? "text-green-600" : "text-red-600"}>
            <CheckCircle className="w-3 h-3 mr-1" />
            {isActive ? "Active" : "Inactive"}
          </Badge>
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
        const resource = row.original;
        
        return (
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" className="h-8 w-8 p-0">
                <span className="sr-only">Open menu</span>
                <MoreHorizontal className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem onClick={() => editResource(resource.id)}>
                <Edit className="mr-2 h-4 w-4" />
                Edit Resource
              </DropdownMenuItem>
              <DropdownMenuItem 
                onClick={() => deleteResource(resource.id)}
                className="text-destructive"
              >
                <Trash2 className="mr-2 h-4 w-4" />
                Delete Resource
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        );
      },
    },
  ];

  return { columns };
};
