import { Link, useLocation, useNavigate } from "react-router-dom"
import { HomeIcon, LogOutIcon } from "lucide-react"
import ThemeSelector from "./ThemeSelector"

function NavBar({ handleLogout }) {
  const location = useLocation()
  const navigate = useNavigate()
  const isAdminHome = location.pathname === "/admin"
  const shouldShowLogout = isAdminHome
  const shouldShowHome =
    location.pathname.startsWith("/staff") ||
    location.pathname.startsWith("/admin/items") ||
    location.pathname.startsWith("/item/") ||
    location.pathname.startsWith("/recipe/") ||
    location.pathname.startsWith("/ingredients") ||
    location.pathname.startsWith("/expenses") ||
    location.pathname.startsWith("/income") ||
    location.pathname.startsWith("/reception-management")

  return (
    <div className="bg-base-100/80 backdrop-blur-lg border-b border-base-content/10 sticky top-0 z-50">
      <div className="max-w-7xl mx-auto">
         <div className="navbar px-4 min-h-[4rem] justify-between">
          {/* LOGO */}
          <div className="flex-1 lg:flex-none">
            <Link to="/admin" className="hover:opacity-80 transition-opacity">
              <div className="flex items-center gap-2">
                <img src="/images/logo.png" alt="PizzaByte" className="h-9 w-9 object-contain" />
                <span className="font-semibold font-mono tracking-widest text-2xl bg-clip-text text-transparent bg-gradient-to-r from-primary to-secondary">
                  PizzaByte
                </span>
              </div>
            </Link>
          </div>

          {/* RIGHT SECTION */}
          <div className="flex items-center gap-2">
            {shouldShowHome && (
              <button
                className="btn btn-ghost btn-sm gap-2"
                onClick={() => navigate("/admin")}
                title="Home"
              >
                <HomeIcon className="size-4" />
                <span className="hidden sm:inline">Home</span>
              </button>
            )}

            <ThemeSelector />

            {handleLogout && shouldShowLogout && (
              <button 
                onClick={handleLogout}
                className="btn btn-ghost btn-sm gap-2"
                title="Logout"
              >
                <LogOutIcon className="size-4" />
                <span className="hidden sm:inline">Logout</span>
              </button>
            )}
          </div>
         </div>
      </div>
    </div>
  )
}

export default NavBar