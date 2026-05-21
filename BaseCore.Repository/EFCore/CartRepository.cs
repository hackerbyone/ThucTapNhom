using System.Linq;
using System.Threading.Tasks;
using Microsoft.EntityFrameworkCore;
using BaseCore.Entities;
using BaseCore.Repository.EFCore;

namespace BaseCore.Repository
{
    public class CartRepository : Repository<Cart>, ICartRepository
    {
        public CartRepository(MySqlDbContext context) : base(context) { }

        public async Task<Cart?> GetCartByUserId(string userId)   // ✅ int → string
        {
            return await _dbSet
                .Include(c => c.Items)
                    .ThenInclude(i => i.Product)
                .FirstOrDefaultAsync(c => c.UserId == userId);
        }

        public async Task<CartItem?> GetCartItem(int cartId, int productId)
        {
            return await _context.Set<CartItem>()
                .FirstOrDefaultAsync(i => i.CartId == cartId && i.ProductId == productId);
        }

        public async Task RemoveItem(int cartId, int productId)
        {
            var item = await GetCartItem(cartId, productId);
            if (item is not null)
            {
                _context.Set<CartItem>().Remove(item);
                await _context.SaveChangesAsync();
            }
        }

        public async Task ClearCart(int cartId)
        {
            var items = _context.Set<CartItem>().Where(i => i.CartId == cartId);
            _context.Set<CartItem>().RemoveRange(items);
            await _context.SaveChangesAsync();
        }
    }
}