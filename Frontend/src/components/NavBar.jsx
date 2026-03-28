import { Link, useResolvedPath } from "react-router-dom"
import { ShoppingCartIcon, LogOut } from "lucide-react" // <-- 1. Import LogOut icon
import ThemeSelector from "./ThemeSelector"

// 2. Accept the handleLogout prop
function NavBar({ handleLogout }) {
  const {pathname} = useResolvedPath()
  const isHomePage = pathname === "/"

  return (
    <div className="bg-base-100/80 backdrop-blur-lg border-b border-base-content/10 sticky top-0 z-50">
      <div className="max-w-7xl mx-auto">
         <div className="navbar px-4 min-h-[4rem] justify-between">
          {/* LOGO */}
          <div className="flex-1 lg:flex-none">
            <Link to="/admin" className="hover:opacity-80 transition-opacity">
              <div className="flex items-center gap-2">
                <img src="/images/logo.png" alt="PIZZAbyte" className="h-9 w-9 object-contain" />
                <span className="font-semibold font-mono tracking-widest text-2xl bg-clip-text text-transparent bg-gradient-to-r from-primary to-secondary">
                  PizzaByte
                </span>
              </div>
            </Link>
          </div>
          {/* RIGHT SECTION */}
          <div className="flex items-center gap-4">
            <ThemeSelector />

            {isHomePage && (
              <div className="indicator">
                <div className="p-2 rounded-full  hover:bg-base-200 transition-colors">
                  <ShoppingCartIcon className="size-5" />
                  <span className="badge badge-sm badge-primary indicator-item">8</span>
                </div>
              </div>
            )}

            {/* 3. ADD LOGOUT BUTTON */}
            {handleLogout && (
              <button 
                onClick={handleLogout}
                className="btn btn-ghost btn-circle text-error hover:bg-error/20 transition-colors ml-2"
                title="Logout"
              >
                <LogOut className="size-5" />
              </button>
            )}

          </div>
         </div>
      </div>
    </div>
  )
}

export default NavBar