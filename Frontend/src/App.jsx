import { useState, useEffect } from "react";
import { Route, Routes, Navigate, useNavigate } from "react-router-dom";
import { Toaster } from "react-hot-toast";

// Original Layout & Components
import Header from "./components/layout/header/Header";
import Footer from "./components/layout/footer/Footer";
import LoginModal from "./components/login/LoginModal";
import ResetLocation from "./utils/ResetLocation";

// Original Pages
import {
  AboutPage,
  BlogPage,
  CartPage,
  CheckoutPage,
  HomePage,
  MenuPage,
  RegistrationPage,
  MenuItemPage,
  NotFoundPage,
  ProfilePage,
  BlogPostPage,
  CareersPage,
  RefundsPage,
  TermsPage,
  PrivacyPage,
} from "./routes/index";

// Original Features & Context
import CartTotals from "./features/cart/components/CartTotals";
import CartItem from "./features/cart/components/CartItem";
import { CartProvider } from "./context/CartContext";
import { ProductsProvider } from "./context/ProductsContext";
import Checkout from "./features/checkout/components/checkout/Checkout";
import Payment from "./features/checkout/components/payment/Payment";

// Original API Utilities
import { updateUser } from "./api/updateUser";
import { logoutUser } from "./api/logoutUser";
import { validateJWT } from "./api/validateJWT";

// NEW INTEGRATIONS: Theme Store and Admin Dashboard
// (Ensure these files exist in your local project)
import NavBar from "./components/NavBar";
import AdminHomePage from "./pages/AdminHomePage";
import AdminItemPage from "./pages/AdminItemPage";
import ExpensesPage from "./pages/ExpensesPage";
import IngredientsPage from "./pages/IngredientsPage";
import ItemPage from "./pages/ItemPage";
import StaffPage from "./pages/StaffPage";
import { useThemeStore } from "./store/useThemeStore";

function App() {
  // Original States
  const [isLoginModalOpen, setIsLoginModalOpen] = useState(false);
  const [isNavOpen, setIsNavOpen] = useState(false);
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [user, setUser] = useState(null);
  const navigate = useNavigate();

  // New States for Admin and Theme
  const [isAdmin, setIsAdmin] = useState(false);
  const { theme } = useThemeStore(); // Global theme selector

  // Original User Update Logic
  const handleUpdateUser = async (user) => {
    const response = await updateUser(user);
    if (response.success) {
      setUser(response.user);
    }
    return response;
  };

  // Original JWT Validation Effect
  useEffect(() => {
    const loggedIn = localStorage.getItem("loggedIn");
    const adminSaved = localStorage.getItem("isAdmin") === "true";

    if (!loggedIn) return;
    let isMounted = true;

    (async () => {
      const response = await validateJWT();
      if (!isMounted) return;

      if (!response.success) {
        setIsLoggedIn(false);
        setIsAdmin(false);
        localStorage.removeItem("loggedIn");
        localStorage.removeItem("isAdmin");
      } else {
        setIsLoggedIn(true);
        setUser(response.user);
        localStorage.setItem("loggedIn", true);
      }
    })();

    return () => {
      isMounted = false;
    };
  }, []);

  useEffect(() => {
    if (user && user.role === "admin") {
      setIsAdmin(true);
      localStorage.setItem("isAdmin", "true");
    } else {
      setIsAdmin(false);
      localStorage.removeItem("isAdmin");
    }
  }, [user]);

  useEffect(() => {
    document.documentElement.setAttribute("data-theme", theme);
  }, [theme]);

  // Original Modal & Logout Handlers
  const activateLoginModal = () => {
    hideMenu();
    setIsLoginModalOpen(!isLoginModalOpen);
  };

  const handleLogoutUser = async () => {
    const response = await logoutUser();
    if (response.success) {
      setIsLoggedIn(false);
      setIsAdmin(false);
      setUser(null);
      hideMenu();
      ResetLocation();
      
      // Use removeItem instead of .clear() so you don't delete your theme!
      localStorage.removeItem("loggedIn");
      localStorage.removeItem("isAdmin");

      // FORCE REDIRECT TO HOME PAGE
      navigate("/"); // <--- ADD THIS LINE
    }
    return response;
  };

  const hideMenu = () => {
    setIsNavOpen(false);
  };

  return (
    <CartProvider isLoggedIn={isLoggedIn}>
      {/* CONDITIONAL RENDERING: 
            If Admin is logged in, show the previous app (Dashboard).
            Otherwise, show the standard PizzaByte Storefront.
          */}
      {isAdmin ? (
        <div className="min-h-screen transition-all duration-300">
          <Routes>
            <Route path="/" element={<Navigate to="/admin" replace />} />
            <Route path="*" element={<Navigate to="/admin" replace />} />
            {/* Admin dashboard — requires login */}
            <Route
              path="/admin"
              element={
                <>
                  <NavBar handleLogout={handleLogoutUser} />
                  <AdminHomePage />
                </>
              }
            />

            {/* Item edit page — requires login */}
            <Route
              path="/admin/items"
              element={
                <>
                  <NavBar handleLogout={handleLogoutUser} />
                  <AdminItemPage />
                </>
              }
            />

            <Route
              path="/item/:sku"
              element={
                <>
                  <NavBar handleLogout={handleLogoutUser} />
                  <ItemPage />
                </>
              }
            />

            <Route
              path="/staff"
              element={
                <>
                  <NavBar handleLogout={handleLogoutUser} />
                  <StaffPage />
                </>
              }
            />

            <Route
              path="/ingredients"
              element={
                <>
                  <NavBar handleLogout={handleLogoutUser} />
                  <IngredientsPage />
                </>
              }
            />

            <Route
              path="/expenses"
              element={
                <>
                  <NavBar handleLogout={handleLogoutUser} />
                  <ExpensesPage />
                </>
              }
            />
          </Routes>

          <Toaster />
        </div>
      ) : (
        <>
          <Header
            loginModal={
              <LoginModal
                setUser={setUser}
                setIsLoggedIn={setIsLoggedIn}
                setIsLoginModalOpen={setIsLoginModalOpen}
                isLoginModalOpen={isLoginModalOpen}
                hideMenu={hideMenu}
              />
            }
            activateLoginModal={activateLoginModal}
            setIsNavOpen={setIsNavOpen}
            isNavOpen={isNavOpen}
            hideMenu={hideMenu}
            handleLogoutUser={handleLogoutUser}
            isLoggedIn={isLoggedIn}
          />

          <Routes>
            {/* Original Storefront Routes */}
            <Route path="/" element={<HomePage />} />

            <Route
              path="/cart"
              element={
                <CartPage
                  isLoggedIn={isLoggedIn}
                  activateLoginModal={activateLoginModal}
                  CartItem={
                    <CartItem
                      cartTotals={<CartTotals className="cart-totals" />}
                    />
                  }
                />
              }
            />

            <Route
              exact
              path="/menu"
              element={
                <ProductsProvider isLoggedIn={isLoggedIn}>
                  {/* You can inject your old ItemCards inside MenuPage */}
                  <MenuPage />
                </ProductsProvider>
              }
            />

            <Route path="/menu/:id" element={<MenuItemPage />} />

            <Route
              path="/profile"
              element={
                !isLoggedIn ? (
                  <NotFoundPage />
                ) : (
                  <ProfilePage
                    currentUser={user}
                    handleLogoutUser={handleLogoutUser}
                    handleUpdateUser={handleUpdateUser}
                  />
                )
              }
            />

            {/* Nested Checkout Routes */}
            <Route path="checkout" element={<CheckoutPage />}>
              <Route index element={<Checkout currentUser={user} />} />
              <Route path="payment" element={<Payment currentUser={user} />} />
            </Route>

            <Route exact path="/blog" element={<BlogPage />} />
            <Route path="/blog/:name" element={<BlogPostPage />} />
            <Route path="/about" element={<AboutPage />} />

            <Route
              path="/register"
              element={
                isLoggedIn ? (
                  <NotFoundPage />
                ) : (
                  <RegistrationPage activateLoginModal={activateLoginModal} />
                )
              }
            />

            <Route path="/careers" element={<CareersPage />} />
            <Route path="/refunds" element={<RefundsPage />} />
            <Route path="/terms" element={<TermsPage />} />
            <Route path="/privacy" element={<PrivacyPage />} />
            
            {/* ADD THIS: Kicks non-admins out of admin URLs smoothly instead of 404ing */}
            <Route path="/admin/*" element={<Navigate to="/" replace />} />

            {/* Catch-all 404 */}
            <Route path="*" element={<NotFoundPage />} />
          </Routes>
          <Footer />
        </>
      )}
    </CartProvider>
  );
}

export default App;
