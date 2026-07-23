import { Route, Routes } from "react-router-dom";
import MainLayout from "./components/layout/MainLayout";
import HomePage from "./pages/HomePage.jsx";
import LoginPage from "./pages/LoginPage.jsx";
import RegisterPage from "./pages/RegisterPage.jsx";
import ForgotPasswordPage from "./pages/ForgotPasswordPage.jsx";
import ResetPasswordPage from "./pages/ResetPasswordPage.jsx";
import DashboardPage from "./pages/DashboardPage.jsx";
import CategoriesPage from "./pages/CategoriesPage.jsx";
import ProductsPage from "./pages/ProductsPage.jsx";
import UserHomePage from "./pages/UserHomePage.jsx";
import InventoryPage from "./pages/InventoryPage.jsx";
import SalesPage from "./pages/SalesPage.jsx";
import AlertsPage from "./pages/AlertsPage.jsx";
import UsersPage from "./pages/UsersPage.jsx";
import ProfilePage from "./pages/ProfilePage.jsx";
import NotFoundPage from "./pages/NotFoundPage.jsx";
import CustomerHomePage from "./pages/CustomerHomePage.jsx";
import CustomerProductsPage from "./pages/CustomerProductsPage.jsx";
import ProductDetailsPage from "./pages/ProductDetailsPage.jsx";
import CartPage from "./pages/CartPage.jsx";
import WishlistPage from "./pages/WishlistPage.jsx";
import CustomerCheckoutPage from "./pages/CustomerCheckoutPage.jsx";
import CustomerOrderSuccessPage from "./pages/CustomerOrderSuccessPage.jsx";
import CustomerOrdersPage from "./pages/CustomerOrdersPage.jsx";
import CustomerOrderDetailsPage from "./pages/CustomerOrderDetailsPage.jsx";
import CheckoutPage from "./pages/CheckoutPage.jsx";
import OrdersPage from "./pages/OrdersPage.jsx";
import AdminOrdersPage from "./pages/AdminOrdersPage.jsx";
import OrderDetailsPage from "./pages/admin/OrderDetailsPage.jsx";
import AdminAuditPage from "./pages/AdminAuditPage.jsx";
import CouponsPage from "./pages/CouponsPage.jsx";
import CouponUsageDetailsPage from "./pages/CouponUsageDetailsPage.jsx";
import RewardsPage from "./pages/RewardsPage.jsx";
import AdminRewardsPage from "./pages/AdminRewardsPage.jsx";
import AdminAlertsPage from "./pages/AdminAlertsPage.jsx";
import AdminOnlyRoute from "./components/AdminOnlyRoute.jsx";
import AppRouteGuard from "./components/AppRouteGuard.jsx";
import AdminLayout from "./components/AdminLayout.jsx";
import CustomerLayout from "./components/CustomerLayout.jsx";
import PublicOnlyRoute from "./components/PublicOnlyRoute.jsx";

function App() {
  return (
    <Routes>
      {/* Customer Routes */}
      <Route path="/" element={<MainLayout />}>
        <Route index element={<CustomerHomePage />} />
        <Route path="products" element={<ProductsPage />} />
        <Route path="product/:id" element={<ProductDetailsPage />} />
        <Route path="cart" element={<CartPage />} />
        <Route path="wishlist" element={<WishlistPage />} />
        <Route path="checkout" element={<CustomerCheckoutPage />} />
        <Route path="order-success" element={<CustomerOrderSuccessPage />} />
        <Route path="orders" element={<CustomerOrdersPage />} />
        <Route path="orders/:id" element={<CustomerOrderDetailsPage />} />
        <Route path="rewards" element={<RewardsPage />} />
        <Route path="profile" element={<ProfilePage />} />
      </Route>

      {/* Public Routes */}
      <Route
        path="/login"
        element={
          <PublicOnlyRoute>
            <LoginPage />
          </PublicOnlyRoute>
        }
      />
      <Route
        path="/register"
        element={
          <PublicOnlyRoute>
            <RegisterPage />
          </PublicOnlyRoute>
        }
      />
      <Route
        path="/forgot-password"
        element={
          <PublicOnlyRoute>
            <ForgotPasswordPage />
          </PublicOnlyRoute>
        }
      />
      <Route
        path="/reset-password"
        element={
          <PublicOnlyRoute>
            <ResetPasswordPage />
          </PublicOnlyRoute>
        }
      />

      {/* Admin Routes */}
      <Route path="/admin" element={<AdminLayout />}>
        <Route element={<AdminOnlyRoute />}>
          <Route path="dashboard" element={<DashboardPage />} />
          <Route path="users" element={<UsersPage />} />
          <Route path="products" element={<ProductsPage />} />
          <Route path="categories" element={<CategoriesPage />} />
          <Route path="inventory" element={<InventoryPage />} />
          <Route path="sales" element={<SalesPage />} />
          <Route path="alerts" element={<AdminAlertsPage />} />
          <Route path="coupons" element={<CouponsPage />} />
          <Route path="coupons/:id/usage" element={<CouponUsageDetailsPage />} />
          <Route path="rewards" element={<AdminRewardsPage />} />
          <Route path="orders" element={<AdminOrdersPage />} />
          <Route path="orders/:id" element={<OrderDetailsPage />} />
          <Route path="audit" element={<AdminAuditPage />} />
          <Route path="profile" element={<ProfilePage />} />
        </Route>
      </Route>

      <Route path="*" element={<NotFoundPage />} />
    </Routes>
  );
}

export default App;
