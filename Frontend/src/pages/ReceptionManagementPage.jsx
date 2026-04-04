import { useEffect, useMemo, useState } from "react";
import axios from "axios";
import { KeyRoundIcon, RefreshCwIcon, UserRoundCogIcon } from "lucide-react";
import toast from "react-hot-toast";

const BASE_URL = import.meta.env.VITE_API_URL || "";

function ReceptionManagementPage() {
  const [receptionists, setReceptionists] = useState([]);
  const [selectedStaffId, setSelectedStaffId] = useState("");
  const [rotaRows, setRotaRows] = useState([]);
  const [loading, setLoading] = useState(false);

  const [passwordForm, setPasswordForm] = useState({ password: "", confirmPassword: "" });
  const [rotaForm, setRotaForm] = useState({ work_date: "", start_time: "", end_time: "" });

  const selectedReceptionist = useMemo(
    () => receptionists.find((r) => String(r.staff_id) === String(selectedStaffId)),
    [receptionists, selectedStaffId]
  );

  const fetchReceptionists = async () => {
    setLoading(true);
    try {
      const response = await axios.get(`${BASE_URL}/api/staff/receptionists`);
      const list = response.data?.data || [];
      setReceptionists(list);

      if (!selectedStaffId && list.length > 0) {
        setSelectedStaffId(String(list[0].staff_id));
      }
    } catch (error) {
      console.error("Error in fetchReceptionists function:", error);
      toast.error(error.response?.data?.message || "Failed to fetch receptionists");
    } finally {
      setLoading(false);
    }
  };

  const fetchReceptionistRota = async (staffId) => {
    if (!staffId) {
      setRotaRows([]);
      return;
    }

    try {
      const response = await axios.get(`${BASE_URL}/api/staff/${staffId}/rota`);
      setRotaRows(response.data?.data || []);
    } catch (error) {
      console.error("Error in fetchReceptionistRota function:", error);
      toast.error(error.response?.data?.message || "Failed to fetch rota");
    }
  };

  useEffect(() => {
    fetchReceptionists();
  }, []);

  useEffect(() => {
    fetchReceptionistRota(selectedStaffId);
  }, [selectedStaffId]);

  const handleSetPassword = async (e) => {
    e.preventDefault();

    if (!selectedStaffId) {
      toast.error("Select a receptionist first");
      return;
    }

    if (passwordForm.password !== passwordForm.confirmPassword) {
      toast.error("Passwords do not match");
      return;
    }

    try {
      await axios.post(`${BASE_URL}/api/staff/receptionists/${selectedStaffId}/password`, {
        password: passwordForm.password,
      });

      setPasswordForm({ password: "", confirmPassword: "" });
      toast.success("Password updated successfully");
    } catch (error) {
      console.error("Error in handleSetPassword function:", error);
      toast.error(error.response?.data?.message || "Failed to update password");
    }
  };

  const handleAssignRota = async (e) => {
    e.preventDefault();

    if (!selectedStaffId) {
      toast.error("Select a receptionist first");
      return;
    }

    try {
      await axios.post(`${BASE_URL}/api/staff/receptionists/${selectedStaffId}/rota`, rotaForm);
      setRotaForm({ work_date: "", start_time: "", end_time: "" });
      await fetchReceptionistRota(selectedStaffId);
      await fetchReceptionists();
      toast.success("Rota assigned successfully");
    } catch (error) {
      console.error("Error in handleAssignRota function:", error);
      toast.error(error.response?.data?.message || "Failed to assign rota");
    }
  };

  return (
    <main className="container mx-auto px-4 py-8 space-y-6">
      <div className="flex flex-col md:flex-row justify-between items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold">Reception Management</h1>
          <p className="text-base-content/70">Assign receptionist rota and set receptionist login password.</p>
        </div>
        <button className="btn btn-ghost btn-circle" onClick={fetchReceptionists}>
          <RefreshCwIcon className={`size-5 ${loading ? "animate-spin" : ""}`} />
        </button>
      </div>

      <div className="card bg-base-100 border border-base-content/10 shadow-sm">
        <div className="card-body">
          <label className="label">
            <span className="label-text">Select Receptionist</span>
          </label>
          <select
            className="select select-bordered w-full max-w-md"
            value={selectedStaffId}
            onChange={(e) => setSelectedStaffId(e.target.value)}
          >
            {receptionists.length === 0 && <option value="">No receptionists found</option>}
            {receptionists.map((staff) => (
              <option key={staff.staff_id} value={staff.staff_id}>
                {staff.first_name} {staff.last_name} (ID: {staff.staff_id})
              </option>
            ))}
          </select>
        </div>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
        <form onSubmit={handleSetPassword} className="card bg-base-100 border border-base-content/10 shadow-sm">
          <div className="card-body space-y-3">
            <h2 className="card-title">
              <KeyRoundIcon className="size-5" />
              Set Receptionist Password
            </h2>

            <input
              type="password"
              className="input input-bordered"
              placeholder="New password"
              value={passwordForm.password}
              onChange={(e) => setPasswordForm((prev) => ({ ...prev, password: e.target.value }))}
              required
            />

            <input
              type="password"
              className="input input-bordered"
              placeholder="Confirm password"
              value={passwordForm.confirmPassword}
              onChange={(e) => setPasswordForm((prev) => ({ ...prev, confirmPassword: e.target.value }))}
              required
            />

            <button type="submit" className="btn btn-primary" disabled={!selectedReceptionist}>
              Update Password
            </button>
          </div>
        </form>

        <form onSubmit={handleAssignRota} className="card bg-base-100 border border-base-content/10 shadow-sm">
          <div className="card-body space-y-3">
            <h2 className="card-title">
              <UserRoundCogIcon className="size-5" />
              Assign Rota
            </h2>

            <input
              type="date"
              className="input input-bordered"
              value={rotaForm.work_date}
              onChange={(e) => setRotaForm((prev) => ({ ...prev, work_date: e.target.value }))}
              required
            />

            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              <input
                type="time"
                className="input input-bordered"
                value={rotaForm.start_time}
                onChange={(e) => setRotaForm((prev) => ({ ...prev, start_time: e.target.value }))}
                required
              />
              <input
                type="time"
                className="input input-bordered"
                value={rotaForm.end_time}
                onChange={(e) => setRotaForm((prev) => ({ ...prev, end_time: e.target.value }))}
                required
              />
            </div>

            <button type="submit" className="btn btn-secondary" disabled={!selectedReceptionist}>
              Assign Shift
            </button>
          </div>
        </form>
      </div>

      <div className="card bg-base-100 border border-base-content/10 shadow-sm">
        <div className="card-body">
          <h3 className="card-title text-lg">Assigned Rota</h3>

          {rotaRows.length === 0 ? (
            <p className="text-base-content/70">No rota records found for selected receptionist.</p>
          ) : (
            <div className="overflow-x-auto">
              <table className="table table-sm">
                <thead>
                  <tr>
                    <th>Rota ID</th>
                    <th>Work Date</th>
                    <th>Start Time</th>
                    <th>End Time</th>
                  </tr>
                </thead>
                <tbody>
                  {rotaRows.map((row) => (
                    <tr key={row.rota_id}>
                      <td>{row.rota_id}</td>
                      <td>{row.work_date ? String(row.work_date).slice(0, 10) : "-"}</td>
                      <td>{row.start_time ? new Date(row.start_time).toLocaleString() : "-"}</td>
                      <td>{row.end_time ? new Date(row.end_time).toLocaleString() : "-"}</td>
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

export default ReceptionManagementPage;
