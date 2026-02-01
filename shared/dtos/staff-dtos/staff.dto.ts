import {
  IsString,
  IsNotEmpty,
  IsOptional,
  IsBoolean,
  ValidateNested,
  IsArray,
  MaxLength,
  IsNumber,
  Min,
} from "class-validator";
import { ApiProperty, ApiPropertyOptional } from "@nestjs/swagger";
import { OmitType, PartialType } from "../../lib/dto-type-adapter";
import { Type } from "class-transformer";
import { PaginationMetaDto } from "../common/pagination.dto";
import { ListQueryDto } from "../common/list-query.dto";
import { FieldType } from "../../decorators/field.decorator";
import { CreateUserDto, UpdateUserDto, UserDto } from "../user-dtos";
import { LocationDto } from "../location-dtos/location.dto";
import { Equals, TransformToBoolean } from "../../decorators/crud.dto.decorators";
import { IUser } from "../../interfaces/user.interface";

export class CreateStaffDto {
  @ApiProperty({
    example: true,
    description: "Whether this staff member is a trainer",
  })
  @IsBoolean()
  @IsNotEmpty()
  @FieldType("switch", true)
  isTrainer: boolean;

  @ApiPropertyOptional({
    type: CreateUserDto,
    description: "User data (required if isTrainer is false)",
  })
  @IsOptional()
  @ValidateNested()
  @Type(() => CreateUserDto)
  @FieldType("nested", false, CreateUserDto)
  user?: CreateUserDto;

  @ApiProperty({
    example: "Fitness Training",
    description: "Trainer specialization",
  })
  @IsString()
  @IsOptional()
  @FieldType("textarea", false)
  @MaxLength(255)
  specialization?: string;

  @ApiProperty({ example: 5, description: "Years of experience" })
  @IsNumber()
  @IsOptional()
  @Min(0)
  @Type(() => Number)
  @FieldType("number", true)
  experience?: number;

  @ApiPropertyOptional({
    type: LocationDto,
    description: "Location associated with this staff member",
  })
  @IsOptional()
  @ValidateNested()
  @Type(() => LocationDto)
  @FieldType("nested", false, LocationDto)
  location?: LocationDto;
}


export class UpdateStaffDto extends PartialType(
  OmitType(CreateStaffDto, ["user", "isTrainer"])
) {
  @ApiProperty({ type: UpdateUserDto })
  @ValidateNested()
  @Type(() => UpdateUserDto)
  @FieldType("nested", true, UpdateUserDto)
  @IsOptional()
  user?: UpdateUserDto;
}


export class StaffPaginatedDto extends PaginationMetaDto {
  @ApiProperty({ type: () => [UserDto] })
  @Type(() => UserDto)
  data: UserDto[];
}



export class StaffListDto extends ListQueryDto<StaffDto> {
  @ApiPropertyOptional({
    type: Boolean,
    description: "Filter by isTrainer",
  })
  @IsOptional()
  @IsBoolean()
  @FieldType("switch", false)
  @TransformToBoolean()
  @Equals()
  isTrainer?: boolean;
}

export class StaffDto {
  @ApiProperty({
    example: "550e8400-e29b-41d4-a716-446655440000",
    description: "Trainer ID",
  })
  @IsNotEmpty()
  @IsString()
  @FieldType("text", true)
  id: string;

  @ApiProperty({
    example: "Fitness Training",
    description: "Trainer specialization",
  })
  @IsOptional()
  @IsString()
  specialization?: string;

  @ApiProperty({ example: 5, description: "Years of experience" })
  @IsOptional()
  @IsNumber()
  experience?: number;

  @ApiPropertyOptional({
    type: LocationDto,
    description: "Location associated with this trainer",
  })
  @IsOptional()
  @ValidateNested()
  @Type(() => LocationDto)
  @FieldType("nested", false, LocationDto)
  location?: LocationDto;

  @ApiProperty({ example: true, description: "Whether this staff member is a trainer" })
  @IsOptional()
  @IsBoolean()
  isTrainer?: boolean;

  @ApiProperty({
    example: {
      id: 1,
      email: "test@test.com",
      profile: {
        firstName: "John",
        lastName: "Doe",
        phoneNumber: "1234567890",
      },
    },
    description: "User",
  })
  @IsOptional()
  user?: IUser;

  @IsOptional()
  createdAt?: Date;

  @IsOptional()
  updatedAt?: Date;
}
