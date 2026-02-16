// React
import { useId, useCallback } from "react";

// Types
import type { IMemberNote } from "@shared/interfaces/member-note.interface";
import type { TListHandlerStore } from "@/stores";

// Components
import { AppCard } from "@/components/layout-ui/app-card";
import { Badge } from "@/components/ui/badge";
import { List as TList } from "@/components/list-ui/list";
import { useShallow } from "zustand/react/shallow";
import { useI18n } from "@/hooks/use-i18n";
import { buildSentence } from "@/locales/translations";
import { FileText, Heart, Pill, User, AlertCircle } from "lucide-react";

interface IMemberNoteListProps {
  storeKey: string;
  store: TListHandlerStore<IMemberNote, any, any>;
}

export function MemberNoteList({ storeKey, store }: IMemberNoteListProps) {
  const componentId = useId();
  const { t } = useI18n();

  const pagination = store(useShallow((state) => state.pagination));

  const renderItem = useCallback((item: IMemberNote) => (
    <div 
      key={item.id} 
      data-component-id={componentId}
      className="rounded-lg border border-muted p-5 space-y-4 hover:shadow-md transition-shadow"
    >
      {/* General Information */}
      {item.generalInfo && (
        <div className="space-y-2">
          <div className="flex items-center gap-2">
            <FileText className="h-4 w-4 text-muted-foreground" />
            <h4 className="text-sm font-semibold text-foreground">General Information</h4>
          </div>
          <p className="text-sm text-muted-foreground pl-6 leading-relaxed whitespace-pre-wrap">
            {item.generalInfo}
          </p>
        </div>
      )}

      {/* Medical Conditions */}
      {item.medicalConditions && (
        <div className="space-y-2">
          <div className="flex items-center gap-2">
            <AlertCircle className="h-4 w-4 text-muted-foreground" />
            <h4 className="text-sm font-semibold text-foreground">Medical Conditions</h4>
          </div>
          <p className="text-sm text-muted-foreground pl-6 leading-relaxed whitespace-pre-wrap">
            {item.medicalConditions}
          </p>
        </div>
      )}

      {/* Allergies */}
      {item.allergies && item.allergies.length > 0 && (
        <div className="space-y-2">
          <div className="flex items-center gap-2">
            <Heart className="h-4 w-4 text-muted-foreground" />
            <h4 className="text-sm font-semibold text-foreground">Allergies</h4>
          </div>
          <div className="flex flex-wrap gap-2 pl-6">
            {item.allergies.map((allergy, idx) => (
              <Badge key={idx} variant="secondary" className="font-normal">
                {allergy}
              </Badge>
            ))}
          </div>
        </div>
      )}

      {/* Physician */}
      {item.physicianName && (
        <div className="space-y-2">
          <div className="flex items-center gap-2">
            <User className="h-4 w-4 text-muted-foreground" />
            <h4 className="text-sm font-semibold text-foreground">Physician</h4>
          </div>
          <p className="text-sm text-muted-foreground pl-6">
            {item.physicianName}
          </p>
        </div>
      )}

      {/* Medications */}
      {item.medications && item.medications.length > 0 && (
        <div className="space-y-2">
          <div className="flex items-center gap-2">
            <Pill className="h-4 w-4 text-muted-foreground" />
            <h4 className="text-sm font-semibold text-foreground">Medications</h4>
          </div>
          <div className="flex flex-wrap gap-2 pl-6">
            {item.medications.map((med, idx) => (
              <Badge key={idx} variant="secondary" className="font-normal">
                {med}
              </Badge>
            ))}
          </div>
        </div>
      )}
    </div>
  ), [componentId]);

  return (
    <AppCard
      header={
        <div className="flex items-center gap-3">
          <FileText className="h-5 w-5 text-muted-foreground" />
          <div>
            <h3 className="text-lg font-semibold">{buildSentence(t, "notes")}</h3>
            <p className="text-xs text-muted-foreground mt-0.5">
              {pagination.total} {pagination.total === 1 ? "note" : "notes"} total
            </p>
          </div>
        </div>
      }
      data-component-id={componentId}
    >
      <TList<IMemberNote>
        listStore={store}
        emptyMessage={buildSentence(t, "no", "notes", "found")}
        showPagination={true}
        renderItem={renderItem}
        className="space-y-4"
        rowClassName="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3"
      />
    </AppCard>
  );
}
