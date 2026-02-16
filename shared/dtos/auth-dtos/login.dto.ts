import { IsString, IsNotEmpty, IsEmail, IsOptional } from "class-validator";
import { ApiProperty, ApiPropertyOptional } from "@nestjs/swagger";
import { UserWithProfileSafeDto } from "../user-dtos";
import { FieldType } from "../../decorators/field.decorator";

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
}

export class LoginResponseDto {
  @ApiProperty({ type: () => UserWithProfileSafeDto })
  user: UserWithProfileSafeDto;

  @ApiProperty()
  accessToken: { token: string, expiresIn: number };

  @ApiProperty()
  message: string;

  @ApiProperty()
  requiredOtp: boolean;
}
