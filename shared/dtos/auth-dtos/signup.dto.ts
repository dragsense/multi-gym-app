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
  IsUUID,
  IsNumber,
  ValidateIf,
  Min,
  ValidateNested,
  Matches,
} from "class-validator";
import { ApiProperty, ApiPropertyOptional } from "@nestjs/swagger";
import { FieldOptions, FieldType } from "../../decorators/field.decorator";
import { SignupUserLevel } from "../../enums/user.enum";
import { Type, Expose } from "class-transformer";
import { BusinessDto } from "../business-dtos";

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
  @IsNotEmpty({ message: "First Name is required" })
  @FieldType("text", true)
  firstName: string;

  @ApiProperty({ example: "Doe", description: "Last name of the user" })
  @IsString()
  @IsNotEmpty({ message: "Last Name is required" })
  @FieldType("text", true)
  lastName: string;

  @ApiProperty({ example: "email@example.com" })
  @IsString()
  @IsEmail({}, { message: 'Email must be a valid email' })
  @IsNotEmpty({message: "Email is required"})
  @FieldType("email", true)
  email: string;

  @ApiProperty({ example: "secrete" })
  @IsString()
  @Length(8, 100)
  @IsNotEmpty({message: "Password is required"})
  @FieldType("password", true)
  @Matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{8,}$/, {
    message: "Password must be at least 8 characters long and contain at least one uppercase letter, one lowercase letter, one number, and one special character (@$!%*?&)",
  })
  password: string;

  @ApiProperty({
    example: "secrete",
    description: "Confirm password (must match password)",
    minLength: 8,
  })
  @IsString()
  @IsNotEmpty({message: "Confirm Password is required"})
  @Matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{8,}$/, {
    message: "Password must be at least 8 characters long and contain at least one uppercase letter, one lowercase letter, one number, and one special character (@$!%*?&)",
  })
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


  @ApiProperty({ type: BusinessDto, description: "Business detail" })
  @ValidateNested({ message: "Business details are required" })
  @IsOptional()
  @Expose()
  @Type(() => BusinessDto)
  @FieldType("nested", true, BusinessDto)
  business?: BusinessDto;

}

export class SignupResponseDto {

  @ApiProperty()
  token: string;

  @ApiProperty()
  message: string;

  @ApiProperty()
  tenantId?: string | null;

  @ApiProperty() 
  requiredOtp: boolean;
}
