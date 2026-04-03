import React, { useEffect, useState } from "react";
import ResetLocation from "../../utils/ResetLocation";
import { useNavigate } from "react-router-dom";
import validateForm from "../../utils/validate-form";
import "./assets/profile.css";
import { motion } from "framer-motion";
import { slideInLeft } from "../../utils/animations";
import { deleteUser } from "./api/deleteUser";
import { getCustomerOrders } from "./api/getCustomerOrders";

const ORDER_FILTERS = ["all", "pending", "processing", "completed", "cancelled"];

const normalizeStatus = (status) => (status || "").toLowerCase();

const formatStatus = (status) => {
  const normalizedStatus = normalizeStatus(status);

  if (!normalizedStatus) {
    return "Unknown";
  }

  return normalizedStatus.charAt(0).toUpperCase() + normalizedStatus.slice(1);
};

const formatCurrency = (amount) =>
  new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
  }).format(Number(amount || 0));

const formatDateTime = (dateValue) =>
  new Intl.DateTimeFormat("en-US", {
    year: "numeric",
    month: "short",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
  }).format(new Date(dateValue));

const ProfilePage = ({ currentUser, handleLogoutUser, handleUpdateUser }) => {
  const [editForm, setEditForm] = useState(false);
  const [formValue, setFormValue] = useState({
    email: "",
    password: "",
    fullname: "",
    address1: "",
    address2: "",
    zipcode: "",
    number: "",
  });
  const [formErrors, setFormErrors] = useState({});
  const [formError, setFormError] = useState("");
  const [loading, setLoading] = useState(false);
  const [ordersLoading, setOrdersLoading] = useState(false);
  const [ordersError, setOrdersError] = useState("");
  const [orders, setOrders] = useState([]);
  const [selectedOrderFilter, setSelectedOrderFilter] = useState("all");
  const [confirmationModal, setConfirmationModal] = useState(false);
  const navigate = useNavigate();
  const validate = validateForm("profile");
  const customerId = currentUser?.cust_id || currentUser?.id || null;

  const orderedOrders = [...orders].sort((leftOrder, rightOrder) => {
    const statusPriority = {
      pending: 0,
      processing: 1,
      completed: 2,
      cancelled: 3,
    };

    const leftStatus = normalizeStatus(leftOrder.status);
    const rightStatus = normalizeStatus(rightOrder.status);
    const leftPriority = statusPriority[leftStatus] ?? 99;
    const rightPriority = statusPriority[rightStatus] ?? 99;

    if (leftPriority !== rightPriority) {
      return leftPriority - rightPriority;
    }

    return new Date(rightOrder.created_at) - new Date(leftOrder.created_at);
  });

  const visibleOrders =
    selectedOrderFilter === "all"
      ? orderedOrders
      : orderedOrders.filter((order) => normalizeStatus(order.status) === selectedOrderFilter);

  const toggleForm = () => {
    setEditForm(!editForm);
    setFormError("");
    setFormErrors({});
    setFormValue({
      email: "",
      password: "",
      fullname: "",
      address1: "",
      address2: "",
      zipcode: "",
      number: "",
    });
    ResetLocation();
  };

  const handleValidation = (e) => {
    const { name, value } = e.target;
    setFormValue({ ...formValue, [name]: value });
  };

  const handleSubmit = async (e) => {
    setLoading(true);
    setFormError("");
    e.preventDefault();
    setFormErrors(validate(formValue));
    window.scrollTo(0, 0);

    if (Object.keys(validate(formValue)).length > 0) {
      setLoading(false);
      return;
    }

    const updatedFields = {};

    for (const fieldName of Object.keys(formValue)) {
      if (formValue[fieldName] !== "" && formValue[fieldName] !== currentUser[fieldName]) {
        updatedFields[fieldName] = formValue[fieldName];
      } else {
        updatedFields[fieldName] = currentUser[fieldName];
      }
    }

    const result = await handleUpdateUser(updatedFields);

    if (result.success) {
      setEditForm(false);
      setFormValue({
        email: "",
        password: "",
        fullname: "",
        address1: "",
        address2: "",
        zipcode: "",
        number: "",
      });
    } else {
      setFormError(result.message);
    }

    setLoading(false);
  };

  const confirmDeleteUser = () => {
    ResetLocation();
    setConfirmationModal(true);
  };

  const handleDeleteUser = async (id) => {
    const response = await deleteUser(id);

    if (response.success) {
      const isLoggedOut = await handleLogoutUser();

      if (isLoggedOut.success) {
        setFormError("");
        navigate("/");
      } else {
        setFormError(isLoggedOut.message);
      }
    } else {
      setFormError(response.message);
      setConfirmationModal(false);
    }
  };

  useEffect(() => {
    document.title = "Profile | PizzaByte";
  }, []);

  useEffect(() => {
    let isMounted = true;

    const loadOrders = async () => {
      if (!customerId) {
        if (isMounted) {
          setOrders([]);
          setOrdersError("Sign in to view your order history.");
        }
        return;
      }

      setOrdersLoading(true);
      setOrdersError("");

      const result = await getCustomerOrders(customerId);

      if (!isMounted) {
        return;
      }

      if (result.success) {
        setOrders(result.data);
      } else {
        setOrders([]);
        setOrdersError(result.message);
      }

      setOrdersLoading(false);
    };

    loadOrders();

    return () => {
      isMounted = false;
    };
  }, [customerId]);

  return (
    <motion.main
      className="profile"
      initial={slideInLeft.initial}
      whileInView={slideInLeft.whileInView}
      exit={slideInLeft.exit}
      transition={slideInLeft.transition}>
      <h2>Profile information</h2>
      <p>Personal details and application</p>
      {loading ? (
        <div role="status" className="loader">
          <p>Almost there...</p>
          <img
            alt="Processing request"
            src="https://media0.giphy.com/media/L05HgB2h6qICDs5Sms/giphy.gif?cid=ecf05e472hf2wk1f2jou3s5fcnx1vek6ggnfcvhsjbeh7v5u&ep=v1_stickers_search&rid=giphy.gif&ct=s"
          />
        </div>
      ) : editForm ? (
        <form className="profile__form" onSubmit={handleSubmit}>
          {formError && (
            <span aria-live="polite" className="input-validation-error">
              {formError}
            </span>
          )}
          <hr aria-hidden="true" />
          <label htmlFor="email" className="profile__form__info">
            Email
            <input
              name="email"
              id="email"
              type="text"
              value={formValue.email}
              placeholder={currentUser.email}
              autoComplete="email"
              onChange={handleValidation}
              aria-describedby="email-error"
            />
          </label>

          <span id="email-error" aria-live="polite" className="input-validation-error">
            {formErrors.email}
          </span>
          <hr aria-hidden="true" />

          <label htmlFor="password" className="profile__form__info">
            Password
            <input
              id="password"
              name="password"
              type="password"
              autoComplete="new-password"
              value={formValue.password}
              placeholder="********"
              onChange={handleValidation}
              aria-describedby="password-error"
            />
          </label>

          <span aria-live="polite" id="password-error" className="input-validation-error">
            {formErrors.password}
          </span>
          <hr aria-hidden="true" />

          <label htmlFor="fullname" className="profile__form__info">
            Fullname
            <input
              name="fullname"
              id="fullname"
              type="text"
              autoComplete="name"
              value={formValue.fullname}
              placeholder={currentUser.fullname}
              onChange={handleValidation}
              aria-describedby="fullname-error"
            />
          </label>

          <span aria-live="polite" id="fullname-error" className="input-validation-error">
            {formErrors.fullname}
          </span>
          <hr aria-hidden="true" />

          <label htmlFor="address1" className="profile__form__info">
            Address Line 1
            <input
              id="address1"
              name="address1"
              type="text"
              autoComplete="billing address-line1"
              value={formValue.address1}
              placeholder={currentUser.address1 !== null ? currentUser.address1 : "Add address line 1..."}
              onChange={handleValidation}
              aria-describedby="address1-error"
            />
          </label>

          <span aria-live="polite" id="address1-error" className="input-validation-error">
            {formErrors.address1}
          </span>
          <hr aria-hidden="true" />

          <label htmlFor="address2" className="profile__form__info">
            Address Line 2
            <input
              id="address2"
              name="address2"
              type="text"
              autoComplete="billing address-line2"
              value={formValue.address2}
              placeholder={currentUser.address2 !== null ? currentUser.address2 : "Add address line 2..."}
              onChange={handleValidation}
              aria-describedby="address2-error"
            />
          </label>

          <span aria-live="polite" id="address2-error" className="input-validation-error">
            {formErrors.address2}
          </span>
          <hr aria-hidden="true" />

          <label htmlFor="zipcode" className="profile__form__info">
            Zip Code
            <input
              id="zipcode"
              name="zipcode"
              type="text"
              autoComplete="billing postal-code"
              value={formValue.zipcode}
              placeholder={currentUser.zipcode !== null ? currentUser.zipcode : "Add zip code..."}
              onChange={handleValidation}
              aria-describedby="zipcode-error"
            />
          </label>

          <span aria-live="polite" id="zipcode-error" className="input-validation-error">
            {formErrors.zipcode}
          </span>
          <hr aria-hidden="true" />

          <label htmlFor="number" className="profile__form__info">
            Number
            <input
              id="number"
              name="number"
              type="text"
              value={formValue.number}
              autoComplete="mobile tel"
              placeholder={currentUser.number !== null ? currentUser.number : "Add number..."}
              onChange={handleValidation}
              aria-describedby="number-error"
            />
          </label>

          <span aria-live="polite" id="number-error" className="input-validation-error">
            {formErrors.number}
          </span>
          <hr aria-hidden="true" />
          <div className="profile__actions">
            <button
              aria-label="Cancel editing"
              type="button"
              className="active-button-style"
              onClick={() => {
                toggleForm();
              }}>
              Cancel edit
            </button>
            <button type="submit" aria-label="Save changes" className="passive-button-style">
              Save profile
            </button>
          </div>
        </form>
      ) : (
        <React.Fragment>
          <section className="profile__info" aria-labelledby="profile-title">
            <h3 id="profile-title" className="visually-hidden">
              Profile Information
            </h3>
            {formError && (
              <span aria-live="polite" className="input-validation-error">
                {formError}
              </span>
            )}
            <hr aria-hidden="true" />

            <div className="profile__info__section">
              <h3>Email</h3>
              <p>{currentUser?.email || ""}</p>
            </div>
            <hr aria-hidden="true" />
            <div className="profile__info__section">
              <h3>Password</h3>
              <p>*********</p>
            </div>
            <hr aria-hidden="true" />
            <div className="profile__info__section">
              <h3>Fullname</h3>
              <p>{currentUser?.fullname || ""}</p>
            </div>
            <hr aria-hidden="true" />
            <div className="profile__info__section">
              <h3>Address Line 1</h3>
              <p>{currentUser?.address1 ? currentUser?.address1 : " N/A"}</p>
            </div>
            <hr aria-hidden="true" />
            <div className="profile__info__section">
              <h3>Address Line 2</h3>
              <p>{currentUser?.address2 ? currentUser?.address2 : " N/A"}</p>
            </div>
            <hr aria-hidden="true" />
            <div className="profile__info__section">
              <h3>Zip Code</h3>
              <p>{currentUser?.zipcode ? currentUser?.zipcode : " N/A"}</p>
            </div>
            <hr aria-hidden="true" />
            <div className="profile__info__section">
              <h3>Number</h3>
              <p>{currentUser?.number ? currentUser?.number : "N/A"}</p>
            </div>
            <hr aria-hidden="true" />
          </section>
          <section className="profile__orders" aria-labelledby="profile-orders-title">
            <div className="profile__orders__header">
              <div>
                <h3 id="profile-orders-title">Order history</h3>
              </div>
              <div className="profile__orders__filters" role="tablist" aria-label="Order filters">
                {ORDER_FILTERS.map((filter) => {
                  const filterCount =
                    filter === "all"
                      ? orders.length
                      : orders.filter((order) => normalizeStatus(order.status) === filter).length;

                  return (
                    <button
                      key={filter}
                      type="button"
                      className={`profile__orders__filter${
                        selectedOrderFilter === filter ? " profile__orders__filter--active" : ""
                      }`}
                      onClick={() => setSelectedOrderFilter(filter)}>
                      {formatStatus(filter)} ({filterCount})
                    </button>
                  );
                })}
              </div>
            </div>

            {ordersLoading ? (
              <p className="profile__orders__state">Loading your orders...</p>
            ) : ordersError ? (
              <p className="profile__orders__state profile__orders__state--error">{ordersError}</p>
            ) : visibleOrders.length === 0 ? (
              <p className="profile__orders__state">
                {selectedOrderFilter === "all"
                  ? "You haven't ordered anything yet."
                  : `No ${selectedOrderFilter} orders yet.`}
              </p>
            ) : (
              <div className="profile__orders__list">
                {visibleOrders.map((order) => {
                  const totalItems = order.items.reduce((sum, item) => sum + item.quantity, 0);

                  return (
                    <article key={order.order_id} className="profile__order-card">
                      <div className="profile__order-card__top">
                        <div>
                          <h4>Order #{order.order_id}</h4>
                          <p>{formatDateTime(order.created_at)}</p>
                        </div>
                        <span
                          className={`profile__order-status profile__order-status--${normalizeStatus(
                            order.status
                          )}`}>
                          {formatStatus(order.status)}
                        </span>
                      </div>

                      <div className="profile__order-card__meta">
                        <div>
                          <span>Service</span>
                          <strong>{formatStatus(order.service_type)}</strong>
                        </div>
                        <div>
                          <span>Payment</span>
                          <strong>{formatStatus(order.payment_status)}{order.payment_method ? ` | ${order.payment_method}` : ""}</strong>
                        </div>
                        <div>
                          <span>Items</span>
                          <strong>{totalItems}</strong>
                        </div>
                        <div>
                          <span>Total</span>
                          <strong>{formatCurrency(order.total_amount)}</strong>
                        </div>
                      </div>

                      <ul className="profile__order-card__items">
                        {order.items.map((item) => (
                          <li key={`${order.order_id}-${item.item_id}`}>
                            <span>
                              {item.item_name} x{item.quantity}
                            </span>
                            <strong>{formatCurrency(item.line_total)}</strong>
                          </li>
                        ))}
                      </ul>
                    </article>
                  );
                })}
              </div>
            )}
          </section>
          <div className="profile__actions">
            <button
              type="button"
              className="active-button-style"
              onClick={() => {
                toggleForm();
              }}
              aria-label="Edit profile">
              Edit profile
            </button>
            <button
              type="button"
              className="passive-button-style"
              onClick={() => confirmDeleteUser()}
              aria-label="Delete account">
              Delete account
            </button>
          </div>
        </React.Fragment>
      )}
      {confirmationModal && (
        <section className="profile__delete-modal">
          <div className="profile__delete-window">
            <h3>Delete account</h3>
            <p>
              Are you sure you want to delete your account? This action cannot be reversed and all the data will be lost
            </p>
            <div>
              <button
                type="button"
                className="profile__delete-confirm"
                onClick={() => handleDeleteUser(currentUser.id)}
                aria-label="Confirm account deletion">
                Confirm
              </button>
              <button
                type="button"
                className="profile__delete-cancel"
                onClick={() => {
                  setConfirmationModal(false);
                  ResetLocation();
                }}
                aria-label="Cancel account deletion">
                Cancel
              </button>
            </div>
          </div>
        </section>
      )}
    </motion.main>
  );
};

export default ProfilePage;
