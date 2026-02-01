import { Edit, Trash2 } from "lucide-react";
import { useTransition } from "react";
import { Button } from "@/components/ui/button";
import type { IAttributeValue } from "@shared/interfaces/products/attribute-value.interface";
import type { ColumnDef } from "@tanstack/react-table";
import { EAttributeType } from "@shared/enums/products/attribute-type.enum";

export function itemViews({ handleEdit, handleDelete, componentId = "attribute-values-item-views" }: { handleEdit?: (id: string) => void; handleDelete?: (id: string) => void; componentId?: string; }) {
  const [, startTransition] = useTransition();
  const columns: ColumnDef<IAttributeValue>[] = [
    {
      accessorKey: "value", header: "Value", cell: ({ row }) => {
        const attributeValue = row.original;
        const isColor = attributeValue.attribute?.type === EAttributeType.COLOR;
        return <div className="font-medium">{isColor && <div className="font-medium w-5 h-5" style={{ backgroundColor: attributeValue.value }} />} {attributeValue.value}</div>
      }
    },
    {
      accessorKey: "description",
      header: "Description",
      cell: ({ row }) => (
        <div className="text-muted-foreground max-w-md truncate">
          {row.original.description || <span className="italic">—</span>}
        </div>
      )
    },
    {
      id: "actions", header: "Actions", cell: ({ row }) => (
        <div className="flex items-center gap-2">
          {handleEdit && <Button variant="ghost" size="sm" onClick={() => startTransition(() => handleEdit(row.original.id))}><Edit className="h-4 w-4" /></Button>}
          {handleDelete && <Button variant="ghost" size="sm" onClick={() => startTransition(() => handleDelete(row.original.id))}><Trash2 className="h-4 w-4 text-destructive" /></Button>}
        </div>
      )
    },
  ];
  return { columns };
}
