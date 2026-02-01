import {
  IsString,
  IsNumber,
  IsOptional,
  IsBoolean,
  Min,
  Max,
  ValidateNested,
} from "class-validator";
import { ApiProperty } from "@nestjs/swagger";
import { Type } from "class-transformer";
import { FieldType, FieldOptions } from "../../decorators/field.decorator";

export class MembershipSettingsDto {

  @ApiProperty({
    example: true,
    description: "Auto-renew membership",
  })
  @IsOptional()
  @IsBoolean()
  @FieldType("switch", false)
  autoRenew?: boolean;


  @ApiProperty({
    example: true,
    description: "Allow guest access",
  })
  @IsOptional()
  @IsBoolean()
  @FieldType("switch", false)
  allowGuestAccess?: boolean;

  @ApiProperty({
    example: 2,
    description: "Maximum guest visits per month",
  })
  @IsOptional()
  @IsNumber()
  @Min(0)
  @Max(30)
  @FieldType("number", false)
  @Type(() => Number)
  maxGuestVisitsPerMonth?: number;

  @ApiProperty({
    example: 10,
    description: "Member limits (number of members allowed)",
  })
  @IsOptional()
  @IsNumber()
  @Min(0)
  @FieldType("number", false)
  @Type(() => Number)
  memberLimits?: number;

  @ApiProperty({
    example: 18,
    description: "Minimum age requirement",
  })
  @IsOptional()
  @IsNumber()
  @Min(0)
  @FieldType("number", false)
  @Type(() => Number)
  minAge?: number;

  @ApiProperty({
    example: 65,
    description: "Maximum age requirement",
  })
  @IsOptional()
  @IsNumber()
  @Min(0)
  @FieldType("number", false)
  @Type(() => Number)
  maxAge?: number;
}

