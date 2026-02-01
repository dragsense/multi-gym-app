import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { ModuleRef } from '@nestjs/core';

import { EmailTemplate } from '../entities/email-template.entity';
import {
  CreateEmailTemplateDto,
  UpdateEmailTemplateDto,
  EmailTemplateListDto,
} from '@shared/dtos';
import { CrudService } from '@/common/crud/crud.service';
import { CrudOptions } from '@/common/crud/interfaces/crud.interface';

@Injectable()
export class EmailTemplateService extends CrudService<EmailTemplate> {
  constructor(
    @InjectRepository(EmailTemplate)
    private readonly emailTemplateRepo: Repository<EmailTemplate>,
    moduleRef: ModuleRef,
  ) {
    const crudOptions: CrudOptions = {
      searchableFields: ['name', 'identifier', 'subject', 'description'],
    };
    super(emailTemplateRepo, moduleRef, crudOptions);
  }

  async createTemplate(
    createDto: CreateEmailTemplateDto,
  ): Promise<EmailTemplate> {
    // Check if identifier already exists
    const repository = this.getRepository();
    const existing = await repository.findOne({
      where: { identifier: createDto.identifier },
    });

    if (existing) {
      throw new BadRequestException(
        `Template with identifier "${createDto.identifier}" already exists`,
      );
    }

    return this.create<CreateEmailTemplateDto>(createDto);
  }

  async updateTemplate(
    id: string,
    updateDto: UpdateEmailTemplateDto,
  ): Promise<EmailTemplate> {
    const template = await this.getSingle(id);

    if (!template) {
      throw new NotFoundException(`Template with ID ${id} not found`);
    }

    // Check if identifier is being changed and if it conflicts
    if (updateDto.identifier && updateDto.identifier !== template.identifier) {
      const repository = this.getRepository();
      const existing = await repository.findOne({
        where: { identifier: updateDto.identifier },
      });

      if (existing) {
        throw new BadRequestException(
          `Template with identifier "${updateDto.identifier}" already exists`,
        );
      }
    }

    return this.update(id, updateDto);
  }

  async getByIdentifier(identifier: string): Promise<EmailTemplate | null> {
    const repository = this.getRepository();
    return repository.findOne({
      where: { identifier, isActive: true },
    });
  }
}
