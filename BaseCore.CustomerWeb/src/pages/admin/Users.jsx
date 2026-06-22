import React, { useState, useEffect } from 'react';
import { userService } from '../../services/user/userService';
import { orderService } from '../../services/order/orderService';

const Users = () => {
    const [users, setUsers] = useState([]);
    const [loading, setLoading] = useState(true);
    const [keyword, setKeyword] = useState('');
    const [page, setPage] = useState(1);
    const [pageSize] = useState(10);
    const [totalPages, setTotalPages] = useState(0);
    const [totalCount, setTotalCount] = useState(0);
    const [showModal, setShowModal] = useState(false);
    const [showDetailModal, setShowDetailModal] = useState(false);
    const [selectedUser, setSelectedUser] = useState(null);
    const [editingUser, setEditingUser] = useState(null);
    const [formData, setFormData] = useState({
        username: '',
        password: '',
        name: '',
        email: '',
        phone: '',
        position: '',
        userType: 2,
        isActive: true,
    });
    const [error, setError] = useState('');
    const [userOrders, setUserOrders] = useState([]);
    const [userOrdersLoading, setUserOrdersLoading] = useState(false);
    const [loadError, setLoadError] = useState('');

    useEffect(() => {
        loadUsers();
    }, [page, keyword]);

    const loadUsers = async () => {
        setLoading(true);
        setLoadError('');
        try {
            const response = await userService.getAll({ keyword, page, pageSize });
            console.log('Users response:', response);
            
            // Handle different response structures
            let userData = [];
            let totalPagesData = 0;
            let totalCountData = 0;
            
            if (response.data) {
                // Backend trả về: { data: [...], totalPages, totalCount, ... }
                // response.data = mảng user, KHÔNG phải nested object
                userData = Array.isArray(response.data) ? response.data : (response.data.data || []);
                totalPagesData = response.totalPages ?? response.data.totalPages ?? 0;
                totalCountData = response.totalCount ?? response.data.totalCount ?? 0;
            } else if (response.items) {
                // Response: { items: [...], totalPages, totalCount }
                userData = response.items || [];
                totalPagesData = response.totalPages || 0;
                totalCountData = response.totalCount || 0;
            } else if (Array.isArray(response)) {
                // Response: [...]
                userData = response;
                totalPagesData = 1;
                totalCountData = response.length;
            }
            
            // Normalize: handle cả camelCase lẫn PascalCase từ API
            userData = userData.map(u => ({
                ...u,
                id: u.id || u.Id,
                username: u.username || u.Username || u.userName || u.UserName,
                name: u.name || u.Name,
                email: u.email || u.Email,
                phone: u.phone || u.Phone,
                position: u.position || u.Position,
                isActive: u.isActive ?? u.IsActive ?? true,
                userType: u.userType ?? u.UserType ?? 2,
                created: u.created || u.Created,
            }));

            setUsers(userData);
            setTotalPages(totalPagesData);
            setTotalCount(totalCountData);
        } catch (error) {
            console.error('Failed to load users:', error);
            setLoadError(error.message || 'Không thể tải danh sách người dùng');
            setUsers([]);
        } finally {
            setLoading(false);
        }
    };

    const handleSearch = (e) => {
        e.preventDefault();
        setPage(1);
        loadUsers();
    };

    const openModal = (user = null) => {
        if (user) {
            setEditingUser(user);
            setFormData({
                username: user.username,
                password: '',
                name: user.name || '',
                email: user.email || '',
                phone: user.phone || '',
                position: user.position || '',
                userType: user.userType ?? user.UserType ?? 2,
                isActive: user.isActive,
            });
        } else {
            setEditingUser(null);
            setFormData({
                username: '',
                password: '',
                name: '',
                email: '',
                phone: '',
                position: '',
                userType: 2,
                isActive: true,
            });
        }
        setError('');
        setShowModal(true);
    };

    const closeModal = () => {
        setShowModal(false);
        setEditingUser(null);
        setError('');
    };

    const openDetailModal = (user) => {
        setSelectedUser(user);
        setShowDetailModal(true);
        fetchUserOrders(user.id);
    };

    const closeDetailModal = () => {
        setShowDetailModal(false);
        setSelectedUser(null);
        setUserOrders([]);
        setUserOrdersLoading(false);
    };

    const fetchUserOrders = async (userId) => {
        setUserOrdersLoading(true);
        try {
            const response = await orderService.getByUserIdAdmin(userId);
            setUserOrders(Array.isArray(response) ? response : []);
        } catch (error) {
            console.error('Failed to fetch user orders:', error);
            setUserOrders([]);
        } finally {
            setUserOrdersLoading(false);
        }
    };

    const formatDate = (dateString) => {
        if (!dateString) return 'N/A';
        const date = new Date(dateString);
        return date.toLocaleDateString('vi-VN', {
            year: 'numeric',
            month: '2-digit',
            day: '2-digit',
            hour: '2-digit',
            minute: '2-digit',
        });
    };

    const getUserRoleLabel = (userType) => {
        const roles = {
            0: 'Người dùng',
            1: 'Admin',
            2: 'Khách hàng',
            3: 'Quản lý kho'
        };
        return roles[userType] ?? 'Không xác định';
    };

    const getUserRoleBadgeClass = (userType) => {
        if (userType === 1) return 'badge-danger';
        if (userType === 3) return 'badge-warning';
        return 'badge-info';
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError('');

        try {
            if (editingUser) {
                const updateData = {
                    name: formData.name,
                    email: formData.email,
                    phone: formData.phone,
                    position: formData.position,
                    userType: parseInt(formData.userType),
                    isActive: formData.isActive,
                };
                if (formData.password) {
                    updateData.password = formData.password;
                }
                await userService.update(editingUser.id, updateData);
            } else {
                if (!formData.password) {
                    setError('Password is required for new user');
                    return;
                }
                await userService.create({
                    username: formData.username,
                    password: formData.password,
                    name: formData.name,
                    email: formData.email,
                    phone: formData.phone,
                    position: formData.position,
                    userType: parseInt(formData.userType),
                });
            }

            closeModal();
            loadUsers();
        } catch (error) {
            setError(error.response?.data?.message || 'Operation failed');
        }
    };

    const handleDelete = async (id) => {
        if (!window.confirm('Are you sure you want to delete this user?')) return;

        try {
            await userService.delete(id);
            loadUsers();
        } catch (error) {
            alert('Failed to delete user');
        }
    };

    const renderPagination = () => {
        const pages = [];
        for (let i = 1; i <= totalPages; i++) {
            pages.push(
                <li key={i} className={`page-item ${page === i ? 'active' : ''}`}>
                    <button className="page-link" onClick={() => setPage(i)}>{i}</button>
                </li>
            );
        }
        return pages;
    };

    return (
        <>
            <div className="content-header">
                <div className="container-fluid">
                    <div className="row mb-2">
                        <div className="col-sm-6">
                            <h1 className="m-0">
                                <i className="fas fa-users mr-2"></i>Quản lý người dùng
                            </h1>
                        </div>
                        <div className="col-sm-6">
                            <ol className="breadcrumb float-sm-right">
                                <li className="breadcrumb-item"><a href="#">Trang chủ</a></li>
                                <li className="breadcrumb-item active">Người dùng</li>
                            </ol>
                        </div>
                    </div>
                </div>
            </div>

            <section className="content">
                <div className="container-fluid">
                    <div className="card card-primary">
                        <div className="card-header">
                            <div className="row">
                                <div className="col-md-6">
                                    <form onSubmit={handleSearch} className="form-inline">
                                        <div className="input-group input-group-sm" style={{ width: '100%' }}>
                                            <input
                                                type="text"
                                                className="form-control form-control-navbar"
                                                placeholder="Tìm kiếm theo tên, email, số điện thoại..."
                                                value={keyword}
                                                onChange={(e) => setKeyword(e.target.value)}
                                            />
                                            <div className="input-group-append">
                                                <button type="submit" className="btn btn-navbar">
                                                    <i className="fas fa-search"></i>
                                                </button>
                                            </div>
                                        </div>
                                    </form>
                                </div>
                                <div className="col-md-6 text-right">
                                    <button className="btn btn-success btn-sm" onClick={() => openModal()}>
                                        <i className="fas fa-plus mr-1"></i>Thêm người dùng
                                    </button>
                                </div>
                            </div>
                        </div>
                        <div className="card-body">
                            {loadError && (
                                <div className="alert alert-danger alert-dismissible fade show" role="alert">
                                    <i className="fas fa-exclamation-circle mr-2"></i><strong>Lỗi:</strong> {loadError}
                                    <button type="button" className="close" onClick={() => setLoadError('')}>
                                        <span>&times;</span>
                                    </button>
                                </div>
                            )}
                            {loading ? (
                                <div className="text-center py-5">
                                    <div className="spinner-border text-primary"></div>
                                    <p className="text-muted mt-2">Đang tải danh sách người dùng...</p>
                                </div>
                            ) : users.length === 0 ? (
                                <div className="alert alert-info" role="alert">
                                    <i className="fas fa-info-circle mr-2"></i>Không tìm thấy người dùng nào
                                </div>
                            ) : (
                                <>
                                    <table className="table table-bordered table-striped table-sm">
                                        <thead>
                                            <tr>
                                                <th>Tài khoản</th>
                                                <th>Họ tên</th>
                                                <th>Email</th>
                                                <th>Điện thoại</th>
                                                <th>Chức vụ</th>
                                                <th>Vai trò</th>
                                                <th>Trạng thái</th>
                                                <th>Ngày tạo</th>
                                                <th>Thao tác</th>
                                            </tr>
                                        </thead>
                                        <tbody>
                                            {users.map(user => (
                                                <tr key={user.id} style={{ fontSize: '0.9rem' }}>
                                                    <td>
                                                        <strong>{user.username || user.userName}</strong>
                                                    </td>
                                                    <td>{user.name || 'N/A'}</td>
                                                    <td>
                                                        <a href={`mailto:${user.email}`}>{user.email || 'N/A'}</a>
                                                    </td>
                                                    <td>
                                                        <a href={`tel:${user.phone}`}>{user.phone || 'N/A'}</a>
                                                    </td>
                                                    <td>{user.position || 'N/A'}</td>
                                                    <td>
                                                        <span className={`badge ${getUserRoleBadgeClass(user.userType)}`}>
                                                            {getUserRoleLabel(user.userType)}
                                                        </span>
                                                    </td>
                                                    <td>
                                                        <span className={`badge ${user.isActive ? 'badge-success' : 'badge-secondary'}`}>
                                                            {user.isActive ? 'Hoạt động' : 'Không hoạt động'}
                                                        </span>
                                                    </td>
                                                    <td style={{ fontSize: '0.85rem' }}>
                                                        {formatDate(user.created)}
                                                    </td>
                                                    <td>
                                                        <button
                                                            className="btn btn-xs btn-info mr-1"
                                                            title="Xem chi tiết"
                                                            onClick={() => openDetailModal(user)}
                                                            style={{ padding: '0.25rem 0.5rem', fontSize: '0.75rem' }}
                                                        >
                                                            <i className="fas fa-eye"></i>
                                                        </button>
                                                        <button
                                                            className="btn btn-xs btn-warning mr-1"
                                                            title="Chỉnh sửa"
                                                            onClick={() => openModal(user)}
                                                            style={{ padding: '0.25rem 0.5rem', fontSize: '0.75rem' }}
                                                        >
                                                            <i className="fas fa-edit"></i>
                                                        </button>
                                                        <button
                                                            className="btn btn-xs btn-danger"
                                                            title="Xóa"
                                                            onClick={() => handleDelete(user.id)}
                                                            style={{ padding: '0.25rem 0.5rem', fontSize: '0.75rem' }}
                                                        >
                                                            <i className="fas fa-trash"></i>
                                                        </button>
                                                    </td>
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>

                                    <div className="d-flex justify-content-between align-items-center mt-3">
                                        <span className="text-muted">
                                            <strong>Tổng cộng:</strong> {totalCount} người dùng
                                        </span>
                                        <nav>
                                            <ul className="pagination pagination-sm mb-0">
                                                <li className={`page-item ${page === 1 ? 'disabled' : ''}`}>
                                                    <button 
                                                        className="page-link" 
                                                        onClick={() => setPage(page - 1)}
                                                        disabled={page === 1}
                                                    >
                                                        Trước
                                                    </button>
                                                </li>
                                                {renderPagination()}
                                                <li className={`page-item ${page === totalPages ? 'disabled' : ''}`}>
                                                    <button 
                                                        className="page-link" 
                                                        onClick={() => setPage(page + 1)}
                                                        disabled={page === totalPages}
                                                    >
                                                        Sau
                                                    </button>
                                                </li>
                                            </ul>
                                        </nav>
                                    </div>
                                </>
                            )}
                        </div>
                    </div>
                </div>
            </section>

            {/* Modal Chỉnh sửa/Thêm */}
            {showModal && (
                <div className="modal fade show" style={{ display: 'block' }} tabIndex="-1">
                    <div className="modal-dialog">
                        <div className="modal-content">
                            <div className="modal-header bg-primary text-white">
                                <h5 className="modal-title">
                                    <i className={`fas fa-${editingUser ? 'edit' : 'plus'} mr-2`}></i>
                                    {editingUser ? 'Chỉnh sửa người dùng' : 'Thêm người dùng mới'}
                                </h5>
                                <button type="button" className="close text-white" onClick={closeModal}>
                                    <span>&times;</span>
                                </button>
                            </div>
                            <form onSubmit={handleSubmit}>
                                <div className="modal-body">
                                    {error && (
                                        <div className="alert alert-danger alert-dismissible fade show" role="alert">
                                            <i className="fas fa-exclamation-circle mr-2"></i>{error}
                                            <button type="button" className="close" onClick={() => setError('')}>
                                                <span>&times;</span>
                                            </button>
                                        </div>
                                    )}
                                    <div className="form-group">
                                        <label>
                                            <i className="fas fa-user-circle mr-1 text-primary"></i>Tài khoản
                                            <span className="text-danger">*</span>
                                        </label>
                                        <input
                                            type="text"
                                            className="form-control"
                                            value={formData.username}
                                            onChange={(e) => setFormData({ ...formData, username: e.target.value })}
                                            required
                                            disabled={!!editingUser}
                                        />
                                    </div>
                                    <div className="form-group">
                                        <label>
                                            <i className="fas fa-lock mr-1 text-primary"></i>Mật khẩu
                                            {editingUser && '(để trống để giữ hiện tại)'}
                                            <span className={editingUser ? '' : 'text-danger'}>{editingUser ? '' : '*'}</span>
                                        </label>
                                        <input
                                            type="password"
                                            className="form-control"
                                            value={formData.password}
                                            onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                                            required={!editingUser}
                                        />
                                    </div>
                                    <div className="form-group">
                                        <label>
                                            <i className="fas fa-id-card mr-1 text-primary"></i>Họ tên
                                        </label>
                                        <input
                                            type="text"
                                            className="form-control"
                                            value={formData.name}
                                            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                                        />
                                    </div>
                                    <div className="form-group">
                                        <label>
                                            <i className="fas fa-envelope mr-1 text-primary"></i>Email
                                        </label>
                                        <input
                                            type="email"
                                            className="form-control"
                                            value={formData.email}
                                            onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                                        />
                                    </div>
                                    <div className="form-group">
                                        <label>
                                            <i className="fas fa-phone mr-1 text-primary"></i>Điện thoại
                                        </label>
                                        <input
                                            type="text"
                                            className="form-control"
                                            value={formData.phone}
                                            onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                                        />
                                    </div>
                                    <div className="form-group">
                                        <label>
                                            <i className="fas fa-briefcase mr-1 text-primary"></i>Chức vụ
                                        </label>
                                        <input
                                            type="text"
                                            className="form-control"
                                            value={formData.position}
                                            onChange={(e) => setFormData({ ...formData, position: e.target.value })}
                                        />
                                    </div>
                                    <div className="form-group">
                                        <label>
                                            <i className="fas fa-shield-alt mr-1 text-primary"></i>Vai trò
                                            <span className="text-danger">*</span>
                                        </label>
                                        <select
                                            className="form-control"
                                            value={formData.userType}
                                            onChange={(e) => setFormData({ ...formData, userType: e.target.value })}
                                        >
                                            <option value="2">Khách hàng</option>
                                            <option value="1">Admin</option>
                                            <option value="3">Quản lý kho</option>
                                        </select>
                                    </div>
                                    {editingUser && (
                                        <div className="form-group">
                                            <div className="custom-control custom-switch">
                                                <input
                                                    type="checkbox"
                                                    className="custom-control-input"
                                                    id="isActive"
                                                    checked={formData.isActive}
                                                    onChange={(e) => setFormData({ ...formData, isActive: e.target.checked })}
                                                />
                                                <label className="custom-control-label" htmlFor="isActive">
                                                    <i className="fas fa-check-circle mr-1 text-success"></i>Hoạt động
                                                </label>
                                            </div>
                                        </div>
                                    )}
                                </div>
                                <div className="modal-footer">
                                    <button type="button" className="btn btn-secondary" onClick={closeModal}>
                                        <i className="fas fa-times mr-1"></i>Hủy
                                    </button>
                                    <button type="submit" className="btn btn-primary">
                                        <i className={`fas fa-${editingUser ? 'save' : 'plus'} mr-1`}></i>
                                        {editingUser ? 'Cập nhật' : 'Tạo mới'}
                                    </button>
                                </div>
                            </form>
                        </div>
                    </div>
                </div>
            )}
            {showModal && <div className="modal-backdrop fade show"></div>}

            {/* Chi tiết Modal */}
            {showDetailModal && selectedUser && (
                <div className="modal fade show" style={{ display: 'block' }} tabIndex="-1">
                    <div className="modal-dialog modal-lg">
                        <div className="modal-content">
                            <div className="modal-header bg-primary text-white">
                                <h5 className="modal-title">
                                    <i className="fas fa-user-circle mr-2"></i>Chi tiết thông tin người dùng
                                </h5>
                                <button type="button" className="close text-white" onClick={closeDetailModal}>
                                    <span>&times;</span>
                                </button>
                            </div>
                            <div className="modal-body">
                                <div className="row mb-3">
                                    <div className="col-md-4 text-center">
                                        {selectedUser.image ? (
                                            <img
                                                src={selectedUser.image}
                                                alt={selectedUser.name}
                                                className="img-fluid rounded-circle"
                                                style={{ maxWidth: '150px', height: 'auto' }}
                                            />
                                        ) : (
                                            <div
                                                className="rounded-circle bg-secondary d-flex align-items-center justify-content-center"
                                                style={{ width: '150px', height: '150px', margin: '0 auto' }}
                                            >
                                                <i className="fas fa-user fa-3x text-white"></i>
                                            </div>
                                        )}
                                    </div>
                                    <div className="col-md-8">
                                        <table className="table table-borderless">
                                            <tbody>
                                                <tr>
                                                    <td className="font-weight-bold" style={{ width: '40%' }}>Tài khoản:</td>
                                                    <td>{selectedUser.username || selectedUser.userName}</td>
                                                </tr>
                                                <tr>
                                                    <td className="font-weight-bold">Họ tên:</td>
                                                    <td>{selectedUser.name || 'N/A'}</td>
                                                </tr>
                                                <tr>
                                                    <td className="font-weight-bold">Email:</td>
                                                    <td>
                                                        <a href={`mailto:${selectedUser.email}`}>
                                                            {selectedUser.email || 'N/A'}
                                                        </a>
                                                    </td>
                                                </tr>
                                                <tr>
                                                    <td className="font-weight-bold">Điện thoại:</td>
                                                    <td>
                                                        <a href={`tel:${selectedUser.phone}`}>
                                                            {selectedUser.phone || 'N/A'}
                                                        </a>
                                                    </td>
                                                </tr>
                                            </tbody>
                                        </table>
                                    </div>
                                </div>

                                <hr />

                                <div className="row">
                                    <div className="col-md-6">
                                        <h6 className="font-weight-bold mb-3">
                                            <i className="fas fa-info-circle mr-2"></i>Thông tin chi tiết
                                        </h6>
                                        <table className="table table-sm table-borderless">
                                            <tbody>
                                                <tr>
                                                    <td className="font-weight-bold" style={{ width: '50%' }}>Chức vụ:</td>
                                                    <td>{selectedUser.position || 'N/A'}</td>
                                                </tr>
                                                <tr>
                                                    <td className="font-weight-bold">Vai trò:</td>
                                                    <td>
                                                        <span className={`badge ${getUserRoleBadgeClass(selectedUser.userType)}`}>
                                                            {getUserRoleLabel(selectedUser.userType)}
                                                        </span>
                                                    </td>
                                                </tr>
                                                <tr>
                                                    <td className="font-weight-bold">Trạng thái:</td>
                                                    <td>
                                                        <span className={`badge ${selectedUser.isActive ? 'badge-success' : 'badge-secondary'}`}>
                                                            {selectedUser.isActive ? 'Hoạt động' : 'Không hoạt động'}
                                                        </span>
                                                    </td>
                                                </tr>
                                                <tr>
                                                    <td className="font-weight-bold">Liên hệ:</td>
                                                    <td>{selectedUser.contact || 'N/A'}</td>
                                                </tr>
                                            </tbody>
                                        </table>
                                    </div>

                                    <div className="col-md-6">
                                        <h6 className="font-weight-bold mb-3">
                                            <i className="fas fa-clock mr-2"></i>Dữ liệu hệ thống
                                        </h6>
                                        <table className="table table-sm table-borderless">
                                            <tbody>
                                                <tr>
                                                    <td className="font-weight-bold" style={{ width: '50%' }}>ID:</td>
                                                    <td>
                                                        <small className="text-monospace">{selectedUser.id}</small>
                                                    </td>
                                                </tr>
                                                <tr>
                                                    <td className="font-weight-bold">Ngày tạo:</td>
                                                    <td>{formatDate(selectedUser.created)}</td>
                                                </tr>
                                                <tr>
                                                    <td className="font-weight-bold">Loại tài khoản:</td>
                                                    <td>{selectedUser.userType}</td>
                                                </tr>
                                            </tbody>
                                        </table>
                                    </div>
                                </div>

                                <hr />

                                <div className="row">
                                    <div className="col-12">
                                        <h6 className="font-weight-bold mb-3">
                                            <i className="fas fa-shopping-bag mr-2"></i>Lịch sử mua hàng
                                        </h6>
                                        {userOrdersLoading ? (
                                            <div className="text-center py-3">
                                                <div className="spinner-border spinner-border-sm text-primary"></div>
                                                <small className="d-block text-muted mt-2">Đang tải dữ liệu...</small>
                                            </div>
                                        ) : userOrders.length === 0 ? (
                                            <div className="text-center text-muted py-3">
                                                <i className="fas fa-inbox mr-2"></i>Chưa có đơn hàng nào
                                            </div>
                                        ) : (
                                            <div className="table-responsive">
                                                <table className="table table-sm table-hover">
                                                    <thead className="bg-light">
                                                        <tr>
                                                            <th>Mã đơn</th>
                                                            <th>Ngày đặt</th>
                                                            <th>Tổng tiền</th>
                                                            <th>Trạng thái</th>
                                                            <th>Chi tiết</th>
                                                        </tr>
                                                    </thead>
                                                    <tbody>
                                                        {userOrders.map(order => (
                                                            <tr key={order.id} style={{ fontSize: '0.9rem' }}>
                                                                <td>
                                                                    <strong>#{order.id || order.orderId}</strong>
                                                                </td>
                                                                <td>{formatDate(order.orderDate || order.created || order.createdDate)}</td>
                                                                <td className="font-weight-bold text-danger">
                                                                    {order.totalAmount ? order.totalAmount.toLocaleString('vi-VN') : order.totalPrice?.toLocaleString('vi-VN') || 'N/A'}đ
                                                                </td>
                                                                <td>
                                                                    <span className={`badge ${
                                                                        order.status === 'Completed' ? 'badge-success' :
                                                                        order.status === 'Pending' ? 'badge-warning' :
                                                                        order.status === 'Cancelled' ? 'badge-danger' :
                                                                        order.status === 'Shipping' ? 'badge-info' :
                                                                        'badge-secondary'
                                                                    }`}>
                                                                        {order.status || 'Chờ xử lý'}
                                                                    </span>
                                                                </td>
                                                                <td>
                                                                    <small className="text-muted">
                                                                        {order.items?.length || '0'} sp
                                                                    </small>
                                                                </td>
                                                            </tr>
                                                        ))}
                                                    </tbody>
                                                </table>
                                            </div>
                                        )}
                                    </div>
                                </div>
                            </div>
                            <div className="modal-footer">
                                <button
                                    type="button"
                                    className="btn btn-warning"
                                    onClick={() => {
                                        closeDetailModal();
                                        openModal(selectedUser);
                                    }}
                                >
                                    <i className="fas fa-edit mr-1"></i>Chỉnh sửa
                                </button>
                                <button type="button" className="btn btn-secondary" onClick={closeDetailModal}>
                                    Đóng
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}
            {showDetailModal && <div className="modal-backdrop fade show"></div>}
        </>
    );
};

export default Users;
