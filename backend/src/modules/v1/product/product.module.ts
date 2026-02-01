import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { CrudModule } from '@/common/crud/crud.module';
import { FileUploadModule } from '@/common/file-upload/file-upload.module';
import { Attribute } from './entities/attribute.entity';
import { AttributeValue } from './entities/attribute-value.entity';
import { Product } from './entities/product.entity';
import { ProductVariant } from './entities/product-variant.entity';
import { ProductType } from './entities/product-type.entity';
import { AttributeService } from './services/attribute.service';
import { AttributeValueService } from './services/attribute-value.service';
import { ProductService } from './services/product.service';
import { ProductTypeService } from './services/product-type.service';
import { AttributeController } from './controllers/attribute.controller';
import { AttributeValueController } from './controllers/attribute-value.controller';
import { ProductController } from './controllers/product.controller';
import { ProductTypeController } from './controllers/product-type.controller';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      Attribute,
      AttributeValue,
      Product,
      ProductVariant,
      ProductType,
    ]),
    CrudModule,
    FileUploadModule,
  ],
  controllers: [
    AttributeController,
    AttributeValueController,
    ProductController,
    ProductTypeController,
  ],
  providers: [
    AttributeService,
    AttributeValueService,
    ProductService,
    ProductTypeService,
  ],
  exports: [
    AttributeService,
    AttributeValueService,
    ProductService,
    ProductTypeService,
  ],
})
export class ProductModule {}
