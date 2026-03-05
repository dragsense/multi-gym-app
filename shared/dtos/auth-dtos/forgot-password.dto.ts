import { IsString, IsNotEmpty, IsEmail, ValidateNested, IsOptional } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';
import { FieldType } from '../../decorators/field.decorator';
import { BusinessDto } from '../business-dtos/business.dto';
import { Type, Expose } from 'class-transformer';

export class ForgotPasswordDto {
  @ApiProperty({ example: 'email@example.com', description: 'User email' })
  @IsEmail({}, { message: 'Invalid email format' })
  @IsNotEmpty({ message: 'Email cannot be empty' })
  @FieldType('email', true)
  email: string;

  @ApiProperty({ type: BusinessDto, description: "Business detail" })
  @ValidateNested({ message: "Business details are required" })
  @IsOptional()
  @Expose()
  @Type(() => BusinessDto)
  @FieldType("nested", true, BusinessDto)
  business?: BusinessDto;
}
