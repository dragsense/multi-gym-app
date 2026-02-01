import { Injectable, BadRequestException, Inject } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { ModuleRef } from '@nestjs/core';
import Stripe from 'stripe';
import { ConfigService } from '@nestjs/config';
import { StripeConnectAccount } from '../entities/stripe-connect-account.entity';
import { CrudService } from '@/common/crud/crud.service';
import {
  CreateStripeConnectDto,
  StripeConnectCreateResponseDto,
  StripeConnectStatusDto,
} from '@shared/dtos';
import { User } from '@/common/base-user/entities/user.entity';
import { BaseStripeService } from '../services/base-stripe.service';

@Injectable()
export class StripeConnectService extends CrudService<StripeConnectAccount> {
  constructor(
    @InjectRepository(StripeConnectAccount)
    private stripeConnectRepository: Repository<StripeConnectAccount>,
    private readonly configService: ConfigService,
    private readonly baseStripeService: BaseStripeService,
    moduleRef: ModuleRef,
  ) {
    super(stripeConnectRepository, moduleRef);
  }

  async connectStripeAccount(
    authUser: User,
    createDto: CreateStripeConnectDto,
  ): Promise<StripeConnectCreateResponseDto> {
    const stripe = await this.baseStripeService.getStripe();

    const existingAccount = await this.getSingle({ userId: authUser.id });
    if (existingAccount) {
      throw new BadRequestException(
        'User already has a Stripe Connect account',
      );
    }

    let stripeAccount: Stripe.Account | null = null;

    try {
      const app = this.configService.get('app');

      const type = createDto.type ?? 'express';
      const country = createDto.country ?? 'US';

      // Create Stripe account
      stripeAccount = await stripe.accounts.create({
        type,
        country,
        email: authUser.email,
        metadata: {
          userId: authUser.id.toString(),
          userType: 'trainer',
        },
      });

      // Create onboarding link
      const accountLink = await stripe.accountLinks.create({
        account: stripeAccount.id,
        refresh_url: `${app.appUrl}/settings/stripe-connect?refresh=true`,
        return_url: `${app.appUrl}/settings/stripe-connect?success=true`,
        type: 'account_onboarding',
      });

      // Save to DB
      const connectAccount = {
        stripeAccountId: stripeAccount.id,
        type,
        country,
        email: authUser.email,
        chargesEnabled: stripeAccount.charges_enabled,
        detailsSubmitted: stripeAccount.details_submitted,
        payoutsEnabled: stripeAccount.payouts_enabled,
        userId: authUser.id,
      } as StripeConnectAccount;

      await this.create(connectAccount);

      this.logger.log(
        `Created Stripe Connect account ${stripeAccount.id} for user ${authUser.id}`,
      );

      return {
        success: true,
        message: 'Stripe Connect account created successfully',
        data: {
          accountId: stripeAccount.id,
          onboardingUrl: accountLink.url,
        },
      };
    } catch (error) {
      // If stripeAccount was created, delete it to avoid orphan account
      if (stripeAccount) {
        try {
          await stripe.accounts.del(stripeAccount.id);
          this.logger.log(
            `Deleted Stripe account ${stripeAccount.id} due to error during creation process.`,
          );
        } catch (delError) {
          this.logger.error(
            `Failed to delete Stripe account ${stripeAccount.id}:`,
            delError,
          );
        }
      }

      this.logger.error('Error creating Stripe Connect account:', error);
      throw new BadRequestException(
        `Failed to create Stripe Connect account: ${error.message}`,
      );
    }
  }

  async findByUser(user: User): Promise<StripeConnectStatusDto> {
    const connectAccount = await this.getSingle({
      userId: user.id,
    });

    if (!connectAccount) {
      return {
        isComplete: false,
        account: null,
        stripeAccountId: null,
      };
    }

    // Sync with Stripe to get latest status
    try {
      const stripe = await this.baseStripeService.getStripe();
      const stripeAccount = await stripe.accounts.retrieve(
        connectAccount.stripeAccountId,
      );

      // Update local record
      connectAccount.chargesEnabled = stripeAccount.charges_enabled;
      connectAccount.detailsSubmitted = stripeAccount.details_submitted;
      connectAccount.payoutsEnabled = stripeAccount.payouts_enabled;
      await this.update(connectAccount.id, connectAccount);

      return {
        isComplete: connectAccount.isComplete,
        account: {
          id: connectAccount.stripeAccountId,
          type: connectAccount.type,
          country: connectAccount.country,
          email: connectAccount.email,
          charges_enabled: connectAccount.chargesEnabled,
          details_submitted: connectAccount.detailsSubmitted,
        },
        stripeAccountId: connectAccount.stripeAccountId,
      };
    } catch (error) {
      this.logger.error('Error syncing with Stripe:', error.message);

      // Return local data if Stripe sync fails
      throw new BadRequestException(
        'Error syncing with Stripe:',
        error.message,
      );
    }
  }

  async disconnectStripeAccount(user: User) {
    const connectAccount = await this.getSingle({
      userId: user.id,
    });

    try {
      const stripe = await this.baseStripeService.getStripe();

      // Delete from Stripe
      await stripe.accounts.del(connectAccount!.stripeAccountId);

      // Delete from database
      await this.delete(connectAccount!.id);

      this.logger.log(
        `Deleted Stripe Connect account ${connectAccount!.stripeAccountId} for user ${user.id}`,
      );
    } catch (error) {
      this.logger.error(
        `Error deleting Stripe Connect account:`,
        error.message,
      );
      throw new BadRequestException(
        `Failed to delete Stripe Connect account: ${error.message}`,
      );
    }
  }
}
