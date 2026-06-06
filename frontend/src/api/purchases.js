import api from './index';

export async function getPurchaseOrders(params = {}) {
  const query = new URLSearchParams();
  Object.keys(params).forEach((key) => {
    if (params[key] !== undefined && params[key] !== null && params[key] !== '') {
      query.append(key, params[key]);
    }
  });
  const queryStr = query.toString() ? `?${query.toString()}` : '';
  const data = await api.get(`/purchases${queryStr}`);
  return data;
}

export async function getPurchaseOrderDetail(poId) {
  const data = await api.get(`/purchases/${poId}`);
  return data;
}

export async function createPurchaseOrder(orderData) {
  const data = await api.post('/purchases', orderData);
  return data;
}

export async function updatePurchaseStatus(poId, status) {
  const data = await api.put(`/purchases/${poId}/status`, { status });
  return data;
}

export async function confirmArrival(poId, items) {
  const data = await api.post(`/purchases/${poId}/confirm-arrival`, { items });
  return data;
}

export async function getPurchaseOverview() {
  const data = await api.get('/purchases/overview/stats');
  return data;
}

export default {
  getPurchaseOrders,
  getPurchaseOrderDetail,
  createPurchaseOrder,
  updatePurchaseStatus,
  confirmArrival,
  getPurchaseOverview,
};
