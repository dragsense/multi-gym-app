import type { ComponentConfig } from "@measured/puck";

export type ImageProps = {
  src: string;
  alt: string;
  width?: number;
  height?: number;
  align: "left" | "center" | "right";
};

export const Image: ComponentConfig<ImageProps> = {
  fields: {
    src: {
      type: "text",
      label: "Image URL",
    },
    alt: {
      type: "text",
      label: "Alt Text",
    },
    width: {
      type: "number",
      label: "Width (optional)",
    },
    height: {
      type: "number",
      label: "Height (optional)",
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
  },
  defaultProps: {
    src: "",
    alt: "Image",
    align: "center",
  },
  render: ({ src, alt, width, height, align }) => {
    return (
      <div style={{ textAlign: align }}>
        <img
          src={src}
          alt={alt}
          width={width}
          height={height}
          style={{
            maxWidth: "100%",
            height: "auto",
          }}
        />
      </div>
    );
  },
};
