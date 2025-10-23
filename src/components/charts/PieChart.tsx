'use client';

import React from 'react';
import { motion } from 'framer-motion';

interface DataPoint {
  label: string;
  value: number;
  color?: string;
}

interface PieChartProps {
  data: DataPoint[];
  size?: number;
  showLabels?: boolean;
  showLegend?: boolean;
  animate?: boolean;
  donut?: boolean;
  donutWidth?: number;
}

const PieChart: React.FC<PieChartProps> = ({
  data,
  size = 300,
  showLabels = true,
  showLegend = true,
  animate = true,
  donut = false,
  donutWidth = 60
}) => {
  if (!data || data.length === 0) {
    return (
      <div 
        className="flex items-center justify-center bg-gray-800/30 rounded-lg"
        style={{ width: size, height: size }}
      >
        <span className="text-gray-400">No data available</span>
      </div>
    );
  }

  const defaultColors = [
    '#3B82F6', '#8B5CF6', '#F59E0B', '#EF4444', '#10B981',
    '#F97316', '#EC4899', '#6366F1', '#84CC16', '#06B6D4'
  ];

  const total = data.reduce((sum, item) => sum + item.value, 0);
  const center = size / 2;
  const radius = size / 2 - 20;
  const innerRadius = donut ? radius - donutWidth : 0;

  let currentAngle = -90; // Start from top

  const slices = data.map((item, index) => {
    const percentage = (item.value / total) * 100;
    const angle = (item.value / total) * 360;
    const startAngle = currentAngle;
    const endAngle = currentAngle + angle;
    
    const startAngleRad = (startAngle * Math.PI) / 180;
    const endAngleRad = (endAngle * Math.PI) / 180;
    
    const x1 = center + radius * Math.cos(startAngleRad);
    const y1 = center + radius * Math.sin(startAngleRad);
    const x2 = center + radius * Math.cos(endAngleRad);
    const y2 = center + radius * Math.sin(endAngleRad);
    
    const largeArcFlag = angle > 180 ? 1 : 0;
    
    let pathData;
    if (donut) {
      const innerX1 = center + innerRadius * Math.cos(startAngleRad);
      const innerY1 = center + innerRadius * Math.sin(startAngleRad);
      const innerX2 = center + innerRadius * Math.cos(endAngleRad);
      const innerY2 = center + innerRadius * Math.sin(endAngleRad);
      
      pathData = [
        `M ${x1} ${y1}`,
        `A ${radius} ${radius} 0 ${largeArcFlag} 1 ${x2} ${y2}`,
        `L ${innerX2} ${innerY2}`,
        `A ${innerRadius} ${innerRadius} 0 ${largeArcFlag} 0 ${innerX1} ${innerY1}`,
        'Z'
      ].join(' ');
    } else {
      pathData = [
        `M ${center} ${center}`,
        `L ${x1} ${y1}`,
        `A ${radius} ${radius} 0 ${largeArcFlag} 1 ${x2} ${y2}`,
        'Z'
      ].join(' ');
    }
    
    // Label position
    const labelAngle = (startAngle + endAngle) / 2;
    const labelAngleRad = (labelAngle * Math.PI) / 180;
    const labelRadius = donut ? (radius + innerRadius) / 2 : radius * 0.7;
    const labelX = center + labelRadius * Math.cos(labelAngleRad);
    const labelY = center + labelRadius * Math.sin(labelAngleRad);
    
    currentAngle += angle;
    
    return {
      pathData,
      color: item.color || defaultColors[index % defaultColors.length],
      label: item.label,
      value: item.value,
      percentage,
      labelX,
      labelY,
      index
    };
  });

  return (
    <div className="flex items-center gap-8">
      <div className="relative">
        <svg width={size} height={size} className="overflow-visible">
          <defs>
            {slices.map((slice, index) => (
              <linearGradient key={index} id={`pie-gradient-${index}`} x1="0%" y1="0%" x2="100%" y2="100%">
                <stop offset="0%" stopColor={slice.color} stopOpacity="0.8" />
                <stop offset="100%" stopColor={slice.color} stopOpacity="0.6" />
              </linearGradient>
            ))}
          </defs>

          {slices.map((slice, index) => (
            <motion.path
              key={index}
              d={slice.pathData}
              fill={`url(#pie-gradient-${index})`}
              stroke="rgba(255, 255, 255, 0.1)"
              strokeWidth="2"
              initial={{ opacity: 0, scale: 0 }}
              animate={{ opacity: 1, scale: animate ? 1 : 1 }}
              transition={{ 
                duration: 0.6, 
                delay: animate ? index * 0.1 : 0,
                type: "spring",
                stiffness: 100
              }}
              className="hover:opacity-80 transition-opacity cursor-pointer"
              style={{ transformOrigin: `${center}px ${center}px` }}
            />
          ))}

          {/* Labels */}
          {showLabels && slices.map((slice, index) => (
            slice.percentage > 5 && (
              <motion.text
                key={`label-${index}`}
                x={slice.labelX}
                y={slice.labelY}
                textAnchor="middle"
                dominantBaseline="middle"
                className="text-sm font-medium fill-white"
                initial={{ opacity: 0 }}
                animate={{ opacity: animate ? 1 : 1 }}
                transition={{ duration: 0.3, delay: animate ? index * 0.1 + 0.5 : 0 }}
              >
                {slice.percentage.toFixed(1)}%
              </motion.text>
            )
          ))}

          {/* Center text for donut chart */}
          {donut && (
            <motion.g
              initial={{ opacity: 0, scale: 0 }}
              animate={{ opacity: 1, scale: animate ? 1 : 1 }}
              transition={{ duration: 0.5, delay: animate ? 0.8 : 0 }}
            >
              <text
                x={center}
                y={center - 10}
                textAnchor="middle"
                dominantBaseline="middle"
                className="text-2xl font-bold fill-white"
              >
                {total}
              </text>
              <text
                x={center}
                y={center + 15}
                textAnchor="middle"
                dominantBaseline="middle"
                className="text-sm fill-gray-400"
              >
                Total
              </text>
            </motion.g>
          )}
        </svg>
      </div>

      {/* Legend */}
      {showLegend && (
        <motion.div 
          className="space-y-3"
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.5, delay: animate ? 0.5 : 0 }}
        >
          {slices.map((slice, index) => (
            <motion.div
              key={index}
              className="flex items-center gap-3"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.3, delay: animate ? index * 0.1 + 0.7 : 0 }}
            >
              <div
                className="w-4 h-4 rounded-full"
                style={{ backgroundColor: slice.color }}
              />
              <div className="flex-1">
                <div className="text-sm font-medium text-white">
                  {slice.label}
                </div>
                <div className="text-xs text-gray-400">
                  {slice.value} ({slice.percentage.toFixed(1)}%)
                </div>
              </div>
            </motion.div>
          ))}
        </motion.div>
      )}
    </div>
  );
};

export default PieChart;