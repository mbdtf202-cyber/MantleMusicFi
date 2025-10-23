'use client';

import React from 'react';
import { motion } from 'framer-motion';

interface DataPoint {
  label: string;
  value: number;
  color?: string;
}

interface BarChartProps {
  data: DataPoint[];
  width?: number;
  height?: number;
  showValues?: boolean;
  animate?: boolean;
  horizontal?: boolean;
}

const BarChart: React.FC<BarChartProps> = ({
  data,
  width = 400,
  height = 300,
  showValues = true,
  animate = true,
  horizontal = false
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

  const padding = 60;
  const chartWidth = width - padding * 2;
  const chartHeight = height - padding * 2;

  const maxValue = Math.max(...data.map(d => d.value));
  const barWidth = horizontal ? chartHeight / data.length : chartWidth / data.length;
  const barSpacing = barWidth * 0.2;
  const actualBarWidth = barWidth - barSpacing;

  const defaultColors = [
    '#3B82F6', '#8B5CF6', '#F59E0B', '#EF4444', '#10B981',
    '#F97316', '#EC4899', '#6366F1', '#84CC16', '#06B6D4'
  ];

  return (
    <div className="relative">
      <svg width={width} height={height} className="overflow-visible">
        <defs>
          {data.map((_, index) => {
            const color = data[index].color || defaultColors[index % defaultColors.length];
            return (
              <linearGradient key={index} id={`bar-gradient-${index}`} x1="0%" y1="0%" x2="0%" y2="100%">
                <stop offset="0%" stopColor={color} stopOpacity="0.8" />
                <stop offset="100%" stopColor={color} stopOpacity="0.4" />
              </linearGradient>
            );
          })}
        </defs>

        {/* Bars */}
        {data.map((item, index) => {
          const color = item.color || defaultColors[index % defaultColors.length];
          
          if (horizontal) {
            const barHeight = actualBarWidth;
            const barLength = (item.value / maxValue) * chartWidth;
            const y = padding + index * barWidth + barSpacing / 2;
            
            return (
              <g key={index}>
                <motion.rect
                  x={padding}
                  y={y}
                  width={barLength}
                  height={barHeight}
                  fill={`url(#bar-gradient-${index})`}
                  stroke={color}
                  strokeWidth="1"
                  rx="4"
                  initial={{ width: 0 }}
                  animate={{ width: animate ? barLength : barLength }}
                  transition={{ duration: 0.8, delay: animate ? index * 0.1 : 0 }}
                  className="hover:opacity-80 transition-opacity cursor-pointer"
                />
                
                {/* Value label */}
                {showValues && (
                  <motion.text
                    x={padding + barLength + 8}
                    y={y + barHeight / 2 + 4}
                    className="text-sm fill-gray-300"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: animate ? 1 : 1 }}
                    transition={{ duration: 0.3, delay: animate ? index * 0.1 + 0.5 : 0 }}
                  >
                    {item.value}
                  </motion.text>
                )}
                
                {/* Label */}
                <text
                  x={padding - 8}
                  y={y + barHeight / 2 + 4}
                  textAnchor="end"
                  className="text-sm fill-gray-400"
                >
                  {item.label}
                </text>
              </g>
            );
          } else {
            const barHeight = (item.value / maxValue) * chartHeight;
            const x = padding + index * barWidth + barSpacing / 2;
            const y = height - padding - barHeight;
            
            return (
              <g key={index}>
                <motion.rect
                  x={x}
                  y={y}
                  width={actualBarWidth}
                  height={barHeight}
                  fill={`url(#bar-gradient-${index})`}
                  stroke={color}
                  strokeWidth="1"
                  rx="4"
                  initial={{ height: 0, y: height - padding }}
                  animate={{ height: animate ? barHeight : barHeight, y: animate ? y : y }}
                  transition={{ duration: 0.8, delay: animate ? index * 0.1 : 0 }}
                  className="hover:opacity-80 transition-opacity cursor-pointer"
                />
                
                {/* Value label */}
                {showValues && (
                  <motion.text
                    x={x + actualBarWidth / 2}
                    y={y - 8}
                    textAnchor="middle"
                    className="text-sm fill-gray-300"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: animate ? 1 : 1 }}
                    transition={{ duration: 0.3, delay: animate ? index * 0.1 + 0.5 : 0 }}
                  >
                    {item.value}
                  </motion.text>
                )}
                
                {/* Label */}
                <text
                  x={x + actualBarWidth / 2}
                  y={height - padding + 20}
                  textAnchor="middle"
                  className="text-sm fill-gray-400"
                >
                  {item.label}
                </text>
              </g>
            );
          }
        })}

        {/* Grid lines */}
        {!horizontal && [0, 0.25, 0.5, 0.75, 1].map((ratio, index) => {
          const y = height - padding - ratio * chartHeight;
          const value = Math.round(maxValue * ratio);
          return (
            <g key={index}>
              <line
                x1={padding}
                y1={y}
                x2={width - padding}
                y2={y}
                stroke="rgba(156, 163, 175, 0.2)"
                strokeWidth="1"
              />
              <text
                x={padding - 8}
                y={y + 4}
                textAnchor="end"
                className="text-xs fill-gray-400"
              >
                {value}
              </text>
            </g>
          );
        })}

        {horizontal && [0, 0.25, 0.5, 0.75, 1].map((ratio, index) => {
          const x = padding + ratio * chartWidth;
          const value = Math.round(maxValue * ratio);
          return (
            <g key={index}>
              <line
                x1={x}
                y1={padding}
                x2={x}
                y2={height - padding}
                stroke="rgba(156, 163, 175, 0.2)"
                strokeWidth="1"
              />
              <text
                x={x}
                y={height - padding + 20}
                textAnchor="middle"
                className="text-xs fill-gray-400"
              >
                {value}
              </text>
            </g>
          );
        })}
      </svg>
    </div>
  );
};

export default BarChart;