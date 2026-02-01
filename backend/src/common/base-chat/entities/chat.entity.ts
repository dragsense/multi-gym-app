import { Entity, Column, ManyToOne, OneToMany, JoinColumn } from 'typeorm';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { GeneralBaseEntity } from '@/common/entities';
import { ChatMessage } from './chat-message.entity';
import { ChatUser } from './chat-user.entity';

@Entity('chats')
export class Chat extends GeneralBaseEntity {
  @ApiPropertyOptional({
    example: '550e8400-e29b-41d4-a716-446655440002',
    description: 'ID of the last message',
  })
  @Column({ type: 'uuid', nullable: true })
  lastMessageId?: string;

  @ApiPropertyOptional({
    description: 'Last message sent in the chat',
    type: () => ChatMessage,
  })
  @ManyToOne(() => ChatMessage, { nullable: true })
  @JoinColumn({ name: 'lastMessageId' })
  lastMessage?: ChatMessage;

  @ApiPropertyOptional({
    example: 'My Chat Group',
    description: 'Name of the chat (for group chats)',
  })
  @Column({ type: 'varchar', length: 255, nullable: true })
  name?: string;

  @ApiPropertyOptional({
    example: true,
    description: 'Whether this is a group chat',
  })
  @Column({ type: 'boolean', default: false })
  isGroup?: boolean;

  @ApiProperty({
    type: () => [ChatMessage],
    description: 'Messages in this chat',
  })
  @OneToMany(() => ChatMessage, (message) => message.chat)
  messages?: ChatMessage[];

  @ApiProperty({
    type: () => [ChatUser],
    description: 'Users in this chat',
  })
  @OneToMany(() => ChatUser, (chatUser) => chatUser.chat)
  chatUsers?: ChatUser[];
}
