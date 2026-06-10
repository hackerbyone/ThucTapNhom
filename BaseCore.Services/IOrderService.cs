using BaseCore.DTO.Common;
using BaseCore.Entities;
using System.Collections.Generic;
using System.Threading.Tasks;

namespace BaseCore.Services
{
    public interface IOrderService
    {
        Task<Order> CreateOrderAsync(Order order);
        Task<List<Order>> GetOrdersByUserIdAsync(string userId);   // ✅ string
        Task<Order?> GetOrderByIdAsync(int id);
        Task<OrderResultDto> CheckoutAsync(string userId, string shippingAddress, string customerName = "", string customerPhone = "", decimal shippingFee = 0);
    }
}