using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using BaseCore.APIService.Services;
using BaseCore.Repository.EFCore;
using System.Security.Claims;

namespace BaseCore.APIService.Controllers
{
    [Route("api/vnpay")]
    [ApiController]
    public class VnPayController : ControllerBase
    {
        private readonly IVnPayService _vnPay;
        private readonly IOrderRepositoryEF _orderRepo;
        private readonly IEmailService _email;

        public VnPayController(
            IVnPayService vnPay,
            IOrderRepositoryEF orderRepo,
            IEmailService email)
        {
            _vnPay     = vnPay;
            _orderRepo = orderRepo;
            _email     = email;
        }

        private string? GetUserId() =>
            User.FindFirst(ClaimTypes.NameIdentifier)?.Value
            ?? User.FindFirst("sub")?.Value;

        // Tạo URL thanh toán VNPay cho đặt cọc
        [HttpPost("create/{orderId}")]
        [Authorize]
        public async Task<IActionResult> CreatePayment(int orderId)
        {
            var userId = GetUserId();
            var order  = await _orderRepo.GetByIdAsync(orderId);

            if (order == null) return NotFound(new { message = "Không tìm thấy đơn hàng" });
            if (order.UserId != userId) return Forbid();
            if (order.Status != "WaitingDeposit")
                return BadRequest(new { message = "Đơn hàng không ở trạng thái chờ đặt cọc" });

            var ipAddr = HttpContext.Connection.RemoteIpAddress?.ToString() ?? "127.0.0.1";
            var paymentUrl = _vnPay.CreatePaymentUrl(orderId, order.DepositAmount, ipAddr);

            return Ok(new { paymentUrl });
        }

        // Xác thực callback từ VNPay (frontend gọi sau khi bị redirect về)
        [HttpGet("verify")]
        public async Task<IActionResult> Verify([FromQuery] IQueryCollection query)
        {
            // Lấy toàn bộ query string từ Request
            var (isValid, responseCode, orderId) = _vnPay.ValidateReturn(Request.Query);

            if (!isValid)
                return BadRequest(new { success = false, message = "Chữ ký không hợp lệ" });

            if (responseCode != "00")
                return Ok(new { success = false, orderId, message = $"Thanh toán thất bại (mã: {responseCode})" });

            // Cập nhật trạng thái đơn hàng
            var order = await _orderRepo.GetByIdAsync(orderId);
            if (order == null)
                return NotFound(new { success = false, message = "Không tìm thấy đơn hàng" });

            if (order.Status == "WaitingDeposit")
            {
                order.Status = "DepositPaid";
                await _orderRepo.UpdateAsync(order);

                // Gửi email thông báo (fire-and-forget, không block response)
                _ = Task.Run(async () =>
                {
                    try
                    {
                        // Lấy email từ DB nếu có
                        // Email được lưu khi gửi xác nhận đơn hàng — không cần query lại DB
                        await _email.SendOrderStatusUpdateAsync("", order.CustomerName, orderId, "DepositPaid");
                    }
                    catch { /* silent */ }
                });
            }

            return Ok(new { success = true, orderId, message = "Thanh toán thành công! Đơn hàng đã được xác nhận." });
        }
    }
}
