import React, { useMemo } from "react";
import { SearchableInputWrapper } from "@/components/shared-ui/searchable-input-wrapper";
import { useAttributeValues } from "@/hooks/use-searchable";
import type { IAttribute } from "@shared/interfaces";
import type { IAttributeValue } from "@shared/interfaces/products/attribute-value.interface";
import { EAttributeType } from "@shared/enums/products/attribute-type.enum";

type VariantLike = {
  attributeValues?: Array<{ id: string; value?: string; attribute?: { id: string } }>;
};

interface AttributeCellProps {
  attribute: IAttribute;
  variant: VariantLike;
  variantIndex: number;
  onVariantChange: (index: number, next: VariantLike) => void;
  disabled?: boolean;
  excludeAttributeValueIds?: Set<string>;
}

export const AttributeCell = React.memo(function AttributeCell({
  attribute,
  variant,
  variantIndex,
  onVariantChange,
  disabled,
  excludeAttributeValueIds,
}: AttributeCellProps) {
  const searchableAttributeValues = useAttributeValues(attribute.id, {});

  const filteredResponse = useMemo(() => {
    const raw = searchableAttributeValues.response?.data ?? [];
    const list = Array.isArray(raw) ? raw : [];
    const exclude = excludeAttributeValueIds ?? new Set<string>();
    const filtered = exclude.size
      ? list.filter((av: { id: string }) => !exclude.has(av.id))
      : list;
    return { ...searchableAttributeValues.response, data: filtered };
  }, [
    searchableAttributeValues.response,
    excludeAttributeValueIds,
  ]);

  const selected = useMemo(() => {
    const list = variant.attributeValues ?? [];
    return list.find(
      (av) =>
        av.attribute?.id === attribute.id ||
        (av as { attributeId?: string })?.attributeId === attribute.id
    ) ?? null;
  }, [variant.attributeValues, attribute.id]);

  const value = selected
    ? ({ id: selected.id, value: selected.value, attribute: { id: attribute.id } } as IAttributeValue)
    : undefined;

  const handleChange = (v: IAttributeValue | IAttributeValue[] | null) => {
    const next = Array.isArray(v) ? v[0] : v;
    const list = variant.attributeValues ?? [];
    const rest = list.filter(
      (av) =>
        av.attribute?.id !== attribute.id &&
        (av as { attributeId?: string })?.attributeId !== attribute.id
    );
    const nextAv = next
      ? [
          ...rest,
          {
            id: next.id,
            value: next.value,
            attribute: { id: attribute.id },
          },
        ]
      : rest;
    onVariantChange(variantIndex, { ...variant, attributeValues: nextAv });
  };

  return (
    <td className="p-1 align-top">
      <SearchableInputWrapper<IAttributeValue>
        value={value}
        onChange={handleChange}
        disabled={disabled}
        useSearchable={() => ({
          ...searchableAttributeValues,
          response: filteredResponse,
        })}
        getLabel={(item) => {
          if (!item) return null;
          const isColor = attribute.type === EAttributeType.COLOR;
          return isColor ? <><div className="w-5 h-5" style={{ backgroundColor: item.value }} /> <span>{item.value}</span></> : <span>{item.value}</span>;
        }}
        getKey={(item) => item.id}
        getValue={(item) => ({
          id: item.id,
          value: item.value,
          attribute: { id: attribute.id },
        }) as IAttributeValue}
        shouldFilter={false}
        modal={false}
      />
    </td>
  );
});
