import { useQueryClient } from "@tanstack/react-query";
import { useId, useTransition } from "react";
import { useShallow } from "zustand/shallow";
import { ListHandler, SingleHandler } from "@/handlers";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import { AppDialog } from "@/components/layout-ui/app-dialog";
import { AttributeValuesList } from "@/components/admin/products";
import AttributeValueForm from "./attribute-value-form";
import {
  fetchAttributeValuesByAttribute,
  fetchAttributeValue,
  deleteAttributeValue,
} from "@/services/products";
import { AttributeValueListDto } from "@shared/dtos";
import type { IAttributeValue } from "@shared/interfaces/products/attribute-value.interface";
import type { TAttributeValueListData } from "@shared/types/products/attribute-value.type";
import type { IAttributeValuesListExtraProps } from "@/components/admin/products";
import type { TAttributeValuesExtraProps } from "./attribute-value-form";
import type { THandlerComponentProps } from "@/@types/handler-types";
import type { TListHandlerStore } from "@/stores";
import { useI18n } from "@/hooks/use-i18n";
import { buildSentence } from "@/locales/translations";
import type { IAttribute } from "@shared/interfaces/products/attribute.interface";

interface IAttributeValuesModalProps
  extends THandlerComponentProps<TListHandlerStore<unknown, unknown, Record<string, unknown>>> { }

export default function AttributeValuesModal({ storeKey, store }: IAttributeValuesModalProps) {
  const componentId = useId();
  const [, startTransition] = useTransition();
  const queryClient = useQueryClient();
  const { t } = useI18n();

  if (!store) return null;

  const { action, setAction, extra } = store(
    useShallow((s) => ({
      action: s.action,
      setAction: s.setAction,
      extra: s.extra,
    }))
  );

  const attribute = extra?.attribute as IAttribute | undefined;
  const handleClose = () => startTransition(() => setAction("none"));
  const isOpen = action === "manageAttributeValues";
  const AV_STORE_KEY = "attribute-value";

  if (!isOpen || !attribute) return null;

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && handleClose()} data-component-id={componentId}>
      <DialogContent className="min-w-4xl max-h-[90vh] overflow-y-auto">
        <AppDialog
          title={buildSentence(t, "manage", "attribute", "values")}
          description={buildSentence(t, "manage", "attribute", "values", "for", "attribute")}
        >
          <SingleHandler<IAttributeValue, TAttributeValuesExtraProps>
            queryFn={fetchAttributeValue}
            initialParams={{}}
            storeKey={AV_STORE_KEY}
            SingleComponent={() => null}
            actionComponents={[{ action: "createOrUpdate", comp: AttributeValueForm }]}
            singleProps={{ attribute }}
          />
          <ListHandler<
            IAttributeValue,
            TAttributeValueListData,
            IAttributeValuesListExtraProps,
            IAttributeValue
          >
            queryFn={(params) => {
              if (attribute) return fetchAttributeValuesByAttribute(attribute.id, params);
              return Promise.reject(new Error("Attribute ID is required"));
            }}
            initialParams={{ _relations: "attribute", sortBy: "createdAt", sortOrder: "DESC" }}
            ListComponent={AttributeValuesList}
            dto={AttributeValueListDto}
            deleteFn={deleteAttributeValue}
            onDeleteSuccess={() => {
              startTransition(() => {
                queryClient.invalidateQueries({ queryKey: [AV_STORE_KEY + "-list"] });
              });
            }}
            storeKey={AV_STORE_KEY}
            listProps={{}}
          />
        </AppDialog>
      </DialogContent>
    </Dialog>
  );
}
