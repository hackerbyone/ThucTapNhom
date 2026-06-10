import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { categoryService } from '../services/category/categoryService' // Gọi API giống Header
import styles from './Footer.module.css'

export default function Footer() {
  const [categories, setCategories] = useState([])

  // Chạy ngầm lấy danh mục cho Footer
  useEffect(() => {
    const fetchCategories = async () => {
      try {
        const res = await categoryService.getAll()
        // Chỉ lấy tối đa 4 danh mục để Footer không bị quá dài
        setCategories(res.slice(0, 4)) 
      } catch (error) {
        console.error('Lỗi tải danh mục ở Footer:', error)
      }
    }
    fetchCategories()
  }, [])

  return (
    <footer className={styles.footer}>
      <div className={styles.wave}>
        <svg viewBox="0 0 1440 60" preserveAspectRatio="none">
          <path d="M0,30 C360,60 1080,0 1440,30 L1440,60 L0,60 Z" fill="#0a1628"/>
        </svg>
      </div>
      <div className={styles.inner}>
        <div className={styles.brand}>
          <div className={styles.logo}>🐠 AquaViet</div>
          <p>Thiên đường cá cảnh và thủy sinh. Nơi mang lại niềm vui từ những sinh vật kỳ diệu dưới nước.</p>
          <div className={styles.social}>
            <a href="#" aria-label="Facebook">📘</a>
            <a href="#" aria-label="YouTube">▶️</a>
            <a href="#" aria-label="Instagram">📷</a>
            <a href="#" aria-label="TikTok">🎵</a>
          </div>
        </div>
        
        <div className={styles.col}>
          <h4>Danh mục</h4>
          {/* Vòng lặp in danh mục tự động giống Header */}
          {categories.length > 0 ? (
            categories.map(cat => (
              <Link key={cat.id} to={`/products?cat=${cat.id}`}>
                {cat.name}
              </Link>
            ))
          ) : (
            // Nội dung dự phòng trong lúc chờ tải API
            <p style={{color: 'rgba(255,255,255,0.5)'}}>Đang tải...</p>
          )}
        </div>

        <div className={styles.col}>
          <h4>Hỗ trợ</h4>
          <a href="#">Chính sách đổi trả</a>
          <a href="#">Bảo hành</a>
          <a href="#">Vận chuyển</a>
          <a href="#">FAQ</a>
        </div>
        
        <div className={styles.col}>
          <h4>Liên hệ</h4>
          <p>📍 236, Hoàng Quốc Việt, Phường Nghĩa Đô, Hà Nội</p>
          <p>📞 1800-AQUA (0286-688-2782)</p>
          <p>✉️ trinhminhtri392@gmail.com</p>
          <p>🕐 Mở cửa: 8:00 – 21:00</p>
        </div>
      </div>
      
      <div className={styles.bottom}>
        {/* Dùng Date().getFullYear() để năm tự động cập nhật */}
        <span>© {new Date().getFullYear()} AquaViet. Tất cả quyền được bảo lưu.</span>
        <span>Thiết kế với 💙 cho cộng đồng cá cảnh Việt Nam</span>
      </div>
    </footer>
  )
}