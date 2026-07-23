import { useState, useEffect } from "react";
import { Link, useSearchParams } from "react-router-dom";
import api from "../lib/api.js";
import { useToast } from "../context/ToastContext.jsx";
import Loader from "../components/Loader.jsx";
import ProductCard from "../components/ProductCard.jsx";

function CustomerProductsPage() {
  const [products, setProducts] = useState([]);
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [searchParams] = useSearchParams();
  const { showToast } = useToast();

  const search = searchParams.get('search') || '';
  const category = searchParams.get('category') || '';

  useEffect(() => {
    fetchProducts();
    fetchCategories();
  }, [page, search, category]);

  const fetchProducts = async () => {
    setLoading(true);
    try {
      const params = {
        page,
        limit: 15,
        sortBy: "createdAt",
        order: "desc"
      };
      
      if (search) {
        params.search = search;
      }
      
      if (category) {
        params.categoryFilter = category;
      }

      const response = await api.get("/public/products", { params });
      const productsData = response.data.data?.items || [];
      setProducts(Array.isArray(productsData) ? productsData : []);
      setTotal(response.data.data?.total || 0);
    } catch (error) {
      console.error("Failed to fetch products:", error);
      showToast({ type: "error", message: "Failed to load products" });
    } finally {
      setLoading(false);
    }
  };

  const fetchCategories = async () => {
    try {
      const response = await api.get("/public/categories");
      const categoriesData = response.data.data?.items || [];
      setCategories(Array.isArray(categoriesData) ? categoriesData : []);
    } catch (error) {
      console.error("Failed to fetch categories:", error);
    }
  };

  const addToCart = async (productId) => {
    try {
      await api.post("/cart", { productId, quantity: 1 });
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

  const handlePageChange = (newPage) => {
    setPage(newPage);
    window.scrollTo(0, 0);
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader text="Loading products..." />
      </div>
    );
  }

  return (
    <div className="app-page">
      {/* Page Header */}
      <div className="bg-white border-b border-[color:var(--line)]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
            <h1 className="text-2xl font-bold text-[color:var(--text)]">
              {search ? `Search Results: "${search}"` : category ? `Category: ${category}` : 'All Products'}
            </h1>
            <p className="text-[color:var(--muted)]">
              {total} products found
            </p>
          </div>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-gray-50 border-b border-[color:var(--line)]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex flex-wrap gap-4">
            <Link
              to="/products"
              className={`px-4 py-2 rounded-lg transition-colors ${
                !search && !category 
                  ? 'bg-[color:var(--accent)] text-white' 
                  : 'bg-white text-[color:var(--text)] hover:bg-[color:var(--accent-soft)]'
              }`}
            >
              All
            </Link>
            {categories.map((cat) => (
              <Link
                key={cat.id}
                to={`/products?category=${encodeURIComponent(cat.name)}`}
                className={`px-4 py-2 rounded-lg transition-colors ${
                  category === cat.name 
                    ? 'bg-[color:var(--accent)] text-white' 
                    : 'bg-white text-[color:var(--text)] hover:bg-[color:var(--accent-soft)]'
                }`}
              >
                {cat.name}
              </Link>
            ))}
          </div>
        </div>
      </div>

      {/* Products Grid */}
      <div className="py-8">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          {products.length === 0 ? (
            <div className="text-center py-16">
              <div className="text-6xl text-[color:var(--muted)] mb-4">📦</div>
              <h3 className="text-xl font-semibold text-[color:var(--text)] mb-2">
                No products found
              </h3>
              <p className="text-[color:var(--muted)]">
                Try adjusting your search or browse our categories
              </p>
              <Link
                to="/products"
                className="inline-block mt-4 px-6 py-3 bg-[color:var(--accent)] text-white rounded-lg hover:bg-[color:var(--accent-dark)] transition-colors"
              >
                Browse All Products
              </Link>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
              {products.map((product) => (
                <ProductCard key={product.id} product={product} addToCart={addToCart} />
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Pagination */}
      {total > 15 && (
        <div className="py-8 bg-white border-t border-[color:var(--line)]">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex justify-center items-center gap-4">
              <button
                onClick={() => handlePageChange(page - 1)}
                disabled={page <= 1}
                className="px-4 py-2 bg-white border border-[color:var(--line)] rounded-lg hover:bg-[color:var(--accent-soft)] disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                Previous
              </button>
              <span className="text-[color:var(--text)]">
                Page {page} of {Math.ceil(total / 15)}
              </span>
              <button
                onClick={() => handlePageChange(page + 1)}
                disabled={page >= Math.ceil(total / 15)}
                className="px-4 py-2 bg-white border border-[color:var(--line)] rounded-lg hover:bg-[color:var(--accent-soft)] disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                Next
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default CustomerProductsPage;
