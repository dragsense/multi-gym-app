import {
  IsString,
  IsNotEmpty,
  IsOptional,
  IsBoolean,
} from "class-validator";
import { ApiProperty, ApiPropertyOptional } from "@nestjs/swagger";
import { OmitType, PartialType } from "../../lib/dto-type-adapter";
import { PaginationMetaDto } from "../common/pagination.dto";
import { ListQueryDto } from "../common/list-query.dto";
import { FieldType, FieldOptions } from "../../decorators/field.decorator";
import {
  Equals,
  TransformToBoolean,
} from "../../decorators/crud.dto.decorators";
import type { IFaq } from "../../interfaces/cms.interface";
import { Type, Expose } from "class-transformer";

export class CreateFaqDto {
  @ApiProperty({
    example: 'What is your return policy?',
    description: 'FAQ question',
  })
  @IsString()
  @IsNotEmpty()
  @FieldType("textarea", true)
  question: string;

  @ApiProperty({
    example: 'We offer a 30-day return policy on all products.',
    description: 'FAQ answer',
  })
  @IsString()
  @IsNotEmpty()
  @FieldType("quill", true)
  answer: string;

  @ApiPropertyOptional({
    example: true,
    description: 'Whether the FAQ is enabled',
  })
  @IsOptional()
  @IsBoolean()
  @FieldType("switch", false)
  enabled?: boolean;
}

export class UpdateFaqDto extends PartialType(
  OmitType(CreateFaqDto, [] as const)
) {}

export class FaqDto {
  @ApiProperty()
  id: string;

  @ApiProperty()
  question: string;

  @ApiProperty()
  answer: string;

  @ApiPropertyOptional()
  enabled?: boolean;

  @ApiProperty()
  createdAt: Date;

  @ApiProperty()
  updatedAt: Date;
}

export class FaqListDto extends ListQueryDto<IFaq> {
  @ApiPropertyOptional({
    example: true,
    description: 'Filter by enabled status',
  })
  @IsOptional()
  @IsBoolean()
  @Equals()
  @FieldType("select", false)
  @FieldOptions([
    { value: "true", label: "Enabled" },
    { value: "false", label: "Disabled" },
  ])
  @TransformToBoolean()
  enabled?: boolean;
}

export class FaqPaginatedDto extends PaginationMetaDto {
  @ApiProperty({ type: () => [FaqDto] })
  @Expose()
  @Type(() => FaqDto)
  data: FaqDto[];
}
