import React from "react";
import { Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { useI18n } from "@/hooks/use-i18n";
import { buildSentence } from "@/locales/translations";
import type { TMemberData, TUpdateMemberData } from "@shared/types/member.type";
import { useFormContext } from "react-hook-form";
import { Star } from "lucide-react";

interface MemberConfirmModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  isSubmitting: boolean;
  isEditing: boolean;
  onConfirm: () => void;
}

export const MemberConfirmModal = React.memo(function MemberConfirmModal({
  open,
  onOpenChange,
  isSubmitting,
  isEditing,
  onConfirm,
}: MemberConfirmModalProps) {
  const { t } = useI18n();

  const { getValues } = useFormContext<TMemberData | TUpdateMemberData>();
  const formValues = getValues() as TMemberData | TUpdateMemberData | null;

  const fitnessLevel = formValues?.fitnessLevel
    ? parseInt(formValues.fitnessLevel, 10)
    : 0;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>
            {isEditing
              ? buildSentence(t, "confirm", "member", "editing")
              : buildSentence(t, "confirm", "member", "creation")}
          </DialogTitle>
          <DialogDescription>
            {isEditing
              ? buildSentence(
                  t,
                  "please",
                  "review",
                  "your",
                  "changes",
                  "before",
                  "confirming"
                )
              : buildSentence(
                  t,
                  "please",
                  "review",
                  "the",
                  "member",
                  "details",
                  "before",
                  "confirming"
                )}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          {/* Basic Information */}
          <div className="space-y-2">
            <h4 className="font-semibold text-sm">
              {buildSentence(t, "basic", "information")}
            </h4>
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div>
                <span className="text-muted-foreground">{t("email")}:</span>
                <p className="font-medium">
                  {formValues?.user?.email || "-"}
                </p>
              </div>
              <div>
                <span className="text-muted-foreground">
                  {buildSentence(t, "full", "name")}:
                </span>
                <p className="font-medium">
                  {formValues?.user?.firstName} {formValues?.user?.lastName}
                </p>
              </div>
              {formValues?.user?.dateOfBirth && (
                <div>
                  <span className="text-muted-foreground">
                    {buildSentence(t, "date", "of", "birth")}:
                  </span>
                  <p className="font-medium">
                    {new Date(formValues.user.dateOfBirth).toLocaleDateString()}
                  </p>
                </div>
              )}
              {formValues?.user?.gender && (
                <div>
                  <span className="text-muted-foreground">{t("gender")}:</span>
                  <p className="font-medium capitalize">
                    {formValues.user.gender}
                  </p>
                </div>
              )}
            </div>
          </div>

          {/* Profile Information */}
          {(formValues?.user?.profile?.phoneNumber ||
            formValues?.user?.profile?.address ||
            formValues?.user?.profile?.city ||
            formValues?.user?.profile?.state ||
            formValues?.user?.profile?.zipCode ||
            formValues?.user?.profile?.country ||
            formValues?.user?.profile?.rfid) && (
            <div className="space-y-2">
              <h4 className="font-semibold text-sm">
                {buildSentence(t, "profile", "information")}
              </h4>
              <div className="grid grid-cols-2 gap-4 text-sm">
                {formValues?.user?.profile?.rfid && (
                  <div>
                    <span className="text-muted-foreground">{t("rfid")}:</span>
                    <p className="font-medium">
                      {formValues.user.profile.rfid}
                    </p>
                  </div>
                )}
                {formValues?.user?.profile?.phoneNumber && (
                  <div>
                    <span className="text-muted-foreground">
                      {buildSentence(t, "phone", "number")}:
                    </span>
                    <p className="font-medium">
                      {formValues.user.profile.phoneNumber}
                    </p>
                  </div>
                )}
                {formValues?.user?.profile?.address && (
                  <div className="col-span-2">
                    <span className="text-muted-foreground">
                      {t("address")}:
                    </span>
                    <p className="font-medium">
                      {formValues.user.profile.address}
                    </p>
                  </div>
                )}
                {formValues?.user?.profile?.city && (
                  <div>
                    <span className="text-muted-foreground">{t("city")}:</span>
                    <p className="font-medium">
                      {formValues.user.profile.city}
                    </p>
                  </div>
                )}
                {formValues?.user?.profile?.state && (
                  <div>
                    <span className="text-muted-foreground">{t("state")}:</span>
                    <p className="font-medium">
                      {formValues.user.profile.state}
                    </p>
                  </div>
                )}
                {formValues?.user?.profile?.zipCode && (
                  <div>
                    <span className="text-muted-foreground">
                      {buildSentence(t, "zip", "code")}:
                    </span>
                    <p className="font-medium">
                      {formValues.user.profile.zipCode}
                    </p>
                  </div>
                )}
                {formValues?.user?.profile?.country && (
                  <div>
                    <span className="text-muted-foreground">
                      {t("country")}:
                    </span>
                    <p className="font-medium">
                      {formValues.user.profile.country}
                    </p>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Emergency Contact */}
          {(formValues?.user?.profile?.emergencyContactName ||
            formValues?.user?.profile?.emergencyContactNumber ||
            formValues?.user?.profile?.emergencyContactRelationship) && (
            <div className="space-y-2">
              <h4 className="font-semibold text-sm">
                {buildSentence(t, "emergency", "contact")}
              </h4>
              <div className="grid grid-cols-2 gap-4 text-sm">
                {formValues?.user?.profile?.emergencyContactName && (
                  <div>
                    <span className="text-muted-foreground">{t("name")}:</span>
                    <p className="font-medium">
                      {formValues.user.profile.emergencyContactName}
                    </p>
                  </div>
                )}
                {formValues?.user?.profile?.emergencyContactNumber && (
                  <div>
                    <span className="text-muted-foreground">
                      {buildSentence(t, "phone", "number")}:
                    </span>
                    <p className="font-medium">
                      {formValues.user.profile.emergencyContactNumber}
                    </p>
                  </div>
                )}
                {formValues?.user?.profile?.emergencyContactRelationship && (
                  <div>
                    <span className="text-muted-foreground">
                      {t("relationship")}:
                    </span>
                    <p className="font-medium">
                      {formValues.user.profile.emergencyContactRelationship}
                    </p>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Member Details */}
          {(formValues?.goal ||
            formValues?.fitnessLevel ||
            formValues?.medicalConditions) && (
            <div className="space-y-2">
              <h4 className="font-semibold text-sm">
                {buildSentence(t, "member", "details")}
              </h4>
              <div className="grid grid-cols-2 gap-4 text-sm">
                {formValues?.goal && (
                  <div>
                    <span className="text-muted-foreground">{t("goal")}:</span>
                    <p className="font-medium">{formValues.goal}</p>
                  </div>
                )}
                {formValues?.fitnessLevel && (
                  <div>
                    <span className="text-muted-foreground">
                      {buildSentence(t, "fitness", "level")}:
                    </span>
                    <div className="flex items-center gap-1 mt-1">
                      {Array.from({ length: 5 }, (_, index) => {
                        const starValue = index + 1;
                        const isFilled = starValue <= fitnessLevel;
                        return (
                          <Star
                            key={index}
                            className={`h-4 w-4 ${
                              isFilled
                                ? "fill-yellow-400 text-yellow-400"
                                : "fill-none text-muted-foreground"
                            }`}
                          />
                        );
                      })}
                      <span className="ml-2 text-xs text-muted-foreground">
                        ({fitnessLevel}/5)
                      </span>
                    </div>
                  </div>
                )}
                {formValues?.medicalConditions && (
                  <div className="col-span-2">
                    <span className="text-muted-foreground">
                      {buildSentence(t, "medical", "conditions")}:
                    </span>
                    <p className="font-medium">
                      {formValues.medicalConditions}
                    </p>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>

        <DialogFooter>
          <Button
            type="button"
            variant="outline"
            onClick={() => onOpenChange(false)}
          >
            {t("cancel")}
          </Button>
          <Button type="button" onClick={onConfirm} disabled={isSubmitting}>
            {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            {t("confirm")}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
});

