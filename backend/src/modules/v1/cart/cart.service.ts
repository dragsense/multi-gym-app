import { Injectable, NotFoundException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { CacheService } from '@/common/cache/cache.service';
import { CartDto, CartLineItemDto, AddToCartDto } from '@shared/dtos';
import { ProductService } from '../product/services/product.service';

const CART_KEY_PREFIX = 'cart';

@Injectable()
export class CartService {
  constructor(
    private readonly cache: CacheService,
    private readonly configService: ConfigService,
    private readonly productService: ProductService,
  ) {}

  private getCartPrefix(): string {
    return this.configService.get<string>('cache.cartPrefix') || CART_KEY_PREFIX;
  }

  private getCartTtl(): number {
    return this.configService.get<number>('cache.cartTtl') ?? 7 * 24 * 3600;
  }

  async getCart(userId: string): Promise<CartDto> {
    const raw = await this.cache.get<{ items?: CartLineItemDto[] }>(userId, {
      prefix: this.getCartPrefix(),
      ttl: this.getCartTtl(),
    });
    if (!raw || !raw.items) {
      return { items: [] };
    }
    return { items: raw.items };
  }

  async setCart(userId: string, cart: CartDto): Promise<void> {
    await this.cache.set(userId, { items: cart.items ?? [] }, {
      prefix: this.getCartPrefix(),
      ttl: this.getCartTtl(),
    });
  }

  async addToCart(userId: string, dto: AddToCartDto): Promise<CartDto> {
    const product = await this.productService.getSingle(dto.productId, {
      _relations: ['variants', 'defaultImages'],
    } as any);
    if (!product) {
      throw new NotFoundException('Product not found');
    }

    let unitPrice = Number(product.defaultPrice);
    let description = product.name;
    let productVariantId: string | undefined;

    if (dto.productVariantId) {
      const variant = product.variants?.find((v) => v.id === dto.productVariantId);
      if (variant) {
        unitPrice = Number(variant.price);
        description = `${product.name} - ${variant.sku}`;
        productVariantId = variant.id;
      }
    }

    let imageUrl: string | undefined;
    if (product.defaultImages && product.defaultImages.length > 0) {
      const img = product.defaultImages[0] as any;
      imageUrl = img.url || (typeof img === 'string' ? img : undefined);
    }

    const cart = await this.getCart(userId);
    const items = cart.items ?? [];
    const existing = items.find(
      (i) =>
        i.productId === dto.productId &&
        (i.productVariantId ?? undefined) === (productVariantId ?? undefined),
    );
    if (existing) {
      existing.quantity += dto.quantity;
    } else {
      items.push({
        productId: dto.productId,
        productVariantId,
        description,
        quantity: dto.quantity,
        unitPrice,
        imageUrl,
      });
    }
    const updated: CartDto = { items };
    await this.setCart(userId, updated);
    return updated;
  }

  async updateCartItem(
    userId: string,
    productId: string,
    productVariantId: string | undefined,
    quantity: number,
  ): Promise<CartDto> {
    const cart = await this.getCart(userId);
    const items = cart.items ?? [];
    const idx = items.findIndex(
      (i) =>
        i.productId === productId &&
        (i.productVariantId ?? undefined) === (productVariantId ?? undefined),
    );
    if (idx === -1) {
      return cart;
    }
    if (quantity <= 0) {
      items.splice(idx, 1);
    } else {
      items[idx].quantity = quantity;
    }
    const updated: CartDto = { items };
    await this.setCart(userId, updated);
    return updated;
  }

  async removeFromCart(
    userId: string,
    productId: string,
    productVariantId?: string,
  ): Promise<CartDto> {
    const cart = await this.getCart(userId);
    const items = (cart.items ?? []).filter(
      (i) =>
        !(
          i.productId === productId &&
          (i.productVariantId ?? undefined) === (productVariantId ?? undefined)
        ),
    );
    const updated: CartDto = { items };
    await this.setCart(userId, updated);
    return updated;
  }

  async clearCart(userId: string): Promise<void> {
    await this.setCart(userId, { items: [] });
  }
}
