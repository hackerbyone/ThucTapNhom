import { useEffect, useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import { blogService } from '../services/blog/blogService'
import styles from './BlogDetail.module.css'

const formatDate = (value) => {
  if (!value) return null
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return null
  return date.toLocaleDateString('vi-VN')
}

export default function BlogDetail() {
  const { id } = useParams()
  const [blog, setBlog] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    const fetchBlog = async () => {
      try {
        setLoading(true)
        setError('')
        const data = await blogService.getById(id)
        if (!data?.isActive) {
          setError('Bài viết này hiện chưa được xuất bản.')
          setBlog(null)
          return
        }
        setBlog(data)
      } catch (err) {
        setError(err.message || 'Không thể tải bài viết')
      } finally {
        setLoading(false)
      }
    }

    if (id) fetchBlog()
  }, [id])

  if (loading) {
    return (
      <main className={styles.page}>
        <div className={styles.container}>
          <div className={styles.state}>Đang tải bài viết...</div>
        </div>
      </main>
    )
  }

  if (error || !blog) {
    return (
      <main className={styles.page}>
        <div className={styles.container}>
          <div className={styles.state}>
            <h1>Không tìm thấy bài viết</h1>
            <p>{error || 'Bài viết không tồn tại hoặc đã bị gỡ.'}</p>
            <Link to="/blog" className={styles.backLink}>Quay lại blog</Link>
          </div>
        </div>
      </main>
    )
  }

  const publishDate = formatDate(blog.publishDate)
  const content = blog.content || ''

  return (
    <main className={styles.page}>
      <article className={styles.container}>
        <Link to="/blog" className={styles.backLink}>Quay lại blog</Link>

        <header className={styles.header}>
          <div className={styles.meta}>
            {publishDate && <span>{publishDate}</span>}
            <span>{blog.author || 'Admin'}</span>
          </div>
          <h1>{blog.title}</h1>
          {blog.shortDescription && <p>{blog.shortDescription}</p>}
        </header>

        {blog.imageUrl ? (
          <img
            className={styles.cover}
            src={blog.imageUrl}
            alt={blog.title}
            onError={(e) => { e.currentTarget.style.display = 'none' }}
          />
        ) : (
          <div className={styles.coverFallback} />
        )}

        <div className={styles.content}>
          {content.split(/\n{2,}/).map((block, index) => (
            <p key={index}>{block.trim()}</p>
          ))}
        </div>
      </article>
    </main>
  )
}
