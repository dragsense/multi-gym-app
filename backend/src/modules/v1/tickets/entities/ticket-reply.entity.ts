import {
  Entity,
  Column,
  ManyToOne,
  JoinColumn,
} from 'typeorm';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { GeneralBaseEntity } from '@/common/entities';
import { User } from '@/common/base-user/entities/user.entity';
import { Ticket } from './ticket.entity';

@Entity('ticket_replies')
export class TicketReply extends GeneralBaseEntity {
  @ApiProperty({
    example: '550e8400-e29b-41d4-a716-446655440000',
    description: 'Ticket ID that this reply belongs to',
  })
  @Column({ type: 'uuid' })
  ticketId: string;

  @ApiProperty({
    type: () => Ticket,
    description: 'Ticket that this reply belongs to',
  })
  @ManyToOne(() => Ticket, (ticket) => ticket.replies, {
    onDelete: 'CASCADE',
  })
  @JoinColumn({ name: 'ticketId' })
  ticket: Ticket;

  @ApiProperty({
    example: 'I have checked the issue and it seems to be a permission problem',
    description: 'Reply message/content',
  })
  @Column({ type: 'text' })
  message: string;

  @ApiProperty({
    type: () => User,
    description: 'User who created this reply',
  })
  @ManyToOne(() => User, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'createdByUserId' })
  createdBy: User;

  @ApiPropertyOptional({
    example: true,
    description: 'Whether this reply is internal (only visible to staff)',
  })
  @Column({ type: 'boolean', default: false })
  isInternal: boolean;
}
