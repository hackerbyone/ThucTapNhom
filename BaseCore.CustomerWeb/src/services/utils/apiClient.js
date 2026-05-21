// Shared utility for API requests
const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000';

export const getAuthToken = () => {
  const auth = sessionStorage.getItem('auth');
  return auth ? JSON.parse(auth).token : null;
};

export const getHeaders = (includeAuth = false) => {
  const headers = {
    'Content-Type': 'application/json',
  };
  if (includeAuth) {
    const token = getAuthToken();
    if (token) headers['Authorization'] = `Bearer ${token}`;
  }
  return headers;
};

export const handleResponse = async (response, defaultErrorMessage = 'Request failed') => {
  if (!response.ok) {
    let errorData;
    try {
      errorData = await response.json();
    } catch {
      if (response.status === 401) throw new Error('Phiên đăng nhập hết hạn, vui lòng đăng nhập lại');
      if (response.status === 403) throw new Error('Bạn không có quyền thực hiện thao tác này');
      throw new Error(defaultErrorMessage);
    }

    // { message: "..." } – lỗi từ controller trả về BadRequest(new { message })
    if (errorData.message) throw new Error(errorData.message);

    // ModelState errors – ASP.NET auto-validation: { title, errors: { Field: ["msg"] } }
    if (errorData.errors) {
      const msgs = Object.values(errorData.errors).flat();
      if (msgs.length > 0) throw new Error(msgs.join(' | '));
    }

    // { title: "..." } – ASP.NET problem details
    if (errorData.title) throw new Error(errorData.title);

    throw new Error(defaultErrorMessage);
  }
  if (response.status === 204) return null;
  return response.json();
};

export const buildUrl = (endpoint, params = null) => {
  let url = `${API_BASE_URL}${endpoint}`;
  if (params) {
    const queryString = new URLSearchParams(params).toString();
    if (queryString) url += `?${queryString}`;
  }
  return url;
};
