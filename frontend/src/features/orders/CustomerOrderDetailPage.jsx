import { useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { Button } from "../../components/common/Button.jsx";
import { DataTable } from "../../components/common/DataTable.jsx";
import { OrderSummary } from "../../components/common/OrderSummary.jsx";
import { PageHeader } from "../../components/common/PageHeader.jsx";
import { StatusBadge } from "../../components/common/StatusBadge.jsx";
import { DetailSkeleton, ErrorState } from "../../components/common/StateViews.jsx";
import { orderService } from "../../services/orderService.js";
import { formatCurrency, formatDateTime, formatStatus } from "../../utils/format.js";

export function CustomerOrderDetailPage() {
  const { orderId } = useParams();
  const [order, setOrder] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  async function loadOrder() {
    setLoading(true);
    setError("");
    try {
      setOrder(await orderService.getMyOrder(orderId));
    } catch (loadError) {
      setError(loadError.message || "Could not load order.");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadOrder();
  }, [orderId]);

  if (loading) {
    return (
      <section className="container section">
        <DetailSkeleton />
      </section>
    );
  }

  if (!order) {
    return (
      <section className="container section">
        <ErrorState title="Order unavailable" message={error} secondaryTo="/orders" secondaryLabel="Back to orders" />
      </section>
    );
  }

  const columns = [
    { key: "productName", header: "Product" },
    { key: "quantity", header: "Quantity", render: (item) => <span className="mono">{item.quantity}</span> },
    { key: "unitPrice", header: "Unit price", render: (item) => <span className="price">{formatCurrency(item.unitPrice)}</span> },
    { key: "lineTotal", header: "Line total", render: (item) => <strong className="price">{formatCurrency(item.lineTotal)}</strong> },
  ];

  return (
    <section className="container section stack-lg entry">
      <nav className="cluster muted" aria-label="Breadcrumb">
        <Link className="btn btn-tertiary" to="/orders">
          Orders
        </Link>
        <span>/</span>
        <span>{order.id}</span>
      </nav>
      <PageHeader
        eyebrow="Order detail"
        title={order.id}
        description={`Created ${formatDateTime(order.createdAt)}`}
        action={<StatusBadge value={order.orderStatus} />}
      />
      <div className="order-detail-layout">
        <div className="stack-lg">
          <section className="surface surface-padded stack">
            <h2>Order status</h2>
            <div className="cluster">
              <StatusBadge value={order.orderStatus} />
              <p className="muted">Payment method: {formatStatus(order.paymentMethod)}</p>
            </div>
            {order.giftMessage ? (
              <p>
                Gift message: <span className="muted">{order.giftMessage}</span>
              </p>
            ) : null}
            {["pending", "placed"].includes(order.orderStatus) ? (
              <Button to={`/payment/${order.id}`}>Record payment</Button>
            ) : null}
          </section>
          <DataTable
            caption="Order item snapshots"
            columns={columns}
            rows={order.items}
            rowKey={(item) => item.id}
          />
          <section className="surface surface-padded stack">
            <h2>Payment records</h2>
            {order.payments.length ? (
              order.payments.map((payment) => (
                <p className="muted" key={payment.id}>
                  {formatStatus(payment.status)} payment for {formatCurrency(payment.amount)} using{" "}
                  {formatStatus(payment.paymentMethod)} on {formatDateTime(payment.paymentDate)}
                </p>
              ))
            ) : (
              <p className="muted">No payment has been recorded for this order.</p>
            )}
          </section>
        </div>
        <OrderSummary
          itemCount={order.items.reduce((sum, item) => sum + item.quantity, 0)}
          subtotal={order.totalAmount}
          total={order.totalAmount}
          paymentMethod={order.paymentMethod}
          note="Totals use item price snapshots from the order."
        />
      </div>
    </section>
  );
}
