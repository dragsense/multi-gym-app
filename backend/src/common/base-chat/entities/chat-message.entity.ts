import { Entity, Column, ManyToOne, OneToMany, JoinColumn } from 'typeorm';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { GeneralBaseEntity } from '@/common/entities';
import { User } from '@/common/base-user/entities/user.entity';
import { Chat } from './chat.entity';
import { ChatUserMessage } from './chat-user-message.entity';
import { FileUpload } from '@/common/file-upload/entities/file-upload.entity';

@Entity('chat_messages')
export class ChatMessage extends GeneralBaseEntity {
  @ApiProperty({
    example: 'Hello, how are you?',
    description: 'Message content',
  })
  @Column({ type: 'text' })
  message: string;

  @ApiProperty({
    example: '550e8400-e29b-41d4-a716-446655440000',
    description: 'ID of the sender',
  })
  @Column({ type: 'uuid' })
  senderId: string;

  @ApiProperty({
    example: '550e8400-e29b-41d4-a716-446655440001',
    description: 'ID of the chat',
  })
  @Column({ type: 'uuid', name: 'conversationId' })
  chatId: string;

  @ApiPropertyOptional({
    example: 'text',
    description: 'Message type (text, image, file, etc.)',
  })
  @Column({ type: 'varchar', length: 50, default: 'text' })
  messageType?: string;

  @ApiPropertyOptional({
    description: 'Additional metadata for the message',
  })
  @Column({ type: 'jsonb', nullable: true })
  metadata?: Record<string, any>;

  @ApiPropertyOptional({
    example: false,
    description: 'Whether the message is deleted',
  })
  @Column({ type: 'boolean', default: false })
  isDeleted?: boolean;

  @ApiPropertyOptional({
    example: '550e8400-e29b-41d4-a716-446655440000',
    description: 'ID of the user who deleted the message',
  })
  @Column({ type: 'uuid', nullable: true })
  deletedBy?: string;

  @ApiPropertyOptional({
    example: '550e8400-e29b-41d4-a716-446655440000',
    description: 'ID of the uploaded file attachment',
  })
  @Column({ type: 'uuid', nullable: true })
  attachmentId?: string;

  @ApiPropertyOptional({
    description: 'Backup of original message when deleted for everyone',
  })
  @Column({ type: 'jsonb', nullable: true, select: false })
  backupMessage?: {
    message: string;
    messageType?: string;
    metadata?: Record<string, any>;
    attachmentId?: string;
    deletedBy: string;
    originalCreatedAt: Date;
  };

  @ApiPropertyOptional({
    type: () => FileUpload,
    description: 'File attachment for the message',
  })
  @ManyToOne(() => FileUpload, {
    nullable: true,
    eager: true,
    onDelete: 'SET NULL',
  })
  @JoinColumn({ name: 'attachmentId' })
  attachment?: FileUpload | null;

  @ApiProperty({
    type: () => User,
    description: 'User who sent the message',
  })
  @ManyToOne(() => User, { eager: true })
  @JoinColumn({ name: 'senderId' })
  sender?: User;

  @ApiProperty({
    type: () => Chat,
    description: 'Chat this message belongs to',
  })
  @ManyToOne(() => Chat, (chat) => chat.messages, {
    onDelete: 'CASCADE',
  })
  @JoinColumn({ name: 'conversationId' })
  chat?: Chat;

  @ApiProperty({
    type: () => [ChatUserMessage],
    description: 'User interactions with this message',
  })
  @OneToMany(() => ChatUserMessage, (chatUserMessage) => chatUserMessage.message)
  chatUserMessages?: ChatUserMessage[];
}

