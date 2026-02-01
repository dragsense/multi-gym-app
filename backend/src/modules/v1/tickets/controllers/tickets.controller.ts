import {
  Controller,
  Get,
  Post,
  Patch,
  Delete,
  Param,
  Query,
  Body,
} from '@nestjs/common';
import {
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
  ApiTags,
  ApiParam,
} from '@nestjs/swagger';

import { TicketsService } from '../services/tickets.service';
import {
  CreateTicketDto,
  UpdateTicketDto,
  TicketListDto,
  TicketDto,
  TicketPaginatedDto,
  SingleQueryDto,
} from '@shared/dtos';
import { Ticket } from '../entities/ticket.entity';
import { AuthUser } from '@/decorators/user.decorator';
import { User } from '@/common/base-user/entities/user.entity';
import { EUserLevels } from '@shared/enums';
import { MinUserLevel } from '@/decorators/level.decorator';
import { NotFoundException } from '@nestjs/common';

@ApiBearerAuth('access-token')
@ApiTags('Tickets')
@MinUserLevel(EUserLevels.PLATFORM_OWNER)
@Controller('tickets')
export class TicketsController {
  constructor(private readonly ticketsService: TicketsService) {}

  @ApiOperation({ summary: 'Get all tickets with pagination and filters' })
  @ApiResponse({ status: 200, type: TicketPaginatedDto })
  @Get()
  @MinUserLevel(EUserLevels.SUPER_ADMIN)
  findAll(@Query() query: TicketListDto) {
    return this.ticketsService.get(query, TicketListDto);
  }

  @ApiOperation({ summary: 'Get ticket by ID' })
  @ApiParam({ name: 'id', description: 'Ticket ID' })
  @ApiResponse({ status: 200, type: TicketDto })
  @ApiResponse({ status: 404, description: 'Ticket not found' })
  @Get(':id')
  @MinUserLevel(EUserLevels.SUPER_ADMIN)
  async findOne(
    @Param('id') id: string,
    @Query() query: SingleQueryDto<Ticket>,
  ) {
    const ticket = await this.ticketsService.getSingle(id, query);
    if (!ticket) {
      throw new NotFoundException('Ticket not found');
    }
    return ticket;
  }

  @ApiOperation({ summary: 'Create a new ticket' })
  @ApiResponse({ status: 201, type: TicketDto })
  @Post()
  @MinUserLevel(EUserLevels.SUPER_ADMIN)
  async create(
    @Body() createTicketDto: CreateTicketDto,
    @AuthUser() currentUser: User,
  ) {
    return this.ticketsService.createTicket(createTicketDto, currentUser.id);
  }

  @ApiOperation({ summary: 'Update a ticket' })
  @ApiParam({ name: 'id', description: 'Ticket ID' })
  @ApiResponse({ status: 200, type: TicketDto })
  @ApiResponse({ status: 404, description: 'Ticket not found' })
  @Patch(':id')
  async update(
    @Param('id') id: string,
    @Body() updateTicketDto: UpdateTicketDto,
  ) {
    return this.ticketsService.updateTicket(id, updateTicketDto);
  }

  @ApiOperation({ summary: 'Delete a ticket' })
  @ApiParam({ name: 'id', description: 'Ticket ID' })
  @ApiResponse({ status: 200, description: 'Ticket deleted successfully' })
  @ApiResponse({ status: 404, description: 'Ticket not found' })
  @Delete(':id')
  async remove(@Param('id') id: string) {
    await this.ticketsService.delete(id);
  }
}
