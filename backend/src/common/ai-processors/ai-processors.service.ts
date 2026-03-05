import {
  Injectable,
  NotFoundException,
  ConflictException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { ModuleRef } from '@nestjs/core';
import { CrudService } from '@/common/crud/crud.service';
import { AIProcessor } from './entities/ai-processor.entity';
import {
  CreateAIProcessorDto,
  UpdateAIProcessorDto,
} from '@shared/dtos/ai-processors-dtos';
import { CrudOptions } from '@/common/crud/interfaces/crud.interface';
import { EAIProcessorType } from '@shared/enums';

@Injectable()
export class AIProcessorsService extends CrudService<AIProcessor> {
  constructor(
    @InjectRepository(AIProcessor)
    private readonly aiProcessorRepository: Repository<AIProcessor>,
    moduleRef: ModuleRef,
  ) {
    const crudOptions: CrudOptions = {
      restrictedFields: [],
      searchableFields: ['type', 'description'],
      superAdminOwnDataOnly: false,
    };
    super(aiProcessorRepository, moduleRef, crudOptions);
  }

  getRepository(): Repository<AIProcessor> {
    return this.aiProcessorRepository;
  }

  async createAIProcessor(createDto: CreateAIProcessorDto) {
    const repo = this.getRepository();
    const existing = await repo.findOne({ where: { type: createDto.type } });
    if (existing) {
      throw new ConflictException('AI processor type already exists');
    }
    return this.create(createDto);
  }

  async updateAIProcessor(id: string, updateDto: UpdateAIProcessorDto) {
    const repo = this.getRepository();
    const processor = await repo.findOne({ where: { id } });
    if (!processor) {
      throw new NotFoundException('AI processor not found');
    }
    if (updateDto.type && updateDto.type !== processor.type) {
      const existing = await repo.findOne({ where: { type: updateDto.type } });
      if (existing) {
        throw new ConflictException('AI processor type already exists');
      }
    }
    return this.update(id, updateDto);
  }

  async isAIProcessorEnabled(processorKey: EAIProcessorType): Promise<boolean> {
    const processor = await this.getSingle({ type: processorKey });
    return processor?.enabled ?? false;
  }
}
