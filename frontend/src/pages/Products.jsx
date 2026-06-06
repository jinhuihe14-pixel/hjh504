import { useState, useEffect, useMemo } from 'react';
import DataTable from '../components/DataTable';
import { CATEGORIES } from '../utils/constants';
import { formatMoney, formatDays } from '../utils/format';
import { getProducts } from '../api/products';
import './Products.css';

const statusConfig = {
  active: { label: '在售', color: '#10b981', bgColor: '#ecfdf5' },
  inactive: { label: '下架', color: '#94a3b8', bgColor: '#f1f5f9' },
};

function Products() {
  const [loading, setLoading] = useState(true);
  const [products, setProducts] = useState([]);
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [searchKeyword, setSearchKeyword] = useState('');

  useEffect(() => {
    const loadProducts = async () => {
      setLoading(true);
      try {
        const categoryParam = selectedCategory === 'all' ? null : selectedCategory;
        const data = await getProducts(categoryParam);
        setProducts(data);
      } catch (error) {
        console.error('加载商品数据失败:', error);
      } finally {
        setLoading(false);
      }
    };

    loadProducts();
  }, [selectedCategory]);

  const filteredProducts = useMemo(() => {
    if (!searchKeyword) return products;
    const keyword = searchKeyword.toLowerCase();
    return products.filter((product) =>
      product.name.toLowerCase().includes(keyword) ||
      product.sku.toLowerCase().includes(keyword)
    );
  }, [products, searchKeyword]);

  const columns = [
    {
      key: 'sku',
      title: 'SKU',
      width: '120px',
    },
    {
      key: 'name',
      title: '商品名称',
      render: (value, row) => (
        <div className="product-name-cell">
          <span className="product-name">{value}</span>
          {row.isShortShelf && <span className="short-shelf-tag">短保</span>}
        </div>
      ),
    },
    {
      key: 'category_name',
      title: '品类',
      width: '100px',
    },
    {
      key: 'shelfLife',
      title: '保质期',
      width: '100px',
      align: 'center',
      render: (value, row) => (
        <span className={row.isShortShelf ? 'short-shelf-life' : ''}>
          {formatDays(value)}
        </span>
      ),
    },
    {
      key: 'unit',
      title: '单位',
      width: '80px',
      align: 'center',
    },
    {
      key: 'price',
      title: '单价',
      width: '100px',
      align: 'right',
      render: (value) => formatMoney(value),
    },
    {
      key: 'status',
      title: '状态',
      width: '100px',
      align: 'center',
      render: (value) => (
        <span
          className="status-tag"
          style={{
            color: statusConfig[value]?.color,
            backgroundColor: statusConfig[value]?.bgColor,
          }}
        >
          {statusConfig[value]?.label}
        </span>
      ),
    },
  ];

  const shortShelfCount = products.filter((p) => p.isShortShelf || p.is_short_life).length;

  if (loading) {
    return (
      <div className="page-container">
        <h2 className="page-title">商品管理</h2>
        <div className="page-loading">
          <div className="loading-spinner" />
          <span>数据加载中...</span>
        </div>
      </div>
    );
  }

  return (
    <div className="products-page page-container">
      <div className="page-header">
        <h2 className="page-title">商品管理</h2>
        <div className="page-stats">
          <span className="stat-text">
            共 <strong>{products.length}</strong> 个商品
          </span>
          <span className="stat-divider">|</span>
          <span className="stat-text">
            短保商品 <strong className="text-warning">{shortShelfCount}</strong> 个
          </span>
        </div>
      </div>

      <div className="filter-bar">
        <div className="filter-left">
          <div className="filter-item">
            <label className="filter-label">品类筛选</label>
            <select
              className="filter-select"
              value={selectedCategory}
              onChange={(e) => setSelectedCategory(e.target.value)}
            >
              {CATEGORIES.map((cat) => (
                <option key={cat.id} value={cat.id}>
                  {cat.name}
                </option>
              ))}
            </select>
          </div>
        </div>
        <div className="filter-right">
          <div className="search-box">
            <span className="search-icon">🔍</span>
            <input
              type="text"
              className="search-input"
              placeholder="搜索商品名称或SKU..."
              value={searchKeyword}
              onChange={(e) => setSearchKeyword(e.target.value)}
            />
          </div>
        </div>
      </div>

      <div className="table-card">
        <DataTable
          columns={columns}
          data={filteredProducts}
          loading={loading}
          pagination
          pageSize={10}
          rowKey="sku"
          emptyText="暂无商品数据"
        />
      </div>
    </div>
  );
}

export default Products;
