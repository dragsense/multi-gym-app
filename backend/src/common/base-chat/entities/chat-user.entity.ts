import { Entity, Column, ManyToOne, JoinColumn, Unique } from 'typeorm';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { GeneralBaseEntity } from '@/common/entities';
import { User } from '@/common/base-user/entities/user.entity';
import { Chat } from './chat.entity';

@Entity('chat_users')
@Unique(['chatId', 'userId'])
export class ChatUser extends GeneralBaseEntity {
  @ApiProperty({
    example: '550e8400-e29b-41d4-a716-446655440000',
    description: 'ID of the chat',
  })
  @Column({ type: 'uuid' })
  chatId: string;

  @ApiProperty({
    example: '550e8400-e29b-41d4-a716-446655440001',
    description: 'ID of the user',
  })
  @Column({ type: 'uuid' })
  userId: string;

  @ApiPropertyOptional({
    example: false,
    description: 'Whether the user has archived the chat',
  })
  @Column({ type: 'boolean', default: false })
  archived?: boolean;

  @ApiPropertyOptional({
    example: false,
    description: 'Whether the user has favorited the chat',
  })
  @Column({ type: 'boolean', default: false })
  isFavorite?: boolean;

  @ApiPropertyOptional({
    example: false,
    description: 'Whether the user is an admin of the chat',
  })
  @Column({ type: 'boolean', default: false })
  isAdmin?: boolean;

  @ApiPropertyOptional({
    example: '2024-01-01T00:00:00.000Z',
    description: 'When the user joined the chat',
  })
  @Column({ type: 'timestamptz', default: () => 'CURRENT_TIMESTAMP' })
  joinedAt?: Date;

  @ApiPropertyOptional({
    example: '2024-01-01T00:00:00.000Z',
    description: 'When the user last seen/visited the chat',
  })
  @Column({ type: 'timestamptz', nullable: true })
  lastSeenAt?: Date;

  

  @ApiPropertyOptional({
    example: '2024-01-01T00:00:00.000Z',
    description: 'When the user cleared the chat',
  })
  @Column({ type: 'timestamptz', nullable: true })
  clearedAt?: Date;

  @ApiPropertyOptional({
    example: 5,
    description: 'Number of unread messages in this chat for this user',
  })
  @Column({ type: 'integer', default: 0 })
  unreadCount?: number;

  @ApiProperty({ type: () => Chat, description: 'Chat this user belongs to' })
  @ManyToOne(() => Chat, (chat) => chat.chatUsers, {
    onDelete: 'CASCADE',
  })
  @JoinColumn({ name: 'chatId' })
  chat?: Chat;

  @ApiProperty({ type: () => User, description: 'User in this chat' })
  @ManyToOne(() => User, { eager: true })
  @JoinColumn({ name: 'userId' })
  user?: User;
}
