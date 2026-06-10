import { buildUrl, getHeaders, handleResponse } from '../utils/apiClient';

export const warehouseService = {
  // Bể cá
  getTanks: async (keyword = '', page = 1, pageSize = 20) => {
    const params = { page, pageSize };
    if (keyword) params.keyword = keyword;
    const res = await fetch(buildUrl('/api/warehouse/tanks', params), { headers: getHeaders() });
    return handleResponse(res, 'Không thể tải danh sách bể cá');
  },

  createTank: async (data) => {
    const res = await fetch(buildUrl('/api/warehouse/tanks'), {
      method: 'POST',
      headers: getHeaders(true),
      body: JSON.stringify(data),
    });
    return handleResponse(res, 'Không thể tạo bể cá');
  },

  updateTank: async (id, data) => {
    const res = await fetch(buildUrl(`/api/warehouse/tanks/${id}`), {
      method: 'PUT',
      headers: getHeaders(true),
      body: JSON.stringify(data),
    });
    return handleResponse(res, 'Không thể cập nhật bể cá');
  },

  deleteTank: async (id, staffId, staffName) => {
    const res = await fetch(buildUrl(`/api/warehouse/tanks/${id}`, { staffId, staffName }), {
      method: 'DELETE',
      headers: getHeaders(true),
    });
    return handleResponse(res, 'Không thể xoá bể cá');
  },

  // Phụ kiện & thiết bị
  getAccessories: async (keyword = '', type = '', page = 1, pageSize = 20) => {
    const params = { page, pageSize };
    if (keyword) params.keyword = keyword;
    if (type) params.type = type;
    const res = await fetch(buildUrl('/api/warehouse/accessories', params), { headers: getHeaders() });
    return handleResponse(res, 'Không thể tải danh sách phụ kiện');
  },

  createAccessory: async (data) => {
    const res = await fetch(buildUrl('/api/warehouse/accessories'), {
      method: 'POST',
      headers: getHeaders(true),
      body: JSON.stringify(data),
    });
    return handleResponse(res, 'Không thể tạo phụ kiện');
  },

  updateAccessory: async (id, data) => {
    const res = await fetch(buildUrl(`/api/warehouse/accessories/${id}`), {
      method: 'PUT',
      headers: getHeaders(true),
      body: JSON.stringify(data),
    });
    return handleResponse(res, 'Không thể cập nhật phụ kiện');
  },

  deleteAccessory: async (id, staffId, staffName) => {
    const res = await fetch(buildUrl(`/api/warehouse/accessories/${id}`, { staffId, staffName }), {
      method: 'DELETE',
      headers: getHeaders(true),
    });
    return handleResponse(res, 'Không thể xoá phụ kiện');
  },

  // Ghi nhận hao hụt cá
  recordTankLoss: async (id, data) => {
    const res = await fetch(buildUrl(`/api/warehouse/tanks/${id}/loss`), {
      method: 'POST', headers: getHeaders(true), body: JSON.stringify(data),
    });
    return handleResponse(res, 'Không thể ghi nhận hao hụt');
  },

  // Ghi nhận hư hỏng phụ kiện
  recordAccessoryLoss: async (id, data) => {
    const res = await fetch(buildUrl(`/api/warehouse/accessories/${id}/loss`), {
      method: 'POST', headers: getHeaders(true), body: JSON.stringify(data),
    });
    return handleResponse(res, 'Không thể ghi nhận hư hỏng');
  },

  // Đồng bộ kho từ danh sách sản phẩm
  syncFromProducts: async (staffId = '', staffName = '') => {
    const params = {};
    if (staffId)   params.staffId   = staffId;
    if (staffName) params.staffName = staffName;
    const res = await fetch(buildUrl('/api/warehouse/sync', params), {
      method: 'POST',
      headers: getHeaders(true),
    });
    return handleResponse(res, 'Không thể đồng bộ kho');
  },

  // Commit log
  getCommits: async (staffId = '', targetType = '', page = 1, pageSize = 30) => {
    const params = { page, pageSize };
    if (staffId) params.staffId = staffId;
    if (targetType) params.targetType = targetType;
    const res = await fetch(buildUrl('/api/warehouse/commits', params), { headers: getHeaders(true) });
    return handleResponse(res, 'Không thể tải lịch sử commit');
  },
};
