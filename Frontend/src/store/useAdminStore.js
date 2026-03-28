import { create } from "zustand";
import axios from "axios";
import toast from "react-hot-toast";

const BASE_URL = import.meta.env.MODE === "development" ? "http://localhost:3000" : "";

export const useAdminStore = create((set, get) => ({
    isAdmin: false,
    serverRunId: null,

    initializeAdminSession: async () => {
        try {
            const response = await axios.get(`${BASE_URL}/api/meta/run-id`);
            const currentRunId = response.data?.runId;
            const storedRunId = localStorage.getItem("serverRunId");
            const storedAdmin = localStorage.getItem("isAdmin") === "true";

            if (storedAdmin && storedRunId && storedRunId === currentRunId) {
                set({ isAdmin: true, serverRunId: currentRunId });
                return;
            }

            localStorage.removeItem("isAdmin");
            if (currentRunId) localStorage.setItem("serverRunId", currentRunId);
            set({ isAdmin: false, serverRunId: currentRunId || null });
        } catch (_error) {
            localStorage.removeItem("isAdmin");
            set({ isAdmin: false, serverRunId: null });
        }
    },

    adminLogin: async (username, email) => {
        try {
            const response = await axios.post(`${BASE_URL}/api/auth/admin-login`, {
                username,
                email,
            });

            if (response.data.success) {
                const runId = get().serverRunId || localStorage.getItem("serverRunId");
                localStorage.setItem("isAdmin", "true");
                if (runId) localStorage.setItem("serverRunId", runId);
                set({ isAdmin: true });
                toast.success("Welcome, Admin!");
                return true;
            }
        } catch (error) {
            const msg = error.response?.data?.message || "Invalid credentials";
            toast.error(msg);
            return false;
        }
    },

    adminLogout: () => {
        localStorage.removeItem("isAdmin");
        set({ isAdmin: false });
        toast.success("Logged out");
    },
}));