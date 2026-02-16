import { useParams } from "react-router-dom";
import type { IProduct } from "@shared/interfaces/products/product.interface";
import { PageInnerLayout } from "@/layouts";
import { SingleHandler } from "@/handlers";
import { StoreProductDetail, CartIndicator } from "@/page-components/store";
import { fetchStoreProduct } from "@/services/store.api";

type TStoreProductDetailExtraProps = Record<string, unknown>;

export default function StoreProductDetailPage() {
  const { id } = useParams<{ id: string }>();
  if (!id) return null;

  const STORE_PRODUCT_DETAIL_STORE_KEY = `store-product-detail-${id}`;

  return (
    <PageInnerLayout
      Header={
        <div className="flex justify-end w-full px-4">
          <CartIndicator />
        </div>
      }
    >
      <SingleHandler<IProduct, TStoreProductDetailExtraProps>
        queryFn={(_, params) => fetchStoreProduct(id, params as any)}
        storeKey={STORE_PRODUCT_DETAIL_STORE_KEY}
        initialParams={{
          _relations:
            "defaultImages,variants,productType,variants.attributeValues,variants.attributeValues.attribute",
        }}
        enabled={!!id}
        SingleComponent={StoreProductDetail}
      />
    </PageInnerLayout>
  );
}
