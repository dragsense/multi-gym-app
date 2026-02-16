import { ApiProperty } from '@nestjs/swagger';
import { IsString,  IsEnum, Length, } from 'class-validator';
import { FieldOptions, FieldType } from '../../decorators/field.decorator';
import { IMessageResponse } from '../../interfaces/api/response.interface';

export class CreateStripeConnectDto {

  @ApiProperty({ example: 'express', description: 'Account type' })
  @IsEnum(['express', 'standard'], { message: 'type must be either express or standard' })
  @FieldType("select", true)
  @FieldOptions(Object.values(['express', 'standard']).map(v => ({ value: v, label: v.charAt(0) + v.slice(1).toLowerCase() })))  
  type: 'express' | 'standard';

  @ApiProperty({ example: 'US', description: 'Account country' })
  @IsString()
  @Length(2, 2, { message: 'country must be a 2-letter ISO code' })
  @FieldType("text", true)
  country: string;

}


export class StripeConnectAccountDto {
  @ApiProperty({ example: 'acct_1234567890', description: 'Stripe account ID' })
  id: string;

  @ApiProperty({ example: 'express', description: 'Account type' })
  type: 'express' | 'standard';

  @ApiProperty({ example: 'US', description: 'Account country' })
  country: string;

  @ApiProperty({ example: 'user@example.com', description: 'Account email' })
  email: string;

  @ApiProperty({ example: true, description: 'Whether charges are enabled' })
  charges_enabled: boolean;

  @ApiProperty({ example: true, description: 'Whether details have been submitted' })
  details_submitted: boolean;
}

export class StripeConnectStatusDto {
  @ApiProperty({ example: true, description: 'Whether the account setup is complete' })
  isComplete: boolean;

  @ApiProperty({ type: StripeConnectAccountDto, nullable: true, description: 'Account details if exists' })
  account: StripeConnectAccountDto | null;

  @ApiProperty({ example: 'acct_1234567890', nullable: true, description: 'Stripe account ID' })
  stripeAccountId: string | null;
}

export class StripeConnectCreateResponseDto implements IMessageResponse {
  @ApiProperty({ example: true, description: 'Success status' })
  success: boolean;

  @ApiProperty({ example: 'Stripe Connect account created successfully', description: 'Response message' })
  message: string;

  @ApiProperty({ description: 'Account creation data' })
  data: {
      accountId: string;
      onboardingUrl: string;
  };
}
