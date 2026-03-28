import "./assets/header.css";

import logo from "./assets/logo.png";
import openMenu from "./assets/open-menu.svg";
import closeMenu from "./assets/close-menu.svg";
import { ShoppingCartIcon } from "lucide-react";
import { Link, NavLink } from "react-router-dom";
import SuccessMsg from "../../SuccessMsg";
import ResetLocation from "../../../utils/ResetLocation";
import headerMenu from "./data/header-menu";
import { useCart } from "../../../context/CartContext";
import ThemeSelector from "../../ThemeSelector";

const Header = ({
  isLoggedIn,
  loginModal,
  handleLogoutUser,
  isNavOpen,
  setIsNavOpen,
  hideMenu,
  activateLoginModal,
}) => {
  const { orderSummary } = useCart();
  const showModal = () => {
    setIsNavOpen(!isNavOpen);
  };
  return (
    <header aria-labelledby="title" className="header">
      {loginModal}
      <nav className="header__nav flex-container flex-row txt-center" aria-label="Header Menu">
        <NavLink
          onClick={() => {
            ResetLocation();
            hideMenu();
          }}
          to="/"
          className="logo-styling flex-container flex-row txt-center txt-white">
          <img width="100" height="100" className="logo" src={logo} alt="" aria-hidden="true" />
          <h1 id="title" translate="no">
            Pizza <span>Byte</span>
          </h1>
        </NavLink>
        <ul id="main-menu" className={`header__nav__menu flex-row pop-font ${isNavOpen ? "active" : ""}`}>
          {headerMenu.map(({ to, label, type }) => (
            <li key={type || to}>
              {type === "theme" ? (
                <ThemeSelector
                  showLabel
                  showIcon={false}
                  align="end"
                  buttonClassName="header__theme-trigger"
                  dropdownClassName="header__theme-dropdown dropdown-content mt-2 p-1 shadow-2xl bg-base-200 backdrop-blur-lg rounded-2xl w-56 border border-base-content/10"
                />
              ) : (
                <NavLink
                  onClick={() => {
                    ResetLocation();
                    hideMenu();
                  }}
                  className={({ isActive }) => `txt-white ${isActive && label !== "Home" ? "header-active-link" : ""}`}
                  aria-current={({ isActive }) => (isActive ? "page" : undefined)}
                  to={to}>
                  {label}
                </NavLink>
              )}
            </li>
          ))}
          {isLoggedIn && (
            <li>
              <NavLink
                onClick={() => {
                  ResetLocation();
                  hideMenu();
                }}
                className={({ isActive }) => `txt-white ${isActive ? "header-active-link" : ""}`}
                aria-current={({ isActive }) => (isActive ? "page" : undefined)}
                to="/profile">
                Profile
              </NavLink>
            </li>
          )}
          <li>
            <div className="login-and-cart">
              {isLoggedIn ? (
                <Link to="/" className="passive-button-style txt-white" onClick={handleLogoutUser}>
                  Log out
                </Link>
              ) : (
                <button
                  className="passive-button-style txt-white"
                  onClick={() => {
                    ResetLocation();
                    activateLoginModal();
                  }}>
                  Log in
                </button>
              )}
              <NavLink
                className="cart-btn active-button-style"
                to="/cart"
                onClick={() => {
                  ResetLocation();
                  hideMenu();
                }}>
                <ShoppingCartIcon aria-hidden="true" size={20} strokeWidth={2} />
                <p>Cart</p>
                <p>({orderSummary.quantity})</p>
              </NavLink>
            </div>
          </li>
        </ul>
        <button
          className="header__nav__hamburger"
          aria-label={isNavOpen ? "Close menu" : "Open menu"}
          aria-expanded={isNavOpen}
          aria-controls="main-menu"
          onClick={showModal}>
          <img width="80" height="80" src={isNavOpen ? closeMenu : openMenu} alt="" />
        </button>
      </nav>
      <SuccessMsg />
    </header>
  );
};

export default Header;
