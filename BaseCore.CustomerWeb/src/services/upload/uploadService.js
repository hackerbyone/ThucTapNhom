import { getAuthToken } from '../utils/apiClient';

const UPLOAD_BASE_URL = 'http://localhost:5001';

export const uploadService = {
    uploadImage: async (file) => {
        const formData = new FormData();
        formData.append('file', file);

        const token = getAuthToken();
        const headers = {};
        if (token) headers['Authorization'] = `Bearer ${token}`;

        const response = await fetch(`${UPLOAD_BASE_URL}/api/upload/image`, {
            method: 'POST',
            headers,
            body: formData,
        });

        if (!response.ok) {
            let errorData;
            try { errorData = await response.json(); } catch { throw new Error('Upload thất bại'); }
            throw new Error(errorData.message || 'Upload thất bại');
        }

        return response.json(); // { url: "http://localhost:5001/images/..." }
    },
};
