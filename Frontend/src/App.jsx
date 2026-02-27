import NavBar from "./components/NavBar"
import HomePage from "./pages/HomePage"
import ItemPage from "./pages/ItemPage"
import { Routes, Route } from "react-router-dom"
import { useThemeStore } from "./store/useThemeStore"
import { Toaster } from "react-hot-toast"

function App() {
  const { theme } = useThemeStore()
  
  return (
    <div className="min-h-screen bg-base-200 transition-colors duration-300" data-theme={theme}>
      <NavBar />
      <Routes>
        <Route path="/" element={<HomePage />} />
        <Route path="/item/:sku" element={<ItemPage />} />
      </Routes>

      <Toaster />
    </div>
  )
}

export default App
