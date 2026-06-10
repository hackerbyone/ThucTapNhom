# 🔐 Backend Setup Guide - Login Configuration

## 📋 User Database Schema

The `User` table should have the following fields:

```csharp
public class User
{
    public string Id { get; set; }              // Primary Key (GUID)
    public string Name { get; set; }            // Full name
    public string UserName { get; set; }        // Login username (UNIQUE)
    public string Password { get; set; }        // Hashed password
    public byte[] Salt { get; set; }            // Password salt for hashing
    public string Contact { get; set; }         // Contact info
    public string Email { get; set; }           // Email address
    public string Phone { get; set; }           // Phone number
    public string Position { get; set; }        // Position/Title
    public string Image { get; set; }           // Avatar URL
    public bool IsActive { get; set; }          // Account status
    public int UserType { get; set; }           // 1 = Admin, 0 = User
    public DateTime Created { get; set; }       // Creation date
}
```

## 🔧 Database Setup

### Option 1: Using SQL Script

Create test users using this SQL (adjust as needed):

```sql
-- Insert test user
INSERT INTO Users (Id, Name, UserName, Email, Phone, IsActive, UserType, Created)
VALUES 
(NEWID(), 'Admin User', 'admin', 'admin@example.com', '0901234567', 1, 1, GETDATE()),
(NEWID(), 'Test User', 'testuser', 'test@example.com', '0909876543', 1, 0, GETDATE());
```

**Note**: Password field should be handled by the IUserService with hashing!

### Option 2: Using EF Core Migration

In `BaseCore.Repository/Migrations/SeedConfiguration.cs`:

```csharp
public static void SeedUsers(ModelBuilder modelBuilder)
{
    // Seed users here
    // The password should be hashed using the UserService
}
```

## 🔑 Test Credentials

After setup, use these to login:

```
Username: admin
Password: 123456
Email: admin@example.com
Role: Admin
```

```
Username: testuser
Password: 123456
Email: test@example.com
Role: User
```

## 🛠️ AuthService Configuration

### 1. Make sure `IUserService.Authenticate()` works correctly

It should:
1. Find user by username in database
2. Verify password hash against the stored Salt
3. Return User object if credentials match
4. Return null if credentials don't match

### 2. Check `AuthController.Login()` 

Should:
```csharp
[HttpPost("login")]
public async Task<IActionResult> Login([FromBody] LoginRequest request)
{
    if (string.IsNullOrEmpty(request.Username) || string.IsNullOrEmpty(request.Password))
        return BadRequest(new { message = "Username and password required" });

    var user = await _userService.Authenticate(request.Username, request.Password);
    
    if (user == null)
        return Unauthorized(new { message = "Invalid credentials" });

    var token = TokenHelper.GenerateToken(...);
    
    return Ok(new LoginResponse
    {
        Token = token,
        UserId = user.Id.ToString(),
        Username = user.UserName,
        Name = user.Name,
        Email = user.Email,
        Role = user.UserType == 1 ? "Admin" : "User",
        ExpiresIn = TokenExpirationMinutes * 60
    });
}
```

## 🧪 Testing Login Flow

### 1. Test API directly using Swagger/Postman

**Endpoint**: `POST http://localhost:5003/api/auth/login`

**Headers**:
```
Content-Type: application/json
```

**Body**:
```json
{
  "username": "admin",
  "password": "123456"
}
```

**Expected Response (200 OK)**:
```json
{
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "userId": "550e8400-e29b-41d4-a716-446655440000",
  "username": "admin",
  "name": "Admin User",
  "email": "admin@example.com",
  "role": "Admin",
  "expiresIn": 28800
}
```

### 2. Test from Frontend

1. Start frontend: `npm run dev`
2. Go to http://localhost:5173/login
3. Enter username: `admin`, password: `123456`
4. Click login
5. Should redirect to home and show user in header

## ⚠️ Common Issues & Solutions

### Issue 1: Login returns 401 Unauthorized
**Cause**: User not found or password wrong
**Solution**:
- Verify user exists in database
- Check password hashing implementation in IUserService
- Ensure password salt is generated correctly

### Issue 2: CORS error when logging in
**Cause**: API Gateway CORS not configured
**Solution**: In `BaseCore.ApiGateway/Program.cs`:
```csharp
builder.Services.AddCors(options =>
{
    options.AddPolicy("AllowAll", policy =>
    {
        policy.AllowAnyOrigin()
              .AllowAnyMethod()
              .AllowAnyHeader();
    });
});

app.UseCors("AllowAll");
```

### Issue 3: JWT token always invalid
**Cause**: Secret key mismatch
**Solution**: 
- Check `Jwt:SecretKey` in `appsettings.json`
- Ensure same key in AuthService and API Gateway
- Key must be at least 32 characters long

### Issue 4: Database migration not applied
**Cause**: EF Core migrations not run
**Solution**:
```bash
# In package manager console or terminal
dotnet ef database update --project BaseCore.Repository
```

## 🔗 Request Flow

```
User enters credentials in browser
        ↓
POST /api/auth/login → API Gateway (5003)
        ↓
Routes to AuthService (5002)
        ↓
AuthController.Login() 
        ↓
IUserService.Authenticate()
        ↓
Query User table in database
        ↓
Verify password hash
        ↓
Generate JWT token
        ↓
Return token to frontend
        ↓
Frontend stores token in sessionStorage
        ↓
Token sent in Authorization header for future requests
```

## 📚 References

- Password Hashing: Use BCrypt or similar
- JWT Secret: Use strong random key
- Refresh Tokens: Implement for longer sessions (optional)
- CORS: Configure for your frontend domain

## ✅ Verification Checklist

- [ ] Users table created with all fields
- [ ] Test users inserted into database
- [ ] IUserService.Authenticate() implemented correctly
- [ ] AuthService running on port 5002
- [ ] API Gateway running on port 5003
- [ ] JWT secret key configured
- [ ] CORS enabled on API Gateway
- [ ] Login endpoint returns valid token
- [ ] Frontend receives token and stores it
- [ ] Subsequent API calls include Authorization header

---

**After completing these steps, login should work properly!** 🎉
