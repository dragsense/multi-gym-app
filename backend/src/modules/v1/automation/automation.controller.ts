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

import { AutomationService } from './automation.service';
import { Automation } from './entities/automation.entity';
import {
    CreateAutomationDto,
    UpdateAutomationDto,
    AutomationListDto,
    AutomationPaginatedDto,
    AutomationDto,
} from '@shared/dtos/automation-dtos';
import { SingleQueryDto } from '@shared/dtos';
import { MinUserLevel } from '@/decorators/level.decorator';
import { EUserLevels, EAutomationStatus } from '@shared/enums';

@ApiBearerAuth('access-token')
@ApiTags('Automations')
@MinUserLevel(EUserLevels.ADMIN)
@Controller('automations')
export class AutomationController {
    constructor(private readonly automationService: AutomationService) { }

    @Get()
    @ApiOperation({ summary: 'Get all automations with pagination and filters' })
    @ApiResponse({ status: 200, type: AutomationPaginatedDto })
    findAll(@Query() query: AutomationListDto) {
        return this.automationService.get(query, AutomationListDto);
    }

    @Get(':id')
    @ApiOperation({ summary: 'Get a single automation by ID' })
    @ApiParam({ name: 'id', description: 'Automation ID' })
    @ApiResponse({ status: 200, type: AutomationDto })
    @ApiResponse({ status: 404, description: 'Automation not found' })
    async findOne(
        @Param('id') id: string,
        @Query() query: SingleQueryDto<Automation>,
    ): Promise<Automation> {
        const automation = await this.automationService.getSingle(id, query);
        if (!automation) {
            throw new NotFoundException(`Automation with ID ${id} not found`);
        }
        return automation;
    }

    @Post()
    @ApiOperation({ summary: 'Create a new automation' })
    @ApiBody({
        type: CreateAutomationDto,
        description: 'Create a new automation',
    })
    @ApiResponse({ status: 201, description: 'Automation created successfully' })
    create(@Body() createAutomationDto: CreateAutomationDto) {
        return this.automationService.createAutomation(createAutomationDto);
    }

    @Patch(':id')
    @ApiOperation({ summary: 'Update automation by ID' })
    @ApiParam({ name: 'id', description: 'Automation ID' })
    @ApiBody({
        type: UpdateAutomationDto,
        description: 'Update automation information',
    })
    @ApiResponse({ status: 200, description: 'Automation updated successfully' })
    @ApiResponse({ status: 404, description: 'Automation not found' })
    update(
        @Param('id') id: string,
        @Body() updateAutomationDto: UpdateAutomationDto,
    ) {
        return this.automationService.updateAutomation(id, updateAutomationDto);
    }

    @Patch(':id/status')
    @ApiOperation({ summary: 'Update automation status (active/inactive)' })
    @ApiParam({ name: 'id', description: 'Automation ID' })
    @ApiBody({
        schema: {
            type: 'object',
            properties: {
                status: {
                    type: 'string',
                    enum: Object.values(EAutomationStatus),
                    description: 'Automation status',
                },
            },
            required: ['status'],
        },
    })
    @ApiResponse({
        status: 200,
        description: 'Automation status updated successfully',
    })
    @ApiResponse({ status: 404, description: 'Automation not found' })
    async updateStatus(
        @Param('id') id: string,
        @Body() body: { status: EAutomationStatus },
    ) {
        return this.automationService.updateAutomationStatus(id, body.status);
    }

    @Delete(':id')
    @ApiOperation({ summary: 'Delete automation by ID' })
    @ApiParam({
        name: 'id',
        description: 'Automation ID',
    })
    @ApiResponse({ status: 200, description: 'Automation deleted successfully' })
    @ApiResponse({ status: 404, description: 'Automation not found' })
    async remove(@Param('id') id: string) {
        await this.automationService.deleteAutomation(id);
        return { message: 'Automation deleted successfully' };
    }
}
