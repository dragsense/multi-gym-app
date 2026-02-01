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

import { DoorsService } from '../services/doors.service';
import {
  CreateDoorDto,
  UpdateDoorDto,
  DoorListDto,
  DoorPaginatedDto,
  DoorDto,
  SingleQueryDto,
} from '@shared/dtos';
import { Door } from '../entities/door.entity';
import { AuthUser } from '@/decorators/user.decorator';
import { User } from '@/common/base-user/entities/user.entity';
import { EUserLevels } from '@shared/enums';
import { IMessageResponse } from '@shared/interfaces';
import { MinUserLevel } from '@/decorators/level.decorator';
import { NotFoundException } from '@nestjs/common';

@ApiBearerAuth('access-token')
@ApiTags('Doors')
@MinUserLevel(EUserLevels.ADMIN)
@Controller('doors')
export class DoorsController {
  constructor(private readonly doorsService: DoorsService) { }

  @ApiOperation({ summary: 'Get all doors with pagination and filtering' })
  @ApiResponse({
    status: 200,
    description: 'Returns paginated list of doors',
    type: DoorPaginatedDto,
  })
  @Get()
  findAll(@Query() query: DoorListDto) {
    return this.doorsService.get(query, DoorListDto);
  }

  @ApiOperation({ summary: 'Get doors by location ID' })
  @ApiParam({ name: 'locationId', description: 'Location ID', required: true })
  @ApiResponse({
    status: 200,
    description: 'Returns paginated list of doors for a location',
    type: DoorPaginatedDto,
  })
  @Get('by-location/:locationId')
  findByLocation(
    @Param('locationId') locationId: string,
    @Query() query: DoorListDto,
  ) {
    console.log('locationId', locationId);
    return this.doorsService.get(query,
      DoorListDto,
      {
        beforeQuery: (query) => {
          query.andWhere('entity.locationId = :locationId', { locationId });
          return query;
        },
      }
    );
  }

  @ApiOperation({ summary: 'Get door by ID' })
  @ApiParam({ name: 'id', description: 'Door ID' })
  @ApiResponse({
    status: 200,
    description: 'Returns door by ID',
    type: DoorDto,
  })
  @ApiResponse({ status: 404, description: 'Door not found' })
  @Get(':id')
  async findOne(
    @Param('id') id: string,
    @Query() query: SingleQueryDto<Door>,
  ) {
    const door = await this.doorsService.getSingle(id, query);
    if (!door) throw new NotFoundException('Door not found');
    return door;
  }

  @ApiOperation({ summary: 'Add a new door' })
  @ApiBody({
    type: CreateDoorDto,
    description: 'Create a new door',
  })
  @ApiResponse({ status: 201, description: 'Door created successfully' })
  @Post()
  create(
    @Body() createDoorDto: CreateDoorDto,
    @AuthUser() currentUser: User,
  ) {
    return this.doorsService.create(createDoorDto);
  }

  @ApiOperation({ summary: 'Update door by ID' })
  @ApiParam({ name: 'id', description: 'Door ID' })
  @ApiBody({
    type: UpdateDoorDto,
    description: 'Update door information',
  })
  @ApiResponse({ status: 200, description: 'Door updated successfully' })
  @ApiResponse({ status: 404, description: 'Door not found' })
  @Patch(':id')
  update(
    @Param('id') id: string,
    @Body() updateDoorDto: UpdateDoorDto,
    @AuthUser() currentUser: User,
  ) {
    return this.doorsService.update(id, updateDoorDto);
  }

  @ApiOperation({ summary: 'Delete door by ID' })
  @ApiParam({
    name: 'id',
    description: 'Door ID',
  })
  @ApiResponse({ status: 200, description: 'Door deleted successfully' })
  @ApiResponse({ status: 404, description: 'Door not found' })
  @Delete(':id')
  async remove(@Param('id') id: string) {
    await this.doorsService.delete(id);
    return { message: 'Door deleted successfully' };
  }
}
