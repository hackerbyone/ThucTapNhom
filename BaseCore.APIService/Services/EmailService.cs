using System.Net;
using System.Net.Mail;

namespace BaseCore.APIService.Services
{
    public interface IEmailService
    {
        Task SendOrderConfirmationAsync(string toEmail, string customerName, int orderId,
            decimal depositAmount, decimal totalAmount, string shippingAddress);
        Task SendOrderStatusUpdateAsync(string toEmail, string customerName, int orderId, string newStatus);
    }

    public class EmailService : IEmailService
    {
        private readonly string _host;
        private readonly int _port;
        private readonly string _username;
        private readonly string _password;
        private readonly string _fromName;
        private readonly bool _enabled;

        private static readonly Dictionary<string, string> StatusLabels = new()
        {
            ["WaitingDeposit"] = "Chờ đặt cọc",
            ["DepositPaid"]    = "Đã đặt cọc",
            ["Processing"]     = "Đang xử lý",
            ["Shipping"]       = "Đang giao hàng",
            ["Completed"]      = "Hoàn thành",
            ["Cancelled"]      = "Đã hủy",
        };

        public EmailService(IConfiguration config)
        {
            _host     = config["Email:Host"]     ?? "smtp.gmail.com";
            _port     = int.TryParse(config["Email:Port"], out var p) ? p : 587;
            _username = config["Email:Username"] ?? "";
            _password = config["Email:Password"] ?? "";
            _fromName = config["Email:FromName"] ?? "Shop Cá Cảnh AquaViet";
            _enabled  = !string.IsNullOrWhiteSpace(_username) && !string.IsNullOrWhiteSpace(_password);
        }

        public async Task SendOrderConfirmationAsync(string toEmail, string customerName,
            int orderId, decimal depositAmount, decimal totalAmount, string shippingAddress)
        {
            if (!_enabled || string.IsNullOrWhiteSpace(toEmail)) return;

            var subject = $"[Shop Cá Cảnh] Xác nhận đơn hàng #{orderId}";
            var body = $@"<!DOCTYPE html>
<html><head><meta charset='utf-8'></head>
<body style='font-family:Arial,sans-serif;background:#f5f5f5;padding:20px;'>
  <div style='max-width:600px;margin:0 auto;background:#fff;border-radius:12px;overflow:hidden;box-shadow:0 2px 8px rgba(0,0,0,.1);'>
    <div style='background:linear-gradient(135deg,#1a73e8,#0d47a1);padding:28px 32px;'>
      <h1 style='color:#fff;margin:0;font-size:22px;'>🐠 Shop Cá Cảnh AquaViet</h1>
    </div>
    <div style='padding:32px;'>
      <h2 style='color:#1a73e8;margin:0 0 8px;'>Đặt hàng thành công!</h2>
      <p style='color:#555;margin:0 0 24px;'>Xin chào <strong>{customerName}</strong>, đơn hàng của bạn đã được tiếp nhận.</p>
      <div style='background:#f8f9ff;border:1px solid #e3f2fd;border-radius:8px;padding:20px;margin-bottom:20px;'>
        <h3 style='margin:0 0 16px;color:#333;font-size:16px;'>📦 Chi tiết đơn hàng #{orderId}</h3>
        <table style='width:100%;border-collapse:collapse;'>
          <tr><td style='padding:6px 0;color:#666;'>Tổng đơn hàng:</td>
              <td style='padding:6px 0;text-align:right;font-weight:bold;'>{totalAmount:N0}đ</td></tr>
          <tr style='background:#fff3e0;'><td style='padding:8px;color:#e65100;font-weight:bold;'>💰 Đặt cọc ngay (50%):</td>
              <td style='padding:8px;text-align:right;color:#e65100;font-weight:bold;font-size:18px;'>{depositAmount:N0}đ</td></tr>
          <tr><td style='padding:6px 0;color:#666;'>Còn lại khi nhận hàng:</td>
              <td style='padding:6px 0;text-align:right;'>{(totalAmount - depositAmount):N0}đ</td></tr>
          <tr><td style='padding:6px 0;color:#666;'>Địa chỉ giao:</td>
              <td style='padding:6px 0;text-align:right;'>{shippingAddress}</td></tr>
        </table>
      </div>
      <div style='background:#fff8e1;border-left:4px solid #ffa000;padding:16px;border-radius:0 8px 8px 0;margin-bottom:24px;'>
        <strong style='color:#e65100;'>⏳ Vui lòng đặt cọc trong 24 giờ!</strong>
        <p style='margin:8px 0 0;color:#555;font-size:14px;'>
          Chuyển khoản <strong>{depositAmount:N0}đ</strong> đến MBBank: <strong>0827027392472</strong><br>
          Nội dung: <strong>COC DON {orderId}</strong>
        </p>
      </div>
      <p style='color:#888;font-size:13px;'>Cảm ơn bạn đã tin tưởng Shop Cá Cảnh AquaViet!</p>
    </div>
    <div style='background:#f5f5f5;padding:16px 32px;text-align:center;'>
      <p style='color:#aaa;font-size:12px;margin:0;'>© 2025 Shop Cá Cảnh AquaViet · Hotline: 1800-AQUA</p>
    </div>
  </div>
</body></html>";

            await SendAsync(toEmail, subject, body);
        }

        public async Task SendOrderStatusUpdateAsync(string toEmail, string customerName, int orderId, string newStatus)
        {
            if (!_enabled || string.IsNullOrWhiteSpace(toEmail)) return;

            var statusLabel = StatusLabels.TryGetValue(newStatus, out var lbl) ? lbl : newStatus;
            var (emoji, color, message) = newStatus switch
            {
                "DepositPaid" => ("✅", "#2e7d32", "Chúng tôi đã nhận được tiền cọc. Đơn hàng đang được chuẩn bị."),
                "Processing"  => ("🔧", "#6a1b9a", "Đơn hàng đang được đóng gói và chuẩn bị giao."),
                "Shipping"    => ("🚚", "#00695c", "Đơn hàng đang trên đường giao đến bạn!"),
                "Completed"   => ("🎉", "#1565c0", "Đơn hàng đã giao thành công. Cảm ơn bạn!"),
                "Cancelled"   => ("❌", "#c62828", "Đơn hàng đã bị hủy. Liên hệ 1800-AQUA nếu cần hỗ trợ."),
                _             => ("📋", "#555",    $"Trạng thái đơn hàng: {statusLabel}"),
            };

            var subject = $"[Shop Cá Cảnh] Đơn #{orderId} — {statusLabel}";
            var body = $@"<!DOCTYPE html>
<html><head><meta charset='utf-8'></head>
<body style='font-family:Arial,sans-serif;background:#f5f5f5;padding:20px;'>
  <div style='max-width:600px;margin:0 auto;background:#fff;border-radius:12px;overflow:hidden;box-shadow:0 2px 8px rgba(0,0,0,.1);'>
    <div style='background:linear-gradient(135deg,#1a73e8,#0d47a1);padding:28px 32px;'>
      <h1 style='color:#fff;margin:0;font-size:22px;'>🐠 Shop Cá Cảnh AquaViet</h1>
    </div>
    <div style='padding:32px;'>
      <h2 style='color:{color};margin:0 0 8px;'>{emoji} Cập nhật đơn hàng #{orderId}</h2>
      <p style='color:#555;margin:0 0 24px;'>Xin chào <strong>{customerName}</strong>,</p>
      <div style='background:#f8f9ff;border:2px solid {color};border-radius:8px;padding:24px;margin-bottom:24px;text-align:center;'>
        <div style='font-size:48px;margin-bottom:8px;'>{emoji}</div>
        <div style='font-size:22px;font-weight:bold;color:{color};'>{statusLabel}</div>
        <p style='color:#555;margin:12px 0 0;'>{message}</p>
      </div>
      <p style='color:#888;font-size:13px;'>Đăng nhập tài khoản để xem chi tiết đơn hàng.</p>
    </div>
    <div style='background:#f5f5f5;padding:16px 32px;text-align:center;'>
      <p style='color:#aaa;font-size:12px;margin:0;'>© 2025 Shop Cá Cảnh AquaViet · Hotline: 1800-AQUA</p>
    </div>
  </div>
</body></html>";

            await SendAsync(toEmail, subject, body);
        }

        private async Task SendAsync(string toEmail, string subject, string htmlBody)
        {
            try
            {
                using var smtp = new SmtpClient(_host, _port)
                {
                    Credentials = new NetworkCredential(_username, _password),
                    EnableSsl   = true,
                };

                using var mail = new MailMessage
                {
                    From       = new MailAddress(_username, _fromName),
                    Subject    = subject,
                    Body       = htmlBody,
                    IsBodyHtml = true,
                };
                mail.To.Add(toEmail);

                await smtp.SendMailAsync(mail);
                Console.WriteLine($"[Email] Gửi thành công tới {toEmail}");
            }
            catch (Exception ex)
            {
                Console.WriteLine($"[Email] Gửi thất bại tới {toEmail}: {ex.Message}");
            }
        }
    }
}
