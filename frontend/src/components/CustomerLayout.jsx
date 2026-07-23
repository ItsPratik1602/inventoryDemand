import { Outlet, Link, Navigate, useLocation, useNavigate } from "react-router-dom";
import { useState, useEffect } from "react";
import { useAuth } from "../context/AuthContext.jsx";
import { useToast } from "../context/ToastContext.jsx";
import api from "../lib/api.js";
import Button from "./Button.jsx";
import Loader from "./Loader.jsx";
import { getHomeRoute } from "../utils/routeUtils.js";

function CustomerLayout() {
  console.log("render CustomerLayout");

  const { user, token, loading } = useAuth();
  const { showToast } = useToast();
  const [searchQuery, setSearchQuery] = useState("");
  const [cartCount, setCartCount] = useState(0);
  const [wishlistCount, setWishlistCount] = useState(0);
  const [showProfileDropdown, setShowProfileDropdown] = useState(false);
  const navigate = useNavigate();
  const location = useLocation();

  // Fetch cart and wishlist counts
  useEffect(() => {
    if (!user) {
      setCartCount(0);
      setWishlistCount(0);
      return;
    }

    fetchCartCount();
    fetchWishlistCount();
  }, [user]);

  // Listen for cart and wishlist updates
  useEffect(() => {
    const handleCartUpdate = () => {
      if (!user) {
        return;
      }

      fetchCartCount();
    };
    
    const handleWishlistUpdate = () => {
      if (!user) {
        return;
      }

      fetchWishlistCount();
    };

    window.addEventListener('cartUpdated', handleCartUpdate);
    window.addEventListener('wishlistUpdated', handleWishlistUpdate);

    return () => {
      window.removeEventListener('cartUpdated', handleCartUpdate);
      window.removeEventListener('wishlistUpdated', handleWishlistUpdate);
    };
  }, [user]);

  const fetchCartCount = async () => {
    try {
      const response = await api.get("/cart");
      setCartCount(response.data.data?.items?.length || 0);
    } catch (error) {
      console.error("Failed to fetch cart count:", error);
      // Fallback to 0 if API fails
      setCartCount(0);
    }
  };

  const fetchWishlistCount = async () => {
    try {
      const response = await api.get("/wishlist");
      setWishlistCount(response.data.data?.length || 0);
    } catch (error) {
      console.error("Failed to fetch wishlist count:", error);
      // Fallback to 0 if API fails
      setWishlistCount(0);
    }
  };

  // Debounced search effect
  useEffect(() => {
    const delayDebounceFn = setTimeout(() => {
      if (searchQuery.trim()) {
        navigate(`/products?search=${encodeURIComponent(searchQuery.trim())}`);
      }
    }, 400);

    return () => clearTimeout(delayDebounceFn);
  }, [searchQuery, navigate]);

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    // Immediate search on form submit
    if (searchQuery.trim()) {
      navigate(`/products?search=${encodeURIComponent(searchQuery.trim())}`);
    }
  };

  const handleLogout = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("user");
    window.location.href = "/login";
  };

  if (loading && token) {
    return <Loader text="Restoring session..." />;
  }

  if (user?.role && user.role !== "CUSTOMER" && !location.pathname.startsWith("/admin")) {
    return <Navigate to={getHomeRoute(user.role)} replace />;
  }

  return (
    <div className="flex">
      {/* SIDEBAR */}
      <aside className="fixed top-0 left-0 w-60 h-screen bg-white shadow-md z-40 overflow-y-auto">
        {/* Sidebar content would go here */}
        <div className="p-4">
          <h3 className="text-lg font-semibold mb-4">Menu</h3>
          <nav className="space-y-2">
            <Link to="/" className="block px-3 py-2 rounded hover:bg-gray-100">Home</Link>
            <Link to="/products" className="block px-3 py-2 rounded hover:bg-gray-100">Products</Link>
            <Link to="/profile" className="block px-3 py-2 rounded hover:bg-gray-100">Profile</Link>
            <Link to="/orders" className="block px-3 py-2 rounded hover:bg-gray-100">Orders</Link>
            <Link
              to="/rewards" 
              className="block px-3 py-2 rounded hover:bg-gray-100"
            >
              Coins
            </Link>
          </nav>
        </div>
      </aside>

      {/* MAIN */}
      <div className="flex-1 ml-60">
        {/* SINGLE HEADER */}
        <header className="h-16 bg-white shadow flex items-center justify-between px-4 sticky top-0 z-50">
          <div className="max-w-[1400px] mx-auto px-4">
            {/* Top Bar */}
            <div className="flex items-center justify-between h-16">
              {/* Logo */}
              <div className="flex items-center">
                <Link 
                  to="/" 
                  className="text-2xl font-bold text-blue-600 hover:text-blue-700 transition-colors flex items-center"
                >
                  <span className="text-3xl mr-2">Shop</span>
                  <span className="text-sm text-gray-500">Mart</span>
                </Link>
              </div>
              
              {/* Search Bar */}
              <div className="flex-1 max-w-2xl mx-8">
                <form onSubmit={handleSearchSubmit} className="relative">
                  <input
                    type="text"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder="Search for products, brands and more..."
                    className="w-full px-4 py-3 pr-12 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
                  />
                  <button
                    type="submit"
                    className="absolute right-2 top-1/2 transform -translate-y-1/2 p-2 text-gray-500 hover:text-blue-600 transition-colors"
                  >
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                    </svg>
                  </button>
                </form>
              </div>
              
              {/* Navigation Icons */}
              <div className="flex items-center space-x-6">
              {user ? (
                <>
                  {/* Wishlist */}
                  <Link 
                    to="/wishlist" 
                    className="relative p-2 text-gray-600 hover:text-blue-600 transition-colors"
                  >
                    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
                    </svg>
                    {wishlistCount > 0 && (
                      <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center">
                        {wishlistCount}
                      </span>
                    )}
                  </Link>
                  
                  {/* Cart */}
                  <Link 
                    to="/cart" 
                    className="relative p-2 text-gray-600 hover:text-blue-600 transition-colors"
                  >
                    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 11-4 0 2 2 0 014 0z" />
                    </svg>
                    {cartCount > 0 && (
                      <span className="absolute -top-1 -right-1 bg-orange-500 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center">
                        {cartCount}
                      </span>
                    )}
                  </Link>
                  
                  {/* Profile Dropdown */}
                  <div className="relative">
                    <button
                      onClick={() => setShowProfileDropdown(!showProfileDropdown)}
                      className="flex items-center p-2 text-gray-600 hover:text-blue-600 transition-colors"
                    >
                      <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                      </svg>
                    </button>
                    
                    {showProfileDropdown && (
                      <div className="absolute right-0 mt-2 w-48 bg-white rounded-lg shadow-lg border border-gray-200 py-2 z-50 max-h-[300px] overflow-y-auto" style={{ maxHeight: 'calc(100vh - 120px)' }}>
                        <div className="px-4 py-2 border-b border-gray-200">
                          <p className="text-sm font-medium text-gray-900">{user.name}</p>
                          <p className="text-xs text-gray-500">{user.email}</p>
                        </div>
                        <Link
                          to="/profile"
                          className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                          onClick={() => setShowProfileDropdown(false)}
                        >
                          My Profile
                        </Link>
                        <Link
                          to="/orders"
                          className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                          onClick={() => setShowProfileDropdown(false)}
                        >
                          My Orders
                        </Link>
                        <Link
                          to="/rewards"
                          className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                          onClick={() => setShowProfileDropdown(false)}
                        >
                          My Coins
                        </Link>
                        <button
                          onClick={handleLogout}
                          className="block w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                        >
                          Logout
                        </button>
                      </div>
                    )}
                  </div>
                </>
              ) : (
                <div className="flex items-center space-x-4">
                  <Link
                    to="/login"
                    className="text-gray-600 hover:text-blue-600 transition-colors text-sm font-medium"
                  >
                    Login
                  </Link>
                  <Button variant="primary" size="sm">
                    <Link to="/register">Sign Up</Link>
                  </Button>
                </div>
              )}
            </div>
          </div>
        </div>
      </header>
      
      {/* PAGE CONTENT */}
      <main className="p-4 bg-gray-50 min-h-screen">
        <Outlet />
      </main>
    </div>
  </div>
);
}

export default CustomerLayout;
