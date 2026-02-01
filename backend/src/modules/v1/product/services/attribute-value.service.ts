import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, EntityManager } from 'typeorm';
import { ModuleRef } from '@nestjs/core';
import { AttributeValue } from '../entities/attribute-value.entity';
import {
  CreateAttributeValueDto,
  UpdateAttributeValueDto,
} from '@shared/dtos';
import { CrudService } from '@/common/crud/crud.service';
import { CrudOptions } from '@/common/crud/interfaces/crud.interface';
import { AttributeService } from './attribute.service';
@Injectable()
export class AttributeValueService extends CrudService<AttributeValue> {
  constructor(
    @InjectRepository(AttributeValue)
    attributeValueRepo: Repository<AttributeValue>,
    private readonly attributeService: AttributeService,
    moduleRef: ModuleRef,
  ) {
    const crudOptions: CrudOptions = {
      searchableFields: ['value'],
    };
    super(attributeValueRepo, moduleRef, crudOptions);
  }

  async createAttributeValue(createDto: CreateAttributeValueDto) {

    if(!createDto.attribute.id) throw new BadRequestException('Attribute ID is required');

    const attribute = await this.attributeService.getSingle(createDto.attribute.id);
    
    if (!attribute) throw new NotFoundException('Attribute not found');

    // Split comma-separated values and trim whitespace
    const values = createDto.value
      .split(',')
      .map(v => v.trim())
      .filter(v => v.length > 0);

    if (values.length === 0) {
      throw new BadRequestException('At least one value is required');
    }

    // If only one value, create it directly
    if (values.length === 1) {
      const payload = { 
        value: values[0], 
        description: createDto.description,
        attribute 
      };
      return this.create(payload as any);
    }

    // If multiple values, create them all in a transaction
    const firstPayload = { 
      value: values[0], 
      description: createDto.description,
      attribute 
    };
    
    return this.create(firstPayload as any, {
      afterCreate: async (firstCreated: AttributeValue, manager: EntityManager) => {
        // Create remaining values in the same transaction
        const remainingValues = values.slice(1);
        
        for (const value of remainingValues) {
          const payload = { 
            value, 
            description: createDto.description,
            attribute 
          };
          const entity = this.getRepository().create(payload);
          await manager.save(entity);
        }
        
        // Return the first created value for API compatibility
        // All values are created in the same transaction
        return firstCreated;
      },
    });
  }

  async updateAttributeValue(id: string, updateDto: UpdateAttributeValueDto) {
    let payload: any = { 
      value: updateDto.value,
      ...(updateDto.description !== undefined && { description: updateDto.description })
    };
    return this.update(id, payload);
  }
}
