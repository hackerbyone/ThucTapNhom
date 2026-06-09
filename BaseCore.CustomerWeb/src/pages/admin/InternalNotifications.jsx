import React, { useState, useEffect } from 'react';
import { warehouseService } from '../../services/warehouse/warehouseService';

const TARGET_TYPE_LABELS = { Fish: 'Bể cá', Accessory: 'Phụ kiện/Thiết bị' };
const TARGET_TYPE_ICONS  = { Fish: 'fa-fish text-info', Accessory: 'fa-tools text-warning' };

export default function InternalNotifications() {
  const [commits, setCommits]       = useState([]);
  const [total, setTotal]           = useState(0);
  const [page, setPage]             = useState(1);
  const [pageSize]                  = useState(30);
  const [staffFilter, setStaffFilter] = useState('');
  const [typeFilter, setTypeFilter] = useState('');
  const [loading, setLoading]       = useState(false);
  const [staffSearch, setStaffSearch] = useState('');

  useEffect(() => { loadCommits(); }, [page, typeFilter]);

  const loadCommits = async () => {
    setLoading(true);
    try {
      const res = await warehouseService.getCommits('', typeFilter, page, pageSize);
      setCommits(res.items || []);
      setTotal(res.total || 0);
    } catch (e) { console.error(e); }
    finally { setLoading(false); }
  };

  const fmtDate = d => d ? new Date(d).toLocaleString('vi-VN') : '';

  // Lọc theo tên nhân viên ở client (vì API chỉ filter theo staffId, không phải tên)
  const filtered = staffSearch
    ? commits.filter(c => c.staffName.toLowerCase().includes(staffSearch.toLowerCase()))
    : commits;

  const grouped = filtered.reduce((acc, commit) => {
    const dateKey = new Date(commit.created).toLocaleDateString('vi-VN');
    if (!acc[dateKey]) acc[dateKey] = [];
    acc[dateKey].push(commit);
    return acc;
  }, {});

  return (
    <>
      <div className="content-header">
        <div className="container-fluid">
          <div className="row mb-2">
            <div className="col-sm-6">
              <h1 className="m-0">
                <i className="fas fa-bell mr-2 text-warning"></i>Thông báo nội bộ
              </h1>
            </div>
            <div className="col-sm-6 text-right">
              <small className="text-muted">Nhật ký cập nhật kho của nhân viên</small>
            </div>
          </div>
        </div>
      </div>

      <section className="content">
        <div className="container-fluid">

          {/* Bộ lọc */}
          <div className="card card-outline card-warning mb-3">
            <div className="card-body py-2">
              <div className="form-inline">
                <div className="form-group mr-3">
                  <label className="mr-2 text-muted">Nhân viên:</label>
                  <input className="form-control form-control-sm" placeholder="Tìm theo tên..."
                    value={staffSearch} onChange={e => setStaffSearch(e.target.value)} style={{ width: 180 }} />
                </div>
                <div className="form-group mr-3">
                  <label className="mr-2 text-muted">Loại:</label>
                  <select className="form-control form-control-sm" value={typeFilter}
                    onChange={e => { setTypeFilter(e.target.value); setPage(1); }}>
                    <option value="">Tất cả</option>
                    <option value="Fish">Bể cá</option>
                    <option value="Accessory">Phụ kiện/Thiết bị</option>
                  </select>
                </div>
                <button className="btn btn-sm btn-outline-secondary" onClick={() => { setStaffSearch(''); setTypeFilter(''); setPage(1); }}>
                  <i className="fas fa-redo mr-1"></i> Reset
                </button>
                <small className="ml-auto text-muted">Tổng {total} bản ghi</small>
              </div>
            </div>
          </div>

          {/* Nội dung */}
          {loading ? (
            <div className="text-center py-5"><i className="fas fa-spinner fa-spin fa-2x text-muted"></i></div>
          ) : filtered.length === 0 ? (
            <div className="text-center text-muted py-5">
              <i className="fas fa-inbox fa-3x mb-2"></i>
              <p>Chưa có thông báo nào</p>
            </div>
          ) : (
            Object.entries(grouped).map(([date, items]) => (
              <div key={date} className="mb-4">
                <div className="d-flex align-items-center mb-2">
                  <span className="badge badge-secondary mr-2" style={{ fontSize: '0.85rem' }}>
                    <i className="fas fa-calendar-alt mr-1"></i>{date}
                  </span>
                  <small className="text-muted">{items.length} cập nhật</small>
                  <hr className="flex-grow-1 ml-2 my-0" />
                </div>

                {items.map(commit => (
                  <CommitCard key={commit.id} commit={commit} fmtDate={fmtDate} />
                ))}
              </div>
            ))
          )}

          {/* Phân trang */}
          <div className="d-flex justify-content-center mt-3">
            <nav>
              <ul className="pagination pagination-sm">
                <li className={`page-item ${page <= 1 ? 'disabled' : ''}`}>
                  <button className="page-link" onClick={() => setPage(p => p - 1)}>&laquo; Trước</button>
                </li>
                <li className="page-item active">
                  <span className="page-link">Trang {page}</span>
                </li>
                <li className={`page-item ${commits.length < pageSize ? 'disabled' : ''}`}>
                  <button className="page-link" onClick={() => setPage(p => p + 1)}>Sau &raquo;</button>
                </li>
              </ul>
            </nav>
          </div>
        </div>
      </section>
    </>
  );
}

function CommitCard({ commit, fmtDate }) {
  const icon  = TARGET_TYPE_ICONS[commit.targetType]  || 'fa-circle text-secondary';
  const label = TARGET_TYPE_LABELS[commit.targetType] || commit.targetType;

  let diffBlock = null;
  try {
    const oldV = commit.oldValue ? JSON.parse(commit.oldValue) : null;
    const newV = commit.newValue ? JSON.parse(commit.newValue) : null;
    if (oldV || newV) {
      diffBlock = (
        <div className="mt-2 px-2 py-1 rounded" style={{ background: '#f8f9fa', fontSize: '0.82rem' }}>
          {commit.targetType === 'Fish' && oldV && newV && (
            <>
              <span className="mr-3">
                <i className="fas fa-mars text-primary mr-1"></i>
                Đực: <s className="text-muted">{oldV.maleCount}</s> → <strong>{newV.maleCount}</strong>
              </span>
              <span>
                <i className="fas fa-venus text-danger mr-1"></i>
                Cái: <s className="text-muted">{oldV.femaleCount}</s> → <strong>{newV.femaleCount}</strong>
              </span>
            </>
          )}
          {commit.targetType === 'Accessory' && oldV && newV && (
            <>
              <span className="mr-3">
                SL: <s className="text-muted">{oldV.quantity}</s> → <strong>{newV.quantity}</strong>
              </span>
              {oldV.status !== newV.status && (
                <span>
                  Trạng thái: <s className="text-muted">{oldV.status}</s> → <strong>{newV.status}</strong>
                </span>
              )}
            </>
          )}
          {!oldV && newV && <span className="text-success"><i className="fas fa-plus-circle mr-1"></i>Tạo mới</span>}
          {oldV && !newV && <span className="text-danger"><i className="fas fa-minus-circle mr-1"></i>Đã xoá</span>}
        </div>
      );
    }
  } catch { /* ignore */ }

  return (
    <div className="card card-sm mb-2 border-left border-left-4"
      style={{ borderLeftColor: commit.targetType === 'Fish' ? '#17a2b8' : '#ffc107', borderLeftWidth: 4 }}>
      <div className="card-body py-2 px-3">
        <div className="d-flex align-items-start">
          <div className="mr-3 mt-1">
            <i className={`fas ${icon} fa-lg`}></i>
          </div>
          <div className="flex-grow-1">
            <div className="d-flex justify-content-between align-items-start">
              <div>
                <span className="font-weight-bold">{commit.staffName}</span>
                <span className="text-muted mx-2">·</span>
                <span className="badge badge-light border">{label}</span>
                <span className="text-muted mx-2">·</span>
                <span className="text-muted" style={{ fontSize: '0.85rem' }}>{commit.targetName}</span>
              </div>
              <small className="text-muted ml-2 flex-shrink-0">{fmtDate(commit.created)}</small>
            </div>
            <div className="mt-1 text-dark">
              <i className="fas fa-code-branch text-secondary mr-1" style={{ fontSize: '0.8rem' }}></i>
              {commit.commitMessage}
            </div>
            {diffBlock}
          </div>
        </div>
      </div>
    </div>
  );
}
