import { useState, useEffect } from 'react';
import { buildUrl, getHeaders, handleResponse } from '../../services/utils/apiClient';

const STATUS_LIST = [
  { value: 'Pending',   label: 'Chờ xử lý',  badge: 'badge-warning' },
  { value: 'Shipping',  label: 'Đang giao',  badge: 'badge-info'    },
  { value: 'Completed', label: 'Đã giao',    badge: 'badge-success' },
  { value: 'Cancelled', label: 'Đã hủy',     badge: 'badge-danger'  },
];

const statusLabel = (val) =>
  STATUS_LIST.find(s => s.value === val) || { label: val, badge: 'badge-secondary' };

// Fix: always await fetch before passing to handleResponse
const orderService = {
  getAll: async () => {
    const res = await fetch(buildUrl('/api/orders/all'), { headers: getHeaders(true) });
    const data = await handleResponse(res, 'Failed to fetch orders');
    if (Array.isArray(data)) return data;
    if (data && data.items) return data.items;
    if (data && data.data) return data.data;
    return [];
  },

  getDetail: async (id) => {
    const res = await fetch(buildUrl('/api/orders/' + id), { headers: getHeaders(true) });
    return handleResponse(res, 'Failed to fetch order');
  },

  updateStatus: async (id, status) => {
    const res = await fetch(buildUrl('/api/orders/' + id + '/status'), {
      method: 'PUT',
      headers: getHeaders(true),
      body: JSON.stringify({ status }),
    });
    return handleResponse(res, 'Failed to update status');
  },

  cancelOrder: async (id) => {
    const res = await fetch(buildUrl('/api/orders/' + id + '/cancel'), {
      method: 'PUT',
      headers: getHeaders(true),
    });
    return handleResponse(res, 'Failed to cancel order');
  },
};

// Confirm popup component
function ConfirmModal({ message, onConfirm, onCancel }) {
  return (
    <>
      <div className="modal fade show" style={{ display: 'block', zIndex: 1060 }} tabIndex="-1">
        <div className="modal-dialog modal-sm modal-dialog-centered">
          <div className="modal-content">
            <div className="modal-header">
              <h5 className="modal-title">Xác nhận</h5>
              <button className="close" onClick={onCancel}><span>&times;</span></button>
            </div>
            <div className="modal-body">
              <p>{message}</p>
            </div>
            <div className="modal-footer">
              <button className="btn btn-secondary btn-sm" onClick={onCancel}>Hủy</button>
              <button className="btn btn-primary btn-sm" onClick={onConfirm}>Xác nhận</button>
            </div>
          </div>
        </div>
      </div>
      <div className="modal-backdrop fade show" style={{ zIndex: 1055 }}></div>
    </>
  );
}

export default function Orders() {
  const [orders, setOrders]         = useState([]);
  const [loading, setLoading]       = useState(true);
  const [filterStatus, setFilter]   = useState('');
  const [keyword, setKeyword]       = useState('');
  const [selected, setSelected]     = useState(null);
  const [detail, setDetail]         = useState(null);
  const [detailLoading, setDL]      = useState(false);
  const [showDetail, setShowDetail] = useState(false);
  const [updating, setUpdating]     = useState(false);
  const [error, setError]           = useState('');
  const [confirm, setConfirm]       = useState(null); // { message, onConfirm }

  useEffect(() => { loadOrders(); }, []);

  const loadOrders = async () => {
    setLoading(true);
    setError('');
    try {
      const data = await orderService.getAll();
      setOrders(data);
    } catch (e) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  };

  const askConfirm = (message) =>
    new Promise((resolve) => {
      setConfirm({
        message,
        onConfirm: () => { setConfirm(null); resolve(true); },
        onCancel:  () => { setConfirm(null); resolve(false); },
      });
    });

  const openDetail = async (order) => {
    setSelected(order);
    setShowDetail(true);
    setDL(true);
    try {
      const data = await orderService.getDetail(order.id);
      setDetail(data && data.order ? { ...data.order, details: data.details } : data);
    } catch (e) {
      setDetail(null);
    } finally {
      setDL(false);
    }
  };

  const handleUpdateStatus = async (id, status) => {
    const ok = await askConfirm('Cập nhật trạng thái thành "' + statusLabel(status).label + '"?');
    if (!ok) return;
    setUpdating(true);
    try {
      await orderService.updateStatus(id, status);
      // Update state directly — no reload needed
      setOrders(prev => prev.map(o => o.id === id ? { ...o, status } : o));
      if (selected && selected.id === id) {
        setSelected(prev => ({ ...prev, status }));
      }
    } catch (e) {
      setError('Cập nhật thất bại: ' + e.message);
    } finally {
      setUpdating(false);
    }
  };

  const handleCancel = async (id) => {
    const ok = await askConfirm('Bạn có chắc chắn muốn hủy đơn hàng này?');
    if (!ok) return;
    setUpdating(true);
    try {
      await orderService.cancelOrder(id);
      setOrders(prev => prev.map(o => o.id === id ? { ...o, status: 'Cancelled' } : o));
      if (selected && selected.id === id) {
        setSelected(prev => ({ ...prev, status: 'Cancelled' }));
      }
    } catch (e) {
      setError('Hủy thất bại: ' + e.message);
    } finally {
      setUpdating(false);
    }
  };

  const filtered = orders.filter(o => {
    const matchStatus  = filterStatus ? o.status === filterStatus : true;
    const matchKeyword = keyword
      ? String(o.id).includes(keyword) || (o.shippingAddress || '').toLowerCase().includes(keyword.toLowerCase())
      : true;
    return matchStatus && matchKeyword;
  });

  const countBy = (s) => orders.filter(o => o.status === s).length;

  return (
    <>
      <div className="content-header">
        <div className="container-fluid">
          <div className="row mb-2">
            <div className="col-sm-6">
              <h1 className="m-0">
                <i className="fas fa-receipt mr-2"></i>Quản lý Đơn hàng
              </h1>
            </div>
            <div className="col-sm-6">
              <ol className="breadcrumb float-sm-right">
                <li className="breadcrumb-item"><a href="#">Trang chủ</a></li>
                <li className="breadcrumb-item active">Đơn hàng</li>
              </ol>
            </div>
          </div>
        </div>
      </div>

      <section className="content">
        <div className="container-fluid">

          {error && (
            <div className="alert alert-danger alert-dismissible">
              {error}
              <button className="close" onClick={() => setError('')}><span>&times;</span></button>
            </div>
          )}

          <div className="row mb-3">
            {STATUS_LIST.map(s => (
              <div className="col-6 col-md-3 mb-2" key={s.value}>
                <div
                  className={'small-box ' + s.badge.replace('badge-', 'bg-') + ' mb-0'}
                  style={{ cursor: 'pointer', opacity: filterStatus === s.value ? 1 : 0.75 }}
                  onClick={() => setFilter(filterStatus === s.value ? '' : s.value)}
                >
                  <div className="inner">
                    <h4>{countBy(s.value)}</h4>
                    <p>{s.label}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>

          <div className="card">
            <div className="card-header">
              <div className="row align-items-center">
                <div className="col-md-4">
                  <div className="input-group">
                    <input
                      type="text"
                      className="form-control"
                      placeholder="Tìm theo mã đơn / địa chỉ..."
                      value={keyword}
                      onChange={e => setKeyword(e.target.value)}
                    />
                    <div className="input-group-append">
                      <span className="input-group-text"><i className="fas fa-search"></i></span>
                    </div>
                  </div>
                </div>
                <div className="col-md-3">
                  <select className="form-control" value={filterStatus} onChange={e => setFilter(e.target.value)}>
                    <option value="">-- Tất cả trạng thái --</option>
                    {STATUS_LIST.map(s => (
                      <option key={s.value} value={s.value}>{s.label}</option>
                    ))}
                  </select>
                </div>
                <div className="col-md-2">
                  <button className="btn btn-secondary" onClick={() => { setFilter(''); setKeyword(''); }}>
                    <i className="fas fa-redo mr-1"></i> Reset
                  </button>
                </div>
                <div className="col-md-3 text-right">
                  <span className="text-muted">Tổng: <strong>{filtered.length}</strong> đơn</span>
                </div>
              </div>
            </div>

            <div className="card-body p-0">
              {loading ? (
                <div className="text-center py-5">
                  <div className="spinner-border text-primary" role="status"></div>
                </div>
              ) : filtered.length === 0 ? (
                <div className="text-center py-4 text-muted">Không có đơn hàng nào</div>
              ) : (
                <div className="table-responsive">
                  <table className="table table-hover table-striped mb-0">
                    <thead className="thead-dark">
                      <tr>
                        <th>Mã đơn</th>
                        <th>Ngày đặt</th>
                        <th>Địa chỉ giao</th>
                        <th>Tổng tiền</th>
                        <th>Trạng thái</th>
                        <th>Thao tác</th>
                      </tr>
                    </thead>
                    <tbody>
                      {filtered.map(order => {
                        const st = statusLabel(order.status);
                        return (
                          <tr key={order.id}>
                            <td><strong>#{order.id}</strong></td>
                            <td>{new Date(order.orderDate).toLocaleDateString('vi-VN')}</td>
                            <td style={{ maxWidth: 200, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                              {order.shippingAddress || '-'}
                            </td>
                            <td><strong>{order.totalAmount && order.totalAmount.toLocaleString('vi-VN')} đ</strong></td>
                            <td><span className={'badge ' + st.badge}>{st.label}</span></td>
                            <td>
                              <button className="btn btn-sm btn-outline-primary mr-1" onClick={() => openDetail(order)} title="Xem chi tiet">
                                <i className="fas fa-eye"></i>
                              </button>
                              {order.status === 'Pending' && (
                                <button className="btn btn-sm btn-info mr-1" onClick={() => handleUpdateStatus(order.id, 'Shipping')} disabled={updating} title="Giao hang">
                                  <i className="fas fa-truck"></i>
                                </button>
                              )}
                              {order.status === 'Shipping' && (
                                <button className="btn btn-sm btn-success mr-1" onClick={() => handleUpdateStatus(order.id, 'Completed')} disabled={updating} title="Da giao">
                                  <i className="fas fa-check"></i>
                                </button>
                              )}
                              {(order.status === 'Pending' || order.status === 'Shipping') && (
                                <button className="btn btn-sm btn-danger" onClick={() => handleCancel(order.id)} disabled={updating} title="Huy don">
                                  <i className="fas fa-times"></i>
                                </button>
                              )}
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </div>
        </div>
      </section>

      {/* Detail Modal */}
      {showDetail && selected && (
        <>
          <div className="modal fade show" style={{ display: 'block', zIndex: 1050 }} tabIndex="-1">
            <div className="modal-dialog modal-lg">
              <div className="modal-content">
                <div className="modal-header">
                  <h5 className="modal-title">
                    Đơn hàng <strong>#{selected.id}</strong>
                    <span className={'badge ' + statusLabel(selected.status).badge + ' ml-2'}>
                      {statusLabel(selected.status).label}
                    </span>
                  </h5>
                  <button className="close" onClick={() => setShowDetail(false)}><span>&times;</span></button>
                </div>
                <div className="modal-body">
                  {detailLoading ? (
                    <div className="text-center py-4"><div className="spinner-border text-primary" role="status"></div></div>
                  ) : (
                    <>
                      <div className="row mb-3">
                        <div className="col-md-6">
                          <p><strong>Ngày đặt:</strong> {new Date(selected.orderDate).toLocaleString('vi-VN')}</p>
                          <p><strong>Địa chỉ:</strong> {selected.shippingAddress || '-'}</p>
                        </div>
                        <div className="col-md-6 text-right">
                          <p><strong>Tổng tiền:</strong> {selected.totalAmount && selected.totalAmount.toLocaleString('vi-VN')} đ</p>
                        </div>
                      </div>
                      <table className="table table-bordered table-sm">
                        <thead className="thead-light">
                          <tr>
                            <th>Sản phẩm</th>
                            <th className="text-center">SL</th>
                            <th className="text-right">Đơn giá</th>
                            <th className="text-right">Thành tiền</th>
                          </tr>
                        </thead>
                        <tbody>
                          {((detail && detail.details) || (detail && detail.orderDetails) || []).map((item, i) => (
                            <tr key={i}>
                              <td>{(item.product && item.product.name) || item.productName || ('Product #' + item.productId)}</td>
                              <td className="text-center">{item.quantity}</td>
                              <td className="text-right">{item.unitPrice && item.unitPrice.toLocaleString('vi-VN')} đ</td>
                              <td className="text-right">{item.unitPrice && (item.unitPrice * item.quantity).toLocaleString('vi-VN')} đ</td>
                            </tr>
                          ))}
                        </tbody>
                        <tfoot>
                          <tr>
                            <td colSpan={3} className="text-right"><strong>Tổng cộng:</strong></td>
                            <td className="text-right"><strong>{selected.totalAmount && selected.totalAmount.toLocaleString('vi-VN')} đ</strong></td>
                          </tr>
                        </tfoot>
                      </table>
                      <div className="mt-3">
                        <strong>Cập nhật trạng thái:</strong>
                        <div className="btn-group ml-3">
                          {STATUS_LIST.map(s => (
                            <button
                              key={s.value}
                              className={'btn btn-sm ' + (selected.status === s.value ? s.badge.replace('badge', 'btn') : 'btn-outline-secondary')}
                              onClick={() => handleUpdateStatus(selected.id, s.value)}
                              disabled={updating || selected.status === s.value || selected.status === 'Cancelled'}
                            >
                              {s.label}
                            </button>
                          ))}
                        </div>
                      </div>
                    </>
                  )}
                </div>
                <div className="modal-footer">
                  {(selected.status === 'Pending' || selected.status === 'Shipping') && (
                    <button className="btn btn-danger" onClick={() => handleCancel(selected.id)} disabled={updating}>
                      <i className="fas fa-times mr-1"></i> Hủy đơn
                    </button>
                  )}
                  <button className="btn btn-secondary" onClick={() => setShowDetail(false)}>Đóng</button>
                </div>
              </div>
            </div>
          </div>
          <div className="modal-backdrop fade show" style={{ zIndex: 1045 }}></div>
        </>
      )}

      {/* Confirm Popup */}
      {confirm && (
        <ConfirmModal
          message={confirm.message}
          onConfirm={confirm.onConfirm}
          onCancel={confirm.onCancel}
        />
      )}
    </>
  );
}