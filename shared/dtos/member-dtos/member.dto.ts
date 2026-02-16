import {
  IsString,
  IsNotEmpty,
  IsNumber,
  IsOptional,
  IsBoolean,
  Min,
  IsDateString,
  ValidateNested,
} from "class-validator";
import { ApiProperty, ApiPropertyOptional } from "@nestjs/swagger";
import { PartialType } from "../../lib/dto-type-adapter";
import { Type, Transform } from "class-transformer";
import { PaginationMetaDto } from "../common/pagination.dto";
import { ListQueryDto, SingleQueryDto } from "../common/list-query.dto";
import { IMember } from "../../interfaces/member.interface";
import { FieldType } from "../../decorators/field.decorator";
import { OmitType } from "../../lib/dto-type-adapter";
import {
  Between,
  LessThan,
  GreaterThan,
  LessThanOrEqual,
  GreaterThanOrEqual,
  Like,
  In,
  NotIn,
  IsNull,
  IsNotNull,
  Equals,
  NotEquals,
  DateRange,
  TransformToArray,
  TransformToDate,
  RelationFilter,
} from "../../decorators/crud.dto.decorators";
import { CreateUserDto, UpdateUserDto, UserDto } from "../user-dtos/user.dto";

export class CreateMemberDto {
  @ApiProperty({ type: CreateUserDto })
  @ValidateNested()
  @Type(() => CreateUserDto)
  @FieldType("nested", true, CreateUserDto)
  user: CreateUserDto;

  @ApiPropertyOptional({ example: "Weight Loss", description: "Member goal" })
  @IsOptional()
  @IsString()
  @FieldType("text")
  goal?: string;

  @ApiPropertyOptional({ example: "Beginner", description: "Fitness level" })
  @IsOptional()
  @IsString()
  @FieldType("text")
  fitnessLevel?: string;

  @ApiPropertyOptional({
    example: "No injuries",
    description: "Medical conditions",
  })
  @IsOptional()
  @IsString()
  @FieldType("text")
  medicalConditions?: string;
}

export class UpdateMemberDto extends PartialType(
  OmitType(CreateMemberDto, ["user"])
) {
  @ApiProperty({ type: UpdateUserDto })
  @ValidateNested()
  @Type(() => UpdateUserDto)
  @FieldType("nested", true, UpdateUserDto)
  @IsOptional()
  user?: UpdateUserDto;
}

export class MemberPaginatedDto extends PaginationMetaDto {
  @ApiProperty({ type: () => [MemberDto] })
  @Type(() => MemberDto)
  data: MemberDto[];
}

export class MemberListDto extends ListQueryDto<IMember> {
  @ApiPropertyOptional({
    example: true,
    description: "Filter by active status",
  })
  @IsOptional()
  @IsBoolean()
  @Equals()
  @FieldType("switch", false)
  isActive?: boolean;

  @ApiPropertyOptional({
    example: "Weight Loss",
    description: "Filter by goal",
  })
  @IsOptional()
  @IsString()
  @Like()
  @FieldType("text", false)
  goal?: string;

  @ApiPropertyOptional({
    example: "Beginner",
    description: "Filter by fitness level",
  })
  @IsOptional()
  @IsString()
  @Equals()
  @FieldType("text", false)
  fitnessLevel?: string;
}

export class MemberDto {
  @ApiProperty({
    example: "550e8400-e29b-41d4-a716-446655440000",
    description: "Member ID",
  })
  @IsNotEmpty()
  @IsString()
  @FieldType("text", true)
  id: string;

  @ApiPropertyOptional({ example: "Weight Loss", description: "Member goal" })
  @IsOptional()
  @IsString()
  goal?: string;

  @ApiPropertyOptional({ example: "Beginner", description: "Fitness level" })
  @IsOptional()
  @IsString()
  fitnessLevel?: string;

  @ApiPropertyOptional({
    example: "No injuries",
    description: "Medical conditions",
  })
  @IsOptional()
  @IsString()
  @IsNotEmpty()
  medicalConditions?: string;

  @ApiProperty({ example: true, description: "Member active status" })
  @IsOptional()
  @IsBoolean()
  @IsNotEmpty()
  isActive?: boolean;

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
  @ValidateNested()
  @Type(() => UserDto)
  @FieldType("nested", true, UserDto)
  user?: UserDto;

  @IsOptional()
  createdAt?: Date;

  @IsOptional()
  updatedAt?: Date;
}
