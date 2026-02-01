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

import { TicketRepliesService } from '../services/ticket-replies.service';
import {
  CreateTicketReplyDto,
  UpdateTicketReplyDto,
  TicketReplyListDto,
  TicketReplyDto,
  TicketReplyPaginatedDto,
} from '@shared/dtos';
import { TicketReply } from '../entities/ticket-reply.entity';
import { AuthUser } from '@/decorators/user.decorator';
import { User } from '@/common/base-user/entities/user.entity';
import { EUserLevels } from '@shared/enums';
import { MinUserLevel } from '@/decorators/level.decorator';
import { NotFoundException } from '@nestjs/common';

@ApiBearerAuth('access-token')
@ApiTags('Ticket Replies')
@MinUserLevel(EUserLevels.PLATFORM_OWNER)
@Controller('ticket-replies')
export class TicketRepliesController {
  constructor(private readonly ticketRepliesService: TicketRepliesService) { }

  @ApiOperation({ summary: 'Get all ticket replies with pagination and filters' })
  @ApiResponse({ status: 200, type: TicketReplyPaginatedDto })
  @Get()
  @MinUserLevel(EUserLevels.SUPER_ADMIN)
  findAll(@Query() query: TicketReplyListDto) {
    return this.ticketRepliesService.get(query, TicketReplyListDto);
  }

  @ApiOperation({ summary: 'Get ticket replies by ticket ID with pagination' })
  @ApiParam({ name: 'ticketId', description: 'Ticket ID' })
  @ApiResponse({ status: 200, type: TicketReplyPaginatedDto })
  @Get('ticket/:ticketId')
  @MinUserLevel(EUserLevels.SUPER_ADMIN)
  async findByTicketId(
    @Param('ticketId') ticketId: string,
    @Query() query: TicketReplyListDto,
  ) {
    return this.ticketRepliesService.get(
      { ...query, ticketId } as any,
      TicketReplyListDto,
    );
  }

  @ApiOperation({ summary: 'Get ticket reply by ID' })
  @ApiParam({ name: 'id', description: 'Ticket Reply ID' })
  @ApiResponse({ status: 200, type: TicketReplyDto })
  @ApiResponse({ status: 404, description: 'Ticket reply not found' })
  @Get(':id')
  @MinUserLevel(EUserLevels.SUPER_ADMIN)
  async findOne(@Param('id') id: string) {
    const reply = await this.ticketRepliesService.getSingle(id);
    if (!reply) {
      throw new NotFoundException('Ticket reply not found');
    }
    return reply;
  }

  @ApiOperation({ summary: 'Create a new ticket reply' })
  @ApiResponse({ status: 201, type: TicketReplyDto })
  @Post()
  @MinUserLevel(EUserLevels.SUPER_ADMIN)
  async create(
    @Body() createTicketReplyDto: CreateTicketReplyDto,
    @AuthUser() currentUser: User,
  ) {
    return this.ticketRepliesService.createTicketReply(
      createTicketReplyDto,
      currentUser.id,
    );
  }

  @ApiOperation({ summary: 'Update a ticket reply' })
  @ApiParam({ name: 'id', description: 'Ticket Reply ID' })
  @ApiResponse({ status: 200, type: TicketReplyDto })
  @ApiResponse({ status: 404, description: 'Ticket reply not found' })
  @Patch(':id')
  async update(
    @Param('id') id: string,
    @Body() updateTicketReplyDto: UpdateTicketReplyDto,
  ) {
    return this.ticketRepliesService.updateTicketReply(id, updateTicketReplyDto);
  }

  @ApiOperation({ summary: 'Delete a ticket reply' })
  @ApiParam({ name: 'id', description: 'Ticket Reply ID' })
  @ApiResponse({ status: 200, description: 'Ticket reply deleted successfully' })
  @ApiResponse({ status: 404, description: 'Ticket reply not found' })
  @Delete(':id')
  async remove(@Param('id') id: string) {
    await this.ticketRepliesService.delete(id);
  }
}
