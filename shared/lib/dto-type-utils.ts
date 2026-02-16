import { CONTAINS } from "class-validator";
import {
  FIELD_UI_TYPE,
  FIELD_OPTIONS,
  FIELD_DTO_TYPE,
  FIELD_REQUIRED,
} from "../decorators/field.decorator";

export type Constructor<T = any> = new (...args: any[]) => T;

/**
 * Create an Omitted version of a class.
 * Removes specified fields but keeps FieldType-related metadata on the rest.
 */
export function createOmitType<
  T extends Constructor,
  K extends keyof InstanceType<T>
>(BaseClass: T, omittedKeys: readonly K[]): new () => Omit<InstanceType<T>, K> {
  class OmitClass extends (BaseClass as any) {
    constructor(...args: any[]) {
      super(...args);
      // Remove omitted keys from the instance
      for (const key of omittedKeys) {
        try {
          delete (this as any)[key];
        } catch {
          // Property might not be configurable, skip it
        }
      }
    }
  }

  const prototype = BaseClass.prototype;

  const baseKeys = Object.keys(new BaseClass()) as string[];
  const prototypeKeys = Object.getOwnPropertyNames(prototype) as string[];
  const allKeysSet: { [key: string]: boolean } = {};
  baseKeys.forEach((k) => (allKeysSet[k] = true));
  prototypeKeys.forEach((k) => (allKeysSet[k] = true));
  const omittedKeysArray = omittedKeys as readonly string[];
  const allKeys = Object.keys(allKeysSet).filter(
    (k) => k !== "constructor" && omittedKeysArray.indexOf(k) === -1
  ) as (string | symbol)[];

  for (const key of allKeys) {
    // Copy ALL metadata keys from the base class (including class-validator decorators)
    const metadataKeys = Reflect.getMetadataKeys(prototype, key);

    for (const metadataKey of metadataKeys) {
      const metadata = Reflect.getMetadata(metadataKey, prototype, key);
      if (metadata !== undefined) {
        Reflect.defineMetadata(metadataKey, metadata, OmitClass.prototype, key);
      }
    }

    // Also copy custom field metadata for UI
    const uiType = Reflect.getMetadata(FIELD_UI_TYPE, prototype, key);
    const options = Reflect.getMetadata(FIELD_OPTIONS, prototype, key);
    const required = Reflect.getMetadata(FIELD_REQUIRED, prototype, key);
    const dtoType = Reflect.getMetadata(FIELD_DTO_TYPE, prototype, key);

    if (uiType !== undefined)
      Reflect.defineMetadata(FIELD_UI_TYPE, uiType, OmitClass.prototype, key);
    if (options !== undefined)
      Reflect.defineMetadata(FIELD_OPTIONS, options, OmitClass.prototype, key);
    if (required !== undefined)
      Reflect.defineMetadata(
        FIELD_REQUIRED,
        required,
        OmitClass.prototype,
        key
      );
    if (dtoType !== undefined)
      Reflect.defineMetadata(FIELD_DTO_TYPE, dtoType, OmitClass.prototype, key);
  }

  Object.defineProperty(OmitClass, "name", {
    value: `Omit${BaseClass.name}`,
  });

  return OmitClass as new () => Omit<InstanceType<T>, K>;
}

/**
 * Create a Partial version of a class.
 * Makes all fields optional but keeps FieldType-related metadata.
 */
export function createPartialType<T extends Constructor>(
  BaseClass: T
): new () => Partial<InstanceType<T>> {
  // Create class that extends BaseClass to preserve prototype chain for class-validator
  class PartialClass extends (BaseClass as any) {
    constructor(...args: any[]) {
      super(...args);
    }
  }

  const prototype = BaseClass.prototype;

  const allKeys = [
    ...new Set([
      ...Object.keys(new BaseClass()),
      ...Object.getOwnPropertyNames(prototype),
    ]),
  ].filter((k) => k !== "constructor");

  for (const key of allKeys) {
    // Copy ALL metadata keys from the base class (including class-validator decorators)
    const metadataKeys = Reflect.getMetadataKeys(prototype, key);

    for (const metadataKey of metadataKeys) {
      // Skip IsNotEmpty for Partial types since all fields should be optional

      const metadata = Reflect.getMetadata(metadataKey, prototype, key);
      if (metadata !== undefined) {
        Reflect.defineMetadata(
          metadataKey,
          metadata,
          PartialClass.prototype,
          key
        );
      }
    }

    // For Partial types, ensure all fields are marked as optional
    // Override FIELD_REQUIRED to false even if it wasn't set before
    Reflect.defineMetadata(FIELD_REQUIRED, false, PartialClass.prototype, key);

    // Ensure IsOptional is present for all fields in Partial types
    const isOptionalMeta = Reflect.getMetadata(
      "__isOptional__",
      prototype,
      key
    );
    if (!isOptionalMeta) {
      Reflect.defineMetadata(
        "__isOptional__",
        true,
        PartialClass.prototype,
        key
      );
    }
  }

  Object.defineProperty(PartialClass, "name", {
    value: `Partial${BaseClass.name}`,
  });

  return PartialClass as new () => Partial<InstanceType<T>>;
}
