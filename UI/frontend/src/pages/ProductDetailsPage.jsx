import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import api from '../lib/api.js';
import { useToast } from '../context/ToastContext.jsx';
import { useAuth } from '../context/AuthContext.jsx';
import Loader from '../components/Loader.jsx';
import { getHomeRoute } from '../utils/routeUtils.js';

function ProductDetailsPage() {
  const { id } = useParams();
  const [product, setProduct] = useState(null);
  const [loading, setLoading] = useState(true);
  const [selectedImage, setSelectedImage] = useState(0);
  const [quantity, setQuantity] = useState(1);
  const { showToast } = useToast();
  const { user } = useAuth();

  useEffect(() => {
    if (id) {
      fetchProduct();
    }
  }, [id]);

  const fetchProduct = async () => {
    try {
      const response = await api.get(`/public/products/${id}`);
      const productData = response.data.data || response.data;
      setProduct(productData);
      
      // Set first image as primary if none is marked as primary
      const images = productData.images || [];
      const primaryIndex = images.findIndex(img => img.isPrimary);
      setSelectedImage(primaryIndex >= 0 ? primaryIndex : 0);
    } catch (error) {
      console.error("Failed to fetch product:", error);
      showToast({ type: "error", message: "Failed to load product" });
    } finally {
      setLoading(false);
    }
  };

  const addToCart = async () => {
    if (!product || product.stockQuantity <= 0) return;
    
    try {
      await api.post("/cart", { productId: product.id, quantity });
      await fetchCart(); // Refresh cart data
      window.dispatchEvent(new Event('cartUpdated'));
      showToast({ type: "success", message: "Product added to cart" });
    } catch (error) {
      if (error.response?.status === 401) {
        showToast({ type: "info", message: "Please login to add products to cart" });
        window.location.href = "/login";
      } else {
        showToast({ type: "error", message: "Failed to add product to cart" });
      }
    }
  };

  const buyNow = async () => {
    if (!product || product.stockQuantity <= 0) return;
    
    try {
      await api.post("/cart", { productId: product.id, quantity });
      // Redirect to checkout (simplified for now)
      showToast({ type: "success", message: "Product added to cart" });
      window.location.href = "/checkout";
    } catch (error) {
      if (error.response?.status === 401) {
        showToast({ type: "info", message: "Please login to purchase products" });
        window.location.href = "/login";
      } else {
        showToast({ type: "error", message: "Failed to add product to cart" });
      }
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader text="Loading product..." />
      </div>
    );
  }

  if (!product) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="text-6xl text-[color:var(--muted)] mb-4">📦</div>
          <h3 className="text-xl font-semibold text-[color:var(--text)] mb-2">
            Product not found
          </h3>
          <p className="text-[color:var(--muted)]">
            The product you're looking for doesn't exist or has been removed.
          </p>
          <Link
            to="/products"
            className="inline-block mt-4 px-6 py-3 bg-[color:var(--accent)] text-white rounded-lg hover:bg-[color:var(--accent-dark)] transition-colors"
          >
            Browse Products
          </Link>
        </div>
      </div>
    );
  }

  const images = product.images || [];
  const currentImage = images[selectedImage] || images[0];

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Breadcrumb */}
      <nav className="bg-white border-b border-gray-200">
        <div className="max-w-[1400px] mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center space-x-2 text-sm">
            <Link to={getHomeRoute(user?.role)} className="text-gray-500 hover:text-blue-600 transition-colors">
              Home
            </Link>
            <span className="text-gray-400">/</span>
            <Link to="/products" className="text-gray-500 hover:text-blue-600 transition-colors">
              Products
            </Link>
            <span className="text-gray-400">/</span>
            <span className="text-gray-900 font-medium">
              {product.name}
            </span>
          </div>
        </div>
      </nav>

      <div className="max-w-[1400px] mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid lg:grid-cols-2 gap-12">
          {/* Product Images */}
          <div className="space-y-6">
            <div className="aspect-square overflow-hidden rounded-xl bg-gray-100 shadow-lg">
              <img
                src={(() => {
                const image = currentImage || images[0];
                if (image?.url) {
                  // If it's already a full URL (starts with http), use as-is
                  if (image.url.startsWith('http')) {
                    return image.url;
                  }
                  // If it's a local path, add backend URL
                  return `http://localhost:5000${image.url}`;
                }
                // Fallback to default image
                return '/defaultProduct.png';
              })()}
                alt={`${product.name} - Image ${selectedImage + 1}`}
                className="w-full h-full object-cover hover:scale-105 transition-transform duration-500"
                onError={(e) => {
                  console.log(`ProductDetails image failed to load: ${e.target.src}`);
                  if (e.target.src !== '/defaultProduct.png') {
                    e.target.src = '/defaultProduct.png';
                  }
                }}
              />
            </div>
            
            {/* Thumbnail List */}
            {images.length > 1 && (
              <div className="grid grid-cols-5 gap-3">
                {images.map((image, index) => (
                  <button
                    key={image.id}
                    onClick={() => setSelectedImage(index)}
                    className={`aspect-square overflow-hidden rounded-lg border-2 transition-all ${
                      selectedImage === index 
                        ? 'border-blue-600 shadow-lg' 
                        : 'border-gray-200 hover:border-gray-300'
                    }`}
                  >
                    <img
                      src={image.url}
                      alt={`${product.name} - Thumbnail ${index + 1}`}
                      className="w-full h-full object-cover hover:scale-110 transition-transform duration-200"
                    />
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Product Info */}
          <div className="space-y-8">
            {/* Product Name and Price */}
            <div>
              <div className="flex items-start justify-between mb-4">
                <div>
                  <h1 className="text-4xl font-bold text-gray-900 mb-2">
                    {product.name}
                  </h1>
                  <div className="flex items-center space-x-4">
                    <div className="flex text-yellow-400">
                      {[...Array(5)].map((_, i) => (
                        <svg key={i} className={`w-5 h-5 ${i < 4 ? 'fill-current' : ''}`} viewBox="0 0 20 20">
                          <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z"/>
                        </svg>
                      ))}
                    </div>
                    <span className="text-sm text-gray-500">(4.0 out of 5)</span>
                  </div>
                </div>
                <div className={`px-4 py-2 rounded-full text-sm font-semibold ${
                  product.stockQuantity > 0 
                    ? 'bg-green-100 text-green-800' 
                    : 'bg-red-100 text-red-800'
                }`}>
                  {product.stockQuantity > 0 ? 'In Stock' : 'Out of Stock'}
                </div>
              </div>
              
              <div className="flex items-baseline space-x-3 mb-4">
                <span className="text-4xl font-bold text-gray-900">
                  ${Number(product.price).toFixed(2)}
                </span>
                {product.stockQuantity <= 5 && product.stockQuantity > 0 && (
                  <span className="text-sm text-orange-600 font-medium">Only {product.stockQuantity} left!</span>
                )}
              </div>
            </div>

            {/* Category */}
            <div className="flex items-center space-x-2 text-sm">
              <span className="text-gray-500">Category:</span>
              <Link 
                to={`/products?category=${encodeURIComponent(product.category?.name || '')}`}
                className="text-blue-600 hover:text-blue-700 font-medium transition-colors"
              >
                {product.category?.name || 'Uncategorized'}
              </Link>
            </div>

            {/* Description */}
            {product.description && (
              <div className="space-y-3">
                <h3 className="text-xl font-semibold text-gray-900">
                  Description
                </h3>
                <p className="text-gray-700 leading-relaxed text-lg">
                  {product.description}
                </p>
              </div>
            )}

            {/* Features */}
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">
                Key Features
              </h3>
              <ul className="space-y-2">
                <li className="flex items-center text-gray-700">
                  <svg className="w-5 h-5 text-green-500 mr-2" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                  </svg>
                  Premium quality materials
                </li>
                <li className="flex items-center text-gray-700">
                  <svg className="w-5 h-5 text-green-500 mr-2" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                  </svg>
                  Fast and reliable shipping
                </li>
                <li className="flex items-center text-gray-700">
                  <svg className="w-5 h-5 text-green-500 mr-2" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                  </svg>
                  30-day return policy
                </li>
                <li className="flex items-center text-gray-700">
                  <svg className="w-5 h-5 text-green-500 mr-2" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                  </svg>
                  24/7 customer support
                </li>
              </ul>
            </div>

            {/* Stock Information */}
            <div className="bg-gray-50 border border-gray-200 rounded-lg p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">
                Availability
              </h3>
              <div className="space-y-3">
                <div className="flex justify-between items-center">
                  <span className="text-gray-600">Available Quantity:</span>
                  <span className={`font-semibold ${
                    product.stockQuantity > 10 ? 'text-green-600' : 
                    product.stockQuantity > 0 ? 'text-orange-600' : 'text-red-600'
                  }`}>
                    {product.stockQuantity} units
                  </span>
                </div>
                {product.stockQuantity > 0 && (
                  <div className="w-full bg-gray-200 rounded-full h-2">
                    <div 
                      className={`h-2 rounded-full ${
                        product.stockQuantity > 10 ? 'bg-green-500' : 'bg-orange-500'
                      }`}
                      style={{ width: `${Math.min((product.stockQuantity / 50) * 100, 100)}%` }}
                    ></div>
                  </div>
                )}
              </div>
            </div>

            {/* Actions */}
            <div className="space-y-6">
              <div className="flex items-center space-x-6">
                <div className="flex-1">
                  <label className="block text-sm font-semibold text-gray-900 mb-3">
                    Quantity
                  </label>
                  <div className="flex items-center">
                    <button
                      onClick={() => setQuantity(Math.max(1, quantity - 1))}
                      disabled={quantity <= 1}
                      className="w-12 h-12 rounded-l-lg border border-gray-300 flex items-center justify-center hover:bg-gray-100 disabled:opacity-50 disabled:cursor-not-allowed transition-colors font-semibold text-lg"
                    >
                      -
                    </button>
                    <input
                      type="number"
                      min="1"
                      max={product.stockQuantity}
                      value={quantity}
                      onChange={(e) => setQuantity(Math.max(1, Math.min(product.stockQuantity, parseInt(e.target.value) || 1)))}
                      className="w-20 px-4 py-3 border-t border-b border-gray-300 text-center font-semibold"
                    />
                    <button
                      onClick={() => setQuantity(Math.min(product.stockQuantity, quantity + 1))}
                      disabled={quantity >= product.stockQuantity}
                      className="w-12 h-12 rounded-r-lg border border-gray-300 flex items-center justify-center hover:bg-gray-100 disabled:opacity-50 disabled:cursor-not-allowed transition-colors font-semibold text-lg"
                    >
                      +
                    </button>
                  </div>
                </div>
                <div className="text-right">
                  <div className="text-sm text-gray-500 mb-1">Total Price:</div>
                  <div className="text-3xl font-bold text-gray-900">
                    ${(Number(product.price) * quantity).toFixed(2)}
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <button
                  onClick={addToCart}
                  disabled={product.stockQuantity <= 0}
                  className={`py-4 px-6 rounded-lg font-semibold text-lg transition-all transform hover:scale-105 ${
                    product.stockQuantity > 0
                      ? 'bg-blue-600 hover:bg-blue-700 text-white shadow-lg'
                      : 'bg-gray-300 text-gray-500 cursor-not-allowed'
                  }`}
                >
                  <svg className="w-5 h-5 inline-block mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 11-4 0 2 2 0 014 0z" />
                  </svg>
                  Add to Cart
                </button>
                <button
                  onClick={buyNow}
                  disabled={product.stockQuantity <= 0}
                  className={`py-4 px-6 rounded-lg font-semibold text-lg transition-all transform hover:scale-105 ${
                    product.stockQuantity > 0
                      ? 'bg-orange-500 hover:bg-orange-600 text-white shadow-lg'
                      : 'bg-gray-300 text-gray-500 cursor-not-allowed'
                  }`}
                >
                  <svg className="w-5 h-5 inline-block mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                  </svg>
                  Buy Now
                </button>
              </div>

              {/* Trust Badges */}
              <div className="flex items-center justify-center space-x-6 pt-4 border-t border-gray-200">
                <div className="flex items-center text-sm text-gray-500">
                  <svg className="w-5 h-5 mr-1 text-green-500" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M2.166 4.999A11.954 11.954 0 0010 1.944 11.954 11.954 0 0017.834 5c.11.65.166 1.32.166 2.001 0 5.225-3.34 9.67-8 11.317C5.34 16.67 2 12.225 2 7c0-.682.057-1.35.166-2.001zm11.541 3.708a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                  </svg>
                  Secure Payment
                </div>
                <div className="flex items-center text-sm text-gray-500">
                  <svg className="w-5 h-5 mr-1 text-green-500" fill="currentColor" viewBox="0 0 20 20">
                    <path d="M8 16.5a1.5 1.5 0 11-3 0 1.5 1.5 0 013 0zM15 16.5a1.5 1.5 0 11-3 0 1.5 1.5 0 013 0z" />
                    <path d="M3 4a1 1 0 00-1 1v10a1 1 0 001 1h1.05a2.5 2.5 0 014.9 0H10a1 1 0 001-1V5a1 1 0 00-1-1H3zM14 7a1 1 0 00-1 1v6.05A2.5 2.5 0 0115.95 16H17a1 1 0 001-1v-5a1 1 0 00-.293-.707l-2-2A1 1 0 0014 7z" />
                  </svg>
                  Fast Delivery
                </div>
                <div className="flex items-center text-sm text-gray-500">
                  <svg className="w-5 h-5 mr-1 text-green-500" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-8.293l-3-3a1 1 0 00-1.414 1.414L10.586 9.5H7a1 1 0 100 2h3.586l-1.293 1.293a1 1 0 101.414 1.414l3-3a1 1 0 000-1.414z" clipRule="evenodd" />
                  </svg>
                  Easy Returns
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default ProductDetailsPage;
