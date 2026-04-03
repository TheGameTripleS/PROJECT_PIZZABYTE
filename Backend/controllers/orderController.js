import { pool, sql } from "../../Database/db.js";

const roundCurrency = (value) => Number(Number(value || 0).toFixed(2));

const createHttpError = (status, message) => {
  const error = new Error(message);
  error.status = status;
  return error;
};

const normalizeItems = (items) => {
  if (!Array.isArray(items) || items.length === 0) {
    throw createHttpError(400, "Items array is required and must not be empty");
  }

  return items.map((item, index) => {
    const itemId = Number(item?.item_id);
    const quantity = Number(item?.quantity);

    if (!Number.isInteger(itemId) || itemId <= 0) {
      throw createHttpError(
        400,
        `Item at position ${index + 1} has an invalid item_id. Received: ${JSON.stringify(item)}`
      );
    }

    if (!Number.isInteger(quantity) || quantity <= 0) {
      throw createHttpError(400, `Item ${itemId} must have a quantity greater than 0`);
    }

    return {
      item_id: itemId,
      quantity,
    };
  });
};

const getItemBreakdown = async (normalizedItems) => {
  const itemIds = [...new Set(normalizedItems.map((item) => item.item_id))];
  const rows = await sql.query(
    `
      SELECT item_id, item_name, item_price
      FROM item
      WHERE item_id = ANY($1::int[])
    `,
    [itemIds]
  );

  const itemMap = new Map(
    rows.map((item) => [
      Number(item.item_id),
      {
        item_id: Number(item.item_id),
        item_name: item.item_name,
        unit_price: roundCurrency(item.item_price),
      },
    ])
  );

  return normalizedItems.map((cartItem) => {
    const item = itemMap.get(cartItem.item_id);

    if (!item) {
      throw createHttpError(404, `Item with ID ${cartItem.item_id} not found`);
    }

    const total = roundCurrency(item.unit_price * cartItem.quantity);

    return {
      item_id: item.item_id,
      item_name: item.item_name,
      unit_price: item.unit_price,
      quantity: cartItem.quantity,
      total,
    };
  });
};

const getValidCoupon = async (couponCode) => {
  if (!couponCode) {
    return null;
  }

  const normalizedCode = couponCode.trim().toUpperCase();

  if (!normalizedCode) {
    return null;
  }

  const rows = await sql`
    SELECT coupon_id, code, discount_percent, min_order_amount
    FROM coupons
    WHERE UPPER(code) = ${normalizedCode}
      AND is_active = TRUE
      AND (start_date IS NULL OR start_date <= CURRENT_DATE)
      AND (end_date IS NULL OR end_date >= CURRENT_DATE)
    LIMIT 1
  `;

  if (rows.length === 0) {
    throw createHttpError(404, "Coupon code is invalid or inactive");
  }

  return {
    coupon_id: Number(rows[0].coupon_id),
    code: rows[0].code,
    discount_percent: roundCurrency(rows[0].discount_percent),
    min_order_amount: roundCurrency(rows[0].min_order_amount),
  };
};

const calculatePricing = async (items, couponCode) => {
  const normalizedItems = normalizeItems(items);
  const itemBreakdown = await getItemBreakdown(normalizedItems);
  const subtotal = roundCurrency(
    itemBreakdown.reduce((sum, item) => sum + Number(item.total), 0)
  );

  let coupon = null;
  let discount = 0;

  if (couponCode) {
    coupon = await getValidCoupon(couponCode);

    if (subtotal < coupon.min_order_amount) {
      throw createHttpError(
        400,
        `This coupon requires a minimum order amount of $${coupon.min_order_amount.toFixed(2)}`
      );
    }

    discount = roundCurrency(
      (coupon.discount_percent / 100) * coupon.min_order_amount
    );
  }

  return {
    subtotal,
    discount,
    total: roundCurrency(Math.max(subtotal - discount, 0)),
    itemBreakdown,
    coupon,
  };
};

const validateOrderPayload = (order, payment) => {
  if (!order || typeof order !== "object") {
    throw createHttpError(400, "Order details are required");
  }

  if (!payment || typeof payment !== "object") {
    throw createHttpError(400, "Payment details are required");
  }

  const custId = Number(order.cust_id);
  const addId =
    order.add_id === null || order.add_id === undefined || order.add_id === ""
      ? null
      : Number(order.add_id);

  if (!Number.isInteger(custId) || custId <= 0) {
    throw createHttpError(400, "Order must include a valid cust_id");
  }

  if (addId !== null && (!Number.isInteger(addId) || addId <= 0)) {
    throw createHttpError(400, "Order add_id must be a valid number");
  }

  if (!["dine-in", "delivery"].includes(order.service_type)) {
    throw createHttpError(400, "service_type must be 'dine-in' or 'delivery'");
  }

  if (order.service_type === "delivery" && addId === null) {
    throw createHttpError(400, "Delivery orders require a valid add_id");
  }

  if (!["cash", "card", "mfs"].includes(payment.method)) {
    throw createHttpError(400, "Payment method must be 'cash', 'card', or 'mfs'");
  }

  return {
    cust_id: custId,
    add_id: addId,
    service_type: order.service_type,
    status: order.status || "pending",
    coupon_code: order.coupon_code?.trim() || null,
    payment_method: payment.method,
    payment_status: payment.status || "pending",
  };
};

const ensureOrderRelationsExist = async ({ cust_id, add_id }) => {
  const customerRows = await sql`
    SELECT cust_id
    FROM customers
    WHERE cust_id = ${cust_id}
    LIMIT 1
  `;

  if (customerRows.length === 0) {
    throw createHttpError(404, `Customer with ID ${cust_id} not found`);
  }

  if (add_id === null) {
    return;
  }

  const addressRows = await sql`
    SELECT add_id
    FROM address
    WHERE add_id = ${add_id}
    LIMIT 1
  `;

  if (addressRows.length === 0) {
    throw createHttpError(404, `Address with ID ${add_id} not found`);
  }
};

export const calculateOrderTotal = async (req, res) => {
  try {
    const pricing = await calculatePricing(req.body?.items, req.body?.coupon_code);

    res.status(200).json({
      success: true,
      data: pricing,
    });
  } catch (error) {
    console.error("Error calculating order total:", error);
    res.status(error.status || 500).json({
      success: false,
      message: error.message || "Failed to calculate order total",
    });
  }
};

export const createOrder = async (req, res) => {
  let client;

  try {
    const { order, items, payment } = req.body || {};
    const validatedOrder = validateOrderPayload(order, payment);
    await ensureOrderRelationsExist(validatedOrder);
    const normalizedItems = normalizeItems(items);

    client = await pool.connect();

    const checkoutResponse = await client.query(
      `
        CALL process_checkout(
          $1::INT,
          $2::INT,
          $3::VARCHAR(30),
          $4::VARCHAR(50),
          $5::VARCHAR(30),
          $6::VARCHAR(30),
          $7::VARCHAR(30),
          $8::JSONB,
          NULL::INT,
          NULL::INT,
          NULL::TIMESTAMP,
          NULL::NUMERIC(10,2),
          NULL::NUMERIC(10,2),
          NULL::NUMERIC(10,2),
          NULL::INT,
          NULL::VARCHAR(50)
        )
      `,
      [
        validatedOrder.cust_id,
        validatedOrder.add_id,
        validatedOrder.service_type,
        validatedOrder.coupon_code,
        validatedOrder.payment_method,
        validatedOrder.payment_status,
        validatedOrder.status,
        JSON.stringify(normalizedItems),
      ]
    );
    const [checkoutResult] = checkoutResponse.rows;

    const pricing = {
      subtotal: roundCurrency(checkoutResult.o_subtotal),
      discount: roundCurrency(checkoutResult.o_discount),
      total: roundCurrency(checkoutResult.o_total),
      itemBreakdown: [],
      coupon: checkoutResult.o_coupon_id
        ? {
            coupon_id: Number(checkoutResult.o_coupon_id),
            code: checkoutResult.o_coupon_code,
          }
        : null,
    };

    res.status(201).json({
      success: true,
      data: {
        order_id: Number(checkoutResult.o_order_id),
        transaction_id: Number(checkoutResult.o_transaction_id),
        created_at: checkoutResult.o_created_at,
        pricing,
      },
    });
  } catch (error) {
    console.error("Error creating order:", error);
    res.status(error.status || 500).json({
      success: false,
      message: error.message || "Failed to create order",
    });
  } finally {
    client?.release();
  }
};
