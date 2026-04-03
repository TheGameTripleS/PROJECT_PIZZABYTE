import { useEffect } from "react";
import { CalendarIcon, RefreshCwIcon, WalletIcon } from "lucide-react";
import { useIncomeStore } from "../store/useIncomeStore";

function IncomePage() {
  const {
    selectedDate,
    setSelectedDate,
    loading,
    error,
    totals,
    completedPayments,
    fetchIncomeByDate,
  } = useIncomeStore();
  const totalProfit = Number(totals.totalProfit || 0);
  const isLoss = totalProfit < 0;

  useEffect(() => {
    fetchIncomeByDate(selectedDate);
  }, [selectedDate, fetchIncomeByDate]);

  return (
    <main className="container mx-auto px-4 py-8 space-y-6">
      <div className="flex flex-col md:flex-row justify-between items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold">Daily Income</h1>
          <p className="text-base-content/70">Income and profit for completed orders by selected date.</p>
        </div>

        <div className="flex items-center gap-2">
          <div className="flex items-center gap-2 rounded-lg border border-base-content/20 bg-base-100 px-3 py-2">
            <CalendarIcon className="size-4 opacity-70" />
            <input
              id="income-date"
              type="date"
              value={selectedDate}
              onChange={(e) => setSelectedDate(e.target.value)}
              className="input input-ghost input-sm min-w-[11rem] p-0 focus:outline-none"
              style={{ colorScheme: "light" }}
            />
          </div>

          <button
            type="button"
            className="btn btn-outline btn-sm"
            onClick={() => {
              const dateInput = document.getElementById("income-date");
              if (dateInput?.showPicker) {
                dateInput.showPicker();
              } else {
                dateInput?.focus();
              }
            }}
          >
            Calendar
          </button>

          <button className="btn btn-ghost btn-circle" onClick={() => fetchIncomeByDate(selectedDate)}>
            <RefreshCwIcon className={`size-5 ${loading ? "animate-spin" : ""}`} />
          </button>
        </div>
      </div>

      {error && <div className="alert alert-error">{error}</div>}

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="card bg-base-100 border border-base-content/10 shadow-sm">
          <div className="card-body">
            <p className="text-sm text-base-content/70">Total Income</p>
            <h2 className="text-2xl font-bold">{Number(totals.totalIncome || 0).toFixed(2)}</h2>
          </div>
        </div>

        <div className="card bg-base-100 border border-base-content/10 shadow-sm">
          <div className="card-body">
            <p className="text-sm text-base-content/70">Total Expense</p>
            <h2 className="text-2xl font-bold">{Number(totals.totalExpense || 0).toFixed(2)}</h2>
          </div>
        </div>

        <div className={`card ${isLoss ? "bg-error text-error-content" : "bg-success text-success-content"} shadow-sm`}>
          <div className="card-body">
            <p className="text-sm opacity-90">{isLoss ? "Total Loss" : "Total Profit"}</p>
            <h2 className="text-2xl font-bold">{totalProfit.toFixed(2)}</h2>
          </div>
        </div>
      </div>

      <div className="card bg-base-100 border border-base-content/10 shadow-sm">
        <div className="card-body">
          <h3 className="card-title text-lg">
            <WalletIcon className="size-5" />
            Completed Order Payments
          </h3>

          {completedPayments.length === 0 ? (
            <p className="text-base-content/70">No completed order payments for this date.</p>
          ) : (
            <div className="overflow-x-auto">
              <table className="table table-sm">
                <thead>
                  <tr>
                    <th>Order ID</th>
                    <th>Transaction</th>
                    <th>Method</th>
                    <th>Payment Status</th>
                    <th>Amount</th>
                    <th>Created At</th>
                  </tr>
                </thead>
                <tbody>
                  {completedPayments.map((row) => (
                    <tr key={row.transaction_id}>
                      <td>{row.order_id}</td>
                      <td>{row.transaction_id}</td>
                      <td>{row.method || "-"}</td>
                      <td>{row.payment_status || "-"}</td>
                      <td>{Number(row.amount || 0).toFixed(2)}</td>
                      <td>{row.created_at ? new Date(row.created_at).toLocaleString() : "-"}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </main>
  );
}

export default IncomePage;
