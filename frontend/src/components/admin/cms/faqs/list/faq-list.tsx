// React & Hooks
import { useState, useId, useTransition, useCallback } from "react";
import { useI18n } from "@/hooks/use-i18n";
import { buildSentence } from "@/locales/translations";

// External libraries
import { Plus } from "lucide-react";

// Types
import type { IFaq } from "@shared/interfaces/cms.interface";

// Hooks
import { useAuthUser } from "@/hooks/use-auth-user";
import { EUserLevels } from "@shared/enums";

// UI Components
import { Button } from "@/components/ui/button";

// Custom UI Components
import { List as TList } from "@/components/list-ui/list";

// Local
import { faqItemViews } from "./faq-item-views";

// Stores
import { type TListHandlerStore, type TSingleHandlerStore } from "@/stores";

// Config
import { type TListHandlerComponentProps } from "@/@types/handler-types";

export interface IFaqListExtraProps {}

interface IFaqListProps
  extends TListHandlerComponentProps<
    TListHandlerStore<IFaq, any, IFaqListExtraProps>,
    TSingleHandlerStore<IFaq, any>
  > {}

export default function FaqList({
  storeKey,
  store,
  singleStore,
}: IFaqListProps) {
  const componentId = useId();
  const [, startTransition] = useTransition();
  const { t } = useI18n();
  const { user } = useAuthUser();

  if (!store) {
    return `${buildSentence(t, "list", "store")} "${storeKey}" ${buildSentence(t, "not", "found")}. ${buildSentence(t, "did", "you", "forget", "to", "register", "it")}?`;
  }

  if (!singleStore) {
    return `${buildSentence(t, "single", "store")} "${singleStore}" ${buildSentence(t, "not", "found")}. ${buildSentence(t, "did", "you", "forget", "to", "register", "it")}?`;
  }

  const setAction = singleStore((state) => state.setAction);
  const setListAction = store((state) => state.setAction);

  const handleCreate = useCallback(() => {
    startTransition(() => {
      setAction("createOrUpdate");
    });
  }, [setAction, startTransition]);

  const handleEdit = useCallback((faq: IFaq, e?: React.MouseEvent) => {
    e?.stopPropagation();
    startTransition(() => {
      setAction("createOrUpdate", faq.id);
    });
  }, [setAction, startTransition]);

  const handleDelete = useCallback((faqId: string, e?: React.MouseEvent) => {
    e?.stopPropagation();
    startTransition(() => {
      setListAction("delete", faqId);
    });
  }, [setListAction, startTransition]);

  const handleToggleEnabled = useCallback((faq: IFaq, e?: React.MouseEvent) => {
    e?.stopPropagation();
    startTransition(() => {
      setAction("toggleEnabled", faq.id);
    });
  }, [setAction, startTransition]);

  const isAdmin = user?.level === EUserLevels.ADMIN || user?.level === EUserLevels.PLATFORM_OWNER;

  const { listItem } = faqItemViews({
    handleEdit: isAdmin ? handleEdit : undefined,
    handleDelete: isAdmin ? handleDelete : undefined,
    handleToggleEnabled: isAdmin ? handleToggleEnabled : undefined,
    componentId,
    t,
  });

  return (
    <div data-component-id={componentId} className="space-y-4">
      <div className="flex justify-end">
        {isAdmin && (
          <Button
            onClick={handleCreate}
            data-component-id={componentId}
          >
            <Plus /> <span className="hidden sm:inline capitalize">{buildSentence(t, 'add', 'faq')}</span>
          </Button>
        )}
      </div>

      <TList<IFaq>
        listStore={store}
        emptyMessage={buildSentence(t, 'no', 'faqs', 'found')}
        showPagination={true}
        renderItem={(faq) => listItem(
          faq,
          isAdmin ? handleEdit : undefined,
          isAdmin ? handleDelete : undefined,
          isAdmin ? handleToggleEnabled : undefined
        )}
        rowClassName="grid grid-cols-1"
      />
    </div>
  );
}
