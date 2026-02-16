import {
  Controller,
  Post,
  Headers,
  HttpCode,
  HttpStatus,
  RawBody,
  BadRequestException,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse } from '@nestjs/swagger';
import { StripeService } from './stripe.service';
import { LoggerService } from '@/common/logger/logger.service';
import { SkipBusinessCheck } from '@/decorators/skip-business-check.decorator';

@ApiTags('Stripe')
@SkipBusinessCheck()
@Controller('stripe')
export class StripeController {
  private readonly logger = new LoggerService(StripeController.name);

  constructor(private readonly stripeService: StripeService) { }

  @Post('webhook')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Handle Stripe webhook events' })
  @ApiResponse({ status: 200, description: 'Webhook processed successfully' })
  @ApiResponse({ status: 400, description: 'Invalid webhook signature' })
  async handleWebhook(
    @RawBody() payload: Buffer,
    @Headers('stripe-signature') signature: string,
  ) {
    this.logger.log('Received Stripe webhook request');

    if (!payload) {
      this.logger.error('No payload received in webhook');
      throw new BadRequestException('No payload received in webhook');
    }

    if (!signature) {
      this.logger.error('No Stripe signature received in webhook');
      throw new BadRequestException('No Stripe signature received in webhook');
    }

    try {
      await this.stripeService.handleWebhook(payload, signature);

      return { received: true };
    } catch (error) {
      this.logger.error(
        `Failed to process Stripe webhook: ${error instanceof Error ? error.message : String(error)}`,
      );
      this.logger.error(
        'Webhook error details:',
        error instanceof Error ? error.message : String(error),
      );
      throw new BadRequestException(
        error instanceof Error ? error.message : String(error),
      );
    }
  }
}
