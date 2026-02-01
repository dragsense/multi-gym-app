import { BadRequestException, ConflictException, Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, EntityManager, In, IsNull } from 'typeorm';
import { ModuleRef } from '@nestjs/core';
import { Product } from '../entities/product.entity';
import { ProductVariant } from '../entities/product-variant.entity';
import { ProductType } from '../entities/product-type.entity';
import { AttributeValue } from '../entities/attribute-value.entity';
import { FileUpload } from '@/common/file-upload/entities/file-upload.entity';
import { FileUploadService } from '@/common/file-upload/file-upload.service';
import { EFileType } from '@shared/enums';
import {
  CreateProductDto,
  UpdateProductDto,
  CreateProductVariantDto,
  UpdateProductVariantDto,
} from '@shared/dtos';
import { CrudService } from '@/common/crud/crud.service';
import { CrudOptions } from '@/common/crud/interfaces/crud.interface';

const PRODUCT_IMAGES_FOLDER = 'products';

// Helper function to parse variants if they come as JSON string
function parseVariants(variants: any): CreateProductVariantDto[] | UpdateProductVariantDto[] | undefined {
  if (!variants) return undefined;
  
  // If already an array, return as is
  if (Array.isArray(variants)) {
    return variants;
  }
  
  // If it's a string, try to parse it
  if (typeof variants === 'string') {
    try {
      const parsed = JSON.parse(variants);
      return Array.isArray(parsed) ? parsed : undefined;
    } catch {
      return undefined;
    }
  }
  
  return undefined;
}

// Helper function to parse productType if it comes as JSON string
function parseProductType(productType: any): { id: string } | null | undefined {
  if (productType === null || productType === undefined) {
    return null; // Explicitly set to null if provided as null
  }
  
  // If already an object with id, return as is
  if (typeof productType === 'object' && productType !== null && productType.id) {
    return { id: productType.id };
  }
  
  // If it's a string, try to parse it
  if (typeof productType === 'string') {
    // Check if it's "null" string
    if (productType === 'null' || productType === '') {
      return null;
    }
    try {
      const parsed = JSON.parse(productType);
      if (parsed && typeof parsed === 'object' && parsed.id) {
        return { id: parsed.id };
      }
      return null;
    } catch {
      return null;
    }
  }
  
  return undefined; // If not provided, don't set it
}

async function createVariantsForProduct(
  manager: EntityManager,
  product: Product,
  inputs: CreateProductVariantDto[],
): Promise<void> {
  if (!inputs?.length) return;
  const variantRepo = manager.getRepository(ProductVariant);
  const avRepo = manager.getRepository(AttributeValue);
  for (const v of inputs) {
    let attributeValues: AttributeValue[] = [];
    if (v.attributeValues?.length) {
      attributeValues = await avRepo.find({
        where: { id: In(v.attributeValues.map((x) => x.id)) },
        relations: ['attribute'],
      });
      if (attributeValues.length !== v.attributeValues.length) {
        throw new NotFoundException('One or more attribute values not found');
      }
    }
    const variant = variantRepo.create({
      sku: v.sku,
      price: v.price,
      quantity: v.quantity,
      product,
      attributeValues,
      isActive: v.isActive ?? true,
    });
    await manager.save(variant);
  }
}

async function syncVariantsForProduct(
  manager: EntityManager,
  product: Product,
  inputs: UpdateProductVariantDto[],
): Promise<void> {
  const variantRepo = manager.getRepository(ProductVariant);
  const avRepo = manager.getRepository(AttributeValue);
  const existing = await variantRepo.find({
    where: { product: { id: product.id }, deletedAt: IsNull() },
    relations: ['attributeValues', 'attributeValues.attribute'],
  });
  const inputIds = new Set((inputs ?? []).filter((x) => x.id).map((x) => x.id!));
  const toDelete = existing.filter((e) => !inputIds.has(e.id));
  for (const v of toDelete) {
    await manager.softRemove(v);
  }
  for (const v of inputs ?? []) {
    let attributeValues: AttributeValue[] = [];
    if (v.attributeValues?.length) {
      attributeValues = await avRepo.find({
        where: { id: In(v.attributeValues.map((x) => x.id)) },
        relations: ['attribute'],
      });
      if (attributeValues.length !== v.attributeValues.length) {
        throw new NotFoundException('One or more attribute values not found');
      }
    }
    if (v.id) {
      const ex = existing.find((e) => e.id === v.id);
      if (!ex) throw new NotFoundException(`Variant ${v.id} not found`);
      ex.sku = v.sku!;
      ex.price = v.price as any;
      ex.quantity = v.quantity!;
      ex.attributeValues = attributeValues;
      ex.isActive = v.isActive ?? true;
      await manager.save(ex);
    } else {
      const variant = variantRepo.create({
        sku: v.sku!,
        price: v.price!,
        quantity: v.quantity!,
        product,
        attributeValues,
        isActive: v.isActive ?? true,
      });
      await manager.save(variant);
    }
  }
}

@Injectable()
export class ProductService extends CrudService<Product> {
  constructor(
    @InjectRepository(Product)
    productRepo: Repository<Product>,
    private readonly fileUploadService: FileUploadService,
    moduleRef: ModuleRef,
  ) {
    const crudOptions: CrudOptions = {
      searchableFields: ['name', 'description'],
    };
    super(productRepo, moduleRef, crudOptions);
  }

  async createProduct(
    createProductDto: Omit<CreateProductDto, 'defaultImages'>,
    defaultImages?: Express.Multer.File[],
  ) {

    const { variants: rawVariants, productType: rawProductType, ...rest } = createProductDto;
    
    // Parse variants if they come as JSON string (multipart/form-data issue)
    const variants = parseVariants(rawVariants) as CreateProductVariantDto[] | undefined;
    
    // Parse productType if it comes as JSON string (multipart/form-data issue)
    const parsedProductType = parseProductType(rawProductType);
    
    const defaultSku = rest.defaultSku?.trim();
    if (defaultSku) {
      const existing = await this.getSingle({
        defaultSku,
      }, undefined, undefined, undefined, true);

      if (existing) throw new ConflictException(`A product with default SKU "${defaultSku}" already exists. Default SKU must be unique.`);
    }
    
    // Validate variant quantities sum
    if (variants && Array.isArray(variants) && variants.length > 0) {
      const totalVariantQuantity = variants.reduce((sum, v) => sum + (v.quantity || 0), 0);
      if (totalVariantQuantity > rest.totalQuantity) {
        throw new BadRequestException(
          `Sum of variant quantities (${totalVariantQuantity}) must be less than or equal to total quantity (${rest.totalQuantity})`
        );
      }
    }
    
    const payload = {
      ...rest,
      isActive: rest.isActive ?? true,
    };
    const product = await this.create(payload as any, {
      beforeCreate: async (processedData, manager) => {
        // Handle productType relation using entity manager
        if (parsedProductType !== undefined) {
          if (parsedProductType === null) {
            processedData.productType = null;
          } else {
            // Get ProductType entity reference
            const productTypeRepo = manager.getRepository(ProductType);
            const productTypeEntity = await productTypeRepo.findOne({
              where: { id: parsedProductType.id },
            });
            if (!productTypeEntity) {
              throw new NotFoundException(`ProductType with id ${parsedProductType.id} not found`);
            }
            processedData.productType = productTypeEntity;
          }
        }
        return processedData;
      },
      afterCreate: async (savedProduct, manager) => {
        const uploadedImages: { fileUpload: FileUpload; file: Express.Multer.File }[] = [];
        if (defaultImages && defaultImages.length > 0) {
          const filesToUpload = defaultImages.slice(0, 10);
          for (const file of filesToUpload) {
            const uploaded = await this.fileUploadService.createFile(
              {
                name: file.originalname,
                type: EFileType.IMAGE,
                folder: PRODUCT_IMAGES_FOLDER,
              },
              file,
              false,
              manager,
            );
            uploadedImages.push({ fileUpload: uploaded, file });
          }
          savedProduct.defaultImages = uploadedImages.map((u) => u.fileUpload);
          await manager.save(savedProduct);
          await createVariantsForProduct(manager, savedProduct, variants ?? []);

          await this.fileUploadService.saveFiles(uploadedImages);
        }
      },
    });
    return { message: 'Product created successfully', product };
  }

  async updateProduct(
    id: string,
    updateProductDto: Omit<UpdateProductDto, 'defaultImages'>,
    defaultImages?: Express.Multer.File[],
  ) {
    const { variants, removedDefaultImageIds, productType: rawProductType, ...rest } = updateProductDto;
    
    // Parse productType if it comes as JSON string (multipart/form-data issue)
    const parsedProductType = parseProductType(rawProductType);
    const defaultSku = rest.defaultSku?.trim();
    if (defaultSku !== undefined && defaultSku !== '') {
      const existing = await this.getSingle({
        defaultSku,
      }, undefined, undefined, undefined, true);
      if (existing && existing.id !== id) {
        throw new ConflictException(
          `A product with default SKU "${defaultSku}" already exists. Default SKU must be unique.`,
        );
      }
    }
    
    // Get current product to check totalQuantity if not provided in update
    const currentProduct = await this.getSingle(id);
    if (!currentProduct) {
      throw new NotFoundException('Product not found');
    }
    
    // Parse variants if they come as JSON string (multipart/form-data issue)
    const parsedVariants = parseVariants(variants) as UpdateProductVariantDto[] | undefined;
    
    // Use updated totalQuantity or fall back to current
    const totalQuantity = rest.totalQuantity !== undefined ? rest.totalQuantity : currentProduct.totalQuantity;
    
    // Validate variant quantities sum if variants are provided
    if (parsedVariants && Array.isArray(parsedVariants) && parsedVariants.length > 0) {
      const totalVariantQuantity = parsedVariants.reduce((sum, v) => sum + (v.quantity || 0), 0);
      if (totalVariantQuantity > totalQuantity) {
        throw new BadRequestException(
          `Sum of variant quantities (${totalVariantQuantity}) must be less than or equal to total quantity (${totalQuantity})`
        );
      }
    }
    const productData = {
      ...rest,
    };
    await this.update(id, productData as any, {
      beforeUpdate: async (processedData, existingEntity, manager) => {
        // Handle productType relation using entity manager
        if (parsedProductType !== undefined) {
          if (parsedProductType === null) {
            processedData.productType = null;
          } else {
            // Get ProductType entity reference
            const productTypeRepo = manager.getRepository(ProductType);
            const productTypeEntity = await productTypeRepo.findOne({
              where: { id: parsedProductType.id },
            });
            if (!productTypeEntity) {
              throw new NotFoundException(`ProductType with id ${parsedProductType.id} not found`);
            }
            processedData.productType = productTypeEntity;
          }
        }
        return processedData;
      },
      afterUpdate: async (entity, manager) => {
        const productRepo = manager.getRepository(Product);
        const product = await productRepo.findOne({
          where: { id },
          relations: ['defaultImages'],
        });
        if (!product) throw new NotFoundException('Product not found');

        let imagesToRemove: FileUpload[] = [];

        if (removedDefaultImageIds && removedDefaultImageIds.length > 0) {
          imagesToRemove =
            product.defaultImages?.filter((img) =>
              removedDefaultImageIds.includes(img.id),
            ) ?? [];
          if (imagesToRemove.length > 0) {
            product.defaultImages =
              product.defaultImages?.filter(
                (img) => !imagesToRemove.some((r) => r.id === img.id),
              ) ?? [];
          }
          entity.defaultImages = product.defaultImages;
        }

        const uploadedImages: { fileUpload: FileUpload; file: Express.Multer.File }[] = [];
        if (defaultImages && defaultImages.length > 0) {
          const filesToUpload = defaultImages.slice(0, 10);
          for (const file of filesToUpload) {
            const uploaded = await this.fileUploadService.createFile(
              {
                name: file.originalname,
                type: EFileType.IMAGE,
                folder: PRODUCT_IMAGES_FOLDER,
              },
              file,
              false,
              manager,
            );
            uploadedImages.push({ fileUpload: uploaded, file });
          }
          if (product.defaultImages?.length) {
            product.defaultImages = [
              ...product.defaultImages,
              ...uploadedImages.map((u) => u.fileUpload),
            ];
          } else {
            product.defaultImages = uploadedImages.map((u) => u.fileUpload);
          }
          if (product.defaultImages.length > 10) {
            product.defaultImages = product.defaultImages.slice(-10);
          }
          entity.defaultImages = product.defaultImages;
        }

    
        await manager.save(entity);

        if (parsedVariants) {
          await syncVariantsForProduct(manager, entity as Product, parsedVariants);
        }

        if (uploadedImages.length > 0) {
          await this.fileUploadService.saveFiles(uploadedImages);
        }
        if (imagesToRemove.length > 0) {
          this.fileUploadService.deleteFiles(imagesToRemove).catch((err) => {
            this.logger.error(err instanceof Error ? err.message : String(err));
          });
        }

     
      },
    });
    return { message: 'Product updated successfully' };
  }
}
