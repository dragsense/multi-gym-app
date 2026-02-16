import type { ComponentConfig } from "@measured/puck";

export type VariableProps = {
  variable: string;
  label?: string;
  fontSize?: "xs" | "sm" | "base" | "lg" | "xl" | "2xl";
};

export const Variable: ComponentConfig<VariableProps> = {
  fields: {
    variable: {
      type: "text",
      label: "Variable",
    },
    label: {
      type: "text",
      label: "Label (optional)",
    },
    fontSize: {
      type: "select",
      label: "Font Size",
      options: [
        { label: "Extra Small (xs)", value: "xs" },
        { label: "Small (sm)", value: "sm" },
        { label: "Base (base)", value: "base" },
        { label: "Large (lg)", value: "lg" },
        { label: "Extra Large (xl)", value: "xl" },
        { label: "2XL", value: "2xl" },
      ],
    },
  },
  defaultProps: {
    variable: "user.email",
    label: "",
    fontSize: "sm",
  },
  render: ({ variable, label, fontSize = "sm" }) => {
    const displayText = label || `{{${variable}}}`;
    const fontSizeClasses = {
      xs: "text-xs",
      sm: "text-sm",
      base: "text-base",
      lg: "text-lg",
      xl: "text-xl",
      "2xl": "text-2xl",
    };
    return (
      <span className={`inline-flex items-center px-2 py-1 rounded-md bg-primary/10 text-primary font-mono border border-primary/20 ${fontSizeClasses[fontSize]}`}>
        {displayText}
      </span>
    );
  },
};
