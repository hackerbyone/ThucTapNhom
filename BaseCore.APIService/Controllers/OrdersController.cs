using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using BaseCore.Entities;
using BaseCore.Repository.EFCore;
using System.Security.Claims;

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

        public OrdersController(
            IOrderRepositoryEF orderRepository,
            IOrderDetailRepositoryEF orderDetailRepository,
            IProductRepositoryEF productRepository)
        {
            _orderRepository = orderRepository;
            _orderDetailRepository = orderDetailRepository;
            _productRepository = productRepository;
        }

        private string? GetUserId() =>
            User.FindFirst(ClaimTypes.NameIdentifier)?.Value
            ?? User.FindFirst("sub")?.Value
            ?? User.FindFirst("id")?.Value;

        // Lấy đơn hàng của user hiện tại — kèm sản phẩm đã đặt
        [HttpGet]
        public async Task<IActionResult> GetMyOrders()
        {
            var userId = GetUserId();
            if (string.IsNullOrEmpty(userId)) return Unauthorized();

            var orders = await _orderRepository.GetByUserAsync(userId);

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
            return Ok(order);
        }

        // Huỷ đơn — chỉ khi đang WaitingDeposit và trong vòng 3 giờ
        [HttpPut("{id}/cancel")]
        public async Task<IActionResult> CancelOrder(int id)
        {
            var order = await _orderRepository.GetByIdAsync(id);
            if (order == null) return NotFound(new { message = "Order not found" });

            if (order.Status == "Cancelled")
                return BadRequest(new { message = "Đơn hàng đã được huỷ trước đó" });

            if (order.Status != "WaitingDeposit")
                return BadRequest(new { message = "Chỉ có thể huỷ đơn khi đang chờ đặt cọc" });

            var hoursElapsed = (DateTime.UtcNow - order.OrderDate).TotalHours;
            if (hoursElapsed > 3)
                return BadRequest(new { message = "Đã quá 3 giờ kể từ khi đặt hàng, không thể huỷ đơn" });

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