import { useState, useEffect } from 'react'
import { useSearchParams } from 'react-router-dom'
import { productService } from '../services/product/productService'
import { categoryService } from '../services/category/categoryService'
import ProductCard from '../components/ProductCard'
import styles from './Products.module.css'

export default function Products() {
  const [searchParams, setSearchParams] = useSearchParams()
  const catFilter = searchParams.get('cat') || ''
  const query = searchParams.get('q') || ''
  const [sort, setSort] = useState('default')
  const [priceRange, setPriceRange] = useState(2000000)
  const [page, setPage] = useState(1)
  const [pageSize] = useState(12)

  const [products, setProducts] = useState([])
  const [categories, setCategories] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [totalCount, setTotalCount] = useState(0)

  // Fetch products based on filters
  useEffect(() => {
    const fetchProducts = async () => {
      try {
        setLoading(true)
        const categoryId = catFilter ? parseInt(catFilter) : null
        const res = await productService.getAll(query, categoryId, page, pageSize)
        setProducts(res.items)
        setTotalCount(res.totalCount)
      } catch (err) {
        console.error('Error fetching products:', err)
        setError(err.message)
      } finally {
        setLoading(false)
      }
    }

    fetchProducts()
  }, [query, catFilter, page])

  // Fetch categories
  useEffect(() => {
    const fetchCategories = async () => {
      try {
        const res = await categoryService.getAll()
        setCategories(res)
      } catch (err) {
        console.error('Error fetching categories:', err)
      }
    }

    fetchCategories()
  }, [])

  // Sort products locally
  const sorted = [...products].sort((a, b) => {
    if (sort === 'price-asc') return (a.price || 0) - (b.price || 0)
    if (sort === 'price-desc') return (b.price || 0) - (a.price || 0)
    if (sort === 'rating') return (b.rating || 0) - (a.rating || 0)
    return 0
  })

  // Filter by price locally
  const filtered = sorted.filter(p => (p.price || 0) <= priceRange)

  const handleCategoryClick = (id) => {
    setPage(1)
    if (id === 'all') {
      setSearchParams({})
    } else {
      setSearchParams({ cat: id })
    }
  }

  return (
    <main className={styles.page}>
      <div className={styles.container}>
        {/* Sidebar */}
        <aside className={styles.sidebar}>
          <div className={styles.filterGroup}>
            <h3>Danh mục</h3>
            <button
              className={`${styles.catBtn} ${!catFilter ? styles.active : ''}`}
              onClick={() => handleCategoryClick('all')}
            >Tất cả ({totalCount})</button>
            {categories.map(c => (
              <button
                key={c.id}
                className={`${styles.catBtn} ${catFilter === c.id.toString() ? styles.active : ''}`}
                onClick={() => handleCategoryClick(c.id)}
              >
                📦 {c.name}
              </button>
            ))}
          </div>

          <div className={styles.filterGroup}>
            <h3>Giá tối đa</h3>
            <input
              type="range"
              min={10000}
              max={3000000}
              step={10000}
              value={priceRange}
              onChange={e => setPriceRange(+e.target.value)}
              className={styles.range}
            />
            <div className={styles.rangeLabel}>
              <span>0đ</span>
              <span>{priceRange.toLocaleString('vi-VN')}đ</span>
            </div>
          </div>
        </aside>

        {/* Main */}
        <div className={styles.main}>
          <div className={styles.toolbar}>
            <p className={styles.count}>
              {query ? `Kết quả cho "${query}": ` : ''}<strong>{filtered.length}</strong> sản phẩm
            </p>
            <select className={styles.sort} value={sort} onChange={e => setSort(e.target.value)}>
              <option value="default">Mặc định</option>
              <option value="price-asc">Giá tăng dần</option>
              <option value="price-desc">Giá giảm dần</option>
              <option value="rating">Đánh giá cao nhất</option>
            </select>
          </div>

          {loading ? (
            <div className={styles.empty}>
              <span>⏳</span>
              <p>Đang tải...</p>
            </div>
          ) : error ? (
            <div className={styles.empty}>
              <span>❌</span>
              <p>Lỗi: {error}</p>
            </div>
          ) : filtered.length === 0 ? (
            <div className={styles.empty}>
              <span>🔍</span>
              <p>Không tìm thấy sản phẩm phù hợp</p>
            </div>
          ) : (
            <div className={styles.grid}>
              {filtered.map(p => <ProductCard key={p.id} product={p} />)}
            </div>
          )}

          {/* Pagination */}
          {!loading && filtered.length > 0 && (
            <div className={styles.pagination}>
              <button 
                disabled={page === 1}
                onClick={() => setPage(p => p - 1)}
              >← Trước</button>
              <span>Trang {page}</span>
              <button 
                disabled={page * pageSize >= totalCount}
                onClick={() => setPage(p => p + 1)}
              >Tiếp →</button>
            </div>
          )}
        </div>
      </div>
    </main>
  )
}
