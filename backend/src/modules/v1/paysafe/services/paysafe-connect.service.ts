import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { ConfigService } from '@nestjs/config';
import { Repository } from 'typeorm';
import { LoggerService } from '@/common/logger/logger.service';
import { Business } from '@/modules/v1/business/entities/business.entity';
import { User } from '@/common/base-user/entities/user.entity';
import {
  CreatePaysafeApplicationDto,
  PaysafeConnectResponseDto,
  PaysafeConnectStatusDto,
} from '@shared/dtos';
import { PaysafeConnectAccount } from '../entities/paysafe-connect-account.entity';

type PaysafeConfig = {
  apiUsername?: string;
  apiPassword?: string;
  baseUrl?: string;
  environment?: string;
};

@Injectable()
export class PaysafeConnectService {
  private readonly logger = new LoggerService(PaysafeConnectService.name);

  constructor(
    @InjectRepository(PaysafeConnectAccount)
    private readonly repo: Repository<PaysafeConnectAccount>,
    @InjectRepository(Business)
    private readonly businessRepo: Repository<Business>,
    private readonly configService: ConfigService,
  ) {}

  private getConfig(): Required<Pick<PaysafeConfig, 'apiUsername' | 'apiPassword' | 'baseUrl'>> {
    const config = this.configService.get<PaysafeConfig>('paymentProcessors.paysafe');
    if (!config?.apiUsername || !config?.apiPassword || !config?.baseUrl) {
      this.logger.warn('Paysafe config missing for Applications API');
      throw new BadRequestException(
        'Paysafe is not configured. Set PAYSAFE_API_USERNAME and PAYSAFE_API_PASSWORD.',
      );
    }
    return {
      apiUsername: config.apiUsername,
      apiPassword: config.apiPassword,
      baseUrl: config.baseUrl,
    };
  }

  private getAuthHeader(): string {
    const { apiUsername, apiPassword } = this.getConfig();
    const encoded = Buffer.from(`${apiUsername}:${apiPassword}`, 'utf-8').toString('base64');
    return `Basic ${encoded}`;
  }

  private async getBusinessForUser(user: User): Promise<Business> {
    const business = await this.businessRepo.findOne({
      where: { user: { id: user.id } },
    });
    if (!business) {
      throw new NotFoundException('Business not found');
    }
    return business;
  }

  private toStatusDto(account: PaysafeConnectAccount | null): PaysafeConnectStatusDto {
    if (!account) {
      return { connected: false, applicationId: null, status: null };
    }
    return {
      connected: true,
      applicationId: account.applicationId,
      status: account.status ?? null,
    };
  }

  async getStatus(user: User): Promise<PaysafeConnectStatusDto> {
    const business = await this.getBusinessForUser(user);
    const existing = await this.repo.findOne({ where: { businessId: business.id } });
    return this.toStatusDto(existing);
  }

  async connect(user: User, dto: CreatePaysafeApplicationDto): Promise<PaysafeConnectResponseDto> {
    const business = await this.getBusinessForUser(user);
    const existing = await this.repo.findOne({ where: { businessId: business.id } });
    if (existing) {
      throw new BadRequestException('Paysafe Connect application already exists for this business');
    }

    const { baseUrl } = this.getConfig();
    const url = `${baseUrl}/merchant/v1/applications`;

    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: this.getAuthHeader(),
      },
      body: JSON.stringify(dto.payload ?? {}),
    });

    const data = (await response.json()) as Record<string, any>;
    if (!response.ok) {
      const msg =
        (data as any)?.error?.message ??
        (typeof (data as any)?.message === 'string' ? (data as any).message : null) ??
        `Paysafe Applications API error: ${response.status}`;
      throw new BadRequestException(msg);
    }

    const applicationId =
      (data as any)?.id ?? (data as any)?.appId ?? (data as any)?.applicationId;
    if (!applicationId || typeof applicationId !== 'string') {
      this.logger.error(`Paysafe did not return application id: ${JSON.stringify(data)}`);
      throw new BadRequestException('Paysafe did not return application id');
    }

    const status = typeof (data as any)?.status === 'string' ? (data as any).status : null;

    const saved = await this.repo.save({
      businessId: business.id,
      applicationId,
      status,
      raw: data,
    });

    return {
      success: true,
      message: 'Paysafe application created successfully',
      data: this.toStatusDto(saved),
    };
  }

  async refresh(user: User): Promise<PaysafeConnectResponseDto> {
    const business = await this.getBusinessForUser(user);
    const existing = await this.repo.findOne({ where: { businessId: business.id } });
    if (!existing) {
      throw new NotFoundException('No Paysafe application found for this business');
    }

    const { baseUrl } = this.getConfig();
    const url = `${baseUrl}/merchant/v1/applications/${existing.applicationId}`;

    const response = await fetch(url, {
      method: 'GET',
      headers: {
        Accept: 'application/json',
        Authorization: this.getAuthHeader(),
      },
    });

    const data = (await response.json()) as Record<string, any>;
    if (!response.ok) {
      const msg =
        (data as any)?.error?.message ??
        (typeof (data as any)?.message === 'string' ? (data as any).message : null) ??
        `Paysafe Applications API error: ${response.status}`;
      throw new BadRequestException(msg);
    }

    existing.status = typeof (data as any)?.status === 'string' ? (data as any).status : existing.status;
    existing.raw = data;
    const saved = await this.repo.save(existing);

    return {
      success: true,
      message: 'Paysafe application status refreshed',
      data: this.toStatusDto(saved),
    };
  }

  async disconnect(user: User): Promise<{ message: string }> {
    const business = await this.getBusinessForUser(user);
    const existing = await this.repo.findOne({ where: { businessId: business.id } });
    if (!existing) {
      throw new NotFoundException('No Paysafe application found for this business');
    }
    await this.repo.remove(existing);
    return { message: 'Paysafe application disconnected successfully' };
  }
}

