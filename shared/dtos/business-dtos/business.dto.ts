import {
    IsString,
    IsOptional,
    IsEnum,
    IsBoolean,
    IsNotEmpty,
    IsUUID,
    IsNotIn,
    Matches,
    ValidateNested,
} from "class-validator";
import { ApiProperty, ApiPropertyOptional } from "@nestjs/swagger";
import { PartialType } from "../../lib/dto-type-adapter";
import { PaginationMetaDto } from "../common/pagination.dto";
import { ListQueryDto } from "../common/list-query.dto";
import { FieldType } from "../../decorators/field.decorator";
import { UserDto, CreateUserDto, UpdateUserDto } from "../user-dtos/user.dto";
import { Type, Expose } from "class-transformer";
import { OmitType } from "../../lib/dto-type-adapter";


export class CreateBusinessDto {
    @ApiProperty({
        example: "Business Name",
        description: "Business Name",
    })
    @IsNotEmpty({ message: "Business name is required" })
    @IsString({ message: "Business name must be a valid text" })
    @FieldType("text", true)
    name: string;

    @ApiProperty({
        example: "mygym",
        description: "Subdomain",
    })
    @IsNotEmpty({ message: "Subdomain is required" })
    @IsString({ message: "Subdomain must be a valid text" })
    @IsNotIn(["dev", "staging", "testing"], {
        message: "Subdomain cannot be a reserved name (dev, staging, testing).",
    })
    @Matches(/^[a-z0-9]([a-z0-9-]*[a-z0-9])?$/, {
        message: "Subdomain can only contain lowercase letters, numbers, and hyphens. It cannot start or end with a hyphen, and cannot contain dots or special characters.",
    })
    @FieldType("text", true)
    subdomain: string;

    @ApiPropertyOptional({
        example: "550e8400-e29b-41d4-a716-446655440002",
        description: "Payment processor ID (Stripe, Paysafe, etc.)",
    })
    @IsOptional()
    @IsUUID()
    @FieldType("custom", false)
    paymentProcessorId?: string | null;
}

export class CreateBusinessWithUserDto {
    @ApiProperty({
        example: "Business Name",
        description: "Business Name",
    })
    @IsNotEmpty({ message: "Business name is required" })
    @IsString({ message: "Business name must be a valid text" })
    @FieldType("text", true)
    name: string;

    @ApiProperty({
        example: "mygym",
        description: "Subdomain",
    })
    @IsNotEmpty({ message: "Subdomain is required" })
    @IsString({ message: "Subdomain must be a valid text" })
    @IsNotIn(["dev", "staging", "testing"], {
        message: "Subdomain cannot be a reserved name (dev, staging, testing).",
    })
    @Matches(/^[a-z0-9]([a-z0-9-]*[a-z0-9])?$/, {
        message: "Subdomain can only contain lowercase letters, numbers, and hyphens. It cannot start or end with a hyphen, and cannot contain dots or special characters.",
    })
    @FieldType("text", true)
    subdomain: string;

    @ApiProperty({ type: CreateUserDto, description: "User details for business owner" })
    @ValidateNested({ message: "User details for business owner are required" })
    @Expose()
    @Type(() => CreateUserDto)
    @FieldType("nested", true, CreateUserDto)
    user: CreateUserDto;
}

export class UpdateBusinessDto extends PartialType(CreateBusinessDto) {}

export class UpdateBusinessWithUserDto extends PartialType(
    OmitType(CreateBusinessWithUserDto, ["user"])
) {
    @ApiProperty({ type: UpdateUserDto, description: "User details for business owner" })
    @ValidateNested()
    @Expose()
    @Type(() => UpdateUserDto)
    @FieldType("nested", false, UpdateUserDto)
    @IsOptional()
    user?: UpdateUserDto;
}

export class BusinessDto {
    @ApiProperty({
        example: "92b0e566-d7ad-4b2c-914d-95a823d072bb",
        description: "Business ID",
    })
    @IsNotEmpty()
    @IsString()
    @FieldType("text", true)
    id: string;

    @ApiProperty({
        example: "Business Name",
        description: "Business Name",
    })
    @IsNotEmpty()
    @IsString()
    @FieldType("text", true)
    name: string;

    @ApiProperty({
        example: "mygym",
        description: "Subdomain for the business",
    })
    @IsOptional()
    @IsString()
    @FieldType("text", false)
    subdomain?: string;

    @ApiProperty({
        example: "550e8400-e29b-41d4-a716-446655440000",
        description: "Tenant ID for the business",
    })
    @IsOptional()
    @IsUUID()
    @FieldType("text", false)
    tenantId?: string;

    @ApiProperty({
        type: () => UserDto,
        description: "Owner of the business",
    })
    @IsOptional()
    @Expose()
    @Type(() => UserDto)
    user?: UserDto;

    @ApiPropertyOptional({
        example: "acct_123456",
        description: "Stripe Connect account ID",
    })
    @IsOptional()
    @IsString()
    stripeConnectAccountId?: string | null;

    @ApiPropertyOptional({
        example: "550e8400-e29b-41d4-a716-446655440002",
        description: "Payment processor ID (Stripe, Paysafe, etc.)",
    })
    @IsOptional()
    @IsUUID()
    paymentProcessorId?: string | null;

    @IsOptional()
    createdAt?: Date;

    @IsOptional()
    updatedAt?: Date;

}

export class BusinessListDto extends ListQueryDto<BusinessDto> {

}

export class BusinessPaginatedDto extends PaginationMetaDto {
    @ApiProperty({ type: [BusinessDto] })
    data: BusinessDto[];
}
