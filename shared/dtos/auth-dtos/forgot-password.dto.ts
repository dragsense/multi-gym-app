import { IsString, IsNotEmpty, IsEmail } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';
import { FieldType } from '../../decorators/field.decorator';

export class ForgotPasswordDto {
  @ApiProperty({ example: 'email@example.com', description: 'User email' })
  @IsEmail({}, { message: 'Invalid email format' })
  @IsNotEmpty({ message: 'Email cannot be empty' })
  @FieldType('email', true)
  email: string;
}
