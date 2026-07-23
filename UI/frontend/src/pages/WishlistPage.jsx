import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { useToast } from "../context/ToastContext.jsx";
import Loader from "../components/Loader.jsx";
import ProductCard from "../components/ProductCard.jsx";
import api from "../lib/api.js";

function WishlistPage() {
  const [wishlist, setWishlist] = useState([]);
  const [loading, setLoading] = useState(true);
  const { showToast } = useToast();

  useEffect(() => {
    fetchWishlist();
  }, []);

  const fetchWishlist = async () => {
    try {
      const response = await api.get("/wishlist");
      setWishlist(response.data.data || []);
    } catch (error) {
      console.error("Failed to fetch wishlist:", error);
      showToast({ type: "error", message: "Failed to load wishlist" });
      // Fallback to empty array
      setWishlist([]);
    } finally {
      setLoading(false);
    }
  };

  const handleRemoveFromWishlist = async (itemId) => {
    try {
      await api.delete(`/wishlist/${itemId}`);
      
      setWishlist(prev => prev.filter(item => item.id !== itemId));
      showToast({ type: "success", message: "Removed from wishlist" });
      // Trigger wishlist count update event
      window.dispatchEvent(new Event('wishlistUpdated'));
    } catch (error) {
      showToast({ type: "error", message: "Failed to remove from wishlist" });
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader text="Loading wishlist..." />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Page Header */}
      <div className="bg-white border-b border-gray-200">
        <div className="max-w-[1400px] mx-auto px-4 py-6">
          <div className="flex justify-between items-center">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">
                My Wishlist
              </h1>
              <p className="text-gray-600 mt-1">{wishlist.length} items in your wishlist</p>
            </div>
          </div>
        </div>
      </div>

      {/* Wishlist Content */}
      <div className="max-w-[1400px] mx-auto px-4 py-8">
        {wishlist.length === 0 ? (
          <div className="text-center py-16">
            <div className="text-6xl text-gray-300 mb-4">Wishlist</div>
            <h2 className="text-3xl font-bold text-gray-900 mb-4">
              Your wishlist is empty
            </h2>
            <p className="text-lg text-gray-600 mb-8 max-w-md mx-auto">
              Save items you love for later. Start adding products to your wishlist!
            </p>
            <Link
              to="/products"
              className="inline-flex items-center px-8 py-4 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-semibold text-lg transition-colors transform hover:scale-105"
            >
              <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
              Browse Products
            </Link>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {wishlist.map((item) => (
              <div key={item.id} className="bg-white rounded-lg shadow-md hover:shadow-xl transition-all duration-300 group overflow-hidden">
                {/* Product Image */}
                <div className="relative h-[200px] overflow-hidden bg-gray-100">
                  <Link to={`/product/${item.product.id}`}>
                    <img
                      src={(() => {
                        if (item.product?.image) {
                          // If it's already a full URL (starts with http), use as-is
                          if (item.product.image.startsWith('http')) {
                            return item.product.image;
                          }
                          // If it's a local path, add backend URL
                          return `http://localhost:5000${item.product.image}`;
                        }
                        // Fallback to default image
                        return '/defaultProduct.png';
                      })()}
                      alt={item.product.name}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                      onError={(e) => {
                        console.log(`Wishlist image failed to load: ${e.target.src}`);
                        if (e.target.src !== '/defaultProduct.png') {
                          e.target.src = '/defaultProduct.png';
                        }
                      }}
                    />
                  </Link>
                  
                  {/* Remove Button */}
                  <button
                    onClick={() => handleRemoveFromWishlist(item.id)}
                    className="absolute top-3 right-3 p-2 bg-white/90 backdrop-blur-sm rounded-full hover:bg-white transition-colors shadow-md group-hover:opacity-100 opacity-0"
                  >
                    <svg className="w-5 h-5 text-red-500" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
                    </svg>
                  </button>
                </div>
                
                {/* Product Info */}
                <div className="p-4">
                  <Link to={`/product/${item.product.id}`}>
                    <h3 className="font-semibold text-gray-900 group-hover:text-blue-600 transition-colors line-clamp-2 mb-2">
                      {item.product.name}
                    </h3>
                  </Link>
                  
                  <div className="flex items-center justify-between mb-4">
                    <span className="text-2xl font-bold text-gray-900">
                      ${Number(item.product.price).toFixed(2)}
                    </span>
                    <div className={`px-2 py-1 rounded-full text-xs font-medium ${
                      item.product.stockQuantity > 0 
                        ? 'bg-green-100 text-green-800' 
                        : 'bg-red-100 text-red-800'
                    }`}>
                      {item.product.stockQuantity > 0 ? 'In Stock' : 'Out of Stock'}
                    </div>
                  </div>
                  
                  {/* Action Buttons */}
                  <div className="space-y-2">
                    <Link
                      to={`/product/${item.product.id}`}
                      className="block w-full text-center py-2 px-4 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors font-medium"
                    >
                      View Details
                    </Link>
                    {item.product.stockQuantity > 0 && (
                      <button
                        onClick={async () => {
                          try {
                            await api.post("/cart", {
                              productId: item.product.id,
                              quantity: 1
                            });
                            showToast({ type: "success", message: "Added to cart!" });
                            window.dispatchEvent(new Event('cartUpdated'));
                          } catch (error) {
                            showToast({ type: "error", message: "Failed to add to cart" });
                          }
                        }}
                        className="w-full py-2 px-4 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors font-medium text-gray-700"
                      >
                        Add to Cart
                      </button>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

export default WishlistPage;
