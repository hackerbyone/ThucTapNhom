import { buildUrl, getHeaders, handleResponse } from '../utils/apiClient';

export const orderService = {
  getAll: async (page = 1, pageSize = 10) => {
    const params = {
      page,
      pageSize,
    };

    const response = await fetch(buildUrl('/api/orders', params), {
      method: 'GET',
      headers: getHeaders(true),
    });
    return handleResponse(response, 'Failed to fetch orders');
  },

  getById: async (id) => {
    const response = await fetch(buildUrl(`/api/orders/${id}`), {
      method: 'GET',
      headers: getHeaders(true),
    });
    return handleResponse(response, 'Failed to fetch order');
  },

  create: async (orderData) => {
    const response = await fetch(buildUrl('/api/orders'), {
      method: 'POST',
      headers: getHeaders(true),
      body: JSON.stringify(orderData),
    });
    return handleResponse(response, 'Failed to create order');
  },

  cancel: async (id) => {
    const response = await fetch(buildUrl(`/api/orders/${id}/cancel`), {
      method: 'PUT',
      headers: getHeaders(true),
    });
    return handleResponse(response, 'Failed to cancel order');
  },

  createVnpayUrl: async (orderId) => {
    const response = await fetch(buildUrl(`/api/vnpay/create/${orderId}`), {
      method: 'POST',
      headers: getHeaders(true),
    });
    return handleResponse(response, 'Không thể tạo liên kết thanh toán VNPay');
  },

  verifyVnpay: async (queryString) => {
    const response = await fetch(buildUrl('/api/vnpay/verify') + '?' + queryString, {
      method: 'GET',
      headers: getHeaders(false),
    });
    return handleResponse(response, 'Không thể xác thực thanh toán VNPay');
  },

  getByUserId: async (userId, page = 1, pageSize = 10) => {
    const params = {
      userId,
      page,
      pageSize,
    };

    const response = await fetch(buildUrl('/api/orders', params), {
      method: 'GET',
      headers: getHeaders(true),
    });
    return handleResponse(response, 'Failed to fetch user orders');
  },
};
