import { useEffect, useState } from "react";
import toast from "react-hot-toast";
import { useCart } from "../../../../context/CartContext";
import { v4 as uuidv4 } from "uuid";
import CheckoutItem from "./CheckoutItem";
import CheckoutForm from "./CheckoutForm";
import PaymentModal from "../payment/PaymentModal";
import EmptyCart from "../../../cart/components/EmptyCart";
import {
  calculateCheckoutTotal,
  createCheckoutOrder,
} from "../../../../api/checkout";

const DEFAULT_PRICING_SUMMARY = {
  subtotal: 0,
  discount: 0,
  total: 0,
  itemBreakdown: [],
  coupon: null,
};

const Checkout = ({ currentUser }) => {
  const { cart, clearCart } = useCart();
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [checkoutData, setCheckoutData] = useState(null);
  const [totalAmount, setTotalAmount] = useState(0);
  const [pricingSummary, setPricingSummary] = useState(DEFAULT_PRICING_SUMMARY);
  const [pricingError, setPricingError] = useState("");
  const [appliedCouponCode, setAppliedCouponCode] = useState("");
  const [isPricingLoading, setIsPricingLoading] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const getCheckoutItems = () => {
    const items = cart.map((item) => ({
      item_id: Number(item.id || item.item_id),
      quantity: Number(item.quantity),
    }));
    console.log("Checkout items being sent:", items);
    return items;
  };

  const syncPricing = async (couponCode = appliedCouponCode, options = {}) => {
    const { showErrorToast = false } = options;

    setIsPricingLoading(true);

    const response = await calculateCheckoutTotal({
      items: getCheckoutItems(),
      couponCode,
    });

    setIsPricingLoading(false);

    if (!response.success) {
      setPricingError(response.message);

      if (showErrorToast) {
        toast.error(response.message);
      }

      return response;
    }

    setPricingSummary(response.data);
    setPricingError("");
    return response;
  };

  useEffect(() => {
    let isMounted = true;

    const refreshPricing = async () => {
      if (cart.length === 0) {
        setPricingSummary(DEFAULT_PRICING_SUMMARY);
        setPricingError("");
        setAppliedCouponCode("");
        return;
      }

      const response = await calculateCheckoutTotal({
        items: getCheckoutItems(),
        couponCode: appliedCouponCode,
      });

      if (!isMounted) {
        return;
      }

      if (response.success) {
        setPricingSummary(response.data);
        setPricingError("");
        return;
      }

      if (appliedCouponCode) {
        setAppliedCouponCode("");
        setPricingError(response.message);

        const fallbackResponse = await calculateCheckoutTotal({
          items: getCheckoutItems(),
        });

        if (!isMounted) {
          return;
        }

        if (fallbackResponse.success) {
          setPricingSummary(fallbackResponse.data);
        }

        return;
      }

      setPricingError(response.message);
    };

    refreshPricing();

    return () => {
      isMounted = false;
    };
  }, [cart]);

  const handleCouponApply = async (couponCode) => {
    const trimmedCode = couponCode.trim();

    if (!trimmedCode) {
      setAppliedCouponCode("");
      const response = await syncPricing("", { showErrorToast: false });

      if (response.success) {
        toast.success("Coupon removed");
      }

      return response;
    }

    const response = await syncPricing(trimmedCode, { showErrorToast: true });

    if (!response.success) {
      return response;
    }

    setAppliedCouponCode(response.data.coupon?.code || trimmedCode.toUpperCase());
    toast.success(`Coupon ${response.data.coupon?.code || trimmedCode.toUpperCase()} applied`);

    return response;
  };

  const handleCouponRemove = async () => {
    setAppliedCouponCode("");
    const response = await syncPricing("", { showErrorToast: false });

    if (response.success) {
      toast.success("Coupon removed");
    }

    return response;
  };

  /**
   * Handles checkout form completion
   * Calculates total from backend item prices
   * Opens payment modal
   */
  const handleCheckoutComplete = async (formData) => {
    try {
      setIsSubmitting(true);
      setPricingError("");

      const pricingResponse = await calculateCheckoutTotal({
        items: formData.items,
        couponCode: appliedCouponCode,
      });

      if (!pricingResponse.success) {
        setPricingError(pricingResponse.message);
        toast.error(pricingResponse.message);
        return false;
      }

      setPricingSummary(pricingResponse.data);
      setPricingError("");
      setCheckoutData({
        ...formData,
        couponCode: pricingResponse.data.coupon?.code || null,
        pricing: pricingResponse.data,
      });
      setTotalAmount(pricingResponse.data.total);
      setShowPaymentModal(true);
      return true;
    } catch (error) {
      console.error("Error during checkout:", error);
      toast.error("Error during checkout");
      return false;
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

      if (!checkoutData) {
        toast.error("Checkout data is missing");
        return;
      }

      const response = await createCheckoutOrder({
        order: {
          cust_id: checkoutData.customerData.cust_id,
          add_id: checkoutData.customerData.add_id || null,
          service_type: checkoutData.serviceType,
          coupon_code: checkoutData.couponCode,
        },
        items: checkoutData.items.map((item) => ({
          item_id: item.item_id,
          quantity: item.quantity,
        })),
        payment: {
          method: paymentData.method,
          amount: totalAmount,
        },
      });

      if (!response.success) {
        toast.error(response.message);
        return;
      }

      toast.success(`Order #${response.data.order_id} created successfully`);
      setShowPaymentModal(false);
      setCheckoutData(null);
      setTotalAmount(0);
      clearCart();
    } catch (error) {
      console.error("Error processing payment:", error);
      toast.error("Error processing payment");
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
          pricingSummary={pricingSummary}
          pricingError={pricingError}
          appliedCouponCode={appliedCouponCode}
          onApplyCoupon={handleCouponApply}
          onRemoveCoupon={handleCouponRemove}
          isCalculatingPrice={isPricingLoading}
        />
      </div>

      <PaymentModal
        isOpen={showPaymentModal}
        checkoutData={checkoutData}
        totalAmount={totalAmount}
        pricingSummary={checkoutData?.pricing || pricingSummary}
        onConfirm={handlePaymentConfirm}
        onCancel={handlePaymentCancel}
        isSubmitting={isSubmitting}
      />
    </>
  );
};

export default Checkout;
