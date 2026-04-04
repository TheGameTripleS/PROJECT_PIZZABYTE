import { create } from "zustand";
import axios from "axios";
import toast from "react-hot-toast";

const BASE_URL = import.meta.env.VITE_API_URL || "";

export const useIngredientStore = create((set, get) => ({
  ingredients: [],
  loading: false,
  error: null,

  formData: {
    ing_name: "",
    weight: "",
    meas: "",
    ing_price: "",
  },

  setFormData: (formData) => set({ formData }),

  resetForm: () =>
    set({
      formData: {
        ing_name: "",
        weight: "",
        meas: "",
        ing_price: "",
      },
    }),

  fetchIngredients: async () => {
    set({ loading: true, error: null });
    try {
      const response = await axios.get(`${BASE_URL}/api/ingredients`);
      set({ ingredients: response.data.data || [] });
    } catch (error) {
      console.error("Error in fetchIngredients function:", error);
      set({ error: "Failed to fetch ingredients" });
    } finally {
      set({ loading: false });
    }
  },

  addIngredient: async (e) => {
    e.preventDefault();
    set({ loading: true });

    try {
      const { formData } = get();

      await axios.post(`${BASE_URL}/api/ingredients`, {
        ...formData,
        weight: Number(formData.weight),
        ing_price: Number(formData.ing_price),
      });

      await get().fetchIngredients();
      get().resetForm();
      toast.success("Ingredient added successfully");
    } catch (error) {
      console.error("Error in addIngredient function:", error);
      const errorMessage = error.response?.data?.message || "Something went wrong";
      toast.error(errorMessage);
    } finally {
      set({ loading: false });
    }
  },

  deleteIngredient: async (ingId) => {
    set({ loading: true });

    try {
      await axios.delete(`${BASE_URL}/api/ingredients/${ingId}`);
      set((prev) => ({
        ingredients: prev.ingredients.filter((ingredient) => ingredient.ing_id !== ingId),
      }));
      toast.success("Ingredient deleted successfully");
    } catch (error) {
      console.error("Error in deleteIngredient function:", error);
      toast.error(error.response?.data?.message || "Something went wrong");
    } finally {
      set({ loading: false });
    }
  },
}));