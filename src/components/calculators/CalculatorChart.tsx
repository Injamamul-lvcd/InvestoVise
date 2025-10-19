'use client';

import React from 'react';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  ArcElement,
  Title,
  Tooltip,
  Legend,
  Filler
} from 'chart.js';
import { Line, Bar, Pie, Doughnut } from 'react-chartjs-2';
import { CalculatorChartData } from '@/types/calculators';

// Register Chart.js components
ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  ArcElement,
  Title,
  Tooltip,
  Legend,
  Filler
);

interface CalculatorChartProps {
  chartData: CalculatorChartData;
  className?: string;
}

const CalculatorChart: React.FC<CalculatorChartProps> = ({
  chartData,
  className = ''
}) => {
  const defaultOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        position: 'top' as const,
      },
      tooltip: {
        mode: 'index' as const,
        intersect: false,
        callbacks: {
          label: function(context: any) {
            let label = context.dataset.label || '';
            if (label) {
              label += ': ';
            }
            if (context.parsed.y !== null) {
              // Format as Indian currency
              label += new Intl.NumberFormat('en-IN', {
                style: 'currency',
                currency: 'INR',
                minimumFractionDigits: 0,
                maximumFractionDigits: 0
              }).format(context.parsed.y);
            }
            return label;
          }
        }
      },
    },
    scales: chartData.type === 'line' || chartData.type === 'bar' ? {
      x: {
        display: true,
        title: {
          display: true,
          text: 'Years'
        }
      },
      y: {
        display: true,
        title: {
          display: true,
          text: 'Amount (₹)'
        },
        ticks: {
          callback: function(value: any) {
            return new Intl.NumberFormat('en-IN', {
              style: 'currency',
              currency: 'INR',
              minimumFractionDigits: 0,
              maximumFractionDigits: 0,
              notation: 'compact'
            }).format(value);
          }
        }
      }
    } : undefined,
    ...chartData.options
  };

  const renderChart = () => {
    const props = {
      data: chartData.data,
      options: defaultOptions
    };

    switch (chartData.type) {
      case 'line':
        return <Line {...props} />;
      case 'bar':
        return <Bar {...props} />;
      case 'pie':
        return <Pie {...props} />;
      case 'doughnut':
        return <Doughnut {...props} />;
      default:
        return <Line {...props} />;
    }
  };

  return (
    <div className={`bg-white dark:bg-slate-800 p-4 rounded-lg border border-gray-200 dark:border-slate-700 transition-colors duration-200 ${className}`}>
      <div className="h-64 md:h-80">
        {renderChart()}
      </div>
    </div>
  );
};

export default CalculatorChart;