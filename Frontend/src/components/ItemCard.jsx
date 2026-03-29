import React from "react";
import { EditIcon, Trash2Icon } from "lucide-react";
import { Link } from "react-router-dom";
import { useItemStore } from "../store/useItemStore";

function ItemCard({ item, renderActions }) {
  const { deleteItem } = useItemStore();

  const getBadgeColor = (status) => {
    switch ((status || "").trim().toLowerCase()) {
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
        <h2 className="card-title text-lg font-semibold flex justify-between items-start">
          <span>{item.item_name}</span>
          {!renderActions && (
            <div className={`badge badge-sm uppercase text-[10px] font-bold ${getBadgeColor(item.status)}`}>
              {item.status || "continued"}
            </div>
          )}
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

        <div className="card-actions justify-end mt-4">
          {renderActions ? (
            renderActions(item)
          ) : (
            <>
              <Link to={`/item/${item.sku}`} className="btn btn-sm btn-info btn-outline">
                <EditIcon className="size-4" />
              </Link>

              <button
                className="btn btn-sm btn-error btn-outline"
                onClick={() => deleteItem(item.sku)}
              >
                <Trash2Icon className="size-4" />
              </button>
            </>
          )}
        </div>
      </div>
    </div>
  );
}

export default ItemCard;
