'use client';

import React from 'react';
import { motion } from 'framer-motion';

interface DataPoint {
  x: string | number;
  y: number;
}

interface LineChartProps {
  data: DataPoint[];
  width?: number;
  height?: number;
  color?: string;
  gradient?: boolean;
  showGrid?: boolean;
  showDots?: boolean;
  animate?: boolean;
}

const LineChart: React.FC<LineChartProps> = ({
  data,
  width = 400,
  height = 200,
  color = '#3B82F6',
  gradient = true,
  showGrid = true,
  showDots = true,
  animate = true
}) => {
  if (!data || data.length === 0) {
    return (
      <div 
        className="flex items-center justify-center bg-gray-800/30 rounded-lg"
        style={{ width, height }}
      >
        <span className="text-gray-400">No data available</span>
      </div>
    );
  }

  const padding = 40;
  const chartWidth = width - padding * 2;
  const chartHeight = height - padding * 2;

  const minY = Math.min(...data.map(d => d.y));
  const maxY = Math.max(...data.map(d => d.y));
  const yRange = maxY - minY || 1;

  const points = data.map((point, index) => {
    const x = padding + (index / (data.length - 1)) * chartWidth;
    const y = padding + chartHeight - ((point.y - minY) / yRange) * chartHeight;
    return { x, y, value: point.y, label: point.x };
  });

  const pathData = points.reduce((path, point, index) => {
    const command = index === 0 ? 'M' : 'L';
    return `${path} ${command} ${point.x} ${point.y}`;
  }, '');

  const areaPath = `${pathData} L ${points[points.length - 1].x} ${height - padding} L ${padding} ${height - padding} Z`;

  const gridLines = [];
  if (showGrid) {
    // Horizontal grid lines
    for (let i = 0; i <= 4; i++) {
      const y = padding + (i / 4) * chartHeight;
      gridLines.push(
        <line
          key={`h-${i}`}
          x1={padding}
          y1={y}
          x2={width - padding}
          y2={y}
          stroke="rgba(156, 163, 175, 0.2)"
          strokeWidth="1"
        />
      );
    }

    // Vertical grid lines
    for (let i = 0; i <= 4; i++) {
      const x = padding + (i / 4) * chartWidth;
      gridLines.push(
        <line
          key={`v-${i}`}
          x1={x}
          y1={padding}
          x2={x}
          y2={height - padding}
          stroke="rgba(156, 163, 175, 0.2)"
          strokeWidth="1"
        />
      );
    }
  }

  return (
    <div className="relative">
      <svg width={width} height={height} className="overflow-visible">
        <defs>
          <linearGradient id={`gradient-${color}`} x1="0%" y1="0%" x2="0%" y2="100%">
            <stop offset="0%" stopColor={color} stopOpacity="0.3" />
            <stop offset="100%" stopColor={color} stopOpacity="0.05" />
          </linearGradient>
        </defs>

        {/* Grid */}
        {gridLines}

        {/* Area fill */}
        {gradient && (
          <motion.path
            d={areaPath}
            fill={`url(#gradient-${color})`}
            initial={{ opacity: 0 }}
            animate={{ opacity: animate ? 1 : 1 }}
            transition={{ duration: 0.8, delay: 0.2 }}
          />
        )}

        {/* Line */}
        <motion.path
          d={pathData}
          fill="none"
          stroke={color}
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
          initial={{ pathLength: 0 }}
          animate={{ pathLength: animate ? 1 : 1 }}
          transition={{ duration: 1.5, ease: "easeInOut" }}
        />

        {/* Data points */}
        {showDots && points.map((point, index) => (
          <motion.circle
            key={index}
            cx={point.x}
            cy={point.y}
            r="4"
            fill={color}
            stroke="white"
            strokeWidth="2"
            initial={{ scale: 0 }}
            animate={{ scale: animate ? 1 : 1 }}
            transition={{ duration: 0.3, delay: animate ? 0.1 * index : 0 }}
            className="cursor-pointer hover:r-6 transition-all"
          />
        ))}

        {/* Y-axis labels */}
        {[0, 1, 2, 3, 4].map((i) => {
          const value = minY + (i / 4) * yRange;
          const y = height - padding - (i / 4) * chartHeight;
          return (
            <text
              key={i}
              x={padding - 10}
              y={y + 4}
              textAnchor="end"
              className="text-xs fill-gray-400"
            >
              {value.toFixed(0)}
            </text>
          );
        })}

        {/* X-axis labels */}
        {points.map((point, index) => {
          if (index % Math.ceil(points.length / 5) === 0) {
            return (
              <text
                key={index}
                x={point.x}
                y={height - padding + 20}
                textAnchor="middle"
                className="text-xs fill-gray-400"
              >
                {point.label}
              </text>
            );
          }
          return null;
        })}
      </svg>
    </div>
  );
};

export default LineChart;