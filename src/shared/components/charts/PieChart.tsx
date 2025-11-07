import React, { useState } from 'react';
import {
  PieChart as RechartsPieChart,
  Pie,
  Cell,
  ResponsiveContainer,
  Tooltip,
  Legend,
  type TooltipProps,
} from 'recharts';

export interface PieChartDataPoint {
  name: string;
  value: number;
  [key: string]: string | number;
}

interface PieChartProps {
  data: PieChartDataPoint[];
  height?: number;
  showLegend?: boolean;
  showTooltip?: boolean;
  showLabels?: boolean;
  showPercentage?: boolean;
  colors?: string[];
  doughnut?: boolean;
  innerRadius?: number;
  outerRadius?: number;
  formatValue?: (value: number) => string;
  formatLabel?: (entry: PieChartDataPoint) => string;
  className?: string;
  loading?: boolean;
  emptyMessage?: string;
  title?: string;
  subtitle?: string;
  centerLabel?: string;
  centerValue?: string | number;
  hoverable?: boolean;
}

const defaultColors = [
  '#6366f1', // indigo
  '#8b5cf6', // purple
  '#ec4899', // pink
  '#f59e0b', // amber
  '#10b981', // green
  '#3b82f6', // blue
  '#ef4444', // red
  '#06b6d4', // cyan
  '#84cc16', // lime
  '#f97316', // orange
];

// Custom Tooltip Component
const CustomTooltip: React.FC<
  TooltipProps<number, string> & { formatValue?: (value: number) => string }
> = (props) => {
  const { active, payload, formatValue } = props;

  if (!active || !payload || !payload.length) {
    return null;
  }

  const data = payload[0];
  return (
    <div className="bg-white border border-gray-200 rounded-lg shadow-lg p-3">
      <div className="flex items-center space-x-2 mb-1">
        <div
          className="w-3 h-3 rounded-full"
          style={{ backgroundColor: data.payload.fill }}
        />
        <span className="text-sm font-medium text-gray-900">{data.name}</span>
      </div>
      <p className="text-sm text-gray-600">
        Value: {formatValue ? formatValue(data.value) : data.value}
      </p>
      <p className="text-xs text-gray-500">
        {data.payload.percent
          ? `${(data.payload.percent * 100).toFixed(1)}%`
          : ''}
      </p>
    </div>
  );
};

// Custom Label Component
const renderCustomLabel = ({
  cx,
  cy,
  midAngle,
  innerRadius,
  outerRadius,
  percent,
  name,
  showPercentage,
}: {
  cx: number;
  cy: number;
  midAngle: number;
  innerRadius: number;
  outerRadius: number;
  percent: number;
  name: string;
  showPercentage?: boolean;
  // Additional props that may be passed by recharts
  [key: string]: unknown;
}) => {
  const RADIAN = Math.PI / 180;
  const radius = innerRadius + (outerRadius - innerRadius) * 0.5;
  const x = cx + radius * Math.cos(-midAngle * RADIAN);
  const y = cy + radius * Math.sin(-midAngle * RADIAN);

  if (percent < 0.05) return null; // Don't show label if slice is too small

  return (
    <text
      x={x}
      y={y}
      fill="white"
      textAnchor={x > cx ? 'start' : 'end'}
      dominantBaseline="central"
      className="text-xs font-medium"
    >
      {showPercentage ? `${(percent * 100).toFixed(0)}%` : name}
    </text>
  );
};

// Custom Legend Component
const CustomLegend = ({
  payload,
  formatValue,
}: {
  payload?: Array<{ value: string; color: string; payload: { value: number } }>;
  formatValue?: (value: number) => string;
}) => {
  if (!payload) return null;

  return (
    <div className="mt-4 grid grid-cols-2 gap-2">
      {payload.map((entry, index) => (
        <div key={`legend-${index}`} className="flex items-center space-x-2">
          <div
            className="w-3 h-3 rounded-full flex-shrink-0"
            style={{ backgroundColor: entry.color }}
          />
          <div className="flex-1 min-w-0">
            <p className="text-xs text-gray-600 truncate">{entry.value}</p>
            <p className="text-xs font-medium text-gray-900">
              {formatValue
                ? formatValue(entry.payload.value)
                : entry.payload.value}
            </p>
          </div>
        </div>
      ))}
    </div>
  );
};

export const PieChart: React.FC<PieChartProps> = ({
  data,
  height = 300,
  showLegend = true,
  showTooltip = true,
  showLabels = true,
  showPercentage = false,
  colors = defaultColors,
  doughnut = false,
  innerRadius: customInnerRadius,
  outerRadius: customOuterRadius,
  formatValue,
  formatLabel,
  className = '',
  loading = false,
  emptyMessage = 'No data available',
  title,
  subtitle,
  centerLabel,
  centerValue,
  hoverable = true,
}) => {
  const [activeIndex, setActiveIndex] = useState<number | null>(null);

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

  // Calculate percentages
  const total = data.reduce((sum, entry) => sum + entry.value, 0);
  const dataWithPercent = data.map((entry) => ({
    ...entry,
    percent: entry.value / total,
  }));

  const innerRadius = customInnerRadius !== undefined
    ? customInnerRadius
    : doughnut
    ? 60
    : 0;

  const outerRadius = customOuterRadius || 80;

  const onPieEnter = (_: unknown, index: number) => {
    if (hoverable) {
      setActiveIndex(index);
    }
  };

  const onPieLeave = () => {
    if (hoverable) {
      setActiveIndex(null);
    }
  };

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
      <div className="relative">
        <ResponsiveContainer width="100%" height={height}>
          <RechartsPieChart>
            {showTooltip && (
              <Tooltip content={<CustomTooltip formatValue={formatValue} />} />
            )}

            <Pie
              data={dataWithPercent}
              cx="50%"
              cy="50%"
              labelLine={false}
              label={
                showLabels
                  ? (props: unknown) =>
                      renderCustomLabel({ ...props as Record<string, unknown>, showPercentage } as Parameters<typeof renderCustomLabel>[0])
                  : false
              }
              outerRadius={outerRadius}
              innerRadius={innerRadius}
              fill="#8884d8"
              dataKey="value"
              onMouseEnter={onPieEnter}
              onMouseLeave={onPieLeave}
            >
              {dataWithPercent.map((entry, index) => (
                <Cell
                  key={`cell-${index}`}
                  fill={colors[index % colors.length]}
                  opacity={
                    hoverable && activeIndex !== null
                      ? activeIndex === index
                        ? 1
                        : 0.6
                      : 1
                  }
                  style={{ transition: 'opacity 0.3s' }}
                />
              ))}
            </Pie>

            {showLegend && (
              <Legend
                content={<CustomLegend formatValue={formatValue} />}
                verticalAlign="bottom"
              />
            )}
          </RechartsPieChart>
        </ResponsiveContainer>

        {/* Center Label for Doughnut */}
        {doughnut && (centerLabel || centerValue) && (
          <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 text-center pointer-events-none">
            {centerLabel && (
              <p className="text-xs text-gray-500 mb-1">{centerLabel}</p>
            )}
            {centerValue && (
              <p className="text-2xl font-bold text-gray-900">
                {formatValue && typeof centerValue === 'number'
                  ? formatValue(centerValue)
                  : centerValue}
              </p>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

// Export alias for Doughnut Chart
export const DoughnutChart: React.FC<PieChartProps> = (props) => (
  <PieChart {...props} doughnut={true} />
);
