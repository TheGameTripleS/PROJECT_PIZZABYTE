import { useEffect } from "react";
import { CalendarIcon, RefreshCwIcon, ReceiptTextIcon, WalletIcon } from "lucide-react";
import { useExpenseStore } from "../store/useExpenseStore";

function ExpensesPage() {
  const {
    selectedDate,
    setSelectedDate,
    loading,
    error,
    totals,
    ingredientLots,
    staffWages,
    fetchExpensesByDate,
  } = useExpenseStore();

  useEffect(() => {
    fetchExpensesByDate(selectedDate);
  }, [selectedDate, fetchExpensesByDate]);

  return (
    <main className="container mx-auto px-4 py-8 space-y-6">
      <div className="flex flex-col md:flex-row justify-between items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold">Daily Expenses</h1>
          <p className="text-base-content/70">Ingredient purchases + staff wages by selected date.</p>
        </div>

        <div className="flex items-center gap-2">
          <label className="input input-bordered flex items-center gap-2">
            <CalendarIcon className="size-4 opacity-70" />
            <input
              type="date"
              value={selectedDate}
              onChange={(e) => setSelectedDate(e.target.value)}
              className="bg-transparent"
            />
          </label>

          <button className="btn btn-ghost btn-circle" onClick={() => fetchExpensesByDate(selectedDate)}>
            <RefreshCwIcon className={`size-5 ${loading ? "animate-spin" : ""}`} />
          </button>
        </div>
      </div>

      {error && <div className="alert alert-error">{error}</div>}

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="card bg-base-100 border border-base-content/10 shadow-sm">
          <div className="card-body">
            <p className="text-sm text-base-content/70">Ingredient Expense</p>
            <h2 className="text-2xl font-bold">{Number(totals.ingredientExpense || 0).toFixed(2)}</h2>
          </div>
        </div>

        <div className="card bg-base-100 border border-base-content/10 shadow-sm">
          <div className="card-body">
            <p className="text-sm text-base-content/70">Staff Wage Expense</p>
            <h2 className="text-2xl font-bold">{Number(totals.wageExpense || 0).toFixed(2)}</h2>
          </div>
        </div>

        <div className="card bg-primary text-primary-content shadow-sm">
          <div className="card-body">
            <p className="text-sm opacity-80">Total Expense</p>
            <h2 className="text-2xl font-bold">{Number(totals.totalExpense || 0).toFixed(2)}</h2>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
        <div className="card bg-base-100 border border-base-content/10 shadow-sm">
          <div className="card-body">
            <h3 className="card-title text-lg">
              <ReceiptTextIcon className="size-5" />
              Ingredient Buying Expense
            </h3>

            {ingredientLots.length === 0 ? (
              <p className="text-base-content/70">No ingredient purchase records for this date.</p>
            ) : (
              <div className="overflow-x-auto">
                <table className="table table-sm">
                  <thead>
                    <tr>
                      <th>Ingredient</th>
                      <th>Qty Bought</th>
                      <th>Price</th>
                      <th>Lot Expense</th>
                    </tr>
                  </thead>
                  <tbody>
                    {ingredientLots.map((row) => (
                      <tr key={row.log_id}>
                        <td>{row.ing_name}</td>
                        <td>{row.change_amount}</td>
                        <td>{Number(row.ing_price || 0).toFixed(2)}</td>
                        <td>{Number(row.lot_expense || 0).toFixed(2)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>

        <div className="card bg-base-100 border border-base-content/10 shadow-sm">
          <div className="card-body">
            <h3 className="card-title text-lg">
              <WalletIcon className="size-5" />
              Staff Wage Expense
            </h3>

            {staffWages.length === 0 ? (
              <p className="text-base-content/70">No rota records for this date.</p>
            ) : (
              <div className="overflow-x-auto">
                <table className="table table-sm">
                  <thead>
                    <tr>
                      <th>Staff</th>
                      <th>Position</th>
                      <th>Hours</th>
                      <th>Rate</th>
                      <th>Wage</th>
                    </tr>
                  </thead>
                  <tbody>
                    {staffWages.map((row) => (
                      <tr key={row.rota_id}>
                        <td>{row.first_name} {row.last_name}</td>
                        <td>{row.position}</td>
                        <td>{Number(row.hours_worked || 0).toFixed(2)}</td>
                        <td>{Number(row.hourly_rate || 0).toFixed(2)}</td>
                        <td>{Number(row.wage_expense || 0).toFixed(2)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      </div>
    </main>
  );
}

export default ExpensesPage;