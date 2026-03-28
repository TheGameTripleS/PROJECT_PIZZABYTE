# Checkout Refactor Summary - Schema-Friendly Checkout Procedure

## Overview
The checkout procedure has been completely refactored to be schema-friendly and directly map to your PostgreSQL database structure. No data is processed on the frontend - only collected and validated.

---

## File Structure Changes

### Created Files

1. **`src/utils/checkoutDataStructure.js`**
   - Data validation functions
   - Data structure formatting utilities
   - Prepares data for database insertion
   - Functions:
     - `validateCheckoutData()` - Validates checkout form
     - `validatePaymentData()` - Validates payment form
     - `structureOrderData()` - Prepares order data
     - `structurePaymentData()` - Prepares payment data

2. **`src/features/checkout/components/payment/PaymentModal.jsx`**
   - New component for payment collection
   - Shows order summary
   - Collects: payment method (cash/card/mfs) & amount
   - Validates payment data
   - Emits payment data to parent

3. **`src/features/checkout/components/payment/payment-modal.css`**
   - Beautiful modal styling
   - Responsive design
   - Professional UX with animations

4. **`src/utils/CHECKOUT_STRUCTURE_GUIDE.js`**
   - Complete implementation guide
   - Database queries reference
   - API endpoint specifications
   - Field mapping documentation

### Modified Files

1. **`src/features/checkout/components/checkout/CheckoutForm.jsx`**
   - Simplified to essential data only:
     - Customer info (from profile)
     - Address (from profile)
     - Service type selection (dine-in/delivery)
     - Order items summary (with quantities)
   - Removed: Price calculations, taxes, promo codes
   - Now emits `onCheckoutComplete` callback with structured data

2. **`src/features/checkout/components/checkout/CheckoutForm.css`** (NEW)
   - Professional styling for checkout form
   - Mobile responsive
   - Clear visual hierarchy

3. **`src/features/checkout/components/checkout/Checkout.jsx`**
   - Manages checkout flow orchestration
   - Handles CheckoutForm → PaymentModal transition
   - Prepares data for backend submission
   - TODO comments for backend integration

---

## Data Flow Architecture

### Step 1: Checkout Form Submission
```javascript
{
  customerData: {
    cust_id: number,          // From profile
    add_id: number,           // From profile
    fullname: string,
    email: string,
    number: string,
    address1: string,
    address2: string,
    zipcode: string
  },
  serviceType: "dine-in" | "delivery",
  items: [
    {
      item_id: number,
      item_name: string,
      quantity: number
    }
  ],
  totalItems: number,
  totalQuantity: number
}
```

### Step 2: Payment Modal Submission
```javascript
{
  method: "cash" | "card" | "mfs",
  amount: number
}

### Step 3: Complete Order Data (Ready for Backend)
```javascript
{
  order: {
    cust_id: number,
    add_id: number,
    service_type: "dine-in" | "delivery",
    status: "pending",
    created_at: timestamp
  },
  items: [
    {
      item_id: number,
      item_quantity: number
      // total_price calculated on backend from item_price * quantity
    }
  ],
  payment: {
    order_id: number,        // From order INSERT
    amount: number,
    method: "cash" | "card" | "mfs",
    status: "pending"
  }
}
```

---

## Key Features

### ✅ No Frontend Calculations
- Prices are NOT included in checkout data
- All price calculations happen on backend
- Total amount comes from database item_price × quantity
- Tax calculation removed (if needed, happens on backend)

### ✅ Schema-Aligned Design
- Data structure directly matches:
  - `orders` table
  - `order_items` table
  - `payment` table
- No extra fields or transformations needed

### ✅ Single Payment Method
- User selects ONE method per session
- Only three options: cash, card, MFS
- Amount must meet or exceed total

### ✅ No Coupon/Promo Logic
- Promo code collection removed
- Coupon system can be added in backend if needed

### ✅ Two-Step Verification
- Checkout form validates customer data
- Payment modal validates payment data
- Both use dedicated validation functions

---

## Components Breakdown

### CheckoutForm Component
**Purpose:** Collect service type and verify customer/address data

**Props:**
- `currentUser` - Customer profile object
- `onCheckoutComplete(checkoutData)` - Callback when form submitted

**State:**
- `formValue` - Service type selection
- `formError` - Validation errors
- `isSubmitting` - Loading state

**Validation:**
- Service type required
- Address required for delivery
- Phone number required

### PaymentModal Component
**Purpose:** Collect payment method and amount

**Props:**
- `isOpen` - Boolean to show/hide modal
- `checkoutData` - Order data from checkout form
- `totalAmount` - Total price (calculated on backend)
- `onConfirm(paymentData)` - Callback on payment confirm
- `onCancel()` - Callback on modal cancel
- `isSubmitting` - Loading state

**State:**
- `paymentForm` - Method and amount
- `formError` - Validation errors

**Validation:**
- Payment method required
- Amount required and must be ≥ totalAmount

### Checkout Component
**Purpose:** Orchestrate the entire checkout flow

**Responsibilities:**
1. Display CheckoutForm
2. On checkout complete:
   - Calculate total (send to backend)
   - Show PaymentModal
3. On payment confirm:
   - Submit complete order to backend
   - Handle response or errors
4. Handle cancellation and errors

---

## Backend Integration Points

### Endpoint 1: Calculate Total
```
POST /orders/calculate-total

Request: {
  items: [{ item_id, quantity }, ...]
}

Response: {
  subtotal: number,
  itemBreakdown: [...]
}
```

**Implementation:**
- Fetch item_price for each item_id from items table
- Multiply by quantity
- Return breakdown

### Endpoint 2: Create Order
```
POST /orders/create

Request: {
  order: { cust_id, add_id, service_type },
  items: [{ item_id, quantity }, ...],
  payment: { method, amount }
}

Response: {
  order_id: number,
  transaction_id: number,
  order_details: {...}
}
```

**Implementation:**
1. START TRANSACTION
2. INSERT into orders → get order_id
3. INSERT into order_items (fetch item_price for each)
4. INSERT into payment
5. COMMIT
6. Return order_id and transaction_id

---

## Database Mapping

### orders table
| Field | Source | Value |
|-------|--------|-------|
| cust_id | checkoutData.customerData.cust_id | From profile |
| add_id | checkoutData.customerData.add_id | From profile |
| service_type | checkoutData.serviceType | "dine-in" or "delivery" |
| status | (auto) | "pending" |
| created_at | (auto) | CURRENT_TIMESTAMP |

### order_items table
| Field | Source | Value |
|-------|--------|-------|
| order_id | (from orders INSERT) | Auto-generated |
| item_id | checkoutData.items[i].item_id | From cart |
| item_quantity | checkoutData.items[i].quantity | From cart |
| total_price | (backend calc) | item_price × quantity |

### payment table
| Field | Source | Value |
|-------|--------|-------|
| order_id | (from orders INSERT) | Auto-generated |
| amount | paymentData.amount | User entered |
| method | paymentData.method | "cash", "card", "mfs" |
| status | (auto) | "pending" |

---

## Validation Rules

### Checkout Validation
✓ Customer has cust_id
✓ Customer has add_id
✓ Service type selected and valid
✓ At least one item in order
✓ All items have valid item_id and quantity
✓ If delivery: customer has address1

### Payment Validation
✓ Payment method selected and valid
✓ Amount > 0
✓ Amount ≥ totalAmount

### Database Validation (Backend)
✓ Customer exists in customers table
✓ Address exists in address table
✓ All item_ids exist in item table
✓ Foreign keys valid

---

## Error Handling

### Frontend Errors
- **Validation errors:** Show inline messages, prevent submission
- **Network errors:** Show error modal, allow retry
- **Missing data:** Prevent progression with clear messages

### Backend Errors
- **Validation failure:** Return 400 with error message
- **Database failure:** Return 500 with error message
- **Transaction failure:** Automatically rolls back all changes

---

## TO-DO for Backend Implementation

In `Checkout.jsx`:

1. **`handleCheckoutComplete()`**
   ```javascript
   // TODO: Call POST /orders/calculate-total
   // Pass: formData.items
   // Get back: totalAmount
   // Show PaymentModal with calculated total
   ```

2. **`handlePaymentConfirm()`**
   ```javascript
   // TODO: Call POST /orders/create
   // Pass: { checkout: checkoutData, payment: paymentData }
   // Get back: { order_id, transaction_id }
   // On success: clear cart, show confirmation, redirect
   // On error: show error message
   ```

---

## Usage Example

```javascript
// In parent component that uses Checkout:
<Checkout currentUser={currentUserData} />

// Flow:
// 1. User selects service type → clicks "Proceed to Payment"
// 2. CheckoutForm calls onCheckoutComplete(checkoutData)
// 3. Checkout calculates total and shows PaymentModal
// 4. User selects payment method and amount → clicks "Confirm"
// 5. PaymentModal calls onConfirm(paymentData)
// 6. Checkout sends complete order to backend
// 7. Backend creates order and payment records
// 8. On success: clear cart, show confirmation
```

---

## Testing Checklist

- [ ] Checkout form validation works
- [ ] Service type selection works (dine-in/delivery)
- [ ] Address requirement enforced for delivery
- [ ] Phone number requirement enforced
- [ ] PaymentModal displays on checkout complete
- [ ] Payment method selection works (cash/card/mfs)
- [ ] Payment amount validation works
- [ ] Cancel button closes modal
- [ ] All form errors display correctly
- [ ] Data structure matches database schema
- [ ] Backend integration works end-to-end

---

## Notes for Your Team

1. **No Price Handling in Frontend**
   - All price logic moved to backend
   - Frontend only collects quantities
   - This improves security and maintainability

2. **Transaction Safety**
   - Use database transactions for order creation
   - Ensures either all records insert or none
   - Prevents partial orders in database

3. **Payment Processing**
   - Current implementation handles payment info collection
   - Actual payment processing (card charges, etc.) happens elsewhere
   - Backend should validate payment method before processing

4. **Extensibility**
   - Easy to add coupon/discount logic to backend
   - Easy to add order notes or special requests
   - Easy to add staff assignment logic (rota_id)

---

## Files Summary

```
Project_PizzaByte_template/Frontend/src/
├── utils/
│   ├── checkoutDataStructure.js (NEW - Data utilities)
│   └── CHECKOUT_STRUCTURE_GUIDE.js (NEW - Implementation guide)
├── features/checkout/components/
│   ├── checkout/
│   │   ├── CheckoutForm.jsx (MODIFIED - Simplified)
│   │   ├── checkout-form.css (NEW - Styling)
│   │   ├── Checkout.jsx (MODIFIED - Flow orchestration)
│   │   └── CheckoutItem.jsx (unchanged)
│   └── payment/
│       ├── PaymentModal.jsx (NEW - Payment form)
│       └── payment-modal.css (NEW - Styling)
```

---

**Last Updated:** March 27, 2026
**Status:** Ready for backend integration
