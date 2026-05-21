import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom' // Dùng Link để chuyển trang mượt mà
import { blogService } from '../services/blog/blogService' // Gọi "vũ khí" của team
import styles from './Blog.module.css'

export default function Blog() {
  const [posts, setPosts] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  useEffect(() => {
    const fetchBlogs = async () => {
      try {
        setLoading(true)
        // 1. Dùng blogService chuẩn chỉnh
        const res = await blogService.getAll({ page: 1, pageSize: 20 })
        
        // 2. Bóc đúng vỏ hộp items
        const blogsArray = res.items || res.data || res || []
        
        // 3. Chỉ lấy những bài viết đang được Active
        const activeBlogs = blogsArray.filter(b => b.isActive)
        setPosts(activeBlogs)
        
      } catch (err) {
        setError(err.message || 'Không thể tải bài viết')
      } finally {
        setLoading(false)
      }
    }
    fetchBlogs()
  }, [])

  if (loading) return (
    <main className={styles.page}>
      <div className={styles.container}>
        <p style={{ textAlign: 'center', padding: '4rem' }}>Đang tải bài viết...</p>
      </div>
    </main>
  )

  if (error) return (
    <main className={styles.page}>
      <div className={styles.container}>
        <p style={{ textAlign: 'center', padding: '4rem', color: 'red' }}>Lỗi: {error}</p>
      </div>
    </main>
  )

  return (
    <main className={styles.page}>
      <div className={styles.container}>
        <div className={styles.hero}>
          <h1>Blog & Kinh Nghiệm</h1>
          <p>Hướng dẫn nuôi cá, chăm sóc thủy sinh và chia sẻ từ cộng đồng</p>
        </div>

        {posts.length === 0 ? (
          <p style={{ textAlign: 'center', padding: '2rem', color: '#888' }}>
            Chưa có bài viết nào.
          </p>
        ) : (
          <div className={styles.grid}>
            {posts.map(post => (
              <article key={post.id} className={styles.card}>
                <div className={styles.img}>
                  {/* Cập nhật imageUrl theo chuẩn SQL Server */}
                  <img
                    src={post.imageUrl || '/placeholder.jpg'}
                    alt={post.title}
                    onError={e => { e.target.src = '/placeholder.jpg' }}
                  />
                  <span className={styles.tag}>Tin tức</span>
                </div>
                <div className={styles.body}>
                  <div className={styles.meta}>
                    {/* Đổi createdAt thành publishDate */}
                    {post.publishDate && <span>📅 {new Date(post.publishDate).toLocaleDateString('vi-VN')}</span>}
                    <span>✍️ {post.author || 'Admin'}</span>
                  </div>
                  <h2>{post.title}</h2>
                  {/* Hiển thị shortDescription */}
                  <p>{post.shortDescription || (post.content && post.content.slice(0, 120) + '...')}</p>
                  
                  {/* Nâng cấp thẻ <a> thành <Link> để bấm vào không bị giật trang */}
                  <Link to={`/blog/${post.id}`} className={styles.link}>Đọc bài viết →</Link>
                </div>
              </article>
            ))}
          </div>
        )}
      </div>
    </main>
  )
}