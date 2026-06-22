import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { blogService } from '../services/blog/blogService'
import styles from './Blog.module.css'

const fallbackImage = 'https://images.unsplash.com/photo-1524704796725-9fc3044a58b2?w=900&q=80'

const formatDate = (value) => {
  if (!value) return 'Chưa cập nhật'
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return 'Chưa cập nhật'
  return date.toLocaleDateString('vi-VN')
}

const getDescription = (post) => {
  const description = post.shortDescription || post.content || ''
  if (!description) return 'Bài viết chia sẻ kinh nghiệm chăm sóc cá cảnh và thủy sinh.'
  return description.length > 150 ? `${description.slice(0, 150).trim()}...` : description
}

export default function Blog() {
  const [posts, setPosts] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  useEffect(() => {
    const fetchBlogs = async () => {
      try {
        setLoading(true)
        setError(null)
        const res = await blogService.getAll({ page: 1, pageSize: 20 })
        const blogsArray = res.items || res.data || res || []
        const activeBlogs = blogsArray.filter(blog => blog.isActive !== false)
        setPosts(activeBlogs)
      } catch (err) {
        setError(err.message || 'Không thể tải bài viết')
      } finally {
        setLoading(false)
      }
    }

    fetchBlogs()
  }, [])

  if (loading) {
    return (
      <main className={styles.page}>
        <div className={styles.container}>
          <div className={styles.state}>Đang tải bài viết...</div>
        </div>
      </main>
    )
  }

  if (error) {
    return (
      <main className={styles.page}>
        <div className={styles.container}>
          <div className={styles.stateError}>Lỗi: {error}</div>
        </div>
      </main>
    )
  }

  return (
    <main className={styles.page}>
      <div className={styles.container}>
        <header className={styles.hero}>
          <h1>Blog & Kinh Nghiệm</h1>
          <p>Hướng dẫn nuôi cá, chăm sóc thủy sinh và chia sẻ kinh nghiệm từ cộng đồng.</p>
        </header>

        {posts.length === 0 ? (
          <div className={styles.state}>Chưa có bài viết nào.</div>
        ) : (
          <div className={styles.grid}>
            {posts.map(post => {
              const title = post.title || 'Bài viết chưa có nhan đề'
              const author = post.author || 'Admin'

              return (
                <article key={post.id} className={styles.card}>
                  <Link to={`/blog/${post.id}`} className={styles.img} aria-label={`Đọc bài viết ${title}`}>
                    <img
                      src={post.imageUrl || fallbackImage}
                      alt={title}
                      onError={e => { e.currentTarget.src = fallbackImage }}
                    />
                    <span className={styles.tag}>Tin tức</span>
                  </Link>

                  <div className={styles.body}>
                    <div className={styles.meta}>
                      <span>{formatDate(post.publishDate)}</span>
                      <span>Tác giả: {author}</span>
                    </div>

                    <h2>
                      <Link to={`/blog/${post.id}`} className={styles.titleLink}>{title}</Link>
                    </h2>

                    <p>{getDescription(post)}</p>

                    <Link to={`/blog/${post.id}`} className={styles.link}>
                      Đọc bài viết
                    </Link>
                  </div>
                </article>
              )
            })}
          </div>
        )}
      </div>
    </main>
  )
}
