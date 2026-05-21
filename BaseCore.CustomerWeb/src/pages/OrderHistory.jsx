import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { orderService } from '../services/order/orderService';
import styles from './OrderHistory.module.css'; 

export default function OrderHistory() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);

  const fetchOrders = async () => {
    try {
      setLoading(true);
      const data = await orderService.getAll(); 
      setOrders(Array.isArray(data) ? data : data.items || []);
    } catch (error) {
      console.error('Lỗi tải đơn hàng:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (user) fetchOrders();
  }, [user]);

  const handleCancelOrder = async (orderId) => {
    if (window.confirm('Bạn có chắc chắn muốn hủy đơn hàng này không?')) {
      try {
        await orderService.cancel(orderId);
        alert('Hủy đơn thành công!');
        fetchOrders(); 
      } catch (error) {
        alert(error.message || 'Không thể hủy đơn hàng');
      }
    }
  };

  const renderStatus = (status) => {
    const map = {
      WaitingDeposit: { cls: styles.statusWaiting, label: '⏳ Chờ đặt cọc' },
      DepositPaid:    { cls: styles.statusDeposit, label: '💳 Đã đặt cọc' },
      Processing:     { cls: styles.statusPending, label: '⚙️ Đang xử lý' },
      Shipping:       { cls: styles.statusShipping, label: '🚚 Đang giao hàng' },
      Completed:      { cls: styles.statusCompleted, label: '✅ Hoàn thành' },
      Cancelled:      { cls: styles.statusCancelled, label: '❌ Đã hủy' },
      Pending:        { cls: styles.statusPending, label: '⏳ Đang chờ duyệt' },
    };
    const s = map[status] || { cls: '', label: status };
    return <span className={`${styles.statusBadge} ${s.cls}`}>{s.label}</span>;
  };

  if (!user) return <div className={styles.message}>Vui lòng đăng nhập để xem đơn hàng.</div>;
  if (loading) return <div className={styles.message}>Đang tải lịch sử đơn hàng...</div>;

  return (
    <main className={styles.page}>
      <h1 className={styles.title}>Đơn hàng của tôi</h1>
      
      {orders.length === 0 ? (
        <p>Bạn chưa có đơn hàng nào. <Link to="/products">Đi mua cá ngay!</Link></p>
      ) : (
        <div className={styles.tableWrapper}>
          <table className={styles.table}>
            <thead>
              <tr>
                <th>Mã Đơn</th>
                <th>Ngày đặt</th>
                <th>Tổng tiền</th>
                <th>Trạng thái</th>
                <th>Hành động</th>
              </tr>
            </thead>
            <tbody>
              {orders.map(order => (
                <tr key={order.id}>
                  <td className={styles.orderId}>#{order.id}</td>
                  <td>{new Date(order.orderDate).toLocaleString('vi-VN')}</td>
                  <td className={styles.totalAmount}>
                    {order.totalAmount.toLocaleString('vi-VN')}đ
                  </td>
                  <td>{renderStatus(order.status)}</td>
                  <td className={styles.actionCell}>
                    {order.status === 'WaitingDeposit' && (
                      <button
                        onClick={() => navigate(`/payment/${order.id}`)}
                        className={styles.btnPay}
                      >
                        Thanh toán
                      </button>
                    )}
                    {order.status === 'WaitingDeposit' &&
                      (Date.now() - new Date(order.orderDate).getTime()) < 3 * 60 * 60 * 1000 && (
                      <button
                        onClick={() => handleCancelOrder(order.id)}
                        className={styles.btnCancel}
                      >
                        Hủy đơn
                      </button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </main>
  );
}