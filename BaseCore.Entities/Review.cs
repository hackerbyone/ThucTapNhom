using System;

namespace BaseCore.Entities
{
    public class Review
    {
        public int Id { get; set; }
        public int ProductId { get; set; }
        public string UserId { get; set; } = "";
        public int? OrderId { get; set; }          // Đơn hàng đã mua (để xác thực)
        public int Rating { get; set; }            // 1 - 5 sao
        public string Comment { get; set; } = "";
        public string CustomerName { get; set; } = "";
        public DateTime CreatedAt { get; set; } = DateTime.UtcNow;

        public virtual Product? Product { get; set; }
    }
}
