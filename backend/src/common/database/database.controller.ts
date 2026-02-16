import {
  Controller,
  Get,
  Query,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
  ApiQuery,
} from '@nestjs/swagger';
import { DatabaseService } from './database.service';
import {
  DatabaseConnectionListDto,
  DatabaseConnectionPaginatedDto,
} from '@shared/dtos';
import { EUserLevels } from '@shared/enums';
import { MinUserLevel } from '@/decorators/level.decorator';

@ApiBearerAuth('access-token')
@ApiTags('Database')
@MinUserLevel(EUserLevels.PLATFORM_OWNER)
@Controller('database')
export class DatabaseController {
  constructor(private readonly databaseService: DatabaseService) {}

  @ApiOperation({ summary: 'Get all database connections with pagination' })
  @ApiQuery({ type: DatabaseConnectionListDto })
  @ApiResponse({
    status: 200,
    description: 'Returns paginated list of database connections',
    type: DatabaseConnectionPaginatedDto,
  })
  @Get('connections')
  findAll(@Query() query: DatabaseConnectionListDto) {
    return this.databaseService.getConnections(query);
  }
}
