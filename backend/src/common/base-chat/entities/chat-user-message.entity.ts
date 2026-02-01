import { Entity, Column, ManyToOne, JoinColumn, Unique } from 'typeorm';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { GeneralBaseEntity } from '@/common/entities';
import { User } from '@/common/base-user/entities/user.entity';
import { ChatMessage } from './chat-message.entity';

@Entity('chat_user_messages')
@Unique(['messageId', 'userId'])
export class ChatUserMessage extends GeneralBaseEntity {
  @ApiProperty({
    example: '550e8400-e29b-41d4-a716-446655440000',
    description: 'ID of the message',
  })
  @Column({ type: 'uuid' })
  messageId: string;

  @ApiProperty({
    example: '550e8400-e29b-41d4-a716-446655440001',
    description: 'ID of the user',
  })
  @Column({ type: 'uuid' })
  userId: string;

  @ApiPropertyOptional({
    example: false,
    description: 'Whether the user has favorited the message',
  })
  @Column({ type: 'boolean', default: false })
  isFavorite?: boolean;


  @ApiPropertyOptional({
    example: false,
    description: 'Whether the user has archived the message',
  })
  @Column({ type: 'boolean', default: false })
  archived?: boolean;

  @ApiProperty({ type: () => ChatMessage, description: 'Message this user interaction belongs to' })
  @ManyToOne(() => ChatMessage, (message) => message.chatUserMessages, {
    onDelete: 'CASCADE',
  })
  @JoinColumn({ name: 'messageId' })
  message?: ChatMessage;

  @ApiProperty({ type: () => User, description: 'User in this message interaction' })
  @ManyToOne(() => User, { eager: true })
  @JoinColumn({ name: 'userId' })
  user?: User;
}

