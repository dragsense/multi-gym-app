import "reflect-metadata";

import { TFieldType } from "../types/form/field.type";

export const FIELD_UI_TYPE = Symbol("field_ui_type");
export const FIELD_OPTIONS = Symbol("field_options");
export const FIELD_DTO_TYPE = Symbol("field_dto_type");
export const FIELD_REQUIRED = Symbol("field_required");

// Force field type
export function FieldType(
  type: TFieldType,
  required: boolean = false,
  dtoClass?: new () => any
) {
  return (target: any, propertyKey: string) => {
    Reflect.defineMetadata(FIELD_UI_TYPE, type, target, propertyKey);
    Reflect.defineMetadata(FIELD_REQUIRED, required, target, propertyKey);
    if (dtoClass) {
      Reflect.defineMetadata(FIELD_DTO_TYPE, dtoClass, target, propertyKey);
    }
  };
}

// Provide select / multiSelect options
export function FieldOptions(options: { label: string; value: string }[]) {
  return (target: any, propertyKey: string) => {
    Reflect.defineMetadata(FIELD_OPTIONS, options, target, propertyKey);
  };
}
