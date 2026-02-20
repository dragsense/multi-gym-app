import {
  IsString,
  IsNotEmpty,
  MinLength,
  Validate,
  ValidatorConstraint,
  ValidatorConstraintInterface,
  ValidationArguments,
  Length,
  IsEmail,
  IsOptional,
  IsIn,
  IsNumber,
  ValidateIf,
  Min,
  ValidateNested,
} from "class-validator";
import { ApiProperty, ApiPropertyOptional } from "@nestjs/swagger";
import { FieldOptions, FieldType } from "../../decorators/field.decorator";
import { SignupUserLevel } from "../../enums/user.enum";
import { Type, Expose } from "class-transformer";

@ValidatorConstraint({ name: "passwordMatch", async: false })
class PasswordMatchConstraint implements ValidatorConstraintInterface {
  validate(confirmPassword: string, args: ValidationArguments) {
    const object = args.object as any;
    return confirmPassword === object.password;
  }

  defaultMessage(args: ValidationArguments) {
    return "Passwords do not match";
  }
}

export class SignupTrainerDto {
  @ApiProperty({ example: 5, description: "Years of experience" })
  @IsNumber()
  @IsNotEmpty()
  @Min(0)
  @Expose()
  @Type(() => Number)
  @FieldType("number", true)
  experience: number;

  @ApiProperty({
    example: "Fitness Training",
    description: "Trainer specialization",
  })
  @IsString()
  @IsNotEmpty()
  @FieldType("text", true)
  specialization: string;
}

export class SignupDto {
  @ApiProperty({ example: "John", description: "First name of the user" })
  @IsString()
  @IsNotEmpty({message: "First Name is required" })
  @FieldType("text", true)
  firstName: string;

  @ApiProperty({ example: "Doe", description: "Last name of the user" })
  @IsString()
  @IsNotEmpty({message: "Last Name is required" })
  @FieldType("text", true)
  lastName: string;

  @ApiProperty({ example: "email@example.com" })
  @IsString()
  @IsNotEmpty()
  @IsEmail({}, { message: 'Email must be an email' })
  @FieldType("email", true)
  email: string;

  @ApiProperty({ example: "secrete" })
  @IsString()
  @IsNotEmpty()
  @Length(6, 100)
  @FieldType("password", true)
  @MinLength(8, { message: "Password must be at least 8 characters long" })
  password: string;

  @ApiProperty({
    example: "secrete",
    description: "Confirm password (must match password)",
    minLength: 8,
  })
  @IsString()
  @IsNotEmpty()
  @MinLength(8, { message: "Password must be at least 8 characters long" })
  @Validate(PasswordMatchConstraint)
  @FieldType("password", true)
  confirmPassword: string;

  @ApiPropertyOptional({
    example: "abc123",
    description: "Referral code (optional)",
  })
  @IsString()
  @IsOptional()
  @FieldType("text", false)
  referralCode?: string;
}

export class SignupResponseDto {

  @ApiProperty()
  token: string;

  @ApiProperty()
  message: string;

  @ApiProperty()
  requiredOtp: boolean;
}
