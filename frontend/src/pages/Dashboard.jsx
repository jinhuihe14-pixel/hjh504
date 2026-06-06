import { useState, useEffect } from 'react';
import StatCard from '../components/StatCard';
import { LineChart, BarChart, PieChart } from '../components/charts';
import { getSummary, getSalesTrend, getCategorySales, getStoreSales, getWasteTrend } from '../api/dashboard';
import { purchaseApi } from '../api';
import { formatNumber, formatPercent, formatMoney } from '../utils/format';
import './Dashboard.css';

function Dashboard() {
  const [loading, setLoading] = useState(true);
  const [summary, setSummary] = useState(null);
  const [salesTrend, setSalesTrend] = useState(null);
  const [categorySales, setCategorySales] = useState(null);
  const [storeSales, setStoreSales] = useState(null);
  const [wasteTrend, setWasteTrend] = useState(null);
  const [purchaseOverview, setPurchaseOverview] = useState(null);

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      try {
        const [summaryData, trendData, categoryData, storeData, wasteData, purchaseData] = await Promise.all([
          getSummary(),
          getSalesTrend(30),
          getCategorySales(),
          getStoreSales(),
          getWasteTrend(30),
          purchaseApi.getPurchaseOverview(),
        ]);
        setSummary(summaryData);
        setSalesTrend(trendData);
        setCategorySales(categoryData);
        setStoreSales(storeData);
        setWasteTrend(wasteData);
        setPurchaseOverview(purchaseData);
      } catch (error) {
        console.error('获取仪表盘数据失败:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  const statCards = summary
    ? [
        {
          title: '门店总数',
          value: formatNumber(summary.total_stores),
          icon: '🏪',
          theme: 'default',
        },
        {
          title: 'SKU总数',
          value: formatNumber(summary.total_products),
          icon: '📦',
          theme: 'default',
        },
        {
          title: '今日销售额',
          value: formatMoney(summary.today_sales_amount),
          icon: '💰',
          theme: 'success',
          change: 5.2,
          changeLabel: '较昨日',
        },
        {
          title: '今日销量',
          value: formatNumber(summary.today_sales_quantity),
          icon: '📊',
          theme: 'default',
          change: 3.8,
          changeLabel: '较昨日',
        },
        {
          title: '综合损耗率',
          value: formatPercent(summary.waste_rate),
          icon: '📉',
          theme: 'danger',
          change: -2.1,
          changeLabel: '较上周',
        },
        {
          title: '订单满足率',
          value: formatPercent(summary.order_fulfillment_rate),
          icon: '✅',
          theme: 'success',
          change: 1.5,
          changeLabel: '较上周',
        },
        {
          title: '预测准确率',
          value: formatPercent(summary.forecast_accuracy),
          icon: '🎯',
          theme: 'warning',
          change: 2.3,
          changeLabel: '较上周',
        },
      ]
    : Array(7).fill(null);

  return (
    <div className="dashboard-page">
      <h2 className="page-title">数据总览</h2>

      <div className="stats-grid">
        {loading
          ? statCards.map((_, index) => <div key={index} className="card-skeleton" />)
          : statCards.map((card, index) => (
              <StatCard
                key={index}
                title={card.title}
                value={card.value}
                icon={card.icon}
                theme={card.theme}
                change={card.change}
                changeLabel={card.changeLabel}
                suffix={card.suffix}
              />
            ))}
      </div>

      <div className="purchase-section">
        <h3 className="section-title">采购概况</h3>
        <div className="purchase-stats-grid">
          {loading || !purchaseOverview
            ? Array(4).fill(null).map((_, index) => (
                <div key={index} className="card-skeleton" />
              ))
            : (
              <>
                <StatCard
                  title="本周待确认采购单"
                  value={formatNumber(purchaseOverview.pending_confirm_count)}
                  icon="⏳"
                  theme="warning"
                  suffix="单"
                />
                <StatCard
                  title="配送中采购单"
                  value={formatNumber(purchaseOverview.in_delivery_count)}
                  icon="🚚"
                  theme="info"
                  suffix="单"
                />
                <StatCard
                  title="本月采购总金额"
                  value={formatMoney(purchaseOverview.monthly_total_amount)}
                  icon="💰"
                  theme="success"
                />
                <StatCard
                  title="平均到货率"
                  value={formatPercent(purchaseOverview.average_arrival_rate)}
                  icon="📦"
                  theme="primary"
                />
              </>
            )}
        </div>
      </div>

      <div className="charts-row">
        <div className="chart-card">
          <div className="chart-card-title">近30天销量趋势</div>
          {loading || !salesTrend ? (
            <div className="loading-container">
              <div className="loading-spinner" />
            </div>
          ) : (
            <LineChart
              data={salesTrend.data}
              xAxisData={salesTrend.xAxisData}
              legend={salesTrend.legend}
              height={320}
              smooth
              areaStyle={false}
            />
          )}
        </div>

        <div className="chart-card">
          <div className="chart-card-title">品类销售占比</div>
          {loading || !categorySales ? (
            <div className="loading-container">
              <div className="loading-spinner" />
            </div>
          ) : (
            <PieChart
              data={categorySales}
              ring
              height={320}
              showLabel={false}
              labelPosition="outside"
            />
          )}
        </div>
      </div>

      <div className="charts-row-reverse">
        <div className="chart-card">
          <div className="chart-card-title">各门店销售对比</div>
          {loading || !storeSales ? (
            <div className="loading-container">
              <div className="loading-spinner" />
            </div>
          ) : (
            <BarChart
              data={storeSales.data}
              xAxisData={storeSales.xAxisData}
              legend={storeSales.legend}
              height={320}
              showLabel
            />
          )}
        </div>

        <div className="chart-card">
          <div className="chart-card-title">损耗趋势</div>
          {loading || !wasteTrend ? (
            <div className="loading-container">
              <div className="loading-spinner" />
            </div>
          ) : (
            <LineChart
              data={wasteTrend.data}
              xAxisData={wasteTrend.xAxisData}
              legend={wasteTrend.legend}
              height={320}
              smooth
              areaStyle
            />
          )}
        </div>
      </div>
    </div>
  );
}

export default Dashboard;
