// External Libraries
import { type ColumnDef } from "@tanstack/react-table";
import { Edit, Trash2 } from "lucide-react";

// UI Components
import { Button } from "@/components/ui/button";

// Types
import type { IDoor } from "@shared/interfaces/door.interface";
import { formatDate } from "@/lib/utils";


export const doorsItemViews = ({
  handleEdit,
  handleDelete,
  componentId = "doors-item-views",
}: {
  handleEdit?: (id: string) => void;
  handleDelete?: (id: string) => void;
  componentId?: string;
}) => {
  const columns: ColumnDef<IDoor>[] = [
    {
      accessorKey: "name",
      header: "Name",
      cell: ({ row }) => {
        const door = row.original;
        return (
          <div className="font-medium">{door.name}</div>
        );
      },
    },
    {
      accessorKey: "description",
      header: "Description",
      cell: ({ row }) => {
        const door = row.original;
        return (
          <div className="text-muted-foreground">{door.description || "-"}</div>
        );
      },
    },
    {
      accessorKey: "macAddress",
      header: "MAC Address",
      cell: ({ row }) => {
        const door = row.original;
        return (
          <div className="text-muted-foreground">{door.deviceReader?.macAddress || "-"}</div>
        );
      },
    },
    {
      accessorKey: "deviceName",
      header: "Device Name",
      cell: ({ row }) => {
        const door = row.original;
        return (
          <div className="text-muted-foreground">{door.deviceReader?.deviceName || "-"}</div>
        );
      },
    },
    {
      id: "actions",
      header: "Actions",
      cell: ({ row }) => (
        <div className="flex items-center gap-2">
          {handleEdit && (
            <Button
              variant="ghost"
              size="sm"
              onClick={() => handleEdit(row.original.id)}
              data-component-id={componentId}
            >
              <Edit className="h-4 w-4" />
            </Button>
          )}
          {handleDelete && (
            <Button
              variant="ghost"
              size="sm"
              onClick={() => handleDelete(row.original.id)}
              data-component-id={componentId}
            >
              <Trash2 className="h-4 w-4 text-destructive" />
            </Button>
          )}
        </div>
      ),
    },
  ];

  return { columns };
};
