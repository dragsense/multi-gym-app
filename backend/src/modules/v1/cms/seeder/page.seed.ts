import { Injectable } from '@nestjs/common';
import { LoggerService } from '@/common/logger/logger.service';
import { DataSource } from 'typeorm';
import { Page } from '../entities/page.entity';

@Injectable()
export class PageSeed {
  private readonly logger = new LoggerService(PageSeed.name);
  constructor(
    private readonly dataSource: DataSource,
  ) {}

  async run(dataSource?: DataSource): Promise<void> {
    const targetDataSource = dataSource || this.dataSource;
    this.logger.log('🌱 Starting page seeding...');

    const defaultPages = [
      {
        title: 'Privacy Policy',
        slug: 'privacy-policy',
        description: 'Privacy Policy page',
        isPublished: true,
        publishedAt: new Date(),
        isSystem: true,
        content: {
          content: [],
          root: { props: {} },
          zones: {},
        },
      },
      {
        title: 'Terms and Conditions',
        slug: 'terms-and-conditions',
        description: 'Terms and Conditions page',
        isPublished: true,
        publishedAt: new Date(),
        isSystem: true,
        content: {
          content: [],
          root: { props: {} },
          zones: {},
        },
      },
    ];

    for (const pageData of defaultPages) {
      try {
        const repo = targetDataSource.getRepository(Page);
        const existing = await repo.findOne({ where: { slug: pageData.slug } });

        if (existing) {
          this.logger.log(`Page already exists: ${pageData.slug}, skipping...`);
          if (!existing.isSystem) {
            await repo.update(existing.id, { isSystem: true });
            this.logger.log(`Updated isSystem flag for: ${pageData.slug}`);
          }
        } else {
          await repo.save(repo.create(pageData));
          this.logger.log(`Created page: ${pageData.slug}`);
        }
      } catch (error: unknown) {
        this.logger.error(
          `Error creating page ${pageData.slug}:`,
          error instanceof Error ? error.message : String(error),
        );
      }
    }

    this.logger.log('✅ Page seeding completed!');
  }
}
