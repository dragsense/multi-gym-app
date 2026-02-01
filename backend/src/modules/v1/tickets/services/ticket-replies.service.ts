import {
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { ModuleRef } from '@nestjs/core';

import { TicketReply } from '../entities/ticket-reply.entity';
import {
  CreateTicketReplyDto,
  UpdateTicketReplyDto,
  TicketReplyListDto,
} from '@shared/dtos';
import { CrudService } from '@/common/crud/crud.service';
import { CrudOptions } from '@/common/crud/interfaces/crud.interface';
import { TicketsService } from './tickets.service';

@Injectable()
export class TicketRepliesService extends CrudService<TicketReply> {
  constructor(
    @InjectRepository(TicketReply)
    private readonly ticketReplyRepo: Repository<TicketReply>,
    private readonly ticketsService: TicketsService,
    moduleRef: ModuleRef,
  ) {
    const crudOptions: CrudOptions = {
      restrictedFields: ['createdBy.password'],
      searchableFields: [
        'message',
        'createdBy.email',
        'createdBy.firstName',
        'createdBy.lastName',
      ],
    };
    super(ticketReplyRepo, moduleRef, crudOptions);
  }

  async createTicketReply(
    createTicketReplyDto: CreateTicketReplyDto,
    currentUserId: string,
  ): Promise<TicketReply> {
    // Verify ticket exists
    const ticket = await this.ticketsService.getSingle(createTicketReplyDto.ticketId);
    if (!ticket) {
      throw new NotFoundException('Ticket not found');
    }

    // createdByUserId is automatically set by CrudService from request context
    const reply = await this.create<CreateTicketReplyDto>(createTicketReplyDto);
    
    // Reload with createdBy relation
    const replyWithRelation = await this.getSingle(reply.id, {
      _relations: ['createdBy'],
      _select: ['createdBy.email', 'createdBy.firstName', 'createdBy.lastName'],
    });
    
    if (!replyWithRelation) {
      throw new NotFoundException('Failed to reload ticket reply');
    }
    
    return replyWithRelation;
  }

  async updateTicketReply(
    id: string,
    updateTicketReplyDto: UpdateTicketReplyDto,
  ): Promise<TicketReply> {
    const reply = await this.getSingle(id);
    if (!reply) {
      throw new NotFoundException('Ticket reply not found');
    }

    return this.update(id, updateTicketReplyDto);
  }
}
