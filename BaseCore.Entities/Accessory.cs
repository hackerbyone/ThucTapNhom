using System;

namespace BaseCore.Entities
{
    public class Accessory
    {
        public int Id { get; set; }
        public int? ProductId { get; set; }
        public Product? Product { get; set; }
        public string Name { get; set; } = "";
        // "Accessory" (phụ kiện) hoặc "Equipment" (thiết bị)
        public string Type { get; set; } = "Accessory";
        public int Quantity { get; set; }
        public string? Unit { get; set; }
        // "Good", "Damaged", "Maintenance"
        public string Status { get; set; } = "Good";
        public string? Description { get; set; }
        public bool IsActive { get; set; } = true;
        public DateTime Created { get; set; } = DateTime.Now;
        public DateTime? Modified { get; set; }
        public string CreatedBy { get; set; } = "";
        public string CreatedByName { get; set; } = "";
    }
}
