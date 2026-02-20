import {
  IsString,
  IsNotEmpty,
  IsOptional,
  IsEnum,
  IsNumber,
  Min,
  ValidateNested,
  IsUUID,
} from "class-validator";
import { ApiProperty, ApiPropertyOptional } from "@nestjs/swagger";
import { PartialType } from "../../lib/dto-type-adapter";
import { Type, Expose } from "class-transformer";
import { PaginationMetaDto } from "../common/pagination.dto";
import { ListQueryDto } from "../common/list-query.dto";
import { FieldType, FieldOptions } from "../../decorators/field.decorator";
import { EServiceOfferStatus } from "../../enums/service-offer.enum";
import { StaffDto } from "../staff-dtos";
import { TrainerServiceDto } from "../trainer-service-dtos";

export class CreateServiceOfferDto {
  @ApiProperty({
    example: "Summer Special",
    description: "Service offer name",
  })
  @IsNotEmpty()
  @IsString()
  @FieldType("text", true)
  name: string;

  @ApiProperty({
    example: 100,
    description: "Offer price",
  })
  @IsNotEmpty()
  @IsNumber()
  @Min(0)
  @FieldType("number", true)
  @Expose()
  @Type(() => Number)
  offerPrice: number;

  @ApiProperty({
    example: 10,
    description: "Discount percentage",
  })
  @IsOptional()
  @IsNumber()
  @Min(0)
  @FieldType("number", false)
  @Expose()
  @Type(() => Number)
  discount?: number;

  @ApiPropertyOptional({
    enum: EServiceOfferStatus,
    example: EServiceOfferStatus.ACTIVE,
    description: "Service offer status",
  })
  @IsOptional()
  @IsEnum(EServiceOfferStatus)
  @FieldType("select", false)
  @FieldOptions([
    { value: EServiceOfferStatus.ACTIVE, label: "Active" },
    { value: EServiceOfferStatus.INACTIVE, label: "Inactive" },
  ])
  status?: EServiceOfferStatus;

  @ApiProperty({ type: StaffDto })
  @ValidateNested()
  @Expose()
  @Type(() => StaffDto)
  @FieldType("nested", true, StaffDto)
  @IsOptional()
  trainer?: StaffDto;

  @ApiProperty({ type: TrainerServiceDto, description: "Associated trainer service" })
  @ValidateNested()
  @Expose()
  @Type(() => TrainerServiceDto)
  @FieldType("nested", true, TrainerServiceDto)
  @IsNotEmpty()
  trainerService: TrainerServiceDto;
}

export class UpdateServiceOfferDto extends PartialType(CreateServiceOfferDto) {}

export * from "./service-offer-status.dto";

export class ServiceOfferPaginationDto extends PaginationMetaDto {
  @ApiProperty({ type: () => [ServiceOfferDto] })
  @Expose()
  @Type(() => ServiceOfferDto)
  data: ServiceOfferDto[];
}

export class ServiceOfferListDto extends ListQueryDto {
  @ApiPropertyOptional({ example: "Summer Special" })
  @IsOptional()
  @IsString()
  name?: string;

  @ApiPropertyOptional({ enum: EServiceOfferStatus })
  @IsOptional()
  @IsEnum(EServiceOfferStatus)
  @FieldType("select", false)
  @FieldOptions([
    { value: EServiceOfferStatus.ACTIVE, label: "Active" },
    { value: EServiceOfferStatus.INACTIVE, label: "Inactive" },
  ])
  status?: EServiceOfferStatus;
}

export class ServiceOfferDto {
  @ApiProperty({ example: "550e8400-e29b-41d4-a716-446655440000" })
  @IsUUID()
  id: string;

  @ApiProperty({ example: "Summer Special" })
  @IsOptional()
  name?: string;

  @ApiProperty({ example: 100 })
  @IsOptional()
  offerPrice?: number;

  @ApiProperty({ example: 10 })
  @IsOptional()
  discount?: number;

  @ApiProperty({ enum: EServiceOfferStatus, example: EServiceOfferStatus.ACTIVE })
  @IsOptional()
  status?: EServiceOfferStatus;

  @ApiProperty({ type: StaffDto })
  @IsOptional()
  @ValidateNested()
  @Expose()
  @Type(() => StaffDto)
  trainer?: StaffDto;

  @ApiProperty({ type: TrainerServiceDto })
  @IsOptional()
  @ValidateNested()
  @Expose()
  @Type(() => TrainerServiceDto)
  @IsOptional()
  trainerService?: TrainerServiceDto;

  @IsOptional()
  createdAt?: string;

  @IsOptional()
  updatedAt?: string;
}

