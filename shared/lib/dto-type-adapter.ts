// smart-dto-types.ts
import {
  PartialType as SwaggerPartialType,
  OmitType as SwaggerOmitType,
} from "@nestjs/swagger";
import {
  Constructor,
  createOmitType,
  createPartialType,
} from "./dto-type-utils";

/**
 * ===========================================
 * Smart DTO Adapter
 * - Preserves backend TS types
 * - Works in frontend (runtime-safe) without NestJS decorators
 * ===========================================
 */

const isBackend = typeof window === "undefined";

/**
 * Backend-safe OmitType
 * - On backend: use SwaggerOmitType
 * - On frontend: fallback to createOmitType
 */
export function OmitType<
  T extends Constructor,
  K extends keyof InstanceType<T>
>(BaseClass: T, keys: readonly K[]): new () => Omit<InstanceType<T>, K> {
  return isBackend
    ? (SwaggerOmitType(BaseClass, keys) as new () => Omit<InstanceType<T>, K>)
    : createOmitType(BaseClass, keys);
}

/**
 * Backend-safe PartialType
 * - On backend: use SwaggerPartialType wrapped in explicit type
 * - On frontend: fallback to createPartialType
 */
export function PartialType<T extends Constructor>(
  BaseClass: T
): new () => Partial<InstanceType<T>> {
  if (isBackend) {
    const SwaggerClass = SwaggerPartialType(BaseClass);
    // Create a wrapper class with explicit type to avoid deep node_modules reference
    class PartialWrapper extends SwaggerClass {
      constructor() {
        super();
      }
    }
    return PartialWrapper as new () => Partial<InstanceType<T>>;
  }
  return createPartialType(BaseClass);
}
