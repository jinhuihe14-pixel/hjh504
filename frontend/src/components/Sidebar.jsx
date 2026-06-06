import { NavLink } from 'react-router-dom'
import './Sidebar.css'

const menuItems = [
  { path: '/dashboard', name: '仪表盘', icon: '📊' },
  { path: '/sales-forecast', name: '销量预测', icon: '📈' },
  { path: '/order-suggestion', name: '订货建议', icon: '📦' },
  { path: '/loss-analysis', name: '损耗分析', icon: '📉' },
  { path: '/weekly-report', name: '周报分析', icon: '📋' },
  { path: '/store-management', name: '门店管理', icon: '🏪' },
  { path: '/product-management', name: '商品管理', icon: '🛒' },
]

function Sidebar({ collapsed, onToggle, mobileOpen }) {
  return (
    <aside className={`sidebar ${collapsed ? 'collapsed' : ''} ${mobileOpen ? 'mobile-open' : ''}`}>
      <div className="sidebar-logo">
        <span className="logo-icon">🏪</span>
        {!collapsed && <span className="logo-text">智能订货预测</span>}
      </div>
      <nav className="sidebar-nav">
        {menuItems.map((item) => (
          <NavLink
            key={item.path}
            to={item.path}
            className={({ isActive }) => `nav-item ${isActive ? 'active' : ''}`}
            title={item.name}
          >
            <span className="nav-icon">{item.icon}</span>
            {!collapsed && <span className="nav-text">{item.name}</span>}
          </NavLink>
        ))}
      </nav>
      <button className="sidebar-toggle" onClick={onToggle} title={collapsed ? '展开侧边栏' : '收起侧边栏'}>
        {collapsed ? '▶' : '◀'}
      </button>
    </aside>
  )
}

export default Sidebar
