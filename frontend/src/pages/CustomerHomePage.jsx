import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { ChevronRight, Star, Truck, Shield, Headphones } from 'lucide-react';
import ProductCard from "../components/ProductCard.jsx";

const CustomerHomePage = () => {
  const [featuredProducts, setFeaturedProducts] = useState([]);
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchFeaturedProducts();
    fetchCategories();
  }, []);

  const fetchFeaturedProducts = async () => {
    try {
      const response = await fetch('/api/v1/public/products?limit=8');
      const result = await response.json();
      setFeaturedProducts(result.data?.items || []);
    } catch (error) {
      console.error('Error fetching featured products:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchCategories = async () => {
    try {
      const response = await fetch('/api/v1/public/categories');
      const result = await response.json();
      setCategories(result.data?.items || []);
    } catch (error) {
      console.error('Error fetching categories:', error);
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

  return (
    <div className="space-y-8">
      {/* Hero Section */}
      <section className="bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-lg p-8">
        <div className="max-w-3xl">
          <h1 className="text-4xl font-bold mb-4">Welcome to ShopHub</h1>
          <p className="text-xl mb-6">Discover amazing products at unbeatable prices</p>
          <Link
            to="/products"
            className="inline-flex items-center gap-2 bg-white text-blue-600 px-6 py-3 rounded-lg font-semibold hover:bg-gray-100 transition"
          >
            Start Shopping
            <ChevronRight className="h-5 w-5" />
          </Link>
        </div>
      </section>

      {/* Features */}
      <section className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <div className="flex items-center gap-3 p-4 bg-white rounded-lg shadow-sm">
          <Truck className="h-8 w-8 text-blue-600" />
          <div>
            <h3 className="font-semibold">Free Shipping</h3>
            <p className="text-sm text-gray-600">On orders over $50</p>
          </div>
        </div>
        <div className="flex items-center gap-3 p-4 bg-white rounded-lg shadow-sm">
          <Shield className="h-8 w-8 text-blue-600" />
          <div>
            <h3 className="font-semibold">Secure Payment</h3>
            <p className="text-sm text-gray-600">100% secure transactions</p>
          </div>
        </div>
        <div className="flex items-center gap-3 p-4 bg-white rounded-lg shadow-sm">
          <Headphones className="h-8 w-8 text-blue-600" />
          <div>
            <h3 className="font-semibold">24/7 Support</h3>
            <p className="text-sm text-gray-600">Dedicated support</p>
          </div>
        </div>
        <div className="flex items-center gap-3 p-4 bg-white rounded-lg shadow-sm">
          <Star className="h-8 w-8 text-blue-600" />
          <div>
            <h3 className="font-semibold">Best Quality</h3>
            <p className="text-sm text-gray-600">Premium products</p>
          </div>
        </div>
      </section>

      {/* Categories */}
      <section>
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-2xl font-bold text-gray-900">Shop by Category</h2>
          <Link
            to="/products"
            className="text-blue-600 hover:text-blue-700 font-medium flex items-center gap-1"
          >
            View All
            <ChevronRight className="h-4 w-4" />
          </Link>
        </div>
        <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4">
          {Array.isArray(categories) && categories.map((category) => (
            <Link
              key={category.id}
              to={`/products?categoryFilter=${category.name}`}
              className="group"
            >
              <div className="bg-white p-4 rounded-lg shadow-sm hover:shadow-md transition text-center">
                <div className="h-16 w-16 bg-gray-200 rounded-lg mx-auto mb-3 group-hover:bg-blue-100 transition"></div>
                <h3 className="font-medium text-gray-900 group-hover:text-blue-600 transition">
                  {category.name}
                </h3>
              </div>
            </Link>
          ))}
        </div>
      </section>

      {/* Featured Products */}
      <section>
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-2xl font-bold text-gray-900">Featured Products</h2>
          <Link
            to="/products"
            className="text-blue-600 hover:text-blue-700 font-medium flex items-center gap-1"
          >
            View All
            <ChevronRight className="h-4 w-4" />
          </Link>
        </div>
        
        {loading ? (
          <div className="flex justify-center items-center h-64">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
            {Array.isArray(featuredProducts) && featuredProducts.map((product) => {
              const stockStatus = getStockStatus(product.stockQuantity, product.reorderLevel);
              return (
                <ProductCard
                  key={product.id}
                  product={product}
                  stockStatus={stockStatus}
                  stockBadgeColor={getStockBadgeColor(stockStatus)}
                  stockBadgeText={getStockBadgeText(stockStatus)}
                />
              );
            })}
          </div>
        )}
      </section>

      {/* Newsletter */}
      <section className="bg-blue-600 text-white rounded-lg p-8 text-center">
        <h2 className="text-2xl font-bold mb-4">Subscribe to Our Newsletter</h2>
        <p className="mb-6">Get the latest updates on new products and exclusive deals</p>
        <div className="flex max-w-md mx-auto">
          <input
            type="email"
            placeholder="Enter your email"
            className="flex-1 px-4 py-3 rounded-l-lg text-gray-900 focus:outline-none"
          />
          <button className="px-6 py-3 bg-gray-900 text-white rounded-r-lg hover:bg-gray-800 transition">
            Subscribe
          </button>
        </div>
      </section>
    </div>
  );
};

export default CustomerHomePage;
