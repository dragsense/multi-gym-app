import React, { useMemo } from "react";
import { TextField, TextareaField, SelectField, SwitchField, CheckboxField, RadioField, DateField, DateRangeField, DateTimeRangeField, useArrayField, CustomField, FileField, MultiFileField, useObjectField, DateStringField, ColorField, TagsField } from "@/components/form-ui/field-components";
import { QuillField } from "@/components/form-ui/quill-field";
import type { TFieldConfig, TFieldConfigObject } from "@/@types/form/field-config.type";

interface UseInputProps<T> {
  fields: TFieldConfigObject<T>;
  showRequiredAsterisk?: boolean;
  layout?: "vertical" | "horizontal";
}




export type FormInputs<T> = {
  [K in keyof T]: T[K] extends object
  ? T[K] extends Array<any>
  ? React.ReactNode
  : FormInputs<T[K]> | React.ReactNode
  : React.ReactNode;
};





// Helper function to render form inputs
const renderFormInputs = (fields: any, renderField: any, parentName?: string) => {
  return Object.keys(fields).reduce((acc, key) => {
    const field = fields[key as keyof typeof fields];
    if (field) {
      acc[key as keyof typeof fields] = renderField(field as any, parentName) as any;
    }
    return acc;
  }, {} as any);
};

export function useInput<T>({
  fields,
  showRequiredAsterisk,
  layout = "vertical",
}: UseInputProps<T>): FormInputs<T> {
  // React 19: Memoized field renderer for better performance
  const renderField = useMemo(() => (field: TFieldConfig<T>, parentName?: string):
    React.ReactNode |
    Record<string, React.ReactNode> |
    React.ReactNode => {
    if (!field) return null;
    if (!field.type) return null;
    const fieldName = parentName ? `${parentName}.${field.name}` : field.name;

    if (field.type === "nested") {

      return useObjectField({
        field,
        layout,
        fieldName,
        showRequiredAsterisk,
        renderField: (subField, parentName) => renderFormInputs(subField, renderField, parentName),
      });
    } else if (field.type === "nestedArray") {
      return useArrayField({
        field,
        layout,
        fieldName,
        showRequiredAsterisk,
        renderField: (subField, parentName) => renderFormInputs(subField, renderField, parentName),
      });
    }

    // Use individual field components
    const commonProps = {
      field,
      fieldName,
      showRequiredAsterisk,
      layout
    };

    switch (field.type) {
      case "textarea":
        return <TextareaField {...commonProps} />;
      case "select":
      case "multiSelect":
        return <SelectField {...commonProps} />;
      case "switch":
        return <SwitchField {...commonProps} />;
      case "checkbox":
        return <CheckboxField {...commonProps} />;
      case "radio":
        return <RadioField {...commonProps} />;
      case "date":
      case "datetime":
        return <DateField {...commonProps} />;
      case "dateString":
        return <DateStringField {...commonProps} />;
      case "dateRange":
        return <DateRangeField {...commonProps} />;
      case "dateRangeString":
        return <DateRangeField {...commonProps} type="dateString" />;
      case "dateTimeRange":
        return <DateTimeRangeField {...commonProps} />;
      case "text":
      case "email":
      case "tel":
      case "password":
      case "url":
      case "number":
      case "time":
        return <TextField {...commonProps} />;
      case "file":
        return <FileField {...commonProps} />;
      case "multiFile":
        return <MultiFileField {...commonProps} />;
      case "custom":
        return <CustomField {...commonProps} />;
      case "color":
        return <ColorField {...commonProps} />;
      case "tags":
        return <TagsField {...commonProps} />;
      case "quill":
        return <QuillField {...commonProps} />;
      default:
        return null;
    }
  }, [showRequiredAsterisk, layout]);

  return renderFormInputs(fields, renderField) as FormInputs<T>;
}
