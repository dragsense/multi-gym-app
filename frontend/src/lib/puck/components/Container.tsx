import type { ComponentConfig } from "@measured/puck";

export type ContainerProps = {
  background?: string;
  padding?: "none" | "sm" | "md" | "lg";
};

export const Container: ComponentConfig<ContainerProps> = {
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
      ],
    },
  },
  defaultProps: {
    padding: "md",
  },
  render: ({ background, padding, children: Content }) => {
    const paddingClasses = {
      none: "p-0",
      sm: "p-2",
      md: "p-4",
      lg: "p-6",
    };



    return (
      <div
        className={`${paddingClasses[padding || "md"]}`}
        style={{
          backgroundColor: background || undefined,
        }}
      >
        {Content ? <Content /> : <div className="text-muted-foreground text-sm py-4 text-center opacity-50">Drop components here</div>}
      </div>
    );
  },
};
