// External Libraries
import { type JSX } from "react";
import { MoreHorizontal, Edit, Trash2, Eye, Power } from "lucide-react";

// UI Components
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Badge } from "@/components/ui/badge";
import { AppCard } from "@/components/layout-ui/app-card";
import { CameraPlayer } from "../player/camera-player";

// Types
import type { ICamera } from "@shared/interfaces/camera.interface";
import { formatDate } from "@/lib/utils";
import { useAuthUser } from "@/hooks/use-auth-user";
import { EUserLevels } from "@shared/enums";
import type { IUser } from "@shared/interfaces";

const CameraActions = ({
  camera,
  handleEdit,
  handleDelete,
  handleView,
  handleUpdateStatus,
  componentId,
}: {
  camera: ICamera;
  handleEdit?: (id: string) => void;
  handleDelete?: (id: string) => void;
  handleView?: (id: string) => void;
  handleUpdateStatus?: (id: string) => void;
  componentId?: string;
}) => {
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" className="h-8 w-8 p-0" data-component-id={componentId}>
          <span className="sr-only">Open menu</span>
          <MoreHorizontal className="h-4 w-4" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        <DropdownMenuLabel>Actions</DropdownMenuLabel>
        <DropdownMenuSeparator />
        {handleView && (
          <DropdownMenuItem onClick={() => handleView(camera.id)}>
            <Eye className="h-4 w-4 mr-2" />
            View Details
          </DropdownMenuItem>
        )}
        {handleEdit && (
          <DropdownMenuItem onClick={() => handleEdit(camera.id)}>
            <Edit className="h-4 w-4 mr-2" />
            Edit
          </DropdownMenuItem>
        )}
        {handleUpdateStatus && (
          <DropdownMenuItem onClick={() => handleUpdateStatus(camera.id)}>
            <Power className="h-4 w-4 mr-2" />
            {camera.isActive ? "Deactivate" : "Activate"}
          </DropdownMenuItem>
        )}
        <DropdownMenuSeparator />
        {handleDelete && (
          <DropdownMenuItem onClick={() => handleDelete(camera.id)} className="text-destructive">
            <Trash2 className="h-4 w-4 mr-2" />
            Delete
          </DropdownMenuItem>
        )}
      </DropdownMenuContent>
    </DropdownMenu>
  );
};

export const cameraItemViews = ({
  handleEdit,
  handleDelete,
  handleView,
  handleUpdateStatus,
  componentId,
}: {
  handleEdit?: (id: string) => void;
  handleDelete?: (id: string) => void;
  handleView?: (id: string) => void;
  handleUpdateStatus?: (id: string) => void;
  componentId?: string;
}) => {

  const { user } = useAuthUser();

  const listItem = (camera: ICamera, currentUser: IUser): JSX.Element => {
    return (
      <AppCard className="p-4">
        <div className="flex flex-col gap-4">
          {/* Stream Player - Left Column */}
          <CameraPlayer camera={camera} autoPlay={false} className="w-full" />

          {/* Camera Info - Right Column */}
          <div className="space-y-2 flex-1">
            <div className="flex items-start justify-between">
              <div className="space-y-2 flex-1">
                <div className="flex items-center gap-2 flex-wrap">
                  <h3 className="font-semibold">{camera.name}</h3>
                  <Badge variant={camera.isActive ? "default" : "secondary"}>
                    {camera.isActive ? "Active" : "Inactive"}
                  </Badge>
                  <Badge variant="outline">
                    {camera.protocol.toUpperCase()}
                  </Badge>
                </div>
                {camera.description && (
                  <p className="text-sm text-muted-foreground">{camera.description}</p>
                )}
                <div className="flex gap-4 text-sm text-muted-foreground flex-wrap">
                  {camera.location && (
                    <span>Location: {camera.location.name || "-"}</span>
                  )}
                  {camera.door && (
                    <span>Door: {camera.door.name || "-"}</span>
                  )}
                </div>
                <div className="flex gap-4 text-sm text-muted-foreground flex-wrap">
                  {camera.ipAddress && (
                    <span>IP: {camera.ipAddress}{camera.port ? `:${camera.port}` : ""}</span>
                  )}
                  {camera.path && (
                    <span>Path: {camera.path}</span>
                  )}
                </div>
                {camera.createdAt && (
                  <p className="text-xs text-muted-foreground">
                    Created: {formatDate(camera.createdAt)}
                  </p>
                )}
              </div>
              <CameraActions
                camera={camera}
                handleEdit={currentUser?.level <= EUserLevels.ADMIN ? handleEdit : undefined}
                handleDelete={currentUser?.level <= EUserLevels.ADMIN ? handleDelete : undefined}
                handleView={handleView}
                handleUpdateStatus={currentUser?.level <= EUserLevels.ADMIN ? handleUpdateStatus : undefined}
                componentId={componentId}
              />
            </div>
          </div>
        </div>
      </AppCard>
    );
  };
  return { listItem };
};
