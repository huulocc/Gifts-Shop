import { Navigate, Route, Routes } from "react-router-dom";
import { AuthProvider } from "../contexts/AuthContext.jsx";
import { CartProvider } from "../contexts/CartContext.jsx";
import { ToastProvider } from "../contexts/ToastContext.jsx";
import { AppLayout } from "../components/layout/AppLayout.jsx";
import { AuthLayout } from "../components/layout/AuthLayout.jsx";
import { CustomerLayout } from "../components/layout/CustomerLayout.jsx";
import { ManagerLayout } from "../components/layout/ManagerLayout.jsx";
import { ProtectedRoute } from "../components/layout/ProtectedRoute.jsx";
import { PublicOnlyRoute } from "../components/layout/PublicOnlyRoute.jsx";
import { LoginPage } from "../features/auth/LoginPage.jsx";
import { RegisterPage } from "../features/auth/RegisterPage.jsx";
import { PasswordPage } from "../features/auth/PasswordPage.jsx";
import { HomePage } from "../features/products/HomePage.jsx";
import { ProductsPage } from "../features/products/ProductsPage.jsx";
import { ProductDetailPage } from "../features/products/ProductDetailPage.jsx";
import { CartPage } from "../features/cart/CartPage.jsx";
import { CheckoutPage } from "../features/checkout/CheckoutPage.jsx";
import { PaymentPage } from "../features/checkout/PaymentPage.jsx";
import { OrderHistoryPage } from "../features/orders/OrderHistoryPage.jsx";
import { CustomerOrderDetailPage } from "../features/orders/CustomerOrderDetailPage.jsx";
import { ManagerDashboardPage } from "../features/manager/ManagerDashboardPage.jsx";
import { CategoriesPage } from "../features/manager/CategoriesPage.jsx";
import { ProductsManagementPage } from "../features/manager/ProductsManagementPage.jsx";
import { ManagerOrdersPage } from "../features/manager/ManagerOrdersPage.jsx";
import { ManagerOrderDetailPage } from "../features/manager/ManagerOrderDetailPage.jsx";
import { RevenuePage } from "../features/manager/RevenuePage.jsx";
import { ForbiddenPage } from "../pages/ForbiddenPage.jsx";
import { NotFoundPage } from "../pages/NotFoundPage.jsx";

export function App() {
  return (
    <ToastProvider>
      <AuthProvider>
        <CartProvider>
          <Routes>
            <Route element={<AppLayout />}>
              <Route element={<CustomerLayout />}>
                <Route index element={<HomePage />} />
                <Route path="products" element={<ProductsPage />} />
                <Route path="products/:productId" element={<ProductDetailPage />} />
                <Route path="403" element={<ForbiddenPage />} />
              </Route>

              <Route element={<AuthLayout />}>
                <Route
                  path="login"
                  element={
                    <PublicOnlyRoute>
                      <LoginPage />
                    </PublicOnlyRoute>
                  }
                />
                <Route
                  path="register"
                  element={
                    <PublicOnlyRoute>
                      <RegisterPage />
                    </PublicOnlyRoute>
                  }
                />
              </Route>

              <Route
                element={
                  <ProtectedRoute allowedRoles={["customer"]}>
                    <CustomerLayout />
                  </ProtectedRoute>
                }
              >
                <Route path="cart" element={<CartPage />} />
                <Route path="checkout" element={<CheckoutPage />} />
                <Route path="payment/:orderId" element={<PaymentPage />} />
                <Route path="orders" element={<OrderHistoryPage />} />
                <Route path="orders/:orderId" element={<CustomerOrderDetailPage />} />
                <Route path="account/password" element={<PasswordPage actor="customer" />} />
              </Route>

              <Route
                path="manager"
                element={
                  <ProtectedRoute allowedRoles={["manager"]}>
                    <ManagerLayout />
                  </ProtectedRoute>
                }
              >
                <Route index element={<ManagerDashboardPage />} />
                <Route path="categories" element={<CategoriesPage />} />
                <Route path="products" element={<ProductsManagementPage />} />
                <Route path="orders" element={<ManagerOrdersPage />} />
                <Route path="orders/:orderId" element={<ManagerOrderDetailPage />} />
                <Route path="revenue" element={<RevenuePage />} />
                <Route path="account/password" element={<PasswordPage actor="manager" />} />
              </Route>

              <Route path="admin/*" element={<Navigate to="/403" replace />} />
              <Route path="*" element={<NotFoundPage />} />
            </Route>
          </Routes>
        </CartProvider>
      </AuthProvider>
    </ToastProvider>
  );
}
