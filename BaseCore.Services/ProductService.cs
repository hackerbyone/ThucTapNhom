using Microsoft.EntityFrameworkCore;
using BaseCore.Entities;
using BaseCore.Repository;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;

namespace BaseCore.Services
{
    public class ProductService : IProductService
    {
        private readonly MySqlDbContext _context;

        public ProductService(MySqlDbContext context)
        {
            _context = context;
        }

        public async Task<List<Product>> GetAllProductsAsync()
        {
            return await _context.Products.Include(p => p.Category).ToListAsync();
        }

        public async Task<Product> GetProductByIdAsync(int id)
        {
            return await _context.Products.Include(p => p.Category).FirstOrDefaultAsync(p => p.Id == id);
        }

        public async Task<Product> CreateProductAsync(Product product)
        {
            await _context.Products.AddAsync(product);
            await _context.SaveChangesAsync();
            return product;
        }

        public async Task UpdateProductAsync(Product product)
        {
            _context.Products.Update(product);
            await _context.SaveChangesAsync();
        }

        public async Task DeleteProductAsync(int id)
        {
            var product = await _context.Products.FirstOrDefaultAsync(p => p.Id == id);
            if (product == null)
            {
                return;
            }

            _context.Products.Remove(product);
            await _context.SaveChangesAsync();
        }

        public async Task<(List<Product> Products, int TotalCount)> SearchAsync(string keyword, int? categoryId, int page, int pageSize)
        {
            var query = _context.Products.AsQueryable();

            if (!string.IsNullOrEmpty(keyword))
            {
                var keywordLower = keyword.ToLower();
                query = query.Where(p =>
                    (p.Name != null && p.Name.ToLower().Contains(keywordLower)) ||
                    (p.Description != null && p.Description.ToLower().Contains(keywordLower)));
            }

            if (categoryId.HasValue)
            {
                query = query.Where(p => p.CategoryId == categoryId.Value);
            }

            var totalCount = await query.CountAsync();

            var products = await query
                .Include(p => p.Category)
                .OrderByDescending(p => p.Id)
                .Skip((page - 1) * pageSize)
                .Take(pageSize)
                .ToListAsync();

            return (products, totalCount);
        }
    }
}
