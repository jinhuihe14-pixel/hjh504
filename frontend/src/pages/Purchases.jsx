import { useState, useEffect, useMemo } from 'react';
import { purchaseApi } from '../api';
import { formatNumber, formatMoney, formatDate } from '../utils/format';
import StatCard from '../components/StatCard';
import './Purchases.css';

const STATUS_OPTIONS = [
  { value: 'all', label: '全部状态' },
  { value: '待确认', label: '待确认' },
  { value: '已下单', label: '已下单' },
  { value: '配送中', label: '配送中' },
  { value: '已到货', label: '已到货' },
  { value: '已取消', label: '已取消' },
];

const STATUS_COLOR_MAP = {
  '待确认': 'warning',
  '已下单': 'info',
  '配送中': 'primary',
  '已到货': 'success',
  '已取消': 'default',
};

function Purchases() {
  const [purchaseOrders, setPurchaseOrders] = useState([]);
  const [loading, setLoading] = useState(false);
  const [selectedStatus, setSelectedStatus] = useState('all');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [expandedId, setExpandedId] = useState(null);

  const [arrivalModalVisible, setArrivalModalVisible] = useState(false);
  const [arrivalPo, setArrivalPo] = useState(null);
  const [arrivalItems, setArrivalItems] = useState([]);

  const [showToast, setShowToast] = useState(false);
  const [toastMessage, setToastMessage] = useState('');
  const [toastType, setToastType] = useState('success');

  useEffect(() => {
    loadPurchaseOrders();
  }, [selectedStatus, startDate, endDate]);

  const loadPurchaseOrders = async () => {
    setLoading(true);
    try {
      const params = {};
      if (selectedStatus !== 'all') {
        params.status = selectedStatus;
      }
      if (startDate) {
        params.start_date = startDate;
      }
      if (endDate) {
        params.end_date = endDate;
      }

      const result = await purchaseApi.getPurchaseOrders(params);
      setPurchaseOrders(result.items || []);
    } catch (error) {
      console.error('获取采购单列表失败:', error);
    } finally {
      setLoading(false);
    }
  };

  const stats = useMemo(() => {
    const total = purchaseOrders.length;
    const pendingCount = purchaseOrders.filter((o) => o.status === '待确认').length;
    const deliveringCount = purchaseOrders.filter((o) => o.status === '配送中').length;
    const totalAmount = purchaseOrders
      .filter((o) => o.status !== '已取消')
      .reduce((sum, o) => sum + o.total_amount, 0);
    return {
      total,
      pendingCount,
      deliveringCount,
      totalAmount,
    };
  }, [purchaseOrders]);

  const toggleExpand = (id) => {
    setExpandedId(expandedId === id ? null : id);
  };

  const showMessage = (message, type = 'success') => {
    setToastMessage(message);
    setToastType(type);
    setShowToast(true);
    setTimeout(() => setShowToast(false), 3000);
  };

  const handleConfirmOrder = async (po) => {
    if (!window.confirm(`确认下单采购单 ${po.po_no}？`)) {
      return;
    }
    try {
      await purchaseApi.updatePurchaseStatus(po.id, '已下单');
      showMessage('采购单已确认下单');
      loadPurchaseOrders();
    } catch (error) {
      console.error('确认下单失败:', error);
      showMessage('确认下单失败', 'error');
    }
  };

  const handleStartDelivery = async (po) => {
    if (!window.confirm(`确认采购单 ${po.po_no} 开始配送？`)) {
      return;
    }
    try {
      await purchaseApi.updatePurchaseStatus(po.id, '配送中');
      showMessage('采购单已标记为配送中');
      loadPurchaseOrders();
    } catch (error) {
      console.error('标记配送失败:', error);
      showMessage('操作失败', 'error');
    }
  };

  const handleOpenArrivalModal = (po) => {
    setArrivalPo(po);
    const items = po.items.map((item) => ({
      ...item,
      actual_arrival: item.adjusted_order,
    }));
    setArrivalItems(items);
    setArrivalModalVisible(true);
  };

  const handleArrivalQtyChange = (sku, value) => {
    const qty = parseFloat(value) || 0;
    setArrivalItems((prev) =>
      prev.map((item) =>
        item.sku === sku ? { ...item, actual_arrival: qty } : item
      )
    );
  };

  const handleConfirmArrival = async () => {
    if (!arrivalPo) return;

    const items = arrivalItems.map((item) => ({
      sku: item.sku,
      actual_arrival: item.actual_arrival,
    }));

    try {
      await purchaseApi.confirmArrival(arrivalPo.id, items);
      showMessage('到货确认成功，库存已更新');
      setArrivalModalVisible(false);
      setArrivalPo(null);
      loadPurchaseOrders();
    } catch (error) {
      console.error('到货确认失败:', error);
      showMessage('到货确认失败', 'error');
    }
  };

  const handleCancel = async (po) => {
    if (!window.confirm(`确认取消采购单 ${po.po_no}？此操作不可撤销。`)) {
      return;
    }
    try {
      await purchaseApi.updatePurchaseStatus(po.id, '已取消');
      showMessage('采购单已取消');
      loadPurchaseOrders();
    } catch (error) {
      console.error('取消采购单失败:', error);
      showMessage('操作失败', 'error');
    }
  };

  const getStatusClass = (status) => {
    return STATUS_COLOR_MAP[status] || 'default';
  };

  const renderActions = (po) => {
    const actions = [];

    if (po.status === '待确认') {
      actions.push(
        <button
          key="confirm"
          className="action-btn action-btn-primary"
          onClick={() => handleConfirmOrder(po)}
        >
          确认下单
        </button>
      );
      actions.push(
        <button
          key="cancel"
          className="action-btn action-btn-danger"
          onClick={() => handleCancel(po)}
        >
          取消
        </button>
      );
    } else if (po.status === '已下单') {
      actions.push(
        <button
          key="delivering"
          className="action-btn action-btn-primary"
          onClick={() => handleStartDelivery(po)}
        >
          开始配送
        </button>
      );
    } else if (po.status === '配送中') {
      actions.push(
        <button
          key="arrival"
          className="action-btn action-btn-success"
          onClick={() => handleOpenArrivalModal(po)}
        >
          标记到货
        </button>
      );
    }

    return actions;
  };

  return (
    <div className="page-container purchases-page">
      <h2 className="page-title">采购管理</h2>

      <div className="stats-grid">
        <StatCard
          title="采购单总数"
          value={formatNumber(stats.total)}
          theme="primary"
          icon="📋"
          suffix="单"
        />
        <StatCard
          title="待确认采购单"
          value={formatNumber(stats.pendingCount)}
          theme="warning"
          icon="⏳"
          suffix="单"
        />
        <StatCard
          title="配送中采购单"
          value={formatNumber(stats.deliveringCount)}
          theme="info"
          icon="🚚"
          suffix="单"
        />
        <StatCard
          title="采购总金额"
          value={formatMoney(stats.totalAmount)}
          theme="success"
          icon="💰"
        />
      </div>

      <div className="filter-bar">
        <div className="filter-left">
          <div className="filter-item">
            <label className="filter-label">状态</label>
            <select
              className="filter-select"
              value={selectedStatus}
              onChange={(e) => setSelectedStatus(e.target.value)}
            >
              {STATUS_OPTIONS.map((opt) => (
                <option key={opt.value} value={opt.value}>
                  {opt.label}
                </option>
              ))}
            </select>
          </div>

          <div className="filter-item">
            <label className="filter-label">开始日期</label>
            <input
              type="date"
              className="filter-select"
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
            />
          </div>

          <div className="filter-item">
            <label className="filter-label">结束日期</label>
            <input
              type="date"
              className="filter-select"
              value={endDate}
              onChange={(e) => setEndDate(e.target.value)}
            />
          </div>
        </div>

        <div className="filter-right">
          <button className="secondary-btn" onClick={loadPurchaseOrders}>
            🔄 刷新
          </button>
        </div>
      </div>

      <div className="purchase-list">
        {loading ? (
          <div className="list-loading">
            <div className="loading-spinner" />
            <span>加载中...</span>
          </div>
        ) : purchaseOrders.length === 0 ? (
          <div className="empty-state">
            <div className="empty-icon">📭</div>
            <p>暂无采购单</p>
          </div>
        ) : (
          purchaseOrders.map((po) => (
            <div key={po.id} className={`purchase-card ${expandedId === po.id ? 'expanded' : ''}`}>
              <div className="purchase-header" onClick={() => toggleExpand(po.id)}>
                <div className="purchase-main-info">
                  <div className="po-no">{po.po_no}</div>
                  <div className="po-store">{po.store_name}</div>
                  <span className={`status-badge status-${getStatusClass(po.status)}`}>
                    {po.status}
                  </span>
                </div>
                <div className="purchase-summary">
                  <div className="summary-item">
                    <span className="summary-label">供应商</span>
                    <span className="summary-value">{po.supplier}</span>
                  </div>
                  <div className="summary-item">
                    <span className="summary-label">商品数</span>
                    <span className="summary-value">{po.items.length} 种</span>
                  </div>
                  <div className="summary-item">
                    <span className="summary-label">总数量</span>
                    <span className="summary-value">{formatNumber(po.total_quantity)}</span>
                  </div>
                  <div className="summary-item">
                    <span className="summary-label">总金额</span>
                    <span className="summary-value amount">{formatMoney(po.total_amount)}</span>
                  </div>
                  <div className="summary-item">
                    <span className="summary-label">预计到货</span>
                    <span className="summary-value">{formatDate(po.estimated_arrival_date)}</span>
                  </div>
                </div>
                <div className="expand-icon">
                  {expandedId === po.id ? '▲' : '▼'}
                </div>
              </div>

              {expandedId === po.id && (
                <div className="purchase-detail">
                  <div className="detail-section">
                    <h4 className="detail-title">商品明细</h4>
                    <div className="items-table">
                      <table>
                        <thead>
                          <tr>
                            <th>SKU</th>
                            <th>商品名称</th>
                            <th>品类</th>
                            <th className="text-right">建议订货量</th>
                            <th className="text-right">实际订货量</th>
                            <th className="text-right">实际到货量</th>
                            <th className="text-right">单价</th>
                            <th className="text-right">金额</th>
                            <th>状态</th>
                          </tr>
                        </thead>
                        <tbody>
                          {po.items.map((item) => (
                            <tr key={item.sku}>
                              <td>{item.sku}</td>
                              <td>{item.product_name}</td>
                              <td>{item.category}</td>
                              <td className="text-right">{formatNumber(item.suggested_order)}</td>
                              <td className="text-right">
                                <span className={item.is_adjusted ? 'adjusted-text' : ''}>
                                  {formatNumber(item.adjusted_order)}
                                </span>
                                {item.is_adjusted && (
                                  <span className="adjusted-mini-badge">调</span>
                                )}
                              </td>
                              <td className="text-right">{formatNumber(item.actual_arrival || 0)}</td>
                              <td className="text-right">{formatMoney(item.price)}</td>
                              <td className="text-right">{formatMoney(item.amount)}</td>
                              <td>
                                {item.adjust_reason && (
                                  <span className="reason-tag" title={item.adjust_reason}>
                                    有调整原因
                                  </span>
                                )}
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>

                  <div className="detail-actions">
                    {renderActions(po)}
                  </div>
                </div>
              )}

              {expandedId !== po.id && (
                <div className="purchase-actions-inline" onClick={(e) => e.stopPropagation()}>
                  {renderActions(po)}
                </div>
              )}
            </div>
          ))
        )}
      </div>

      {arrivalModalVisible && arrivalPo && (
        <div className="modal-overlay" onClick={() => setArrivalModalVisible(false)}>
          <div className="modal-content arrival-modal" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h3>到货确认 - {arrivalPo.po_no}</h3>
              <button className="modal-close" onClick={() => setArrivalModalVisible(false)}>
                ✕
              </button>
            </div>
            <div className="modal-body">
              <p className="modal-tip">请逐项输入实际到货数量，确认后将自动更新库存。</p>

              <div className="arrival-items-list">
                {arrivalItems.map((item) => (
                  <div key={item.sku} className="arrival-item-row">
                    <div className="arrival-item-info">
                      <div className="arrival-item-name">{item.product_name}</div>
                      <div className="arrival-item-sku">
                        SKU: {item.sku} | 订货量: {formatNumber(item.adjusted_order)} {item.unit}
                      </div>
                    </div>
                    <div className="arrival-item-input">
                      <input
                        type="number"
                        value={item.actual_arrival}
                        onChange={(e) => handleArrivalQtyChange(item.sku, e.target.value)}
                        min="0"
                        step="0.01"
                      />
                      <span className="unit-label">{item.unit}</span>
                    </div>
                  </div>
                ))}
              </div>

              <div className="arrival-summary">
                <div className="arrival-summary-item">
                  <span>订货总数量：</span>
                  <strong>{formatNumber(arrivalItems.reduce((s, i) => s + i.adjusted_order, 0))}</strong>
                </div>
                <div className="arrival-summary-item">
                  <span>实际到货总数量：</span>
                  <strong className="text-success">
                    {formatNumber(arrivalItems.reduce((s, i) => s + i.actual_arrival, 0))}
                  </strong>
                </div>
                <div className="arrival-summary-item">
                  <span>到货总金额：</span>
                  <strong className="text-success">
                    {formatMoney(arrivalItems.reduce((s, i) => s + i.actual_arrival * i.price, 0))}
                  </strong>
                </div>
              </div>
            </div>
            <div className="modal-footer">
              <button className="btn-cancel" onClick={() => setArrivalModalVisible(false)}>
                取消
              </button>
              <button className="btn-primary" onClick={handleConfirmArrival}>
                确认到货
              </button>
            </div>
          </div>
        </div>
      )}

      {showToast && (
        <div className={`toast toast-${toastType}`}>
          <span className="toast-icon">{toastType === 'success' ? '✓' : '✕'}</span>
          <span>{toastMessage}</span>
        </div>
      )}
    </div>
  );
}

export default Purchases;
