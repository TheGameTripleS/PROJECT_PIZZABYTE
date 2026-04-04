import { Navigate } from "react-router-dom";
import { useAdminStore } from "../store/useAdminStore";

// Wraps any route that requires admin authentication.
// Redirects to "/" if not logged in as admin.
function ProtectedRoute({ children }) {
    const { isAdmin } = useAdminStore();

    if (!isAdmin) return <Navigate to="/" replace />;

    return children;
}

export default ProtectedRoute;
