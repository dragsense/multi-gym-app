import {
  IsString,
  IsNotEmpty,
  IsOptional,
  IsEnum,
  IsNumber,
  IsObject,
  IsDateString,
  Min,
  ValidateNested,
} from "class-validator";
import { ApiProperty, ApiPropertyOptional } from "@nestjs/swagger";
import { Type } from "class-transformer";
import { PaginationMetaDto } from "../common/pagination.dto";
import { ListQueryDto } from "../common/list-query.dto";
import { FieldOptions, FieldType } from "../../decorators/field.decorator";
import { EActivityType, EActivityStatus } from "../../enums/activity-log.enum";

export class ActivityLogDto {
  @ApiProperty({
    example: "550e8400-e29b-41d4-a716-446655440000",
    description: "Activity log ID",
  })
  id: string;

  @ApiProperty({
    example: "User logged in successfully",
    description: "Activity description",
  })
  description: string;

  @ApiProperty({
    enum: EActivityType,
    example: EActivityType.LOGIN,
    description: "Type of activity performed",
  })
  type: EActivityType;

  @ApiProperty({
    enum: EActivityStatus,
    example: EActivityStatus.SUCCESS,
    description: "Status of the activity",
  })
  status: EActivityStatus;

  @ApiPropertyOptional({
    example: "192.168.1.1",
    description: "IP address of the user",
  })
  ipAddress?: string;

  @ApiPropertyOptional({
    example: "Mozilla/5.0...",
    description: "User agent string",
  })
  userAgent?: string;

  @ApiPropertyOptional({
    example: "/api/v1/users",
    description: "API endpoint accessed",
  })
  endpoint?: string;

  @ApiPropertyOptional({ example: "POST", description: "HTTP method used" })
  method?: string;

  @ApiPropertyOptional({ example: 200, description: "HTTP status code" })
  statusCode?: number;

  @ApiPropertyOptional({
    example: {
      duration: 150,
      responseSize: 1024,
      timestamp: "2024-01-01T00:00:00.000Z",
      bodyKeys: ["email", "profile.firstName", "profile.lastName"],
    },
    description: "Request metadata including duration, size, and body keys",
  })
  metadata?: {
    duration?: number;
    responseSize?: number;
    timestamp?: string;
    bodyKeys?: string[];
    [key: string]: any;
  };

  @ApiPropertyOptional({
    example: "Error message if failed",
    description: "Error message if activity failed",
  })
  errorMessage?: string;

  @ApiProperty({ description: "User who performed the activity" })
  user: {
    id: string;
    email: string;
    profile?: {
      firstName: string;
      lastName: string;
    };
  };

  @ApiProperty({
    example: "2024-01-01T00:00:00.000Z",
    description: "Creation timestamp",
  })
  createdAt: Date;

  @ApiProperty({
    example: "2024-01-01T00:00:00.000Z",
    description: "Last update timestamp",
  })
  updatedAt: Date;
}

export class ActivityLogPaginatedDto extends PaginationMetaDto {
  @ApiProperty({ type: () => [ActivityLogDto] })
  @Type(() => ActivityLogDto)
  data: ActivityLogDto[];
}

export class ActivityLogListDto extends ListQueryDto {
  @ApiPropertyOptional({
    enum: EActivityType,
    example: EActivityType.LOGIN,
    description: "Filter by activity type",
  })
  @IsOptional()
  @IsEnum(EActivityType)
  @FieldType("select", false)
  @FieldOptions(
    Object.values(EActivityType).map((v) => ({ value: v, label: v }))
  )
  type?: EActivityType;

  @ApiPropertyOptional({
    example: "2024-01-01",
    description: "Filter by start date",
  })
  @IsOptional()
  @IsDateString()
  @FieldType("date", false)
  startDate?: string;

  @ApiPropertyOptional({
    example: "2024-12-31",
    description: "Filter by end date",
  })
  @IsOptional()
  @IsDateString()
  @FieldType("date", false)
  endDate?: string;
}
