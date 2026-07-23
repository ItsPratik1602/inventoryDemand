import React, { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import Sidebar from '../components/Sidebar';
import ProductGrid from '../components/ProductGrid';
import api from '../lib/api.js';

const ProductsPage = () => {
  const [products, setProducts] = useState([]);
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(false);
  const [searchParams, setSearchParams] = useSearchParams();
  const [total, setTotal] = useState(0);
  const [currentPage, setCurrentPage] = useState(1);

  // Get filters from URL params
  const filters = {
    page: searchParams.get('page') || '1',
    limit: searchParams.get('limit') || '12',
    search: searchParams.get('search') || '',
    sortBy: searchParams.get('sortBy') || 'createdAt',
    order: searchParams.get('order') || 'desc',
    categoryFilter: searchParams.get('categoryFilter') || 'ALL',
  };

  // Fetch products
  const fetchProducts = async () => {
    setLoading(true);
    try {
      const response = await api.get(`/public/products?${new URLSearchParams(filters)}`);
      setProducts(response.data.data?.items || []);
      setTotal(response.data.data?.total || 0);
    } catch (error) {
      console.error('Error fetching products:', error);
      setProducts([]);
      setTotal(0);
    } finally {
      setLoading(false);
    }
  };

  // Fetch categories
  const fetchCategories = async () => {
    try {
      const response = await api.get('/public/categories');
      setCategories(response.data.data?.items || []);
    } catch (error) {
      console.error('Error fetching categories:', error);
      setCategories([]);
    }
  };

  useEffect(() => {
    fetchProducts();
  }, [filters.search, filters.categoryFilter, filters.sortBy, filters.order, filters.page]);

  useEffect(() => {
    fetchCategories();
  }, []);

  const handleFilterChange = (key, value) => {
    if (value === '' || value === 'ALL') {
      searchParams.delete(key);
    } else {
      searchParams.set(key, value);
    }
    setSearchParams(searchParams);
  };

  const handlePageChange = (page) => {
    handleFilterChange('page', page);
    setCurrentPage(page);
  };

  return (
    <div className="flex gap-4">
      {/* Sidebar */}
      <Sidebar 
        categories={Array.isArray(categories) ? categories : []}
        filters={filters}
        onFilterChange={handleFilterChange}
      />

      {/* Product Section */}
      <div className="flex-1">
        {/* Top Bar */}
        <div className="flex items-center justify-between mb-4">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Products</h1>
            <p className="text-gray-600">
              {total > 0 ? `${total} products found` : 'No products found'}
            </p>
          </div>
          
          {/* Sort Dropdown */}
          <div className="flex items-center gap-2">
            <label className="text-sm text-gray-600">Sort by:</label>
            <select
              value={`${filters.sortBy}-${filters.order}`}
              onChange={(e) => {
                const [sortBy, order] = e.target.value.split('-');
                handleFilterChange('sortBy', sortBy);
                handleFilterChange('order', order);
              }}
              className="px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="createdAt-desc">Newest First</option>
              <option value="createdAt-asc">Oldest First</option>
              <option value="price-asc">Price: Low to High</option>
              <option value="price-desc">Price: High to Low</option>
              <option value="name-asc">Name: A to Z</option>
              <option value="name-desc">Name: Z to A</option>
            </select>
          </div>
        </div>

        {/* Product Grid */}
        <ProductGrid 
          products={products}
          currentPage={currentPage}
          totalPages={Math.ceil(total / parseInt(filters.limit))}
          onPageChange={handlePageChange}
          total={total}
        />
      </div>
    </div>
  );
};

export default ProductsPage;
