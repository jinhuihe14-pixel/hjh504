import api from './index';

const mockProducts = [
  { sku: 'SKU001', name: '可口可乐 330ml', category: 'drinks', price: 3.5, cost: 2.2, stock: 156, unit: '瓶', shelf_life: 180 },
  { sku: 'SKU002', name: '农夫山泉 550ml', category: 'drinks', price: 2.0, cost: 1.0, stock: 320, unit: '瓶', shelf_life: 365 },
  { sku: 'SKU003', name: '百事可乐 500ml', category: 'drinks', price: 3.5, cost: 2.3, stock: 120, unit: '瓶', shelf_life: 180 },
  { sku: 'SKU004', name: '乐事薯片 原味 75g', category: 'snacks', price: 8.5, cost: 5.2, stock: 85, unit: '袋', shelf_life: 120 },
  { sku: 'SKU005', name: '奥利奥饼干 原味 97g', category: 'snacks', price: 12.0, cost: 7.5, stock: 68, unit: '盒', shelf_life: 180 },
  { sku: 'SKU006', name: '德芙巧克力 43g', category: 'snacks', price: 9.9, cost: 6.8, stock: 45, unit: '块', shelf_life: 300 },
  { sku: 'SKU007', name: '康师傅方便面 红烧牛肉', category: 'food', price: 4.5, cost: 2.8, stock: 200, unit: '桶', shelf_life: 180 },
  { sku: 'SKU008', name: '统一老坛酸菜牛肉面', category: 'food', price: 4.5, cost: 2.9, stock: 180, unit: '桶', shelf_life: 180 },
  { sku: 'SKU009', name: '自热米饭 红烧牛肉', category: 'food', price: 18.0, cost: 11.5, stock: 32, unit: '盒', shelf_life: 90 },
  { sku: 'SKU010', name: '维达纸巾 10包装', category: 'daily', price: 15.0, cost: 9.8, stock: 56, unit: '提', shelf_life: 730 },
  { sku: 'SKU011', name: '舒肤佳香皂 125g', category: 'daily', price: 8.5, cost: 5.5, stock: 42, unit: '块', shelf_life: 365 },
  { sku: 'SKU012', name: '高露洁牙膏 140g', category: 'daily', price: 15.9, cost: 10.2, stock: 38, unit: '支', shelf_life: 540 },
  { sku: 'SKU013', name: '中华香烟 硬盒', category: 'tobacco', price: 45.0, cost: 38.0, stock: 25, unit: '盒', shelf_life: 730 },
  { sku: 'SKU014', name: '青岛啤酒 500ml', category: 'tobacco', price: 6.5, cost: 4.2, stock: 120, unit: '罐', shelf_life: 180 },
  { sku: 'SKU015', name: '鲜牛奶 250ml', category: 'fresh', price: 5.5, cost: 3.8, stock: 48, unit: '盒', shelf_life: 7 },
  { sku: 'SKU016', name: '三明治 火腿鸡蛋', category: 'fresh', price: 8.0, cost: 5.0, stock: 20, unit: '个', shelf_life: 1 },
  { sku: 'SKU017', name: '关东煮 套餐', category: 'fresh', price: 12.0, cost: 6.5, stock: 30, unit: '份', shelf_life: 1 },
  { sku: 'SKU018', name: '哈根达斯 小杯', category: 'ice', price: 35.0, cost: 22.0, stock: 15, unit: '杯', shelf_life: 180 },
  { sku: 'SKU019', name: '可爱多 甜筒', category: 'ice', price: 8.0, cost: 4.5, stock: 60, unit: '支', shelf_life: 180 },
];

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

function adaptProductItem(item) {
  const categoryId = mapCategoryToId(item.category || '');
  const shelfLife = item.shelf_life_days || item.shelf_life || 365;
  const isShortShelf = shelfLife <= 30;

  return {
    sku: item.sku,
    name: item.name,
    category: categoryId,
    category_name: mapCategoryToName(categoryId),
    price: item.price || 0,
    cost: item.cost || 0,
    stock: item.stock || item.current_stock || 0,
    unit: item.unit || '件',
    shelf_life: shelfLife,
    shelfLife: shelfLife,
    isShortShelf: isShortShelf,
    is_short_life: isShortShelf,
    status: item.status || 'active',
    id: item.sku,
  };
}

function getMockProducts(category) {
  if (category && category !== 'all') {
    return mockProducts.filter((p) => p.category === category);
  }
  return mockProducts;
}

function getMockProductDetail(sku) {
  const product = mockProducts.find((p) => p.sku === sku);
  if (product) {
    return {
      ...product,
      description: '优质商品，品质保证',
      barcode: '69' + Math.floor(Math.random() * 10000000000).toString().padStart(11, '0'),
      brand: '品牌商',
      monthly_sales: Math.floor(500 + Math.random() * 2000),
      monthly_quantity: Math.floor(100 + Math.random() * 500),
      sales_trend: Array.from({ length: 30 }, () => Math.floor(10 + Math.random() * 30)),
      stock_history: Array.from({ length: 30 }, () => Math.floor(30 + Math.random() * 100)),
    };
  }
  return null;
}

export async function getProducts(category) {
  try {
    const params = new URLSearchParams();
    if (category && category !== 'all') {
      const categoryName = mapCategoryToName(category);
      params.append('category', categoryName);
    }
    const queryString = params.toString() ? `?${params.toString()}` : '';
    const data = await api.get(`/products${queryString}`);

    if (data && data.items) {
      return data.items.map(adaptProductItem);
    }
    return [];
  } catch (error) {
    console.error('获取商品列表失败，使用模拟数据:', error);
    return getMockProducts(category);
  }
}

export async function getProductDetail(sku) {
  try {
    const data = await api.get(`/products/${sku}`);
    if (data) {
      const adapted = adaptProductItem(data);
      return {
        ...adapted,
        description: data.description || data.desc || '优质商品，品质保证',
        barcode: data.barcode || '',
        brand: data.brand || '-',
        monthly_sales: data.monthly_sales || data.month_sales || 0,
        monthly_quantity: data.monthly_quantity || data.month_quantity || 0,
        sales_trend: data.sales_trend || Array.from({ length: 30 }, () => Math.floor(10 + Math.random() * 30)),
        stock_history: data.stock_history || Array.from({ length: 30 }, () => Math.floor(30 + Math.random() * 100)),
      };
    }
    throw new Error('商品不存在');
  } catch (error) {
    console.error('获取商品详情失败，使用模拟数据:', error);
    const mockDetail = getMockProductDetail(sku);
    if (mockDetail) {
      return mockDetail;
    }
    throw error;
  }
}

export default {
  getProducts,
  getProductDetail,
};
