using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using BaseCore.Entities;
using BaseCore.Repository;
using System.Security.Claims;

namespace BaseCore.APIService.Controllers
{
    [Route("api/[controller]")]
    [ApiController]
    public class ReviewsController : ControllerBase
    {
        private readonly MySqlDbContext _context;

        public ReviewsController(MySqlDbContext context)
        {
            _context = context;
        }

        private string? GetUserId() =>
            User.FindFirst(ClaimTypes.NameIdentifier)?.Value
            ?? User.FindFirst("sub")?.Value
            ?? User.FindFirst("id")?.Value;

        // ── GET /api/reviews/product/{productId} — Lấy reviews của sản phẩm (public) ──
        [HttpGet("product/{productId}")]
        public async Task<IActionResult> GetByProduct(int productId)
        {
            var reviews = await _context.Reviews
                .Where(r => r.ProductId == productId)
                .OrderByDescending(r => r.CreatedAt)
                .Select(r => new
                {
                    r.Id,
                    r.ProductId,
                    r.Rating,
                    r.Comment,
                    r.CustomerName,
                    r.CreatedAt
                })
                .ToListAsync();

            var avgRating = reviews.Count > 0
                ? Math.Round(reviews.Average(r => (double)r.Rating), 1)
                : 0.0;

            return Ok(new
            {
                reviews,
                totalCount = reviews.Count,
                averageRating = avgRating,
                ratingBreakdown = Enumerable.Range(1, 5).Select(star => new
                {
                    star,
                    count = reviews.Count(r => r.Rating == star)
                }).Reverse()
            });
        }

        // ── GET /api/reviews/my-reviewed-orders — Danh sách orderId đã được user đánh giá ──
        [HttpGet("my-reviewed-orders")]
        [Authorize]
        public async Task<IActionResult> MyReviewedOrders()
        {
            var userId = GetUserId();
            if (string.IsNullOrEmpty(userId)) return Unauthorized();

            var orderIds = await _context.Reviews
                .Where(r => r.UserId == userId && r.OrderId != null)
                .Select(r => r.OrderId!.Value)
                .ToListAsync();

            return Ok(orderIds);
        }

        // ── POST /api/reviews — Tạo đánh giá mới (1 lần / 1 đơn hàng) ──
        [HttpPost]
        [Authorize]
        public async Task<IActionResult> Create([FromBody] CreateReviewDto dto)
        {
            var userId = GetUserId();
            if (string.IsNullOrEmpty(userId)) return Unauthorized();

            if (dto.Rating < 1 || dto.Rating > 5)
                return BadRequest(new { message = "Số sao phải từ 1 đến 5" });

            if (dto.OrderId == null)
                return BadRequest(new { message = "Thiếu mã đơn hàng" });

            // Lấy thông tin đơn hàng + sản phẩm đầu tiên (verify đơn thuộc về user này)
            var orderDetails = await _context.Set<OrderDetail>()
                .Where(d => d.Order != null
                         && d.Order.Id == dto.OrderId.Value
                         && d.Order.UserId == userId)
                .Select(d => new { d.ProductId, Status = d.Order!.Status })
                .ToListAsync();

            if (orderDetails.Count == 0)
                return BadRequest(new { message = "Không tìm thấy đơn hàng hoặc đơn hàng không thuộc về bạn" });

            var orderStatus = orderDetails[0].Status;
            if (orderStatus != "Completed")
                return BadRequest(new { message = "Chỉ có thể đánh giá khi đơn hàng đã hoàn thành" });

            // Kiểm tra đơn hàng này đã được đánh giá chưa (unique per orderId)
            var alreadyReviewed = await _context.Reviews
                .AnyAsync(r => r.OrderId == dto.OrderId.Value);

            if (alreadyReviewed)
                return BadRequest(new { message = "Đơn hàng này đã được đánh giá rồi" });

            // ProductId lấy từ sản phẩm đầu tiên trong đơn hàng
            var productId = orderDetails[0].ProductId;

            var user = await _context.Users.FindAsync(userId);

            var review = new Review
            {
                ProductId    = productId,
                UserId       = userId,
                OrderId      = dto.OrderId,
                Rating       = dto.Rating,
                Comment      = dto.Comment?.Trim() ?? "",
                CustomerName = user?.Name ?? user?.UserName ?? "Khách hàng",
                CreatedAt    = DateTime.UtcNow
            };

            _context.Reviews.Add(review);
            await _context.SaveChangesAsync();

            return Ok(new
            {
                message = "Đánh giá của bạn đã được gửi thành công!",
                review = new
                {
                    review.Id,
                    review.ProductId,
                    review.Rating,
                    review.Comment,
                    review.CustomerName,
                    review.CreatedAt
                }
            });
        }

        // ── DELETE /api/reviews/{id} — Admin xóa review ──
        [HttpDelete("{id}")]
        [Authorize(Roles = "Admin")]
        public async Task<IActionResult> Delete(int id)
        {
            var review = await _context.Reviews.FindAsync(id);
            if (review == null) return NotFound();
            _context.Reviews.Remove(review);
            await _context.SaveChangesAsync();
            return Ok(new { message = "Đã xóa đánh giá" });
        }
    }

    public class CreateReviewDto
    {
        public int? ProductId { get; set; }   // Không cần truyền, lấy từ đơn hàng
        public int? OrderId { get; set; }      // Bắt buộc — 1 review / 1 đơn
        public int Rating { get; set; }
        public string? Comment { get; set; }
    }
}
