// External Libraries
import { useShallow } from "zustand/shallow";
import { useMemo, useTransition } from "react";
import { useQuery } from "@tanstack/react-query";

// Types
import { type TListHandlerComponentProps } from "@/@types/handler-types";
import type { IRole, IPermission } from "@shared/interfaces";
import { type TListHandlerStore } from "@/stores";

// Components
import { Dialog, DialogContent } from "@/components/ui/dialog";
import { AppDialog } from "@/components/layout-ui/app-dialog";
import { AppCard } from "@/components/layout-ui/app-card";
import { Badge } from "@/components/ui/badge";
import { Shield, Loader2 } from "lucide-react";
import { fetchPermissionsByRole } from "@/services/roles.api";

interface IViewRolePermissionsProps
  extends TListHandlerComponentProps<TListHandlerStore<IRole, any, any>> {}

export default function ViewRolePermissions({
  storeKey,
  store,
}: IViewRolePermissionsProps) {
  const [, startTransition] = useTransition();

  if (!store) {
    return (
      <div>
        List store "{storeKey}" not found. Did you forget to register it?
      </div>
    );
  }

  const { action, payload, setAction } = store(
    useShallow((state) => ({
      action: state.action,
      setAction: state.setAction,
      payload: state.payload,
    })),
  );

  // Fetch permissions by role using the dedicated endpoint
  const {
    data: permissionsData,
    isLoading,
    error,
  } = useQuery({
    queryKey: ["role-permissions", payload?.roleId],
    queryFn: async () => {
      if (!payload?.roleId) throw new Error("Role ID is required");
      // Request a higher limit so we fetch all permissions for this role
      return fetchPermissionsByRole(payload.roleId, {
        _relations: "resource",
        page: 1,
        limit: 100,
      });
    },
    enabled: action === "viewPermissions" && !!payload?.roleId,
  });

  const permissions = permissionsData?.data || [];
  const totalPermissions = permissionsData?.total ?? permissions.length;
  const roleName = (payload as any)?.roleName || "Role";

  const sortedPermissions = useMemo(
    () =>
      [...permissions].sort((a: any, b: any) => {
        const resA =
          a.resource?.displayName ||
          a.resource?.name ||
          a.displayName ||
          a.name ||
          "";
        const resB =
          b.resource?.displayName ||
          b.resource?.name ||
          b.displayName ||
          b.name ||
          "";
        return resA.localeCompare(resB);
      }),
    [permissions],
  );

  return (
    <Dialog
      open={action === "viewPermissions"}
      onOpenChange={(state: boolean) => {
        if (!state) {
          startTransition(() => setAction("none"));
        }
      }}
    >
      <DialogContent className="sm:max-w-4xl h-[80vh]">
        <AppDialog
          title={`Permissions for ${roleName}`}
          description={`View all permissions assigned to this role (${totalPermissions} total)`}
        >
          {isLoading ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
            </div>
          ) : error ? (
            <div className="text-sm text-red-500 py-4">
              {error instanceof Error
                ? error.message
                : "Failed to load permissions"}
            </div>
          ) : permissions.length === 0 ? (
            <div className="text-center py-12 text-muted-foreground">
              <Shield className="h-12 w-12 mx-auto mb-4 opacity-50" />
              <p>No permissions assigned to this role</p>
            </div>
          ) : (
            <div className="space-y-4">
              <div className="flex items-center justify-between text-sm text-muted-foreground">
                <span>
                  Showing <span className="font-medium">{permissions.length}</span>{" "}
                  of <span className="font-medium">{totalPermissions}</span>{" "}
                  permission{totalPermissions !== 1 ? "s" : ""}
                </span>
              </div>

              <div className="h-[65vh] overflow-y-auto pr-1">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  {sortedPermissions.map((permission: IPermission) => (
                    <div key={permission.id} className="h-full">
                      <AppCard className="p-4 h-full">
                        <div className="flex flex-col gap-3 h-full">
                          <div className="flex items-start gap-2">
                            <Shield className="h-4 w-4 mt-0.5 text-muted-foreground" />
                            <div>
                              <h4 className="font-medium leading-snug">
                                {permission.displayName || permission.name}
                              </h4>
                              {permission.description && (
                                <p className="mt-1 text-xs text-muted-foreground">
                                  {permission.description}
                                </p>
                              )}
                            </div>
                          </div>

                          <div className="mt-auto flex flex-wrap items-center gap-2">
                            <Badge
                              variant="outline"
                              className="font-mono text-[11px] px-2 py-0.5"
                            >
                              {permission.name}
                            </Badge>
                            <Badge
                              variant="secondary"
                              className="text-[11px] px-2 py-0.5 capitalize"
                            >
                              {permission.action}
                            </Badge>
                            {(permission as any).resource && (
                              <Badge
                                variant="outline"
                                className="text-[11px] px-2 py-0.5"
                              >
                                {(permission as any).resource?.displayName ||
                                  (permission as any).resource?.name}
                              </Badge>
                            )}
                          </div>
                        </div>
                      </AppCard>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}
        </AppDialog>
      </DialogContent>
    </Dialog>
  );
}
