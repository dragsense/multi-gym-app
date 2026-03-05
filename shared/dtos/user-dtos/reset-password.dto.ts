import { IsString, IsNotEmpty, MinLength, Validate, ValidatorConstraint, ValidatorConstraintInterface, ValidationArguments, Matches } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';
import { FieldType } from '../../decorators/field.decorator';

@ValidatorConstraint({ name: 'passwordMatch', async: false })
class PasswordMatchConstraint implements ValidatorConstraintInterface {
  validate(confirmPassword: string, args: ValidationArguments) {
    const object = args.object as any;
    return confirmPassword === object.password;
  }

  defaultMessage(args: ValidationArguments) {
    return 'Passwords do not match';
  }
}

export class ResetPasswordDto {
  @ApiProperty({ example: 'newpassword123', description: 'New password' })
  @IsString()
  @IsNotEmpty({ message: 'Password cannot be empty' })
  @Matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{8,}$/, {
    message: "Password must be at least 8 characters long and contain at least one uppercase letter, one lowercase letter, one number, and one special character (@$!%*?&)",
  })
  @FieldType('password', true)
  password: string;

  @ApiProperty({ example: 'currentpassword123', description: 'Current password' })
  @IsString()
  @IsNotEmpty({ message: 'Current password cannot be empty' })
  @MinLength(6, { message: 'Current password must be at least 6 characters long' })
  @FieldType('password', true)
  currentPassword?: string;

  @ApiProperty({ example: 'confirmnewpassword123', description: 'Confirm new password' })
  @IsString()
  @IsNotEmpty({ message: 'Confirm new password cannot be empty' })
  @Matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{8,}$/, {
    message: "Password must be at least 8 characters long and contain at least one uppercase letter, one lowercase letter, one number, and one special character (@$!%*?&)",
  })
  @Validate(PasswordMatchConstraint)
  @FieldType('password', true)
  confirmPassword: string;
}
