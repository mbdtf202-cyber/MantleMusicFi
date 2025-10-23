'use client';

import React, { useState, useEffect, useRef } from 'react';
import { motion } from 'framer-motion';
import { 
  TrendingUp, 
  TrendingDown, 
  BarChart3, 
  LineChart as LineChartIcon,
  PieChart as PieChartIcon,
  Activity,
  Maximize2,
  Download,
  Settings
} from 'lucide-react';

interface ChartDataPoint {
  x: string | number;
  y: number;
  label?: string;
  color?: string;
  metadata?: any;
}

interface ChartProps {
  data: ChartDataPoint[];
  type: 'line' | 'bar' | 'area' | 'candlestick' | 'heatmap';
  title?: string;
  subtitle?: string;
  height?: number;
  color?: string;
  gradient?: boolean;
  showGrid?: boolean;
  showTooltip?: boolean;
  showLegend?: boolean;
  interactive?: boolean;
  timeRange?: string;
  onDataPointClick?: (point: ChartDataPoint) => void;
  className?: string;
}

const AdvancedChart: React.FC<ChartProps> = ({
  data,
  type,
  title,
  subtitle,
  height = 300,
  color = '#00D4AA',
  gradient = true,
  showGrid = true,
  showTooltip = true,
  showLegend = false,
  interactive = true,
  timeRange,
  onDataPointClick,
  className = ''
}) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [hoveredPoint, setHoveredPoint] = useState<ChartDataPoint | null>(null);
  const [mousePosition, setMousePosition] = useState({ x: 0, y: 0 });
  const [isFullscreen, setIsFullscreen] = useState(false);

  useEffect(() => {
    drawChart();
  }, [data, type, height, color, gradient, showGrid]);

  const drawChart = () => {
    const canvas = canvasRef.current;
    if (!canvas || !data.length) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const rect = canvas.getBoundingClientRect();
    const dpr = window.devicePixelRatio || 1;
    
    canvas.width = rect.width * dpr;
    canvas.height = rect.height * dpr;
    ctx.scale(dpr, dpr);

    const padding = 40;
    const chartWidth = rect.width - padding * 2;
    const chartHeight = rect.height - padding * 2;

    // Clear canvas
    ctx.clearRect(0, 0, rect.width, rect.height);

    // Find data bounds
    const yValues = data.map(d => d.y);
    const minY = Math.min(...yValues);
    const maxY = Math.max(...yValues);
    const yRange = maxY - minY || 1;

    // Draw grid
    if (showGrid) {
      ctx.strokeStyle = 'rgba(255, 255, 255, 0.1)';
      ctx.lineWidth = 1;

      // Horizontal grid lines
      for (let i = 0; i <= 5; i++) {
        const y = padding + (chartHeight / 5) * i;
        ctx.beginPath();
        ctx.moveTo(padding, y);
        ctx.lineTo(padding + chartWidth, y);
        ctx.stroke();
      }

      // Vertical grid lines
      for (let i = 0; i <= 10; i++) {
        const x = padding + (chartWidth / 10) * i;
        ctx.beginPath();
        ctx.moveTo(x, padding);
        ctx.lineTo(x, padding + chartHeight);
        ctx.stroke();
      }
    }

    // Draw chart based on type
    switch (type) {
      case 'line':
        drawLineChart(ctx, data, padding, chartWidth, chartHeight, minY, yRange, color, gradient);
        break;
      case 'bar':
        drawBarChart(ctx, data, padding, chartWidth, chartHeight, minY, yRange, color);
        break;
      case 'area':
        drawAreaChart(ctx, data, padding, chartWidth, chartHeight, minY, yRange, color, gradient);
        break;
      case 'candlestick':
        drawCandlestickChart(ctx, data, padding, chartWidth, chartHeight, minY, yRange);
        break;
      case 'heatmap':
        drawHeatmapChart(ctx, data, padding, chartWidth, chartHeight);
        break;
    }

    // Draw axes labels
    drawAxes(ctx, data, padding, chartWidth, chartHeight, minY, maxY);
  };

  const drawLineChart = (
    ctx: CanvasRenderingContext2D,
    data: ChartDataPoint[],
    padding: number,
    width: number,
    height: number,
    minY: number,
    yRange: number,
    color: string,
    gradient: boolean
  ) => {
    if (data.length < 2) return;

    const stepX = width / (data.length - 1);

    // Create gradient if enabled
    let strokeStyle = color;
    if (gradient) {
      const grad = ctx.createLinearGradient(0, padding, 0, padding + height);
      grad.addColorStop(0, color);
      grad.addColorStop(1, color + '40');
      strokeStyle = grad;
    }

    ctx.strokeStyle = strokeStyle;
    ctx.lineWidth = 3;
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';

    ctx.beginPath();
    data.forEach((point, index) => {
      const x = padding + index * stepX;
      const y = padding + height - ((point.y - minY) / yRange) * height;
      
      if (index === 0) {
        ctx.moveTo(x, y);
      } else {
        ctx.lineTo(x, y);
      }
    });
    ctx.stroke();

    // Draw data points
    data.forEach((point, index) => {
      const x = padding + index * stepX;
      const y = padding + height - ((point.y - minY) / yRange) * height;
      
      ctx.fillStyle = color;
      ctx.beginPath();
      ctx.arc(x, y, 4, 0, Math.PI * 2);
      ctx.fill();
    });
  };

  const drawBarChart = (
    ctx: CanvasRenderingContext2D,
    data: ChartDataPoint[],
    padding: number,
    width: number,
    height: number,
    minY: number,
    yRange: number,
    color: string
  ) => {
    const barWidth = width / data.length * 0.8;
    const barSpacing = width / data.length * 0.2;

    data.forEach((point, index) => {
      const x = padding + index * (barWidth + barSpacing) + barSpacing / 2;
      const barHeight = ((point.y - minY) / yRange) * height;
      const y = padding + height - barHeight;

      // Create gradient for bars
      const gradient = ctx.createLinearGradient(0, y, 0, y + barHeight);
      gradient.addColorStop(0, color);
      gradient.addColorStop(1, color + '60');

      ctx.fillStyle = gradient;
      ctx.fillRect(x, y, barWidth, barHeight);

      // Add border
      ctx.strokeStyle = color;
      ctx.lineWidth = 1;
      ctx.strokeRect(x, y, barWidth, barHeight);
    });
  };

  const drawAreaChart = (
    ctx: CanvasRenderingContext2D,
    data: ChartDataPoint[],
    padding: number,
    width: number,
    height: number,
    minY: number,
    yRange: number,
    color: string,
    gradient: boolean
  ) => {
    if (data.length < 2) return;

    const stepX = width / (data.length - 1);

    // Create area gradient
    const areaGradient = ctx.createLinearGradient(0, padding, 0, padding + height);
    areaGradient.addColorStop(0, color + '40');
    areaGradient.addColorStop(1, color + '10');

    // Draw area
    ctx.fillStyle = areaGradient;
    ctx.beginPath();
    
    // Start from bottom left
    ctx.moveTo(padding, padding + height);
    
    // Draw line to first point
    const firstY = padding + height - ((data[0].y - minY) / yRange) * height;
    ctx.lineTo(padding, firstY);
    
    // Draw through all points
    data.forEach((point, index) => {
      const x = padding + index * stepX;
      const y = padding + height - ((point.y - minY) / yRange) * height;
      ctx.lineTo(x, y);
    });
    
    // Close area at bottom right
    ctx.lineTo(padding + width, padding + height);
    ctx.closePath();
    ctx.fill();

    // Draw line on top
    drawLineChart(ctx, data, padding, width, height, minY, yRange, color, false);
  };

  const drawCandlestickChart = (
    ctx: CanvasRenderingContext2D,
    data: ChartDataPoint[],
    padding: number,
    width: number,
    height: number,
    minY: number,
    yRange: number
  ) => {
    const candleWidth = width / data.length * 0.6;
    const candleSpacing = width / data.length * 0.4;

    data.forEach((point, index) => {
      const x = padding + index * (candleWidth + candleSpacing) + candleSpacing / 2;
      const metadata = point.metadata || {};
      const { open = point.y, high = point.y, low = point.y, close = point.y } = metadata;

      const openY = padding + height - ((open - minY) / yRange) * height;
      const highY = padding + height - ((high - minY) / yRange) * height;
      const lowY = padding + height - ((low - minY) / yRange) * height;
      const closeY = padding + height - ((close - minY) / yRange) * height;

      const isGreen = close >= open;
      const bodyColor = isGreen ? '#00D4AA' : '#FF6B6B';
      const wickColor = '#888888';

      // Draw wick
      ctx.strokeStyle = wickColor;
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.moveTo(x + candleWidth / 2, highY);
      ctx.lineTo(x + candleWidth / 2, lowY);
      ctx.stroke();

      // Draw body
      ctx.fillStyle = bodyColor;
      const bodyTop = Math.min(openY, closeY);
      const bodyHeight = Math.abs(closeY - openY) || 1;
      ctx.fillRect(x, bodyTop, candleWidth, bodyHeight);
    });
  };

  const drawHeatmapChart = (
    ctx: CanvasRenderingContext2D,
    data: ChartDataPoint[],
    padding: number,
    width: number,
    height: number
  ) => {
    const cols = Math.ceil(Math.sqrt(data.length));
    const rows = Math.ceil(data.length / cols);
    const cellWidth = width / cols;
    const cellHeight = height / rows;

    const values = data.map(d => d.y);
    const minVal = Math.min(...values);
    const maxVal = Math.max(...values);
    const range = maxVal - minVal || 1;

    data.forEach((point, index) => {
      const col = index % cols;
      const row = Math.floor(index / cols);
      const x = padding + col * cellWidth;
      const y = padding + row * cellHeight;

      const intensity = (point.y - minVal) / range;
      const hue = 240 - intensity * 240; // Blue to red
      ctx.fillStyle = `hsl(${hue}, 70%, 50%)`;
      ctx.fillRect(x, y, cellWidth - 1, cellHeight - 1);
    });
  };

  const drawAxes = (
    ctx: CanvasRenderingContext2D,
    data: ChartDataPoint[],
    padding: number,
    width: number,
    height: number,
    minY: number,
    maxY: number
  ) => {
    ctx.fillStyle = 'rgba(255, 255, 255, 0.7)';
    ctx.font = '12px Inter, sans-serif';

    // Y-axis labels
    for (let i = 0; i <= 5; i++) {
      const value = minY + (maxY - minY) * (1 - i / 5);
      const y = padding + (height / 5) * i;
      ctx.textAlign = 'right';
      ctx.fillText(value.toFixed(2), padding - 10, y + 4);
    }

    // X-axis labels (show every few points to avoid crowding)
    const labelStep = Math.max(1, Math.floor(data.length / 8));
    data.forEach((point, index) => {
      if (index % labelStep === 0) {
        const x = padding + (index / (data.length - 1)) * width;
        ctx.textAlign = 'center';
        ctx.fillText(String(point.x), x, padding + height + 20);
      }
    });
  };

  const handleMouseMove = (event: React.MouseEvent<HTMLCanvasElement>) => {
    if (!interactive || !data.length) return;

    const canvas = canvasRef.current;
    if (!canvas) return;

    const rect = canvas.getBoundingClientRect();
    const x = event.clientX - rect.left;
    const y = event.clientY - rect.top;

    setMousePosition({ x: event.clientX, y: event.clientY });

    // Find closest data point
    const padding = 40;
    const chartWidth = rect.width - padding * 2;
    const stepX = chartWidth / (data.length - 1);
    
    const dataIndex = Math.round((x - padding) / stepX);
    if (dataIndex >= 0 && dataIndex < data.length) {
      setHoveredPoint(data[dataIndex]);
    } else {
      setHoveredPoint(null);
    }
  };

  const handleMouseLeave = () => {
    setHoveredPoint(null);
  };

  const handleClick = (event: React.MouseEvent<HTMLCanvasElement>) => {
    if (hoveredPoint && onDataPointClick) {
      onDataPointClick(hoveredPoint);
    }
  };

  const exportChart = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const link = document.createElement('a');
    link.download = `chart-${Date.now()}.png`;
    link.href = canvas.toDataURL();
    link.click();
  };

  return (
    <div className={`relative ${className}`}>
      {/* Chart Header */}
      {(title || subtitle) && (
        <div className="mb-4">
          {title && <h3 className="text-lg font-semibold text-white">{title}</h3>}
          {subtitle && <p className="text-sm text-gray-400">{subtitle}</p>}
        </div>
      )}

      {/* Chart Controls */}
      <div className="absolute top-0 right-0 flex space-x-2 z-10">
        <button
          onClick={exportChart}
          className="p-2 rounded-lg bg-gray-800/80 hover:bg-gray-700/80 transition-colors"
          title="Export Chart"
        >
          <Download className="w-4 h-4 text-gray-400" />
        </button>
        <button
          onClick={() => setIsFullscreen(!isFullscreen)}
          className="p-2 rounded-lg bg-gray-800/80 hover:bg-gray-700/80 transition-colors"
          title="Fullscreen"
        >
          <Maximize2 className="w-4 h-4 text-gray-400" />
        </button>
      </div>

      {/* Chart Canvas */}
      <div className="relative">
        <canvas
          ref={canvasRef}
          width={800}
          height={height}
          className="w-full cursor-crosshair"
          style={{ height: `${height}px` }}
          onMouseMove={handleMouseMove}
          onMouseLeave={handleMouseLeave}
          onClick={handleClick}
        />

        {/* Tooltip */}
        {showTooltip && hoveredPoint && (
          <motion.div
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            className="absolute z-20 bg-gray-900 border border-gray-700 rounded-lg p-3 pointer-events-none"
            style={{
              left: mousePosition.x - 100,
              top: mousePosition.y - 80,
            }}
          >
            <div className="text-sm">
              <div className="text-gray-400">Value</div>
              <div className="text-white font-semibold">{hoveredPoint.y.toFixed(4)}</div>
              {hoveredPoint.label && (
                <>
                  <div className="text-gray-400 mt-1">Label</div>
                  <div className="text-white">{hoveredPoint.label}</div>
                </>
              )}
            </div>
          </motion.div>
        )}
      </div>

      {/* Chart Statistics */}
      <div className="mt-4 grid grid-cols-3 gap-4 text-center">
        <div>
          <div className="text-sm text-gray-400">Min</div>
          <div className="text-white font-semibold">
            {Math.min(...data.map(d => d.y)).toFixed(4)}
          </div>
        </div>
        <div>
          <div className="text-sm text-gray-400">Max</div>
          <div className="text-white font-semibold">
            {Math.max(...data.map(d => d.y)).toFixed(4)}
          </div>
        </div>
        <div>
          <div className="text-sm text-gray-400">Avg</div>
          <div className="text-white font-semibold">
            {(data.reduce((sum, d) => sum + d.y, 0) / data.length).toFixed(4)}
          </div>
        </div>
      </div>
    </div>
  );
};

export default AdvancedChart;