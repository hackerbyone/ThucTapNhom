import { buildUrl, getHeaders, handleResponse } from '../utils/apiClient'

export const statisticsService = {
  getSummary: () =>
    fetch(buildUrl('/api/statistics/summary'), { headers: getHeaders(true) })
      .then(r => handleResponse(r, 'Không thể tải thống kê')),

  getDailyRevenue: (year, month) =>
    fetch(buildUrl('/api/statistics/daily-revenue', { year, month }), { headers: getHeaders(true) })
      .then(r => handleResponse(r, 'Không thể tải doanh thu theo ngày')),
}
