import {
  Controller,
  Get,
  Body,
  Post,
  Param,
  Query,
  Patch,
  Delete,
} from '@nestjs/common';
import {
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
  ApiTags,
  ApiBody,
  ApiParam,
} from '@nestjs/swagger';
import { AIProcessorsService } from './ai-processors.service';
import {
  CreateAIProcessorDto,
  UpdateAIProcessorDto,
  AIProcessorListDto,
  AIProcessorPaginatedDto,
  AIProcessorDto,
} from '@shared/dtos/ai-processors-dtos';
import { SkipBusinessCheck } from '@/decorators/skip-business-check.decorator';
import { EUserLevels } from '@shared/enums/user.enum';
import { MinUserLevel } from '@/decorators/level.decorator';
import { AuthUser } from '@/decorators/user.decorator';
import { User } from '@/common/base-user/entities/user.entity';
import { SelectQueryBuilder } from 'typeorm';
import { AIProcessor } from './entities/ai-processor.entity';

@ApiBearerAuth('access-token')
@ApiTags('AI Processors')
@Controller('ai-processors')
@MinUserLevel(EUserLevels.PLATFORM_OWNER)
export class AIProcessorsController {
  constructor(private readonly aiProcessorsService: AIProcessorsService) {}

  @ApiOperation({
    summary: 'Get all AI processors with pagination and filtering',
  })
  @ApiResponse({
    status: 200,
    description: 'Returns paginated list of AI processors',
    type: AIProcessorPaginatedDto,
  })
  @Get()
  @SkipBusinessCheck()
  @MinUserLevel(EUserLevels.SUPER_ADMIN)
  findAll(@Query() query: AIProcessorListDto, @AuthUser() currentUser: User) {
    const isPlatformOwner = currentUser.level === (EUserLevels.PLATFORM_OWNER as number);
    return this.aiProcessorsService.get(query, AIProcessorListDto, {
      beforeQuery: (qb: SelectQueryBuilder<AIProcessor>) => {
        if (!isPlatformOwner) {
          qb.andWhere('entity.enabled = :enabled', { enabled: true });
        }
      },
    });
  }

  @ApiOperation({ summary: 'Get AI processor by ID' })
  @ApiParam({ name: 'id', description: 'AI processor ID' })
  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.aiProcessorsService.getSingle(id);
  }

  @ApiOperation({ summary: 'Add a new AI processor' })
  @ApiBody({ type: CreateAIProcessorDto })
  @Post()
  create(@Body() createDto: CreateAIProcessorDto) {
    return this.aiProcessorsService.createAIProcessor(createDto);
  }

  @ApiOperation({ summary: 'Update AI processor by ID' })
  @ApiParam({ name: 'id', description: 'AI processor ID' })
  @Patch(':id')
  update(@Param('id') id: string, @Body() updateDto: UpdateAIProcessorDto) {
    return this.aiProcessorsService.updateAIProcessor(id, updateDto);
  }

  @ApiOperation({ summary: 'Delete AI processor by ID' })
  @ApiParam({ name: 'id', description: 'AI processor ID' })
  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.aiProcessorsService.delete(id);
  }
}
