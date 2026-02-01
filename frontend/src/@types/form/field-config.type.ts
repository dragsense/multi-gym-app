import { type ReactNode } from "react";

import React from "react";
import { type EORDER_CLASSES } from "@/enums/general.enum";
import type { TFieldType } from "@shared/types/form/field.type";

export type TCustomInputWrapper = {
  value: any;
  onChange: (value: any) => void;
  disabled?: boolean;
};

export type BaseField<T> = {
  id: keyof T & string;
  name: keyof T & string;
  label: string;

  // Field type (mapped from DTO type or decorator)
  type?: TFieldType;

  // Value semantics
  required?: boolean | ((ctx: { values: Record<string, any> }) => boolean);
  defaultValue?: any;
  placeholder?: string;

  // Options (select/multiSelect, radio, checkbox groups, enums)
  options?: { label: string; value: string }[] | [];

  // Numeric inputs (slider, rating, number)
  min?: number;
  max?: number;
  step?: number;

  // Validation patterns
  pattern?: RegExp;

  // Conditional behavior
  disabled?: boolean | ((ctx: { values: Record<string, any> }) => boolean);
  visible?: (ctx: { values: Record<string, any> }) => boolean;

  // Layout + UI
  layout?: "horizontal" | "vertical";
  lableOrder?: EORDER_CLASSES;
  className?: string;

  // Decorations
  startAdornment?: ReactNode;
  endAdornment?: ReactNode;
  bottomAdornment?: ReactNode;

  // Events
  onChange?: (value: any) => void;
};

export type NestedSubFields<T> = {
  [K in keyof T as T[K] extends object ? K : never]: TFieldConfig<T[K]>;
}[keyof { [K in keyof T as T[K] extends object ? K : never]: any }];

export type AddButtonComponent = React.ComponentType<any>;
export type RemoveButtonComponent = React.ComponentType<any>;

export type TFieldConfigObject<T = any> = {
  [K in keyof T]: T[K] extends object
    ? T[K] extends Array<any>
      ? TFieldConfig<T[K]>
      : TFieldConfigObject<T[K]>
    : TFieldConfig<T[K]>;
};

export type TFieldConfigObjectPartial<T> = {
  [K in keyof T]?: T[K] extends Array<infer U>
    ? Partial<NestedArrayField<U>> // array override
    : T[K] extends object
    ? TFieldConfigObjectPartial<T[K]> | Partial<TFieldConfig<T[K]>> // allow nested object OR direct field override
    : Partial<TFieldConfig<T[K]>>; // primitive override
};

// Nested field must have subFields
export type NestedField<T> = BaseField<T> & {
  type: "nested";
  subFields: TFieldConfigObject<T>;
  Component?: never;
  minItems?: never;
  maxItems?: never;
  renderItem?: never;
  AddButton?: never;
  RemoveButton?: never;
};

export type RenderArrayItem = {
  key: string;
  index: number;
  name: string;
  render: () => React.ReactNode;
};

export type NestedArrayField<T> = BaseField<T> & {
  type: "nestedArray";
  subFields: TFieldConfigObject<T>;
  AddButton?: React.ComponentType<any>;
  RemoveButton?: React.ComponentType<any>;
  Component?: never;
  minItems: number;
  maxItems: number;
  renderItem?: (
    items: RenderArrayItem[] | T,
    AddButton?: React.ReactNode,
    removeButton?: (index: number) => React.ReactNode
  ) => React.ReactNode;
};

// Custom field must have Component
export type CustomField<T> = BaseField<T> & {
  type: "custom";
  Component: React.ComponentType<TCustomInputWrapper>;
  subFields?: never;
  minItems?: never;
  maxItems?: never;
  renderItem?: never;
  AddButton?: never;
  RemoveButton?: never;
};

// Primitive field cannot have subFields or Component
export type PrimitiveField<
  T,
  Type extends Exclude<
    TFieldType,
    "nested" | "custom" | "nestedArray"
  > = Exclude<TFieldType, "nested" | "custom" | "nestedArray">
> = BaseField<T> & {
  type: Type;
  subFields?: never;
  Component?: never;
  minItems?: never;
  maxItems?: never;
  renderItem?: never;
  AddButton?: never;
  RemoveButton?: never;
};

// TFieldConfig union type
export type TFieldConfig<T = any> =
  | NestedArrayField<T>
  | NestedField<T>
  | CustomField<T>
  | PrimitiveField<T>
  | NestedField<T>;

export type TDefaultValue<T> = {
  [K in keyof T]: T[K] extends object
    ? T[K] extends Date | Function
      ? {
          value: T[K]; // Treat Date and Function as primitives
        }
      : T[K] extends Array<infer U>
      ? {
          value: {
            isNested?: boolean;
            value: TDefaultValue<U>; // Arrays get optional isNested and recursive for their elements
          }[];
        }
      : {
          isNested: boolean;
          value: TDefaultValue<T[K]>; // Other objects get recursive nesting
        }
    : {
        value: T[K]; // Primitives
      };
};
