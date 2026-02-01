// React & Hooks
import { useState, useId, useTransition } from "react";
import { useI18n } from "@/hooks/use-i18n";
import { buildSentence } from "@/locales/translations";
import { useNavigate } from "react-router-dom";

// External libraries
import { Plus } from "lucide-react";

// Types
import type { IEmailTemplate } from "@shared/interfaces/cms.interface";

// UI Components
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent } from "@/components/ui/tabs";

// Custom UI Components
import { Table as TTable } from "@/components/table-ui/table";
import { List as TList } from "@/components/list-ui/list";
import { ViewToggle } from "@/components/shared-ui/view-toggle";

// Local
import { emailTemplateItemViews } from "./email-template-item-views";

// Stores
import { type TListHandlerStore, type TSingleHandlerStore } from "@/stores";
import type { TEmailTemplateViewExtraProps } from "../view/email-template-view";

// Config
import { type TListHandlerComponentProps } from "@/@types/handler-types";
import { ADMIN_ROUTES, SEGMENTS } from "@/config/routes.config";
import { useAuthUser } from "@/hooks/use-auth-user";

export interface IEmailTemplateListExtraProps {}

interface IEmailTemplateListProps
  extends TListHandlerComponentProps<
    TListHandlerStore<IEmailTemplate, any, IEmailTemplateListExtraProps>,
    TSingleHandlerStore<IEmailTemplate, TEmailTemplateViewExtraProps>
  > {}

type ViewType = "table" | "list";

export default function EmailTemplateList({
  storeKey,
  store,
  singleStore,
}: IEmailTemplateListProps) {
  const componentId = useId();
  const [, startTransition] = useTransition();
  const { t } = useI18n();
  const navigate = useNavigate();
  const { user } = useAuthUser();

  if (!store) {
    return `${buildSentence(t, "list", "store")} "${storeKey}" ${buildSentence(t, "not", "found")}. ${buildSentence(t, "did", "you", "forget", "to", "register", "it")}?`;
  }

  if (!singleStore) {
    return `${buildSentence(t, "single", "store")} ${buildSentence(t, "not", "found")}. ${buildSentence(t, "did", "you", "forget", "to", "register", "it")}?`;
  }

  const setAction = singleStore((state) => state.setAction);
  const setListAction = store((state) => state.setAction);
  const [currentView, setCurrentView] = useState<ViewType>("table");

  const handleCreate = () => {
    if (!user) return;
    const segment = SEGMENTS[user.level];
    startTransition(() => {
      navigate(`${segment}/${ADMIN_ROUTES.CMS.EMAIL_TEMPLATE_CREATE}`);
    });
  };

  const handleEdit = (id: string) => {
    if (!user) return;
    const segment = SEGMENTS[user.level];
    startTransition(() => {
      navigate(`${segment}/${ADMIN_ROUTES.CMS.EMAIL_TEMPLATE_EDIT.replace(":id", id)}`);
    });
  };

  const handleDelete = (id: string) => {
    startTransition(() => {
      setListAction("delete", id);
    });
  };

  const handleView = (id: string) => {
    startTransition(() => {
      setAction("view", id);
    });
  };

  const handleActivate = (id: string) => {
    startTransition(() => {
      setAction("activate", id);
    });
  };

  const handleDeactivate = (id: string) => {
    startTransition(() => {
      setAction("deactivate", id);
    });
  };

  const { columns, listItem } = emailTemplateItemViews({
    handleEdit,
    handleDelete,
    handleView,
    handleActivate,
    handleDeactivate,
    componentId,
    t,
  });

  return (
    <Tabs
      value={currentView}
      onValueChange={(value) => setCurrentView(value as ViewType)}
      data-component-id={componentId}
    >
      <div className="flex flex-1 justify-between items-start md:items-center gap-2 flex-wrap">
        <ViewToggle componentId={componentId} />
        <Button onClick={handleCreate} data-component-id={componentId}>
          <Plus />{" "}
          <span className="hidden sm:inline capitalize">
            {buildSentence(t, "add", "emailTemplate")}
          </span>
        </Button>
      </div>

      <TabsContent value="table">
        <TTable<IEmailTemplate>
          listStore={store}
          columns={columns}
          emptyMessage={buildSentence(t, "no", "emailTemplates", "found")}
          showPagination={true}
        />
      </TabsContent>

      <TabsContent value="list">
        <div>
          <TList<IEmailTemplate>
            listStore={store}
            emptyMessage={buildSentence(t, "no", "emailTemplates", "found")}
            showPagination={true}
            renderItem={listItem}
          />
        </div>
      </TabsContent>
    </Tabs>
  );
}
