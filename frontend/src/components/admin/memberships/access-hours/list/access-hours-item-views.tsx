// External Libraries
import { type ColumnDef } from "@tanstack/react-table";
import { Edit, Trash2 } from "lucide-react";

// UI Components
import { Button } from "@/components/ui/button";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";

// Types
import type { IAccessHour } from "@shared/interfaces/access-hour.interface";
import { formatDate, formatTimeString } from "@/lib/utils";


export const accessHoursItemViews = ({
  handleEdit,
  handleDelete,
  settings,
  componentId = "access-hours-item-views",
}: {
  handleEdit?: (id: string) => void;
  handleDelete?: (id: string) => void;
  settings?: any;
  componentId?: string;
}) => {
  const columns: ColumnDef<IAccessHour>[] = [
    {
      accessorKey: "name",
      header: "Name",
      cell: ({ row }) => {
        const accessHour = row.original;
        return (
          <div className="font-medium">{accessHour.name}</div>
        );
      },
    },

    {
      accessorKey: "startTime",
      header: "Start Time",
      cell: ({ row }) => {
        const accessHour = row.original;
        return accessHour.startTime ? formatTimeString(accessHour.startTime, settings) : "-";
      },
    },
    {
      accessorKey: "endTime",
      header: "End Time",
      cell: ({ row }) => {
        const accessHour = row.original;
        return accessHour.endTime ? formatTimeString(accessHour.endTime, settings) : "-";
      },
    },
    {
      accessorKey: "daysOfWeek",
      header: "Days of Week",
      cell: ({ row }) => {
        const accessHour = row.original;
        const daysOfWeek = accessHour.daysOfWeek;
        
        if (!daysOfWeek || daysOfWeek.length === 0) {
          return "-";
        }
        
        const displayText = daysOfWeek.length > 2 
          ? `${daysOfWeek.slice(0, 2).join(", ")}...`
          : daysOfWeek.join(", ");
        
        return (
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <span className="cursor-help">{displayText}</span>
              </TooltipTrigger>
              <TooltipContent>
                <p>{daysOfWeek.join(", ")}</p>
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>
        );
      },
    },
    {
      accessorKey: "createdAt",
      header: "Created At",
      cell: ({ row }) => {
        const accessHour = row.original;
        return accessHour.createdAt ? formatDate(accessHour.createdAt) : "-";
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

