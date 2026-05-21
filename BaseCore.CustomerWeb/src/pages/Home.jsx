import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { productService } from '../services/product/productService'
import { categoryService } from '../services/category/categoryService'
// Import API Blog chuẩn của team bạn
import { blogService } from '../services/blog/blogService' 
import ProductCard from '../components/ProductCard'
import styles from './Home.module.css'

function formatPrice(n) { return n.toLocaleString('vi-VN') + 'đ' }

export default function Home() {
  const [featured, setFeatured] = useState([])
  const [categories, setCategories] = useState([])
  const [blogs, setBlogs] = useState([]) // Giỏ đựng Blog từ DB
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true)
        
        // Fetch featured products
        const productsRes = await productService.getAll('', null, 1, 20)
        const featuredProducts = productsRes.items.slice(0, 8)
        setFeatured(featuredProducts)

        // Fetch categories
        const categoriesRes = await categoryService.getAll()
        setCategories(categoriesRes)

        // Fetch blogs từ CSDL
        try {
            const blogsRes = await blogService.getAll({ page: 1, pageSize: 10 });
            let blogsArray = blogsRes.items || blogsRes.data || blogsRes || [];
            // Chỉ lấy bài Active và lấy 3 bài mới nhất
            const activeBlogs = blogsArray.filter(b => b.isActive).slice(0, 3);
            setBlogs(activeBlogs);
        } catch (blogErr) {
            console.error('Lỗi tải Blog trang chủ:', blogErr);
        }

      } catch (err) {
        console.error('Error fetching data:', err)
        setError(err.message)
      } finally {
        setLoading(false)
      }
    }

    fetchData()
  }, [])

  return (
    <main>
      {/* HERO */}
      <section className={styles.hero}>
        <div className={styles.heroBubbles}>
          {[...Array(8)].map((_, i) => (
            <span key={i} className={styles.bubble} style={{
              left: `${10 + i * 11}%`,
              animationDelay: `${i * 0.7}s`,
              width: `${8 + (i % 3) * 6}px`,
              height: `${8 + (i % 3) * 6}px`,
            }} />
          ))}
        </div>
        <div className={styles.heroContent}>
          <span className={styles.heroBadge}>🌊 Mới về: Cá Discus Pigeon nhập khẩu</span>
          <h1 className={styles.heroTitle}>
            Thiên Đường<br />
            <em>Cá Cảnh</em> & Thủy Sinh
          </h1>
          <p className={styles.heroSub}>
            Hơn 500 loài cá cảnh, cây thủy sinh và thiết bị cao cấp.<br />
            Giao hàng toàn quốc – Bảo đảm sức khoẻ sinh vật.
          </p>
          <div className={styles.heroBtns}>
            <Link to="/products" className={styles.btnPrimary}>Khám phá ngay →</Link>
            <Link to="/blog" className={styles.btnGhost}>Đọc blog 📖</Link>
          </div>
          <div className={styles.heroStats}>
            <div><strong>500+</strong><span>Loài cá</span></div>
            <div><strong>10K+</strong><span>Khách hàng</span></div>
            <div><strong>5 năm</strong><span>Kinh nghiệm</span></div>
          </div>
        </div>
        <div className={styles.heroImage}>
          <img
            src="https://images.pexels.com/photos/6043431/pexels-photo-6043431.jpeg"
            alt="Bể cá cảnh"
          />
          <div className={styles.heroImageGlow} />
        </div>
      </section>

      {/* CATEGORIES */}
      {categories.length > 0 && (
        <section className={styles.section}>
          <div className={styles.container}>
            <div className={styles.sectionHead}>
              <h2>Danh Mục Sản Phẩm</h2>
              <Link to="/products">Xem tất cả →</Link>
            </div>
            <div className={styles.catGrid}>
              {categories.map(cat => (
                <Link key={cat.id} to={`/products?cat=${cat.id}`} className={styles.catCard}>
                  <span className={styles.catIcon}>📦</span>
                  <strong>{cat.name}</strong>
                  <span>{cat.description || 'Khám phá danh mục này'}</span>
                </Link>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* FEATURED PRODUCTS */}
      <section className={styles.section} style={{ background: 'var(--pearl)' }}>
        <div className={styles.container}>
          <div className={styles.sectionHead}>
            <h2>Sản Phẩm Nổi Bật</h2>
            <Link to="/products">Xem thêm →</Link>
          </div>
          {loading ? (
            <div className={styles.loading}>Đang tải...</div>
          ) : error ? (
            <div className={styles.error}>Lỗi: {error}</div>
          ) : featured.length > 0 ? (
            <div className={styles.productGrid}>
              {featured.map(p => <ProductCard key={p.id} product={p} />)}
            </div>
          ) : (
            <div className={styles.noData}>Chưa có sản phẩm nổi bật</div>
          )}
        </div>
      </section>

      {/* BANNER */}
      <section className={styles.banner}>
        <div className={styles.bannerContent}>
          <h2>Tư vấn miễn phí từ chuyên gia</h2>
          <p>Không biết bắt đầu từ đâu? Đội ngũ chuyên gia của chúng tôi sẵn sàng hỗ trợ bạn 24/7 để setup bể cá cảnh hoàn hảo.</p>
          <a href="tel:18002782" className={styles.btnPrimary}>📞 Gọi ngay miễn phí</a>
        </div>
        <div className={styles.bannerDeco}>🐠🌿🐡🦐🐟</div>
      </section>

      {/* BLOG */}
      <section className={styles.section}>
        <div className={styles.container}>
          <div className={styles.sectionHead}>
            <h2>Blog & Kinh Nghiệm</h2>
            <Link to="/blog">Xem tất cả →</Link>
          </div>
          
          <div className={styles.blogGrid}>
            {blogs.length > 0 ? (
                blogs.map(post => (
                  <article key={post.id} className={styles.blogCard}>
                    <div className={styles.blogImg}>
                      <img src={post.imageUrl || 'https://images.unsplash.com/photo-1535591273668-578e31182c4f?w=600&q=80'} alt={post.title} />
                      <span className={styles.blogTag}>Tin tức</span>
                    </div>
                    <div className={styles.blogBody}>
                      <div className={styles.blogMeta}>
                        <span>{new Date(post.publishDate).toLocaleDateString('vi-VN')}</span>
                        <span>✍️ {post.author || 'Admin'}</span>
                      </div>
                      <h3>{post.title}</h3>
                      <p>{post.shortDescription}</p>
                      <Link to={`/blog/${post.id}`} className={styles.blogLink}>Đọc tiếp →</Link>
                    </div>
                  </article>
                ))
            ) : (
                <div className={styles.noData}>Đang cập nhật bài viết mới...</div>
            )}
          </div>

        </div>
      </section>
    </main>
  )
}