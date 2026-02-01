import {
  IsNotEmpty,
  IsEnum,
  IsArray,
} from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Transform } from 'class-transformer';
import { FieldType, FieldOptions } from '../../decorators/field.decorator';

import { EReminderType } from '../../enums/reminder.enum';
import { EReminderSendBefore } from '../../enums/reminder.enum';


export class ReminderDto {
  @ApiProperty({ example: [EReminderSendBefore.ONE_DAY], description: 'Reminder send before (minutes)', enum: EReminderSendBefore, isArray: true })
  @IsArray()
  @IsEnum(EReminderSendBefore, { each: true })
  @IsNotEmpty()
  @FieldType("multiSelect")
  @Transform(({ value }) => value?.map((v: string) => parseInt(v, 10)))
  @FieldOptions([
    { value: EReminderSendBefore.ONE_MINUTE.toString(), label: '1 Minutes' },
    { value: EReminderSendBefore.TEN_MINUTES.toString(), label: '10 Minutes' },
    { value: EReminderSendBefore.THIRTY_MINUTES.toString(), label: '30 Minutes' },
    { value: EReminderSendBefore.ONE_HOUR.toString(), label: '1 Hour' },
    { value: EReminderSendBefore.THREE_HOURS.toString(), label: '3 Hours' },
    { value: EReminderSendBefore.ONE_DAY.toString(), label: '1 Day' },
    { value: EReminderSendBefore.THREE_DAYS.toString(), label: '3 Days' }

  ])
  sendBefore: EReminderSendBefore[];
  
  @ApiPropertyOptional({ example: [EReminderType.EMAIL, EReminderType.SMS], description: 'Types of reminders to send', enum: EReminderType, isArray: true })
  @IsArray()
  @IsEnum(EReminderType, { each: true })
  @FieldType("multiSelect")
  @FieldOptions(Object.values(EReminderType).map(v => ({ value: v, label: v.charAt(0) + v.slice(1).toLowerCase() })))
  reminderTypes: EReminderType[] = [EReminderType.EMAIL];
}
