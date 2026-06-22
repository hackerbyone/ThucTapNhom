import React, { useState, useEffect } from 'react';
import { categoryService } from '../../services/category/categoryService';
import { productService } from '../../services/product/productService';
import { useAuth } from '../../context/AuthContext';

const Categories = () => {
    const [categories, setCategories] = useState([]);
    const [loading, setLoading] = useState(true);
    const [showModal, setShowModal] = useState(false);
    const [editingCategory, setEditingCategory] = useState(null);
    const [searchQuery, setSearchQuery] = useState('');
    const [currentPage, setCurrentPage] = useState(1);
    const [itemsPerPage] = useState(5);
    const [formData, setFormData] = useState({
        name: '',
        description: '',
    });
    const [error, setError] = useState('');
    const [productCounts, setProductCounts] = useState({});
    const { isAdmin } = useAuth();

    useEffect(() => {
        loadCategories();
    }, []);

    const loadCategories = async () => {
        setLoading(true);
        try {
            const response = await categoryService.getAll();
            const cats = response || [];
            setCategories(cats);
            loadProductCounts(cats);
        } catch (error) {
            console.error('Failed to load categories:', error);
        } finally {
            setLoading(false);
        }
    };

    const loadProductCounts = async (cats) => {
        try {
            const results = await Promise.all(
                cats.map(cat => productService.getAll('', cat.id, 1, 1))
            );
            const counts = {};
            cats.forEach((cat, i) => {
                counts[cat.id] = results[i].totalCount ?? 0;
            });
            setProductCounts(counts);
        } catch (e) { /* ignore */ }
    };

    const openModal = (category = null) => {
        if (category) {
            setEditingCategory(category);
            setFormData({
                name: category.name,
                description: category.description || '',
            });
        } else {
            setEditingCategory(null);
            setFormData({ name: '', description: '' });
        }
        setError('');
        setShowModal(true);
    };

    const closeModal = () => {
        setShowModal(false);
        setEditingCategory(null);
        setError('');
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError('');
        try {
            if (editingCategory) {
                await categoryService.update(editingCategory.id, {
                    id: editingCategory.id,
                    ...formData,
                });
            } else {
                await categoryService.create(formData);
            }
            closeModal();
            loadCategories();
        } catch (error) {
            setError(error.response?.data?.message || 'Thao tác thất bại');
        }
    };

    const handleDelete = async (id) => {
        const category = categories.find(c => c.id === id);
        const message = `⚠️ XÓA DANH MỤC\n\nBạn có chắc chắn muốn xóa danh mục "${category?.name}"?\n\n⚠️ CẢNH BÁO: Việc xóa danh mục này có thể ảnh hưởng đến:\n• Tất cả sản phẩm thuộc danh mục này\n• Dữ liệu liên quan\n\nHành động này không thể hoàn tác!`;
        if (!window.confirm(message)) return;
        try {
            await categoryService.delete(id);
            loadCategories();
            alert('✓ Danh mục đã được xóa thành công!');
        } catch (error) {
            alert('❌ Xóa danh mục thất bại.\n\nLý do: ' + (error.message || 'Danh mục này có thể chứa các sản phẩm liên quan'));
        }
    };

    const filteredCategories = categories.filter(category => {
        const query = searchQuery.toLowerCase();
        return (
            category.name.toLowerCase().includes(query) ||
            (category.description && category.description.toLowerCase().includes(query))
        );
    });

    const totalPages = Math.ceil(filteredCategories.length / itemsPerPage);
    const indexOfLastCategory = currentPage * itemsPerPage;
    const indexOfFirstCategory = indexOfLastCategory - itemsPerPage;
    const currentCategories = filteredCategories.slice(indexOfFirstCategory, indexOfLastCategory);

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
                                <i className="fas fa-tags mr-2"></i>Quản lý Danh mục
                            </h1>
                        </div>
                        <div className="col-sm-6">
                            <ol className="breadcrumb float-sm-right">
                                <li className="breadcrumb-item"><a href="#">Trang chủ</a></li>
                                <li className="breadcrumb-item active">Danh mục</li>
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
                                    <h3 className="card-title">
                                        <i className="fas fa-list mr-2"></i>Danh sách danh mục
                                    </h3>
                                </div>
                                <div className="col-md-6 text-right">
                                    {isAdmin() && (
                                        <button className="btn btn-success btn-sm" onClick={() => openModal()}>
                                            <i className="fas fa-plus mr-1"></i> Thêm danh mục
                                        </button>
                                    )}
                                </div>
                            </div>
                        </div>
                        <div className="card-body">
                            <div className="row mb-3">
                                <div className="col-md-8">
                                    <div className="input-group">
                                        <input
                                            type="text"
                                            className="form-control"
                                            placeholder="Tìm kiếm theo tên, mô tả..."
                                            value={searchQuery}
                                            onChange={handleSearchChange}
                                        />
                                        <div className="input-group-append">
                                            <button className="btn btn-outline-secondary" type="button" onClick={handleClearSearch}>
                                                <i className="fas fa-times"></i>
                                            </button>
                                        </div>
                                    </div>
                                </div>
                                <div className="col-md-4 d-flex align-items-center justify-content-end text-muted">
                                    Tìm thấy: <strong className="ml-1">{filteredCategories.length}</strong>&nbsp;danh mục
                                </div>
                            </div>

                            {loading ? (
                                <div className="text-center py-5">
                                    <div className="spinner-border text-primary" role="status"></div>
                                    <p className="text-muted mt-2">Đang tải danh sách...</p>
                                </div>
                            ) : (
                                <div className="table-responsive">
                                    <table className="table table-bordered table-striped table-hover">
                                        <thead>
                                            <tr>
                                                <th style={{ width: '80px' }}>ID</th>
                                                <th>Tên danh mục</th>
                                                <th>Mô tả</th>
                                                <th style={{ width: '130px' }} className="text-center">Số sản phẩm</th>
                                                {isAdmin() && <th style={{ width: '130px' }}>Thao tác</th>}
                                            </tr>
                                        </thead>
                                        <tbody>
                                            {filteredCategories.length === 0 ? (
                                                <tr>
                                                    <td colSpan={isAdmin() ? 5 : 4} className="text-center py-4 text-muted">
                                                        <i className="fas fa-folder-open fa-2x mb-2 d-block"></i>
                                                        {searchQuery ? 'Không tìm thấy danh mục nào' : 'Chưa có danh mục nào'}
                                                    </td>
                                                </tr>
                                            ) : (
                                                currentCategories.map(category => (
                                                    <tr key={category.id}>
                                                        <td className="text-muted">{category.id}</td>
                                                        <td><strong>{category.name}</strong></td>
                                                        <td className="text-muted">{category.description || '—'}</td>
                                                        <td className="text-center">
                                                            {productCounts[category.id] === undefined ? (
                                                                <span className="text-muted small">...</span>
                                                            ) : (
                                                                <span className={`badge ${productCounts[category.id] > 0 ? 'badge-primary' : 'badge-secondary'}`}>
                                                                    {productCounts[category.id]}
                                                                </span>
                                                            )}
                                                        </td>
                                                        {isAdmin() && (
                                                            <td>
                                                                <button
                                                                    className="btn btn-xs btn-warning mr-1"
                                                                    style={{ padding: '0.25rem 0.5rem', fontSize: '0.75rem' }}
                                                                    onClick={() => openModal(category)}
                                                                    title="Chỉnh sửa"
                                                                >
                                                                    <i className="fas fa-edit"></i>
                                                                </button>
                                                                <button
                                                                    className="btn btn-xs btn-danger"
                                                                    style={{ padding: '0.25rem 0.5rem', fontSize: '0.75rem' }}
                                                                    onClick={() => handleDelete(category.id)}
                                                                    title="Xóa"
                                                                >
                                                                    <i className="fas fa-trash"></i>
                                                                </button>
                                                            </td>
                                                        )}
                                                    </tr>
                                                ))
                                            )}
                                        </tbody>
                                    </table>
                                </div>
                            )}

                            {!loading && filteredCategories.length > 0 && (
                                <nav className="d-flex justify-content-between align-items-center mt-3 flex-wrap">
                                    <div className="text-muted small mb-2 mb-md-0">
                                        Trang {currentPage}/{totalPages} &nbsp;•&nbsp; Hiển thị {indexOfFirstCategory + 1}–{Math.min(indexOfLastCategory, filteredCategories.length)} / {filteredCategories.length}
                                    </div>
                                    {totalPages > 1 && (
                                        <ul className="pagination pagination-sm mb-0">
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
                                                const show = Math.abs(pageNum - currentPage) <= 1 || pageNum === 1 || pageNum === totalPages;
                                                if (show) {
                                                    return (
                                                        <li key={pageNum} className={`page-item ${currentPage === pageNum ? 'active' : ''}`}>
                                                            <button type="button" className="page-link" onClick={() => goToPage(pageNum)}>
                                                                {pageNum}
                                                            </button>
                                                        </li>
                                                    );
                                                } else if (pageNum === 2 || pageNum === totalPages - 1) {
                                                    return <li key={`dots-${pageNum}`} className="page-item disabled"><span className="page-link">…</span></li>;
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

            {/* Modal Thêm/Sửa */}
            {showModal && (
                <div className="modal fade show" style={{ display: 'block' }} tabIndex="-1">
                    <div className="modal-dialog">
                        <div className="modal-content">
                            <div className="modal-header">
                                <h5 className="modal-title">
                                    <i className={`fas fa-${editingCategory ? 'edit' : 'plus'} mr-2`}></i>
                                    {editingCategory ? 'Chỉnh sửa danh mục' : 'Thêm danh mục mới'}
                                </h5>
                                <button type="button" className="close text-white" onClick={closeModal}>
                                    <span>&times;</span>
                                </button>
                            </div>
                            <form onSubmit={handleSubmit}>
                                <div className="modal-body">
                                    {error && (
                                        <div className="alert alert-danger">
                                            <i className="fas fa-exclamation-circle mr-2"></i>{error}
                                        </div>
                                    )}
                                    <div className="form-group">
                                        <label>
                                            <i className="fas fa-tags mr-1 text-primary"></i>
                                            Tên danh mục <span className="text-danger">*</span>
                                        </label>
                                        <input
                                            type="text"
                                            className="form-control"
                                            value={formData.name}
                                            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                                            required
                                            placeholder="Nhập tên danh mục..."
                                        />
                                    </div>
                                    <div className="form-group">
                                        <label>
                                            <i className="fas fa-align-left mr-1 text-primary"></i>
                                            Mô tả
                                        </label>
                                        <textarea
                                            className="form-control"
                                            value={formData.description}
                                            onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                                            rows="3"
                                            placeholder="Nhập mô tả danh mục..."
                                        />
                                    </div>
                                </div>
                                <div className="modal-footer">
                                    <button type="button" className="btn btn-secondary" onClick={closeModal}>
                                        <i className="fas fa-times mr-1"></i> Hủy
                                    </button>
                                    <button type="submit" className="btn btn-primary">
                                        <i className={`fas fa-${editingCategory ? 'save' : 'plus'} mr-1`}></i>
                                        {editingCategory ? 'Cập nhật' : 'Tạo mới'}
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

export default Categories;
