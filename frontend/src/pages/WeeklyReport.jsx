import { useState, useEffect } from 'react';
import StatCard from '../components/StatCard';
import LineChart from '../components/charts/LineChart';
import BarChart from '../components/charts/BarChart';
import { formatMoney, formatNumber, formatPercent } from '../utils/format';
import './WeeklyReport.css';

const mockWeeklyStats = {
  salesAmount: 128560.8,
  salesQty: 15680,
  wasteRate: 3.2,
  forecastAccuracy: 92.5,
  orderFulfillment: 96.8,
  weekOverWeek: 5.6,
};

const mockDailyForecast = [
  { day: '周一', forecast: 2200, actual: 2156 },
  { day: '周二', forecast: 2100, actual: 2089 },
  { day: '周三', forecast: 2300, actual: 2410 },
  { day: '周四', forecast: 2250, actual: 2198 },
  { day: '周五', forecast: 2500, actual: 2567 },
  { day: '周六', forecast: 2800, actual: 2756 },
  { day: '周日', forecast: 2700, actual: 2804 },
];

const mockCategoryCompare = [
  { category: '饮料', thisWeek: 3200, lastWeek: 3000 },
  { category: '零食', thisWeek: 2800, lastWeek: 2750 },
  { category: '鲜食', thisWeek: 2400, lastWeek: 2200 },
  { category: '速食', thisWeek: 1800, lastWeek: 1750 },
  { category: '日用', thisWeek: 1200, lastWeek: 1180 },
  { category: '烟酒', thisWeek: 2100, lastWeek: 2050 },
];

const mockModelIterations = [
  { id: 1, date: '2024-01-15', content: '引入天气特征，优化节假日预测模型', improvement: 2.3 },
  { id: 2, date: '2024-01-08', content: '优化鲜食品类保质期相关特征', improvement: 1.8 },
  { id: 3, date: '2024-01-01', content: '新增促销活动影响因子', improvement: 1.5 },
  { id: 4, date: '2023-12-25', content: '模型基础版本上线', improvement: 0 },
];

const mockSuggestions = [
  { id: 1, priority: 'high', content: '鲜食品类损耗率上升2.1%，建议重点关注订货量优化', icon: '🔴' },
  { id: 2, priority: 'high', content: '周末销量预测偏差较大，建议调整周末预测模型参数', icon: '🔴' },
  { id: 3, priority: 'medium', content: '饮料品类销量增长明显，建议适当增加陈列位置', icon: '🟡' },
  { id: 4, priority: 'medium', content: '周三订单满足率偏低，建议检查供应链配送时间', icon: '🟡' },
  { id: 5, priority: 'low', content: '零食品类新品表现良好，建议扩大试销范围', icon: '🟢' },
];

const priorityConfig = {
  high: { label: '高优先级', color: '#ef4444', borderColor: '#fecaca' },
  medium: { label: '中优先级', color: '#f97316', borderColor: '#fed7aa' },
  low: { label: '低优先级', color: '#10b981', borderColor: '#bbf7d0' },
};

function WeeklyReport() {
  const [loading, setLoading] = useState(true);
  const [weekNumber] = useState(24);
  const [dateRange] = useState('2024-06-10 ~ 2024-06-16');

  useEffect(() => {
    const timer = setTimeout(() => {
      setLoading(false);
    }, 500);
    return () => clearTimeout(timer);
  }, []);

  const forecastLineData = [
    {
      name: '预测销量',
      data: mockDailyForecast.map((item) => item.forecast),
      color: '#3b82f6',
    },
    {
      name: '实际销量',
      data: mockDailyForecast.map((item) => item.actual),
      color: '#10b981',
    },
  ];

  const categoryBarData = [
    {
      name: '本周',
      data: mockCategoryCompare.map((item) => item.thisWeek),
      color: '#1e3a5f',
    },
    {
      name: '上周',
      data: mockCategoryCompare.map((item) => item.lastWeek),
      color: '#94a3b8',
    },
  ];

  if (loading) {
    return (
      <div className="page-container">
        <h2 className="page-title">周报分析</h2>
        <div className="page-loading">
          <div className="loading-spinner" />
          <span>数据加载中...</span>
        </div>
      </div>
    );
  }

  return (
    <div className="weekly-report-page page-container">
      <div className="report-header">
        <div className="report-title-section">
          <h1 className="report-title">运营周报</h1>
          <div className="report-meta">
            <span className="week-badge">第 {weekNumber} 周</span>
            <span className="date-range">{dateRange}</span>
          </div>
        </div>
      </div>

      <div className="stats-grid">
        <StatCard
          title="本周销售额"
          value={formatMoney(mockWeeklyStats.salesAmount)}
          change={mockWeeklyStats.weekOverWeek}
          changeLabel="环比"
          icon="💰"
          theme="default"
        />
        <StatCard
          title="本周销量"
          value={formatNumber(mockWeeklyStats.salesQty)}
          suffix="件"
          change={4.2}
          changeLabel="环比"
          icon="📦"
          theme="default"
        />
        <StatCard
          title="损耗率"
          value={mockWeeklyStats.wasteRate}
          suffix="%"
          change={-0.5}
          changeLabel="环比"
          icon="📉"
          theme="warning"
        />
        <StatCard
          title="预测准确率"
          value={mockWeeklyStats.forecastAccuracy}
          suffix="%"
          change={1.2}
          changeLabel="环比"
          icon="🎯"
          theme="success"
        />
        <StatCard
          title="订单满足率"
          value={mockWeeklyStats.orderFulfillment}
          suffix="%"
          change={0.8}
          changeLabel="环比"
          icon="✅"
          theme="success"
        />
        <StatCard
          title="环比变化"
          value={mockWeeklyStats.weekOverWeek > 0 ? '增长' : '下降'}
          suffix=""
          change={Math.abs(mockWeeklyStats.weekOverWeek)}
          changeLabel="较上周"
          icon="📊"
          theme={mockWeeklyStats.weekOverWeek > 0 ? 'success' : 'danger'}
        />
      </div>

      <div className="content-row">
        <div className="chart-card card-large">
          <div className="card-header">
            <h3 className="card-title">预测 vs 实际销量对比</h3>
            <span className="card-subtitle">每日销量对比分析</span>
          </div>
          <LineChart
            data={forecastLineData}
            xAxisData={mockDailyForecast.map((item) => item.day)}
            legend={['预测销量', '实际销量']}
            height={300}
          />
        </div>

        <div className="chart-card card-small">
          <div className="card-header">
            <h3 className="card-title">品类销量对比</h3>
            <span className="card-subtitle">本周 vs 上周</span>
          </div>
          <BarChart
            data={categoryBarData}
            xAxisData={mockCategoryCompare.map((item) => item.category)}
            legend={['本周', '上周']}
            height={300}
          />
        </div>
      </div>

      <div className="content-row">
        <div className="chart-card card-large">
          <div className="card-header">
            <h3 className="card-title">模型迭代记录</h3>
          </div>
          <div className="timeline">
            {mockModelIterations.map((item, index) => (
              <div key={item.id} className="timeline-item">
                <div className="timeline-dot" />
                <div className="timeline-line" />
                <div className="timeline-content">
                  <div className="timeline-header">
                    <span className="timeline-date">{item.date}</span>
                    {item.improvement > 0 && (
                      <span className="improvement-badge">
                        准确率提升 +{item.improvement}%
                      </span>
                    )}
                  </div>
                  <p className="timeline-text">{item.content}</p>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="chart-card card-small">
          <div className="card-header">
            <h3 className="card-title">本周改进建议</h3>
          </div>
          <div className="suggestion-list">
            {mockSuggestions.map((item) => (
              <div
                key={item.id}
                className="suggestion-item"
                style={{ borderLeftColor: priorityConfig[item.priority].color }}
              >
                <div className="suggestion-icon">{item.icon}</div>
                <div className="suggestion-content">
                  <span
                    className="priority-tag"
                    style={{
                      color: priorityConfig[item.priority].color,
                      backgroundColor: priorityConfig[item.priority].borderColor + '40',
                    }}
                  >
                    {priorityConfig[item.priority].label}
                  </span>
                  <p className="suggestion-text">{item.content}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

export default WeeklyReport;
