import { Entity, Column, OneToMany } from 'typeorm';
import { ApiProperty } from '@nestjs/swagger';
import { GeneralBaseEntity } from '@/common/entities';
import { Product } from './product.entity';

@Entity('product_types')
export class ProductType extends GeneralBaseEntity {
  @ApiProperty({ example: 'Clothing', description: 'Product type name (e.g. Clothing, Electronics)' })
  @Column({ type: 'varchar', length: 255 })
  name: string;

  @OneToMany(() => Product, (p) => p.productType)
  products: Product[];
}
