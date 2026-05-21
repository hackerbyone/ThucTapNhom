import { useState, useEffect } from 'react'
import { useParams, Link, useNavigate } from 'react-router-dom'
import { productService } from '../services/product/productService'
import { useCart } from '../context/CartContext'
import ProductCard from '../components/ProductCard'
import styles from './ProductDetail.module.css'

function formatPrice(n) { return n.toLocaleString('vi-VN') + 'đ' }

export default function ProductDetail() {
  const { id } = useParams()
  const navigate = useNavigate()
  const { add } = useCart()

  const [product, setProduct] = useState(null)
  const [related, setRelated] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [activeImg, setActiveImg] = useState(0)
  const [qty, setQty] = useState(1)
  const [added, setAdded] = useState(false)
  const [tab, setTab] = useState('desc')
  const [selectedGender, setSelectedGender] = useState(null)
  const [genderError, setGenderError] = useState('')

  useEffect(() => {
    const fetchProduct = async () => {
      try {
        setLoading(true)
        const res = await productService.getById(parseInt(id))
        setProduct(res)
        setSelectedGender(null)

        if (res.categoryId) {
          const allProducts = await productService.getAll('', res.categoryId, 1, 10)
          const filtered = allProducts.items
            .filter(p => p.id !== res.id)
            .slice(0, 4)
          setRelated(filtered)
        }
      } catch (err) {
        console.error('Error fetching product:', err)
        setError(err.message)
      } finally {
        setLoading(false)
      }
    }

    fetchProduct()
  }, [id])

  if (loading) return (
    <div style={{ textAlign: 'center', padding: '6rem 2rem' }}>
      <p style={{ fontSize: '1.2rem', color: 'var(--text-muted)' }}>Đang tải...</p>
    </div>
  )

  if (error || !product) return (
    <div style={{ textAlign: 'center', padding: '6rem 2rem' }}>
      <p style={{ fontSize: '1.2rem', color: 'var(--text-muted)' }}>
        {error ? `Lỗi: ${error}` : 'Không tìm thấy sản phẩm'}
      </p>
      <Link to="/products" style={{ color: 'var(--teal)' }}>← Quay lại</Link>
    </div>
  )

  // Tính năng gender
  const isGenderProduct = (product.maleStock > 0 || product.femaleStock > 0)
  const genderOptions = []
  if (product.maleStock > 0) genderOptions.push({ value: 'Đực', label: 'Con đực', stock: product.maleStock })
  if (product.femaleStock > 0) genderOptions.push({ value: 'Cái', label: 'Con cái', stock: product.femaleStock })
  if (product.maleStock > 0 && product.femaleStock > 0)
    genderOptions.push({ value: 'Cặp', label: 'Cặp đôi (1 đực + 1 cái)', stock: Math.min(product.maleStock, product.femaleStock) })

  const totalStock = isGenderProduct
    ? (product.maleStock + product.femaleStock)
    : product.stock

  const selectedGenderStock = selectedGender
    ? genderOptions.find(o => o.value === selectedGender)?.stock ?? 0
    : null

  const isOutOfStock = isGenderProduct
    ? (product.maleStock <= 0 && product.femaleStock <= 0)
    : product.stock <= 0

  const discount = product.oldPrice ? Math.round((1 - product.price / product.oldPrice) * 100) : null
  const productImages = product.imageUrl ? [product.imageUrl] : ['https://via.placeholder.com/400']

  const handleAdd = async () => {
    if (isGenderProduct && !selectedGender) {
      setGenderError('Vui lòng chọn giới tính trước khi thêm vào giỏ')
      return
    }
    setGenderError('')
    for (let i = 0; i < qty; i++) await add(product, isGenderProduct ? selectedGender : null)
    setAdded(true)
    setTimeout(() => setAdded(false), 2000)
  }

  const handleBuyNow = async () => {
    if (isGenderProduct && !selectedGender) {
      setGenderError('Vui lòng chọn giới tính trước khi mua')
      return
    }
    await handleAdd()
    navigate('/cart')
  }

  return (
    <main className={styles.page}>
      <div className={styles.container}>
        {/* Breadcrumb */}
        <nav className={styles.breadcrumb}>
          <Link to="/">Trang chủ</Link>
          <span>/</span>
          <Link to="/products">Sản phẩm</Link>
          <span>/</span>
          <span>{product.name}</span>
        </nav>

        {/* Main product area */}
        <div className={styles.product}>
          {/* Images */}
          <div className={styles.gallery}>
            <div className={styles.mainImg}>
              <img src={productImages[activeImg]} alt={product.name} />
              {discount && <span className={styles.discountBadge}>-{discount}%</span>}
            </div>
            {productImages.length > 1 && (
              <div className={styles.thumbs}>
                {productImages.map((img, i) => (
                  <button
                    key={i}
                    className={`${styles.thumb} ${activeImg === i ? styles.activeThumb : ''}`}
                    onClick={() => setActiveImg(i)}
                  >
                    <img src={img} alt="" />
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Info */}
          <div className={styles.info}>
            <h1 className={styles.name}>{product.name}</h1>

            <div className={styles.rating}>
              {'★'.repeat(Math.round(product.rating || 5))}{'☆'.repeat(5 - Math.round(product.rating || 5))}
              <span>{(product.rating || 5).toFixed(1)}/5 ({product.reviews || 0} đánh giá)</span>
            </div>

            <div className={styles.priceBlock}>
              <span className={styles.price}>{formatPrice(product.price)}</span>
              {product.oldPrice && <span className={styles.oldPrice}>{formatPrice(product.oldPrice)}</span>}
              {discount && <span className={styles.save}>Tiết kiệm {discount}%</span>}
            </div>

            {/* Stock info */}
            {isGenderProduct ? (
              <div className={styles.stock}>
                {product.maleStock > 0 && (
                  <span style={{ marginRight: '1rem' }}>
                    <span className={styles.stockDot} style={{ background: '#4a90d9', display: 'inline-block', width: 10, height: 10, borderRadius: '50%', marginRight: 4 }} />
                    Đực: <strong>{product.maleStock}</strong> con
                  </span>
                )}
                {product.femaleStock > 0 && (
                  <span>
                    <span className={styles.stockDot} style={{ background: '#e87ca0', display: 'inline-block', width: 10, height: 10, borderRadius: '50%', marginRight: 4 }} />
                    Cái: <strong>{product.femaleStock}</strong> con
                  </span>
                )}
                {isOutOfStock && <span style={{ color: '#e53935' }}>Hết hàng</span>}
              </div>
            ) : (
              <div className={styles.stock}>
                <span className={`${styles.stockDot} ${totalStock > 0 ? styles.inStock : styles.outStock}`} />
                {totalStock > 0 ? `Còn hàng (${totalStock} sản phẩm) – Giao trong 1–3 ngày` : 'Hết hàng'}
              </div>
            )}

            {/* Gender selector */}
            {isGenderProduct && (
              <div className={styles.qtyRow} style={{ flexDirection: 'column', alignItems: 'flex-start', gap: '0.5rem' }}>
                <span>Giới tính:</span>
                <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
                  {genderOptions.map(opt => (
                    <button
                      key={opt.value}
                      onClick={() => { setSelectedGender(opt.value); setGenderError('') }}
                      style={{
                        padding: '0.4rem 1rem',
                        borderRadius: '20px',
                        border: '2px solid',
                        borderColor: selectedGender === opt.value ? 'var(--teal, #2a9d8f)' : '#ccc',
                        background: selectedGender === opt.value ? 'var(--teal, #2a9d8f)' : '#fff',
                        color: selectedGender === opt.value ? '#fff' : '#333',
                        cursor: 'pointer',
                        fontWeight: selectedGender === opt.value ? 600 : 400,
                        fontSize: '0.9rem',
                        transition: 'all 0.15s',
                      }}
                    >
                      {opt.label}
                      <span style={{ fontSize: '0.78rem', opacity: 0.8, marginLeft: '0.3rem' }}>
                        ({opt.stock})
                      </span>
                    </button>
                  ))}
                </div>
                {selectedGenderStock !== null && (
                  <span style={{ fontSize: '0.85rem', color: '#666' }}>
                    Còn <strong>{selectedGenderStock}</strong> {selectedGender === 'Cặp' ? 'cặp' : `con ${selectedGender?.toLowerCase()}`} trong kho
                  </span>
                )}
                {genderError && (
                  <span style={{ color: '#e53935', fontSize: '0.85rem' }}>{genderError}</span>
                )}
              </div>
            )}

            <div className={styles.qtyRow}>
              <span>Số lượng:</span>
              <div className={styles.qtyControl}>
                <button onClick={() => setQty(q => Math.max(1, q - 1))}>−</button>
                <span>{qty}</span>
                <button onClick={() => setQty(q => q + 1)}>+</button>
              </div>
            </div>

            <div className={styles.actions}>
              <button className={`${styles.btnAdd} ${added ? styles.added : ''}`} onClick={handleAdd} disabled={isOutOfStock}>
                {added ? '✓ Đã thêm vào giỏ' : '🛒 Thêm vào giỏ hàng'}
              </button>
              <button className={styles.btnBuy} onClick={handleBuyNow} disabled={isOutOfStock}>
                Mua ngay
              </button>
            </div>

            <a href="tel:18002782" className={styles.consult}>💬 Liên hệ tư vấn miễn phí</a>

            <div className={styles.perks}>
              <div>🚚 Miễn phí giao hàng trên 500K</div>
              <div>🔄 Đổi trả trong 7 ngày</div>
              <div>✅ Đảm bảo sức khoẻ sinh vật</div>
              <div>💳 Hỗ trợ trả góp 0%</div>
            </div>
          </div>
        </div>

        {/* Tabs */}
        <div className={styles.tabs}>
          <div className={styles.tabNav}>
            {[['desc','Mô tả'], ['care','Cách chăm sóc'], ['habitat','Môi trường'], ['compatible','Nuôi chung']].map(([key, label]) => (
              <button key={key} className={`${styles.tabBtn} ${tab === key ? styles.activeTab : ''}`} onClick={() => setTab(key)}>
                {label}
              </button>
            ))}
          </div>
          <div className={styles.tabContent}>
            {tab === 'desc' && <p>{product.description || 'Không có mô tả'}</p>}
            {tab === 'care' && <p>{product.careInstructions || 'Thông tin chăm sóc sẽ được cập nhật'}</p>}
            {tab === 'habitat' && <p>{product.environment || 'Thông tin môi trường sẽ được cập nhật'}</p>}
            {tab === 'compatible' && <p>Thông tin nuôi chung sẽ được cập nhật</p>}
          </div>
        </div>

        {/* Related */}
        {related.length > 0 && (
          <div className={styles.related}>
            <h2>Sản phẩm liên quan</h2>
            <div className={styles.relatedGrid}>
              {related.map(p => <ProductCard key={p.id} product={p} />)}
            </div>
          </div>
        )}
      </div>
    </main>
  )
}
