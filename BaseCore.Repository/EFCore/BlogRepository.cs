using Microsoft.EntityFrameworkCore;
using BaseCore.Entities;

namespace BaseCore.Repository.EFCore
{
    /// <summary>
    /// Blog Repository using Entity Framework Core
    /// </summary>
    public interface IBlogRepositoryEF : IRepository<Blog>
    {
        Task<(List<Blog> Blogs, int TotalCount)> SearchAsync(string? keyword, int page, int pageSize);
    }

    public class BlogRepositoryEF : Repository<Blog>, IBlogRepositoryEF
    {
        public BlogRepositoryEF(MySqlDbContext context) : base(context)
        {
        }

        public async Task<(List<Blog> Blogs, int TotalCount)> SearchAsync(string? keyword, int page, int pageSize)
        {
            var query = _dbSet.AsQueryable();
            if (!string.IsNullOrEmpty(keyword))
            {
                keyword = keyword.ToLower();
                query = query.Where(b =>
                    b.Title.ToLower().Contains(keyword) ||
                    (b.Content != null && b.Content.ToLower().Contains(keyword)));
            }

            
            var totalCount = await query.CountAsync();

            var blogs = await query
                .OrderByDescending(b => b.PublishDate)
                .Skip((page - 1) * pageSize)
                .Take(pageSize)
                .ToListAsync();

            return (blogs, totalCount);
        }
    }
}