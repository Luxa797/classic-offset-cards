// src/components/dashboard/RevenueChart.tsx
import React from 'react';
import { Line } from 'react-chartjs-2';
import { useTheme } from '@/lib/ThemeProvider';
import { Chart as ChartJS, CategoryScale, LinearScale, PointElement, LineElement, Title, Tooltip, Legend, Filler } from 'chart.js';
import { TrendingUp, Frown } from 'lucide-react'; // Empty state-க்கு ஐகான்

// Chart.js கூறுகளைப் பதிவு செய்யவும்
ChartJS.register(
  CategoryScale, LinearScale, PointElement, LineElement, Title, Tooltip, Legend, Filler
);

interface ChartDataPoint {
  date: string;
  // ✅ உங்கள் Dashboard.tsx-இல் இருந்து 'value' என்று வருவதால், இங்கும் 'value' என மாற்றவும்
  value: number; 
}

interface RevenueChartProps {
  data?: ChartDataPoint[]; // data optional ஆக இருக்கலாம்
}

const RevenueChart: React.FC<RevenueChartProps> = ({ data = [] }) => {
  const { theme } = useTheme();
  const isDarkMode = theme === 'dark';

  // ✅ தரவு இல்லை என்றால், ஒரு செய்தியைக் காட்டவும்
  if (!data || data.length === 0) {
    return (
      <div className="h-full flex flex-col items-center justify-center text-center text-gray-500 dark:text-gray-400 p-4">
        <Frown className="w-10 h-10 mb-2" />
        <p className="font-semibold">No Revenue Data</p>
        <p className="text-xs">There is no revenue data to display for the selected period.</p>
      </div>
    );
  }

  // Theme-க்கு ஏற்ப மாறும் வண்ணங்கள்
  const gridColor = isDarkMode ? 'rgba(255, 255, 255, 0.1)' : 'rgba(0, 0, 0, 0.05)';
  const textColor = isDarkMode ? '#cbd5e1' : '#4b5563';
  const primaryColor = '#8B5CF6'; // உங்கள் primary color

  const chartData = {
    labels: data.map(d => new Date(d.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })),
    datasets: [
      {
        label: 'Revenue',
        data: data.map(d => d.value), // ✅ 'value' என்று மாற்றப்பட்டுள்ளது
        borderColor: primaryColor,
        backgroundColor: (context: any) => {
          const ctx = context.chart.ctx;
          const gradient = ctx.createLinearGradient(0, 0, 0, 280);
          gradient.addColorStop(0, 'rgba(139, 92, 246, 0.4)');
          gradient.addColorStop(1, 'rgba(139, 92, 246, 0)');
          return gradient;
        },
        fill: true,
        tension: 0.4,
        pointBackgroundColor: primaryColor,
        pointBorderColor: '#fff',
        pointHoverBackgroundColor: '#fff',
        pointHoverBorderColor: primaryColor,
      },
    ],
  };

  const options = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: { display: false },
      tooltip: {
        enabled: true,
        backgroundColor: isDarkMode ? 'rgba(30, 41, 59, 0.8)' : 'rgba(255, 255, 255, 0.8)',
        backdropFilter: 'blur(5px)',
        titleColor: textColor,
        bodyColor: textColor,
        titleFont: { weight: 'bold' as const },
        bodyFont: { size: 12 },
        padding: 10,
        cornerRadius: 8,
        displayColors: false,
        callbacks: {
            label: (context: any) => `Revenue: ₹${context.raw.toLocaleString('en-IN')}`,
        },
      },
    },
    scales: {
      y: {
        beginAtZero: true,
        ticks: {
          color: textColor,
          callback: (value: string | number) => `₹${Number(value) / 1000}k`,
        },
        grid: { color: gridColor },
        border: { display: false }
      },
      x: {
        ticks: { color: textColor },
        grid: { display: false },
        border: { display: false }
      }
    },
    elements: { point: { radius: 0, hoverRadius: 6 } }
  };

  return <Line data={chartData} options={options as any} />;
};

export default RevenueChart;