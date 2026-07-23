import React, { useState, useEffect, useMemo } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { ShoppingCart, Heart, ChevronLeft, Star, Truck, Shield, RefreshCw } from 'lucide-react';
import { useAuth } from '../context/AuthContext.jsx';
import { useToast } from '../context/ToastContext.jsx';
import api from '../lib/api.js';

const ProductDetailsPage = () => {
  const { id } = useParams();
  const { user } = useAuth();
  const navigate = useNavigate();
  const { showToast } = useToast();
  const [product, setProduct] = useState(null);
  const [loading, setLoading] = useState(true);
  const [selectedImage, setSelectedImage] = useState(0);
  const [quantity, setQuantity] = useState(1);
  const [isAddingToCart, setIsAddingToCart] = useState(false);
  const [isWishlisted, setIsWishlisted] = useState(false);

  useEffect(() => {
    fetchProduct();
  }, [id]);

  const fetchProduct = async () => {
    try {
      const response = await fetch(`/api/v1/public/products`);
      const result = await response.json();
      const foundProduct = result.data?.items?.find(p => p.id === parseInt(id));
      setProduct(foundProduct || null);
    } catch (error) {
      console.error('Error fetching product:', error);
      setProduct(null);
    } finally {
      setLoading(false);
    }
  };

  const getStockStatus = (stockQuantity, reorderLevel = 10) => {
    const stock = Number(stockQuantity) || 0;
    const threshold = Number(reorderLevel) || 10;

    if (stock === 0) return 'OUT_OF_STOCK';
    if (stock > 0 && stock <= 2) return 'CRITICAL';
    if (stock > 2 && stock <= threshold) return 'LOW_STOCK';
    return 'NORMAL';
  };

  const getStockBadgeColor = (status) => {
    switch (status) {
      case 'OUT_OF_STOCK':
        return 'bg-red-100 text-red-800';
      case 'CRITICAL':
        return 'bg-orange-100 text-orange-800';
      case 'LOW_STOCK':
        return 'bg-yellow-100 text-yellow-800';
      case 'NORMAL':
        return 'bg-green-100 text-green-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const getStockBadgeText = (status) => {
    switch (status) {
      case 'OUT_OF_STOCK':
        return 'Out of Stock';
      case 'CRITICAL':
        return 'Critical Stock';
      case 'LOW_STOCK':
        return 'Low Stock';
      case 'NORMAL':
        return 'In Stock';
      default:
        return 'Unknown';
    }
  };

  const mainImageUrl = useMemo(() => {
    if (!product || !product.images || product.images.length === 0) return '/placeholder.png';
    
    const image = product.images[selectedImage] || product.images[0];
    if (!image || !image.url) return '/placeholder.png';
    
    console.log("MAIN IMAGE URL:", image.url.startsWith('http') ? image.url : `http://localhost:5000${image.url}`);
    
    return image.url.startsWith('http') ? image.url : `http://localhost:5000${image.url}`;
  }, [product, selectedImage]);

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
        quantity: quantity
      });

      showToast({ type: "success", message: "Added to cart successfully!" });
      // Trigger cart update event
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

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (!product) {
    return (
      <div className="text-center py-12">
        <h2 className="text-2xl font-bold text-gray-900 mb-4">Product Not Found</h2>
        <p className="text-gray-600 mb-6">The product you're looking for doesn't exist.</p>
        <Link
          to="/products"
          className="inline-flex items-center gap-2 bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700 transition"
        >
          <ChevronLeft className="h-5 w-5" />
          Back to Products
        </Link>
      </div>
    );
  }

  const stockStatus = getStockStatus(product.stockQuantity, product.reorderLevel);
  const stockBadgeColor = getStockBadgeColor(stockStatus);
  const stockBadgeText = getStockBadgeText(stockStatus);

  return (
    <div className="max-w-6xl mx-auto">
      {/* Breadcrumb */}
      <nav className="flex items-center gap-2 text-sm text-gray-600 mb-6">
        <Link to="/" className="hover:text-blue-600">Home</Link>
        <span>/</span>
        <Link to="/products" className="hover:text-blue-600">Products</Link>
        <span>/</span>
        <span className="text-gray-900">{product.name}</span>
      </nav>

      <div className="flex flex-col lg:flex-row gap-8">
        {/* Left: Images */}
        <div className="lg:w-1/2">
          <div className="bg-white p-4 rounded-lg shadow-sm">
            {/* Main Image */}
            <div className="mb-4">
              <img
                src={mainImageUrl}
                alt={product.name}
                className="w-full h-96 object-cover rounded-lg"
                onError={(e) => {
                  e.target.onerror = null;
                  e.target.src = '/placeholder.png';
                }}
              />
            </div>

            {/* Thumbnail Gallery */}
            {product.images && product.images.length > 1 && (
              <div className="flex gap-2">
                {product.images.map((image, index) => {
                  const thumbnailUrl = (!image || !image.url) 
                    ? '/placeholder.png'
                    : (image.url.startsWith('http') 
                      ? image.url 
                      : `http://localhost:5000/${image.url.replace(/^\/+/, "")}`);
                  
                  console.log(`THUMBNAIL ${index} URL:`, thumbnailUrl);
                  
                  return (
                    <button
                      key={index}
                      onClick={() => setSelectedImage(index)}
                      className={`w-20 h-20 rounded-lg border-2 overflow-hidden transition ${
                        selectedImage === index ? 'border-blue-600' : 'border-gray-200'
                      }`}
                    >
                      <img
                        src={thumbnailUrl}
                        alt={`${product.name} ${index + 1}`}
                        className="w-full h-full object-cover"
                        onError={(e) => {
                          e.target.onerror = null;
                          e.target.src = '/placeholder.png';
                        }}
                      />
                    </button>
                  );
                })}
              </div>
            )}
          </div>
        </div>

        {/* Right: Product Info */}
        <div className="lg:w-1/2">
          <div className="bg-white p-6 rounded-lg shadow-sm">
            {/* Product Name */}
            <h1 className="text-3xl font-bold text-gray-900 mb-4">{product.name}</h1>

            {/* Price */}
            <div className="text-3xl font-bold text-blue-600 mb-4">
              ${Number(product.price).toFixed(2)}
            </div>

            {/* Stock Status */}
            <div className={`inline-block px-3 py-1 text-sm font-medium rounded-full mb-4 ${stockBadgeColor}`}>
              {stockBadgeText}
            </div>

            {/* Description */}
            <div className="mb-6">
              <h3 className="text-lg font-semibold mb-2">Description</h3>
              <p className="text-gray-600">
                {product.description || 'No description available for this product.'}
              </p>
            </div>

            {/* Quantity Selector */}
            <div className="mb-6">
              <h3 className="text-lg font-semibold mb-2">Quantity</h3>
              <div className="flex items-center gap-4">
                <button
                  onClick={() => setQuantity(Math.max(1, quantity - 1))}
                  className="w-10 h-10 rounded-lg border border-gray-300 flex items-center justify-center hover:bg-gray-50 transition"
                >
                  -
                </button>
                <span className="w-16 text-center font-medium">{quantity}</span>
                <button
                  onClick={() => setQuantity(quantity + 1)}
                  className="w-10 h-10 rounded-lg border border-gray-300 flex items-center justify-center hover:bg-gray-50 transition"
                >
                  +
                </button>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="flex gap-4 mb-6">
              <button
                onClick={handleAddToCart}
                disabled={stockStatus === 'OUT_OF_STOCK' || isAddingToCart}
                className={`flex-1 flex items-center justify-center gap-2 px-6 py-3 rounded-lg font-medium transition ${
                  stockStatus === 'OUT_OF_STOCK'
                    ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
                    : 'bg-blue-600 text-white hover:bg-blue-700'
                }`}
              >
                <ShoppingCart className="h-5 w-5" />
                {isAddingToCart ? 'Adding...' : stockStatus === 'OUT_OF_STOCK' ? 'Out of Stock' : 'Add to Cart'}
              </button>

              <button
                onClick={handleToggleWishlist}
                className="p-3 rounded-lg border border-gray-300 hover:bg-gray-50 transition"
              >
                <Heart
                  className={`h-5 w-5 ${isWishlisted ? 'fill-red-500 text-red-500' : 'text-gray-400'}`}
                />
              </button>
            </div>

            {/* Features */}
            <div className="grid grid-cols-3 gap-4 pt-6 border-t">
              <div className="text-center">
                <Truck className="h-8 w-8 text-blue-600 mx-auto mb-2" />
                <p className="text-sm text-gray-600">Free Shipping</p>
              </div>
              <div className="text-center">
                <Shield className="h-8 w-8 text-blue-600 mx-auto mb-2" />
                <p className="text-sm text-gray-600">Secure Payment</p>
              </div>
              <div className="text-center">
                <RefreshCw className="h-8 w-8 text-blue-600 mx-auto mb-2" />
                <p className="text-sm text-gray-600">Easy Returns</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ProductDetailsPage;
