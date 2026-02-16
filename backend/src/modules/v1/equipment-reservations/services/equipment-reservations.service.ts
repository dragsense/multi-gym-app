import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Between, Not, Repository } from 'typeorm';
import { ModuleRef } from '@nestjs/core';

import { EquipmentReservation } from '../entities/equipment-reservation.entity';
import { CreateEquipmentReservationDto, UpdateEquipmentReservationDto } from '@shared/dtos';
import { CrudService } from '@/common/crud/crud.service';
import { CrudOptions } from '@/common/crud/interfaces/crud.interface';
import { IMessageResponse } from '@shared/interfaces';
import { EquipmentService } from './equipment.service';
import { Equipment } from '../entities/equipment.entity';
import { EEquipmentStatus } from '@shared/enums';

@Injectable()
export class EquipmentReservationsService extends CrudService<EquipmentReservation> {
  constructor(
    @InjectRepository(EquipmentReservation)
    private readonly reservationRepo: Repository<EquipmentReservation>,
    private readonly equipmentService: EquipmentService,
    moduleRef: ModuleRef,
  ) {
    const crudOptions: CrudOptions = {
      restrictedFields: ['user.password'],
      searchableFields: [
        'equipment.name',
        'notes',
      ],
    };
    super(reservationRepo, moduleRef, crudOptions);
  }

  async createReservation(
    createReservationDto: CreateEquipmentReservationDto,
  ): Promise<IMessageResponse & { equipmentReservation: EquipmentReservation }> {
    // Validate equipment exists
    const equipment = await this.equipmentService.getSingle(createReservationDto.equipment.id);
    if (!equipment) {
      throw new NotFoundException('Equipment not found');
    }

    if (equipment.status !== EEquipmentStatus.AVAILABLE) {
      throw new BadRequestException('Equipment is not available for reservation');
    }

    // Check for overlapping reservations
    const startDate = new Date(createReservationDto.startDateTime);
    const endDate = new Date(createReservationDto.endDateTime);

    const resevationRepo = this.getRepository();
    // Check for any overlapping reservations
    const overlapping = await resevationRepo
      .createQueryBuilder('reservation')
      .where('reservation.equipmentId = :equipmentId', { equipmentId: createReservationDto.equipment.id })
      .andWhere(
        '(reservation.startDateTime <= :endDate AND reservation.endDateTime >= :startDate)',
        { startDate, endDate }
      )
      .getOne();

    if (overlapping) {
      throw new BadRequestException('Equipment is already reserved for this time period');
    }

    const reservation = await this.create(createReservationDto);

    return {
      message: 'Equipment reservation created successfully',
      equipmentReservation: reservation as EquipmentReservation,
    };
  }

  async updateReservation(
    id: string,
    updateReservationDto: UpdateEquipmentReservationDto,
  ): Promise<IMessageResponse & { equipmentReservation: EquipmentReservation }> {
    let equipment: Equipment | undefined = undefined;

    // Validate equipment if provided
    if (updateReservationDto.equipment?.id) {
      equipment = await this.equipmentService.getSingle(updateReservationDto.equipment.id) as Equipment;
      if (!equipment) {
        throw new NotFoundException('Equipment not found');
      }
    }

    // Check for overlapping reservations if dates are updated
    if (updateReservationDto.startDateTime || updateReservationDto.endDateTime || equipment?.id) {
      const existing = await this.getSingle(id);
      if (!existing) {
        throw new NotFoundException('Reservation not found');
      }

      const startDate = new Date(updateReservationDto.startDateTime || existing.startDateTime);
      const endDate = new Date(updateReservationDto.endDateTime || existing.endDateTime);

      const overlapping = await this.getRepository().findOne({
        where: {
          equipmentId: equipment?.id !== undefined ? equipment.id : existing.equipmentId,
          id: Not(id),
          startDateTime: Between(startDate, endDate),
        },
      });

      if (overlapping) {
        throw new BadRequestException('Equipment is already reserved for this time period');
      }
    }

    const reservation = await this.update(id, {
      ...updateReservationDto,
      equipment: equipment?.id !== undefined ? { id: equipment.id } : undefined,
    });
    return {
      message: 'Equipment reservation updated successfully',
      equipmentReservation: reservation as EquipmentReservation,
    };
  }
}
