import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";
import { pool, sql } from "../../Database/db.js";

const secret = process.env.JWT_SECRET;
const expires = process.env.JWT_EXPIRES_IN;

// Helper function to format receptionist data
const formatReceptionistData = (staff) => {
  return {
    id: staff.staff_id,
    staff_id: staff.staff_id,
    email: staff.email,
    fullname: `${staff.first_name || ""} ${staff.last_name || ""}`.trim(),
    position: staff.position,
    role: "receptionist",
  };
};

export const loginReceptionist = async (req, res) => {
  const { email, password } = req.body;

  console.log("🔓 Receptionist Login Request - Email:", email);

  try {
    if (!email || !password) {
      console.log("❌ Missing email or password");
      return res
        .status(400)
        .json({ success: false, message: "Email and password are required" });
    }

    // Query the staff table for receptionists with matching email
    const staff = await sql`
      SELECT staff_id, first_name, last_name, email, password, position 
      FROM staff 
      WHERE email = ${email} AND position = 'receptionist'
    `;

    console.log("📊 Staff Query Result - Found:", staff.length, "record(s)");

    if (staff.length === 0) {
      console.log("❌ Receptionist account not found for email:", email);
      return res
        .status(400)
        .json({ success: false, message: "Receptionist account not found" });
    }

    const staffMember = staff[0];

    // Verify password
    const isValid = await bcrypt.compare(password, staffMember.password);
    if (!isValid) {
      console.log("❌ Invalid password for email:", email);
      return res
        .status(401)
        .json({ success: false, message: "Invalid password" });
    }

    console.log("✅ Password verified successfully");

    // Format receptionist data
    const formattedReceptionist = formatReceptionistData(staffMember);

    // Sign JWT token
    const token = jwt.sign(
      {
        email: formattedReceptionist.email,
        id: formattedReceptionist.id,
        role: "receptionist",
      },
      secret,
      { expiresIn: expires || "1d" }
    );

    // Set httpOnly cookie
    res.cookie("token", token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: process.env.NODE_ENV === "production" ? "none" : "lax",
      maxAge: 24 * 60 * 60 * 1000,
    });

    console.log("✅ Receptionist login successful for:", email);

    return res.status(200).json({
      success: true,
      message: "Receptionist login successful",
      user: formattedReceptionist,
    });
  } catch (error) {
    console.error("❌ Error in loginReceptionist:", error);
    return res.status(500).json({
      success: false,
      message: "Server error: failed to login. Please try again later.",
    });
  }
};

export const validateReceptionistToken = async (req, res) => {
  console.log("🔐 Receptionist Token Validation Request");

  try {
    const token = req.cookies.token;

    if (!token) {
      console.log("❌ No token found in cookies");
      return res.status(401).json({ success: false, message: "No token provided" });
    }

    const decoded = jwt.verify(token, secret);
    console.log("✅ Token verified successfully for:", decoded.email);

    const staff = await sql`
      SELECT staff_id, first_name, last_name, email, position 
      FROM staff 
      WHERE staff_id = ${decoded.id} AND position = 'receptionist'
    `;

    if (staff.length === 0) {
      console.log("❌ Receptionist not found or not a receptionist anymore");
      return res.status(401).json({ success: false, message: "Receptionist not found" });
    }

    const formattedReceptionist = formatReceptionistData(staff[0]);
    console.log("✅ Receptionist token validated, returning user data");

    return res.status(200).json({ success: true, user: formattedReceptionist });
  } catch (error) {
    console.error("❌ Error in validateReceptionistToken:", error.message);
    return res.status(401).json({
      success: false,
      message: "Invalid or expired token",
    });
  }
};

export const getStoreStockIngredients = async (_req, res) => {
  try {
    // 1. We LEFT JOIN the stock_log to get the history.
    // 2. We use SUM(change_amount) to add up all positive and negative changes.
    // 3. We use COALESCE to ensure items with NO logs return 0 instead of null.
    // 4. We cast it ::integer so Postgres knows it's a standard number.
    const result = await sql`
      SELECT 
        i.ing_id, 
        i.ing_name, 
        i.meas, 
        i.ing_price,
        COALESCE(SUM(sl.change_amount), 0)::integer AS current_stock
      FROM ingredients i
      LEFT JOIN stock_log sl ON i.ing_id = sl.ing_id
      GROUP BY i.ing_id, i.ing_name, i.meas, i.ing_price
      ORDER BY i.ing_name ASC
    `;

    const rows = Array.isArray(result) ? result : result.rows || [];

    const formattedData = rows.map((row) => ({
      ing_id: Number(row.ing_id),
      ing_name: row.ing_name,
      meas: row.meas,
      ing_price: Number(row.ing_price),
      current_stock: Number(row.current_stock) || 0 
    }));

    return res.status(200).json({ success: true, data: formattedData });
  } catch (error) {
    console.error("Error in getStoreStockIngredients:", error);
    return res.status(500).json({ success: false, message: "Internal server error" });
  }
};

export const buyStoreStock = async (req, res) => {
  const { staff_id, ing_id, quantity } = req.body;

  if (!staff_id || !ing_id || quantity === undefined || quantity === null) {
    return res.status(400).json({
      success: false,
      message: "staff_id, ing_id and quantity are required",
    });
  }

  try {
    const created = await sql`
      SELECT *
      FROM receptionist_restock(
        ${Number(staff_id)}::int,
        ${Number(ing_id)}::int,
        ${Number(quantity)}::int,
        CURRENT_TIMESTAMP::timestamp
      )
    `;

    return res.status(201).json({ success: true, data: created[0] });
  } catch (error) {
    console.error("Error in buyStoreStock:", error);

    const message =
      error?.message ||
      "Failed to update stock log";

    return res.status(400).json({ success: false, message });
  }
};

export const getReceptionistStoreStockLogs = async (req, res) => {
  const { staffId } = req.params;

  try {
    const logs = await sql`
      SELECT
        sl.log_id,
        sl.ing_id,
        i.ing_name,
        sl.rota_id,
        sl.change_amount,
        sl.created_at,
        TO_CHAR(r.work_date, 'YYYY-MM-DD') AS work_date,
        r.start_time,
        r.end_time
      FROM stock_log sl
      JOIN rota r ON r.rota_id = sl.rota_id
      JOIN ingredients i ON i.ing_id = sl.ing_id
      WHERE r.staff_id = ${staffId}
        AND sl.change_amount > 0
      ORDER BY sl.created_at DESC
      LIMIT 50
    `;

    return res.status(200).json({ success: true, data: logs });
  } catch (error) {
    console.error("Error in getReceptionistStoreStockLogs:", error);
    return res.status(500).json({ success: false, message: "Internal server error" });
  }
};

const parseInteger = (value) => {
  const parsed = Number(value);
  if (!Number.isInteger(parsed) || parsed <= 0) {
    return null;
  }
  return parsed;
};

const ensureReceptionistExists = async (staffId, client = null) => {
  const runner = client || sql;

  const rows = client
    ? await runner.query(
        `
          SELECT staff_id, position
          FROM staff
          WHERE staff_id = $1
          LIMIT 1
        `,
        [staffId]
      )
    : await runner`
        SELECT staff_id, position
        FROM staff
        WHERE staff_id = ${staffId}
        LIMIT 1
      `;

  const staff = client ? rows.rows : rows;

  if (!staff.length) {
    const error = new Error("Staff not found");
    error.status = 404;
    throw error;
  }

  if (String(staff[0].position || "").toLowerCase() !== "receptionist") {
    const error = new Error("Only receptionists can approve orders");
    error.status = 403;
    throw error;
  }
};

const resolveReceptionistRotaId = async (staffId, client) => {
  const activeShift = await client.query(
    `
      SELECT r.rota_id
      FROM rota r
      WHERE r.staff_id = $1
        AND r.work_date = CURRENT_DATE
        AND CURRENT_TIMESTAMP >= r.start_time
        AND CURRENT_TIMESTAMP <= r.end_time
      ORDER BY r.start_time DESC
      LIMIT 1
    `,
    [staffId]
  );

  if (activeShift.rows.length) {
    return Number(activeShift.rows[0].rota_id);
  }

  const todayShift = await client.query(
    `
      SELECT r.rota_id
      FROM rota r
      WHERE r.staff_id = $1
        AND r.work_date = CURRENT_DATE
      ORDER BY r.start_time DESC
      LIMIT 1
    `,
    [staffId]
  );

  if (todayShift.rows.length) {
    return Number(todayShift.rows[0].rota_id);
  }

  const latestShift = await client.query(
    `
      SELECT r.rota_id
      FROM rota r
      WHERE r.staff_id = $1
      ORDER BY r.work_date DESC, r.start_time DESC
      LIMIT 1
    `,
    [staffId]
  );

  if (latestShift.rows.length) {
    return Number(latestShift.rows[0].rota_id);
  }

  return null;
};

const ensureNonReceptionistStaffExists = async (staffId, client = null) => {
  const runner = client || sql;

  const rows = client
    ? await runner.query(
        `
          SELECT staff_id, position, first_name, last_name
          FROM staff
          WHERE staff_id = $1
          LIMIT 1
        `,
        [staffId]
      )
    : await runner`
        SELECT staff_id, position, first_name, last_name
        FROM staff
        WHERE staff_id = ${staffId}
        LIMIT 1
      `;

  const staff = client ? rows.rows : rows;

  if (!staff.length) {
    const error = new Error("Staff not found");
    error.status = 404;
    throw error;
  }

  if (String(staff[0].position || "").toLowerCase() === "receptionist") {
    const error = new Error("Receptionists cannot be assigned from this panel");
    error.status = 400;
    throw error;
  }

  return staff[0];
};

export const getAssignableStaff = async (_req, res) => {
  try {
    const staff = await sql`
      SELECT
        s.staff_id,
        s.first_name,
        s.last_name,
        LOWER(COALESCE(s.position, '')) AS position,
        s.email,
        COUNT(DISTINCT r.rota_id) AS rota_count
      FROM staff s
      LEFT JOIN rota r ON r.staff_id = s.staff_id
      WHERE LOWER(COALESCE(s.position, '')) <> 'receptionist'
      GROUP BY s.staff_id, s.first_name, s.last_name, s.position, s.email
      ORDER BY s.staff_id DESC
    `;

    return res.status(200).json({ success: true, data: staff });
  } catch (error) {
    console.error("Error in getAssignableStaff:", error);
    return res.status(500).json({
      success: false,
      message: "Failed to fetch assignable staff",
    });
  }
};

export const getStaffRotaForReceptionist = async (req, res) => {
  const staffId = parseInteger(req.params.staffId);

  if (!staffId) {
    return res.status(400).json({ success: false, message: "Valid staffId is required" });
  }

  try {
    await ensureNonReceptionistStaffExists(staffId);

    const rota = await sql`
      SELECT 
        rota_id, 
        staff_id, 
        TO_CHAR(start_time, 'YYYY-MM-DD HH24:MI:SS') AS start_time,
        TO_CHAR(end_time, 'YYYY-MM-DD HH24:MI:SS') AS end_time,
        TO_CHAR(work_date, 'YYYY-MM-DD') AS work_date
      FROM rota
      WHERE staff_id = ${staffId}
      ORDER BY work_date DESC, start_time DESC
    `;

    return res.status(200).json({ success: true, data: rota });
  } catch (error) {
    console.error("Error in getStaffRotaForReceptionist:", error);
    return res.status(error.status || 500).json({
      success: false,
      message: error.message || "Failed to fetch staff rota",
    });
  }
};

export const assignStaffRotaByReceptionist = async (req, res) => {
  const staffId = parseInteger(req.params.staffId);
  const receptionistStaffId = parseInteger(req.body?.receptionist_staff_id);
  const { work_date, start_time, end_time } = req.body || {};

  if (!staffId || !receptionistStaffId || !work_date || !start_time || !end_time) {
    return res.status(400).json({
      success: false,
      message:
        "staffId, receptionist_staff_id, work_date, start_time and end_time are required",
    });
  }

  const startTimestampText = `${work_date} ${start_time}`;
  const endTimestampText = `${work_date} ${end_time}`;

  try {
    await ensureReceptionistExists(receptionistStaffId);
    await ensureNonReceptionistStaffExists(staffId);

    const timeValidity = await sql`
      SELECT (${startTimestampText}::timestamp < ${endTimestampText}::timestamp) AS is_valid
    `;

    if (!timeValidity[0]?.is_valid) {
      return res.status(400).json({
        success: false,
        message: "start_time must be earlier than end_time",
      });
    }

    const overlap = await sql`
      SELECT rota_id
      FROM rota
      WHERE staff_id = ${staffId}
        AND work_date = ${work_date}
        AND (${startTimestampText}::timestamp < end_time)
        AND (${endTimestampText}::timestamp > start_time)
      LIMIT 1
    `;

    if (overlap.length > 0) {
      return res.status(409).json({
        success: false,
        message: "This shift overlaps with an existing rota for this staff",
      });
    }

    const created = await sql`
      INSERT INTO rota (staff_id, start_time, end_time, work_date)
      VALUES (
        ${staffId},
        ${startTimestampText}::timestamp,
        ${endTimestampText}::timestamp,
        ${work_date}
      )
      RETURNING rota_id, staff_id, start_time, end_time, TO_CHAR(work_date, 'YYYY-MM-DD') AS work_date
    `;

    return res.status(201).json({ success: true, data: created[0] });
  } catch (error) {
    console.error("Error in assignStaffRotaByReceptionist:", error);
    const message = String(error?.message || "Failed to assign rota");

    if (
      message.toLowerCase().includes("must be between 09:00 and 17:00") ||
      message.toLowerCase().includes("invalid rota")
    ) {
      return res.status(400).json({ success: false, message });
    }

    return res.status(error.status || 500).json({
      success: false,
      message: error.message || "Failed to assign rota",
    });
  }
};

export const getPendingOrdersToday = async (req, res) => {
  const staffId = parseInteger(req.query.staff_id);

  if (!staffId) {
    return res.status(400).json({
      success: false,
      message: "A valid receptionist staff_id is required",
    });
  }

  try {
    await ensureReceptionistExists(staffId);

    const orders = await sql.query(
      `
        SELECT
          o.order_id,
          o.created_at,
          o.status,
          o.service_type,
          o.cust_id,
          CONCAT(COALESCE(c.first_name, ''), ' ', COALESCE(c.last_name, '')) AS customer_name,
          COALESCE(p.amount, 0) AS total_amount,
          p.method AS payment_method,
          p.status AS payment_status,
          COALESCE(
            JSON_AGG(
              JSON_BUILD_OBJECT(
                'item_id', i.item_id,
                'item_name', i.item_name,
                'quantity', oi.item_quantity
              )
              ORDER BY oi.row_id
            ) FILTER (WHERE oi.row_id IS NOT NULL),
            '[]'::json
          ) AS items
        FROM orders o
        LEFT JOIN customers c ON c.cust_id = o.cust_id
        LEFT JOIN payment p ON p.order_id = o.order_id
        LEFT JOIN order_items oi ON oi.order_id = o.order_id
        LEFT JOIN item i ON i.item_id = oi.item_id
        WHERE o.created_at::date = CURRENT_DATE
          AND LOWER(COALESCE(o.status, '')) = 'pending'
        GROUP BY
          o.order_id,
          o.created_at,
          o.status,
          o.service_type,
          o.cust_id,
          c.first_name,
          c.last_name,
          p.amount,
          p.method,
          p.status
        ORDER BY o.created_at ASC
      `
    );

    return res.status(200).json({
      success: true,
      data: orders.map((order) => ({
        order_id: Number(order.order_id),
        created_at: order.created_at,
        status: order.status,
        service_type: order.service_type,
        cust_id: Number(order.cust_id),
        customer_name: String(order.customer_name || "").trim() || "Customer",
        total_amount: Number(Number(order.total_amount || 0).toFixed(2)),
        payment_method: order.payment_method,
        payment_status: order.payment_status,
        items: Array.isArray(order.items)
          ? order.items.map((item) => ({
              item_id: Number(item.item_id),
              item_name: item.item_name,
              quantity: Number(item.quantity),
            }))
          : [],
      })),
    });
  } catch (error) {
    console.error("Error in getPendingOrdersToday:", error);
    return res.status(error.status || 500).json({
      success: false,
      message: error.message || "Failed to fetch pending orders",
    });
  }
};

export const approvePendingOrder = async (req, res) => {
  const staffId = parseInteger(req.body?.staff_id);
  const orderId = parseInteger(req.params.orderId);

  if (!staffId) {
    return res.status(400).json({
      success: false,
      message: "A valid receptionist staff_id is required",
    });
  }

  if (!orderId) {
    return res.status(400).json({
      success: false,
      message: "A valid order id is required",
    });
  }

  let client;

  try {
    client = await pool.connect();
    await client.query("BEGIN");

    await ensureReceptionistExists(staffId, client);

    const orderForUpdate = await client.query(
      `
        SELECT
          order_id,
          status,
          created_at,
          (created_at::date = CURRENT_DATE) AS is_today
        FROM orders
        WHERE order_id = $1
        FOR UPDATE
      `,
      [orderId]
    );

    if (!orderForUpdate.rows.length) {
      const error = new Error("Order not found");
      error.status = 404;
      throw error;
    }

    const currentOrder = orderForUpdate.rows[0];

    if (String(currentOrder.status || "").toLowerCase() !== "pending") {
      const error = new Error("Only pending orders can be approved");
      error.status = 409;
      throw error;
    }

    if (!currentOrder.is_today) {
      const error = new Error("Only today's orders can be approved from this page");
      error.status = 400;
      throw error;
    }

    const rotaId = await resolveReceptionistRotaId(staffId, client);

    if (!rotaId) {
      const error = new Error("No rota found for this receptionist");
      error.status = 400;
      throw error;
    }

    const updatedOrder = await client.query(
      `
        UPDATE orders
        SET
          status = 'completed',
          staff_id = $2,
          rota_id = $3
        WHERE order_id = $1
          AND LOWER(COALESCE(status, '')) = 'pending'
        RETURNING order_id, status, created_at
      `,
      [orderId, staffId, rotaId]
    );

    if (!updatedOrder.rows.length) {
      const error = new Error("Order approval conflict. Please refresh and try again.");
      error.status = 409;
      throw error;
    }

    const paymentInfo = await client.query(
      `
        SELECT amount, status, method
        FROM payment
        WHERE order_id = $1
        LIMIT 1
      `,
      [orderId]
    );

    await client.query("COMMIT");

    return res.status(200).json({
      success: true,
      message: "Order approved successfully",
      data: {
        order_id: Number(updatedOrder.rows[0].order_id),
        status: updatedOrder.rows[0].status,
        approved_by_staff_id: staffId,
        approved_rota_id: rotaId,
        payment_amount: Number(Number(paymentInfo.rows[0]?.amount || 0).toFixed(2)),
        payment_status: paymentInfo.rows[0]?.status || null,
        payment_method: paymentInfo.rows[0]?.method || null,
      },
    });
  } catch (error) {
    if (client) {
      try {
        await client.query("ROLLBACK");
      } catch (rollbackError) {
        console.error("Rollback failed in approvePendingOrder:", rollbackError);
      }
    }

    console.error("Error in approvePendingOrder:", error);
    return res.status(error.status || 500).json({
      success: false,
      message: error.message || "Failed to approve order",
    });
  } finally {
    client?.release();
  }
};