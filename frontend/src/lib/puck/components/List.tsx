import type { ComponentConfig } from "@measured/puck";

export type ListProps = {
  listType?: "ul" | "ol";
  gap?: "none" | "sm" | "md" | "lg";
  padding?: "none" | "sm" | "md" | "lg";
};

export const List: ComponentConfig<ListProps> = {
  fields: {
    children: {
      type: "slot",
    },
    listType: {
      type: "select",
      label: "List Type",
      options: [
        { label: "Unordered (ul)", value: "ul" },
        { label: "Ordered (ol)", value: "ol" },
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
  },
  defaultProps: {
    listType: "ul",
    gap: "md",
    padding: "none",
  },
  render: ({ listType = "ul", gap, padding, children: Content }) => {
    const gapMap = {
      none: "0",
      sm: "0.25rem",
      md: "0.5rem",
      lg: "1rem",
    };

    const paddingMap = {
      none: "0",
      sm: "0.5rem",
      md: "1rem",
      lg: "1.5rem",
    };

    const ListTag = listType;

    return (
      <div
        style={{
          padding: paddingMap[padding || "none"],
        }}
      >
        {Content ? (
          <ListTag
            style={{
              display: "flex",
              flexDirection: "column",
              gap: gapMap[gap || "md"],
              listStyle: listType === "ul" ? "disc" : "decimal",
              paddingLeft: "1.5rem",
              margin: 0,
            }}
          >
            <Content />
          </ListTag>
        ) : (
          <div className="text-muted-foreground text-sm py-4 text-center opacity-50">
            Drop ListItem components here
          </div>
        )}
      </div>
    );
  },
};
