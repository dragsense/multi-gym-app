import type { ComponentConfig } from "@measured/puck";

export type DividerProps = {
  spacing: "sm" | "md" | "lg";
};

export const Divider: ComponentConfig<DividerProps> = {
  fields: {
    spacing: {
      type: "select",
      label: "Spacing",
      options: [
        { label: "Small", value: "sm" },
        { label: "Medium", value: "md" },
        { label: "Large", value: "lg" },
      ],
    },
  },
  defaultProps: {
    spacing: "md",
  },
  render: ({ spacing }) => {
    const spacingClasses = {
      sm: "my-2",
      md: "my-4",
      lg: "my-8",
    };

    return <hr className={spacingClasses[spacing]} />;
  },
};
