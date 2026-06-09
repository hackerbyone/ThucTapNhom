import { useEffect, useState } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { orderService } from '../services/order/orderService'
import styles from './VnpayReturn.module.css'

export default function VnpayReturn() {
  const navigate = useNavigate()
  const [state, setState] = useState('loading') // loading | success | fail
  const [message, setMessage] = useState('')
  const [orderId, setOrderId] = useState(null)

  useEffect(() => {
    const queryString = window.location.search.slice(1) // bỏ dấu ?
    if (!queryString) {
      setState('fail')
      setMessage('Không có thông tin thanh toán')
      return
    }

    orderService.verifyVnpay(queryString)
      .then(data => {
        setOrderId(data.orderId)
        if (data.success) {
          setState('success')
          setMessage(data.message || 'Thanh toán thành công!')
        } else {
          setState('fail')
          setMessage(data.message || 'Thanh toán thất bại')
        }
      })
      .catch(err => {
        setState('fail')
        setMessage(err.message || 'Có lỗi xảy ra khi xác thực thanh toán')
      })
  }, [])

  if (state === 'loading') {
    return (
      <main className={styles.page}>
        <div className={styles.card}>
          <div className={styles.spinner} />
          <p className={styles.loadingText}>Đang xác thực thanh toán VNPay...</p>
        </div>
      </main>
    )
  }

  return (
    <main className={styles.page}>
      <div className={styles.card}>
        {state === 'success' ? (
          <>
            <div className={styles.iconSuccess}>✓</div>
            <h1 className={styles.titleSuccess}>Thanh toán thành công!</h1>
            <p className={styles.desc}>{message}</p>
            {orderId && (
              <p className={styles.orderRef}>Mã đơn hàng: <strong>#{orderId}</strong></p>
            )}
            <div className={styles.actions}>
              {orderId && (
                <Link to={`/payment/${orderId}`} className={styles.btnPrimary}>
                  Xem đơn hàng
                </Link>
              )}
              <Link to="/orders" className={styles.btnSecondary}>
                Tất cả đơn hàng
              </Link>
            </div>
          </>
        ) : (
          <>
            <div className={styles.iconFail}>✕</div>
            <h1 className={styles.titleFail}>Thanh toán thất bại</h1>
            <p className={styles.desc}>{message}</p>
            <div className={styles.actions}>
              {orderId && (
                <Link to={`/payment/${orderId}`} className={styles.btnPrimary}>
                  Thử lại
                </Link>
              )}
              <Link to="/orders" className={styles.btnSecondary}>
                Đơn hàng của tôi
              </Link>
            </div>
          </>
        )}
      </div>
    </main>
  )
}
