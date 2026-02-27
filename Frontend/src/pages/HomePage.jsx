import React from 'react'
import { useItemStore } from '../store/useItemStore'
import { useEffect } from 'react'
import { PackageIcon, PlusCircleIcon, RefreshCwIcon } from "lucide-react";
import ItemCard from "../components/ItemCard";
import AddItemModal from '../components/AddItemModal';

function HomePage() {
  const { items, loading, error, fetchItems } = useItemStore();

  useEffect(() => {
    fetchItems();
  }, [fetchItems]);

  return (
    <main>
      <div className="flex justify-between items-center mb-8">
        <button
          className="btn btn-primary"
          onClick={() => document.getElementById("add_item_modal").showModal()}
        >
          <PlusCircleIcon className="size-5 mr-2" />
          Add Item
        </button>
        <button className="btn btn-ghost btn-circle" onClick={fetchItems}>
          <RefreshCwIcon className="size-5" />
        </button>
      </div>

      <AddItemModal />

      {error && <div className="alert alert-error mb-8">{error}</div>}

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