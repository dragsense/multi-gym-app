import { useQueryClient } from "@tanstack/react-query";
import { useTransition } from "react";
import type { IAttribute } from "@shared/interfaces/products/attribute.interface";
import { ListHandler, SingleHandler } from "@/handlers";
import { AttributeList } from "@/components/admin/products/attributes";
import { AttributeForm } from "@/page-components/products/attributes";
import { AttributeValuesModal } from "@/page-components/products/attributes/attribute-values";
import {
  fetchAttributes,
  fetchAttribute,
  deleteAttribute,
} from "@/services/products/attribute.api";
import { PageInnerLayout } from "@/layouts";
import { AttributeListDto } from "@shared/dtos";

export default function AttributesPage() {
  const queryClient = useQueryClient();
  const [, startTransition] = useTransition();
  const STORE_KEY = "attribute";

  return (
    <PageInnerLayout Header={null}>
      <SingleHandler<IAttribute, Record<string, unknown>>
        queryFn={(id, params) => fetchAttribute(id, params as any)}
        storeKey={STORE_KEY}
        SingleComponent={() => null}
        actionComponents={[
          { action: "createOrUpdate", comp: AttributeForm },
        ]}
      />
      <ListHandler<IAttribute, any, any, IAttribute, unknown>
        queryFn={fetchAttributes}
        initialParams={{ sortBy: "createdAt", sortOrder: "DESC" }}
        ListComponent={AttributeList}
        deleteFn={deleteAttribute}
        onDeleteSuccess={() => {
          startTransition(() => {
            queryClient.invalidateQueries({ queryKey: [STORE_KEY + "-list"] });
          });
        }}
        dto={AttributeListDto}
        storeKey={STORE_KEY}
        listProps={{}}
        actionComponents={[{ action: "manageAttributeValues", comp: AttributeValuesModal }]}
      />
    </PageInnerLayout>
  );
}
