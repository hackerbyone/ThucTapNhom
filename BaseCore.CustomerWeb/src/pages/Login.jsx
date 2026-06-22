import { useState } from 'react'
import { useNavigate, Link } from 'react-router-dom'
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

  const switchMode = () => {
    setIsRegister(!isRegister)
    setError('')
    setUsername(''); setPassword(''); setConfirmPassword('')
    setEmail(''); setName(''); setPhone('')
  }

  return (
    <main className={styles.container}>
      <video className={styles.videoBg} autoPlay muted loop playsInline preload="metadata" aria-hidden="true">
        <source src="https://cdn.coverr.co/videos/coverr-fish-tank-5070/720p.mp4" type="video/mp4" />
      </video>
      <div className={styles.overlay} aria-hidden="true" />

      <section className={styles.hero}>
        <Link to="/" className={styles.brand}>
          <span className={styles.brandMark}>A</span>
          <span>AquaViet</span>
        </Link>
        <div className={styles.heroCopy}>
          <span className={styles.kicker}>Cửa hàng cá cảnh</span>
          <h1>Không gian thủy sinh đẹp hơn cho mọi góc nhà</h1>
          <p>Đăng nhập để theo dõi đơn hàng, giỏ hàng và những lựa chọn cá cảnh yêu thích của bạn.</p>
        </div>
      </section>

      <div className={styles.card}>
        <div className={styles.cardHeader}>
          <span>Tài khoản AquaViet</span>
          <h2>{isRegister ? 'Đăng Ký' : 'Đăng Nhập'}</h2>
        </div>

        {error && <div className={styles.error}>{error}</div>}

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

          <button type="submit" className={styles.btn} disabled={loading}>
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
