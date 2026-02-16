import type { ComponentConfig } from "@measured/puck";

export type LinkProps = {
  text: string;
  href: string;
  target?: "_blank" | "_self" | "_parent" | "_top";
  fontSize?: "xs" | "sm" | "base" | "lg" | "xl" | "2xl";
  color?: string;
};

export const Link: ComponentConfig<LinkProps> = {
  fields: {
    text: {
      type: "text",
      label: "Link Text",
    },
    href: {
      type: "text",
      label: "URL",
    },
    target: {
      type: "select",
      label: "Target",
      options: [
        { label: "Same Window", value: "_self" },
        { label: "New Window", value: "_blank" },
        { label: "Parent Frame", value: "_parent" },
        { label: "Top Frame", value: "_top" },
      ],
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
    text: "Link",
    href: "#",
    target: "_self",
    fontSize: "base",
  },
  render: ({ text, href, target, fontSize = "base", color }) => {
    const fontSizeClasses = {
      xs: "text-xs",
      sm: "text-sm",
      base: "text-base",
      lg: "text-lg",
      xl: "text-xl",
      "2xl": "text-2xl",
    };

    return (
      <a
        href={href}
        target={target}
        className={`${fontSizeClasses[fontSize]} underline hover:opacity-80 transition-opacity`}
        style={{
          color: color || undefined,
        }}
      >
        {text}
      </a>
    );
  },
};
