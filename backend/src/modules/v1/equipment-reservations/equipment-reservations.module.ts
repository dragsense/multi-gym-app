import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { EquipmentType } from './entities/equipment-type.entity';
import { Equipment } from './entities/equipment.entity';
import { EquipmentReservation } from './entities/equipment-reservation.entity';
import { EquipmentTypesService } from './services/equipment-types.service';
import { EquipmentService } from './services/equipment.service';
import { EquipmentReservationsService } from './services/equipment-reservations.service';
import { EquipmentTypesController } from './controllers/equipment-types.controller';
import { EquipmentController } from './controllers/equipment.controller';
import { EquipmentReservationsController } from './controllers/equipment-reservations.controller';
import { CrudModule } from '@/common/crud/crud.module';
import { LocationsModule } from '../locations/locations.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([EquipmentType, Equipment, EquipmentReservation]),
    CrudModule,
    LocationsModule,
  ],
  controllers: [
    EquipmentTypesController,
    EquipmentController,
    EquipmentReservationsController,
  ],
  providers: [
    EquipmentTypesService,
    EquipmentService,
    EquipmentReservationsService,
  ],
  exports: [
    EquipmentTypesService,
    EquipmentService,
    EquipmentReservationsService,
  ],
})
export class EquipmentReservationsModule {}
