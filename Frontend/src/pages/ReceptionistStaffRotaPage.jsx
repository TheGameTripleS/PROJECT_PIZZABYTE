import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import { ArrowLeftIcon, LogOutIcon, RefreshCwIcon, UserRoundCogIcon } from "lucide-react";

const BASE_URL = import.meta.env.VITE_API_URL || "http://localhost:3000";

function ReceptionistStaffRotaPage({ user, handleLogout }) {
  const navigate = useNavigate();
  const receptionistStaffId = useMemo(() => Number(user?.staff_id || user?.id), [user?.staff_id, user?.id]);

  const [staffList, setStaffList] = useState([]);
  const [selectedStaffId, setSelectedStaffId] = useState("");
  const [rotaRows, setRotaRows] = useState([]);
  const [loading, setLoading] = useState(false);
  const [notice, setNotice] = useState({ type: "", message: "" });
  const [rotaForm, setRotaForm] = useState({
    work_date: "",
    start_time: "",
    end_time: "",
  });

  const selectedStaff = useMemo(
    () => staffList.find((staff) => String(staff.staff_id) === String(selectedStaffId)),
    [staffList, selectedStaffId]
  );

  const setInfo = (message) => setNotice({ type: "info", message });
  const setSuccess = (message) => setNotice({ type: "success", message });
  const setError = (message) => setNotice({ type: "error", message });

  const fetchAssignableStaff = async () => {
    setLoading(true);
    try {
      const response = await axios.get(`${BASE_URL}/receptionist/staff/assignable`);
      const list = response.data?.data || [];
      setStaffList(list);

      if (!selectedStaffId && list.length > 0) {
        setSelectedStaffId(String(list[0].staff_id));
      }
    } catch (error) {
      setError(error.response?.data?.message || "Failed to fetch staff list");
    } finally {
      setLoading(false);
    }
  };

  const fetchStaffRota = async (staffId) => {
    if (!staffId) {
      setRotaRows([]);
      return;
    }

    try {
      const response = await axios.get(`${BASE_URL}/receptionist/staff/${staffId}/rota`);
      setRotaRows(response.data?.data || []);
    } catch (error) {
      setError(error.response?.data?.message || "Failed to fetch rota");
    }
  };

  useEffect(() => {
    fetchAssignableStaff();
  }, []);

  useEffect(() => {
    fetchStaffRota(selectedStaffId);
  }, [selectedStaffId]);

  const handleAssignRota = async (event) => {
    event.preventDefault();

    if (!Number.isInteger(receptionistStaffId) || receptionistStaffId <= 0) {
      setError("Receptionist session is missing staff id");
      return;
    }

    if (!selectedStaffId) {
      setError("Select a staff member first");
      return;
    }

    setNotice({ type: "", message: "" });

    try {
      await axios.post(`${BASE_URL}/receptionist/staff/${selectedStaffId}/rota`, {
        receptionist_staff_id: receptionistStaffId,
        ...rotaForm,
      });

      setRotaForm({ work_date: "", start_time: "", end_time: "" });
      await fetchStaffRota(selectedStaffId);
      setSuccess("Shift assigned successfully.");
    } catch (error) {
      setError(error.response?.data?.message || "Failed to assign rota");
    }
  };

  const noticeClassName =
    notice.type === "error"
      ? "alert alert-error"
      : notice.type === "success"
      ? "alert alert-success"
      : "alert alert-info";

  return (
    <main className="container mx-auto px-4 py-8 space-y-6">
      <div className="flex flex-col md:flex-row items-center justify-between gap-3">
        <div className="text-center md:text-left">
          <h1 className="text-3xl font-bold">Staff Rota</h1>
          <p className="text-base-content/70 mt-2">
            Assign shift rota to non-receptionist staff.
          </p>
          <p className="text-sm text-base-content/60 mt-1">
            Signed in as receptionist #{Number.isInteger(receptionistStaffId) ? receptionistStaffId : "?"}
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button className="btn btn-outline" onClick={() => navigate("/reception")}>
            <ArrowLeftIcon className="size-5" />
            Back
          </button>
          <button className="btn btn-outline" onClick={fetchAssignableStaff} disabled={loading}>
            <RefreshCwIcon className={`size-5 ${loading ? "animate-spin" : ""}`} />
            Refresh
          </button>
          <button className="btn btn-outline btn-error" onClick={handleLogout}>
            <LogOutIcon className="size-5" />
            Logout
          </button>
        </div>
      </div>

      {notice.message ? (
        <div className={noticeClassName} role="status" aria-live="polite">
          <span>{notice.message}</span>
        </div>
      ) : null}

      <div className="card bg-base-100 border border-base-content/10 shadow-sm">
        <div className="card-body">
          <label className="label">
            <span className="label-text">Select Staff</span>
          </label>
          <select
            className="select select-bordered w-full max-w-md"
            value={selectedStaffId}
            onChange={(event) => setSelectedStaffId(event.target.value)}
          >
            {staffList.length === 0 ? <option value="">No staff found</option> : null}
            {staffList.map((staff) => (
              <option key={staff.staff_id} value={staff.staff_id}>
                {staff.first_name} {staff.last_name} ({staff.position})
              </option>
            ))}
          </select>
        </div>
      </div>

      <form onSubmit={handleAssignRota} className="card bg-base-100 border border-base-content/10 shadow-sm">
        <div className="card-body space-y-3">
          <h2 className="card-title">
            <UserRoundCogIcon className="size-5" />
            Assign Shift
          </h2>

          <p className="text-sm text-base-content/70">
            Allowed shift window is 09:00 to 17:00. Any shift outside this range will be rejected.
          </p>

          <input
            type="date"
            className="input input-bordered"
            value={rotaForm.work_date}
            onChange={(event) => setRotaForm((prev) => ({ ...prev, work_date: event.target.value }))}
            required
          />

          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            <input
              type="time"
              className="input input-bordered"
              value={rotaForm.start_time}
              onChange={(event) => setRotaForm((prev) => ({ ...prev, start_time: event.target.value }))}
              required
            />
            <input
              type="time"
              className="input input-bordered"
              value={rotaForm.end_time}
              onChange={(event) => setRotaForm((prev) => ({ ...prev, end_time: event.target.value }))}
              required
            />
          </div>

          <button type="submit" className="btn btn-primary" disabled={!selectedStaff}>
            Assign Rota
          </button>
        </div>
      </form>

      <div className="card bg-base-100 border border-base-content/10 shadow-sm">
        <div className="card-body">
          <h3 className="card-title text-lg">Assigned Rota</h3>

          {rotaRows.length === 0 ? (
            <p className="text-base-content/70">No rota records found for selected staff.</p>
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

export default ReceptionistStaffRotaPage;
