// auth/dto/tokens.dto.ts
import { ApiProperty } from '@nestjs/swagger';


export class RefreshTokenResponseDto {
  @ApiProperty()
  accessToken: { token: string, expiresIn: number };

  @ApiProperty()
  refreshToken: { token: string, expiresIn: number };

  @ApiProperty()
  message: string;




}