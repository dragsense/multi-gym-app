import type { ComponentConfig } from "@measured/puck";

export type SectionProps = {
  background?: string;
  padding?: "none" | "sm" | "md" | "lg" | "xl";
  maxWidth?: "sm" | "md" | "lg" | "xl" | "full";
};

export const Section: ComponentConfig<SectionProps> = {
  fields: {
    children: {
      type: "slot",
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
        { label: "Extra Large", value: "xl" },
      ],
    },
    maxWidth: {
      type: "select",
      label: "Max Width",
      options: [
        { label: "Small", value: "sm" },
        { label: "Medium", value: "md" },
        { label: "Large", value: "lg" },
        { label: "Extra Large", value: "xl" },
        { label: "Full", value: "full" },
      ],
    },
  },
  defaultProps: {
    padding: "md",
    maxWidth: "lg",
  },
  render: ({ background, padding, maxWidth, children: Content }) => {
    const paddingMap = {
      none: "0",
      sm: "1rem",
      md: "2rem",
      lg: "3rem",
      xl: "4rem",
    };

    const maxWidthMap = {
      sm: "640px",
      md: "768px",
      lg: "1024px",
      xl: "1280px",
      full: "100%",
    };

    return (
      <section
        style={{
          padding: paddingMap[padding || "md"],
          backgroundColor: background || undefined,
        }}
      >
        <div
          style={{
            maxWidth: maxWidthMap[maxWidth || "lg"],
            margin: "0 auto",
          }}
        >
          {Content ? <Content /> : <div className="text-muted-foreground text-sm py-4 text-center opacity-50">Drop components here</div>}
        </div>
      </section>
    );
  },
};
