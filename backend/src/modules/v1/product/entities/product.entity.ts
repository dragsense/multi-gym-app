import { Entity, Column, OneToMany, ManyToMany, ManyToOne, JoinTable, JoinColumn } from 'typeorm';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { GeneralBaseEntity } from '@/common/entities';
import { ProductVariant } from './product-variant.entity';
import { ProductType } from './product-type.entity';
import { FileUpload } from '@/common/file-upload/entities/file-upload.entity';

@Entity('products')
export class Product extends GeneralBaseEntity {
  @ApiProperty({ example: 'T-Shirt', description: 'Product name' })
  @Column({ type: 'varchar', length: 255 })
  name: string;

  @ApiPropertyOptional({
    description: 'Product type (e.g. Clothing, Electronics)',
    type: () => ProductType,
  })
  @ManyToOne(() => ProductType, (pt) => pt.products, { nullable: true, onDelete: 'SET NULL' })
  @JoinColumn({ name: 'productTypeId' })
  productType?: ProductType | null;

  @ApiPropertyOptional({ example: 'Comfortable cotton t-shirt', description: 'Product description' })
  @Column({ type: 'text', nullable: true })
  description?: string;

  @ApiPropertyOptional({ example: 'SKU', description: 'Default SKU prefix for variants (e.g. MYPROD → MYPROD-1, MYPROD-2). Must be unique across products.' })
  @Column({ type: 'varchar', length: 100, unique: true })
  defaultSku: string;

  @ApiProperty({ example: 29.99, description: 'Default price' })
  @Column({ type: 'decimal', precision: 10, scale: 2, default: 0 })
  defaultPrice: number;

  @ApiProperty({ example: 100, description: 'Total quantity across all variants' })
  @Column({ type: 'int', default: 0 })
  totalQuantity: number;

  @ApiPropertyOptional({
    description: 'Default images (FileUpload entities), same pattern as profile documents',
    type: () => [FileUpload],
  })
  @ManyToMany(() => FileUpload, { cascade: true })
  @JoinTable({
    name: 'product_default_images',
    joinColumn: { name: 'product_id', referencedColumnName: 'id' },
    inverseJoinColumn: { name: 'image_id', referencedColumnName: 'id' },
  })
  defaultImages?: FileUpload[];

  @ApiProperty({ example: true, description: 'Whether product is active' })
  @Column({ type: 'boolean', default: true })
  isActive: boolean;

  @OneToMany(() => ProductVariant, (v) => v.product, { cascade: true })
  variants: ProductVariant[];
}
