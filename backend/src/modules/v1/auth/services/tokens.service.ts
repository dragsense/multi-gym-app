// auth/token.service.ts
import { BadRequestException, Injectable } from '@nestjs/common';
import { JwtService, type JwtSignOptions } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import { RefreshToken } from '@/modules/v1/auth/entities/tokens.entity';
import { Cron, CronExpression } from '@nestjs/schedule';
import { LoggerService } from '@/common/logger/logger.service';
import { EntityRouterService } from '@/common/database/entity-router.service';
import { RequestContext } from '@/common/context/request-context';
import { Business } from '@/modules/v1/business/entities/business.entity';
import { Repository, Not, IsNull } from 'typeorm';
import { InjectRepository } from '@nestjs/typeorm';

@Injectable()
export class TokenService {
  private readonly logger = new LoggerService(TokenService.name);

  constructor(
    private jwtService: JwtService,
    private configService: ConfigService,
    private readonly entityRouterService: EntityRouterService,
    @InjectRepository(Business)
    private readonly businessRepository: Repository<Business>,
  ) {}

  async generateTokens(payload: any) {
    const accessToken = await this.generateAccessToken(payload);
    const refreshToken = await this.generateRefreshToken(payload, accessToken);

    return {
      accessToken,
      refreshToken,
    };
  }

  /**
   * Generate a short-lived impersonation token for admin login to business
   * @param payload - The payload containing user info
   * @param expiresIn - Token expiry time (default: 60s)
   */
  generateImpersonationToken(
    payload: {
      userId: string;
      tenantId: string;
      targetUserId: string;
      subdomain: string;
      purpose: 'impersonation' | 'my-business-login';
    },
    expiresIn: JwtSignOptions['expiresIn'] = '60s',
  ): string {
    return this.jwtService.sign(payload, { expiresIn });
  }

  /**
   * Validate and decode an impersonation token
   * @param token - The impersonation token to validate
   */
  validateImpersonationToken(token: string): {
    userId: string;
    tenantId: string;
    targetUserId: string;
    subdomain: string;
    purpose: string;
  } | null {
    try {
      const decoded = this.jwtService.verify(token);
      if (decoded.purpose !== 'impersonation' && decoded.purpose !== 'my-business-login') {
        return null;
      }
      return decoded;
    } catch (error) {
      return null;
    }
  }

  async generateAccessToken(payload: any) {
    const jwt = this.configService.get('jwt');
    const expiresIn = jwt.accessTokenExpiry;
    const expiresInSeconds = this.expiryToSeconds(expiresIn);

    return {
      token: this.jwtService.sign(payload, { expiresIn }),
      expiresIn: expiresInSeconds,
    };
  }

  async generateRefreshToken(payload: any, accessToken: any) {
    const jwt = this.configService.get('jwt');
    const expiresIn = jwt.refreshTokenExpiry;
    const expiresAt = this.expiryToDate(expiresIn);

    const refreshToken = new RefreshToken();
    refreshToken.token = this.jwtService.sign(payload, {
      secret: jwt.refreshSecret,
      expiresIn,
    });
    refreshToken.expiresAt = expiresAt;
    refreshToken.lastToken = accessToken.token;
    refreshToken.user = { id: payload.id } as any;

    const refreshTokenRepo = this.entityRouterService.getRepository<RefreshToken>(RefreshToken);
    await refreshTokenRepo.save(refreshToken);

    return {
      token: refreshToken.token,
      expiresIn: this.expiryToSeconds(expiresIn),
    };
  }

  async refreshTokens(refreshToken: string) {
    const tokenEntity = await this.validateRefreshToken(refreshToken);
    const { user, token: currentToken } = tokenEntity;

    const now = new Date();
    const expiresSoon =
      tokenEntity.expiresAt.getTime() - now.getTime() < 1000 * 60 * 60 * 24;

    if (expiresSoon) {
      await this.revokeRefreshToken(refreshToken);
      return this.generateTokens({
        id: user.id,
        isActive: user.isActive,
      });
    }

    const accessToken = await this.generateAccessToken({
      id: user.id,
      isActive: user.isActive,
    });

    const refreshTokenRepo = this.entityRouterService.getRepository<RefreshToken>(RefreshToken);
    await refreshTokenRepo.update(
      { token: currentToken },
      { lastToken: accessToken.token },
    );

    const jwt = this.configService.get('jwt');

    const expiresIn = jwt.refreshTokenExpiry;

    return {
      accessToken,
      refreshToken: {
        token: currentToken,
        expiresIn: this.expiryToSeconds(expiresIn),
      },
    };
  }

  async validateRefreshToken(token: string): Promise<RefreshToken> {
    const refreshTokenRepo = this.entityRouterService.getRepository<RefreshToken>(RefreshToken);
    const tokenEntity = await refreshTokenRepo.findOne({
      where: { token },
      relations: ['user'],
    });

    if (
      !tokenEntity ||
      tokenEntity.revoked ||
      tokenEntity.expiresAt < new Date()
    ) {
      throw new BadRequestException('Invalid refresh token');
    }

    return tokenEntity;
  }

  async isTokenInvalidated(token: string): Promise<boolean> {
    const refreshTokenRepo = this.entityRouterService.getRepository<RefreshToken>(RefreshToken);
    const tokenEntity = await refreshTokenRepo.findOne({
      where: { lastToken: token },
    });

    return tokenEntity?.revoked === true;
  }

  async revokeRefreshToken(token: string): Promise<void> {
    const refreshTokenRepo = this.entityRouterService.getRepository<RefreshToken>(RefreshToken);
    await refreshTokenRepo.update({ token }, { revoked: true });
  }

  async invalidateAllTokens(userId: string): Promise<void> {
    const refreshTokenRepo = this.entityRouterService.getRepository<RefreshToken>(RefreshToken);
    await refreshTokenRepo.update(
      { user: { id: userId } as any },
      { revoked: true },
    );
  }

  async invalidateToken(token: string): Promise<void> {
    const refreshTokenRepo = this.entityRouterService.getRepository<RefreshToken>(RefreshToken);
    await refreshTokenRepo.update({ lastToken: token }, { revoked: true });
  }

  private parseExpiryString(expiry: string): { value: number; unit: string } {
    const match = expiry.match(/^(\d+)([smhdw])$/);
    if (!match) throw new Error('Invalid expiry format');
    return { value: parseInt(match[1]), unit: match[2] };
  }

  private expiryToSeconds(expiry: string): number {
    const { value, unit } = this.parseExpiryString(expiry);
    const multipliers = {
      s: 1,
      m: 60,
      h: 60 * 60,
      d: 60 * 60 * 24,
      w: 60 * 60 * 24 * 7,
    };
    return value * (multipliers[unit] || 1);
  }

  private expiryToDate(expiry: string): Date {
    const seconds = this.expiryToSeconds(expiry);
    const date = new Date();
    date.setSeconds(date.getSeconds() + seconds);
    return date;
  }

  @Cron(CronExpression.EVERY_DAY_AT_MIDNIGHT)
  async cleanupExpiredTokens() {
    this.logger.log('🧹 Starting expired tokens cleanup...');

    const jwt = this.configService.get('jwt');
    const days = jwt.refreshTokenCleanupDays || 15;
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - days);

    let totalCleaned = 0;

    // First, clean up tokens from main database (platform-level tokens without tenantId)
    const mainResult = await this.cleanupTokensForTenant(null, cutoffDate);
    totalCleaned += mainResult;

    // Get all businesses with tenantId from main database
    const businesses = await this.businessRepository.find({
      where: { tenantId: Not(IsNull()) },
      select: ['id', 'tenantId', 'name'],
    });

    this.logger.log(`Found ${businesses.length} business tenant(s) to check for expired tokens`);

    // Loop through each tenant and cleanup their tokens
    for (const business of businesses) {
      const tenantResult = await this.cleanupTokensForTenant(business.tenantId, cutoffDate);
      totalCleaned += tenantResult;
    }

    this.logger.log(`✅ Cleaned up ${totalCleaned} expired/revoked tokens across all tenants`);
  }

  /**
   * Clean up expired tokens for a specific tenant
   * @param tenantId - Tenant ID (null for main database)
   * @param cutoffDate - Date before which tokens should be deleted
   */
  private async cleanupTokensForTenant(
    tenantId: string | null,
    cutoffDate: Date,
  ): Promise<number> {
    const tenantLabel = tenantId ? `tenant ${tenantId}` : 'main database';

    // Execute within RequestContext.run() to set proper tenant context
    return await RequestContext.run(async () => {
      if (tenantId) {
        RequestContext.set('tenantId', tenantId);
      }

      try {
        const refreshTokenRepo = this.entityRouterService.getRepository<RefreshToken>(RefreshToken);
        const result = await refreshTokenRepo
          .createQueryBuilder()
          .delete()
          .where('expiresAt < :date', { date: cutoffDate })
          .orWhere('revoked = true')
          .execute();

        const cleaned = result.affected || 0;
        if (cleaned > 0) {
          this.logger.log(`Cleaned up ${cleaned} expired/revoked tokens in ${tenantLabel}`);
        }

        return cleaned;
      } catch (error) {
        this.logger.error(`Failed to cleanup tokens for ${tenantLabel}: ${error.message}`);
        return 0;
      }
    });
  }
}
