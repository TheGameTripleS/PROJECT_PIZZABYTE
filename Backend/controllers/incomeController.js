import { sql } from '../../Database/db.js';

const getPeriodProfit = async (startDate, endDate) => {
  const incomeRow = await sql`
    SELECT COALESCE(SUM(p.amount), 0) AS total_income
    FROM orders o
    JOIN payment p ON p.order_id = o.order_id
    WHERE o.created_at::date BETWEEN ${startDate} AND ${endDate}
      AND LOWER(COALESCE(o.status, '')) = 'completed'
  `;

  const expenseRow = await sql`
    WITH ingredient_cost AS (
      SELECT COALESCE(SUM(sl.change_amount * i.ing_price), 0) AS ingredient_expense
      FROM stock_log sl
      JOIN ingredients i ON i.ing_id = sl.ing_id
      WHERE sl.change_amount > 0
        AND sl.created_at::date BETWEEN ${startDate} AND ${endDate}
    ),
    wage_cost AS (
      SELECT COALESCE(
        SUM(
          CASE
            WHEN r.end_time IS NOT NULL AND r.start_time IS NOT NULL AND r.end_time > r.start_time
              THEN (EXTRACT(EPOCH FROM (r.end_time - r.start_time)) / 3600) * s.hourly_rate
            ELSE 0
          END
        ),
        0
      ) AS wage_expense
      FROM rota r
      JOIN staff s ON s.staff_id = r.staff_id
      WHERE r.work_date BETWEEN ${startDate} AND ${endDate}
    )
    SELECT (ingredient_cost.ingredient_expense + wage_cost.wage_expense) AS total_expense
    FROM ingredient_cost, wage_cost
  `;

  const totalIncome = Number(incomeRow[0]?.total_income || 0);
  const totalExpense = Number(expenseRow[0]?.total_expense || 0);

  return {
    totalIncome,
    totalExpense,
    totalProfit: totalIncome - totalExpense,
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

    const incomeRow = await sql`
      SELECT COALESCE(SUM(p.amount), 0) AS total_income
      FROM orders o
      JOIN payment p ON p.order_id = o.order_id
      WHERE o.created_at::date = ${date}
        AND LOWER(COALESCE(o.status, '')) = 'completed'
    `;

    const expenseRow = await sql`
      WITH ingredient_cost AS (
        SELECT COALESCE(SUM(sl.change_amount * i.ing_price), 0) AS ingredient_expense
        FROM stock_log sl
        JOIN ingredients i ON i.ing_id = sl.ing_id
        WHERE sl.change_amount > 0
          AND sl.created_at::date = ${date}
      ),
      wage_cost AS (
        SELECT COALESCE(
          SUM(
            CASE
              WHEN r.end_time IS NOT NULL AND r.start_time IS NOT NULL AND r.end_time > r.start_time
                THEN (EXTRACT(EPOCH FROM (r.end_time - r.start_time)) / 3600) * s.hourly_rate
              ELSE 0
            END
          ),
          0
        ) AS wage_expense
        FROM rota r
        JOIN staff s ON s.staff_id = r.staff_id
        WHERE r.work_date = ${date}
      )
      SELECT (ingredient_cost.ingredient_expense + wage_cost.wage_expense) AS total_expense
      FROM ingredient_cost, wage_cost
    `;

    const totalIncome = Number(incomeRow[0]?.total_income || 0);
    const totalExpense = Number(expenseRow[0]?.total_expense || 0);
    const totalProfit = totalIncome - totalExpense;

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
