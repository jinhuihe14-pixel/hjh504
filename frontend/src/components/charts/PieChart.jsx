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

const PieChart = ({
  data,
  title = '',
  legend = true,
  ring = false,
  innerRadius = '50%',
  outerRadius = '70%',
  showLabel = true,
  labelPosition = 'outside',
  height = 350,
  option = {},
  ...rest
}) => {
  const chartData = Array.isArray(data)
    ? data.map((item, index) => ({
        ...item,
        itemStyle: {
          color: item.color || colorPalette[index % colorPalette.length],
        },
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
      trigger: 'item',
      backgroundColor: 'rgba(255, 255, 255, 0.95)',
      borderColor: '#e5e7eb',
      borderWidth: 1,
      textStyle: {
        color: '#374151',
        fontSize: 13,
      },
      padding: [10, 14],
      formatter: '{b}: {c} ({d}%)',
    },
    legend: legend
      ? {
          orient: 'vertical',
          right: '5%',
          top: 'center',
          textStyle: {
            color: '#6b7280',
            fontSize: 12,
          },
          itemWidth: 10,
          itemHeight: 10,
          itemGap: 12,
          formatter: (name) => {
            const item = chartData.find((d) => d.name === name);
            if (item) {
              return `{name|${name}}{value|${item.value}}`;
            }
            return name;
          },
          textStyle: {
            rich: {
              name: {
                color: '#6b7280',
                fontSize: 12,
                width: 80,
              },
              value: {
                color: '#1f2937',
                fontSize: 12,
                fontWeight: 500,
              },
            },
          },
        }
      : undefined,
    series: [
      {
        type: 'pie',
        radius: ring ? [innerRadius, outerRadius] : outerRadius,
        center: legend ? ['35%', '50%'] : ['50%', '50%'],
        avoidLabelOverlap: true,
        itemStyle: {
          borderRadius: 4,
          borderColor: '#fff',
          borderWidth: 2,
        },
        label: {
          show: showLabel,
          position: labelPosition,
          color: '#374151',
          fontSize: 12,
          formatter: '{b}: {d}%',
        },
        labelLine: {
          show: showLabel && labelPosition === 'outside',
          length: 10,
          length2: 10,
          lineStyle: {
            color: '#d1d5db',
          },
        },
        emphasis: {
          itemStyle: {
            shadowBlur: 10,
            shadowOffsetX: 0,
            shadowColor: 'rgba(0, 0, 0, 0.2)',
          },
          scale: true,
          scaleSize: 5,
        },
        data: chartData,
      },
    ],
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

export default PieChart;
