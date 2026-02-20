import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { ModuleRef } from '@nestjs/core';

import { Equipment } from '../entities/equipment.entity';
import { CreateEquipmentDto, UpdateEquipmentDto } from '@shared/dtos';
import { CrudService } from '@/common/crud/crud.service';
import { CrudOptions } from '@/common/crud/interfaces/crud.interface';
import { IMessageResponse } from '@shared/interfaces';
import { EquipmentTypesService } from './equipment-types.service';
import { EquipmentType } from '../entities/equipment-type.entity';
import { LocationsService } from '../../locations/services/locations.service';

@Injectable()
export class EquipmentService extends CrudService<Equipment> {
  constructor(
    @InjectRepository(Equipment)
    private readonly equipmentRepo: Repository<Equipment>,
    private readonly equipmentTypesService: EquipmentTypesService,
    private readonly locationsService: LocationsService,
    moduleRef: ModuleRef,
  ) {
    const crudOptions: CrudOptions = {
      restrictedFields: [],
      searchableFields: ['name', 'description', 'serialNumber'],
    };
    super(equipmentRepo, moduleRef, crudOptions);
  }

  
  async createEquipment(
    createEquipmentDto: CreateEquipmentDto,
  ): Promise<IMessageResponse & { equipment: Equipment }> {


    // Validate equipment type exists
    const equipmentType = await this.equipmentTypesService.getSingle(
      createEquipmentDto.equipmentType.id,
    );
    if (!equipmentType) {
      throw new NotFoundException('Equipment type not found');
    }

    const equipment = await this.create(createEquipmentDto);
    return {
      message: 'Equipment created successfully',
      equipment: equipment as Equipment,
    };
  }

  async updateEquipment(
    id: string,
    updateEquipmentDto: UpdateEquipmentDto,
  ): Promise<IMessageResponse & { equipment: Equipment }> {
    let equipmentType: EquipmentType | undefined = undefined;
    if (updateEquipmentDto.equipmentType?.id) {
      equipmentType = await this.equipmentTypesService.getSingle(
        updateEquipmentDto.equipmentType.id,
      ) as EquipmentType;
      if (!equipmentType) {
        throw new NotFoundException('Equipment type not found');
      }
    }

    if (updateEquipmentDto.location?.id) {
      const location = await this.locationsService.getSingle(updateEquipmentDto.location.id);
      if (!location) {
        throw new NotFoundException('Location not found');
      }
    }

    const equipment = await this.update(id, {
      ...updateEquipmentDto,
      equipmentTypeId: equipmentType?.id !== undefined ? equipmentType.id : undefined,
      ...(updateEquipmentDto.location?.id
        ? { locationId: updateEquipmentDto.location.id }
        : updateEquipmentDto.location === null
          ? { locationId: null }
          : {}),
    });
    return {
      message: 'Equipment updated successfully',
      equipment: equipment as Equipment,
    };
  }
}
