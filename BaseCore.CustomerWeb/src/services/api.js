const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000';

const getAuthToken = () => {
  const auth = sessionStorage.getItem('auth');
  return auth ? JSON.parse(auth).token : null;
};

const getHeaders = (includeAuth = false) => {
  const headers = {
    'Content-Type': 'application/json',
  };
  if (includeAuth) {
    const token = getAuthToken();
    if (token) headers['Authorization'] = `Bearer ${token}`;
  }
  return headers;
};

// Hàm tiện ích xử lý response
const handleResponse = async (response, defaultErrorMessage = 'Request failed') => {
  if (!response.ok) {
    let errorData;
    try {
      errorData = await response.json();
    } catch {
      // response not JSON
      throw new Error(defaultErrorMessage);
    }
    throw new Error(errorData.message || defaultErrorMessage);
  }
  return response.json();
};

// ===== AUTH API =====
export const authAPI = {
  login: async (username, password) => {
    const response = await fetch(`${API_BASE_URL}/api/auth/login`, {
      method: 'POST',
      headers: getHeaders(),
      body: JSON.stringify({ username, password }),
    });
    return handleResponse(response, 'Login failed');
  },

  register: async (username, password, email, name) => {
    const response = await fetch(`${API_BASE_URL}/api/auth/register`, {
      method: 'POST',
      headers: getHeaders(),
      body: JSON.stringify({ username, password, email, name }),
    });
    return handleResponse(response, 'Register failed');
  },
};

// ===== PRODUCTS API =====
export const productsAPI = {
  getAll: async (keyword = '', categoryId = null, page = 1, pageSize = 12) => {
    const params = new URLSearchParams();
    if (keyword) params.append('keyword', keyword);
    if (categoryId) params.append('categoryId', categoryId);
    params.append('page', page);
    params.append('pageSize', pageSize);

    const response = await fetch(`${API_BASE_URL}/api/products?${params}`, {
      method: 'GET',
      headers: getHeaders(),
    });
    return handleResponse(response, 'Failed to fetch products');
  },

  getById: async (id) => {
    const response = await fetch(`${API_BASE_URL}/api/products/${id}`, {
      method: 'GET',
      headers: getHeaders(),
    });
    return handleResponse(response, 'Failed to fetch product');
  },

  create: async (productData) => {
    const response = await fetch(`${API_BASE_URL}/api/products`, {
      method: 'POST',
      headers: getHeaders(true),
      body: JSON.stringify(productData),
    });
    return handleResponse(response, 'Failed to create product');
  },

  update: async (id, productData) => {
    const response = await fetch(`${API_BASE_URL}/api/products/${id}`, {
      method: 'PUT',
      headers: getHeaders(true),
      body: JSON.stringify(productData),
    });
    return handleResponse(response, 'Failed to update product');
  },

  delete: async (id) => {
    const response = await fetch(`${API_BASE_URL}/api/products/${id}`, {
      method: 'DELETE',
      headers: getHeaders(true),
    });
    return handleResponse(response, 'Failed to delete product');
  },
};

// ===== CATEGORIES API =====
export const categoriesAPI = {
  getAll: async () => {
    const response = await fetch(`${API_BASE_URL}/api/categories`, {
      method: 'GET',
      headers: getHeaders(),
    });
    return handleResponse(response, 'Failed to fetch categories');
  },

  getById: async (id) => {
    const response = await fetch(`${API_BASE_URL}/api/categories/${id}`, {
      method: 'GET',
      headers: getHeaders(),
    });
    return handleResponse(response, 'Failed to fetch category');
  },

  create: async (categoryData) => {
    const response = await fetch(`${API_BASE_URL}/api/categories`, {
      method: 'POST',
      headers: getHeaders(true),
      body: JSON.stringify(categoryData),
    });
    return handleResponse(response, 'Failed to create category');
  },

  update: async (id, categoryData) => {
    const response = await fetch(`${API_BASE_URL}/api/categories/${id}`, {
      method: 'PUT',
      headers: getHeaders(true),
      body: JSON.stringify(categoryData),
    });
    return handleResponse(response, 'Failed to update category');
  },

  delete: async (id) => {
    const response = await fetch(`${API_BASE_URL}/api/categories/${id}`, {
      method: 'DELETE',
      headers: getHeaders(true),
    });
    return handleResponse(response, 'Failed to delete category');
  },
};

// ===== ORDERS API =====
export const ordersAPI = {
  getAll: async (page = 1, pageSize = 10) => {
    const params = new URLSearchParams();
    params.append('page', page);
    params.append('pageSize', pageSize);

    const response = await fetch(`${API_BASE_URL}/api/orders?${params}`, {
      method: 'GET',
      headers: getHeaders(true),
    });
    return handleResponse(response, 'Failed to fetch orders');
  },

  getById: async (id) => {
    const response = await fetch(`${API_BASE_URL}/api/orders/${id}`, {
      method: 'GET',
      headers: getHeaders(true),
    });
    return handleResponse(response, 'Failed to fetch order');
  },

  create: async (orderData) => {
    const response = await fetch(`${API_BASE_URL}/api/orders`, {
      method: 'POST',
      headers: getHeaders(true),
      body: JSON.stringify(orderData),
    });
    return handleResponse(response, 'Failed to create order');
  },
};

// ===== CART API =====
export const cartAPI = {
  getCart: async () => {
    const response = await fetch(`${API_BASE_URL}/api/cart`, {
      method: 'GET',
      headers: getHeaders(true),
    });
    return handleResponse(response, 'Failed to fetch cart');
  },

  addItem: async (productId, quantity) => {
    const response = await fetch(`${API_BASE_URL}/api/cart/items`, {
      method: 'POST',
      headers: getHeaders(true),
      body: JSON.stringify({ productId, quantity }),
    });
    return handleResponse(response, 'Failed to add item to cart');
  },

  updateQuantity: async (productId, quantity) => {
    const response = await fetch(`${API_BASE_URL}/api/cart/items/${productId}`, {
      method: 'PUT',
      headers: getHeaders(true),
      body: JSON.stringify({ quantity }), // bỏ productId thừa
    });
    return handleResponse(response, 'Failed to update cart item');
  },

  removeItem: async (productId) => {
    const response = await fetch(`${API_BASE_URL}/api/cart/items/${productId}`, {
      method: 'DELETE',
      headers: getHeaders(true),
    });
    return handleResponse(response, 'Failed to remove item from cart');
  },

  clearCart: async () => {
    const response = await fetch(`${API_BASE_URL}/api/cart`, {
      method: 'DELETE',
      headers: getHeaders(true),
    });
    return handleResponse(response, 'Failed to clear cart');
  },

  checkout: async (shippingAddress, shippingMethod = 'Standard', paymentMethod = 'COD', customerName, customerPhone) => {
    const response = await fetch(`${API_BASE_URL}/api/cart/checkout`, {
      method: 'POST',
      headers: getHeaders(true),
      body: JSON.stringify({ shippingAddress, shippingMethod, paymentMethod, customerName, customerPhone }),
    });
    return handleResponse(response, 'Failed to checkout');
  },
};