import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { UserIcon, SearchIcon, PackageIcon, XIcon, RefreshCwIcon } from "lucide-react";
import ThemeSelector from "../components/ThemeSelector";
import PublicItemCard from "../components/PublicItemCard";
import { useItemStore } from "../store/useItemStore";
import { useAdminStore } from "../store/useAdminStore";

function Home() {
    const navigate = useNavigate();
    const { items, loading, error, fetchItems, searchTerm, setSearchTerm } = useItemStore();
    const { isAdmin, adminLogin } = useAdminStore();

    // Sidebar / modal state
    const [sidebarOpen, setSidebarOpen]     = useState(false);
    const [loginModalOpen, setLoginModalOpen] = useState(false);
    const [loginForm, setLoginForm]         = useState({ username: "", email: "" });
    const [loginLoading, setLoginLoading]   = useState(false);

    // If admin is already logged in, redirect straight to dashboard
    useEffect(() => {
        if (isAdmin) navigate("/admin");
    }, [isAdmin, navigate]);

    // Debounced search
    useEffect(() => {
        const delay = setTimeout(() => fetchItems(), 300);
        return () => clearTimeout(delay);
    }, [searchTerm, fetchItems]);

    const filteredItems = items.filter((item) => {
        const search = searchTerm.toLowerCase().trim();
        if (!search) return true;
        return (
            item.item_name?.toLowerCase().includes(search) ||
            item.sku?.toLowerCase().includes(search)
        );
    });

    const handleAdminLogin = async (e) => {
        e.preventDefault();
        setLoginLoading(true);
        const success = await adminLogin(loginForm.username, loginForm.email);
        setLoginLoading(false);
        if (success) {
            setLoginModalOpen(false);
            setSidebarOpen(false);
            navigate("/admin");
        }
    };

    return (
        <div className="min-h-screen bg-base-200">

            {/* ── NAVBAR ─────────────────────────────────────────── */}
            <div className="bg-base-100/80 backdrop-blur-lg border-b border-base-content/10 sticky top-0 z-40">
                <div className="max-w-7xl mx-auto">
                    <div className="navbar px-4 min-h-[4rem] justify-between">

                        {/* LEFT — logo */}
                        <div className="flex items-center gap-2">
                            <img
                                src="/images/logo.png"
                                alt="PIZZAbyte logo"
                                className="h-9 w-9 object-contain"
                            />
                            <span className="font-semibold font-mono tracking-widest text-2xl bg-clip-text text-transparent bg-gradient-to-r from-primary to-secondary">
                                PIZZAbyte
                            </span>
                        </div>

                        {/* RIGHT — theme + account */}
                        <div className="flex items-center gap-1">
                            <ThemeSelector />
                            <button
                                className="btn btn-ghost btn-circle"
                                onClick={() => setSidebarOpen(true)}
                                title="Account"
                            >
                                <UserIcon className="size-5" />
                            </button>
                        </div>
                    </div>
                </div>
            </div>

            {/* ── ACCOUNT SIDEBAR ────────────────────────────────── */}
            {sidebarOpen && (
                <div className="fixed inset-0 z-50 flex justify-end">
                    {/* Backdrop */}
                    <div
                        className="absolute inset-0 bg-black/40 backdrop-blur-sm"
                        onClick={() => setSidebarOpen(false)}
                    />

                    {/* Panel */}
                    <div className="relative bg-base-100 w-72 h-full shadow-2xl flex flex-col p-6 gap-3 z-10">
                        <div className="flex items-center justify-between mb-2">
                            <h2 className="text-xl font-bold">Account</h2>
                            <button
                                className="btn btn-ghost btn-circle btn-sm"
                                onClick={() => setSidebarOpen(false)}
                            >
                                <XIcon className="size-4" />
                            </button>
                        </div>

                        {/* Admin Login */}
                        <button
                            className="btn btn-primary w-full"
                            onClick={() => {
                                setLoginModalOpen(true);
                                setSidebarOpen(false);
                            }}
                        >
                            Admin Login
                        </button>

                        {/* Coming-soon buttons */}
                        <div className="divider my-0 text-xs text-base-content/40">Customers</div>

                        <button
                            className="btn btn-outline w-full"
                            disabled
                        >
                            Customer Login
                            <span className="badge badge-sm badge-neutral ml-2">Soon</span>
                        </button>

                        <button
                            className="btn btn-outline w-full"
                            disabled
                        >
                            Customer Register
                            <span className="badge badge-sm badge-neutral ml-2">Soon</span>
                        </button>
                    </div>
                </div>
            )}

            {/* ── ADMIN LOGIN MODAL ───────────────────────────────── */}
            {loginModalOpen && (
                <div className="fixed inset-0 z-50 flex items-center justify-center">
                    <div
                        className="absolute inset-0 bg-black/50 backdrop-blur-sm"
                        onClick={() => setLoginModalOpen(false)}
                    />

                    <div className="relative bg-base-100 rounded-2xl shadow-2xl p-8 w-full max-w-md mx-4 z-10">
                        {/* Header */}
                        <div className="flex items-center justify-between mb-6">
                            <h2 className="text-2xl font-bold">Admin Login</h2>
                            <button
                                className="btn btn-ghost btn-circle btn-sm"
                                onClick={() => setLoginModalOpen(false)}
                            >
                                <XIcon className="size-4" />
                            </button>
                        </div>

                        <form onSubmit={handleAdminLogin} className="flex flex-col gap-4">
                            <div className="form-control">
                                <label className="label">
                                    <span className="label-text font-medium">Username</span>
                                </label>
                                <input
                                    type="text"
                                    placeholder="Enter admin username"
                                    className="input input-bordered w-full"
                                    value={loginForm.username}
                                    onChange={(e) =>
                                        setLoginForm({ ...loginForm, username: e.target.value })
                                    }
                                    required
                                    autoComplete="username"
                                />
                            </div>

                            <div className="form-control">
                                <label className="label">
                                    <span className="label-text font-medium">Email</span>
                                </label>
                                <input
                                    type="email"
                                    placeholder="Enter admin email"
                                    className="input input-bordered w-full"
                                    value={loginForm.email}
                                    onChange={(e) =>
                                        setLoginForm({ ...loginForm, email: e.target.value })
                                    }
                                    required
                                    autoComplete="email"
                                />
                            </div>

                            <button
                                type="submit"
                                className="btn btn-primary w-full mt-2"
                                disabled={loginLoading}
                            >
                                {loginLoading ? (
                                    <span className="loading loading-spinner loading-sm" />
                                ) : (
                                    "Login"
                                )}
                            </button>
                        </form>
                    </div>
                </div>
            )}

            {/* ── MAIN CONTENT ────────────────────────────────────── */}
            <main className="container mx-auto px-4 py-8">

                {/* Hero / tagline */}
                <div className="text-center mb-10">
                    <h1 className="text-4xl font-extrabold mb-2 bg-clip-text text-transparent bg-gradient-to-r from-primary to-secondary">
                        Our Menu
                    </h1>
                    <p className="text-base-content/60 text-lg">
                        Fresh ingredients, bold flavours — order your favourite today.
                    </p>
                </div>

                {/* Search + refresh */}
                <div className="flex justify-center mb-8">
                    <div className="relative w-full max-w-xl">
                        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-base-content/50">
                            <SearchIcon className="size-5" />
                        </div>
                        <input
                            type="text"
                            placeholder="Search pizzas, sides, SKUs..."
                            className="input input-bordered w-full pl-10 focus:input-primary shadow-sm"
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                        />
                    </div>
                    <button
                        className="btn btn-ghost btn-circle ml-2"
                        onClick={fetchItems}
                        title="Refresh"
                    >
                        <RefreshCwIcon className={`size-5 ${loading ? "animate-spin" : ""}`} />
                    </button>
                </div>

                {error && <div className="alert alert-error mb-8">{error}</div>}

                {/* Empty state */}
                {filteredItems.length === 0 && !loading && (
                    <div className="flex flex-col justify-center items-center h-96 space-y-4 opacity-60">
                        <div className="bg-base-200 rounded-full p-8">
                            <PackageIcon className="size-16" />
                        </div>
                        <div className="text-center space-y-2">
                            <h3 className="text-2xl font-semibold">No items found</h3>
                            <p className="max-w-sm">Try different keywords.</p>
                        </div>
                    </div>
                )}

                {/* Loading spinner */}
                {loading ? (
                    <div className="flex justify-center items-center h-64">
                        <div className="loading loading-spinner loading-lg" />
                    </div>
                ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                        {filteredItems.map((item) => (
                            <PublicItemCard key={item.sku} item={item} />
                        ))}
                    </div>
                )}
            </main>
        </div>
    );
}

export default Home;
