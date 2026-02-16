import {
  FIELD_UI_TYPE,
  FIELD_OPTIONS,
  FIELD_DTO_TYPE,
  FIELD_REQUIRED,
} from "@shared/decorators/field.decorator";
import { type TFieldType } from "@shared/types/form/field.type";
import {
  type TFieldConfig,
  type TFieldConfigObject,
} from "@/@types/form/field-config.type";

// --------------------
// Build a single field
// --------------------
function buildField<T>(
  prototype: any,
  key: keyof T & string
): TFieldConfig<T> | null {
  // Get decorator metadata
  const decoratorType: TFieldType | undefined = Reflect.getMetadata(
    FIELD_UI_TYPE,
    prototype,
    key
  );
  const decoratorOptions: { label: string; value: string }[] | undefined =
    Reflect.getMetadata(FIELD_OPTIONS, prototype, key);
  const isRequired = Reflect.getMetadata(FIELD_REQUIRED, prototype, key);
  const isOptional = isRequired === false;

  // Skip fields with no decorator type
  if (!decoratorType) return null;

  // Base field
  const baseField = {
    id: key,
    name: key,
    label: key[0].toUpperCase() + key.slice(1),
    required: !isOptional,
    options: decoratorOptions ?? undefined,
    type: decoratorType,
  };

  // Nested DTOs
  if (decoratorType === "nested" || decoratorType === "nestedArray") {
    const nestedType = Reflect.getMetadata(FIELD_DTO_TYPE, prototype, key);

    if (!nestedType) {
      console.warn(
        `No DTO class found for nested field "${key}". Make sure to use @FieldType("nested", YourDtoClass) decorator.`
      );
      return null;
    }

    const field = {
      ...baseField,
      type: decoratorType === "nested" ? "nested" : "nestedArray",
      ...(decoratorType === "nestedArray" && {
        minItems: 1,
        maxItems: 10,
      }),
      subFields: dtoToFields(nestedType),
    };

    return field as TFieldConfig<T>;
  }

  return baseField as TFieldConfig<T>;
}

// --------------------
// Main Function
// --------------------
export function dtoToFields<T>(dto: new () => T): TFieldConfigObject<T> {
  const instance = new dto();
  const prototype = Object.getPrototypeOf(instance);

  const fields = Object.getOwnPropertyNames(instance)
    .map((key) => buildField(prototype, key as keyof T & string))
    .filter((f): f is TFieldConfig<T> => f !== null);

  // Create a properly typed result object
  const result = {} as TFieldConfigObject<T>;

  fields.forEach((field) => {
    // This is type-safe because we know the structure matches
    result[field.name as keyof T] = field as TFieldConfigObject<T>[keyof T];
  });

  return result;
}

export function addRenderItem<T>(
  fields: TFieldConfigObject<T>,
  renderers: Record<string, (item: any) => ReactNode>
): TFieldConfigObject<T> {
  const result: any = {};

  for (const key in fields) {
    const field = fields[key];

    result[key] = { ...field };

    // Attach renderItem if a renderer exists for this field
    if (renderers[key]) {
      result[key].renderItem = renderers[key];
    }

    // Recursively apply to subFields
    if (typeof field === "object" && "subFields" in field && field.subFields) {
      result[key].subFields = addRenderItem(field.subFields, renderers);
    }
  }

  return result;
}
