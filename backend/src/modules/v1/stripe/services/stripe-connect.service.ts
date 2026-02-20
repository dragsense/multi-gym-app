import { Injectable, BadRequestException, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { ModuleRef } from '@nestjs/core';
import Stripe from 'stripe';
import { ConfigService } from '@nestjs/config';
import { StripeConnectAccount } from '../entities/stripe-connect-account.entity';
import {
  CreateStripeConnectDto,
  StripeConnectCreateResponseDto,
  StripeConnectStatusDto,
} from '@shared/dtos';
import { User } from '@/common/base-user/entities/user.entity';
import { BaseStripeService } from '../services/base-stripe.service';
import { BusinessService } from '@/modules/v1/business/business.service';
import { Business } from '@/modules/v1/business/entities/business.entity';
import { LoggerService } from '@/common/logger/logger.service';

@Injectable()
export class StripeConnectService {

  private readonly logger = new LoggerService(StripeConnectService.name);

  constructor(
    @InjectRepository(StripeConnectAccount)
    private stripeConnectRepository: Repository<StripeConnectAccount>,
    @InjectRepository(Business)
    private businessRepository: Repository<Business>,
    private readonly configService: ConfigService,
    private readonly baseStripeService: BaseStripeService,
  ) {
  }

  /**
   * Get the business for the current user
   */
  private async getBusinessForUser(user: User): Promise<Business> {
    const business = await this.businessRepository.findOne({
      where: { user: { id: user.id } },
    });
    if (!business) {
      throw new NotFoundException('Business not found');
    }
    return business;
  }

  /**
   * Create a Stripe Connect Express account for the user's business
   */
  async connectStripeAccount(
    authUser: User,
    createDto: CreateStripeConnectDto,
  ): Promise<StripeConnectCreateResponseDto> {
    const stripe = this.baseStripeService.getStripe();
    const business = await this.getBusinessForUser(authUser);

    const existingAccount = await this.stripeConnectRepository.findOne({
      where: {
        business: { id: business.id },
      },
    });
    if (existingAccount) {
      throw new BadRequestException(
        'Business already has a Stripe Connect account',
      );
    }

    let stripeAccount: Stripe.Account | null = null;

    try {
      const app = this.configService.get('app');
      const type = 'express';
      const country = createDto.country ?? 'US';

      // Create Stripe Express account
      stripeAccount = await stripe.accounts.create({
        type,
        country,
        email: authUser.email,
        capabilities: {
          card_payments: { requested: true },
          transfers: { requested: true },
        },
        metadata: {
          businessId: business.id,
          businessName: business.name,
        },
      });

      // Create onboarding link
      const accountLink = await stripe.accountLinks.create({
        account: stripeAccount.id,
        refresh_url: `${app.appUrl}/admin/account?tab=stripe-connect&refresh=true`,
        return_url: `${app.appUrl}/admin/account?tab=stripe-connect&success=true`,
        type: 'account_onboarding',
      });

      // Save to DB
      const connectAccount = this.stripeConnectRepository.create({
        stripeAccountId: stripeAccount.id,
        type,
        country,
        email: authUser.email,
        chargesEnabled: stripeAccount.charges_enabled,
        detailsSubmitted: stripeAccount.details_submitted,
        payoutsEnabled: stripeAccount.payouts_enabled,
        business: { id: business.id },
      });

      await this.stripeConnectRepository.save(connectAccount);

      // Also save the Stripe account ID on the business entity for quick lookup
      await this.businessRepository.update(business.id, {
        stripeConnectAccountId: stripeAccount.id,
      });

      this.logger.log(
        `Created Stripe Connect account ${stripeAccount.id} for business ${business.id}`,
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

  /**
   * Get Stripe Connect account status for the current user's business
   */
  async findByUser(user: User): Promise<StripeConnectStatusDto> {
    const business = await this.getBusinessForUser(user);
    return this.findByBusiness(business.id);
  }

  /**
   * Get Stripe Connect account status for a specific business
   */
  async findByBusiness(businessId: string): Promise<StripeConnectStatusDto> {
    const connectAccount = await this.stripeConnectRepository.findOne({
      where: {
        business: { id: businessId },
      },
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
      const stripe = this.baseStripeService.getStripe();
      const stripeAccount = await stripe.accounts.retrieve(
        connectAccount.stripeAccountId,
      );

      // Update local record
      connectAccount.chargesEnabled = stripeAccount.charges_enabled;
      connectAccount.detailsSubmitted = stripeAccount.details_submitted;
      connectAccount.payoutsEnabled = stripeAccount.payouts_enabled;
      await this.stripeConnectRepository.save(connectAccount);

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
      throw new BadRequestException(
        'Error syncing with Stripe: ' + error.message,
      );
    }
  }

  /** 
   * Get the Stripe Connect account for a specific tenant
   */
  async findByTenantId(tenantId?: string): Promise<StripeConnectAccount> {
    const business = await this.businessRepository.findOne({
      where: { tenantId: tenantId },
    });

    if (!business) {
      throw new NotFoundException('No business found for this tenant');
    }

    const connectAccount = await this.stripeConnectRepository.findOne({
      where: {
        business: { id: business.id },
      },
    });
    if (!connectAccount) {
      throw new NotFoundException('No Stripe Connect account found for this business');
    }
    return connectAccount;
  }

  /**
   * Generate a new onboarding link for an incomplete Stripe Connect account
   */
  async getOnboardingLink(user: User): Promise<StripeConnectCreateResponseDto> {
    const business = await this.getBusinessForUser(user);
    const connectAccount = await this.stripeConnectRepository.findOne({
      where: {
        business: { id: business.id },
      },
    });

    if (!connectAccount) {
      throw new NotFoundException('No Stripe Connect account found for this business');
    }

    try {
      const stripe = this.baseStripeService.getStripe();
      const app = this.configService.get('app');

      const accountLink = await stripe.accountLinks.create({
        account: connectAccount.stripeAccountId,
        refresh_url: `${app.appUrl}/admin/account?tab=stripe-connect&refresh=true`,
        return_url: `${app.appUrl}/admin/account?tab=stripe-connect&success=true`,
        type: 'account_onboarding',
      });

      return {
        success: true,
        message: 'Onboarding link generated successfully',
        data: {
          accountId: connectAccount.stripeAccountId,
          onboardingUrl: accountLink.url,
        },
      };
    } catch (error) {
      this.logger.error('Error generating onboarding link:', error.message);
      throw new BadRequestException(
        `Failed to generate onboarding link: ${error.message}`,
      );
    }
  }

  /**
   * Disconnect Stripe Connect account for the current user's business
   */
  async disconnectStripeAccount(user: User) {
    const business = await this.getBusinessForUser(user);
    const connectAccount = await this.stripeConnectRepository.findOne({
      where: {
        business: { id: business.id },
      },
    });

    if (!connectAccount) {
      throw new NotFoundException('No Stripe Connect account found for this business');
    }

    try {
      const stripe = this.baseStripeService.getStripe();

      // Delete from Stripe
      await stripe.accounts.del(connectAccount.stripeAccountId);

      // Delete from database
      await this.stripeConnectRepository.remove(connectAccount);

      // Clear the Stripe account ID on the business entity
      await this.businessRepository.update(business.id, {
        stripeConnectAccountId: null,
      });

      this.logger.log(
        `Deleted Stripe Connect account ${connectAccount.stripeAccountId} for business ${business.id}`,
      );

      return { message: 'Stripe Connect account disconnected successfully' };
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
