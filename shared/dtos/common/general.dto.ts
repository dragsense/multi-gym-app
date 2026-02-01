import { ApiProperty } from '@nestjs/swagger';

export class MessageResponseDto {
  @ApiProperty({ description: 'A message describing the result of the operation.' })
  message: string;
}