import './StatCard.css'

const themeConfig = {
  default: {
    iconBg: 'rgba(30, 58, 95, 0.1)',
    iconColor: 'var(--primary-color)',
    accentColor: 'var(--primary-color)',
  },
  primary: {
    iconBg: 'rgba(30, 58, 95, 0.1)',
    iconColor: 'var(--primary-color)',
    accentColor: 'var(--primary-color)',
  },
  success: {
    iconBg: 'rgba(16, 185, 129, 0.1)',
    iconColor: 'var(--success-color)',
    accentColor: 'var(--success-color)',
  },
  warning: {
    iconBg: 'rgba(249, 115, 22, 0.1)',
    iconColor: 'var(--warning-color)',
    accentColor: 'var(--warning-color)',
  },
  danger: {
    iconBg: 'rgba(239, 68, 68, 0.1)',
    iconColor: 'var(--danger-color)',
    accentColor: 'var(--danger-color)',
  },
  info: {
    iconBg: 'rgba(59, 130, 246, 0.1)',
    iconColor: '#3b82f6',
    accentColor: '#3b82f6',
  },
}

function StatCard({ title, value, change, changeLabel = '同比', icon, theme = 'default', suffix = '' }) {
  const config = themeConfig[theme] || themeConfig.default
  const isPositive = change !== undefined && change >= 0

  return (
    <div className="stat-card">
      <div className="stat-card-content">
        <div className="stat-card-header">
          <span className="stat-card-title">{title}</span>
          {icon && (
            <div
              className="stat-card-icon"
              style={{ background: config.iconBg, color: config.iconColor }}
            >
              {icon}
            </div>
          )}
        </div>
        <div className="stat-card-value" style={{ color: config.accentColor }}>
          {value}
          {suffix && <span className="stat-card-suffix">{suffix}</span>}
        </div>
        {change !== undefined && (
          <div className="stat-card-change">
            <span className={`change-value ${isPositive ? 'positive' : 'negative'}`}>
              {isPositive ? '↑' : '↓'} {Math.abs(change)}%
            </span>
            <span className="change-label">{changeLabel}</span>
          </div>
        )}
      </div>
      <div className="stat-card-decoration" style={{ background: config.accentColor }} />
    </div>
  )
}

export default StatCard
