import React from 'react';
import {
  AreaChart as RechartsAreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  type TooltipProps,
} from 'recharts';

export interface AreaChartDataPoint {
  [key: string]: string | number;
}

export interface AreaConfig {
  dataKey: string;
  name: string;
  color?: string;
  strokeWidth?: number;
  stackId?: string;
  fillOpacity?: number;
}

interface AreaChartProps {
  data: AreaChartDataPoint[];
  areas: AreaConfig[];
  xAxisKey: string;
  height?: number;
  showGrid?: boolean;
  showLegend?: boolean;
  showTooltip?: boolean;
  curved?: boolean;
  stacked?: boolean;
  formatXAxis?: (value: string | number) => string;
  formatYAxis?: (value: number) => string;
  formatTooltip?: (value: number, name: string) => string;
  className?: string;
  loading?: boolean;
  emptyMessage?: string;
  title?: string;
  subtitle?: string;
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
      {payload.map((entry, index: number) => (
        <div key={index} className="flex items-center justify-between space-x-4 text-sm">
          <div className="flex items-center space-x-2">
            <div
              className="w-3 h-3 rounded-full"
              style={{ backgroundColor: entry.color }}
            />
            <span className="text-gray-600">{entry.name}:</span>
          </div>
          <span className="font-medium text-gray-900">
            {formatTooltip ? formatTooltip(entry.value, entry.name) : entry.value}
          </span>
        </div>
      ))}
    </div>
  );
};

export const AreaChart: React.FC<AreaChartProps> = ({
  data,
  areas,
  xAxisKey,
  height = 300,
  showGrid = true,
  showLegend = true,
  showTooltip = true,
  curved = true,
  stacked = false,
  formatXAxis,
  formatYAxis,
  formatTooltip,
  className = '',
  loading = false,
  emptyMessage = 'No data available',
  title,
  subtitle,
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
        <RechartsAreaChart
          data={data}
          margin={{ top: 5, right: 30, left: 20, bottom: 5 }}
        >
          {/* Gradient Definitions */}
          <defs>
            {areas.map((area, index) => {
              const color = area.color || defaultColors[index % defaultColors.length];
              return (
                <linearGradient
                  key={area.dataKey}
                  id={`gradient-${area.dataKey}`}
                  x1="0"
                  y1="0"
                  x2="0"
                  y2="1"
                >
                  <stop
                    offset="5%"
                    stopColor={color}
                    stopOpacity={area.fillOpacity || 0.8}
                  />
                  <stop
                    offset="95%"
                    stopColor={color}
                    stopOpacity={area.fillOpacity ? area.fillOpacity * 0.3 : 0.1}
                  />
                </linearGradient>
              );
            })}
          </defs>

          {showGrid && (
            <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
          )}

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

          {showTooltip && (
            <Tooltip
              content={<CustomTooltip formatTooltip={formatTooltip} />}
              cursor={{ stroke: '#e5e7eb', strokeWidth: 1 }}
            />
          )}

          {showLegend && (
            <Legend
              wrapperStyle={{ fontSize: '12px', paddingTop: '10px' }}
              iconType="rect"
            />
          )}

          {/* Areas */}
          {areas.map((area, index) => {
            const color = area.color || defaultColors[index % defaultColors.length];
            const stackId = stacked ? (area.stackId || 'stack') : undefined;

            return (
              <Area
                key={area.dataKey}
                type={curved ? 'monotone' : 'linear'}
                dataKey={area.dataKey}
                name={area.name}
                stroke={color}
                strokeWidth={area.strokeWidth || 2}
                fill={`url(#gradient-${area.dataKey})`}
                fillOpacity={1}
                stackId={stackId}
              />
            );
          })}
        </RechartsAreaChart>
      </ResponsiveContainer>
    </div>
  );
};
