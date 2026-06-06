import { useState, useEffect } from 'react'
import { Outlet } from 'react-router-dom'
import Sidebar from './Sidebar.jsx'
import Header from './Header.jsx'
import './Layout.css'

function Layout() {
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false)
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)
  const [isMobile, setIsMobile] = useState(false)

  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth <= 768)
    }
    checkMobile()
    window.addEventListener('resize', checkMobile)
    return () => window.removeEventListener('resize', checkMobile)
  }, [])

  const toggleSidebar = () => {
    if (isMobile) {
      setMobileMenuOpen(!mobileMenuOpen)
    } else {
      setSidebarCollapsed(!sidebarCollapsed)
    }
  }

  const handleMenuClick = () => {
    setMobileMenuOpen(!mobileMenuOpen)
  }

  return (
    <div className="layout">
      <Sidebar
        collapsed={isMobile ? false : sidebarCollapsed}
        onToggle={toggleSidebar}
        mobileOpen={mobileMenuOpen}
      />
      <Header
        sidebarCollapsed={isMobile ? false : sidebarCollapsed}
        onMenuClick={handleMenuClick}
      />
      <main className={`main-content ${sidebarCollapsed && !isMobile ? 'collapsed' : ''}`}>
        <div className="content-wrapper">
          <Outlet />
        </div>
      </main>
      {mobileMenuOpen && (
        <div className="overlay" onClick={() => setMobileMenuOpen(false)} />
      )}
    </div>
  )
}

export default Layout
