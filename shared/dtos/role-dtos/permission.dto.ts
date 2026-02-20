import {
  IsString,
  IsNotEmpty,
  IsOptional,
  IsEnum,
  IsNumber,
  IsArray,
  Min,
  ValidateNested,
  IsBoolean,
  IsUUID,
} from "class-validator";
import { ApiProperty, ApiPropertyOptional } from "@nestjs/swagger";
import { PartialType } from "../../lib/dto-type-adapter";
import { Type, Expose } from "class-transformer";
import { PaginationMetaDto } from "../common/pagination.dto";
import { ListQueryDto } from "../common/list-query.dto";
import { FieldOptions, FieldType } from "../../decorators/field.decorator";
import {
  EPermissionAction,
} from "../../enums/role/permission.enum";
import { ResourceDto } from "./resource.dto";

export class PermissionDto {
  @ApiProperty({
    example: "550e8400-e29b-41d4-a716-446655440000",
    description: "Permission ID",
  })
  @IsNotEmpty()
  @IsUUID()
  id: string;

  @ApiProperty({ example: "user:create", description: "Permission name/code" })
  @IsString()
  @IsOptional()
  name?: string;

  @ApiProperty({
    example: "Create User",
    description: "Permission display name",
  })
  @IsString()
  @IsOptional()
  displayName?: string;

  @ApiProperty({
    example: "Allow creating new users",
    description: "Permission description",
  })
  @IsString()
  @IsOptional()
  description?: string;

  @ApiProperty({
    enum: EPermissionAction,
    example: EPermissionAction.CREATE,
    description: "Permission action",
  })
  @IsEnum(EPermissionAction)
  @IsOptional()
  action?: EPermissionAction;

  @ApiProperty({
    example: true,
    description: "Whether permission is system defined",
  })
  @IsBoolean()
  @IsOptional()
  isSystem?: boolean;

  @ApiPropertyOptional({
    example: ["email", "name"],
    description: "Included columns",
  })
  @IsOptional()
  includedColumns?: string[];

  @ApiPropertyOptional({
    example: ["password", "ssn"],
    description: "Excluded columns",
  })
  @IsOptional()
  excludedColumns?: string[];

  @ApiProperty({
    example: "2024-01-01T00:00:00.000Z",
    description: "Creation timestamp",
  })
  @IsOptional()
  createdAt?: Date;

  @ApiProperty({
    example: "2024-01-01T00:00:00.000Z",
    description: "Last update timestamp",
  })
  @IsOptional()
  updatedAt?: Date;
}

export class PermissionPaginatedDto extends PaginationMetaDto {
  @ApiProperty({ type: () => [PermissionDto] })
  data: PermissionDto[];
}

export class PermissionListDto extends ListQueryDto {
  @ApiPropertyOptional({
    enum: EPermissionAction,
    example: EPermissionAction.CREATE,
    description: "Filter by permission action",
  })
  @IsOptional()
  @IsEnum(EPermissionAction)
  @FieldType("select", false)
  @FieldOptions(
    Object.values(EPermissionAction).map((v) => ({ value: v, label: v }))
  )
  action?: EPermissionAction;
}

export class CreatePermissionDto {
  @ApiProperty({ example: "user:create", description: "Permission name/code" })
  @IsString()
  @IsNotEmpty()
  @FieldType("text", false)
  name: string;

  @ApiProperty({
    example: "Create User",
    description: "Permission display name",
  })
  @IsString()
  @IsNotEmpty()
  @FieldType("text", false)
  displayName: string;

  @ApiProperty({
    example: "Allow creating new users",
    description: "Permission description",
  })
  @IsOptional()
  @FieldType("text", false)
  description: string;

  @ApiProperty({
    enum: EPermissionAction,
    example: EPermissionAction.CREATE,
    description: "Permission action",
  })
  @IsEnum(EPermissionAction)
  @FieldType("select", false)
  @FieldOptions(
    Object.values(EPermissionAction).map((v) => ({ value: v, label: v }))
  )
  action: EPermissionAction;

  @ApiProperty({ type: ResourceDto })
  @ValidateNested()
  @Expose()
  @Type(() => ResourceDto)
  @FieldType("custom", true, ResourceDto)
  resource: ResourceDto;


  @ApiPropertyOptional({
    example: ["email", "name"],
    description: "Included columns",
  })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  @FieldType("multiSelect", false)
  includedColumns?: string[];

  @ApiPropertyOptional({
    example: ["password", "ssn"],
    description: "Excluded columns",
  })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  @FieldType("multiSelect", false)
  excludedColumns?: string[];
}

export class UpdatePermissionDto extends PartialType(CreatePermissionDto) { }
