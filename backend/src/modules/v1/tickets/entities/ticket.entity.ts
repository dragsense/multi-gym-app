import {
  Entity,
  Column,
  ManyToOne,
  OneToMany,
  JoinColumn,
} from 'typeorm';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { GeneralBaseEntity } from '@/common/entities';
import { User } from '@/common/base-user/entities/user.entity';
import { ETicketStatus, ETicketPriority, ETicketCategory } from '@shared/enums/ticket.enum';
import { TicketReply } from './ticket-reply.entity';

@Entity('tickets')
export class Ticket extends GeneralBaseEntity {
  @ApiProperty({
    example: 'Unable to access dashboard',
    description: 'Ticket title',
  })
  @Column({ type: 'varchar', length: 255 })
  title: string;

  @ApiPropertyOptional({
    example: 'I am unable to access the dashboard after logging in',
    description: 'Ticket description',
  })
  @Column({ type: 'text', nullable: true })
  description?: string;

  @ApiProperty({
    enum: ETicketStatus,
    example: ETicketStatus.OPEN,
    description: 'Current status of the ticket',
  })
  @Column({
    type: 'enum',
    enum: ETicketStatus,
    default: ETicketStatus.OPEN,
  })
  status: ETicketStatus;

  @ApiProperty({
    enum: ETicketPriority,
    example: ETicketPriority.MEDIUM,
    description: 'Priority level of the ticket',
  })
  @Column({
    type: 'enum',
    enum: ETicketPriority,
    default: ETicketPriority.MEDIUM,
  })
  priority: ETicketPriority;

  @ApiProperty({
    enum: ETicketCategory,
    example: ETicketCategory.TECHNICAL,
    description: 'Category of the ticket',
  })
  @Column({
    type: 'enum',
    enum: ETicketCategory,
    default: ETicketCategory.GENERAL,
  })
  category: ETicketCategory;


  @ApiPropertyOptional({
    example: '550e8400-e29b-41d4-a716-446655440000',
    description: 'User assigned to handle this ticket',
  })
  @Column({ type: 'uuid', nullable: true })
  assignedToUserId?: string;

  @ApiPropertyOptional({
    type: () => User,
    description: 'User assigned to handle this ticket',
  })
  @ManyToOne(() => User, { nullable: true, onDelete: 'SET NULL' })
  @JoinColumn({ name: 'assignedToUserId' })
  assignedTo?: User;

  @ApiPropertyOptional({
    example: '2024-01-20T15:30:00.000Z',
    description: 'Date when ticket was resolved',
  })
  @Column({ type: 'timestamptz', nullable: true })
  resolvedAt?: Date;

  @ApiPropertyOptional({
    example: '2024-01-20T15:30:00.000Z',
    description: 'Date when ticket was closed',
  })
  @Column({ type: 'timestamptz', nullable: true })
  closedAt?: Date;


  @ApiProperty({
    type: () => User,
    description: 'User who created this reply',
  })
  @ManyToOne(() => User, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'createdByUserId' })
  createdBy: User;

  @ApiProperty({
    type: () => [TicketReply],
    description: 'Replies to this ticket',
  })
  @OneToMany(() => TicketReply, (reply) => reply.ticket, {
    cascade: true,
  })
  replies?: TicketReply[];
}
