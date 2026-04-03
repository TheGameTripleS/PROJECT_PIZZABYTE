import { create } from 'zustand';
import axios from 'axios';

const BASE_URL = import.meta.env.VITE_API_URL || "";

export const useRecipeStore = create((set, get) => ({
  recipes: [],
  currentItemRecipes: [],
  ingredients: [],
  loading: false,
  error: null,
  formData: {
    ing_id: '',
    ing_amount: '',
  },

  setFormData: (data) => set({ formData: data }),

  // Fetch all recipes for a specific item
  fetchRecipesForItem: async (itemId) => {
    set({ loading: true, error: null });
    try {
      const url = `${BASE_URL}/api/recipes/item/${itemId}`;
      const response = await axios.get(url);
      set({ currentItemRecipes: response.data.data || [] });
      return response.data.data || [];
    } catch (error) {
      console.error('Error in fetchRecipesForItem:', error);
      set({ error: 'Failed to fetch recipes' });
      return [];
    } finally {
      set({ loading: false });
    }
  },

  // Fetch all ingredients
  fetchIngredients: async () => {
    try {
      const response = await axios.get(`${BASE_URL}/api/ingredients`);
      set({ ingredients: response.data.data || [] });
    } catch (error) {
      console.error('Error fetching ingredients:', error);
      set({ error: 'Failed to fetch ingredients' });
    }
  },

  // Add ingredient to recipe
  addRecipeIngredient: async (itemId, ing_id, ing_amount) => {
    set({ loading: true, error: null });
    try {
      const response = await axios.post(`${BASE_URL}/api/recipes`, {
        item_id: itemId,
        ing_id: parseInt(ing_id),
        ing_amount: parseInt(ing_amount),
      });
      
      // Clear form
      set({ formData: { ing_id: '', ing_amount: '' } });
      
      return response.data;
    } catch (error) {
      console.error('Error adding recipe ingredient:', error);
      set({ error: error.response?.data?.error || 'Failed to add ingredient to recipe' });
      throw error;
    } finally {
      set({ loading: false });
    }
  },

  // Update recipe ingredient amount
  updateRecipeIngredient: async (rowId, ing_amount) => {
    set({ loading: true, error: null });
    try {
      const response = await axios.put(`${BASE_URL}/api/recipes/${rowId}`, {
        ing_amount: parseInt(ing_amount),
      });
      
      // Refresh the current recipes list by updating the specific recipe
      const updated = get().currentItemRecipes.map((recipe) =>
        recipe.row_id === rowId ? response.data.data : recipe
      );
      set({ currentItemRecipes: updated });
      
      return response.data;
    } catch (error) {
      console.error('Error updating recipe ingredient:', error);
      set({ error: error.response?.data?.error || 'Failed to update recipe ingredient' });
      throw error;
    } finally {
      set({ loading: false });
    }
  },

  // Delete recipe ingredient
  deleteRecipeIngredient: async (rowId) => {
    set({ loading: true, error: null });
    try {
      await axios.delete(`${BASE_URL}/api/recipes/${rowId}`);
      
      const updated = get().currentItemRecipes.filter((recipe) => recipe.row_id !== rowId);
      set({ currentItemRecipes: updated });
      
      return true;
    } catch (error) {
      console.error('Error deleting recipe ingredient:', error);
      set({ error: error.response?.data?.error || 'Failed to delete recipe ingredient' });
      throw error;
    } finally {
      set({ loading: false });
    }
  },
}));
