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
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
  ApiParam,
} from '@nestjs/swagger';
import { SelectQueryBuilder } from 'typeorm';

import { FaqService } from '../services/faq.service';
import {
  CreateFaqDto,
  UpdateFaqDto,
  FaqDto,
  FaqListDto,
  FaqPaginatedDto,
  SingleQueryDto,
} from '@shared/dtos';
import { EUserLevels } from '@shared/enums';
import { MinUserLevel, RequiredUserLevels } from '@/decorators/level.decorator';
import { Resource } from '@/decorators';
import { EResource } from '@shared/enums';
import { AuthUser } from '@/decorators/user.decorator';
import { User } from '@/common/base-user/entities/user.entity';
import { Faq } from '../entities/faq.entity';
import { SelectQueryBuilder } from 'typeorm';

@ApiTags('CMS - FAQs')
@ApiBearerAuth('access-token')
@RequiredUserLevels([EUserLevels.PLATFORM_OWNER, EUserLevels.ADMIN])
@Resource(EResource.FAQS)
@Controller('cms/faqs')
export class FaqController {
  constructor(private readonly faqService: FaqService) {}

  @Post()
  @ApiOperation({ summary: 'Create a new FAQ' })
  @ApiResponse({ status: 201, type: FaqDto })
  async create(@Body() createDto: CreateFaqDto) {
    return this.faqService.createFaq(createDto);
  }

  @Get()
  @ApiOperation({ summary: 'Get all FAQs with pagination' })
  @ApiResponse({ status: 200, type: FaqPaginatedDto })
  @MinUserLevel(EUserLevels.MEMBER)
  async findAll(@Query() queryDto: FaqListDto, @AuthUser() currentUser: User) {
    const isAdmin =
      currentUser.level === (EUserLevels.PLATFORM_OWNER as number) || currentUser.level === (EUserLevels.ADMIN as number);
    return this.faqService.get(queryDto, FaqListDto, {
      beforeQuery: (query: SelectQueryBuilder<Faq>) => {
        if (!isAdmin) {
          query.andWhere('entity.enabled = :enabled', { enabled: true });
        }
      },
    });
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get FAQ by ID' })
  @ApiParam({ name: 'id', type: String })
  @ApiResponse({ status: 200, type: FaqDto })
  async findOne(@Param('id') id: string, @Query() queryDto?: SingleQueryDto) {
    return this.faqService.getSingle(id, queryDto);
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Update FAQ' })
  @ApiParam({ name: 'id', type: String })
  @ApiResponse({ status: 200, type: FaqDto })
  async update(@Param('id') id: string, @Body() updateDto: UpdateFaqDto) {
    return this.faqService.updateFaq(id, updateDto);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Delete FAQ' })
  @ApiParam({ name: 'id', type: String })
  @ApiResponse({ status: 200 })
  async remove(@Param('id') id: string) {
    await this.faqService.delete(id);
    return { message: 'FAQ deleted successfully' };
  }
}
