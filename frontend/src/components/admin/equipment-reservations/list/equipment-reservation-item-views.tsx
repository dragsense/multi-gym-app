// External Libraries
import { type ColumnDef } from "@tanstack/react-table";
import { Edit, Trash2, Eye } from "lucide-react";

// UI Components
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";

// Types
import type { IEquipmentReservation } from "@shared/interfaces/equipment-reservation.interface";
import { formatDate, formatTime } from "@/lib/utils";
import { useUserSettings } from "@/hooks/use-user-settings";

export const equipmentReservationItemViews = ({
  handleEdit,
  handleDelete,
  handleView,
  componentId = "equipment-reservation-item-views",
  settings,
}: {
  handleEdit?: (id: string) => void;
  handleDelete?: (id: string) => void;
  handleView?: (id: string) => void;
  componentId?: string;
  settings?: any;
}) => {
  const columns: ColumnDef<IEquipmentReservation>[] = [
    {
      accessorKey: "equipment",
      header: "Equipment",
      cell: ({ row }) => {
        const reservation = row.original;
        return (
          <div className="font-medium">
            {reservation.equipment?.name || "-"}
            {reservation.equipment?.equipmentType && (
              <div className="text-xs text-muted-foreground">
                {reservation.equipment.equipmentType.name}
              </div>
            )}
          </div>
        );
      },
    },
    {
      accessorKey: "startDateTime",
      header: "Start Date/Time",
      cell: ({ row }) => {
        const reservation = row.original;
        if (!reservation.startDateTime) return "-";
        const date = formatDate(reservation.startDateTime, settings);
        const time = formatTime(reservation.startDateTime, settings);
        return (
          <div className="text-sm">
            <div>{date}</div>
            <div className="text-muted-foreground">{time}</div>
          </div>
        );
      },
    },
    {
      accessorKey: "endDateTime",
      header: "End Date/Time",
      cell: ({ row }) => {
        const reservation = row.original;
        if (!reservation.endDateTime) return "-";
        const date = formatDate(reservation.endDateTime, settings);
        const time = formatTime(reservation.endDateTime, settings);
        return (
          <div className="text-sm">
            <div>{date}</div>
            <div className="text-muted-foreground">{time}</div>
          </div>
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
