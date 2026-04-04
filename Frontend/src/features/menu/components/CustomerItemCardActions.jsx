import { MinusIcon, PlusIcon, ShoppingCartIcon } from "lucide-react";
import { useState } from "react";
import { useCart } from "../../../context/CartContext";

const mapInventoryItemToCartProduct = (item) => ({
  // Map database item_id to cart id for proper checkout calculations
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

function CustomerItemCardActions({ item }) {
  const [quantity, setQuantity] = useState(1);
  const { handleAddProduct } = useCart();

  const handleAddQuantity = () => {
    const mappedItem = mapInventoryItemToCartProduct(item);

    for (let i = 0; i < quantity; i += 1) {
      handleAddProduct(mappedItem, []);
    }
  };

  return (
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

      <button type="button" className="btn btn-primary btn-xs h-6 min-h-6 shrink-0 px-2 text-[10px]" onClick={handleAddQuantity}>
        <ShoppingCartIcon className="h-2.5 w-2.5" />
        Add
      </button>
    </div>
  );
}

export default CustomerItemCardActions;
