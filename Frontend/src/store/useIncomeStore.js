import { create } from "zustand";
import axios from "axios";
import toast from "react-hot-toast";

const BASE_URL = import.meta.env.VITE_API_URL || "";

const getTodayDate = () => new Date().toISOString().split("T")[0];

export const useIncomeStore = create((set) => ({
  selectedDate: getTodayDate(),
  loading: false,
  error: null,
  totals: {
    totalIncome: 0,
    totalExpense: 0,
    totalProfit: 0,
  },
  completedPayments: [],

  setSelectedDate: (selectedDate) => set({ selectedDate }),

  fetchIncomeByDate: async (date) => {
    set({ loading: true, error: null });

    try {
      const response = await axios.get(`${BASE_URL}/api/income?date=${date}`);
      const payload = response.data?.data;

      set({
        totals: payload?.totals || {
          totalIncome: 0,
          totalExpense: 0,
          totalProfit: 0,
        },
        completedPayments: payload?.completedPayments || [],
      });
    } catch (error) {
      console.error("Error in fetchIncomeByDate function:", error);
      const message = error.response?.data?.message || "Failed to fetch income";
      set({ error: message });
      toast.error(message);
    } finally {
      set({ loading: false });
    }
  },
}));
