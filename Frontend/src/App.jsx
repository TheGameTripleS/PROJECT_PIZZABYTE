import { useEffect } from "react"
import NavBar from "./components/NavBar"
import ProtectedRoute from "./components/ProtectedRoute"
import Home from "./pages/Home"
import AdminHomePage from "./pages/AdminHomePage"
import ItemPage from "./pages/ItemPage"
import StaffPage from "./pages/StaffPage"
import { Routes, Route } from "react-router-dom"
import { useThemeStore } from "./store/useThemeStore"
import { useAdminStore } from "./store/useAdminStore"
import { Toaster } from "react-hot-toast"

function App() {
  const { theme } = useThemeStore()
  const { initializeAdminSession } = useAdminStore()

  useEffect(() => {
    initializeAdminSession()
  }, [initializeAdminSession])

  return (
    <div className="min-h-screen bg-base-200 transition-colors duration-300" data-theme={theme}>
      <Routes>
        {/* Public homepage — has its own inline navbar */}
        <Route path="/" element={<Home />} />

        {/* Admin dashboard — requires login */}
        <Route
          path="/admin"
          element={
            <ProtectedRoute>
              <>
                <NavBar />
                <AdminHomePage />
              </>
            </ProtectedRoute>
          }
        />

        {/* Item edit page — requires login */}
        <Route
          path="/item/:sku"
          element={
            <ProtectedRoute>
              <>
                <NavBar />
                <ItemPage />
              </>
            </ProtectedRoute>
          }
        />

        <Route
          path="/staff"
          element={
            <ProtectedRoute>
              <>
                <NavBar />
                <StaffPage />
              </>
            </ProtectedRoute>
          }
        />
      </Routes>

      <Toaster />
    </div>
  )
}

export default App
