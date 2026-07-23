import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import PageHeader from "../components/PageHeader.jsx";
import { useAuth } from "../context/AuthContext.jsx";
import api from "../lib/api.js";
import ProductCard from "../components/ProductCard.jsx";

function UserHomePage() {
  const { user } = useAuth();
  const [featuredProducts, setFeaturedProducts] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchFeaturedProducts = async () => {
      try {
        const response = await api.get("/products", {
          params: {
            page: 1,
            limit: 4,
            sortBy: "createdAt-desc"
          }
        });
        setFeaturedProducts(response.data.data?.items || []);
      } catch (error) {
        console.error("Failed to fetch featured products:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchFeaturedProducts();
  }, []);

  return (
    <div className="app-page">
      {/* Primary Action Section */}
      <div className="text-center py-12">
        <Link
          to="/products"
          className="inline-flex items-center gap-3 px-8 py-4 bg-[color:var(--accent)] text-white font-semibold text-lg rounded-2xl hover:opacity-90 transition-opacity shadow-lg hover:shadow-xl"
        >
          <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
          </svg>
          Browse All Products
        </Link>
        <p className="mt-4 text-sm text-[color:var(--muted)]">
          View our complete catalog with real-time stock information
        </p>
      </div>

      <div className="grid gap-8 lg:grid-cols-[1.2fr_0.8fr]">
        {/* Featured Products Section */}
        <section className="app-card p-6">
          <h3 className="app-section-title">Recent Products</h3>
          <div className="mt-6">
            {loading ? (
              <div className="flex justify-center py-8">
                <div className="inline-block animate-spin rounded-full h-6 w-6 border-b-2 border-[color:var(--accent)]"></div>
              </div>
            ) : featuredProducts.length > 0 ? (
              <div className="grid gap-4 sm:grid-cols-2 items-stretch">
                {featuredProducts.map((product) => (
                  <div key={product.id} className="flex">
                    <ProductCard product={product} />
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-8">
                <p className="text-sm text-[color:var(--muted)]">No products available</p>
              </div>
            )}
          </div>
          {featuredProducts.length > 0 && (
            <div className="mt-6 text-center">
              <Link
                to="/products"
                className="inline-flex items-center gap-2 text-sm font-medium text-[color:var(--accent)] hover:opacity-80 transition-opacity"
              >
                View all products
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                </svg>
              </Link>
            </div>
          )}
        </section>

        {/* Quick Actions & Account Info */}
        <div className="space-y-6">
          {/* Quick Actions */}
          <section className="app-card p-6">
            <h3 className="app-section-title">Quick Actions</h3>
            <div className="mt-4 space-y-3">
              <Link
                to="/profile"
                className="flex items-center gap-3 p-3 rounded-xl border border-[color:var(--line)] bg-white/50 hover:bg-[color:var(--accent-soft)] transition-colors"
              >
                <div className="flex items-center justify-center w-8 h-8 rounded-lg bg-[color:var(--accent)] text-white">
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                  </svg>
                </div>
                <div>
                  <h4 className="font-medium text-[color:var(--text)]">My Profile</h4>
                  <p className="text-xs text-[color:var(--muted)]">Update account information</p>
                </div>
              </Link>
            </div>
          </section>

          {/* Account Info */}
          <section className="app-card p-6">
            <h3 className="app-section-title">Account</h3>
            <div className="mt-4 space-y-3">
              <div>
                <p className="text-xs text-[color:var(--muted)]">Name</p>
                <p className="font-medium text-[color:var(--text)]">{user?.name}</p>
              </div>
              <div>
                <p className="text-xs text-[color:var(--muted)]">Email</p>
                <p className="font-medium text-[color:var(--text)]">{user?.email}</p>
              </div>
            </div>
          </section>
        </div>
      </div>
    </div>
  );
}

export default UserHomePage;
