import { Entity, Column, ManyToOne, Index, JoinColumn } from 'typeorm';
import { ApiProperty } from '@nestjs/swagger';
import { GeneralBaseEntity } from '@/common/entities';
import { EBusinessStatus } from '@shared/enums/business/business.enum';
import { User } from '@/common/base-user/entities/user.entity';


@Entity('businesses')
export class Business extends GeneralBaseEntity {
    @ApiProperty({ example: 'My Gym', description: 'Name of the business' })
    @Column({ type: 'varchar', length: 255 })
    name: string;

    @ApiProperty({ example: 'mygym', description: 'Subdomain for the business' })
    @Column({ type: 'varchar', length: 255, nullable: true, unique: true })
    @Index('idx_business_subdomain', { unique: true })
    subdomain: string;

    @ApiProperty({ example: '550e8400-e29b-41d4-a716-446655440000', description: 'Tenant ID for database routing' })
    @Column({ type: 'uuid', nullable: true, unique: true })
    @Index('idx_business_tenant_id', { unique: true })
    tenantId: string;

    @ApiProperty({ type: () => User, description: 'User who owns this business' })
    @ManyToOne(() => User, { onDelete: 'CASCADE' })
    @JoinColumn({ name: 'userId' })
    user: User;

}
