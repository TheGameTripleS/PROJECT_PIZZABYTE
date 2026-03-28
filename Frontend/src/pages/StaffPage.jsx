import { useEffect, useState } from "react";
import { Trash2Icon, RefreshCwIcon, UsersIcon, IndianRupeeIcon, ChevronsUpDownIcon } from "lucide-react";
import { useStaffStore } from "../store/useStaffStore";

function StaffPage() {
  const {
    staff,
    loading,
    error,
    formData,
    setFormData,
    fetchStaff,
    addStaff,
    deleteStaff,
    updateStaffRate,
    fetchStaffRelations,
    relationByStaffId,
    relationLoadingByStaffId,
  } = useStaffStore();

  const [rateInputs, setRateInputs] = useState({});
  const [expandedStaffId, setExpandedStaffId] = useState(null);

  useEffect(() => {
    fetchStaff();
  }, [fetchStaff]);

  const handleRateChange = (staffId, value) => {
    setRateInputs((prev) => ({ ...prev, [staffId]: value }));
  };

  const toggleDetails = async (staffId) => {
    if (expandedStaffId === staffId) {
      setExpandedStaffId(null);
      return;
    }

    setExpandedStaffId(staffId);

    if (!relationByStaffId[staffId]) {
      await fetchStaffRelations(staffId);
    }
  };

  return (
    <main className="container mx-auto px-4 py-8">
      <div className="flex flex-col md:flex-row justify-between items-center gap-4 mb-8">
        <div>
          <h1 className="text-2xl font-bold">Staff Management</h1>
          <p className="text-base-content/70">Create, review, update and remove staff records.</p>
        </div>

        <button className="btn btn-ghost btn-circle" onClick={fetchStaff}>
          <RefreshCwIcon className={`size-5 ${loading ? "animate-spin" : ""}`} />
        </button>
      </div>

      <form onSubmit={addStaff} className="card bg-base-100 shadow-sm border border-base-content/10 mb-8">
        <div className="card-body grid grid-cols-1 md:grid-cols-5 gap-3">
          <input
            type="text"
            className="input input-bordered"
            placeholder="First name"
            value={formData.first_name}
            onChange={(e) => setFormData({ ...formData, first_name: e.target.value })}
            required
          />
          <input
            type="text"
            className="input input-bordered"
            placeholder="Last name"
            value={formData.last_name}
            onChange={(e) => setFormData({ ...formData, last_name: e.target.value })}
            required
          />
          <input
            type="email"
            className="input input-bordered"
            placeholder="Email"
            value={formData.email}
            onChange={(e) => setFormData({ ...formData, email: e.target.value })}
            required
          />
          <select
            className="select select-bordered"
            value={formData.position}
            onChange={(e) => setFormData({ ...formData, position: e.target.value })}
            required
          >
            <option value="" disabled>Select position</option>
            <option value="waiter">Waiter</option>
            <option value="chef">Chef</option>
            <option value="receptionist">Receptionist</option>
          </select>
          <div className="join">
            <span className="join-item btn btn-disabled"><IndianRupeeIcon className="size-4" /></span>
            <input
              type="number"
              min="0"
              step="0.01"
              className="input input-bordered join-item w-full"
              placeholder="Hourly rate"
              value={formData.hourly_rate}
              onChange={(e) => setFormData({ ...formData, hourly_rate: e.target.value })}
              required
            />
          </div>

          <button type="submit" className="btn btn-primary md:col-span-5" disabled={loading}>
            Add Staff Member
          </button>
        </div>
      </form>

      {error && <div className="alert alert-error mb-6">{error}</div>}

      {staff.length === 0 && !loading ? (
        <div className="flex flex-col justify-center items-center h-72 space-y-3 opacity-70">
          <div className="bg-base-100 rounded-full p-6">
            <UsersIcon className="size-12" />
          </div>
          <h3 className="text-xl font-semibold">No staff found</h3>
          <p>Add your first staff member using the form above.</p>
        </div>
      ) : (
        <div className="overflow-x-auto bg-base-100 rounded-xl border border-base-content/10">
          <table className="table">
            <thead>
              <tr>
                <th>ID</th>
                <th>Name</th>
                <th>Email</th>
                <th>Position</th>
                <th>Rota</th>
                <th>Hourly Rate</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {staff.map((person) => {
                const details = relationByStaffId[person.staff_id];
                const isExpanded = expandedStaffId === person.staff_id;
                const isDetailsLoading = relationLoadingByStaffId[person.staff_id];

                return (
                  <>
                    <tr key={person.staff_id}>
                      <td>{person.staff_id}</td>
                      <td>{person.first_name} {person.last_name}</td>
                      <td>{person.email || "-"}</td>
                      <td>{person.position}</td>
                      <td>{person.rota_count ?? 0}</td>
                      <td>
                        <div className="join">
                          <input
                            type="number"
                            min="0"
                            step="0.01"
                            className="input input-bordered input-sm join-item w-28"
                            value={rateInputs[person.staff_id] ?? person.hourly_rate ?? ""}
                            onChange={(e) => handleRateChange(person.staff_id, e.target.value)}
                          />
                          <button
                            className="btn btn-sm join-item"
                            onClick={() =>
                              updateStaffRate(
                                person.staff_id,
                                rateInputs[person.staff_id] ?? person.hourly_rate
                              )
                            }
                          >
                            Save
                          </button>
                        </div>
                      </td>
                      <td>
                        <div className="flex items-center gap-2">
                          <button
                            className="btn btn-sm btn-outline"
                            onClick={() => toggleDetails(person.staff_id)}
                          >
                            <ChevronsUpDownIcon className="size-4" />
                            {isExpanded ? "Hide" : "Details"}
                          </button>

                          <button
                            className="btn btn-sm btn-error btn-outline"
                            onClick={() => deleteStaff(person.staff_id)}
                          >
                            <Trash2Icon className="size-4" />
                          </button>
                        </div>
                      </td>
                    </tr>

                    {isExpanded && (
                      <tr>
                        <td colSpan={7}>
                          {isDetailsLoading ? (
                            <div className="py-4">Loading staff relations...</div>
                          ) : (
                            <div className="py-2">
                              <div className="border border-base-content/10 rounded-lg p-3">
                                <h3 className="font-semibold mb-2">Rota (Shifts)</h3>
                                {details?.rota?.length ? (
                                  <div className="overflow-x-auto">
                                    <table className="table table-xs">
                                      <thead>
                                        <tr>
                                          <th>Work Date</th>
                                          <th>Start</th>
                                          <th>End</th>
                                        </tr>
                                      </thead>
                                      <tbody>
                                        {details.rota.map((shift) => (
                                          <tr key={shift.rota_id}>
                                            <td>{shift.work_date?.slice(0, 10) || "-"}</td>
                                            <td>{shift.start_time ? new Date(shift.start_time).toLocaleString() : "-"}</td>
                                            <td>{shift.end_time ? new Date(shift.end_time).toLocaleString() : "-"}</td>
                                          </tr>
                                        ))}
                                      </tbody>
                                    </table>
                                  </div>
                                ) : (
                                  <p className="text-sm text-base-content/70">No rota records found.</p>
                                )}
                              </div>
                            </div>
                          )}
                        </td>
                      </tr>
                    )}
                  </>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </main>
  );
}

export default StaffPage;