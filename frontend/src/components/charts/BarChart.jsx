import React from 'react';
import ReactECharts from 'echarts-for-react';

const colorPalette = [
  '#1e3a5f',
  '#2d5a87',
  '#3b7ab5',
  '#5a9ad6',
  '#10b981',
  '#f97316',
  '#ef4444',
  '#8b5cf6',
  '#06b6d4',
  '#f59e0b',
];

const BarChart = ({
  data,
  xAxisData,
  legend = [],
  title = '',
  horizontal = false,
  showLabel = false,
  barWidth = 'auto',
  barRadius = [4, 4, 0, 0],
  height = 350,
  option = {},
  ...rest
}) => {
  const series = Array.isArray(data)
    ? data.map((item, index) => ({
        name: item.name || `系列${index + 1}`,
        type: 'bar',
        data: item.data,
        barWidth,
        barMaxWidth: barWidth !== 'auto' ? barWidth : undefined,
        itemStyle: {
          color: item.color || colorPalette[index % colorPalette.length],
          borderRadius: horizontal
            ? [barRadius[0], barRadius[0], barRadius[2], barRadius[2]]
            : barRadius,
        },
        label: showLabel
          ? {
              show: true,
              position: horizontal ? 'right' : 'top',
              color: '#374151',
              fontSize: 12,
              fontWeight: 500,
            }
          : undefined,
      }))
    : [];

  const chartOption = {
    title: title
      ? {
          text: title,
          textStyle: {
            fontSize: 16,
            fontWeight: 600,
            color: '#1f2937',
          },
          left: 'left',
          top: 0,
        }
      : undefined,
    tooltip: {
      trigger: 'axis',
      axisPointer: {
        type: 'shadow',
      },
      backgroundColor: 'rgba(255, 255, 255, 0.95)',
      borderColor: '#e5e7eb',
      borderWidth: 1,
      textStyle: {
        color: '#374151',
        fontSize: 13,
      },
      padding: [10, 14],
    },
    legend: legend.length
      ? {
          data: legend,
          top: title ? 30 : 0,
          right: 0,
          textStyle: {
            color: '#6b7280',
            fontSize: 12,
          },
          itemWidth: 14,
          itemHeight: 10,
          itemGap: 20,
        }
      : undefined,
    grid: {
      left: '3%',
      right: '4%',
      bottom: '3%',
      top: title ? (legend.length ? 70 : 40) : legend.length ? 40 : 20,
      containLabel: true,
    },
    xAxis: horizontal
      ? {
          type: 'value',
          axisLine: {
            show: false,
          },
          axisTick: {
            show: false,
          },
          axisLabel: {
            color: '#6b7280',
            fontSize: 12,
          },
          splitLine: {
            lineStyle: {
              color: '#f3f4f6',
              type: 'dashed',
            },
          },
        }
      : {
          type: 'category',
          data: xAxisData || [],
          axisLine: {
            lineStyle: {
              color: '#e5e7eb',
            },
          },
          axisTick: {
            show: false,
          },
          axisLabel: {
            color: '#6b7280',
            fontSize: 12,
          },
        },
    yAxis: horizontal
      ? {
          type: 'category',
          data: xAxisData || [],
          axisLine: {
            lineStyle: {
              color: '#e5e7eb',
            },
          },
          axisTick: {
            show: false,
          },
          axisLabel: {
            color: '#6b7280',
            fontSize: 12,
          },
        }
      : {
          type: 'value',
          axisLine: {
            show: false,
          },
          axisTick: {
            show: false,
          },
          axisLabel: {
            color: '#6b7280',
            fontSize: 12,
          },
          splitLine: {
            lineStyle: {
              color: '#f3f4f6',
              type: 'dashed',
            },
          },
        },
    series,
    ...option,
  };

  return (
    <ReactECharts
      option={chartOption}
      style={{ height, width: '100%' }}
      opts={{ renderer: 'canvas' }}
      {...rest}
    />
  );
};

export default BarChart;
