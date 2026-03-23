import { create } from "zustand";
import axios from "axios";
import toast from "react-hot-toast";

const BASE_URL = import.meta.env.MODE === "development" ? "http://localhost:3000" : "";

export const useAdminStore = create((set) => ({
    // Persist login across page refreshes via localStorage
    isAdmin: localStorage.getItem("isAdmin") === "true",

    adminLogin: async (username, email) => {
        try {
            const response = await axios.post(`${BASE_URL}/api/auth/admin-login`, {
                username,
                email,
            });

            if (response.data.success) {
                localStorage.setItem("isAdmin", "true");
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
