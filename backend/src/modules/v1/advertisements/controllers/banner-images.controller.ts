import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  Query,
  UseInterceptors,
  UploadedFile,
  NotFoundException,
} from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiParam,
  ApiConsumes,
  ApiBody,
} from '@nestjs/swagger';
import { FileInterceptor } from '@nestjs/platform-express';
import { FileValidationPipe } from '@/pipes/file-validation.pipe';
import { OmitType } from '@shared/lib/type-utils';

import { BannerImagesService } from '../services/banner-images.service';
import { BannerImage } from '../entities/banner-image.entity';
import {
  CreateBannerImageDto,
  UpdateBannerImageDto,
  BannerImageListDto,
  BannerImagePaginationDto,
} from '@shared/dtos';
import { SingleQueryDto } from '@shared/dtos/common/list-query.dto';
import { IMessageResponse } from '@shared/interfaces';
import { MinUserLevel } from '@/decorators/level.decorator';
import { EUserLevels } from '@shared/enums';
import { Resource } from '@/decorators';
import { EResource } from '@shared/enums';

@ApiBearerAuth('access-token')
@ApiTags('Banner Images')
@Resource(EResource.BANNER_SERVICE)
@Controller('banner-images')
@MinUserLevel(EUserLevels.ADMIN)
export class BannerImagesController {
  constructor(private readonly bannerImagesService: BannerImagesService) { }

  @Get()
  @ApiOperation({ summary: 'Get all banner images with pagination and filters' })
  @ApiResponse({ status: 200, type: BannerImagePaginationDto })
  findAll(@Query() query: BannerImageListDto) {
    return this.bannerImagesService.get(query, BannerImageListDto);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get a single banner image by ID' })
  @ApiParam({ name: 'id', description: 'Banner Image ID' })
  @ApiResponse({ status: 200, type: BannerImage })
  @ApiResponse({ status: 404, description: 'Banner image not found' })
  async findOne(
    @Param('id') id: string,
    @Query() query: SingleQueryDto<BannerImage>,
  ): Promise<BannerImage> {
    const bannerImage = await this.bannerImagesService.getSingle(id, query);
    if (!bannerImage) {
      throw new NotFoundException(`Banner image with ID ${id} not found`);
    }
    return bannerImage;
  }

  @Post()
  @ApiOperation({ summary: 'Create a new banner image' })
  @ApiConsumes('multipart/form-data')
  @ApiBody({ type: CreateBannerImageDto })
  @ApiResponse({ status: 201, description: 'Banner image created successfully' })
  @UseInterceptors(FileInterceptor('image'))
  async create(
    @Body() createBannerImageDto: OmitType<CreateBannerImageDto, 'image'>,
    @UploadedFile(
      new FileValidationPipe({
        maxSize: 10 * 1024 * 1024, // 10MB
        required: true,
        validateImageDimensions: true,
        validateBannerAspectRatio: true, // Enforce banner format (width >= 2x height)
        minWidth: 800, // Banner format - minimum width
        maxWidth: 4000,
        minHeight: 200, // Banner format - minimum height
        maxHeight: 1500,
      }),
    )
    imageFile?: Express.Multer.File,
  ): Promise<IMessageResponse & { bannerImage: BannerImage }> {
    return this.bannerImagesService.createBannerImage(
      {
        ...createBannerImageDto,
        image: imageFile,
      },
      imageFile,
    );
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Update banner image by ID' })
  @ApiParam({ name: 'id', description: 'Banner Image ID' })
  @ApiConsumes('multipart/form-data')
  @ApiBody({ type: UpdateBannerImageDto })
  @ApiResponse({ status: 200, description: 'Banner image updated successfully' })
  @ApiResponse({ status: 404, description: 'Banner image not found' })
  @UseInterceptors(FileInterceptor('image'))
  async update(
    @Param('id') id: string,
    @Body() updateBannerImageDto: OmitType<UpdateBannerImageDto, 'image'>,
    @UploadedFile(
      new FileValidationPipe({
        maxSize: 10 * 1024 * 1024, // 10MB
        required: false, // Optional for updates
        validateImageDimensions: true,
        validateBannerAspectRatio: true, // Enforce banner format (width >= 2x height)
        minWidth: 800, // Banner format - minimum width
        maxWidth: 4000,
        minHeight: 200, // Banner format - minimum height
        maxHeight: 1500,
      }),
    )
    imageFile?: Express.Multer.File,
  ): Promise<IMessageResponse> {
    return this.bannerImagesService.updateBannerImage(
      id,
      updateBannerImageDto,
      imageFile,
    );
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Delete banner image by ID' })
  @ApiParam({ name: 'id', description: 'Banner Image ID' })
  @ApiResponse({ status: 200, description: 'Banner image deleted successfully' })
  @ApiResponse({ status: 404, description: 'Banner image not found' })
  async remove(@Param('id') id: string): Promise<IMessageResponse> {
    const bannerImage = await this.bannerImagesService.getSingle(id, {
      _relations: ['image'],
    });

    if (!bannerImage) {
      throw new NotFoundException(`Banner image with ID ${id} not found`);
    }

    // Delete associated file if exists
    if (bannerImage.image) {
      await this.bannerImagesService['fileUploadService'].deleteFiles([
        bannerImage.image,
      ]);
    }

    await this.bannerImagesService.delete(id);
    return { message: 'Banner image deleted successfully' };
  }
}

