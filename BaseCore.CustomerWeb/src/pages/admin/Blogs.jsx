import React, { useState, useEffect } from 'react';
import { blogService } from '../../services/blog/blogService';
import { uploadService } from '../../services/upload/uploadService';
import { useAuth } from '../../context/AuthContext';

const Blogs = () => {
    const [blogs, setBlogs] = useState([]);
    const [loading, setLoading] = useState(true);
    const [showModal, setShowModal] = useState(false);
    const [editingBlog, setEditingBlog] = useState(null);
    const [searchQuery, setSearchQuery] = useState('');
    const [currentPage, setCurrentPage] = useState(1);
    const [itemsPerPage] = useState(5);
    const [formData, setFormData] = useState({
        title: '',
        shortDescription: '', 
        content: '',
        imageUrl: '',
        author: '',         
        isActive: true      
    });
    const [error, setError] = useState('');
    const [uploadingImage, setUploadingImage] = useState(false);
    const { isAdmin } = useAuth();

    useEffect(() => {
        loadBlogs();
    }, []);

    const loadBlogs = async () => {
        setLoading(true);
        try {
            const response = await blogService.getAll();
            const list = Array.isArray(response)
                ? response
                : response.items ?? response.data?.items ?? response.data ?? response.records ?? [];
            setBlogs(list); 
        } catch (error) {
            console.error('Lỗi khi tải danh sách blog:', error);
        } finally {
            setLoading(false);
        }
    };

    const openModal = (blog = null) => {
        if (blog) {
            setEditingBlog(blog);
            setFormData({
                title: blog.title || '',
                shortDescription: blog.shortDescription || '',
                content: blog.content || '',
                imageUrl: blog.imageUrl || '',
                author: blog.author || '',
                isActive: blog.isActive !== undefined ? blog.isActive : true
            });
        } else {
            setEditingBlog(null);
            setFormData({ title: '', shortDescription: '', content: '', imageUrl: '', author: '', isActive: true });
        }
        setError('');
        setShowModal(true);
    };

    const closeModal = () => {
        setShowModal(false);
        setEditingBlog(null);
        setError('');
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError('');
        try {
            if (editingBlog) {
                await blogService.update(editingBlog.id, formData);
            } else {
                await blogService.create(formData);
            }
            closeModal();
            loadBlogs();
        } catch (error) {
            setError(error.response?.data?.message || 'Thao tác thất bại');
        }
    };

    const handleImageUpload = async (e) => {
        const file = e.target.files[0];
        if (!file) return;
        setUploadingImage(true);
        setError('');
        try {
            const result = await uploadService.uploadImage(file);
            setFormData(prev => ({ ...prev, imageUrl: result.url }));
        } catch (err) {
            setError('Tải ảnh thất bại: ' + err.message);
        } finally {
            setUploadingImage(false);
            e.target.value = '';
        }
    };

    const handleDelete = async (id) => {
        if (!window.confirm('Bạn có chắc chắn muốn xóa bài viết này?')) return;
        try {
            await blogService.delete(id);
            loadBlogs();
        } catch (error) {
            alert('Xóa bài viết thất bại.');
        }
    };

    // Lọc danh sách blog theo tìm kiếm
    const filteredBlogs = blogs.filter(blog => {
        const query = searchQuery.toLowerCase();
        return (
            blog.title.toLowerCase().includes(query) ||
            (blog.author && blog.author.toLowerCase().includes(query)) ||
            (blog.shortDescription && blog.shortDescription.toLowerCase().includes(query))
        );
    });

    // Tính toán phân trang
    const totalPages = Math.ceil(filteredBlogs.length / itemsPerPage);
    const indexOfLastBlog = currentPage * itemsPerPage;
    const indexOfFirstBlog = indexOfLastBlog - itemsPerPage;
    const currentBlogs = filteredBlogs.slice(indexOfFirstBlog, indexOfLastBlog);

    // Reset trang khi tìm kiếm thay đổi
    const handleSearchChange = (e) => {
        setSearchQuery(e.target.value);
        setCurrentPage(1);
    };

    const handleClearSearch = () => {
        setSearchQuery('');
        setCurrentPage(1);
    };

    const goToPage = (pageNumber) => {
        setCurrentPage(Math.max(1, Math.min(pageNumber, totalPages)));
    };

    return (
        <>
            <div className="content-header">
                <div className="container-fluid">
                    <div className="row mb-2">
                        <div className="col-sm-6">
                            <h1 className="m-0">
                                <i className="fas fa-blog mr-2"></i>Quản lý Bài viết
                            </h1>
                        </div>
                        <div className="col-sm-6">
                            <ol className="breadcrumb float-sm-right">
                                <li className="breadcrumb-item"><a href="#">Trang chủ</a></li>
                                <li className="breadcrumb-item active">Blog</li>
                            </ol>
                        </div>
                    </div>
                </div>
            </div>

            <section className="content">
                <div className="container-fluid">
                    <div className="card card-primary">
                        <div className="card-header">
                            <div className="row align-items-center">
                                <div className="col-md-6">
                                    <h3 className="card-title m-0">
                                        <i className="fas fa-list mr-2"></i>Danh sách bài viết
                                    </h3>
                                </div>
                                <div className="col-md-6 text-right">
                                    {isAdmin() && (
                                        <button className="btn btn-success btn-sm" onClick={() => openModal()}>
                                            <i className="fas fa-plus mr-1"></i> Thêm bài viết
                                        </button>
                                    )}
                                </div>
                            </div>
                        </div>
                        <div className="card-body">
                            {/* Thanh tìm kiếm */}
                            <div className="row mb-3">
                                <div className="col-md-8">
                                    <div className="input-group">
                                        <input
                                            type="text"
                                            className="form-control"
                                            placeholder="Tìm kiếm theo tiêu đề, tác giả..."
                                            value={searchQuery}
                                            onChange={handleSearchChange}
                                        />
                                        <div className="input-group-append">
                                            <button className="btn btn-outline-secondary" type="button" onClick={handleClearSearch}>
                                                <i className="fas fa-times"></i> Xóa
                                            </button>
                                        </div>
                                    </div>
                                </div>
                                <div className="col-md-4 text-right text-muted">
                                    Tìm thấy: <strong>{filteredBlogs.length}</strong> bài viết
                                </div>
                            </div>

                            {loading ? (
                                <div className="text-center py-4"><div className="spinner-border text-primary"></div></div>
                            ) : (
                                <table className="table table-bordered table-striped">
                                    <thead className="text-center">
                                        <tr>
                                            <th style={{ width: '60px' }}>ID</th>
                                            <th style={{ width: '100px' }}>Hình ảnh</th>
                                            <th>Tiêu đề</th>
                                            <th>Tác giả</th>
                                            {isAdmin() && <th style={{ width: '120px' }}>Thao tác</th>}
                                        </tr>
                                    </thead>
                                    <tbody className="text-center align-middle">
                                        {filteredBlogs.length === 0 ? (
                                            <tr><td colSpan={isAdmin() ? 5 : 4}>{searchQuery ? 'Không tìm thấy bài viết nào' : 'Chưa có bài viết nào'}</td></tr>
                                        ) : (
                                            currentBlogs.map(blog => (
                                                <tr key={blog.id}>
                                                    <td>{blog.id}</td>
                                                    <td>
                                                        {blog.imageUrl ? (
                                                            <img 
                                                                src={blog.imageUrl} 
                                                                alt={blog.title} 
                                                                style={{ 
                                                                    width: '60px', 
                                                                    height: '60px', 
                                                                    objectFit: 'cover',
                                                                    borderRadius: '4px'
                                                                }} 
                                                                onError={(e) => {
                                                                    e.target.src = 'data:image/svg+xml,%3Csvg xmlns="http://www.w3.org/2000/svg" width="60" height="60"%3E%3Crect fill="%23e0e0e0" width="60" height="60"/%3E%3Ctext x="50%25" y="50%25" font-size="12" fill="%23999" text-anchor="middle" dominant-baseline="middle"%3ENo Image%3C/text%3E%3C/svg%3E'
                                                                }}
                                                            />
                                                        ) : (
                                                            <span className="text-muted">Không có ảnh</span>
                                                        )}
                                                    </td>
                                                    <td className="text-left font-weight-bold">{blog.title}</td>
                                                    <td className="text-left">{blog.author || 'N/A'}</td>
                                                    {isAdmin() && (
                                                        <td>
                                                            <button className="btn btn-sm btn-info mr-1" onClick={() => openModal(blog)} title="Sửa">
                                                                <i className="fas fa-edit"></i>
                                                            </button>
                                                            <button className="btn btn-sm btn-danger" onClick={() => handleDelete(blog.id)} title="Xóa">
                                                                <i className="fas fa-trash"></i>
                                                            </button>
                                                        </td>
                                                    )}
                                                </tr>
                                            ))
                                        )}
                                    </tbody>
                                </table>
                            )}
                            
                            {/* Phân trang */}
                            {!loading && filteredBlogs.length > 0 && (
                                <nav className="d-flex justify-content-between align-items-center mt-4 flex-wrap">
                                    <div className="text-muted small mb-2 mb-md-0">
                                        Trang {currentPage} / {totalPages} • Hiển thị {indexOfFirstBlog + 1}-{Math.min(indexOfLastBlog, filteredBlogs.length)} trên {filteredBlogs.length}
                                    </div>
                                    {totalPages > 1 && (
                                        <ul className="pagination mb-0">
                                            <li className={`page-item ${currentPage === 1 ? 'disabled' : ''}`}>
                                                <button type="button" className="page-link" onClick={() => goToPage(1)} disabled={currentPage === 1}>
                                                    <i className="fas fa-step-backward"></i>
                                                </button>
                                            </li>
                                            <li className={`page-item ${currentPage === 1 ? 'disabled' : ''}`}>
                                                <button type="button" className="page-link" onClick={() => goToPage(currentPage - 1)} disabled={currentPage === 1}>
                                                    Trước
                                                </button>
                                            </li>
                                            
                                            {Array.from({ length: totalPages }, (_, i) => i + 1).map(pageNum => {
                                                const isNearCurrent = Math.abs(pageNum - currentPage) <= 1;
                                                const isFirst = pageNum === 1;
                                                const isLast = pageNum === totalPages;
                                                
                                                if (isNearCurrent || isFirst || isLast) {
                                                    return (
                                                        <li key={pageNum} className={`page-item ${currentPage === pageNum ? 'active' : ''}`}>
                                                            <button type="button" className="page-link" onClick={() => goToPage(pageNum)}>
                                                                {pageNum}
                                                            </button>
                                                        </li>
                                                    );
                                                } else if (pageNum === 2 && !isNearCurrent) {
                                                    return <li key="dots-start" className="page-item disabled"><span className="page-link">...</span></li>;
                                                } else if (pageNum === totalPages - 1 && !isNearCurrent) {
                                                    return <li key="dots-end" className="page-item disabled"><span className="page-link">...</span></li>;
                                                }
                                                return null;
                                            })}
                                            
                                            <li className={`page-item ${currentPage === totalPages ? 'disabled' : ''}`}>
                                                <button type="button" className="page-link" onClick={() => goToPage(currentPage + 1)} disabled={currentPage === totalPages}>
                                                    Sau
                                                </button>
                                            </li>
                                            <li className={`page-item ${currentPage === totalPages ? 'disabled' : ''}`}>
                                                <button type="button" className="page-link" onClick={() => goToPage(totalPages)} disabled={currentPage === totalPages}>
                                                    <i className="fas fa-step-forward"></i>
                                                </button>
                                            </li>
                                        </ul>
                                    )}
                                </nav>
                            )}
                        </div>
                    </div>
                </div>
            </section>

            {/* Modal Form */}
            {showModal && (
                <div className="modal fade show" style={{ display: 'block' }} tabIndex="-1">
                    <div className="modal-dialog modal-lg">
                        <div className="modal-content">
                            <div className="modal-header">
                                <h5 className="modal-title">
                                    <i className={`fas fa-${editingBlog ? 'edit' : 'plus'} mr-2`}></i>
                                    {editingBlog ? 'Chỉnh sửa bài viết' : 'Thêm bài viết mới'}
                                </h5>
                                <button type="button" className="close text-white" onClick={closeModal}><span>&times;</span></button>
                            </div>
                            <form onSubmit={handleSubmit}>
                                <div className="modal-body text-dark">
                                    {error && <div className="alert alert-danger">{error}</div>}
                                    <div className="form-group">
                                        <label>Tiêu đề bài viết <span className="text-danger">*</span></label>
                                        <input type="text" className="form-control" value={formData.title} onChange={(e) => setFormData({ ...formData, title: e.target.value })} required />
                                    </div>
                                    <div className="form-group">
                                        <label>Mô tả ngắn</label>
                                        <textarea className="form-control" rows="2" value={formData.shortDescription} onChange={(e) => setFormData({ ...formData, shortDescription: e.target.value })} />
                                    </div>
                                    <div className="form-group">
                                        <label>Tác giả</label>
                                        <input type="text" className="form-control" value={formData.author} onChange={(e) => setFormData({ ...formData, author: e.target.value })} />
                                    </div>
                                    <div className="form-group">
                                        <label>Hình ảnh</label>
                                        {formData.imageUrl && (
                                            <div className="mb-2 text-center">
                                                <img
                                                    src={formData.imageUrl}
                                                    alt="Preview"
                                                    style={{ maxHeight: '140px', maxWidth: '100%', borderRadius: '6px', border: '1px solid #dee2e6', objectFit: 'contain' }}
                                                    onError={(e) => { e.target.style.display = 'none'; }}
                                                    onLoad={(e) => { e.target.style.display = 'inline'; }}
                                                />
                                            </div>
                                        )}
                                        <input
                                            type="text"
                                            className="form-control mb-2"
                                            value={formData.imageUrl}
                                            onChange={(e) => setFormData({ ...formData, imageUrl: e.target.value })}
                                            placeholder="Nhập link hình ảnh (https://...)"
                                        />
                                        <div className="d-flex align-items-center mb-2">
                                            <hr style={{ flex: 1, margin: 0 }} />
                                            <span className="px-2 text-muted small">hoặc tải ảnh lên</span>
                                            <hr style={{ flex: 1, margin: 0 }} />
                                        </div>
                                        <div className="d-flex align-items-center">
                                            <label className={`btn btn-outline-secondary btn-sm mb-0 ${uploadingImage ? 'disabled' : ''}`} style={{ cursor: uploadingImage ? 'not-allowed' : 'pointer' }}>
                                                {uploadingImage ? (
                                                    <><span className="spinner-border spinner-border-sm mr-1" role="status"></span>Đang tải...</>
                                                ) : (
                                                    <><i className="fas fa-upload mr-1"></i>Chọn ảnh từ máy</>
                                                )}
                                                <input
                                                    type="file"
                                                    accept="image/*"
                                                    style={{ display: 'none' }}
                                                    onChange={handleImageUpload}
                                                    disabled={uploadingImage}
                                                />
                                            </label>
                                            {formData.imageUrl && (
                                                <button
                                                    type="button"
                                                    className="btn btn-outline-danger btn-sm ml-2"
                                                    onClick={() => setFormData({ ...formData, imageUrl: '' })}
                                                >
                                                    <i className="fas fa-times mr-1"></i>Xóa ảnh
                                                </button>
                                            )}
                                        </div>
                                        <small className="text-muted">Hỗ trợ: jpg, png, gif, webp. Tối đa 5MB.</small>
                                    </div>
                                    <div className="form-group">
                                        <label>Nội dung chi tiết <span className="text-danger">*</span></label>
                                        <textarea className="form-control" rows="6" value={formData.content} onChange={(e) => setFormData({ ...formData, content: e.target.value })} required />
                                    </div>
                                    <div className="form-group form-check">
                                        <input type="checkbox" className="form-check-input" id="isActiveCheck" checked={formData.isActive} onChange={(e) => setFormData({ ...formData, isActive: e.target.checked })} />
                                        <label className="form-check-label" htmlFor="isActiveCheck">Hiển thị bài viết (IsActive)</label>
                                    </div>
                                </div>
                                <div className="modal-footer">
                                    <button type="button" className="btn btn-secondary" onClick={closeModal}>
                                        <i className="fas fa-times mr-1"></i> Hủy
                                    </button>
                                    <button type="submit" className="btn btn-primary">
                                        <i className={`fas fa-${editingBlog ? 'save' : 'plus'} mr-1`}></i>
                                        {editingBlog ? 'Cập nhật' : 'Lưu bài viết'}
                                    </button>
                                </div>
                            </form>
                        </div>
                    </div>
                </div>
            )}
            {showModal && <div className="modal-backdrop fade show"></div>}
        </>
    );
};

export default Blogs;