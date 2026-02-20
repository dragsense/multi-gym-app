import {
  Entity,
  Column,
  OneToOne,
  ManyToOne,
  ManyToMany,
  JoinTable,
  JoinColumn,
} from 'typeorm';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { User } from '@/common/base-user/entities/user.entity';
import { FileUpload } from '@/common/file-upload/entities/file-upload.entity';
import { GeneralBaseEntity } from '@/common/entities';

@Entity('profiles')
export class Profile extends GeneralBaseEntity {
  // ─── Shared Fields ─────────────────────

  @ApiPropertyOptional({
    example: '+1234567890',
    description: 'Phone number with country code',
  })
  @Column({ type: 'varchar', length: 20, nullable: true })
  phoneNumber?: string;

  @ApiPropertyOptional({
    example: '123 Main St, City, Country',
    description: 'User address',
  })
  @Column({ type: 'varchar', length: 255, nullable: true })
  address?: string;

  @ApiPropertyOptional({
    example: 'RFID123456789',
    description: 'RFID tag number',
  })
  @Column({ type: 'varchar', length: 100, nullable: true })
  rfid?: string;

  @ApiPropertyOptional({
    example: 'John Doe',
    description: 'Emergency contact name',
  })
  @Column({ type: 'varchar', length: 100, nullable: true })
  emergencyContactName?: string;

  @ApiPropertyOptional({
    example: '+1234567890',
    description: 'Emergency contact phone number',
  })
  @Column({ type: 'varchar', length: 20, nullable: true })
  emergencyContactNumber?: string;


  @ApiPropertyOptional({
    example: '+1234567890',
    description: 'Alternative emergency contact phone number',
  })
  @Column({ type: 'varchar', length: 20, nullable: true })
  alternativeEmergencyContactNumber?: string;

  @ApiPropertyOptional({
    example: 'Spouse',
    description: 'Relationship to emergency contact',
  })
  @Column({ type: 'varchar', length: 50, nullable: true })
  emergencyContactRelationship?: string;

  @ApiPropertyOptional({
    example: 'New York',
    description: 'City',
  })
  @Column({ type: 'varchar', length: 100, nullable: true })
  city?: string;

  @ApiPropertyOptional({
    example: 'NY',
    description: 'State',
  })
  @Column({ type: 'varchar', length: 100, nullable: true })
  state?: string;

  @ApiPropertyOptional({
    example: '10001',
    description: 'Zip code',
  })
  @Column({ type: 'varchar', length: 20, nullable: true })
  zipCode?: string;

  @ApiPropertyOptional({
    example: 'United States',
    description: 'Country',
  })
  @Column({ type: 'varchar', length: 100, nullable: true })
  country?: string;


  @ApiProperty({ type: () => User, description: 'Associated user' })
  @OneToOne(() => User, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'userId' })
  user: User;

  @Column({ type: 'uuid', nullable: true })
  userId: string;

  @ApiPropertyOptional({
    description: 'File entity for the uploaded image',
    type: () => FileUpload,
  })
  @ManyToOne(() => FileUpload, {
    cascade: true,
    eager: true,
    nullable: true,
    onDelete: 'SET NULL',
  })
  image?: FileUpload | null;

  @ApiPropertyOptional({
    description: 'Documents uploaded by the user (max 10)',
    type: () => [FileUpload],
  })
  @ManyToMany(() => FileUpload, {
    cascade: true,
    eager: true,
  })
  @JoinTable({
    name: 'profile_documents',
    joinColumn: { name: 'profile_id', referencedColumnName: 'id' },
    inverseJoinColumn: { name: 'document_id', referencedColumnName: 'id' },
  })
  documents?: FileUpload[];
}
