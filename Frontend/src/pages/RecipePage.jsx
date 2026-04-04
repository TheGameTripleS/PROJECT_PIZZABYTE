import { useEffect, useState, useRef } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useRecipeStore } from "../store/useRecipeStore";
import { useItemStore } from "../store/useItemStore";
import toast from "react-hot-toast";
import ConfirmDialog from "../components/ConfirmDialog";
import {
  ArrowLeftIcon,
  RefreshCwIcon,
  Trash2Icon,
  PlusCircleIcon,
  ChefHatIcon,
  SaveIcon,
} from "lucide-react";

function RecipePage() {
  const confirmDialogRef = useRef(null);
  const { sku } = useParams();
  const navigate = useNavigate();
  const { currentItem, fetchItem } = useItemStore();
  const [editingAmounts, setEditingAmounts] = useState({});
  const {
    currentItemRecipes,
    ingredients,
    loading,
    error,
    formData,
    setFormData,
    fetchRecipesForItem,
    fetchIngredients,
    addRecipeIngredient,
    updateRecipeIngredient,
    deleteRecipeIngredient,
  } = useRecipeStore();

  useEffect(() => {
    fetchItem(sku);
    fetchIngredients();
  }, [sku]);

  useEffect(() => {
    if (currentItem?.item_id) {
      fetchRecipesForItem(currentItem.item_id);
    }
  }, [currentItem?.item_id]);

  const handleAddIngredient = async (e) => {
    e.preventDefault();
    if (!formData.ing_id || !formData.ing_amount) {
      toast.error("Please select an ingredient and enter amount");
      return;
    }

    try {
      await addRecipeIngredient(currentItem.item_id, formData.ing_id, formData.ing_amount);
      // Refetch recipes after adding
      await fetchRecipesForItem(currentItem.item_id);
      toast.success("Ingredient added successfully!");
    } catch (error) {
      console.error("Error adding ingredient:", error);
      toast.error("Failed to add ingredient");
    }
  };

  const handleAmountChange = (rowId, value) => {
    setEditingAmounts({ ...editingAmounts, [rowId]: value });
  };

  const handleAmountBlur = async (rowId, originalAmount) => {
    const newAmount = editingAmounts[rowId];
    
    // If no change or empty, revert
    if (!newAmount || newAmount === originalAmount.toString()) {
      setEditingAmounts({ ...editingAmounts, [rowId]: undefined });
      return;
    }

    try {
      await updateRecipeIngredient(rowId, newAmount);
      // Clear the editing state
      setEditingAmounts({ ...editingAmounts, [rowId]: undefined });
      toast.success("Amount updated!");
    } catch (error) {
      console.error("Error updating amount:", error);
      toast.error("Failed to update amount");
      // Revert the input change
      setEditingAmounts({ ...editingAmounts, [rowId]: undefined });
    }
  };

  const handleDeleteIngredient = (recipe) => {
    const ingredientName = getIngredientName(recipe.ing_id);
    confirmDialogRef.current?.openConfirm({
      title: 'Remove Recipe Ingredient',
      message: `Are you sure you want to remove "${ingredientName}" from this recipe? This action cannot be undone.`,
      confirmText: 'Remove',
      cancelText: 'Cancel',
      isDangerous: true,
      onConfirm: async () => {
        try {
          await deleteRecipeIngredient(recipe.row_id);
          await fetchRecipesForItem(currentItem.item_id);
          toast.success("Ingredient removed successfully!");
        } catch (error) {
          console.error("Error deleting ingredient:", error);
          toast.error("Failed to remove ingredient");
        }
      },
    });
  };

  const getIngredientName = (ingId) => {
    const ing = ingredients.find((i) => i.ing_id === ingId);
    return ing ? ing.ing_name : "Unknown";
  };

  const getIngredientMeasure = (ingId) => {
    const ing = ingredients.find((i) => i.ing_id === ingId);
    return ing ? ing.meas : "";
  };

  const handleSaveRecipe = async () => {
    if (currentItemRecipes.length === 0) {
      toast.info("Add at least one ingredient to the recipe");
      return;
    }
    toast.success("Recipe saved successfully! ✨");
  };

  if (!currentItem) {
    return (
      <div className="container mx-auto px-4 py-8">
        <button onClick={() => navigate("/admin/items")} className="btn btn-ghost mb-8">
          <ArrowLeftIcon className="size-4 mr-2" /> Back to Items
        </button>
        <div className="alert alert-error">Item not found</div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8 max-w-4xl">
      {/* NAVIGATION HEADER */}
      <div className="flex items-center justify-between mb-8 pb-4 border-b">
        <button onClick={() => navigate(`/item/${sku}`)} className="btn btn-ghost">
          <ArrowLeftIcon className="size-4 mr-2" /> Back to Item
        </button>
        <button onClick={handleSaveRecipe} className="btn btn-success">
          <SaveIcon className="size-5 mr-2" /> Save Recipe
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* ITEM INFO */}
        <div className="lg:col-span-1">
          <div className="card bg-base-100 shadow-xl border border-base-200">
            <figure className="relative pt-[100%]">
              {currentItem?.image_url ? (
                <img
                  src={currentItem.image_url}
                  alt={currentItem.item_name}
                  className="absolute top-0 left-0 w-full h-full object-cover"
                />
              ) : (
                <div className="absolute top-0 left-0 w-full h-full flex items-center justify-center text-gray-500 font-medium bg-base-200">
                  No Image
                </div>
              )}
            </figure>

            <div className="card-body">
              <h2 className="card-title text-xl">{currentItem.item_name}</h2>
              <div className="space-y-2">
                <div className="flex justify-between">
                  <span className="text-gray-600">SKU:</span>
                  <span className="font-semibold">{currentItem.sku}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Price:</span>
                  <span className="font-semibold">${Number(currentItem.item_price).toFixed(2)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Category:</span>
                  <span className="font-semibold">{currentItem.category || "N/A"}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Size:</span>
                  <span className="font-semibold">{currentItem.size || "N/A"}</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* RECIPE MANAGEMENT */}
        <div className="lg:col-span-2">
          <div className="card bg-base-100 shadow-xl border border-base-200">
            <div className="card-body">
              <div className="flex items-center justify-between mb-6 border-b pb-4">
                <h2 className="card-title text-2xl flex items-center gap-2">
                  <ChefHatIcon className="size-6" />
                  Recipe
                </h2>
                <button className="btn btn-ghost btn-circle btn-sm" onClick={() => fetchRecipesForItem(currentItem.item_id)}>
                  <RefreshCwIcon className={`size-5 ${loading ? "animate-spin" : ""}`} />
                </button>
              </div>

              {error && <div className="alert alert-error mb-4">{error}</div>}

              {/* ADD INGREDIENT FORM */}
              <form onSubmit={handleAddIngredient} className="space-y-4 mb-6 p-4 bg-base-200 rounded-lg">
                <h3 className="font-semibold text-lg">Add New Ingredient</h3>

                <select
                  className="select select-bordered w-full"
                  value={formData.ing_id}
                  onChange={(e) => setFormData({ ...formData, ing_id: e.target.value })}
                  required
                >
                  <option value="">Select Ingredient</option>
                  {ingredients.map((ing) => (
                    <option key={ing.ing_id} value={ing.ing_id}>
                      {ing.ing_name} ({ing.weight} {ing.meas}) - ${Number(ing.ing_price).toFixed(2)}
                    </option>
                  ))}
                </select>

                <input
                  type="number"
                  className="input input-bordered w-full"
                  placeholder="Amount needed"
                  value={formData.ing_amount}
                  onChange={(e) => setFormData({ ...formData, ing_amount: e.target.value })}
                  required
                />

                <button
                  type="submit"
                  className="btn btn-primary w-full"
                  disabled={loading}
                >
                  <PlusCircleIcon className="size-5 mr-2" />
                  Add Ingredient
                </button>
              </form>

              {/* CURRENT RECIPE */}
              <div>
                <h3 className="font-semibold text-lg mb-4">Current Recipe Ingredients</h3>

                {loading && (
                  <div className="flex justify-center items-center py-8">
                    <div className="loading loading-spinner loading-lg text-primary" />
                  </div>
                )}

                {!loading && currentItemRecipes.length === 0 ? (
                  <div className="text-center py-8 opacity-60">
                    <p className="text-gray-500">No ingredients added yet</p>
                  </div>
                ) : (
                  !loading && (
                    <div className="overflow-x-auto">
                      <table className="table table-zebra w-full">
                        <thead>
                          <tr>
                            <th>Ingredient</th>
                            <th>Amount</th>
                            <th>Unit</th>
                            <th>Actions</th>
                          </tr>
                        </thead>
                        <tbody>
                          {currentItemRecipes.map((recipe) => (
                            <tr key={recipe.row_id}>
                              <td className="font-medium">{getIngredientName(recipe.ing_id)}</td>
                              <td>
                                <input
                                  type="number"
                                  className="input input-sm input-bordered w-20"
                                  value={editingAmounts[recipe.row_id] !== undefined ? editingAmounts[recipe.row_id] : recipe.ing_amount}
                                  onChange={(e) => handleAmountChange(recipe.row_id, e.target.value)}
                                  onBlur={(e) => handleAmountBlur(recipe.row_id, recipe.ing_amount)}
                                />
                              </td>
                              <td>{getIngredientMeasure(recipe.ing_id)}</td>
                              <td>
                                <button
                                  className="btn btn-sm btn-error btn-outline"
                                  onClick={() => handleDeleteIngredient(recipe)}
                                >
                                  <Trash2Icon className="size-4" />
                                </button>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  )
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
      <ConfirmDialog ref={confirmDialogRef} />
    </div>
  );
}

export default RecipePage;
