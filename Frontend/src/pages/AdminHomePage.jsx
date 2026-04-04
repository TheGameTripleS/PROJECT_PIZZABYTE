import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { BoxesIcon, CoinsIcon, ReceiptTextIcon, SaladIcon, UserRoundCogIcon, UsersIcon } from "lucide-react";
import axios from "axios";

const BASE_URL = import.meta.env.VITE_API_URL || "";

function AdminHomePage() {
  const [profitData, setProfitData] = useState({
    today: null,
    week: null,
  });
  const [loadingProfit, setLoadingProfit] = useState(false);

  useEffect(() => {
    const buildDateList = (days) => {
      const dates = [];
      const now = new Date();
      for (let i = days - 1; i >= 0; i -= 1) {
        const d = new Date(now);
        d.setDate(now.getDate() - i);
        dates.push(d.toISOString().split("T")[0]);
      }
      return dates;
    };

    const fetchDailyProfit = async (date) => {
      const response = await axios.get(`${BASE_URL}/api/income?date=${date}`);
      const totals = response.data?.data?.totals || {};
      return {
        totalIncome: Number(totals.totalIncome || 0),
        totalExpense: Number(totals.totalExpense || 0),
        totalProfit: Number(totals.totalProfit || 0),
      };
    };

    const fetchProfitSummary = async () => {
      setLoadingProfit(true);
      try {
        const response = await axios.get(`${BASE_URL}/api/income/profit-summary`);
        const data = response.data?.data || {};
        setProfitData({
          today: data.today || null,
          week: data.week || null,
        });
      } catch (error) {
        try {
          const dates = buildDateList(7);
          const todayDate = dates[dates.length - 1];

          const dailyResults = await Promise.all(dates.map((date) => fetchDailyProfit(date)));
          const todayTotals = dailyResults[dailyResults.length - 1];

          const weekTotals = dailyResults.reduce(
            (acc, item) => ({
              totalIncome: acc.totalIncome + item.totalIncome,
              totalExpense: acc.totalExpense + item.totalExpense,
              totalProfit: acc.totalProfit + item.totalProfit,
            }),
            { totalIncome: 0, totalExpense: 0, totalProfit: 0 }
          );

          setProfitData({
            today: {
              date: todayDate,
              ...todayTotals,
            },
            week: {
              startDate: dates[0],
              endDate: todayDate,
              ...weekTotals,
            },
          });
        } catch (fallbackError) {
          console.error("Error in fetchProfitSummary fallback function:", fallbackError);
        }
      } finally {
        setLoadingProfit(false);
      }
    };

    fetchProfitSummary();
  }, []);

  const todayProfit = Number(profitData.today?.totalProfit || 0);
  const weekProfit = Number(profitData.week?.totalProfit || 0);
  const todayIsLoss = todayProfit < 0;
  const weekIsLoss = weekProfit < 0;

  return (
    <main className="container mx-auto px-4 py-8">
      <div className="max-w-3xl mx-auto space-y-6">
        <div className="text-center">
          <h1 className="text-3xl font-bold">Admin Home Panel</h1>
          <p className="text-base-content/70 mt-2">
            Use the buttons below to manage items, staff, ingredients, expenses and income.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
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

          <Link to="/expenses" className="btn btn-info h-20 text-lg">
            <ReceiptTextIcon className="size-6 mr-2" />
            Expenses
          </Link>

          <Link to="/income" className="btn btn-success h-20 text-lg">
            <CoinsIcon className="size-6 mr-2" />
            Income
          </Link>

          <Link to="/reception-management" className="btn btn-warning h-20 text-sm md:text-base normal-case px-3">
            <UserRoundCogIcon className="size-6 mr-2" />
            <span className="text-center leading-tight">Reception Management</span>
          </Link>
        </div>

        <div className="flex justify-start">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 w-full md:max-w-2xl">
            <div className={`card border shadow-sm ${todayIsLoss ? "bg-error/10 border-error/40" : "bg-success/10 border-success/40"}`}>
              <div className="card-body py-4">
                <p className="text-sm text-base-content/70">Today's Profit</p>
                <h3 className={`text-xl font-bold ${todayIsLoss ? "text-error" : "text-success"}`}>
                  {todayProfit.toFixed(2)}
                </h3>
                <p className="text-xs text-base-content/60">
                  {loadingProfit ? "Loading..." : (profitData.today?.date || "Today")}
                </p>
              </div>
            </div>

            <div className={`card border shadow-sm ${weekIsLoss ? "bg-error/10 border-error/40" : "bg-success/10 border-success/40"}`}>
              <div className="card-body py-4">
                <p className="text-sm text-base-content/70">Latest 7 Days Profit</p>
                <h3 className={`text-xl font-bold ${weekIsLoss ? "text-error" : "text-success"}`}>
                  {weekProfit.toFixed(2)}
                </h3>
                <p className="text-xs text-base-content/60">
                  {loadingProfit ? "Loading..." : `${profitData.week?.startDate || "-"} to ${profitData.week?.endDate || "-"}`}
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </main>
  )
}

export default AdminHomePage