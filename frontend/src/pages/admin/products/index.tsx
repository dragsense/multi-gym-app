import { useQueryClient } from "@tanstack/react-query";
import { useTransition } from "react";
import type { IProduct } from "@shared/interfaces/products/product.interface";
import { ListHandler, SingleHandler } from "@/handlers";
import { ProductList, ProductView } from "@/components/admin/products";
import { ProductForm } from "@/page-components/products";
import { fetchProducts, fetchProduct, deleteProduct } from "@/services/products/product.api";
import { PageInnerLayout } from "@/layouts";
import { ProductListDto } from "@shared/dtos";
import type { IProductListExtraProps } from "@/components/admin/products";

export default function ProductsPage() {
  const queryClient = useQueryClient();
  const [, startTransition] = useTransition();
  const STORE_KEY = "product";

  return (
    <PageInnerLayout Header={null}>
      <SingleHandler<IProduct, Record<string, unknown>>
        queryFn={(id, params) => fetchProduct(id, params as any)}
        storeKey={STORE_KEY}
        initialParams={{ _relations: "defaultImages,variants.attributeValues.attribute",
          _select: "variants.sku, variants.price, variants.quantity, variants.attributeValues.id, variants.attributeValues.value, variants.attributeValues.attribute.id, variants.attributeValues.attribute.name, variants.attributeValues.attribute.type"
         }}
        SingleComponent={ProductView}
        actionComponents={[
          { action: "createOrUpdate", comp: ProductForm },
        ]}
      /> 
      <ListHandler<IProduct, any, IProductListExtraProps, IProduct, unknown>
        queryFn={fetchProducts}
        initialParams={{
          _relations: "defaultImages",
          sortBy: "createdAt",
          sortOrder: "DESC",
        }}
        ListComponent={ProductList}
        deleteFn={deleteProduct}
        onDeleteSuccess={() => {
          startTransition(() => {
            queryClient.invalidateQueries({ queryKey: [STORE_KEY + "-list"] });
          });
        }}
        dto={ProductListDto}
        storeKey={STORE_KEY}
        listProps={{}}
      />
    </PageInnerLayout>
  );
}
