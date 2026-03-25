import { useEffect, useState } from "react";
import { Trash2Icon, RefreshCwIcon, UsersIcon, IndianRupeeIcon } from "lucide-react";
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
  } = useStaffStore();

  const [rateInputs, setRateInputs] = useState({});

  useEffect(() => {
    fetchStaff();
  }, [fetchStaff]);

  const handleRateChange = (staffId, value) => {
    setRateInputs((prev) => ({ ...prev, [staffId]: value }));
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
        <div className="card-body grid grid-cols-1 md:grid-cols-4 gap-3">
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
            type="text"
            className="input input-bordered"
            placeholder="Position (Chef, Waiter...)"
            value={formData.position}
            onChange={(e) => setFormData({ ...formData, position: e.target.value })}
            required
          />
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

          <button type="submit" className="btn btn-primary md:col-span-4" disabled={loading}>
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
                <th>Position</th>
                <th>Hourly Rate</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {staff.map((person) => (
                <tr key={person.staff_id}>
                  <td>{person.staff_id}</td>
                  <td>{person.first_name} {person.last_name}</td>
                  <td>{person.position}</td>
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
                    <button
                      className="btn btn-sm btn-error btn-outline"
                      onClick={() => deleteStaff(person.staff_id)}
                    >
                      <Trash2Icon className="size-4" />
                    </button>
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

export default StaffPage;
