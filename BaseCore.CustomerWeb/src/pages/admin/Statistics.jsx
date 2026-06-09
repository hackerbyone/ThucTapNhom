import { useState, useEffect } from 'react'
import { statisticsService } from '../../services/statistics/statisticsService'

const fmt = (n) => (n || 0).toLocaleString('vi-VN') + 'đ'

export default function Statistics() {
  const now = new Date()
  const [year, setYear] = useState(now.getFullYear())
  const [month, setMonth] = useState(now.getMonth() + 1)
  const [summary, setSummary] = useState(null)
  const [dailyData, setDailyData] = useState([])
  const [loading, setLoading] = useState(true)
  const [chartLoading, setChartLoading] = useState(false)
  const [error, setError] = useState(null)
  const [chartError, setChartError] = useState(null)

  useEffect(() => {
    setLoading(true)
    setError(null)
    statisticsService.getSummary()
      .then(setSummary)
      .catch(err => { console.error(err); setError(err.message) })
      .finally(() => setLoading(false))
  }, [])

  useEffect(() => {
    setChartLoading(true)
    setChartError(null)
    statisticsService.getDailyRevenue(year, month)
      .then(setDailyData)
      .catch(err => { console.error(err); setChartError(err.message) })
      .finally(() => setChartLoading(false))
  }, [year, month])

  const maxRevenue = Math.max(...dailyData.map(d => d.revenue), 1)
  const monthTotal = dailyData.reduce((s, d) => s + d.revenue, 0)
  const monthOrders = dailyData.reduce((s, d) => s + d.orderCount, 0)

  const yearOptions = []
  for (let y = 2024; y <= now.getFullYear() + 1; y++) yearOptions.push(y)

  return (
    <>
      <div className="content-header">
        <div className="container-fluid">
          <div className="row mb-2">
            <div className="col-sm-6">
              <h1 className="m-0">
                <i className="fas fa-chart-bar mr-2"></i>Thống kê doanh thu
              </h1>
            </div>
            <div className="col-sm-6">
              <ol className="breadcrumb float-sm-right">
                <li className="breadcrumb-item">Admin</li>
                <li className="breadcrumb-item active">Thống kê</li>
              </ol>
            </div>
          </div>
        </div>
      </div>

      <section className="content">
        <div className="container-fluid">

          {error && (
            <div className="alert alert-danger alert-dismissible">
              <button type="button" className="close" onClick={() => setError(null)}><span>&times;</span></button>
              <i className="fas fa-exclamation-triangle mr-2"></i>
              <strong>Lỗi tải thống kê:</strong> {error}
              <div className="mt-1 small">Kiểm tra xem API đang chạy và bạn đã đăng nhập với tài khoản Admin chưa.</div>
            </div>
          )}

          {loading ? (
            <div className="text-center py-5">
              <div className="spinner-border text-primary" role="status">
                <span className="sr-only">Loading...</span>
              </div>
            </div>
          ) : (
            <>
              {/* KPI Cards */}
              <div className="row">
                <div className="col-lg-3 col-6">
                  <div className="small-box bg-success">
                    <div className="inner">
                      <h3 style={{ fontSize: '1.3rem' }}>{fmt(summary?.thisMonthRevenue)}</h3>
                      <p>Doanh thu tháng này</p>
                    </div>
                    <div className="icon"><i className="fas fa-chart-line"></i></div>
                  </div>
                </div>
                <div className="col-lg-3 col-6">
                  <div className="small-box bg-info">
                    <div className="inner">
                      <h3>{summary?.completedOrders ?? 0}</h3>
                      <p>Đơn hoàn thành</p>
                    </div>
                    <div className="icon"><i className="fas fa-check-circle"></i></div>
                  </div>
                </div>
                <div className="col-lg-3 col-6">
                  <div className="small-box bg-warning">
                    <div className="inner">
                      <h3>{summary?.pendingOrders ?? 0}</h3>
                      <p>Đang xử lý</p>
                    </div>
                    <div className="icon"><i className="fas fa-clock"></i></div>
                  </div>
                </div>
                <div className="col-lg-3 col-6">
                  <div className="small-box bg-danger">
                    <div className="inner">
                      <h3>{summary?.cancelledOrders ?? 0}</h3>
                      <p>Đã huỷ</p>
                    </div>
                    <div className="icon"><i className="fas fa-times-circle"></i></div>
                  </div>
                </div>
              </div>

              {/* Info boxes */}
              <div className="row mb-3">
                <div className="col-md-4">
                  <div className="info-box">
                    <span className="info-box-icon bg-success elevation-1">
                      <i className="fas fa-coins"></i>
                    </span>
                    <div className="info-box-content">
                      <span className="info-box-text">Tổng doanh thu (tất cả)</span>
                      <span className="info-box-number">{fmt(summary?.totalRevenue)}</span>
                    </div>
                  </div>
                </div>
                <div className="col-md-4">
                  <div className="info-box">
                    <span className="info-box-icon bg-info elevation-1">
                      <i className="fas fa-shopping-bag"></i>
                    </span>
                    <div className="info-box-content">
                      <span className="info-box-text">Đơn hàng hôm nay</span>
                      <span className="info-box-number">{summary?.todayOrders ?? 0}</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Bar chart */}
              <div className="card">
                <div className="card-header d-flex justify-content-between align-items-center flex-wrap" style={{ gap: 8 }}>
                  <h3 className="card-title mb-0">
                    <i className="fas fa-chart-bar mr-2"></i>
                    Doanh thu theo ngày (đơn hoàn thành)
                  </h3>
                  <div className="d-flex" style={{ gap: 8 }}>
                    <select
                      className="form-control form-control-sm"
                      value={month}
                      onChange={e => setMonth(Number(e.target.value))}
                      style={{ width: 110 }}
                    >
                      {Array.from({ length: 12 }, (_, i) => i + 1).map(m => (
                        <option key={m} value={m}>Tháng {m}</option>
                      ))}
                    </select>
                    <select
                      className="form-control form-control-sm"
                      value={year}
                      onChange={e => setYear(Number(e.target.value))}
                      style={{ width: 90 }}
                    >
                      {yearOptions.map(y => (
                        <option key={y} value={y}>{y}</option>
                      ))}
                    </select>
                  </div>
                </div>
                <div className="card-body">
                  {chartLoading ? (
                    <div className="text-center py-4">
                      <div className="spinner-border text-primary" role="status">
                        <span className="sr-only">Loading...</span>
                      </div>
                    </div>
                  ) : chartError ? (
                    <div className="alert alert-warning mb-0">
                      <i className="fas fa-exclamation-triangle mr-2"></i>
                      Không thể tải dữ liệu biểu đồ: {chartError}
                    </div>
                  ) : monthTotal === 0 ? (
                    <div className="text-center text-muted py-4">
                      <i className="fas fa-chart-bar fa-3x mb-3 d-block" style={{ opacity: 0.3 }}></i>
                      <p className="mb-0">Không có đơn hoàn thành trong tháng {month}/{year}</p>
                      <small>Doanh thu chỉ tính từ các đơn có trạng thái "Hoàn thành"</small>
                    </div>
                  ) : (
                    <>
                      <div style={{ overflowX: 'auto', paddingBottom: 4 }}>
                        <div
                          style={{
                            display: 'flex',
                            alignItems: 'flex-end',
                            gap: 3,
                            height: 180,
                            minWidth: dailyData.length * 26,
                            padding: '0 4px',
                          }}
                        >
                          {dailyData.map(d => {
                            const barHeight = d.revenue > 0
                              ? Math.max((d.revenue / maxRevenue) * 160, 6)
                              : 2
                            return (
                              <div
                                key={d.day}
                                style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', flex: 1 }}
                              >
                                <div
                                  title={`Ngày ${d.day}/${month}: ${fmt(d.revenue)}${d.orderCount > 0 ? ` (${d.orderCount} đơn)` : ''}`}
                                  style={{
                                    width: '100%',
                                    height: barHeight,
                                    background: d.revenue > 0 ? 'var(--ab-600, #3d8bc2)' : '#dee2e6',
                                    borderRadius: '3px 3px 0 0',
                                    cursor: d.revenue > 0 ? 'pointer' : 'default',
                                    transition: 'filter 0.15s',
                                  }}
                                  onMouseEnter={e => { if (d.revenue > 0) e.currentTarget.style.filter = 'brightness(1.2)' }}
                                  onMouseLeave={e => { e.currentTarget.style.filter = '' }}
                                />
                                <small style={{ fontSize: '0.6rem', color: '#6c757d', marginTop: 2, lineHeight: 1 }}>
                                  {d.day}
                                </small>
                              </div>
                            )
                          })}
                        </div>
                      </div>

                      <div className="mt-3 d-flex justify-content-between align-items-center flex-wrap" style={{ gap: 8 }}>
                        <small className="text-muted">
                          <span
                            style={{ display: 'inline-block', width: 12, height: 12, background: 'var(--ab-600, #3d8bc2)', borderRadius: 2, marginRight: 4, verticalAlign: 'middle' }}
                          />
                          Doanh thu từ đơn hoàn thành
                        </small>
                        <div className="text-right">
                          <span className="text-muted" style={{ fontSize: '0.9rem' }}>
                            Tổng tháng {month}/{year}:{' '}
                            <strong style={{ color: 'var(--ab-600, #3d8bc2)', fontSize: '1rem' }}>
                              {fmt(monthTotal)}
                            </strong>
                            {monthOrders > 0 && (
                              <span className="ml-2 text-muted">({monthOrders} đơn)</span>
                            )}
                          </span>
                        </div>
                      </div>
                    </>
                  )}
                </div>
              </div>
            </>
          )}
        </div>
      </section>
    </>
  )
}
