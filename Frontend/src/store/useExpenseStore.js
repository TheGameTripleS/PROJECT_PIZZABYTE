import { create } from "zustand";
import axios from "axios";
import toast from "react-hot-toast";

const BASE_URL = import.meta.env.MODE === "development" ? "http://localhost:3000" : "";

const getTodayDate = () => new Date().toISOString().split("T")[0];

export const useExpenseStore = create((set) => ({
  selectedDate: getTodayDate(),
  loading: false,
  error: null,
  totals: {
    ingredientExpense: 0,
    wageExpense: 0,
    totalExpense: 0,
  },
  ingredientLots: [],
  staffWages: [],

  setSelectedDate: (selectedDate) => set({ selectedDate }),

  fetchExpensesByDate: async (date) => {
    set({ loading: true, error: null });

    try {
      const response = await axios.get(`${BASE_URL}/api/expenses?date=${date}`);
      const payload = response.data?.data;

      set({
        totals: payload?.totals || {
          ingredientExpense: 0,
          wageExpense: 0,
          totalExpense: 0,
        },
        ingredientLots: payload?.ingredientLots || [],
        staffWages: payload?.staffWages || [],
      });
    } catch (error) {
      console.error("Error in fetchExpensesByDate function:", error);
      const message = error.response?.data?.message || "Failed to fetch expenses";
      set({ error: message });
      toast.error(message);
    } finally {
      set({ loading: false });
    }
  },
}));
