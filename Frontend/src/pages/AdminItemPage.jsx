import { useItemStore } from '../store/useItemStore'
import { useEffect } from 'react'
import { PackageIcon, PlusCircleIcon, RefreshCwIcon, SearchIcon } from "lucide-react";
import ItemCard from "../components/ItemCard";
import AddItemModal from '../components/AddItemModal';

function AdminItemPage() {
  const { items, loading, error, fetchItems, searchTerm, setSearchTerm } = useItemStore();

  useEffect(() => {
    const delayDebounceFn = setTimeout(() => {
      fetchItems();
    }, 300);

    return () => clearTimeout(delayDebounceFn);
  }, [searchTerm, fetchItems]);

  const filteredItems = items.filter((item) => {
    const search = searchTerm.toLowerCase().trim();

    if (!search) return true;

    const nameMatch = item.item_name?.toLowerCase().includes(search);
    const skuMatch = item.sku?.toLowerCase().includes(search);

    return nameMatch || skuMatch;
  });

  return (
    <main className="container mx-auto px-4 py-8">
      <div className="flex flex-col md:flex-row justify-between items-center gap-4 mb-8">
        <div className="w-full md:w-auto">
          <h1 className="text-2xl font-bold">Items Management</h1>
          <p className="text-base-content/70">Add, edit and delete menu items.</p>
        </div>

        <div className="flex gap-2 w-full md:w-auto">
          <button
            className="btn btn-primary flex-1 md:flex-none"
            onClick={() => document.getElementById("add_item_modal").showModal()}
          >
            <PlusCircleIcon className="size-5 mr-2" />
            Add Item
          </button>
          <button className="btn btn-ghost btn-circle" onClick={fetchItems}>
            <RefreshCwIcon className={`size-5 ${loading ? "animate-spin" : ""}`} />
          </button>
        </div>
      </div>

      <div className="relative w-full md:w-96 mb-6">
        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-base-content/50">
          <SearchIcon className="size-5" />
        </div>
        <input
          type="text"
          placeholder="Search items, SKUs, or categories..."
          className="input input-bordered w-full pl-10 focus:input-primary shadow-sm"
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
        />
      </div>

      <AddItemModal />

      {error && <div className="alert alert-error mb-8">{error}</div>}

      {filteredItems.length === 0 && !loading && (
        <div className="flex flex-col justify-center items-center h-96 space-y-4 opacity-60">
          <div className="bg-base-200 rounded-full p-8">
            <PackageIcon className="size-16" />
          </div>
          <div className="text-center space-y-2">
            <h3 className="text-2xl font-semibold">No items match your search</h3>
            <p className="max-w-sm">Try using different keywords or add a new item.</p>
          </div>
        </div>
      )}

      {items.length === 0 && !loading && (
        <div className="flex flex-col justify-center items-center h-96 space-y-4">
          <div className="bg-base-100 rounded-full p-6">
            <PackageIcon className="size-12" />
          </div>
          <div className="text-center space-y-2">
            <h3 className="text-2xl font-semibold ">No items found</h3>
            <p className="text-gray-500 max-w-sm">
              Get started by adding your first item to the inventory
            </p>
          </div>
        </div>
      )}

      {loading ? (
        <div className="flex justify-center items-center h-64">
          <div className="loading loading-spinner loading-lg" />
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {items.map((item) => (
            <ItemCard key={item.sku} item={item} />
          ))}
        </div>
      )}
    </main>
  )
}

export default AdminItemPage