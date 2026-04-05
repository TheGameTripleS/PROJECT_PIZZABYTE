import { Link } from "react-router-dom";
import { BoxIcon, LogOutIcon, ShoppingCartIcon, UserRoundCogIcon } from "lucide-react";

function ReceptionistDashboard({ user, handleLogout }) {
  return (
    <main className="container mx-auto px-4 py-8">
      <div className="max-w-3xl mx-auto space-y-6">
        <div className="flex flex-col md:flex-row items-center justify-between gap-3">
          <div className="text-center md:text-left">
            <h1 className="text-3xl font-bold">Receptionist Panel</h1>
            <p className="text-base-content/70 mt-2">
              Welcome, {user?.fullname || "Receptionist"}
            </p>
          </div>

          <button className="btn btn-outline btn-error" onClick={handleLogout}>
            <LogOutIcon className="size-5" />
            Logout
          </button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Link to="/reception/orders-today" className="btn btn-primary h-24 text-lg">
            <ShoppingCartIcon className="size-6 mr-2" />
            Orders Today
          </Link>

          <Link to="/reception/store-stock" className="btn btn-secondary h-24 text-lg">
            <BoxIcon className="size-6 mr-2" />
            Store Stock
          </Link>

          <Link to="/reception/staff-rota" className="btn btn-accent h-24 text-lg">
            <UserRoundCogIcon className="size-6 mr-2" />
            Staff Rota
          </Link>
        </div>
      </div>
    </main>
  );
}

export default ReceptionistDashboard;

