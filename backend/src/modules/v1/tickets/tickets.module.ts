import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';

import { CrudModule } from '@/common';
import { User } from '@/common/base-user/entities/user.entity';

import { Ticket } from './entities/ticket.entity';
import { TicketReply } from './entities/ticket-reply.entity';
import { TicketsService } from './services/tickets.service';
import { TicketRepliesService } from './services/ticket-replies.service';
import { TicketsController } from './controllers/tickets.controller';
import { TicketRepliesController } from './controllers/ticket-replies.controller';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      Ticket,
      TicketReply,
      User,
    ]),
    CrudModule,
  ],
  controllers: [
    TicketsController,
    TicketRepliesController,
  ],
  providers: [
    TicketsService,
    TicketRepliesService,
  ],
  exports: [
    TicketsService,
    TicketRepliesService,
  ],
})
export class TicketsModule {}
