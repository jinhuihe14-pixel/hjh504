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

const LineChart = ({
  data,
  xAxisData,
  legend = [],
  title = '',
  smooth = true,
  areaStyle = false,
  showDataZoom = false,
  height = 350,
  option = {},
  ...rest
}) => {
  const series = Array.isArray(data)
    ? data.map((item, index) => ({
        name: item.name || `系列${index + 1}`,
        type: 'line',
        data: item.data,
        smooth,
        symbol: 'circle',
        symbolSize: 6,
        lineStyle: {
          width: 2,
          color: item.color || colorPalette[index % colorPalette.length],
        },
        itemStyle: {
          color: item.color || colorPalette[index % colorPalette.length],
        },
        areaStyle: areaStyle
          ? {
              color: {
                type: 'linear',
                x: 0,
                y: 0,
                x2: 0,
                y2: 1,
                colorStops: [
                  {
                    offset: 0,
                    color: (item.color || colorPalette[index % colorPalette.length]) + '40',
                  },
                  {
                    offset: 1,
                    color: (item.color || colorPalette[index % colorPalette.length]) + '05',
                  },
                ],
              },
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
      backgroundColor: 'rgba(255, 255, 255, 0.95)',
      borderColor: '#e5e7eb',
      borderWidth: 1,
      textStyle: {
        color: '#374151',
        fontSize: 13,
      },
      padding: [10, 14],
      axisPointer: {
        type: 'line',
        lineStyle: {
          color: '#9ca3af',
          type: 'dashed',
        },
      },
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
          itemHeight: 7,
          itemGap: 20,
        }
      : undefined,
    grid: {
      left: '3%',
      right: '4%',
      bottom: showDataZoom ? 60 : '3%',
      top: title ? (legend.length ? 70 : 40) : legend.length ? 40 : 20,
      containLabel: true,
    },
    xAxis: {
      type: 'category',
      boundaryGap: false,
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
    yAxis: {
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
    dataZoom: showDataZoom
      ? [
          {
            type: 'slider',
            height: 20,
            bottom: 10,
            borderColor: 'transparent',
            backgroundColor: '#f3f4f6',
            fillerColor: 'rgba(59, 122, 181, 0.2)',
            handleStyle: {
              color: '#3b7ab5',
            },
            textStyle: {
              color: '#6b7280',
            },
          },
        ]
      : undefined,
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

export default LineChart;
