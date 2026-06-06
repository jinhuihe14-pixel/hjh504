import api from './index';

const mockStores = [
  { id: 'store001', name: '中心店', address: '市中心商业街1号', area: 120, manager: '张三', phone: '13800000001', status: 'active', daily_sales: 8500, waste_rate: 0.085 },
  { id: 'store002', name: '社区店A', address: '阳光小区门口', area: 80, manager: '李四', phone: '13800000002', status: 'active', daily_sales: 4200, waste_rate: 0.092 },
  { id: 'store003', name: '社区店B', address: '幸福花园底商', area: 90, manager: '王五', phone: '13800000003', status: 'active', daily_sales: 4800, waste_rate: 0.105 },
  { id: 'store004', name: '地铁站店', address: '地铁2号线A出口', area: 60, manager: '赵六', phone: '13800000004', status: 'active', daily_sales: 6500, waste_rate: 0.078 },
  { id: 'store005', name: '写字楼店', address: '财富中心B1层', area: 70, manager: '钱七', phone: '13800000005', status: 'active', daily_sales: 7200, waste_rate: 0.095 },
  { id: 'store006', name: '学校店', address: '理工大学内', area: 85, manager: '孙八', phone: '13800000006', status: 'active', daily_sales: 5800, waste_rate: 0.112 },
  { id: 'store007', name: '医院店', address: '市医院门诊楼', area: 50, manager: '周九', phone: '13800000007', status: 'active', daily_sales: 5200, waste_rate: 0.088 },
  { id: 'store008', name: '火车站店', address: '火车站候车厅', area: 55, manager: '吴十', phone: '13800000008', status: 'inactive', daily_sales: 0, waste_rate: 0 },
];

function adaptStoreItem(item) {
  return {
    id: item.store_id || item.id,
    store_id: item.store_id || item.id,
    name: item.name,
    address: item.address,
    area: item.area,
    manager: item.manager || item.store_manager || '-',
    phone: item.phone || item.contact_phone || '-',
    status: item.status || (item.is_active ? 'active' : 'inactive') || 'active',
    daily_sales: item.daily_sales || item.today_sales_amount || 0,
    waste_rate: item.waste_rate || 0,
    todaySales: item.daily_sales || item.today_sales_amount || 0,
    todayQty: item.today_sales_quantity || Math.floor((item.daily_sales || 0) / 12),
  };
}

function getMockStoreDetail(storeId) {
  const store = mockStores.find((s) => s.id === storeId);
  if (store) {
    return {
      ...store,
      opening_date: '2023-01-15',
      monthly_sales: 186000,
      monthly_quantity: 25800,
      avg_daily_customers: 520,
      top_categories: [
        { name: '饮料', sales: 35000 },
        { name: '零食', sales: 28000 },
        { name: '速食食品', sales: 22000 },
      ],
      recent_orders: [
        { id: 'ORD001', date: '2024-01-10', total_items: 45, total_amount: 2850 },
        { id: 'ORD002', date: '2024-01-08', total_items: 38, total_amount: 2340 },
        { id: 'ORD003', date: '2024-01-05', total_items: 52, total_amount: 3120 },
      ],
    };
  }
  return null;
}

export async function getStores() {
  try {
    const data = await api.get('/stores');
    if (data && data.items) {
      return data.items.map(adaptStoreItem);
    }
    return [];
  } catch (error) {
    console.error('获取门店列表失败，使用模拟数据:', error);
    return mockStores;
  }
}

export async function getStoreDetail(storeId) {
  try {
    const data = await api.get(`/stores/${storeId}`);
    if (data) {
      const adapted = adaptStoreItem(data);
      return {
        ...adapted,
        opening_date: data.opening_date || data.create_time || '2023-01-15',
        monthly_sales: data.monthly_sales || data.month_sales || 0,
        monthly_quantity: data.monthly_quantity || data.month_quantity || 0,
        avg_daily_customers: data.avg_daily_customers || 0,
        top_categories: data.top_categories || data.category_sales || [
          { name: '饮料', sales: 35000 },
          { name: '零食', sales: 28000 },
          { name: '速食食品', sales: 22000 },
        ],
        recent_orders: data.recent_orders || [],
      };
    }
    throw new Error('门店不存在');
  } catch (error) {
    console.error('获取门店详情失败，使用模拟数据:', error);
    const mockDetail = getMockStoreDetail(storeId);
    if (mockDetail) {
      return mockDetail;
    }
    throw error;
  }
}

export default {
  getStores,
  getStoreDetail,
};
