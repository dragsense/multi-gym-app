import {
  IsString,
  IsNotEmpty,
  IsEmail,
  Length,
  IsOptional,
  MinLength,
  IsBoolean,
  ValidateNested,
  IsNumber,
  Min,
  IsDateString,
  IsArray,
  IsEnum,
  isNotEmpty,
  Validate,
  ValidatorConstraint,
  ValidatorConstraintInterface,
  ValidationArguments,
} from "class-validator";
import { ApiProperty, ApiPropertyOptional } from "@nestjs/swagger";
import { PartialType } from "../../lib/dto-type-adapter";
import { CreateProfileDto, ProfileDto, UpdateProfileDto } from "./profile.dto";
import { Type, Transform } from "class-transformer";
import { PaginationMetaDto } from "../common/pagination.dto";
import { ListQueryDto, SingleQueryDto } from "../common/list-query.dto";
import { IUser } from "../../interfaces/user.interface";
import { FieldOptions, FieldType } from "../../decorators/field.decorator";
import { OmitType } from "../../lib/dto-type-adapter";
import {
  Equals,
  TransformToBoolean,
} from "../../decorators/crud.dto.decorators";
import { EUserGender, EUserLevels } from "../../enums/user.enum";
import { PermissionDto, RoleDto } from "../role-dtos";

@ValidatorConstraint({ name: "notSuperAdminLevel", async: false })
class NotSuperAdminLevelConstraint implements ValidatorConstraintInterface {
  validate(level: number, args: ValidationArguments) {
    // Level 0 (SUPER_ADMIN) can only be assigned by the seeder
    return level !== EUserLevels.PLATFORM_OWNER;
  }

  defaultMessage(args: ValidationArguments) {
    return "Cannot create user with PLATFORM_OWNER level. This level is reserved for the seeded platform owner only.";
  }
}

export class CreateUserDto {
  @ApiProperty({ example: "email@example.com", description: "User email" })
  @IsString()
  @IsNotEmpty()
  @IsEmail()
  @FieldType("email", true)
  email: string;

  @ApiProperty({ example: "John" })
  @IsString()
  @IsNotEmpty()
  @FieldType("text", true)
  firstName: string;

  @ApiProperty({ example: "Doe" })
  @IsString()
  @IsNotEmpty()
  @FieldType("text", true)
  lastName: string;

  @ApiProperty({ example: "1990-01-01" })
  @IsOptional()
  @IsDateString()
  @FieldType("date")
  dateOfBirth?: string;

  @ApiProperty({ enum: EUserGender, example: EUserGender.MALE })
  @IsOptional()
  @IsEnum(EUserGender)
  @FieldType("select")
  @FieldOptions(
    [
      { value: EUserGender.MALE, label: "Male" },
      { value: EUserGender.FEMALE, label: "Female" },
      { value: EUserGender.OTHER, label: "Other" },
      { value: EUserGender.PREFER_NOT_TO_SAY, label: "Prefer not to say" },
    ].map((v) => ({
      value: v.value,
      label: v.label,
    }))
  )
  gender?: string;

  @ApiPropertyOptional({
    example: "securePass123",
    description:
      "User password (min 6 chars, must include letters and numbers)",
  })
  @IsString()
  @IsOptional()
  @Length(6, 100)
  @MinLength(6)
  password?: string;

  @ApiProperty({
    example: EUserLevels.SUPER_ADMIN,
    description:
      "User level (0=PLATFORM_OWNER, 1=SUPER_ADMIN, 2=STAFF, 3=MEMBER). Level 0 (PLATFORM_OWNER) is reserved for the seeded platform owner only.",
  })
  @IsNumber()
  @IsOptional()
  @Validate(NotSuperAdminLevelConstraint)
  @FieldType("number")
  level?: number;

  @ApiProperty({ example: true, required: false })
  @IsOptional()
  @IsBoolean()
  @FieldType("switch")
  isActive?: boolean;

  @ApiPropertyOptional({ type: CreateProfileDto })
  @IsOptional()
  @ValidateNested()
  @Type(() => CreateProfileDto)
  @FieldType("nested", false, CreateProfileDto)
  profile?: CreateProfileDto;

  @ApiPropertyOptional({
    description: "Roles to assign to the user",
  })
  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => RoleDto)
  @FieldType("custom", false, RoleDto)
  roles?: RoleDto[];

  @ApiPropertyOptional({
    description: "Direct permissions to assign to the user",
  })
  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => PermissionDto)
  @FieldType("custom", false, PermissionDto)
  permissions?: PermissionDto[];


  @ApiProperty({
    example: true,
    description: "Whether this user is an administrative user",
  })
  @IsBoolean()
  @IsOptional()
  @FieldType("switch", false)
  @TransformToBoolean()
  isAdministrative?: boolean;
}

export class UpdateUserDto extends PartialType(
  OmitType(CreateUserDto, ["isActive", "level", "password"] as const)
) {
  @ApiPropertyOptional({ type: UpdateProfileDto })
  @IsOptional()
  @ValidateNested()
  @Type(() => UpdateProfileDto)
  @FieldType("nested", false, UpdateProfileDto)
  profile?: UpdateProfileDto;
}

export class UserSafeDto {
  @ApiProperty({
    example: "550e8400-e29b-41d4-a716-446655440000",
    description: "User ID",
  })
  id: string;

  @ApiProperty({ example: "email@example.com", description: "User email" })
  email: string;

  @ApiPropertyOptional({ example: true, description: "User active status" })
  isActive?: boolean;

  @ApiPropertyOptional({ example: true, description: "User verified status" })
  isVerified?: boolean;

  @ApiProperty({
    example: "2024-01-01T00:00:00.000Z",
    description: "Creation date",
  })
  createdAt: Date;

  @ApiProperty({
    example: "2024-01-01T00:00:00.000Z",
    description: "Last update date",
  })
  updatedAt: Date;
}

export class UserWithProfileSafeDto extends UserSafeDto {
  @ApiProperty({ type: () => ProfileDto })
  profile: ProfileDto;
}

export class UserPaginatedDto extends PaginationMetaDto {
  @ApiProperty({ type: () => [UserSafeDto] })
  @Type(() => UserSafeDto)
  data: UserSafeDto[];
}

export class UserListDto extends ListQueryDto<IUser> {
  @ApiPropertyOptional({ example: 0, description: "Filter by user level" })
  @IsOptional()
  @IsNumber()
  @Equals()
  @Type(() => Number)
  level?: number;
}

export class UserDto {
  @ApiProperty({
    example: "550e8400-e29b-41d4-a716-446655440000",
    description: "User ID",
  })
  @IsNotEmpty()
  @IsString()
  @FieldType("text", true)
  id: string;

  @ApiProperty({ example: "email@example.com", description: "User email" })
  @IsOptional()
  @IsString()
  @FieldType("text", false)
  email?: string;

  @ApiProperty({ example: true, description: "User active status" })
  @IsOptional()
  @IsBoolean()
  isActive?: boolean;

  @ApiProperty({
    example: 0,
    description: "User level (0=ADMIN, 1=STAFF, 2=MEMBER)",
  })
  @IsOptional()
  @IsNumber()
  @FieldType("number")
  level?: number;

  @ApiProperty({ example: "John", description: "User first name" })
  @IsOptional()
  @IsString()
  @FieldType("text", false)
  firstName?: string;

  @ApiProperty({ example: "Doe", description: "User last name" })
  @IsOptional()
  @IsString()
  @FieldType("text", false)
  lastName?: string;

  @ApiPropertyOptional({ example: "1990-01-01" })
  @IsOptional()
  @IsDateString()
  @FieldType("date")
  dateOfBirth?: string;

  @ApiPropertyOptional({ enum: EUserGender, example: EUserGender.MALE })
  @IsOptional()
  @IsEnum(EUserGender)
  @FieldType("select")
  gender?: string;

  @ApiProperty({ example: true, description: "Whether this user is an administrative user" })
  @IsOptional()
  @IsBoolean()
  @FieldType("switch", false)
  @TransformToBoolean()
  isAdministrative?: boolean;

  @ApiPropertyOptional({ description: "Roles to assign to the user" })
  @IsOptional()
  @IsArray()
  roles?: { role: RoleDto }[];

  @ApiPropertyOptional({ description: "Permissions to assign to the user" })
  @IsOptional()
  @IsArray()
  permissions?: { permission: PermissionDto }[];

  @ApiPropertyOptional({ description: "Privileges to assign to the user" })
  @IsOptional()
  @IsArray()
  privileges?: { permissions: { permission: PermissionDto }[] }[];

  @ApiPropertyOptional({
    example: "2024-01-01T00:00:00.000Z",
    description: "Creation date",
  })
  @IsOptional()
  @IsDateString()
  createdAt?: string;

  @ApiProperty({
    example: "2024-01-01T00:00:00.000Z",
    description: "Last update date",
  })
  @IsOptional()
  @IsDateString()
  updatedAt?: string;

  @ApiPropertyOptional({ description: "Subscription features" })
  @IsOptional()
  @IsArray()
  subscriptionFeatures?: string[];
}
