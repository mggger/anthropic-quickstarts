export type DataFormat = "text" | "number" | "percentage" | "currency";
export type ColumnAlign = "left" | "center" | "right";

export interface TableColumnConfig {
  label: string;
  format?: DataFormat;
  align?: ColumnAlign;
  width?: string;
  color?: string;
}

export interface ChartConfig {
  [key: string]: TableColumnConfig | {
    label: string;
    stacked?: boolean;
    color?: string;
  };
}

export interface ColumnDefinition {
  key: string;
  label: string;
  format?: DataFormat;
}

export interface ChartData {
  chartType: "bar" | "multiBar" | "line" | "pie" | "area" | "stackedArea" | "tabular";
  config: {
    title: string;
    description: string;
    trend?: {
      percentage: number;
      direction: "up" | "down";
    };
    footer?: string;
    totalLabel?: string;
    xAxisKey?: string;
    columns?: ColumnDefinition[]; // 新增表格列定义
  };
  data: Array<Record<string, any>>;
  chartConfig: ChartConfig;
}