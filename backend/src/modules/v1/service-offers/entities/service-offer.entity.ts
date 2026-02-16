import { Entity, Column, ManyToOne, JoinColumn } from 'typeorm';
import { ApiProperty } from '@nestjs/swagger';
import { GeneralBaseEntity } from '@/common/entities';
import { EServiceOfferStatus } from '@shared/enums/service-offer.enum';
import { Staff } from '../../staff/entities/staff.entity';
import { TrainerService } from '../../trainer-services/entities/trainer-service.entity';

@Entity('service_offers')
export class ServiceOffer extends GeneralBaseEntity {
  @ApiProperty({
    example: 'Summer Special',
    description: 'Service offer name',
  })
  @Column({ type: 'varchar', length: 255 })
  name: string;

  @ApiProperty({
    example: 100,
    description: 'Offer price',
  })
  @Column({ type: 'decimal', precision: 10, scale: 2 })
  offerPrice: number;

  @ApiProperty({
    example: 10,
    description: 'Discount percentage',
  })
  @Column({ type: 'decimal', precision: 5, scale: 2, default: 0 })
  discount: number;

  @ApiProperty({
    enum: EServiceOfferStatus,
    example: EServiceOfferStatus.ACTIVE,
    description: 'Service offer status',
  })
  @Column({
    type: 'enum',
    enum: EServiceOfferStatus,
    default: EServiceOfferStatus.ACTIVE,
  })
  status: EServiceOfferStatus;

  @ApiProperty({ type: () => Staff, description: 'Associated trainer' })
  @ManyToOne(() => Staff, { eager: true })
  @JoinColumn({ name: 'trainerId' })
  trainer: Staff;

  @ApiProperty({ type: () => TrainerService, description: 'Associated trainer service' })
  @ManyToOne(() => TrainerService, { eager: true })
  @JoinColumn({ name: 'trainerServiceId' })
  trainerService: TrainerService;
}

