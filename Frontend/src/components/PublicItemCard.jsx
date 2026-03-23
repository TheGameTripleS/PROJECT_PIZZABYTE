import React from "react";

// Read-only version of ItemCard — no edit or delete actions.
function PublicItemCard({ item }) {
    const getBadgeColor = (status) => {
        switch (status) {
            case "continued":    return "badge-success text-white";
            case "discontinued": return "badge-error text-white";
            case "hold":         return "badge-warning";
            default:             return "badge-ghost";
        }
    };

    return (
        <div className="card bg-base-100 shadow-xl hover:shadow-2xl transition-shadow duration-300">
            {/* ITEM IMAGE */}
            <figure className="relative pt-[56.25%]">
                {item.image_url ? (
                    <img
                        src={item.image_url}
                        alt={item.item_name}
                        className="absolute top-0 left-0 w-full h-full object-cover"
                    />
                ) : (
                    <div className="absolute top-0 left-0 w-full h-full flex items-center justify-center text-base-content/40 font-medium">
                        No Image Yet
                    </div>
                )}
            </figure>

            <div className="card-body">
                {/* NAME + STATUS */}
                <h2 className="card-title text-lg font-semibold flex justify-between items-start">
                    <span>{item.item_name}</span>
                    <div className={`badge badge-sm uppercase text-[10px] font-bold ${getBadgeColor(item.status)}`}>
                        {item.status || "continued"}
                    </div>
                </h2>

                {/* PRICE */}
                <p className="text-2xl font-bold text-primary">
                    ${Number(item.item_price).toFixed(2)}
                </p>

                {/* CATEGORY & SIZE */}
                <div className="flex flex-wrap gap-2 mt-1">
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
            </div>
        </div>
    );
}

export default PublicItemCard;
