using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace BaseCore.APIService.Controllers
{
    [Route("api/[controller]")]
    [ApiController]
    public class UploadController : ControllerBase
    {
        private readonly IWebHostEnvironment _env;

        public UploadController(IWebHostEnvironment env)
        {
            _env = env;
        }

        [HttpPost("image")]
        [Authorize]
        public async Task<IActionResult> UploadImage(IFormFile file)
        {
            if (file == null || file.Length == 0)
                return BadRequest(new { message = "Không có file nào được gửi lên" });

            var allowed = new[] { ".jpg", ".jpeg", ".png", ".gif", ".bmp", ".webp" };
            var ext = Path.GetExtension(file.FileName).ToLowerInvariant();
            if (!allowed.Contains(ext))
                return BadRequest(new { message = "Định dạng không hỗ trợ. Chỉ chấp nhận: jpg, jpeg, png, gif, bmp, webp" });

            if (file.Length > 5 * 1024 * 1024)
                return BadRequest(new { message = "Kích thước file không được vượt quá 5MB" });

            var webRoot = _env.WebRootPath ?? Path.Combine(_env.ContentRootPath, "wwwroot");
            var uploadsDir = Path.Combine(webRoot, "images");
            Directory.CreateDirectory(uploadsDir);

            var fileName = $"{Guid.NewGuid()}{ext}";
            var filePath = Path.Combine(uploadsDir, fileName);

            using (var stream = new FileStream(filePath, FileMode.Create))
            {
                await file.CopyToAsync(stream);
            }

            var imageUrl = $"{Request.Scheme}://{Request.Host}/images/{fileName}";
            return Ok(new { url = imageUrl });
        }
    }
}
