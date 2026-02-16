import type { ComponentConfig } from "@measured/puck";

export type HeadingProps = {
  text: string;
  level: 1 | 2 | 3 | 4 | 5 | 6;
  align: "left" | "center" | "right";
  color?: string;
  fontSize?: "xs" | "sm" | "base" | "lg" | "xl" | "2xl" | "3xl" | "4xl" | "5xl" | "6xl";
};

export const Heading: ComponentConfig<HeadingProps> = {
  fields: {
    text: {
      type: "text",
      label: "Text",
    },
    level: {
      type: "select",
      label: "Level",
      options: [
        { label: "H1", value: 1 },
        { label: "H2", value: 2 },
        { label: "H3", value: 3 },
        { label: "H4", value: 4 },
        { label: "H5", value: 5 },
        { label: "H6", value: 6 },
      ],
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
      label: "Font Size (optional - overrides level)",
      options: [
        { label: "Extra Small (xs)", value: "xs" },
        { label: "Small (sm)", value: "sm" },
        { label: "Base (base)", value: "base" },
        { label: "Large (lg)", value: "lg" },
        { label: "Extra Large (xl)", value: "xl" },
        { label: "2XL", value: "2xl" },
        { label: "3XL", value: "3xl" },
        { label: "4XL", value: "4xl" },
        { label: "5XL", value: "5xl" },
        { label: "6XL", value: "6xl" },
      ],
    },
  },
  defaultProps: {
    text: "Heading",
    level: 2,
    align: "left",
  },
  render: ({ text, level, align, color, fontSize }) => {
    const HeadingTag = `h${level}` as keyof JSX.IntrinsicElements;
    
    const fontSizeClasses = {
      xs: "text-xs",
      sm: "text-sm",
      base: "text-base",
      lg: "text-lg",
      xl: "text-xl",
      "2xl": "text-2xl",
      "3xl": "text-3xl",
      "4xl": "text-4xl",
      "5xl": "text-5xl",
      "6xl": "text-6xl",
    };

    // Default sizes based on heading level if fontSize not specified
    const defaultLevelSizes = {
      1: "text-4xl",
      2: "text-3xl",
      3: "text-2xl",
      4: "text-xl",
      5: "text-lg",
      6: "text-base",
    };

    const sizeClass = fontSize 
      ? fontSizeClasses[fontSize as keyof typeof fontSizeClasses]
      : defaultLevelSizes[level];

    return (
      <HeadingTag
        className={sizeClass}
        style={{
          textAlign: align,
          color: color || undefined,
        }}
      >
        {text}
      </HeadingTag>
    );
  },
};
