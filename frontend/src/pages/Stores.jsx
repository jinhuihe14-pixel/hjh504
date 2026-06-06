import { useState, useEffect } from 'react';
import LineChart from '../components/charts/LineChart';
import PieChart from '../components/charts/PieChart';
import { formatMoney, formatNumber } from '../utils/format';
import { getStores, getStoreDetail } from '../api/stores';
import './Stores.css';

const mockStoreSalesTrend = Array.from({ length: 30 }, (_, i) => {
  const date = new Date();
  date.setDate(date.getDate() - 29 + i);
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return {
    date: `${month}-${day}`,
    sales: 5000 + Math.random() * 3000,
  };
});

const mockStoreCategoryRatio = [
  { name: '饮料', value: 30 },
  { name: '零食', value: 25 },
  { name: '鲜食', value: 20 },
  { name: '速食', value: 12 },
  { name: '日用', value: 8 },
  { name: '烟酒', value: 5 },
];

function Stores() {
  const [loading, setLoading] = useState(true);
  const [stores, setStores] = useState([]);
  const [selectedStore, setSelectedStore] = useState(null);
  const [storeDetail, setStoreDetail] = useState(null);
  const [showDetail, setShowDetail] = useState(false);
  const [detailLoading, setDetailLoading] = useState(false);

  useEffect(() => {
    const loadStores = async () => {
      setLoading(true);
      try {
        const data = await getStores();
        setStores(data);
      } catch (error) {
        console.error('加载门店数据失败:', error);
      } finally {
        setLoading(false);
      }
    };

    loadStores();
  }, []);

  const handleStoreClick = async (store) => {
    setSelectedStore(store);
    setShowDetail(true);
    setDetailLoading(true);
    try {
      const detail = await getStoreDetail(store.id || store.store_id);
      setStoreDetail(detail);
    } catch (error) {
      console.error('加载门店详情失败:', error);
      setStoreDetail(null);
    } finally {
      setDetailLoading(false);
    }
  };

  const handleCloseDetail = () => {
    setShowDetail(false);
    setTimeout(() => {
      setSelectedStore(null);
      setStoreDetail(null);
    }, 300);
  };

  const salesTrendData = [
    {
      name: '销售额',
      data: mockStoreSalesTrend.map((item) => item.sales),
      color: '#1e3a5f',
    },
  ];

  const statusConfig = {
    active: { label: '营业中', color: '#10b981', dotColor: '#10b981' },
    normal: { label: '营业中', color: '#10b981', dotColor: '#10b981' },
    warning: { label: '异常', color: '#f59e0b', dotColor: '#f59e0b' },
    inactive: { label: '停业', color: '#ef4444', dotColor: '#ef4444' },
    closed: { label: '停业', color: '#ef4444', dotColor: '#ef4444' },
  };

  const getStatusConfig = (status) => {
    return statusConfig[status] || statusConfig.normal;
  };

  const activeCount = stores.filter((s) => {
    const status = s.status || 'active';
    return status === 'active' || status === 'normal';
  }).length;

  const displayStore = storeDetail || selectedStore;

  if (loading) {
    return (
      <div className="page-container">
        <h2 className="page-title">门店管理</h2>
        <div className="page-loading">
          <div className="loading-spinner" />
          <span>数据加载中...</span>
        </div>
      </div>
    );
  }

  return (
    <div className="stores-page page-container">
      <div className="page-header">
        <h2 className="page-title">门店管理</h2>
        <div className="page-stats">
          <span className="stat-text">
            共 <strong>{stores.length}</strong> 家门店
          </span>
          <span className="stat-divider">|</span>
          <span className="stat-text">
            营业中 <strong className="text-success">{activeCount}</strong> 家
          </span>
        </div>
      </div>

      <div className="stores-grid">
        {stores.map((store) => {
          const storeStatus = store.status || 'active';
          const cfg = getStatusConfig(storeStatus);
          const todaySales = store.todaySales !== undefined ? store.todaySales : store.daily_sales;
          const todayQty = store.todayQty !== undefined ? store.todayQty : Math.floor((store.daily_sales || 0) / 12);

          return (
            <div
              key={store.id || store.store_id}
              className="store-card"
              onClick={() => handleStoreClick(store)}
            >
              <div className="store-card-header">
                <div className="store-icon">🏪</div>
                <div className="store-status">
                  <span
                    className="status-dot"
                    style={{ backgroundColor: cfg.dotColor }}
                  />
                  <span style={{ color: cfg.color }}>
                    {cfg.label}
                  </span>
                </div>
              </div>
              <h3 className="store-name">{store.name}</h3>
              <p className="store-address">📍 {store.address}</p>
              <div className="store-meta">
                <div className="meta-item">
                  <span className="meta-label">面积</span>
                  <span className="meta-value">{store.area}㎡</span>
                </div>
                <div className="meta-item">
                  <span className="meta-label">店长</span>
                  <span className="meta-value">{store.manager || '-'}</span>
                </div>
              </div>
              <div className="store-stats">
                <div className="stat-item">
                  <span className="stat-label">今日销售额</span>
                  <span className="stat-value">{formatMoney(todaySales)}</span>
                </div>
                <div className="stat-divider" />
                <div className="stat-item">
                  <span className="stat-label">今日销量</span>
                  <span className="stat-value">{formatNumber(todayQty)}件</span>
                </div>
              </div>
              <div className="store-card-footer">
                <span className="view-detail">查看详情 →</span>
              </div>
            </div>
          );
        })}
      </div>

      {selectedStore && (
        <div className={`detail-overlay ${showDetail ? 'show' : ''}`} onClick={handleCloseDetail}>
          <div
            className={`detail-sidebar ${showDetail ? 'show' : ''}`}
            onClick={(e) => e.stopPropagation()}
          >
            <div className="detail-header">
              <h3 className="detail-title">门店详情</h3>
              <button className="close-btn" onClick={handleCloseDetail}>
                ✕
              </button>
            </div>

            {detailLoading ? (
              <div className="page-loading">
                <div className="loading-spinner" />
                <span>加载中...</span>
              </div>
            ) : displayStore ? (
              <div className="detail-content">
                <div className="detail-section">
                  <h4 className="section-title">基本信息</h4>
                  <div className="info-grid">
                    <div className="info-item">
                      <span className="info-label">门店名称</span>
                      <span className="info-value">{displayStore.name}</span>
                    </div>
                    <div className="info-item">
                      <span className="info-label">门店地址</span>
                      <span className="info-value">{displayStore.address}</span>
                    </div>
                    <div className="info-item">
                      <span className="info-label">门店面积</span>
                      <span className="info-value">{displayStore.area}㎡</span>
                    </div>
                    <div className="info-item">
                      <span className="info-label">店长</span>
                      <span className="info-value">{displayStore.manager || '-'}</span>
                    </div>
                    <div className="info-item">
                      <span className="info-label">联系电话</span>
                      <span className="info-value">{displayStore.phone || '-'}</span>
                    </div>
                    <div className="info-item">
                      <span className="info-label">营业状态</span>
                      <span
                        className="info-value"
                        style={{ color: getStatusConfig(displayStore.status || 'active').color }}
                      >
                        {getStatusConfig(displayStore.status || 'active').label}
                      </span>
                    </div>
                  </div>
                </div>

                <div className="detail-section">
                  <h4 className="section-title">本月销售趋势</h4>
                  <div className="chart-wrapper">
                    <LineChart
                      data={salesTrendData}
                      xAxisData={mockStoreSalesTrend.map((item) => item.date)}
                      areaStyle
                      height={200}
                      option={{
                        grid: {
                          left: '3%',
                          right: '4%',
                          bottom: '3%',
                          top: 20,
                          containLabel: true,
                        },
                      }}
                    />
                  </div>
                </div>

                <div className="detail-section">
                  <h4 className="section-title">品类销售占比</h4>
                  <div className="chart-wrapper">
                    <PieChart
                      data={displayStore.top_categories || mockStoreCategoryRatio}
                      ring
                      showLabel={false}
                      height={220}
                    />
                  </div>
                </div>

                <div className="detail-section">
                  <h4 className="section-title">今日数据</h4>
                  <div className="today-stats">
                    <div className="today-stat-item">
                      <span className="today-stat-label">销售额</span>
                      <span className="today-stat-value">
                        {formatMoney(displayStore.todaySales !== undefined ? displayStore.todaySales : displayStore.daily_sales)}
                      </span>
                    </div>
                    <div className="today-stat-item">
                      <span className="today-stat-label">销量</span>
                      <span className="today-stat-value">
                        {formatNumber(displayStore.todayQty !== undefined ? displayStore.todayQty : Math.floor((displayStore.daily_sales || 0) / 12))}件
                      </span>
                    </div>
                    <div className="today-stat-item">
                      <span className="today-stat-label">客单价</span>
                      <span className="today-stat-value">
                        {formatMoney(
                          (displayStore.todaySales || displayStore.daily_sales || 0) /
                          (displayStore.todayQty || Math.floor((displayStore.daily_sales || 0) / 12) || 1)
                        )}
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            ) : null}
          </div>
        </div>
      )}
    </div>
  );
}

export default Stores;
