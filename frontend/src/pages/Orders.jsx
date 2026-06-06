import { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { STORES, CATEGORIES } from '../utils/constants';
import { orderApi, purchaseApi } from '../api';
import { formatNumber, formatMoney, formatDays } from '../utils/format';
import StatCard from '../components/StatCard';
import DataTable from '../components/DataTable';
import './Orders.css';

function Orders() {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState('store');
  const [selectedStore, setSelectedStore] = useState('store_001');
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [onlyShortLife, setOnlyShortLife] = useState(false);
  const [orderData, setOrderData] = useState([]);
  const [summary, setSummary] = useState(null);
  const [loading, setLoading] = useState(false);

  const [adjustModalVisible, setAdjustModalVisible] = useState(false);
  const [adjustItem, setAdjustItem] = useState(null);
  const [adjustQuantity, setAdjustQuantity] = useState('');
  const [adjustReason, setAdjustReason] = useState('');

  const [generatingPo, setGeneratingPo] = useState(false);
  const [showSuccessToast, setShowSuccessToast] = useState(false);
  const [successMessage, setSuccessMessage] = useState('');

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

        const itemsWithAdjust = suggestions.map((item) => ({
          ...item,
          adjusted_order: item.suggested_order,
          is_adjusted: false,
          adjust_reason: '',
        }));

        setOrderData(itemsWithAdjust);
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

  const adjustedSummary = useMemo(() => {
    const totalQty = filteredData.reduce((sum, item) => sum + item.adjusted_order, 0);
    const totalAmt = filteredData.reduce((sum, item) => sum + item.adjusted_order * item.price, 0);
    const adjustedCount = filteredData.filter((item) => item.is_adjusted).length;
    return {
      total_quantity: totalQty,
      total_amount: totalAmt,
      adjusted_count: adjustedCount,
    };
  }, [filteredData]);

  const handleAdjustClick = (row) => {
    setAdjustItem(row);
    setAdjustQuantity(String(row.adjusted_order));
    setAdjustReason(row.adjust_reason || '');
    setAdjustModalVisible(true);
  };

  const handleAdjustConfirm = () => {
    if (!adjustItem) return;

    const qty = parseFloat(adjustQuantity);
    if (isNaN(qty) || qty < 0) {
      alert('请输入有效的订货数量');
      return;
    }

    setOrderData((prev) =>
      prev.map((item) =>
        item.sku === adjustItem.sku
          ? {
              ...item,
              adjusted_order: qty,
              is_adjusted: qty !== item.suggested_order,
              adjust_reason: adjustReason,
            }
          : item
      )
    );

    setAdjustModalVisible(false);
    setAdjustItem(null);
  };

  const handleGeneratePo = async () => {
    if (filteredData.length === 0) {
      alert('当前筛选条件下没有商品，请调整筛选条件');
      return;
    }

    const itemsToOrder = filteredData.filter((item) => item.adjusted_order > 0);
    if (itemsToOrder.length === 0) {
      alert('没有需要订货的商品（订货量均为0）');
      return;
    }

    setGeneratingPo(true);
    try {
      const storeName = STORES.find((s) => s.id === selectedStore)?.name || selectedStore;
      const categoryName = selectedCategory !== 'all'
        ? CATEGORIES.find((c) => c.id === selectedCategory)?.name || ''
        : '';

      const poItems = itemsToOrder.map((item) => ({
        sku: item.sku,
        product_name: item.name,
        category: item.category,
        suggested_order: item.suggested_order,
        adjusted_order: item.adjusted_order,
        unit: item.unit || '个',
        price: item.price,
        amount: Number((item.adjusted_order * item.price).toFixed(2)),
        adjust_reason: item.adjust_reason || '',
        is_adjusted: item.is_adjusted || false,
      }));

      const result = await purchaseApi.createPurchaseOrder({
        store_id: selectedStore,
        store_name: storeName,
        category: categoryName,
        items: poItems,
        remark: '',
      });

      setSuccessMessage(`采购单 ${result.po_no} 已生成！`);
      setShowSuccessToast(true);
      setTimeout(() => setShowSuccessToast(false), 3000);
    } catch (error) {
      console.error('生成采购单失败:', error);
      alert('生成采购单失败，请重试');
    } finally {
      setGeneratingPo(false);
    }
  };

  const goToPurchases = () => {
    navigate('/purchases');
  };

  const tableColumns = [
    { key: 'sku', title: 'SKU', width: 100 },
    { key: 'name', title: '商品名称', width: 180 },
    { key: 'category_name', title: '品类', width: 100 },
    {
      key: 'current_stock',
      title: '当前库存',
      width: 90,
      align: 'right',
      render: (val) => formatNumber(val),
    },
    {
      key: 'forecast_7d',
      title: '7天预测',
      width: 100,
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
      key: 'adjusted_order',
      title: '调整后订货量',
      width: 130,
      align: 'right',
      render: (val, row) => (
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end' }}>
          <span className={`adjusted-order ${row.is_adjusted ? 'adjusted' : ''}`}>
            {formatNumber(val)}
          </span>
          {row.is_adjusted && (
            <span className="adjusted-badge">已手动调整</span>
          )}
        </div>
      ),
    },
    {
      key: 'amount',
      title: '预估金额',
      width: 100,
      align: 'right',
      render: (_, row) => formatMoney(row.adjusted_order * row.price),
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
      render: (_, row) => (
        <button className="action-btn" onClick={() => handleAdjustClick(row)}>
          调整
        </button>
      ),
    },
  ];

  const rowClassName = (row) => {
    if (row.is_short_life) {
      return 'short-life-row';
    }
    return '';
  };

  return (
    <div className="page-container orders-page">
      <div className="page-header">
        <h2 className="page-title">订货建议</h2>
        <div className="page-actions">
          <button
            className="generate-po-btn"
            onClick={handleGeneratePo}
            disabled={generatingPo || loading}
          >
            {generatingPo ? '生成中...' : '📄 一键生成采购单'}
          </button>
          <button className="secondary-btn" onClick={goToPurchases}>
            📋 查看采购单
          </button>
        </div>
      </div>

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
          title="调整后总金额"
          value={formatMoney(adjustedSummary.total_amount)}
          theme="warning"
          icon="💴"
        />
        <StatCard
          title="已调整商品数"
          value={formatNumber(adjustedSummary.adjusted_count)}
          theme="info"
          icon="✏️"
          suffix="种"
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
                  <option value="all">全部品类</option>
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

      {adjustModalVisible && adjustItem && (
        <div className="modal-overlay" onClick={() => setAdjustModalVisible(false)}>
          <div className="modal-content adjust-modal" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h3>调整订货量</h3>
              <button className="modal-close" onClick={() => setAdjustModalVisible(false)}>
                ✕
              </button>
            </div>
            <div className="modal-body">
              <div className="modal-product-info">
                <span className="product-name">{adjustItem.name}</span>
                <span className="product-sku">SKU: {adjustItem.sku}</span>
              </div>

              <div className="form-row">
                <div className="form-item">
                  <label className="form-label">建议订货量</label>
                  <div className="form-value">{formatNumber(adjustItem.suggested_order)} {adjustItem.unit}</div>
                </div>
                <div className="form-item">
                  <label className="form-label">当前库存</label>
                  <div className="form-value">{formatNumber(adjustItem.current_stock)} {adjustItem.unit}</div>
                </div>
              </div>

              <div className="form-item">
                <label className="form-label">调整后订货量 <span className="required">*</span></label>
                <input
                  type="number"
                  className="form-input"
                  value={adjustQuantity}
                  onChange={(e) => setAdjustQuantity(e.target.value)}
                  min="0"
                  step="0.01"
                />
              </div>

              <div className="form-item">
                <label className="form-label">调整原因</label>
                <textarea
                  className="form-textarea"
                  value={adjustReason}
                  onChange={(e) => setAdjustReason(e.target.value)}
                  placeholder="例如：供应商最小起订量为50箱、促销档期备货等"
                  rows={3}
                />
              </div>

              <div className="form-item">
                <label className="form-label">预估金额</label>
                <div className="form-value amount-value">
                  {formatMoney((parseFloat(adjustQuantity) || 0) * adjustItem.price)}
                </div>
              </div>
            </div>
            <div className="modal-footer">
              <button className="btn-cancel" onClick={() => setAdjustModalVisible(false)}>
                取消
              </button>
              <button className="btn-primary" onClick={handleAdjustConfirm}>
                确认调整
              </button>
            </div>
          </div>
        </div>
      )}

      {showSuccessToast && (
        <div className="toast toast-success">
          <span className="toast-icon">✓</span>
          <span>{successMessage}</span>
        </div>
      )}
    </div>
  );
}

export default Orders;
