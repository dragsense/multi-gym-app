import type { ComponentConfig } from "@measured/puck";

export type TextProps = {
  text: string;
  align: "left" | "center" | "right";
  color?: string;
  fontSize?: "xs" | "sm" | "base" | "lg" | "xl" | "2xl" | "3xl" | "4xl";
  size?: "sm" | "md" | "lg"; // Keep for backward compatibility
};

export const Text: ComponentConfig<TextProps> = {
  fields: {
    text: {
      type: "textarea",
      label: "Text",
    },
    align: {
      type: "select",
      label: "Align",
      options: [
        { label: "Left", value: "left" },
        { label: "Center", value: "center" },
        { label: "Right", value: "right" },
      ],
    },
    color: {
      type: "text",
      label: "Color (optional)",
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
        { label: "3XL", value: "3xl" },
        { label: "4XL", value: "4xl" },
      ],
    },
    size: {
      type: "select",
      label: "Size (legacy)",
      options: [
        { label: "Small", value: "sm" },
        { label: "Medium", value: "md" },
        { label: "Large", value: "lg" },
      ],
    },
  },
  defaultProps: {
    text: "Enter your text here...",
    align: "left",
    fontSize: "base",
    size: "md",
  },
  render: ({ text, align, fontSize, size, color }) => {
    // Use fontSize if provided, otherwise fall back to size for backward compatibility
    const effectiveFontSize = fontSize || (size === "sm" ? "sm" : size === "lg" ? "lg" : "base");
    
    const fontSizeClasses = {
      xs: "text-xs",
      sm: "text-sm",
      base: "text-base",
      lg: "text-lg",
      xl: "text-xl",
      "2xl": "text-2xl",
      "3xl": "text-3xl",
      "4xl": "text-4xl",
    };

    return (
      <p
        className={fontSizeClasses[effectiveFontSize as keyof typeof fontSizeClasses] || "text-base"}
        style={{
          textAlign: align,
          color: color || undefined,
        }}
      >
        {text}
      </p>
    );
  },
};
