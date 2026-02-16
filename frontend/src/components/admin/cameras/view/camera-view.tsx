// External Libraries
import { useId, useTransition, useCallback } from "react";
import { useShallow } from "zustand/shallow";
import { Edit, Trash2, Power, Network, MapPin, Lock, Info } from "lucide-react";

// Types
import type { ICamera } from "@shared/interfaces/camera.interface";
import type { THandlerComponentProps } from "@/@types/handler-types";
import type { TSingleHandlerStore } from "@/stores";
import type { ISingleHandlerState } from "@/@types/handler-types/single.type";

// Components
import { Dialog, DialogContent } from "@/components/ui/dialog";
import { AppDialog } from "@/components/layout-ui/app-dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { AppCard } from "@/components/layout-ui/app-card";

// Hooks
import { useI18n } from "@/hooks/use-i18n";
import { buildSentence } from "@/locales/translations";
import { useAuthUser } from "@/hooks/use-auth-user";
import { EUserLevels } from "@shared/enums";

export type TCameraViewExtraProps = Record<string, unknown>;

type ICameraViewProps = THandlerComponentProps<
  TSingleHandlerStore<ICamera, TCameraViewExtraProps>
>;

export default function CameraView({ storeKey, store }: ICameraViewProps) {
  // React 19: Essential IDs and transitions
  const componentId = useId();
  const [, startTransition] = useTransition();
  const { t } = useI18n();
  const { user } = useAuthUser();

  // Always call hooks unconditionally - create selector first
  const selector = useShallow(
    (state: ISingleHandlerState<ICamera, TCameraViewExtraProps>) => ({
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

  const { response: camera, action, setAction, reset } = storeState;


  const handleCloseView = useCallback(() => {
    startTransition(() => reset());
  }, [reset, startTransition]);

  const onEdit = useCallback((camera: ICamera) => {
    startTransition(() => {
      setAction("createOrUpdate", camera.id);
    });
  }, [setAction, startTransition]);

  const onDelete = useCallback((camera: ICamera) => {
    startTransition(() => {
      setAction("delete", camera.id);
    });
  }, [setAction, startTransition]);

  const onUpdateStatus = useCallback((camera: ICamera) => {
    startTransition(() => {
      setAction("updateStatus", camera.id);
    });
  }, [setAction, startTransition]);



  if (!camera) {
    return null;
  }

  return (
    <Dialog
      open={action === "view"}
      onOpenChange={handleCloseView}
      data-component-id={componentId}
    >
      <DialogContent className="min-w-4xl max-h-[90vh] overflow-y-auto">
        <AppDialog
          title={buildSentence(t, "camera", "details")}
          description={buildSentence(t, "view", "detailed", "information", "about", "this", "camera")}
        >
          <CameraDetailContent
            camera={camera}
            onEdit={onEdit}
            onDelete={onDelete}
            onUpdateStatus={onUpdateStatus}
          />
        </AppDialog>
      </DialogContent>
    </Dialog>
  );
}

interface ICameraDetailContentProps {
  camera: ICamera;
  onEdit: (camera: ICamera) => void;
  onDelete: (camera: ICamera) => void;
  onUpdateStatus: (camera: ICamera) => void;
}

function CameraDetailContent({
  camera,
  onEdit,
  onDelete,
  onUpdateStatus,
}: ICameraDetailContentProps) {
  const componentId = useId();
  const { t } = useI18n();
  const { user } = useAuthUser();

  return (
    <div className="space-y-4" data-component-id={componentId}>
      <AppCard
        header={
          <div className="flex items-start justify-between gap-4">
            <div className="flex items-center gap-3 mb-2">
              <h2 className="text-2xl font-semibold truncate">{camera.name}</h2>
              <Badge variant={camera.isActive ? "default" : "secondary"}>
                {camera.isActive ? buildSentence(t, "active") : buildSentence(t, "inactive")}
              </Badge>
              <Badge variant="outline">
                {camera.protocol.toUpperCase()}
              </Badge>
            </div>
            {user?.level <= EUserLevels.ADMIN && (
              <div className="flex items-center gap-2 shrink-0">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => onUpdateStatus(camera)}
                  className="gap-2"
                >
                  <Power className="w-4 h-4" />
                  {camera.isActive ? buildSentence(t, "deactivate") : buildSentence(t, "activate")}
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => onEdit(camera)}
                  className="gap-2"
                >
                  <Edit className="w-4 h-4" />
                  {buildSentence(t, "edit")}
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => onDelete(camera)}
                  className="gap-2"
                >
                  <Trash2 className="w-4 h-4" />
                  {buildSentence(t, "delete")}
                </Button>
              </div>
            )}
          </div>
        }
      >
        <div className="flex flex-wrap items-center gap-4 text-sm text-muted-foreground">
          <span>{buildSentence(t, "camera")}</span>
          {camera.protocol && (
            <>
              <span>•</span>
              <div className="flex items-center gap-1.5">
                <Network className="w-4 h-4" />
                <span>{camera.protocol.toUpperCase()}</span>
              </div>
            </>
          )}
          {camera.location && (
            <>
              <span>•</span>
              <div className="flex items-center gap-1.5">
                <MapPin className="w-4 h-4" />
                <span>{camera.location.name || buildSentence(t, "location")}</span>
              </div>
            </>
          )}
          {camera.door && (
            <>
              <span>•</span>
              <div className="flex items-center gap-1.5">
                <MapPin className="w-4 h-4" />
                <span>{camera.door.name || buildSentence(t, "door")}</span>
              </div>
            </>
          )}
        </div>
      </AppCard>

      {/* Basic Information and Connection Details - Two Columns */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="space-y-4">
          <h3 className="text-sm font-medium text-muted-foreground uppercase tracking-wide">
            {buildSentence(t, "basic", "information")}
          </h3>
          <div className="space-y-3">
            <div className="flex items-center gap-3">
              <Info className="w-4 h-4 text-muted-foreground shrink-0" />
              <div>
                <div className="text-xs text-muted-foreground">
                  {buildSentence(t, "name")}
                </div>
                <div className="font-medium">{camera.name}</div>
              </div>
            </div>
            {camera.description && (
              <div className="flex items-center gap-3">
                <Info className="w-4 h-4 text-muted-foreground shrink-0" />
                <div>
                  <div className="text-xs text-muted-foreground">
                    {buildSentence(t, "description")}
                  </div>
                  <div className="font-medium">{camera.description}</div>
                </div>
              </div>
            )}
            <div className="flex items-center gap-3">
              <Power className="w-4 h-4 text-muted-foreground shrink-0" />
              <div>
                <div className="text-xs text-muted-foreground">
                  {buildSentence(t, "status")}
                </div>
                <div className="font-medium">
                  <Badge variant={camera.isActive ? "default" : "secondary"}>
                    {camera.isActive ? buildSentence(t, "active") : buildSentence(t, "inactive")}
                  </Badge>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="space-y-4">
          <h3 className="text-sm font-medium text-muted-foreground uppercase tracking-wide">
            {buildSentence(t, "connection", "details")}
          </h3>
          <div className="space-y-3">
            <div className="flex items-center gap-3">
              <Network className="w-4 h-4 text-muted-foreground shrink-0" />
              <div>
                <div className="text-xs text-muted-foreground">
                  {buildSentence(t, "protocol")}
                </div>
                <div className="font-medium">
                  <Badge variant="outline">{camera.protocol.toUpperCase()}</Badge>
                </div>
              </div>
            </div>
            {camera.ipAddress && (
              <div className="flex items-center gap-3">
                <Network className="w-4 h-4 text-muted-foreground shrink-0" />
                <div>
                  <div className="text-xs text-muted-foreground">
                    {buildSentence(t, "ip", "address")}
                  </div>
                  <div className="font-medium">
                    {camera.ipAddress}{camera.port ? `:${camera.port}` : ""}
                  </div>
                </div>
              </div>
            )}
            {camera.path && (
              <div className="flex items-center gap-3">
                <Network className="w-4 h-4 text-muted-foreground shrink-0" />
                <div>
                  <div className="text-xs text-muted-foreground">
                    {buildSentence(t, "path")}
                  </div>
                  <div className="font-medium">{camera.path}</div>
                </div>
              </div>
            )}
            {camera.streamUrl && (
              <div className="flex items-center gap-3">
                <Network className="w-4 h-4 text-muted-foreground shrink-0" />
                <div className="flex-1">
                  <div className="text-xs text-muted-foreground">
                    {buildSentence(t, "stream", "url")}
                  </div>
                  <div className="font-medium break-all">{camera.streamUrl}</div>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Authentication and Location & Door - Two Columns */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {camera.username && (
          <div className="space-y-4">
            <h3 className="text-sm font-medium text-muted-foreground uppercase tracking-wide">
              {buildSentence(t, "authentication")}
            </h3>
            <div className="space-y-3">
              <div className="flex items-center gap-3">
                <Lock className="w-4 h-4 text-muted-foreground shrink-0" />
                <div>
                  <div className="text-xs text-muted-foreground">
                    {buildSentence(t, "username")}
                  </div>
                  <div className="font-medium">{camera.username}</div>
                </div>
              </div>
            </div>
          </div>
        )}

        {(camera.location || camera.door) && (
          <div className="space-y-4">
            <h3 className="text-sm font-medium text-muted-foreground uppercase tracking-wide">
              {buildSentence(t, "location", "and", "door")}
            </h3>
            <div className="space-y-3">
              {camera.location && (
                <div className="flex items-center gap-3">
                  <MapPin className="w-4 h-4 text-muted-foreground shrink-0" />
                  <div>
                    <div className="text-xs text-muted-foreground">
                      {buildSentence(t, "location")}
                    </div>
                    <div className="font-medium">{camera.location.name || "-"}</div>
                    {camera.location.address && (
                      <div className="text-xs text-muted-foreground mt-1">
                        {camera.location.address}
                      </div>
                    )}
                  </div>
                </div>
              )}
              {camera.door && (
                <div className="flex items-center gap-3">
                  <MapPin className="w-4 h-4 text-muted-foreground shrink-0" />
                  <div>
                    <div className="text-xs text-muted-foreground">
                      {buildSentence(t, "door")}
                    </div>
                    <div className="font-medium">{camera.door.name || "-"}</div>
                    {camera.door.description && (
                      <div className="text-xs text-muted-foreground mt-1">
                        {camera.door.description}
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>
          </div>
        )}
      </div>


    </div>
  );
}
