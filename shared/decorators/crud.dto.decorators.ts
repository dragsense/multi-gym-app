import "reflect-metadata";

import {
  registerDecorator,
  ValidationOptions,
  ValidatorConstraint,
  ValidatorConstraintInterface,
  ValidationArguments,
} from "class-validator";
import { Transform, TransformOptions } from "class-transformer";

// Number comparison decorators
@ValidatorConstraint({ name: "isGreaterThan", async: false })
export class IsGreaterThanConstraint implements ValidatorConstraintInterface {
  validate(value: any, args: ValidationArguments) {
    const [min] = args.constraints;
    return typeof value === "number" && value > min;
  }

  defaultMessage(args: ValidationArguments) {
    const [min] = args.constraints;
    return `Value must be greater than ${min}`;
  }
}

@ValidatorConstraint({ name: "isLessThan", async: false })
export class IsLessThanConstraint implements ValidatorConstraintInterface {
  validate(value: any, args: ValidationArguments) {
    const [max] = args.constraints;
    return typeof value === "number" && value < max;
  }

  defaultMessage(args: ValidationArguments) {
    const [max] = args.constraints;
    return `Value must be less than ${max}`;
  }
}

@ValidatorConstraint({ name: "isGreaterThanOrEqual", async: false })
export class IsGreaterThanOrEqualConstraint
  implements ValidatorConstraintInterface
{
  validate(value: any, args: ValidationArguments) {
    const [min] = args.constraints;
    return typeof value === "number" && value >= min;
  }

  defaultMessage(args: ValidationArguments) {
    const [min] = args.constraints;
    return `Value must be greater than or equal to ${min}`;
  }
}

@ValidatorConstraint({ name: "isLessThanOrEqual", async: false })
export class IsLessThanOrEqualConstraint
  implements ValidatorConstraintInterface
{
  validate(value: any, args: ValidationArguments) {
    const [max] = args.constraints;
    return typeof value === "number" && value <= max;
  }

  defaultMessage(args: ValidationArguments) {
    const [max] = args.constraints;
    return `Value must be less than or equal to ${max}`;
  }
}

@ValidatorConstraint({ name: "isBetween", async: false })
export class IsBetweenConstraint implements ValidatorConstraintInterface {
  validate(value: any, args: ValidationArguments) {
    const [min, max] = args.constraints;
    return typeof value === "number" && value >= min && value <= max;
  }

  defaultMessage(args: ValidationArguments) {
    const [min, max] = args.constraints;
    return `Value must be between ${min} and ${max}`;
  }
}

// Decorator functions
export function IsGreaterThan(
  min: number,
  validationOptions?: ValidationOptions
) {
  return function (object: Object, propertyName: string) {
    registerDecorator({
      target: object.constructor,
      propertyName: propertyName,
      options: validationOptions,
      constraints: [min],
      validator: IsGreaterThanConstraint,
    });
  };
}

export function IsLessThan(max: number, validationOptions?: ValidationOptions) {
  return function (object: Object, propertyName: string) {
    registerDecorator({
      target: object.constructor,
      propertyName: propertyName,
      options: validationOptions,
      constraints: [max],
      validator: IsLessThanConstraint,
    });
  };
}

export function IsGreaterThanOrEqual(
  min: number,
  validationOptions?: ValidationOptions
) {
  return function (object: Object, propertyName: string) {
    registerDecorator({
      target: object.constructor,
      propertyName: propertyName,
      options: validationOptions,
      constraints: [min],
      validator: IsGreaterThanOrEqualConstraint,
    });
  };
}

export function IsLessThanOrEqual(
  max: number,
  validationOptions?: ValidationOptions
) {
  return function (object: Object, propertyName: string) {
    registerDecorator({
      target: object.constructor,
      propertyName: propertyName,
      options: validationOptions,
      constraints: [max],
      validator: IsLessThanOrEqualConstraint,
    });
  };
}

export function IsBetween(
  min: number,
  max: number,
  validationOptions?: ValidationOptions
) {
  return function (object: Object, propertyName: string) {
    registerDecorator({
      target: object.constructor,
      propertyName: propertyName,
      options: validationOptions,
      constraints: [min, max],
      validator: IsBetweenConstraint,
    });
  };
}

// Transform decorators
export function TransformToNumber(options?: TransformOptions) {
  return Transform(({ value }) => {
    if (value === null || value === undefined || value === "") {
      return value;
    }
    const num = Number(value);
    return isNaN(num) ? value : num;
  }, options);
}

export function TransformToBoolean(options?: TransformOptions) {
  return Transform(({ value }) => {
    if (typeof value === "boolean") return value;
    if (typeof value === "string") {
      return value.toLowerCase() === "true";
    }
    return Boolean(value);
  }, options);
}

export function TransformToArray(options?: TransformOptions) {
  return Transform(({ value }) => {
    if (Array.isArray(value)) return value;
    if (typeof value === "string") {
      return value.split(",").map((item) => item.trim());
    }
    return [value];
  }, options);
}

export function TransformToDate(options?: TransformOptions) {
  return Transform(({ value }) => {
    if (value instanceof Date) return value;
    if (typeof value === "string" || typeof value === "number") {
      const date = new Date(value);
      return isNaN(date.getTime()) ? value : date;
    }
    return value;
  }, options);
}

// Custom validator for date arrays (for date ranges)
@ValidatorConstraint({ name: "isDateArray", async: false })
export class IsDateArrayConstraint implements ValidatorConstraintInterface {
  validate(value: any) {
    if (!Array.isArray(value)) return false;

    return value.every((item) => {
      if (typeof item === "string") {
        const date = new Date(item);
        return !isNaN(date.getTime());
      }
      return item instanceof Date;
    });
  }

  defaultMessage() {
    return "Each item in the array must be a valid date string or Date object";
  }
}

export function IsDateArray(validationOptions?: ValidationOptions) {
  return function (object: Object, propertyName: string) {
    registerDecorator({
      target: object.constructor,
      propertyName: propertyName,
      options: validationOptions,
      constraints: [],
      validator: IsDateArrayConstraint,
    });
  };
}

// Query Filtering Decorators
export const QUERY_FILTER_METADATA = Symbol("query_filter_metadata");
export const RELATION_FILTER_METADATA = Symbol("relation_filter_metadata");

export interface BaseFilterOptions {
  type?:
    | "between"
    | "lessThan"
    | "greaterThan"
    | "lessThanOrEqual"
    | "greaterThanOrEqual"
    | "like"
    | "in"
    | "notIn"
    | "isNull"
    | "isNotNull"
    | "equals"
    | "notEquals";
  field?: string; // For nested fields like 'profile.firstName'
  operator?: string; // Custom operator for complex queries
  transform?: (value: any) => any; // Transform function for the value
}

export interface QueryFilterOptions extends BaseFilterOptions {
  // Inherits type from BaseFilterOptions
}

export interface RelationFilterOptions extends BaseFilterOptions {
  relationPath: string; // e.g., "profile.documents.version"
}

/**
 * Query decorator for filtering operations - integrates with existing CRUD system
 * @param options Query filter options
 */
export function QueryFilter(options: QueryFilterOptions) {
  return (target: any, propertyKey: string) => {
    const existingFilters =
      Reflect.getMetadata(QUERY_FILTER_METADATA, target) || {};
    existingFilters[propertyKey] = {
      type: "equals", // Default type
      field: propertyKey,
      ...options,
    };
    Reflect.defineMetadata(QUERY_FILTER_METADATA, existingFilters, target);
  };
}

/**
 * Relation filter decorator for filtering on relation fields
 * @param relationPath The relation path (e.g., 'profile.documents.version')
 * @example @RelationFilter('profile.documents.version')
 */
export function RelationFilter(relationPath: string) {
  return (target: any, propertyKey: string) => {
    const existingFilters =
      Reflect.getMetadata(RELATION_FILTER_METADATA, target) || {};
    existingFilters[propertyKey] = relationPath;
    Reflect.defineMetadata(RELATION_FILTER_METADATA, existingFilters, target);
  };
}

/**
 * Between filter decorator - for range queries
 * @param field Optional field name (defaults to property name)
 */
export function Between(field?: string) {
  return QueryFilter({ type: "between", field });
}

/**
 * Less than filter decorator
 * @param field Optional field name (defaults to property name)
 */
export function LessThan(field?: string) {
  return QueryFilter({ type: "lessThan", field });
}

/**
 * Greater than filter decorator
 * @param field Optional field name (defaults to property name)
 */
export function GreaterThan(field?: string) {
  return QueryFilter({ type: "greaterThan", field });
}

/**
 * Less than or equal filter decorator
 * @param field Optional field name (defaults to property name)
 */
export function LessThanOrEqual(field?: string) {
  return QueryFilter({ type: "lessThanOrEqual", field });
}

/**
 * Greater than or equal filter decorator
 * @param field Optional field name (defaults to property name)
 */
export function GreaterThanOrEqual(field?: string) {
  return QueryFilter({ type: "greaterThanOrEqual", field });
}

/**
 * Like filter decorator - for text search
 * @param field Optional field name (defaults to property name)
 */
export function Like(field?: string) {
  return QueryFilter({ type: "like", field });
}

/**
 * In filter decorator - for array values
 * @param field Optional field name (defaults to property name)
 */
export function In(field?: string) {
  return QueryFilter({ type: "in", field });
}

/**
 * Not in filter decorator - for excluding array values
 * @param field Optional field name (defaults to property name)
 */
export function NotIn(field?: string) {
  return QueryFilter({ type: "notIn", field });
}

/**
 * Is null filter decorator
 * @param field Optional field name (defaults to property name)
 */
export function IsNull(field?: string) {
  return QueryFilter({ type: "isNull", field });
}

/**
 * Is not null filter decorator
 * @param field Optional field name (defaults to property name)
 */
export function IsNotNull(field?: string) {
  return QueryFilter({ type: "isNotNull", field });
}

/**
 * Equals filter decorator - explicit equality
 * @param field Optional field name (defaults to property name)
 */
export function Equals(field?: string) {
  return QueryFilter({ type: "equals", field });
}

/**
 * Not equals filter decorator
 * @param field Optional field name (defaults to property name)
 */
export function NotEquals(field?: string) {
  return QueryFilter({ type: "notEquals", field });
}

/**
 * Date range filter decorator - combines between for dates
 * @param field Optional field name (defaults to property name)
 */
export function DateRange(field?: string) {
  return QueryFilter({
    type: "between",
    field,
    transform: (value: { start: string; end: string }) => [
      value.start,
      value.end,
    ],
  });
}

/**
 * Get query filters metadata from a class
 * @param target Class or instance
 * @returns Query filters metadata
 */
export function getQueryFilters(
  target: any
): Record<string, QueryFilterOptions> {
  // Check both the class and its prototype for metadata
  const classMetadata =
    Reflect.getMetadata(QUERY_FILTER_METADATA, target) || {};
  const prototypeMetadata =
    Reflect.getMetadata(QUERY_FILTER_METADATA, target.prototype) || {};

  // Merge both metadata sources
  return { ...classMetadata, ...prototypeMetadata };
}

/**
 * Get relation filters metadata from a class
 * @param target Class or instance
 * @returns Relation filters metadata
 */
export function getRelationFilters(target: any): Record<string, string> {
  // Check both the class and its prototype for metadata
  const classMetadata =
    Reflect.getMetadata(RELATION_FILTER_METADATA, target) || {};
  const prototypeMetadata =
    Reflect.getMetadata(RELATION_FILTER_METADATA, target.prototype) || {};

  // Merge both metadata sources
  return { ...classMetadata, ...prototypeMetadata };
}

// Pagination decorators
export function PaginationDto(validationOptions?: ValidationOptions) {
  return function (target: any) {
    // Add pagination properties to the DTO class
    Object.defineProperty(target.prototype, "page", {
      value: 1,
      writable: true,
      enumerable: true,
      configurable: true,
    });

    Object.defineProperty(target.prototype, "limit", {
      value: 10,
      writable: true,
      enumerable: true,
      configurable: true,
    });
  };
}
