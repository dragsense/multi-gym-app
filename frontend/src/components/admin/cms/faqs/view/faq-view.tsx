// External Libraries
import { useShallow } from "zustand/shallow";
import { useId, useTransition } from "react";

// Components
import { Dialog, DialogContent } from "@/components/ui/dialog";
import { AppDialog } from "@/components/layout-ui/app-dialog";
import { Button } from "@/components/ui/button";
import { Pencil, Trash2 } from "lucide-react";
import { Badge } from "@/components/ui/badge";

// Types
import { type IFaq } from "@shared/interfaces/cms.interface";
import { type THandlerComponentProps } from "@/@types/handler-types";

// Stores
import { type TSingleHandlerStore } from "@/stores";
import { type ISingleHandlerState } from "@/@types/handler-types/single.type";

// Hooks & Utils
import { useI18n } from "@/hooks/use-i18n";
import { buildSentence } from "@/locales/translations";
import { useAuthUser } from "@/hooks/use-auth-user";
import { EUserLevels } from "@shared/enums";

export type TFaqViewExtraProps = Record<string, unknown>;

type IFaqViewProps = THandlerComponentProps<
  TSingleHandlerStore<IFaq, TFaqViewExtraProps>
>;

export default function FaqView({ storeKey, store }: IFaqViewProps) {
  const componentId = useId();
  const [, startTransition] = useTransition();
  const { t } = useI18n();

  const selector = useShallow(
    (state: ISingleHandlerState<IFaq, TFaqViewExtraProps>) => ({
      response: state.response,
      action: state.action,
      setAction: state.setAction,
      reset: state.reset,
    })
  );

  const storeState = store ? store(selector) : null;

  if (!store) {
    return (
      <div>
        {buildSentence(t, "single", "store")} "{storeKey}"{" "}
        {buildSentence(t, "not", "found")}.{" "}
        {buildSentence(t, "did", "you", "forget", "to", "register", "it")}?
      </div>
    );
  }

  if (!storeState) {
    return null;
  }

  const { response: faq, action, setAction, reset } = storeState;

  if (!faq) {
    return null;
  }

  const handleCloseView = () => {
    startTransition(() => reset());
  };

  const onEdit = (faq: IFaq) => {
    startTransition(() => {
      setAction("createOrUpdate", faq.id);
    });
  };

  const onDelete = (faq: IFaq) => {
    startTransition(() => {
      setAction("delete", faq.id);
    });
  };

  return (
    <Dialog
      open={action === "view"}
      onOpenChange={handleCloseView}
      data-component-id={componentId}
    >
      <DialogContent className="min-w-2xl max-h-[90vh] overflow-y-auto">
        <AppDialog
          title={buildSentence(t, "faq", "details")}
          description={buildSentence(t, "view", "detailed", "information", "about", "this", "faq")}
        >
          <FaqDetailContent
            faq={faq}
            onEdit={onEdit}
            onDelete={onDelete}
          />
        </AppDialog>
      </DialogContent>
    </Dialog>
  );
}

interface IFaqDetailContentProps {
  faq: IFaq;
  onEdit: (faq: IFaq) => void;
  onDelete: (faq: IFaq) => void;
}

function FaqDetailContent({
  faq,
  onEdit,
  onDelete,
}: IFaqDetailContentProps) {
  const componentId = useId();
  const { t } = useI18n();
  const { user } = useAuthUser();

  return (
    <div className="space-y-4" data-component-id={componentId}>
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Badge variant={faq.enabled ? "default" : "secondary"}>
            {faq.enabled ? buildSentence(t, "enabled") : buildSentence(t, "disabled")}
          </Badge>
          <h2 className="text-2xl font-semibold">{faq.question}</h2>
        </div>
        {user?.level <= EUserLevels.SUPER_ADMIN && (
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => onEdit(faq)}
              className="gap-2"
            >
              <Pencil className="w-4 h-4" />
              {buildSentence(t, "edit")}
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => onDelete(faq)}
              className="gap-2"
            >
              <Trash2 className="w-4 h-4" />
              {buildSentence(t, "delete")}
            </Button>
          </div>
        )}
      </div>

      <div className="space-y-3 pt-4 border-t">
        <h3 className="text-sm font-medium text-muted-foreground uppercase tracking-wide">
          {buildSentence(t, "answer")}
        </h3>
        <div 
          className="text-sm text-foreground prose prose-sm max-w-none"
          dangerouslySetInnerHTML={{ __html: faq.answer }}
        />
      </div>
    </div>
  );
}
