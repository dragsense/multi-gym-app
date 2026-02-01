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
  NotFoundException,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
  ApiParam,
} from '@nestjs/swagger';

import { PageService } from '../services/page.service';
import {
  CreatePageDto,
  UpdatePageDto,
  PageDto,
  PageListDto,
  PagePaginatedDto,
  SingleQueryDto,
} from '@shared/dtos';
import { EUserLevels } from '@shared/enums';
import { MinUserLevel } from '@/decorators/level.decorator';
import { Public } from '@/decorators/access.decorator';
import { Resource } from '@/decorators';
import { EResource } from '@shared/enums';

@ApiTags('CMS - Pages')
@Resource(EResource.PAGES)
@Controller('cms/pages')
@MinUserLevel(EUserLevels.SUPER_ADMIN)
export class PageController {
  constructor(private readonly pageService: PageService) {}

  @Get('slug/:slug')
  @ApiOperation({ summary: 'Get published page by slug (public endpoint)' })
  @ApiParam({ name: 'slug', type: String })
  @ApiResponse({ status: 200, type: PageDto })
  @Public()
  async findBySlug(@Param('slug') slug: string) {
    const page = await this.pageService.getBySlug(slug);
    if (!page) {
      throw new NotFoundException(`Page with slug "${slug}" not found`);
    }
    return page;
  }

  @Post()
  @ApiOperation({ summary: 'Create a new page' })
  @ApiResponse({ status: 201, type: PageDto })
  @ApiBearerAuth('access-token')
  async create(@Body() createDto: CreatePageDto) {
    return this.pageService.createPage(createDto);
  }

  @Get()
  @ApiOperation({ summary: 'Get all pages with pagination' })
  @ApiResponse({ status: 200, type: PagePaginatedDto })
  @ApiBearerAuth('access-token')
  async findAll(@Query() queryDto: PageListDto) {
    return this.pageService.get(queryDto);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get page by ID' })
  @ApiParam({ name: 'id', type: String })
  @ApiResponse({ status: 200, type: PageDto })
  @ApiBearerAuth('access-token')
  async findOne(@Param('id') id: string, @Query() queryDto?: SingleQueryDto) {
    return this.pageService.getSingle(id, queryDto);
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Update page' })
  @ApiParam({ name: 'id', type: String })
  @ApiResponse({ status: 200, type: PageDto })
  @ApiBearerAuth('access-token')
  async update(@Param('id') id: string, @Body() updateDto: UpdatePageDto) {
    return this.pageService.updatePage(id, updateDto);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Delete page' })
  @ApiParam({ name: 'id', type: String })
  @ApiResponse({ status: 200 })
  @ApiBearerAuth('access-token')
  async remove(@Param('id') id: string) {
    await this.pageService.deletePage(id);
    return { message: 'Page deleted successfully' };
  }
}
