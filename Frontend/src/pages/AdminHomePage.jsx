import { Link } from "react-router-dom";
import { BoxesIcon, SaladIcon, UsersIcon } from "lucide-react";

function AdminHomePage() {

  return (
    <main className="container mx-auto px-4 py-8">
      <div className="max-w-3xl mx-auto space-y-6">
        <div className="text-center">
          <h1 className="text-3xl font-bold">Admin Home Panel</h1>
          <p className="text-base-content/70 mt-2">
            Use the buttons below to manage items, staff and ingredients.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Link to="/admin/items" className="btn btn-primary h-20 text-lg">
            <BoxesIcon className="size-6 mr-2" />
            Items
          </Link>

          <Link to="/staff" className="btn btn-secondary h-20 text-lg">
            <UsersIcon className="size-6 mr-2" />
            Staff
          </Link>

          <Link to="/ingredients" className="btn btn-accent h-20 text-lg">
            <SaladIcon className="size-6 mr-2" />
            Ingredients
          </Link>
        </div>
      </div>
    </main>
  )
}

export default AdminHomePage