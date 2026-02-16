import { useQueryClient } from "@tanstack/react-query";
import { useTransition } from "react";
import type { IProductType } from "@shared/interfaces/products/product-type.interface";
import { ListHandler, SingleHandler } from "@/handlers";
import { ProductTypesList } from "@/components/admin/products/product-types";
import { ProductTypeForm } from "@/page-components/products/product-type";
import {
  fetchProductTypes,
  fetchProductType,
  deleteProductType,
} from "@/services/products/product-type.api";
import { PageInnerLayout } from "@/layouts";
import { ProductTypeListDto } from "@shared/dtos";

export default function ProductTypesPage() {
  const queryClient = useQueryClient();
  const [, startTransition] = useTransition();
  const STORE_KEY = "product-type";

  return (
    <PageInnerLayout Header={null}>
      <SingleHandler<IProductType, Record<string, unknown>>
        queryFn={(id, params) => fetchProductType(id, params as any)}
        storeKey={STORE_KEY}
        SingleComponent={() => null}
        actionComponents={[
          { action: "createOrUpdate", comp: ProductTypeForm },
        ]}
      />
      <ListHandler<IProductType, any, any, IProductType, unknown>
        queryFn={fetchProductTypes}
        initialParams={{
          _relations: "products",
          _countable: "products",
          sortBy: "createdAt",
          sortOrder: "DESC",
        }}
        ListComponent={ProductTypesList}
        deleteFn={deleteProductType}
        onDeleteSuccess={() => {
          startTransition(() => {
            queryClient.invalidateQueries({ queryKey: [STORE_KEY + "-list"] });
          });
        }}
        dto={ProductTypeListDto}
        storeKey={STORE_KEY}
        listProps={{}}
      />
    </PageInnerLayout>
  );
}
