import { Entity, Column, ManyToOne, JoinColumn } from 'typeorm';
import { ApiProperty } from '@nestjs/swagger';
import { GeneralBaseEntity } from '@/common/entities';
import { Attribute } from './attribute.entity';

@Entity('attribute_values')
export class AttributeValue extends GeneralBaseEntity {
  @ApiProperty({ example: 'Red', description: 'Attribute value (e.g. Red, Blue, XL)' })
  @Column({ type: 'varchar', length: 255 })
  value: string;

  @ApiProperty({ example: 'A vibrant red color', description: 'Description of the attribute value' })
  @Column({ type: 'text', nullable: true })
  description: string;

  @ManyToOne(() => Attribute, (attr) => attr.attributeValues, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'attributeId' })
  attribute: Attribute;
}
