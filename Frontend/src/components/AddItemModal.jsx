import React from "react";
import { 
  DollarSignIcon, ImageIcon, Package2Icon, PlusCircleIcon, 
  BarcodeIcon, TagIcon, MaximizeIcon, ActivityIcon 
} from "lucide-react";
import { useItemStore } from "../store/useItemStore";
import { formatTitleCase, formatSKUBase, isSKUValid } from "../constants/formatters";

function AddItemModal() {
  const { addItem, formData, setFormData, loading } = useItemStore();
  const [showCustomCategory, setShowCustomCategory] = React.useState(false);

  const predefinedCategories = ["Pizza", "Pasta", "Drinks"];
  const predefinedSizes = ["Large", "Medium", "Small", "Regular"];

  React.useEffect(() => {
    // Show custom input if category is not in predefined list
    if (formData.category && !predefinedCategories.includes(formData.category)) {
      setShowCustomCategory(true);
    }
  }, []);

  const handleCategoryChange = (e) => {
    const value = e.target.value;
    if (value === "custom") {
      setShowCustomCategory(true);
      setFormData({ ...formData, category: "" });
    } else {
      setShowCustomCategory(false);
      setFormData({ ...formData, category: value });
    }
  };

  const handleCustomCategoryChange = (e) => {
    const customCategory = formatTitleCase(e.target.value);
    setFormData({ ...formData, category: customCategory });
  };

  const handleSizeChange = (e) => {
    const newSize = e.target.value;
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

  return (
    <dialog id="add_item_modal" className="modal">
      <div className="modal-box max-w-2xl">
        <form method="dialog">
          <button className="btn btn-sm btn-circle btn-ghost absolute right-2 top-2">X</button>
        </form>

        <h3 className="font-bold text-xl mb-6">Add New Menu Item</h3>

        <form onSubmit={addItem} className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {/* SKU */}
            <div className="form-control col-span-1">
              <label className="label"><span className="label-text font-medium">SKU</span></label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-base-content/50"><BarcodeIcon className="size-5" /></div>
                <input
                  type="text"
                  placeholder="SHORT_CAT-SHORT_NAME-S"
                  className={`input input-bordered w-full pl-10 ${formData.sku && !isSKUValid(formData.sku, formData.size) ? "input-error" : ""}`}
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
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-base-content/50"><Package2Icon className="size-5" /></div>
                <input
                  type="text"
                  placeholder="Enter item name"
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
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-base-content/50 z-10"><TagIcon className="size-5" /></div>
                <select
                  className="select select-bordered w-full pl-10"
                  value={showCustomCategory ? "custom" : (formData.category || "")}
                  onChange={handleCategoryChange}
                >
                  <option value="">Select a category</option>
                  {predefinedCategories.map((cat) => (
                    <option key={cat} value={cat}>{cat}</option>
                  ))}
                  <option value="custom">+ Enter custom category</option>
                </select>
              </div>
              {showCustomCategory && (
                <input
                  type="text"
                  placeholder="Enter custom category"
                  className="input input-bordered w-full mt-2"
                  value={formData.category || ""}
                  onChange={handleCustomCategoryChange}
                />
              )}
            </div>

            {/* SIZE */}
            <div className="form-control">
              <label className="label"><span className="label-text font-medium">Size</span></label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-base-content/50 z-10"><MaximizeIcon className="size-5" /></div>
                <select
                  className="select select-bordered w-full pl-10"
                  value={formData.size || ""}
                  onChange={handleSizeChange}
                >
                  <option value="">Select a size</option>
                  {predefinedSizes.map((s) => (
                    <option key={s} value={s}>{s}</option>
                  ))}
                </select>
              </div>
            </div>

            {/* PRICE */}
            <div className="form-control">
              <label className="label"><span className="label-text font-medium">Price ($)</span></label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-base-content/50"><DollarSignIcon className="size-5" /></div>
                <input
                  type="number"
                  min="0"
                  step="0.01"
                  placeholder="0.00"
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
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-base-content/50 z-10"><ActivityIcon className="size-5" /></div>
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
              <label className="label"><span className="label-text font-medium">Image URL (Optional)</span></label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-base-content/50"><ImageIcon className="size-5" /></div>
                <input
                  type="text"
                  placeholder="https://example.com/image.jpg"
                  className="input input-bordered w-full pl-10"
                  value={formData.image_url || ""}
                  onChange={(e) => setFormData({ ...formData, image_url: e.target.value })}
                />
              </div>
            </div>
          </div>

          <div className="modal-action mt-6">
            <form method="dialog">
              <button className="btn btn-ghost">Cancel</button>
            </form>
            <button
              type="submit"
              className="btn btn-primary min-w-[120px]"
              disabled={
                loading || 
                !isSKUValid(formData.sku, formData.size) || 
                !formData.item_name || 
                !formData.category || 
                !formData.size || 
                !formData.item_price
              }
            >
              {loading ? <span className="loading loading-spinner loading-sm" /> : <><PlusCircleIcon className="size-5 mr-2" /> Add Item</>}
            </button>
          </div>
        </form>
      </div>
      <form method="dialog" className="modal-backdrop"><button>close</button></form>
    </dialog>
  );
}

export default AddItemModal;