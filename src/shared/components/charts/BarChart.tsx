import React from 'react';
import {
  BarChart as RechartsBarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  type TooltipProps,
  Cell,
} from 'recharts';

export interface BarChartDataPoint {
  [key: string]: string | number;
}

export interface BarConfig {
  dataKey: string;
  name: string;
  color?: string;
  stackId?: string;
}

interface BarChartProps {
  data: BarChartDataPoint[];
  bars: BarConfig[];
  xAxisKey: string;
  height?: number;
  showGrid?: boolean;
  showLegend?: boolean;
  showTooltip?: boolean;
  stacked?: boolean;
  horizontal?: boolean;
  formatXAxis?: (value: string | number) => string;
  formatYAxis?: (value: number) => string;
  formatTooltip?: (value: number, name: string) => string;
  className?: string;
  loading?: boolean;
  emptyMessage?: string;
  title?: string;
  subtitle?: string;
  barSize?: number;
  radius?: number | [number, number, number, number];
  colorByValue?: boolean;
  colorThresholds?: { value: number; color: string }[];
}

const defaultColors = [
  '#6366f1', // indigo
  '#8b5cf6', // purple
  '#ec4899', // pink
  '#f59e0b', // amber
  '#10b981', // green
  '#3b82f6', // blue
];

// Custom Tooltip Component
const CustomTooltip: React.FC<
  TooltipProps<number, string> & { formatTooltip?: (value: number, name: string) => string }
> = (props) => {
  const { active, payload, label, formatTooltip } = props;

  if (!active || !payload || !payload.length) {
    return null;
  }
  return (
    <div className="bg-white border border-gray-200 rounded-lg shadow-lg p-3">
      <p className="text-sm font-medium text-gray-900 mb-2">{label}</p>
      {payload.map((entry: { value?: number; name?: string; color?: string }, index: number) => (
        <div key={index} className="flex items-center justify-between space-x-4 text-sm">
          <div className="flex items-center space-x-2">
            <div
              className="w-3 h-3 rounded"
              style={{ backgroundColor: entry.color }}
            />
            <span className="text-gray-600">{entry.name}:</span>
          </div>
          <span className="font-medium text-gray-900">
            {formatTooltip && entry.value !== undefined && entry.name ? formatTooltip(entry.value, entry.name) : entry.value}
          </span>
        </div>
      ))}
    </div>
  );
};

// Get color based on value and thresholds
const getColorByValue = (
  value: number,
  thresholds?: { value: number; color: string }[]
): string => {
  if (!thresholds || thresholds.length === 0) return defaultColors[0];

  const sortedThresholds = [...thresholds].sort((a, b) => b.value - a.value);

  for (const threshold of sortedThresholds) {
    if (value >= threshold.value) {
      return threshold.color;
    }
  }

  return sortedThresholds[sortedThresholds.length - 1].color;
};

export const BarChart: React.FC<BarChartProps> = ({
  data,
  bars,
  xAxisKey,
  height = 300,
  showGrid = true,
  showLegend = true,
  showTooltip = true,
  stacked = false,
  horizontal = false,
  formatXAxis,
  formatYAxis,
  formatTooltip,
  className = '',
  loading = false,
  emptyMessage = 'Нет данных',
  title,
  subtitle,
  barSize,
  radius = [4, 4, 0, 0],
  colorByValue = false,
  colorThresholds,
}) => {
  if (loading) {
    return (
      <div
        className={`flex items-center justify-center bg-gray-50 rounded-lg ${className}`}
        style={{ height }}
      >
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-500"></div>
      </div>
    );
  }

  if (!data || data.length === 0) {
    return (
      <div
        className={`flex items-center justify-center bg-gray-50 rounded-lg ${className}`}
        style={{ height }}
      >
        <p className="text-sm text-gray-500">{emptyMessage}</p>
      </div>
    );
  }

  const ChartComponent = horizontal ? RechartsBarChart : RechartsBarChart;
  const layout = horizontal ? 'horizontal' : 'vertical';

  return (
    <div className={`bg-white rounded-lg border border-gray-200 p-4 ${className}`}>
      {/* Header */}
      {(title || subtitle) && (
        <div className="mb-4">
          {title && <h3 className="text-lg font-semibold text-gray-900">{title}</h3>}
          {subtitle && <p className="text-sm text-gray-500 mt-1">{subtitle}</p>}
        </div>
      )}

      {/* Chart */}
      <ResponsiveContainer width="100%" height={height}>
        <ChartComponent
          data={data}
          layout={layout}
          margin={{ top: 5, right: 30, left: 20, bottom: 5 }}
        >
          {showGrid && (
            <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
          )}

          {horizontal ? (
            <>
              <XAxis
                type="number"
                tickFormatter={formatYAxis}
                stroke="#9ca3af"
                style={{ fontSize: '12px' }}
              />
              <YAxis
                type="category"
                dataKey={xAxisKey}
                tickFormatter={formatXAxis}
                stroke="#9ca3af"
                style={{ fontSize: '12px' }}
                width={100}
              />
            </>
          ) : (
            <>
              <XAxis
                dataKey={xAxisKey}
                tickFormatter={formatXAxis}
                stroke="#9ca3af"
                style={{ fontSize: '12px' }}
              />
              <YAxis
                tickFormatter={formatYAxis}
                stroke="#9ca3af"
                style={{ fontSize: '12px' }}
              />
            </>
          )}

          {showTooltip && (
            <Tooltip
              content={<CustomTooltip formatTooltip={formatTooltip} />}
              cursor={{ fill: 'rgba(0, 0, 0, 0.05)' }}
            />
          )}

          {showLegend && (
            <Legend
              wrapperStyle={{ fontSize: '12px', paddingTop: '10px' }}
              iconType="rect"
            />
          )}

          {/* Bars */}
          {bars.map((bar, index) => {
            const color = bar.color || defaultColors[index % defaultColors.length];
            const stackId = stacked ? (bar.stackId || 'stack') : undefined;

            return (
              <Bar
                key={bar.dataKey}
                dataKey={bar.dataKey}
                name={bar.name}
                fill={color}
                stackId={stackId}
                radius={radius}
                barSize={barSize}
              >
                {colorByValue &&
                  data.map((entry, entryIndex) => (
                    <Cell
                      key={`cell-${entryIndex}`}
                      fill={getColorByValue(
                        Number(entry[bar.dataKey]),
                        colorThresholds
                      )}
                    />
                  ))}
              </Bar>
            );
          })}
        </ChartComponent>
      </ResponsiveContainer>
    </div>
  );
};
