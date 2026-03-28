import { useEffect } from "react";
import { RefreshCwIcon, SaladIcon, Trash2Icon } from "lucide-react";
import { useIngredientStore } from "../store/useIngredientStore";

function IngredientsPage() {
  const {
    ingredients,
    loading,
    error,
    formData,
    setFormData,
    fetchIngredients,
    addIngredient,
    deleteIngredient,
  } = useIngredientStore();

  useEffect(() => {
    fetchIngredients();
  }, [fetchIngredients]);

  return (
    <main className="container mx-auto px-4 py-8">
      <div className="flex flex-col md:flex-row justify-between items-center gap-4 mb-8">
        <div>
          <h1 className="text-2xl font-bold">Ingredients Management</h1>
          <p className="text-base-content/70">Add and remove ingredients used in recipes.</p>
        </div>

        <button className="btn btn-ghost btn-circle" onClick={fetchIngredients}>
          <RefreshCwIcon className={`size-5 ${loading ? "animate-spin" : ""}`} />
        </button>
      </div>

      <form onSubmit={addIngredient} className="card bg-base-100 shadow-sm border border-base-content/10 mb-8">
        <div className="card-body grid grid-cols-1 md:grid-cols-4 gap-3">
          <input
            type="text"
            className="input input-bordered"
            placeholder="Ingredient name"
            value={formData.ing_name}
            onChange={(e) => setFormData({ ...formData, ing_name: e.target.value })}
            required
          />

          <input
            type="number"
            min="0"
            className="input input-bordered"
            placeholder="Weight"
            value={formData.weight}
            onChange={(e) => setFormData({ ...formData, weight: e.target.value })}
            required
          />

          <select
            className="select select-bordered"
            value={formData.meas}
            onChange={(e) => setFormData({ ...formData, meas: e.target.value })}
            required
          >
            <option value="" disabled>Select measure</option>
            <option value="g">g</option>
            <option value="ml">ml</option>
          </select>

          <input
            type="number"
            min="0"
            step="0.01"
            className="input input-bordered"
            placeholder="Price"
            value={formData.ing_price}
            onChange={(e) => setFormData({ ...formData, ing_price: e.target.value })}
            required
          />

          <button type="submit" className="btn btn-primary md:col-span-4" disabled={loading}>
            Add Ingredient
          </button>
        </div>
      </form>

      {error && <div className="alert alert-error mb-6">{error}</div>}

      {ingredients.length === 0 && !loading ? (
        <div className="flex flex-col justify-center items-center h-72 space-y-3 opacity-70">
          <div className="bg-base-100 rounded-full p-6">
            <SaladIcon className="size-12" />
          </div>
          <h3 className="text-xl font-semibold">No ingredients found</h3>
          <p>Add your first ingredient using the form above.</p>
        </div>
      ) : (
        <div className="overflow-x-auto bg-base-100 rounded-xl border border-base-content/10">
          <table className="table">
            <thead>
              <tr>
                <th>ID</th>
                <th>Name</th>
                <th>Weight</th>
                <th>Measure</th>
                <th>Price</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {ingredients.map((ingredient) => (
                <tr key={ingredient.ing_id}>
                  <td>{ingredient.ing_id}</td>
                  <td>{ingredient.ing_name}</td>
                  <td>{ingredient.weight}</td>
                  <td>{ingredient.meas}</td>
                  <td>{ingredient.ing_price}</td>
                  <td>
                    <button
                      className="btn btn-sm btn-error btn-outline"
                      onClick={() => deleteIngredient(ingredient.ing_id)}
                    >
                      <Trash2Icon className="size-4" />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </main>
  );
}

export default IngredientsPage;