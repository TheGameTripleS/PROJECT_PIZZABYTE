/**
 * QUICK REFERENCE: CHECKOUT DATA STRUCTURES
 * 
 * Use this file to quickly understand what data flows where
 * in the checkout process.
 */

// ============================================================
// STAGE 1: CHECKOUT FORM SUBMISSION
// ============================================================

const CHECKOUT_FORM_DATA = {
  // Customer information (retrieved from logged-in user profile)
  customerData: {
    cust_id: 123,                    // Unique customer ID from database
    add_id: 456,                     // Address ID from database
    fullname: "John Doe",            // Display only
    email: "john@example.com",       // Display only
    number: "555-1234",              // For delivery/contact
    address1: "123 Main St",         // Address line 1
    address2: "Apt 4B",              // Address line 2 (optional)
    zipcode: "12345"                 // Postal code
  },

  // Service type selected by user
  serviceType: "dine-in",            // OR "delivery"

  // Items from USER'S CART
  items: [
    {
      item_id: 1,
      item_name: "Margherita Pizza",
      quantity: 2
      // NOTE: NO PRICE HERE - will be fetched from backend
    },
    {
      item_id: 5,
      item_name: "Caesar Salad",
      quantity: 1
    }
  ],

  // Summary info (for UI display)
  totalItems: 2,       // Number of different items
  totalQuantity: 3     // Total number of items (2+1)
};

/**
 * What happens: User clicks "Proceed to Payment" button
 * Validation enforced:
 *   ✓ cust_id must exist
 *   ✓ add_id must exist
 *   ✓ serviceType must be "dine-in" or "delivery"
 *   ✓ If delivery: address1 must NOT be null
 *   ✓ number must NOT be null
 *   ✓ items must NOT be empty
 *   ✓ All items must have valid item_id and quantity > 0
 */

// ============================================================
// STAGE 2: PAYMENT MODAL SUBMISSION
// ============================================================

const PAYMENT_FORM_DATA = {
  // Payment method - user selects ONE
  method: "cash",      // OR "card" OR "mfs"

  // Payment amount - user enters
  amount: 45.99        // Must be > 0 and >= totalAmount from backend
};

/**
 * Payment modal shows:
 *   • Order items summary (from checkoutData)
 *   • Service type (dine-in or delivery)
 *   • Total amount (calculated on backend)
 * 
 * User selects:
 *   • Payment method (radio button: cash, card, mfs)
 *   • Payment amount (number input)
 * 
 * Validation:
 *   ✓ method must be "cash", "card", or "mfs"
 *   ✓ amount must be > 0
 *   ✓ amount must be >= totalAmount
 */

// ============================================================
// STAGE 3: COMPLETE ORDER SUBMISSION TO BACKEND
// ============================================================

const ORDER_SUBMISSION_DATA = {
  // Order information (maps to 'orders' table)
  order: {
    cust_id: 123,                 // From customerData
    add_id: 456,                  // From customerData
    service_type: "dine-in",      // From serviceType
    status: "pending",            // Auto-set, value is always "pending"
    created_at: "2026-03-27T10:30:00Z" // Auto-set to current time
  },

  // Order items (maps to 'order_items' table - multiple rows)
  items: [
    {
      item_id: 1,
      item_quantity: 2
      // total_price: CALCULATED BY BACKEND (item_price from items table × quantity)
    },
    {
      item_id: 5,
      item_quantity: 1
      // total_price: CALCULATED BY BACKEND
    }
  ],

  // Payment information (maps to 'payment' table)
  payment: {
    order_id: null,               // FILLED BY BACKEND (after orders INSERT)
    amount: 45.99,                // From paymentData
    method: "cash",               // From paymentData
    status: "pending"             // Auto-set, value is always "pending"
  }
};

/**
 * Backend receives this structure and:
 * 
 * 1. For the ORDER:
 *    INSERT INTO orders (cust_id, add_id, service_type, status)
 *    VALUES (123, 456, 'dine-in', 'pending')
 *    RETURNING order_id → GETS order_id (e.g., 789)
 * 
 * 2. For each ITEM:
 *    INSERT INTO order_items (order_id, item_id, item_quantity, total_price)
 *    Fetch item_price from items table for each item_id
 *    Calculate: total_price = item_price × item_quantity
 * 
 * 3. For the PAYMENT:
 *    INSERT INTO payment (order_id, amount, method, status)
 *    VALUES (789, 45.99, 'cash', 'pending')
 *    RETURNING transaction_id
 * 
 * Backend returns:
 *    {
 *      success: true,
 *      order_id: 789,
 *      transaction_id: 100
 *    }
 */

// ============================================================
// STAGE 4: AFTER SUCCESSFUL ORDER
// ============================================================

const ON_SUCCESS_RESPONSE = {
  success: true,
  order_id: 789,           // From database INSERT RETURNING
  transaction_id: 100,     // From database INSERT RETURNING
  message: "Order created successfully"
};

/**
 * Frontend then:
 * 1. Clear cart (remove all items)
 * 2. Show success confirmation message
 * 3. Redirect to /order-confirmation/{order_id}
 * 4. Clear localStorage cart data
 */

// ============================================================
// KEY DIFFERENCES FROM OLD SYSTEM
// ============================================================

/**
 * OLD CHECKOUT SYSTEM:
 * • Collected fullname, email, address, phone in form
 * • Calculated prices on frontend
 * • Included tax calculations
 * • Had promo code logic
 * • Submitted ALL data at once
 * 
 * NEW CHECKOUT SYSTEM:
 * • Uses profile data (already collected)
 * • Only collects service type selection
 * • NO price/tax calculations (backend handles)
 * • NO promo code collection
 * • Two-step process: Checkout → Payment
 * • Data structure directly matches database schema
 */

// ============================================================
// EXAMPLE: ACTUAL VALUES IN CHECKOUT FLOW
// ============================================================

const EXAMPLE_FULL_FLOW = {
  step1_checkoutForm: {
    customerData: {
      cust_id: 42,
      add_id: 33,
      fullname: "Alice Johnson",
      email: "alice@email.com",
      number: "555-9876",
      address1: "789 Oak Avenue",
      address2: "Suite 200",
      zipcode: "54321"
    },
    serviceType: "delivery",
    items: [
      { item_id: 10, item_name: "Pepperoni Pizza Large", quantity: 1 },
      { item_id: 15, item_name: "Garlic Bread Sticks", quantity: 2 }
    ],
    totalItems: 2,
    totalQuantity: 3
  },

  step2_paymentForm: {
    method: "card",
    amount: 52.50
  },

  step3_backendProcessing: {
    // Backend receives this combined data
    order: {
      cust_id: 42,
      add_id: 33,
      service_type: "delivery",
      status: "pending",
      created_at: "2026-03-27T15:45:30Z"
    },
    items: [
      { item_id: 10, item_quantity: 1 },
      { item_id: 15, item_quantity: 2 }
    ],
    payment: {
      order_id: null, // Will be filled
      amount: 52.50,
      method: "card",
      status: "pending"
    },
    
    // Backend queries items table to get prices:
    // SELECT item_price FROM item WHERE item_id IN (10, 15)
    // item_id=10: item_price=28.99 → total_price = 28.99 × 1 = 28.99
    // item_id=15: item_price=9.99  → total_price = 9.99 × 2 = 19.98
    // ORDER TOTAL: 28.99 + 19.98 = 48.97
  },

  step4_backendResponse: {
    success: true,
    order_id: 5001,
    transaction_id: 8765,
    order_details: {
      customer_name: "Alice Johnson",
      service_type: "delivery",
      items_count: 2,
      total_quantity: 3,
      total_amount: 48.97,
      payment_method: "card",
      payment_amount: 52.50,
      created_at: "2026-03-27T15:45:30Z"
    }
  }
};

// ============================================================
// DATABASE SCHEMA ALIGNMENT
// ============================================================

const DATABASE_MAPPING = {
  // TABLE: orders
  orders_row: {
    order_id: 5001,              // Generated by sequence
    cust_id: 42,                 // From order.cust_id
    add_id: 33,                  // From order.add_id
    rota_id: null,               // Optional - staff assignment
    coupon_id: null,             // Optional - discount code
    created_at: "2026-03-27T15:45:30Z", // From order.created_at
    status: "pending",           // From order.status
    service_type: "delivery",    // From order.service_type
    total_discount: null         // Optional - discount amount
  },

  // TABLE: order_items (2 rows for above example)
  order_items_row_1: {
    row_id: 10001,               // Generated by sequence
    order_id: 5001,              // Links to orders
    item_id: 10,                 // From items[0].item_id
    item_quantity: 1,            // From items[0].item_quantity
    total_price: 28.99           // Calculated: item_price × quantity
  },

  order_items_row_2: {
    row_id: 10002,
    order_id: 5001,
    item_id: 15,
    item_quantity: 2,
    total_price: 19.98           // Calculated: 9.99 × 2
  },

  // TABLE: payment (1 row)
  payment_row: {
    transaction_id: 8765,        // Generated by sequence
    order_id: 5001,              // Links to orders
    amount: 52.50,               // From payment.amount
    status: "pending",           // From payment.status
    method: "card"               // From payment.method
  }
};

// ============================================================
// VALIDATION CHECKLIST FOR BACKEND
// ============================================================

const BACKEND_VALIDATION = {
  before_insert: [
    "✓ customer with cust_id = 42 exists in customers table",
    "✓ address with add_id = 33 exists in address table",
    "✓ item with item_id = 10 exists in item table",
    "✓ item with item_id = 15 exists in item table",
    "✓ service_type is 'dine-in' or 'delivery'",
    "✓ payment method is 'cash', 'card', or 'mfs'",
    "✓ payment amount > 0"
  ],

  after_insert: [
    "✓ order was inserted and order_id assigned",
    "✓ 2 order_items rows created",
    "✓ 1 payment row created",
    "✓ All foreign keys satisfied"
  ],

  error_recovery: [
    "If any insert fails → ROLLBACK entire transaction",
    "No partial orders should exist in database"
  ]
};

export {
  CHECKOUT_FORM_DATA,
  PAYMENT_FORM_DATA,
  ORDER_SUBMISSION_DATA,
  ON_SUCCESS_RESPONSE,
  EXAMPLE_FULL_FLOW,
  DATABASE_MAPPING,
  BACKEND_VALIDATION
};
