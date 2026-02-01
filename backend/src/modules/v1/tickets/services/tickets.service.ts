import {
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { ModuleRef } from '@nestjs/core';

import { Ticket } from '../entities/ticket.entity';
import {
  CreateTicketDto,
  UpdateTicketDto,
  TicketListDto,
} from '@shared/dtos';
import { CrudService } from '@/common/crud/crud.service';
import { CrudOptions } from '@/common/crud/interfaces/crud.interface';
import { ETicketStatus } from '@shared/enums/ticket.enum';
import { User } from '@/common/base-user/entities/user.entity';

@Injectable()
export class TicketsService extends CrudService<Ticket> {
  constructor(
    @InjectRepository(Ticket)
    private readonly ticketRepo: Repository<Ticket>,
    moduleRef: ModuleRef,
  ) {
    const crudOptions: CrudOptions = {
      restrictedFields: ['createdBy.password', 'assignedTo.password'],
      searchableFields: [
        'title',
        'description',
        'createdBy.email',
        'createdBy.firstName',
        'createdBy.lastName',
        'assignedTo.email',
        'assignedTo.firstName',
        'assignedTo.lastName',
      ],
    };
    super(ticketRepo, moduleRef, crudOptions);
  }

  async createTicket(
    createTicketDto: CreateTicketDto,
    currentUserId: string,
  ): Promise<Ticket> {
    // createdByUserId is automatically set by CrudService from request context
    return this.create<CreateTicketDto>(createTicketDto);
  }

  async updateTicket(
    id: string,
    updateTicketDto: UpdateTicketDto,
  ): Promise<Ticket> {
    const ticket = await this.getSingle(id);
    if (!ticket) {
      throw new NotFoundException('Ticket not found');
    }

    // Prepare update data with resolvedAt and closedAt
    const updateData: UpdateTicketDto = { ...updateTicketDto };

    // Update resolvedAt when status changes to RESOLVED
    if (updateData.status === ETicketStatus.RESOLVED && ticket.status !== ETicketStatus.RESOLVED) {
      updateData.resolvedAt = new Date();
    }

    // Update closedAt when status changes to CLOSED
    if (updateData.status === ETicketStatus.CLOSED && ticket.status !== ETicketStatus.CLOSED) {
      updateData.closedAt = new Date();
    }

    return this.update(id, updateData);
  }
}
