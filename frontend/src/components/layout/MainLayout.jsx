import React from 'react';
import { Outlet } from 'react-router-dom';
import Header from './Header';
import CategoryNavbar from './CategoryNavbar';
import Footer from './Footer';

const MainLayout = () => {
  return (
    <div className="min-h-screen flex flex-col bg-gray-100">
      <Header />
      <CategoryNavbar />
      <main className="flex-1 container mx-auto px-4 py-4">
        <Outlet />
      </main>
      <Footer />
    </div>
  );
};

export default MainLayout;
