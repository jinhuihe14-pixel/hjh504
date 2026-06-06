import { useState, useEffect } from 'react';
import StatCard from '../components/StatCard';
import BarChart from '../components/charts/BarChart';
import LineChart from '../components/charts/LineChart';
import { STORES } from '../utils/constants';
import { formatMoney, formatPercent, formatNumber } from '../utils/format';
import { getHighRiskProducts, getStoreWaste } from '../api/waste';
import './Waste.css';

const mockWasteTrend = Array.from({ length: 30 }, (_, i) => {
  const date = new Date();
  date.setDate(date.getDate() - 29 + i);
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return {
    date: `${month}-${day}`,
    amount: 800 + Math.random() * 600,
  };
});

const mockSuggestions = [
  { id: 1, product: '鲜牛奶 250ml', type: '缩减订货', suggestion: '建议将订货量减少15%，根据近7天销售数据，日均销量约180件，当前订货210件偏高', icon: '📉' },
  { id: 2, product: '三明治套餐', type: '调整促销', suggestion: '建议傍晚6点后启动第二件半价促销，加快临期商品周转', icon: '🏷️' },
  { id: 3, product: '便当盒饭', type: '检查陈列', suggestion: '建议检查冷藏柜温度设置，当前温度略高可能影响保质期', icon: '🌡️' },
  { id: 4, product: '酸奶 200g', type: '替换供应商', suggestion: '建议对比其他供应商产品保质期，当前供应商产品保质期偏短', icon: '🔄' },
];

const riskLevelConfig = {
  critical: { label: '极高', color: '#ef4444', bgColor: '#fef2f2' },
  high: { label: '高', color: '#ef4444', bgColor: '#fef2f2' },
  warning: { label: '高', color: '#f97316', bgColor: '#fff7ed' },
  medium: { label: '中', color: '#f59e0b', bgColor: '#fefce8' },
  attention: { label: '中', color: '#f59e0b', bgColor: '#fefce8' },
  low: { label: '低', color: '#10b981', bgColor: '#f0fdf4' },
  normal: { label: '低', color: '#10b981', bgColor: '#f0fdf4' },
};

const suggestionTypeConfig = {
  '缩减订货': { color: '#3b82f6', bgColor: '#eff6ff' },
  '调整促销': { color: '#f97316', bgColor: '#fff7ed' },
  '检查陈列': { color: '#8b5cf6', bgColor: '#faf5ff' },
  '替换供应商': { color: '#10b981', bgColor: '#f0fdf4' },
};

function Waste() {
  const [loading, setLoading] = useState(true);
  const [selectedStore, setSelectedStore] = useState('all');
  const [dateRange, setDateRange] = useState('30');
  const [highRiskData, setHighRiskData] = useState(null);
  const [storeWasteData, setStoreWasteData] = useState(null);

  useEffect(() => {
    const loadData = async () => {
      setLoading(true);
      try {
        if (selectedStore === 'all') {
          const data = await getHighRiskProducts();
          setHighRiskData(data);
        } else {
          const data = await getStoreWaste(selectedStore);
          setStoreWasteData(data);
        }
      } catch (error) {
        console.error('加载损耗数据失败:', error);
      } finally {
        setLoading(false);
      }
    };

    loadData();
  }, [selectedStore, dateRange]);

  const trendData = [
    {
      name: '损耗金额',
      data: mockWasteTrend.map((item) => item.amount),
      color: '#ef4444',
    },
  ];

  const highRiskProducts = highRiskData?.items || highRiskData?.products || [];

  const totalWasteAmount = storeWasteData?.total_waste_amount || 28650.5;
  const avgWasteRate = storeWasteData?.avg_waste_rate || 0.032;
  const highRiskCount = highRiskData?.high_risk || highRiskData?.total || 12;

  const wasteByCategory = storeWasteData?.waste_by_category || [
    { name: '鲜食', value: 1850 },
    { name: '饮料', value: 420 },
    { name: '零食', value: 350 },
    { name: '速食食品', value: 236.5 },
  ];

  const categoryBarData = [
    {
      name: '损耗率',
      data: wasteByCategory.map((item) => item.value ? Math.min(item.value / 100, 10) : 5),
      color: '#f97316',
    },
  ];

  const getRiskConfig = (level) => {
    return riskLevelConfig[level] || riskLevelConfig.medium;
  };

  if (loading) {
    return (
      <div className="page-container">
        <h2 className="page-title">损耗分析</h2>
        <div className="page-loading">
          <div className="loading-spinner" />
          <span>数据加载中...</span>
        </div>
      </div>
    );
  }

  return (
    <div className="waste-page page-container">
      <div className="page-header">
        <h2 className="page-title">损耗分析</h2>
        <div className="filter-bar">
          <div className="filter-item">
            <label className="filter-label">门店选择</label>
            <select
              className="filter-select"
              value={selectedStore}
              onChange={(e) => setSelectedStore(e.target.value)}
            >
              {STORES.map((store) => (
                <option key={store.id} value={store.id}>
                  {store.name}
                </option>
              ))}
            </select>
          </div>
          <div className="filter-item">
            <label className="filter-label">时间范围</label>
            <select
              className="filter-select"
              value={dateRange}
              onChange={(e) => setDateRange(e.target.value)}
            >
              <option value="7">近7天</option>
              <option value="30">近30天</option>
              <option value="90">近90天</option>
            </select>
          </div>
        </div>
      </div>

      <div className="stat-cards-row">
        <StatCard
          title="总损耗金额"
          value={formatMoney(totalWasteAmount)}
          change={-5.8}
          changeLabel="环比"
          icon="💰"
          theme="danger"
        />
        <StatCard
          title="综合损耗率"
          value={formatPercent(avgWasteRate)}
          suffix=""
          change={-2.1}
          changeLabel="环比"
          icon="📊"
          theme="warning"
        />
        <StatCard
          title="高风险商品数"
          value={highRiskCount}
          suffix="个"
          change={3}
          changeLabel="较上周"
          icon="⚠️"
          theme="danger"
        />
        <StatCard
          title="本月损耗趋势"
          value="下降"
          suffix=""
          change={5.8}
          changeLabel="较上月"
          icon="📈"
          theme="success"
        />
      </div>

      <div className="content-row">
        <div className="chart-card card-large">
          <div className="card-header">
            <h3 className="card-title">高损耗商品排行榜</h3>
          </div>
          <div className="high-waste-list">
            {highRiskProducts.slice(0, 8).map((item, index) => {
              const riskConfig = getRiskConfig(item.risk_level || item.riskLevel);
              const wasteRate = item.waste_rate || item.wasteRate || 0;
              const wasteAmount = item.waste_amount || item.wasteAmount || 0;
              const wasteQty = item.waste_quantity || item.avg_waste || 0;

              return (
                <div key={item.sku || index} className="waste-item">
                  <div className="waste-rank">
                    <span className={`rank-badge rank-${index + 1}`}>{index + 1}</span>
                  </div>
                  <div className="waste-info">
                    <div className="waste-name">{item.name || item.product_name}</div>
                    <div className="waste-meta">
                      <span>损耗量：{formatNumber(wasteQty)}件</span>
                      <span>损耗率：{formatPercent(wasteRate)}</span>
                      <span>损耗金额：{formatMoney(wasteAmount)}</span>
                    </div>
                  </div>
                  <div className="waste-bar-wrapper">
                    <div
                      className="waste-bar"
                      style={{
                        width: `${Math.min((wasteRate * 100 / 10) * 100, 100)}%`,
                        background: riskConfig.color,
                      }}
                    />
                  </div>
                  <div className="waste-risk">
                    <span
                      className="risk-tag"
                      style={{
                        color: riskConfig.color,
                        backgroundColor: riskConfig.bgColor,
                      }}
                    >
                      {riskConfig.label}风险
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        <div className="chart-card card-small">
          <div className="card-header">
            <h3 className="card-title">品类损耗率对比</h3>
          </div>
          <BarChart
            data={categoryBarData}
            xAxisData={wasteByCategory.map((item) => item.name)}
            horizontal
            height={300}
          />
        </div>
      </div>

      <div className="content-row">
        <div className="chart-card card-large">
          <div className="card-header">
            <h3 className="card-title">损耗趋势图</h3>
            <span className="card-subtitle">近30天损耗金额趋势</span>
          </div>
          <LineChart
            data={trendData}
            xAxisData={mockWasteTrend.map((item) => item.date)}
            legend={['损耗金额']}
            areaStyle
            height={300}
          />
        </div>

        <div className="chart-card card-small">
          <div className="card-header">
            <h3 className="card-title">优化建议</h3>
          </div>
          <div className="suggestion-list">
            {mockSuggestions.map((item) => (
              <div key={item.id} className="suggestion-item">
                <div className="suggestion-icon">{item.icon}</div>
                <div className="suggestion-content">
                  <div className="suggestion-header">
                    <span className="suggestion-product">{item.product}</span>
                    <span
                      className="suggestion-type"
                      style={{
                        color: suggestionTypeConfig[item.type]?.color,
                        backgroundColor: suggestionTypeConfig[item.type]?.bgColor,
                      }}
                    >
                      {item.type}
                    </span>
                  </div>
                  <p className="suggestion-text">{item.suggestion}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

export default Waste;
