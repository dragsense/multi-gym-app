import type { ComponentConfig } from "@measured/puck";

export type ButtonProps = {
  text: string;
  href?: string;
  variant: "primary" | "secondary" | "outline";
  align: "left" | "center" | "right";
  fontSize?: "xs" | "sm" | "base" | "lg" | "xl";
};

export const Button: ComponentConfig<ButtonProps> = {
  fields: {
    text: {
      type: "text",
      label: "Text",
    },
    href: {
      type: "text",
      label: "Link (optional)",
    },
    variant: {
      type: "select",
      label: "Variant",
      options: [
        { label: "Primary", value: "primary" },
        { label: "Secondary", value: "secondary" },
        { label: "Outline", value: "outline" },
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
    fontSize: {
      type: "select",
      label: "Font Size",
      options: [
        { label: "Extra Small (xs)", value: "xs" },
        { label: "Small (sm)", value: "sm" },
        { label: "Base (base)", value: "base" },
        { label: "Large (lg)", value: "lg" },
        { label: "Extra Large (xl)", value: "xl" },
      ],
    },
  },
  defaultProps: {
    text: "Button",
    variant: "primary",
    align: "left",
    fontSize: "base",
  },
  render: ({ text, href, variant, align, fontSize = "base" }) => {
    const variantClasses = {
      primary: "bg-primary text-primary-foreground hover:bg-primary/90",
      secondary: "bg-secondary text-secondary-foreground hover:bg-secondary/80",
      outline: "border border-input bg-background hover:bg-accent",
    };

    const fontSizeClasses = {
      xs: "text-xs",
      sm: "text-sm",
      base: "text-base",
      lg: "text-lg",
      xl: "text-xl",
    };

    const button = (
      <button className={`px-4 py-2 rounded-md ${variantClasses[variant]} ${fontSizeClasses[fontSize]}`}>
        {text}
      </button>
    );

    if (href) {
      return (
        <div style={{ textAlign: align }}>
          <a href={href}>{button}</a>
        </div>
      );
    }

    return <div style={{ textAlign: align }}>{button}</div>;
  },
};
