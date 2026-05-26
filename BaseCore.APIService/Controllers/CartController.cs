using System;
using System.Security.Claims;
using System.Threading.Tasks;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using BaseCore.DTO.Common;
using BaseCore.Services;

namespace BaseCore.APIService.Controllers
{
    [Route("api/[controller]")]
    [ApiController]
    [Authorize]
    public class CartController : ControllerBase
    {
        private readonly ICartService _cartService;
        private readonly IOrderService _orderService;

        public CartController(ICartService cartService, IOrderService orderService)
        {
            _cartService = cartService;
            _orderService = orderService;
        }

        // ✅ Trả về string thay vì int — khớp với User.Id kiểu string
        private string GetUserId()
        {
            var userId = User.FindFirst(ClaimTypes.NameIdentifier)?.Value
                      ?? User.FindFirst("sub")?.Value
                      ?? User.FindFirst("id")?.Value;

            if (string.IsNullOrEmpty(userId))
                throw new UnauthorizedAccessException("User not found");

            return userId;
        }

        [HttpGet]
        public async Task<IActionResult> GetCart()
        {
            var userId = GetUserId();
            var cart = await _cartService.GetCart(userId);
            return Ok(cart);
        }

        [HttpPost("items")]
        public async Task<IActionResult> AddItem([FromBody] AddToCartDto dto)
        {
            try
            {
                var userId = GetUserId();
                var cart = await _cartService.AddItem(userId, dto.ProductId, dto.Quantity, dto.SelectedGender);
                return Ok(cart);
            }
            catch (Exception ex)
            {
                return BadRequest(new { message = ex.Message });
            }
        }

        [HttpPut("items/{itemId}")]
        public async Task<IActionResult> UpdateItem(int itemId, [FromBody] UpdateCartItemDto dto)
        {
            try
            {
                var userId = GetUserId();
                var cart = await _cartService.UpdateQuantity(userId, itemId, dto.Quantity);
                return Ok(cart);
            }
            catch (Exception ex)
            {
                return BadRequest(new { message = ex.Message });
            }
        }

        [HttpDelete("items/{itemId}")]
        public async Task<IActionResult> RemoveItem(int itemId)
        {
            var userId = GetUserId();
            var cart = await _cartService.RemoveItem(userId, itemId);
            return Ok(cart);
        }

        [HttpDelete]
        public async Task<IActionResult> ClearCart()
        {
            var userId = GetUserId();
            await _cartService.ClearCart(userId);
            return Ok(new { message = "Cart cleared" });
        }

        [HttpPost("checkout")]
        public async Task<IActionResult> Checkout([FromBody] CheckoutDto dto)
        {
            try
            {
                var userId = GetUserId();
                var order = await _orderService.CheckoutAsync(userId, dto.ShippingAddress, dto.CustomerName, dto.CustomerPhone);
                return Ok(new
                {
                    message = "Đặt hàng thành công",
                    orderId = order.Id,
                    totalAmount = order.TotalAmount,
                    depositAmount = order.DepositAmount,
                    depositNote = order.DepositNote,
                    status = order.Status,
                    customerName = order.CustomerName,
                    customerPhone = order.CustomerPhone,
                    shippingAddress = order.ShippingAddress
                });
            }
            catch (Exception ex)
            {
                // Log lỗi thật để debug, nhưng chỉ trả về message thân thiện
                Console.WriteLine($"[Checkout ERROR] {ex.GetType().Name}: {ex.Message}");
                // Lỗi business logic (tồn kho, giỏ trống...) dùng ex.Message
                // Lỗi DB/hệ thống → message chung
                var isSystemError = ex is Microsoft.EntityFrameworkCore.DbUpdateException
                    || ex.GetType().Name.Contains("SqlException")
                    || ex.GetType().Name.Contains("DbException");
                var userMessage = isSystemError
                    ? "Lỗi hệ thống khi tạo đơn hàng. Vui lòng thử lại sau."
                    : ex.Message;
                return BadRequest(new { message = userMessage });
            }
        }
    }
}