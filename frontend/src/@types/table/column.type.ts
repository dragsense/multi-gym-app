  export type ColumnConfig<T> = {
    key: keyof T | string;
    label: string;
    render?: (row: T, index: number) => React.ReactNode;
    className?: string;
  }
  