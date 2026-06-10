import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { Button } from "../../components/common/Button.jsx";
import { DataTable } from "../../components/common/DataTable.jsx";
import { PageHeader } from "../../components/common/PageHeader.jsx";
import { StatusBadge } from "../../components/common/StatusBadge.jsx";
import { EmptyState, ErrorState } from "../../components/common/StateViews.jsx";
import { orderService } from "../../services/orderService.js";
import { orderStatuses } from "../../utils/constants.js";
import { formatCurrency, formatDate, formatStatus } from "../../utils/format.js";

export function OrderHistoryPage() {
  const [orders, setOrders] = useState([]);
  const [status, setStatus] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  async function loadOrders() {
    setLoading(true);
    setError("");
    try {
      setOrders(await orderService.listMyOrders(status ? { status } : {}));
    } catch (loadError) {
      setError(loadError.message || "Could not load orders.");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadOrders();
  }, [status]);

  const columns = [
    {
      key: "id",
      header: "Order",
      render: (order) => <Link className="btn btn-tertiary" to={`/orders/${order.id}`}>{order.id.slice(0, 14)}</Link>,
    },
    {
      key: "createdAt",
      header: "Date",
      render: (order) => <span className="mono">{formatDate(order.createdAt)}</span>,
    },
    {
      key: "orderStatus",
      header: "Status",
      render: (order) => <StatusBadge value={order.orderStatus} />,
    },
    {
      key: "paymentMethod",
      header: "Payment",
      render: (order) => formatStatus(order.paymentMethod),
    },
    {
      key: "totalAmount",
      header: "Total",
      render: (order) => <strong className="price">{formatCurrency(order.totalAmount)}</strong>,
    },
    {
      key: "actions",
      header: "Actions",
      render: (order) => (
        <div className="row-actions">
          <Button variant="secondary" size="small" to={`/orders/${order.id}`}>
            View
          </Button>
          {["pending", "placed"].includes(order.orderStatus) ? (
            <Button size="small" to={`/payment/${order.id}`}>
              Pay
            </Button>
          ) : null}
        </div>
      ),
    },
  ];

  return (
    <section className="container section stack-lg entry">
      <PageHeader
        eyebrow="Orders"
        title="Your order history"
        description="Review order status, payment method, item snapshots, and totals."
      />
      <div className="toolbar">
        <label className="field">
          <span>Status filter</span>
          <select className="select" value={status} onChange={(event) => setStatus(event.target.value)}>
            <option value="">All statuses</option>
            {orderStatuses.map((item) => (
              <option key={item} value={item}>
                {formatStatus(item)}
              </option>
            ))}
          </select>
        </label>
        {status ? (
          <Button variant="secondary" size="small" onClick={() => setStatus("")}>
            Clear filter
          </Button>
        ) : null}
      </div>
      {error ? (
        <ErrorState message={error} onRetry={loadOrders} />
      ) : (
        <DataTable
          caption="Customer order history"
          columns={columns}
          rows={orders}
          rowKey={(order) => order.id}
          loading={loading}
          emptyState={
            <EmptyState
              title={status ? "No orders match this status" : "No orders yet"}
              description={
                status
                  ? "Clear the filter to see the rest of your order history."
                  : "Place an order from your cart to see it here."
              }
              actionLabel={status ? "Clear filter" : "Browse products"}
              actionTo={status ? undefined : "/products"}
              onAction={status ? () => setStatus("") : undefined}
            />
          }
        />
      )}
    </section>
  );
}
