import NavBar from "./components/NavBar"
import HomePage from "./pages/HomePage"
import ItemPage from "./pages/ItemPage"
import { Routes, Route } from "react-router-dom"

function App() {
  return (
    <div className="min-h-screen bg-base-200 transition-colors duration-300">
      <NavBar />
      <Routes>
        <Route path="/" element={<HomePage />} />
        <Route path="/item/:sku" element={<ItemPage />} />
      </Routes>
      <h1 className="text-red-500">Welcome to the Frontend!</h1>
    </div>
  )
}

export default App
