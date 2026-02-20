import type { IProduct } from "@shared/interfaces/products/product.interface";
import { ListHandler } from "@/handlers";
import { RelatedProducts } from "@/components/admin/store";
import { fetchRelatedProducts } from "@/services/store.api";

interface IRelatedProductsProps {
  product: IProduct | null | undefined;
  limit?: number;
}

// Page-component: wires ListHandler + API, passes list store down to UI list
export default function RelatedProductsList({ product, limit = 4 }: IRelatedProductsProps) {
  const productId = product?.id;
  const productTypeId = (product as any)?.productType?.id as string | undefined;

  if (!productId || !productTypeId) {
    return null;
  }

  return (
    <ListHandler<IProduct, any, Record<string, unknown>>
      storeKey={`related-products-${productId}`}
      name="RelatedProducts"
      queryFn={(params) => fetchRelatedProducts(productId, params)}
      initialParams={{
        page: 1,
        limit: limit || 4,
      }}
      ListComponent={RelatedProducts}
    />
  );
}

