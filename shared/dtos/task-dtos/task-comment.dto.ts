import {
  IsString,
  IsNotEmpty,
  IsOptional,
  IsUUID,
  ValidateNested,
} from "class-validator";
import { ApiProperty, ApiPropertyOptional } from "@nestjs/swagger";
import { Type, Expose } from "class-transformer";
import { FieldType } from "../../decorators/field.decorator";
import { UserDto } from "../user-dtos";

export class CreateTaskCommentDto {
  @ApiProperty({
    example: "This task needs more clarification on the requirements",
    description: "Comment content",
  })
  @IsNotEmpty()
  @IsString()
  @FieldType("textarea", true)
  content: string;

  @ApiPropertyOptional({
    example: "550e8400-e29b-41d4-a716-446655440000",
    description: "ID of the parent comment if this is a reply",
  })
  @IsOptional()
  @IsUUID()
  @FieldType("text", false)
  parentCommentId?: string;
}

export class UpdateTaskCommentDto {
  @ApiPropertyOptional({
    example: "This task needs more clarification on the requirements",
    description: "Comment content",
  })
  @IsOptional()
  @IsString()
  @FieldType("textarea", false)
  content?: string;
}

export class TaskCommentDto {
  @ApiProperty({
    example: "550e8400-e29b-41d4-a716-446655440000",
    description: "Comment ID",
  })
  @IsNotEmpty()
  @IsString()
  id: string;

  @ApiProperty({
    example: "This task needs more clarification on the requirements",
    description: "Comment content",
  })
  @IsNotEmpty()
  @IsString()
  content: string;

  @ApiProperty({
    type: UserDto,
    description: "User who created this comment",
  })
  @IsNotEmpty()
  @ValidateNested()
  @Expose()
  @Type(() => UserDto)
  createdBy: UserDto;

  @ApiPropertyOptional({
    example: "550e8400-e29b-41d4-a716-446655440000",
    description: "ID of the parent comment if this is a reply",
  })
  @IsOptional()
  @IsUUID()
  parentCommentId?: string;

  @ApiPropertyOptional({
    example: "2024-01-15T09:00:00.000Z",
    description: "Comment creation date",
  })
  @IsOptional()
  createdAt?: Date;

  @ApiPropertyOptional({
    example: "2024-01-15T09:00:00.000Z",
    description: "Comment last update date",
  })
  @IsOptional()
  updatedAt?: Date;
}

