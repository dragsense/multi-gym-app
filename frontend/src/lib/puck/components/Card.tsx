import type { ComponentConfig } from "@measured/puck";

export type CardProps = {
  title?: string;
  content?: string;
  background?: string;
  padding?: "none" | "sm" | "md" | "lg";
  border?: boolean;
  shadow?: boolean;
};

export const Card: ComponentConfig<CardProps> = {
  fields: {
    children: {
      type: "slot",
    },
    title: {
      type: "text",
      label: "Title (optional)",
    },
    content: {
      type: "textarea",
      label: "Content (optional)",
    },
    background: {
      type: "text",
      label: "Background Color (optional)",
    },
    padding: {
      type: "select",
      label: "Padding",
      options: [
        { label: "None", value: "none" },
        { label: "Small", value: "sm" },
        { label: "Medium", value: "md" },
        { label: "Large", value: "lg" },
      ],
    },
    border: {
      type: "checkbox",
      label: "Show Border",
    },
    shadow: {
      type: "checkbox",
      label: "Show Shadow",
    },
  },
  defaultProps: {
    padding: "md",
    border: true,
    shadow: false,
  },
  render: ({ title, content, background, padding, border, shadow, children: Content }) => {
    const paddingMap = {
      none: "0",
      sm: "0.5rem",
      md: "1rem",
      lg: "1.5rem",
    };

    return (
      <div
        className={`rounded-lg ${border ? "border" : ""} ${shadow ? "shadow-md" : ""}`}
        style={{
          padding: paddingMap[padding || "md"],
          backgroundColor: background || undefined,
        }}
      >
        {title && <h3 className="text-lg font-semibold mb-2">{title}</h3>}
        {content && <p className="text-muted-foreground mb-4">{content}</p>}
        {Content ? <Content /> : null}
      </div>
    );
  },
};
