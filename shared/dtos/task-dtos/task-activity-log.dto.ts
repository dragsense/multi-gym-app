import {
  IsString,
  IsNotEmpty,
  IsOptional,
  IsObject,
  IsArray,
  ValidateNested,
} from "class-validator";
import { ApiProperty, ApiPropertyOptional } from "@nestjs/swagger";
import { Type } from "class-transformer";
import { UserDto } from "../user-dtos";

export class TaskActivityLogDto {
  @ApiProperty({
    example: "550e8400-e29b-41d4-a716-446655440000",
    description: "Activity log ID",
  })
  @IsNotEmpty()
  @IsString()
  id: string;

  @ApiProperty({
    example: "Updated task status from TODO to IN_PROGRESS",
    description: "Activity description",
  })
  @IsNotEmpty()
  @IsString()
  description: string;

  @ApiProperty({
    example: "status_update",
    description: "Type of activity (e.g., status_update, progress_update, assignment_change)",
  })
  @IsNotEmpty()
  @IsString()
  activityType: string;

  @ApiPropertyOptional({
    example: { status: { oldValue: "TODO", newValue: "IN_PROGRESS" } },
    description: "Metadata about what changed",
  })
  @IsOptional()
  @IsObject()
  changes?: Record<string, any>;

  @ApiPropertyOptional({
    example: ["status", "progress"],
    description: "List of fields that were updated",
  })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  updatedFields?: string[];

  @ApiPropertyOptional({ type: UserDto })
  @IsOptional()
  @ValidateNested()
  @Type(() => UserDto)
  user?: UserDto;

  @IsOptional()
  createdAt?: Date;

  @IsOptional()
  updatedAt?: Date;
}

