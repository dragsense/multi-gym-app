// External Libraries
import { type ColumnDef } from "@tanstack/react-table";
import { Edit, Trash2 } from "lucide-react";

// UI Components
import { Button } from "@/components/ui/button";

// Types
import type { IAccessFeature } from "@shared/interfaces/access-feature.interface";
import { formatDate } from "@/lib/utils";


export const accessFeaturesItemViews = ({
  handleEdit,
  handleDelete,
  componentId = "access-features-item-views",
}: {
  handleEdit?: (id: string) => void;
  handleDelete?: (id: string) => void;
  componentId?: string;
}) => {
  const columns: ColumnDef<IAccessFeature>[] = [
    {
      accessorKey: "name",
      header: "Name",
      cell: ({ row }) => {
        const accessFeature = row.original;
        return (
          <div className="font-medium">{accessFeature.name}</div>
        );
      },
    },
    {
      accessorKey: "description",
      header: "Description",
      cell: ({ row }) => {
        const accessFeature = row.original;
        return (
          <div className="text-muted-foreground">{accessFeature.description || "-"}</div>
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

