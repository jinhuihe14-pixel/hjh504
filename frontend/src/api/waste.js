import api from './index';

const CATEGORY_NAME_MAP = {
  '速食饮料': 'drinks',
  '日用百货': 'daily',
  '冷藏鲜奶': 'fresh',
  '零食': 'snacks',
  '饮料': 'drinks',
  '鲜食': 'fresh',
  '速食食品': 'food',
  '日用': 'daily',
  '烟酒': 'tobacco',
  '冰淇淋': 'ice',
};

const CATEGORY_ID_TO_NAME = {
  drinks: '饮料',
  snacks: '零食',
  daily: '日用百货',
  food: '速食食品',
  fresh: '鲜食',
  tobacco: '烟酒',
  ice: '冰淇淋',
};

function mapCategoryToId(categoryName) {
  return CATEGORY_NAME_MAP[categoryName] || categoryName;
}

function mapCategoryToName(categoryId) {
  return CATEGORY_ID_TO_NAME[categoryId] || categoryId;
}

function adaptWasteItem(item) {
  const categoryId = mapCategoryToId(item.category || '');
  const riskLevel = item.risk_level || item.riskLevel || 'low';

  return {
    sku: item.sku,
    name: item.product_name || item.name,
    category: categoryId,
    category_name: mapCategoryToName(categoryId),
    waste_quantity: item.waste_quantity || item.wasteQty || 0,
    waste_amount: item.waste_amount || item.wasteAmount || 0,
    waste_rate: item.waste_rate || item.wasteRate || 0,
    unit: item.unit || '件',
    risk_level: riskLevel,
    riskLevel: riskLevel,
    suggestion: item.suggestion || '',
    avg_daily_sales: item.avg_daily_sales || 0,
    avg_waste: item.avg_waste || 0,
  };
}

function getMockStoreWaste(storeId) {
  const wasteRecords = [
    { sku: 'SKU015', name: '鲜牛奶 250ml', category: '鲜食', waste_quantity: 12, waste_amount: 66, waste_rate: 0.15, unit: '盒' },
    { sku: 'SKU016', name: '三明治 火腿鸡蛋', category: '鲜食', waste_quantity: 8, waste_amount: 64, waste_rate: 0.22, unit: '个' },
    { sku: 'SKU017', name: '关东煮 套餐', category: '鲜食', waste_quantity: 6, waste_amount: 72, waste_rate: 0.18, unit: '份' },
    { sku: 'SKU004', name: '乐事薯片 原味 75g', category: '零食', waste_quantity: 3, waste_amount: 25.5, waste_rate: 0.05, unit: '袋' },
    { sku: 'SKU001', name: '可口可乐 330ml', category: '饮料', waste_quantity: 2, waste_amount: 7, waste_rate: 0.02, unit: '瓶' },
  ];

  const trend = [];
  for (let i = 29; i >= 0; i--) {
    const date = new Date();
    date.setDate(date.getDate() - i);
    trend.push({
      date: `${date.getMonth() + 1}/${date.getDate()}`,
      waste_rate: 0.08 + Math.random() * 0.06,
      waste_amount: 150 + Math.random() * 100,
    });
  }

  return {
    store_id: storeId,
    store_name: '中心店',
    period: '近30天',
    total_waste_amount: 2856.5,
    total_waste_quantity: 385,
    avg_waste_rate: 0.105,
    waste_by_category: [
      { name: '鲜食', value: 1850 },
      { name: '饮料', value: 420 },
      { name: '零食', value: 350 },
      { name: '速食食品', value: 236.5 },
    ],
    waste_records: wasteRecords,
    trend,
  };
}

function getMockHighRiskProducts() {
  const products = [
    { sku: 'SKU016', name: '三明治 火腿鸡蛋', category: '鲜食', risk_level: 'high', waste_rate: 0.22, avg_daily_sales: 25, avg_waste: 5.5, unit: '个', suggestion: '建议减少订货量15%' },
    { sku: 'SKU017', name: '关东煮 套餐', category: '鲜食', risk_level: 'high', waste_rate: 0.18, avg_daily_sales: 18, avg_waste: 3.2, unit: '份', suggestion: '建议优化进货频次' },
    { sku: 'SKU015', name: '鲜牛奶 250ml', category: '鲜食', risk_level: 'high', waste_rate: 0.15, avg_daily_sales: 35, avg_waste: 5.3, unit: '盒', suggestion: '建议调整安全库存' },
    { sku: 'SKU019', name: '可爱多 甜筒', category: '冰淇淋', risk_level: 'medium', waste_rate: 0.095, avg_daily_sales: 15, avg_waste: 1.4, unit: '支', suggestion: '建议增加促销活动' },
    { sku: 'SKU009', name: '自热米饭 红烧牛肉', category: '速食食品', risk_level: 'medium', waste_rate: 0.088, avg_daily_sales: 8, avg_waste: 0.7, unit: '盒', suggestion: '建议优化陈列位置' },
    { sku: 'SKU006', name: '德芙巧克力 43g', category: '零食', risk_level: 'medium', waste_rate: 0.072, avg_daily_sales: 12, avg_waste: 0.9, unit: '块', suggestion: '建议检查保质期管理' },
    { sku: 'SKU004', name: '乐事薯片 原味 75g', category: '零食', risk_level: 'low', waste_rate: 0.05, avg_daily_sales: 20, avg_waste: 1.0, unit: '袋', suggestion: '保持现有订货策略' },
    { sku: 'SKU002', name: '农夫山泉 550ml', category: '饮料', risk_level: 'low', waste_rate: 0.025, avg_daily_sales: 45, avg_waste: 1.1, unit: '瓶', suggestion: '保持现有订货策略' },
  ];

  return {
    total: products.length,
    total_products: products.length,
    high_risk: products.filter((p) => p.risk_level === 'high').length,
    medium_risk: products.filter((p) => p.risk_level === 'medium').length,
    low_risk: products.filter((p) => p.risk_level === 'low').length,
    items: products,
    products,
  };
}

export async function getStoreWaste(storeId) {
  try {
    const data = await api.get(`/waste/${storeId}`);
    if (data) {
      const wasteRecords = (data.items || data.waste_records || []).map(adaptWasteItem);

      return {
        store_id: data.store_id || storeId,
        store_name: data.store_name || '',
        period: data.period || '近30天',
        total_waste_amount: data.total_waste_amount || data.waste_amount || 0,
        total_waste_quantity: data.total_waste_quantity || data.waste_quantity || 0,
        avg_waste_rate: data.avg_waste_rate || data.waste_rate || 0,
        waste_by_category: data.waste_by_category || data.category_waste || [],
        waste_records: wasteRecords,
        items: wasteRecords,
        trend: data.trend || [],
      };
    }
    throw new Error('损耗数据为空');
  } catch (error) {
    console.error('获取门店损耗分析失败，使用模拟数据:', error);
    return getMockStoreWaste(storeId);
  }
}

export async function getHighRiskProducts() {
  try {
    const data = await api.get('/waste/high-risk');
    if (data && data.items) {
      const items = data.items.map(adaptWasteItem);
      return {
        total: data.total || items.length,
        total_products: data.total || items.length,
        high_risk: items.filter((p) => p.risk_level === 'high').length,
        medium_risk: items.filter((p) => p.risk_level === 'medium').length,
        low_risk: items.filter((p) => p.risk_level === 'low').length,
        items: items,
        products: items,
      };
    }
    throw new Error('高风险商品数据为空');
  } catch (error) {
    console.error('获取高风险商品失败，使用模拟数据:', error);
    return getMockHighRiskProducts();
  }
}

export async function getWeeklyComparison(storeId) {
  try {
    const params = storeId && storeId !== 'all' ? { store_id: storeId } : {};
    const data = await api.get('/waste/weekly-comparison', { params });
    if (data) {
      return data;
    }
    throw new Error('周对比数据为空');
  } catch (error) {
    console.error('获取周对比数据失败，使用模拟数据:', error);
    return getMockWeeklyComparison();
  }
}

function getMockWeeklyComparison() {
  return {
    this_week: {
      total_waste_amount: 28650.5,
      avg_waste_rate: 0.032,
      high_risk_count: 12,
    },
    last_week: {
      total_waste_amount: 30420.0,
      avg_waste_rate: 0.035,
      high_risk_count: 15,
    },
    amount_change_rate: -0.058,
    rate_change_rate: -0.086,
    risk_change_rate: -0.2,
  };
}

export async function getProductWasteDetail(sku, storeId) {
  try {
    const params = storeId && storeId !== 'all' ? { store_id: storeId } : {};
    const data = await api.get(`/waste/product-detail/${sku}`, { params });
    if (data) {
      return data;
    }
    throw new Error('商品详情数据为空');
  } catch (error) {
    console.error('获取商品损耗详情失败，使用模拟数据:', error);
    return getMockProductDetail(sku);
  }
}

function getMockProductDetail(sku) {
  const weeklyTrend = [];
  const today = new Date();
  const currentWeek = Math.ceil((today - new Date(today.getFullYear(), 0, 1)) / (7 * 24 * 60 * 60 * 1000));
  const weekNum = Math.ceil(currentWeek);
  const baseWasteRate = 0.08 + Math.random() * 0.1;

  for (let i = 3; i >= 0; i--) {
    const w = weekNum - i;
    const variation = (Math.random() - 0.5) * 0.03;
    weeklyTrend.push({
      week_label: `第${w}周`,
      waste_quantity: Math.round(20 + Math.random() * 30),
      waste_amount: Math.round(150 + Math.random() * 200),
      waste_rate: Number((baseWasteRate + variation).toFixed(4)),
    });
  }

  const totalWaste = weeklyTrend.reduce((sum, w) => sum + w.waste_amount, 0);
  const avgRate = weeklyTrend.reduce((sum, w) => sum + w.waste_rate, 0) / weeklyTrend.length;

  let reasonDistribution;
  if (avgRate >= 0.15) {
    reasonDistribution = [
      { name: '过期', value: Math.round(totalWaste * 0.5) },
      { name: '破损', value: Math.round(totalWaste * 0.3) },
      { name: '滞销', value: Math.round(totalWaste * 0.2) },
    ];
  } else if (avgRate >= 0.08) {
    reasonDistribution = [
      { name: '过期', value: Math.round(totalWaste * 0.35) },
      { name: '破损', value: Math.round(totalWaste * 0.35) },
      { name: '滞销', value: Math.round(totalWaste * 0.3) },
    ];
  } else {
    reasonDistribution = [
      { name: '过期', value: Math.round(totalWaste * 0.2) },
      { name: '破损', value: Math.round(totalWaste * 0.3) },
      { name: '滞销', value: Math.round(totalWaste * 0.5) },
    ];
  }

  const suggestions = [];
  if (avgRate >= 0.15) {
    suggestions.push('损耗率极高，建议立即大幅减少订货量');
    suggestions.push('建议开展促销活动，加快库存周转');
  } else if (avgRate >= 0.08) {
    suggestions.push('损耗率偏高，建议适当减少订货量');
    suggestions.push('建议优化安全库存设置');
  } else {
    suggestions.push('损耗水平正常，建议持续监控');
  }

  return {
    sku: sku,
    product_name: sku,
    category: '鲜食',
    weekly_trend: weeklyTrend,
    reason_distribution: reasonDistribution,
    suggestions: suggestions,
  };
}

export default {
  getStoreWaste,
  getHighRiskProducts,
  getWeeklyComparison,
  getProductWasteDetail,
};
