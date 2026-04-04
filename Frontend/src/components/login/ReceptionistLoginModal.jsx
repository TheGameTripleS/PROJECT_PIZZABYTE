import "./loginModal.css";
import { useState, useRef, useEffect } from "react";
import validateForm from "../../utils/validate-form";
import { loginReceptionist } from "./api/loginReceptionist";

const ReceptionistLoginModal = ({
  setIsReceptionist,
  setIsLoggedIn,
  setUser,
  close,
  openUserLogin,
}) => {
  const [formValue, setFormValue] = useState({ email: "", password: "" });
  const [formError, setFormError] = useState({});
  const [loading, setLoading] = useState(false);
  const [verificationError, setVerificationError] = useState("");
  const modalRef = useRef();

  const validate = validateForm("login");

  const handleValidation = (e) => {
    const { name, value } = e.target;
    setFormValue((prevFormValue) => ({
      ...prevFormValue,
      [name]: value,
    }));
  };

  const handleLogin = async (e) => {
    setVerificationError("");
    e.preventDefault();
    setLoading(true);
    setFormError(validate(formValue));

    console.log("🔓 Receptionist Login Attempt - Email:", formValue.email);

    if (Object.keys(validate(formValue)).length > 0) {
      console.log("❌ Form validation failed");
      setLoading(false);
      return;
    }

    const response = await loginReceptionist(formValue.email, formValue.password);
    console.log("📱 Login Response:", response);
    
    if (!response.success) {
      console.log("❌ Login failed:", response.message);
      setVerificationError(response.message);
      setFormError({});
      setFormValue((prev) => ({ ...prev, password: "" }));
    } else {
      console.log("✅ Login successful");
      // Set receptionist flag and login
      setIsReceptionist(true);
      localStorage.setItem("isReceptionist", "true");
      setUser(response.user);
      setFormValue({ email: "", password: "" });
      setFormError({});
      setVerificationError("");
      setIsLoggedIn(true);
      localStorage.setItem("loggedIn", true);
      close();
    }

    setLoading(false);
  };

  useEffect(() => {
    modalRef.current?.showModal();
  }, []);

  const handleBackdropClick = (event) => {
    if (event.target === modalRef.current) {
      close();
    }
  };

  return (
    <dialog
      className="modal"
      ref={modalRef}
      onClick={handleBackdropClick}
      aria-labelledby="receptionist-modal-title"
    >
      <div className="modal__inner">
        <button
          className="modal__inner__close"
          type="button"
          aria-label="Close receptionist login modal"
          onClick={close}
        >
          X
        </button>
        <div className="modal__content">
          <h2 id="receptionist-modal-title">Receptionist Login</h2>
          {loading ? (
            <div role="status" className="loader">
              <p>Almost there...</p>
              <img
                alt="Processing request"
                src="https://media0.giphy.com/media/L05HgB2h6qICDs5Sms/giphy.gif?cid=ecf05e472hf2wk1f2jou3s5fcnx1vek6ggnfcvhsjbeh7v5u&ep=v1_stickers_search&rid=giphy.gif&ct=s"
              />
            </div>
          ) : (
            <form onSubmit={handleLogin}>
              {verificationError.length > 0 && (
                <p
                  className="modal__form__error"
                  role="alert"
                  aria-live="polite"
                >
                  {verificationError}
                </p>
              )}
              <input
                onChange={handleValidation}
                value={formValue.email}
                name="email"
                type="text"
                autoComplete="true"
                placeholder="Email"
                aria-label="Receptionist email address"
                aria-describedby={formError.email ? "email-error" : undefined}
              />
              <span id="email-error" className="modal__form__error">
                {formError.email}
              </span>
              <input
                onChange={handleValidation}
                value={formValue.password}
                name="password"
                type="password"
                autoComplete="true"
                placeholder="Password"
                aria-label="Receptionist password"
                aria-describedby={
                  formError.password ? "password-error" : undefined
                }
              />
              <span id="password-error" className="modal__form__error">
                {formError.password}
              </span>
              <div className="modal__buttons">
                <button
                  type="button"
                  onClick={() => {
                    close();
                    openUserLogin();
                  }}
                  className="modal__buttons__signup"
                  aria-label="Back to user login"
                >
                  Back
                </button>
                <button
                  aria-label="Log in as receptionist"
                  type="submit"
                  disabled={loading}
                  className="modal__buttons__login"
                >
                  Log in
                </button>
              </div>
            </form>
          )}
        </div>
      </div>
    </dialog>
  );
};

export default ReceptionistLoginModal;
