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

import { EmailTemplateService } from '../services/email-template.service';
import {
  CreateEmailTemplateDto,
  UpdateEmailTemplateDto,
  EmailTemplateDto,
  EmailTemplateListDto,
  EmailTemplatePaginatedDto,
  SingleQueryDto,
} from '@shared/dtos';
import { EUserLevels } from '@shared/enums';
import { MinUserLevel } from '@/decorators/level.decorator';
import { Resource } from '@/decorators';
import { EResource } from '@shared/enums';

@ApiBearerAuth('access-token')
@ApiTags('CMS - Email Templates')
@MinUserLevel(EUserLevels.SUPER_ADMIN)
@Resource(EResource.EMAIL_TEMPLATES)
@Controller('cms/email-templates')
export class EmailTemplateController {
  constructor(
    private readonly emailTemplateService: EmailTemplateService,
  ) {}

  @Post()
  @ApiOperation({ summary: 'Create a new email template' })
  @ApiResponse({ status: 201, type: EmailTemplateDto })
  async create(@Body() createDto: CreateEmailTemplateDto) {
    return this.emailTemplateService.createTemplate(createDto);
  }

  @Get()
  @ApiOperation({ summary: 'Get all email templates with pagination' })
  @ApiResponse({ status: 200, type: EmailTemplatePaginatedDto })
  async findAll(@Query() queryDto: EmailTemplateListDto) {
    return this.emailTemplateService.get(queryDto);
  }

  @Get('identifier/:identifier')
  @ApiOperation({ summary: 'Get email template by identifier' })
  @ApiParam({ name: 'identifier', type: String })
  @ApiResponse({ status: 200, type: EmailTemplateDto })
  async findByIdentifier(@Param('identifier') identifier: string) {
    const template = await this.emailTemplateService.getByIdentifier(identifier);
    if (!template) {
      return null;
    }
    return template;
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get email template by ID' })
  @ApiParam({ name: 'id', type: String })
  @ApiResponse({ status: 200, type: EmailTemplateDto })
  async findOne(@Param('id') id: string, @Query() queryDto?: SingleQueryDto) {
    return this.emailTemplateService.getSingle(id, queryDto);
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Update email template' })
  @ApiParam({ name: 'id', type: String })
  @ApiResponse({ status: 200, type: EmailTemplateDto })
  async update(
    @Param('id') id: string,
    @Body() updateDto: UpdateEmailTemplateDto,
  ) {
    return this.emailTemplateService.updateTemplate(id, updateDto);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Delete email template' })
  @ApiParam({ name: 'id', type: String })
  @ApiResponse({ status: 200 })
  async remove(@Param('id') id: string) {
    return this.emailTemplateService.delete(id);
  }
}
