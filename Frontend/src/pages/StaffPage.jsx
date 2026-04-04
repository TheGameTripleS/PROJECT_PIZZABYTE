import { Fragment, useEffect, useState } from "react";
import {
  Trash2Icon,
  RefreshCwIcon,
  UsersIcon,
  IndianRupeeIcon,
  ChevronsUpDownIcon,
  KeyRoundIcon,
} from "lucide-react";
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
    updateStaffMember,
    updateStaffPassword,
    fetchStaffRelations,
    relationByStaffId,
    relationLoadingByStaffId,
  } = useStaffStore();

  const [staffInputs, setStaffInputs] = useState({});
  const [expandedStaffId, setExpandedStaffId] = useState(null);
  const [passwordModal, setPasswordModal] = useState({
    isOpen: false,
    staffId: null,
    name: "",
    position: "",
    password: "",
    confirmPassword: "",
  });

  useEffect(() => {
    fetchStaff();
  }, [fetchStaff]);

  useEffect(() => {
    setStaffInputs(
      Object.fromEntries(
        staff.map((person) => [
          person.staff_id,
          {
            first_name: person.first_name || "",
            last_name: person.last_name || "",
            email: person.email || "",
            position: String(person.position || "").toLowerCase(),
            hourly_rate: person.hourly_rate ?? "",
          },
        ]),
      ),
    );
  }, [staff]);

  const handleStaffFieldChange = (staffId, field, value) => {
    setStaffInputs((prev) => ({
      ...prev,
      [staffId]: {
        ...(prev[staffId] || {}),
        [field]: value,
      },
    }));
  };

  const handleCreatePositionChange = (value) => {
    setFormData({
      ...formData,
      position: value,
      password: value === "receptionist" ? formData.password : "",
    });
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

  const handleSaveStaff = async (staffId) => {
    const input = staffInputs[staffId];

    if (!input) {
      return;
    }

    await updateStaffMember(staffId, input);
  };

  const openPasswordModal = (person) => {
    const rowPosition = staffInputs[person.staff_id]?.position || String(person.position || "").toLowerCase();
    setPasswordModal({
      isOpen: true,
      staffId: person.staff_id,
      name: `${person.first_name} ${person.last_name}`.trim(),
      position: rowPosition,
      password: "",
      confirmPassword: "",
    });
  };

  const closePasswordModal = () => {
    setPasswordModal({
      isOpen: false,
      staffId: null,
      name: "",
      position: "",
      password: "",
      confirmPassword: "",
    });
  };

  const handlePasswordSubmit = async (event) => {
    event.preventDefault();

    if (passwordModal.password.length < 8) {
      return;
    }

    if (passwordModal.password !== passwordModal.confirmPassword) {
      return;
    }

    try {
      await updateStaffPassword(passwordModal.staffId, passwordModal.password, passwordModal.position);
      closePasswordModal();
    } catch {
      return;
    }
  };

  const getPasswordValidationMessage = () => {
    if (!passwordModal.password && !passwordModal.confirmPassword) {
      return "";
    }

    if (passwordModal.password.length < 8) {
      return "Password must be at least 8 characters long.";
    }

    if (passwordModal.password !== passwordModal.confirmPassword) {
      return "Passwords do not match.";
    }

    return "";
  };

  const passwordValidationMessage = getPasswordValidationMessage();

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
        <div className="card-body grid grid-cols-1 md:grid-cols-6 gap-3">
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
            onChange={(e) => handleCreatePositionChange(e.target.value)}
            required
          >
            <option value="" disabled>
              Select position
            </option>
            <option value="waiter">Waiter</option>
            <option value="chef">Chef</option>
            <option value="receptionist">Receptionist</option>
          </select>
          {formData.position === "receptionist" ? (
            <input
              type="password"
              className="input input-bordered"
              placeholder="Receptionist password"
              value={formData.password}
              onChange={(e) => setFormData({ ...formData, password: e.target.value })}
              required
            />
          ) : (
            <div className="flex items-center rounded-lg border border-dashed border-base-content/20 px-4 text-sm text-base-content/60">
              Password is only required for receptionists.
            </div>
          )}
          <div className="join">
            <span className="join-item btn btn-disabled">
              <IndianRupeeIcon className="size-4" />
            </span>
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

          <button type="submit" className="btn btn-primary md:col-span-6" disabled={loading}>
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
                const currentPosition =
                  staffInputs[person.staff_id]?.position || String(person.position || "").toLowerCase();
                const canUpdatePassword = currentPosition === "receptionist";

                return (
                  <Fragment key={person.staff_id}>
                    <tr>
                      <td>{person.staff_id}</td>
                      <td>
                        <div className="flex flex-col gap-2 min-w-44">
                          <input
                            type="text"
                            className="input input-bordered input-sm"
                            value={staffInputs[person.staff_id]?.first_name ?? ""}
                            onChange={(e) => handleStaffFieldChange(person.staff_id, "first_name", e.target.value)}
                          />
                          <input
                            type="text"
                            className="input input-bordered input-sm"
                            value={staffInputs[person.staff_id]?.last_name ?? ""}
                            onChange={(e) => handleStaffFieldChange(person.staff_id, "last_name", e.target.value)}
                          />
                        </div>
                      </td>
                      <td>
                        <input
                          type="email"
                          className="input input-bordered input-sm min-w-52"
                          value={staffInputs[person.staff_id]?.email ?? ""}
                          onChange={(e) => handleStaffFieldChange(person.staff_id, "email", e.target.value)}
                        />
                      </td>
                      <td>
                        <select
                          className="select select-bordered select-sm min-w-36"
                          value={currentPosition}
                          onChange={(e) => handleStaffFieldChange(person.staff_id, "position", e.target.value)}
                        >
                          <option value="waiter">Waiter</option>
                          <option value="chef">Chef</option>
                          <option value="receptionist">Receptionist</option>
                        </select>
                      </td>
                      <td>{person.rota_count ?? 0}</td>
                      <td>
                        <div className="join">
                          <input
                            type="number"
                            min="0"
                            step="0.01"
                            className="input input-bordered input-sm join-item w-28"
                            value={staffInputs[person.staff_id]?.hourly_rate ?? ""}
                            onChange={(e) => handleStaffFieldChange(person.staff_id, "hourly_rate", e.target.value)}
                          />
                        </div>
                      </td>
                      <td>
                        <div className="flex items-center gap-2">
                          <button className="btn btn-sm" onClick={() => handleSaveStaff(person.staff_id)}>
                            Save
                          </button>
                          <button className="btn btn-sm btn-outline" onClick={() => toggleDetails(person.staff_id)}>
                            <ChevronsUpDownIcon className="size-4" />
                            {isExpanded ? "Hide" : "Details"}
                          </button>
                          {canUpdatePassword ? (
                            <button
                              className="btn btn-sm btn-outline btn-secondary"
                              onClick={() => openPasswordModal(person)}
                            >
                              <KeyRoundIcon className="size-4" />
                              Update Password
                            </button>
                          ) : null}
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
                  </Fragment>
                );
              })}
            </tbody>
          </table>
        </div>
      )}

      {passwordModal.isOpen ? (
        <dialog className="modal modal-open">
          <div className="modal-box">
            <h3 className="text-lg font-semibold">Update Receptionist Password</h3>
            <p className="mt-1 text-sm text-base-content/70">{passwordModal.name || "Receptionist"}</p>

            <form className="mt-6 space-y-4" onSubmit={handlePasswordSubmit}>
              <label className="form-control">
                <span className="label-text mb-2">New password</span>
                <input
                  type="password"
                  className="input input-bordered"
                  value={passwordModal.password}
                  onChange={(e) =>
                    setPasswordModal((prev) => ({
                      ...prev,
                      password: e.target.value,
                    }))
                  }
                  required
                />
              </label>

              <label className="form-control">
                <span className="label-text mb-2">Confirm password</span>
                <input
                  type="password"
                  className="input input-bordered"
                  value={passwordModal.confirmPassword}
                  onChange={(e) =>
                    setPasswordModal((prev) => ({
                      ...prev,
                      confirmPassword: e.target.value,
                    }))
                  }
                  required
                />
              </label>

              {passwordValidationMessage ? (
                <p className="text-sm text-error">{passwordValidationMessage}</p>
              ) : null}

              <div className="modal-action">
                <button type="button" className="btn btn-ghost" onClick={closePasswordModal}>
                  Cancel
                </button>
                <button type="submit" className="btn btn-primary" disabled={Boolean(passwordValidationMessage)}>
                  Update Password
                </button>
              </div>
            </form>
          </div>
          <form method="dialog" className="modal-backdrop">
            <button onClick={closePasswordModal}>close</button>
          </form>
        </dialog>
      ) : null}
    </main>
  );
}

export default StaffPage;
