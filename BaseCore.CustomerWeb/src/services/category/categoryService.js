import { buildUrl, getHeaders, handleResponse } from '../utils/apiClient';

export const categoryService = {
  getAll: async () => {
    const response = await fetch(buildUrl('/api/categories'), {
      method: 'GET',
      headers: getHeaders(),
    });
    return handleResponse(response, 'Failed to fetch categories');
  },

  getById: async (id) => {
    const response = await fetch(buildUrl(`/api/categories/${id}`), {
      method: 'GET',
      headers: getHeaders(),
    });
    return handleResponse(response, 'Failed to fetch category');
  },

  create: async (categoryData) => {
    const response = await fetch(buildUrl('/api/categories'), {
      method: 'POST',
      headers: getHeaders(true),
      body: JSON.stringify(categoryData),
    });
    return handleResponse(response, 'Failed to create category');
  },

  update: async (id, categoryData) => {
    const response = await fetch(buildUrl(`/api/categories/${id}`), {
      method: 'PUT',
      headers: getHeaders(true),
      body: JSON.stringify(categoryData),
    });
    return handleResponse(response, 'Failed to update category');
  },

  delete: async (id) => {
    const response = await fetch(buildUrl(`/api/categories/${id}`), {
      method: 'DELETE',
      headers: getHeaders(true),
    });
    return handleResponse(response, 'Failed to delete category');
  },
};
