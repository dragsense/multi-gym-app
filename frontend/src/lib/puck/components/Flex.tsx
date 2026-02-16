import type { ComponentConfig } from "@measured/puck";

export type FlexProps = {
  direction?: "row" | "row-reverse" | "column" | "column-reverse";
  justify?: "start" | "center" | "end" | "between" | "around" | "evenly";
  align?: "start" | "center" | "end" | "stretch" | "baseline";
  wrap?: "nowrap" | "wrap" | "wrap-reverse";
  gap?: "none" | "sm" | "md" | "lg" | "xl";
  padding?: "none" | "sm" | "md" | "lg";
  background?: string;
};

export const Flex: ComponentConfig<FlexProps> = {
  fields: {
    children: {
      type: "slot",
    },
    direction: {
      type: "select",
      label: "Direction",
      options: [
        { label: "Row", value: "row" },
        { label: "Row Reverse", value: "row-reverse" },
        { label: "Column", value: "column" },
        { label: "Column Reverse", value: "column-reverse" },
      ],
    },
    justify: {
      type: "select",
      label: "Justify Content",
      options: [
        { label: "Start", value: "start" },
        { label: "Center", value: "center" },
        { label: "End", value: "end" },
        { label: "Space Between", value: "between" },
        { label: "Space Around", value: "around" },
        { label: "Space Evenly", value: "evenly" },
      ],
    },
    align: {
      type: "select",
      label: "Align Items",
      options: [
        { label: "Start", value: "start" },
        { label: "Center", value: "center" },
        { label: "End", value: "end" },
        { label: "Stretch", value: "stretch" },
        { label: "Baseline", value: "baseline" },
      ],
    },
    wrap: {
      type: "select",
      label: "Wrap",
      options: [
        { label: "No Wrap", value: "nowrap" },
        { label: "Wrap", value: "wrap" },
        { label: "Wrap Reverse", value: "wrap-reverse" },
      ],
    },
    gap: {
      type: "select",
      label: "Gap",
      options: [
        { label: "None", value: "none" },
        { label: "Small", value: "sm" },
        { label: "Medium", value: "md" },
        { label: "Large", value: "lg" },
        { label: "Extra Large", value: "xl" },
      ],
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
    background: {
      type: "text",
      label: "Background Color (optional)",
    },
  },
  defaultProps: {
    direction: "row",
    justify: "start",
    align: "start",
    wrap: "nowrap",
    gap: "md",
    padding: "none",
  },
  render: ({ direction, justify, align, wrap, gap, padding, background, children: Content }) => {
    const flexDirectionMap = {
      row: "row",
      "row-reverse": "row-reverse",
      column: "column",
      "column-reverse": "column-reverse",
    };

    const justifyContentMap = {
      start: "flex-start",
      center: "center",
      end: "flex-end",
      between: "space-between",
      around: "space-around",
      evenly: "space-evenly",
    };

    const alignItemsMap = {
      start: "flex-start",
      center: "center",
      end: "flex-end",
      stretch: "stretch",
      baseline: "baseline",
    };

    const flexWrapMap = {
      nowrap: "nowrap",
      wrap: "wrap",
      "wrap-reverse": "wrap-reverse",
    };

    const gapMap = {
      none: "0",
      sm: "0.5rem",
      md: "1rem",
      lg: "1.5rem",
      xl: "2rem",
    };

    const paddingMap = {
      none: "0",
      sm: "0.5rem",
      md: "1rem",
      lg: "1.5rem",
    };

    return (
      <div
        style={{
          padding: paddingMap[padding || "none"],
          backgroundColor: background || undefined,
          minHeight: "50px",
        }}
      >
        {Content ? (
          <Content
            style={{
              display: "flex",
              flexDirection: flexDirectionMap[direction || "row"],
              justifyContent: justifyContentMap[justify || "start"],
              alignItems: alignItemsMap[align || "start"],
              flexWrap: flexWrapMap[wrap || "nowrap"],
              gap: gapMap[gap || "md"],
            }}
          />
        ) : (
          <div className="text-muted-foreground text-sm py-4 text-center opacity-50">Drop components here</div>
        )}
      </div>
    );
  },
};
