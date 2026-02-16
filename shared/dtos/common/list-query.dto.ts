import {
  IsDateString,
  IsIn,
  IsInt,
  IsOptional,
  IsString,
  Max,
  Min,
  IsArray,
} from "class-validator";
import { Transform, Type } from "class-transformer";
import { FieldType } from "../../decorators/field.decorator";
import {
  Between,
  TransformToArray,
  IsDateArray,
} from "../../decorators/crud.dto.decorators";

export class BaseQueryDto<T = any> {
  // Simplified relation, select, and searchable system
  @IsOptional()
  @IsArray()
  @TransformToArray()
  @FieldType("text", false)
  _relations?: string[]; // Comma-separated relation names: "profile,role,permissions"

  @IsOptional()
  @IsArray()
  @TransformToArray()
  @FieldType("text", false)
  _select?: string[]; // Comma-separated selectable fields: "id,email,profile.firstName,profile.phoneNumber"

  @IsOptional()
  @IsArray()
  @TransformToArray()
  @FieldType("text", false)
  _countable?: string[]; // If provided, returns only count instead of data payload
}

export class PaginationDto<T> extends BaseQueryDto<T> {
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  page?: number;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(100)
  limit?: number;

  @IsOptional()
  @IsString()
  sortBy?: keyof T; // ✅ dynamic based on T

  @IsOptional()
  @IsString()
  @Transform(({ value }) => value?.toUpperCase())
  @IsIn(["ASC", "DESC"])
  sortOrder?: "ASC" | "DESC";

  @IsOptional()
  @IsString()
  @TransformToArray()
  @FieldType("custom", false)
  sortFields?: string[]; // Comma-separated format: "createdAt:DESC,name:ASC"
}

export class ListQueryDto<T = any> extends PaginationDto<T> {
  @IsOptional()
  @IsString()
  @FieldType("text", false)
  search?: string;

  @IsOptional()
  @IsDateArray()
  @TransformToArray()
  @Between()
  @FieldType("dateRange", false)
  createdAt?: string[];

  @IsOptional()
  @IsDateString()
  @FieldType("dateTimeRange", false)
  updatedAt?: string;

  @IsOptional()
  @IsArray()
  @TransformToArray()
  @FieldType("text", false)
  _searchable?: string[]; // Comma-separated searchable fields: "email,profile.firstName,profile.lastName"
}

export class SingleQueryDto<T = any> extends BaseQueryDto<T> {
  @IsOptional()
  @IsString()
  @FieldType("text", false)
  id?: string;
}
