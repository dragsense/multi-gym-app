import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';

import { CrudModule } from '@/common';

import { EmailTemplate } from './entities/email-template.entity';
import { Page } from './entities/page.entity';
import { Faq } from './entities/faq.entity';

import { EmailTemplateService } from './services/email-template.service';
import { PageService } from './services/page.service';
import { FaqService } from './services/faq.service';
import { TemplateRendererService } from './services/template-renderer.service';

import { EmailTemplateController } from './controllers/email-template.controller';
import { PageController } from './controllers/page.controller';
import { FaqController } from './controllers/faq.controller';
import { PageSeed } from './seeder/page.seed';

@Module({
  imports: [
    TypeOrmModule.forFeature([EmailTemplate, Page, Faq]),
    CrudModule,
  ],
  controllers: [EmailTemplateController, PageController, FaqController],
  providers: [
    EmailTemplateService,
    PageService,
    FaqService,
    TemplateRendererService,
    PageSeed,
  ],
  exports: [
    EmailTemplateService,
    PageService,
    FaqService,
    TemplateRendererService,
    PageSeed,
  ],
})
export class CmsModule {}
