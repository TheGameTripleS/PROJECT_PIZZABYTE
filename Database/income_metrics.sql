CREATE OR REPLACE FUNCTION period_income(p_start_date DATE, p_end_date DATE)
RETURNS NUMERIC(12,2)
LANGUAGE SQL
AS $$
    SELECT COALESCE(SUM(p.amount), 0)::NUMERIC(12,2)
    FROM orders o
    JOIN payment p ON p.order_id = o.order_id
    WHERE o.created_at::date BETWEEN p_start_date AND p_end_date
      AND LOWER(COALESCE(o.status, '')) = 'completed';
$$;

CREATE OR REPLACE FUNCTION period_expense(p_start_date DATE, p_end_date DATE)
RETURNS NUMERIC(12,2)
LANGUAGE SQL
AS $$
    WITH ingredient_cost AS (
        SELECT COALESCE(SUM(sl.change_amount * i.ing_price), 0) AS ingredient_expense
        FROM stock_log sl
        JOIN ingredients i ON i.ing_id = sl.ing_id
        WHERE sl.change_amount > 0
          AND sl.created_at::date BETWEEN p_start_date AND p_end_date
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
        WHERE r.work_date BETWEEN p_start_date AND p_end_date
    )
    SELECT (ingredient_cost.ingredient_expense + wage_cost.wage_expense)::NUMERIC(12,2)
    FROM ingredient_cost, wage_cost;
$$;

CREATE OR REPLACE FUNCTION period_profit(p_start_date DATE, p_end_date DATE)
RETURNS NUMERIC(12,2)
LANGUAGE SQL
AS $$
    SELECT (period_income(p_start_date, p_end_date) - period_expense(p_start_date, p_end_date))::NUMERIC(12,2);
$$;

CREATE OR REPLACE FUNCTION daily_income(target_date DATE)
RETURNS NUMERIC(12,2)
LANGUAGE SQL
AS $$
    SELECT period_income(target_date, target_date);
$$;

CREATE OR REPLACE FUNCTION daily_expense(target_date DATE)
RETURNS NUMERIC(12,2)
LANGUAGE SQL
AS $$
    SELECT period_expense(target_date, target_date);
$$;

CREATE OR REPLACE FUNCTION daily_profit(target_date DATE)
RETURNS NUMERIC(12,2)
LANGUAGE SQL
AS $$
    SELECT period_profit(target_date, target_date);
$$;
