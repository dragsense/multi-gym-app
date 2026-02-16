import { Injectable, OnModuleInit } from '@nestjs/common';
import { DataSource } from 'typeorm';
import { PaymentProcessorsSeed } from '../common/payment-processors/seeder/payment-processors.seed';
import { UserSeed } from '../common/base-user/seeder/user.seed';
import { ResourceSeed } from '../common/roles/seeder/resource.seed';
import { PageSeed } from '../modules/v1/cms/seeder/page.seed';
import { LoggerService } from '../common/logger/logger.service';
import { PermissionSeed } from '@/common/roles/seeder/permission.seed';

@Injectable()
export class SeedRunnerService implements OnModuleInit {
  private readonly logger = new LoggerService(SeedRunnerService.name);
  constructor(
    private paymentProcessorsSeed: PaymentProcessorsSeed,
    private userSeed: UserSeed,
    private resourceSeed: ResourceSeed,
    private pageSeed: PageSeed,
    private permissionSeed: PermissionSeed,
  ) {}

  /**
   * Run all seeds.
   *
   * - If `dataSource` is provided (tenant connection): runs only DB-level seeds that support a DataSource
   *   (resources + permissions) against that tenant connection.
   * - If `dataSource` is not provided (system): runs the full seed suite on the default connection.
   */
  public async runAllSeeds(dataSource?: DataSource, tenantId?: string): Promise<void> {
    const scope = tenantId ? `tenant:${tenantId}` : dataSource ? 'tenant' : 'system';
    this.logger.log(`Starting database seeding (${scope})...`);

    try {
      
        // Tenant seeding (DataSource-aware seeds only)
        await this.resourceSeed.run(dataSource);
        await this.permissionSeed.run(dataSource);
        await this.paymentProcessorsSeed.run(dataSource);
        await this.pageSeed.run(dataSource);
 
        await this.userSeed.run();
      

      this.logger.log(`Database seeding completed successfully (${scope})!`);
    } catch (error: unknown) {
      this.logger.error(
        `Error during database seeding (${scope}):`,
        error instanceof Error ? error.message : String(error),
      );
    }
  }

  async onModuleInit() {
    await this.runAllSeeds();
  }
}
