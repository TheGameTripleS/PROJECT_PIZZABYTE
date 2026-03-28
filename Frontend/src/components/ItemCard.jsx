import React from "react";
import { EditIcon, Trash2Icon } from "lucide-react";
import { Link } from "react-router-dom";
import { useItemStore } from "../store/useItemStore";

function ItemCard({ item, renderActions }) {
  const { deleteItem } = useItemStore();

  const getBadgeColor = (status) => {
    switch (status?.trim().toLowerCase()) {
      case "continued":
        return "badge-success text-white";
      case "discontinued":
        return "badge-error text-white";
      case "hold":
        return "badge-warning";
      default:
        return "badge-ghost";
    }
  };

  return (
    /*
      "flex flex-col h-full" — card stretches to fill its grid cell height,
      which fixes the admin overlap issue where short cards collapsed into neighbors.
      Removed shadow-xl in favour of a clean border.
    */
    <div className="card bg-base-100 border border-base-200 hover:border-base-300 transition-all duration-300 flex flex-col h-full">

      {/* ITEM IMAGE — paddingTop aspect-ratio trick keeps all images the same height */}
      <figure
        className="relative w-full overflow-hidden bg-base-200"
        style={{ paddingTop: "72%" }}
      >
        {item.image_url ? (
          <img
            src={item.image_url}
            alt={item.item_name}
            className="absolute top-0 left-0 w-full h-full object-cover"
          />
        ) : (
          <div className="absolute top-0 left-0 w-full h-full flex items-center justify-center text-base-content/40 text-sm font-medium">
            No Image Yet
          </div>
        )}
      </figure>

      {/*
        "flex flex-col flex-1" — body grows to fill remaining card height
        so the actions row is always pinned to the bottom regardless of
        how long the item name is.
      */}
      <div className="flex flex-col flex-1 p-5 gap-3">

        {/* ROW 1: Name + Price on the same line, price never wraps */}
        <div className="flex justify-between items-start gap-3">
          <h2 className="text-base font-semibold leading-snug line-clamp-2 flex-1">
            {item.item_name}
          </h2>
          <span className="text-base font-bold text-primary whitespace-nowrap shrink-0">
            ${Number(item.item_price).toFixed(2)}
          </span>
        </div>

        {/* ROW 2: Category + Size badges always visible; Status only in admin */}
        <div className="flex flex-wrap gap-1.5 items-center" style={{ minHeight: "1.5rem" }}>
          {item.category && (
            <span className="badge badge-ghost badge-sm font-medium">
              {item.category}
            </span>
          )}
          {item.size && (
            <span className="badge badge-ghost badge-sm font-medium">
              {item.size}
            </span>
          )}
          {!renderActions && (
            <span
              className={`badge badge-sm uppercase font-bold ml-auto ${getBadgeColor(item.status)}`}
              style={{ fontSize: "10px" }}
            >
              {item.status || "continued"}
            </span>
          )}
        </div>

        {/* DIVIDER */}
        <div className="border-t border-base-200" />

        {/*
          ROW 3: Actions pinned to bottom via "mt-auto".
          Wrapping renderActions in "w-full" prevents CustomerItemCardActions
          (which is itself flex w-full) from overflowing the card edge.
        */}
        <div className="mt-auto w-full min-w-0 overflow-hidden">
          {renderActions ? (
            <div className="w-full min-w-0 overflow-hidden">
              {renderActions(item)}
            </div>
          ) : (
            <div className="flex justify-between items-center">
              <Link
                to={`/item/${item.sku}`}
                className="btn btn-sm btn-info btn-outline"
              >
                <EditIcon className="size-4" />
              </Link>
              <button
                className="btn btn-sm btn-error btn-outline"
                onClick={() => deleteItem(item.sku)}
              >
                <Trash2Icon className="size-4" />
              </button>
            </div>
          )}
        </div>

      </div>
    </div>
  );
}

export default ItemCard;
