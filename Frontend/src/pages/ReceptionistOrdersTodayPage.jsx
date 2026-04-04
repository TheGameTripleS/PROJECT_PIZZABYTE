import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import toast from "react-hot-toast";
import {
  ArrowLeftIcon,
  CheckCircle2Icon,
  LogOutIcon,
  RefreshCwIcon,
  ShoppingCartIcon,
} from "lucide-react";

const BASE_URL = import.meta.env.VITE_API_URL || "http://localhost:3000";

function ReceptionistOrdersTodayPage({ user, handleLogout }) {
  const navigate = useNavigate();
  const [pendingOrders, setPendingOrders] = useState([]);
  const [loading, setLoading] = useState(false);
  const [approvingOrderId, setApprovingOrderId] = useState(null);

  const staffId = useMemo(() => Number(user?.staff_id), [user?.staff_id]);

  const fetchPendingOrders = async () => {
    if (!Number.isInteger(staffId) || staffId <= 0) {
      return;
    }

    setLoading(true);
    try {
      const response = await axios.get(`${BASE_URL}/receptionist/orders/today/pending`, {
        params: {
          staff_id: staffId,
        },
      });

      setPendingOrders(response.data?.data || []);
    } catch (error) {
      console.error("Error in fetchPendingOrders:", error);
      toast.error(error.response?.data?.message || "Failed to fetch pending orders");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPendingOrders();
  }, [staffId]);

  const handleApprove = async (orderId) => {
    if (!Number.isInteger(staffId) || staffId <= 0) {
      toast.error("Receptionist session is missing staff id");
      return;
    }

    setApprovingOrderId(orderId);
    try {
      const response = await axios.post(`${BASE_URL}/receptionist/orders/${orderId}/approve`, {
        staff_id: staffId,
      });

      setPendingOrders((prev) => prev.filter((order) => order.order_id !== orderId));
      toast.success(
        `${response.data?.message || "Order approved"}. Income +$${Number(
          response.data?.data?.payment_amount || 0
        ).toFixed(2)}`
      );
    } catch (error) {
      console.error("Error in handleApprove:", error);
      toast.error(error.response?.data?.message || "Failed to approve order");
      await fetchPendingOrders();
    } finally {
      setApprovingOrderId(null);
    }
  };

  return (
    <main className="container mx-auto px-4 py-8 space-y-6">
      <div className="flex flex-col md:flex-row items-center justify-between gap-3">
        <div className="text-center md:text-left">
          <h1 className="text-3xl font-bold">Orders Today</h1>
          <p className="text-base-content/70 mt-2">
            Review pending orders and approve them to mark as completed and include them in income.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button className="btn btn-outline" onClick={() => navigate("/reception")}> 
            <ArrowLeftIcon className="size-5" />
            Back
          </button>
          <button className="btn btn-outline" onClick={fetchPendingOrders} disabled={loading}>
            <RefreshCwIcon className="size-5" />
            Refresh
          </button>
          <button className="btn btn-outline btn-error" onClick={handleLogout}>
            <LogOutIcon className="size-5" />
            Logout
          </button>
        </div>
      </div>

      <div className="card bg-base-100 border border-base-content/10 shadow-sm">
        <div className="card-body">
          <div className="flex items-center justify-between gap-3">
            <h2 className="card-title text-lg">Pending Orders ({pendingOrders.length})</h2>
            {Number.isInteger(staffId) && staffId > 0 ? (
              <p className="text-sm text-base-content/70">Approving as staff #{staffId}</p>
            ) : (
              <p className="text-sm text-error">Missing receptionist staff id</p>
            )}
          </div>

          {loading ? (
            <p className="text-base-content/70">Loading pending orders...</p>
          ) : pendingOrders.length === 0 ? (
            <div className="flex flex-col items-center text-center py-6 gap-2">
              <ShoppingCartIcon className="size-10" />
              <h3 className="text-lg font-semibold">No pending orders for today</h3>
              <p className="text-base-content/70">New orders will show up here for approval.</p>
            </div>
          ) : (
            <div className="space-y-3">
              {pendingOrders.map((order) => {
                const totalItems = Array.isArray(order.items)
                  ? order.items.reduce((sum, item) => sum + Number(item.quantity || 0), 0)
                  : 0;

                return (
                  <article
                    key={order.order_id}
                    className="rounded-xl border border-base-content/10 bg-base-100 p-4 space-y-3"
                  >
                    <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-2">
                      <div>
                        <h3 className="font-semibold text-lg">Order #{order.order_id}</h3>
                        <p className="text-sm text-base-content/70">
                          {order.customer_name} | {order.service_type} | {new Date(order.created_at).toLocaleString()}
                        </p>
                      </div>
                      <div className="text-sm">
                        <p>
                          <span className="font-semibold">Items:</span> {totalItems}
                        </p>
                        <p>
                          <span className="font-semibold">Amount:</span> ${Number(order.total_amount || 0).toFixed(2)}
                        </p>
                      </div>
                    </div>

                    <div className="flex flex-wrap gap-2">
                      {order.items.map((item) => (
                        <span key={`${order.order_id}-${item.item_id}`} className="badge badge-outline">
                          {item.item_name} x {item.quantity}
                        </span>
                      ))}
                    </div>

                    <div className="flex justify-end">
                      <button
                        className="btn btn-success"
                        disabled={approvingOrderId === order.order_id}
                        onClick={() => handleApprove(order.order_id)}
                      >
                        <CheckCircle2Icon className="size-5" />
                        {approvingOrderId === order.order_id ? "Approving..." : "Approve Order"}
                      </button>
                    </div>
                  </article>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </main>
  );
}

export default ReceptionistOrdersTodayPage;
