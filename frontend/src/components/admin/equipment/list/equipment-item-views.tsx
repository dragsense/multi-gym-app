// External Libraries
import { type ColumnDef } from "@tanstack/react-table";
import { Edit, Trash2, Eye } from "lucide-react";

// UI Components
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";

// Types
import type { IEquipment } from "@shared/interfaces/equipment-reservation.interface";
import { EEquipmentStatus } from "@shared/enums";

export const equipmentItemViews = ({
  handleEdit,
  handleDelete,
  handleView,
  componentId = "equipment-item-views",
}: {
  handleEdit?: (id: string) => void;
  handleDelete?: (id: string) => void;
  handleView?: (id: string) => void;
  componentId?: string;
}) => {
  const columns: ColumnDef<IEquipment>[] = [
    {
      accessorKey: "name",
      header: "Name",
      cell: ({ row }) => {
        const equipment = row.original;
        return (
          <div className="font-medium">{equipment.name}</div>
        );
      },
    },
    {
      accessorKey: "equipmentType",
      header: "Type",
      cell: ({ row }) => {
        const equipment = row.original;
        return (
          <div className="text-muted-foreground">
            {equipment.equipmentType?.name || "-"}
          </div>
        );
      },
    },
    {
      accessorKey: "serialNumber",
      header: "Serial Number",
      cell: ({ row }) => {
        const equipment = row.original;
        return (
          <div className="text-muted-foreground font-mono text-sm">
            {equipment.serialNumber || "-"}
          </div>
        );
      },
    },
    {
      accessorKey: "status",
      header: "Status",
      cell: ({ row }) => {
        const equipment = row.original;
        const status = equipment.status || EEquipmentStatus.AVAILABLE;
        const statusColors: Record<string, string> = {
          [EEquipmentStatus.MAINTENANCE]: "bg-yellow-100 text-yellow-800",
          [EEquipmentStatus.AVAILABLE]: "bg-green-100 text-green-800",
          [EEquipmentStatus.NOT_AVAILABLE]: "bg-red-100 text-red-800",
        };
        const statusLabels: Record<string, string> = {
          [EEquipmentStatus.MAINTENANCE]: "Maintenance",
          [EEquipmentStatus.AVAILABLE]: "Available",
          [EEquipmentStatus.NOT_AVAILABLE]: "Not Available",
        };
        return (
          <Badge className={statusColors[status] || "bg-gray-100 text-gray-800"}>
            {statusLabels[status] || status}
          </Badge>
        );
      },
    },
    {
      id: "actions",
      header: "Actions",
      cell: ({ row }) => (
        <div className="flex items-center gap-2">
          {handleView && (
            <Button
              variant="ghost"
              size="sm"
              onClick={() => handleView(row.original.id)}
              data-component-id={componentId}
            >
              <Eye className="h-4 w-4" />
            </Button>
          )}
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
