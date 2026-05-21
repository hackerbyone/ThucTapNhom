import { useState, useEffect } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useCart } from '../context/CartContext'
import { useAuth } from '../context/AuthContext'
import { cartService } from '../services/cart/cartService'
import styles from './Cart.module.css'

function formatPrice(n) { return n.toLocaleString('vi-VN') + 'đ' }

export default function Cart() {
  const { cart, remove, setQty, total, clear, isLoading, error } = useCart()
  const { user } = useAuth()
  const navigate = useNavigate()
  const [showCheckout, setShowCheckout] = useState(false)
  const [checkoutData, setCheckoutData] = useState({
    shippingAddress: '',
    customerName: '',
    customerPhone: '',
  })
  const [checkoutLoading, setCheckoutLoading] = useState(false)
  const [checkoutError, setCheckoutError] = useState(null)

  useEffect(() => {
    if (user) {
      setCheckoutData(prev => ({
        ...prev,
        customerName: user.name || user.username || '',
        customerPhone: user.phone || ''
      }))
    }
  }, [user])

  const shipping = total >= 500000 ? 0 : 35000
  const grandTotal = total + shipping

  const handleCheckoutChange = (field, value) => {
    setCheckoutData(prev => ({ ...prev, [field]: value }))
  }

  const handleCheckout = async () => {
    if (!checkoutData.shippingAddress.trim() || !checkoutData.customerName.trim() || !checkoutData.customerPhone.trim()) {
      setCheckoutError('Vui lòng điền đầy đủ thông tin')
      return
    }

    try {
      setCheckoutLoading(true)
      setCheckoutError(null)
      const result = await cartService.checkout(
        checkoutData.shippingAddress,
        'Standard',
        'COD',
        checkoutData.customerName,
        checkoutData.customerPhone
      )
      clear()
      setShowCheckout(false)
      navigate(`/payment/${result.orderId}`, { state: { order: result } })
    } catch (err) {
      setCheckoutError(err.message)
    } finally {
      setCheckoutLoading(false)
    }
  }

  if (isLoading) return (
    <main className={styles.page}>
      <div className={styles.container}>
        <div className={styles.empty}>
          <h2>Đang tải giỏ hàng...</h2>
        </div>
      </div>
    </main>
  )

  if (error) return (
    <main className={styles.page}>
      <div className={styles.container}>
        <div className={styles.empty}>
          <div className={styles.emptyIcon}>⚠️</div>
          <h2>Lỗi</h2>
          <p>{error}</p>
          <Link to="/products" className={styles.shopBtn}>Quay lại cửa hàng →</Link>
        </div>
      </div>
    </main>
  )

  if (cart.length === 0) return (
    <main className={styles.page}>
      <div className={styles.container}>
        <div className={styles.empty}>
          <div className={styles.emptyIcon}>🛒</div>
          <h2>Giỏ hàng trống</h2>
          <p>Bạn chưa thêm sản phẩm nào. Hãy khám phá cửa hàng của chúng tôi!</p>
          <Link to="/products" className={styles.shopBtn}>Khám phá sản phẩm →</Link>
        </div>
      </div>
    </main>
  )

  return (
    <main className={styles.page}>
      <div className={styles.container}>
        <div className={styles.header}>
          <h1>Giỏ hàng của bạn</h1>
          <span>{cart.reduce((s, i) => s + i.quantity, 0)} sản phẩm</span>
        </div>

        <div className={styles.layout}>
          {/* Cart items */}
          <div className={styles.items}>
            <div className={styles.itemsHead}>
              <span>Sản phẩm</span>
              <span>Đơn giá</span>
              <span>Số lượng</span>
              <span>Thành tiền</span>
              <span></span>
            </div>

            {cart.map(item => (
              <div key={`${item.productId}-${item.selectedGender ?? ''}`} className={styles.item}>
                <div className={styles.itemProduct}>
                  <Link to={`/product/${item.productId}`}>
                    <img src={item.image} alt={item.name} />
                  </Link>
                  <div>
                    <Link to={`/product/${item.productId}`} className={styles.itemName}>{item.name}</Link>
                    {item.selectedGender && (
                      <span style={{
                        display: 'inline-block',
                        marginTop: '0.25rem',
                        padding: '0.15rem 0.6rem',
                        borderRadius: '12px',
                        fontSize: '0.75rem',
                        fontWeight: 600,
                        background: item.selectedGender === 'Đực' ? '#e3f2fd' : item.selectedGender === 'Cái' ? '#fce4ec' : '#e8f5e9',
                        color: item.selectedGender === 'Đực' ? '#1565c0' : item.selectedGender === 'Cái' ? '#c62828' : '#2e7d32',
                      }}>
                        {item.selectedGender === 'Cặp' ? 'Cặp đôi' : `Con ${item.selectedGender.toLowerCase()}`}
                      </span>
                    )}
                  </div>
                </div>

                <span className={styles.itemPrice}>{formatPrice(item.price)}</span>

                <div className={styles.qtyControl}>
                  <button onClick={() => item.quantity === 1 ? remove(item.id) : setQty(item.id, item.quantity - 1)}>−</button>
                  <span>{item.quantity}</span>
                  <button onClick={() => setQty(item.id, item.quantity + 1)}>+</button>
                </div>

                <span className={styles.itemTotal}>{formatPrice(item.price * item.quantity)}</span>

                <button className={styles.removeBtn} onClick={() => remove(item.id)} title="Xóa">✕</button>
              </div>
            ))}

            <div className={styles.itemsFooter}>
              <button className={styles.clearBtn} onClick={clear}>🗑 Xóa tất cả</button>
              <Link to="/products" className={styles.continueBtn}>← Tiếp tục mua</Link>
            </div>
          </div>

          {/* Summary */}
          <div className={styles.summary}>
            <h2>Tóm tắt đơn hàng</h2>

            <div className={styles.summaryRow}>
              <span>Tạm tính ({cart.reduce((s, i) => s + i.quantity, 0)} sp)</span>
              <span>{formatPrice(total)}</span>
            </div>
            <div className={styles.summaryRow}>
              <span>Phí vận chuyển</span>
              <span className={shipping === 0 ? styles.free : ''}>
                {shipping === 0 ? 'Miễn phí' : formatPrice(shipping)}
              </span>
            </div>
            {total < 500000 && (
              <p className={styles.shippingNote}>
                Thêm <strong>{formatPrice(500000 - total)}</strong> để được miễn phí vận chuyển
              </p>
            )}
            <div className={styles.divider} />
            <div className={`${styles.summaryRow} ${styles.totalRow}`}>
              <span>Tổng cộng</span>
              <span>{formatPrice(grandTotal)}</span>
            </div>

            <button className={styles.checkoutBtn} onClick={() => setShowCheckout(true)}>
              Tiến hành thanh toán →
            </button>

            <div className={styles.paymentIcons}>
              <span>💳</span><span>🏦</span><span>📱</span>
              <small>Thanh toán an toàn</small>
            </div>
          </div>
        </div>

        {/* Checkout Modal */}
        {showCheckout && (
          <div className={styles.modal} onClick={() => setShowCheckout(false)}>
            <div className={styles.modalContent} onClick={e => e.stopPropagation()}>
              <div className={styles.modalHeader}>
                <h2>Thông tin thanh toán</h2>
                <button className={styles.closeBtn} onClick={() => setShowCheckout(false)}>✕</button>
              </div>

              <div className={styles.formGroup}>
                <label>Tên khách hàng *</label>
                <input
                  type="text"
                  placeholder="Nhập tên của bạn"
                  value={checkoutData.customerName}
                  onChange={e => handleCheckoutChange('customerName', e.target.value)}
                />
              </div>

              <div className={styles.formGroup}>
                <label>Số điện thoại *</label>
                <input
                  type="tel"
                  placeholder="Nhập số điện thoại"
                  value={checkoutData.customerPhone}
                  onChange={e => handleCheckoutChange('customerPhone', e.target.value)}
                />
              </div>

              <div className={styles.formGroup}>
                <label>Địa chỉ giao hàng *</label>
                <textarea
                  placeholder="Nhập địa chỉ giao hàng"
                  rows="3"
                  value={checkoutData.shippingAddress}
                  onChange={e => handleCheckoutChange('shippingAddress', e.target.value)}
                />
              </div>

              <div style={{ background: '#fff3e0', border: '1px solid #ffb74d', borderRadius: 6, padding: '0.7rem 0.9rem', marginBottom: '0.75rem', fontSize: '0.85rem' }}>
                <strong style={{ color: '#e65100' }}>⚠️ Lưu ý đặt cọc:</strong> Sau khi đặt hàng, bạn cần chuyển khoản <strong style={{ color: '#e65100' }}>{formatPrice(Math.round(grandTotal * 0.5))}</strong> (50% giá trị đơn) để xác nhận. Đơn hàng sẽ bị huỷ sau 24 giờ nếu chưa nhận được cọc.
              </div>

              {checkoutError && (
                <div className={styles.errorMsg}>{checkoutError}</div>
              )}

              <div className={styles.modalFooter}>
                <button className={styles.cancelBtn} onClick={() => setShowCheckout(false)}>Hủy</button>
                <button 
                  className={styles.submitBtn} 
                  onClick={handleCheckout}
                  disabled={checkoutLoading}
                >
                  {checkoutLoading ? 'Đang xử lý...' : 'Xác nhận đặt hàng'}
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </main>
  )
}
