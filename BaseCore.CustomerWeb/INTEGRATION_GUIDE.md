# Frontend - Backend Integration Guide

## 📋 Những thay đổi đã thực hiện

### 1. **API Service Layer** (`src/services/api.js`)
Tạo file service để gọi tất cả các API endpoints:
- **Auth API**: Login, Register
- **Products API**: Get all, Get by ID, Create, Update, Delete
- **Categories API**: Get all, Get by ID, Create, Update, Delete
- **Orders API**: Get all, Get by ID, Create

### 2. **Authentication Context** (`src/context/AuthContext.jsx`)
Quản lý trạng thái đăng nhập:
- Lưu token và thông tin user vào sessionStorage
- Cung cấp hooks `useAuth()` để sử dụng trong components
- Hỗ trợ login/logout

### 3. **Login Page** (`src/pages/Login.jsx`)
- Form đăng nhập/đăng ký
- Hỗ trợ username + password (từ SQL database)
- Hỗ trợ đăng ký tài khoản mới
- Lưu token sau khi đăng nhập thành công

### 4. **Updated Components**

#### **Header** - Thêm tính năng đăng nhập
- Nút "Đăng Nhập" hiển thị khi chưa login
- Menu dropdown user khi đã login
- Nút "Đăng Xuất"

#### **Home** - Lấy dữ liệu từ API
- Danh mục sản phẩm từ DB
- Sản phẩm nổi bật từ API
- Thêm loading/error states

#### **Products** - Tìm kiếm & lọc từ API
- Pagination từ API
- Tìm kiếm theo từ khóa
- Lọc theo danh mục
- Sắp xếp theo giá/rating (client-side)

#### **ProductDetail** - Chi tiết sản phẩm từ API
- Fetch product by ID
- Hiển thị sản phẩm liên quan
- Thông tin stock từ DB

### 5. **Vite Configuration**
```javascript
server: {
  proxy: {
    '/api': {
      target: 'http://localhost:5003', // API Gateway
      changeOrigin: true,
    },
  },
}
```

## 🚀 Hướng dẫn setup

### Backend Setup
Hãy đảm bảo các services chạy trên port đúng:

```
BaseCore.AuthService:   port 5002
BaseCore.APIService:    port 5001
BaseCore.ApiGateway:    port 5003 (Ocelot)
```

### Frontend Setup

1. **Cài đặt dependencies** (nếu chưa có):
```bash
cd BaseCore.CustomerWeb
npm install
```

2. **Start development server**:
```bash
npm run dev
```

3. **Environment variables** (tùy chọn)
Tạo file `.env.local`:
```
VITE_API_URL=http://localhost:5003
```

## 📡 API Endpoints được sử dụng

### Authentication
```
POST /api/auth/login
  Body: { username: string, password: string }
  Response: { token, userId, username, name, email, role, expiresIn }

POST /api/auth/register
  Body: { username, password, email, name }
  Response: { token, userId, username, name, email, role, expiresIn }
```

### Products
```
GET /api/products?keyword=abc&categoryId=1&page=1&pageSize=12
GET /api/products/{id}
POST /api/products (require auth)
PUT /api/products/{id} (require auth)
DELETE /api/products/{id} (require auth)
```

### Categories
```
GET /api/categories
GET /api/categories/{id}
POST /api/categories (require auth)
PUT /api/categories/{id} (require auth)
DELETE /api/categories/{id} (require auth)
```

## 🔧 Cấu trúc dữ liệu

### Product Object (từ DB)
```javascript
{
  id: number,
  name: string,
  price: number,
  oldPrice?: number,
  description: string,
  imageUrl: string,
  stock: number,
  rating?: number,
  reviews?: number,
  categoryId: number,
}
```

### Category Object (từ DB)
```javascript
{
  id: number,
  name: string,
  description?: string,
}
```

### User Object (từ Auth API)
```javascript
{
  token: string,
  userId: string,
  username: string,
  name: string,
  email: string,
  role: "Admin" | "User",
  expiresIn: number,
}
```

## ⚠️ Vấn đề cần lưu ý

### Login chưa hoàn toàn hoạt động
Tại sao: Backend chưa có database hoặc seed data
Giải pháp:
1. Hãy tạo user test trong database
2. Hoặc update AuthService để có endpoint login demo

```csharp
// Ví dụ: Test user
// Username: admin
// Password: 123456
// Email: admin@example.com
```

### Kết nối API
- Nếu API trả về 401: JWT token expired hoặc invalid
- Nếu API trả về 404: Endpoint không đúng hoặc service không chạy
- Nếu CORS error: Kiểm tra CORS config trong backend

## 🔐 Security Notes

- Token được lưu trong `sessionStorage` (an toàn hơn localStorage)
- Token tự động gửi trong header `Authorization: Bearer {token}`
- Logout tự động xóa token khỏi sessionStorage
- Implement token refresh khi hết hạn (tùy chọn)

## 📝 Cách sử dụng API Service trong Components

```javascript
import { productsAPI, authAPI } from '../services/api'

// Fetch products
const res = await productsAPI.getAll(keyword, categoryId, page, pageSize)

// Login
const user = await authAPI.login(username, password)

// Sử dụng Auth Hook
const { user, logout, login } = useAuth()
```

## ✅ Checklist trước khi deploy

- [ ] Backend services chạy đúng port
- [ ] Database seeded với test data
- [ ] CORS enabled trên API Gateway
- [ ] JWT secret key được cấu hình
- [ ] Login test đã thành công
- [ ] Products hiển thị từ database
- [ ] Frontend URLs chính xác

---

**Ghi chú**: Nếu có lỗi, kiểm tra browser console và network tab để debug!
