import {
  type ClassConstructor,
  plainToInstance,
  type TargetMap,
} from "class-transformer";
import { validate } from "class-validator";
import {
  FIELD_UI_TYPE,
  FIELD_DTO_TYPE,
} from "@shared/decorators/field.decorator";



export function classValidatorResolver<T extends object>(
  dtoClass: ClassConstructor<T>
): (values: any) => Promise<{ values: any, errors: any }> {
  return async (values) => {
    // Separate File objects and arrays of Files from regular values before transformation
    const regularValues: any = {};
    const fileValues: any = {};


    Object.keys(values).forEach((key) => {
      const value = (values as any)[key];

      // Check if it's a single File
      if (typeof File !== "undefined" && value instanceof File) {
        fileValues[key] = value;
      }
      // Check if it's an array of Files
      else if (
        Array.isArray(value) &&
        value.length > 0 &&
        value.every((item) => item instanceof File)
      ) {
        fileValues[key] = value;
      }
      // Check if it's a Blob
      else if (typeof Blob !== "undefined" && value instanceof Blob) {
        fileValues[key] = value;
      }
      // Filter out empty strings for optional fields (they should be undefined instead)
      else if (value === "" || value === null) {
        // Don't include empty strings or null - let them be undefined
        // This prevents validation errors for optional fields
      }
      // Otherwise it's a regular value
      else {
        regularValues[key] = value;
      }
    });

    const dto = plainToInstance(dtoClass, regularValues, {
      enableImplicitConversion: true,
      excludeExtraneousValues: false,
    });


    // Add File/Blob objects back to DTO without transformation
    Object.keys(fileValues).forEach((key) => {
      (dto as any)[key] = fileValues[key];
    });
    

    // Now validate everything together
    const errors = await validate(dto, {
      skipMissingProperties: false,
      whitelist: true,
      forbidNonWhitelisted: false,
      skipUndefinedProperties: false,
      skipNullProperties: false,
      validationError: { target: false },
    });

    if (errors.length === 0) {
      return { values, errors: {} };
    }

    // Flatten nested validation errors
    const formErrors = flattenValidationErrors(errors);

    return { values: {}, errors: formErrors };
  };
}

function flattenValidationErrors(
  errors: any[],
  parentPath: string = ""
): Record<string, any> {
  return errors.reduce((acc, err) => {
    const fieldPath = parentPath
      ? `${parentPath}.${err.property}`
      : err.property;
    if (err.constraints) {
      acc[fieldPath] = {
        type: "validation",
        message: Object.values(err.constraints)[0],
      };

      if (parentPath) {
        acc[parentPath] = {
          type: "validation",
          message: Object.values(err.constraints)[0],
        };
      }
    }

    if (err.children && err.children.length > 0) {
      Object.assign(acc, flattenValidationErrors(err.children, fieldPath));
    }

    return acc;
  }, {} as Record<string, any>);
}
