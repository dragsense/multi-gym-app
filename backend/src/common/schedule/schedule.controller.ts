import {
  Controller,
  Get,
  Post,
  Patch,
  Delete,
  Body,
  Param,
  Query,
  UseGuards,
} from '@nestjs/common';
import {
  ApiOperation,
  ApiParam,
  ApiResponse,
  ApiTags,
  ApiHeader,
  ApiBearerAuth,
} from '@nestjs/swagger';
import { ScheduleService } from './schedule.service';
import {
  ScheduleListDto,
  CreateScheduleDto,
  UpdateScheduleDto,
} from '@shared/dtos/schedule-dtos/schedule.dto';
import { Timezone } from '@/decorators/timezone.decorator';
import { SingleQueryDto } from '@shared/dtos';
import { Schedule } from './entities/schedule.entity';

@ApiTags('Schedule')
@ApiBearerAuth()
@Controller('schedules')
export class ScheduleController {
  constructor(private readonly scheduleService: ScheduleService) {}

  @Get()
  @ApiOperation({ summary: 'Get all schedules with pagination and filtering' })
  @ApiResponse({ status: 200, description: 'Schedules retrieved successfully' })
  async findAll(@Query() queryDto: ScheduleListDto) {
    return await this.scheduleService.get(queryDto, ScheduleListDto);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get schedule by ID' })
  @ApiParam({ name: 'id', type: 'string' })
  @ApiResponse({ status: 200, description: 'Schedule retrieved successfully' })
  @ApiResponse({ status: 404, description: 'Schedule not found' })
  async findOne(
    @Param('id') id: string,
    @Query() queryDto: SingleQueryDto<Schedule>,
  ) {
    return await this.scheduleService.getSingle(id, queryDto);
  }

  @Post()
  @ApiOperation({ summary: 'Create schedule' })
  @ApiHeader({
    name: 'X-Timezone',
    description: 'User timezone (e.g., America/New_York)',
    required: false,
  })
  @ApiResponse({ status: 201, description: 'Schedule created successfully' })
  @ApiResponse({ status: 400, description: 'Invalid schedule configuration' })
  async createSchedule(
    @Body() createDto: CreateScheduleDto,
    @Timezone() timezone: string,
  ) {
    const schedule = await this.scheduleService.createSchedule(
      createDto,
      timezone,
    );
    return { message: 'Schedule created successfully', data: schedule };
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Update schedule' })
  @ApiParam({ name: 'id', type: 'string' })
  @ApiHeader({
    name: 'X-Timezone',
    description: 'User timezone',
    required: false,
  })
  @ApiResponse({ status: 200, description: 'Schedule updated successfully' })
  @ApiResponse({ status: 404, description: 'Schedule not found' })
  @ApiResponse({ status: 400, description: 'Invalid schedule configuration' })
  async updateSchedule(
    @Param('id') id: string,
    @Body() updateData: UpdateScheduleDto,
    @Timezone() timezone: string,
  ) {
    const schedule = await this.scheduleService.updateSchedule(
      id,
      updateData,
      timezone,
    );
    return { message: 'Schedule updated successfully', data: schedule };
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Delete schedule' })
  @ApiParam({ name: 'id', type: 'string' })
  @ApiResponse({ status: 200, description: 'Schedule deleted successfully' })
  @ApiResponse({ status: 404, description: 'Schedule not found' })
  async deleteSchedule(@Param('id') id: string) {
    await this.scheduleService.delete(id);
    return { message: 'Schedule deleted successfully' };
  }
}
