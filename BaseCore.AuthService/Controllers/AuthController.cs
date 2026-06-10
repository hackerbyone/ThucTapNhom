using Microsoft.AspNetCore.Mvc;
using BaseCore.Common;
using BaseCore.Entities;
using BaseCore.Services.Authen;
using System.Net.Http.Headers;
using System.Text.Json;

namespace BaseCore.AuthService.Controllers
{
    [Route("api/[controller]")]
    [ApiController]
    public class AuthController : ControllerBase
    {
        private readonly IUserService _userService;
        private readonly IHttpClientFactory _httpClientFactory;
        private readonly string _secretKey;
        private const int TokenExpirationMinutes = 480;

        public AuthController(IUserService userService, IConfiguration configuration, IHttpClientFactory httpClientFactory)
        {
            _userService        = userService;
            _httpClientFactory  = httpClientFactory;
            _secretKey          = configuration["Jwt:SecretKey"]
                ?? configuration["AppSettings:Secret"]
                ?? "YourSecretKeyForAuthenticationShouldBeLongEnough";
        }

        [HttpPost("login")]
        public async Task<IActionResult> Login([FromBody] LoginRequest request)
        {
            if (request == null || string.IsNullOrEmpty(request.Username) || string.IsNullOrEmpty(request.Password))
                return BadRequest(new { message = "Username and password are required" });

            var user = await _userService.Authenticate(request.Username, request.Password);
            if (user == null)
                return Unauthorized(new { message = "Invalid username or password" });

            var role = user.UserType == 1 ? "Admin" : user.UserType == 3 ? "Warehouse" : "User";
            var token = TokenHelper.GenerateToken(
                _secretKey, TokenExpirationMinutes,
                user.Id.ToString(), user.UserName, role);

            return Ok(new LoginResponse
            {
                Token     = token,
                UserId    = user.Id.ToString(),
                Username  = user.UserName,
                Name      = user.Name,
                Email     = user.Email,
                Role      = role,
                ExpiresIn = TokenExpirationMinutes * 60
            });
        }

        [HttpPost("register")]
        public async Task<IActionResult> Register([FromBody] RegisterRequest request)
        {
            if (request == null)
                return BadRequest(new { message = "Invalid request" });

            if (string.IsNullOrEmpty(request.Username) || string.IsNullOrEmpty(request.Password))
                return BadRequest(new { message = "Username and password are required" });

            if (request.Password.Length < 6)
                return BadRequest(new { message = "Password must be at least 6 characters" });

            try
            {
                var user = new User
                {
                    UserName = request.Username,
                    Name     = request.Name ?? request.Username,
                    Email    = request.Email,
                    Phone    = request.Phone,
                    UserType = 2
                };
                var createdUser = await _userService.Create(user, request.Password);

                var token = TokenHelper.GenerateToken(
                    _secretKey, TokenExpirationMinutes,
                    createdUser.Id, createdUser.UserName, "User");

                return Ok(new LoginResponse
                {
                    Token     = token,
                    UserId    = createdUser.Id,
                    Username  = createdUser.UserName,
                    Name      = createdUser.Name,
                    Email     = createdUser.Email,
                    Role      = "User",
                    ExpiresIn = TokenExpirationMinutes * 60
                });
            }
            catch (Exception ex)
            {
                return BadRequest(new { message = "Registration failed: " + ex.Message });
            }
        }

        // Đăng nhập bằng Google — nhận access_token từ frontend, verify qua Google API
        [HttpPost("google")]
        public async Task<IActionResult> GoogleLogin([FromBody] GoogleLoginRequest request)
        {
            if (string.IsNullOrWhiteSpace(request?.AccessToken))
                return BadRequest(new { message = "Access token là bắt buộc" });

            try
            {
                // Gọi Google userinfo endpoint để xác thực access token
                var http = _httpClientFactory.CreateClient();
                http.DefaultRequestHeaders.Authorization =
                    new AuthenticationHeaderValue("Bearer", request.AccessToken);

                var googleResponse = await http.GetAsync("https://www.googleapis.com/oauth2/v3/userinfo");
                if (!googleResponse.IsSuccessStatusCode)
                    return Unauthorized(new { message = "Google token không hợp lệ hoặc đã hết hạn" });

                var json     = await googleResponse.Content.ReadAsStringAsync();
                var userInfo = JsonSerializer.Deserialize<GoogleUserInfo>(json,
                    new JsonSerializerOptions { PropertyNameCaseInsensitive = true });

                if (string.IsNullOrEmpty(userInfo?.Email))
                    return BadRequest(new { message = "Không lấy được email từ Google" });

                // Tìm hoặc tạo user theo email Google
                var user = await _userService.GetByEmail(userInfo.Email);
                if (user == null)
                {
                    user = await _userService.CreateGoogleUser(new User
                    {
                        UserName = userInfo.Email,
                        Name     = userInfo.Name ?? userInfo.Email,
                        Email    = userInfo.Email,
                        Phone    = "",
                        UserType = 2,
                    });
                }

                var googleRole = user.UserType == 1 ? "Admin" : user.UserType == 3 ? "Warehouse" : "User";
                var token = TokenHelper.GenerateToken(
                    _secretKey, TokenExpirationMinutes,
                    user.Id, user.UserName, googleRole);

                return Ok(new LoginResponse
                {
                    Token     = token,
                    UserId    = user.Id,
                    Username  = user.UserName,
                    Name      = user.Name,
                    Email     = user.Email,
                    Role      = googleRole,
                    ExpiresIn = TokenExpirationMinutes * 60
                });
            }
            catch (Exception ex)
            {
                return BadRequest(new { message = "Đăng nhập Google thất bại: " + ex.Message });
            }
        }
    }

    public class GoogleLoginRequest
    {
        public string AccessToken { get; set; } = "";
    }

    public class GoogleUserInfo
    {
        public string Email { get; set; } = "";
        public string Name  { get; set; } = "";
        public string Sub   { get; set; } = "";
    }

    public class LoginRequest
    {
        public string Username { get; set; } = "";
        public string Password { get; set; } = "";
    }

    public class LoginResponse
    {
        public string Token    { get; set; } = "";
        public string UserId   { get; set; } = "";
        public string Username { get; set; } = "";
        public string Name     { get; set; } = "";
        public string Email    { get; set; } = "";
        public string Role     { get; set; } = "";
        public int    ExpiresIn { get; set; }
    }

    public class RegisterRequest
    {
        public string Username { get; set; } = "";
        public string Password { get; set; } = "";
        public string Name     { get; set; } = "";
        public string Email    { get; set; } = "";
        public string Phone    { get; set; } = "";
    }
}
