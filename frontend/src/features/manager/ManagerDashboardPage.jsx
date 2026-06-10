import { useEffect, useState } from "react";
import { Button } from "../../components/common/Button.jsx";
import { DataTable } from "../../components/common/DataTable.jsx";
import { ManagerPageHeader } from "../../components/common/PageHeader.jsx";
import { StatusBadge } from "../../components/common/StatusBadge.jsx";
import { ErrorState, TableSkeleton } from "../../components/common/StateViews.jsx";
import { orderService } from "../../services/orderService.js";
import { productService } from "../../services/productService.js";
import { reportService } from "../../services/reportService.js";
import { formatCurrency, formatDate, getStockState } from "../../utils/format.js";

export function ManagerDashboardPage() {
  const [summary, setSummary] = useState(null);
  const [orders, setOrders] = useState([]);
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  async function loadDashboard() {
    setLoading(true);
    setError("");
    try {
      const [nextSummary, nextOrders, nextProducts] = await Promise.all([
        reportService.getRevenueSummary(),
        orderService.listAllOrders(),
        productService.listProducts({ includeInactive: true }),
      ]);
      setSummary(nextSummary);
      setOrders(nextOrders.slice(0, 5));
      setProducts(nextProducts);
    } catch (loadError) {
      setError(loadError.message || "Could not load dashboard.");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadDashboard();
  }, []);

  const lowStock = products.filter((product) => product.isActive && product.quantity <= 5).slice(0, 5);
  const activeCount = products.filter((product) => product.isActive).length;
  const inactiveCount = products.filter((product) => !product.isActive).length;

  const orderColumns = [
    { key: "id", header: "Order", render: (order) => order.id.slice(0, 14) },
    { key: "customer", header: "Customer", render: (order) => order.customer?.fullName || "Customer" },
    { key: "status", header: "Status", render: (order) => <StatusBadge value={order.orderStatus} /> },
    { key: "total", header: "Total", render: (order) => <span className="price">{formatCurrency(order.totalAmount)}</span> },
    { key: "date", header: "Date", render: (order) => <span className="mono">{formatDate(order.createdAt)}</span> },
  ];

  if (error) {
    return <ErrorState message={error} onRetry={loadDashboard} />;
  }

  return (
    <section className="stack-lg entry">
      <ManagerPageHeader
        title="Manager dashboard"
        description="Review revenue, catalog health, low stock, and recent orders."
        action={<Button to="/manager/products">Manage products</Button>}
      />

      {loading ? (
        <div className="stat-grid" aria-busy="true">
          <div className="skeleton" style={{ minHeight: 128 }} />
          <div className="skeleton" style={{ minHeight: 128 }} />
          <div className="skeleton" style={{ minHeight: 128 }} />
          <div className="skeleton" style={{ minHeight: 128 }} />
        </div>
      ) : (
        <div className="stat-grid">
          <article className="stat-card">
            <span className="muted">Revenue</span>
            <strong className="stat-value">{formatCurrency(summary.totalRevenue)}</strong>
            <p className="muted">Paid and completed orders only.</p>
          </article>
          <article className="stat-card">
            <span className="muted">Counted orders</span>
            <strong className="stat-value">{summary.countedOrderCount}</strong>
            <p className="muted">Excluded placed, pending, and cancelled orders.</p>
          </article>
          <article className="stat-card">
            <span className="muted">Active products</span>
            <strong className="stat-value">{activeCount}</strong>
            <p className="muted">{inactiveCount} inactive records remain manageable.</p>
          </article>
          <article className="stat-card">
            <span className="muted">Low stock</span>
            <strong className="stat-value">{lowStock.length}</strong>
            <p className="muted">Active products at 5 units or fewer.</p>
          </article>
        </div>
      )}

      <div className="form-grid-2">
        <section className="surface surface-padded stack">
          <div className="between">
            <h2>Low stock</h2>
            <Button variant="secondary" size="small" to="/manager/products">
              Open stock
            </Button>
          </div>
          {loading ? (
            <TableSkeleton />
          ) : lowStock.length ? (
            lowStock.map((product) => (
              <div className="between" key={product.id}>
                <div>
                  <strong>{product.name}</strong>
                  <p className="muted">{product.category?.name}</p>
                </div>
                <StatusBadge type="stock" value={getStockState(product.quantity)} label={`${product.quantity} left`} />
              </div>
            ))
          ) : (
            <p className="muted">No active product is currently low on stock.</p>
          )}
        </section>

        <section className="surface surface-padded stack">
          <div className="between">
            <h2>Quick actions</h2>
          </div>
          <Button variant="secondary" to="/manager/categories">
            Maintain categories
          </Button>
          <Button variant="secondary" to="/manager/products">
            Create product or update stock
          </Button>
          <Button variant="secondary" to="/manager/orders">
            Review orders
          </Button>
          <Button variant="secondary" to="/manager/revenue">
            View revenue rule
          </Button>
        </section>
      </div>

      <section className="stack">
        <div className="between">
          <h2>Recent orders</h2>
          <Button variant="secondary" size="small" to="/manager/orders">
            View all
          </Button>
        </div>
        <DataTable
          caption="Recent manager orders"
          columns={orderColumns}
          rows={orders}
          rowKey={(order) => order.id}
          loading={loading}
        />
      </section>
    </section>
  );
}
