import type { ComponentConfig } from "@measured/puck";

export type SpacerProps = {
  height: "sm" | "md" | "lg" | "xl";
};

export const Spacer: ComponentConfig<SpacerProps> = {
  fields: {
    height: {
      type: "select",
      label: "Height",
      options: [
        { label: "Small", value: "sm" },
        { label: "Medium", value: "md" },
        { label: "Large", value: "lg" },
        { label: "Extra Large", value: "xl" },
      ],
    },
  },
  defaultProps: {
    height: "md",
  },
  render: ({ height }) => {
    const heightClasses = {
      sm: "h-4",
      md: "h-8",
      lg: "h-16",
      xl: "h-24",
    };

    return <div className={heightClasses[height]} />;
  },
};
