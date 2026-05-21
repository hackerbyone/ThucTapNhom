using System.Threading.Tasks;
using BaseCore.Entities;
using BaseCore.Repository.EFCore;

namespace BaseCore.Repository
{
    public interface ICartRepository : IRepository<Cart>
    {
        Task<Cart?> GetCartByUserId(string userId);    // ✅ int → string
        Task<CartItem?> GetCartItem(int cartId, int productId);
        Task RemoveItem(int cartId, int productId);
        Task ClearCart(int cartId);
    }
}