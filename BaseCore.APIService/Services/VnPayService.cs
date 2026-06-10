using System.Security.Cryptography;
using System.Text;

namespace BaseCore.APIService.Services
{
    public interface IVnPayService
    {
        string CreatePaymentUrl(int orderId, decimal amount, string ipAddr);
        (bool isValid, string responseCode, int orderId) ValidateReturn(IQueryCollection query);
    }

    public class VnPayService : IVnPayService
    {
        private readonly string _tmnCode;
        private readonly string _hashSecret;
        private readonly string _payUrl;
        private readonly string _returnUrl;

        public VnPayService(IConfiguration config)
        {
            _tmnCode   = config["VnPay:TmnCode"]   ?? "DEMOV210";
            _hashSecret = config["VnPay:HashSecret"] ?? "RAOEXHYVSDDIIENL";
            _payUrl    = config["VnPay:PayUrl"]    ?? "https://sandbox.vnpayment.vn/paymentv2/vpcpay.html";
            _returnUrl = config["VnPay:ReturnUrl"] ?? "http://localhost:5173/payment/vnpay-return";
        }

        public string CreatePaymentUrl(int orderId, decimal amount, string ipAddr)
        {
            var now    = DateTime.Now;
            var txnRef = $"{orderId}_{now:yyyyMMddHHmmss}";
            var amountInt = (long)(amount * 100);

            var vnpParams = new SortedDictionary<string, string>
            {
                ["vnp_Version"]    = "2.1.0",
                ["vnp_Command"]    = "pay",
                ["vnp_TmnCode"]    = _tmnCode,
                ["vnp_Amount"]     = amountInt.ToString(),
                ["vnp_CreateDate"] = now.ToString("yyyyMMddHHmmss"),
                ["vnp_CurrCode"]   = "VND",
                ["vnp_IpAddr"]     = string.IsNullOrEmpty(ipAddr) ? "127.0.0.1" : ipAddr,
                ["vnp_Locale"]     = "vn",
                ["vnp_OrderInfo"]  = $"COC DON {orderId}",
                ["vnp_OrderType"]  = "other",
                ["vnp_ReturnUrl"]  = _returnUrl,
                ["vnp_TxnRef"]     = txnRef,
                ["vnp_ExpireDate"] = now.AddMinutes(30).ToString("yyyyMMddHHmmss"),
            };

            // Tính chữ ký trên raw query string (không encode)
            var rawData = BuildRawData(vnpParams);
            var secureHash = HmacSha512(_hashSecret, rawData);

            // Build URL với values đã encode
            var urlBuilder = new StringBuilder(_payUrl).Append('?');
            foreach (var (key, val) in vnpParams)
            {
                urlBuilder.Append(Uri.EscapeDataString(key))
                          .Append('=')
                          .Append(Uri.EscapeDataString(val))
                          .Append('&');
            }
            urlBuilder.Append("vnp_SecureHash=").Append(secureHash);

            return urlBuilder.ToString();
        }

        public (bool isValid, string responseCode, int orderId) ValidateReturn(IQueryCollection query)
        {
            var secureHash   = query["vnp_SecureHash"].ToString();
            var responseCode = query["vnp_ResponseCode"].ToString();
            var txnRef       = query["vnp_TxnRef"].ToString();

            // Tính lại chữ ký (loại bỏ vnp_SecureHash)
            var sortedParams = new SortedDictionary<string, string>();
            foreach (var key in query.Keys)
            {
                if (key == "vnp_SecureHash" || key == "vnp_SecureHashType") continue;
                sortedParams[key] = query[key].ToString();
            }
            var rawData     = BuildRawData(sortedParams);
            var computedHash = HmacSha512(_hashSecret, rawData);

            bool isValid = string.Equals(computedHash, secureHash, StringComparison.OrdinalIgnoreCase);

            // Lấy orderId từ txnRef (format: "{orderId}_{yyyyMMddHHmmss}")
            int orderId = 0;
            if (!string.IsNullOrEmpty(txnRef))
            {
                var parts = txnRef.Split('_');
                int.TryParse(parts[0], out orderId);
            }

            return (isValid, responseCode, orderId);
        }

        private static string BuildRawData(SortedDictionary<string, string> p)
        {
            var sb = new StringBuilder();
            foreach (var (key, val) in p)
            {
                if (sb.Length > 0) sb.Append('&');
                sb.Append(key).Append('=').Append(val);
            }
            return sb.ToString();
        }

        private static string HmacSha512(string key, string data)
        {
            var keyBytes  = Encoding.UTF8.GetBytes(key);
            var dataBytes = Encoding.UTF8.GetBytes(data);
            using var hmac = new HMACSHA512(keyBytes);
            return Convert.ToHexString(hmac.ComputeHash(dataBytes)).ToLower();
        }
    }
}
