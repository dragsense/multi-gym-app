import {
  IsString,
  IsNotEmpty,
  IsNumber,
  IsOptional,
  IsBoolean,
  IsDateString,
  ValidateNested,
  Min,
  IsEnum,
  ValidateIf,
  IsUUID,
  IsArray,
  ArrayMinSize,
} from "class-validator";
import { ApiProperty, ApiPropertyOptional } from "@nestjs/swagger";
import { OmitType, PartialType } from "../../lib/dto-type-adapter";
import { Type } from "class-transformer";
import { PaginationMetaDto } from "../common/pagination.dto";
import { ListQueryDto } from "../common/list-query.dto";
import { FieldType, FieldOptions } from "../../decorators/field.decorator";
import { EBillingStatus, EBillingType } from "../../enums/billing.enum";
import { IBilling } from "../../interfaces/billing.interface";
import { UserDto } from "../user-dtos/user.dto";

import { ReminderDto } from "../reminder-dtos";
import { EScheduleFrequency } from "../../enums/schedule.enum";
import {
  CreateBillingLineItemDto,
  BillingLineItemDto,
} from "./billing-line-item.dto";
import { Equals } from "../../decorators/crud.dto.decorators";

export class CreateBillingDto {
  @ApiProperty({
    example: "Session Payment - Morning Workout",
    description: "Billing title",
  })
  @IsString()
  @IsNotEmpty()
  @FieldType("text", true)
  title: string;

  @ApiProperty({
    example: "Payment for personal training session",
    description: "Billing description",
  })
  @IsString()
  @IsOptional()
  @FieldType("textarea", false)
  description?: string;

  @ApiProperty({
    example: "2024-01-10T09:00:00.000Z",
    description: "Billing issue date",
  })
  @IsDateString()
  @IsNotEmpty()
  @FieldType("datetime", true)
  issueDate: string;

  @ApiProperty({
    example: "2024-01-15T09:00:00.000Z",
    description: "Billing due date",
  })
  @IsDateString()
  @IsNotEmpty()
  @FieldType("datetime", true)
  dueDate: string;

  @ApiProperty({ type: () => UserDto })
  @IsNotEmpty({ message: "Recipient user is required" })
  @ValidateNested()
  @Type(() => UserDto)
  @FieldType("nested", true, UserDto)
  recipientUser: UserDto;

  @ApiProperty({
    example: "SESSION",
    description: "Billing type",
    enum: EBillingType,
  })
  @IsEnum(EBillingType)
  @IsNotEmpty()
  @FieldType("select", true)
  @FieldOptions(
    Object.values(EBillingType).map((v) => ({
      value: v,
      label: v.charAt(0) + v.slice(1).toLowerCase(),
    }))
  )
  type: EBillingType;

  @ApiPropertyOptional({
    example: "Payment notes and instructions",
    description: "Billing notes",
  })
  @IsOptional()
  @IsString()
  @FieldType("textarea")
  notes?: string;

  @ApiPropertyOptional({ type: ReminderDto })
  @IsOptional()
  @ValidateNested()
  @Type(() => ReminderDto)
  @FieldType("nested", false, ReminderDto)
  @ValidateIf((o) => o.enableReminder === true)
  reminderConfig?: ReminderDto;

  @ApiPropertyOptional({
    example: true,
    description: "Whether reminders are enabled for this billing",
  })
  @IsOptional()
  @IsBoolean()
  @FieldType("switch")
  enableReminder?: boolean;

  @ApiPropertyOptional({
    type: [CreateBillingLineItemDto],
    description: "Billing line items",
  })
  @IsNotEmpty({ message: "Line items are required" })
  @IsArray()
  @ArrayMinSize(1, { message: "Line items are required" })
  @ValidateNested({ each: true })
  @Type(() => CreateBillingLineItemDto)
  @FieldType("nestedArray", true, CreateBillingLineItemDto)
  lineItems: CreateBillingLineItemDto[];

  @ApiPropertyOptional({
    example: false,
    description:
      "Whether billing can be marked as paid manually (cash payment)",
  })
  @IsOptional()
  @IsBoolean()
  @FieldType("switch")
  isCashable?: boolean;
}

export class UpdateBillingDto extends PartialType(
  OmitType(CreateBillingDto, ["notes"])
) {}

export class BillingListDto extends ListQueryDto<IBilling> {

  @ApiPropertyOptional({
    description: 'Filter by linked member ID',
    example: '550e8400-e29b-41d4-a716-446655440001',
  })
  @IsOptional()
  @IsUUID()
  @Equals()
  @FieldType('text', false)
  linkedMemberId?: string;

}

export class BillingDto {
  @ApiProperty({
    example: "550e8400-e29b-41d4-a716-446655440000",
    description: "Billing ID",
  })
  @IsNotEmpty()
  @IsString()
  @FieldType("text", true)
  id: string;

  @ApiProperty({
    example: "Session Payment - Morning Workout",
    description: "Billing title",
  })
  @IsOptional()
  @IsString()
  title: string;

  @ApiProperty({
    example: "Payment for personal training session",
    description: "Billing description",
  })
  @IsOptional()
  @IsString()
  description: string;

  @ApiProperty({
    example: "2024-01-10T09:00:00.000Z",
    description: "Billing issue date",
  })
  @IsOptional()
  issueDate: string;

  @ApiProperty({
    example: "2024-01-15T09:00:00.000Z",
    description: "Billing due date",
  })
  @IsOptional()
  dueDate: string;

  @ApiProperty({ example: "PENDING", description: "Billing status" })
  @IsOptional()
  status: EBillingStatus;

  @ApiProperty({ example: "SESSION", description: "Billing type" })
  @IsOptional()
  type: EBillingType;

  @ApiPropertyOptional({
    example: EScheduleFrequency.MONTHLY,
    description: "Billing recurrence",
  })
  @IsOptional()
  recurrence?: EScheduleFrequency;

  @ApiPropertyOptional({
    example: "Payment notes and instructions",
    description: "Billing notes",
  })
  @IsOptional()
  @IsString()
  notes?: string;

  @ApiProperty({ type: () => UserDto })
  @ValidateNested()
  @Type(() => UserDto)
  recipientUser: UserDto;

  @ApiProperty({ example: 1, description: "Number of clients" })
  @IsOptional()
  @IsNumber()
  @Type(() => Number)
  @FieldType("number", true)
  @Min(0)
  clientsCount?: number;

  @ApiPropertyOptional({
    example: true,
    description: "Whether reminders are enabled for this billing",
  })
  @IsOptional()
  @IsBoolean()
  enableReminders?: boolean;

  @ApiPropertyOptional({ type: ReminderDto })
  @IsOptional()
  @ValidateNested()
  @Type(() => ReminderDto)
  @FieldType("nested", false, ReminderDto)
  @ValidateIf((o) => o.enableReminder === true)
  reminderConfig?: ReminderDto;

  @ApiPropertyOptional({
    type: [BillingLineItemDto],
    description: "Billing line items",
  })
  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => BillingLineItemDto)
  lineItems?: BillingLineItemDto[];

  @ApiPropertyOptional({
    example: 100,
    description: "Total amount of the billing",
  })
  @IsOptional()
  @IsNumber()
  @Type(() => Number)
  @FieldType("number", false)
  @Min(0)
  totalAmount?: number;

  @ApiPropertyOptional({
    example: false,
    description:
      "Whether billing can be marked as paid manually (cash payment)",
  })
  @IsOptional()
  @IsBoolean()
  isCashable?: boolean;

  @ApiPropertyOptional({
    example: "INV-20241218-A3B7C",
    description: "Billing invoice reference",
  })
  @IsOptional()
  @IsString()
  invoiceRef?: string;

  @IsOptional()
  createdAt?: Date;

  @IsOptional()
  updatedAt?: Date;
}

export class BillingPaginatedDto {
  @ApiProperty({ type: [BillingDto] })
  data: BillingDto[];

  @ApiProperty({ type: PaginationMetaDto })
  meta: PaginationMetaDto;
}

export class BillingPaymentIntentDto {
  @ApiProperty({ description: "Billing ID" })
  @IsUUID()
  @IsNotEmpty()
  billingId: string;

  @ApiProperty({
    description: "Stripe payment method ID (from frontend)",
    example: "pm_123",
  })
  @IsString()
  @IsNotEmpty()
  paymentMethodId: string;

  @ApiPropertyOptional({
    description: "Save the card for future use",
    default: false,
  })
  @IsOptional()
  @IsBoolean()
  saveForFutureUse?: boolean = false;

  @ApiPropertyOptional({
    description: "Set the card as default for invoices",
    default: false,
  })
  @IsOptional()
  @IsBoolean()
  setAsDefault?: boolean = false;
}

export class UpdateBillingNotesDto {
  @ApiPropertyOptional({
    example: "Payment reminder sent",
    description: "Billing notes",
  })
  @IsOptional()
  @IsString()
  @FieldType("textarea")
  notes?: string;
}

export class UpdateBillingStatusDto {
  @ApiProperty({
    example: EBillingStatus.PAID,
    description: "New billing status",
    enum: EBillingStatus,
  })
  @IsNotEmpty()
  @IsEnum(EBillingStatus)
  status: EBillingStatus;

  @ApiPropertyOptional({
    example: "Paid via cash",
    description: "Optional message for the status change",
  })
  @IsOptional()
  @IsString()
  message?: string;
}
