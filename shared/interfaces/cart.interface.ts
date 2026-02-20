/**
 * Cart interfaces derived from cart DTOs.
 * Use in cart.api, use-cart, and cart components.
 */

/** Single cart line item (product or variant + quantity + price snapshot) */
export interface ICartLineItem {
  productId: string;
  productVariantId?: string;
  description: string;
  imageUrl?: string;
  quantity: number;
  unitPrice: number;
}

/** Cart payload (response from get cart) */
export interface ICart {
  items?: ICartLineItem[];
}

/** Payload to add an item to cart */
export interface IAddToCart {
  productId: string;
  productVariantId?: string;
  quantity: number;
}
