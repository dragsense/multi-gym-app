import { Injectable, NotFoundException, Inject } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { ModuleRef } from '@nestjs/core';
import { CrudService } from '@/common/crud/crud.service';
import { ReferralLink } from './entities/referral-link.entity';
import { CreateReferralLinkDto, UpdateReferralLinkDto } from '@shared/dtos';
import { EReferralLinkStatus } from '@shared/enums/referral-link.enum';
import { ReferralLinkNotificationService } from './services/referral-link-notification.service';

@Injectable()
export class ReferralLinksService extends CrudService<ReferralLink> {
  constructor(
    @InjectRepository(ReferralLink)
    private readonly referralLinkRepository: Repository<ReferralLink>,
    moduleRef: ModuleRef,
    private readonly referralLinkNotificationService: ReferralLinkNotificationService,
  ) {
    super(referralLinkRepository, moduleRef);
  }

  async createReferralLink(
    createReferralLinkDto: CreateReferralLinkDto,
  ): Promise<ReferralLink> {
    // Get user who created the link
    // Generate unique referral code
    const referralCode = await this.generateUniqueReferralCode();

    // Generate referral link URL
    const baseUrl = process.env.FRONTEND_URL || 'http://localhost:3000';
    const linkUrl = `${baseUrl}/signup?ref=${referralCode}`;

    // Create referral link
    const referralLink = await this.create({
      ...createReferralLinkDto,
      referralCode,
      linkUrl,
      status: EReferralLinkStatus.ACTIVE,
      referralCount: 0,
      currentUses: 0,
    });

    // Load relations for notification
    const repository = this.getRepository();
    const linkWithRelations = await repository.findOne({
      where: { id: referralLink.id },
      relations: ['createdBy'],
    });

    // Send notification
    if (linkWithRelations) {
      try {
        await this.referralLinkNotificationService.notifyReferralLinkCreated(
          linkWithRelations,
        );
      } catch (error) {
        console.error('Failed to send referral link notification:', error);
      }
    }

    return referralLink;
  }

  private async generateUniqueReferralCode(): Promise<string> {
    let referralCode: string = '';
    let isUnique = false;

    while (!isUnique) {
      // Generate a random 8-character code
      referralCode = Math.random().toString(36).substring(2, 10).toUpperCase();

      try {
        // Check if code already exists
        await this.getSingle({
          referralCode,
        });
      } catch (error: unknown) {
        if (error instanceof NotFoundException) isUnique = true;
        else throw error;
      }
    }

    return referralCode;
  }

  async updateReferralLink(
    id: string,
    updateReferralLinkDto: UpdateReferralLinkDto,
  ): Promise<ReferralLink> {
    return this.update(id, updateReferralLinkDto);
  }
}
