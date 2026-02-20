import { ApiProperty } from '@nestjs/swagger';
import { IsObject } from 'class-validator';
import type { IMessageResponse } from '../../interfaces/api/response.interface';

/**
 * Paysafe "Connect" (Applications API) – we accept a flexible payload because
 * required onboarding fields vary by region/business type.
 *
 * Docs: https://developer.paysafe.com/en/api-docs/applications-api/overview/
 */
export class CreatePaysafeApplicationDto {
  @ApiProperty({
    description:
      'Raw Paysafe Applications API payload (POST /merchant/v1/applications)',
    type: Object,
  })
  @IsObject()
  payload: Record<string, any>;
}

export class PaysafeConnectStatusDto {
  @ApiProperty({ description: 'Whether a Paysafe application is linked' })
  connected: boolean;

  @ApiProperty({ nullable: true, description: 'Paysafe application ID' })
  applicationId: string | null;

  @ApiProperty({ nullable: true, description: 'Paysafe application status' })
  status: string | null;
}

export class PaysafeConnectResponseDto implements IMessageResponse {
  @ApiProperty()
  success: boolean;

  @ApiProperty()
  message: string;

  @ApiProperty({
    description: 'Connected application info',
    type: PaysafeConnectStatusDto,
  })
  data: PaysafeConnectStatusDto;
}

