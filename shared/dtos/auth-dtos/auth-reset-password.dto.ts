import { IsString, IsNotEmpty, MinLength, IsOptional, Matches } from "class-validator";
import { ApiProperty } from "@nestjs/swagger";
import { FieldType } from "../../decorators/field.decorator";

export class ResetPasswordWithTokenDto {


  @ApiProperty({ example: 'newpassword123', description: 'New password' })
  @IsString()
  @IsNotEmpty({ message: 'Password cannot be empty' })
  @Matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{8,}$/, {
    message: "Password must be at least 8 characters long and contain at least one uppercase letter, one lowercase letter, one number, and one special character (@$!%*?&)",
  })
  @FieldType('password', true)
  password: string;

  @ApiProperty({ example: 'confirmnewpassword123', description: 'Confirm new password' })
  @IsString()
  @IsNotEmpty({ message: 'Confirm new password cannot be empty' })
  @Matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{8,}$/, {
    message: "Password must be at least 8 characters long and contain at least one uppercase letter, one lowercase letter, one number, and one special character (@$!%*?&)",
  })
  @FieldType('password', true)
  confirmPassword: string;

  @ApiProperty({ example: "reset-token-here", description: "Reset token" })
  @IsString()
  @IsNotEmpty({ message: "Token cannot be empty" })
  token: string;

  @ApiProperty({ example: "tenantId", description: "Tenant ID" })
  @IsString()
  @IsOptional()
  tenantId: string;
}
