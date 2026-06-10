using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using BaseCore.Repository;

namespace BaseCore.APIService.Controllers
{
    [Route("api/[controller]")]
    [ApiController]
    [Authorize(Roles = "Admin")]
    public class StatisticsController : ControllerBase
    {
        private readonly MySqlDbContext _context;

        public StatisticsController(MySqlDbContext context)
        {
            _context = context;
        }

        [HttpGet("summary")]
        public async Task<IActionResult> GetSummary()
        {
            var now = DateTime.UtcNow;
            var today = now.Date;
            var thisMonthStart = new DateTime(now.Year, now.Month, 1, 0, 0, 0, DateTimeKind.Utc);
            var nextMonthStart = thisMonthStart.AddMonths(1);

            var pendingStatuses = new[] { "WaitingDeposit", "DepositPaid", "Processing", "Shipping" };

            var totalRevenue = await _context.Orders
                .Where(o => o.Status == "Completed")
                .SumAsync(o => (decimal?)o.TotalAmount) ?? 0;

            var thisMonthRevenue = await _context.Orders
                .Where(o => o.Status == "Completed"
                         && o.OrderDate >= thisMonthStart
                         && o.OrderDate < nextMonthStart)
                .SumAsync(o => (decimal?)o.TotalAmount) ?? 0;

            var completedOrders = await _context.Orders.CountAsync(o => o.Status == "Completed");
            var pendingOrders   = await _context.Orders.CountAsync(o => pendingStatuses.Contains(o.Status));
            var cancelledOrders = await _context.Orders.CountAsync(o => o.Status == "Cancelled");
            var todayOrders     = await _context.Orders.CountAsync(o => o.OrderDate >= today && o.OrderDate < today.AddDays(1));

            return Ok(new
            {
                totalRevenue,
                thisMonthRevenue,
                completedOrders,
                pendingOrders,
                cancelledOrders,
                todayOrders
            });
        }

        [HttpGet("daily-revenue")]
        public async Task<IActionResult> GetDailyRevenue([FromQuery] int year, [FromQuery] int month)
        {
            if (year < 2000 || year > 2100 || month < 1 || month > 12)
                return BadRequest(new { message = "Năm/tháng không hợp lệ" });

            var start = new DateTime(year, month, 1, 0, 0, 0, DateTimeKind.Utc);
            var end   = start.AddMonths(1);
            var daysInMonth = DateTime.DaysInMonth(year, month);

            var orders = await _context.Orders
                .Where(o => o.Status == "Completed" && o.OrderDate >= start && o.OrderDate < end)
                .Select(o => new { o.OrderDate.Day, o.TotalAmount })
                .ToListAsync();

            var grouped = orders
                .GroupBy(o => o.Day)
                .ToDictionary(
                    g => g.Key,
                    g => (Revenue: g.Sum(x => x.TotalAmount), Count: g.Count())
                );

            var result = Enumerable.Range(1, daysInMonth).Select(day =>
            {
                var found = grouped.TryGetValue(day, out var d);
                return new { day, revenue = found ? d.Revenue : 0m, orderCount = found ? d.Count : 0 };
            }).ToList();

            return Ok(result);
        }
    }
}
