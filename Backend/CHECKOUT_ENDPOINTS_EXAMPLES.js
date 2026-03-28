/**
 * BACKEND IMPLEMENTATION EXAMPLES
 * 
 * This file shows how to implement the two required backend endpoints
 * for the schema-friendly checkout system.
 * 
 * Technology: Node.js/Express with PostgreSQL (pg package)
 */

// ============================================================
// ENDPOINT 1: POST /orders/calculate-total
// ============================================================

/**
 * Purpose: Calculate order total from items
 * 
 * The frontend sends item_id and quantity
 * Backend fetches prices from database and calculates total
 */

// Request Format:
const calculateTotalRequest = {
  items: [
    { item_id: 1, quantity: 2 },
    { item_id: 5, quantity: 1 },
    { item_id: 10, quantity: 3 }
  ]
};

// Response Format:
const calculateTotalResponse = {
  success: true,
  data: {
    subtotal: 98.76,  // Total before any processing fees
    itemBreakdown: [
      {
        item_id: 1,
        item_name: "Margherita Pizza",
        unit_price: 12.99,
        quantity: 2,
        total: 25.98
      },
      {
        item_id: 5,
        item_name: "Caesar Salad",
        unit_price: 9.99,
        quantity: 1,
        total: 9.99
      },
      {
        item_id: 10,
        item_name: "Garlic Bread",
        unit_price: 7.60,
        quantity: 3,
        total: 22.80
      }
    ]
  }
};

// ============================================================
// EXAMPLE NODE.JS/EXPRESS IMPLEMENTATION
// ============================================================

/**
 * Controller method for calculating total
 * 
 * Usage:
 * app.post('/orders/calculate-total', calculateTotal);
 */
const calculateTotal = async (req, res) => {
  try {
    const { items } = req.body;

    // Validate input
    if (!items || !Array.isArray(items) || items.length === 0) {
      return res.status(400).json({
        success: false,
        message: "Items array is required and must not be empty"
      });
    }

    // Validate each item
    for (const item of items) {
      if (!item.item_id || item.quantity < 1) {
        return res.status(400).json({
          success: false,
          message: "Each item must have valid item_id and quantity"
        });
      }
    }

    // Fetch prices from database
    const itemBreakdown = [];
    let subtotal = 0;

    for (const cartItem of items) {
      try {
        // Query database for item price
        const result = await pool.query(
          'SELECT item_id, item_name, item_price FROM item WHERE item_id = $1',
          [cartItem.item_id]
        );

        if (result.rows.length === 0) {
          return res.status(404).json({
            success: false,
            message: `Item with ID ${cartItem.item_id} not found`
          });
        }

        const item = result.rows[0];
        const lineTotal = item.item_price * cartItem.quantity;

        itemBreakdown.push({
          item_id: item.item_id,
          item_name: item.item_name,
          unit_price: parseFloat(item.item_price),
          quantity: cartItem.quantity,
          total: parseFloat(lineTotal.toFixed(2))
        });

        subtotal += lineTotal;
      } catch (error) {
        console.error(`Error fetching item ${cartItem.item_id}:`, error);
        return res.status(500).json({
          success: false,
          message: `Error processing item ${cartItem.item_id}`
        });
      }
    }

    // Return success response
    return res.status(200).json({
      success: true,
      data: {
        subtotal: parseFloat(subtotal.toFixed(2)),
        itemBreakdown
      }
    });
  } catch (error) {
    console.error("Calculate total error:", error);
    return res.status(500).json({
      success: false,
      message: "Error calculating total"
    });
  }
};

// ============================================================
// ENDPOINT 2: POST /orders/create
// ============================================================

/**
 * Purpose: Create complete order with items and payment
 * 
 * This is the main endpoint that inserts records into:
 * - orders table
 * - order_items table
 * - payment table
 * 
 * All done in a database transaction for safety
 */

// Request Format:
const createOrderRequest = {
  order: {
    cust_id: 42,
    add_id: 33,
    service_type: "delivery"  // or "dine-in"
  },
  items: [
    { item_id: 1, quantity: 2 },
    { item_id: 5, quantity: 1 }
  ],
  payment: {
    method: "card",  // or "cash" or "mfs"
    amount: 48.97
  }
};

// Response Format:
const createOrderResponse = {
  success: true,
  data: {
    order_id: 5001,
    transaction_id: 8765,
    order_details: {
      cust_id: 42,
      service_type: "delivery",
      created_at: "2026-03-27T15:45:30Z",
      items_count: 2,
      total_quantity: 3,
      payment_method: "card",
      payment_amount: 48.97,
      payment_status: "pending"
    }
  }
};

// ============================================================
// EXAMPLE NODE.JS/EXPRESS IMPLEMENTATION WITH TRANSACTION
// ============================================================

/**
 * Controller method for creating order
 * 
 * Usage:
 * app.post('/orders/create', createOrder);
 */
const createOrder = async (req, res) => {
  const { order, items, payment } = req.body;
  const client = await pool.connect();

  try {
    // Validate input
    if (!order || !items || !payment) {
      return res.status(400).json({
        success: false,
        message: "Missing order, items, or payment data"
      });
    }

    // Validate order data
    if (!order.cust_id || !order.add_id || !order.service_type) {
      return res.status(400).json({
        success: false,
        message: "Order must have cust_id, add_id, and service_type"
      });
    }

    if (!["dine-in", "delivery"].includes(order.service_type)) {
      return res.status(400).json({
        success: false,
        message: "service_type must be 'dine-in' or 'delivery'"
      });
    }

    // Validate items
    if (!Array.isArray(items) || items.length === 0) {
      return res.status(400).json({
        success: false,
        message: "At least one item is required"
      });
    }

    // Validate payment data
    if (!payment.method || !payment.amount) {
      return res.status(400).json({
        success: false,
        message: "Payment must have method and amount"
      });
    }

    if (!["cash", "card", "mfs"].includes(payment.method)) {
      return res.status(400).json({
        success: false,
        message: "Payment method must be 'cash', 'card', or 'mfs'"
      });
    }

    if (payment.amount <= 0) {
      return res.status(400).json({
        success: false,
        message: "Payment amount must be greater than 0"
      });
    }

    // START TRANSACTION
    await client.query('BEGIN');

    // ===== STEP 1: Verify customer exists
    const customerCheck = await client.query(
      'SELECT cust_id FROM customers WHERE cust_id = $1',
      [order.cust_id]
    );

    if (customerCheck.rows.length === 0) {
      await client.query('ROLLBACK');
      return res.status(404).json({
        success: false,
        message: `Customer with ID ${order.cust_id} not found`
      });
    }

    // ===== STEP 2: Verify address exists
    const addressCheck = await client.query(
      'SELECT add_id FROM address WHERE add_id = $1',
      [order.add_id]
    );

    if (addressCheck.rows.length === 0) {
      await client.query('ROLLBACK');
      return res.status(404).json({
        success: false,
        message: `Address with ID ${order.add_id} not found`
      });
    }

    // ===== STEP 3: Create order record
    const orderResult = await client.query(
      `INSERT INTO orders (cust_id, add_id, service_type, status, created_at)
       VALUES ($1, $2, $3, $4, CURRENT_TIMESTAMP)
       RETURNING order_id, created_at`,
      [order.cust_id, order.add_id, order.service_type, 'pending']
    );

    const orderId = orderResult.rows[0].order_id;
    const createdAt = orderResult.rows[0].created_at;

    // ===== STEP 4: Create order items
    for (const item of items) {
      // Verify item exists
      const itemCheck = await client.query(
        'SELECT item_id, item_name, item_price FROM item WHERE item_id = $1',
        [item.item_id]
      );

      if (itemCheck.rows.length === 0) {
        await client.query('ROLLBACK');
        return res.status(404).json({
          success: false,
          message: `Item with ID ${item.item_id} not found`
        });
      }

      const itemPrice = itemCheck.rows[0].item_price;
      const totalPrice = itemPrice * item.quantity;

      // Insert order item
      await client.query(
        `INSERT INTO order_items (order_id, item_id, item_quantity, total_price)
         VALUES ($1, $2, $3, $4)`,
        [orderId, item.item_id, item.quantity, totalPrice]
      );
    }

    // ===== STEP 5: Create payment record
    const paymentResult = await client.query(
      `INSERT INTO payment (order_id, amount, method, status)
       VALUES ($1, $2, $3, $4)
       RETURNING transaction_id`,
      [orderId, payment.amount, payment.method, 'pending']
    );

    const transactionId = paymentResult.rows[0].transaction_id;

    // ===== STEP 6: Calculate totals for response
    const totals = await client.query(
      `SELECT 
        COUNT(*) as items_count,
        SUM(item_quantity) as total_quantity
       FROM order_items
       WHERE order_id = $1`,
      [orderId]
    );

    const stats = totals.rows[0];

    // COMMIT TRANSACTION
    await client.query('COMMIT');

    // Return success response
    return res.status(201).json({
      success: true,
      data: {
        order_id: orderId,
        transaction_id: transactionId,
        order_details: {
          cust_id: order.cust_id,
          service_type: order.service_type,
          created_at: createdAt.toISOString(),
          items_count: parseInt(stats.items_count),
          total_quantity: parseInt(stats.total_quantity),
          payment_method: payment.method,
          payment_amount: parseFloat(payment.amount),
          payment_status: 'pending'
        }
      }
    });
  } catch (error) {
    // ROLLBACK on any error
    await client.query('ROLLBACK');
    console.error('Create order error:', error);

    return res.status(500).json({
      success: false,
      message: error.message || "Error creating order"
    });
  } finally {
    client.release();
  }
};

// ============================================================
// ERROR RESPONSE FORMATS
// ============================================================

const errorResponses = {
  // 400 - Bad Request
  missingData: {
    success: false,
    message: "Missing required field: {fieldName}"
  },

  // 404 - Not Found
  customerNotFound: {
    success: false,
    message: "Customer with ID {cust_id} not found"
  },

  itemNotFound: {
    success: false,
    message: "Item with ID {item_id} not found"
  },

  addressNotFound: {
    success: false,
    message: "Address with ID {add_id} not found"
  },

  // 500 - Server Error
  databaseError: {
    success: false,
    message: "Database error occurred during order creation"
  },

  transactionError: {
    success: false,
    message: "Transaction failed - order not created"
  }
};

// ============================================================
// USAGE IN EXPRESS APP
// ============================================================

/**
 * app.js setup:
 * 
 * const express = require('express');
 * const { Pool } = require('pg');
 * 
 * const app = express();
 * app.use(express.json());
 * 
 * const pool = new Pool({
 *   user: 'your_user',
 *   password: 'your_password',
 *   host: 'localhost',
 *   port: 5432,
 *   database: 'pizzabyte'
 * });
 * 
 * // Make pool accessible to controllers
 * global.pool = pool;
 * 
 * // Routes
 * app.post('/orders/calculate-total', calculateTotal);
 * app.post('/orders/create', createOrder);
 * 
 * app.listen(5000, () => {
 *   console.log('Server running on port 5000');
 * });
 */

// ============================================================
// TESTING WITH CURL
// ============================================================

/**
 * Test Calculate Total:
 * 
 * curl -X POST http://localhost:5000/orders/calculate-total \
 *   -H "Content-Type: application/json" \
 *   -d '{
 *     "items": [
 *       {"item_id": 1, "quantity": 2},
 *       {"item_id": 5, "quantity": 1}
 *     ]
 *   }'
 */

/**
 * Test Create Order:
 * 
 * curl -X POST http://localhost:5000/orders/create \
 *   -H "Content-Type: application/json" \
 *   -d '{
 *     "order": {
 *       "cust_id": 42,
 *       "add_id": 33,
 *       "service_type": "delivery"
 *     },
 *     "items": [
 *       {"item_id": 1, "quantity": 2},
 *       {"item_id": 5, "quantity": 1}
 *     ],
 *     "payment": {
 *       "method": "card",
 *       "amount": 48.97
 *     }
 *   }'
 */

// ============================================================
// KEY IMPLEMENTATION NOTES
// ============================================================

/**
 * 1. TRANSACTION SAFETY
 *    - Always use BEGIN/COMMIT/ROLLBACK
 *    - Ensures atomic database operations
 *    - No partial orders if error occurs
 * 
 * 2. VALIDATION MUST HAPPEN FIRST
 *    - Check customer exists
 *    - Check address exists
 *    - Check items exist
 *    - Before any INSERT
 * 
 * 3. PRICE CALCULATION MUST BE ON BACKEND
 *    - Fetch item_price from items table
 *    - Multiply by quantity
 *    - Frontend cannot be trusted with prices
 * 
 * 4. RETURN ORDER AND TRANSACTION IDS
 *    - Frontend needs these for confirmation page
 *    - Use for tracking and debugging
 * 
 * 5. LOG EVERYTHING
 *    - Log successful orders
 *    - Log failed transactions
 *    - Log validation errors
 * 
 * 6. HANDLE EDGE CASES
 *    - Quantity = 0
 *    - Negative amounts
 *    - Invalid enum values
 *    - Database connection lost mid-transaction
 */

export {
  calculateTotal,
  createOrder,
  calculateTotalRequest,
  calculateTotalResponse,
  createOrderRequest,
  createOrderResponse,
  errorResponses
};
