import React from "react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogTitle,
} from "@/components/ui/dialog";
import { useI18n } from "@/hooks/use-i18n";
import { buildSentence } from "@/locales/translations";
import { EUpdateSessionScope } from "@shared/enums/session.enum";
import { Info } from "lucide-react";
import { AppDialog } from "@/components/layout-ui/app-dialog";

interface SessionUpdateScopeModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSelect?: (scope: EUpdateSessionScope) => void;
  hasDateChanged?: boolean;
}

export const SessionUpdateScopeModal = React.memo(
  function SessionUpdateScopeModal({
    open,
    onOpenChange,
    onSelect,
    hasDateChanged,
  }: SessionUpdateScopeModalProps) {
    const { t } = useI18n();



    const handleSelect = (scope: EUpdateSessionScope) => {
      onSelect(scope);
      onOpenChange(false);
    };

    const handleClose = () => {
      onOpenChange(false);
    };

    return (
      <Dialog open={open} onOpenChange={handleClose}>
        <DialogContent className="max-w-md">
          <AppDialog
            title={
              <DialogTitle>{buildSentence(t, "update", "session")}</DialogTitle>

            }
            description={buildSentence(t, "choose", "which", "events", "to", "update")}
            footerContent={
              <>
                <Button type="button" variant="outline" onClick={handleClose}>
                  {t("cancel")}
                </Button>
              </>
            }
          >


            <div className="space-y-3 py-4">
              <Button
                type="button"
                variant="outline"
                className="w-full justify-start h-auto py-4 px-4"
                onClick={() => handleSelect(EUpdateSessionScope.THIS)}
              >
                <div className="text-left w-full min-w-0">
                  <div className="font-semibold whitespace-normal">
                    {buildSentence(t, "this", "session")}
                  </div>
                  <div className="text-sm text-muted-foreground mt-1 whitespace-normal">
                    {buildSentence(t, "Update only this specific session")}
                  </div>
                  <div className="flex items-start gap-2 mt-2">
                    <Info className="h-4 w-4 text-muted-foreground shrink-0 mt-0.5" />
                    <p className="text-xs text-muted-foreground/70 whitespace-normal flex-1 min-w-0">
                      {t("This will not affect series recurrence.")}
                    </p>
                  </div>
                </div>
              </Button>

              {!hasDateChanged && (
                <Button
                  type="button"
                  variant="outline"
                  className="w-full justify-start h-auto py-4 px-4"
                  onClick={() =>
                    handleSelect(EUpdateSessionScope.THIS_AND_FOLLOWING)
                  }
                >
                  <div className="text-left w-full min-w-0">
                    <div className="font-semibold whitespace-normal">
                      {buildSentence(t, "this", "and", "following", "sessions")}
                    </div>
                    <div className="text-sm text-muted-foreground mt-1 whitespace-normal">
                      {buildSentence(
                        t,
                        "Update this session and all future sessions in the series"
                      )}
                    </div>
                    <div className="flex items-start gap-2 mt-2">
                      <Info className="h-4 w-4 text-muted-foreground shrink-0 mt-0.5" />
                      <p className="text-xs text-muted-foreground/70 whitespace-normal flex-1 min-w-0">
                        {t(
                          "This will not affect any cancelled sessions or those that have already started and ended."
                        )}
                      </p>
                    </div>
                  </div>
                </Button>
              )}

              <Button
                type="button"
                variant="outline"
                className="w-full justify-start h-auto py-4 px-4"
                onClick={() => handleSelect(EUpdateSessionScope.ALL)}
              >
                <div className="text-left w-full min-w-0">
                  <div className="font-semibold whitespace-normal">
                    {buildSentence(t, "all", "sessions")}
                  </div>
                  <div className="text-sm text-muted-foreground mt-1 whitespace-normal">
                    {buildSentence(t, "Update all sessions in this series")}
                  </div>
                  <div className="flex items-start gap-2 mt-2">
                    <Info className="h-4 w-4 text-muted-foreground shrink-0 mt-0.5" />
                    <p className="text-xs text-muted-foreground/70 whitespace-normal flex-1 min-w-0">
                      {t(
                        "This will not affect any cancelled sessions or those that have already started and ended."
                      )}
                      <p className="text-xs text-red-800">
                        {hasDateChanged &&
                          t(
                            "You are updating the date and time of the session. This will affect all sessions in the series. All sessions will start from your new date and time."
                          )}
                      </p>
                    </p>
                  </div>
                </div>
              </Button>
            </div>

          </AppDialog>
        </DialogContent>
      </Dialog>
    );
  }
);
