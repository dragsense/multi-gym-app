import {
  IsString,
  IsNotEmpty,
  IsOptional,
  IsEnum,
  ValidateNested,
} from "class-validator";
import { ApiProperty, ApiPropertyOptional } from "@nestjs/swagger";
import { PartialType } from "../../lib/dto-type-adapter";
import { Type, Expose } from "class-transformer";
import { FieldType, FieldOptions } from "../../decorators/field.decorator";
import { UserDto } from "../user-dtos";
import { EIssueReportStatus, EIssueReportSeverity } from "../../enums/task.enum";

export class CreateTaskIssueReportDto {
  @ApiProperty({
    example: "Button not responding on click",
    description: "Issue title",
  })
  @IsNotEmpty()
  @IsString()
  @FieldType("text", true)
  title: string;

  @ApiProperty({
    example: "The submit button does not respond when clicked",
    description: "Issue description",
  })
  @IsNotEmpty()
  @IsString()
  @FieldType("textarea", true)
  description: string;

  @ApiPropertyOptional({
    enum: EIssueReportStatus,
    example: EIssueReportStatus.OPEN,
    description: "Status of the issue report",
  })
  @IsOptional()
  @IsEnum(EIssueReportStatus)
  @FieldType("select", false)
  @FieldOptions([
    { value: EIssueReportStatus.OPEN, label: "Open" },
    { value: EIssueReportStatus.IN_PROGRESS, label: "In Progress" },
    { value: EIssueReportStatus.RESOLVED, label: "Resolved" },
    { value: EIssueReportStatus.CLOSED, label: "Closed" },
    { value: EIssueReportStatus.DUPLICATE, label: "Duplicate" },
  ])
  status?: EIssueReportStatus;

  @ApiPropertyOptional({
    enum: EIssueReportSeverity,
    example: EIssueReportSeverity.MEDIUM,
    description: "Severity of the issue",
  })
  @IsOptional()
  @IsEnum(EIssueReportSeverity)
  @FieldType("select", false)
  @FieldOptions([
    { value: EIssueReportSeverity.LOW, label: "Low" },
    { value: EIssueReportSeverity.MEDIUM, label: "Medium" },
    { value: EIssueReportSeverity.HIGH, label: "High" },
    { value: EIssueReportSeverity.CRITICAL, label: "Critical" },
  ])
  severity?: EIssueReportSeverity;
}

export class UpdateTaskIssueReportDto extends PartialType(CreateTaskIssueReportDto) {}

export class TaskIssueReportDto {
  @ApiProperty()
  @IsNotEmpty()
  @IsString()
  id: string;

  @ApiProperty()
  @IsNotEmpty()
  @IsString()
  title: string;

  @ApiProperty()
  @IsNotEmpty()
  @IsString()
  description: string;

  @ApiProperty({ enum: EIssueReportStatus })
  @IsEnum(EIssueReportStatus)
  status: EIssueReportStatus;

  @ApiProperty({ enum: EIssueReportSeverity })
  @IsEnum(EIssueReportSeverity)
  severity: EIssueReportSeverity;

  @ApiPropertyOptional({ type: UserDto })
  @IsOptional()
  @ValidateNested()
  @Expose()
  @Type(() => UserDto)
  reportedBy?: UserDto;

  @ApiPropertyOptional()
  @IsOptional()
  resolvedAt?: string;

  @IsOptional()
  createdAt?: Date;

  @IsOptional()
  updatedAt?: Date;
}

