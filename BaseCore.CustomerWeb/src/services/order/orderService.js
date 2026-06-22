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

  getByUserId: async (userId, page = 1, pageSize = 10) => {
    const params = { userId, page, pageSize };
    const response = await fetch(buildUrl('/api/orders', params), {
      method: 'GET',
      headers: getHeaders(true),
    });
    return handleResponse(response, 'Failed to fetch user orders');
  },

  // Admin: lấy đơn của một user cụ thể theo ID
  getByUserIdAdmin: async (userId) => {
    const response = await fetch(buildUrl(`/api/orders/user/${userId}`), {
      method: 'GET',
      headers: getHeaders(true),
    });
    return handleResponse(response, 'Failed to fetch user orders');
  },
};
