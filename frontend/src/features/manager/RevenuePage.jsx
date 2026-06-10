import { useEffect, useState } from "react";
import { Button } from "../../components/common/Button.jsx";
import { DataTable } from "../../components/common/DataTable.jsx";
import { ManagerPageHeader } from "../../components/common/PageHeader.jsx";
import { StatusBadge } from "../../components/common/StatusBadge.jsx";
import { EmptyState, ErrorState } from "../../components/common/StateViews.jsx";
import { reportService } from "../../services/reportService.js";
import { formatCurrency, formatDate, formatStatus } from "../../utils/format.js";

export function RevenuePage() {
  const [summary, setSummary] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  async function loadRevenue() {
    setLoading(true);
    setError("");
    try {
      setSummary(await reportService.getRevenueSummary());
    } catch (loadError) {
      setError(loadError.message || "Could not load revenue summary.");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadRevenue();
  }, []);

  const columns = [
    { key: "id", header: "Order", render: (order) => order.id.slice(0, 14) },
    { key: "customer", header: "Customer", render: (order) => order.customer?.fullName || "Customer" },
    { key: "status", header: "Status", render: (order) => <StatusBadge value={order.orderStatus} /> },
    { key: "date", header: "Date", render: (order) => <span className="mono">{formatDate(order.createdAt)}</span> },
    { key: "total", header: "Total", render: (order) => <strong className="price">{formatCurrency(order.totalAmount)}</strong> },
  ];

  if (error) return <ErrorState message={error} onRetry={loadRevenue} />;

  return (
    <section className="stack-lg entry">
      <ManagerPageHeader
        title="Revenue summary"
        description="Revenue counts paid and completed orders only. Pending, placed, and cancelled orders are excluded."
        action={<Button variant="secondary" to="/manager/orders">Open orders</Button>}
      />

      {loading || !summary ? (
        <div className="stat-grid" aria-busy="true">
          <div className="skeleton" style={{ minHeight: 128 }} />
          <div className="skeleton" style={{ minHeight: 128 }} />
          <div className="skeleton" style={{ minHeight: 128 }} />
          <div className="skeleton" style={{ minHeight: 128 }} />
        </div>
      ) : (
        <>
          <div className="stat-grid">
            <article className="stat-card">
              <span className="muted">Total revenue</span>
              <strong className="stat-value">{formatCurrency(summary.totalRevenue)}</strong>
              <p className="muted">Counts paid and completed orders only.</p>
            </article>
            <article className="stat-card">
              <span className="muted">Paid revenue</span>
              <strong className="stat-value">{formatCurrency(summary.paidRevenue)}</strong>
              <p className="muted">Orders currently marked paid.</p>
            </article>
            <article className="stat-card">
              <span className="muted">Completed revenue</span>
              <strong className="stat-value">{formatCurrency(summary.completedRevenue)}</strong>
              <p className="muted">Orders fulfilled and closed.</p>
            </article>
            <article className="stat-card">
              <span className="muted">Counted orders</span>
              <strong className="stat-value">{summary.countedOrderCount}</strong>
              <p className="muted">Paid plus completed order count.</p>
            </article>
          </div>

          <section className="surface surface-padded stack">
            <h2>Excluded statuses</h2>
            <div className="cluster">
              {Object.entries(summary.excluded).map(([status, count]) => (
                <span className="badge badge-neutral" key={status}>
                  {formatStatus(status)}: {count}
                </span>
              ))}
            </div>
          </section>

          {summary.countedOrders.length ? (
            <DataTable
              caption="Orders counted toward revenue"
              columns={columns}
              rows={summary.countedOrders}
              rowKey={(order) => order.id}
            />
          ) : (
            <EmptyState
              title="No paid or completed orders yet"
              description="Record customer payments or complete orders before revenue appears."
              actionLabel="Review orders"
              actionTo="/manager/orders"
            />
          )}
        </>
      )}
    </section>
  );
}
