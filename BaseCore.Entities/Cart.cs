using System;
using System.Collections.Generic;

namespace BaseCore.Entities
{
    public class Cart
    {
        public int Id { get; set; }
        public string UserId { get; set; } = "";     // ✅ int → string, khớp với User.Id
        public virtual User? User { get; set; }
        public virtual ICollection<CartItem> Items { get; set; } = new List<CartItem>();
        public DateTime? LastUpdated { get; set; } = DateTime.UtcNow;
    }
}