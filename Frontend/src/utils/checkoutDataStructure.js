/**
 * Utility functions to structure checkout data for database insertion
 * Following the schema from postgrepizzabyte.sql
 */

/**
 * Structures order data for database insertion
 * @param {Object} checkoutData - Data from checkout form
 * @returns {Object} Structured order data
 */
export const structureOrderData = (checkoutData) => {
  const { customerData, items, serviceType } = checkoutData;

  return {
    // Order main table data
    order: {
      cust_id: customerData.cust_id, // From profile/customer
      add_id: customerData.add_id, // From profile/address
      service_type: serviceType, // "dine-in" or "delivery"
      status: "pending", // Initial status
      created_at: new Date().toISOString(),
    },
    // Order items table data
    items: items.map((item) => ({
      item_id: item.item_id,
      item_quantity: item.quantity,
      // total_price will be calculated on backend using item_price from items table
    })),
  };
};

/**
 * Structures payment data for database insertion
 * @param {number} orderId - Order ID from created order
 * @param {Object} paymentData - Payment form data
 * @returns {Object} Structured payment data
 */
export const structurePaymentData = (orderId, paymentData) => {
  const { method, amount } = paymentData;

  return {
    order_id: orderId,
    amount: parseFloat(amount),
    method: method, // "cash", "card", or "mfs"
    status: "pending", // Payment status
  };
};

/**
 * Validates checkout data before submission
 * @param {Object} checkoutData - Data from checkout form
 * @returns {Object} { isValid: boolean, errors: string[] }
 */
export const validateCheckoutData = (checkoutData) => {
  const errors = [];

  if (!checkoutData.customerData || !checkoutData.customerData.cust_id) {
    errors.push("Customer information is required");
  }

  if (!checkoutData.customerData || !checkoutData.customerData.add_id) {
    errors.push("Address is required");
  }

  if (!checkoutData.serviceType || !["dine-in", "delivery"].includes(checkoutData.serviceType)) {
    errors.push("Service type must be 'dine-in' or 'delivery'");
  }

  if (!Array.isArray(checkoutData.items) || checkoutData.items.length === 0) {
    errors.push("At least one item must be selected");
  }

  if (checkoutData.items.some((item) => !item.item_id || item.quantity < 1)) {
    errors.push("All items must have valid ID and quantity");
  }

  return {
    isValid: errors.length === 0,
    errors,
  };
};

/**
 * Validates payment data before submission
 * @param {Object} paymentData - Data from payment form
 * @param {number} totalAmount - Total order amount
 * @returns {Object} { isValid: boolean, errors: string[] }
 */
export const validatePaymentData = (paymentData, totalAmount) => {
  const errors = [];

  if (!paymentData.method || !["cash", "card", "mfs"].includes(paymentData.method)) {
    errors.push("Payment method must be 'cash', 'card', or 'mfs'");
  }

  if (!paymentData.amount || parseFloat(paymentData.amount) <= 0) {
    errors.push("Payment amount must be greater than 0");
  }

  if (parseFloat(paymentData.amount) < totalAmount) {
    errors.push(`Payment amount must be at least $${totalAmount}`);
  }

  return {
    isValid: errors.length === 0,
    errors,
  };
};

/**
 * Formats checkout and payment data into a single submission object
 * @param {Object} checkoutData - Checkout form data
 * @param {Object} paymentData - Payment form data
 * @param {number} orderId - Created order ID
 * @returns {Object} Complete order submission data
 */
export const formatOrderSubmission = (checkoutData, paymentData, orderId) => {
  return {
    order: {
      ...structureOrderData(checkoutData).order,
      order_id: orderId, // Add order ID if already created
    },
    orderItems: structureOrderData(checkoutData).items,
    payment: structurePaymentData(orderId, paymentData),
  };
};

/**
 * Transforms cart items to order items format
 * @param {Array} cartItems - Cart items from CartContext
 * @returns {Array} Order items ready for order_items table
 */
export const transformCartItemsToOrderItems = (cartItems) => {
  return cartItems.map((item) => ({
    item_id: item.id || item.item_id, // Handle different naming conventions
    item_name: item.ItemName || item.item_name,
    quantity: item.quantity || 1,
    // Price will be fetched from database on backend
  }));
};
