import {
  IsString,
  IsNotEmpty,
  IsOptional,
  IsBoolean,
  IsArray,
  ValidateNested,
  ArrayMinSize,
  IsUUID,
} from "class-validator";
import { ApiProperty, ApiPropertyOptional } from "@nestjs/swagger";
import { PartialType } from "../../lib/dto-type-adapter";
import { Type, Expose } from "class-transformer";
import { PaginationMetaDto } from "../common/pagination.dto";
import { ListQueryDto } from "../common/list-query.dto";
import { FieldType } from "../../decorators/field.decorator"; 
import { PermissionDto } from "./permission.dto";
import { TransformToBoolean } from "../../decorators/crud.dto.decorators";
import { Equals } from "../../decorators/crud.dto.decorators";

export class RoleDto {
  @ApiProperty({
    example: "550e8400-e29b-41d4-a716-446655440000",
    description: "Role ID",
  })
  @IsNotEmpty()
  @IsUUID()
  id: string;

  @ApiProperty({ example: "Administrator", description: "Role name" })
  @IsOptional()
  name?: string;

  @ApiProperty({ example: "admin", description: "Role code/slug" })
  @IsOptional()
  code?: string;

  @ApiProperty({
    example: "Full system access",
    description: "Role description",
  })
  @IsOptional()
  description?: string;

  @ApiProperty({ example: 1, description: "Number of permissions" })
  @IsOptional()
  rolePermissionsCount?: number;


  @ApiProperty({ example: 1, description: "Number of role permissions" })
  @IsOptional()
  rolePermissions?: PermissionDto[];

  @ApiProperty({ example: true, description: "Whether role is system defined" })
  @IsOptional()
  isSystem?: boolean;

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

export class RolePaginatedDto extends PaginationMetaDto {
  @ApiProperty({ type: () => [RoleDto] })
  data: RoleDto[];
}

export class RoleListDto extends ListQueryDto {

  @ApiPropertyOptional({ example: true, description: "Filter by system roles" })
  @IsOptional()
  @IsBoolean()
  @FieldType("checkbox", false)
  @TransformToBoolean()
  @Equals()
  isSystem?: boolean;
}

export class CreateRoleDto {
  @ApiProperty({ example: "Administrator", description: "Role name" })
  @IsString()
  @IsNotEmpty()
  @FieldType("text", false)
  name: string;

  @ApiProperty({ example: "admin", description: "Role code/slug" })
  @IsString()
  @IsOptional()
  @FieldType("text", false)
  code: string;

  @ApiProperty({
    example: "Full system access",
    description: "Role description",
  })
  @IsString()
  @IsOptional()
  @FieldType("text", false)
  description: string;

  @ApiProperty({
    type: [PermissionDto],
    description: "Associated clients (at least one required)",
  })
  @ValidateNested({ each: true })
  @Expose()
  @Type(() => PermissionDto)
  @FieldType("nested", true, PermissionDto)
  @IsArray()
  @ArrayMinSize(1, { message: "At least one client must be selected" })
  rolePermissions: PermissionDto[];
}

export class UpdateRoleDto extends PartialType(CreateRoleDto) {}
