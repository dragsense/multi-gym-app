// External Libraries
import { useShallow } from 'zustand/shallow';
import { useMemo, useTransition } from "react";
import { useQuery } from "@tanstack/react-query";

// Types
import { type TListHandlerComponentProps } from "@/@types/handler-types";
import type { IRole, IPermission } from '@shared/interfaces';
import { type TListHandlerStore } from "@/stores";

// Components
import { Dialog, DialogContent } from '@radix-ui/react-dialog';
import { AppDialog } from '@/components/layout-ui/app-dialog';
import { AppCard } from '@/components/layout-ui/app-card';
import { Badge } from '@/components/ui/badge';
import { Shield, Loader2 } from 'lucide-react';
import { fetchPermissionsByRole } from '@/services/roles.api';

interface IViewRolePermissionsProps extends TListHandlerComponentProps<TListHandlerStore<IRole, any, any>> {}

export default function ViewRolePermissions({
  storeKey,
  store
}: IViewRolePermissionsProps) {
  const [, startTransition] = useTransition();

  if (!store) {
    return <div>List store "{storeKey}" not found. Did you forget to register it?</div>;
  }

  const { action, payload, setAction } = store(useShallow(state => ({
    action: state.action,
    setAction: state.setAction,
    payload: state.payload,
  })));

  // Fetch permissions by role using the dedicated endpoint
  const { data: permissionsData, isLoading, error } = useQuery({
    queryKey: ['role-permissions', payload?.roleId],
    queryFn: async () => {
      if (!payload?.roleId) throw new Error('Role ID is required');
      return fetchPermissionsByRole(payload.roleId, {
        _relations: 'resource',
      });
    },
    enabled: action === 'viewPermissions' && !!payload?.roleId,
  });

  const permissions = permissionsData?.data || [];
  const roleName = (payload as any)?.roleName || 'Role';

  return (
    <Dialog
      open={action === 'viewPermissions'}
      onOpenChange={(state: boolean) => {
        if (!state) {
          setAction('none');
        }
      }}
    >
      <DialogContent>
        <AppDialog
          title={`Permissions for ${roleName}`}
          description={`View all permissions assigned to this role (${permissions.length} total)`}
        >
          {isLoading ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
            </div>
          ) : error ? (
            <div className="text-sm text-red-500 py-4">
              {error instanceof Error ? error.message : 'Failed to load permissions'}
            </div>
          ) : permissions.length === 0 ? (
            <div className="text-center py-12 text-muted-foreground">
              <Shield className="h-12 w-12 mx-auto mb-4 opacity-50" />
              <p>No permissions assigned to this role</p>
            </div>
          ) : (
            <div className="space-y-3">
              {permissions.map((permission: IPermission) => (
                <AppCard key={permission.id} className="p-4">
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex-1 space-y-2">
                      <div className="flex items-center gap-2">
                        <Shield className="h-4 w-4 text-muted-foreground" />
                        <h4 className="font-medium">{permission.displayName || permission.name}</h4>
                      </div>
                      {permission.description && (
                        <p className="text-sm text-muted-foreground">{permission.description}</p>
                      )}
                      <div className="flex items-center gap-2 flex-wrap">
                        <Badge variant="outline" className="font-mono text-xs">
                          {permission.name}
                        </Badge>
                        <Badge variant="secondary" className="text-xs">
                          {permission.action}
                        </Badge>
                        {(permission as any).resource && (
                          <Badge variant="outline" className="text-xs">
                            {(permission as any).resource?.displayName || (permission as any).resource?.name}
                          </Badge>
                        )}
                      </div>
                    </div>
                  </div>
                </AppCard>
              ))}
            </div>
          )}
        </AppDialog>
      </DialogContent>
    </Dialog>
  );
}
