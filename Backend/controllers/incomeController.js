import { sql } from '../../Database/db.js';

const getPeriodProfit = async (startDate, endDate) => {
  const totalsRow = await sql`
    SELECT
      period_income(${startDate}, ${endDate}) AS total_income,
      period_expense(${startDate}, ${endDate}) AS total_expense,
      period_profit(${startDate}, ${endDate}) AS total_profit
  `;

  const totalIncome = Number(totalsRow[0]?.total_income || 0);
  const totalExpense = Number(totalsRow[0]?.total_expense || 0);
  const totalProfit = Number(totalsRow[0]?.total_profit || 0);

  return {
    totalIncome,
    totalExpense,
    totalProfit,
  };
};

export const getDailyIncome = async (req, res) => {
  const { date } = req.query;

  if (!date) {
    return res.status(400).json({
      success: false,
      message: 'date query param is required in YYYY-MM-DD format',
    });
  }

  try {
    const completedPayments = await sql`
      SELECT
        o.order_id,
        o.created_at,
        o.status AS order_status,
        p.transaction_id,
        p.method,
        p.status AS payment_status,
        p.amount
      FROM orders o
      JOIN payment p ON p.order_id = o.order_id
      WHERE o.created_at::date = ${date}
        AND LOWER(COALESCE(o.status, '')) = 'completed'
      ORDER BY o.created_at DESC
    `;

    const totalsRow = await sql`
      SELECT
        daily_income(${date}) AS total_income,
        daily_expense(${date}) AS total_expense,
        daily_profit(${date}) AS total_profit
    `;

    const totalIncome = Number(totalsRow[0]?.total_income || 0);
    const totalExpense = Number(totalsRow[0]?.total_expense || 0);
    const totalProfit = Number(totalsRow[0]?.total_profit || 0);

    return res.status(200).json({
      success: true,
      data: {
        date,
        totals: {
          totalIncome,
          totalExpense,
          totalProfit,
        },
        completedPayments,
      },
    });
  } catch (error) {
    console.error('Error in getDailyIncome function:', error);
    return res.status(500).json({ success: false, message: 'Internal server error' });
  }
};

export const getProfitSummary = async (_req, res) => {
  try {
    const todayRow = await sql`SELECT CURRENT_DATE::text AS today`;
    const today = todayRow[0]?.today;

    const weekRangeRow = await sql`
      SELECT
        (CURRENT_DATE - INTERVAL '6 days')::date::text AS week_start,
        CURRENT_DATE::text AS week_end
    `;

    const weekStart = weekRangeRow[0]?.week_start;
    const weekEnd = weekRangeRow[0]?.week_end;

    const todayTotals = await getPeriodProfit(today, today);
    const weekTotals = await getPeriodProfit(weekStart, weekEnd);

    return res.status(200).json({
      success: true,
      data: {
        today: {
          date: today,
          ...todayTotals,
        },
        week: {
          startDate: weekStart,
          endDate: weekEnd,
          ...weekTotals,
        },
      },
    });
  } catch (error) {
    console.error('Error in getProfitSummary function:', error);
    return res.status(500).json({ success: false, message: 'Internal server error' });
  }
};
