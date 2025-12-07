import React, { useEffect, useRef } from 'react';
import * as echarts from 'echarts';

interface LineChartProps {
  data: { name: string; value: number }[];
  title: string;
  xAxisName?: string;
  yAxisName?: string;
}

const LineChart: React.FC<LineChartProps> = ({ data, title, xAxisName = '', yAxisName = '' }) => {
  const chartRef = useRef<HTMLDivElement>(null);
  const chartInstance = useRef<echarts.ECharts | null>(null);

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
        trigger: 'axis',
        backgroundColor: 'rgba(255, 255, 255, 0.95)',
        borderColor: '#e5e5e5',
        borderWidth: 1,
        textStyle: {
          color: '#1d1d1f',
          fontFamily: 'OpenAISans',
        },
        axisPointer: {
          type: 'cross',
          crossStyle: {
            color: '#999',
          },
        },
      },
      grid: {
        left: '3%',
        right: '4%',
        bottom: '10%',
        top: '18%',
        containLabel: true,
      },
      xAxis: {
        type: 'category',
        name: xAxisName,
        data: data.map((item) => item.name),
        axisLabel: {
          color: '#666',
          fontFamily: 'OpenAISans',
          rotate: data.length > 8 ? 45 : 0,
        },
        axisLine: {
          lineStyle: {
            color: '#e5e5e5',
          },
        },
        axisTick: {
          show: false,
        },
      },
      yAxis: {
        type: 'value',
        name: yAxisName,
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
            type: 'dashed',
          },
        },
      },
      series: [
        {
          data: data.map((item) => item.value),
          type: 'line',
          smooth: true,
          symbol: 'circle',
          symbolSize: 8,
          lineStyle: {
            color: '#0071e3',
            width: 3,
          },
          itemStyle: {
            color: '#0071e3',
            borderColor: '#fff',
            borderWidth: 2,
          },
          areaStyle: {
            color: new echarts.graphic.LinearGradient(0, 0, 0, 1, [
              { offset: 0, color: 'rgba(0, 113, 227, 0.3)' },
              { offset: 1, color: 'rgba(0, 113, 227, 0.05)' },
            ]),
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
  }, [data, title, xAxisName, yAxisName]);

  return <div ref={chartRef} className="w-full h-80"></div>;
};

export default LineChart;