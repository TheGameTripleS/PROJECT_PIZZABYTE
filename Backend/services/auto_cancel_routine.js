import { pool } from '../../Database/db.js'; // Adjust this path to match your actual db.js location

export const createAutoCancelRoutine = async () => {
  try {
    const query = `
      CREATE OR REPLACE FUNCTION auto_cancel_expired_pending_orders()
      RETURNS INT
      LANGUAGE plpgsql
      AS $$
      DECLARE
          v_cancelled_count INT;
      BEGIN
          WITH updated_orders AS (
              UPDATE orders
              SET status = 'cancelled'
              WHERE LOWER(COALESCE(status, '')) = 'pending'
                -- Check if the order's local creation date is older than today's local date
                AND (created_at AT TIME ZONE 'Asia/Dhaka')::date < (CURRENT_TIMESTAMP AT TIME ZONE 'Asia/Dhaka')::date
              RETURNING order_id
          )
          SELECT COUNT(*) INTO v_cancelled_count FROM updated_orders;

          -- Return the number of orders we cancelled for logging purposes
          RETURN v_cancelled_count;
      END;
      $$;
    `;

    await pool.query(query);
    console.log("✅ Routine created: auto_cancel_expired_pending_orders");
  } catch (error) {
    console.error("❌ Error creating auto_cancel_expired_pending_orders routine:", error);
  }
};