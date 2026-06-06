import api from './index';

const mockSummary = {
  total_stores: 8,
  total_products: 19,
  today_sales_amount: 28288.5,
  today_sales_quantity: 3850,
  waste_rate: 0.1064,
  order_fulfillment_rate: 0.95,
  forecast_accuracy: 0.88,
};

function getMockWeeklyReport() {
  return {
    week_start_date: '2024-01-01',
    week_end_date: '2024-01-07',
    total_sales: 186500,
    total_quantity: 25600,
    avg_waste_rate: 0.098,
    avg_forecast_accuracy: 0.87,
    top_products: [
      { sku: 'SKU001', name: '可口可乐 330ml', sales: 12500, quantity: 2500 },
      { sku: 'SKU002', name: '农夫山泉 550ml', sales: 9800, quantity: 2800 },
      { sku: 'SKU003', name: '乐事薯片 原味', sales: 7600, quantity: 1200 },
    ],
  };
}

function getMockSalesTrend(days = 30) {
  const categories = ['饮料', '零食', '速食食品', '日用百货', '鲜食'];
  const colors = ['#1e3a5f', '#10b981', '#f97316', '#8b5cf6', '#06b6d4'];
  const xAxisData = [];
  const data = [];

  const today = new Date();
  for (let i = days - 1; i >= 0; i--) {
    const date = new Date(today);
    date.setDate(date.getDate() - i);
    xAxisData.push(`${date.getMonth() + 1}/${date.getDate()}`);
  }

  const baseValues = [1200, 800, 600, 400, 300];
  categories.forEach((category, index) => {
    const seriesData = [];
    for (let i = 0; i < days; i++) {
      const base = baseValues[index];
      const variation = Math.sin(i * 0.3 + index) * base * 0.2;
      const trend = i * base * 0.005;
      const random = (Math.random() - 0.5) * base * 0.1;
      seriesData.push(Math.round(base + variation + trend + random));
    }
    data.push({
      name: category,
      data: seriesData,
      color: colors[index],
    });
  });

  return {
    xAxisData,
    data,
    legend: categories,
  };
}

function getMockCategorySales() {
  return [
    { name: '饮料', value: 9850 },
    { name: '零食', value: 6520 },
    { name: '速食食品', value: 4800 },
    { name: '日用百货', value: 3200 },
    { name: '鲜食', value: 2680 },
    { name: '烟酒', value: 850 },
    { name: '冰淇淋', value: 388.5 },
  ];
}

function getMockStoreSales() {
  const stores = ['中心店', '社区店A', '社区店B', '地铁站店', '写字楼店', '学校店', '医院店'];
  const data = [];

  stores.forEach((store) => {
    data.push(Math.round(3000 + Math.random() * 2000));
  });

  return {
    xAxisData: stores,
    data: [
      {
        name: '销售额',
        data,
        color: '#1e3a5f',
      },
    ],
    legend: ['销售额(元)'],
  };
}

function getMockWasteTrend(days = 30) {
  const xAxisData = [];
  const wasteData = [];

  const today = new Date();
  for (let i = days - 1; i >= 0; i--) {
    const date = new Date(today);
    date.setDate(date.getDate() - i);
    xAxisData.push(`${date.getMonth() + 1}/${date.getDate()}`);
    const base = 0.1;
    const variation = Math.sin(i * 0.25) * 0.02;
    const trend = -i * 0.0003;
    const random = (Math.random() - 0.5) * 0.01;
    wasteData.push(Number((base + variation + trend + random).toFixed(4)));
  }

  return {
    xAxisData,
    data: [
      {
        name: '损耗率',
        data: wasteData,
        color: '#ef4444',
      },
    ],
    legend: ['损耗率'],
  };
}

export async function getSummary() {
  try {
    const data = await api.get('/dashboard/summary');
    if (data) {
      return {
        total_stores: data.total_stores || 0,
        total_products: data.total_products || 0,
        today_sales_amount: data.today_sales_amount || 0,
        today_sales_quantity: data.today_sales_quantity || 0,
        waste_rate: data.waste_rate || 0,
        order_fulfillment_rate: data.order_fulfillment_rate || 0,
        forecast_accuracy: data.forecast_accuracy || 0,
      };
    }
    throw new Error('空数据');
  } catch (error) {
    console.error('获取仪表盘摘要失败，使用模拟数据:', error);
    return mockSummary;
  }
}

export async function getWeeklyReport() {
  try {
    const data = await api.get('/dashboard/weekly-report');
    if (data) {
      return data;
    }
    throw new Error('空数据');
  } catch (error) {
    console.error('获取周报失败，使用模拟数据:', error);
    return getMockWeeklyReport();
  }
}

export function getSalesTrend(days = 30) {
  return Promise.resolve(getMockSalesTrend(days));
}

export function getCategorySales() {
  return Promise.resolve(getMockCategorySales());
}

export function getStoreSales() {
  return Promise.resolve(getMockStoreSales());
}

export function getWasteTrend(days = 30) {
  return Promise.resolve(getMockWasteTrend(days));
}

export default {
  getSummary,
  getWeeklyReport,
  getSalesTrend,
  getCategorySales,
  getStoreSales,
  getWasteTrend,
};
