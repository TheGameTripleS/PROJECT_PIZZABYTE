import { sql } from '../../Database/db.js';

export const getDailyExpenses = async (req, res) => {
  const { date } = req.query;

  if (!date) {
    return res.status(400).json({
      success: false,
      message: 'date query param is required in YYYY-MM-DD format',
    });
  }

  try {
    const ingredientLots = await sql`
      SELECT
        sl.log_id,
        sl.ing_id,
        i.ing_name,
        sl.change_amount,
        i.ing_price,
        (sl.change_amount * i.ing_price) AS lot_expense,
        sl.created_at
      FROM stock_log sl
      JOIN ingredients i ON i.ing_id = sl.ing_id
      WHERE sl.change_amount > 0
        AND sl.created_at::date = ${date}
      ORDER BY sl.created_at DESC
    `;

    const ingredientExpenseRow = await sql`
      SELECT COALESCE(SUM(sl.change_amount * i.ing_price), 0) AS ingredient_expense
      FROM stock_log sl
      JOIN ingredients i ON i.ing_id = sl.ing_id
      WHERE sl.change_amount > 0
        AND sl.created_at::date = ${date}
    `;

    const staffWages = await sql`
      SELECT
        r.rota_id,
        r.staff_id,
        s.first_name,
        s.last_name,
        s.position,
        s.hourly_rate,
        r.work_date,
        r.start_time,
        r.end_time,
        CASE
          WHEN r.end_time IS NOT NULL AND r.start_time IS NOT NULL AND r.end_time > r.start_time
            THEN EXTRACT(EPOCH FROM (r.end_time - r.start_time)) / 3600
          ELSE 0
        END AS hours_worked,
        CASE
          WHEN r.end_time IS NOT NULL AND r.start_time IS NOT NULL AND r.end_time > r.start_time
            THEN (EXTRACT(EPOCH FROM (r.end_time - r.start_time)) / 3600) * s.hourly_rate
          ELSE 0
        END AS wage_expense
      FROM rota r
      JOIN staff s ON s.staff_id = r.staff_id
      WHERE r.work_date = ${date}
      ORDER BY r.start_time ASC
    `;

    const wagesExpenseRow = await sql`
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
    `;

    const ingredientExpense = Number(ingredientExpenseRow[0]?.ingredient_expense || 0);
    const wageExpense = Number(wagesExpenseRow[0]?.wage_expense || 0);
    const totalExpense = ingredientExpense + wageExpense;

    return res.status(200).json({
      success: true,
      data: {
        date,
        totals: {
          ingredientExpense,
          wageExpense,
          totalExpense,
        },
        ingredientLots,
        staffWages,
      },
    });
  } catch (error) {
    console.error('Error in getDailyExpenses function:', error);
    return res.status(500).json({ success: false, message: 'Internal server error' });
  }
};
