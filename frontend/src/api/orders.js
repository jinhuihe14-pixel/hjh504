import api from './index';

const SHORT_LIFE_CATEGORIES = ['冷藏鲜奶'];

function isShortLifeCategory(category) {
  return SHORT_LIFE_CATEGORIES.includes(category);
}

function adaptOrderItem(item) {
  const category = item.category || '';
  const forecastDemand = item.forecast_demand !== undefined ? item.forecast_demand : (item.forecast_7d || 0);
  const currentStock = item.current_stock || 0;
  const suggestedOrder = item.suggested_order || 0;
  const safetyStock = item.safety_stock || 0;
  const turnoverDays = forecastDemand > 0 ? (currentStock / forecastDemand) * 7 : 999;
  const safetyFactor = safetyStock > 0 ? forecastDemand / safetyStock : 1.2;

  return {
    sku: item.sku,
    name: item.product_name || item.name,
    category: category,
    category_name: category,
    current_stock: currentStock,
    in_transit: item.in_transit || 0,
    forecast_7d: forecastDemand,
    forecast_demand: forecastDemand,
    suggested_order: suggestedOrder,
    safety_factor: Number(safetyFactor.toFixed(2)),
    safety_stock: safetyStock,
    turnover_days: Number(turnoverDays.toFixed(1)),
    is_short_life: item.is_short_life || isShortLifeCategory(category) || false,
    price: item.price || 0,
    unit: item.unit || '件',
    order_reason: item.order_reason || '常规补货',
    urgency: item.urgency || 'normal',
  };
}

function generateMockSuggestions(storeId, categoryId) {
  const ALL_SKUS = [
    { id: 'SKU001', name: '泡面桶装', category: '速食饮料' },
    { id: 'SKU002', name: '瓶装可乐', category: '速食饮料' },
    { id: 'SKU003', name: '瓶装矿泉水', category: '速食饮料' },
    { id: 'SKU004', name: '功能饮料', category: '速食饮料' },
    { id: 'SKU005', name: '热饮奶茶粉', category: '速食饮料' },
    { id: 'SKU006', name: '卫生纸卷', category: '日用百货' },
    { id: 'SKU007', name: '洗衣液袋装', category: '日用百货' },
    { id: 'SKU008', name: '洗发水袋装', category: '日用百货' },
    { id: 'SKU009', name: '牙刷', category: '日用百货' },
    { id: 'SKU010', name: '香皂', category: '日用百货' },
    { id: 'SKU011', name: '巴氏鲜奶250ml', category: '冷藏鲜奶', is_short_life: true },
    { id: 'SKU012', name: '鲜牛奶950ml', category: '冷藏鲜奶', is_short_life: true },
    { id: 'SKU013', name: '酸奶杯装', category: '冷藏鲜奶', is_short_life: true },
    { id: 'SKU014', name: '风味酸奶', category: '冷藏鲜奶', is_short_life: true },
    { id: 'SKU015', name: '薯片大包', category: '零食' },
    { id: 'SKU016', name: '巧克力', category: '零食' },
    { id: 'SKU017', name: '饼干盒装', category: '零食' },
    { id: 'SKU018', name: '坚果混合', category: '零食' },
    { id: 'SKU019', name: '果冻', category: '零食' },
  ];

  let skus = ALL_SKUS;
  if (categoryId && categoryId !== 'all') {
    skus = ALL_SKUS.filter((s) => s.category === categoryId);
  }

  return skus.map((sku, index) => {
    const basePrice = (5 + Math.random() * 25).toFixed(2);
    const forecast7d = Math.round(50 + Math.random() * 200);
    const currentStock = Math.round(forecast7d * (0.3 + Math.random() * 0.5));
    const inTransit = Math.random() > 0.5 ? Math.round(forecast7d * 0.2) : 0;
    const safetyFactor = 1.1 + Math.random() * 0.4;
    const suggestedOrder = Math.max(
      0,
      Math.round((forecast7d * safetyFactor - currentStock - inTransit))
    );
    const turnoverDays = forecast7d > 0 ? ((currentStock + inTransit) / forecast7d) * 7 : 999;

    return {
      sku: sku.id,
      name: sku.name,
      category: sku.category,
      category_name: mapCategoryToName(sku.category),
      current_stock: currentStock,
      in_transit: inTransit,
      forecast_7d: forecast7d,
      suggested_order: suggestedOrder,
      safety_factor: Number(safetyFactor.toFixed(2)),
      turnover_days: Number(turnoverDays.toFixed(1)),
      is_short_life: sku.is_short_life || false,
      price: Number(basePrice),
    };
  });
}

export async function getStoreOrders(storeId) {
  try {
    const data = await api.get(`/orders/${storeId}`);
    if (data && data.items) {
      const items = data.items.map(adaptOrderItem);
      const totalQuantity = items.reduce((sum, item) => sum + item.suggested_order, 0);
      const totalAmount = items.reduce((sum, item) => sum + item.suggested_order * item.price, 0);
      const shortLifeCount = items.filter((item) => item.is_short_life).length;
      const avgTurnover = items.length > 0
        ? items.reduce((sum, item) => sum + item.turnover_days, 0) / items.length
        : 0;

      return {
        store_id: data.store_id || storeId,
        store_name: data.store_name || '',
        order_date: data.order_date || new Date().toISOString().split('T')[0],
        total_items: data.total_items || items.length,
        total_quantity: totalQuantity,
        total_amount: Number(totalAmount.toFixed(2)),
        total_order_value: data.total_order_value || totalAmount,
        orders: items,
        items: items,
        summary: {
          total_quantity: totalQuantity,
          total_amount: Number(totalAmount.toFixed(2)),
          short_life_count: shortLifeCount,
          avg_turnover_days: Number(avgTurnover.toFixed(1)),
        },
      };
    }
    throw new Error('订单数据为空');
  } catch (error) {
    console.error('获取门店订货建议失败，使用模拟数据:', error);
    const suggestions = generateMockSuggestions(storeId, 'all');
    const totalQuantity = suggestions.reduce((sum, item) => sum + item.suggested_order, 0);
    const totalAmount = suggestions.reduce((sum, item) => sum + item.suggested_order * item.price, 0);
    const shortLifeCount = suggestions.filter((item) => item.is_short_life).length;
    const avgTurnover = suggestions.length > 0
      ? suggestions.reduce((sum, item) => sum + item.turnover_days, 0) / suggestions.length
      : 0;

    return {
      store_id: storeId,
      store_name: '中心店',
      order_date: new Date().toISOString().split('T')[0],
      total_items: suggestions.length,
      total_quantity: totalQuantity,
      total_amount: Number(totalAmount.toFixed(2)),
      orders: suggestions,
      items: suggestions,
      summary: {
        total_quantity: totalQuantity,
        total_amount: Number(totalAmount.toFixed(2)),
        short_life_count: shortLifeCount,
        avg_turnover_days: Number(avgTurnover.toFixed(1)),
      },
    };
  }
}

export async function getCategoryOrders(category) {
  try {
    const categoryName = category;
    const data = await api.get(`/orders/category/${encodeURIComponent(categoryName)}`);
    if (data && data.items) {
      const items = data.items.map((item) => ({
        store_id: item.store_id || item.id,
        store_name: item.store_name || item.name,
        sku_count: item.sku_count || item.total_items || 0,
        suggested_order: item.suggested_order || item.total_quantity || 0,
        forecast_7d: item.forecast_7d || item.forecast_demand || 0,
      }));

      return {
        category: categoryName,
        total_stores: data.total_stores || items.length,
        total_quantity: items.reduce((sum, item) => sum + item.suggested_order, 0),
        orders: items,
        items: items,
      };
    }
    throw new Error('品类订单数据为空');
  } catch (error) {
    console.error('获取品类订货建议失败，使用模拟数据:', error);
    const stores = [
      { id: 'store_001', name: '便利店1号店' },
      { id: 'store_002', name: '便利店2号店' },
      { id: 'store_003', name: '便利店3号店' },
      { id: 'store_004', name: '便利店4号店' },
      { id: 'store_005', name: '便利店5号店' },
      { id: 'store_006', name: '便利店6号店' },
      { id: 'store_007', name: '便利店7号店' },
      { id: 'store_008', name: '便利店8号店' },
    ];

    const orders = stores.map((store) => ({
      store_id: store.id,
      store_name: store.name,
      sku_count: Math.floor(5 + Math.random() * 5),
      suggested_order: Math.round(100 + Math.random() * 200),
      forecast_7d: Math.round(150 + Math.random() * 200),
    }));

    const categoryName = mapCategoryToName(category) || '饮料';

    return {
      category: categoryName,
      total_stores: orders.length,
      total_quantity: orders.reduce((sum, item) => sum + item.suggested_order, 0),
      orders: orders,
      items: orders,
    };
  }
}

export async function getOrderSuggestions(storeId, categoryId) {
  if (storeId && storeId !== 'all') {
    const data = await getStoreOrders(storeId);
    let items = data.items || data.orders || [];
    if (categoryId && categoryId !== 'all') {
      items = items.filter((item) => item.category === categoryId);
    }
    return items;
  } else {
    const data = await getCategoryOrders(categoryId || 'drinks');
    return data.items || data.orders || [];
  }
}

export async function getSummary(storeId, categoryId) {
  if (storeId && storeId !== 'all') {
    const data = await getStoreOrders(storeId);
    return data.summary || {
      total_quantity: data.total_quantity || 0,
      total_amount: data.total_amount || 0,
      short_life_count: 0,
      avg_turnover_days: 0,
    };
  } else {
    const suggestions = generateMockSuggestions('all', categoryId);
    const totalQuantity = suggestions.reduce((sum, item) => sum + item.suggested_order, 0);
    const totalAmount = suggestions.reduce((sum, item) => sum + item.suggested_order * item.price, 0);
    const shortLifeCount = suggestions.filter((item) => item.is_short_life).length;
    const avgTurnover = suggestions.length > 0
      ? suggestions.reduce((sum, item) => sum + item.turnover_days, 0) / suggestions.length
      : 0;

    return {
      total_quantity: totalQuantity,
      total_amount: Number(totalAmount.toFixed(2)),
      short_life_count: shortLifeCount,
      avg_turnover_days: Number(avgTurnover.toFixed(1)),
    };
  }
}

export default {
  getStoreOrders,
  getCategoryOrders,
  getOrderSuggestions,
  getSummary,
};
