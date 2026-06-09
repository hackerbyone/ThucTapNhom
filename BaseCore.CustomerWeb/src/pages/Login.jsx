import { useState } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { useGoogleLogin } from '@react-oauth/google'
import { useAuth } from '../context/AuthContext'
import { authService } from '../services/auth/authService'
import styles from './Login.module.css'

export default function Login() {
  const [username, setUsername]               = useState('')
  const [password, setPassword]               = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [email, setEmail]                     = useState('')
  const [name, setName]                       = useState('')
  const [phone, setPhone]                     = useState('')
  const [error, setError]                     = useState('')
  const [loading, setLoading]                 = useState(false)
  const [googleLoading, setGoogleLoading]     = useState(false)
  const [isRegister, setIsRegister]           = useState(false)

  const navigate = useNavigate()
  const { login } = useAuth()

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError('')

    if (isRegister) {
      if (password !== confirmPassword) { setError('Mật khẩu xác nhận không khớp'); return }
      if (!phone.trim()) { setError('Vui lòng nhập số điện thoại'); return }
    }

    setLoading(true)
    try {
      const response = isRegister
        ? await authService.register(username, password, email, name, phone)
        : await authService.login(username, password)
      login(response)
      const role = (response.role || 'user').toLowerCase()
      navigate(role === 'admin' ? '/admin' : role === 'warehouse' ? '/admin/warehouse' : '/')
    } catch (err) {
      setError(err.message || 'Có lỗi xảy ra, vui lòng thử lại')
    } finally {
      setLoading(false)
    }
  }

  // Google OAuth — lấy access_token, gửi về backend verify qua Google userinfo API
  const googleLogin = useGoogleLogin({
    onSuccess: async (tokenResponse) => {
      setGoogleLoading(true)
      setError('')
      try {
        const response = await authService.loginWithGoogle(tokenResponse.access_token)
        login(response)
        const role = (response.role || 'user').toLowerCase()
        navigate(role === 'admin' ? '/admin' : '/')
      } catch (err) {
        setError(err.message || 'Đăng nhập Google thất bại')
      } finally {
        setGoogleLoading(false)
      }
    },
    onError: () => setError('Không thể kết nối Google. Vui lòng thử lại.'),
  })

  const switchMode = () => {
    setIsRegister(!isRegister)
    setError('')
    setUsername(''); setPassword(''); setConfirmPassword('')
    setEmail(''); setName(''); setPhone('')
  }

  return (
    <main className={styles.container}>
      <div className={styles.card}>
        <h1>{isRegister ? 'Đăng Ký' : 'Đăng Nhập'}</h1>

        {error && <div className={styles.error}>{error}</div>}

        {/* Nút Google — chỉ hiện ở màn hình đăng nhập */}
        {!isRegister && (
          <>
            <button
              type="button"
              className={styles.googleBtn}
              onClick={() => googleLogin()}
              disabled={googleLoading || loading}
            >
              <svg className={styles.googleIcon} viewBox="0 0 24 24">
                <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
                <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
              </svg>
              {googleLoading ? 'Đang kết nối...' : 'Đăng nhập bằng Google'}
            </button>
            <div className={styles.divider}>hoặc đăng nhập bằng tài khoản</div>
          </>
        )}

        <form onSubmit={handleSubmit}>
          {isRegister && (
            <>
              <div className={styles.group}>
                <label>Họ tên *</label>
                <input type="text" value={name} onChange={e => setName(e.target.value)}
                  required placeholder="Nhập họ và tên" />
              </div>
              <div className={styles.group}>
                <label>Email *</label>
                <input type="email" value={email} onChange={e => setEmail(e.target.value)}
                  required placeholder="example@email.com" />
              </div>
              <div className={styles.group}>
                <label>Số điện thoại *</label>
                <input type="tel" value={phone} onChange={e => setPhone(e.target.value)}
                  required placeholder="0912 345 678" />
              </div>
            </>
          )}

          <div className={styles.group}>
            <label>Tên đăng nhập *</label>
            <input type="text" value={username} onChange={e => setUsername(e.target.value)}
              required placeholder="Nhập tên đăng nhập" />
          </div>

          <div className={styles.group}>
            <label>Mật khẩu *</label>
            <input type="password" value={password} onChange={e => setPassword(e.target.value)}
              required placeholder="Ít nhất 6 ký tự" minLength={6} />
          </div>

          {isRegister && (
            <div className={styles.group}>
              <label>Xác nhận mật khẩu *</label>
              <input type="password" value={confirmPassword} onChange={e => setConfirmPassword(e.target.value)}
                required placeholder="Nhập lại mật khẩu" minLength={6} />
            </div>
          )}

          <button type="submit" className={styles.btn} disabled={loading || googleLoading}>
            {loading ? 'Đang xử lý...' : isRegister ? 'Đăng Ký' : 'Đăng Nhập'}
          </button>
        </form>

        <p className={styles.toggle}>
          {isRegister ? 'Đã có tài khoản? ' : 'Chưa có tài khoản? '}
          <button type="button" onClick={switchMode} className={styles.link}>
            {isRegister ? 'Đăng Nhập' : 'Đăng Ký'}
          </button>
        </p>

        <p className={styles.back}>
          <Link to="/">← Quay lại trang chủ</Link>
        </p>
      </div>
    </main>
  )
}
