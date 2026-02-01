import { Entity, Column, OneToMany } from 'typeorm';
import { ApiProperty } from '@nestjs/swagger';
import { GeneralBaseEntity } from '@/common/entities';
import { AttributeValue } from './attribute-value.entity';
import { EAttributeType } from '@shared/enums/products/attribute-type.enum';

@Entity('attributes')
export class Attribute extends GeneralBaseEntity {
  @ApiProperty({ example: 'Color', description: 'Attribute name (e.g. Color, Size)' })
  @Column({ type: 'varchar', length: 255 })
  name: string;

  @ApiProperty({ 
    example: EAttributeType.COLOR, 
    description: 'Attribute type',
    enum: EAttributeType,
  })
  @Column({ 
    type: 'enum', 
    enum: EAttributeType, 
    nullable: true 
  })
  type?: EAttributeType;

  @OneToMany(() => AttributeValue, (av) => av.attribute)
  attributeValues: AttributeValue[];
}
