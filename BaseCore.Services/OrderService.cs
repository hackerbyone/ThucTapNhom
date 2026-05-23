using Microsoft.EntityFrameworkCore;
using BaseCore.Entities;
using BaseCore.Repository;
using BaseCore.DTO.Common;
using BaseCore.Repository.EFCore;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;

namespace BaseCore.Services
{
    public class OrderService : IOrderService
    {
        private readonly MySqlDbContext _context;
        private readonly ICartRepository _cartRepository;

        public OrderService(MySqlDbContext context, ICartRepository cartRepository)
        {
            _context = context;
            _cartRepository = cartRepository;
        }

        public async Task<Order> CreateOrderAsync(Order order)
        {
            order.OrderDate = DateTime.UtcNow;
            order.Status = "WaitingDeposit";
            await _context.Orders.AddAsync(order);
            await _context.SaveChangesAsync();
            return order;
        }

        public async Task<List<Order>> GetOrdersByUserIdAsync(string userId)
        {
            return await _context.Orders
                .Include(o => o.OrderDetails)
                    .ThenInclude(d => d.Product)
                .Where(o => o.UserId == userId)
                .OrderByDescending(o => o.OrderDate)
                .ToListAsync();
        }

        public async Task<Order?> GetOrderByIdAsync(int id)
        {
            return await _context.Orders
                .Include(o => o.OrderDetails)
                    .ThenInclude(d => d.Product)
                .FirstOrDefaultAsync(o => o.Id == id);
        }

        public async Task<OrderResultDto> CheckoutAsync(string userId, string shippingAddress)
        {
            var cart = await _cartRepository.GetCartByUserId(userId);
            if (cart == null || !cart.Items.Any())
                throw new Exception("Giỏ hàng trống");

            // Kiểm tra tồn kho trước khi tạo đơn
            foreach (var item in cart.Items)
            {
                // Load product trực tiếp từ context để đảm bảo tracking chính xác
                var product = await _context.Products.FindAsync(item.ProductId);
                if (product == null)
                    throw new Exception($"Sản phẩm ID {item.ProductId} không tồn tại");

                bool isGenderProduct = product.MaleStock > 0 || product.FemaleStock > 0;
                if (isGenderProduct)
                {
                    int available = item.SelectedGender switch
                    {
                        "Đực" => product.MaleStock,
                        "Cái" => product.FemaleStock,
                        "Cặp" => Math.Min(product.MaleStock, product.FemaleStock),
                        _ => product.MaleStock + product.FemaleStock
                    };
                    if (available < item.Quantity)
                        throw new Exception(
                            $"Sản phẩm '{product.Name}' ({item.SelectedGender}) chỉ còn {available} con trong kho, không đủ {item.Quantity} con");
                }
                else if (product.Stock < item.Quantity)
                {
                    throw new Exception(
                        $"Sản phẩm '{product.Name}' chỉ còn {product.Stock} sản phẩm trong kho, không đủ {item.Quantity}");
                }
            }

            decimal totalAmount = cart.Items.Sum(item =>
            {
                var p = _context.Products.Local.FirstOrDefault(x => x.Id == item.ProductId);
                return (p?.Price ?? 0) * item.Quantity;
            });

            decimal depositAmount = Math.Round(totalAmount * 0.5m, 0);

            var order = new Order
            {
                UserId = userId,
                OrderDate = DateTime.UtcNow,
                Status = "WaitingDeposit",
                TotalAmount = totalAmount,
                DepositAmount = depositAmount,
                ShippingAddress = shippingAddress,
            };

            await _context.Orders.AddAsync(order);
            await _context.SaveChangesAsync(); // lấy order.Id

            // Tạo OrderDetail và trừ tồn kho
            foreach (var item in cart.Items)
            {
                // FindAsync trả về entity đã được track từ bước kiểm tra ở trên
                var product = await _context.Products.FindAsync(item.ProductId);
                if (product == null) continue;

                await _context.Set<OrderDetail>().AddAsync(new OrderDetail
                {
                    OrderId        = order.Id,
                    ProductId      = item.ProductId,
                    Quantity       = item.Quantity,
                    UnitPrice      = product.Price,
                    SelectedGender = item.SelectedGender,
                });

                // Trừ tồn kho theo giới tính
                bool isGenderProduct = product.MaleStock > 0 || product.FemaleStock > 0;
                if (isGenderProduct)
                {
                    switch (item.SelectedGender)
                    {
                        case "Đực":
                            product.MaleStock -= item.Quantity;
                            product.Stock = product.MaleStock + product.FemaleStock;
                            break;
                        case "Cái":
                            product.FemaleStock -= item.Quantity;
                            product.Stock = product.MaleStock + product.FemaleStock;
                            break;
                        case "Cặp":
                            product.MaleStock -= item.Quantity;
                            product.FemaleStock -= item.Quantity;
                            product.Stock = product.MaleStock + product.FemaleStock;
                            break;
                    }
                }
                else
                {
                    product.Stock -= item.Quantity;
                }
            }

            await _context.SaveChangesAsync(); // lưu OrderDetails + trừ stock

            await _cartRepository.ClearCart(cart.Id);

            return new OrderResultDto
            {
                Id              = order.Id,
                UserId          = order.UserId,
                ShippingAddress = order.ShippingAddress,
                TotalAmount     = totalAmount,
                DepositAmount   = depositAmount,
                Status          = order.Status,
                DepositNote     = $"Vui lòng chuyển khoản {depositAmount:N0}đ (50% giá trị đơn) để xác nhận đơn hàng #{order.Id}. Đơn hàng sẽ bị huỷ tự động sau 24 giờ nếu chưa nhận được cọc."
            };
        }
    }
}
