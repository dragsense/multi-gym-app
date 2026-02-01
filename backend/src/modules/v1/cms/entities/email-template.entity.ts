import { Entity, Column } from 'typeorm';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { GeneralBaseEntity } from '@/common/entities';

@Entity('email_templates')
export class EmailTemplate extends GeneralBaseEntity {
  @ApiProperty({
    example: 'Welcome Email',
    description: 'Template name',
  })
  @Column({ type: 'varchar', length: 255 })
  name: string;

  @ApiProperty({
    example: 'welcome-email',
    description: 'Template identifier (unique)',
  })
  @Column({ type: 'varchar', length: 255, unique: true })
  identifier: string;

  @ApiProperty({
    example: 'Welcome to our platform!',
    description: 'Email subject',
  })
  @Column({ type: 'varchar', length: 500 })
  subject: string;

  @ApiProperty({
    description: 'PUCK editor data (JSON)',
  })
  @Column({ type: 'jsonb' })
  content: any;

  @ApiPropertyOptional({
    example: ['user.email', 'user.firstName', 'user.lastName'],
    description: 'Available dynamic variables',
  })
  @Column({ type: 'text', array: true, default: [] })
  availableVariables?: string[];

  @ApiPropertyOptional({
    example: 'Welcome email sent to new users',
    description: 'Template description',
  })
  @Column({ type: 'text', nullable: true })
  description?: string;

  @ApiPropertyOptional({
    example: true,
    description: 'Whether the template is active',
  })
  @Column({ type: 'boolean', default: true })
  isActive?: boolean;
}
