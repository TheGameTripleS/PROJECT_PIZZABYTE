import { create } from "zustand";
import axios from "axios";
import toast from "react-hot-toast";

const BASE_URL = import.meta.env.VITE_API_URL || "";

export const useStaffStore = create((set, get) => ({
  staff: [],
  relationByStaffId: {},
  relationLoadingByStaffId: {},
  loading: false,
  error: null,

  formData: {
    first_name: "",
    last_name: "",
    email: "",
    password: "",
    position: "",
    hourly_rate: "",
  },

  setFormData: (formData) => set({ formData }),

  resetForm: () =>
    set({
      formData: {
        first_name: "",
        last_name: "",
        email: "",
        password: "",
        position: "",
        hourly_rate: "",
      },
    }),

  fetchStaff: async () => {
    set({ loading: true, error: null });
    try {
      const response = await axios.get(`${BASE_URL}/api/staff`);
      set({ staff: response.data.data || [] });
    } catch (error) {
      console.error("Error in fetchStaff function:", error);
      set({ error: "Failed to fetch staff" });
    } finally {
      set({ loading: false });
    }
  },

  fetchStaffRelations: async (staffId) => {
    set((prev) => ({
      relationLoadingByStaffId: {
        ...prev.relationLoadingByStaffId,
        [staffId]: true,
      },
    }));

    try {
      const response = await axios.get(`${BASE_URL}/api/staff/${staffId}/relations`);
      const details = response.data?.data || { rota: [], summary: { rota_count: 0 } };

      set((prev) => ({
        relationByStaffId: {
          ...prev.relationByStaffId,
          [staffId]: details,
        },
      }));
    } catch (error) {
      console.error("Error in fetchStaffRelations function:", error);
      toast.error(error.response?.data?.message || "Failed to fetch staff relations");
    } finally {
      set((prev) => ({
        relationLoadingByStaffId: {
          ...prev.relationLoadingByStaffId,
          [staffId]: false,
        },
      }));
    }
  },

  addStaff: async (e) => {
    e.preventDefault();
    set({ loading: true });

    try {
      const { formData } = get();
      await axios.post(`${BASE_URL}/api/staff`, {
        ...formData,
        password: formData.position === "receptionist" ? formData.password || null : null,
        hourly_rate: Number(formData.hourly_rate),
      });

      await get().fetchStaff();
      get().resetForm();
      toast.success("Staff added successfully");
    } catch (error) {
      console.error("Error in addStaff function:", error);
      const errorMessage = error.response?.data?.message || "Something went wrong";
      toast.error(errorMessage);
    } finally {
      set({ loading: false });
    }
  },

  deleteStaff: async (staffId) => {
    set({ loading: true });
    try {
      await axios.delete(`${BASE_URL}/api/staff/${staffId}`);
      set((prev) => ({
        staff: prev.staff.filter((person) => person.staff_id !== staffId),
      }));
      toast.success("Staff deleted successfully");
    } catch (error) {
      console.error("Error in deleteStaff function:", error);
      toast.error(error.response?.data?.message || "Something went wrong");
    } finally {
      set({ loading: false });
    }
  },

  updateStaffMember: async (staffId, updates) => {
    set({ loading: true });
    try {
      const payload = {
        first_name: updates.first_name?.trim(),
        last_name: updates.last_name?.trim(),
        email: updates.email?.trim(),
        position: updates.position,
        hourly_rate:
          updates.hourly_rate === "" || updates.hourly_rate === null || updates.hourly_rate === undefined
            ? undefined
            : Number(updates.hourly_rate),
      };

      const response = await axios.put(`${BASE_URL}/api/staff/${staffId}`, payload);

      const updated = response.data.data;

      set((prev) => ({
        staff: prev.staff.map((person) =>
          person.staff_id === staffId ? updated : person
        ),
      }));

      toast.success("Staff updated");
    } catch (error) {
      console.error("Error in updateStaffMember function:", error);
      toast.error(error.response?.data?.message || "Something went wrong");
    } finally {
      set({ loading: false });
    }
  },

  updateStaffPassword: async (staffId, password, position) => {
    set({ loading: true });
    try {
      await axios.put(`${BASE_URL}/api/staff/${staffId}`, {
        password: password.trim(),
        position,
      });

      toast.success("Password updated");
    } catch (error) {
      console.error("Error in updateStaffPassword function:", error);
      toast.error(error.response?.data?.message || "Something went wrong");
      throw error;
    } finally {
      set({ loading: false });
    }
  },
}));
