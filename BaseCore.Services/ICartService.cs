using System.Threading.Tasks;
using BaseCore.DTO.Common;

namespace BaseCore.Services
{
    public interface ICartService
    {
        Task<CartDto> GetCart(string userId);
        Task<CartDto> AddItem(string userId, int productId, int quantity, string? selectedGender);
        Task<CartDto> UpdateQuantity(string userId, int cartItemId, int quantity);
        Task<CartDto> RemoveItem(string userId, int cartItemId);
        Task<bool> ClearCart(string userId);
    }
}