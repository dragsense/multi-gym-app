import type { ComponentConfig } from "@measured/puck";

export type ListItemProps = {
  text: string;
  fontSize?: "xs" | "sm" | "base" | "lg" | "xl" | "2xl";
  color?: string;
};

export const ListItem: ComponentConfig<ListItemProps> = {
  fields: {
    text: {
      type: "text",
      label: "Text",
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
    color: {
      type: "text",
      label: "Color (optional)",
    },
  },
  defaultProps: {
    text: "List Item",
    fontSize: "base",
  },
  render: ({ text, fontSize = "base", color }) => {
    const fontSizeClasses = {
      xs: "text-xs",
      sm: "text-sm",
      base: "text-base",
      lg: "text-lg",
      xl: "text-xl",
      "2xl": "text-2xl",
    };

    return (
      <li
        className={fontSizeClasses[fontSize]}
        style={{
          color: color || undefined,
        }}
      >
        {text}
      </li>
    );
  },
};
