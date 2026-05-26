using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using BaseCore.Entities;
using BaseCore.Repository.EFCore;
using System;
using System.Threading.Tasks;

namespace BaseCore.APIService.Controllers
{
    /// <summary>
    /// Blog API Controller
    /// </summary>
    [Route("api/[controller]")]
    [ApiController]
    public class BlogsController : ControllerBase
    {
        private readonly IBlogRepositoryEF _blogRepository;

        public BlogsController(IBlogRepositoryEF blogRepository)
        {
            _blogRepository = blogRepository;
        }

        /// <summary>
        /// Get all blogs with pagination and search
        /// </summary>
        [HttpGet]
        public async Task<IActionResult> GetAll(
         [FromQuery] string? keyword,
         [FromQuery] int page = 1,
         [FromQuery] int pageSize = 10)
        {
            var (blogs, totalCount) = await _blogRepository.SearchAsync(keyword, page, pageSize);

            return Ok(new
            {
                items = blogs,
                totalCount,
                page,
                pageSize,
                totalPages = (int)Math.Ceiling((double)totalCount / pageSize)
            });
        }

        /// <summary>
        /// </summary>
        [HttpGet("{id}")]
        public async Task<IActionResult> GetById(string id)
        {
            var blog = await _blogRepository.GetByIdAsync(id);
            if (blog == null)
                return NotFound(new { message = "Blog not found" });

            return Ok(blog);
        }

        /// <summary>
        /// Create new blog (Yêu cầu đăng nhập)
        /// </summary>
        [HttpPost]
        [Authorize]
        public async Task<IActionResult> Create([FromBody] BlogCreateDto dto)
        {
            var blog = new Blog
            {
                Id = Guid.NewGuid().ToString(), // Tự động phát sinh ID dạng chuỗi (GUID)
                Title = dto.Title,
                ShortDescription = dto.ShortDescription,
                Content = dto.Content,
                ImageUrl = dto.ImageUrl ?? "",
                Author = dto.Author ?? "Admin",
                PublishDate = DateTime.Now,
                IsActive = dto.IsActive
            };

            await _blogRepository.AddAsync(blog);
            return CreatedAtAction(nameof(GetById), new { id = blog.Id }, blog);
        }

        /// <summary>
        /// Update blog (Yêu cầu đăng nhập)
        /// </summary>
        [HttpPut("{id}")]
        [Authorize]
        public async Task<IActionResult> Update(string id, [FromBody] BlogUpdateDto dto)
        {
            var blog = await _blogRepository.GetByIdAsync(id);
            if (blog == null)
                return NotFound(new { message = "Blog not found" });

            blog.Title = dto.Title ?? blog.Title;
            blog.ShortDescription = dto.ShortDescription ?? blog.ShortDescription;
            blog.Content = dto.Content ?? blog.Content;
            blog.ImageUrl = dto.ImageUrl ?? blog.ImageUrl;
            blog.Author = dto.Author ?? blog.Author;

            if (dto.IsActive.HasValue)
            {
                blog.IsActive = dto.IsActive.Value;
            }

            await _blogRepository.UpdateAsync(blog);
            return Ok(blog);
        }

        /// <summary>
        /// Delete blog (Yêu cầu đăng nhập)
        /// </summary>
        [HttpDelete("{id}")]
        [Authorize]
        public async Task<IActionResult> Delete(string id)
        {
            var blog = await _blogRepository.GetByIdAsync(id);
            if (blog == null)
                return NotFound(new { message = "Blog not found" });

            await _blogRepository.DeleteAsync(blog);
            return Ok(new { message = "Blog deleted successfully" });
        }
    }

    // DTOs (Data Transfer Objects) để nhận dữ liệu từ React
    public class BlogCreateDto
    {
        public string Title { get; set; } = "";
        public string? ShortDescription { get; set; }
        public string Content { get; set; } = "";
        public string? ImageUrl { get; set; }
        public string? Author { get; set; }
        public bool IsActive { get; set; } = true;
    }

    public class BlogUpdateDto
    {
        public string? Title { get; set; }
        public string? ShortDescription { get; set; }
        public string? Content { get; set; }
        public string? ImageUrl { get; set; }
        public string? Author { get; set; }
        public bool? IsActive { get; set; }
    }
}