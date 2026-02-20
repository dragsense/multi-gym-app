import {
  IsString,
  IsNotEmpty,
  IsOptional,
  IsDateString,
  IsNumber,
  Min,
  ValidateNested,
} from "class-validator";
import { ApiProperty, ApiPropertyOptional } from "@nestjs/swagger";
import { PartialType } from "../../lib/dto-type-adapter";
import { Type, Expose } from "class-transformer";
import { FieldType } from "../../decorators/field.decorator";
import { UserDto } from "../user-dtos";

export class CreateTaskTimeLogDto {
  @ApiProperty({
    example: 120,
    description: "Time spent in minutes",
  })
  @IsNotEmpty()
  @IsNumber()
  @Min(1)
  @FieldType("number", true)
  @Expose()
  @Type(() => Number)
  duration: number;

  @ApiPropertyOptional({
    example: "Worked on API integration",
    description: "Description of work done",
  })
  @IsOptional()
  @IsString()
  @FieldType("textarea", false)
  description?: string;

  @ApiProperty({
    example: "2024-01-15T10:00:00.000Z",
    description: "Start time of the work session",
  })
  @IsNotEmpty()
  @IsDateString()
  @FieldType("datetime", true)
  startTime: string | Date;

}

export class UpdateTaskTimeLogDto extends PartialType(CreateTaskTimeLogDto) {}

export class TaskTimeLogDto {
  @ApiProperty()
  @IsNotEmpty()
  @IsString()
  id: string;

  @ApiProperty({ type: UserDto })
  @IsNotEmpty()
  @ValidateNested()
  @Expose()
  @Type(() => UserDto)
  user: UserDto;

  @ApiProperty()
  @IsNotEmpty()
  @IsNumber()
  duration: number;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  description?: string;

  @ApiProperty()
  @IsNotEmpty()
  @IsDateString()
  startTime: string;

  @IsOptional()
  createdAt?: Date;

  @IsOptional()
  updatedAt?: Date;
}

