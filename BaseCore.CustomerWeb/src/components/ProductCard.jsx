import { Link } from 'react-router-dom'
import { useCart } from '../context/CartContext'
import styles from './ProductCard.module.css'

function formatPrice(n) {
  const v = n || 0
  return v.toLocaleString('vi-VN') + 'đ'
}

export default function ProductCard({ product }) {
  const { add } = useCart()
  const discount = product.oldPrice
    ? Math.round((1 - product.price / product.oldPrice) * 100)
    : null

  return (
    <div className={styles.card}>
      <Link to={`/product/${product.id}`} className={styles.imageWrap}>
        <img src={product.imageUrl || product.image || 'https://via.placeholder.com/300x300'} alt={product.name} loading="lazy" />
        {discount && <span className={styles.discount}>-{discount}%</span>}
      </Link>
      <div className={styles.body}>
        <Link to={`/product/${product.id}`}>
          <h3 className={styles.name}>{product.name}</h3>
        </Link>
        <div className={styles.rating}>
          {(() => {
            const r = Math.max(0, Math.min(5, Math.round(product.rating || 0)))
            return (
              <>
                {'★'.repeat(r)}{'☆'.repeat(5 - r)}
              </>
            )
          })()}
          <span>{Number(product.rating || 0).toFixed(1)} ({product.reviews || 0})</span>
        </div>
        <div className={styles.priceRow}>
          <span className={styles.price}>{formatPrice(product.price)}</span>
          {product.oldPrice && <span className={styles.oldPrice}>{formatPrice(product.oldPrice)}</span>}
        </div>
        <button
          className={styles.addBtn}
          onClick={() => add(product)}
        >
          + Thêm vào giỏ
        </button>
      </div>
    </div>
  )
}
