import { useNavigate, useParams } from "react-router-dom";
import { useItemStore } from "../store/useItemStore";
import { useEffect } from "react";
import { 
  ArrowLeftIcon, SaveIcon, Trash2Icon, Package2Icon, DollarSignIcon,
  ImageIcon, TagIcon, MaximizeIcon, ActivityIcon, BarcodeIcon
} from "lucide-react";
import { formatTitleCase, formatSKUBase, isSKUValid } from "../constants/formatters";

function ItemPage() {
  const { currentItem, formData, setFormData, loading, error, fetchItem, updateItem, deleteItem } = useItemStore();
  const navigate = useNavigate();
  const { sku: originalSku } = useParams();

  useEffect(() => {
    fetchItem(originalSku);
  }, [fetchItem, originalSku]);

  const handleDelete = async () => {
    if (window.confirm("Are you sure you want to delete this item?")) {
      await deleteItem(originalSku);
      navigate("/admin");
    }
  };

  const handleUpdate = async (e) => {
    e.preventDefault();
    const success = await updateItem(originalSku);
    if (success && formData.sku !== originalSku) {
      navigate(`/item/${formData.sku}`, { replace: true });
    }
  };

  const handleSizeChange = (e) => {
    const newSize = formatTitleCase(e.target.value);
    const firstLetter = newSize.charAt(0).toUpperCase();
    
    // Auto-update the 3rd part of the SKU if it exists
    let newSku = formData.sku || "";
    const parts = newSku.split("-");
    if (parts.length === 3 && firstLetter) {
      parts[2] = firstLetter;
      newSku = parts.join("-");
    }

    setFormData({ ...formData, size: newSize, sku: newSku });
  };

  if (loading) return <div className="flex justify-center items-center min-h-screen"><div className="loading loading-spinner loading-lg text-primary" /></div>;
  if (error) return <div className="container mx-auto px-4 py-8"><div className="alert alert-error">{error}</div><button onClick={() => navigate("/admin")} className="btn btn-ghost mt-4"><ArrowLeftIcon className="size-4 mr-2" /> Back to Menu</button></div>;

  return (
    <div className="container mx-auto px-4 py-8 max-w-5xl">
      <button onClick={() => navigate("/admin")} className="btn btn-ghost mb-8">
        <ArrowLeftIcon className="size-4 mr-2" /> Back to Menu
      </button>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* IMAGE PREVIEW */}
        <div className="rounded-2xl overflow-hidden shadow-xl bg-base-200 h-[400px] relative">
          {currentItem?.image_url ? (
            <img src={currentItem.image_url} alt={formData.item_name} className="absolute inset-0 w-full h-full object-cover" />
          ) : (
            <div className="absolute inset-0 flex flex-col items-center justify-center text-gray-500 font-medium">
              <ImageIcon className="size-12 opacity-50 mb-2" />
              <p>No Image Provided</p>
            </div>
          )}
        </div>

        {/* ITEM FORM */}
        <div className="card bg-base-100 shadow-xl border border-base-200">
          <div className="card-body">
            <h2 className="card-title text-2xl mb-6 border-b pb-4">Edit Menu Item</h2>

            <form onSubmit={handleUpdate} className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {/* SKU */}
                <div className="form-control col-span-1">
                  <label className="label"><span className="label-text font-medium text-warning">SKU</span></label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-base-content/50"><BarcodeIcon className="size-4" /></div>
                    <input 
                      type="text" 
                      className={`input input-bordered w-full pl-10 ${formData.sku && !isSKUValid(formData.sku, formData.size) ? "input-error" : "input-warning"}`} 
                      value={formData.sku || ""} 
                      onChange={(e) => setFormData({ ...formData, sku: formatSKUBase(e.target.value) })} 
                    />
                  </div>
                  {formData.sku && !isSKUValid(formData.sku, formData.size) && (
                    <span className="text-error text-[10px] mt-1">Must be 3 parts (e.g., A-B-{formData.size ? formData.size.charAt(0).toUpperCase() : "X"})</span>
                  )}
                </div>

                {/* ITEM NAME */}
                <div className="form-control col-span-2">
                  <label className="label"><span className="label-text font-medium">Item Name</span></label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-base-content/50"><Package2Icon className="size-4" /></div>
                    <input 
                      type="text" 
                      className="input input-bordered w-full pl-10" 
                      value={formData.item_name || ""} 
                      onChange={(e) => setFormData({ ...formData, item_name: formatTitleCase(e.target.value) })} 
                    />
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {/* CATEGORY */}
                <div className="form-control">
                  <label className="label"><span className="label-text font-medium">Category</span></label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-base-content/50"><TagIcon className="size-4" /></div>
                    <input 
                      type="text" 
                      className="input input-bordered w-full pl-10" 
                      value={formData.category || ""} 
                      onChange={(e) => setFormData({ ...formData, category: formatTitleCase(e.target.value) })} 
                    />
                  </div>
                </div>

                {/* SIZE */}
                <div className="form-control">
                  <label className="label"><span className="label-text font-medium">Size</span></label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-base-content/50"><MaximizeIcon className="size-4" /></div>
                    <input 
                      type="text" 
                      className="input input-bordered w-full pl-10" 
                      value={formData.size || ""} 
                      onChange={handleSizeChange} 
                    />
                  </div>
                </div>

                {/* PRICE */}
                <div className="form-control">
                  <label className="label"><span className="label-text font-medium">Price ($)</span></label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-base-content/50"><DollarSignIcon className="size-4" /></div>
                    <input 
                      type="number" step="0.01" 
                      className="input input-bordered w-full pl-10" 
                      value={formData.item_price || ""} 
                      onChange={(e) => setFormData({ ...formData, item_price: e.target.value })} 
                    />
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* STATUS */}
                <div className="form-control">
                  <label className="label"><span className="label-text font-medium">Status</span></label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-base-content/50"><ActivityIcon className="size-4" /></div>
                    <select 
                      className="select select-bordered w-full pl-10 font-medium" 
                      value={formData.status || "continued"} 
                      onChange={(e) => setFormData({ ...formData, status: e.target.value })}
                    >
                      <option value="continued">Continued</option>
                      <option value="hold">Hold</option>
                      <option value="discontinued">Discontinued</option>
                    </select>
                  </div>
                </div>

                {/* IMAGE URL */}
                <div className="form-control">
                  <label className="label"><span className="label-text font-medium">Image URL</span></label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-base-content/50"><ImageIcon className="size-4" /></div>
                    <input 
                      type="text" 
                      className="input input-bordered w-full pl-10" 
                      value={formData.image_url || ""} 
                      onChange={(e) => setFormData({ ...formData, image_url: e.target.value })} 
                    />
                  </div>
                </div>
              </div>

              {/* ACTIONS */}
              <div className="flex justify-between items-center mt-8 pt-6 border-t">
                <button type="button" onClick={handleDelete} className="btn btn-error btn-outline">
                  <Trash2Icon className="size-4 mr-2" /> Delete Item
                </button>
                <button
                  type="submit"
                  className="btn btn-primary px-8"
                  disabled={
                    loading || 
                    !isSKUValid(formData.sku, formData.size) || 
                    !formData.item_name || 
                    !formData.category || 
                    !formData.size || 
                    !formData.item_price
                  }
                >
                  {loading ? <span className="loading loading-spinner loading-sm" /> : <><SaveIcon className="size-4 mr-2" /> Save Changes</>}
                </button>
              </div>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
}

export default ItemPage;