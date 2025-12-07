import React, { useEffect, useRef } from 'react';
import * as echarts from 'echarts';

interface PieChartProps {
  data: { name: string; value: number }[];
  title: string;
  showPercentage?: boolean;
  roseType?: boolean;
}

const PieChart: React.FC<PieChartProps> = ({ 
  data, 
  title, 
  showPercentage = true,
  roseType = false 
}) => {
  const chartRef = useRef<HTMLDivElement>(null);
  const chartInstance = useRef<echarts.ECharts | null>(null);

  // 简洁的颜色方案
  const colors = [
    '#0071e3', // 苹果蓝
    '#34c759', // 绿色
    '#5856d6', // 紫色
    '#ff9500', // 橙色
    '#ff3b30', // 红色
    '#8e8e93', // 灰色
    '#00c7be', // 青色
    '#af52de', // 品红
  ];

  useEffect(() => {
    if (!chartRef.current || data.length === 0) return;

    chartInstance.current = echarts.init(chartRef.current);

    const option: echarts.EChartsOption = {
      title: {
        text: title,
        left: 'center',
        top: 10,
        textStyle: {
          color: '#1d1d1f',
          fontWeight: 600,
          fontSize: 16,
          fontFamily: 'OpenAISans',
        },
      },
      tooltip: {
        trigger: 'item',
        backgroundColor: 'rgba(255, 255, 255, 0.95)',
        borderColor: '#e5e5e5',
        borderWidth: 1,
        textStyle: {
          color: '#1d1d1f',
          fontFamily: 'OpenAISans',
        },
        formatter: showPercentage 
          ? '{b}: {c} ({d}%)' 
          : '{b}: {c}',
      },
      legend: {
        bottom: '5%',
        left: 'center',
        textStyle: {
          fontFamily: 'OpenAISans',
          color: '#666',
        },
        itemGap: 20,
      },
      series: [
        {
          type: 'pie',
          radius: roseType ? ['20%', '70%'] : ['40%', '70%'],
          center: ['50%', '45%'],
          roseType: roseType ? 'radius' : undefined,
          avoidLabelOverlap: true,
          itemStyle: {
            borderRadius: 8,
            borderColor: '#fff',
            borderWidth: 2,
          },
          label: {
            show: true,
            formatter: showPercentage ? '{b}\n{d}%' : '{b}\n{c}',
            fontFamily: 'OpenAISans',
            color: '#666',
          },
          emphasis: {
            label: {
              show: true,
              fontSize: 14,
              fontWeight: 'bold',
              fontFamily: 'OpenAISans',
            },
            itemStyle: {
              shadowBlur: 10,
              shadowOffsetX: 0,
              shadowColor: 'rgba(0, 0, 0, 0.2)',
            },
          },
          labelLine: {
            show: true,
            lineStyle: {
              color: '#999',
            },
          },
          data: data.map((item, index) => ({
            ...item,
            itemStyle: {
              color: colors[index % colors.length],
            },
          })),
        },
      ],
    };

    chartInstance.current.setOption(option);

    const handleResize = () => {
      chartInstance.current?.resize();
    };
    window.addEventListener('resize', handleResize);

    return () => {
      window.removeEventListener('resize', handleResize);
      chartInstance.current?.dispose();
    };
  }, [data, title, showPercentage, roseType]);

  return <div ref={chartRef} className="w-full h-80"></div>;
};

export default PieChart;