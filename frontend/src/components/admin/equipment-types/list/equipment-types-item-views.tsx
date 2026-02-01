// External Libraries
import { type ColumnDef } from "@tanstack/react-table";
import { Edit, Trash2 } from "lucide-react";

// UI Components
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";

// Types
import type { IEquipmentType } from "@shared/interfaces/equipment-reservation.interface";
import { formatDate } from "@/lib/utils";


export const equipmentTypesItemViews = ({
  handleEdit,
  handleDelete,
  componentId = "equipment-types-item-views",
}: {
  handleEdit?: (id: string) => void;
  handleDelete?: (id: string) => void;
  componentId?: string;
}) => {
  const columns: ColumnDef<IEquipmentType>[] = [
    {
      accessorKey: "name",
      header: "Name",
      cell: ({ row }) => {
        const equipmentType = row.original;
        return (
          <div className="font-medium">{equipmentType.name}</div>
        );
      },
    },
    {
      accessorKey: "description",
      header: "Description",
      cell: ({ row }) => {
        const equipmentType = row.original;
        return (
          <div className="text-muted-foreground">{equipmentType.description || "-"}</div>
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
