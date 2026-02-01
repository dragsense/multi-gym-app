import { Entity, Column, ManyToOne, ManyToMany, JoinColumn, JoinTable } from 'typeorm';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { GeneralBaseEntity } from '@/common/entities';
import { Product } from './product.entity';
import { AttributeValue } from './attribute-value.entity';

@Entity('product_variants')
export class ProductVariant extends GeneralBaseEntity {
  @ApiProperty({ example: 'SKU-001', description: 'Variant SKU' })
  @Column({ type: 'varchar', length: 255 })
  sku: string;

  @ApiProperty({ example: 34.99, description: 'Variant price' })
  @Column({ type: 'decimal', precision: 10, scale: 2, default: 0 })
  price: number;

  @ApiProperty({ example: 50, description: 'Variant quantity' })
  @Column({ type: 'int', default: 0 })
  quantity: number;

  @ManyToOne(() => Product, (p) => p.variants, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'productId' })
  product: Product;

  @ManyToMany(() => AttributeValue, { cascade: false })
  @JoinTable({
    name: 'product_variant_attribute_values',
    joinColumn: { name: 'productVariantId', referencedColumnName: 'id' },
    inverseJoinColumn: { name: 'attributeValueId', referencedColumnName: 'id' },
  })
  attributeValues: AttributeValue[];

  @ApiProperty({ example: true, description: 'Whether variant is active' })
  @Column({ type: 'boolean', default: true })
  isActive: boolean;
}
