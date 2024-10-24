"use client";

import React from "react";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {Table, TableBody, TableCell, TableCaption, TableRow, TableHeader, TableHead, TableFooter} from "@/components/ui/table";
import {Button} from "@/components/ui/button"
import { TrendingUp, TrendingDown, Download } from "lucide-react";
import {
  Area,
  AreaChart,
  Bar,
  BarChart,
  CartesianGrid,
  Label,
  Line,
  LineChart,
  Pie,
  PieChart,
  XAxis,
} from "recharts";
import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
} from "@/components/ui/chart";
import type { ChartData, TableColumnConfig } from "@/types/chart";

function BarChartComponent({ data }: { data: ChartData }) {
  const dataKey = Object.keys(data.chartConfig)[0];

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-xl">{data.config.title}</CardTitle>
        <CardDescription>{data.config.description}</CardDescription>
      </CardHeader>
      <CardContent>
        <ChartContainer config={data.chartConfig}>
          <BarChart accessibilityLayer data={data.data}>
            <CartesianGrid vertical={false} />
            <XAxis
              dataKey={data.config.xAxisKey}
              tickLine={false}
              tickMargin={10}
              axisLine={false}
              tickFormatter={(value) => {
                return value.length > 20
                  ? `${value.substring(0, 17)}...`
                  : value;
              }}
            />
            <ChartTooltip
              cursor={false}
              content={<ChartTooltipContent hideLabel />}
            />
            <Bar
              dataKey={dataKey}
              fill={`var(--color-${dataKey})`}
              radius={8}
            />
          </BarChart>
        </ChartContainer>
      </CardContent>
      <CardFooter className="flex-col items-start gap-2 text-sm">
        {data.config.trend && (
          <div className="flex gap-2 font-medium leading-none">
            Trending {data.config.trend.direction} by{" "}
            {data.config.trend.percentage}% this period{" "}
            {data.config.trend.direction === "up" ? (
              <TrendingUp className="h-4 w-4" />
            ) : (
              <TrendingDown className="h-4 w-4" />
            )}
          </div>
        )}
        {data.config.footer && (
          <div className="leading-none text-muted-foreground">
            {data.config.footer}
          </div>
        )}
      </CardFooter>
    </Card>
  );
}

function MultiBarChartComponent({ data }: { data: ChartData }) {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-xl">{data.config.title}</CardTitle>
        <CardDescription>{data.config.description}</CardDescription>
      </CardHeader>
      <CardContent>
        <ChartContainer config={data.chartConfig}>
          <BarChart accessibilityLayer data={data.data}>
            <CartesianGrid vertical={false} />
            <XAxis
              dataKey={data.config.xAxisKey}
              tickLine={false}
              tickMargin={10}
              axisLine={false}
              tickFormatter={(value) => {
                return value.length > 20
                  ? `${value.substring(0, 17)}...`
                  : value;
              }}
            />
            <ChartTooltip
              cursor={false}
              content={<ChartTooltipContent indicator="dashed" />}
            />
            {Object.keys(data.chartConfig).map((key) => (
              <Bar
                key={key}
                dataKey={key}
                fill={`var(--color-${key})`}
                radius={4}
              />
            ))}
          </BarChart>
        </ChartContainer>
      </CardContent>
      <CardFooter className="flex-col items-start gap-2 text-sm">
        {data.config.trend && (
          <div className="flex gap-2 font-medium leading-none">
            Trending {data.config.trend.direction} by{" "}
            {data.config.trend.percentage}% this period{" "}
            {data.config.trend.direction === "up" ? (
              <TrendingUp className="h-4 w-4" />
            ) : (
              <TrendingDown className="h-4 w-4" />
            )}
          </div>
        )}
        {data.config.footer && (
          <div className="leading-none text-muted-foreground">
            {data.config.footer}
          </div>
        )}
      </CardFooter>
    </Card>
  );
}

function LineChartComponent({ data }: { data: ChartData }) {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-xl">{data.config.title}</CardTitle>
        <CardDescription>{data.config.description}</CardDescription>
      </CardHeader>
      <CardContent>
        <ChartContainer config={data.chartConfig}>
          <LineChart
            accessibilityLayer
            data={data.data}
            margin={{
              left: 12,
              right: 12,
            }}
          >
            <CartesianGrid vertical={false} />
            <XAxis
              dataKey={data.config.xAxisKey}
              tickLine={false}
              axisLine={false}
              tickMargin={8}
              tickFormatter={(value) => {
                return value.length > 20
                  ? `${value.substring(0, 17)}...`
                  : value;
              }}
            />
            <ChartTooltip
              cursor={false}
              content={<ChartTooltipContent hideLabel />}
            />
            {Object.keys(data.chartConfig).map((key) => (
              <Line
                key={key}
                type="natural"
                dataKey={key}
                stroke={`var(--color-${key})`}
                strokeWidth={2}
                dot={false}
              />
            ))}
          </LineChart>
        </ChartContainer>
      </CardContent>
      <CardFooter className="flex-col items-start gap-2 text-sm">
        {data.config.trend && (
          <div className="flex gap-2 font-medium leading-none">
            Trending {data.config.trend.direction} by{" "}
            {data.config.trend.percentage}% this period{" "}
            {data.config.trend.direction === "up" ? (
              <TrendingUp className="h-4 w-4" />
            ) : (
              <TrendingDown className="h-4 w-4" />
            )}
          </div>
        )}
        {data.config.footer && (
          <div className="leading-none text-muted-foreground">
            {data.config.footer}
          </div>
        )}
      </CardFooter>
    </Card>
  );
}

function PieChartComponent({ data }: { data: ChartData }) {
  const totalValue = React.useMemo(() => {
    return data.data.reduce((acc, curr) => acc + curr.value, 0);
  }, [data.data]);

  const chartData = data.data.map((item, index) => {
    return {
      ...item,
      // Use the same color variable pattern as other charts
      fill: `hsl(var(--chart-${index + 1}))`,
    };
  });

  return (
    <Card className="flex flex-col">
      <CardHeader className="items-center pb-0">
        <CardTitle className="text-xl">{data.config.title}</CardTitle>
        <CardDescription>{data.config.description}</CardDescription>
      </CardHeader>
      <CardContent className="flex-1 pb-0">
        <ChartContainer
          config={data.chartConfig}
          className="mx-auto aspect-square max-h-[250px]"
        >
          <PieChart>
            <ChartTooltip
              cursor={false}
              content={<ChartTooltipContent hideLabel />}
            />
            <Pie
              data={chartData}
              dataKey="value"
              nameKey="segment"
              innerRadius={60}
              strokeWidth={5}
            >
              <Label
                content={({ viewBox }) => {
                  if (viewBox && "cx" in viewBox && "cy" in viewBox) {
                    return (
                      <text
                        x={viewBox.cx}
                        y={viewBox.cy}
                        textAnchor="middle"
                        dominantBaseline="middle"
                      >
                        <tspan
                          x={viewBox.cx}
                          y={viewBox.cy}
                          className="fill-foreground text-3xl font-bold"
                        >
                          {totalValue.toLocaleString()}
                        </tspan>
                        <tspan
                          x={viewBox.cx}
                          y={(viewBox.cy || 0) + 24}
                          className="fill-muted-foreground"
                        >
                          {data.config.totalLabel}
                        </tspan>
                      </text>
                    );
                  }
                  return null;
                }}
              />
            </Pie>
          </PieChart>
        </ChartContainer>
      </CardContent>
      <CardFooter className="flex-col gap-2 text-sm">
        {data.config.trend && (
          <div className="flex items-center gap-2 font-medium leading-none">
            Trending {data.config.trend.direction} by{" "}
            {data.config.trend.percentage}% this period{" "}
            {data.config.trend.direction === "up" ? (
              <TrendingUp className="h-4 w-4" />
            ) : (
              <TrendingDown className="h-4 w-4" />
            )}
          </div>
        )}
        {data.config.footer && (
          <div className="leading-none text-muted-foreground">
            {data.config.footer}
          </div>
        )}
      </CardFooter>
    </Card>
  );
}

function AreaChartComponent({
  data,
  stacked,
}: {
  data: ChartData;
  stacked?: boolean;
}) {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-xl">{data.config.title}</CardTitle>
        <CardDescription>{data.config.description}</CardDescription>
      </CardHeader>
      <CardContent>
        <ChartContainer config={data.chartConfig}>
          <AreaChart
            accessibilityLayer
            data={data.data}
            margin={{
              left: 12,
              right: 12,
            }}
          >
            <CartesianGrid vertical={false} />
            <XAxis
              dataKey={data.config.xAxisKey}
              tickLine={false}
              axisLine={false}
              tickMargin={8}
              tickFormatter={(value) => {
                return value.length > 20
                  ? `${value.substring(0, 17)}...`
                  : value;
              }}
            />
            <ChartTooltip
              cursor={false}
              content={
                <ChartTooltipContent indicator={stacked ? "dot" : "line"} />
              }
            />
            {Object.keys(data.chartConfig).map((key) => (
              <Area
                key={key}
                type="natural"
                dataKey={key}
                fill={`var(--color-${key})`}
                fillOpacity={0.4}
                stroke={`var(--color-${key})`}
                stackId={stacked ? "a" : undefined}
              />
            ))}
          </AreaChart>
        </ChartContainer>
      </CardContent>
      <CardFooter>
        <div className="flex w-full items-start gap-2 text-sm">
          <div className="grid gap-2">
            {data.config.trend && (
              <div className="flex items-center gap-2 font-medium leading-none">
                Trending {data.config.trend.direction} by{" "}
                {data.config.trend.percentage}% this period{" "}
                {data.config.trend.direction === "up" ? (
                  <TrendingUp className="h-4 w-4" />
                ) : (
                  <TrendingDown className="h-4 w-4" />
                )}
              </div>
            )}
            {data.config.footer && (
              <div className="leading-none text-muted-foreground">
                {data.config.footer}
              </div>
            )}
          </div>
        </div>
      </CardFooter>
    </Card>
  );
}


function formatValue(value: any, format?: string): string {
    if (value === null || value === undefined) return '';

    switch (format) {
        case 'number':
            return typeof value === 'number' ? value.toLocaleString() : value;
        case 'percentage':
            return typeof value === 'number'
                ? `${(value * 100).toFixed(2)}%`
                : value;
        case 'currency':
            return typeof value === 'number'
                ? new Intl.NumberFormat('en-US', {
                    style: 'currency',
                    currency: 'USD'
                }).format(value)
                : value;
        default:
            return String(value);
    }
}

export function TabularChartComponent({ data }: { data: ChartData }) {
    // 使用配置的列定义或从数据中推断
    const headers = React.useMemo(() => {
        if (data.config.columns) {
            return data.config.columns.map(col => col.key);
        }
        const firstRow = data.data[0] || {};
        return Object.keys(firstRow).filter(key =>
            !['id', '_id', 'uuid'].includes(key.toLowerCase())
        );
    }, [data.data, data.config.columns]);

    // 获取列配置
    const getColumnConfig = (header: string): TableColumnConfig => {
        const columnDef = data.config.columns?.find(col => col.key === header);
        const configDef = data.chartConfig[header] as TableColumnConfig;

        return {
            label: columnDef?.label || configDef?.label || header,
            format: columnDef?.format || configDef?.format,
            align: configDef?.align || (columnDef?.format === 'number' ? 'right' : 'left'),
            width: configDef?.width,
            color: configDef?.color
        };
    };

    const handleExportCSV = () => {
        // 构建 CSV 内容
        const columnConfigs = headers.map(header => getColumnConfig(header));
        const headerRow = columnConfigs.map(config => config.label).join(',');

        const dataRows = data.data.map(row => {
            return headers.map(header => {
                const value = row[header];
                // 处理包含逗号的文本
                const formattedValue = formatValue(value, getColumnConfig(header).format);
                return typeof formattedValue === 'string' && formattedValue.includes(',')
                    ? `"${formattedValue}"`
                    : formattedValue;
            }).join(',');
        });

        const csvContent = [headerRow, ...dataRows].join('\n');

        // 创建并下载文件
        const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
        const link = document.createElement('a');
        const url = URL.createObjectURL(blob);

        link.setAttribute('href', url);
        link.setAttribute('download', `${data.config.title || 'export'}.csv`);
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    };


    function formatAndTruncateValue(value: any, format?: string, maxLength: number = 30): {
        displayValue: string;
        fullValue: string;
        needsTruncation: boolean;
    } {
        const formattedValue = formatValue(value, format);
        const fullValue = String(formattedValue);

        if (fullValue.length > maxLength) {
            return {
                displayValue: `${fullValue.substring(0, maxLength)}...`,
                fullValue,
                needsTruncation: true
            };
        }

        return {
            displayValue: fullValue,
            fullValue,
            needsTruncation: false
        };
    }

    return (
        <div className="w-full space-y-4">
            {(data.config.title || data.config.description) && (
                <div className="space-y-1.5">
                    {data.config.title && (
                        <h3 className="text-lg font-semibold leading-none tracking-tight">
                            {data.config.title}
                        </h3>
                    )}
                    {data.config.description && (
                        <p className="text-sm text-muted-foreground">
                            {data.config.description}
                        </p>
                    )}
                    <div className="pt-2">
                    <Button
                        variant="outline"
                        size="sm"
                        className=""
                        onClick={handleExportCSV}
                    >
                        <Download className="h-4 w-4 mr-1" />
                        Export CSV
                    </Button>
                    </div>
                </div>
            )}

            <Table>
                {data.config.footer && (
                    <TableCaption>{data.config.footer}</TableCaption>
                )}

                <TableHeader>
                    <TableRow>
                        {headers.map((header) => {
                            const config = getColumnConfig(header);
                            return (
                                <TableHead
                                    key={header}
                                    style={{ width: config.width || 'auto' }}
                                    className={config.align === 'right' ? 'text-right' : 'text-left'}
                                >
                                    {config.label}
                                </TableHead>
                            );
                        })}
                    </TableRow>
                </TableHeader>

                <TableBody>
                    {data.data.map((row, rowIndex) => (
                        <TableRow key={rowIndex}>
                            {headers.map((header) => {
                                const config = getColumnConfig(header);
                                const value = row[header];
                                return (
                                    <TableCell
                                        key={header}
                                        className={`text-${config.align || 'left'}`}
                                        style={{
                                            width: config.width || 'auto'
                                        }}
                                    >
                                        {(() => {
                                            const { displayValue, fullValue, needsTruncation } = formatAndTruncateValue(
                                                value,
                                                config.format
                                            );

                                            return displayValue;
                                        })()}
                                    </TableCell>
                                );
                            })}
                        </TableRow>
                    ))}
                </TableBody>
            </Table>

            {data.config.trend && (
                <div className="flex items-center gap-2 text-sm">
          <span className="font-medium">
            Trending {data.config.trend.direction} by {data.config.trend.percentage}%
          </span>
                    {data.config.trend.direction === "up" ? (
                        <TrendingUp className="h-4 w-4" />
                    ) : (
                        <TrendingDown className="h-4 w-4" />
                    )}
                </div>
            )}
        </div>
    );
}


export function ChartRenderer({ data }: { data: ChartData }) {
  switch (data.chartType) {
    case "bar":
      return <BarChartComponent data={data} />;
    case "multiBar":
      return <MultiBarChartComponent data={data} />;
    case "line":
      return <LineChartComponent data={data} />;
    case "pie":
      return <PieChartComponent data={data} />;
    case "area":
      return <AreaChartComponent data={data} />;
    case "stackedArea":
      return <AreaChartComponent data={data} stacked />;
    case "tabular":
      return <TabularChartComponent data={data} />;
    default:
      return null;
  }
}
