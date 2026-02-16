import { Entity, Column, ManyToOne, JoinColumn } from 'typeorm';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { GeneralBaseEntity } from '@/common/entities';
import { EmailTemplate } from '../../cms/entities/email-template.entity';
import { EAutomationTrigger, EAutomationFormat, EAutomationStatus } from '@shared/enums';

@Entity('automations')
export class Automation extends GeneralBaseEntity {
    @ApiProperty({
        example: 'Members Onboarding',
        description: 'Automation name',
    })
    @Column({ type: 'varchar', length: 255 })
    name: string;

    @ApiProperty({
        example: '550e8400-e29b-41d4-a716-446655440000',
        description: 'Email template ID',
    })
    @Column({ type: 'uuid' })
    emailTemplateId: string;

    @ApiProperty({
        type: () => EmailTemplate,
        description: 'Email template for this automation',
    })
    @ManyToOne(() => EmailTemplate, { onDelete: 'CASCADE' })
    @JoinColumn({ name: 'emailTemplateId' })
    emailTemplate: EmailTemplate;

    @ApiProperty({
        enum: EAutomationTrigger,
        example: EAutomationTrigger.ONBOARD,
        description: 'Trigger event for this automation',
    })
    @Column({
        type: 'enum',
        enum: EAutomationTrigger,
        default: EAutomationTrigger.ONBOARD,
    })
    trigger: EAutomationTrigger;

    @ApiProperty({
        enum: EAutomationFormat,
        example: EAutomationFormat.EMAIL,
        description: 'Format of the automation',
    })
    @Column({
        type: 'enum',
        enum: EAutomationFormat,
        default: EAutomationFormat.EMAIL,
    })
    format: EAutomationFormat;

    @ApiProperty({
        enum: EAutomationStatus,
        example: EAutomationStatus.ACTIVE,
        description: 'Status of the automation',
    })
    @Column({
        type: 'enum',
        enum: EAutomationStatus,
        default: EAutomationStatus.INACTIVE,
    })
    status: EAutomationStatus;

    @ApiProperty({
        example: true,
        description: 'Whether the automation is active',
    })
    @Column({ type: 'boolean', default: false })
    isActive: boolean;
}
