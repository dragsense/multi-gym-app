import React from "react";
import { useFormContext } from "react-hook-form";
import { useId } from "react";
import { FormField, FormItem, FormLabel, FormControl, FormMessage, FormDescription } from "@/components/ui/form";
import { cn } from "@/lib/utils";
import type { TFieldConfig } from "@/@types/form/field-config.type";
import { EORDER_CLASSES } from "@/enums/general.enum";
import { QuillEditor } from "@/components/shared-ui/quill-editor";

interface QuillFieldProps {
  field: TFieldConfig<any>;
  fieldName: string;
  showRequiredAsterisk?: boolean;
  layout?: "vertical" | "horizontal";
}

const getFieldState = (field: TFieldConfig<any>, values: any) => {
  const isVisible = field.visible ? (typeof field.visible === 'function' ? field.visible({ values }) : field.visible) : true;
  const isDisabled = typeof field.disabled === "function" ? field.disabled({ values }) : (field.disabled || false);
  return { isVisible, isDisabled };
};

export const QuillField = React.memo(function QuillField({
  field,
  fieldName,
  showRequiredAsterisk,
  layout = "vertical",
}: QuillFieldProps) {
  const componentId = useId();
  const { watch } = useFormContext();
  const values = watch();
  const { isVisible, isDisabled } = getFieldState(field, values);

  if (!isVisible) return null;

  const onChangeHandler = (value: string) => {
    field?.onChange?.(value);
    return value;
  };

  return (
    <FormField
      name={fieldName}
      render={({ field: controllerField }) => (
        <FormItem>
          <div
            className={cn(
              "gap-2 flex",
              layout === "vertical" ? "flex-col justify-center" : "items-center"
            )}
          >
            {field.label && (
              <FormLabel
                className={cn(
                  "text-muted-foreground",
                  field.lableOrder || EORDER_CLASSES.First
                )}
              >
                {field.label}
                {showRequiredAsterisk && field.required && (
                  <span className="text-red-500">*</span>
                )}
              </FormLabel>
            )}

            <FormControl
              className={
                field.lableOrder === EORDER_CLASSES.First ? "flex-1" : ""
              }
            >
              <div className="relative" data-component-id={componentId}>
                <QuillEditor
                  value={controllerField.value || ""}
                  onChange={(value: string) => {
                    controllerField.onChange(onChangeHandler(value));
                  }}
                  readOnly={isDisabled}
                  placeholder={field.placeholder}
                  minHeight={(field as any).minHeight || "200px"}
                  className={cn(
                    isDisabled && "opacity-50 cursor-not-allowed",
                    field.className
                  )}
                />
              </div>
            </FormControl>
          </div>
          <FormMessage />
          {(field as any).description && (
            <FormDescription>{(field as any).description}</FormDescription>
          )}
        </FormItem>
      )}
    />
  );
});
