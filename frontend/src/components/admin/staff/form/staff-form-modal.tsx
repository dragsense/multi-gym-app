// External Libraries
import React, { useMemo, useId, useTransition, type ReactNode } from "react";
import { Loader2 } from "lucide-react";
// Custom Hooks
import { type FormInputs, useInput } from "@/hooks/use-input";
import { useI18n } from "@/hooks/use-i18n";
import { buildSentence } from "@/locales/translations";
import { SearchableInputWrapper } from "@/components/shared-ui/searchable-input-wrapper";
import { useSearchableLocations, useSearchableRoles, useSearchablePermissions } from "@/hooks/use-searchable";
import type { IRole, IPermission } from "@shared/interfaces";
import type { IUser } from "@shared/interfaces/user.interface";
import type { ILocation } from "@shared/interfaces/location.interface";
import type { TCustomInputWrapper } from "@/@types/form/field-config.type";

// Types
import type { TFormHandlerStore } from "@/stores";
import type { TStaffData } from "@shared/types/staff.type";
import type { IStaff } from "@shared/interfaces/staff.interface";

// Components
import { Button } from "@/components/ui/button";
import { ModalForm } from "@/components/form-ui/modal-form";
import type { THandlerComponentProps } from "@/@types/handler-types";
import type { TFieldConfigObject } from "@/@types/form/field-config.type";
import { addRenderItem } from "@/lib/fields/dto-to-feilds";

export interface IStaffFormModalExtraProps {
  open: boolean;
  onClose: () => void;
}

interface IStaffFormModalProps extends THandlerComponentProps<TFormHandlerStore<TStaffData, IStaff, IStaffFormModalExtraProps>> {
}

// Custom component for roles multi-select
const RolesSelect = React.memo(
  (props: TCustomInputWrapper) => {
    return (
      <SearchableInputWrapper<IRole>
        {...props}
        modal={true}
        useSearchable={() => useSearchableRoles({ initialParams: { limit: 100 } })}
        getLabel={(item) => {
          if (!item) return 'Select Role';
          return item.name || item.code || 'Unknown Role';
        }}
        getKey={(item) => item.id.toString()}
        getValue={(item) => { return { id: item.id, name: item.name, code: item.code } }}
        shouldFilter={false}
        multiple={true}
      />
    );
  }
);

// Custom component for permissions multi-select
const PermissionsSelect = React.memo(
  (props: TCustomInputWrapper) => {
    return (
      <SearchableInputWrapper<IPermission>
        {...props}
        modal={true}
        useSearchable={() => useSearchablePermissions({ initialParams: { limit: 100 } })}
        getLabel={(item) => {
          if (!item) return 'Select Permission';
          return item.displayName || item.name || 'Unknown Permission';
        }}
        getKey={(item) => item.id.toString()}
        getValue={(item) => { return { id: item.id, displayName: item.displayName, name: item.name } }}
        shouldFilter={false}
        multiple={true}
      />
    );
  }
);

// Custom component for location select
const LocationSelect = React.memo((props: TCustomInputWrapper) => {
  return (
    <SearchableInputWrapper<ILocation>
      {...props}
      modal={true}
      useSearchable={() => useSearchableLocations({ initialParams: { limit: 100 } })}
      getLabel={(item) => {
        if (!item) return 'Select Location';
        return `${item.name}${item.address ? ` - ${item.address}` : ''}`;
      }}
      getKey={(item) => item.id.toString()}
      getValue={(item) => {
        // Staff DTO expects LocationDto shape; include at least id + name.
        return { id: item.id, name: item.name, address: item.address } as ILocation;
      }}
      shouldFilter={false}
    />
  );
});

const StaffFormModal = React.memo(function StaffFormModal({
  storeKey,
  store,
}: IStaffFormModalProps) {
  const componentId = useId();
  const [, startTransition] = useTransition();
  const { t } = useI18n();

  if (!store) {
    return `${buildSentence(t, 'form', 'store')} "${storeKey}" ${buildSentence(t, 'not', 'found')}. ${buildSentence(t, 'did', 'you', 'forget', 'to', 'register', 'it')}?`;
  }

  const isEditing = store((state) => state.isEditing);
  const open = store((state) => state.extra.open);
  const onClose = store((state) => state.extra.onClose);
  const storeFields = store((state) => state.fields);

  const fields = useMemo(() => {
    const renderers = {
      user: (user: FormInputs<IUser>) => (
        <div className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {user.email as ReactNode}
            {user.isActive as ReactNode}
            {user.firstName as ReactNode}
            {user.lastName as ReactNode}
            {user.dateOfBirth as ReactNode}
            {user.gender as ReactNode}
       
          </div>
         {/*  <div className="grid grid-cols-1 md:grid-cols-2 gap-4"> 
          {user.roles as ReactNode}
          {user.permissions as ReactNode}
          </div> */}
        </div>
      ),
    };

    const baseFields = addRenderItem(storeFields, renderers) as TFieldConfigObject<TStaffData>;
    
    const fieldsWithVisibility = {
      ...baseFields,
      isTrainer: {
        ...baseFields.isTrainer,
        visible: () => !isEditing, // Hide in edit mode
      },
      location: {
        ...(baseFields.location as any),
        type: 'custom' as const,
        Component: LocationSelect,
      },
      user: {
        ...(baseFields.user as any),
        subFields: {
          ...(baseFields.user as any)?.subFields,
          roles: {
            ...(baseFields.user as any)?.subFields?.roles,
            name: 'roles' as const,
            id: 'roles' as const,
            type: 'custom' as const,
            Component: RolesSelect,
          },
          permissions: {
            ...(baseFields.user as any)?.subFields?.permissions,
            name: 'permissions' as const,
            id: 'permissions' as const,
            type: 'custom' as const,
            Component: PermissionsSelect,
          },
        },
      }
    } as TFieldConfigObject<TStaffData>;

    return fieldsWithVisibility;
  }, [storeFields, isEditing]);

  const inputs = useInput<TStaffData>({
    fields,
    showRequiredAsterisk: true,
  }) as FormInputs<TStaffData>;


  const onOpenChange = (state: boolean) => {
    if (state === false) {
      startTransition(() => {
        onClose();
      });
    }
  };

  const formButtons = useMemo(() => (
    <div className="flex justify-end gap-2">
      <Button
        type="button"
        variant="outline"
        onClick={(e) => {
          e.preventDefault();
          startTransition(() => {
            onClose();
          });
        }}
        data-component-id={componentId}
      >
        {buildSentence(t, 'cancel')}
      </Button>
      <Button type="submit" disabled={false} data-component-id={componentId}>
        {false && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
        {isEditing ? buildSentence(t, 'update') : buildSentence(t, 'create')}
      </Button>
    </div>
  ), [componentId, isEditing, onClose, t]);

  return (
    <ModalForm<TStaffData, IStaff, IStaffFormModalExtraProps>
      title={buildSentence(t, isEditing ? 'edit' : 'add', 'staff', 'member')}
      description={buildSentence(t, isEditing ? 'edit' : 'add', 'a', 'new', 'staff', 'member')}
      open={open}
      onOpenChange={onOpenChange}
      formStore={store}
      footerContent={formButtons}
      width="3xl"
    >
      <div className="space-y-4">
        <div>
          <h3 className="text-sm font-semibold mb-3">{buildSentence(t, 'user', 'information')}</h3>
          {inputs.user as ReactNode}
        </div>

        {inputs.isTrainer}
        
        {(inputs.specialization || inputs.experience || inputs.location) && (
          <div>
            <h3 className="text-sm font-semibold mb-3">{buildSentence(t, 'staff', 'information') || 'Staff Information'}</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {inputs.specialization as ReactNode}
              {inputs.experience as ReactNode}
             {/*  {inputs.location as ReactNode} */}
            </div>
          </div>
        )}

   
        
      </div>
    </ModalForm>
  );
});

export default StaffFormModal;
