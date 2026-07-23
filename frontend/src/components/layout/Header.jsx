import React, { useState, useEffect, useMemo } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Search, ShoppingCart, User, LogOut, Heart } from 'lucide-react';
import { useAuth } from "../../context/AuthContext.jsx";

const Header = () => {
  const { user, logout } = useAuth();
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState([]);
  const [isSearching, setIsSearching] = useState(false);
  const navigate = useNavigate();

  // Debounced search
  useEffect(() => {
    const timer = setTimeout(() => {
      if (searchQuery.trim()) {
        handleSearch();
      } else {
        setSearchResults([]);
      }
    }, 300);

    return () => clearTimeout(timer);
  }, [searchQuery]);

  const handleSearch = async () => {
    if (!searchQuery.trim()) return;
    
    setIsSearching(true);
    try {
      const response = await fetch(`/api/v1/public/products?search=${searchQuery}&limit=5`);
      const result = await response.json();
      setSearchResults(result.data?.items || []);
    } catch (error) {
      console.error('Search error:', error);
      setSearchResults([]);
    } finally {
      setIsSearching(false);
    }
  };

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  return (
    <header className="flex items-center justify-between px-6 py-3 bg-white shadow-md sticky top-0 z-50">
      {/* Logo */}
      <div className="flex items-center">
        <Link to="/" className="text-2xl font-bold text-blue-600">
          ShopHub
        </Link>
      </div>

      {/* Search Bar */}
      <div className="flex-1 max-w-xl mx-8 relative">
        <div className="relative">
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search products..."
            className="w-full px-4 py-2 pr-10 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
          <Search className="absolute right-3 top-2.5 h-5 w-5 text-gray-400" />
        </div>

        {/* Search Results Dropdown */}
        {searchResults.length > 0 && (
          <div className="absolute top-full left-0 right-0 bg-white border border-gray-200 rounded-lg shadow-lg mt-1 max-h-96 overflow-y-auto">
            {Array.isArray(searchResults) && searchResults.map((product) => {
              // Get stable image URL for this product
              let img = product.images;
              if (Array.isArray(img)) {
                img = img[0];
              }
              if (img && typeof img === 'object' && img.url) {
                img = img.url;
              }
              const imageUrl = (!img || img === "") 
                ? "/placeholder.png" 
                : (img.startsWith("http") 
                  ? img 
                  : `http://localhost:5000/${img.replace(/^\/+/, "")}`);
              
              console.log("SEARCH IMAGE URL:", imageUrl);

              return (
                <Link
                  key={product.id}
                  to={`/product/${product.id}`}
                  className="flex items-center p-3 hover:bg-gray-50 border-b border-gray-100"
                  onClick={() => {
                    setSearchQuery('');
                    setSearchResults([]);
                  }}
                >
                  <img
                    src={imageUrl}
                    alt={product.name}
                    className="w-12 h-12 object-cover rounded mr-3"
                    onError={(e) => {
                      e.target.onerror = null;
                      e.target.src = "/placeholder.png";
                    }}
                  />
                  <div className="flex-1">
                    <div className="font-medium text-gray-900">{product.name}</div>
                    <div className="text-sm text-gray-500">${product.price}</div>
                  </div>
                </Link>
              );
            })}
          </div>
        )}
      </div>

      {/* User Actions */}
      <div className="flex items-center gap-4">
        {user ? (
          <>
            <Link
              to="/cart"
              className="relative p-2 text-gray-600 hover:text-blue-600 transition"
            >
              <ShoppingCart className="h-6 w-6" />
              <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs rounded-full h-5 w-5 flex items-center justify-center">
                0
              </span>
            </Link>

            <Link
              to="/wishlist"
              className="relative p-2 text-gray-600 hover:text-blue-600 transition"
            >
              <Heart className="h-6 w-6" />
            </Link>

            <Link
              to="/orders"
              className="text-sm text-gray-600 hover:text-blue-600 transition"
            >
              Orders
            </Link>

            <Link
              to="/profile"
              className="text-sm text-gray-600 hover:text-blue-600 transition"
            >
              Profile
            </Link>

            <div className="flex items-center gap-3">
              <span className="text-sm text-gray-600">Hi, {user.name}</span>
              <button
                onClick={handleLogout}
                className="flex items-center gap-2 px-3 py-2 text-sm text-gray-600 hover:text-red-600 transition"
              >
                <LogOut className="h-4 w-4" />
                Logout
              </button>
            </div>
          </>
        ) : (
          <Link
            to="/login"
            className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition"
          >
            <User className="h-4 w-4" />
            Login
          </Link>
        )}
      </div>
    </header>
  );
};

export default Header;
