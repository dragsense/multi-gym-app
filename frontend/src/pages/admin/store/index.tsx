import type { IProduct } from "@shared/interfaces/products/product.interface";
import { ListHandler, SingleHandler } from "@/handlers";
import { StoreProductList, StoreProductView } from "@/components/admin/store";
import { AddToCart, CartIndicator } from "@/page-components/store";
import { fetchStoreProducts, fetchStoreProduct } from "@/services/store.api";
import { PageInnerLayout } from "@/layouts";
import { ProductListDto } from "@shared/dtos";
import type { IStoreProductListExtraProps } from "@/components/admin/store";

const STORE_KEY = "store-product";

export default function StorePage() {
  return (
    <PageInnerLayout Header={  <CartIndicator />}>
      <SingleHandler<IProduct, Record<string, unknown>>
        queryFn={(id, params) => fetchStoreProduct(id, params as any)}
        storeKey={STORE_KEY}
        initialParams={{
          _relations: "defaultImages,variants,productType",
        }}
        SingleComponent={StoreProductView}
        actionComponents={[{ action: "addToCart", comp: AddToCart }]}
      />
      <ListHandler<
        IProduct,
        any,
        IStoreProductListExtraProps,
        IProduct,
        unknown
      >
        queryFn={fetchStoreProducts}
        initialParams={{
          _relations: "defaultImages,variants,variants.attributeValues,variants.attributeValues.attribute",
          sortBy: "createdAt",
          sortOrder: "DESC",
        }}
        ListComponent={StoreProductList}
        dto={ProductListDto}
        storeKey={STORE_KEY}
        listProps={{}}
      />
    </PageInnerLayout>
  );
}
