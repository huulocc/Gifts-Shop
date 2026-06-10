import { useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { Button } from "../../components/common/Button.jsx";
import { ConfirmDialog } from "../../components/common/ConfirmDialog.jsx";
import { DataTable } from "../../components/common/DataTable.jsx";
import { ManagerPageHeader } from "../../components/common/PageHeader.jsx";
import { StatusBadge } from "../../components/common/StatusBadge.jsx";
import { DetailSkeleton, ErrorState } from "../../components/common/StateViews.jsx";
import { useToast } from "../../contexts/ToastContext.jsx";
import { orderService } from "../../services/orderService.js";
import { orderStatuses } from "../../utils/constants.js";
import { formatCurrency, formatDateTime, formatStatus } from "../../utils/format.js";
import { validateOrderStatus } from "../../utils/validation.js";

export function ManagerOrderDetailPage() {
  const { orderId } = useParams();
  const [order, setOrder] = useState(null);
  const [statusDraft, setStatusDraft] = useState("");
  const [statusError, setStatusError] = useState("");
  const [loading, setLoading] = useState(true);
  const [updating, setUpdating] = useState(false);
  const [error, setError] = useState("");
  const [confirmOpen, setConfirmOpen] = useState(false);
  const { addToast } = useToast();

  async function loadOrder() {
    setLoading(true);
    setError("");
    try {
      const nextOrder = await orderService.getManagerOrder(orderId);
      setOrder(nextOrder);
      setStatusDraft(nextOrder.orderStatus);
    } catch (loadError) {
      setError(loadError.message || "Could not load order.");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadOrder();
  }, [orderId]);

  async function updateStatus() {
    if (!order) return;
    const message = validateOrderStatus(statusDraft);
    setStatusError(message);
    if (message) return;
    setUpdating(true);
    try {
      const nextOrder = await orderService.updateStatus(order.id, statusDraft);
      setOrder(nextOrder);
      addToast({ title: "Order status updated." });
      setConfirmOpen(false);
    } catch (updateError) {
      setStatusError(updateError.message || "Could not update order status.");
    } finally {
      setUpdating(false);
    }
  }

  function requestUpdate() {
    if (!order || statusDraft === order.orderStatus) return;
    if (["cancelled", "completed"].includes(statusDraft)) {
      setConfirmOpen(true);
    } else {
      updateStatus();
    }
  }

  if (loading) {
    return <DetailSkeleton />;
  }

  if (!order) {
    return <ErrorState title="Order unavailable" message={error} secondaryTo="/manager/orders" secondaryLabel="Back to orders" />;
  }

  const columns = [
    { key: "productName", header: "Product" },
    { key: "quantity", header: "Quantity", render: (item) => <span className="mono">{item.quantity}</span> },
    { key: "unitPrice", header: "Unit price", render: (item) => <span className="price">{formatCurrency(item.unitPrice)}</span> },
    { key: "lineTotal", header: "Line total", render: (item) => <strong className="price">{formatCurrency(item.lineTotal)}</strong> },
  ];

  return (
    <section className="stack-lg entry">
      <nav className="cluster muted" aria-label="Breadcrumb">
        <Link className="btn btn-tertiary" to="/manager/orders">
          Orders
        </Link>
        <span>/</span>
        <span>{order.id}</span>
      </nav>
      <ManagerPageHeader
        title={order.id}
        description={`Created ${formatDateTime(order.createdAt)}. Managers may inspect order and payment information.`}
        action={<StatusBadge value={order.orderStatus} />}
      />

      <div className="order-detail-layout">
        <div className="stack-lg">
          <section className="surface surface-padded stack">
            <h2>Customer</h2>
            <p>
              <strong>{order.customer?.fullName || "Customer"}</strong>
            </p>
            <p className="muted">{order.customer?.email}</p>
            <p className="muted">{order.customer?.phoneNumber || "No phone number"}</p>
          </section>

          <section className="surface surface-padded stack">
            <h2>Status control</h2>
            <div className="cluster">
              <select
                className="select"
                value={statusDraft}
                onChange={(event) => {
                  setStatusDraft(event.target.value);
                  setStatusError("");
                }}
                aria-label="Order status"
                style={{ maxWidth: 260 }}
              >
                {orderStatuses.map((status) => (
                  <option key={status} value={status}>
                    {formatStatus(status)}
                  </option>
                ))}
              </select>
              <Button loading={updating} onClick={requestUpdate} disabled={statusDraft === order.orderStatus}>
                Update status
              </Button>
            </div>
            {statusError ? <p className="field-error" role="alert">{statusError}</p> : null}
          </section>

          <DataTable caption="Manager order items" columns={columns} rows={order.items} rowKey={(item) => item.id} />

          <section className="surface surface-padded stack">
            <h2>Payment information</h2>
            <p>Selected method: <strong>{formatStatus(order.paymentMethod)}</strong></p>
            {order.payments.length ? (
              order.payments.map((payment) => (
                <div className="between" key={payment.id}>
                  <div>
                    <strong>{formatStatus(payment.status)}</strong>
                    <p className="muted">{formatDateTime(payment.paymentDate)}</p>
                  </div>
                  <span className="price">{formatCurrency(payment.amount)}</span>
                </div>
              ))
            ) : (
              <p className="muted">No payment records exist for this order.</p>
            )}
          </section>
        </div>

        <aside className="summary-card">
          <h2>Order total</h2>
          <div className="summary-line">
            <span>Items</span>
            <strong>{order.items.reduce((sum, item) => sum + item.quantity, 0)}</strong>
          </div>
          <div className="summary-line summary-total">
            <span>Total</span>
            <strong>{formatCurrency(order.totalAmount)}</strong>
          </div>
          <p className="muted">Payment info is read-only for managers in v1.</p>
        </aside>
      </div>

      <ConfirmDialog
        open={confirmOpen}
        title="Confirm status change"
        description={`Change this order to ${formatStatus(statusDraft)}?`}
        confirmLabel="Update status"
        danger={statusDraft === "cancelled"}
        loading={updating}
        onConfirm={updateStatus}
        onClose={() => setConfirmOpen(false)}
      />
    </section>
  );
}
