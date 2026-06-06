import { useState, useEffect, useMemo } from 'react';
import ReactECharts from 'echarts-for-react';
import { STORES, CATEGORIES } from '../utils/constants';
import { forecastApi } from '../api';
import { formatNumber, formatPercent } from '../utils/format';
import StatCard from '../components/StatCard';
import DataTable from '../components/DataTable';
import './Forecast.css';

function Forecast() {
  const [selectedStore, setSelectedStore] = useState('store001');
  const [selectedCategory, setSelectedCategory] = useState('drinks');
  const [selectedSku, setSelectedSku] = useState('SKU001');
  const [skuList, setSkuList] = useState([]);
  const [forecastData, setForecastData] = useState(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const loadSkus = async () => {
      const skus = await forecastApi.getSkusByCategory(selectedCategory);
      setSkuList(skus);
      if (skus.length > 0) {
        setSelectedSku(skus[0].id);
      }
    };
    loadSkus();
  }, [selectedCategory]);

  useEffect(() => {
    const loadForecast = async () => {
      setLoading(true);
      try {
        const data = await forecastApi.getForecast(selectedStore, selectedCategory, selectedSku);
        setForecastData(data);
      } finally {
        setLoading(false);
      }
    };
    if (selectedSku) {
      loadForecast();
    }
  }, [selectedStore, selectedCategory, selectedSku]);

  const chartOption = useMemo(() => {
    if (!forecastData) return {};

    const { history, forecast } = forecastData;

    const historyDates = history.map((h) => h.date.slice(5));
    const forecastDates = forecast.map((f) => f.date.slice(5));
    const allDates = [...historyDates, ...forecastDates];

    const historyData = history.map((h) => h.sales);
    const forecastDataArr = forecast.map((f) => f.forecast);
    const lowerBound = forecast.map((f) => f.lower_bound);
    const upperBound = forecast.map((f) => f.upper_bound);

    const placeholderLength = history.length;

    return {
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
      legend: {
        data: ['历史销量', '预测销量', '预测区间'],
        top: 0,
        right: 0,
        textStyle: {
          color: '#6b7280',
          fontSize: 12,
        },
        itemWidth: 14,
        itemHeight: 7,
        itemGap: 20,
      },
      grid: {
        left: '3%',
        right: '4%',
        bottom: '3%',
        top: 40,
        containLabel: true,
      },
      xAxis: {
        type: 'category',
        boundaryGap: false,
        data: allDates,
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
          fontSize: 11,
          rotate: 30,
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
      series: [
        {
          name: '历史销量',
          type: 'line',
          data: [...historyData, ...new Array(forecast.length).fill(null)],
          smooth: true,
          symbol: 'circle',
          symbolSize: 5,
          lineStyle: {
            width: 2,
            color: '#3b7ab5',
          },
          itemStyle: {
            color: '#3b7ab5',
          },
          areaStyle: {
            color: {
              type: 'linear',
              x: 0,
              y: 0,
              x2: 0,
              y2: 1,
              colorStops: [
                { offset: 0, color: 'rgba(59, 122, 181, 0.3)' },
                { offset: 1, color: 'rgba(59, 122, 181, 0.02)' },
              ],
            },
          },
          z: 3,
        },
        {
          name: '预测区间下限',
          type: 'line',
          data: [...new Array(placeholderLength).fill(null), ...lowerBound],
          stack: 'confidence-band',
          lineStyle: {
            opacity: 0,
          },
          symbol: 'none',
          areaStyle: {
            color: 'transparent',
          },
          z: 1,
        },
        {
          name: '预测区间',
          type: 'line',
          data: [...new Array(placeholderLength).fill(null), ...upperBound.map((v, i) => v - lowerBound[i])],
          stack: 'confidence-band',
          lineStyle: {
            opacity: 0,
          },
          symbol: 'none',
          areaStyle: {
            color: 'rgba(16, 185, 129, 0.2)',
          },
          z: 1,
        },
        {
          name: '预测销量',
          type: 'line',
          data: [...new Array(placeholderLength).fill(null), ...forecastDataArr],
          smooth: true,
          symbol: 'circle',
          symbolSize: 6,
          lineStyle: {
            width: 2,
            type: 'dashed',
            color: '#10b981',
          },
          itemStyle: {
            color: '#10b981',
          },
          z: 2,
        },
      ],
    };
  }, [forecastData]);

  const tableColumns = [
    { key: 'date', title: '日期', width: 120 },
    { key: 'day_of_week', title: '星期', width: 70 },
    {
      key: 'forecast',
      title: '预测销量',
      width: 100,
      align: 'right',
      render: (val) => <span className="forecast-value">{formatNumber(val)}</span>,
    },
    {
      key: 'lower_bound',
      title: '预测下限',
      width: 100,
      align: 'right',
      render: (val) => <span className="bound-value lower">{formatNumber(val)}</span>,
    },
    {
      key: 'upper_bound',
      title: '预测上限',
      width: 100,
      align: 'right',
      render: (val) => <span className="bound-value upper">{formatNumber(val)}</span>,
    },
    {
      key: 'factors',
      title: '影响因素',
      render: (val) => (
        <div className="factor-tags">
          {val.map((factor, idx) => (
            <span key={idx} className="factor-tag">
              {factor}
            </span>
          ))}
        </div>
      ),
    },
  ];

  return (
    <div className="page-container forecast-page">
      <h2 className="page-title">销量预测</h2>

      <div className="filter-bar">
        <div className="filter-item">
          <label className="filter-label">门店</label>
          <select
            className="filter-select"
            value={selectedStore}
            onChange={(e) => setSelectedStore(e.target.value)}
          >
            {STORES.filter((s) => s.id !== 'all').map((store) => (
              <option key={store.id} value={store.id}>
                {store.name}
              </option>
            ))}
          </select>
        </div>

        <div className="filter-item">
          <label className="filter-label">品类</label>
          <select
            className="filter-select"
            value={selectedCategory}
            onChange={(e) => setSelectedCategory(e.target.value)}
          >
            {CATEGORIES.filter((c) => c.id !== 'all' && c.id !== 'tobacco' && c.id !== 'ice').map((cat) => (
              <option key={cat.id} value={cat.id}>
                {cat.name}
              </option>
            ))}
          </select>
        </div>

        <div className="filter-item">
          <label className="filter-label">SKU</label>
          <select
            className="filter-select"
            value={selectedSku}
            onChange={(e) => setSelectedSku(e.target.value)}
          >
            {skuList.map((sku) => (
              <option key={sku.id} value={sku.id}>
                {sku.name}
              </option>
            ))}
          </select>
        </div>
      </div>

      <div className="forecast-main-content">
        <div className="forecast-chart-section">
          <div className="section-card chart-card">
            <div className="section-header">
              <h3 className="section-title">销量趋势预测</h3>
              <span className="section-subtitle">历史30天 + 未来7天</span>
            </div>
            {loading ? (
              <div className="chart-loading">
                <div className="loading-spinner" />
                <span>加载中...</span>
              </div>
            ) : forecastData ? (
              <ReactECharts
                option={chartOption}
                style={{ height: 380, width: '100%' }}
                opts={{ renderer: 'canvas' }}
              />
            ) : null}
          </div>
        </div>

        <div className="forecast-info-section">
          <StatCard
            title="预测准确率"
            value={forecastData ? formatPercent(forecastData.metrics.accuracy) : '-'}
            theme="success"
            icon="🎯"
          />
          <StatCard
            title="平均绝对误差(MAE)"
            value={forecastData ? formatNumber(forecastData.metrics.mae) : '-'}
            theme="warning"
            icon="📊"
          />
          <div className="info-card factors-card">
            <div className="info-card-header">
              <span className="info-card-title">主要影响因素</span>
            </div>
            <div className="info-card-content">
              {forecastData ? (
                <div className="main-factors">
                  {forecastData.metrics.main_factors.map((factor, idx) => (
                    <span key={idx} className={`factor-tag factor-${idx + 1}`}>
                      {factor}
                    </span>
                  ))}
                </div>
              ) : (
                <span className="text-muted">-</span>
              )}
            </div>
          </div>
        </div>
      </div>

      <div className="section-card table-card">
        <div className="section-header">
          <h3 className="section-title">未来7天预测明细</h3>
        </div>
        <DataTable
          columns={tableColumns}
          data={forecastData?.forecast || []}
          loading={loading}
          pagination={false}
          rowKey="date"
        />
      </div>
    </div>
  );
}

export default Forecast;
