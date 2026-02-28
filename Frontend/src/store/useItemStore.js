import { create } from "zustand";
import axios from "axios";
import toast from "react-hot-toast";

const BASE_URL = import.meta.env.MODE === "development" ? "http://localhost:3000" : "";

export const useItemStore = create((set, get) => ({
  // items state
  items: [],
  loading: false,
  error: null,
  currentItem: null,
  searchTerm: "",

  // form state
  formData: {
    sku: "",
    item_name: "",
    category: "",
    size: "",
    item_price: "",
    image_url: "",
    status: "continued",
  },

  setSearchTerm: (term) => set({ searchTerm: term }),

  setFormData: (formData) => set({ formData }),
  
  resetForm: () => set({ 
    formData: { 
      sku: "", 
      item_name: "", 
      category: "", 
      size: "", 
      item_price: "", 
      image_url: "", 
      status: "continued"
    } 
  }),

  addItem: async (e) => {
    e.preventDefault();
    set({ loading: true });

    try {
      const { formData } = get(); 
      await axios.post(`${BASE_URL}/api/items`, formData);
      
      await get().fetchItems();
      get().resetForm();
      toast.success("Item added successfully");
      document.getElementById("add_item_modal").close();
    } catch (error) {
      console.error("Error in addItem function:", error);
      const errorMessage = error.response?.data?.message || "Something went wrong";
      toast.error(errorMessage);
    } finally {
      set({ loading: false });
    }
  },

  fetchItems: async () => {
    set({ loading: true });
    try {
      const { searchTerm } = get();
      
      const url = searchTerm 
        ? `${BASE_URL}/api/items?search=${encodeURIComponent(searchTerm)}`
        : `${BASE_URL}/api/items`;

      const response = await axios.get(url);
      set({ items: response.data.data, error: null });
    } catch (err) {
      if (err.status == 429) set({ error: "Rate limit exceeded" });
      else set({ error: "Failed to fetch items. Please try again." });
    } finally {
      set({ loading: false });
    }
  },

  deleteItem: async (sku) => {
    console.log("deleteItem function called", sku);
    set({ loading: true });
    try {
      await axios.delete(`${BASE_URL}/api/items/${sku}`);
      set((prev) => ({ items: prev.items.filter((item) => item.sku !== sku) }));
      toast.success("Item deleted successfully");
    } catch (error) {
      console.error("Error in deleteItem function:", error);
      toast.error("Something went wrong");
    } finally {
      set({ loading: false });
    }
  },

  fetchItem: async (sku) => {
    set({ loading: true });
    try {
      const response = await axios.get(`${BASE_URL}/api/items/${sku}`);
      set({
        currentItem: response.data.data,
        formData: response.data.data, // pre-fill form with current item data
        error: null,
      });
    } catch (error) {
      console.log("Error in fetchItem function", error);
      set({ error: "Something went wrong", currentItem: null });
    } finally {
      set({ loading: false });
    }
  },

  updateItem: async (sku) => {
    set({ loading: true });
    try {
      const { formData } = get();
      const response = await axios.put(`${BASE_URL}/api/items/${sku}`, formData);
      set({ currentItem: response.data.data });
      toast.success("Item updated successfully");
    } catch (error) {
      toast.error("Something went wrong");
      console.log("Error in updateItem function", error);
    } finally {
      set({ loading: false });
    }
  },
}));