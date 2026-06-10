namespace BaseCore.DTO.Common
{
    public class OrderResultDto
    {
        public int Id { get; set; }
        public string UserId { get; set; } = "";
        public string ShippingAddress { get; set; } = "";
        public string CustomerName { get; set; } = "";
        public string CustomerPhone { get; set; } = "";
        public decimal TotalAmount { get; set; }
        public decimal DepositAmount { get; set; }
        public string Status { get; set; } = "WaitingDeposit";
        public string DepositNote { get; set; } = "";
    }
}
