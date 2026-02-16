import { ApiProperty } from '@nestjs/swagger';
import { IsString, IsNotEmpty, IsUrl, IsOptional } from 'class-validator';

export class BusinessImpersonateResponseDto {
  @ApiProperty({
    example: 'http://mybusiness.localhost:5713/auth/impersonate?token=xxx',
    description: 'The URL to redirect to for impersonation login',
  })
  @IsString()
  @IsNotEmpty()
  redirectUrl: string;

  @ApiProperty({
    example: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...',
    description: 'Short-lived impersonation token',
  })
  @IsString()
  @IsNotEmpty()
  token: string;

  @ApiProperty({
    example: 'mybusiness',
    description: 'The subdomain of the business',
  })
  @IsString()
  @IsNotEmpty()
  subdomain: string;
}

export class ValidateImpersonationTokenDto {
  @ApiProperty({
    example: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...',
    description: 'The impersonation token to validate',
  })
  @IsString()
  @IsNotEmpty()
  token: string;
}
