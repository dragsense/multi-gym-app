/**
 * ===========================================
 * Shared DTO Utility Functions
 * - Works in both frontend & backend
 * - Supports class-validator decorators
 * - Provides runtime + compile-time helpers
 * ===========================================
 */

/**
 * Helper: copy metadata from one prototype to another
 * Used for class-validator & class-transformer decorators
 */
function copyDecorators(from: any, to: any) {
  const keys = Reflect.ownKeys(from);
  for (const key of keys) {
    if (key === 'constructor') continue;

    const metaKeys = Reflect.getMetadataKeys(from, key);
    for (const metaKey of metaKeys) {
      const metadata = Reflect.getMetadata(metaKey, from, key);
      Reflect.defineMetadata(metaKey, metadata, to, key);
    }
  }
}

/**
 * Create a Partial version of a class
 * Preserves metadata for validation
 */
export function createPartialType<T extends new (...args: any[]) => any>(
  BaseClass: T
): new () => Partial<InstanceType<T>> {
  abstract class PartialClass {
    constructor() {
      const baseInstance = new BaseClass();
      Object.assign(this, baseInstance);
    }
  }

  copyDecorators(BaseClass.prototype, PartialClass.prototype);

  Object.defineProperty(PartialClass, 'name', {
    value: `Partial${BaseClass.name}`,
  });

  return PartialClass as any;
}




/**
 * Create an Omitted version of a class
 * Removes given keys but preserves decorators for remaining fields
 */
export function createOmitType<
  T extends new (...args: any[]) => any,
  K extends keyof InstanceType<T>
>(
  BaseClass: T,
  omittedKeys: readonly K[]
): new () => Omit<InstanceType<T>, K> {
  abstract class OmittedClass {
    constructor() {
      const baseInstance = new BaseClass();
      for (const key of Object.keys(baseInstance) as (keyof InstanceType<T>)[]) {
        if (!omittedKeys.includes(key as K)) {
          (this as any)[key] = (baseInstance as any)[key];
        }
      }
    }
  }

  // Copy decorators except for omitted keys
  const proto = BaseClass.prototype;
  for (const key of Object.getOwnPropertyNames(proto)) {
    if (key !== 'constructor' && !omittedKeys.includes(key as K)) {
      const metaKeys = Reflect.getMetadataKeys(proto, key);
      for (const metaKey of metaKeys) {
        const metadata = Reflect.getMetadata(metaKey, proto, key);
        Reflect.defineMetadata(metaKey, metadata, OmittedClass.prototype, key);
      }
    }
  }

  Object.defineProperty(OmittedClass, 'name', {
    value: `Omit${BaseClass.name}`,
  });

  return OmittedClass as any;
}

/**
 * ============================
 * Type-only (compile-time) helpers
 * ============================
 */
export type OmitType<T, K extends keyof T> = Omit<T, K>;
export type PickType<T, K extends keyof T> = Pick<T, K>;
export type PartialType<T> = Partial<T>;

/**
 * ============================
 * Runtime object helpers
 * ============================
 */
export function omit<T extends Record<string, any>, K extends keyof T>(
  obj: T,
  keys: readonly K[]
): Omit<T, K> {
  const result = { ...obj };
  for (const key of keys) delete result[key];
  return result;
}

export function pick<T extends Record<string, any>, K extends keyof T>(
  obj: T,
  keys: readonly K[]
): Pick<T, K> {
  const result = {} as Pick<T, K>;
  for (const key of keys) {
    result[key] = obj[key];
  }
  return result;
}
