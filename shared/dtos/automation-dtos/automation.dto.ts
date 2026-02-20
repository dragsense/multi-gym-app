import {
    IsString,
    IsNotEmpty,
    IsOptional,
    IsBoolean,
    IsEnum,
    IsUUID,
    IsObject,
    ValidateNested,
} from "class-validator";
import { ApiProperty, ApiPropertyOptional } from "@nestjs/swagger";
import { PartialType } from "../../lib/dto-type-adapter";
import { Type, Expose } from "class-transformer";
import { PaginationMetaDto } from "../common/pagination.dto";
import { ListQueryDto } from "../common/list-query.dto";
import { FieldType, FieldOptions } from "../../decorators/field.decorator";
import { Equals } from "../../decorators/crud.dto.decorators";
import { EAutomationTrigger, EAutomationFormat, EAutomationStatus } from "../../enums/automation.enum";
import { EmailTemplateDto } from "../cms-dtos/email-template.dto";

/**
 * Reference DTO for email template - only requires id for linking
 */
export class EmailTemplateRefDto {
    @ApiProperty({
        example: "550e8400-e29b-41d4-a716-446655440000",
        description: "Email template ID",
    })
    @IsNotEmpty({ message: "Email template ID is required" })
    @IsUUID("4", { message: "Invalid email template ID" })
    id: string;

    @ApiPropertyOptional()
    @IsOptional()
    @IsString()
    name?: string;

    @ApiPropertyOptional()
    @IsOptional()
    @IsString()
    identifier?: string;

    @ApiPropertyOptional()
    @IsOptional()
    @IsString()
    subject?: string;
}

export class CreateAutomationDto {
    @ApiProperty({
        example: "Members Onboarding",
        description: "Automation name",
    })
    @IsNotEmpty({ message: "Automation name is required" })
    @IsString()
    @FieldType("text", true)
    name: string;

    @ApiProperty({
        description: "Email template to use for this automation",
    })
    @IsNotEmpty({ message: "Email template is required" })
    @IsObject({ message: "Email template must be an object with id" })
    @FieldType("custom", true)
    emailTemplate: EmailTemplateRefDto;

    @ApiProperty({
        enum: EAutomationTrigger,
        example: EAutomationTrigger.ONBOARD,
        description: "Trigger event for this automation",
    })
    @IsNotEmpty({ message: "Trigger is required" })
    @IsEnum(EAutomationTrigger, { message: "Invalid automation trigger" })
    @FieldType("select", true)
    @FieldOptions([
        { value: EAutomationTrigger.ONBOARD, label: "Onboard" },
        { value: EAutomationTrigger.BILLING, label: "Billing" },
        { value: EAutomationTrigger.CHECKIN, label: "Check-in" },
        { value: EAutomationTrigger.CHECKOUT, label: "Check-out" },
        { value: EAutomationTrigger.MEMBERSHIP_RENEWAL, label: "Membership Renewal" },
    ])
    trigger: EAutomationTrigger;

    @ApiProperty({
        enum: EAutomationFormat,
        example: EAutomationFormat.EMAIL,
        description: "Format of the automation",
    })
    @IsNotEmpty({ message: "Format is required" })
    @IsEnum(EAutomationFormat, { message: "Invalid automation format" })
    @FieldType("select", true)
    @FieldOptions([
        { value: EAutomationFormat.EMAIL, label: "Email" },
    ])
    format: EAutomationFormat;

    @ApiProperty({
        enum: EAutomationStatus,
        example: EAutomationStatus.ACTIVE,
        description: "Status of the automation",
    })
    @IsOptional()
    @IsEnum(EAutomationStatus, { message: "Invalid automation status" })
    @FieldType("select", false)
    @FieldOptions([
        { value: EAutomationStatus.ACTIVE, label: "Active" },
        { value: EAutomationStatus.INACTIVE, label: "Inactive" },
    ])
    status?: EAutomationStatus;

    @ApiPropertyOptional({
        example: true,
        description: "Whether the automation is active",
    })
    @IsOptional()
    @IsBoolean()
    @FieldType("checkbox", false)
    isActive?: boolean;
}

export class UpdateAutomationDto extends PartialType(CreateAutomationDto) { }

export class AutomationListDto extends ListQueryDto {
    @ApiPropertyOptional({
        description: "Filter by trigger type",
    })
    @IsOptional()
    @IsEnum(EAutomationTrigger)
    @Equals()
    trigger?: EAutomationTrigger;

    @ApiPropertyOptional({
        description: "Filter by status",
    })
    @IsOptional()
    @IsEnum(EAutomationStatus)
    @Equals()
    status?: EAutomationStatus;

    @ApiPropertyOptional({
        description: "Filter by format",
    })
    @IsOptional()
    @IsEnum(EAutomationFormat)
    @Equals()
    format?: EAutomationFormat;

    @ApiPropertyOptional({
        description: "Filter by active status",
    })
    @IsOptional()
    @IsBoolean()
    @Equals()
    isActive?: boolean;
}

export class AutomationPaginatedDto extends PaginationMetaDto {
    @ApiProperty({ type: () => [AutomationDto] })
    @Expose()
    @Type(() => AutomationDto)
    data: AutomationDto[];
}

export class AutomationDto {
    @ApiProperty({
        example: "550e8400-e29b-41d4-a716-446655440000",
        description: "Automation ID",
    })
    @IsNotEmpty()
    @IsString()
    id: string;

    @ApiProperty({
        example: "Members Onboarding",
        description: "Automation name",
    })
    @IsOptional()
    @IsString()
    name?: string;

    @ApiProperty({
        description: "Email template for this automation",
    })
    @IsOptional()
    @ValidateNested()
    @Expose()
    @Type(() => EmailTemplateDto)
    emailTemplate?: EmailTemplateDto;

    @ApiProperty({
        enum: EAutomationTrigger,
        example: EAutomationTrigger.ONBOARD,
        description: "Trigger event",
    })
    @IsOptional()
    @IsEnum(EAutomationTrigger)
    trigger?: EAutomationTrigger;

    @ApiProperty({
        enum: EAutomationFormat,
        example: EAutomationFormat.EMAIL,
        description: "Automation format",
    })
    @IsOptional()
    @IsEnum(EAutomationFormat)
    format?: EAutomationFormat;

    @ApiProperty({
        enum: EAutomationStatus,
        example: EAutomationStatus.ACTIVE,
        description: "Automation status",
    })
    @IsOptional()
    @IsEnum(EAutomationStatus)
    status?: EAutomationStatus;

    @ApiProperty({
        example: true,
        description: "Whether the automation is active",
    })
    @IsOptional()
    @IsBoolean()
    isActive?: boolean;

    @IsOptional()
    createdAt?: Date;

    @IsOptional()
    updatedAt?: Date;
}
