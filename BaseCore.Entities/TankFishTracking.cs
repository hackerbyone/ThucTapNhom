using System;

namespace BaseCore.Entities
{
    public class TankFishTracking
    {
        public int Id { get; set; }
        public string TankName { get; set; } = "";
        public int ProductId { get; set; }
        public Product? Product { get; set; }
        public int MaleCount { get; set; }
        public int FemaleCount { get; set; }
        public string? Notes { get; set; }
        public DateTime LastUpdated { get; set; } = DateTime.Now;
        public string LastUpdatedBy { get; set; } = "";
        public string LastUpdatedByName { get; set; } = "";
    }
}
