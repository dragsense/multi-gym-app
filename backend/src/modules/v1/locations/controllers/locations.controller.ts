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
  UseInterceptors,
  UploadedFile,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import {
  ApiBearerAuth,
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiParam,
  ApiBody,
  ApiConsumes,
} from '@nestjs/swagger';
import { FileValidationPipe } from '@/pipes/file-validation.pipe';
import { OmitType } from '@shared/lib/type-utils';

import { LocationsService } from '../services/locations.service';
import { Location } from '../entities/location.entity';
import {
  CreateLocationDto,
  UpdateLocationDto,
  LocationListDto,
  LocationPaginationDto,
} from '@shared/dtos';
import { SingleQueryDto } from '@shared/dtos/common/list-query.dto';
import { IMessageResponse } from '@shared/interfaces';
import { RequireModule } from '@/decorators/require-module.decorator';
import { ESubscriptionFeatures } from '@shared/enums/business/subscription.enum';
import { MinUserLevel } from '@/decorators/level.decorator';
import { EUserLevels } from '@shared/enums';
import { Resource } from '@/decorators';
import { EResource } from '@shared/enums';

@ApiBearerAuth('access-token')
@ApiTags('Locations')
@MinUserLevel(EUserLevels.ADMIN)
@RequireModule(ESubscriptionFeatures.LOCATIONS)
@Resource(EResource.LOCATIONS)
@Controller('locations')
export class LocationsController {
  constructor(private readonly locationsService: LocationsService) {}

  @Get()
  @ApiOperation({ summary: 'Get all locations with pagination and filters' })
  @ApiResponse({ status: 200, type: LocationPaginationDto })
  findAll(@Query() query: LocationListDto) {
    return this.locationsService.get(query, LocationListDto);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get a single location by ID' })
  @ApiParam({ name: 'id', description: 'Location ID' })
  @ApiResponse({ status: 200, type: Location })
  @ApiResponse({ status: 404, description: 'Location not found' })
  async findOne(
    @Param('id') id: string,
    @Query() query: SingleQueryDto<Location>,
  ): Promise<Location> {
    const location = await this.locationsService.getSingle(id, query);
    if (!location) {
      throw new NotFoundException(`Location with ID ${id} not found`);
    }
    return location;
  }

  @Post()
  @ApiOperation({ summary: 'Create a new location' })
  @ApiConsumes('multipart/form-data')
  @ApiBody({ type: CreateLocationDto })
  @ApiResponse({ status: 201, description: 'Location created successfully' })
  @UseInterceptors(FileInterceptor('image'))
  async create(
    @Body() createLocationDto: OmitType<CreateLocationDto, 'image'>,
    @UploadedFile(
      new FileValidationPipe({
        maxSize: 10 * 1024 * 1024, // 10MB
        required: false,
        validateImageDimensions: true,
        minWidth: 200,
        maxWidth: 4000,
        minHeight: 200,
        maxHeight: 4000,
      }),
    )
    imageFile?: Express.Multer.File,
  ): Promise<IMessageResponse & { location: Location }> {
    return this.locationsService.createLocation(
      {
        ...createLocationDto,
        image: imageFile,
      },
      imageFile,
    );
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Update location by ID' })
  @ApiParam({ name: 'id', description: 'Location ID' })
  @ApiConsumes('multipart/form-data')
  @ApiBody({ type: UpdateLocationDto })
  @ApiResponse({ status: 200, description: 'Location updated successfully' })
  @ApiResponse({ status: 404, description: 'Location not found' })
  @UseInterceptors(FileInterceptor('image'))
  async update(
    @Param('id') id: string,
    @Body() updateLocationDto: OmitType<UpdateLocationDto, 'image'>,
    @UploadedFile(
      new FileValidationPipe({
        maxSize: 10 * 1024 * 1024, // 10MB
        required: false,
        validateImageDimensions: true,
        minWidth: 200,
        maxWidth: 4000,
        minHeight: 200,
        maxHeight: 4000,
      }),
    )
    imageFile?: Express.Multer.File,
  ): Promise<IMessageResponse> {
    return this.locationsService.updateLocation(
      id,
      {
        ...updateLocationDto,
        image: imageFile,
      },
      imageFile,
    );
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Delete location by ID' })
  @ApiParam({ name: 'id', description: 'Location ID' })
  @ApiResponse({ status: 200, description: 'Location deleted successfully' })
  @ApiResponse({ status: 404, description: 'Location not found' })
  async remove(@Param('id') id: string): Promise<IMessageResponse> {
    const location = await this.locationsService.getSingle(id, {
      _relations: ['image'],
    });

    if (!location) {
      throw new NotFoundException(`Location with ID ${id} not found`);
    }

    // Delete associated file if exists
    if (location.image) {
      await this.locationsService['fileUploadService'].deleteFiles([
        location.image,
      ]);
    }

    await this.locationsService.delete(id);
    return { message: 'Location deleted successfully' };
  }
}

