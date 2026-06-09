import { buildUrl, getHeaders, handleResponse } from '../utils/apiClient';

export const reviewService = {
  // Lấy reviews của sản phẩm (public)
  getByProduct: async (productId) => {
    const res = await fetch(buildUrl(`/api/reviews/product/${productId}`), {
      headers: getHeaders(),
    });
    return handleResponse(res, 'Failed to fetch reviews');
  },

  // Lấy danh sách orderId mà user đã đánh giá
  getMyReviewedOrders: async () => {
    const res = await fetch(buildUrl('/api/reviews/my-reviewed-orders'), {
      headers: getHeaders(true),
    });
    return handleResponse(res, 'Failed to fetch reviewed orders');
  },

  // Tạo đánh giá mới — truyền orderId (bắt buộc), không cần productId
  create: async ({ orderId, rating, comment }) => {
    const res = await fetch(buildUrl('/api/reviews'), {
      method: 'POST',
      headers: getHeaders(true),
      body: JSON.stringify({ orderId, rating, comment }),
    });
    return handleResponse(res, 'Failed to submit review');
  },
};
