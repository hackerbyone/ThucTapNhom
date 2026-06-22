import { useEffect, useMemo, useState } from 'react'
import { statisticsService } from '../../services/statistics/statisticsService'

const chartColors = ['#3d8bc2', '#2dc653', '#f5b400', '#e8333f', '#7c3aed', '#14b8a6', '#f97316', '#64748b']

const statusColors = {
  WaitingDeposit: '#f59e0b',
  DepositPaid: '#14b8a6',
  Processing: '#3d8bc2',
  Shipping: '#7c3aed',
  Completed: '#2dc653',
  Cancelled: '#e8333f',
}

const fmt = (n) => (Number(n) || 0).toLocaleString('vi-VN') + 'đ'
const fmtQty = (n) => (Number(n) || 0).toLocaleString('vi-VN')

const toInputDate = (date) => {
  const tzDate = new Date(date.getTime() - date.getTimezoneOffset() * 60000)
  return tzDate.toISOString().slice(0, 10)
}

const escapeHtml = (value) =>
  String(value ?? '')
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&#039;')

const makeTableRows = (rows, columns) =>
  rows.map(row => `<tr>${columns.map(col => `<td>${escapeHtml(col.render ? col.render(row) : row[col.key])}</td>`).join('')}</tr>`).join('')

function EmptyChart({ text = 'Chưa có dữ liệu trong khoảng thời gian này' }) {
  return (
    <div className="stats-empty-chart">
      <i className="fas fa-chart-area"></i>
      <p>{text}</p>
    </div>
  )
}

function LineChart({ data }) {
  const width = 760
  const height = 260
  const pad = { top: 18, right: 22, bottom: 42, left: 68 }
  const values = data.map(d => Number(d.revenue) || 0)
  const max = Math.max(...values, 1)
  const points = data.map((d, index) => {
    const x = pad.left + (data.length <= 1 ? 0 : index * (width - pad.left - pad.right) / (data.length - 1))
    const y = pad.top + (height - pad.top - pad.bottom) - ((Number(d.revenue) || 0) / max) * (height - pad.top - pad.bottom)
    return { ...d, x, y }
  })
  const path = points.map((p, index) => `${index === 0 ? 'M' : 'L'} ${p.x} ${p.y}`).join(' ')
  const labelEvery = Math.max(1, Math.ceil(data.length / 8))

  if (!data.length || values.every(v => v === 0)) return <EmptyChart />

  return (
    <div className="stats-chart-scroll">
      <svg className="stats-line-chart" viewBox={`0 0 ${width} ${height}`} role="img" aria-label="Doanh thu theo ngày">
        {[0, 0.25, 0.5, 0.75, 1].map(step => {
          const y = pad.top + (height - pad.top - pad.bottom) * step
          const value = max * (1 - step)
          return (
            <g key={step}>
              <line x1={pad.left} y1={y} x2={width - pad.right} y2={y} stroke="#e5eef5" />
              <text x={pad.left - 10} y={y + 4} textAnchor="end" className="stats-axis-text">{fmt(value)}</text>
            </g>
          )
        })}
        <path d={path} fill="none" stroke="#3d8bc2" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" />
        {points.map((p, index) => (
          <g key={p.date}>
            <circle cx={p.x} cy={p.y} r="4" fill="#3d8bc2">
              <title>{`${p.label}: ${fmt(p.revenue)} - ${fmtQty(p.quantitySold)} sản phẩm`}</title>
            </circle>
            {index % labelEvery === 0 && (
              <text x={p.x} y={height - 14} textAnchor="middle" className="stats-axis-text">{p.label}</text>
            )}
          </g>
        ))}
      </svg>
    </div>
  )
}

const polarToCartesian = (cx, cy, r, angle) => {
  const rad = (angle - 90) * Math.PI / 180
  return { x: cx + r * Math.cos(rad), y: cy + r * Math.sin(rad) }
}

const arcPath = (cx, cy, r, startAngle, endAngle) => {
  const start = polarToCartesian(cx, cy, r, endAngle)
  const end = polarToCartesian(cx, cy, r, startAngle)
  const largeArc = endAngle - startAngle <= 180 ? 0 : 1
  return `M ${cx} ${cy} L ${start.x} ${start.y} A ${r} ${r} 0 ${largeArc} 0 ${end.x} ${end.y} Z`
}

function PieChart({ data }) {
  const total = data.reduce((sum, item) => sum + (Number(item.revenue) || 0), 0)
  let angle = 0

  if (!data.length || total <= 0) return <EmptyChart />

  return (
    <div className="stats-pie-layout">
      <svg className="stats-pie" viewBox="0 0 220 220" role="img" aria-label="Doanh thu theo danh mục">
        {data.map((item, index) => {
          const value = Number(item.revenue) || 0
          const slice = value / total * 360
          const start = angle
          const end = angle + slice
          angle = end
          if (slice >= 359.99) {
            return <circle key={item.categoryId || item.categoryName} cx="110" cy="110" r="96" fill={chartColors[index % chartColors.length]} />
          }
          return (
            <path key={item.categoryId || item.categoryName} d={arcPath(110, 110, 96, start, end)} fill={chartColors[index % chartColors.length]}>
              <title>{`${item.categoryName}: ${fmt(item.revenue)} - ${fmtQty(item.quantitySold)} sản phẩm`}</title>
            </path>
          )
        })}
      </svg>
      <div className="stats-legend">
        {data.map((item, index) => (
          <div className="stats-legend-row" key={item.categoryId || item.categoryName}>
            <span className="stats-color" style={{ background: chartColors[index % chartColors.length] }} />
            <span className="stats-legend-name">{item.categoryName}</span>
            <strong>{fmt(item.revenue)}</strong>
            <small>{fmtQty(item.quantitySold)} sp</small>
          </div>
        ))}
      </div>
    </div>
  )
}

function DonutChart({ data }) {
  const total = data.reduce((sum, item) => sum + (Number(item.count) || 0), 0)
  let offset = 25
  const radius = 74
  const circumference = 2 * Math.PI * radius

  if (!data.length || total <= 0) return <EmptyChart />

  return (
    <div className="stats-pie-layout">
      <svg className="stats-pie" viewBox="0 0 220 220" role="img" aria-label="Số đơn theo trạng thái">
        <circle cx="110" cy="110" r={radius} fill="none" stroke="#e5eef5" strokeWidth="34" />
        {data.map((item, index) => {
          const count = Number(item.count) || 0
          const dash = count / total * circumference
          const color = statusColors[item.status] || chartColors[index % chartColors.length]
          const segment = (
            <circle
              key={item.status}
              cx="110"
              cy="110"
              r={radius}
              fill="none"
              stroke={color}
              strokeWidth="34"
              strokeDasharray={`${dash} ${circumference - dash}`}
              strokeDashoffset={-offset}
              strokeLinecap="butt"
              transform="rotate(-90 110 110)"
            >
              <title>{`${item.label}: ${count} đơn`}</title>
            </circle>
          )
          offset += dash
          return segment
        })}
        <text x="110" y="104" textAnchor="middle" className="stats-donut-number">{fmtQty(total)}</text>
        <text x="110" y="126" textAnchor="middle" className="stats-donut-label">đơn</text>
      </svg>
      <div className="stats-legend">
        {data.map((item, index) => (
          <div className="stats-legend-row" key={item.status}>
            <span className="stats-color" style={{ background: statusColors[item.status] || chartColors[index % chartColors.length] }} />
            <span className="stats-legend-name">{item.label}</span>
            <strong>{fmtQty(item.count)}</strong>
            <small>đơn</small>
          </div>
        ))}
      </div>
    </div>
  )
}

function TopProductsChart({ data }) {
  const max = Math.max(...data.map(item => Number(item.quantitySold) || 0), 1)
  if (!data.length) return <EmptyChart text="Chưa có sản phẩm bán được trong khoảng thời gian này" />

  return (
    <div className="stats-bars">
      {data.map((item, index) => {
        const width = Math.max(5, (Number(item.quantitySold) || 0) / max * 100)
        return (
          <div className="stats-bar-row" key={item.productId}>
            <div className="stats-bar-label">
              <span>{index + 1}. {item.productName}</span>
              <small>{item.categoryName}</small>
            </div>
            <div className="stats-bar-track">
              <div className="stats-bar-fill" style={{ width: `${width}%` }} />
            </div>
            <div className="stats-bar-value">
              <strong>{fmtQty(item.quantitySold)}</strong>
              <small>{fmt(item.revenue)}</small>
            </div>
          </div>
        )
      })}
    </div>
  )
}

export default function Statistics() {
  const now = new Date()
  const monthStart = new Date(now.getFullYear(), now.getMonth(), 1)
  const [fromDate, setFromDate] = useState(toInputDate(monthStart))
  const [toDate, setToDate] = useState(toInputDate(now))
  const [report, setReport] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  const loadReport = () => {
    if (!fromDate || !toDate) {
      setError('Vui lòng chọn đầy đủ khoảng thời gian.')
      return
    }

    if (new Date(fromDate) > new Date(toDate)) {
      setError('Ngày bắt đầu không được lớn hơn ngày kết thúc.')
      return
    }

    setLoading(true)
    setError(null)
    statisticsService.getReport(fromDate, toDate)
      .then(setReport)
      .catch(err => { console.error(err); setError(err.message || 'Không thể tải báo cáo thống kê') })
      .finally(() => setLoading(false))
  }

  useEffect(() => {
    loadReport()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const summary = report?.summary || {}
  const dailyRevenue = report?.dailyRevenue || []
  const categoryRevenue = report?.categoryRevenue || []
  const topProducts = report?.topProducts || []
  const statusCounts = report?.statusCounts || []

  const reportTitle = useMemo(() => {
    const from = report?.range?.from || fromDate
    const to = report?.range?.to || toDate
    return `Báo cáo thống kê từ ${from} đến ${to}`
  }, [report, fromDate, toDate])

  const buildReportHtml = () => {
    const summaryRows = [
      ['Doanh thu hoàn thành', fmt(summary.revenue)],
      ['Đơn hoàn thành', fmtQty(summary.completedOrders)],
      ['Tổng đơn', fmtQty(summary.totalOrders)],
      ['Đang xử lý', fmtQty(summary.pendingOrders)],
      ['Đã hủy', fmtQty(summary.cancelledOrders)],
      ['Số lượng sản phẩm bán được', fmtQty(summary.quantitySold)],
    ]

    return `
      <html>
        <head>
          <meta charset="UTF-8" />
          <style>
            body { font-family: Arial, sans-serif; color: #1f2937; }
            h1 { font-size: 22px; margin-bottom: 4px; }
            h2 { font-size: 16px; margin: 24px 0 8px; }
            table { border-collapse: collapse; width: 100%; margin-bottom: 14px; }
            th, td { border: 1px solid #d1d5db; padding: 8px; font-size: 12px; text-align: left; }
            th { background: #e8f4fd; }
            .number { text-align: right; }
          </style>
        </head>
        <body>
          <h1>${escapeHtml(reportTitle)}</h1>
          <p>Doanh thu và sản phẩm bán được chỉ tính từ đơn hoàn thành.</p>
          <h2>Tổng quan</h2>
          <table>
            <tbody>${summaryRows.map(([k, v]) => `<tr><th>${escapeHtml(k)}</th><td class="number">${escapeHtml(v)}</td></tr>`).join('')}</tbody>
          </table>
          <h2>Doanh thu theo ngày</h2>
          <table>
            <thead><tr><th>Ngày</th><th>Doanh thu</th><th>Đơn hoàn thành</th><th>Sản phẩm bán được</th></tr></thead>
            <tbody>${makeTableRows(dailyRevenue, [
              { key: 'label', render: r => r.date },
              { key: 'revenue', render: r => fmt(r.revenue) },
              { key: 'orderCount', render: r => fmtQty(r.orderCount) },
              { key: 'quantitySold', render: r => fmtQty(r.quantitySold) },
            ])}</tbody>
          </table>
          <h2>Doanh thu theo danh mục</h2>
          <table>
            <thead><tr><th>Danh mục</th><th>Doanh thu</th><th>Sản phẩm bán được</th></tr></thead>
            <tbody>${makeTableRows(categoryRevenue, [
              { key: 'categoryName' },
              { key: 'revenue', render: r => fmt(r.revenue) },
              { key: 'quantitySold', render: r => fmtQty(r.quantitySold) },
            ])}</tbody>
          </table>
          <h2>Top sản phẩm bán chạy</h2>
          <table>
            <thead><tr><th>Sản phẩm</th><th>Danh mục</th><th>Số lượng bán</th><th>Doanh thu</th></tr></thead>
            <tbody>${makeTableRows(topProducts, [
              { key: 'productName' },
              { key: 'categoryName' },
              { key: 'quantitySold', render: r => fmtQty(r.quantitySold) },
              { key: 'revenue', render: r => fmt(r.revenue) },
            ])}</tbody>
          </table>
          <h2>Số đơn theo trạng thái</h2>
          <table>
            <thead><tr><th>Trạng thái</th><th>Số đơn</th><th>Giá trị đơn</th></tr></thead>
            <tbody>${makeTableRows(statusCounts, [
              { key: 'label' },
              { key: 'count', render: r => fmtQty(r.count) },
              { key: 'revenue', render: r => fmt(r.revenue) },
            ])}</tbody>
          </table>
        </body>
      </html>
    `
  }

  const downloadExcel = () => {
    if (!report) return
    const blob = new Blob([buildReportHtml()], { type: 'application/vnd.ms-excel;charset=utf-8' })
    const url = URL.createObjectURL(blob)
    const link = document.createElement('a')
    link.href = url
    link.download = `bao-cao-thong-ke-${fromDate}-${toDate}.xls`
    document.body.appendChild(link)
    link.click()
    link.remove()
    URL.revokeObjectURL(url)
  }

  const exportPdf = () => {
    if (!report) return
    const printWindow = window.open('', '_blank')
    if (!printWindow) {
      setError('Trình duyệt đang chặn cửa sổ xuất PDF. Vui lòng cho phép pop-up rồi thử lại.')
      return
    }
    printWindow.document.write(buildReportHtml())
    printWindow.document.close()
    printWindow.focus()
    printWindow.print()
  }

  return (
    <>
      <div className="content-header">
        <div className="container-fluid">
          <div className="row align-items-center">
            <div className="col-md-6">
              <h1 className="m-0">
                <i className="fas fa-chart-bar mr-2"></i>Thống kê doanh thu
              </h1>
            </div>
            <div className="col-md-6">
              <div className="stats-header-actions">
                <button type="button" className="btn btn-outline-primary btn-sm" onClick={downloadExcel} disabled={!report || loading}>
                  <i className="fas fa-file-excel mr-1"></i>Xuất Excel
                </button>
                <button type="button" className="btn btn-primary btn-sm" onClick={exportPdf} disabled={!report || loading}>
                  <i className="fas fa-file-pdf mr-1"></i>Xuất PDF
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>

      <section className="content">
        <div className="container-fluid">
          <div className="card stats-filter-card">
            <div className="card-body">
              <div className="stats-filter-row">
                <div>
                  <label>Từ ngày</label>
                  <input className="form-control" type="date" value={fromDate} onChange={e => setFromDate(e.target.value)} />
                </div>
                <div>
                  <label>Đến ngày</label>
                  <input className="form-control" type="date" value={toDate} onChange={e => setToDate(e.target.value)} />
                </div>
                <button type="button" className="btn btn-primary" onClick={loadReport} disabled={loading}>
                  <i className="fas fa-sync-alt mr-1"></i>Xem báo cáo
                </button>
              </div>
              <small className="text-muted">Doanh thu và số lượng sản phẩm bán được tính từ các đơn hoàn thành trong khoảng thời gian đã chọn.</small>
            </div>
          </div>

          {error && (
            <div className="alert alert-danger alert-dismissible">
              <button type="button" className="close" onClick={() => setError(null)}><span>&times;</span></button>
              <i className="fas fa-exclamation-triangle mr-2"></i>
              <strong>Lỗi tải thống kê:</strong> {error}
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
              <div className="row stats-kpi-row">
                <div className="col-lg-3 col-6">
                  <div className="small-box bg-success">
                    <div className="inner">
                      <h3>{fmt(summary.revenue)}</h3>
                      <p>Doanh thu hoàn thành</p>
                    </div>
                    <div className="icon"><i className="fas fa-chart-line"></i></div>
                  </div>
                </div>
                <div className="col-lg-3 col-6">
                  <div className="small-box bg-info">
                    <div className="inner">
                      <h3>{fmtQty(summary.completedOrders)}</h3>
                      <p>Đơn hoàn thành</p>
                    </div>
                    <div className="icon"><i className="fas fa-check-circle"></i></div>
                  </div>
                </div>
                <div className="col-lg-3 col-6">
                  <div className="small-box bg-warning">
                    <div className="inner">
                      <h3>{fmtQty(summary.quantitySold)}</h3>
                      <p>Sản phẩm đã bán</p>
                    </div>
                    <div className="icon"><i className="fas fa-box-open"></i></div>
                  </div>
                </div>
                <div className="col-lg-3 col-6">
                  <div className="small-box bg-danger">
                    <div className="inner">
                      <h3>{fmtQty(summary.pendingOrders)}</h3>
                      <p>Đang xử lý</p>
                    </div>
                    <div className="icon"><i className="fas fa-clock"></i></div>
                  </div>
                </div>
              </div>

              <div className="row">
                <div className="col-xl-8">
                  <div className="card stats-chart-card">
                    <div className="card-header">
                      <h3 className="card-title mb-0">
                        <i className="fas fa-chart-line mr-2"></i>Doanh thu theo ngày
                      </h3>
                    </div>
                    <div className="card-body">
                      <LineChart data={dailyRevenue} />
                    </div>
                  </div>
                </div>
                <div className="col-xl-4">
                  <div className="card stats-chart-card">
                    <div className="card-header">
                      <h3 className="card-title mb-0">
                        <i className="fas fa-circle-notch mr-2"></i>Số đơn theo trạng thái
                      </h3>
                    </div>
                    <div className="card-body">
                      <DonutChart data={statusCounts} />
                    </div>
                  </div>
                </div>
              </div>

              <div className="row">
                <div className="col-xl-5">
                  <div className="card stats-chart-card">
                    <div className="card-header">
                      <h3 className="card-title mb-0">
                        <i className="fas fa-chart-pie mr-2"></i>Doanh thu theo danh mục
                      </h3>
                    </div>
                    <div className="card-body">
                      <PieChart data={categoryRevenue} />
                    </div>
                  </div>
                </div>
                <div className="col-xl-7">
                  <div className="card stats-chart-card">
                    <div className="card-header">
                      <h3 className="card-title mb-0">
                        <i className="fas fa-chart-bar mr-2"></i>Top sản phẩm bán chạy
                      </h3>
                    </div>
                    <div className="card-body">
                      <TopProductsChart data={topProducts} />
                    </div>
                  </div>
                </div>
              </div>

              <div className="card">
                <div className="card-header">
                  <h3 className="card-title mb-0">
                    <i className="fas fa-table mr-2"></i>Chi tiết số lượng sản phẩm bán được
                  </h3>
                </div>
                <div className="card-body p-0">
                  <div className="table-responsive">
                    <table className="table table-striped mb-0">
                      <thead>
                        <tr>
                          <th>Sản phẩm</th>
                          <th>Danh mục</th>
                          <th className="text-right">Số lượng bán</th>
                          <th className="text-right">Doanh thu</th>
                        </tr>
                      </thead>
                      <tbody>
                        {topProducts.length === 0 ? (
                          <tr>
                            <td colSpan="4" className="text-center text-muted py-4">Chưa có sản phẩm bán được trong khoảng thời gian này.</td>
                          </tr>
                        ) : topProducts.map(product => (
                          <tr key={product.productId}>
                            <td>{product.productName}</td>
                            <td>{product.categoryName}</td>
                            <td className="text-right font-weight-bold">{fmtQty(product.quantitySold)}</td>
                            <td className="text-right">{fmt(product.revenue)}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              </div>
            </>
          )}
        </div>
      </section>
    </>
  )
}
