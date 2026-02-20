import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  Query,
  NotFoundException,
} from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiParam,
  ApiBody,
} from '@nestjs/swagger';

import { DeviceReadersService } from '../services/device-readers.service';
import { DeviceReader } from '../entities/device-reader.entity';
import {
  CreateDeviceReaderDto,
  UpdateDeviceReaderDto,
  DeviceReaderListDto,
  DeviceReaderPaginationDto,
  UpdateDeviceReaderStatusDto,
} from '@shared/dtos';
import { SingleQueryDto } from '@shared/dtos/common/list-query.dto';
import { IMessageResponse } from '@shared/interfaces';
import { MinUserLevel } from '@/decorators/level.decorator';
import { EUserLevels } from '@shared/enums';
import { Resource } from '@/decorators';
import { EResource } from '@shared/enums';

@ApiBearerAuth('access-token')
@ApiTags('Device Readers')
@MinUserLevel(EUserLevels.ADMIN)
@Resource(EResource.DEVICE_READERS)
@Controller('device-readers')
export class DeviceReadersController {
  constructor(private readonly deviceReadersService: DeviceReadersService) {}

  @Get()
  @ApiOperation({ summary: 'Get all device readers with pagination and filters' })
  @ApiResponse({ status: 200, type: DeviceReaderPaginationDto })
  findAll(@Query() query: DeviceReaderListDto) {
    return this.deviceReadersService.get(query, DeviceReaderListDto);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get a single device reader by ID' })
  @ApiParam({ name: 'id', description: 'Device Reader ID' })
  @ApiResponse({ status: 200, type: DeviceReader })
  @ApiResponse({ status: 404, description: 'Device reader not found' })
  async findOne(
    @Param('id') id: string,
    @Query() query: SingleQueryDto<DeviceReader>,
  ): Promise<DeviceReader> {
    const deviceReader = await this.deviceReadersService.getSingle(id, query);
    if (!deviceReader) {
      throw new NotFoundException(`Device reader with ID ${id} not found`);
    }
    return deviceReader;
  }

  @Post()
  @ApiOperation({ summary: 'Create a new device reader' })
  @ApiBody({ type: CreateDeviceReaderDto })
  @ApiResponse({ status: 201, description: 'Device reader created successfully' })
  async create(
    @Body() createDeviceReaderDto: CreateDeviceReaderDto,
  ): Promise<IMessageResponse & { deviceReader: DeviceReader }> {
    return this.deviceReadersService.createDeviceReader(createDeviceReaderDto);
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Update device reader by ID' })
  @ApiParam({ name: 'id', description: 'Device Reader ID' })
  @ApiBody({ type: UpdateDeviceReaderDto })
  @ApiResponse({ status: 200, description: 'Device reader updated successfully' })
  @ApiResponse({ status: 404, description: 'Device reader not found' })
  async update(
    @Param('id') id: string,
    @Body() updateDeviceReaderDto: UpdateDeviceReaderDto,
  ): Promise<IMessageResponse> {
    return this.deviceReadersService.updateDeviceReader(id, updateDeviceReaderDto);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Delete device reader by ID' })
  @ApiParam({ name: 'id', description: 'Device Reader ID' })
  @ApiResponse({ status: 200, description: 'Device reader deleted successfully' })
  @ApiResponse({ status: 404, description: 'Device reader not found' })
  async remove(@Param('id') id: string): Promise<IMessageResponse> {
    await this.deviceReadersService.delete(id);
    return { message: 'Device reader deleted successfully' };
  }

  @Patch('status/:id')
  @ApiOperation({ summary: 'Update device reader status' })
  @ApiParam({ name: 'id', description: 'Device Reader ID' })
  @ApiBody({ type: UpdateDeviceReaderStatusDto })
  @ApiResponse({ status: 200, description: 'Device reader status updated successfully' })
  @ApiResponse({ status: 404, description: 'Device reader not found' })
  async updateStatus(
    @Param('id') id: string,
    @Body() updateStatusDto: UpdateDeviceReaderStatusDto,
  ): Promise<IMessageResponse> {
    return this.deviceReadersService.updateDeviceReaderStatus(id, updateStatusDto);
  }
}
