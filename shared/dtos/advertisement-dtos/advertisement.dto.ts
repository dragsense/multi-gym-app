import {
  IsString,
  IsNotEmpty,
  IsOptional,
  IsDateString,
  IsEnum,
  IsUUID,
  ValidateNested,
  ValidateIf,
  IsObject,
} from "class-validator";
import { ApiProperty, ApiPropertyOptional } from "@nestjs/swagger";
import { PartialType } from "../../lib/dto-type-adapter";
import { Type, Expose } from "class-transformer";
import { PaginationMetaDto } from "../common/pagination.dto";
import { ListQueryDto } from "../common/list-query.dto";
import { FieldType, FieldOptions } from "../../decorators/field.decorator";
import { EAdvertisementStatus } from "../../enums/advertisement.enum";
import { BannerImageDto } from "./banner-image.dto";

export class CreateAdvertisementDto {
  @ApiProperty({
    example: "Summer Sale 2024",
    description: "Advertisement title",
  })
  @IsNotEmpty()
  @IsString()
  @FieldType("text", true)
  title: string;

  @ApiPropertyOptional({
    enum: EAdvertisementStatus,
    example: EAdvertisementStatus.ACTIVE,
    description: "Advertisement status",
  })
  @IsNotEmpty()
  @IsEnum(EAdvertisementStatus)
  @FieldType("select", true)
  @FieldOptions([
    { value: EAdvertisementStatus.DRAFT, label: "Draft" },
    { value: EAdvertisementStatus.ACTIVE, label: "Active" },
    { value: EAdvertisementStatus.INACTIVE, label: "Inactive" },
    { value: EAdvertisementStatus.EXPIRED, label: "Expired" },
  ])
  status: EAdvertisementStatus;

  @ApiProperty({
    example: "2024-01-01T00:00:00.000Z",
    description: "Start date of the advertisement",
  })
  @IsNotEmpty()
  @IsDateString()
  @FieldType("datetime", true)
  startDate: string | Date;

  @ApiProperty({
    example: "2024-12-31T23:59:59.000Z",
    description: "End date of the advertisement",
  })
  @IsNotEmpty()
  @IsDateString()
  @FieldType("datetime", true)
  endDate: string | Date;

  @ApiPropertyOptional({
    example: "https://example.com/promotion",
    description: "Website link for the advertisement",
  })
  @IsOptional()
  @IsString()
  @FieldType("text", false)
  websiteLink?: string;

  @ApiPropertyOptional({
    type: BannerImageDto,
    description: "Banner image for the advertisement",
  })
  @IsNotEmpty()
  @IsObject({ message: "Banner image is required" })
  @ValidateNested()
  @Expose()
  @Type(() => BannerImageDto)
  @FieldType("nested", true, BannerImageDto)
  bannerImage: BannerImageDto;
}

export class UpdateAdvertisementDto extends PartialType(CreateAdvertisementDto) {}

export * from "./advertisement-status.dto";

export class AdvertisementPaginationDto extends PaginationMetaDto {
  @ApiProperty({ type: () => [AdvertisementDto] })
  @Expose()
  @Type(() => AdvertisementDto)
  data: AdvertisementDto[];
}

export class AdvertisementListDto extends ListQueryDto {
  @ApiPropertyOptional({ example: "Summer Sale" })
  @IsOptional()
  @IsString()
  title?: string;

  @ApiPropertyOptional({ enum: EAdvertisementStatus })
  @IsOptional()
  @IsEnum(EAdvertisementStatus)
  @FieldType("select")
  @FieldOptions([
    { value: EAdvertisementStatus.DRAFT, label: "Draft" },
    { value: EAdvertisementStatus.ACTIVE, label: "Active" },
    { value: EAdvertisementStatus.INACTIVE, label: "Inactive" },
    { value: EAdvertisementStatus.EXPIRED, label: "Expired" },
  ])
  status?: EAdvertisementStatus;
}

export class AdvertisementDto {
  @ApiProperty({ example: "550e8400-e29b-41d4-a716-446655440000" })
  id: string;

  @ApiProperty({ example: "Summer Sale 2024" })
  title: string;

  @ApiProperty({ enum: EAdvertisementStatus, example: EAdvertisementStatus.ACTIVE })
  status: EAdvertisementStatus;

  @ApiProperty({ example: "2024-01-01T00:00:00.000Z" })
  startDate: string;

  @ApiProperty({ example: "2024-12-31T23:59:59.000Z" })
  endDate: string;

  @ApiPropertyOptional({ example: "https://example.com/promotion" })
  websiteLink?: string;

  @ApiPropertyOptional({ type: BannerImageDto })
  bannerImage?: BannerImageDto;

  createdAt: string;
  updatedAt: string;
}

