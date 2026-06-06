import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import './Login.css'

function Login() {
  const navigate = useNavigate()
  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  useEffect(() => {
    const token = localStorage.getItem('token')
    if (token) {
      navigate('/dashboard')
    }
  }, [navigate])

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError('')

    if (!username.trim() || !password.trim()) {
      setError('请输入用户名和密码')
      return
    }

    setLoading(true)

    try {
      const response = await fetch('/api/auth/login', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ username, password }),
      })

      const data = await response.json()

      if (response.ok && data.success) {
        localStorage.setItem('token', data.data.token)
        localStorage.setItem('username', data.data.username)
        navigate('/dashboard')
      } else {
        setError(data.message || '登录失败，请检查用户名和密码')
      }
    } catch (err) {
      setError('登录失败，请稍后重试')
      console.error('Login error:', err)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="login-page">
      <div className="login-container">
        <div className="login-left">
          <div className="login-logo-section">
            <div className="login-logo-icon">🏪</div>
            <h1 className="login-title">智能订货预测系统</h1>
            <p className="login-subtitle">连锁便利店智能运营管理平台</p>
          </div>
          <div className="login-features">
            <div className="login-feature">
              <span className="feature-icon">📊</span>
              <span className="feature-text">智能销量预测</span>
            </div>
            <div className="login-feature">
              <span className="feature-icon">📦</span>
              <span className="feature-text">智能订货建议</span>
            </div>
            <div className="login-feature">
              <span className="feature-icon">📉</span>
              <span className="feature-text">损耗分析优化</span>
            </div>
          </div>
        </div>
        <div className="login-right">
          <div className="login-form-wrapper">
            <h2 className="login-form-title">欢迎登录</h2>
            <p className="login-form-desc">请输入您的账户信息</p>
            {error && <div className="login-error">{error}</div>}
            <form className="login-form" onSubmit={handleSubmit}>
              <div className="form-group">
                <label className="form-label">用户名</label>
                <div className="input-wrapper">
                  <span className="input-icon">👤</span>
                  <input
                    type="text"
                    className="form-input"
                    placeholder="请输入用户名"
                    value={username}
                    onChange={(e) => setUsername(e.target.value)}
                    disabled={loading}
                  />
                </div>
              </div>
              <div className="form-group">
                <label className="form-label">密码</label>
                <div className="input-wrapper">
                  <span className="input-icon">🔒</span>
                  <input
                    type="password"
                    className="form-input"
                    placeholder="请输入密码"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    disabled={loading}
                    onKeyDown={(e) => e.key === 'Enter' && handleSubmit(e)}
                  />
                </div>
              </div>
              <div className="form-options">
                <label className="remember-me">
                  <input type="checkbox" />
                  <span>记住我</span>
                </label>
                <a href="#" className="forgot-password">忘记密码？</a>
              </div>
              <button type="submit" className="login-btn" disabled={loading}>
                {loading ? '登录中...' : '登 录'}
              </button>
            </form>
            <div className="login-tip">
              <span>测试账号：admin / 123456</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

export default Login
