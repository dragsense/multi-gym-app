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

import { CamerasService } from './cameras.service';
import { Camera } from './entities/camera.entity';
import {
  CreateCameraDto,
  UpdateCameraDto,
  CameraListDto,
  CameraPaginatedDto,
  CameraDto,
} from '@shared/dtos/camera-dtos';
import { SingleQueryDto } from '@shared/dtos';
import { Resource } from '@/decorators';
import { EResource } from '@shared/enums';
import { MinUserLevel } from '@/decorators/level.decorator';
import { EUserLevels } from '@shared/enums';

@ApiBearerAuth('access-token')
@ApiTags('Cameras')
@MinUserLevel(EUserLevels.ADMIN)
@Resource(EResource.VIDEO_STREAM)
@Controller('cameras')
export class CamerasController {
  constructor(private readonly camerasService: CamerasService) { }

  @Get()
  @ApiOperation({ summary: 'Get all cameras with pagination and filters' })
  @ApiResponse({ status: 200, type: CameraPaginatedDto })
  findAll(@Query() query: CameraListDto) {
    return this.camerasService.get(query, CameraListDto);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get a single camera by ID' })
  @ApiParam({ name: 'id', description: 'Camera ID' })
  @ApiResponse({ status: 200, type: CameraDto })
  @ApiResponse({ status: 404, description: 'Camera not found' })
  async findOne(
    @Param('id') id: string,
    @Query() query: SingleQueryDto<Camera>,
  ): Promise<Camera> {
    const camera = await this.camerasService.getSingle(id, query);
    if (!camera) {
      throw new NotFoundException(`Camera with ID ${id} not found`);
    }
    return camera;
  }

  @Post()
  @ApiOperation({ summary: 'Create a new camera' })
  @ApiBody({
    type: CreateCameraDto,
    description: 'Create a new camera',
  })
  @ApiResponse({ status: 201, description: 'Camera created successfully' })
  create(@Body() createCameraDto: CreateCameraDto) {
    return this.camerasService.createCamera(createCameraDto);
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Update camera by ID' })
  @ApiParam({ name: 'id', description: 'Camera ID' })
  @ApiBody({
    type: UpdateCameraDto,
    description: 'Update camera information',
  })
  @ApiResponse({ status: 200, description: 'Camera updated successfully' })
  @ApiResponse({ status: 404, description: 'Camera not found' })
  update(
    @Param('id') id: string,
    @Body() updateCameraDto: UpdateCameraDto,
  ) {
    return this.camerasService.updateCamera(id, updateCameraDto);
  }

  @Patch('status/:id')
  @ApiOperation({ summary: 'Update camera status (active/inactive)' })
  @ApiParam({ name: 'id', description: 'Camera ID' })
  @ApiBody({
    schema: {
      type: 'object',
      properties: {
        isActive: {
          type: 'boolean',
          description: 'Camera active status',
        },
      },
      required: ['isActive'],
    },
  })
  @ApiResponse({ status: 200, description: 'Camera status updated successfully' })
  @ApiResponse({ status: 404, description: 'Camera not found' })
  async updateStatus(
    @Param('id') id: string,
    @Body() body: { isActive: boolean },
  ) {
    return this.camerasService.updateCameraStatus(id, body.isActive);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Delete camera by ID' })
  @ApiParam({
    name: 'id',
    description: 'Camera ID',
  })
  @ApiResponse({ status: 200, description: 'Camera deleted successfully' })
  @ApiResponse({ status: 404, description: 'Camera not found' })
  async remove(@Param('id') id: string) {
    await this.camerasService.deleteCamera(id);
    return { message: 'Camera deleted successfully' };
  }
}
