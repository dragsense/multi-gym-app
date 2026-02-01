import React, { useCallback, useEffect, useMemo, useState } from "react";
import { Plus, Trash2, X } from "lucide-react";
import { useI18n } from "@/hooks/use-i18n";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { useSearchableAttributes } from "@/hooks/use-searchable";
import { SearchableInputWrapper } from "@/components/shared-ui/searchable-input-wrapper";
import { AttributeCell } from "./attribute-cell";
import type { IAttribute } from "@shared/interfaces";
import type { TProductData, TUpdateProductData } from "@shared/types/products/product.type";
import { useFormContext } from "react-hook-form";

export type VariantRow = {
  id?: string;
  sku: string;
  price: number;
  quantity: number;
  attributeValues?: Array<{
    id: string;
    value?: string;
    attribute?: { id: string };
  }>;
  isActive?: boolean;
};

interface VariantsMatrixProps {
  value?: VariantRow[];
  onChange: (value: VariantRow[]) => void;
  defaultSku?: string;
  isEditing?: boolean;
  disabled?: boolean;
}

function defaultVariantAtIndex(index: number, defaultSku?: string): VariantRow {
  const prefix = (defaultSku ?? "SKU").trim() || "SKU";
  return {
    sku: `${prefix}-${index + 1}`,
    price: 0,
    quantity: 0,
    attributeValues: [],
  };
}

function uniqueAttributesFromVariants(variants: VariantRow[]): IAttribute[] {
  const seen = new Set<string>();
  const out: IAttribute[] = [];
  for (const v of variants) {
    for (const av of v.attributeValues ?? []) {
      const a = av.attribute as { id: string; name?: string; type?: EAttributeType } | undefined;
      if (a?.id && !seen.has(a.id)) {
        seen.add(a.id);
        out.push({ id: a.id, name: a.name, type: a.type } as IAttribute);
      }
    }
  }
  return out;
}

export function VariantsMatrix({
  value = [],
  onChange,
  isEditing,
  disabled,
}: VariantsMatrixProps) {
  const { t } = useI18n();
  const variants = value;

  
  const { watch } = useFormContext<TProductData | TUpdateProductData>();
  const defaultSku = watch("defaultSku") ?? "SKU";
  const totalQuantity = watch("totalQuantity") ?? 0;

  const [attributeColumns, setAttributeColumns] = useState<IAttribute[]>(() =>
    uniqueAttributesFromVariants(variants)
  );

  const searchableAttributes = useSearchableAttributes({});

  const columnIds = useMemo(
    () => new Set(attributeColumns.map((a) => a.id)),
    [attributeColumns]
  );
  const availableAttributesResponse = useMemo(() => {
    const list = (searchableAttributes.response?.data ?? []) as IAttribute[];
    const filtered = list.filter((a) => !columnIds.has(a.id));
    return { ...searchableAttributes.response, data: filtered };
  }, [searchableAttributes.response, columnIds]);

  const [addColumnOpen, setAddColumnOpen] = useState(false);

  const prefix = (defaultSku ?? "SKU").trim() || "SKU";

  useEffect(() => {
    if (variants.length > 0 && attributeColumns.length === 0) {
      const fromVariants = uniqueAttributesFromVariants(variants);
      if (fromVariants.length > 0) {
        setAttributeColumns(fromVariants);
      }
    }
  }, [variants, attributeColumns.length]);

  useEffect(() => {
    if (variants.length === 0) return;
    const updated = variants.map((v, i) => ({
      ...v,
      sku: `${prefix}-${i + 1}`,
    }));
    const same = updated.every((u, i) => u.sku === variants[i]?.sku);
    if (!same) onChange(updated);
  }, [prefix, variants, onChange]);

  const addRow = useCallback(() => {
    const insertIndex = variants.length;
    onChange([...variants, defaultVariantAtIndex(insertIndex, defaultSku)]);
  }, [variants, onChange, defaultSku]);

  const addRowAfter = useCallback(
    (index: number) => {
      const next = [...variants];
      const insertIndex = index + 1;
      next.splice(insertIndex, 0, defaultVariantAtIndex(insertIndex, defaultSku));
      onChange(next);
    },
    [variants, onChange, defaultSku]
  );

  const removeRow = useCallback(
    (index: number) => {
      const next = variants.filter((_, i) => i !== index);
      onChange(next);
    },
    [variants, onChange]
  );

  const addColumn = useCallback(
    (attr: IAttribute) => {
      if (columnIds.has(attr.id)) return;
      setAttributeColumns((prev) => [...prev, attr]);
    },
    [columnIds]
  );

  const removeColumn = useCallback(
    (attr: IAttribute) => {
      setAttributeColumns((prev) => prev.filter((a) => a.id !== attr.id));
      const updated = variants.map((v) => {
        const rest = (v.attributeValues ?? []).filter(
          (av) => av.attribute?.id !== attr.id
        );
        return { ...v, attributeValues: rest };
      });
      onChange(updated);
    },
    [variants, onChange]
  );

  const updateVariant = useCallback(
    (index: number, next: VariantRow) => {
      const nextList = [...variants];
      nextList[index] = next;
      onChange(nextList);
    },
    [variants, onChange]
  );

  // Calculate total variant quantities
  const totalVariantQuantity = useMemo(() => {
    return variants.reduce((sum, v) => sum + (v.quantity || 0), 0);
  }, [variants]);

  // Calculate available quantity for each variant (totalQuantity - other variants' quantities)
  const getAvailableQuantity = useCallback(
    (variantIndex: number) => {
      const otherVariantsQuantity = variants.reduce(
        (sum, v, idx) => (idx !== variantIndex ? sum + (v.quantity || 0) : sum),
        0
      );
      return Math.max(0, totalQuantity - otherVariantsQuantity);
    },
    [variants, totalQuantity]
  );

  // Check if variant quantity exceeds available quantity
  const isVariantQuantityExceeded = useCallback(
    (variantIndex: number, quantity: number) => {
      const available = getAvailableQuantity(variantIndex);
      return quantity > available;
    },
    [getAvailableQuantity]
  );

  const updateVariantField = useCallback(
    (index: number, field: keyof VariantRow, val: string | number) => {
      const v = variants[index];
      if (!v) return;
      
      // Validate quantity field
      if (field === "quantity") {
        const numVal = typeof val === "string" ? (val === "" ? 0 : Number(val)) : val;
        // Allow setting the value but it will show validation error
        updateVariant(index, { ...v, [field]: numVal });
      } else {
        updateVariant(index, { ...v, [field]: val });
      }
    },
    [variants, updateVariant]
  );

  const getExcludeIdsForCell = useCallback(
    (attributeId: string, variantIndex: number) => {
      const current = variants[variantIndex];
      if (!current) return new Set<string>();

      const exclude = new Set<string>();

      // Get all other attribute IDs (excluding the current one)
      const otherAttributeIds = attributeColumns
        .filter((attr) => attr.id !== attributeId)
        .map((attr) => attr.id);

      // Get current variant's attribute values for other attributes
      const currentOtherValues = new Map<string, string>();
      for (const attrId of otherAttributeIds) {
        const av = (current.attributeValues ?? []).find(
          (x) => x.attribute?.id === attrId
        );
        if (av?.id) {
          currentOtherValues.set(attrId, av.id);
        }
      }

      // Check each other variant to see if selecting an attribute value would create a duplicate
      for (let i = 0; i < variants.length; i++) {
        if (i === variantIndex) continue;

        const otherVariant = variants[i];
        if (!otherVariant) continue;

        // Check if this variant matches all other attributes of the current variant
        let matchesOtherAttributes = true;
        for (const [attrId, valueId] of currentOtherValues.entries()) {
          const otherAv = (otherVariant.attributeValues ?? []).find(
            (x) => x.attribute?.id === attrId
          );
          if (otherAv?.id !== valueId) {
            matchesOtherAttributes = false;
            break;
          }
        }

        // If other attributes match, check if this variant has an attribute value for the current attribute
        // If it does, exclude that attribute value ID to prevent duplicate combinations
        if (matchesOtherAttributes) {
          const otherAv = (otherVariant.attributeValues ?? []).find(
            (x) => x.attribute?.id === attributeId
          );
          if (otherAv?.id) {
            exclude.add(otherAv.id);
          }
        }
      }

      // Always allow the currently selected value
      const currentAv = (current.attributeValues ?? []).find(
        (x) => x.attribute?.id === attributeId
      );
      if (currentAv?.id) {
        exclude.delete(currentAv.id);
      }

      return exclude;
    },
    [variants, attributeColumns]
  );

  const quantityExceeded = totalVariantQuantity > totalQuantity;
  const remainingQuantity = Math.max(0, totalQuantity - totalVariantQuantity);

  return (
    <div className="space-y-2">
      {quantityExceeded && (
        <div className="bg-destructive/10 text-destructive text-sm p-2 rounded-md border border-destructive/20">
          <strong>{t("error") || "Error"}:</strong>{" "}
          {t("variantQuantitiesExceedTotal") || 
            `Total variant quantities (${totalVariantQuantity}) exceed total product quantity (${totalQuantity}). Please reduce variant quantities.`}
        </div>
      )}
      {!quantityExceeded && totalQuantity > 0 && (
        <div className="text-sm text-muted-foreground">
          {t("remainingQuantity") || "Remaining quantity"}: <strong>{remainingQuantity}</strong> / {totalQuantity}
        </div>
      )}
      <div className="border rounded-md overflow-x-auto">
        <Table>
        <TableHeader>
          <TableRow>
          
  
            <TableHead className="min-w-[100px]">{t("sku")}</TableHead>
            <TableHead className="min-w-[90px]">{t("price")}</TableHead>
            <TableHead className="min-w-[80px]">{t("qty")}</TableHead>
            {attributeColumns.map((a) => (
              <TableHead key={a.id} className="min-w-[120px] p-1">
                <div className="flex items-center gap-1">
                  <span className="truncate flex-1">{a.name}</span>
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    className="h-6 w-6 p-0 shrink-0 text-muted-foreground hover:text-destructive"
                    onClick={() => removeColumn(a)}
                    disabled={disabled}
                    aria-label={t("removeAttributeColumn")}
                  >
                    <X className="h-4 w-4" />
                  </Button>
                </div>
              </TableHead>
            ))}
            <TableHead className="w-10 p-1">
              <Popover open={addColumnOpen} onOpenChange={setAddColumnOpen}>
                <PopoverTrigger asChild>
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    className="h-8 w-8 p-0"
                    disabled={
                      disabled ||
                      (availableAttributesResponse?.data?.length ?? 0) === 0
                    }
                    aria-label={t("addAttributeColumn")}
                  >
                    <Plus className="h-4 w-4" />
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-72 p-3" align="start">
                  <div className="text-sm font-medium mb-2">
                    {t("addAttributeColumn")}
                  </div>
                  <SearchableInputWrapper<IAttribute>
                    value={undefined}
                    onChange={(v) => {
                      if (v) {
                        addColumn(v as IAttribute);
                        setAddColumnOpen(false);
                      }
                    }}
                    disabled={disabled}
                    useSearchable={() => ({
                      ...searchableAttributes,
                      response: availableAttributesResponse,
                    })}
                    getLabel={(item) => item?.name ?? item?.id ?? null}
                    getKey={(item) => item.id}
                    getValue={(item) => item}
                    shouldFilter={false}
                    modal={false}
                  />
                </PopoverContent>
              </Popover>
            </TableHead>
            <TableHead className="w-10" />
          </TableRow>
        </TableHeader>
        <TableBody>
          {variants.length === 0 ? (
            <TableRow>
              <TableCell className="p-1 align-middle w-10">
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  className="h-8 w-8 p-0"
                  onClick={addRow}
                  disabled={disabled}
                  aria-label={t("addVariant")}
                >
                  <Plus className="h-4 w-4" />
                </Button>
              </TableCell>
              <TableCell
                colSpan={attributeColumns.length + 5}
                className="text-muted-foreground text-center py-6"
              >
                {t("noVariantsYet")}
              </TableCell>
            </TableRow>
          ) : (
            variants.map((v, idx) => (
              <TableRow key={v.id ?? idx}>
               
      
                <TableCell className="p-1 align-top">
                  <Input
                    value={`${prefix}-${idx + 1}`}
                    readOnly
                    disabled={disabled}
                    placeholder="SKU"
                    className="h-8 text-sm min-w-[100px] bg-muted"
                  />
                </TableCell>
                <TableCell className="p-1 align-top">
                  <Input
                    type="number"
                    min={0}
                    step={0.01}
                    value={v.price === 0 ? "" : v.price}
                    onChange={(e) =>
                      updateVariantField(
                        idx,
                        "price",
                        e.target.value === "" ? 0 : Number(e.target.value)
                      )
                    }
                    placeholder="0"
                    disabled={disabled}
                    className="h-8 text-sm min-w-[80px]"
                  />
                </TableCell>
                <TableCell className="p-1 align-top">
                  <div className="space-y-1">
                    <Input
                      type="number"
                      min={0}
                      max={getAvailableQuantity(idx)}
                      value={v.quantity === 0 ? "" : v.quantity}
                      onChange={(e) =>
                        updateVariantField(
                          idx,
                          "quantity",
                          e.target.value === "" ? 0 : Number(e.target.value)
                        )
                      }
                      placeholder="0"
                      disabled={disabled}
                      className={`h-8 text-sm min-w-[70px] ${
                        isVariantQuantityExceeded(idx, v.quantity || 0)
                          ? "border-destructive focus-visible:ring-destructive"
                          : ""
                      }`}
                    />
                    {isVariantQuantityExceeded(idx, v.quantity || 0) && (
                      <p className="text-xs text-destructive">
                        {t("maxAvailable") || "Max available"}: {getAvailableQuantity(idx)}
                      </p>
                    )}
                  </div>
                </TableCell>
                {attributeColumns.map((attr) => (
                  <AttributeCell
                    key={attr.id}
                    attribute={attr}
                    variant={v}
                    variantIndex={idx}
                    onVariantChange={updateVariant}
                    disabled={disabled}
                    excludeAttributeValueIds={getExcludeIdsForCell(attr.id, idx)}
                  />
                ))}
                <TableCell className="p-1 align-top">
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={() => removeRow(idx)}
                    disabled={disabled}
                    className="text-destructive hover:text-destructive"
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                  {idx === variants.length - 1 && <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    className="h-8 w-8 p-0"
                    onClick={() => addRowAfter(idx)}
                    disabled={disabled}
                    aria-label={t("addVariant")}
                  >
                    <Plus className="h-4 w-4" />
                  </Button>}
                </TableCell>
               
              </TableRow>
            ))
          )}
        </TableBody>
      </Table>
      </div>
    </div>
  );
}
