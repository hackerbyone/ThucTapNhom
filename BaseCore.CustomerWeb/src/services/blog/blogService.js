import { buildUrl, getHeaders, handleResponse } from '../utils/apiClient';

export const blogService = {
  getAll: async (params = {}) => {
    const queryParams = {
      page: params.page || 1,
      pageSize: params.pageSize || 10,
      keyword: params.keyword || '',
    };

    const response = await fetch(buildUrl('/api/blogs', queryParams), {
      method: 'GET',
      headers: getHeaders(),
    });
    return handleResponse(response, 'Failed to fetch blogs');
  },

  getById: async (id) => {
    const response = await fetch(buildUrl(`/api/blogs/${id}`), {
      method: 'GET',
      headers: getHeaders(),
    });
    return handleResponse(response, 'Failed to fetch blog');
  },

  create: async (blogData) => {
    const response = await fetch(buildUrl('/api/blogs'), {
      method: 'POST',
      headers: getHeaders(true),
      body: JSON.stringify(blogData),
    });
    return handleResponse(response, 'Failed to create blog');
  },

  update: async (id, blogData) => {
    const response = await fetch(buildUrl(`/api/blogs/${id}`), {
      method: 'PUT',
      headers: getHeaders(true),
      body: JSON.stringify(blogData),
    });
    return handleResponse(response, 'Failed to update blog');
  },

  delete: async (id) => {
    const response = await fetch(buildUrl(`/api/blogs/${id}`), {
      method: 'DELETE',
      headers: getHeaders(true),
    });
    return handleResponse(response, 'Failed to delete blog');
  },

  publish: async (id) => {
    const response = await fetch(buildUrl(`/api/blogs/${id}/publish`), {
      method: 'PUT',
      headers: getHeaders(true),
    });
    return handleResponse(response, 'Failed to publish blog');
  },

  unpublish: async (id) => {
    const response = await fetch(buildUrl(`/api/blogs/${id}/unpublish`), {
      method: 'PUT',
      headers: getHeaders(true),
    });
    return handleResponse(response, 'Failed to unpublish blog');
  },
};
