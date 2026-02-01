import {
  Controller,
  Get,
  UseGuards,
  Body,
  Post,
  Patch,
  Delete,
  Param,
  Query,
} from '@nestjs/common';

import {
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
  ApiTags,
  ApiBody,
  ApiParam,
} from '@nestjs/swagger';

import { EquipmentReservationsService } from '../services/equipment-reservations.service';
import {
  CreateEquipmentReservationDto,
  UpdateEquipmentReservationDto,
  EquipmentReservationListDto,
  EquipmentReservationPaginatedDto,
  EquipmentReservationDto,
  SingleQueryDto,
} from '@shared/dtos';
import { EquipmentReservation } from '../entities/equipment-reservation.entity';
import { AuthUser } from '@/decorators/user.decorator';
import { User } from '@/common/base-user/entities/user.entity';
import { EUserLevels } from '@shared/enums';
import { ESubscriptionFeatures } from '@shared/enums/business/subscription.enum';
import { MinUserLevel } from '@/decorators/level.decorator';
import { RequireModule } from '@/decorators/require-module.decorator';
import { NotFoundException } from '@nestjs/common';
import { Resource } from '@/decorators';
import { EResource } from '@shared/enums';

@ApiBearerAuth('access-token')
@ApiTags('Equipment Reservations')
@MinUserLevel(EUserLevels.ADMIN)
@RequireModule(ESubscriptionFeatures.EQUIPMENT_RESERVATION)
@Resource(EResource.EQUIPMENT_RESERVATIONS)
@Controller('equipment-reservations')
export class EquipmentReservationsController {
  constructor(
    private readonly reservationsService: EquipmentReservationsService,
  ) {}

  @ApiOperation({ summary: 'Get all equipment reservations with pagination and filters' })
  @ApiResponse({ status: 200, type: EquipmentReservationPaginatedDto })
  @Get()
  findAll(@Query() query: EquipmentReservationListDto) {
    return this.reservationsService.get(query, EquipmentReservationListDto);
  }

  @ApiOperation({ summary: 'Get reservations for a specific user' })
  @ApiParam({ name: 'userId', description: 'User ID' })
  @ApiResponse({ status: 200, type: EquipmentReservationPaginatedDto })
  @Get('user/:userId')
  getUserReservations(
    @Query() query: EquipmentReservationListDto,
  ) {
    return this.reservationsService.get(query, EquipmentReservationListDto);
  }

  @ApiOperation({ summary: 'Get a single equipment reservation by ID' })
  @ApiParam({ name: 'id', description: 'Equipment reservation ID' })
  @ApiResponse({ status: 200, type: EquipmentReservationDto })
  @ApiResponse({ status: 404, description: 'Equipment reservation not found' })
  @Get(':id')
  async findOne(
    @Param('id') id: string,
    @Query() query: SingleQueryDto<EquipmentReservation>,
  ): Promise<EquipmentReservation> {
    const reservation = await this.reservationsService.getSingle(id, query);
    if (!reservation) {
      throw new NotFoundException(`Equipment reservation with ID ${id} not found`);
    }
    return reservation;
  }

  @ApiOperation({ summary: 'Create a new equipment reservation' })
  @ApiBody({ type: CreateEquipmentReservationDto })
  @ApiResponse({ status: 201, description: 'Equipment reservation created successfully' })
  @Post()
  create(
    @Body() createDto: CreateEquipmentReservationDto,
  ) {
    return this.reservationsService.createReservation(createDto);
  }

  @ApiOperation({ summary: 'Update an equipment reservation' })
  @ApiParam({ name: 'id', description: 'Equipment reservation ID' })
  @ApiBody({ type: UpdateEquipmentReservationDto })
  @ApiResponse({ status: 200, description: 'Equipment reservation updated successfully' })
  @Patch(':id')
  update(
    @Param('id') id: string,
    @Body() updateDto: UpdateEquipmentReservationDto,
  ) {
    return this.reservationsService.updateReservation(id, updateDto);
  }

  @ApiOperation({ summary: 'Delete an equipment reservation' })
  @ApiParam({ name: 'id', description: 'Equipment reservation ID' })
  @ApiResponse({ status: 200, description: 'Equipment reservation deleted successfully' })
  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.reservationsService.delete(id);
  }
}
