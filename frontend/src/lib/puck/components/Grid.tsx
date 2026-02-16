import type { ComponentConfig } from "@measured/puck";

export type GridProps = {
  columns?: 1 | 2 | 3 | 4 | 5 | 6 | 12;
  gap?: "none" | "sm" | "md" | "lg" | "xl";
  padding?: "none" | "sm" | "md" | "lg";
  background?: string;
  align?: "start" | "center" | "end" | "stretch";
  justify?: "start" | "center" | "end" | "between" | "around" | "evenly";
};

export const Grid: ComponentConfig<GridProps> = {
  fields: {
    children: {
      type: "slot",
    },
    columns: {
      type: "select",
      label: "Columns",
      options: [
        { label: "1 Column", value: 1 },
        { label: "2 Columns", value: 2 },
        { label: "3 Columns", value: 3 },
        { label: "4 Columns", value: 4 },
        { label: "5 Columns", value: 5 },
        { label: "6 Columns", value: 6 },
        { label: "12 Columns", value: 12 },
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
    align: {
      type: "select",
      label: "Align Items",
      options: [
        { label: "Start", value: "start" },
        { label: "Center", value: "center" },
        { label: "End", value: "end" },
        { label: "Stretch", value: "stretch" },
      ],
    },
    justify: {
      type: "select",
      label: "Justify Items",
      options: [
        { label: "Start", value: "start" },
        { label: "Center", value: "center" },
        { label: "End", value: "end" },
        { label: "Space Between", value: "between" },
        { label: "Space Around", value: "around" },
        { label: "Space Evenly", value: "evenly" },
      ],
    },
    background: {
      type: "text",
      label: "Background Color (optional)",
    },
  },
  defaultProps: {
    columns: 2,
    gap: "md",
    padding: "none",
    align: "stretch",
    justify: "start",
  },
  render: ({ columns, gap, padding, background, align, justify, children: Content }) => {
    const gridTemplateColumnsMap = {
      1: "1fr",
      2: "repeat(2, 1fr)",
      3: "repeat(3, 1fr)",
      4: "repeat(4, 1fr)",
      5: "repeat(5, 1fr)",
      6: "repeat(6, 1fr)",
      12: "repeat(12, 1fr)",
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

    const alignItemsMap = {
      start: "start",
      center: "center",
      end: "end",
      stretch: "stretch",
    };

    const justifyContentMap = {
      start: "start",
      center: "center",
      end: "end",
      between: "space-between",
      around: "space-around",
      evenly: "space-evenly",
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
              display: "grid",
              gridTemplateColumns: gridTemplateColumnsMap[columns || 2],
              gap: gapMap[gap || "md"],
              alignItems: alignItemsMap[align || "stretch"],
              justifyContent: justifyContentMap[justify || "start"],
            }}
          />
        ) : (
          <div className="text-muted-foreground text-sm py-4 text-center opacity-50">Drop components here</div>
        )}
      </div>
    );
  },
};
