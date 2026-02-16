import { Edit, Trash2, Eye, List } from "lucide-react";
import { useTransition } from "react";
import { Button } from "@/components/ui/button";
import type { IAttribute } from "@shared/interfaces/products/attribute.interface";
import type { ColumnDef } from "@tanstack/react-table";

export function itemViews({
  handleEdit,
  handleDelete,
  handleManageValues,
  componentId = "attribute-item-views",
}: {
  handleEdit?: (id: string) => void;
  handleDelete?: (id: string) => void;
  handleManageValues?: (attribute: IAttribute) => void;
  componentId?: string;
}) {
  const [, startTransition] = useTransition();

  const columns: ColumnDef<IAttribute>[] = [
    {
      accessorKey: "name",
      header: "Name",
      cell: ({ row }) => <div className="font-medium">{row.original.name}</div>,
    },
    {
      accessorKey: "type",
      header: "Type",
      cell: ({ row }) => (
        <div className="text-muted-foreground">
          {row.original.type || <span className="italic">—</span>}
        </div>
      ),
    },
    {
      id: "actions",
      header: "Actions",
      cell: ({ row }) => (
        <div className="flex items-center gap-2">
       
          {handleManageValues && (
            <Button
              variant="ghost"
              size="sm"
              onClick={() => startTransition(() => handleManageValues(row.original))}
            >
              <List className="h-4 w-4" />
            </Button>
          )}
          {handleEdit && (
            <Button
              variant="ghost"
              size="sm"
              onClick={() => startTransition(() => handleEdit(row.original.id))}
            >
              <Edit className="h-4 w-4" />
            </Button>
          )}
          {handleDelete && (
            <Button
              variant="ghost"
              size="sm"
              onClick={() => startTransition(() => handleDelete(row.original.id))}
            >
              <Trash2 className="h-4 w-4 text-destructive" />
            </Button>
          )}
        </div>
      ),
    },
  ];

  return { columns };
}
