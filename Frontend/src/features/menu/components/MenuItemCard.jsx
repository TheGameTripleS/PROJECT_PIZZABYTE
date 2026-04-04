import { MinusIcon, PlusIcon, ShoppingCartIcon } from "lucide-react";
import { useState } from "react";
import { useCart } from "../../../context/CartContext";

const mapInventoryItemToCartProduct = (item) => ({
  id: item.item_id || item.id || item.sku || item.SKU,
  item_id: item.item_id,
  sku: item.sku || item.SKU,
  ItemName: item.item_name || item.ItemName,
  ItemPrice: Number(item.item_price ?? item.ItemPrice ?? 0),
  ItemImg: item.image_url || item.ItemImg,
  Category: item.category || item.Category,
  Size: item.size || item.Size,
  attributes: [],
});

function MenuItemCard({ item }) {
  const [quantity, setQuantity] = useState(1);
  const { handleAddProductWithQuantity } = useCart();

  const handleAddToCart = () => {
    const mappedItem = mapInventoryItemToCartProduct(item);
    handleAddProductWithQuantity(mappedItem, [], quantity);
    setQuantity(1); // Reset quantity after adding
  };

  return (
    <div className="card bg-base-100 shadow-xl hover:shadow-2xl transition-shadow duration-300">
      <figure className="relative pt-[56.25%]">
        {item.image_url ? (
          <img
            src={item.image_url}
            alt={item.item_name}
            className="absolute top-0 left-0 w-full h-full object-cover"
          />
        ) : (
          <div className="absolute top-0 left-0 w-full h-full flex items-center justify-center text-gray-500 font-medium">
            No Image Yet
          </div>
        )}
      </figure>

      <div className="card-body">
        <h2 className="card-title text-lg font-semibold">
          {item.item_name}
        </h2>

        <p className="text-2xl font-bold text-primary">${Number(item.item_price).toFixed(2)}</p>

        <div className="flex flex-wrap gap-2 mt-1 mb-2">
          {item.category && (
            <span className="badge badge-ghost badge-sm font-medium text-base-content/70">
              {item.category}
            </span>
          )}
          {item.size && (
            <span className="badge badge-ghost badge-sm font-medium text-base-content/70">
              {item.size}
            </span>
          )}
        </div>

        <div className="card-actions justify-end mt-4 w-full">
          <div className="flex w-full min-w-0 items-center justify-center gap-1.5 overflow-hidden py-0.5">
            <div className="flex shrink-0 items-center gap-1">
              <button
                type="button"
                className="btn btn-xs h-6 min-h-6 w-6 px-0"
                aria-label={`Decrease quantity for ${item.item_name}`}
                onClick={() => setQuantity((prev) => Math.max(1, prev - 1))}
              >
                <MinusIcon className="h-2.5 w-2.5" />
              </button>
              <span className="flex h-6 min-w-6 items-center justify-center rounded-md border border-base-300 px-1.5 text-[10px]">
                {quantity}
              </span>
              <button
                type="button"
                className="btn btn-xs h-6 min-h-6 w-6 px-0"
                aria-label={`Increase quantity for ${item.item_name}`}
                onClick={() => setQuantity((prev) => prev + 1)}
              >
                <PlusIcon className="h-2.5 w-2.5" />
              </button>
            </div>

            <button
              type="button"
              className="btn btn-primary btn-xs h-6 min-h-6 shrink-0 px-2 text-[10px]"
              onClick={handleAddToCart}
            >
              <ShoppingCartIcon className="h-2.5 w-2.5" />
              Add
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

export default MenuItemCard;
