import { ShoppingCartIcon, BoxIcon } from "lucide-react";

function ReceptionistDashboard({ user, handleLogout }) {
  return (
    <main className="container mx-auto px-4 py-8">
      <div className="max-w-3xl mx-auto space-y-6">
        <div className="text-center">
          <h1 className="text-3xl font-bold">Receptionist Panel</h1>
          <p className="text-base-content/70 mt-2">
            Welcome, {user?.fullname || "Receptionist"}
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <button className="btn btn-primary h-32 text-lg">
            <ShoppingCartIcon className="size-6 mr-2" />
            Orders Today
          </button>

          <button className="btn btn-secondary h-32 text-lg">
            <BoxIcon className="size-6 mr-2" />
            Store Stock
          </button>
        </div>
      </div>
    </main>
  );
}

export default ReceptionistDashboard;

