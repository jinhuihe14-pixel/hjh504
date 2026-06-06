import { useState, useEffect, useMemo } from 'react';
import { STORES, CATEGORIES } from '../utils/constants';
import { orderApi } from '../api';
import { formatNumber, formatMoney, formatDays } from '../utils/format';
import StatCard from '../components/StatCard';
import DataTable from '../components/DataTable';
import './Orders.css';

function Orders() {
  const [activeTab, setActiveTab] = useState('store');
  const [selectedStore, setSelectedStore] = useState('store_001');
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [onlyShortLife, setOnlyShortLife] = useState(false);
  const [orderData, setOrderData] = useState([]);
  const [summary, setSummary] = useState(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const loadData = async () => {
      setLoading(true);
      try {
        const storeParam = activeTab === 'store' ? selectedStore : 'all';
        const catParam = activeTab === 'category' ? selectedCategory : 'all';

        const [suggestions, summaryData] = await Promise.all([
          orderApi.getOrderSuggestions(storeParam, catParam),
          orderApi.getSummary(storeParam, catParam),
        ]);

        setOrderData(suggestions);
        setSummary(summaryData);
      } finally {
        setLoading(false);
      }
    };

    loadData();
  }, [activeTab, selectedStore, selectedCategory]);

  const filteredData = useMemo(() => {
    let data = orderData;
    if (onlyShortLife) {
      data = data.filter((item) => item.is_short_life);
    }
    return data;
  }, [orderData, onlyShortLife]);

  const tableColumns = [
    { key: 'sku', title: 'SKU', width: 100 },
    { key: 'name', title: '商品名称', width: 200 },
    { key: 'category_name', title: '品类', width: 100 },
    {
      key: 'current_stock',
      title: '当前库存',
      width: 90,
      align: 'right',
      render: (val) => formatNumber(val),
    },
    {
      key: 'in_transit',
      title: '在途库存',
      width: 90,
      align: 'right',
      render: (val) => (val > 0 ? formatNumber(val) : '-'),
    },
    {
      key: 'forecast_7d',
      title: '7天预测销量',
      width: 110,
      align: 'right',
      render: (val) => formatNumber(val),
    },
    {
      key: 'suggested_order',
      title: '建议订货量',
      width: 110,
      align: 'right',
      render: (val) => (
        <span className={`suggested-order ${val > 0 ? 'positive' : 'zero'}`}>
          {formatNumber(val)}
        </span>
      ),
    },
    {
      key: 'safety_factor',
      title: '安全系数',
      width: 90,
      align: 'right',
      render: (val) => val.toFixed(2),
    },
    {
      key: 'turnover_days',
      title: '周转天数',
      width: 90,
      align: 'right',
      render: (val) => (
        <span
          className={`turnover-days ${
            val < 3 ? 'warning' : val > 14 ? 'danger' : 'normal'
          }`}
        >
          {formatDays(val)}
        </span>
      ),
    },
    {
      key: 'action',
      title: '操作',
      width: 100,
      align: 'center',
      render: () => (
        <button className="action-btn">调整</button>
      ),
    },
  ];

  const rowClassName = (row) => {
    if (row.is_short_life) {
      return 'short-life-row';
    }
    return '';
  };

  const renderCustomRow = (row, columns, rowIndex) => {
    const className = rowClassName(row);
    return (
      <tr key={row.sku || rowIndex} className={className}>
        {columns.map((column) => (
          <td
            key={column.key}
            style={{ textAlign: column.align || 'left' }}
          >
            {column.render
              ? column.render(row[column.key], row, rowIndex)
              : row[column.key]}
          </td>
        ))}
      </tr>
    );
  };

  return (
    <div className="page-container orders-page">
      <h2 className="page-title">订货建议</h2>

      <div className="tabs-container">
        <div className="tabs">
          <button
            className={`tab-btn ${activeTab === 'store' ? 'active' : ''}`}
            onClick={() => setActiveTab('store')}
          >
            <span className="tab-icon">🏪</span>
            按门店查看
          </button>
          <button
            className={`tab-btn ${activeTab === 'category' ? 'active' : ''}`}
            onClick={() => setActiveTab('category')}
          >
            <span className="tab-icon">📦</span>
            按品类查看
          </button>
        </div>
      </div>

      <div className="stats-grid">
        <StatCard
          title="建议订货总数量"
          value={summary ? formatNumber(summary.total_quantity) : '-'}
          theme="primary"
          icon="📦"
          suffix="件"
        />
        <StatCard
          title="建议订货总金额"
          value={summary ? formatMoney(summary.total_amount) : '-'}
          theme="success"
          icon="💰"
        />
        <StatCard
          title="短保商品种类数"
          value={summary ? formatNumber(summary.short_life_count) : '-'}
          theme="warning"
          icon="⏰"
          suffix="种"
        />
        <StatCard
          title="预计平均周转天数"
          value={summary ? summary.avg_turnover_days : '-'}
          theme="info"
          icon="📅"
          suffix="天"
        />
      </div>

      <div className="table-section">
        <div className="filter-bar">
          <div className="filter-left">
            {activeTab === 'store' ? (
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
            ) : (
              <div className="filter-item">
                <label className="filter-label">品类</label>
                <select
                  className="filter-select"
                  value={selectedCategory}
                  onChange={(e) => setSelectedCategory(e.target.value)}
                >
                  {CATEGORIES.filter((c) => c.id !== 'tobacco' && c.id !== 'ice').map((cat) => (
                    <option key={cat.id} value={cat.id}>
                      {cat.name}
                    </option>
                  ))}
                </select>
              </div>
            )}

            {activeTab === 'store' && (
              <div className="filter-item">
                <label className="filter-label">品类筛选</label>
                <select
                  className="filter-select"
                  value={selectedCategory}
                  onChange={(e) => setSelectedCategory(e.target.value)}
                >
                  {CATEGORIES.filter((c) => c.id !== 'tobacco' && c.id !== 'ice').map((cat) => (
                    <option key={cat.id} value={cat.id}>
                      {cat.name}
                    </option>
                  ))}
                </select>
              </div>
            )}
          </div>

          <div className="filter-right">
            <label className="switch-label">
              <input
                type="checkbox"
                className="switch-input"
                checked={onlyShortLife}
                onChange={(e) => setOnlyShortLife(e.target.checked)}
              />
              <span className="switch-slider" />
              <span className="switch-text">仅显示短保商品</span>
            </label>
          </div>
        </div>

        <div className="table-wrapper-card">
          {loading ? (
            <div className="table-loading">
              <div className="loading-spinner" />
              <span>加载中...</span>
            </div>
          ) : (
            <DataTable
              columns={tableColumns}
              data={filteredData}
              loading={loading}
              pagination={true}
              pageSize={10}
              rowKey="sku"
              striped={true}
              rowClassName={rowClassName}
            />
          )}
        </div>
      </div>
    </div>
  );
}

export default Orders;
