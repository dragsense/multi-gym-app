import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { ModuleRef } from '@nestjs/core';

import { Page } from '../entities/page.entity';
import {
  CreatePageDto,
  UpdatePageDto,
  PageListDto,
} from '@shared/dtos';
import { CrudService } from '@/common/crud/crud.service';
import { CrudOptions } from '@/common/crud/interfaces/crud.interface';

@Injectable()
export class PageService extends CrudService<Page> {
  constructor(
    @InjectRepository(Page)
    private readonly pageRepo: Repository<Page>,
    moduleRef: ModuleRef,
  ) {
    const crudOptions: CrudOptions = {
      searchableFields: ['title', 'slug', 'description'],
    };
    super(pageRepo, moduleRef, crudOptions);
  }

  async createPage(createDto: CreatePageDto): Promise<Page> {
    // Check if slug already exists
    const repository = this.getRepository();
    const existing = await repository.findOne({
      where: { slug: createDto.slug },
    });

    if (existing) {
      throw new BadRequestException(
        `Page with slug "${createDto.slug}" already exists`,
      );
    }

    const pageData: any = {
      ...createDto,
      publishedAt: createDto.isPublished ? new Date() : null,
    };

    return this.create<CreatePageDto>(pageData);
  }

  async updatePage(id: string, updateDto: UpdatePageDto): Promise<Page> {
    const page = await this.getSingle(id);

    if (!page) {
      throw new NotFoundException(`Page with ID ${id} not found`);
    }

    // Prevent slug changes for system pages
    if (page.isSystem && updateDto.slug && updateDto.slug !== page.slug) {
      throw new BadRequestException(
        `Cannot change slug for system page "${page.title}"`,
      );
    }

    // Check if slug is being changed and if it conflicts
    if (updateDto.slug && updateDto.slug !== page.slug) {
      const repository = this.getRepository();
      const existing = await repository.findOne({
        where: { slug: updateDto.slug },
      });

      if (existing) {
        throw new BadRequestException(
          `Page with slug "${updateDto.slug}" already exists`,
        );
      }
    }

    // Handle publication
    const pageData: any = { ...updateDto };
    if (updateDto.isPublished !== undefined) {
      if (updateDto.isPublished && !page.publishedAt) {
        pageData.publishedAt = new Date();
      } else if (!updateDto.isPublished) {
        pageData.publishedAt = null;
      }
    }

    return this.update(id, pageData);
  }

  async getBySlug(slug: string): Promise<Page | null> {
    const repository = this.getRepository();
    return repository.findOne({
      where: { slug, isPublished: true },
    });
  }

  async deletePage(id: string): Promise<void> {
    const page = await this.getSingle(id);

    if (!page) {
      throw new NotFoundException(`Page with ID ${id} not found`);
    }

    // Prevent deletion of system pages
    if (page.isSystem) {
      throw new BadRequestException(
        `Cannot delete system page "${page.title}"`,
      );
    }

    await this.delete(id);
  }
}
