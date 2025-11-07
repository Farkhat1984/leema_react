import React from 'react';
import {
  LineChart as RechartsLineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  type TooltipProps,
} from 'recharts';
import { TrendingUp, TrendingDown } from 'lucide-react';

export interface LineChartDataPoint {
  [key: string]: string | number;
}

export interface LineConfig {
  dataKey: string;
  name: string;
  color?: string;
  strokeWidth?: number;
  dot?: boolean;
}

interface LineChartProps {
  data: LineChartDataPoint[];
  lines: LineConfig[];
  xAxisKey: string;
  height?: number;
  showGrid?: boolean;
  showLegend?: boolean;
  showTooltip?: boolean;
  curved?: boolean;
  gradient?: boolean;
  formatXAxis?: (value: string | number) => string;
  formatYAxis?: (value: number) => string;
  formatTooltip?: (value: number, name: string) => string;
  className?: string;
  loading?: boolean;
  emptyMessage?: string;
  title?: string;
  subtitle?: string;
  showTrend?: boolean;
  trendDataKey?: string;
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
              className="w-3 h-3 rounded-full"
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

// Calculate trend
const calculateTrend = (data: LineChartDataPoint[], dataKey: string): number => {
  if (data.length < 2) return 0;

  const values = data.map((d) => Number(d[dataKey]) || 0);
  const firstHalf = values.slice(0, Math.floor(values.length / 2));
  const secondHalf = values.slice(Math.floor(values.length / 2));

  const firstAvg = firstHalf.reduce((a, b) => a + b, 0) / firstHalf.length;
  const secondAvg = secondHalf.reduce((a, b) => a + b, 0) / secondHalf.length;

  if (firstAvg === 0) return 0;
  return ((secondAvg - firstAvg) / firstAvg) * 100;
};

export const LineChart: React.FC<LineChartProps> = ({
  data,
  lines,
  xAxisKey,
  height = 300,
  showGrid = true,
  showLegend = true,
  showTooltip = true,
  curved = true,
  gradient = false,
  formatXAxis,
  formatYAxis,
  formatTooltip,
  className = '',
  loading = false,
  emptyMessage = 'Нет данных',
  title,
  subtitle,
  showTrend = false,
  trendDataKey,
}) => {
  const trend = showTrend && trendDataKey ? calculateTrend(data, trendDataKey) : 0;

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
      {(title || subtitle || showTrend) && (
        <div className="mb-4">
          <div className="flex items-start justify-between">
            <div>
              {title && <h3 className="text-lg font-semibold text-gray-900">{title}</h3>}
              {subtitle && <p className="text-sm text-gray-500 mt-1">{subtitle}</p>}
            </div>
            {showTrend && trendDataKey && (
              <div className="flex items-center space-x-1">
                {trend > 0 ? (
                  <TrendingUp className="w-5 h-5 text-green-500" />
                ) : (
                  <TrendingDown className="w-5 h-5 text-red-500" />
                )}
                <span
                  className={`text-sm font-medium ${
                    trend > 0 ? 'text-green-600' : 'text-red-600'
                  }`}
                >
                  {Math.abs(trend).toFixed(1)}%
                </span>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Chart */}
      <ResponsiveContainer width="100%" height={height}>
        <RechartsLineChart
          data={data}
          margin={{ top: 5, right: 30, left: 20, bottom: 5 }}
        >
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
              iconType="line"
            />
          )}

          {/* Gradient Definitions */}
          {gradient && (
            <defs>
              {lines.map((line, index) => {
                const color = line.color || defaultColors[index % defaultColors.length];
                return (
                  <linearGradient
                    key={line.dataKey}
                    id={`gradient-${line.dataKey}`}
                    x1="0"
                    y1="0"
                    x2="0"
                    y2="1"
                  >
                    <stop offset="5%" stopColor={color} stopOpacity={0.3} />
                    <stop offset="95%" stopColor={color} stopOpacity={0} />
                  </linearGradient>
                );
              })}
            </defs>
          )}

          {/* Lines */}
          {lines.map((line, index) => {
            const color = line.color || defaultColors[index % defaultColors.length];
            return (
              <Line
                key={line.dataKey}
                type={curved ? 'monotone' : 'linear'}
                dataKey={line.dataKey}
                name={line.name}
                stroke={color}
                strokeWidth={line.strokeWidth || 2}
                dot={line.dot !== undefined ? line.dot : true}
                activeDot={{ r: 6 }}
                fill={gradient ? `url(#gradient-${line.dataKey})` : 'none'}
              />
            );
          })}
        </RechartsLineChart>
      </ResponsiveContainer>
    </div>
  );
};
