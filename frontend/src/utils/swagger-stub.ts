// Stub for @nestjs/swagger to prevent frontend errors
export const ApiProperty = (options?: any) => (target: any, propertyKey: string) => {};
export const ApiPropertyOptional = (options?: any) => (target: any, propertyKey: string) => {};
export const PartialType = (classRef: any) => classRef;
export const OmitType = (classRef: any, keys: readonly string[]) => classRef;

export const Type = (fn: () => any) => (target: any, propertyKey: string) => {};


