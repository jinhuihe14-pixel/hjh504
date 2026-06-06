import { useState, useEffect } from 'react'
import { useLocation } from 'react-router-dom'
import './Header.css'

const breadcrumbMap = {
  '/dashboard': ['首页', '仪表盘'],
  '/sales-forecast': ['首页', '销量预测'],
  '/order-suggestion': ['首页', '订货建议'],
  '/loss-analysis': ['首页', '损耗分析'],
  '/weekly-report': ['首页', '周报分析'],
  '/store-management': ['首页', '门店管理'],
  '/product-management': ['首页', '商品管理'],
}

function Header({ sidebarCollapsed, onMenuClick }) {
  const location = useLocation()
  const [currentDate, setCurrentDate] = useState('')

  useEffect(() => {
    const updateDate = () => {
      const now = new Date()
      const year = now.getFullYear()
      const month = String(now.getMonth() + 1).padStart(2, '0')
      const day = String(now.getDate()).padStart(2, '0')
      const weekDays = ['星期日', '星期一', '星期二', '星期三', '星期四', '星期五', '星期六']
      const weekDay = weekDays[now.getDay()]
      setCurrentDate(`${year}年${month}月${day}日 ${weekDay}`)
    }
    updateDate()
    const timer = setInterval(updateDate, 60000)
    return () => clearInterval(timer)
  }, [])

  const breadcrumbs = breadcrumbMap[location.pathname] || ['首页']

  return (
    <header className={`header ${sidebarCollapsed ? 'collapsed' : ''}`}>
      <div className="header-left">
        <button className="menu-toggle" onClick={onMenuClick} title="菜单">
          ☰
        </button>
        <nav className="breadcrumb">
          {breadcrumbs.map((item, index) => (
            <span key={index} className="breadcrumb-item">
              {index > 0 && <span className="breadcrumb-separator">/</span>}
              <span className={index === breadcrumbs.length - 1 ? 'breadcrumb-current' : ''}>
                {item}
              </span>
            </span>
          ))}
        </nav>
      </div>
      <div className="header-right">
        <span className="current-date">{currentDate}</span>
        <button className="notification-btn" title="通知">
          🔔
          <span className="notification-badge">3</span>
        </button>
        <div className="user-info">
          <div className="user-avatar">管</div>
          <div className="user-details">
            <span className="user-name">管理员</span>
            <span className="user-role">系统管理员</span>
          </div>
        </div>
      </div>
    </header>
  )
}

export default Header
