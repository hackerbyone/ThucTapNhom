using System;
using System.Collections.Generic;

namespace BaseCore.Entities
{
    public class Order
    {
        public int Id { get; set; }
        public string UserId { get; set; } = "";     // ✅ Guid/int → string, khớp với User.Id
        public DateTime OrderDate { get; set; } = DateTime.UtcNow;
        public decimal TotalAmount { get; set; }
        public decimal DepositAmount { get; set; }
        public string Status { get; set; } = "WaitingDeposit";
        public string ShippingAddress { get; set; } = "";
        public List<OrderDetail> OrderDetails { get; set; } = [];
    }
}