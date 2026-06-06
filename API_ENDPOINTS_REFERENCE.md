# 🔗 API Endpoints Reference

## Backend Services Ports
- **API Gateway (Ocelot)**: http://localhost:5003
- **AuthService**: http://localhost:5002 (backend only)
- **APIService**: http://localhost:5001 (backend only)

---

## Frontend API Calls

All requests are made through the API Gateway on port 5003.

### 🔐 Authentication Endpoints

#### Login
```
POST /api/auth/login
Content-Type: application/json

Request:
{
  "username": "admin",
  "password": "123456"
}

Response (200):
{
  "token": "eyJhbGciOiJIUzI1NiIs...",
  "userId": "550e8400-e29b-41d4-a716-446655440000",
  "username": "admin",
  "name": "Admin User",
  "email": "admin@example.com",
  "role": "Admin",
  "expiresIn": 28800
}
```

#### Register
```
POST /api/auth/register
Content-Type: application/json

Request:
{
  "username": "newuser",
  "password": "123456",
  "email": "newuser@example.com",
  "name": "New User"
}

Response (200):
{
  "token": "eyJhbGciOiJIUzI1NiIs...",
  "userId": "550e8400-e29b-41d4-a716-446655440000",
  "username": "newuser",
  "name": "New User",
  "email": "newuser@example.com",
  "role": "User",
  "expiresIn": 28800
}
```

---

### 📦 Product Endpoints

#### Get All Products (with pagination & search)
```
GET /api/products?keyword=cá&categoryId=1&page=1&pageSize=12

Query Parameters:
- keyword (optional): Search by product name
- categoryId (optional): Filter by category ID
- page (default: 1): Page number
- pageSize (default: 10): Items per page

Response (200):
{
  "items": [
    {
      "id": 1,
      "name": "Cá Betta Halfmoon",
      "price": 185000,
      "oldPrice": 220000,
      "description": "...",
      "imageUrl": "https://...",
      "stock": 50,
      "rating": 4.9,
      "reviews": 128,
      "categoryId": 1
    },
    ...
  ],
  "totalCount": 45,
  "page": 1,
  "pageSize": 12,
  "totalPages": 4
}
```

#### Get Product by ID
```
GET /api/products/1

Response (200):
{
  "id": 1,
  "name": "Cá Betta Halfmoon",
  "price": 185000,
  "oldPrice": 220000,
  "description": "Mô tả chi tiết...",
  "imageUrl": "https://...",
  "stock": 50,
  "rating": 4.9,
  "reviews": 128,
  "categoryId": 1
}
```

#### Create Product (Admin only)
```
POST /api/products
Authorization: Bearer {token}
Content-Type: application/json

Request:
{
  "name": "New Fish",
  "price": 100000,
  "description": "...",
  "imageUrl": "https://...",
  "stock": 20,
  "categoryId": 1
}

Response (201):
{
  "id": 99,
  "name": "New Fish",
  ...
}
```

#### Update Product (Admin only)
```
PUT /api/products/1
Authorization: Bearer {token}
Content-Type: application/json

Request:
{
  "name": "Updated Name",
  "price": 150000,
  ...
}

Response (200):
{
  "id": 1,
  "name": "Updated Name",
  ...
}
```

#### Delete Product (Admin only)
```
DELETE /api/products/1
Authorization: Bearer {token}

Response (200):
{
  "message": "Product deleted successfully"
}
```

---

### 🏷️ Category Endpoints

#### Get All Categories
```
GET /api/categories

Response (200):
[
  {
    "id": 1,
    "name": "Cá Cảnh",
    "description": "Cá cảnh màu sắc"
  },
  {
    "id": 2,
    "name": "Cây Thủy Sinh",
    "description": "Cây thủy sinh chất lượng"
  },
  ...
]
```

#### Get Category by ID
```
GET /api/categories/1

Response (200):
{
  "id": 1,
  "name": "Cá Cảnh",
  "description": "Cá cảnh màu sắc"
}
```

#### Create Category (Admin only)
```
POST /api/categories
Authorization: Bearer {token}
Content-Type: application/json

Request:
{
  "name": "Thiết Bị",
  "description": "Thiết bị lọc nước"
}

Response (201):
{
  "id": 4,
  "name": "Thiết Bị",
  "description": "Thiết bị lọc nước"
}
```

#### Update Category (Admin only)
```
PUT /api/categories/1
Authorization: Bearer {token}
Content-Type: application/json

Request:
{
  "name": "Cá Cảnh",
  "description": "Cá cảnh tươi sống"
}

Response (200):
{
  "id": 1,
  "name": "Cá Cảnh",
  "description": "Cá cảnh tươi sống"
}
```

#### Delete Category (Admin only)
```
DELETE /api/categories/1
Authorization: Bearer {token}

Response (200):
{
  "message": "Category deleted successfully"
}
```

---

### 📋 Order Endpoints

#### Get All Orders (with pagination)
```
GET /api/orders?page=1&pageSize=10
Authorization: Bearer {token}

Response (200):
{
  "items": [
    {
      "id": 1,
      "userId": "user-id",
      "totalPrice": 500000,
      "status": "Pending",
      "created": "2025-01-15T10:30:00",
      ...
    },
    ...
  ],
  "totalCount": 25,
  "page": 1,
  "pageSize": 10,
  "totalPages": 3
}
```

#### Get Order by ID
```
GET /api/orders/1
Authorization: Bearer {token}

Response (200):
{
  "id": 1,
  "userId": "user-id",
  "totalPrice": 500000,
  "status": "Pending",
  "created": "2025-01-15T10:30:00",
  "items": [
    {
      "productId": 1,
      "quantity": 2,
      "price": 185000
    },
    ...
  ]
}
```

#### Create Order
```
POST /api/orders
Authorization: Bearer {token}
Content-Type: application/json

Request:
{
  "items": [
    {
      "productId": 1,
      "quantity": 2,
      "price": 185000
    },
    {
      "productId": 2,
      "quantity": 1,
      "price": 320000
    }
  ]
}

Response (201):
{
  "id": 100,
  "userId": "user-id",
  "totalPrice": 690000,
  "status": "Pending",
  "created": "2025-01-15T10:30:00"
}
```

---

## 🔑 Authorization Header

For requests that require authentication:

```
Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiIxIiwibmFtZSI6IkFkbWluIiwiaWF0IjoxNTE2MjM5MDIyfQ.SflKxwRJSMeKKF2QT4fwpMeJf36POk6yJV_adQssw5c
```

---

## ⚠️ Error Responses

### 400 Bad Request
```json
{
  "message": "Invalid request data"
}
```

### 401 Unauthorized
```json
{
  "message": "Invalid username or password"
}
```

### 403 Forbidden
```json
{
  "message": "You don't have permission to access this resource"
}
```

### 404 Not Found
```json
{
  "message": "Product not found"
}
```

### 409 Conflict
```json
{
  "message": "Category name already exists"
}
```

### 500 Internal Server Error
```json
{
  "message": "An error occurred while processing your request"
}
```

---

## 🧪 Testing with cURL

### Login Test
```bash
curl -X POST http://localhost:5003/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"username":"admin","password":"123456"}'
```

### Get Products
```bash
curl http://localhost:5003/api/products?page=1&pageSize=10
```

### Get Categories
```bash
curl http://localhost:5003/api/categories
```

### Get Product Detail
```bash
curl http://localhost:5003/api/products/1
```

### Create Product (with auth)
```bash
curl -X POST http://localhost:5003/api/products \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_TOKEN_HERE" \
  -d '{"name":"New Product","price":100000,"categoryId":1}'
```

---

## 📊 Frontend Usage

### API Service in Components

```javascript
import { productsAPI, categoriesAPI, authAPI } from '../services/api'

// Login
const user = await authAPI.login('admin', '123456')

// Get products
const res = await productsAPI.getAll('cá', 1, 1, 12)

// Get categories
const cats = await categoriesAPI.getAll()

// Get product detail
const product = await productsAPI.getById(1)
```

---

## ✅ Checklist

- [ ] All endpoints documented
- [ ] All responses documented
- [ ] Error cases covered
- [ ] Authorization header format correct
- [ ] All endpoints tested with Postman/cURL
- [ ] Frontend API service matches endpoints
- [ ] Database seeded with test data
- [ ] Backend services running on correct ports

---

**Last Updated**: 2025-01-15
