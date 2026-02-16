import { ApiProperty } from '@nestjs/swagger';
import { IsBoolean, IsOptional, IsString, Length } from 'class-validator';
import { FieldType } from '../../decorators/field.decorator';

export class VerifyOtpDto {
  @ApiProperty({
    example: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...',
    description: 'Token received via email for password reset',
  })
  @IsString()
  token: string;


  @ApiProperty({ example: '12345' })
  @IsString()
  @Length(5, 6)
  code: string;

  @ApiProperty({ example: 'device-uuid-abc', required: false })
  @IsOptional()
  @IsString()
  deviceId?: string;

  @ApiProperty({ example: true, required: false })
  @IsOptional()
  @IsBoolean()
  rememberDevice?: boolean;
}
