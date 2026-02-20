import { GeneralBaseEntity } from '@/common/entities';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Column, Entity, JoinColumn, ManyToOne } from 'typeorm';
import { Business } from '@/modules/v1/business/entities/business.entity';

/**
 * Paysafe "Connect" via Applications API.
 * Stores the Paysafe application id & status per business (similar to StripeConnectAccount).
 */
@Entity('paysafe_connect_accounts')
export class PaysafeConnectAccount extends GeneralBaseEntity {
  @ApiProperty({ description: 'Paysafe application ID' })
  @Column({ type: 'varchar', length: 255, unique: true })
  applicationId: string;

  @ApiPropertyOptional({ description: 'Paysafe application status' })
  @Column({ type: 'varchar', length: 100, nullable: true })
  status: string | null;

  @ApiPropertyOptional({ description: 'Raw response snapshot from Paysafe' })
  @Column({ type: 'jsonb', nullable: true })
  raw?: Record<string, any>;

  @ManyToOne(() => Business, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'businessId' })
  business: Business;

  @Column({ type: 'uuid' })
  businessId: string;
}

