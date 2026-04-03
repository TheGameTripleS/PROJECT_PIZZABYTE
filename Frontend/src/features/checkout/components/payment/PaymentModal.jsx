import { useEffect, useState } from "react";
import {
  validatePaymentData,
} from "../../../../utils/checkoutDataStructure";
import "./payment-modal.css";

const formatCurrency = (amount) => `$${Number(amount || 0).toFixed(2)}`;

const PaymentModal = ({
  isOpen,
  checkoutData,
  totalAmount,
  pricingSummary,
  onConfirm,
  onCancel,
  isSubmitting,
}) => {
  const [paymentForm, setPaymentForm] = useState({
    method: "", // "cash", "card", or "mfs"
    amount: totalAmount || "",
  });

  const [formError, setFormError] = useState({});

  useEffect(() => {
    if (!isOpen) {
      return;
    }

    setPaymentForm({
      method: "",
      amount: Number(totalAmount || 0).toFixed(2),
    });
    setFormError({});
  }, [isOpen, totalAmount]);

  const handleMethodChange = (e) => {
    setPaymentForm({
      ...paymentForm,
      method: e.target.value,
    });
    setFormError({ ...formError, method: "" });
  };

  const handleSubmit = (e) => {
    e.preventDefault();

    // Validate payment data
    const validation = validatePaymentData(paymentForm, totalAmount);

    if (!validation.isValid) {
      setFormError({
        submit: validation.errors.join(", "),
      });
      return;
    }

    // Clear previous errors
    setFormError({});

    // Call parent's confirm handler with payment data
    if (onConfirm) {
      onConfirm(paymentForm);
    }
  };

  if (!isOpen) {
    return null;
  }

  return (
    <div className="payment-modal__overlay">
      <div className="payment-modal__content">
        <div className="payment-modal__header">
          <h2>Payment Information</h2>
        </div>

        <div className="payment-modal__summary">
          <h4>Order Summary</h4>
          <div className="payment-modal__items-list">
            <ul>
              {checkoutData?.items?.map((item, index) => (
                <li key={index} className="payment-modal__item">
                  <span>{item.item_name}</span>
                  <span>x {item.quantity}</span>
                </li>
              ))}
            </ul>
          </div>
          <div className="payment-modal__totals">
            <p>
              <strong>Service Type:</strong>{" "}
              {checkoutData?.serviceType === "dine-in" ? "Dine In" : "Delivery"}
            </p>
            <p>
              <strong>Subtotal:</strong>{" "}
              <span className="amount">{formatCurrency(pricingSummary?.subtotal)}</span>
            </p>
            <p>
              <strong>Discount:</strong>{" "}
              <span className="amount">-{formatCurrency(pricingSummary?.discount)}</span>
            </p>
            <p className="payment-modal__total-amount">
              <strong>Total Amount:</strong>{" "}
              <span className="amount">{formatCurrency(totalAmount || 0)}</span>
            </p>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="payment-modal__form">
          {/* Payment Method Selection */}
          <fieldset className="payment-modal__methods">
            <legend>Select Payment Method</legend>
            <div className="payment-modal__method-options">
              <label className="payment-modal__method-option">
                <input
                  type="radio"
                  name="method"
                  value="cash"
                  onChange={handleMethodChange}
                  checked={paymentForm.method === "cash"}
                />
                <span className="method-label">
                  <svg width="1.5rem" height="1.5rem" viewBox="0 0 24 24" fill="none" stroke="currentColor">
                    <circle cx="12" cy="12" r="1" strokeWidth="2" />
                    <path d="M12 1v6m0 6v6" strokeWidth="2" strokeLinecap="round" />
                    <path d="M17 6H9a2 2 0 0 0-2 2v8a2 2 0 0 0 2 2h8a2 2 0 0 0 2-2V8a2 2 0 0 0-2-2z" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                  </svg>
                  Cash
                </span>
              </label>

              <label className="payment-modal__method-option">
                <input
                  type="radio"
                  name="method"
                  value="card"
                  onChange={handleMethodChange}
                  checked={paymentForm.method === "card"}
                />
                <span className="method-label">
                  <svg width="1.5rem" height="1.5rem" viewBox="0 0 24 24" fill="none" stroke="currentColor">
                    <rect x="1" y="4" width="22" height="16" rx="2" ry="2" strokeWidth="2" />
                    <path d="M1 10h22" strokeWidth="2" />
                  </svg>
                  Card
                </span>
              </label>

              <label className="payment-modal__method-option">
                <input
                  type="radio"
                  name="method"
                  value="mfs"
                  onChange={handleMethodChange}
                  checked={paymentForm.method === "mfs"}
                />
                <span className="method-label">
                  <svg width="1.5rem" height="1.5rem" viewBox="0 0 24 24" fill="none" stroke="currentColor">
                    <path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                  </svg>
                  MFS
                </span>
              </label>
            </div>
            {formError.method && <span className="payment-modal__error">{formError.method}</span>}
          </fieldset>

          {/* Amount Input */}
          <div className="payment-modal__amount">
            <label htmlFor="amount">
              <strong>Amount to Pay</strong>
            </label>
            <div className="payment-modal__amount-input-group">
              <span className="currency-symbol">$</span>
              <input
                id="amount"
                type="number"
                step="0.01"
                min="0"
                value={paymentForm.amount}
                placeholder="0.00"
                disabled
                readOnly
              />
            </div>
            <p className="payment-modal__amount-info">
              Amount fixed from backend: <strong>{formatCurrency(totalAmount || 0)}</strong>
            </p>
            {formError.amount && <span className="payment-modal__error">{formError.amount}</span>}
          </div>

          {/* Form Error Message */}
          {formError.submit && (
            <div className="payment-modal__error-message">
              {formError.submit}
            </div>
          )}

          {/* Action Buttons */}
          <div className="payment-modal__actions">
            <button
              type="button"
              className="payment-modal__btn-cancel"
              onClick={onCancel}
              disabled={isSubmitting}
            >
              Cancel
            </button>
            <button
              type="submit"
              className="payment-modal__btn-confirm"
              disabled={isSubmitting || !paymentForm.method || !paymentForm.amount}
              aria-label="Confirm payment"
            >
              {isSubmitting ? "Processing..." : "Confirm Payment"}
            </button>
          </div>
        </form>

        <p className="payment-modal__note">
          Note: Payment will be processed once you confirm. You can only use one payment method per session.
        </p>
      </div>
    </div>
  );
};

export default PaymentModal;
