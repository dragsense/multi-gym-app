import { IsString, IsNotEmpty, IsEmail, ValidateNested, IsOptional } from "class-validator";
import { ApiProperty, ApiPropertyOptional } from "@nestjs/swagger";
import { UserWithProfileSafeDto } from "../user-dtos";
import { FieldType } from "../../decorators/field.decorator";
import { BusinessDto } from "../business-dtos";
import { Type, Expose } from "class-transformer";

export class LoginDto {
  @ApiProperty({ example: "email@example.com", description: "User email" })
  @IsEmail({}, { message: "Invalid email format" })
  @IsNotEmpty({ message: "Email cannot be empty" })
  @FieldType("email", true)
  email: string;

  @ApiProperty({ example: "secrete", description: "User password" })
  @IsString()
  @IsNotEmpty({ message: "Password cannot be empty" })
  @FieldType("password", true)
  password: string;

  @ApiPropertyOptional({
    example: "device-uuid-abc",
    required: false,
    description: "Client-generated device identifier",
  })
  @IsOptional()
  @IsString()
  deviceId?: string;

  @ApiProperty({ type: BusinessDto, description: "Business detail" })
  @ValidateNested({ message: "Business details are required" })
  @IsOptional()
  @Expose()
  @Type(() => BusinessDto)
  @FieldType("nested", true, BusinessDto)
  business?: BusinessDto;

}

export class LoginResponseDto {
  @ApiProperty({ type: () => UserWithProfileSafeDto })
  user: UserWithProfileSafeDto;

  @ApiProperty()
  accessToken: { token: string, expiresIn: number };

  @ApiProperty()
  refreshToken: { token: string, expiresIn: number };

  @ApiProperty()
  tenantId: string;

  @ApiProperty()
  message: string;

  @ApiProperty()
  requiredOtp: boolean;
}
