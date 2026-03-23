import React from 'react'
import { useItemStore } from '../store/useItemStore'
import { useEffect } from 'react'
import { PackageIcon, PlusCircleIcon, RefreshCwIcon, SearchIcon } from "lucide-react";
import ItemCard from "../components/ItemCard";
import AddItemModal from '../components/AddItemModal';

function HomePage() {
  const { items, loading, error, fetchItems, searchTerm, setSearchTerm } = useItemStore();

  useEffect(() => {
    // Wait 300ms after the user stops typing before fetching
    const delayDebounceFn = setTimeout(() => {
      fetchItems();
    }, 300);

    // Cleanup function: cancels the timeout if the user keeps typing
    return () => clearTimeout(delayDebounceFn);
  }, [searchTerm, fetchItems]);

  const filteredItems = items.filter((item) => {
    // 1. Clean up the user's input (lowercase and remove trailing spaces)
    const search = searchTerm.toLowerCase().trim();
    
    // 2. If the search bar is empty, show all items
    if (!search) return true;

    // 3. Check if the substring exists anywhere inside the Name or SKU
    // Optional chaining (?.) prevents crashes if an item has a null name/sku
    const nameMatch = item.item_name?.toLowerCase().includes(search);
    const skuMatch = item.sku?.toLowerCase().includes(search);

    // 4. Return true ONLY if it matched the name or the SKU
    return nameMatch || skuMatch;
  });

  return (
    <main className="container mx-auto px-4 py-8">
      <div className="flex flex-col md:flex-row justify-between items-center gap-4 mb-8">
        {/* ACTION BUTTONS */}
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

        {/* SEARCH BAR */}
        <div className="relative w-full md:w-96">
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
      </div>

      <AddItemModal />

      {error && <div className="alert alert-error mb-8">{error}</div>}

      {/* NO RESULTS VIEW */}
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

export default HomePage