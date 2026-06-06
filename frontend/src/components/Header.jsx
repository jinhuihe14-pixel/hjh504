import { useState, useEffect, useRef } from 'react'
import { useLocation, useNavigate } from 'react-router-dom'
import './Header.css'

const breadcrumbMap = {
  '/dashboard': ['首页', '仪表盘'],
  '/forecast': ['首页', '销量预测'],
  '/orders': ['首页', '订货建议'],
  '/waste': ['首页', '损耗分析'],
  '/weekly-report': ['首页', '周报分析'],
  '/stores': ['首页', '门店管理'],
  '/products': ['首页', '商品管理'],
}

function Header({ sidebarCollapsed, onMenuClick }) {
  const location = useLocation()
  const navigate = useNavigate()
  const [currentDate, setCurrentDate] = useState('')
  const [userMenuOpen, setUserMenuOpen] = useState(false)
  const userMenuRef = useRef(null)

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

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (userMenuRef.current && !userMenuRef.current.contains(event.target)) {
        setUserMenuOpen(false)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  const breadcrumbs = breadcrumbMap[location.pathname] || ['首页']

  const username = localStorage.getItem('username') || '管理员'

  const handleLogout = () => {
    localStorage.removeItem('token')
    localStorage.removeItem('username')
    setUserMenuOpen(false)
    navigate('/login')
  }

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
        <div className="user-menu-wrapper" ref={userMenuRef}>
          <div className="user-info" onClick={() => setUserMenuOpen(!userMenuOpen)}>
            <div className="user-avatar">管</div>
            <div className="user-details">
              <span className="user-name">{username}</span>
              <span className="user-role">系统管理员</span>
            </div>
            <span className="user-menu-arrow">{userMenuOpen ? '▲' : '▼'}</span>
          </div>
          {userMenuOpen && (
            <div className="user-dropdown-menu">
              <div className="user-dropdown-item user-dropdown-user">
                <span className="user-dropdown-label">当前用户</span>
                <span className="user-dropdown-username">{username}</span>
              </div>
              <div className="user-dropdown-divider" />
              <div className="user-dropdown-item" onClick={handleLogout}>
                <span className="user-dropdown-icon">🚪</span>
                <span>退出登录</span>
              </div>
            </div>
          )}
        </div>
      </div>
    </header>
  )
}

export default Header
