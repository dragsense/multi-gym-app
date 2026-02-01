import { Edit, Trash2, Eye } from "lucide-react";
import { useTransition } from "react";
import { Button } from "@/components/ui/button";
import type { IProductType } from "@shared/interfaces/products/product-type.interface";
import type { ColumnDef } from "@tanstack/react-table";

export function itemViews({
  handleEdit,
  handleDelete,
  componentId = "product-types-item-views",
}: {
  handleEdit?: (id: string) => void;
  handleDelete?: (id: string) => void;
  componentId?: string;
}) {
  const [, startTransition] = useTransition();

  const columns: ColumnDef<IProductType>[] = [
    {
      accessorKey: "name",
      header: "Name",
      cell: ({ row }) => <div className="font-medium">{row.original.name}</div>,
    },
    {
      accessorKey: "productsCount",
      header: "Products",
      cell: ({ row }) => <div className="font-medium">{row.original.productsCount || 0}</div>,
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
