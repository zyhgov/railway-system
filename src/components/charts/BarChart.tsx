import React, { useEffect, useRef } from 'react';
import * as echarts from 'echarts';

interface BarChartProps {
  data: { name: string; value: number }[];
  title: string;
  xAxisName?: string;
  yAxisName?: string;
  horizontal?: boolean;
}

const BarChart: React.FC<BarChartProps> = ({ 
  data, 
  title, 
  xAxisName = '', 
  yAxisName = '',
  horizontal = false 
}) => {
  const chartRef = useRef<HTMLDivElement>(null);
  const chartInstance = useRef<echarts.ECharts | null>(null);

  useEffect(() => {
    if (!chartRef.current || data.length === 0) return;

    chartInstance.current = echarts.init(chartRef.current);

    const categoryAxis = {
      type: 'category' as const,
      name: horizontal ? yAxisName : xAxisName,
      data: data.map((item) => item.name),
      axisLabel: {
        color: '#666',
        fontFamily: 'OpenAISans',
        rotate: !horizontal && data.length > 8 ? 45 : 0,
      },
      axisLine: {
        lineStyle: {
          color: '#e5e5e5',
        },
      },
      axisTick: {
        show: false,
      },
    };

    const valueAxis = {
      type: 'value' as const,
      name: horizontal ? xAxisName : yAxisName,
      nameTextStyle: {
        color: '#666',
        fontFamily: 'OpenAISans',
      },
      axisLabel: {
        color: '#666',
        fontFamily: 'OpenAISans',
      },
      axisLine: {
        show: false,
      },
      splitLine: {
        lineStyle: {
          color: '#f0f0f0',
          type: 'dashed' as const,
        },
      },
    };

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
        trigger: 'axis',
        backgroundColor: 'rgba(255, 255, 255, 0.95)',
        borderColor: '#e5e5e5',
        borderWidth: 1,
        textStyle: {
          color: '#1d1d1f',
          fontFamily: 'OpenAISans',
        },
        axisPointer: {
          type: 'shadow',
        },
      },
      grid: {
        left: '3%',
        right: '4%',
        bottom: '10%',
        top: '18%',
        containLabel: true,
      },
      xAxis: horizontal ? valueAxis : categoryAxis,
      yAxis: horizontal ? categoryAxis : valueAxis,
      series: [
        {
          data: data.map((item) => item.value),
          type: 'bar',
          barWidth: '50%',
          itemStyle: {
            color: new echarts.graphic.LinearGradient(
              horizontal ? 0 : 0, 
              horizontal ? 0 : 0, 
              horizontal ? 1 : 0, 
              horizontal ? 0 : 1, 
              [
                { offset: 0, color: '#0071e3' },
                { offset: 1, color: '#40a0ff' },
              ]
            ),
            borderRadius: horizontal ? [0, 4, 4, 0] : [4, 4, 0, 0],
          },
          emphasis: {
            itemStyle: {
              color: new echarts.graphic.LinearGradient(
                horizontal ? 0 : 0, 
                horizontal ? 0 : 0, 
                horizontal ? 1 : 0, 
                horizontal ? 0 : 1, 
                [
                  { offset: 0, color: '#005bb5' },
                  { offset: 1, color: '#0071e3' },
                ]
              ),
            },
          },
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
  }, [data, title, xAxisName, yAxisName, horizontal]);

  return <div ref={chartRef} className="w-full h-80"></div>;
};

export default BarChart;