using System;

namespace BaseCore.Entities
{
    // Bản ghi commit mỗi lần nhân viên kho cập nhật tồn kho
    public class InventoryCommit
    {
        public int Id { get; set; }
        public string StaffId { get; set; } = "";
        public string StaffName { get; set; } = "";
        public string CommitMessage { get; set; } = "";
        // "Fish" (bể cá) hoặc "Accessory" (phụ kiện/thiết bị)
        public string TargetType { get; set; } = "";
        public int? TargetId { get; set; }
        public string TargetName { get; set; } = "";
        public string? OldValue { get; set; }
        public string? NewValue { get; set; }
        public DateTime Created { get; set; } = DateTime.Now;
    }
}
