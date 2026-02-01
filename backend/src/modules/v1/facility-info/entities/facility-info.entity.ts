import { Entity, Column } from 'typeorm';
import { ApiProperty } from '@nestjs/swagger';
import { GeneralBaseEntity } from '@/common/entities';
import { EFacilityInfoStatus } from '@shared/enums/facility-info.enum';

@Entity('facility_info')
export class FacilityInfo extends GeneralBaseEntity {
  @ApiProperty({
    example: 'info@example.com',
    description: 'Facility email',
  })
  @Column({ type: 'varchar', length: 255 })
  email: string;

  @ApiProperty({
    example: '+1234567890',
    description: 'Facility phone',
  })
  @Column({ type: 'varchar', length: 20 })
  phone: string;

  @ApiProperty({
    example: '123 Main St, City, State 12345',
    description: 'Facility address',
  })
  @Column({ type: 'varchar', length: 500 })
  address: string;

  @ApiProperty({
    enum: EFacilityInfoStatus,
    example: EFacilityInfoStatus.ACTIVE,
    description: 'Facility status',
  })
  @Column({
    type: 'enum',
    enum: EFacilityInfoStatus,
    default: EFacilityInfoStatus.ACTIVE,
  })
  status: EFacilityInfoStatus;
}

