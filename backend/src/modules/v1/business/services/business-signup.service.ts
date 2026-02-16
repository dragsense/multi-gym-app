import { Injectable, NotFoundException } from '@nestjs/common';
import { BusinessService } from '../business.service';
import { Business } from '../entities/business.entity';
import { LoggerService } from '@/common/logger/logger.service';

@Injectable()
export class BusinessSignupService {
  private readonly logger = new LoggerService(BusinessSignupService.name);

  constructor(private readonly businessService: BusinessService) {}

  /**
   * Extract subdomain from hostname
   * e.g., 'mygym.example.com' -> 'mygym'
   * @param hostname - Full hostname from request
   * @returns Subdomain string or null
   */
  extractSubdomain(hostname: string): string | null {
    if (!hostname) {
      return null;
    }

    // Remove port if present
    const hostWithoutPort = hostname.split(':')[0].toLowerCase();

    // If it's localhost or IP address, return null
    if (hostWithoutPort === 'localhost' || /^\d+\.\d+\.\d+\.\d+$/.test(hostWithoutPort)) {
      return null;
    }

    // Split by dots
    const parts = hostWithoutPort.split('.');

    // If it has 2 or fewer parts, it's the main domain (no subdomain)
    if (parts.length <= 2) {
      return null;
    }

    // If it starts with 'www.', treat as main domain
    if (parts[0] === 'www' && parts.length === 3) {
      return null;
    }

    // Extract subdomain (first part before the main domain)
    // e.g., 'mygym.example.com' -> 'mygym'
    // e.g., 'app.mybusiness.example.com' -> 'app.mybusiness'
    // For simplicity, we'll take the first part as subdomain
    return parts[0];
  }

  /**
   * Validate that a business exists for the given subdomain
   * @param hostname - Full hostname from request
   * @returns Business entity if found
   * @throws NotFoundException if business doesn't exist
   */
  async validateBusinessForSubdomain(hostname: string): Promise<Business> {
    const subdomain = this.extractSubdomain(hostname);

    if (!subdomain) {
      throw new NotFoundException('No subdomain found in the request');
    }

    const business = await this.businessService.findBySubdomain(subdomain);

    if (!business) {
      this.logger.warn(`Business not found for subdomain: ${subdomain}`);
      throw new NotFoundException(
        `No business found for subdomain "${subdomain}". Please contact support or sign up on the main domain.`,
      );
    }

    return business;
  }
}
