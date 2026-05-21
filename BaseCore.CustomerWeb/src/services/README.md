# API Services Architecture

## Overview
Frontend API calls được tổ chức thành các services riêng lẻ theo chức năng, thay vì tất cả trong một file `api.js` duy nhất.

## Folder Structure
```
src/services/
├── utils/
│   └── apiClient.js           # Shared utilities for API calls
├── auth/
│   └── authService.js         # Authentication API (login, register, profile)
├── cart/
│   └── cartService.js         # Shopping cart operations
├── product/
│   └── productService.js      # Product management
├── category/
│   └── categoryService.js     # Category management
├── order/
│   └── orderService.js        # Order processing
├── user/
│   └── userService.js         # User management (admin)
├── blog/
│   └── blogService.js         # Blog management (admin)
└── index.js                   # Central export file
```

## How to Use Services

### Basic Import
```javascript
// Option 1: Import specific service
import { authService } from '../services/auth/authService';

// Option 2: Import from index (recommended)
import { authService, cartService } from '../services';
```

### API Call Examples
```javascript
// Authentication
const loginResponse = await authService.login(username, password);
const registerResponse = await authService.register(username, password, email, name);

// Products
const products = await productService.getAll(keyword, categoryId, page, pageSize);
const product = await productService.getById(productId);
await productService.create(productData);
await productService.update(productId, productData);
await productService.delete(productId);

// Cart
const cart = await cartService.getCart();
await cartService.addItem(productId, quantity);
await cartService.updateQuantity(productId, newQuantity);
await cartService.removeItem(productId);
await cartService.clearCart();
await cartService.checkout(shippingAddress, shippingMethod, paymentMethod, customerName, customerPhone);

// Users (Admin)
const users = await userService.getAll({ page, pageSize, keyword });
const user = await userService.getById(userId);
await userService.create(userData);
await userService.update(userId, userData);
await userService.delete(userId);
```

## Login & Role-Based Routing

### AuthContext Enhancements
```javascript
import { useAuth } from '../context/AuthContext';

export default function MyComponent() {
  const { user, login, logout, hasRole, isAdmin } = useAuth();
  
  // Check specific role
  if (hasRole('admin')) {
    // Show admin features
  }
  
  // Check if user is admin
  if (isAdmin()) {
    // Show admin-specific UI
  }
}
```

### Login Page Behavior
- When user logs in, they are redirected based on their role:
  - **Admin users** → `/admin`
  - **Regular users** → `/` (home)

The role information comes from the backend login response:
```javascript
{
  token: "...",
  userId: 123,
  username: "user",
  name: "User Name",
  email: "user@example.com",
  role: "admin",  // or "user"
  roles: [],      // Future multi-role support
  expiresIn: 3600
}
```

## Adding New Services

To add a new service (e.g., `settingsService`):

1. Create folder: `src/services/settings/`
2. Create file: `src/services/settings/settingsService.js`
3. Import utilities:
```javascript
import { buildUrl, getHeaders, handleResponse } from '../utils/apiClient';

export const settingsService = {
  getAll: async () => {
    const response = await fetch(buildUrl('/api/settings'), {
      method: 'GET',
      headers: getHeaders(true), // true = include auth header
    });
    return handleResponse(response, 'Failed to fetch settings');
  },
  
  update: async (settingsData) => {
    const response = await fetch(buildUrl('/api/settings'), {
      method: 'PUT',
      headers: getHeaders(true),
      body: JSON.stringify(settingsData),
    });
    return handleResponse(response, 'Failed to update settings');
  },
};
```

4. Add to `src/services/index.js`:
```javascript
export { settingsService } from './settings/settingsService';
```

## API Utilities Reference

### `buildUrl(endpoint, params)`
Builds full API URL with query parameters.
```javascript
buildUrl('/api/products', { page: 1, pageSize: 10 })
// Returns: "http://localhost:5000/api/products?page=1&pageSize=10"
```

### `getHeaders(includeAuth)`
Returns request headers with optional Authorization header.
```javascript
getHeaders(false)  // Just Content-Type
getHeaders(true)   // Includes Authorization: Bearer {token}
```

### `handleResponse(response, errorMessage)`
Handles API response and throws error if not ok.

## Migration from Old API

Old way:
```javascript
import { productsAPI, cartAPI } from '../services/api';
const products = await productsAPI.getAll();
const cart = await cartAPI.getCart();
```

New way:
```javascript
import { productService, cartService } from '../services';
const products = await productService.getAll();
const cart = await cartService.getCart();
```

## Notes
- Environment variable: `VITE_API_URL` - Base API URL (default: http://localhost:5000)
- All API calls use Bearer token authentication
- Requests include Content-Type: application/json
- Error messages from backend are preserved and returned
