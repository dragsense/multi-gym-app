import { IsString, IsNotEmpty, MinLength } from "class-validator";
import { ApiProperty } from "@nestjs/swagger";
import { ResetPasswordDto } from "../user-dtos/reset-password.dto";
import { OmitType } from "../../lib/dto-type-adapter";
import { FieldType } from "../../decorators/field.decorator";

export class ResetPasswordWithTokenDto {


  @ApiProperty({ example: 'newpassword123', description: 'New password' })
  @IsString()
  @IsNotEmpty({ message: 'Password cannot be empty' })
  @MinLength(6, { message: 'Password must be at least 6 characters long' })
  @FieldType('password', true)
  password: string;

  @ApiProperty({ example: 'confirmnewpassword123', description: 'Confirm new password' })
  @IsString()
  @IsNotEmpty({ message: 'Confirm new password cannot be empty' })
  @MinLength(6, { message: 'Confirm new password must be at least 6 characters long' })
  @FieldType('password', true)
  confirmPassword: string;

  @ApiProperty({ example: "reset-token-here", description: "Reset token" })
  @IsString()
  @IsNotEmpty({ message: "Token cannot be empty" })
  token: string;
}
