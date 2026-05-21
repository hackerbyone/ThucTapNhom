import { buildUrl, getHeaders, handleResponse } from '../utils/apiClient';

export const cartService = {
  getCart: async () => {
    const response = await fetch(buildUrl('/api/cart'), {
      method: 'GET',
      headers: getHeaders(true),
    });
    return handleResponse(response, 'Failed to fetch cart');
  },

  addItem: async (productId, quantity, selectedGender = null) => {
    const response = await fetch(buildUrl('/api/cart/items'), {
      method: 'POST',
      headers: getHeaders(true),
      body: JSON.stringify({ productId, quantity, selectedGender }),
    });
    return handleResponse(response, 'Failed to add item to cart');
  },

  updateQuantity: async (itemId, quantity) => {
    const response = await fetch(buildUrl(`/api/cart/items/${itemId}`), {
      method: 'PUT',
      headers: getHeaders(true),
      body: JSON.stringify({ quantity }),
    });
    return handleResponse(response, 'Failed to update cart item');
  },

  removeItem: async (itemId) => {
    const response = await fetch(buildUrl(`/api/cart/items/${itemId}`), {
      method: 'DELETE',
      headers: getHeaders(true),
    });
    return handleResponse(response, 'Failed to remove item from cart');
  },

  clearCart: async () => {
    const response = await fetch(buildUrl('/api/cart'), {
      method: 'DELETE',
      headers: getHeaders(true),
    });
    return handleResponse(response, 'Failed to clear cart');
  },

  checkout: async (shippingAddress, shippingMethod = 'Standard', paymentMethod = 'COD', customerName, customerPhone) => {
    const response = await fetch(buildUrl('/api/cart/checkout'), {
      method: 'POST',
      headers: getHeaders(true),
      body: JSON.stringify({ shippingAddress, shippingMethod, paymentMethod, customerName, customerPhone }),
    });
    return handleResponse(response, 'Failed to checkout');
  },
};
