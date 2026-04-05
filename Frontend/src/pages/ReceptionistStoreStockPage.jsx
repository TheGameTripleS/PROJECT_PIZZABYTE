import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import toast from "react-hot-toast";
import { ArrowLeftIcon, LogOutIcon, RefreshCwIcon } from "lucide-react";

const BASE_URL = import.meta.env.VITE_API_URL || "http://localhost:3000";

function ReceptionistStoreStockPage({ user, handleLogout }) {
  const navigate = useNavigate();
  const [ingredients, setIngredients] = useState([]);
  const [stockLogs, setStockLogs] = useState([]);
  const [loading, setLoading] = useState(false);

  const [formData, setFormData] = useState({
    ing_id: "",
    quantity: "",
  });

  const fetchIngredients = async () => {
    try {
      const response = await axios.get(`${BASE_URL}/receptionist/store-stock/ingredients`);
      const rows = response.data?.data || [];
      setIngredients(rows);
      if (!formData.ing_id && rows.length > 0) {
        setFormData((prev) => ({ ...prev, ing_id: String(rows[0].ing_id) }));
      }
    } catch (error) {
      console.error("Error in fetchIngredients:", error);
      toast.error(error.response?.data?.message || "Failed to fetch ingredients");
    }
  };

  const fetchStockLogs = async () => {
    if (!user?.staff_id) return;
    try {
      const response = await axios.get(`${BASE_URL}/receptionist/store-stock/logs/${user.staff_id}`);
      setStockLogs(response.data?.data || []);
    } catch (error) {
      console.error("Error in fetchStockLogs:", error);
      toast.error(error.response?.data?.message || "Failed to fetch stock logs");
    }
  };

  useEffect(() => {
    fetchIngredients();
    fetchStockLogs();
  }, [user?.staff_id]);

  const handlePurchase = async (e) => {
    e.preventDefault();
    if (!user?.staff_id) {
      toast.error("Receptionist session is missing staff id");
      return;
    }

    setLoading(true);
    try {
      await axios.post(`${BASE_URL}/receptionist/store-stock/purchase`, {
        staff_id: user.staff_id,
        ing_id: Number(formData.ing_id),
        quantity: Number(formData.quantity),
      });

      setFormData((prev) => ({ ...prev, quantity: "" }));
      await fetchStockLogs();
      toast.success("Stock added successfully");
    } catch (error) {
      console.error("Error in handlePurchase:", error);
      toast.error(error.response?.data?.message || "Failed to add stock");
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="container mx-auto px-4 py-8 space-y-6">
      <div className="flex flex-col md:flex-row items-center justify-between gap-3">
        <div className="text-center md:text-left">
          <h1 className="text-3xl font-bold">Store Stock</h1>
          <p className="text-base-content/70 mt-2">Buy ingredient quantity and record stock log entries.</p>
        </div>

        <div className="flex items-center gap-2">
          <button className="btn btn-outline" onClick={() => navigate("/reception")}> 
            <ArrowLeftIcon className="size-5" />
            Back
          </button>
          <button className="btn btn-outline btn-error" onClick={handleLogout}>
            <LogOutIcon className="size-5" />
            Logout
          </button>
        </div>
      </div>

      <form onSubmit={handlePurchase} className="card bg-base-100 border border-base-content/10 shadow-sm">
        <div className="card-body grid grid-cols-1 md:grid-cols-4 gap-3">
          <select
            className="select select-bordered md:col-span-2"
            value={formData.ing_id}
            onChange={(e) => setFormData((prev) => ({ ...prev, ing_id: e.target.value }))}
            required
          >
            {ingredients.length === 0 && <option value="">No ingredients available</option>}
            {ingredients.map((ingredient) => (
              <option key={ingredient.ing_id} value={ingredient.ing_id}>
                {ingredient.ing_name} ({ingredient.meas})
              </option>
            ))}
          </select>

          <input
            type="number"
            min="1"
            className="input input-bordered"
            placeholder="Quantity"
            value={formData.quantity}
            onChange={(e) => setFormData((prev) => ({ ...prev, quantity: e.target.value }))}
            required
          />

          <button type="submit" className="btn btn-secondary" disabled={loading}>
            {loading ? "Adding..." : "Add Stock"}
          </button>
        </div>
      </form>

      <div className="card bg-base-100 border border-base-content/10 shadow-sm">
        <div className="card-body">
          <div className="flex items-center justify-between">
            <h2 className="card-title text-lg">Recent Store Stock Logs</h2>
            <button className="btn btn-ghost btn-circle" onClick={fetchStockLogs}>
              <RefreshCwIcon className="size-5" />
            </button>
          </div>

          {stockLogs.length === 0 ? (
            <p className="text-base-content/70">No stock buying logs found yet.</p>
          ) : (
            <div className="overflow-x-auto">
              <table className="table table-sm">
                <thead>
                  <tr>
                    <th>Log ID</th>
                    <th>Ingredient</th>
                    <th>Quantity</th>
                    <th>Rota ID</th>
                    <th>Created At</th>
                  </tr>
                </thead>
                <tbody>
                  {stockLogs.map((row) => (
                    <tr key={row.log_id}>
                      <td>{row.log_id}</td>
                      <td>{row.ing_name}</td>
                      <td>{row.change_amount}</td>
                      <td>{row.rota_id}</td>
                      <td>{row.created_at ? new Date(row.created_at).toLocaleString() : "-"}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </main>
  );
}

export default ReceptionistStoreStockPage;
