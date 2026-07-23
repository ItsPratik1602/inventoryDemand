import React, { useState, useMemo } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { ShoppingCart, Heart } from 'lucide-react';
import { useAuth } from '../context/AuthContext.jsx';
import { useToast } from '../context/ToastContext.jsx';
import api from '../lib/api.js';

const ProductCard = ({ product, stockStatus, stockBadgeColor, stockBadgeText }) => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const { showToast } = useToast();
  const [isAddingToCart, setIsAddingToCart] = useState(false);
  const [isWishlisted, setIsWishlisted] = useState(false);

  const getStockStatus = () => {
    const stock = product.stockQuantity || product.stock || product.inventory?.quantity || 0;
    const lowStockThreshold = 5;
    
    if (stock === 0) {
      return { status: 'Out of Stock', color: 'red', bgColor: 'bg-red-100', textColor: 'text-red-600' };
    } else if (stock <= lowStockThreshold) {
      return { status: 'Low Stock', color: 'amber', bgColor: 'bg-amber-50', textColor: 'text-amber-700' };
    } else {
      return { status: 'In Stock', color: 'green', bgColor: 'bg-green-50', textColor: 'text-green-700' };
    }
  };

  const handleAddToCart = async () => {
    const stock = product.stockQuantity || product.stock || product.inventory?.quantity || 0;
    if (stock <= 0) return;
    
    if (!user) {
      navigate('/login');
      return;
    }
    
    setIsAddingToCart(true);
    try {
      await api.post("/cart", {
        productId: product.id,
        quantity: 1
      });

      showToast({ type: "success", message: "Added to cart successfully!" });
      // Trigger cart count update event
      window.dispatchEvent(new Event('cartUpdated'));
    } catch (error) {
      showToast({ type: "error", message: "Failed to add to cart" });
    } finally {
      setIsAddingToCart(false);
    }
  };

  const handleToggleWishlist = async () => {
    if (!user) {
      navigate('/login');
      return;
    }

    try {
      if (isWishlisted) {
        await api.delete(`/wishlist/${product.id}`);
        showToast({ type: "success", message: "Removed from wishlist" });
        setIsWishlisted(false);
      } else {
        await api.post("/wishlist", {
          productId: product.id
        });
        showToast({ type: "success", message: "Added to wishlist" });
        setIsWishlisted(true);
      }
      // Trigger wishlist count update event
      window.dispatchEvent(new Event('wishlistUpdated'));
    } catch (error) {
      showToast({ type: "error", message: "Failed to update wishlist" });
    }
  };

  const imageUrl = useMemo(() => {
    if (!product) return "/placeholder.png";

    let img = product.images;

    // Handle array
    if (Array.isArray(img)) {
      img = img[0];
    }

    // Handle object with url property
    if (img && typeof img === 'object' && img.url) {
      img = img.url;
    }

    // Handle empty / null
    if (!img || img === "") {
      return "/placeholder.png";
    }

    // If already full URL
    if (img.startsWith("http")) {
      return img;
    }

    // Ensure no double slash
    return `http://localhost:5000/${img.replace(/^\/+/, "")}`;
  }, [product]);

  // Debug log
  console.log("IMAGE URL:", imageUrl);

  return (
    <div className="bg-white p-3 rounded-lg shadow-sm hover:shadow-md transition cursor-pointer">
      <Link to={`/product/${product.id}`}>
        {/* Product Image */}
        <div className="relative mb-3">
          <img
            src={imageUrl}
            alt={product.name}
            className="h-40 w-full object-cover rounded"
            onError={(e) => {
              e.target.onerror = null;
              e.target.src = "/placeholder.png";
            }}
          />
          
          {/* Wishlist Button */}
          <button
            onClick={(e) => {
              e.preventDefault();
              handleToggleWishlist();
            }}
            className="absolute top-2 right-2 p-2 bg-white rounded-full shadow-md hover:shadow-lg transition"
          >
            <Heart
              className={`h-4 w-4 ${isWishlisted ? 'fill-red-500 text-red-500' : 'text-gray-400'}`}
            />
          </button>
        </div>
      </Link>

      {/* Product Info */}
      <div className="space-y-2">
        {/* Product Name */}
        <Link to={`/product/${product.id}`}>
          <h3 className="text-sm font-medium text-gray-900 line-clamp-2 hover:text-blue-600 transition">
            {product.name}
          </h3>
        </Link>

        {/* Price */}
        <div className="text-lg font-bold text-gray-900">
          ${Number(product.price).toFixed(2)}
        </div>

        {/* Stock Status Badge */}
        <div className={`inline-block px-2 py-1 text-xs font-medium rounded-full ${stockBadgeColor}`}>
          {stockBadgeText}
        </div>

        {/* Action Buttons */}
        <div className="flex gap-2 mt-3">
          <button
            onClick={handleAddToCart}
            disabled={stockStatus === 'OUT_OF_STOCK' || isAddingToCart}
            className={`flex-1 flex items-center justify-center gap-2 px-3 py-2 rounded-lg text-sm font-medium transition ${
              stockStatus === 'OUT_OF_STOCK'
                ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
                : 'bg-blue-600 text-white hover:bg-blue-700'
            }`}
          >
            <ShoppingCart className="h-4 w-4" />
            {isAddingToCart ? 'Adding...' : stockStatus === 'OUT_OF_STOCK' ? 'Out of Stock' : 'Add to Cart'}
          </button>
        </div>
      </div>
    </div>
  );
};

export default ProductCard;
