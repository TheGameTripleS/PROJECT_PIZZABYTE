import { useState } from "react";
import { useCart } from "../../../../context/CartContext";
import { v4 as uuidv4 } from "uuid";
import CheckoutItem from "./CheckoutItem";
import CheckoutForm from "./CheckoutForm";
import PaymentModal from "../payment/PaymentModal";
import EmptyCart from "../../../cart/components/EmptyCart";

const Checkout = ({ currentUser }) => {
  const { cart } = useCart();
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [checkoutData, setCheckoutData] = useState(null);
  const [totalAmount, setTotalAmount] = useState(0);
  const [isSubmitting, setIsSubmitting] = useState(false);

  /**
   * Handles checkout form completion
   * Calculates total from backend item prices (to be implemented)
   * Opens payment modal
   */
  const handleCheckoutComplete = async (formData) => {
    try {
      setIsSubmitting(true);

      // TODO: Calculate total from backend
      // This should call an API endpoint that:
      // 1. Gets item prices from database
      // 2. Sums quantities * prices
      // 3. Returns total amount

      // For now, we'll calculate locally (backend should do this)
      let total = 0;
      formData.items.forEach((item) => {
        // Get price from cart
        const cartItem = cart.find(
          (c) => (c.id || c.item_id) === item.item_id
        );
        if (cartItem && cartItem.ItemPrice) {
          total += cartItem.ItemPrice * item.quantity;
        }
      });

      setCheckoutData(formData);
      setTotalAmount(total);
      setShowPaymentModal(true);
    } catch (error) {
      console.error("Error during checkout:", error);
      // TODO: Show error message to user
    } finally {
      setIsSubmitting(false);
    }
  };

  /**
   * Handles payment confirmation
   * Structures data and sends to backend for database insertion
   */
  const handlePaymentConfirm = async (paymentData) => {
    try {
      setIsSubmitting(true);

      // TODO: Structure and submit complete order with payment data
      // Data structure to send:
      // {
      //   order: {
      //     cust_id: number,
      //     add_id: number,
      //     service_type: "dine-in" | "delivery",
      //     created_at: timestamp,
      //     status: "pending"
      //   },
      //   items: [
      //     { item_id: number, item_quantity: number }
      //   ],
      //   payment: {
      //     amount: number,
      //     method: "cash" | "card" | "mfs",
      //     status: "pending"
      //   }
      // }

      console.log("Order Data:", {
        checkout: checkoutData,
        payment: paymentData,
        total: totalAmount,
      });

      // TODO: Call API endpoint to create order and payment record
      // API.post('/orders/create', { order, items, payment })

      // On success:
      // 1. Clear cart
      // 2. Show success message
      // 3. Redirect to order confirmation page

      setShowPaymentModal(false);
    } catch (error) {
      console.error("Error processing payment:", error);
      // TODO: Show error message to user
    } finally {
      setIsSubmitting(false);
    }
  };

  const handlePaymentCancel = () => {
    setShowPaymentModal(false);
  };

  if (cart.length === 0) {
    return <EmptyCart />;
  }

  return (
    <>
      <div className="checkout__inner">
        {cart.map((cartItem) => (
          <CheckoutItem key={uuidv4()} cartItem={cartItem} />
        ))}
        <CheckoutForm 
          currentUser={currentUser}
          onCheckoutComplete={handleCheckoutComplete}
        />
      </div>

      <PaymentModal
        isOpen={showPaymentModal}
        checkoutData={checkoutData}
        totalAmount={totalAmount}
        onConfirm={handlePaymentConfirm}
        onCancel={handlePaymentCancel}
        isSubmitting={isSubmitting}
      />
    </>
  );
};

export default Checkout;
