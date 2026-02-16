import { LoggerService } from '@/common/logger/logger.service';
import { Injectable } from '@nestjs/common';
import { DataSource } from 'typeorm';
import { Resource } from '../entities/resource.entity';
import { EResource } from '@shared/enums';

interface ResourceConfig {
  name: EResource;
  displayName: string;
  description: string;
}

@Injectable()
export class ResourceSeed {
  private readonly logger = new LoggerService(ResourceSeed.name);
  constructor(
    private readonly dataSource: DataSource,
  ) {}

  private readonly resourceConfigs: ResourceConfig[] = [
    {
      name: EResource.SESSIONS,
      displayName: 'Sessions',
      description: 'Session management and scheduling',
    },
    {
      name: EResource.TASKS,
      displayName: 'Tasks',
      description: 'Task management and assignment',
    },
    {
      name: EResource.CHECKINS,
      displayName: 'Check-ins',
      description: 'Member check-in management',
    },
    {
      name: EResource.BILLINGS,
      displayName: 'Billings',
      description: 'Billing and payment management',
    },
    {
      name: EResource.MEMBERSHIPS,
      displayName: 'Memberships',
      description: 'Membership plans and subscriptions',
    },
    {
      name: EResource.MEMBERS,
      displayName: 'Members',
      description: 'Member management',
    },
    {
      name: EResource.STAFF,
      displayName: 'Staff',
      description: 'Staff and trainer management',
    },
    {
      name: EResource.VIDEO_STREAM,
      displayName: 'Video Stream',
      description: 'Video streaming and camera management',
    },
    {
      name: EResource.ADVERTISEMENTS,
      displayName: 'Advertisements',
      description: 'Advertisement management',
    },
    {
      name: EResource.BANNER_SERVICE,
      displayName: 'Banner Service',
      description: 'Banner image management',
    },
    {
      name: EResource.FACILITY_INFO,
      displayName: 'Facility Info',
      description: 'Facility information management',
    },
    {
      name: EResource.DEVICE_READERS,
      displayName: 'Device Readers',
      description: 'Device reader management',
    },
    {
      name: EResource.LOCATIONS,
      displayName: 'Locations',
      description: 'Location management',
    },
    {
      name: EResource.EQUIPMENT,
      displayName: 'Equipment',
      description: 'Equipment management',
    },
    {
      name: EResource.EQUIPMENT_RESERVATIONS,
      displayName: 'Equipment Reservations',
      description: 'Equipment reservation management',
    },
    {
      name: EResource.EMAIL_TEMPLATES,
      displayName: 'Email Templates',
      description: 'Email template management',
    },
    {
      name: EResource.PAGES,
      displayName: 'Pages',
      description: 'CMS page management',
    },
    {
      name: EResource.FAQS,
      displayName: 'FAQs',
      description: 'FAQ management',
    },
    {
      name: EResource.CHAT,
      displayName: 'Chat',
      description: 'Chat and messaging management',
    },
    {
      name: EResource.SERVICE_OFFERS,
      displayName: 'Service Offers',
      description: 'Service offer management',
    },
  ];

  async run(dataSource?: DataSource): Promise<void> {
    const targetDataSource = dataSource || this.dataSource;
    this.logger.log('🌱 Starting resource seeding...');

    const resourceRepository = targetDataSource.getRepository(Resource);

    let totalCreated = 0;
    let totalSkipped = 0;
    let totalErrors = 0;

    // Create resources from enum config
    for (const config of this.resourceConfigs) {
      try {
        const existingResource = await resourceRepository.findOne({
          where: { name: config.name },
        });

        if (existingResource) {
          this.logger.log(`Resource already exists: ${config.name}`);
          totalSkipped++;
        } else {
          const resource = resourceRepository.create({
            name: config.name,
            displayName: config.displayName,
            description: config.description,
            isActive: true,
          });
          await resourceRepository.save(resource);
          this.logger.log(`Created resource: ${config.name}`);
          totalCreated++;
        }
      } catch (error: unknown) {
        this.logger.error(
          `Error creating resource ${config.name}:`,
          error instanceof Error ? error.message : String(error),
        );
        totalErrors++;
      }
    }

    this.logger.log(
      `✅ Resource seeding completed. Created: ${totalCreated}, Skipped: ${totalSkipped}, Errors: ${totalErrors}`,
    );
  }
}
