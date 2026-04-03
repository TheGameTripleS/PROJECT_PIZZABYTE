import { useEffect, useState } from "react";
import { useCart } from "../../../../context/CartContext";
import "./checkout-form.css";

const formatCurrency = (amount) => `$${Number(amount || 0).toFixed(2)}`;

const CheckoutForm = ({
  currentUser,
  onCheckoutComplete,
  pricingSummary,
  pricingError,
  appliedCouponCode,
  onApplyCoupon,
  onRemoveCoupon,
  isCalculatingPrice,
}) => {
  const { cart } = useCart();
  const [formValue, setFormValue] = useState({
    serviceType: "", // "dine-in" or "delivery"
  });
  const [couponCode, setCouponCode] = useState("");

  const [formError, setFormError] = useState({});
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    setCouponCode(appliedCouponCode || "");
  }, [appliedCouponCode]);

  const handleServiceTypeChange = (e) => {
    setFormValue({
      ...formValue,
      serviceType: e.target.value,
    });
    setFormError({ ...formError, serviceType: "" });
  };

  const validateForm = () => {
    const errors = {};
    const customerId = currentUser?.cust_id || currentUser?.id;

    if (!customerId) {
      errors.user = "Please sign in before placing an order";
    }

    if (!formValue.serviceType) {
      errors.serviceType = "Please select a service type";
    }

    // Validate address if delivery is selected
    if (formValue.serviceType === "delivery") {
      if (!currentUser?.address1) {
        errors.address = "Delivery address is required. Please add address in your profile.";
      }
    }

    // Validate phone number
    if (!currentUser?.number) {
      errors.number = "Contact number is required. Please add phone number in your profile.";
    }

    return errors;
  };

  const handleApplyCoupon = async () => {
    if (!onApplyCoupon) {
      return;
    }

    await onApplyCoupon(couponCode);
  };

  const handleRemoveCoupon = async () => {
    setCouponCode("");

    if (onRemoveCoupon) {
      await onRemoveCoupon();
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const errors = validateForm();

    if (Object.keys(errors).length > 0) {
      setFormError(errors);
      return;
    }

    // Structure data according to database schema for order creation
    const checkoutData = {
      customerData: {
        cust_id: currentUser.cust_id || currentUser.id, // From profile/auth payload
        add_id: currentUser.add_id || null, // From profile/auth payload
        fullname: currentUser.fullname,
        email: currentUser.email,
        number: currentUser.number,
        address1: currentUser.address1,
        address2: currentUser.address2,
        zipcode: currentUser.zipcode,
      },
      serviceType: formValue.serviceType, // "dine-in" or "delivery"
      items: cart.map((item) => ({
        item_id: item.id || item.item_id,
        item_name: item.ItemName || item.item_name,
        quantity: item.quantity,
      })),
      totalItems: cart.length,
      totalQuantity: cart.reduce((sum, item) => sum + item.quantity, 0),
    };

    setIsSubmitting(true);

    try {
      if (onCheckoutComplete) {
        await onCheckoutComplete(checkoutData);
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <section className="checkout__form">
      <h3>Checkout Details</h3>

      {/* Customer Information Display */}
      <div className="checkout__form__section">
        <h4>Personal Information</h4>
        <div className="checkout__form__info">
          {formError.user && <span className="checkout__form__error">{formError.user}</span>}
          <p>
            <strong>Name:</strong> {currentUser?.fullname || "Not provided"}
          </p>
          <p>
            <strong>Email:</strong> {currentUser?.email || "Not provided"}
          </p>
          <p>
            <strong>Phone:</strong> {currentUser?.number ? currentUser.number : <span className="error">Not added</span>}
          </p>
          {formError.number && <span className="checkout__form__error">{formError.number}</span>}
        </div>
      </div>

      {/* Address Information Display */}
      <div className="checkout__form__section">
        <h4>Address</h4>
        {currentUser?.address1 ? (
          <div className="checkout__form__info">
            <p>
              <strong>Address Line 1:</strong> {currentUser.address1}
            </p>
            {currentUser?.address2 && (
              <p>
                <strong>Address Line 2:</strong> {currentUser.address2}
              </p>
            )}
            {currentUser?.zipcode && (
              <p>
                <strong>Zip Code:</strong> {currentUser.zipcode}
              </p>
            )}
          </div>
        ) : (
          <p className="error">No address added</p>
        )}
        {formError.address && <span className="checkout__form__error">{formError.address}</span>}
      </div>

      {/* Order Items Summary */}
      <div className="checkout__form__section">
        <h4>Order Summary</h4>
        <div className="checkout__form__items-summary">
          <ul>
            {cart.map((item, index) => (
              <li key={index} className="checkout__form__item-row">
                <span>{item.ItemName || item.item_name}</span>
                <span>x {item.quantity}</span>
              </li>
            ))}
          </ul>
          <div className="checkout__form__totals">
            <p>
              <strong>Total Items:</strong> {cart.length}
            </p>
            <p>
              <strong>Total Quantity:</strong> {cart.reduce((sum, item) => sum + item.quantity, 0)}
            </p>
            <p>
              <strong>Subtotal:</strong> {formatCurrency(pricingSummary?.subtotal)}
            </p>
            <p>
              <strong>Discount:</strong> -{formatCurrency(pricingSummary?.discount)}
            </p>
            <p className="checkout__form__grand-total">
              <strong>Total:</strong> {formatCurrency(pricingSummary?.total)}
            </p>
          </div>
        </div>
      </div>

      <div className="checkout__form__section">
        <h4>Coupon</h4>
        <div className="checkout__form__coupon-box">
          <div className="checkout__form__coupon-input-group">
            <input
              type="text"
              value={couponCode}
              onChange={(e) => setCouponCode(e.target.value.toUpperCase())}
              placeholder="Enter coupon code"
              disabled={isSubmitting || isCalculatingPrice}
            />
            <button
              type="button"
              className="checkout__form__coupon-btn"
              onClick={handleApplyCoupon}
              disabled={isSubmitting || isCalculatingPrice || !couponCode.trim()}
            >
              {isCalculatingPrice ? "Checking..." : "Apply"}
            </button>
            {appliedCouponCode && (
              <button
                type="button"
                className="checkout__form__coupon-btn checkout__form__coupon-btn--secondary"
                onClick={handleRemoveCoupon}
                disabled={isSubmitting || isCalculatingPrice}
              >
                Remove
              </button>
            )}
          </div>

          {appliedCouponCode && pricingSummary?.coupon && (
            <p className="checkout__form__coupon-success">
              Applied {pricingSummary.coupon.code}:{" "}
              {pricingSummary.coupon.discount_percent}% off on minimum amount{" "}
              {formatCurrency(pricingSummary.coupon.min_order_amount)}
            </p>
          )}

          {pricingError && (
            <span className="checkout__form__error">{pricingError}</span>
          )}
        </div>
      </div>

      {/* Service Type Selection */}
      <form onSubmit={handleSubmit}>
        {pricingError && (
          <div className="checkout__form__submit-error">{pricingError}</div>
        )}

        <fieldset className="checkout__form__delivery-details">
          <legend>Service Type</legend>
          <div className="checkout__form__service-type">
            <label htmlFor="dine-in" className="checkout__form__service-option">
              <input
                id="dine-in"
                type="radio"
                value="dine-in"
                name="serviceType"
                onChange={handleServiceTypeChange}
                checked={formValue.serviceType === "dine-in"}
              />
              <span className="service-label">
                <svg width="1.5rem" height="1.5rem" viewBox="0 0 24 24" fill="none" stroke="currentColor">
                  <path d="M6 9V2h12v7" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                  <path d="M6 9a2 2 0 0 0-2 2v7a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-7a2 2 0 0 0-2-2" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                  <path d="M12 15v3" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
                Dine In
              </span>
            </label>

            <label htmlFor="delivery" className="checkout__form__service-option">
              <input
                id="delivery"
                type="radio"
                value="delivery"
                name="serviceType"
                onChange={handleServiceTypeChange}
                checked={formValue.serviceType === "delivery"}
              />
              <span className="service-label">
                <svg width="1.5rem" height="1.5rem" viewBox="0 0 24 24" fill="none" stroke="currentColor">
                  <path d="M14 18V6a2 2 0 0 0-2-2H4a2 2 0 0 0-2 2v11a1 1 0 0 0 1 1h2" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                  <path d="M15 18H9" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                  <path d="M19 18h2a1 1 0 0 0 1-1v-3.65a1 1 0 0 0-.22-.624l-3.48-4.35A1 1 0 0 0 17.52 8H14" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                  <circle cx="17" cy="18" r="2" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                  <circle cx="7" cy="18" r="2" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
                Delivery
              </span>
            </label>
          </div>
          {formError.serviceType && (
            <span className="checkout__form__error">{formError.serviceType}</span>
          )}
        </fieldset>

        <button 
          type="submit" 
          className="active-button-style checkout__form__submit"
          disabled={isSubmitting || isCalculatingPrice || cart.length === 0}
          aria-label="Proceed to payment"
        >
          {isSubmitting ? "Preparing Payment..." : "Proceed to Payment"}
        </button>
      </form>
    </section>
  );
};

export default CheckoutForm;
