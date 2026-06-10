using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using BaseCore.Entities;
using BaseCore.Repository.EFCore;
using BaseCore.APIService.Services;
using System.Security.Claims;
using Microsoft.EntityFrameworkCore;
using BaseCore.Repository;

namespace BaseCore.APIService.Controllers
{
    [Route("api/[controller]")]
    [ApiController]
    [Authorize]
    public class OrdersController : ControllerBase
    {
        private readonly IOrderRepositoryEF _orderRepository;
        private readonly IOrderDetailRepositoryEF _orderDetailRepository;
        private readonly IProductRepositoryEF _productRepository;
        private readonly IEmailService _emailService;
        private readonly MySqlDbContext _db;

        public OrdersController(
            IOrderRepositoryEF orderRepository,
            IOrderDetailRepositoryEF orderDetailRepository,
            IProductRepositoryEF productRepository,
            IEmailService emailService,
            MySqlDbContext db)
        {
            _orderRepository = orderRepository;
            _orderDetailRepository = orderDetailRepository;
            _productRepository = productRepository;
            _emailService = emailService;
            _db = db;
        }

        private string? GetUserId() =>
            User.FindFirst(ClaimTypes.NameIdentifier)?.Value
            ?? User.FindFirst("sub")?.Value
            ?? User.FindFirst("id")?.Value;

        // Auto-cancel đơn nếu quá 24h chưa thanh toán
        private async Task CheckAndAutoCancelOrder(Order order)
        {
            if (order.Status == "WaitingDeposit")
            {
                var hoursElapsed = (DateTime.UtcNow - order.OrderDate).TotalHours;
                if (hoursElapsed > 24)
                {
                    // Hoàn lại stock
                    var details = await _orderDetailRepository.GetByOrderAsync(order.Id);
                    foreach (var detail in details)
                    {
                        var product = await _productRepository.GetByIdAsync(detail.ProductId);
                        if (product == null) continue;

                        bool isGenderProduct = product.MaleStock > 0 || product.FemaleStock > 0
                            || !string.IsNullOrEmpty(detail.SelectedGender);
                        if (isGenderProduct)
                        {
                            switch (detail.SelectedGender)
                            {
                                case "Đực":
                                    product.MaleStock += detail.Quantity;
                                    break;
                                case "Cái":
                                    product.FemaleStock += detail.Quantity;
                                    break;
                                case "Cặp":
                                    product.MaleStock += detail.Quantity;
                                    product.FemaleStock += detail.Quantity;
                                    break;
                            }
                            product.Stock = product.MaleStock + product.FemaleStock;
                        }
                        else
                        {
                            product.Stock += detail.Quantity;
                        }
                        await _productRepository.UpdateAsync(product);
                    }

                    // Auto cancel
                    order.Status = "Cancelled";
                    await _orderRepository.UpdateAsync(order);
                }
            }
        }

        // Lấy đơn hàng của user hiện tại — kèm sản phẩm đã đặt
        [HttpGet]
        public async Task<IActionResult> GetMyOrders()
        {
            var userId = GetUserId();
            if (string.IsNullOrEmpty(userId)) return Unauthorized();

            var orders = await _orderRepository.GetByUserAsync(userId);

            // Auto-cancel các đơn quá 24h
            foreach (var order in orders)
            {
                await CheckAndAutoCancelOrder(order);
            }

            var result = new List<object>();
            foreach (var o in orders)
            {
                var details = await _orderDetailRepository.GetByOrderAsync(o.Id);
                result.Add(new
                {
                    o.Id,
                    o.OrderDate,
                    o.TotalAmount,
                    o.DepositAmount,
                    o.Status,
                    o.ShippingAddress,
                    o.CustomerName,
                    o.CustomerPhone,
                    items = details.Select(d => new
                    {
                        d.ProductId,
                        productName  = d.Product != null ? d.Product.Name : "Sản phẩm",
                        productImage = d.Product != null ? d.Product.ImageUrl : null,
                        d.Quantity,
                        d.UnitPrice,
                        d.SelectedGender,
                    }).ToList()
                });
            }
            return Ok(result);
        }

        // ✅ Admin: lấy tất cả đơn, có thể filter theo status
        [HttpGet("all")]
        [Authorize(Roles = "Admin")]
        public async Task<IActionResult> GetAllOrders([FromQuery] string? status)
        {
            var orders = await _orderRepository.GetAllAsync();

            if (!string.IsNullOrEmpty(status))
                orders = orders.Where(o => o.Status == status).ToList();

            return Ok(orders);
        }

        // Lấy chi tiết đơn hàng
        [HttpGet("{id}")]
        public async Task<IActionResult> GetById(int id)
        {
            var order = await _orderRepository.GetByIdAsync(id);
            if (order == null) return NotFound(new { message = "Order not found" });

            // Auto-cancel nếu quá 24h
            await CheckAndAutoCancelOrder(order);

            var details = await _orderDetailRepository.GetByOrderAsync(id);
            return Ok(new { order, details });
        }

        // Tạo đơn hàng mới
        [HttpPost]
        public async Task<IActionResult> Create([FromBody] CreateOrderDto dto)
        {
            var userId = GetUserId();
            if (string.IsNullOrEmpty(userId)) return Unauthorized();

            decimal totalAmount = 0;
            var orderDetails = new List<OrderDetail>();

            foreach (var item in dto.Items)
            {
                var product = await _productRepository.GetByIdAsync(item.ProductId);
                if (product == null)
                    return BadRequest(new { message = $"Product {item.ProductId} not found" });
                if (product.Stock < item.Quantity)
                    return BadRequest(new { message = $"Insufficient stock for {product.Name}" });

                totalAmount += product.Price * item.Quantity;
                orderDetails.Add(new OrderDetail
                {
                    ProductId = item.ProductId,
                    Quantity = item.Quantity,
                    UnitPrice = product.Price
                });
                product.Stock -= item.Quantity;
                await _productRepository.UpdateAsync(product);
            }

            decimal depositAmount = Math.Round(totalAmount * 0.5m, 0);
            var order = new Order
            {
                UserId = userId,
                OrderDate = DateTime.UtcNow,
                TotalAmount = totalAmount,
                DepositAmount = depositAmount,
                Status = "WaitingDeposit",
                ShippingAddress = dto.ShippingAddress ?? ""
            };

            await _orderRepository.AddAsync(order);
            foreach (var detail in orderDetails)
            {
                detail.OrderId = order.Id;
                await _orderDetailRepository.AddAsync(detail);
            }

            // Gửi email xác nhận (fire-and-forget)
            _ = Task.Run(async () =>
            {
                try
                {
                    var user = await _db.Users.FirstOrDefaultAsync(u => u.Id == userId);
                    if (user?.Email != null)
                    {
                        await _emailService.SendOrderConfirmationAsync(
                            user.Email, order.CustomerName, order.Id,
                            order.DepositAmount, order.TotalAmount, order.ShippingAddress);
                    }
                }
                catch { /* silent — email không được block luồng chính */ }
            });

            return CreatedAtAction(nameof(GetById), new { id = order.Id },
                new { order, details = orderDetails });
        }

        // Cập nhật trạng thái đơn hàng
        // Flow: WaitingDeposit → DepositPaid → Processing → Shipping → Completed / Cancelled
        [HttpPut("{id}/status")]
        [Authorize(Roles = "Admin")]
        public async Task<IActionResult> UpdateStatus(int id, [FromBody] UpdateStatusDto dto)
        {
            var validStatuses = new[] { "WaitingDeposit", "DepositPaid", "Processing", "Shipping", "Completed", "Cancelled" };
            if (!validStatuses.Contains(dto.Status))
                return BadRequest(new { message = $"Trạng thái không hợp lệ. Chỉ chấp nhận: {string.Join(", ", validStatuses)}" });

            var order = await _orderRepository.GetByIdAsync(id);
            if (order == null) return NotFound(new { message = "Order not found" });

            if (order.Status == "Cancelled")
                return BadRequest(new { message = "Không thể cập nhật đơn đã huỷ" });
            if (order.Status == "Completed")
                return BadRequest(new { message = "Không thể cập nhật đơn đã hoàn thành" });

            order.Status = dto.Status;
            await _orderRepository.UpdateAsync(order);

            // Gửi email thông báo thay đổi trạng thái (fire-and-forget)
            _ = Task.Run(async () =>
            {
                try
                {
                    var user = await _db.Users.FirstOrDefaultAsync(u => u.Id == order.UserId);
                    if (user?.Email != null)
                    {
                        await _emailService.SendOrderStatusUpdateAsync(
                            user.Email, order.CustomerName, order.Id, dto.Status);
                    }
                }
                catch { /* silent */ }
            });

            return Ok(order);
        }

        // Huỷ đơn — chỉ khi đang WaitingDeposit (chưa thanh toán)
        [HttpPut("{id}/cancel")]
        public async Task<IActionResult> CancelOrder(int id)
        {
            var order = await _orderRepository.GetByIdAsync(id);
            if (order == null) return NotFound(new { message = "Order not found" });

            if (order.Status == "Cancelled")
                return BadRequest(new { message = "Đơn hàng đã được huỷ trước đó" });

            if (order.Status != "WaitingDeposit")
                return BadRequest(new { message = "Chỉ có thể huỷ đơn khi chưa thanh toán" });

            // Hoàn lại stock
            var details = await _orderDetailRepository.GetByOrderAsync(id);
            foreach (var detail in details)
            {
                var product = await _productRepository.GetByIdAsync(detail.ProductId);
                if (product == null) continue;

                bool isGenderProduct = product.MaleStock > 0 || product.FemaleStock > 0
                    || !string.IsNullOrEmpty(detail.SelectedGender);
                if (isGenderProduct)
                {
                    switch (detail.SelectedGender)
                    {
                        case "Đực":
                            product.MaleStock += detail.Quantity;
                            break;
                        case "Cái":
                            product.FemaleStock += detail.Quantity;
                            break;
                        case "Cặp":
                            product.MaleStock += detail.Quantity;
                            product.FemaleStock += detail.Quantity;
                            break;
                    }
                    product.Stock = product.MaleStock + product.FemaleStock;
                }
                else
                {
                    product.Stock += detail.Quantity;
                }
                await _productRepository.UpdateAsync(product);
            }

            order.Status = "Cancelled";
            await _orderRepository.UpdateAsync(order);
            return Ok(new { message = "Đơn hàng đã được huỷ, tồn kho đã được hoàn lại", order });
        }
    }

    public class CreateOrderDto
    {
        public List<OrderItemDto> Items { get; set; } = [];
        public string? ShippingAddress { get; set; }
    }

    public class OrderItemDto
    {
        public int ProductId { get; set; }
        public int Quantity { get; set; }
    }

    public class UpdateStatusDto
    {
        public string Status { get; set; } = "";
    }
}