import React, { useState, useEffect } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';

const CategoryNavbar = () => {
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchParams, setSearchParams] = useSearchParams();
  const navigate = useNavigate();

  useEffect(() => {
    fetchCategories();
  }, []);

  const fetchCategories = async () => {
    try {
      const response = await fetch('/api/v1/public/categories');
      const result = await response.json();
      setCategories(result.data?.items || []);
    } catch (error) {
      console.error('Error fetching categories:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleCategoryClick = (categoryId) => {
    if (categoryId === 'ALL') {
      searchParams.delete('categoryFilter');
    } else {
      searchParams.set('categoryFilter', categoryId);
    }
    searchParams.delete('page'); // Reset to first page when filtering
    setSearchParams(searchParams);
    navigate(`/products?${searchParams.toString()}`);
  };

  const currentCategory = searchParams.get('categoryFilter') || 'ALL';

  if (loading) {
    return (
      <div className="flex gap-6 px-6 py-2 bg-white border-b overflow-x-auto">
        <div className="h-6 bg-gray-200 rounded w-20 animate-pulse"></div>
        <div className="h-6 bg-gray-200 rounded w-20 animate-pulse"></div>
        <div className="h-6 bg-gray-200 rounded w-20 animate-pulse"></div>
      </div>
    );
  }

  return (
    <nav className="flex gap-6 px-6 py-2 bg-white border-b overflow-x-auto">
      <button
        onClick={() => handleCategoryClick('ALL')}
        className={`px-3 py-1 rounded-full text-sm font-medium transition whitespace-nowrap ${
          currentCategory === 'ALL'
            ? 'bg-blue-600 text-white'
            : 'text-gray-600 hover:text-blue-600 hover:bg-blue-50'
        }`}
      >
        All Categories
      </button>
      
      {Array.isArray(categories) && categories.map((category) => (
        <button
          key={category.id}
          onClick={() => handleCategoryClick(category.id)}
          className={`px-3 py-1 rounded-full text-sm font-medium transition whitespace-nowrap ${
            currentCategory === category.id.toString()
              ? 'bg-blue-600 text-white'
              : 'text-gray-600 hover:text-blue-600 hover:bg-blue-50'
          }`}
        >
          {category.name}
        </button>
      ))}
    </nav>
  );
};

export default CategoryNavbar;
